import { getSells } from "helpers/api-integrator";
import { toDateFormat } from "helpers/formatters";
import { toMoneyFormat } from "helpers/formatters";
import React, { useEffect, useState } from "react";
import ptBR from 'antd/lib/locale/pt_BR';
import moment from "moment"
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
  const [startDate, setStartDate] = useState(moment().add(-30, "day").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(moment().add(1, "day").format("YYYY-MM-DD"));

  // Função para calcular o total da venda com desconto
  const calcularTotal = (valor, desconto) => {
    console.log({ valor, desconto })
    return +valor - +desconto;
  };

  // Filtrar vendas por período
  const filtrarVendas = () => {
    return vendas;
  };

  // Calcular totais por dia
  const calcularTotaisPorDia = () => {
    const totaisPorDia = vendas.reduce((acc, venda) => {
      const data = new Date(venda.createdAt).toISOString().split('T')[0]; // Obtém apenas a data no formato 'YYYY-MM-DD'
      acc[data] = (acc[data] || 0) + calcularTotal(venda.total, venda.desconto);
      return acc;
    }, {});
    return totaisPorDia;
  };

  const setDates = (e) => {
    console.log({ e })
    setEndDate(moment(e[1].$d).format("YYYY-MM-DD"))
    setStartDate(moment(e[0].$d).format("YYYY-MM-DD"))
  }


  // Calcular total por período
  const calcularTotalPorPeriodo = () => {
    const filteredVendas = filtrarVendas();
    const total = filteredVendas.reduce((acc, venda) => {
      return acc + calcularTotal(venda.total, venda.desconto);
    }, 0);
    return total;
  };

  const getVendas = async (startDate, endDate) => {
    const items = await getSells(startDate, endDate)
    console.log({ items })
    if (items.success) {
      setVendas(items.data)
    }
  }

  useEffect(() => { getVendas(moment().add(-1, "month").format("YYYY-MM-DD"), moment().format("YYYY-MM-DD")) }, [])
  useEffect(() => { console.log({ vendas }) }, [vendas])
  useEffect(() => {
    if (endDate && startDate) {
      getVendas(startDate, endDate)
    }
  }, [endDate, startDate])

  return (
    <>
      <Container fluid>
        <Row>
          <Col md="12">
            <Card>

              <Card.Body>
                <Form>
                  <Row>

                    <Col md="12">
                      <Card.Title as="h4">Gestão de Vendas</Card.Title>
                      <Form.Group style={{ float: "right" }}>
                        <Form.Label>Buscar por período: </Form.Label>
                        <ConfigProvider locale={ptBR}>
                          <RangePicker
                            allowClear={false}
                            onChange={setDates}
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
                <h5>Total por Período <b>( de <span>{moment(startDate).format("DD/MM")} a {moment(endDate).format("DD/MM")}</span> )</b></h5>
                <p>{`${toMoneyFormat(calcularTotalPorPeriodo())}`}</p>
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
      </Container>
    </>
  );
}

export default Vendas;
