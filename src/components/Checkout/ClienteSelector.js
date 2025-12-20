import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Input,
  Modal,
  Form,
  Row,
  Col,
  Alert,
  Select,
  Typography,
  Space,
  Spin,
} from "antd";
import {
  UserOutlined,
  SearchOutlined,
  PlusOutlined,
  DownOutlined,
  UpOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { getClientes, createCliente } from "../../helpers/api-integrator";

const { Text, Title } = Typography;
const { Option } = Select;

const ClienteSelector = ({
  selectedCliente,
  onClienteSelect,
  onClienteChange,
}) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [form] = Form.useForm();
  const [alertInfo, setAlertInfo] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const loadClientes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getClientes(searchTerm);
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

  const handleClienteSelect = (clienteId) => {
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
            <Space style={{ width: "100%" }}>
              <Select
                showSearch
                placeholder="Selecionar cliente..."
                style={{ width: 250 }}
                loading={loading}
                filterOption={false}
                onSearch={setSearchTerm}
                onChange={handleClienteSelect}
                notFoundContent={
                  loading ? <Spin size="small" /> : "Nenhum cliente encontrado"
                }
              >
                {clientes.map((cliente) => (
                  <Option key={cliente.id} value={cliente.id}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{cliente.nome}</div>
                      {cliente.cpf_cnpj && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {formatCpfCnpj(cliente.cpf_cnpj)}
                        </Text>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>
              <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
                Novo
              </Button>
            </Space>
          )}
        </div>
      )}

      {/* Modal de Cadastro Rápido */}
      <Modal
        title={
          <Space>
            <PlusOutlined />
            <span>Cadastrar Novo Cliente</span>
          </Space>
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        okText="Cadastrar e Selecionar"
        cancelText="Cancelar"
        width={600}
      >
        {alertInfo.show && (
          <Alert
            message={alertInfo.message}
            type={alertInfo.type}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nome"
                label="Nome"
                rules={[{ required: true, message: "Nome é obrigatório" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cpf_cnpj" label="CPF/CNPJ">
                <Input placeholder="000.000.000-00 ou 00.000.000/0000-00" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input type="email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="telefone" label="Telefone">
                <Input placeholder="(00) 00000-0000" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="endereco" label="Endereço">
            <Input placeholder="Rua, número, bairro" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="cidade" label="Cidade">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="estado" label="Estado">
                <Input placeholder="UF" maxLength={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
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
