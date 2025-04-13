import React, { useEffect, useState, useMemo, Suspense } from "react";
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
  Alert,
  Result,
  Button,
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
} from "@ant-design/icons";
import { getDashboard } from "helpers/api-integrator";
import { toMoneyFormat, monthName } from "helpers/formatters";
import moment from "moment";

// Definindo constantes para o componente fora da função do componente
// Isso evita uma causa comum do erro #525 - recriação de componentes em cada renderização
const TopSellingItemsDashboard = React.lazy(() =>
  import("components/Dashboard/TopSellers")
);

const { Title, Text } = Typography;

// Valores padrão definidos fora do componente
const defaultDashData = {
  produtosVendidos: [],
  totalProdutos: 0,
  totalServicos: 0,
  totalHoje: 0,
  totalEsseMes: 0,
  dias: [],
  servicosValues: [],
  fullValues: [],
  produtosValues: [],
  meses: [],
  mesesSerValues: [],
  mesesPrdValues: [],
  despesa: [{ total: 0 }],
};

const defaultCaixaData = {
  id: 0,
  company_id: 0,
  fechado: false,
  abertura_data: new Date().toISOString(),
  fechamento_data: new Date().toISOString(),
  aberto_por: 0,
  fechado_por: 0,
  updated_at: new Date().toISOString(),
  deleted_at: null,
  saldoInicial: 0,
  saldoFinal: 0,
  created_at: new Date().toISOString(),
  diferenca: 0,
};

// Error Boundary Component deve ser definido fora do componente principal
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erro capturado em ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card style={{ marginTop: 16 }}>
          <Result
            status="warning"
            title="Componente não pôde ser carregado"
            subTitle="Ocorreu um erro ao renderizar este componente."
            extra={
              <Button
                type="primary"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Tentar novamente
              </Button>
            }
          />
        </Card>
      );
    }

    return this.props.children;
  }
}

// Funções de utilidade movidas para fora do componente
const formatDate = (dateString) => {
  if (!dateString) return "Data indisponível";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data inválida";

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "Erro ao formatar data";
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return "Data/hora indisponível";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data/hora inválida";

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Erro ao formatar data/hora:", error);
    return "Erro ao formatar data/hora";
  }
};

// Componentes estáveis que não precisam ser recriados em cada renderização
const StatCardSkeleton = () => (
  <Card bordered={false} style={{ height: "100%" }}>
    <Skeleton active paragraph={{ rows: 1 }} />
    <div style={{ marginTop: 30 }}>
      <Skeleton.Button active size="small" style={{ width: 150 }} />
    </div>
  </Card>
);

