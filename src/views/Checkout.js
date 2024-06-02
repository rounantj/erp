import { toMoneyFormat } from "helpers/formatters";
import React, { useState } from "react";
import NotificationAlert from "react-notification-alert";
import {
    Button,
    Card,
    Container,
    Row,
    Col,
    Table,
    Form,
    Modal,
    Dropdown,
} from "react-bootstrap";

function Checkout() {
    const [items, setItems] = useState([]);
    const [itemName, setItemName] = useState("");
    const [itemPrice, setItemPrice] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [showModal, setShowModal] = React.useState(false);
    const notificationAlertRef = React.useRef(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const notify = (place, text) => {
        var color = Math.floor(Math.random() * 5 + 1);
        var type;
        switch (color) {
            case 1:
                type = "primary";
                break;
            case 2:
                type = "success";
                break;
            case 3:
                type = "danger";
                break;
            case 4:
                type = "warning";
                break;
            case 5:
                type = "info";
                break;
            default:
                break;
        }
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
        notificationAlertRef.current.notificationAlert(options);
    };
    const setPaymentMethod = (method) => {
        setSelectedPaymentMethod(method)
        setShowModal(false)
        notify('bc', 'Venda realizada com sucesso!')
    }
    const handleAddItem = () => {
        const newItem = { name: itemName, price: parseFloat(itemPrice), discount: parseFloat(discount) };
        setItems([...items, newItem]);
        setItemName("");
        setItemPrice(0);
        setDiscount(0);
    };

    const calculateTotal = () => {
        return toMoneyFormat(items.reduce((total, item) => total + item.price - item.discount, 0));
    };

    const handlePayment = () => {
        if (selectedPaymentMethod) {
            // Here you can process the payment with the selected method
            setShowModal(false);
            // You can add additional logic here, such as clearing the cart
        } else {
            alert("Por favor, selecione um método de pagamento!");
        }
    };

    return (
        <>
            <div className="rna-container">
                <NotificationAlert ref={notificationAlertRef} />
            </div>
            <Container fluid>

                <Row>
                    <Col md="8">
                        <Card>
                            <Card.Header>
                                <Card.Title as="h4">Checkout</Card.Title>
                                <p className="card-category">Adicione itens ao carrinho</p>
                            </Card.Header>
                            <Card.Body>
                                <Form>
                                    <Row>
                                        <Col md="5">
                                            <Form.Group>
                                                <label>Nome do Item</label>
                                                <Form.Control
                                                    type="text"
                                                    value={itemName}
                                                    onChange={(e) => setItemName(e.target.value)}
                                                    placeholder="Nome do Item"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md="2">
                                            <Form.Group>
                                                <label>Preço</label>
                                                <Form.Control
                                                    type="number"
                                                    value={itemPrice}
                                                    onChange={(e) => setItemPrice(e.target.value)}
                                                    placeholder="Preço"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md="2">
                                            <Form.Group>
                                                <label>Desconto</label>
                                                <Form.Control
                                                    type="number"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(e.target.value)}
                                                    placeholder="Desconto"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md="1">
                                            <Button
                                                variant="primary"
                                                onClick={handleAddItem}
                                                style={{ marginTop: "30px" }}
                                            >
                                                Adicionar
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                                <Table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Preço</th>
                                            <th>Desconto</th>
                                            <th>Preço Final</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.name}</td>
                                                <td>{toMoneyFormat(item.price)}</td>
                                                <td>{toMoneyFormat(item.discount)}</td>
                                                <td>{toMoneyFormat((item.price - item.discount))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md="4">
                        <Card>
                            <Card.Header>
                                <Card.Title as="h4">Resumo da venda</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <h5>Total: {calculateTotal()}</h5>
                                <Button onClick={() => setShowModal(true)} variant="success">Finalizar Compra</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                {/* Mini Modal */}
                <Modal
                    className="modal modal-primary"
                    show={showModal}
                    onHide={() => setShowModal(false)}
                >
                    <Modal.Header className="justify-content-center">
                        <div className="modal-profile">
                            <i className="nc-icon nc-bulb-63"></i>
                        </div>
                    </Modal.Header>
                    <Modal.Body className="text-center">
                        <p>Informe o método de pagamento:</p>
                        <div style={{ gap: '15px', display: 'inlineFlex' }}>
                            <Button onClick={() => setPaymentMethod("PIX")} variant="success">PIX</Button>
                            <Button onClick={() => setPaymentMethod("Cartão")} variant="success">Cartão</Button>
                            <Button onClick={() => setPaymentMethod("Dinheiro")} variant="success">Dinheiro</Button>
                            <Button onClick={() => setPaymentMethod("Crediário")} variant="success">Crediário</Button>
                        </div>

                    </Modal.Body>

                    <div className="modal-footer">
                        <Button
                            className="btn-simple"
                            type="button"
                            variant="link"
                            onClick={() => setShowModal(false)}
                        >
                            Voltar
                        </Button>
                        <Button
                            className="btn-simple"
                            type="button"
                            variant="link"
                            onClick={handlePayment}
                        >
                            Finalizar
                        </Button>
                    </div>
                </Modal>
                {/* End Modal */}
            </Container>
        </>
    );
}

export default Checkout;
