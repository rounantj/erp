import React, { useEffect, useState } from "react";
import ChartistGraph from "react-chartist";
import { Skeleton } from "antd";
// react-bootstrap components
import {
  Badge,
  Button,
  Card,
  Navbar,
  Nav,
  Table,
  Container,
  Row,
  Col,
  Form,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { getDashboard } from "helpers/api-integrator";
import { toMoneyFormat } from "helpers/formatters";
import { monthName } from "helpers/formatters";


const SkeletonCol = (md = 2) => {
  // Calcula dinamicamente o número de linhas baseado no valor de "md"
  const rows = Number(+md) - 1; // Garante no mínimo 2 linhas

  return (
    <Col md={md} style={{ marginBottom: "36px" }}>
      <div
        style={{
          padding: "15px 25px 15px 25px",
          marginBottom: "36px",
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          height: `${rows * 50}px`, // Altura baseada nas linhas
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Skeleton
          active={true}
          paragraph={{
            rows: rows, // Dinâmico com base no tamanho md
            width: Array.from({ length: rows }, (_, i) => `${100 - i * 10}%`), // Corrigido para evitar erros de tamanho inválido
          }}
        />
      </div>
    </Col>
  );
};

function Dashboard() {
  const [dataDash, setDataDash] = useState({
    "produtosVendidos": [
      {
        "id": 301,
        "descricao": "IMPRESSÃO COLORIDO",
        "valor": 2,
        "companyId": 1,
        "categoria": "Serviço",
        "ean": "",
        "ncm": "48053000\"Papel sulfito p/embalagem,n/revestido,em rolos/folhas\"",
        "createdAt": "2024-11-25T21:38:56.949Z",
        "updatedAt": "2024-06-13T17:18:03.879Z",
        "updatedByUser": 1,
        "createdByUser": 1,
        "deletedAt": null,
        "quantidade": "9",
        "valorTotal": 18
      }
    ],
    "totalProdutos": 10,
    "totalServicos": 10,
    "totalHoje": 10,
    "totalEsseMes": 10,
    "dias": [
      "25/11"
    ],
    "servicosValues": [
      24
    ],
    "fullValues": [
      53.980000000000004
    ],
    "produtosValues": [
      29.98
    ],
    "meses": [
      "Jun",
      "Jul",
      "Nov"
    ],
    "mesesSerValues": [
      28.47,
      144.73,
      29.98
    ],
    "mesesPrdValues": [
      6.75,
      7,
      24
    ],
    "despesa": [
      {
        "total": 1350
      }
    ]
  })

  const [loading, setLoading] = useState(false)
  const getDataDash = async () => {
    setLoading(true)
    const result = await getDashboard()
    console.log({ result })
    if (result.success) {
      setDataDash(result.data)
      setLoading(false)
    }
  }
  const dataPizza = () => {
    const total = dataDash.totalProdutos + dataDash.totalServicos
    const pP = +(dataDash.totalProdutos * 100 / total).toFixed(2)
    const pS = +(dataDash.totalServicos * 100 / total).toFixed(2)
    return {
      labels: [`${pP}%`, `${pS}%`],
      series: [pP, pS],
    }
  }
  useEffect(() => {
    console.log({ dataDash })
  }, [dataDash])

  useEffect(() => {
    getDataDash()
  }, [])

  return (
    <>
      <Container fluid>

        {
          loading ?
            <Row>
              {SkeletonCol("3")}
              {SkeletonCol("3")}
              {SkeletonCol("3")}
              {SkeletonCol("3")}
            </Row>
            :

            <Row>
              <Col lg="3" sm="6">
                <Card className="card-stats">
                  <Card.Body>
                    <Row>
                      <Col xs="5">
                        <div className="icon-big text-center icon-warning  ">
                          <i className="nc-icon nc-bag text-info"></i>
                        </div>
                      </Col>
                      <Col xs="7">
                        <div className="numbers">
                          <p className="card-category">Dias trabalhados <b>{monthName(new Date().getMonth())}</b></p>
                          <Card.Title as="h4">{dataDash.dias.length.toString()} dias</Card.Title>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                  <Card.Footer>
                    <hr></hr>
                    <div className="stats">
                      <i className="fas fa-redo mr-1"></i>
                      Atualizado agora
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
              <Col lg="3" sm="6">
                <Card className="card-stats">
                  <Card.Body>
                    <Row>
                      <Col xs="5">
                        <div className="icon-big text-center icon-warning">
                          <i className="nc-icon nc-money-coins  text-info"></i>
                        </div>
                      </Col>
                      <Col xs="7">
                        <div className="numbers">
                          <p className="card-category">Vendas realizadas  <b>{monthName(new Date().getMonth())}</b></p>
                          <Card.Title as="h4">{toMoneyFormat(dataDash.totalHoje)}</Card.Title>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                  <Card.Footer>
                    <hr></hr>
                    <div className="stats">
                      <i className="far fa-calendar-alt mr-1"></i>
                      Atualizado agora
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
              <Col lg="3" sm="6">
                <Card className="card-stats">
                  <Card.Body>
                    <Row>
                      <Col xs="5">
                        <div className="icon-big text-center icon-warning">
                          <i className="nc-icon nc-money-coins  text-success"></i>
                        </div>
                      </Col>
                      <Col xs="7">
                        <div className="numbers">
                          <p className="card-category">Vendas realizadas  <b>Hoje</b></p>
                          <Card.Title as="h4">{toMoneyFormat(dataDash.totalHoje)}</Card.Title>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                  <Card.Footer>
                    <hr></hr>
                    <div className="stats">
                      <i className="far fa-calendar-alt mr-1"></i>
                      Atualizado agora
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
              <Col lg="3" sm="6">
                <Card className="card-stats">
                  <Card.Body>
                    <Row>
                      <Col xs="5">
                        <div className="icon-big text-center icon-warning">
                          <i className="nc-icon nc-chart-pie-36  text-danger"></i>
                        </div>
                      </Col>
                      <Col xs="7">
                        <div className="numbers">
                          <p className="card-category">Despesas do mês <b>{monthName(new Date().getMonth())}</b></p>
                          <Card.Title as="h4">{toMoneyFormat(
                            dataDash?.despesa[0]?.total
                          )}</Card.Title>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                  <Card.Footer>
                    <hr></hr>
                    <div className="stats">
                      <i className="far fa-clock-o mr-1"></i>
                      Atualizado agora
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            </Row>
        }

        <Row>
          {
            loading ?
              SkeletonCol("8") :
              <Col md="8">
                <Card>
                  <Card.Header>
                    <Card.Title as="h4">Vendas por dia</Card.Title>
                    <p className="card-category">Performance dos ùltimos 20 dias</p>
                  </Card.Header>
                  <Card.Body>
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
                        options={{
                          low: 0,
                          high: Math.max(dataDash.fullValues) + 50,
                          showArea: false,
                          height: "245px",
                          axisX: {
                            showGrid: false,
                          },
                          lineSmooth: true,
                          showLine: true,
                          showPoint: true,
                          fullWidth: true,
                          chartPadding: {
                            right: 50,
                          },
                        }}
                        responsiveOptions={[
                          [
                            "screen and (max-width: 640px)",
                            {
                              axisX: {
                                labelInterpolationFnc: function (value) {
                                  return value[0];
                                },
                              },
                            },
                          ],
                        ]}
                      />
                    </div>
                  </Card.Body>
                  <Card.Footer>
                    <div className="legend">
                      <i className="fas fa-circle text-info"></i>
                      Tudo <i className="fas fa-circle text-danger"></i>
                      Serviços <i className="fas fa-circle text-warning"></i>
                      Produtos
                    </div>
                    <hr></hr>
                    <div className="stats">
                      <i className="fas fa-history"></i>
                      Atualizado agora...
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
          }

          {
            loading ? SkeletonCol("4")
              :
              <Col md="4">
                <Card>
                  <Card.Header>
                    <Card.Title as="h4">Pizza dos ganhos</Card.Title>
                    <p className="card-category">Como se divide a receita no mês atual</p>
                  </Card.Header>
                  <Card.Body>
                    <div
                      className="ct-chart ct-perfect-fourth"
                      id="chartPreferences"
                    >
                      <ChartistGraph
                        data={dataPizza()}
                        type="Pie"
                      />
                    </div>
                    <div className="legend">
                      <i className="fas fa-circle text-info"></i>
                      Serviços <i className="fas fa-circle text-danger"></i>
                      Produtos
                    </div>
                    <hr></hr>
                    <div className="stats">
                      <i className="far fa-clock"></i>
                      Atualizado agora ...
                    </div>
                  </Card.Body>
                </Card>
              </Col>
          }


        </Row>
        <Row>
          {
            loading ? SkeletonCol("6")
              :
              <Col md="6">
                <Card>
                  <Card.Header>
                    <Card.Title as="h4">2024 Vendas</Card.Title>
                    <p className="card-category">Incluso Serviços e Produtos de todo o ano</p>
                  </Card.Header>
                  <Card.Body>
                    <div className="ct-chart" id="chartActivity">
                      <ChartistGraph
                        data={{
                          labels: dataDash.meses,
                          series: [
                            dataDash.mesesSerValues,
                            dataDash.mesesPrdValues,

                          ],
                        }}
                        type="Bar"
                        options={{
                          seriesBarDistance: 10,
                          axisX: {
                            showGrid: false,
                          },
                          height: "245px",
                        }}
                        responsiveOptions={[
                          [
                            "screen and (max-width: 640px)",
                            {
                              seriesBarDistance: 5,
                              axisX: {
                                labelInterpolationFnc: function (value) {
                                  return value[0];
                                },
                              },
                            },
                          ],
                        ]}
                      />
                    </div>
                  </Card.Body>
                  <Card.Footer>
                    <div className="legend">
                      <i className="fas fa-circle text-info"></i>
                      Serviços <i className="fas fa-circle text-danger"></i>
                      Produtos
                    </div>
                    <hr></hr>
                    <div className="stats">
                      <i className="fas fa-check"></i>
                      Dados certificados ...
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
          }
          {
            loading ? SkeletonCol("6")
              :
              <Col md="6">
                <Card className="card-tasks">
                  <Card.Header>
                    <Card.Title as="h4">Recados e tarefas</Card.Title>
                    <p className="card-category">Cantinho para guardar recados ou tarefas pendentes</p>
                    <Button style={{ float: 'right' }} variant="success">Adicionar tarefa/recado</Button>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-full-width">
                      <Table>
                        <tbody>
                          <tr>
                            <td>
                              <Form.Check className="mb-1 pl-0">
                                <Form.Check.Label>
                                  <Form.Check.Input
                                    defaultValue=""
                                    type="checkbox"
                                  ></Form.Check.Input>
                                  <span className="form-check-sign"></span>
                                </Form.Check.Label>
                              </Form.Check>
                            </td>
                            <td>
                              Cliente BELTRANA ficou devendo R$ 2,00
                            </td>
                            <td className="td-actions text-right">
                              <OverlayTrigger
                                overlay={
                                  <Tooltip id="tooltip-488980961">
                                    Edit Task..
                                  </Tooltip>
                                }
                              >
                                <Button
                                  className="btn-simple btn-link p-1"
                                  type="button"
                                  variant="info"
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger
                                overlay={
                                  <Tooltip id="tooltip-506045838">Remove..</Tooltip>
                                }
                              >
                                <Button
                                  className="btn-simple btn-link p-1"
                                  type="button"
                                  variant="danger"
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              </OverlayTrigger>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <Form.Check className="mb-1 pl-0">
                                <Form.Check.Label>
                                  <Form.Check.Input
                                    defaultChecked
                                    defaultValue=""
                                    type="checkbox"
                                  ></Form.Check.Input>
                                  <span className="form-check-sign"></span>
                                </Form.Check.Label>
                              </Form.Check>
                            </td>
                            <td>
                              Ligar para fornecedor XXXXX para orçar cartolinas que estão acabando
                            </td>
                            <td className="td-actions text-right">
                              <OverlayTrigger
                                overlay={
                                  <Tooltip id="tooltip-537440761">
                                    Edit Task..
                                  </Tooltip>
                                }
                              >
                                <Button
                                  className="btn-simple btn-link p-1"
                                  type="button"
                                  variant="info"
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger
                                overlay={
                                  <Tooltip id="tooltip-21130535">Remove..</Tooltip>
                                }
                              >
                                <Button
                                  className="btn-simple btn-link p-1"
                                  type="button"
                                  variant="danger"
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              </OverlayTrigger>
                            </td>
                          </tr>

                          <tr>
                            <td>
                              <Form.Check className="mb-1 pl-0">
                                <Form.Check.Label>
                                  <Form.Check.Input
                                    defaultValue=""
                                    type="checkbox"
                                  ></Form.Check.Input>
                                  <span className="form-check-sign"></span>
                                </Form.Check.Label>
                              </Form.Check>
                            </td>
                            <td>
                              Cliente BELTRANA ficou devendo R$ 2,00
                            </td>
                            <td className="td-actions text-right">
                              <OverlayTrigger
                                overlay={
                                  <Tooltip id="tooltip-488980961">
                                    Edit Task..
                                  </Tooltip>
                                }
                              >
                                <Button
                                  className="btn-simple btn-link p-1"
                                  type="button"
                                  variant="info"
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger
                                overlay={
                                  <Tooltip id="tooltip-506045838">Remove..</Tooltip>
                                }
                              >
                                <Button
                                  className="btn-simple btn-link p-1"
                                  type="button"
                                  variant="danger"
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              </OverlayTrigger>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <Form.Check className="mb-1 pl-0">
                                <Form.Check.Label>
                                  <Form.Check.Input
                                    defaultChecked
                                    defaultValue=""
                                    type="checkbox"
                                  ></Form.Check.Input>
                                  <span className="form-check-sign"></span>
                                </Form.Check.Label>
                              </Form.Check>
                            </td>
                            <td>
                              Ligar para fornecedor XXXXX para orçar cartolinas que estão acabando
                            </td>
                            <td className="td-actions text-right">
                              <OverlayTrigger
                                overlay={
                                  <Tooltip id="tooltip-537440761">
                                    Edit Task..
                                  </Tooltip>
                                }
                              >
                                <Button
                                  className="btn-simple btn-link p-1"
                                  type="button"
                                  variant="info"
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger
                                overlay={
                                  <Tooltip id="tooltip-21130535">Remove..</Tooltip>
                                }
                              >
                                <Button
                                  className="btn-simple btn-link p-1"
                                  type="button"
                                  variant="danger"
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              </OverlayTrigger>
                            </td>
                          </tr>

                          <tr>
                            <td>
                              <Form.Check className="mb-1 pl-0">
                                <Form.Check.Label>
                                  <Form.Check.Input
                                    defaultValue=""
                                    type="checkbox"
                                  ></Form.Check.Input>
                                  <span className="form-check-sign"></span>
                                </Form.Check.Label>
                              </Form.Check>
                            </td>
                            <td>
                              Cliente BELTRANA ficou devendo R$ 2,00
                            </td>
                            <td className="td-actions text-right">
                              <OverlayTrigger
                                overlay={
                                  <Tooltip id="tooltip-488980961">
                                    Edit Task..
                                  </Tooltip>
                                }
                              >
                                <Button
                                  className="btn-simple btn-link p-1"
                                  type="button"
                                  variant="info"
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger
                                overlay={
                                  <Tooltip id="tooltip-506045838">Remove..</Tooltip>
                                }
                              >
                                <Button
                                  className="btn-simple btn-link p-1"
                                  type="button"
                                  variant="danger"
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              </OverlayTrigger>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <Form.Check className="mb-1 pl-0">
                                <Form.Check.Label>
                                  <Form.Check.Input
                                    defaultChecked
                                    defaultValue=""
                                    type="checkbox"
                                  ></Form.Check.Input>
                                  <span className="form-check-sign"></span>
                                </Form.Check.Label>
                              </Form.Check>
                            </td>
                            <td>
                              Ligar para fornecedor XXXXX para orçar cartolinas que estão acabando
                            </td>
                            <td className="td-actions text-right">
                              <OverlayTrigger
                                overlay={
                                  <Tooltip id="tooltip-537440761">
                                    Edit Task..
                                  </Tooltip>
                                }
                              >
                                <Button
                                  className="btn-simple btn-link p-1"
                                  type="button"
                                  variant="info"
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger
                                overlay={
                                  <Tooltip id="tooltip-21130535">Remove..</Tooltip>
                                }
                              >
                                <Button
                                  className="btn-simple btn-link p-1"
                                  type="button"
                                  variant="danger"
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              </OverlayTrigger>
                            </td>
                          </tr>

                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                  <Card.Footer>
                    <hr></hr>
                    <div className="stats">
                      <i className="now-ui-icons loader_refresh spin"></i>
                      Updated 3 minutes ago
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
          }


        </Row>
      </Container>
    </>
  );
}

export default Dashboard;