function Dashboard() {
  // Estados
  const [dataDash, setDataDash] = useState(defaultDashData);
  const [caixaData, setCaixaData] = useState(defaultCaixaData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inicialização do ChartistGraph - movida para fora de qualquer hook ou função condicional
  // Esta é uma definição constante que não muda entre renderizações
  const ChartistGraph = React.useMemo(() => {
    try {
      // Certifique-se de que o require é chamado no nível superior, não condicionalmente
      return require("react-chartist")?.default;
    } catch (error) {
      console.error("Não foi possível carregar o react-chartist:", error);
      return null;
    }
  }, []);

  // Fetch dashboard data com useCallback para estabilidade entre renderizações
  const getDataDash = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resultD = await getDashboard();
      if (resultD?.success) {
        // Validamos os dados recebidos
        const data = resultD.data || defaultDashData;

        // Garantimos que todos os campos existam
        setDataDash({
          ...defaultDashData,
          ...data,
          // Garantir que arrays não sejam undefined
          produtosVendidos: data.produtosVendidos || [],
          dias: data.dias || [],
          servicosValues: data.servicosValues || [],
          fullValues: data.fullValues || [],
          produtosValues: data.produtosValues || [],
          meses: data.meses || [],
          mesesSerValues: data.mesesSerValues || [],
          mesesPrdValues: data.mesesPrdValues || [],
          despesa: data.despesa || [{ total: 0 }],
        });
      } else {
        throw new Error("Falha ao obter dados do dashboard");
      }
    } catch (error) {
      console.error("Dashboard error:", error);
      setError(error?.message || "Erro ao carregar o dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect para carregar dados - sempre use como dependência as funções que você chama
  useEffect(() => {
    getDataDash();
  }, [getDataDash]); // Agora getDataDash é estável entre renderizações

  // Calculate cash register operation duration com base em caixaData
  const calculateDuration = React.useCallback(() => {
    try {
      if (!caixaData.abertura_data || !caixaData.fechamento_data) {
        return "Dados insuficientes";
      }

      const start = new Date(caixaData.abertura_data);
      const end = new Date(caixaData.fechamento_data);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Datas inválidas";
      }

      const durationMs = end - start;
      if (durationMs < 0) return "Período inválido";

      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

      return `${hours}h ${minutes}min`;
    } catch (error) {
      console.error("Erro ao calcular duração:", error);
      return "Erro ao calcular duração";
    }
  }, [caixaData.abertura_data, caixaData.fechamento_data]);

  // Component para StatCard - definida como constante para não ser recriada
  const StatCard = React.memo(({ title, value, icon, color }) => (
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
          <Text type="secondary">
            {loading ? "Atualizando..." : "Atualizado agora"}
          </Text>
        </Space>
      </div>
    </Card>
  ));

  // Componentes que dependem de dados - usando React.memo para evitar re-renderizações desnecessárias
  const PieChartVisual = React.memo(() => {
    // Handling for empty or invalid data
    if (!dataDash.totalProdutos && !dataDash.totalServicos) {
      return (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Text type="secondary">Sem dados disponíveis para visualização</Text>
        </div>
      );
    }

    // Safe calculation for percentages
    const total = (dataDash.totalProdutos || 0) + (dataDash.totalServicos || 0);
    const pP =
      total > 0 ? +((dataDash.totalProdutos * 100) / total).toFixed(2) : 0;
    const pS =
      total > 0 ? +((dataDash.totalServicos * 100) / total).toFixed(2) : 0;

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
                <div>
                  <Text>{toMoneyFormat(dataDash.totalProdutos || 0)}</Text>
                </div>
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
                <div>
                  <Text>{toMoneyFormat(dataDash.totalServicos || 0)}</Text>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  });

  // Monthly sales summary - memorizando o componente
  const MonthlySalesVisual = React.memo(() => {
    // Handling for empty data
    if (!dataDash.meses || dataDash.meses.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Text type="secondary">Sem dados de vendas mensais disponíveis</Text>
        </div>
      );
    }

    return (
      <div style={{ padding: "10px 0" }}>
        {dataDash.meses.map((month, index) => {
          // Safe access with fallbacks for all values
          const serValue =
            (dataDash.mesesSerValues && dataDash.mesesSerValues[index]) || 0;
          const prdValue =
            (dataDash.mesesPrdValues && dataDash.mesesPrdValues[index]) || 0;
          const total = serValue + prdValue;

          // Calculate percentages safely
          const serPercent = total > 0 ? (serValue / total) * 100 : 0;
          const prdPercent = total > 0 ? (prdValue / total) * 100 : 0;

          return (
            <div key={month || `month-${index}`} style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text strong>{month || `Mês ${index + 1}`}</Text>
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
  });

  // Alternative line chart implementation
  const SimpleLineChart = React.memo(({ data }) => {
    // Safety check for data
    if (
      !data ||
      !data.labels ||
      !data.labels.length ||
      !data.series ||
      !data.series.length
    ) {
      return (
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <Text type="secondary">Dados insuficientes para gerar o gráfico</Text>
        </div>
      );
    }

    const { labels, series } = data;
    const [totalSeries, servicosSeries, produtosSeries] = series;

    // Find max value for scaling
    const allValues = [
      ...totalSeries,
      ...servicosSeries,
      ...produtosSeries,
    ].filter((val) => !isNaN(val));
    const maxValue = allValues.length ? Math.max(...allValues) : 0;

    return (
      <div style={{ padding: "10px 0" }}>
        <div
          style={{
            display: "flex",
            height: "200px",
            marginTop: 20,
            alignItems: "flex-end",
          }}
        >
          {labels.map((label, index) => {
            const totalValue = totalSeries[index] || 0;
            const servicosValue = servicosSeries[index] || 0;
            const produtosValue = produtosSeries[index] || 0;

            // Calculate heights based on the max value
            const totalHeight =
              maxValue > 0 ? (totalValue / maxValue) * 150 : 0;
            const servicosHeight =
              maxValue > 0 ? (servicosValue / maxValue) * 150 : 0;
            const produtosHeight =
              maxValue > 0 ? (produtosValue / maxValue) * 150 : 0;

            return (
              <div
                key={label || `label-${index}`}
                style={{ flex: 1, textAlign: "center", margin: "0 4px" }}
              >
                <Tooltip
                  title={`Total: ${toMoneyFormat(
                    totalValue
                  )}, Serviços: ${toMoneyFormat(
                    servicosValue
                  )}, Produtos: ${toMoneyFormat(produtosValue)}`}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        height: totalHeight,
                        width: 10,
                        backgroundColor: "#1890ff",
                        borderRadius: "2px 2px 0 0",
                        marginBottom: 5,
                      }}
                    />
                    <Text style={{ fontSize: 10, width: 30 }}>{label}</Text>
                  </div>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </div>
    );
  });

  // Render chart function
  const renderChart = React.useCallback(() => {
    const chartData = {
      labels: dataDash.dias || [],
      series: [
        dataDash.fullValues || [],
        dataDash.servicosValues || [],
        dataDash.produtosValues || [],
      ],
    };

    // Render alternative chart if Chartist is not available
    if (!ChartistGraph) {
      return <SimpleLineChart data={chartData} />;
    }

    // Handle empty data case
    if (!chartData.labels.length || !chartData.series[0].length) {
      return (
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <Text type="secondary">Sem dados disponíveis para o gráfico</Text>
        </div>
      );
    }

    // Calculate safe high value to avoid chart issues
    const safeValues = chartData.series[0].filter((val) => !isNaN(val));
    const safeHighValue = safeValues.length
      ? Math.max(...safeValues) + 50
      : 100;

    return (
      <div className="ct-chart" id="chartHours">
        <ChartistGraph
          data={chartData}
          type="Line"
          style={{ zoom: "95%" }}
          options={{
            low: 0,
            high: safeHighValue,
            showArea: false,
            height: "200px",
            axisX: {
              showGrid: false,
              labelOffset: {
                x: 0,
                y: 5,
              },
              labelInterpolationFnc: function (value) {
                return value && typeof value === "string"
                  ? value.substring(0, 2)
                  : "";
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
              bottom: 30,
            },
          }}
          responsiveOptions={[
            [
              "screen and (max-width: 640px)",
              {
                axisX: {
                  labelInterpolationFnc: function (value) {
                    return value && typeof value === "string" ? value[0] : "";
                  },
                },
              },
            ],
          ]}
        />
      </div>
    );
  }, [
    ChartistGraph,
    dataDash.dias,
    dataDash.fullValues,
    dataDash.servicosValues,
    dataDash.produtosValues,
  ]);

  // Error display component
  const ErrorDisplay = React.memo(({ message, onRetry }) => (
    <Result
      status="warning"
      title="Problema ao carregar os dados"
      subTitle={message || "Ocorreu um erro ao carregar os dados do dashboard."}
      extra={
        <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
          Tentar novamente
        </Button>
      }
    />
  ));

  // Render main component
  return (
    <div
      className="dashboard-container"
      style={{ padding: 24, background: "#f0f2f5", minHeight: "100vh" }}
    >
      <Title level={2} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      {error ? (
        <ErrorDisplay message={error} onRetry={getDataDash} />
      ) : (
        <>
          {/* Stats Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              {loading ? (
                <StatCardSkeleton />
              ) : (
                <StatCard
                  title={`Dias trabalhados ${monthName(new Date().getMonth())}`}
                  value={`${dataDash.dias?.length || 0} dias`}
                  icon={<CalendarOutlined />}
                  color="#1890ff"
                />
              )}
            </Col>

            <Col xs={24} sm={12} lg={6}>
              {loading ? (
                <StatCardSkeleton />
              ) : (
                <StatCard
                  title={`Vendas ${monthName(new Date().getMonth())}`}
                  value={toMoneyFormat(dataDash.totalEsseMes || 0)}
                  icon={<DollarOutlined />}
                  color="#52c41a"
                />
              )}
            </Col>

            <Col xs={24} sm={12} lg={6}>
              {loading ? (
                <StatCardSkeleton />
              ) : (
                <StatCard
                  title="Vendas Hoje"
                  value={toMoneyFormat(dataDash.totalHoje || 0)}
                  icon={<ShoppingOutlined />}
                  color="#722ed1"
                />
              )}
            </Col>

            <Col xs={24} sm={12} lg={6}>
              {loading ? (
                <StatCardSkeleton />
              ) : (
                <StatCard
                  title={`Despesas ${monthName(new Date().getMonth())}`}
                  value={toMoneyFormat(dataDash?.despesa?.[0]?.total || 0)}
                  icon={<DollarOutlined />}
                  color="#f5222d"
                />
              )}
            </Col>
          </Row>

          {/* Main Content */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {/* Left Column - Daily Sales Chart */}
            <Col xs={24} lg={16}>
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
                  {renderChart()}
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

            {/* Right Column - Revenue Division Chart */}
            <Col xs={24} lg={8}>
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

          {/* Top Selling Items Component with Error Boundary and Suspense */}
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          ) : (
            <ErrorBoundary>
              <React.Suspense
                fallback={
                  <Card>
                    <Skeleton active paragraph={{ rows: 6 }} />
                    <div style={{ textAlign: "center", marginTop: 16 }}>
                      <Text type="secondary">
                        Carregando itens mais vendidos...
                      </Text>
                    </div>
                  </Card>
                }
              >
                <TopSellingItemsDashboard
                  defaultDateRange={[
                    moment().startOf("month"),
                    moment().endOf("month"),
                  ]}
                />
              </React.Suspense>
            </ErrorBoundary>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
