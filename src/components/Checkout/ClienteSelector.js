import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  Button,
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
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import {
  User,
  Search,
  Plus,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
} from "react-feather";
import { getClientes, createCliente } from "../../helpers/api-integrator";

const ClienteSelector = ({
  selectedCliente,
  onClienteSelect,
  onClienteChange,
}) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Carregar cliente padrão na inicialização
  useEffect(() => {
    const loadDefaultCliente = async () => {
      try {
        const response = await getClientes("Cliente Padrão");
        if (response.success && response.data.length > 0) {
          const defaultCliente = response.data.find(
            (c) => c.nome === "Cliente Padrão"
          );
          if (defaultCliente && !selectedCliente) {
            onClienteSelect(defaultCliente);
            if (onClienteChange) {
              onClienteChange(defaultCliente);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar cliente padrão:", error);
      }
    };

    loadDefaultCliente();
  }, []);

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
  };

  const openModal = () => {
    resetForm();
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
      const response = await createCliente(formData);
      if (response.success) {
        const novoCliente = response.data;

        showAlert("Cliente cadastrado com sucesso!");
        closeModal();
        loadClientes();

        // Seleciona automaticamente o novo cliente
        onClienteSelect(novoCliente);
        if (onClienteChange) {
          onClienteChange(novoCliente);
        }
      } else {
        showAlert(response.message || "Erro ao cadastrar cliente", "danger");
      }
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      showAlert("Erro ao cadastrar cliente", "danger");
    }
  };

  const handleClienteSelect = (cliente) => {
    onClienteSelect(cliente);
    if (onClienteChange) {
      onClienteChange(cliente);
    }
    setDropdownOpen(false);
  };

  const formatCpfCnpj = (cpfCnpj) => {
    if (!cpfCnpj) return "";
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
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return phone;
  };

  return (
    <Card className="mb-3">
      <CardBody className="p-3">
        <div
          className="d-flex align-items-center mb-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: "pointer" }}
        >
          <User size={16} className="mr-2" />
          <h6 className="mb-0">Cliente</h6>
          {selectedCliente && (
            <small className="text-muted ml-2">({selectedCliente.nome})</small>
          )}
          <div className="ml-auto">
            <ChevronDown
              size={16}
              className={`transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {isExpanded && (
          <div className="cliente-content">
            {selectedCliente ? (
              <div className="selected-cliente p-2 border rounded bg-light">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{selectedCliente.nome}</h6>
                    {selectedCliente.cpf_cnpj && (
                      <small className="text-muted d-block">
                        CPF/CNPJ: {formatCpfCnpj(selectedCliente.cpf_cnpj)}
                      </small>
                    )}
                    {(selectedCliente.email || selectedCliente.telefone) && (
                      <div className="mt-1">
                        {selectedCliente.email && (
                          <div className="d-flex align-items-center mb-1">
                            <Mail size={12} className="mr-1" />
                            <small>{selectedCliente.email}</small>
                          </div>
                        )}
                        {selectedCliente.telefone && (
                          <div className="d-flex align-items-center">
                            <Phone size={12} className="mr-1" />
                            <small>
                              {formatPhone(selectedCliente.telefone)}
                            </small>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedCliente.endereco && (
                      <div className="d-flex align-items-center mt-1">
                        <MapPin size={12} className="mr-1" />
                        <small className="text-muted">
                          {selectedCliente.endereco}
                          {selectedCliente.cidade &&
                            `, ${selectedCliente.cidade}`}
                          {selectedCliente.estado &&
                            ` - ${selectedCliente.estado}`}
                        </small>
                      </div>
                    )}
                  </div>
                  <div>
                    <Button
                      color="link"
                      size="sm"
                      onClick={() => onClienteSelect(null)}
                      className="p-0 text-danger"
                      style={{ border: "none", boxShadow: "none", outline: "none" }}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Dropdown
                  isOpen={dropdownOpen}
                  toggle={() => setDropdownOpen(!dropdownOpen)}
                  className="flex-grow-1"
                >
                  <DropdownToggle
                    color="outline-secondary"
                    className="w-100 text-left d-flex justify-content-between align-items-center"
                  >
                    <span className="text-muted">Selecionar cliente...</span>
                    <ChevronDown size={16} />
                  </DropdownToggle>
                  <DropdownMenu className="w-100">
                    <div className="p-2">
                      <div className="input-group input-group-sm">
                        <div className="input-group-prepend">
                          <span className="input-group-text">
                            <Search size={12} />
                          </span>
                        </div>
                        <Input
                          type="text"
                          placeholder="Buscar clientes..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="border-0"
                        />
                      </div>
                    </div>
                    <div className="max-height-200 overflow-auto">
                      {loading ? (
                        <DropdownItem disabled>Carregando...</DropdownItem>
                      ) : clientes.length === 0 ? (
                        <DropdownItem disabled>
                          Nenhum cliente encontrado
                        </DropdownItem>
                      ) : (
                        clientes.map((cliente) => (
                          <DropdownItem
                            key={cliente.id}
                            onClick={() => handleClienteSelect(cliente)}
                            className="py-2"
                          >
                            <div>
                              <div className="font-weight-bold">
                                {cliente.nome}
                              </div>
                              {cliente.cpf_cnpj && (
                                <small className="text-muted">
                                  {formatCpfCnpj(cliente.cpf_cnpj)}
                                </small>
                              )}
                            </div>
                          </DropdownItem>
                        ))
                      )}
                    </div>
                  </DropdownMenu>
                </Dropdown>
                <Button
                  color="primary"
                  size="sm"
                  onClick={openModal}
                  className="btn-round"
                >
                  <Plus size={14} />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardBody>

      {/* Modal de Cadastro Rápido */}
      <Modal isOpen={modalOpen} toggle={closeModal} size="lg">
        <ModalHeader toggle={closeModal}>
          <Plus size={16} className="mr-2" />
          Cadastrar Novo Cliente
        </ModalHeader>
        <ModalBody>
          {alert.show && (
            <Alert color={alert.color} className="mb-3">
              {alert.message}
            </Alert>
          )}

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
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={closeModal}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handleSubmit}>
            Cadastrar e Selecionar
          </Button>
        </ModalFooter>
      </Modal>

      <style jsx>{`
        .max-height-200 {
          max-height: 200px;
        }
        .overflow-auto {
          overflow-y: auto;
        }
        .selected-cliente {
          transition: all 0.2s ease;
        }
        .selected-cliente:hover {
          background-color: #f8f9fa !important;
        }
        .cliente-content {
          animation: slideDown 0.3s ease-out;
        }
        .transition-transform {
          transition: transform 0.3s ease;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  );
};

export default ClienteSelector;
