import React, { useState } from "react";
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

function Despesas() {
  const [despesas, setDespesas] = useState([
    { id: 1, descricao: "Aluguel", valor: 1000, status: "Pago", fixa: true, vencimento: "2024-06-01" },
    { id: 2, descricao: "Internet", valor: 100, status: "Pago", fixa: false, vencimento: "2024-06-15" },
    { id: 3, descricao: "Salário", valor: 2000, status: "Em Aberto", fixa: false, vencimento: "2024-06-30" },
    { id: 4, descricao: "Energia", valor: 200, status: "Pago", fixa: true, vencimento: "2024-06-10" },
    { id: 5, descricao: "Água", valor: 150, status: "Em Aberto", fixa: false, vencimento: "2024-06-25" },
  ]);

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
    setDespesas([...despesas, novaDespesa]);
    setShowModal(false);
  };

  const handleVencimentoChange = (e) => {
    setVencimento(e.target.value);
  };

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
                      <Form.Group controlId="valor">
                        <Form.Label>Valor</Form.Label>
                        <Form.Control type="text" value={valor} onChange={(e) => setValor(e.target.value)} />
                      </Form.Group>
                      <Form.Group controlId="status">
                        <Form.Label>Status</Form.Label>
                        <Form.Control as="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                          <option value="Pago">Pago</option>
                          <option value="Em Aberto">Em Aberto</option>
                        </Form.Control>
                      </Form.Group>
                      <Form.Group controlId="fixa">
                        <Form.Check type="checkbox" label="Despesa Fixa" checked={fixa} onChange={(e) => setFixa(e.target.checked)} />
                      </Form.Group>
                      <Form.Group controlId="vencimento">
                        <Form.Label>Vencimento</Form.Label>
                        <Form.Control type="date" value={vencimento} onChange={handleVencimentoChange} />
                      </Form.Group>
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
                        <td>{despesa.vencimento}</td>
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
