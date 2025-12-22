import { getCompanySetup } from "helpers/api-integrator";
import { toMoneyFormat } from "helpers/formatters";
import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Form,
  Input,
  Typography,
  Statistic,
  Divider,
  Space,
} from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

const { Title } = Typography;

function SaudeFinanceira() {
  const [mySetup, setMySetup] = useState();
  const [valorInicial, setValorInicial] = useState(5000);
  const [vendasPorMes, setVendasPorMes] = useState([
    { mes: "Junho", valor: 800 },
    { mes: "Julho", valor: 1200 },
    // Adicione os demais meses aqui
  ]);
  const [despesasPorMes, setDespesasPorMes] = useState([
    { mes: "Junho", valor: 1500 },
    { mes: "Julho", valor: 2000 },
    // Adicione os demais meses aqui
  ]);

  const calcularSaldoPorMes = (mes) => {
    let vendas = vendasPorMes.find((venda) => venda.mes === mes)?.valor || 0;
    let despesas =
      despesasPorMes.find((despesa) => despesa.mes === mes)?.valor || 0;
    return vendas - despesas;
  };

  const calcularSaldoGeral = () => {
    let saldo = valorInicial;
    vendasPorMes.forEach((venda) => (saldo += venda.valor));
    despesasPorMes.forEach((despesa) => (saldo -= despesa.valor));
    return saldo;
  };

  const getMySetup = async () => {
    const companyId = 1;
    const response = await getCompanySetup(companyId);
    console.log({ response });
    setMySetup(response.data[0]);
  };

  const saldoGeral = calcularSaldoGeral();

  useEffect(() => {
    getMySetup();
  }, []);

  useEffect(() => {
    console.log({ mySetup });
    if (mySetup) {
      setValorInicial(mySetup?.companyIntegration?.startValue);
    }
  }, [mySetup]);

  // Prepare data for Ant Design table
  const tableData = vendasPorMes.map((venda, index) => {
    const saldo = calcularSaldoPorMes(venda.mes);
    return {
      key: index,
      mes: venda.mes,
      vendas: venda.valor,
      despesas: despesasPorMes[index]?.valor || 0,
      saldo: saldo,
    };
  });

  // Define columns for Ant Design table
  const columns = [
    {
      title: "Mês",
      dataIndex: "mes",
      key: "mes",
    },
    {
      title: "Vendas",
      dataIndex: "vendas",
      key: "vendas",
      render: (value) => toMoneyFormat(value),
    },
    {
      title: "Despesas",
      dataIndex: "despesas",
      key: "despesas",
      render: (value) => toMoneyFormat(value),
    },
    {
      title: "Saldo",
      dataIndex: "saldo",
      key: "saldo",
      render: (value) => (
        <span
          style={{ color: value < 0 ? "red" : "green", fontWeight: "bold" }}
        >
          {toMoneyFormat(value)}
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={<Title level={4}>Saúde Financeira</Title>}
        bordered={false}
        style={{ width: "100%" }}
      >
        <Row gutter={24} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Form layout="vertical">
              <Form.Item label="Valor Inicial">
                <Input
                  value={toMoneyFormat(valorInicial)}
                  onChange={(e) => {
                    // Remove currency format and parse to float
                    const value = parseFloat(
                      e.target.value.replace(/[^\d,-]/g, "").replace(",", ".")
                    );
                    if (!isNaN(value)) {
                      setValorInicial(value);
                    }
                  }}
                />
              </Form.Item>
            </Form>
          </Col>
          <Col span={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>Saldo Geral</div>
              <Statistic
                value={saldoGeral}
                precision={2}
                valueStyle={{
                  color: saldoGeral < 0 ? "#cf1322" : "#3f8600",
                  fontWeight: "bold",
                }}
                prefix={
                  saldoGeral < 0 ? <ArrowDownOutlined /> : <ArrowUpOutlined />
                }
                suffix="R$"
              />
            </Space>
          </Col>
        </Row>

        <Divider />

        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          bordered
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <strong>Total</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong>
                    {toMoneyFormat(
                      vendasPorMes.reduce((sum, item) => sum + item.valor, 0)
                    )}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <strong>
                    {toMoneyFormat(
                      despesasPorMes.reduce((sum, item) => sum + item.valor, 0)
                    )}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <strong
                    style={{
                      color: saldoGeral < 0 ? "red" : "green",
                    }}
                  >
                    {toMoneyFormat(saldoGeral - valorInicial)}
                  </strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
}

export default SaudeFinanceira;
