import { getSells } from "helpers/api-integrator";
import {
  toDateFormat,
  toMoneyFormat,
  toSaoPauloTime,
  nowSaoPaulo,
} from "helpers/formatters";
import React, { useEffect, useState, useRef, useContext, useMemo } from "react";
import * as XLSX from "xlsx";
import ptBR from "antd/lib/locale/pt_BR";
import moment from "moment";
import "moment/locale/pt-br";
import {
  Table,
  DatePicker,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  ConfigProvider,
  Layout,
  Divider,
  notification,
  Space,
  Tag,
  Empty,
  Spin,
  Button,
  Drawer,
  Tooltip,
  Form,
  Modal,
  Popconfirm,
  Input,
} from "antd";
import {
  BarChartOutlined,
  CalendarOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  FilterOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { UserContext } from "context/UserContext";
import Paragraph from "antd/lib/typography/Paragraph";
import TextArea from "antd/lib/input/TextArea";
import { aprovaExclusaoVenda } from "helpers/api-integrator";
import SaleDetailsModal from "components/modalVenda";
import { useThemeColor, quietMobileStyles } from "helpers/theme";
import "./admin-ui.css";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Content } = Layout;
const { Search } = Input;

// Função para calcular o total da venda com desconto
export const calcularTotal = (valor, desconto) => {
  return +valor - +desconto;
};

// Função para calcular o total de uma lista de itens (usado no Checkout)
export const calcularTotalItens = (itens) => {
  if (!Array.isArray(itens)) return 0;

  return itens.reduce((total, item) => {
    const valor =
      parseFloat(
        item.valorEditado !== undefined ? item.valorEditado : item.valor
      ) || 0;
    const quantidade = parseInt(item.qtd) || 0;
    return total + valor * quantidade;
  }, 0);
};

