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
  Card as AntCard,
  Button as AntButton,
  Input as AntInput,
  Modal as AntModal,
  Form as AntForm,
  Row as AntRow,
  Col as AntCol,
  Tag,
  Typography,
  Spin,
  Empty,
  FloatButton,
  ConfigProvider,
  notification,
  Popconfirm,
} from "antd";
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
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  SearchOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
} from "../helpers/api-integrator";
import { useUser } from "../context/UserContext";

const { Text } = Typography;
const { Search: AntSearch } = AntInput;

// Estilos para mobile
const mobileStyles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    maxWidth: "100vw",
    overflow: "hidden",
    background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    zIndex: 100,
  },
  header: {
    background: "transparent",
    padding: "16px",
    flexShrink: 0,
  },
  headerTitle: {
    color: "#333",
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
  },
  headerSubtitle: {
    color: "rgba(0,0,0,0.6)",
    fontSize: "12px",
  },
  statsRow: {
    display: "flex",
    gap: "12px",
    marginTop: "12px",
  },
  statCard: {
    flex: 1,
    background: "rgba(255,255,255,0.5)",
    borderRadius: "12px",
    padding: "12px",
    textAlign: "center",
    backdropFilter: "blur(10px)",
  },
  statValue: {
    color: "#333",
    fontSize: "24px",
    fontWeight: "700",
    display: "block",
  },
  statLabel: {
    color: "rgba(0,0,0,0.6)",
    fontSize: "11px",
  },
  content: {
    flex: 1,
    background: "#f8f9fa",
    borderTopLeftRadius: "24px",
    borderTopRightRadius: "24px",
    padding: "16px",
    paddingBottom: "20px",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    maxWidth: "100vw",
    boxSizing: "border-box",
    minHeight: 0,
  },
  searchContainer: {
    marginBottom: "12px",
    flexShrink: 0,
  },
  clienteCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  clienteName: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "4px",
  },
  clienteInfo: {
    fontSize: "11px",
    color: "#666",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "2px",
  },
  clienteActions: {
    display: "flex",
    gap: "6px",
    marginTop: "8px",
  },
};

