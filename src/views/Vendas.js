import { getSells } from "helpers/api-integrator";
import { toDateFormat, toMoneyFormat } from "helpers/formatters";
import React, { useEffect, useState, useRef } from "react";
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
  Space,
  Tag,
  Empty,
  Spin,
  Button,
  Drawer,
} from "antd";
import {
  BarChartOutlined,
  CalendarOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  FilterOutlined,
} from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Content } = Layout;

// Função para calcular o total da venda com desconto
export const calcularTotal = (valor, desconto) => {
  return +valor - +desconto;
};

function Vendas() {
  // Estados
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(moment().subtract(1, "month"));
  const [endDate, setEndDate] = useState(moment().add(10, "day"));
  const [isMobile, setIsMobile] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);

  const columnsVendas = [
    {
      title: "Data",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => toDateFormat(text, !isMobile),
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
      responsive: ["md"],
    },
    {
      title: "Cliente",
      dataIndex: "nome_cliente",
      key: "nome_cliente",
      render: (text) => (
        <Space>
          <UserOutlined />
          <span
            className="mobile-ellipsis"
            style={{
              maxWidth: isMobile ? "120px" : "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            {text}
          </span>
        </Space>
      ),
    },
    {
      title: "Total",
      key: "totalComDesconto",
      render: (_, record) => {
        const total = calcularTotal(record.total, record.desconto);
        return <Text strong>{toMoneyFormat(total)}</Text>;
      },
      sorter: (a, b) =>
        calcularTotal(a.total, a.desconto) - calcularTotal(b.total, b.desconto),
    },
    {
      title: "Data",
      dataIndex: "createdAt",
      key: "createdAtMobile",
      render: (text) => toDateFormat(text, false),
      responsive: ["xs", "sm"],
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

  // Colunas para a tabela de vendas - responsive

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
        setVendas(items.data);
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

  return (
    <ConfigProvider locale={ptBR}>
      <Layout
        style={{
          background: "#f0f2f5",
          minHeight: "100vh",
          padding: isMobile ? "8px" : "16px",
        }}
        ref={containerRef}
      >
        <Content>
          <Card bodyStyle={{ padding: isMobile ? "12px" : "24px" }}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Row justify="space-between" align="middle" gutter={[8, 8]}>
                <Col xs={16} sm={16}>
                  <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
                    <ShoppingCartOutlined /> Gestão de Vendas
                  </Title>
                </Col>
                <Col xs={8} sm={8} style={{ textAlign: "right" }}>
                  {isMobile ? (
                    <Button
                      type="primary"
                      icon={<FilterOutlined />}
                      onClick={() => setFilterDrawerVisible(true)}
                    >
                      Filtrar
                    </Button>
                  ) : (
                    <Space align="center">
                      <CalendarOutlined />
                      <Text>Período: </Text>
                      <RangePicker
                        allowClear={false}
                        value={[startDate, endDate]}
                        onChange={handleDateChange}
                        format="DD/MM/YYYY"
                        ranges={{
                          Hoje: [
                            moment().startOf("day"),
                            moment().endOf("day"),
                          ],
                          "Últimos 7 dias": [
                            moment().subtract(6, "days").startOf("day"),
                            moment().endOf("day"),
                          ],
                          "Últimos 30 dias": [
                            moment().subtract(29, "days").startOf("day"),
                            moment().endOf("day"),
                          ],
                          "Este mês": [
                            moment().startOf("month"),
                            moment().endOf("month"),
                          ],
                          "Mês passado": [
                            moment().subtract(1, "month").startOf("month"),
                            moment().subtract(1, "month").endOf("month"),
                          ],
                        }}
                        style={{ width: 300 }}
                      />
                    </Space>
                  )}
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
                      <Card bodyStyle={{ padding: isMobile ? "12px" : "24px" }}>
                        <Statistic
                          title="Total do Período"
                          value={calcularTotalPorPeriodo()}
                          prefix={<DollarOutlined />}
                          formatter={moneyFormatter}
                          valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
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
                      <Card bodyStyle={{ padding: isMobile ? "12px" : "24px" }}>
                        <Statistic
                          title="Número de Vendas"
                          value={vendas.length}
                          prefix={<ShoppingCartOutlined />}
                          valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <Card bodyStyle={{ padding: isMobile ? "12px" : "24px" }}>
                        <Statistic
                          title="Clientes Únicos"
                          value={calcularClientesUnicos()}
                          prefix={<UserOutlined />}
                          valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <Card bodyStyle={{ padding: isMobile ? "12px" : "24px" }}>
                        <Statistic
                          title="Valor Médio"
                          value={calcularValorMedioPorVenda()}
                          prefix={<BarChartOutlined />}
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

                  <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <>
                            <BarChartOutlined /> Totais por Dia
                          </>
                        }
                        style={{ height: "100%" }}
                        bodyStyle={{ padding: isMobile ? "8px" : "24px" }}
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
                        bodyStyle={{ padding: isMobile ? "8px" : "24px" }}
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
                                    <Tag color="blue">
                                      {vendasCliente.length} venda(s)
                                    </Tag>
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
                        pageSize: isMobile ? 5 : 10,
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

      {/* Drawer para filtros em dispositivos móveis */}
      <DateFilterDrawer />

      {/* CSS para responsividade adicional */}
      <style jsx global>{`
        .responsive-table-container {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
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
        }
      `}</style>
    </ConfigProvider>
  );
}

export default Vendas;
