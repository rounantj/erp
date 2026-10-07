import { getSells } from "helpers/api-integrator";
import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Layout,
  Table,
  Typography,
  Card,
  Statistic,
  Row,
  Col,
  Divider,
  Space,
  Empty,
  Spin,
  notification,
  Button,
  Modal,
  Form,
  Input,
  Tag,
  Tooltip,
  Popconfirm,
  ConfigProvider,
} from "antd";
const { Search } = Input;
import {
  DollarOutlined,
  UserOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  WalletOutlined,
  BankOutlined,
  ReloadOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { UserContext } from "context/UserContext";
import { getResumoVendas } from "helpers/caixa.adapter";
import { getCaixaEmAberto } from "helpers/caixa.adapter";
import { calcularTotal } from "./Vendas";
import {
  toMoneyFormat,
  toDateFormat,
  toSaoPauloTime,
  nowSaoPaulo,
} from "helpers/formatters";
import { solicitaExclusaoVenda } from "helpers/api-integrator";
import {
  aprovaExclusaoVenda,
  rejeitaExclusaoVenda,
} from "helpers/api-integrator";
import SaleDetailsModal from "components/modalVenda";
import { useThemeColor, quietMobileStyles } from "helpers/theme";
import "./admin-ui.css";

const { Content } = Layout;
const { Text, Paragraph } = Typography;
const { TextArea } = Input;


const requestVendaExclusion = async (vendaId, motivo) => {
  return await solicitaExclusaoVenda(vendaId, motivo);
};

const VendasDoDia = () => {
  const { primary, theme, pageStyle } = useThemeColor();
  const mobileStyles = useMemo(() => quietMobileStyles(primary), [primary]);
  const [vendas, setVendas] = useState([]);
  const { user } = useContext(UserContext);
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [caixa, setCaixa] = useState();
  const [horaAbertura, setHoraAbertura] = useState(null);
  const [valorAbertura, setValorAbertura] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [resumoVendas, setResumoVendas] = useState({
    dinheiro: 0,
    pix: 0,
    credito: 0,
    debito: 0,
    total: 0,
    totalVendas: 0,
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Estados para a exclusão
  const [exclusionModalVisible, setExclusionModalVisible] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState(null);
  const [exclusionLoading, setExclusionLoading] = useState(false);
  const [exclusionForm] = Form.useForm();

  // Estados para o modal de detalhes da venda
  const [showModalVenda, setShowModalVenda] = useState(false);

  // 2. Adicione estados para o modal de revisão
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewForm] = Form.useForm();

  // Estado para busca/filtro mobile
  const [searchFilter, setSearchFilter] = useState("");

  // 3. Função para abrir o modal de revisão
  const openReviewModal = (venda) => {
    setSelectedVenda(venda);
    setReviewModalVisible(true);
    reviewForm.resetFields();
  };

  // Função para abrir o modal de detalhes
  const openDetailsModal = (venda) => {
    setSelectedVenda(venda);
    setShowModalVenda(true);
  };

  // 4. Função para aprovar solicitação
  const handleApproveExclusion = async () => {
    try {
      setReviewLoading(true);
      const observacoes = reviewForm.getFieldValue("observacoes") || "";

      const response = await aprovaExclusaoVenda(
        selectedVenda.id,
        observacoes,
        user.user.id
      );

      if (response.success) {
        notification.success({
          message: "Exclusão aprovada",
          description: "A venda será removida do sistema.",
        });

        setVendas((prev) =>
          prev.map((v) =>
            v.id === selectedVenda.id
              ? {
                  ...v,
                  exclusionStatus: "approved",
                  exclusionReviewedAt: new Date(),
                  exclusionReviewNotes: observacoes,
                }
              : v
          )
        );

        setReviewModalVisible(false);
        await getVendas();
      }
    } catch (error) {
      notification.error({
        message: "Erro",
        description: error.message || "Falha ao aprovar exclusão",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  // 5. Função para rejeitar solicitação
  const handleRejectExclusion = async () => {
    try {
      await reviewForm.validateFields();
      const values = reviewForm.getFieldsValue();

      setReviewLoading(true);

      const response = await rejeitaExclusaoVenda(
        selectedVenda.id,
        values.observacoes,
        user.user.id
      );

      if (response.success) {
        notification.success({
          message: "Exclusão rejeitada",
          description: "A solicitação de exclusão foi rejeitada.",
        });

        setVendas((prev) =>
          prev.map((v) =>
            v.id === selectedVenda.id
              ? {
                  ...v,
                  exclusionStatus: "rejected",
                  exclusionReviewedAt: new Date(),
                  exclusionReviewNotes: values.observacoes,
                }
              : v
          )
        );

        setReviewModalVisible(false);
      }
    } catch (error) {
      notification.error({
        message: "Erro",
        description: error.message || "Falha ao rejeitar exclusão",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  // Monitora o tamanho da tela para responsividade
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Buscar vendas do dia atual
  const getVendas = async () => {
    try {
      setLoadingVendas(true);
      const formattedStart = nowSaoPaulo().format("YYYY-MM-DD 00:00:00");
      const formattedEnd = nowSaoPaulo().format("YYYY-MM-DD 23:59:59");
      const items = await getSells(formattedStart, formattedEnd);

      if (items.success) {
        const vendas = items.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setVendas(vendas);
      }
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    } finally {
      setLoadingVendas(false);
    }
  };

  // Buscar resumo do caixa
  const getResumoCaixa = async (caixaID) => {
    try {
      setLoading(true);
      const result = await getResumoVendas(caixaID);
      if (result.data) {
        setResumoVendas(result.data);
      } else {
        notification.error({
          message: "Erro",
          description: "Problema ao buscar resumo de vendas!",
        });
      }
    } catch (error) {
      notification.error({
        message: "Erro",
        description:
          "Não foi possível obter o resumo do caixa: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar se existe caixa aberto
  const caixaEmAberto = async () => {
    try {
      setLoading(true);
      const resultCx = await getCaixaEmAberto();

      if (!resultCx || !resultCx.data) {
        notification.warning({
          message: "Atenção!",
          description: "Abra um caixa para começar a vender.",
        });
        return;
      }

      const caixas = Array.isArray(resultCx.data) ? resultCx.data : [];

      if (caixas.length === 0) {
        notification.warning({
          message: "Atenção!",
          description: "Abra um caixa para começar a vender.",
        });
        return;
      }

      if (caixas.length > 1) {
        notification.warning({
          message: "Atenção!",
          description: "Existe um caixa aberto de um dia anterior.",
        });
      }

      const cx = caixas[caixas.length - 1];
      if (cx) {
        setCaixa(cx);
        setCaixaAberto(true);
        setHoraAbertura(
          toSaoPauloTime(cx.createdAt).format("DD/MM/YYYY HH:mm")
        );
        setValorAbertura(cx.saldoInicial || 0);
        await getResumoCaixa(cx.id);
        await getVendas();
      }
    } catch (error) {
      console.error("Erro ao verificar caixa:", error);
      notification.error({
        message: "Erro",
        description:
          "Não foi possível verificar o caixa: " +
          (error?.message || "Erro desconhecido"),
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    caixaEmAberto();
    getVendas();
  }, []);

  // Abrir modal de solicitação de exclusão
  const openExclusionModal = (venda) => {
    setSelectedVenda(venda);
    setExclusionModalVisible(true);
    exclusionForm.resetFields();
  };

  // Função para solicitar exclusão
  const handleExclusionRequest = async () => {
    try {
      await exclusionForm.validateFields();
      const values = exclusionForm.getFieldsValue();

      setExclusionLoading(true);

      const response = await requestVendaExclusion(
        selectedVenda.id,
        values.motivo
      );

      if (response.success) {
        notification.success({
          message: "Solicitação enviada",
          description:
            "Sua solicitação de exclusão foi enviada para aprovação.",
        });

        setVendas((prev) =>
          prev.map((v) =>
            v.id === selectedVenda.id
              ? {
                  ...v,
                  exclusionRequested: true,
                  exclusionStatus: "pending",
                  exclusionRequestedAt: new Date(),
                  exclusionReason: values.motivo,
                }
              : v
          )
        );

        setExclusionModalVisible(false);
      }
    } catch (error) {
      notification.error({
        message: "Erro",
        description: error.message || "Falha ao solicitar exclusão",
      });
    } finally {
      setExclusionLoading(false);
    }
  };

  // Renderizar tags de status de exclusão
  const renderExclusionStatus = (venda) => {
    if (!venda.exclusionRequested) return null;

    if (venda.exclusionStatus === "pending") {
      return <span className="qui-status qui-status--warn">Aguardando</span>;
    }
    if (venda.exclusionStatus === "approved") {
      return <span className="qui-status qui-status--ok">Aprovada</span>;
    }
    if (venda.exclusionStatus === "rejected") {
      return <span className="qui-status qui-status--danger">Negada</span>;
    }
    return null;
  };

  // Formatar moeda
  const formatCurrency = (value) => {
    return `R$ ${(parseFloat(value) || 0).toFixed(2).replace(".", ",")}`;
  };

  // Obter cor do método de pagamento
  const getPaymentColor = (method) => {
    const colors = {
      dinheiro: "#52c41a",
      pix: "#1890ff",
      credito: "#722ed1",
      debito: "#fa8c16",
    };
    return colors[method] || "#666";
  };

  // Verificar se é admin
  const isAdmin = user?.user?.role === "admin";

  // Filtrar vendas para mobile
  const filteredVendas = vendas.filter((venda) => {
    if (!searchFilter) return true;
    const searchLower = searchFilter.toLowerCase();
    return (
      venda.id.toString().includes(searchFilter) ||
      (venda.nome_cliente &&
        venda.nome_cliente.toLowerCase().includes(searchLower)) ||
      (venda.metodoPagamento &&
        venda.metodoPagamento.toLowerCase().includes(searchLower)) ||
      calcularTotal(venda.total, venda.desconto)
        .toFixed(2)
        .includes(searchFilter)
    );
  });

  // Configuração de colunas para tabela de vendas (Desktop)
  const columnsVendas = [
    {
      title: "Número",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
      responsive: ["sm"],
    },
    {
      title: "Data",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => toDateFormat(text, !isMobile),
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
      responsive: ["md"],
    },
    {
      title: "Total",
      key: "totalComDesconto",
      render: (_, record) => {
        const total = calcularTotal(record.total, record.desconto);
        return (
          <>
            <Text strong>{toMoneyFormat(total)}</Text>
            <span
              className="qui-status qui-status--muted"
              style={{ float: "right" }}
            >
              {record?.metodoPagamento}
            </span>
          </>
        );
      },
      sorter: (a, b) =>
        calcularTotal(a.total, a.desconto) - calcularTotal(b.total, b.desconto),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => renderExclusionStatus(record),
    },
    {
      title: "Ações",
      key: "actions",
      width: 180,
      render: (_, record) => {
        const renderActionButtons = () => {
          const buttons = [];

          buttons.push(
            <Tooltip title="Ver detalhes da venda" key="details">
              <Button
                className="qui-icon-btn"
                icon={<EyeOutlined />}
                size="middle"
                onClick={() => openDetailsModal(record)}
              />
            </Tooltip>
          );

          if (
            record.exclusionRequested &&
            record.exclusionStatus === "pending" &&
            isAdmin
          ) {
            buttons.push(
              <Tooltip title="Revisar solicitação" key="review">
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  size="middle"
                  onClick={() => openReviewModal(record)}
                />
              </Tooltip>
            );
            return buttons;
          }

          if (
            record.exclusionRequested &&
            record.exclusionStatus === "pending"
          ) {
            buttons.push(
              <Tooltip title="Solicitação de exclusão pendente" key="pending">
                <Button icon={<DeleteOutlined />} disabled size="middle" />
              </Tooltip>
            );
            return buttons;
          }

          if (record.exclusionStatus === "approved") {
            buttons.push(
              <Tooltip title="Exclusão aprovada" key="approved">
                <Button icon={<DeleteOutlined />} disabled size="middle" />
              </Tooltip>
            );
            return buttons;
          }

          if (
            !record.exclusionRequested ||
            record.exclusionStatus === "rejected"
          ) {
            buttons.push(
              <Tooltip title="Solicitar exclusão" key="delete">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => openExclusionModal(record)}
                  size="middle"
                />
              </Tooltip>
            );
          }

          return buttons;
        };

        return <Space size="small">{renderActionButtons()}</Space>;
      },
    },
  ];

  // ========== RENDER MOBILE ==========
  if (isMobile) {
    return (
      <ConfigProvider theme={theme}>
        <div className="qui-page" style={{ ...mobileStyles.container, ...pageStyle }}>
          {/* Header Mobile */}
          <div style={mobileStyles.header}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                {/* Botão Menu */}
                <div
                  onClick={() => {
                    const isOpen =
                      document.documentElement.classList.contains("nav-open");
                    if (isOpen) {
                      document.documentElement.classList.remove("nav-open");
                      const existingBodyClick =
                        document.getElementById("bodyClick");
                      if (existingBodyClick)
                        existingBodyClick.parentElement.removeChild(
                          existingBodyClick
                        );
                    } else {
                      document.documentElement.classList.add("nav-open");
                      const existingBodyClick =
                        document.getElementById("bodyClick");
                      if (existingBodyClick)
                        existingBodyClick.parentElement.removeChild(
                          existingBodyClick
                        );
                      var node = document.createElement("div");
                      node.id = "bodyClick";
                      node.style.cssText =
                        "position:fixed;top:0;left:0;right:250px;bottom:0;z-index:9999;";
                      node.onclick = function () {
                        this.parentElement.removeChild(this);
                        document.documentElement.classList.remove("nav-open");
                      };
                      document.body.appendChild(node);
                    }
                  }}
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    borderRadius: "8px",
                    padding: "8px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MenuOutlined style={{ color: "#fff", fontSize: "18px" }} />
                </div>
                <div>
                  <h1 style={mobileStyles.headerTitle}>Resumo do dia</h1>
                  <Text style={mobileStyles.headerSubtitle}>
                    {nowSaoPaulo().format("DD/MM/YYYY")} • {vendas.length}{" "}
                    vendas
                  </Text>
                </div>
              </div>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => {
                  caixaEmAberto();
                  getVendas();
                }}
                loading={loading || loadingVendas}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "none",
                  borderRadius: "8px",
                }}
              />
            </div>

            {/* Summary Cards */}
            {caixaAberto && (
              <>
                <div style={mobileStyles.summaryGrid}>
                  <div style={mobileStyles.summaryCard}>
                    <WalletOutlined
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        marginBottom: "4px",
                      }}
                    />
                    <span style={mobileStyles.summaryValue}>
                      {formatCurrency(resumoVendas.dinheiro).replace("R$ ", "")}
                    </span>
                    <span style={mobileStyles.summaryLabel}>Dinheiro</span>
                  </div>
                  <div style={mobileStyles.summaryCard}>
                    <BankOutlined
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        marginBottom: "4px",
                      }}
                    />
                    <span style={mobileStyles.summaryValue}>
                      {formatCurrency(resumoVendas.pix).replace("R$ ", "")}
                    </span>
                    <span style={mobileStyles.summaryLabel}>PIX</span>
                  </div>
                  <div style={mobileStyles.summaryCard}>
                    <CreditCardOutlined
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        marginBottom: "4px",
                      }}
                    />
                    <span style={mobileStyles.summaryValue}>
                      {formatCurrency(resumoVendas.credito).replace("R$ ", "")}
                    </span>
                    <span style={mobileStyles.summaryLabel}>Crédito</span>
                  </div>
                  <div style={mobileStyles.summaryCard}>
                    <CreditCardOutlined
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        marginBottom: "4px",
                      }}
                    />
                    <span style={mobileStyles.summaryValue}>
                      {formatCurrency(resumoVendas.debito).replace("R$ ", "")}
                    </span>
                    <span style={mobileStyles.summaryLabel}>Débito</span>
                  </div>
                </div>

                {/* Total Card */}
                <div style={mobileStyles.totalCard}>
                  <span style={mobileStyles.totalLabel}>TOTAL DO DIA</span>
                  <span style={mobileStyles.totalValue}>
                    {formatCurrency(resumoVendas.total)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Content Area */}
          <div style={mobileStyles.content}>
            {/* Barra de Busca Mobile */}
            {caixaAberto && vendas.length > 0 && (
              <div style={{ marginBottom: "12px", flexShrink: 0 }}>
                <Search
                  placeholder="Buscar por ID, cliente, valor..."
                  allowClear
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{ width: "100%" }}
                  size="middle"
                />
                {searchFilter && (
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "11px",
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    {filteredVendas.length} de {vendas.length} vendas
                  </Text>
                )}
              </div>
            )}

            {!caixaAberto ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <Empty
                  description="Abra o caixa para visualizar as vendas"
                  style={{ margin: "40px 0" }}
                />
              </div>
            ) : loadingVendas ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
                <div style={{ marginTop: "12px" }}>
                  <Text type="secondary">Carregando vendas...</Text>
                </div>
              </div>
            ) : filteredVendas.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  searchFilter
                    ? "Nenhuma venda encontrada"
                    : "Nenhuma venda realizada hoje"
                }
                style={{ marginTop: "40px" }}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  overflow: "auto",
                  minHeight: 0,
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {filteredVendas.map((venda) => {
                  const total = calcularTotal(venda.total, venda.desconto);
                  return (
                    <div key={venda.id} style={mobileStyles.saleCard}>
                      <div style={mobileStyles.saleHeader}>
                        <div>
                          <Text style={mobileStyles.saleId}>
                            Venda #{venda.id}
                          </Text>
                          <Text
                            style={{
                              ...mobileStyles.saleTime,
                              display: "block",
                            }}
                          >
                            {toSaoPauloTime(venda.createdAt).format("HH:mm")}
                          </Text>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <Text style={mobileStyles.saleTotal}>
                            {formatCurrency(total)}
                          </Text>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span className="qui-status qui-status--muted">
                          {venda.metodoPagamento}
                        </span>
                        {renderExclusionStatus(venda)}
                      </div>

                      <div style={mobileStyles.saleActions}>
                        <Button
                          type="primary"
                          icon={<EyeOutlined />}
                          size="small"
                          onClick={() => openDetailsModal(venda)}
                          style={{ flex: 1, borderRadius: "8px" }}
                        >
                          Ver
                        </Button>

                        {venda.exclusionRequested &&
                        venda.exclusionStatus === "pending" &&
                        isAdmin ? (
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            size="small"
                            onClick={() => openReviewModal(venda)}
                            style={{ flex: 1, borderRadius: "8px" }}
                          >
                            Revisar
                          </Button>
                        ) : !venda.exclusionRequested ||
                          venda.exclusionStatus === "rejected" ? (
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={() => openExclusionModal(venda)}
                            style={{ flex: 1, borderRadius: "8px" }}
                          >
                            Excluir
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modais */}
          <Modal
            title="Solicitar exclusão"
            open={exclusionModalVisible}
            onCancel={() => setExclusionModalVisible(false)}
            wrapClassName="qui-sheet"
            classNames={{ mask: "qui-dialog-mask" }}
            width="100%"
            centered={false}
            footer={[
              <Button
                key="cancel"
                onClick={() => setExclusionModalVisible(false)}
              >
                Cancelar
              </Button>,
              <Button
                key="submit"
                type="primary"
                danger
                loading={exclusionLoading}
                onClick={handleExclusionRequest}
              >
                Solicitar
              </Button>,
            ]}
            destroyOnClose
          >
            <Form form={exclusionForm} layout="vertical">
              {selectedVenda && (
                <div
                  style={{
                    marginBottom: 16,
                    background: "#f5f5f5",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text strong>Venda #{selectedVenda.id}</Text>
                  <br />
                  <Text type="secondary">
                    {formatCurrency(
                      calcularTotal(selectedVenda.total, selectedVenda.desconto)
                    )}
                  </Text>
                </div>
              )}
              <Form.Item
                name="motivo"
                label="Motivo da Exclusão"
                rules={[
                  { required: true, message: "Informe o motivo" },
                  { min: 10, message: "Mínimo 10 caracteres" },
                ]}
              >
                <TextArea
                  rows={3}
                  placeholder="Descreva o motivo..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="Revisar exclusão"
            open={reviewModalVisible}
            onCancel={() => setReviewModalVisible(false)}
            footer={null}
            destroyOnClose
            wrapClassName="qui-sheet"
            classNames={{ mask: "qui-dialog-mask" }}
            width="100%"
            centered={false}
          >
            <Form form={reviewForm} layout="vertical">
              {selectedVenda && (
                <div
                  style={{
                    marginBottom: 16,
                    background: "#f5f5f5",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text strong>Venda #{selectedVenda.id}</Text>
                  <br />
                  <Text type="secondary">
                    Motivo: {selectedVenda.exclusionReason}
                  </Text>
                </div>
              )}
              <Form.Item name="observacoes" label="Observações">
                <TextArea
                  rows={2}
                  placeholder="Observações..."
                  maxLength={500}
                />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Button
                    danger
                    block
                    loading={reviewLoading}
                    onClick={handleRejectExclusion}
                  >
                    Rejeitar
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type="primary"
                    block
                    loading={reviewLoading}
                    onClick={handleApproveExclusion}
                  >
                    Aprovar
                  </Button>
                </Col>
              </Row>
            </Form>
          </Modal>

          <SaleDetailsModal
            visible={showModalVenda}
            onClose={setShowModalVenda}
            saleData={selectedVenda}
          />
        </div>
      </ConfigProvider>
    );
  }

  // ========== RENDER DESKTOP ==========
  return (
    <ConfigProvider theme={theme}>
    <Layout className="qui-page" style={{ minHeight: "auto", ...pageStyle }}>
      <Layout>
        {caixaAberto ? (
          <>
            <Content style={{ padding: 0, background: "transparent" }}>
              <div className="qui-header">
                <div>
                  <h1>Resumo do dia</h1>
                  <p>{nowSaoPaulo().format("DD/MM/YYYY")}</p>
                </div>
              </div>
              <Row gutter={[16, 16]}>
                {resumoVendas.total > 0 && (
                  <Col span={24}>
                    <div className="qui-stats">
                      <div className="qui-stat">
                        <small>Dinheiro</small>
                        <b>{formatCurrency(resumoVendas.dinheiro)}</b>
                      </div>
                      <div className="qui-stat">
                        <small>PIX</small>
                        <b>{formatCurrency(resumoVendas.pix)}</b>
                      </div>
                      <div className="qui-stat">
                        <small>Crédito</small>
                        <b>{formatCurrency(resumoVendas.credito)}</b>
                      </div>
                      <div className="qui-stat">
                        <small>Débito</small>
                        <b>{formatCurrency(resumoVendas.debito)}</b>
                      </div>
                    </div>
                    <div className="qui-stat" style={{ marginBottom: 16 }}>
                      <small>Total do dia</small>
                      <b className="is-theme">{formatCurrency(resumoVendas.total)}</b>
                    </div>
                  </Col>
                )}
              </Row>
              <div className="qui-panel">
                <Table
                  columns={columnsVendas}
                  dataSource={vendas.map((venda) => ({
                    ...venda,
                    key: venda.id,
                  }))}
                  pagination={{ pageSize: 50 }}
                  loading={loadingVendas}
                  size="middle"
                  locale={{
                    emptyText: "Sem dados para o período selecionado",
                  }}
                />
              </div>
            </Content>
          </>
        ) : (
          <Content
            style={{
              padding: "48px 0",
              background: "transparent",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Spin spinning={loading}>
              <Empty
                description="Abra o caixa para visualizar as vendas do dia"
                style={{ margin: "40px 0" }}
              />
            </Spin>
          </Content>
        )}
      </Layout>

      {/* Modal de Solicitação de Exclusão - Desktop */}
      <Modal
        title="Solicitar exclusão"
        open={exclusionModalVisible}
        onCancel={() => setExclusionModalVisible(false)}
        wrapClassName="qui-dialog"
        classNames={{ mask: "qui-dialog-mask" }}
        centered
        footer={[
          <Button key="cancel" onClick={() => setExclusionModalVisible(false)}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={exclusionLoading}
            onClick={handleExclusionRequest}
          >
            Solicitar Exclusão
          </Button>,
        ]}
        destroyOnClose
      >
        <Form form={exclusionForm} layout="vertical" requiredMark="optional">
          {selectedVenda && (
            <div style={{ marginBottom: 16 }}>
              <Paragraph>
                <Text strong>Venda ID:</Text> {selectedVenda.id}
              </Paragraph>
              <Paragraph>
                <Text strong>Cliente:</Text> {selectedVenda.nome_cliente}
              </Paragraph>
              <Paragraph>
                <Text strong>Valor:</Text>{" "}
                {toMoneyFormat(
                  calcularTotal(selectedVenda.total, selectedVenda.desconto)
                )}
              </Paragraph>
              <Paragraph>
                <Text strong>Data:</Text>{" "}
                {toDateFormat(selectedVenda.createdAt, true)}
              </Paragraph>
            </div>
          )}

          <Paragraph type="secondary">
            A solicitação de exclusão será enviada para aprovação do
            administrador. Por favor, informe detalhadamente o motivo da
            exclusão.
          </Paragraph>

          <Form.Item
            name="motivo"
            label="Motivo da Exclusão"
            rules={[
              {
                required: true,
                message: "Por favor, informe o motivo da exclusão",
              },
              { min: 10, message: "O motivo deve ter no mínimo 10 caracteres" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Descreva o motivo da exclusão..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de Revisão de Exclusão - Desktop */}
      <Modal
        title="Revisar exclusão"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        destroyOnClose
        wrapClassName="qui-dialog"
        classNames={{ mask: "qui-dialog-mask" }}
        centered
      >
        <Form form={reviewForm} layout="vertical" requiredMark="optional">
          {selectedVenda && (
            <div style={{ marginBottom: 16 }}>
              <Paragraph>
                <Text strong>Venda ID:</Text> {selectedVenda.id}
              </Paragraph>
              <Paragraph>
                <Text strong>Cliente:</Text> {selectedVenda.nome_cliente}
              </Paragraph>
              <Paragraph>
                <Text strong>Valor:</Text>{" "}
                {toMoneyFormat(
                  calcularTotal(selectedVenda.total, selectedVenda.desconto)
                )}
              </Paragraph>
              <Paragraph>
                <Text strong>Data:</Text>{" "}
                {toDateFormat(selectedVenda.createdAt, true)}
              </Paragraph>
              <Paragraph>
                <Text strong>Motivo da solicitação:</Text>{" "}
                {selectedVenda.exclusionReason}
              </Paragraph>
              <Paragraph>
                <Text strong>Solicitado por:</Text>{" "}
                {selectedVenda.exclusionRequestedByUser?.name || "Usuário"}
              </Paragraph>
              <Paragraph>
                <Text strong>Data da solicitação:</Text>{" "}
                {selectedVenda.exclusionRequestedAt
                  ? toDateFormat(selectedVenda.exclusionRequestedAt, true)
                  : "Não disponível"}
              </Paragraph>
            </div>
          )}

          <Divider />

          <Form.Item
            name="observacoes"
            label="Observações (opcional para aprovação, obrigatório para rejeição)"
            rules={[
              {
                required: false,
                message: "Por favor, informe o motivo da rejeição",
              },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Adicione observações ou motivo da rejeição..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Row gutter={16} justify="end">
            <Col>
              <Button onClick={() => setReviewModalVisible(false)}>
                Cancelar
              </Button>
            </Col>
            <Col>
              <Popconfirm
                title="Rejeitar solicitação"
                description="Tem certeza que deseja rejeitar esta solicitação?"
                onConfirm={handleRejectExclusion}
                okText="Sim"
                cancelText="Não"
                okButtonProps={{ danger: true }}
              >
                <Button danger loading={reviewLoading}>
                  Rejeitar
                </Button>
              </Popconfirm>
            </Col>
            <Col>
              <Popconfirm
                title="Aprovar exclusão"
                description="Tem certeza que deseja aprovar a exclusão desta venda?"
                onConfirm={handleApproveExclusion}
                okText="Sim"
                cancelText="Não"
              >
                <Button type="primary" loading={reviewLoading}>
                  Aprovar
                </Button>
              </Popconfirm>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal de Detalhes da Venda */}
      <SaleDetailsModal
        visible={showModalVenda}
        onClose={setShowModalVenda}
        saleData={selectedVenda}
      />
    </Layout>
    </ConfigProvider>
  );
};

export default VendasDoDia;
