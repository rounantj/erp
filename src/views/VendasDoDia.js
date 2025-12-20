import { getSells } from "helpers/api-integrator";
import React, { useState, useEffect, useContext } from "react";
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
} from "@ant-design/icons";
import moment from "moment";
import { UserContext } from "context/UserContext";
import { getResumoVendas } from "helpers/caixa.adapter";
import { getCaixaEmAberto } from "helpers/caixa.adapter";
import { calcularTotal } from "./Vendas";
import { toMoneyFormat } from "helpers/formatters";
import { toDateFormat } from "helpers/formatters";
import { solicitaExclusaoVenda } from "helpers/api-integrator";
import {
  aprovaExclusaoVenda,
  rejeitaExclusaoVenda,
} from "helpers/api-integrator";
import SaleDetailsModal from "components/modalVenda";

const { Content } = Layout;
const { Text, Paragraph } = Typography;
const { TextArea } = Input;

// Estilos para mobile
const mobileStyles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    maxWidth: "100vw",
    overflow: "hidden",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    zIndex: 100,
  },
  header: {
    background: "transparent",
    padding: "16px",
    flexShrink: 0,
  },
  headerTitle: {
    color: "#fff",
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: "12px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
    marginTop: "12px",
  },
  summaryCard: {
    background: "rgba(255,255,255,0.15)",
    borderRadius: "12px",
    padding: "12px",
    backdropFilter: "blur(10px)",
  },
  summaryValue: {
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    display: "block",
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: "10px",
  },
  totalCard: {
    background: "rgba(255,255,255,0.25)",
    borderRadius: "12px",
    padding: "14px",
    marginTop: "8px",
    textAlign: "center",
  },
  totalValue: {
    color: "#fff",
    fontSize: "28px",
    fontWeight: "800",
    display: "block",
  },
  totalLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: "12px",
  },
  content: {
    flex: 1,
    background: "#f8f9fa",
    borderTopLeftRadius: "24px",
    borderTopRightRadius: "24px",
    padding: "16px",
    paddingBottom: "20px",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    maxWidth: "100vw",
    boxSizing: "border-box",
    minHeight: 0,
  },
  saleCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  saleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  },
  saleId: {
    fontSize: "12px",
    color: "#666",
  },
  saleTime: {
    fontSize: "11px",
    color: "#999",
  },
  saleTotal: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#667eea",
  },
  saleActions: {
    display: "flex",
    gap: "6px",
    marginTop: "8px",
  },
};

const requestVendaExclusion = async (vendaId, motivo) => {
  return await solicitaExclusaoVenda(vendaId, motivo);
};

