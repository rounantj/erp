import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Skeleton,
  Typography,
  Divider,
  Badge,
  Space,
  Tag,
  Tooltip,
  Progress,
  ConfigProvider,
  Spin,
  Empty,
} from "antd";
import {
  CalendarOutlined,
  SyncOutlined,
  ShoppingOutlined,
  DollarOutlined,
  PieChartOutlined,
  LineChartOutlined,
  BarChartOutlined,
  WalletOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  RiseOutlined,
  FallOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import {
  getDashboard,
  getMonthlySalesAndExpenses,
  getMonthlyCurriculums,
} from "helpers/api-integrator";
import { toMoneyFormat, monthName } from "helpers/formatters";
import ChartistGraph from "react-chartist"; // Keeping the existing chart library
import Chartist from "chartist"; // Import Chartist for SVG manipulation
import TopSellingItemsDashboard from "components/Dashboard/TopSellers";
import moment from "moment";

const { Title, Text } = Typography;

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
    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
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
    fontSize: "24px",
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
  sectionCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  productItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  productName: {
    fontSize: "12px",
    color: "#333",
    flex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginRight: "8px",
  },
  productValue: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#4facfe",
  },
};

function Dashboard() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detectar mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [monthlyData, setMonthlyData] = useState(null);
  const [curriculumData, setCurriculumData] = useState(null);

  const [dataDash, setDataDash] = useState({
    produtosVendidos: [
      {
        id: 301,
        descricao: "IMPRESSÃO COLORIDO",
        valor: 2,
        companyId: 1,
        categoria: "Serviço",
        ean: "",
        ncm: '48053000"Papel sulfito p/embalagem,n/revestido,em rolos/folhas"',
        createdAt: "2024-11-25T21:38:56.949Z",
        updatedAt: "2024-06-13T17:18:03.879Z",
        updatedByUser: 1,
        createdByUser: 1,
        deletedAt: null,
        quantidade: "9",
        valorTotal: 18,
      },
    ],
    totalProdutos: 10,
    totalServicos: 10,
    totalHoje: 10,
    totalEsseMes: 10,
    dias: ["25/11"],
    servicosValues: [24],
    fullValues: [53.980000000000004],
    produtosValues: [29.98],
    meses: ["Jun", "Jul", "Nov"],
    mesesSerValues: [28.47, 144.73, 29.98],
    mesesPrdValues: [6.75, 7, 24],
    despesa: [
      {
        total: 1350,
      },
    ],
  });

  // Cash register data (caixa)
  const [caixaData, setCaixaData] = useState({
    id: 15,
    company_id: 1,
    fechado: true,
    abertura_data: "2025-03-01T14:41:04.866Z",
    fechamento_data: "2025-03-03T00:59:51.736Z",
    aberto_por: 1,
    fechado_por: 1,
    updated_at: "2025-03-02T21:59:51.749Z",
    deleted_at: null,
    saldoInicial: 147.0,
    saldoFinal: 143.0,
    created_at: "2025-03-01T11:41:04.870Z",
    diferenca: -0.3,
  });

  const [loading, setLoading] = useState(false);

  // Fetch dashboard data - memoizado para evitar recriação
  const getDataDash = useCallback(async () => {
    setLoading(true);
    try {
      const resultD = await getDashboard();
      if (resultD.success) {
        setDataDash(resultD.data);
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch monthly sales and expenses data
  const fetchMonthlyData = useCallback(async () => {
    try {
      const result = await getMonthlySalesAndExpenses();
      if (result.success) {
        setMonthlyData(result.data);
      }
    } catch (error) {
      console.error("Error fetching monthly data:", error);
    }
  }, []);

  // Fetch monthly curriculums data
  const fetchCurriculumData = useCallback(async () => {
    try {
      const result = await getMonthlyCurriculums();
      if (result.success) {
        setCurriculumData(result.data);
      }
    } catch (error) {
      console.error("Error fetching curriculum data:", error);
    }
  }, []);

  useEffect(() => {
    getDataDash();
    fetchMonthlyData();
    fetchCurriculumData();
  }, [getDataDash, fetchMonthlyData, fetchCurriculumData]);

  // Format date functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate cash register operation duration
  const calculateDuration = () => {
    const start = new Date(caixaData.abertura_data);
    const end = new Date(caixaData.fechamento_data);
    const durationMs = end - start;

    // Convert to hours and minutes
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}min`;
  };

  // Component for stats cards - memoizado para evitar re-renders
  const StatCard = useMemo(
    () =>
      React.memo(({ title, value, icon, color }) => (
        <Card className="stat-card" bordered={false} style={{ height: "100%" }}>
          <Statistic
            title={<Text strong>{title}</Text>}
            value={value}
            valueStyle={{ color }}
            prefix={React.cloneElement(icon, {
              style: { fontSize: 20, marginRight: 8 },
            })}
          />
          <div className="stat-footer">
            <Divider style={{ margin: "12px 0" }} />
            <Space>
              <SyncOutlined spin={loading} />
              <Text type="secondary">Atualizado agora</Text>
            </Space>
          </div>
        </Card>
      )),
    [loading]
  );

  // Pie chart visualization using Progress components
  const PieChartVisual = () => {
    const total = dataDash.totalProdutos + dataDash.totalServicos;
    const pP = +((dataDash.totalProdutos * 100) / total).toFixed(2);
    const pS = +((dataDash.totalServicos * 100) / total).toFixed(2);

    return (
      <div style={{ padding: "10px 0" }}>
        <Row gutter={[16, 16]} justify="center">
          <Col xs={24} md={12}>
            <div style={{ textAlign: "center" }}>
              <Progress
                type="circle"
                percent={pP}
                format={() => `${pP}%`}
                strokeColor="#ff4d4f"
                width={120}
              />
              <div style={{ marginTop: 8 }}>
                <Badge color="#ff4d4f" text={<Text strong>Produtos</Text>} />
              </div>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ textAlign: "center" }}>
              <Progress
                type="circle"
                percent={pS}
                format={() => `${pS}%`}
                strokeColor="#1890ff"
                width={120}
              />
              <div style={{ marginTop: 8 }}>
                <Badge color="#1890ff" text={<Text strong>Serviços</Text>} />
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  // Monthly sales summary for bar chart
  const MonthlySalesVisual = () => {
    return (
      <div style={{ padding: "10px 0" }}>
        {dataDash.meses.map((month, index) => {
          const serValue = dataDash.mesesSerValues[index] || 0;
          const prdValue = dataDash.mesesPrdValues[index] || 0;
          const total = serValue + prdValue;

          // Calculate percentages
          const serPercent = total > 0 ? (serValue / total) * 100 : 0;
          const prdPercent = total > 0 ? (prdValue / total) * 100 : 0;

          return (
            <div key={month} style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text strong>{month}</Text>
                <Text>{toMoneyFormat(total)}</Text>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <div style={{ width: "100%", marginRight: 16 }}>
                  <Tooltip
                    title={`Serviços: ${serPercent.toFixed(
                      1
                    )}%, Produtos: ${prdPercent.toFixed(1)}%`}
                  >
                    <div style={{ display: "flex", height: 20 }}>
                      <div
                        style={{
                          width: `${serPercent}%`,
                          backgroundColor: "#1890ff",
                          height: "100%",
                          borderRadius:
                            serPercent > 0 && prdPercent > 0
                              ? "4px 0 0 4px"
                              : "4px",
                        }}
                      />
                      <div
                        style={{
                          width: `${prdPercent}%`,
                          backgroundColor: "#ff4d4f",
                          height: "100%",
                          borderRadius:
                            serPercent > 0 && prdPercent > 0
                              ? "0 4px 4px 0"
                              : "4px",
                        }}
                      />
                    </div>
                  </Tooltip>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">
                  <Badge
                    color="#1890ff"
                    text={`Serviços: ${toMoneyFormat(serValue)}`}
                  />
                </Text>
                <Text type="secondary">
                  <Badge
                    color="#ff4d4f"
                    text={`Produtos: ${toMoneyFormat(prdValue)}`}
                  />
                </Text>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Formatar moeda
  const formatCurrency = (value) => {
    return `R$ ${(parseFloat(value) || 0).toFixed(2).replace(".", ",")}`;
  };

  // ========== RENDER MOBILE ==========
  if (isMobile) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#4facfe",
            borderRadius: 12,
          },
        }}
      >
        <div style={mobileStyles.container}>
          {/* Header Mobile */}
          <div style={mobileStyles.header}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                {/* Botão Menu */}
                <div
                  onClick={() => {
                    const isOpen = document.documentElement.classList.contains("nav-open");
                    if (isOpen) {
                      document.documentElement.classList.remove("nav-open");
                      const existingBodyClick = document.getElementById("bodyClick");
                      if (existingBodyClick) existingBodyClick.parentElement.removeChild(existingBodyClick);
                    } else {
                      document.documentElement.classList.add("nav-open");
                      const existingBodyClick = document.getElementById("bodyClick");
                      if (existingBodyClick) existingBodyClick.parentElement.removeChild(existingBodyClick);
                      var node = document.createElement("div");
                      node.id = "bodyClick";
                      node.style.cssText = "position:fixed;top:0;left:0;right:250px;bottom:0;z-index:9999;";
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
                    <BarChartOutlined style={{ marginRight: "8px" }} />
                    Dashboard
                  </h1>
                  <Text style={mobileStyles.headerSubtitle}>
                    {monthName(new Date().getMonth())} {new Date().getFullYear()}
                  </Text>
                </div>
              </div>
              <div
                onClick={getDataDash}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                <ReloadOutlined spin={loading} style={{ color: "#fff" }} />
              </div>
            </div>

            {/* Summary Cards */}
            <div style={mobileStyles.summaryGrid}>
              <div style={mobileStyles.summaryCard}>
                <CalendarOutlined style={{ color: "rgba(255,255,255,0.8)", marginBottom: "4px" }} />
                <span style={mobileStyles.summaryValue}>{dataDash.dias?.length || 0}</span>
                <span style={mobileStyles.summaryLabel}>Dias Trabalhados</span>
              </div>
              <div style={mobileStyles.summaryCard}>
                <ShoppingOutlined style={{ color: "rgba(255,255,255,0.8)", marginBottom: "4px" }} />
                <span style={mobileStyles.summaryValue}>
                  {formatCurrency(dataDash.totalHoje).replace("R$ ", "")}
                </span>
                <span style={mobileStyles.summaryLabel}>Vendas Hoje</span>
              </div>
              <div style={mobileStyles.summaryCard}>
                <DollarOutlined style={{ color: "rgba(255,255,255,0.8)", marginBottom: "4px" }} />
                <span style={mobileStyles.summaryValue}>
                  {formatCurrency(dataDash.totalEsseMes).replace("R$ ", "")}
                </span>
                <span style={mobileStyles.summaryLabel}>Vendas do Mês</span>
              </div>
              <div style={mobileStyles.summaryCard}>
                <FallOutlined style={{ color: "rgba(255,255,255,0.8)", marginBottom: "4px" }} />
                <span style={mobileStyles.summaryValue}>
                  {formatCurrency(dataDash?.despesa?.[0]?.total || 0).replace("R$ ", "")}
                </span>
                <span style={mobileStyles.summaryLabel}>Despesas</span>
              </div>
            </div>

            {/* Total Card */}
            <div style={mobileStyles.totalCard}>
              <span style={mobileStyles.totalLabel}>VENDAS DO MÊS</span>
              <span style={mobileStyles.totalValue}>
                {formatCurrency(dataDash.totalEsseMes)}
              </span>
            </div>
          </div>

          {/* Content Area */}
          <div style={mobileStyles.content}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
                <div style={{ marginTop: "12px" }}>
                  <Text type="secondary">Carregando dados...</Text>
                </div>
              </div>
            ) : (
              <div style={{ 
                flex: 1, 
                overflow: "auto",
                minHeight: 0,
                WebkitOverflowScrolling: "touch",
              }}>
                {/* Divisão de Receita */}
                <div style={mobileStyles.sectionCard}>
                  <div style={mobileStyles.sectionTitle}>
                    <PieChartOutlined style={{ color: "#4facfe" }} />
                    Divisão de Receita
                  </div>
                  <Row gutter={16}>
                    <Col span={12} style={{ textAlign: "center" }}>
                      <Progress
                        type="circle"
                        percent={
                          dataDash.totalProdutos + dataDash.totalServicos > 0
                            ? +((dataDash.totalProdutos * 100) / (dataDash.totalProdutos + dataDash.totalServicos)).toFixed(0)
                            : 0
                        }
                        strokeColor="#ff4d4f"
                        width={80}
                      />
                      <div style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: "12px" }}>Produtos</Text>
                      </div>
                    </Col>
                    <Col span={12} style={{ textAlign: "center" }}>
                      <Progress
                        type="circle"
                        percent={
                          dataDash.totalProdutos + dataDash.totalServicos > 0
                            ? +((dataDash.totalServicos * 100) / (dataDash.totalProdutos + dataDash.totalServicos)).toFixed(0)
                            : 0
                        }
                        strokeColor="#1890ff"
                        width={80}
                      />
                      <div style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: "12px" }}>Serviços</Text>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Vendas por Mês */}
                <div style={mobileStyles.sectionCard}>
                  <div style={mobileStyles.sectionTitle}>
                    <LineChartOutlined style={{ color: "#4facfe" }} />
                    Vendas por Mês
                  </div>
                  {dataDash.meses?.map((month, index) => {
                    const serValue = dataDash.mesesSerValues?.[index] || 0;
                    const prdValue = dataDash.mesesPrdValues?.[index] || 0;
                    const total = serValue + prdValue;
                    const serPercent = total > 0 ? (serValue / total) * 100 : 0;
                    const prdPercent = total > 0 ? (prdValue / total) * 100 : 0;

                    return (
                      <div key={month} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text style={{ fontSize: "12px", fontWeight: "600" }}>{month}</Text>
                          <Text style={{ fontSize: "12px", fontWeight: "600", color: "#4facfe" }}>
                            {formatCurrency(total)}
                          </Text>
                        </div>
                        <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${serPercent}%`,
                              backgroundColor: "#1890ff",
                              height: "100%",
                            }}
                          />
                          <div
                            style={{
                              width: `${prdPercent}%`,
                              backgroundColor: "#ff4d4f",
                              height: "100%",
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                          <Text style={{ fontSize: "10px", color: "#999" }}>
                            <Badge color="#1890ff" text={`Serv: ${formatCurrency(serValue)}`} />
                          </Text>
                          <Text style={{ fontSize: "10px", color: "#999" }}>
                            <Badge color="#ff4d4f" text={`Prod: ${formatCurrency(prdValue)}`} />
                          </Text>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Produtos Mais Vendidos */}
                <div style={mobileStyles.sectionCard}>
                  <div style={mobileStyles.sectionTitle}>
                    <ShoppingOutlined style={{ color: "#4facfe" }} />
                    Mais Vendidos do Mês
                  </div>
                  {dataDash.produtosVendidos?.length > 0 ? (
                    dataDash.produtosVendidos.slice(0, 5).map((produto, index) => (
                      <div key={produto.id || index} style={mobileStyles.productItem}>
                        <span style={{ 
                          fontSize: "11px", 
                          fontWeight: "600",
                          color: "#4facfe",
                          marginRight: "8px",
                          minWidth: "20px",
                        }}>
                          #{index + 1}
                        </span>
                        <span style={mobileStyles.productName}>
                          {produto.descricao}
                        </span>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <span style={mobileStyles.productValue}>
                            {formatCurrency(produto.valorTotal)}
                          </span>
                          <div style={{ fontSize: "10px", color: "#999" }}>
                            {produto.quantidade}x
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Sem dados"
                      style={{ margin: "20px 0" }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </ConfigProvider>
    );
  }

  // ========== RENDER DESKTOP ==========
  return (
    <div
      className="dashboard-container"
      style={{ padding: 24, background: "#f0f2f5", minHeight: "100vh" }}
    >
      <Title level={2} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ) : (
            <StatCard
              title={`Dias trabalhados ${monthName(new Date().getMonth())}`}
              value={`${dataDash.dias.length} dias`}
              icon={<CalendarOutlined />}
              color="#1890ff"
            />
          )}
        </Col>

        <Col xs={24} sm={12} lg={6}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ) : (
            <StatCard
              title={`Vendas ${monthName(new Date().getMonth())}`}
              value={toMoneyFormat(dataDash.totalEsseMes)}
              icon={<DollarOutlined />}
              color="#52c41a"
            />
          )}
        </Col>

        <Col xs={24} sm={12} lg={6}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ) : (
            <StatCard
              title="Vendas Hoje"
              value={toMoneyFormat(dataDash.totalHoje)}
              icon={<ShoppingOutlined />}
              color="#722ed1"
            />
          )}
        </Col>

        <Col xs={24} sm={12} lg={6}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ) : (
            <StatCard
              title={`Despesas ${monthName(new Date().getMonth())}`}
              value={toMoneyFormat(dataDash?.despesa[0]?.total || 0)}
              icon={<DollarOutlined />}
              color="#f5222d"
            />
          )}
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Left Column */}
        <Col xs={24} lg={16}>
          {/* Daily Sales Chart */}
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          ) : (
            <Card
              title="Vendas por dia"
              extra={<LineChartOutlined style={{ fontSize: 18 }} />}
              bordered={false}
              style={{ marginBottom: 16 }}
            >
              <div className="ct-chart" id="chartHours">
                <ChartistGraph
                  data={{
                    labels: dataDash.dias,
                    series: [
                      dataDash.fullValues,
                      dataDash.servicosValues,
                      dataDash.produtosValues,
                    ],
                  }}
                  type="Line"
                  style={{ zoom: "95%" }}
                  options={{
                    low: 0,
                    high: Math.max(...dataDash.fullValues) + 50,
                    showArea: false,
                    height: "200px",

                    axisX: {
                      showGrid: false,
                      labelOffset: {
                        x: 0,
                        y: 5,
                      },
                      labelInterpolationFnc: function (value) {
                        // Limita o texto para evitar sobreposição
                        return value.substring(0, 2); // Mostra apenas os primeiros 2 caracteres
                      },
                    },
                    lineSmooth: true,
                    showLine: true,
                    showPoint: true,
                    fullWidth: true,
                    chartPadding: {
                      right: 50,
                      left: 20,
                      top: 20,
                      bottom: 30, // Aumente o padding inferior para dar mais espaço aos labels
                    },
                  }}
                  responsiveOptions={[
                    [
                      "screen and (max-width: 640px)",
                      {
                        axisX: {
                          labelInterpolationFnc: function (value) {
                            return value[0]; // Mostra apenas o primeiro caractere em telas pequenas
                          },
                        },
                      },
                    ],
                  ]}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <Space>
                  <Badge color="#1890ff" text="Total" />
                  <Badge color="#f5222d" text="Serviços" />
                  <Badge color="#faad14" text="Produtos" />
                </Space>
              </div>
            </Card>
          )}
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={8}>
          {/* Revenue Division Chart */}
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          ) : (
            <Card
              title="Divisão de Receita"
              extra={<PieChartOutlined style={{ fontSize: 18 }} />}
              bordered={false}
              style={{ marginBottom: 16 }}
            >
              <PieChartVisual />
            </Card>
          )}
        </Col>
      </Row>

      {loading ? (
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      ) : (
        <TopSellingItemsDashboard
          defaultDateRange={[
            moment().startOf("month"),
            moment().endOf("month"),
          ]}
        />
      )}

      {/* Monthly Charts Row */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Vendas e Despesas - Últimos 12 Meses */}
        <Col xs={24}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          ) : (
            <Card
              title="Vendas e Despesas - Últimos 12 Meses"
              extra={<LineChartOutlined style={{ fontSize: 18 }} />}
              bordered={false}
              style={{ marginBottom: 16 }}
            >
              {monthlyData && monthlyData.meses?.length > 0 ? (
                <>
                  <style>{`
                    #chartMonthly .ct-series-a .ct-line,
                    #chartMonthly .ct-series-a .ct-point {
                      stroke: #1890ff;
                    }
                    #chartMonthly .ct-series-b .ct-line,
                    #chartMonthly .ct-series-b .ct-point {
                      stroke: #f5222d;
                    }
                  `}</style>
                  <div className="ct-chart" id="chartMonthly">
                    <ChartistGraph
                      data={{
                        labels: monthlyData.meses,
                        series: [monthlyData.vendas, monthlyData.despesas],
                      }}
                      type="Line"
                      style={{ zoom: "95%" }}
                      listener={{
                        draw: (function(vendasData, despesasData) {
                          return function(data) {
                            // Adicionar labels sobre os pontos
                            if (data.type === 'point') {
                              // Acessar o valor correto da série usando o índice
                              const seriesIndex = data.seriesIndex;
                              const pointIndex = data.index;
                              let value = 0;
                              
                              // Pegar o valor do array de séries
                              if (seriesIndex === 0 && vendasData) {
                                value = vendasData[pointIndex] || 0;
                              } else if (seriesIndex === 1 && despesasData) {
                                value = despesasData[pointIndex] || 0;
                              }
                              
                              // Garantir que é um número
                              value = parseFloat(value) || 0;
                              
                              // Formatar com R$ e sem centavos
                              const valueInteiro = Math.round(value);
                              const formattedValue = `R$ ${valueInteiro.toLocaleString('pt-BR')}`;
                              
                              // Criar elemento de texto para o label
                              const label = new Chartist.Svg('text', {
                                x: data.x,
                                y: data.y - 10,
                                'text-anchor': 'middle',
                                'class': 'ct-point-label',
                                style: 'font-size: 14px; font-weight: bold; fill: #333;'
                              });
                              
                              label.text(formattedValue);
                              data.element.parent().append(label);
                            }
                          };
                        })(monthlyData.vendas, monthlyData.despesas)
                      }}
                      options={{
                        low: 0,
                        high: (() => {
                          const maxValue = Math.max(
                            ...monthlyData.vendas,
                            ...monthlyData.despesas
                          );
                          if (maxValue === 0) return 1000;
                          // Determinar o valor de arredondamento baseado no tamanho
                          let roundTo = 100;
                          if (maxValue >= 50000) roundTo = 10000;
                          else if (maxValue >= 10000) roundTo = 5000;
                          else if (maxValue >= 5000) roundTo = 1000;
                          else if (maxValue >= 1000) roundTo = 500;
                          else if (maxValue >= 500) roundTo = 100;
                          else if (maxValue >= 100) roundTo = 50;
                          else roundTo = 10;
                          // Arredondar para o próximo múltiplo
                          const rounded = Math.ceil(maxValue / roundTo) * roundTo;
                          // Adicionar apenas uma pequena margem proporcional ao roundTo (não percentual)
                          // Isso evita escalas muito grandes quando os valores são pequenos
                          const padding = roundTo * 0.2; // 20% do roundTo, não do valor
                          return rounded + Math.ceil(padding);
                        })(),
                        showArea: false,
                        height: "250px",
                        axisX: {
                          showGrid: false,
                          labelOffset: {
                            x: 0,
                            y: 5,
                          },
                          labelInterpolationFnc: function (value, index) {
                            // Adicionar o ano ao mês (formato: Jan/25)
                            const mes = value.substring(0, 3);
                            // Calcular o ano baseado no índice (últimos 12 meses)
                            const hoje = new Date();
                            const mesAtual = hoje.getMonth();
                            const anoAtual = hoje.getFullYear();
                            // Calcular quantos meses atrás estamos
                            const mesesAtras = 11 - index;
                            const dataDoMes = new Date(anoAtual, mesAtual - mesesAtras, 1);
                            const ano = String(dataDoMes.getFullYear()).substring(2);
                            return `${mes}/${ano}`;
                          },
                        },
                        axisY: {
                          labelInterpolationFnc: function (value) {
                            // Formatar números com separador de milhar brasileiro
                            if (value >= 1000) {
                              return value.toLocaleString('pt-BR');
                            }
                            return value.toString();
                          },
                        },
                        lineSmooth: true,
                        showLine: true,
                        showPoint: true,
                        fullWidth: true,
                        chartPadding: {
                          right: 50,
                          left: 60,
                          top: 20,
                          bottom: 30,
                        },
                      }}
                      responsiveOptions={[
                        [
                          "screen and (max-width: 640px)",
                          {
                            axisX: {
                              labelInterpolationFnc: function (value) {
                                return value[0];
                              },
                            },
                          },
                        ],
                      ]}
                    />
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <Space>
                      <Badge color="#1890ff" text="Vendas" />
                      <Badge color="#f5222d" text="Despesas" />
                    </Space>
                  </div>
                </>
              ) : (
                <Empty description="Sem dados para exibir" />
              )}
            </Card>
          )}
        </Col>

        {/* Currículos Criados - Últimos 12 Meses */}
        <Col xs={24}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          ) : (
            <Card
              title="Currículos Criados - Últimos 12 Meses"
              extra={<BarChartOutlined style={{ fontSize: 18 }} />}
              bordered={false}
              style={{ marginBottom: 16 }}
            >
              {curriculumData && curriculumData.meses?.length > 0 ? (
                <>
                  <style>{`
                    #chartCurriculums .ct-series-a .ct-line,
                    #chartCurriculums .ct-series-a .ct-point {
                      stroke: #52c41a;
                    }
                  `}</style>
                  <div className="ct-chart" id="chartCurriculums">
                    <ChartistGraph
                      data={{
                        labels: curriculumData.meses,
                        series: [curriculumData.curriculos],
                      }}
                      type="Line"
                      style={{ zoom: "95%" }}
                      listener={{
                        draw: function(data) {
                          // Adicionar labels sobre os pontos
                          if (data.type === 'point') {
                            // Acessar o valor correto da série usando o índice
                            const pointIndex = data.index;
                            let value = 0;
                            
                            // Pegar o valor do array de séries
                            if (curriculumData && curriculumData.curriculos) {
                              value = curriculumData.curriculos[pointIndex] || 0;
                            }
                            
                            // Garantir que é um número
                            value = parseFloat(value) || 0;
                            
                            const formattedValue = value.toString();
                            
                            // Criar elemento de texto para o label
                            const label = new Chartist.Svg('text', {
                              x: data.x,
                              y: data.y - 10,
                              'text-anchor': 'middle',
                              'class': 'ct-point-label',
                              style: 'font-size: 14px; font-weight: bold; fill: #333;'
                            });
                            
                            label.text(formattedValue);
                            data.element.parent().append(label);
                          }
                        }
                      }}
                      options={{
                        low: 0,
                        high: (() => {
                          const maxValue = Math.max(...curriculumData.curriculos);
                          if (maxValue === 0) return 10;
                          // Arredondar para cima de forma mais inteligente
                          let roundTo = 2;
                          if (maxValue >= 50) roundTo = 50;
                          else if (maxValue >= 10) roundTo = 10;
                          else if (maxValue >= 5) roundTo = 5;
                          else roundTo = 2;
                          const rounded = Math.ceil(maxValue / roundTo) * roundTo;
                          // Adicionar um pouco de espaço no topo (10% ou mínimo de 2)
                          return rounded + Math.max(2, Math.ceil(rounded * 0.1));
                        })(),
                        showArea: false,
                        height: "250px",
                        axisX: {
                          showGrid: false,
                          labelOffset: {
                            x: 0,
                            y: 5,
                          },
                          labelInterpolationFnc: function (value, index) {
                            // Adicionar o ano ao mês (formato: Jan/25)
                            const mes = value.substring(0, 3);
                            // Calcular o ano baseado no índice (últimos 12 meses)
                            const hoje = new Date();
                            const mesAtual = hoje.getMonth();
                            const anoAtual = hoje.getFullYear();
                            // Calcular quantos meses atrás estamos
                            const mesesAtras = 11 - index;
                            const dataDoMes = new Date(anoAtual, mesAtual - mesesAtras, 1);
                            const ano = String(dataDoMes.getFullYear()).substring(2);
                            return `${mes}/${ano}`;
                          },
                        },
                        lineSmooth: true,
                        showLine: true,
                        showPoint: true,
                        fullWidth: true,
                        chartPadding: {
                          right: 50,
                          left: 60,
                          top: 20,
                          bottom: 30,
                        },
                      }}
                      responsiveOptions={[
                        [
                          "screen and (max-width: 640px)",
                          {
                            axisX: {
                              labelInterpolationFnc: function (value) {
                                return value[0];
                              },
                            },
                          },
                        ],
                      ]}
                    />
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <Space>
                      <Badge color="#52c41a" text="Currículos" />
                    </Space>
                  </div>
                </>
              ) : (
                <Empty description="Sem dados para exibir" />
              )}
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
