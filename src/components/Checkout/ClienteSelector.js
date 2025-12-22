import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Button,
  Input,
  Modal,
  Form,
  Row,
  Col,
  Alert,
  Typography,
  Space,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  DownOutlined,
  UpOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CloseOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { getClientes, createCliente } from "../../helpers/api-integrator";

const { Text, Title } = Typography;

const ClienteSelector = ({
  selectedCliente,
  onClienteSelect,
  onClienteChange,
  isMobile = false,
}) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(isMobile);
  const [form] = Form.useForm();
  const [alertInfo, setAlertInfo] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const debounceRef = useRef(null);

  const loadClientes = useCallback(async (search = "") => {
    setLoading(true);
    try {
      const response = await getClientes(search);
      if (response.success) {
        setClientes(response.data);
      } else {
        showAlert(response.message || "Erro ao carregar clientes", "error");
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      showAlert("Erro ao carregar clientes", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClientes();
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      loadClientes(value);
    }, 300);
  };

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

  const showAlert = (message, type = "success") => {
    setAlertInfo({ show: true, message, type });
    setTimeout(
      () => setAlertInfo({ show: false, message: "", type: "success" }),
      3000
    );
  };

  const openModal = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const response = await createCliente(values);
      if (response.success) {
        const novoCliente = response.data;
        showAlert("Cliente cadastrado com sucesso!");
        closeModal();
        loadClientes();
        onClienteSelect(novoCliente);
        if (onClienteChange) {
          onClienteChange(novoCliente);
        }
      } else {
        showAlert(response.message || "Erro ao cadastrar cliente", "error");
      }
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      showAlert("Erro ao cadastrar cliente", "error");
    }
  };

  const handleClienteSelect = (e) => {
    const clienteId = parseInt(e.target.value, 10);
    if (!clienteId) {
      onClienteSelect(null);
      return;
    }
    const cliente = clientes.find((c) => c.id === clienteId);
    if (cliente) {
      onClienteSelect(cliente);
      if (onClienteChange) {
        onClienteChange(cliente);
      }
    }
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

  const selectStyles = {
    width: "100%",
    height: isMobile ? "44px" : "36px",
    padding: "0 12px",
    fontSize: isMobile ? "16px" : "14px",
    border: "1px solid #d9d9d9",
    borderRadius: "6px",
    backgroundColor: "#fff",
    cursor: "pointer",
    outline: "none",
  };

  const inputStyles = {
    width: "100%",
    height: isMobile ? "44px" : "36px",
    padding: "0 12px",
    fontSize: isMobile ? "16px" : "14px",
    border: "1px solid #d9d9d9",
    borderRadius: "6px",
    marginBottom: "8px",
  };

  return (
    <Card
      size="small"
      style={{ marginBottom: 12 }}
      bodyStyle={{ padding: "12px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <UserOutlined style={{ marginRight: 8, color: "#1890ff" }} />
        <Text strong>Cliente</Text>
        {selectedCliente && (
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            ({selectedCliente.nome})
          </Text>
        )}
        <div style={{ marginLeft: "auto" }}>
          {isExpanded ? <UpOutlined /> : <DownOutlined />}
        </div>
      </div>

      {isExpanded && (
        <div style={{ marginTop: 12 }}>
          {selectedCliente ? (
            <div
              style={{
                padding: 12,
                border: "1px solid #d9d9d9",
                borderRadius: 6,
                background: "#fafafa",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
                    {selectedCliente.nome}
                  </Title>
                  {selectedCliente.cpf_cnpj && (
                    <Text type="secondary" style={{ display: "block" }}>
                      CPF/CNPJ: {formatCpfCnpj(selectedCliente.cpf_cnpj)}
                    </Text>
                  )}
                  {(selectedCliente.email || selectedCliente.telefone) && (
                    <Space
                      direction="vertical"
                      size={2}
                      style={{ marginTop: 4 }}
                    >
                      {selectedCliente.email && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <MailOutlined style={{ marginRight: 4 }} />
                          {selectedCliente.email}
                        </Text>
                      )}
                      {selectedCliente.telefone && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <PhoneOutlined style={{ marginRight: 4 }} />
                          {formatPhone(selectedCliente.telefone)}
                        </Text>
                      )}
                    </Space>
                  )}
                  {selectedCliente.endereco && (
                    <Text
                      type="secondary"
                      style={{ fontSize: 12, display: "block", marginTop: 4 }}
                    >
                      <EnvironmentOutlined style={{ marginRight: 4 }} />
                      {selectedCliente.endereco}
                      {selectedCliente.cidade && `, ${selectedCliente.cidade}`}
                      {selectedCliente.estado && ` - ${selectedCliente.estado}`}
                    </Text>
                  )}
                </div>
                <Button
                  type="text"
                  danger
                  icon={<CloseOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClienteSelect(null);
                  }}
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                width: "100%",
              }}
            >
              {/* Input de busca */}
              <div style={{ position: "relative" }}>
                <SearchOutlined
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                    zIndex: 1,
                  }}
                />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  style={{
                    ...inputStyles,
                    paddingLeft: 36,
                    marginBottom: 0,
                  }}
                />
              </div>

              {/* Select nativo */}
              <select
                onChange={handleClienteSelect}
                value={selectedCliente?.id || ""}
                style={selectStyles}
                disabled={loading}
              >
                <option value="">
                  {loading ? "Carregando..." : "Selecione um cliente"}
                </option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                    {cliente.cpf_cnpj
                      ? ` - ${formatCpfCnpj(cliente.cpf_cnpj)}`
                      : ""}
                  </option>
                ))}
              </select>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openModal}
                size={isMobile ? "large" : "middle"}
                style={{ width: "100%" }}
              >
                Novo Cliente
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Cadastro Rápido */}
      <Modal
        title={
          <Space>
            <PlusOutlined />
            <span>Novo Cliente</span>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        okText="Cadastrar"
        cancelText="Cancelar"
        width={isMobile ? "100%" : 600}
        centered={isMobile}
        style={
          isMobile ? { top: 0, margin: 0, maxWidth: "100vw", padding: 0 } : {}
        }
        bodyStyle={
          isMobile
            ? { padding: "12px", maxHeight: "70vh", overflowY: "auto" }
            : {}
        }
      >
        {alertInfo.show && (
          <Alert
            message={alertInfo.message}
            type={alertInfo.type}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          size={isMobile ? "large" : "middle"}
        >
          <Row gutter={[12, 0]}>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item
                name="nome"
                label="Nome"
                rules={[{ required: true, message: "Nome é obrigatório" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="cpf_cnpj" label="CPF/CNPJ">
                <Input placeholder="000.000.000-00" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 0]}>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="email" label="Email">
                <Input type="email" />
              </Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="telefone" label="Telefone">
                <Input placeholder="(00) 00000-0000" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="endereco" label="Endereço">
            <Input placeholder="Rua, número, bairro" />
          </Form.Item>

          <Row gutter={[12, 0]}>
            <Col span={isMobile ? 12 : 8}>
              <Form.Item name="cidade" label="Cidade">
                <Input />
              </Form.Item>
            </Col>
            <Col span={isMobile ? 6 : 8}>
              <Form.Item name="estado" label="UF">
                <Input placeholder="UF" maxLength={2} />
              </Form.Item>
            </Col>
            <Col span={isMobile ? 6 : 8}>
              <Form.Item name="cep" label="CEP">
                <Input placeholder="00000-000" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};

export default ClienteSelector;
