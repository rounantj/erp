import { getCompanySetup } from "helpers/api-integrator";
import { toMoneyFormat } from "helpers/formatters";
import React, { useEffect, useState } from "react";
import { Card, Container, Row, Col, Table, Form } from "react-bootstrap";

function SaudeFinanceira() {
  const [mySetup, setMySetup] = useState()
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
    let despesas = despesasPorMes.find((despesa) => despesa.mes === mes)?.valor || 0;
    return vendas - despesas;
  };

  const calcularSaldoGeral = () => {
    let saldo = valorInicial;
    vendasPorMes.forEach((venda) => (saldo += venda.valor));
    despesasPorMes.forEach((despesa) => (saldo -= despesa.valor));
    return saldo;
  };
  const getMySetup = async () => {
    const companyId = 1
    const response = await getCompanySetup(companyId)
    console.log({ response })
    setMySetup(response.data[0])
  }

  const saldoGeral = calcularSaldoGeral();

  useEffect(() => {
    getMySetup()
  }, [])

  useEffect(() => {
    console.log({ mySetup })
    if (mySetup) {
      setValorInicial(mySetup?.companyIntegration?.startValue)
    }
  }, [mySetup])

  return (
    <>
      <Container fluid>
        <Row>
          <Col md="12">
            <Card>
              <Card.Header>
                <Card.Title as="h4">Saúde Financeira</Card.Title>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Row>
                    <Col>
                      <Form.Group controlId="valorInicial">
                        <Form.Label>Valor Inicial</Form.Label>
                        <Form.Control
                          type="text"
                          value={toMoneyFormat(valorInicial)}
                          onChange={(e) => setValorInicial(parseFloat(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId="saldo">
                        <Form.Label>Saldo Geral</Form.Label>
                        <Form.Control
                          type="text"
                          value={toMoneyFormat(saldoGeral)}
                          readOnly
                          style={{
                            color: saldoGeral < 0 ? "red" : "blue",
                            fontWeight: "bold",
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th>Vendas</th>
                      <th>Despesas</th>
                      <th>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendasPorMes.map((venda, index) => (
                      <tr key={index}>
                        <td>{venda.mes}</td>
                        <td>{venda.valor.toFixed(2)}</td>
                        <td>{despesasPorMes[index]?.valor.toFixed(2)}</td>
                        <td>{calcularSaldoPorMes(venda.mes).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default SaudeFinanceira;
