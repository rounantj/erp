import React, { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Statistic,
  Row,
  Col,
  DatePicker,
  Spin,
  Empty,
  Typography,
  Divider,
  Table,
  Progress,
  Tabs,
  Tag,
  Space,
  notification,
  Badge,
  Alert,
  Button,
} from "antd";
import {
  BarChartOutlined,
  ShoppingOutlined,
  DollarOutlined,
  RiseOutlined,
  CalendarOutlined,
  CrownOutlined,
  GiftOutlined,
  ToolOutlined,
  FileSearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  TableOutlined,
  AreaChartOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/pt-br";
import { toMoneyFormat } from "helpers/formatters";
import { Column } from "@ant-design/plots";
import { getTopSellers } from "helpers/api-integrator";

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

// Cores para os gráficos
const CHART_COLORS = {
  produtos: "#1890ff",
  servicos: "#52c41a",
  barBackground: "#f0f2f5",
  rangeColors: ["#91d5ff", "#1890ff", "#096dd9"],
};

// Função formatadora segura
const safeMoneyFormat = (value) => {
  const formatted = toMoneyFormat(value);
  return typeof formatted === "string" ? formatted.replace("R$", "") : "0,00";
};

const TopSellingItemsDashboard = ({ defaultDateRange = null }) => {
  // Calculando o período padrão (mês atual) com segurança
  const startOfMonth = moment().startOf("month");
  const endOfMonth = moment().endOf("month");

  // Estado para o filtro de datas com verificação de segurança
  const [dateRange, setDateRange] = useState(() => {
    try {
      // Verificar se defaultDateRange é válido
      if (
        Array.isArray(defaultDateRange) &&
        defaultDateRange.length === 2 &&
        moment.isMoment(defaultDateRange[0]) &&
        moment.isMoment(defaultDateRange[1])
      ) {
        return defaultDateRange;
      }
      // Caso contrário, usar o mês atual
      return [startOfMonth, endOfMonth];
    } catch (e) {
      console.warn("Erro ao processar dateRange:", e);
      return [startOfMonth, endOfMonth];
    }
  });

  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedTab, setSelectedTab] = useState("produtos");
  const [selectedRanking, setSelectedRanking] = useState("quantidade");
  const [viewMode, setViewMode] = useState("chart"); // 'chart' ou 'table'

  // Detecta se é dispositivo móvel ou tela pequena (4:3)
  const [screenSize, setScreenSize] = useState({
    isMobile: window.innerWidth < 768,
    isSmall: window.innerWidth < 1024 || window.innerHeight < 768,
  });

  // Monitora o tamanho da tela para responsividade
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        isMobile: window.innerWidth < 768,
        isSmall: window.innerWidth < 1024 || window.innerHeight < 768,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Buscar dados do dashboard quando o período mudar
  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  // Função para buscar dados da API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificação de segurança para dateRange
      if (!dateRange || !Array.isArray(dateRange) || dateRange.length !== 2) {
        throw new Error("Período inválido");
      }

      const [startDate, endDate] = dateRange;

      // Verificação para garantir que são objetos Moment válidos
      if (!moment.isMoment(startDate) || !moment.isMoment(endDate)) {
        throw new Error("Datas inválidas");
      }

      const formattedStartDate = startDate.format("YYYY-MM-DD");
      const formattedEndDate = endDate.format("YYYY-MM-DD");

      const response = await getTopSellers(
        formattedStartDate,
        formattedEndDate
      );

      if (response.data) {
        // Log para debug dos serviços
        console.log("Dados recebidos da API:", response.data);
        console.log("Serviços:", response.data.rankings.servicosPorQuantidade);
        console.log("Total serviços:", response.data.resumo.totalServicos);

        setDashboardData(response.data);
      } else {
        throw new Error("Dados não encontrados");
      }
    } catch (err) {
      console.error("Erro ao buscar dados do dashboard:", err);
      setError(err.message || "Falha ao carregar dados do dashboard");
      notification.error({
        message: "Erro ao carregar dashboard",
        description:
          err.message ||
          "Não foi possível carregar os dados dos produtos mais vendidos.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar o período
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
    }
  };

  // Configuração para gráfico de barras - Produtos por Quantidade
  const getBarChartConfig = (data, valueField, titleText) => {
    return {
      data,
      xField: "value",
      yField: "name",
      seriesField: "name",
      legend: false,
      xAxis: {
        label: {
          formatter: (v) =>
            valueField === "valor_total_vendido" ? toMoneyFormat(v) : v,
        },
      },
      yAxis: {
        label: {
          formatter: (v) => {
            // Limitar tamanho do texto para não sobrecarregar o gráfico
            if (v.length > 25) {
              return v.substring(0, 22) + "...";
            }
            return v;
          },
        },
      },
      maxBarWidth: 20,
      barBackground: {
        style: {
          fill: CHART_COLORS.barBackground,
        },
      },
      color: ({ name }) => {
        const colors =
          selectedTab === "produtos"
            ? ["#1890ff", "#36cfc9", "#73d13d", "#52c41a", "#1890ff"]
            : ["#52c41a", "#73d13d", "#36cfc9", "#1890ff", "#52c41a"];

        // Escala de cores com base na posição
        const index = data.findIndex((item) => item.name === name);
        const colorIndex = Math.min(index, colors.length - 1);
        return colors[colorIndex];
      },
      title: {
        visible: true,
        text: titleText,
      },
      interactions: [{ type: "active-region" }],
      tooltip: {
        formatter: (datum) => {
          return {
            name: datum.name,
            value:
              valueField === "valor_total_vendido"
                ? toMoneyFormat(datum.value)
                : datum.value,
          };
        },
      },
    };
  };

  // Prepara dados para o gráfico de barras
  const prepareChartData = (items, field) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.warn("Dados vazios ou inválidos para o gráfico:", items);
      return [];
    }
    console.log({ items });

    return items
      .map((item) => ({
        name: item.produto_descricao,
        value:
          field === "valor_total_vendido"
            ? parseFloat(item.valor_total_vendido) || 0
            : parseInt(item.total_quantidade) || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  // Componente de resumo superior
  const SummaryStats = () => {
    if (!dashboardData || !dashboardData.resumo) return null;

    const { resumo, periodo } = dashboardData;

    // Garante que os valores sejam numbers e não sejam NaN
    const totalVendas = parseFloat(resumo.totalVendas) || 0;
    const totalProdutos = parseFloat(resumo.totalProdutos) || 0;
    const totalServicos = parseFloat(resumo.totalServicos) || 0;
    const qtdProdutos = parseInt(resumo.totalQuantidadeProdutos) || 0;
    const qtdServicos = parseInt(resumo.totalQuantidadeServicos) || 0;

    // Calcular percentuais com segurança contra divisão por zero
    const total = totalProdutos + totalServicos;
    const percProdutos = total > 0 ? (totalProdutos / total) * 100 : 0;
    const percServicos = total > 0 ? (totalServicos / total) * 100 : 0;

    return (
      <Row gutter={[16, 16]}>
        {/* <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total de Vendas"
              value={totalVendas}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#3f8600" }}
              formatter={safeMoneyFormat}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="blue">{periodo.diasTotal} dias</Tag>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {moment(periodo.inicio).format("DD/MM/YYYY")} a{" "}
                {moment(periodo.fim).format("DD/MM/YYYY")}
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Produtos"
              value={totalProdutos}
              precision={2}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: "#1890ff" }}
              formatter={safeMoneyFormat}
            />
            <Progress
              percent={Math.round(percProdutos)}
              size="small"
              status="active"
              strokeColor="#1890ff"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Serviços"
              value={totalServicos}
              precision={2}
              prefix={<ToolOutlined />}
              valueStyle={{ color: "#52c41a" }}
              formatter={safeMoneyFormat}
            />
            <Progress
              percent={Math.round(percServicos)}
              size="small"
              status="active"
              strokeColor="#52c41a"
            />
          </Card>
        </Col> */}

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Itens Vendidos"
              value={qtdProdutos + qtdServicos}
              prefix={<GiftOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
            <div style={{ marginTop: 8 }}>
              <Badge
                color="#1890ff"
                text={`${qtdProdutos} produtos`}
                style={{ marginRight: 8 }}
              />
              <Badge color="#52c41a" text={`${qtdServicos} serviços`} />
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  // Componentes de tabelas de ranking
  const RankingTable = ({ data, isValueRanking = false }) => {
    // Verifica e trata dados inválidos
    if (!data || !Array.isArray(data) || data.length === 0) {
      return <Empty description="Sem dados disponíveis" />;
    }

    const columns = [
      {
        title: "Ranking",
        dataIndex: isValueRanking
          ? "ranking_por_valor"
          : "ranking_por_quantidade",
        key: "ranking",
        width: 70,
        render: (rank) => (
          <div style={{ textAlign: "center", fontWeight: "bold" }}>
            {rank <= 3 ? (
              <Badge
                count={rank}
                style={{
                  backgroundColor:
                    rank === 1 ? "#f5b700" : rank === 2 ? "#a0a0a0" : "#cd7f32",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              />
            ) : (
              rank
            )}
          </div>
        ),
        sorter: (a, b) =>
          a[isValueRanking ? "ranking_por_valor" : "ranking_por_quantidade"] -
          b[isValueRanking ? "ranking_por_valor" : "ranking_por_quantidade"],
      },
      {
        title: "Descrição",
        dataIndex: "produto_descricao",
        key: "descricao",
        ellipsis: true,
        render: (text, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{text?.toUpperCase()}</Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.categoria?.toUpperCase()}
            </Text>
          </Space>
        ),
      },
      {
        title: isValueRanking ? "Valor Total" : "Quantidade",
        dataIndex: isValueRanking ? "valor_total_vendido" : "total_quantidade",
        key: isValueRanking ? "valor" : "quantidade",
        width: 100,
        render: (text, record) => (isValueRanking ? toMoneyFormat(text) : text),
        sorter: (a, b) =>
          isValueRanking
            ? parseFloat(b.valor_total_vendido || 0) -
              parseFloat(a.valor_total_vendido || 0)
            : parseFloat(b.total_quantidade || 0) -
              parseFloat(a.total_quantidade || 0),
      },
      {
        title: isValueRanking ? "Qtd" : "Valor Unitário",
        dataIndex: isValueRanking ? "total_quantidade" : "preco_unitario",
        key: isValueRanking ? "qtd" : "preco",
        width: 100,
        render: (text, record) => (isValueRanking ? text : toMoneyFormat(text)),
      },
    ];

    // Se for tela pequena, reduzir colunas
    const mobileColumns = screenSize.isMobile
      ? columns.filter((col, index) => index !== 3)
      : columns;

    return (
      <Table
        dataSource={data.map((item) => ({ ...item, key: item.produto_id }))}
        columns={mobileColumns}
        size={screenSize.isSmall ? "small" : "middle"}
        pagination={{
          pageSize: screenSize.isSmall ? 5 : 10,
          size: screenSize.isSmall ? "small" : "default",
        }}
        scroll={{ x: "max-content" }}
      />
    );
  };

  // Alternância de visualização: gráfico ou tabela
  const ToggleViewButton = () => (
    <Button
      type="primary"
      shape="round"
      icon={viewMode === "chart" ? <TableOutlined /> : <AreaChartOutlined />}
      onClick={() => setViewMode(viewMode === "chart" ? "table" : "chart")}
      style={{ marginBottom: 16 }}
    >
      {viewMode === "chart" ? "Ver Tabela" : "Ver Gráfico"}
    </Button>
  );

  // Renderização condicional de gráficos ou tabelas
  const RenderContent = ({ type, valueType }) => {
    const dataSource =
      type === "produtos"
        ? valueType === "quantidade"
          ? dashboardData.rankings.produtosPorQuantidade
          : dashboardData.rankings.produtosPorValor
        : valueType === "quantidade"
        ? dashboardData.rankings.servicosPorQuantidade
        : dashboardData.rankings.servicosPorValor;

    const title = `Top 10 ${
      type === "produtos" ? "Produtos" : "Serviços"
    } por ${valueType === "quantidade" ? "Quantidade" : "Valor"}`;

    const chartData = prepareChartData(
      dataSource,
      valueType === "quantidade" ? "total_quantidade" : "valor_total_vendido"
    );

    // Se não tiver dados para mostrar
    if (!dataSource || dataSource.length === 0) {
      return (
        <Empty
          description={`Sem dados de ${type} para o período selecionado`}
        />
      );
    }

    if (viewMode === "chart") {
      return (
        <div style={{ height: screenSize.isSmall ? 300 : 400 }}>
          <Column
            {...getBarChartConfig(
              chartData,
              valueType === "quantidade"
                ? "total_quantidade"
                : "valor_total_vendido",
              title
            )}
          />
        </div>
      );
    } else {
      return (
        <RankingTable
          data={dataSource}
          isValueRanking={valueType === "valor"}
        />
      );
    }
  };

  // Componente principal do dashboard
  return (
    <Layout style={{ background: "#f0f2f5", minHeight: "100vh" }}>
      <Content style={{ padding: screenSize.isMobile ? "8px" : "16px" }}>
        <Card>
          <div style={{ marginBottom: 20 }}>
            <Row justify="space-between" align="middle" wrap gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Title
                  level={screenSize.isMobile ? 4 : 3}
                  style={{ margin: 0 }}
                >
                  <CrownOutlined /> Ranking de Vendas
                </Title>
                <Text type="secondary">Produtos e serviços mais vendidos</Text>
              </Col>
              <Col xs={24} md={12}>
                <Row justify="end">
                  <Space wrap align="end" size={16}>
                    <RangePicker
                      value={dateRange}
                      onChange={handleDateRangeChange}
                      format="DD/MM/YYYY"
                      allowClear={false}
                      style={{
                        maxWidth: screenSize.isMobile ? "100%" : "auto",
                      }}
                      ranges={{
                        Hoje: [moment().startOf("day"), moment().endOf("day")],
                        "Esta Semana": [
                          moment().startOf("week"),
                          moment().endOf("week"),
                        ],
                        "Este Mês": [
                          moment().startOf("month"),
                          moment().endOf("month"),
                        ],
                        "Último Mês": [
                          moment().subtract(1, "month").startOf("month"),
                          moment().subtract(1, "month").endOf("month"),
                        ],
                        "Este Ano": [
                          moment().startOf("year"),
                          moment().endOf("year"),
                        ],
                      }}
                    />
                    <Badge
                      count={<CalendarOutlined style={{ color: "#1890ff" }} />}
                      style={{ backgroundColor: "white" }}
                    />
                  </Space>
                </Row>
              </Col>
            </Row>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">Carregando dados do dashboard...</Text>
              </div>
            </div>
          ) : error ? (
            <Alert
              message="Erro ao carregar dados"
              description={error}
              type="error"
              showIcon
            />
          ) : !dashboardData ? (
            <Empty description="Sem dados para o período selecionado" />
          ) : (
            <>
              <SummaryStats />

              <Divider style={{ margin: "24px 0 16px" }} />

              {/* Botão para alternar entre gráfico e tabela em telas pequenas */}
              {screenSize.isSmall && (
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <ToggleViewButton />
                </div>
              )}

              <Tabs defaultActiveKey="produtos" onChange={setSelectedTab}>
                <TabPane
                  tab={
                    <span>
                      <ShoppingOutlined /> Produtos
                    </span>
                  }
                  key="produtos"
                >
                  <Card style={{ marginBottom: 16 }}>
                    <Tabs
                      defaultActiveKey="quantidade"
                      onChange={setSelectedRanking}
                      tabPosition={screenSize.isSmall ? "top" : "right"}
                    >
                      <TabPane
                        tab={
                          <span>
                            <SortDescendingOutlined /> Por Quantidade
                          </span>
                        }
                        key="quantidade"
                      >
                        {/* Layout vertical com gráfico acima da tabela para todos os tamanhos de tela */}
                        <Row gutter={[0, 24]}>
                          {/* Gráfico em linha cheia */}
                          <Col span={24}>
                            <div
                              style={{
                                height: screenSize.isSmall ? 250 : 300,
                                marginBottom: 16,
                              }}
                            >
                              <Column
                                {...getBarChartConfig(
                                  prepareChartData(
                                    dashboardData.rankings
                                      .produtosPorQuantidade,
                                    "total_quantidade"
                                  ),
                                  "total_quantidade",
                                  "Top 10 Produtos por Quantidade"
                                )}
                              />
                            </div>
                          </Col>

                          {/* Tabela em linha cheia */}
                          <Col span={24}>
                            <RankingTable
                              data={
                                dashboardData.rankings.produtosPorQuantidade
                              }
                              isValueRanking={false}
                            />
                          </Col>
                        </Row>
                      </TabPane>
                      <TabPane
                        tab={
                          <span>
                            <DollarOutlined /> Por Valor
                          </span>
                        }
                        key="valor"
                      >
                        {/* Layout vertical com gráfico acima da tabela */}
                        <Row gutter={[0, 24]}>
                          {/* Gráfico em linha cheia */}
                          <Col span={24}>
                            <div
                              style={{
                                height: screenSize.isSmall ? 250 : 300,
                                marginBottom: 16,
                              }}
                            >
                              <Column
                                {...getBarChartConfig(
                                  prepareChartData(
                                    dashboardData.rankings.produtosPorValor,
                                    "valor_total_vendido"
                                  ),
                                  "valor_total_vendido",
                                  "Top 10 Produtos por Valor"
                                )}
                              />
                            </div>
                          </Col>

                          {/* Tabela em linha cheia */}
                          <Col span={24}>
                            <RankingTable
                              data={dashboardData.rankings.produtosPorValor}
                              isValueRanking={true}
                            />
                          </Col>
                        </Row>
                      </TabPane>
                    </Tabs>
                  </Card>
                </TabPane>

                <TabPane
                  tab={
                    <span>
                      <ToolOutlined /> Serviços
                    </span>
                  }
                  key="servicos"
                >
                  <Card style={{ marginBottom: 16 }}>
                    <Tabs
                      defaultActiveKey="quantidade"
                      onChange={setSelectedRanking}
                      tabPosition={screenSize.isSmall ? "top" : "right"}
                    >
                      <TabPane
                        tab={
                          <span>
                            <SortDescendingOutlined /> Por Quantidade
                          </span>
                        }
                        key="quantidade"
                      >
                        {/* Layout vertical com gráfico acima da tabela */}
                        <Row gutter={[0, 24]}>
                          {/* Gráfico em linha cheia */}
                          <Col span={24}>
                            <div
                              style={{
                                height: screenSize.isSmall ? 250 : 300,
                                marginBottom: 16,
                              }}
                            >
                              <Column
                                {...getBarChartConfig(
                                  prepareChartData(
                                    dashboardData.rankings
                                      .servicosPorQuantidade,
                                    "total_quantidade"
                                  ),
                                  "total_quantidade",
                                  "Top 10 Serviços por Quantidade"
                                )}
                              />
                            </div>
                          </Col>

                          {/* Tabela em linha cheia */}
                          <Col span={24}>
                            <RankingTable
                              data={
                                dashboardData.rankings.servicosPorQuantidade
                              }
                              isValueRanking={false}
                            />
                          </Col>
                        </Row>
                      </TabPane>
                      <TabPane
                        tab={
                          <span>
                            <DollarOutlined /> Por Valor
                          </span>
                        }
                        key="valor"
                      >
                        {/* Layout vertical com gráfico acima da tabela */}
                        <Row gutter={[0, 24]}>
                          {/* Gráfico em linha cheia */}
                          <Col span={24}>
                            <div
                              style={{
                                height: screenSize.isSmall ? 250 : 300,
                                marginBottom: 16,
                              }}
                            >
                              <Column
                                {...getBarChartConfig(
                                  prepareChartData(
                                    dashboardData.rankings.servicosPorValor,
                                    "valor_total_vendido"
                                  ),
                                  "valor_total_vendido",
                                  "Top 10 Serviços por Valor"
                                )}
                              />
                            </div>
                          </Col>

                          {/* Tabela em linha cheia */}
                          <Col span={24}>
                            <RankingTable
                              data={dashboardData.rankings.servicosPorValor}
                              isValueRanking={true}
                            />
                          </Col>
                        </Row>
                      </TabPane>
                    </Tabs>
                  </Card>
                </TabPane>
              </Tabs>

              <div style={{ marginTop: 24, textAlign: "center" }}>
                <Text type="secondary">
                  Dados referentes ao período de{" "}
                  {moment(dashboardData.periodo.inicio).format("DD/MM/YYYY")} a{" "}
                  {moment(dashboardData.periodo.fim).format("DD/MM/YYYY")}.
                  Total de {dashboardData.periodo.diasTotal} dias analisados.
                </Text>
              </div>
            </>
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default TopSellingItemsDashboard;
