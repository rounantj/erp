import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Container,
  Row,
  Col,
  Button,
  Form,
  Modal,
  Spinner,
  Badge,
  Alert,
} from "react-bootstrap";
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyUsers,
  getCurrentUser,
} from "../helpers/api-integrator";

function Empresas() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    cnpj: "",
  });

  const currentUser = getCurrentUser();

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCompanies();
      if (result.success) {
        setCompanies(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Erro ao carregar empresas");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleOpenModal = (company = null) => {
    if (company) {
      setSelectedCompany(company);
      setFormData({
        name: company.name || "",
        address: company.address || "",
        phone: company.phone || "",
        cnpj: company.cnpj || "",
      });
    } else {
      setSelectedCompany(null);
      setFormData({
        name: "",
        address: "",
        phone: "",
        cnpj: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCompany(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
      cnpj: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (selectedCompany) {
        result = await updateCompany(selectedCompany.id, formData);
      } else {
        result = await createCompany(formData);
      }

      if (result.success) {
        setSuccess(
          selectedCompany
            ? "Empresa atualizada com sucesso!"
            : "Empresa criada com sucesso!"
        );
        handleCloseModal();
        loadCompanies();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Erro ao salvar empresa");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;

    setLoading(true);
    try {
      const result = await deleteCompany(selectedCompany.id);
      if (result.success) {
        setSuccess("Empresa excluída com sucesso!");
        setShowDeleteModal(false);
        setSelectedCompany(null);
        loadCompanies();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Erro ao excluir empresa");
    }
    setLoading(false);
  };

  const handleViewUsers = async (company) => {
    setSelectedCompany(company);
    setLoadingUsers(true);
    setShowUsersModal(true);

    try {
      const result = await getCompanyUsers(company.id);
      if (result.success) {
        setCompanyUsers(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Erro ao carregar usuários");
    }
    setLoadingUsers(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Limpar mensagens após 5 segundos
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <Container fluid>
      <Row>
        <Col md="12">
          {success && (
            <Alert
              variant="success"
              dismissible
              onClose={() => setSuccess(null)}
            >
              {success}
            </Alert>
          )}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Card className="strpied-tabled-with-hover">
            <Card.Header>
              <Card.Title as="h4">Gerenciamento de Empresas</Card.Title>
              <p className="card-category">
                Cadastre e gerencie as empresas do sistema
              </p>
              <Button
                variant="primary"
                onClick={() => handleOpenModal()}
                className="float-right"
                style={{ marginTop: "-40px" }}
              >
                <i className="nc-icon nc-simple-add"></i> Nova Empresa
              </Button>
            </Card.Header>
            <Card.Body className="table-full-width table-responsive px-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Carregando...</span>
                  </Spinner>
                </div>
              ) : (
                <Table className="table-hover table-striped">
                  <thead>
                    <tr>
                      <th className="border-0">ID</th>
                      <th className="border-0">Nome</th>
                      <th className="border-0">Endereço</th>
                      <th className="border-0">Telefone</th>
                      <th className="border-0">Status</th>
                      <th className="border-0">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          Nenhuma empresa cadastrada
                        </td>
                      </tr>
                    ) : (
                      companies.map((company) => (
                        <tr key={company.id}>
                          <td>{company.id}</td>
                          <td>
                            <strong>{company.name}</strong>
                            {currentUser?.companyId === company.id && (
                              <Badge bg="info" className="ms-2">
                                Atual
                              </Badge>
                            )}
                          </td>
                          <td>{company.address || "-"}</td>
                          <td>{company.phone || "-"}</td>
                          <td>
                            <Badge
                              bg={company.is_active ? "success" : "secondary"}
                            >
                              {company.is_active ? "Ativa" : "Inativa"}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              variant="info"
                              size="sm"
                              className="me-2"
                              onClick={() => handleViewUsers(company)}
                              title="Ver usuários"
                            >
                              <i className="nc-icon nc-single-02"></i>
                            </Button>
                            <Button
                              variant="warning"
                              size="sm"
                              className="me-2"
                              onClick={() => handleOpenModal(company)}
                              title="Editar"
                            >
                              <i className="nc-icon nc-ruler-pencil"></i>
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setSelectedCompany(company);
                                setShowDeleteModal(true);
                              }}
                              title="Excluir"
                              disabled={currentUser?.companyId === company.id}
                            >
                              <i className="nc-icon nc-simple-remove"></i>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de Criar/Editar Empresa */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedCompany ? "Editar Empresa" : "Nova Empresa"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome da Empresa *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Digite o nome da empresa"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>CNPJ</Form.Label>
              <Form.Control
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Endereço</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Digite o endereço"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Telefone</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : selectedCompany ? (
                "Salvar"
              ) : (
                "Criar"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Tem certeza que deseja excluir a empresa{" "}
            <strong>{selectedCompany?.name}</strong>?
          </p>
          <p className="text-danger">
            Esta ação não pode ser desfeita. Todos os dados associados a esta
            empresa serão mantidos, mas a empresa ficará inativa.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : "Excluir"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Usuários da Empresa */}
      <Modal
        show={showUsersModal}
        onHide={() => setShowUsersModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Usuários da Empresa: {selectedCompany?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingUsers ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </Spinner>
            </div>
          ) : companyUsers.length === 0 ? (
            <p className="text-center text-muted">
              Nenhum usuário cadastrado nesta empresa
            </p>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Função</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {companyUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name || user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge
                        bg={user.role === "admin" ? "primary" : "secondary"}
                      >
                        {user.role || "visitante"}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={user.is_active ? "success" : "danger"}>
                        {user.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUsersModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Empresas;