const Clientes = () => {
  const { user } = useUser();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [antForm] = AntForm.useForm();

  // Detectar mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Abrir modal mobile
  const openMobileModal = (cliente = null) => {
    if (cliente) {
      antForm.setFieldsValue(cliente);
      setEditingCliente(cliente);
    } else {
      antForm.resetFields();
      setEditingCliente(null);
    }
    setModalOpen(true);
  };

  // Submit mobile
  const handleMobileSubmit = async (values) => {
    try {
      let response;
      if (editingCliente) {
        response = await updateCliente(editingCliente.id, values);
        if (response.success) {
          notification.success({ message: "Cliente atualizado com sucesso!" });
        } else {
          notification.error({ message: response.message || "Erro ao atualizar cliente" });
          return;
        }
      } else {
        response = await createCliente(values);
        if (response.success) {
          notification.success({ message: "Cliente cadastrado com sucesso!" });
        } else {
          notification.error({ message: response.message || "Erro ao cadastrar cliente" });
          return;
        }
      }
      setModalOpen(false);
      antForm.resetFields();
      setEditingCliente(null);
      loadClientes();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      notification.error({ message: "Erro ao salvar cliente" });
    }
  };

  // ========== RENDER MOBILE ==========
  if (isMobile) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#5e72e4",
            borderRadius: 12,
          },
        }}
      >
        <div style={mobileStyles.container}>
          {/* Header Mobile */}
          <div style={mobileStyles.header}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                {/* Botão Menu */}
                <div
                  onClick={() => {
                    const isOpen = document.documentElement.classList.contains("nav-open");
                    if (isOpen) {
                      document.documentElement.classList.remove("nav-open");
                      const existingBodyClick = document.getElementById("bodyClick");
                      if (existingBodyClick) existingBodyClick.parentElement.removeChild(existingBodyClick);
                    } else {
                      document.documentElement.classList.add("nav-open");
                      const existingBodyClick = document.getElementById("bodyClick");
                      if (existingBodyClick) existingBodyClick.parentElement.removeChild(existingBodyClick);
                      var node = document.createElement("div");
                      node.id = "bodyClick";
                      node.style.cssText = "position:fixed;top:0;left:0;right:250px;bottom:0;z-index:9999;";
                      node.onclick = function () {
                        this.parentElement.removeChild(this);
                        document.documentElement.classList.remove("nav-open");
                      };
                      document.body.appendChild(node);
                    }
                  }}
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MenuOutlined style={{ color: "#333", fontSize: "18px" }} />
                </div>
                <div>
                  <h1 style={mobileStyles.headerTitle}>
                    <UserOutlined style={{ marginRight: "8px" }} />
                    Clientes
                  </h1>
                  <Text style={mobileStyles.headerSubtitle}>
                    Gerenciar cadastro de clientes
                  </Text>
                </div>
              </div>
              <div
                onClick={loadClientes}
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                <ReloadOutlined spin={loading} style={{ color: "#333" }} />
              </div>
            </div>

            {/* Stats Row */}
            <div style={mobileStyles.statsRow}>
              <div style={mobileStyles.statCard}>
                <span style={mobileStyles.statValue}>{clientes.length}</span>
                <span style={mobileStyles.statLabel}>Total de Clientes</span>
              </div>
              <div style={mobileStyles.statCard}>
                <span style={mobileStyles.statValue}>
                  {clientes.filter(c => c.ativo !== false).length}
                </span>
                <span style={mobileStyles.statLabel}>Ativos</span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div style={mobileStyles.content}>
            {/* Search */}
            <div style={mobileStyles.searchContainer}>
              <AntSearch
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                size="large"
                style={{ borderRadius: "12px" }}
              />
            </div>

            {/* Clientes List */}
            <div style={{ 
              flex: 1, 
              overflow: "auto",
              minHeight: 0,
              WebkitOverflowScrolling: "touch",
            }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <Spin size="large" />
                  <div style={{ marginTop: "12px" }}>
                    <Text type="secondary">Carregando clientes...</Text>
                  </div>
                </div>
              ) : clientes.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Nenhum cliente encontrado"
                  style={{ marginTop: "40px" }}
                />
              ) : (
                clientes.map((cliente) => (
                  <div key={cliente.id} style={mobileStyles.clienteCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={mobileStyles.clienteName}>
                          {cliente.nome}
                        </div>
                        {cliente.cpf_cnpj && (
                          <div style={mobileStyles.clienteInfo}>
                            <UserOutlined style={{ fontSize: "10px" }} />
                            {formatCpfCnpj(cliente.cpf_cnpj)}
                          </div>
                        )}
                        {cliente.telefone && (
                          <div style={mobileStyles.clienteInfo}>
                            <PhoneOutlined style={{ fontSize: "10px" }} />
                            {formatPhone(cliente.telefone)}
                          </div>
                        )}
                        {cliente.email && (
                          <div style={mobileStyles.clienteInfo}>
                            <MailOutlined style={{ fontSize: "10px" }} />
                            {cliente.email}
                          </div>
                        )}
                        {cliente.cidade && (
                          <div style={mobileStyles.clienteInfo}>
                            <EnvironmentOutlined style={{ fontSize: "10px" }} />
                            {cliente.cidade} {cliente.estado && `- ${cliente.estado}`}
                          </div>
                        )}
                      </div>
                      <Tag color={cliente.ativo !== false ? "green" : "default"}>
                        {cliente.ativo !== false ? "Ativo" : "Inativo"}
                      </Tag>
                    </div>

                    <div style={mobileStyles.clienteActions}>
                      <AntButton
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => openMobileModal(cliente)}
                        style={{ flex: 1, borderRadius: "8px" }}
                      >
                        Editar
                      </AntButton>
                      <Popconfirm
                        title="Excluir cliente?"
                        onConfirm={() => handleDelete(cliente.id)}
                        okText="Sim"
                        cancelText="Não"
                      >
                        <AntButton
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          style={{ flex: 1, borderRadius: "8px" }}
                        >
                          Excluir
                        </AntButton>
                      </Popconfirm>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Results count */}
            {!loading && clientes.length > 0 && (
              <div style={{ 
                textAlign: "center", 
                padding: "8px 0",
                flexShrink: 0,
              }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
                </Text>
              </div>
            )}
          </div>

          {/* Floating Add Button */}
          <FloatButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openMobileModal()}
            style={{
              right: 20,
              bottom: 20,
              width: 56,
              height: 56,
            }}
          />

          {/* Modal Mobile */}
          <AntModal
            title={editingCliente ? "Editar Cliente" : "Novo Cliente"}
            open={modalOpen}
            onCancel={() => { setModalOpen(false); antForm.resetFields(); setEditingCliente(null); }}
            footer={null}
            destroyOnClose
            width="100%"
            style={{ top: 0, maxWidth: "100vw", margin: 0, padding: 0 }}
            bodyStyle={{ padding: "16px" }}
          >
            <AntForm
              form={antForm}
              layout="vertical"
              onFinish={handleMobileSubmit}
              initialValues={editingCliente || {}}
            >
              <AntForm.Item
                name="nome"
                label="Nome"
                rules={[{ required: true, message: "Nome é obrigatório" }]}
              >
                <AntInput placeholder="Nome do cliente" size="large" />
              </AntForm.Item>

              <AntRow gutter={12}>
                <AntCol span={12}>
                  <AntForm.Item name="cpf_cnpj" label="CPF/CNPJ">
                    <AntInput placeholder="000.000.000-00" size="large" />
                  </AntForm.Item>
                </AntCol>
                <AntCol span={12}>
                  <AntForm.Item name="telefone" label="Telefone">
                    <AntInput placeholder="(00) 00000-0000" size="large" />
                  </AntForm.Item>
                </AntCol>
              </AntRow>

              <AntForm.Item name="email" label="Email">
                <AntInput placeholder="email@exemplo.com" size="large" />
              </AntForm.Item>

              <AntForm.Item name="endereco" label="Endereço">
                <AntInput placeholder="Rua, número, bairro" size="large" />
              </AntForm.Item>

              <AntRow gutter={12}>
                <AntCol span={8}>
                  <AntForm.Item name="cidade" label="Cidade">
                    <AntInput placeholder="Cidade" size="large" />
                  </AntForm.Item>
                </AntCol>
                <AntCol span={8}>
                  <AntForm.Item name="estado" label="Estado">
                    <AntInput placeholder="UF" size="large" />
                  </AntForm.Item>
                </AntCol>
                <AntCol span={8}>
                  <AntForm.Item name="cep" label="CEP">
                    <AntInput placeholder="00000-000" size="large" />
                  </AntForm.Item>
                </AntCol>
              </AntRow>

              <AntForm.Item name="observacoes" label="Observações">
                <AntInput.TextArea rows={2} placeholder="Informações adicionais..." />
              </AntForm.Item>

              <AntForm.Item style={{ marginBottom: 0, marginTop: "16px" }}>
                <AntButton
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  style={{ height: "48px", borderRadius: "12px" }}
                >
                  {editingCliente ? "Atualizar" : "Cadastrar"}
                </AntButton>
              </AntForm.Item>
            </AntForm>
          </AntModal>
        </div>
      </ConfigProvider>
    );
  }

  // ========== RENDER DESKTOP ==========
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
