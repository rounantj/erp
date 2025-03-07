import { getSells } from "helpers/api-integrator";
import { toDateFormat, toMoneyFormat } from "helpers/formatters";
import React, { useEffect, useState } from "react";
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
} from "antd";
import {
  BarChartOutlined,
  CalendarOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Content } = Layout;

// Função para calcular o total da venda com desconto
const calcularTotal = (valor, desconto) => {
  return +valor - +desconto;
};

// Colunas para a tabela de vendas
export const columnsVendas = [
  {
    title: "Data",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (text) => toDateFormat(text, true),
    sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
  },
  {
    title: "Cliente",
    dataIndex: "nome_cliente",
    key: "nome_cliente",
    render: (text) => (
      <Space>
        <UserOutlined />
        {text}
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
];

function Vendas() {
  // Estados
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(moment().subtract(1, "month"));
  const [endDate, setEndDate] = useState(moment().add(10, "day"));

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

  return (
    <ConfigProvider locale={ptBR}>
      <Layout
        style={{ background: "#f0f2f5", minHeight: "100vh", padding: "16px" }}
      >
        <Content>
          <Card>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={4} style={{ margin: 0 }}>
                    <ShoppingCartOutlined /> Gestão de Vendas
                  </Title>
                </Col>
                <Col>
                  <Space align="center">
                    <CalendarOutlined />
                    <Text>Período: </Text>
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
                </Col>
              </Row>

              <Divider />

              {loading ? (
                <div style={{ textAlign: "center", padding: "50px" }}>
                  <Spin size="large" />
                </div>
              ) : (
                <>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                      <Card>
                        <Statistic
                          title="Total do Período"
                          value={calcularTotalPorPeriodo()}
                          prefix={<DollarOutlined />}
                          formatter={moneyFormatter}
                        />
                        <Text type="secondary">
                          {startDate.format("DD/MM")} a{" "}
                          {endDate.format("DD/MM")}
                        </Text>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card>
                        <Statistic
                          title="Número de Vendas"
                          value={vendas.length}
                          prefix={<ShoppingCartOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card>
                        <Statistic
                          title="Clientes Únicos"
                          value={calcularClientesUnicos()}
                          prefix={<UserOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card>
                        <Statistic
                          title="Valor Médio"
                          value={calcularValorMedioPorVenda()}
                          prefix={<BarChartOutlined />}
                          formatter={moneyFormatter}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Divider orientation="left">Detalhamento</Divider>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <>
                            <BarChartOutlined /> Totais por Dia
                          </>
                        }
                        style={{ height: "100%" }}
                      >
                        {dailyData.length > 0 ? (
                          <Table
                            columns={dailyColumns}
                            dataSource={dailyData}
                            size="small"
                            pagination={{ pageSize: 5 }}
                          />
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
                      >
                        {vendas.length > 0 ? (
                          <div style={{ maxHeight: "300px", overflow: "auto" }}>
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
                                  style={{ marginBottom: "10px" }}
                                >
                                  <Space>
                                    <UserOutlined />
                                    <Text strong>{cliente}</Text>
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

                  <Divider orientation="left">Lista de Vendas</Divider>

                  <Table
                    columns={columnsVendas}
                    dataSource={vendas.map((venda) => ({
                      ...venda,
                      key: venda.id,
                    }))}
                    pagination={{ pageSize: 10 }}
                    bordered
                    size="middle"
                    locale={{
                      emptyText: "Sem dados para o período selecionado",
                    }}
                  />
                </>
              )}
            </Space>
          </Card>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default Vendas;
