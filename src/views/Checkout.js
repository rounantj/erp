import { toMoneyFormat } from "helpers/formatters";
import React, { useContext, useEffect, useState } from "react";
import NotificationAlert from "react-notification-alert";
import { getProducts } from "helpers/api-integrator";
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
import { Input } from "reactstrap";
import { UserContext } from "context/UserContext";
import { finalizaVenda } from "helpers/api-integrator";
import CurrencyInput from 'react-currency-input-field';
import { moneyToDecimal } from "helpers/formatters";

function Checkout() {
    const [items, setItems] = useState([]);
    const [itemName, setItemName] = useState("");
    const [itemPrice, setItemPrice] = useState(0);
    const [qtd, setQtd] = useState(1);
    const [discount, setDiscount] = useState(0);
    const [showModal, setShowModal] = React.useState(false);
    const notificationAlertRef = React.useRef(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [products, setProducts] = useState([])
    const [productsToShow, setProductsToShow] = useState([])
    const [editItem, setEditItem] = useState({ categoria: 'produto', valor: 0, descricao: '', ean: '', ncm: '' });
    const [mostraTroco, setMostraTroco] = useState(false)
    const [dinheiro, setDinheiro] = useState(0)
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

    const setPaymentMethod = (method) => {
        if (method != "Dinheiro") {
            setSelectedPaymentMethod(method)
            notify('bc', 'Venda realizada com sucesso!')
        } else {
            setSelectedPaymentMethod(method)
            setMostraTroco(true)
        }

    }

    const finalizar = async () => {
        if (!selectedPaymentMethod) {
            notify("bc", "danger", "Selecione o metodo de pagamento!")
            return
        }
        const venda = {
            metodoPagamento: selectedPaymentMethod,
            desconto: calculateTotalDescontos().valor,
            total: calculateTotal().valor,
            produtos: items.map(item => {
                return {
                    ...editItem,
                    quantidade: item.quantidade,
                    desconto: item.desconto,
                }
            }),
            nome_cliente: "Cliente padrão",
            user_id: user.id || 1,
            createdAt: new Date(),
            updatedAt: new Date()
        }
        const vendeu = await finalizaVenda(venda)
        console.log({ vendeu })
        if (vendeu.success) {
            notify("bc", "success", "Venda realizada!")
            setTimeout(() => { location.reload() }, 1000)
        } else {
            notify("bc", "danger", "Problema ao realizar venda!")
        }


    }

    const handleAddItem = () => {
        const newItem = { id: editItem.id, name: itemName, price: parseFloat(itemPrice), discount: parseFloat(discount), quantidade: qtd };
        setItems([...items, newItem]);
        setItemName("");
        setItemPrice(0);
        setQtd(1);
        setDiscount(0);
    };

    const calculateTotal = () => {
        const valor = items.reduce((total, item) => total + (item.price * item.quantidade) - item.discount, 0)
        const formated = toMoneyFormat(valor);
        return { valor, formated }
    };

    const calculateTotalBruto = () => {
        return toMoneyFormat(items.reduce((total, item) => total + (item.price * item.quantidade), 0));
    };

    const calculateTotalDescontos = () => {
        const valor = items.reduce((total, item) => total + item.discount, 0)
        const formated = toMoneyFormat(valor);
        return { valor, formated }
    };

    const handlePayment = () => {
        if (selectedPaymentMethod) {
            finalizar()
            setShowModal(false);
        } else {
            alert("Por favor, selecione um método de pagamento!");
        }
    };
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

    const productSelect = (id) => {
        const item = products.find(a => +a.id == +id)
        if (item) {
            setEditItem(item)
        }
    }

    useEffect(() => {
        getProductsList()
    }, [])

    useEffect(() => {
        if (editItem) {
            setItemName(editItem.descricao)
            setItemPrice(editItem.valor)
        }

    }, [editItem])

    useEffect(() => {
        if (products) {
            const newProducts = products.filter((item) =>
                item.categoria?.toLowerCase().includes(itemName?.toLowerCase()) ||
                item.ncm?.toLowerCase().includes(itemName?.toLowerCase()) ||
                item.ean?.toLowerCase().includes(itemName?.toLowerCase()) ||
                item.descricao?.toLowerCase().includes(itemName?.toLowerCase()) ||
                item.valor?.toString().toLowerCase().includes(itemName?.toLowerCase()))
            setProductsToShow(newProducts)
        }

    }, [itemName])

    useEffect(() => {
        console.log({ dinheiro })
    }, [dinheiro])

    const removeItem = (id) => {
        const news = items.filter(a => +a.id != +id)
        console.log({ id, news })
        setItems(news)
    }


    const styleForSearch = { border: '1px dashed silver', boxShadow: '1px 1px 0px 0px silver', marginTop: '20px', height: '150px', maxWidth: '100%', minWidth: '950px', overflowY: 'auto' }

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
                                        <Col md="6" >
                                            <Form.Group>
                                                <label>Nome do Item</label>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <Form.Control
                                                        style={{ maxWidth: 'calc(100% - 50px)' }}
                                                        type="text"
                                                        value={itemName}
                                                        onChange={(e) => setItemName(e.target.value)}
                                                        placeholder="Nome do Item"
                                                    />
                                                    {itemName && (
                                                        <Button style={{ maxWidth: '50px ' }} variant="link" onClick={() => setItemName("")}>
                                                            X
                                                        </Button>
                                                    )}

                                                </div>

                                            </Form.Group>

                                            {
                                                itemName && itemName.length &&
                                                <Form.Group >
                                                    <Form.Select multiple onChange={(e) => productSelect(e.target.value)} style={styleForSearch}>
                                                        {productsToShow.map((item, index) => (
                                                            <option key={index} value={item.id}>
                                                                {item.descricao}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            }


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
                                        <Col md="1">
                                            <Form.Group>
                                                <label>Qtd.:</label>
                                                <Form.Control
                                                    type="number"
                                                    value={qtd}
                                                    onChange={(e) => setQtd(e.target.value)}
                                                    placeholder="Preço"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md="1">
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
                                            <th>Quantidade</th>
                                            <th>Desconto</th>
                                            <th>Preço Final</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.name}</td>
                                                <td>{toMoneyFormat(item.price)}</td>
                                                <td>{toMoneyFormat(item.quantidade)}</td>
                                                <td>{toMoneyFormat(item.discount)}</td>
                                                <td>{(((item.price * item.quantidade) - item.discount))}</td>
                                                <td><Button
                                                    className="btn-simple btn-link p-1"
                                                    type="button"
                                                    variant="danger"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <i className="fas fa-times"></i>
                                                </Button></td>
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

                                {
                                    calculateTotalDescontos().valor != 0 &&
                                    <>
                                        <h5 style={{ color: 'rgb(0,87,156)' }}> Bruto: {calculateTotalBruto()}</h5>
                                        <hr />
                                        <h5 style={{ color: 'red' }}>Descontos: {calculateTotalDescontos().formated}</h5>
                                    </>
                                }
                                <hr />
                                <h5 style={{ fontSize: '16px' }}>Total Líquido: {"  "}<span style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>{calculateTotal().formated}</span></h5>
                                <hr />
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
                        <br />
                        <h3 style={{ color: 'green' }}>{calculateTotal().formated}</h3>
                        <p>Informe o método de pagamento:</p>
                        <div style={{ gap: '15px', display: 'inlineFlex' }}>
                            <Button
                                disabled={(selectedPaymentMethod != "PIX") && selectedPaymentMethod?.length}
                                style={
                                    selectedPaymentMethod == "PIX" ? {
                                        color: 'white', background: 'green'
                                    } : { background: 'white' }} onClick={() => setPaymentMethod("PIX")} variant="success">PIX</Button>
                            <Button
                                disabled={(selectedPaymentMethod != "Cartão") && selectedPaymentMethod?.length}
                                style={
                                    selectedPaymentMethod == "Cartão" ? {
                                        color: 'white', background: 'green'
                                    } : { background: 'white' }} onClick={() => setPaymentMethod("Cartão")} variant="success">Cartão</Button>
                            <Button
                                disabled={(selectedPaymentMethod != "Dinheiro") && selectedPaymentMethod?.length}
                                style={
                                    selectedPaymentMethod == "Dinheiro" ? {
                                        color: 'white', background: 'green'
                                    } : { background: 'white' }} onClick={() => setPaymentMethod("Dinheiro")} variant="success">Dinheiro</Button>
                            <Button
                                disabled={(selectedPaymentMethod != "Crediário") && selectedPaymentMethod?.length}
                                style={
                                    selectedPaymentMethod == "Crediário" ? {
                                        color: 'white', background: 'green'
                                    } : { background: 'white' }} onClick={() => setPaymentMethod("Crediário")} variant="success">Crediário</Button>
                        </div>
                        {
                            mostraTroco &&
                            <>
                                <hr />
                                <p>Insira o valor recebido:</p>
                                <CurrencyInput
                                    style={{ textAlign: 'center' }}
                                    className="form-control"
                                    id="valor"
                                    name="valor"
                                    placeholder="Valor em dinheiro R$"
                                    defaultValue={dinheiro}
                                    decimalsLimit={2}
                                    decimalSeparator=","
                                    groupSeparator="."
                                    prefix="R$ "
                                    onValueChange={(e) => setDinheiro(moneyToDecimal(e))}
                                />
                                <label>Troco: <b>{toMoneyFormat(dinheiro - calculateTotal().valor)}</b></label>
                            </>
                        }

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
