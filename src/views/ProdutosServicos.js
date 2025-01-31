import SearchInput from "components/inputs/search-input";
import React, { useEffect, useState, useContext } from "react";
import { Button, Card, Container, Row, Col, Table, Modal, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import { toMoneyFormat } from "../helpers/formatters"
import { getProducts } from "helpers/api-integrator";
import NotificationAlert from "react-notification-alert";
import { Input } from "reactstrap";
import { updateProduct } from "helpers/api-integrator";
import { deleteProduct } from "helpers/api-integrator";
import { UserContext } from "context/UserContext";

function ProductAndServiceTable() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItems, setDeleteItems] = useState([]);
  const [editItem, setEditItem] = useState({ categoria: 'produto', valor: 0, descricao: '', ean: '', ncm: '' });
  const [products, setProducts] = useState([])
  const [productsToShow, setProductsToShow] = useState([])
  const notificationAlertRef = React.useRef(null);
  const { user } = useContext(UserContext);
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
    updateItem()
    setShowAddModal(false);
  };

  const handleEdit = () => {
    // Adicionar lógica para editar um item
    setShowEditModal(false);
  };

  const updateItem = async () => {
    const result = await updateProduct(editItem)
    console.log({ result })
    getProductsList()
  }

  const handleDelete = () => {
    // Adicionar lógica para excluir os itens selecionados
    deleteItem()
    setShowDeleteModal(false);
  };

  const setItemToChange = (item) => {
    setShowAddModal(true)
    setEditItem(item)
  }

  const setItemToDelete = (item) => {
    setShowDeleteModal(true)
    setEditItem(item)
  }

  const getProductsList = async () => {
    const result = await getProducts()
    console.log({ result })
    if (result.success) {
      result.data.forEach(element => {
        if (!element['categoria']) element['categoria'] = ''
        if (!element['ean']) element['ean'] = ''
        if (!element['ncm']) element['ncm'] = ''
        if (!element['valor']) element['valor'] = 0
        if (!element['descricao']) element['descricao'] = ''
      });
      setProducts(result.data)
      setProductsToShow(result.data)
    } else {
      notify("bc", "danger", "Problema ao buscar produtos!")
    }
  }

  const itemEditar = (value, field) => {
    setEditItem(prevState => ({
      ...prevState,
      [field]: value
    }));
  };

  const filterResults = (value) => {
    console
      .log("Filtrando por " + value)
    const itemsFiltereds = products.filter((item) =>
      item.categoria?.toLowerCase().includes(value?.toLowerCase()) ||
      item.ncm?.toLowerCase().includes(value?.toLowerCase()) ||
      item.ean?.toLowerCase().includes(value?.toLowerCase()) ||
      item.descricao?.toLowerCase().includes(value?.toLowerCase()) ||
      item.valor?.toString().toLowerCase().includes(value?.toLowerCase())
    )
    setProductsToShow(itemsFiltereds)
  }

  const deleteItem = async () => {
    if (editItem?.id) {
      const result = await deleteProduct(editItem?.id)
      console.log({ a: result })
      notify("bc", "success", "Produto deletado!")
    } else {
      notify("bc", "danger", "Selecione ao menos um item para deletar!")
    }

    getProductsList()

  }


  useEffect(() => {
    getProductsList()
  }, [])

  useEffect(() => {
    console.log({ editItem })
  }, [editItem])

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
                <SearchInput onInput={filterResults} placeholder={"Busque por produtos ou serviços"} />
                {user.user.role === "admin" && <Button style={{ float: 'right', marginBottom: '15px' }} variant="primary" onClick={() => setShowAddModal(true)}>Adicionar novo</Button>}

                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Preço</th>
                      <th>Descrição</th>
                      <th>NCM</th>
                      <th>EAN</th>
                      {user.user.role === "admin" && <th>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {
                      productsToShow && productsToShow.length && productsToShow.map((item, index) =>

                      (
                        <tr key={index}>
                          <td>{item.categoria}</td>
                          <td>{toMoneyFormat(item.valor)}</td>
                          <td>{item.descricao}</td>
                          <td>{item.ncm?.split('"')[0]}</td>
                          <td>{item.ean ?? "Não cadastrado"}</td>
                          {user.user.role === "admin" && <td>
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
                                onClick={() => setItemToChange(item)}
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
                                onClick={() => setItemToDelete(item)}
                              >
                                <i className="fas fa-times"></i>
                              </Button>
                            </OverlayTrigger>

                          </td>
                          }
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
          <Modal.Title>Editar Produto ou Serviço</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formCategory">
              <Form.Label>Categoria</Form.Label>
              <Form.Control onChange={(e) => itemEditar(e.target.value, 'categoria')} type="text" placeholder="Categoria" value={editItem ? editItem.categoria : ""} />
            </Form.Group>
            <Form.Group controlId="formPrice">
              <Form.Label>Preço</Form.Label>
              <Form.Control onChange={(e) => itemEditar(e.target.value, 'valor')} type="text" placeholder="Preço" value={editItem ? editItem.valor : ""} />
            </Form.Group>
            <Form.Group controlId="formDescription">
              <Form.Label>Descrição</Form.Label>
              <Form.Control onChange={(e) => itemEditar(e.target.value, 'descricao')} type="text" placeholder="Descrição" value={editItem ? editItem.descricao : ""} />
            </Form.Group>
            <Form.Group controlId="formNCM">
              <Form.Label>NCM</Form.Label>
              <Form.Control onChange={(e) => itemEditar(e.target.value, 'ncm')} type="text" placeholder="NCM" value={editItem ? editItem.ncm : ""} />
            </Form.Group>
            <Form.Group controlId="formEAN">
              <Form.Label>EAN</Form.Label>
              <Form.Control onChange={(e) => itemEditar(e.target.value, 'ean')} type="text" placeholder="EAN" value={editItem ? editItem.ean : ""} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleAdd}>Salvar</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de edição */}

      {/* Modal de exclusão */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Tem certeza que deseja excluir os itens selecionados?</p>
          <b>
            {editItem.categoria}: {editItem.descricao} - {editItem.valor}, {editItem.ncm}
          </b>
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
