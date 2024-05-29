import React, { useState } from "react";
import {
  Card,
  Container,
  Row,
  Col,
  Table,
  Form,
  Button,
} from "react-bootstrap";

function Vendas() {
  // Dados de exemplo
  const [vendas, setVendas] = useState([
    { id: 1, cliente: "João", valor: 100, desconto: 10, data: "2024-06-01" },
    { id: 2, cliente: "Maria", valor: 150, desconto: 15, data: "2024-06-01" },
    { id: 3, cliente: "José", valor: 200, desconto: 20, data: "2024-06-02" },
    { id: 4, cliente: "Ana", valor: 120, desconto: 12, data: "2024-06-02" },
    { id: 5, cliente: "Carlos", valor: 180, desconto: 18, data: "2024-06-03" },
  ]);

  // Estado para o período de busca
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Função para calcular o total da venda com desconto
  const calcularTotal = (valor, desconto) => {
    return valor - desconto;
  };

  // Filtrar vendas por período
  const filtrarVendas = () => {
    if (startDate && endDate) {
      const filteredVendas = vendas.filter((venda) => {
        return venda.data >= startDate && venda.data <= endDate;
      });
      return filteredVendas;
    }
    return vendas;
  };

  // Calcular totais por dia
  const calcularTotaisPorDia = () => {
    const totaisPorDia = vendas.reduce((acc, venda) => {
      acc[venda.data] = (acc[venda.data] || 0) + calcularTotal(venda.valor, venda.desconto);
      return acc;
    }, {});
    return totaisPorDia;
  };

  // Calcular total por período
  const calcularTotalPorPeriodo = () => {
    const filteredVendas = filtrarVendas();
    const total = filteredVendas.reduce((acc, venda) => {
      return acc + calcularTotal(venda.valor, venda.desconto);
    }, 0);
    return total;
  };

  return (
    <>
      <Container fluid>
        <Row>
          <Col md="12">
            <Card>
              <Card.Header>
                <Card.Title as="h4">Gestão de Vendas</Card.Title>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Row>
                    <Col md="3">
                      <Form.Group>
                        <Form.Label>Data Inicial</Form.Label>
                        <Form.Control
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md="3">
                      <Form.Group>
                        <Form.Label>Data Final</Form.Label>
                        <Form.Control
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md="3" style={{ paddingTop: '30px' }}>
                      <Button variant="primary" onClick={filtrarVendas}>Buscar</Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col md="12">
            <Card className="strpied-tabled-with-hover">
              <Card.Body className="table-full-width table-responsive px-0">
                <Table className="table-hover table-striped">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Cliente</th>
                      <th>Valor</th>
                      <th>Desconto</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrarVendas().map((venda) => (
                      <tr key={venda.id}>
                        <td>{venda.data}</td>
                        <td>{venda.cliente}</td>
                        <td>{`R$ ${venda.valor.toFixed(2)}`}</td>
                        <td>{`R$ ${venda.desconto.toFixed(2)}`}</td>
                        <td>{`R$ ${calcularTotal(venda.valor, venda.desconto).toFixed(2)}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col md="6">
            <Card>
              <Card.Body>
                <h5>Totais por Dia</h5>
                <Table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(calcularTotaisPorDia()).map(([data, total]) => (
                      <tr key={data}>
                        <td>{data}</td>
                        <td>{`R$ ${total.toFixed(2)}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col md="6">
            <Card>
              <Card.Body>
                <h5>Total por Período</h5>
                <p>{`R$ ${calcularTotalPorPeriodo().toFixed(2)}`}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Vendas;
