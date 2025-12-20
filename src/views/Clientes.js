import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Button,
  Table,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Row,
  Col,
  Badge,
  Alert,
} from "reactstrap";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
} from "react-feather";
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
} from "../helpers/api-integrator";
import { useUser } from "../context/UserContext";

const Clientes = () => {
  const { user } = useUser();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    cpf_cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    observacoes: "",
  });
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    color: "success",
  });

  const loadClientes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getClientes(searchTerm);
      if (response.success) {
        setClientes(response.data);
      } else {
        showAlert(response.message || "Erro ao carregar clientes", "danger");
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      showAlert("Erro ao carregar clientes", "danger");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  const showAlert = (message, color = "success") => {
    setAlert({ show: true, message, color });
    setTimeout(
      () => setAlert({ show: false, message: "", color: "success" }),
      3000
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      cpf_cnpj: "",
      email: "",
      telefone: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      observacoes: "",
    });
    setEditingCliente(null);
  };

  const openModal = (cliente = null) => {
    if (cliente) {
      setFormData(cliente);
      setEditingCliente(cliente);
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      showAlert("Nome é obrigatório", "danger");
      return;
    }

    try {
      let response;
      if (editingCliente) {
        response = await updateCliente(editingCliente.id, formData);
        if (response.success) {
          showAlert("Cliente atualizado com sucesso!");
        } else {
          showAlert(response.message || "Erro ao atualizar cliente", "danger");
          return;
        }
      } else {
        response = await createCliente(formData);
        if (response.success) {
          showAlert("Cliente cadastrado com sucesso!");
        } else {
          showAlert(response.message || "Erro ao cadastrar cliente", "danger");
          return;
        }
      }
      closeModal();
      loadClientes();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      showAlert("Erro ao salvar cliente", "danger");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        const response = await deleteCliente(id);
        if (response.success) {
          showAlert("Cliente excluído com sucesso!");
          loadClientes();
        } else {
          showAlert(response.message || "Erro ao excluir cliente", "danger");
        }
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
        showAlert("Erro ao excluir cliente", "danger");
      }
    }
  };

  const formatCpfCnpj = (cpfCnpj) => {
    if (!cpfCnpj) return "-";
    const cleaned = cpfCnpj.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (cleaned.length === 14) {
      return cleaned.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      );
    }
    return cpfCnpj;
  };

  const formatPhone = (phone) => {
    if (!phone) return "-";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return phone;
  };

  return (
    <div className="content">
      <Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">
                <User className="mr-2" size={20} />
                Gestão de Clientes
              </CardTitle>
            </CardHeader>
            <CardBody>
              {alert.show && (
                <Alert color={alert.color} className="mb-3">
                  {alert.message}
                </Alert>
              )}

              <Row className="mb-3">
                <Col md="8">
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <span className="input-group-text">
                        <Search size={16} />
                      </span>
                    </div>
                    <Input
                      type="text"
                      placeholder="Buscar clientes por nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </Col>
                <Col md="4" className="text-right">
                  <Button
                    color="primary"
                    onClick={() => openModal()}
                    className="btn-round"
                  >
                    <Plus size={16} className="mr-1" />
                    Novo Cliente
                  </Button>
                </Col>
              </Row>

              <div className="table-responsive">
                <Table className="tablesorter">
                  <thead className="text-primary">
                    <tr>
                      <th>Nome</th>
                      <th>CPF/CNPJ</th>
                      <th>Contato</th>
                      <th>Endereço</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          Carregando...
                        </td>
                      </tr>
                    ) : clientes.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          Nenhum cliente encontrado
                        </td>
                      </tr>
                    ) : (
                      clientes.map((cliente) => (
                        <tr key={cliente.id}>
                          <td>
                            <div>
                              <strong>{cliente.nome}</strong>
                              {cliente.observacoes && (
                                <small className="text-muted d-block">
                                  {cliente.observacoes}
                                </small>
                              )}
                            </div>
                          </td>
                          <td>{formatCpfCnpj(cliente.cpf_cnpj)}</td>
                          <td>
                            <div>
                              {cliente.email && (
                                <div className="d-flex align-items-center mb-1">
                                  <Mail size={14} className="mr-1" />
                                  <small>{cliente.email}</small>
                                </div>
                              )}
                              {cliente.telefone && (
                                <div className="d-flex align-items-center">
                                  <Phone size={14} className="mr-1" />
                                  <small>{formatPhone(cliente.telefone)}</small>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            {cliente.endereco && (
                              <div>
                                <div className="d-flex align-items-center mb-1">
                                  <MapPin size={14} className="mr-1" />
                                  <small>{cliente.endereco}</small>
                                </div>
                                {(cliente.cidade || cliente.estado) && (
                                  <small className="text-muted">
                                    {cliente.cidade}{" "}
                                    {cliente.estado && `- ${cliente.estado}`}
                                  </small>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <Badge
                              color={cliente.ativo ? "success" : "secondary"}
                            >
                              {cliente.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              color="info"
                              size="sm"
                              className="btn-round mr-1"
                              onClick={() => openModal(cliente)}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              color="danger"
                              size="sm"
                              className="btn-round"
                              onClick={() => handleDelete(cliente.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Modal de Cliente */}
      <Modal isOpen={modalOpen} toggle={closeModal} size="lg">
        <ModalHeader toggle={closeModal}>
          {editingCliente ? "Editar Cliente" : "Novo Cliente"}
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="nome">Nome *</Label>
                  <Input
                    id="nome"
                    name="nome"
                    type="text"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="cpf_cnpj">CPF/CNPJ</Label>
                  <Input
                    id="cpf_cnpj"
                    name="cpf_cnpj"
                    type="text"
                    value={formData.cpf_cnpj}
                    onChange={handleInputChange}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    type="text"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                  />
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md="12">
                <FormGroup>
                  <Label for="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    name="endereco"
                    type="text"
                    value={formData.endereco}
                    onChange={handleInputChange}
                    placeholder="Rua, número, bairro"
                  />
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md="4">
                <FormGroup>
                  <Label for="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    name="cidade"
                    type="text"
                    value={formData.cidade}
                    onChange={handleInputChange}
                  />
                </FormGroup>
              </Col>
              <Col md="4">
                <FormGroup>
                  <Label for="estado">Estado</Label>
                  <Input
                    id="estado"
                    name="estado"
                    type="text"
                    value={formData.estado}
                    onChange={handleInputChange}
                    placeholder="UF"
                  />
                </FormGroup>
              </Col>
              <Col md="4">
                <FormGroup>
                  <Label for="cep">CEP</Label>
                  <Input
                    id="cep"
                    name="cep"
                    type="text"
                    value={formData.cep}
                    onChange={handleInputChange}
                    placeholder="00000-000"
                  />
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md="12">
                <FormGroup>
                  <Label for="observacoes">
                    <FileText size={16} className="mr-1" />
                    Observações
                  </Label>
                  <Input
                    id="observacoes"
                    name="observacoes"
                    type="textarea"
                    rows="3"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    placeholder="Informações adicionais sobre o cliente..."
                  />
                </FormGroup>
              </Col>
            </Row>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={closeModal}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handleSubmit}>
            {editingCliente ? "Atualizar" : "Cadastrar"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Clientes;
