import { getSells } from "helpers/api-integrator";
import { toDateFormat } from "helpers/formatters";
import { toMoneyFormat } from "helpers/formatters";
import React, { useEffect, useState } from "react";
import ptBR from 'antd/lib/locale/pt_BR';
import {
  Card,
  Container,
  Row,
  Col,
  Table,
  Form,
  Button,
} from "react-bootstrap";
import { DatePicker, Space, ConfigProvider } from 'antd';

const { RangePicker } = DatePicker;

function Vendas() {
  // Dados de exemplo
  const [vendas, setVendas] = useState([]);

  // Estado para o período de busca
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Função para calcular o total da venda com desconto
  const calcularTotal = (valor, desconto) => {
    console.log({ valor, desconto })
    return +valor - +desconto;
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
      console.log(venda.createdAt)
      acc[venda.createdAt] = (acc[venda.createdAt] || 0) + calcularTotal(venda.total, venda.desconto);
      return acc;
    }, {});
    return totaisPorDia;
  };

  // Calcular total por período
  const calcularTotalPorPeriodo = () => {
    const filteredVendas = filtrarVendas();
    const total = filteredVendas.reduce((acc, venda) => {
      return acc + calcularTotal(venda.total, venda.desconto);
    }, 0);
    return total;
  };

  const getVendas = async () => {
    const items = await getSells()
    console.log({ items })
    if (items.success) {
      setVendas(items.data)
    }
  }

  useEffect(() => { getVendas() }, [])
  useEffect(() => { console.log({ vendas }) }, [vendas])

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
                    <Col md="9">
                      <Form.Group style={{ gap: '100px' }}>
                        <Form.Label>Buscar por período: </Form.Label>
                        <ConfigProvider locale={ptBR}>
                          <RangePicker
                            allowClear={false}
                            onChange={a => console.log("Timeframe has changed")}
                            className="datepicker"

                          />
                        </ConfigProvider >
                      </Form.Group>
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
                      <th>Descontos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrarVendas()?.map((venda) => (
                      <tr key={venda.id}>
                        <td>{toDateFormat(venda.createdAt, true)}</td>
                        <td>{venda.nome_cliente}</td>
                        <td>{`${toMoneyFormat(venda.total)}`}</td>
                        <td>{`${toMoneyFormat(venda.desconto)}`}</td>
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
                    {Object.entries(calcularTotaisPorDia()).map(([createdAt, total]) => (
                      <tr key={createdAt}>
                        <td>{toDateFormat(createdAt)}</td>
                        <td>{`${toMoneyFormat(total)}`}</td>
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
                <p>{`${toMoneyFormat(calcularTotalPorPeriodo())}`}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Vendas;
