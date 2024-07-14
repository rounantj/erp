import React, { useEffect, useState } from "react";
import {
  Card,
  Container,
  Row,
  Col,
  Table,
  Form,
  Button,
  Modal,
} from "react-bootstrap";
import CurrencyInput from 'react-currency-input-field';
import { Checkbox } from 'antd';
import { updateDespesa } from "helpers/api-integrator";
import { getDespesas } from "helpers/api-integrator";
import moment from "moment"
import { OverlayTrigger, Tooltip } from "react-bootstrap";

function Despesas() {
  const [despesas, setDespesas] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [status, setStatus] = useState("");
  const [fixa, setFixa] = useState(false);
  const [vencimento, setVencimento] = useState("");

  const handleCadastro = () => {
    const novaDespesa = {
      id: despesas.length + 1,
      descricao,
      valor: parseFloat(valor),
      status,
      fixa,
      vencimento,
    };
    createDespesa()
    getFullDespesas()
    setShowModal(false);
  };

  const getFullDespesas = async () => {
    const request = await getDespesas()
    console.log({ request })
    if (request && request.data) {
      setDespesas(request.data)
    }
  }
  const handleVencimentoChange = (e) => {
    setVencimento(e.target.value);
  };

  const createDespesa = async () => {
    const despesa = {
      descricao, valor, status, fixa, vencimento, categoria: fixa ? "Recorrente" : "Passageira"
    }
    const response = await updateDespesa(despesa)
    console.log({ response })
  }

  useEffect(() => {
    getFullDespesas()
  }, [])

  return (
    <>
      <Container fluid>
        <Row>
          <Col md="12">
            <Card>
              <Card.Header>
                <Card.Title as="h4">Controle de Despesas</Card.Title>
              </Card.Header>
              <Card.Body>
                <Button variant="primary" onClick={() => setShowModal(true)}>Cadastrar Despesa</Button>
                <Modal show={showModal} onHide={() => setShowModal(false)}>
                  <Modal.Header closeButton>
                    <Modal.Title>Cadastrar Nova Despesa</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Form>
                      <Form.Group controlId="descricao">
                        <Form.Label>Descrição</Form.Label>
                        <Form.Control type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                      </Form.Group>

                      <Form.Group controlId="fixa">
                        <Checkbox onChange={(e) => setFixa(e.target.checked)}>Despesa Fixa</Checkbox>
                      </Form.Group>

                      <div style={{ display: "inline-flex", gap: "10px" }}>
                        <Form.Group controlId="valor">
                          <Form.Label>Valor</Form.Label>
                          <CurrencyInput
                            className="form-control"
                            id="valor"
                            name="valor"
                            placeholder="R$ 0,00"
                            defaultValue={valor}
                            decimalsLimit={2}
                            decimalSeparator=","
                            groupSeparator="."
                            prefix="R$ "
                            onValueChange={(value) => setValor(value)}
                          />
                        </Form.Group>

                        <Form.Group style={{ minWidth: "150px" }} controlId="status">
                          <Form.Label>Status</Form.Label>
                          <Form.Control as="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="Pago">Pago</option>
                            <option value="Em Aberto">Em Aberto</option>
                          </Form.Control>
                        </Form.Group>
                        <Form.Group controlId="vencimento">
                          <Form.Label>Vencimento</Form.Label>
                          <Form.Control type="date" value={vencimento} onChange={handleVencimentoChange} />
                        </Form.Group>
                      </div>

                    </Form>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleCadastro}>Cadastrar</Button>
                  </Modal.Footer>
                </Modal>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* Visualização de Despesas */}
        <Row>
          <Col md="12">
            <Card>
              <Card.Body>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Descrição</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th>Fixa</th>
                      <th>Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {despesas.map((despesa) => (
                      <tr key={despesa.id}>
                        <td>{despesa.id}</td>
                        <td>{despesa.descricao}</td>
                        <td>{`R$ ${despesa.valor.toFixed(2)}`}</td>
                        <td>{despesa.status}</td>
                        <td>{despesa.fixa ? "Sim" : "Não"}</td>
                        <td>{moment(despesa.vencimento).format("DD/MM/YYYY")}</td>
                        <td>
                          <OverlayTrigger
                            overlay={
                              <Tooltip id="tooltip-488980961">
                                Editar despesa
                              </Tooltip>
                            }
                          >
                            <Button
                              className="btn-simple btn-link p-1"
                              type="button"
                              variant="info"
                              onClick={() => setItemToChange(item)}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger
                            overlay={
                              <Tooltip id="tooltip-506045838">Remover despesa</Tooltip>
                            }
                          >
                            <Button
                              className="btn-simple btn-link p-1"
                              type="button"
                              variant="danger"
                              onClick={() => setItemToDelete(item)}
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          </OverlayTrigger>

                        </td>
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

export default Despesas;
