import React, { useEffect, useState } from "react";
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
} from "@ant-design/icons";
import { getDashboard } from "helpers/api-integrator";
import { toMoneyFormat, monthName } from "helpers/formatters";
import ChartistGraph from "react-chartist"; // Keeping the existing chart library
import TopSellingItemsDashboard from "components/Dashboard/TopSellers";
import moment from "moment";

const { Title, Text } = Typography;

function Dashboard() {
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

  // Fetch dashboard data
  const getDataDash = async () => {
    setLoading(true);
    try {
      const resultD = await getDashboard();
      console.log({ resultD });
      if (resultD.success) {
        setDataDash(resultD.data);
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDataDash();
    // In a real app, we would fetch caixa data here as well
  }, []);

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

  // Component for stats cards
  const StatCard = ({ title, value, icon, color }) => (
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
    </div>
  );
}

export default Dashboard;