const VendasDoDia = () => {
  // Estados necessários
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
      const formattedStart = moment().format("YYYY-MM-DD 00:00:00");
      const formattedEnd = moment().format("YYYY-MM-DD 23:59:59");
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
        setHoraAbertura(moment(cx.createdAt).format("DD/MM/YYYY HH:mm"));
        setValorAbertura(cx.saldoInicial || 0);
        await getResumoCaixa(cx.id);
        await getVendas();
      }
    } catch (error) {
      console.error("Erro ao verificar caixa:", error);
      notification.error({
        message: "Erro",
        description: "Não foi possível verificar o caixa: " + (error?.message || "Erro desconhecido"),
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
      return (
        <Tag icon={<ClockCircleOutlined />} color="warning" style={{ fontSize: "10px" }}>
          Aguardando
        </Tag>
      );
    } else if (venda.exclusionStatus === "approved") {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: "10px" }}>
          Aprovada
        </Tag>
      );
    } else if (venda.exclusionStatus === "rejected") {
      return (
        <Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: "10px" }}>
          Negada
        </Tag>
      );
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
            <Tag
              style={{ float: "right" }}
              color={
                record.metodoPagamento == "dinheiro" ? "success" : "default"
              }
            >
              {record?.metodoPagamento}
            </Tag>
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
                type="primary"
                icon={<EyeOutlined />}
                size="middle"
                onClick={() => openDetailsModal(record)}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
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
                <Button
                  icon={<DeleteOutlined />}
                  disabled
                  size="middle"
                />
              </Tooltip>
            );
            return buttons;
          }

          if (record.exclusionStatus === "approved") {
            buttons.push(
              <Tooltip title="Exclusão aprovada" key="approved">
                <Button
                  icon={<DeleteOutlined />}
                  disabled
                  size="middle"
                />
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

        return (
          <Space size="small">
            {renderActionButtons()}
          </Space>
        );
      },
    },
  ];

  // ========== RENDER MOBILE ==========
  if (isMobile) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#667eea",
            borderRadius: 12,
          },
        }}
      >
        <div style={mobileStyles.container}>
          {/* Header Mobile */}
          <div style={mobileStyles.header}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={mobileStyles.headerTitle}>
                  <CalendarOutlined style={{ marginRight: "8px" }} />
                  Resumo do Dia
                </h1>
                <Text style={mobileStyles.headerSubtitle}>
                  {moment().format("DD/MM/YYYY")} • {vendas.length} vendas
                </Text>
              </div>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => { caixaEmAberto(); getVendas(); }}
                loading={loading || loadingVendas}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: "10px",
                }}
              />
            </div>

            {/* Summary Cards */}
            {caixaAberto && (
              <>
                <div style={mobileStyles.summaryGrid}>
                  <div style={mobileStyles.summaryCard}>
                    <WalletOutlined style={{ color: "rgba(255,255,255,0.8)", marginBottom: "4px" }} />
                    <span style={mobileStyles.summaryValue}>
                      {formatCurrency(resumoVendas.dinheiro).replace("R$ ", "")}
                    </span>
                    <span style={mobileStyles.summaryLabel}>Dinheiro</span>
                  </div>
                  <div style={mobileStyles.summaryCard}>
                    <BankOutlined style={{ color: "rgba(255,255,255,0.8)", marginBottom: "4px" }} />
                    <span style={mobileStyles.summaryValue}>
                      {formatCurrency(resumoVendas.pix).replace("R$ ", "")}
                    </span>
                    <span style={mobileStyles.summaryLabel}>PIX</span>
                  </div>
                  <div style={mobileStyles.summaryCard}>
                    <CreditCardOutlined style={{ color: "rgba(255,255,255,0.8)", marginBottom: "4px" }} />
                    <span style={mobileStyles.summaryValue}>
                      {formatCurrency(resumoVendas.credito).replace("R$ ", "")}
                    </span>
                    <span style={mobileStyles.summaryLabel}>Crédito</span>
                  </div>
                  <div style={mobileStyles.summaryCard}>
                    <CreditCardOutlined style={{ color: "rgba(255,255,255,0.8)", marginBottom: "4px" }} />
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
            ) : vendas.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Nenhuma venda realizada hoje"
                style={{ marginTop: "40px" }}
              />
            ) : (
              <div style={{ 
                flex: 1, 
                overflow: "auto",
                minHeight: 0,
                WebkitOverflowScrolling: "touch",
              }}>
                {vendas.map((venda) => {
                  const total = calcularTotal(venda.total, venda.desconto);
                  return (
                    <div key={venda.id} style={mobileStyles.saleCard}>
                      <div style={mobileStyles.saleHeader}>
                        <div>
                          <Text style={mobileStyles.saleId}>
                            Venda #{venda.id}
                          </Text>
                          <Text style={{ ...mobileStyles.saleTime, display: "block" }}>
                            {moment(venda.createdAt).format("HH:mm")}
                          </Text>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <Text style={mobileStyles.saleTotal}>
                            {formatCurrency(total)}
                          </Text>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <Tag
                          color={getPaymentColor(venda.metodoPagamento)}
                          style={{ margin: 0, fontSize: "10px" }}
                        >
                          {venda.metodoPagamento?.toUpperCase()}
                        </Tag>
                        {renderExclusionStatus(venda)}
                      </div>

                      <div style={mobileStyles.saleActions}>
                        <Button
                          type="primary"
                          icon={<EyeOutlined />}
                          size="small"
                          onClick={() => openDetailsModal(venda)}
                          style={{
                            flex: 1,
                            backgroundColor: "#52c41a",
                            borderColor: "#52c41a",
                            borderRadius: "8px",
                          }}
                        >
                          Ver
                        </Button>

                        {venda.exclusionRequested && venda.exclusionStatus === "pending" && isAdmin ? (
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            size="small"
                            onClick={() => openReviewModal(venda)}
                            style={{ flex: 1, borderRadius: "8px" }}
                          >
                            Revisar
                          </Button>
                        ) : !venda.exclusionRequested || venda.exclusionStatus === "rejected" ? (
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
            title="Solicitar Exclusão"
            open={exclusionModalVisible}
            onCancel={() => setExclusionModalVisible(false)}
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
                Solicitar
              </Button>,
            ]}
            destroyOnClose
          >
            <Form form={exclusionForm} layout="vertical">
              {selectedVenda && (
                <div style={{ marginBottom: 16, background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
                  <Text strong>Venda #{selectedVenda.id}</Text>
                  <br />
                  <Text type="secondary">
                    {formatCurrency(calcularTotal(selectedVenda.total, selectedVenda.desconto))}
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
                <TextArea rows={3} placeholder="Descreva o motivo..." maxLength={500} showCount />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="Revisar Exclusão"
            open={reviewModalVisible}
            onCancel={() => setReviewModalVisible(false)}
            footer={null}
            destroyOnClose
          >
            <Form form={reviewForm} layout="vertical">
              {selectedVenda && (
                <div style={{ marginBottom: 16, background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
                  <Text strong>Venda #{selectedVenda.id}</Text>
                  <br />
                  <Text type="secondary">Motivo: {selectedVenda.exclusionReason}</Text>
                </div>
              )}
              <Form.Item name="observacoes" label="Observações">
                <TextArea rows={2} placeholder="Observações..." maxLength={500} />
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
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        {caixaAberto ? (
          <>
            <Content style={{ padding: "20px", background: "#f0f2f5" }}>
              <Row gutter={[16, 16]}>
                {resumoVendas.total > 0 && (
                  <Col span={24}>
                    <Card
                      title={
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <DollarOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                          <span>Resumo de Vendas do Dia</span>
                        </div>
                      }
                    >
                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={4}>
                          <Statistic
                            style={{ zoom: "90%" }}
                            title="Total em Dinheiro"
                            value={resumoVendas.dinheiro}
                            precision={2}
                            valueStyle={{ color: "#3f8600" }}
                            prefix="R$"
                          />
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                          <Statistic
                            style={{ zoom: "90%" }}
                            title="Total em PIX"
                            value={resumoVendas.pix}
                            precision={2}
                            valueStyle={{ color: "#1890ff" }}
                            prefix="R$"
                          />
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                          <Statistic
                            style={{ zoom: "90%" }}
                            title="Total em Crédito"
                            value={resumoVendas.credito}
                            precision={2}
                            valueStyle={{ color: "#722ed1" }}
                            prefix="R$"
                          />
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                          <Statistic
                            style={{ zoom: "90%" }}
                            title="Total em Débito"
                            value={resumoVendas.debito}
                            precision={2}
                            valueStyle={{ color: "#fa8c16" }}
                            prefix="R$"
                          />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Statistic
                            style={{ float: "right" }}
                            title="Total Geral"
                            value={resumoVendas.total}
                            precision={2}
                            valueStyle={{
                              color: "black",
                              fontWeight: "bold",
                              fontSize: "24px",
                            }}
                            prefix="R$"
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                )}
              </Row>
              <Row>
                <Col span={24}>
                  <Card
                    title={
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <DollarOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                        <span>Vendas do Dia</span>
                      </div>
                    }
                  >
                    <Table
                      columns={columnsVendas}
                      dataSource={vendas.map((venda) => ({
                        ...venda,
                        key: venda.id,
                      }))}
                      pagination={{ pageSize: 50 }}
                      bordered
                      loading={loadingVendas}
                      size="middle"
                      locale={{
                        emptyText: "Sem dados para o período selecionado",
                      }}
                    />
                  </Card>
                </Col>
              </Row>
            </Content>
          </>
        ) : (
          <Content
            style={{
              padding: "20px",
              background: "#f0f2f5",
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
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <ExclamationCircleOutlined
              style={{ color: "#ff4d4f", marginRight: 8 }}
            />
            <span>Solicitar Exclusão de Venda</span>
          </div>
        }
        open={exclusionModalVisible}
        onCancel={() => setExclusionModalVisible(false)}
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
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <ExclamationCircleOutlined
              style={{ color: "#1890ff", marginRight: 8 }}
            />
            <span>Revisar Solicitação de Exclusão</span>
          </div>
        }
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        destroyOnClose
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
  );
};

export default VendasDoDia;
