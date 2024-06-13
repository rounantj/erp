import SearchInput from "components/inputs/search-input";
import React, { useEffect, useState } from "react";
import { Button, Card, Container, Row, Col, Table, Modal, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import { toMoneyFormat } from "../helpers/formatters"
import { getProducts } from "helpers/api-integrator";
import NotificationAlert from "react-notification-alert";

function ProductAndServiceTable() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItems, setDeleteItems] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [products, setProducts] = useState([])
  const notificationAlertRef = React.useRef(null);
  const notify = (place, type, text) => {
    var color = Math.floor(Math.random() * 5 + 1);

    var options = {};
    options = {
      place: place,
      message: (
        <div>
          <div>
            {text}
          </div>
        </div>
      ),
      type: type,
      icon: "nc-icon nc-bell-55",
      autoDismiss: 7,
    };
    if (notificationAlertRef && notificationAlertRef.current && notificationAlertRef.current.notificationAlert)
      notificationAlertRef?.current?.notificationAlert(options);
  };


  const handleAdd = () => {
    // Adicionar lógica para adicionar um novo item
    setShowAddModal(false);
  };

  const handleEdit = () => {
    // Adicionar lógica para editar um item
    setShowEditModal(false);
  };

  const handleDelete = () => {
    // Adicionar lógica para excluir os itens selecionados
    setShowDeleteModal(false);
  };

  const getProductsList = async () => {
    const result = await getProducts()
    console.log({ result })
    if (result.success) {
      setProducts(result.data)
    } else {
      notify("bc", "danger", "Problema ao buscar produtos!")
    }
  }
  useEffect(() => {
    getProductsList()
  }, [])

  return (
    <>
      <div className="rna-container">
        <NotificationAlert ref={notificationAlertRef} />
      </div>
      <Container fluid>
        <Row>
          <Col md="12">
            <Card>
              <Card.Header>
                <Card.Title as="h4">Produtos e Serviços</Card.Title>
              </Card.Header>
              <Card.Body>
                <SearchInput placeholder={"Busque por produtos ou serviços"} />
                <Button style={{ float: 'right', marginBottom: '15px' }} variant="primary" onClick={() => setShowAddModal(true)}>Adicionar novo</Button>

                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Preço</th>
                      <th>Descrição</th>
                      <th>NCM</th>
                      <th>EAN</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      products && products.length && products.map(item =>

                      (
                        <tr>
                          <td>{item.categoria}</td>
                          <td>{toMoneyFormat(item.valor)}</td>
                          <td>{item.descricao}</td>
                          <td>{item.ncm?.split('"')[0]}</td>
                          <td>{item.ean}</td>
                          <td>
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
                                onClick={() => setShowAddModal(true)}
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
                                onClick={() => setShowAddModal(true)}
                              >
                                <i className="fas fa-times"></i>
                              </Button>
                            </OverlayTrigger>

                          </td>
                        </tr>
                      )
                      )

                    }
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal de adição */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Adicionar Produto ou Serviço</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formCategory">
              <Form.Label>Categoria</Form.Label>
              <Form.Control type="text" placeholder="Categoria" />
            </Form.Group>
            <Form.Group controlId="formPrice">
              <Form.Label>Preço</Form.Label>
              <Form.Control type="text" placeholder="Preço" />
            </Form.Group>
            <Form.Group controlId="formDescription">
              <Form.Label>Descrição</Form.Label>
              <Form.Control type="text" placeholder="Descrição" />
            </Form.Group>
            <Form.Group controlId="formNCM">
              <Form.Label>NCM</Form.Label>
              <Form.Control type="text" placeholder="NCM" />
            </Form.Group>
            <Form.Group controlId="formEAN">
              <Form.Label>EAN</Form.Label>
              <Form.Control type="text" placeholder="EAN" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleAdd}>Adicionar</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de edição */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Produto ou Serviço</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formCategory">
              <Form.Label>Categoria</Form.Label>
              <Form.Control type="text" placeholder="Categoria" value={editItem ? editItem.categoria : ""} />
            </Form.Group>
            <Form.Group controlId="formPrice">
              <Form.Label>Preço</Form.Label>
              <Form.Control type="text" placeholder="Preço" value={editItem ? editItem.preco : ""} />
            </Form.Group>
            <Form.Group controlId="formDescription">
              <Form.Label>Descrição</Form.Label>
              <Form.Control type="text" placeholder="Descrição" value={editItem ? editItem.descricao : ""} />
            </Form.Group>
            <Form.Group controlId="formNCM">
              <Form.Label>NCM</Form.Label>
              <Form.Control type="text" placeholder="NCM" value={editItem ? editItem.ncm : ""} />
            </Form.Group>
            <Form.Group controlId="formEAN">
              <Form.Label>EAN</Form.Label>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleEdit}>Salvar</Button>
        </Modal.Footer>
      </Modal>
      {/* Modal de exclusão */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Tem certeza que deseja excluir os itens selecionados?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </Modal.Footer>
      </Modal>
    </>

  );
}

export default ProductAndServiceTable;
