
import React, { useContext, useEffect, useState } from "react";
import { Container, Row, Col, Card, Form, Button, Modal, FormControl } from 'react-bootstrap';
import NotificationAlert from 'react-notification-alert';

import { UserContext } from "context/UserContext";
import { getCompanySetup } from "helpers/api-integrator";
import { getUsers } from "helpers/api-integrator";
import { updateUserRole } from "helpers/api-integrator";
import { updateSetup } from "helpers/api-integrator";

function Configuracoes() {
    const notificationAlertRef = React.useRef(null);
    const { user } = useContext(UserContext);
    const [showModal, setShowModal] = useState(false);
    const [company, setCompany] = useState({
        id: "",
        companyName: '',
        companyCNPJ: '',
        companyNCM: '',
        companyIntegration: {
            sefazCode: "", sefazId: ""
        }
    });
    const [users, setUsers] = useState();
    const [newUser, setNewUser] = useState({ nome: '', regra: 'atendente' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let lastCompany = company
        if (name === "sefazCode") {
            lastCompany.companyIntegration.sefazCode = value
            setCompany({ ...lastCompany });
        } else if (name === "sefazId") {
            lastCompany.companyIntegration.sefazId = value
            setCompany({ ...lastCompany });
        } else {
            setCompany({ ...company, [name]: value });
        }

    };

    const handleUserChange = (e, username) => {
        const { name, value } = e.target;
        console.log({ name, value, e, username })
        updateUser(username, value)
    };

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
    const getMySetup = async () => {
        const companyId = 1
        const response = await getCompanySetup(companyId)
        console.log({ response })
        setCompany(response.data[0])
    }
    const getUsersList = async () => {
        const companyId = 1
        const response = await getUsers(companyId)
        console.log({ response })
        if (response.data && Array.isArray(response.data))
            setUsers(response.data)
    }
    const updateUser = async (username, role) => {
        const companyId = 1
        const request = await updateUserRole(companyId, username, role)
        console.log({ request })
        getUsersList()
    }
    const updateSetupInner = async () => {
        const result = await updateSetup(company)
        getMySetup()
    }
    useEffect(() => {
        getMySetup()
        getUsersList()
    }, [])


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
                                <Card.Title as="h4">Configurações de Loja</Card.Title>
                                <p className="card-category">Configure as regras do seu negócio</p>
                            </Card.Header>
                            <Card.Body>
                                <Form>
                                    <Row>
                                        <Col md="6">
                                            <Form.Group>
                                                <label>Nome da Empresa</label>
                                                <FormControl
                                                    type="text"
                                                    name="companyName"
                                                    value={company.companyName}
                                                    onChange={handleInputChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md="6">
                                            <Form.Group>
                                                <label>CNPJ</label>
                                                <FormControl
                                                    type="text"
                                                    name="companyCNPJ"
                                                    value={company.companyCNPJ}
                                                    onChange={handleInputChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md="4">
                                            <Form.Group>
                                                <label>NCM</label>
                                                <FormControl
                                                    type="text"
                                                    name="companyNCM"
                                                    value={company.companyNCM}
                                                    onChange={handleInputChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md="4">
                                            <Form.Group>
                                                <label>Código Sefaz</label>
                                                <FormControl
                                                    type="text"
                                                    name="sefazCode"
                                                    value={company.companyIntegration.sefazCode}
                                                    onChange={handleInputChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md="4">
                                            <Form.Group>
                                                <label>ID Sefaz</label>
                                                <FormControl
                                                    type="text"
                                                    name="sefazId"
                                                    value={company.companyIntegration.sefazId}
                                                    onChange={handleInputChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Form>
                                <Button onClick={updateSetupInner} style={{ float: "right", marginTop: "15px" }}>Salvar</Button>
                            </Card.Body>
                        </Card>

                        <Card>
                            <Card.Header>
                                <Card.Title as="h4">Gerenciamento de Usuários</Card.Title>
                                <p className="card-category">Adicione, remova ou altere as regras dos usuários</p>
                            </Card.Header>
                            <Card.Body>
                                <Form>
                                    {users?.map(user => (
                                        <Row key={user.id}>
                                            <Col md="8">
                                                <Form.Group>
                                                    <FormControl
                                                        disabled
                                                        type="text"
                                                        name="nome"
                                                        value={user.username}
                                                        onChange={(e) => handleUserChange(e, user.id)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md="4">
                                                <Form.Group  >
                                                    <FormControl
                                                        as="select"
                                                        name="regra"
                                                        value={user.role}
                                                        onChange={(e) => handleUserChange(e, user.username)}
                                                    >
                                                        <option value="visitante">Visitante</option>
                                                        <option value="atendente">Atendente</option>
                                                        <option value="supervisor">Supervisor</option>
                                                        <option value="admin">Administrador</option>
                                                    </FormControl>
                                                </Form.Group>
                                            </Col>

                                        </Row>
                                    ))}
                                    {/* <Row>
                                        <Col md="8">
                                            <Form.Group>
                                                <FormControl
                                                    type="text"
                                                    name="nome"
                                                    value={newUser.username}
                                                    onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                                                    placeholder="Nome do Usuário"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md="4">
                                            <Form.Group>
                                                <FormControl
                                                    as="select"
                                                    name="regra"
                                                    value={newUser.role}
                                                    onChange={(e) => setNewUser({ ...newUser, regra: e.target.value })}
                                                >
                                                    <option value="visitante">Visitante</option>
                                                    <option value="atendente">Atendente</option>
                                                    <option value="supervisor">Supervisor</option>
                                                    <option value="admin">Administrador</option>
                                                </FormControl>
                                            </Form.Group>
                                        </Col>
                                    </Row> */}
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col style={{ display: "none" }} md="4">
                        <Card>
                            <Card.Header>
                                <Card.Title as="h4">Design e Logo</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <Button onClick={() => setShowModal(true)} variant="success">Salvar</Button>
                                <Modal show={showModal} onHide={() => setShowModal(false)}>
                                    <Modal.Header closeButton>
                                        <Modal.Title>Upload de Logo</Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body>
                                        <Form>
                                            <Form.Group>
                                                <Form.File
                                                    id="logoUpload"
                                                    label="Escolha a nova logo"
                                                    custom
                                                />
                                            </Form.Group>
                                            <Button variant="primary" onClick={() => setShowModal(false)}>
                                                Enviar
                                            </Button>
                                        </Form>
                                    </Modal.Body>
                                </Modal>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
};


export default Configuracoes;