function Vendas() {
  const { primary, theme, pageStyle } = useThemeColor();
  const mobileStyles = useMemo(() => quietMobileStyles(primary), [primary]);
  const { user } = useContext(UserContext);
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(moment().subtract(1, "month"));
  const [endDate, setEndDate] = useState(moment().add(10, "day"));
  const [isMobile, setIsMobile] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);

  // Estados para a exclusão
  const [exclusionModalVisible, setExclusionModalVisible] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState(null);
  const [exclusionReason, setExclusionReason] = useState("");
  const [exclusionLoading, setExclusionLoading] = useState(false);
  const [exclusionForm] = Form.useForm();

  // Estado para busca/filtro mobile
  const [searchFilter, setSearchFilter] = useState("");

  // 2. Adicione estados para o modal de revisão
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewForm] = Form.useForm();
  const [showModalVenda, setShowModalVenda] = useState(false);

  useEffect(() => {
    console.log({ selectedVenda, user, showModalVenda });
  }, [user, selectedVenda, showModalVenda]);
  // 1. Importe as funções da API

  // 3. Função para abrir o modal de revisão
  const openReviewModal = (venda) => {
    setSelectedVenda(venda);
    setReviewModalVisible(true);
    reviewForm.resetFields();
  };

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

        // Atualizar a venda na lista local
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
        // Recarregar a lista de vendas
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

        // Atualizar a venda na lista local
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

  // Renderizar tags de status de exclusão
  const renderExclusionStatus = (venda) => {
    console.log({ venda });
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

  const exportToExcel = () => {
    // Verifica se há dados para exportar
    if (vendas.length === 0) {
      notification.warning({
        message: "Sem dados para exportar",
        description: "Não há vendas no período selecionado para exportar.",
      });
      return;
    }

    // Preparar os dados para exportação
    const dataToExport = vendas.map((venda) => {
      // Calcular o total com desconto
      const totalComDesconto = calcularTotal(venda.total, venda.desconto);

      // Formatar a data (horário de São Paulo)
      const dataFormatada = toSaoPauloTime(venda.createdAt).format(
        "DD/MM/YYYY HH:mm"
      );

      // Status de exclusão
      let statusExclusao = "Normal";
      if (venda.exclusionRequested) {
        if (venda.exclusionStatus === "pending") {
          statusExclusao = "Aguardando aprovação";
        } else if (venda.exclusionStatus === "approved") {
          statusExclusao = "Exclusão aprovada";
        } else if (venda.exclusionStatus === "rejected") {
          statusExclusao = "Exclusão negada";
        }
      }

      // Retornar o objeto formatado para a planilha
      return {
        ID: venda.id,
        Data: dataFormatada,
        Cliente: venda.nome_cliente || "",
        "Valor Total": venda.total,
        Desconto: venda.desconto,
        "Total com Desconto": totalComDesconto,
        "Método de Pagamento": venda.metodoPagamento || "",
        Status: statusExclusao,
      };
    });

    // Criar a planilha
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Ajustar a largura das colunas
    const columnWidths = [
      { wch: 8 }, // ID
      { wch: 20 }, // Data
      { wch: 30 }, // Cliente
      { wch: 15 }, // Valor Total
      { wch: 15 }, // Desconto
      { wch: 20 }, // Total com Desconto
      { wch: 20 }, // Método de Pagamento
      { wch: 20 }, // Status
    ];
    worksheet["!cols"] = columnWidths;

    // Criar o workbook e adicionar a planilha
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendas");

    // Gerar o nome do arquivo com a data atual
    const fileName = `vendas_${moment().format("YYYY-MM-DD_HH-mm")}.xlsx`;

    // Exportar o arquivo
    XLSX.writeFile(workbook, fileName);

    // Notificar o usuário
    notification.success({
      message: "Exportação concluída",
      description: `Os dados foram exportados para o arquivo "${fileName}"`,
    });
  };

  // Abrir modal de solicitação de exclusão
  const openExclusionModal = (venda) => {
    setSelectedVenda(venda);
    setExclusionModalVisible(true);
    exclusionForm.resetFields();
  };

  const columnsVendas = [
    {
      title: "Número",
      dataIndex: "id",
      key: "id",
      // render: (text) => toDateFormat(text, !isMobile),
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
      title: "Data",
      dataIndex: "createdAt",
      key: "createdAtMobile",
      render: (text) => toDateFormat(text, false),
      responsive: ["xs", "sm"],
    },
    {
      title: "Ações",
      key: "actions",
      width: 180, // Aumentei a largura para acomodar mais botões
      render: (_, record) => {
        const isAdmin = user?.user?.role === "admin";

        // Função auxiliar para renderizar botões baseado no estado
        const renderActionButtons = () => {
          const buttons = [];

          // Sempre incluir botão Ver Detalhes
          buttons.push(
            <Tooltip title="Ver detalhes da venda" key="details">
              <Button
                type="primary"
                icon={<EyeOutlined />}
                size={isMobile ? "small" : "middle"}
                onClick={() => openDetailsModal(record)}
                className="qui-icon-btn"
              />
            </Tooltip>
          );

          // Se solicitação pendente e o usuário é admin
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
                  size={isMobile ? "small" : "middle"}
                  onClick={() => openReviewModal(record)}
                />
              </Tooltip>
            );
            return buttons;
          }

          // Não mostrar botão de exclusão se já houver solicitação pendente
          if (
            record.exclusionRequested &&
            record.exclusionStatus === "pending"
          ) {
            buttons.push(
              <Tooltip title="Solicitação de exclusão pendente" key="pending">
                <Button
                  icon={<DeleteOutlined />}
                  disabled
                  size={isMobile ? "small" : "middle"}
                />
              </Tooltip>
            );
            return buttons;
          }

          // Não mostrar botão se a exclusão já foi aprovada
          if (record.exclusionStatus === "approved") {
            buttons.push(
              <Tooltip title="Exclusão aprovada" key="approved">
                <Button
                  icon={<DeleteOutlined />}
                  disabled
                  size={isMobile ? "small" : "middle"}
                />
              </Tooltip>
            );
            return buttons;
          }

          // Só mostrar o botão de solicitar exclusão se não houver solicitação ou a anterior foi rejeitada
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
                  size={isMobile ? "small" : "middle"}
                />
              </Tooltip>
            );
          }

          return buttons;
        };

        const actionButtons = renderActionButtons();

        return (
          <Space size="small" wrap={isMobile}>
            {actionButtons}
          </Space>
        );
      },
    },
  ];

  // Referência para o container principal
  const containerRef = useRef(null);

  // Verificar se é mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificar no carregamento inicial
    checkIfMobile();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Filtrar vendas por período
  const filtrarVendas = () => {
    return vendas;
  };

  // Calcular totais por dia
  const calcularTotaisPorDia = () => {
    const totaisPorDia = vendas.reduce((acc, venda) => {
      const data = moment(venda.createdAt).format("YYYY-MM-DD");
      acc[data] = (acc[data] || 0) + calcularTotal(venda.total, venda.desconto);
      return acc;
    }, {});
    return totaisPorDia;
  };

  // Função para alterar as datas
  const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
      setStartDate(dates[0]);
      setEndDate(dates[1]);
      if (isMobile) {
        setFilterDrawerVisible(false);
      }
    }
  };

  // Calcular total por período
  const calcularTotalPorPeriodo = () => {
    const filteredVendas = filtrarVendas();
    const total = filteredVendas.reduce((acc, venda) => {
      return acc + calcularTotal(venda.total, venda.desconto);
    }, 0);
    return total;
  };

  // Número de clientes únicos
  const calcularClientesUnicos = () => {
    const clientesUnicos = new Set(vendas.map((venda) => venda.nome_cliente));
    return clientesUnicos.size;
  };

  // Valor médio por venda
  const calcularValorMedioPorVenda = () => {
    if (vendas.length === 0) return 0;
    return calcularTotalPorPeriodo() / vendas.length;
  };

  const getVendas = async (start, end) => {
    try {
      setLoading(true);
      // Garante que estamos usando o início do dia para a data de início
      // e o final do dia para a data de fim
      const formattedStart = start.startOf("day").format("YYYY-MM-DD");
      const formattedEnd = end.endOf("day").format("YYYY-MM-DD");

      const items = await getSells(formattedStart, formattedEnd);

      if (items.success) {
        setVendas(
          items.data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
        );
      }
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getVendas(startDate, endDate);
  }, [startDate, endDate]);

  // Colunas para a tabela de totais por dia
  const dailyColumns = [
    {
      title: "Data",
      dataIndex: "data",
      key: "data",
      render: (text) => toDateFormat(text),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (text) => toMoneyFormat(text),
    },
  ];

  // Preparar dados para a tabela diária
  const dailyData = Object.entries(calcularTotaisPorDia()).map(
    ([data, total], index) => ({
      key: index,
      data,
      total,
    })
  );

  // Customizando o formatter para Statistic
  const moneyFormatter = (value) => {
    const formatted = toMoneyFormat(value);
    // Se for uma string, tenta remover o "R$ ", caso contrário retorna o valor original
    return typeof formatted === "string"
      ? formatted.replace("R$ ", "")
      : formatted;
  };

  // Componente para o filtro de data (para mobile)
  const DateFilterDrawer = () => (
    <Drawer
      title="Filtro de Período"
      placement="right"
      onClose={() => setFilterDrawerVisible(false)}
      open={filterDrawerVisible}
      width={300}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Text>Selecione o período:</Text>
        <RangePicker
          allowClear={false}
          value={[startDate, endDate]}
          onChange={handleDateChange}
          format="DD/MM/YYYY"
          style={{ width: "100%" }}
          ranges={{
            Hoje: [moment().startOf("day"), moment().endOf("day")],
            "Últimos 7 dias": [
              moment().subtract(6, "days").startOf("day"),
              moment().endOf("day"),
            ],
            "Últimos 30 dias": [
              moment().subtract(29, "days").startOf("day"),
              moment().endOf("day"),
            ],
            "Este mês": [moment().startOf("month"), moment().endOf("month")],
            "Mês passado": [
              moment().subtract(1, "month").startOf("month"),
              moment().subtract(1, "month").endOf("month"),
            ],
          }}
          direction="vertical"
        />
      </Space>
    </Drawer>
  );

  // Componente de DatePicker Responsivo
  const ResponsiveDatePicker = () => {
    if (isMobile) {
      return (
        <Button
          type="primary"
          icon={<FilterOutlined />}
          onClick={() => setFilterDrawerVisible(true)}
        >
          Filtrar
        </Button>
      );
    }

    return (
      <Space align="center" wrap>
        <CalendarOutlined />
        <span style={{ fontSize: "10pt" }}>Período: </span>
        <RangePicker
          allowClear={false}
          value={[startDate, endDate]}
          onChange={handleDateChange}
          format="DD/MM/YYYY"
          ranges={{
            Hoje: [moment().startOf("day"), moment().endOf("day")],
            "Últimos 7 dias": [
              moment().subtract(6, "days").startOf("day"),
              moment().endOf("day"),
            ],
            "Últimos 30 dias": [
              moment().subtract(29, "days").startOf("day"),
              moment().endOf("day"),
            ],
            "Este mês": [moment().startOf("month"), moment().endOf("month")],
            "Mês passado": [
              moment().subtract(1, "month").startOf("month"),
              moment().subtract(1, "month").endOf("month"),
            ],
          }}
          style={{ maxWidth: "100%" }}
          dropdownClassName="date-range-dropdown"
        />
      </Space>
    );
  };

  // Função para solicitar exclusão
  const handleExclusionRequest = async () => {
    try {
      await exclusionForm.validateFields();
      const values = exclusionForm.getFieldsValue();

      setExclusionLoading(true);

      // Chamar a API
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

        // Atualizar a venda na lista local
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

  // Formatar moeda
  const formatCurrency = (value) => {
    return `R$ ${(parseFloat(value) || 0).toFixed(2).replace(".", ",")}`;
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

  // ========== RENDER MOBILE ==========
  if (isMobile) {
    return (
      <ConfigProvider locale={ptBR} theme={theme}>
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
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "10px",
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
                  <h1 style={mobileStyles.headerTitle}>
                    <ShoppingCartOutlined style={{ marginRight: "8px" }} />
                    Faturamento
                  </h1>
                  <Text style={mobileStyles.headerSubtitle}>
                    {startDate.format("DD/MM")} - {endDate.format("DD/MM/YYYY")}
                  </Text>
                </div>
              </div>
              <Space>
                <Button
                  type="primary"
                  icon={<FilterOutlined />}
                  onClick={() => setFilterDrawerVisible(true)}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    borderRadius: "10px",
                  }}
                />
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={exportToExcel}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    borderRadius: "10px",
                  }}
                />
              </Space>
            </div>

            {/* Summary Cards */}
            <div style={mobileStyles.summaryGrid}>
              <div style={mobileStyles.summaryCard}>
                <ShoppingCartOutlined
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    marginBottom: "4px",
                  }}
                />
                <span style={mobileStyles.summaryValue}>{vendas.length}</span>
                <span style={mobileStyles.summaryLabel}>Vendas</span>
              </div>
              <div style={mobileStyles.summaryCard}>
                <UserOutlined
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    marginBottom: "4px",
                  }}
                />
                <span style={mobileStyles.summaryValue}>
                  {calcularClientesUnicos()}
                </span>
                <span style={mobileStyles.summaryLabel}>Clientes</span>
              </div>
              <div style={mobileStyles.summaryCard}>
                <BarChartOutlined
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    marginBottom: "4px",
                  }}
                />
                <span style={mobileStyles.summaryValue}>
                  {formatCurrency(calcularValorMedioPorVenda()).replace(
                    "R$ ",
                    ""
                  )}
                </span>
                <span style={mobileStyles.summaryLabel}>Ticket Médio</span>
              </div>
              <div style={mobileStyles.summaryCard}>
                <DollarOutlined
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    marginBottom: "4px",
                  }}
                />
                <span style={mobileStyles.summaryValue}>
                  {formatCurrency(calcularTotalPorPeriodo()).replace("R$ ", "")}
                </span>
                <span style={mobileStyles.summaryLabel}>Total</span>
              </div>
            </div>

            {/* Total Card */}
            <div style={mobileStyles.totalCard}>
              <span style={mobileStyles.totalLabel}>TOTAL DO PERÍODO</span>
              <span style={mobileStyles.totalValue}>
                {formatCurrency(calcularTotalPorPeriodo())}
              </span>
            </div>
          </div>

          {/* Content Area */}
          <div style={mobileStyles.content}>
            {/* Barra de Busca Mobile */}
            {vendas.length > 0 && !loading && (
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

            {loading ? (
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
                    : "Nenhuma venda no período"
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
                            {toSaoPauloTime(venda.createdAt).format(
                              "DD/MM HH:mm"
                            )}
                          </Text>
                          {venda.nome_cliente && (
                            <Text style={{ fontSize: "11px", color: "#666" }}>
                              <UserOutlined /> {venda.nome_cliente}
                            </Text>
                          )}
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
                          style={{
                            flex: 1,
                            borderRadius: "8px",
                          }}
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
            wrapClassName="qui-sheet"
            classNames={{ mask: "qui-dialog-mask" }}
            width="100%"
            centered={false}
            footer={null}
            destroyOnClose
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

          {/* Drawer para filtros */}
          <DateFilterDrawer />
        </div>
      </ConfigProvider>
    );
  }

  // ========== RENDER DESKTOP ==========
  return (
    <ConfigProvider locale={ptBR} theme={theme}>
      <Layout
        className="qui-page"
        style={{
          background: "transparent",
          minHeight: "auto",
          padding: 0,
          ...pageStyle,
        }}
        ref={containerRef}
      >
        <Content>
          <div className="qui-header">
            <div>
              <h1>Faturamento</h1>
              <p>Vendas do período selecionado</p>
            </div>
            <ResponsiveDatePicker />
          </div>
          <Card styles={{ body: { padding: isMobile ? "12px" : "24px" } }} bordered={false} className="qui-panel">
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Row justify="end" align="middle" gutter={[8, 8]} wrap style={{ display: "none" }}>
                <Col>
                  <ResponsiveDatePicker />
                </Col>
              </Row>

              <Divider style={{ margin: isMobile ? "12px 0" : "24px 0" }} />

              {loading ? (
                <div style={{ textAlign: "center", padding: "50px" }}>
                  <Spin size="large" />
                </div>
              ) : (
                <>
                  <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                    <Col xs={12} sm={12} md={6}>
                      <Card styles={{ body: { padding: isMobile ? "12px" : "24px" } }}>
                        <Statistic
                          title="Total do Período"
                          value={calcularTotalPorPeriodo()}
                          formatter={moneyFormatter}
                          valueStyle={{
                            fontSize: isMobile ? "18px" : "24px",
                            color: primary,
                          }}
                        />
                        <Text
                          type="secondary"
                          style={{ fontSize: isMobile ? "12px" : "14px" }}
                        >
                          {startDate.format("DD/MM")} a{" "}
                          {endDate.format("DD/MM")}
                        </Text>
                      </Card>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <Card styles={{ body: { padding: isMobile ? "12px" : "24px" } }}>
                        <Statistic
                          title="Número de Vendas"
                          value={vendas.length}
                          valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <Card styles={{ body: { padding: isMobile ? "12px" : "24px" } }}>
                        <Statistic
                          title="Clientes Únicos"
                          value={calcularClientesUnicos()}
                          valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <Card styles={{ body: { padding: isMobile ? "12px" : "24px" } }}>
                        <Statistic
                          title="Valor Médio"
                          value={calcularValorMedioPorVenda()}
                          formatter={moneyFormatter}
                          valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Divider
                    orientation="left"
                    style={{ margin: isMobile ? "12px 0" : "24px 0" }}
                  >
                    Detalhamento
                  </Divider>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={exportToExcel}
                  >
                    Exportar
                  </Button>

                  <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <>
                            <BarChartOutlined /> Totais por Dia
                          </>
                        }
                        style={{ height: "100%" }}
                        styles={{ body: { padding: isMobile ? "8px" : "24px" } }}
                      >
                        {dailyData.length > 0 ? (
                          <div className="responsive-table-container">
                            <Table
                              columns={dailyColumns}
                              dataSource={dailyData}
                              size={isMobile ? "small" : "middle"}
                              pagination={{ pageSize: isMobile ? 3 : 5 }}
                              scroll={{ x: isMobile ? 300 : undefined }}
                            />
                          </div>
                        ) : (
                          <Empty description="Sem dados para o período selecionado" />
                        )}
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <>
                            <DollarOutlined /> Resumo por Cliente
                          </>
                        }
                        style={{ height: "100%" }}
                        styles={{ body: { padding: isMobile ? "8px" : "24px" } }}
                      >
                        {vendas.length > 0 ? (
                          <div
                            style={{
                              maxHeight: isMobile ? "200px" : "300px",
                              overflow: "auto",
                            }}
                          >
                            {Array.from(
                              new Set(vendas.map((v) => v.nome_cliente))
                            ).map((cliente) => {
                              const vendasCliente = vendas.filter(
                                (v) => v.nome_cliente === cliente
                              );
                              const totalCliente = vendasCliente.reduce(
                                (acc, v) =>
                                  acc + calcularTotal(v.total, v.desconto),
                                0
                              );
                              return (
                                <div
                                  key={cliente}
                                  style={{
                                    marginBottom: "10px",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "4px",
                                  }}
                                >
                                  <Space
                                    size={isMobile ? "small" : "middle"}
                                    wrap
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        maxWidth: isMobile ? "100%" : "auto",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <UserOutlined
                                        style={{ marginRight: "4px" }}
                                      />
                                      <Text
                                        strong
                                        style={{
                                          maxWidth: isMobile
                                            ? "120px"
                                            : "200px",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {cliente}
                                      </Text>
                                    </div>
                                    <span className="qui-status qui-status--muted">
                                      {vendasCliente.length} venda(s)
                                    </span>
                                    <Text>{toMoneyFormat(totalCliente)}</Text>
                                  </Space>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <Empty description="Sem dados para o período selecionado" />
                        )}
                      </Card>
                    </Col>
                  </Row>

                  <Divider
                    orientation="left"
                    style={{ margin: isMobile ? "12px 0" : "24px 0" }}
                  >
                    Lista de Vendas
                  </Divider>

                  <div className="responsive-table-container">
                    <Table
                      columns={columnsVendas}
                      dataSource={vendas.map((venda) => ({
                        ...venda,
                        key: venda.id,
                      }))}
                      pagination={{
                        pageSize: isMobile ? 5 : 50,
                        size: isMobile ? "small" : "default",
                      }}
                      bordered
                      size={isMobile ? "small" : "middle"}
                      locale={{
                        emptyText: "Sem dados para o período selecionado",
                      }}
                      scroll={{ x: isMobile ? 400 : undefined }}
                    />
                  </div>
                </>
              )}
            </Space>
          </Card>
        </Content>
      </Layout>
      {/* Modal de Solicitação de Exclusão */}
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
      <Modal
        title="Revisar exclusão"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        wrapClassName="qui-dialog"
        classNames={{ mask: "qui-dialog-mask" }}
        centered
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
      <SaleDetailsModal
        visible={showModalVenda}
        onClose={setShowModalVenda}
        saleData={selectedVenda}
      />

      {/* Drawer para filtros em dispositivos móveis */}
      <DateFilterDrawer />

      {/* CSS para responsividade adicional */}
      <style jsx global>{`
        .responsive-table-container {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .date-range-dropdown {
          max-width: 90vw;
        }

        @media (max-width: 767px) {
          .ant-card-head-title {
            font-size: 14px;
          }

          .ant-table {
            font-size: 12px;
          }

          .ant-statistic-title {
            font-size: 12px;
            margin-bottom: 4px;
          }

          .ant-divider-inner-text {
            font-size: 14px;
          }

          .ant-card-body {
            padding: 12px !important;
          }

          .ant-picker-panels {
            flex-direction: column;
          }
        }
      `}</style>
    </ConfigProvider>
  );
}

export default Vendas;
