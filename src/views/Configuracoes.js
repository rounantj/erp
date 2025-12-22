import React, { useContext, useEffect, useState } from "react";
import {
  Layout,
  Card,
  Form,
  Input,
  Button,
  Typography,
  Row,
  Col,
  Divider,
  notification,
  Tabs,
  Space,
  Table,
  Tag,
  ConfigProvider,
  Spin,
  Empty,
  Segmented,
  Upload,
  message,
  Avatar,
} from "antd";
import {
  SaveOutlined,
  TeamOutlined,
  SettingOutlined,
  UserOutlined,
  IdcardOutlined,
  NumberOutlined,
  BarcodeOutlined,
  KeyOutlined,
  ReloadOutlined,
  ShopOutlined,
  MenuOutlined,
  PictureOutlined,
  BgColorsOutlined,
  UploadOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

import { UserContext } from "context/UserContext";
import { useCompany } from "context/CompanyContext";
import {
  getCompanySetup,
  getUsers,
  updateUserRole,
  updateSetup,
  uploadCompanyLogo,
} from "helpers/api-integrator";

// Logo padrão
import defaultLogo from "assets/img/logo.png";

const { Title, Text } = Typography;
const { TextArea } = Input;

// ============ VALIDAÇÕES DE CPF/CNPJ ============

// Validar CPF
const isValidCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false; // Todos dígitos iguais

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf[10])) return false;

  return true;
};

// Validar CNPJ
const isValidCNPJ = (cnpj) => {
  cnpj = cnpj.replace(/[^\d]/g, "");
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false; // Todos dígitos iguais

  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  let digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
};

// Validar CPF ou CNPJ
const isValidCPFOrCNPJ = (value) => {
  if (!value) return true; // Permite vazio
  const cleaned = value.replace(/[^\d]/g, "");
  if (cleaned.length === 11) return isValidCPF(cleaned);
  if (cleaned.length === 14) return isValidCNPJ(cleaned);
  return false;
};

// Formatar CPF: 000.000.000-00
const formatCPF = (value) => {
  const cleaned = value.replace(/[^\d]/g, "").slice(0, 11);
  return cleaned
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

// Formatar CNPJ: 00.000.000/0000-00
const formatCNPJ = (value) => {
  const cleaned = value.replace(/[^\d]/g, "").slice(0, 14);
  return cleaned
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

// Auto-formatar CPF ou CNPJ baseado no tamanho
const formatCPFOrCNPJ = (value) => {
  if (!value) return "";
  const cleaned = value.replace(/[^\d]/g, "");
  if (cleaned.length <= 11) return formatCPF(cleaned);
  return formatCNPJ(cleaned);
};

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
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
    color: "#fff",
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: "12px",
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
  sectionCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#667eea",
  },
  userCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  userName: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "4px",
  },
};

const roleColors = {
  visitante: "blue",
  atendente: "green",
  supervisor: "purple",
  admin: "red",
};

const roleTitles = {
  visitante: "Visitante",
  atendente: "Atendente",
  supervisor: "Supervisor",
  admin: "Administrador",
};

function Configuracoes() {
  const { user } = useContext(UserContext);
  const { companySetup, updateCompanySetup, refreshSetup } = useCompany();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState("1");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileTab, setMobileTab] = useState("visual");

  // Estado para preview da logo
  const [logoPreview, setLogoPreview] = useState(null);
  const [selectedColor, setSelectedColor] = useState("#667eea");

  // Detectar mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [company, setCompany] = useState({
    id: "",
    companyId: "",
    companyName: "",
    companyCNPJ: "",
    companyNCM: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    receiptFooter: "",
    logoUrl: "",
    sidebarColor: "#667eea",
    companyIntegration: {
      sefazCode: "",
      sefazId: "",
    },
  });

  // Busca configurações iniciais
  const fetchCompanySetup = async () => {
    try {
      setLoading(true);
      const companyId = user?.user?.companyId || 1;
      const response = await getCompanySetup(companyId);

      if (response.data && response.data[0]) {
        const data = response.data[0];
        setCompany(data);
        setLogoPreview(data.logoUrl);
        setSelectedColor(data.sidebarColor || "#667eea");

        form.setFieldsValue({
          companyName: data.companyName,
          companyCNPJ: data.companyCNPJ,
          companyNCM: data.companyNCM,
          companyAddress: data.companyAddress,
          companyPhone: data.companyPhone,
          companyEmail: data.companyEmail,
          receiptFooter: data.receiptFooter,
          sefazCode: data.companyIntegration?.sefazCode,
          sefazId: data.companyIntegration?.sefazId,
        });
      }
    } catch (error) {
      notification.error({
        message: "Erro ao carregar configurações",
        description: "Não foi possível buscar as configurações da empresa.",
      });
      console.error("Erro ao buscar configurações:", error);
    } finally {
      setLoading(false);
    }
  };

  // Busca lista de usuários
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const companyId = user?.user?.companyId || 1;
      const response = await getUsers(companyId);

      if (response.data && Array.isArray(response.data)) {
        const formattedUsers = response.data.map((u) => ({
          key: u.id || u.username,
          id: u.id,
          username: u.username,
          role: u.role,
        }));
        setUsersList(formattedUsers);
      }
    } catch (error) {
      notification.error({
        message: "Erro ao carregar usuários",
        description: "Não foi possível buscar a lista de usuários.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualiza papel do usuário
  const handleRoleChange = async (username, newRole) => {
    try {
      setLoading(true);
      const companyId = user?.user?.companyId || 1;
      await updateUserRole(companyId, username, newRole);

      notification.success({
        message: "Função atualizada",
        description: `Função do usuário ${username} atualizada com sucesso.`,
      });
      await fetchUsers();
    } catch (error) {
      notification.error({
        message: "Erro ao atualizar função",
        description: `Não foi possível atualizar a função do usuário ${username}.`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Upload de logo
  const handleLogoUpload = async (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Apenas imagens são permitidas!");
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("A imagem deve ter menos de 2MB!");
      return false;
    }

    // Converter para base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      setLogoPreview(base64);

      // Upload para o servidor
      try {
        setUploadLoading(true);
        const companyId = user?.user?.companyId || company.companyId;
        const result = await uploadCompanyLogo(companyId, base64);

        if (result.success) {
          notification.success({
            message: "Logo atualizada!",
            description: "A logo da empresa foi atualizada com sucesso.",
          });
          setLogoPreview(result.data.logoUrl);
          updateCompanySetup({ logoUrl: result.data.logoUrl });
          refreshSetup();
        } else {
          notification.error({
            message: "Erro ao enviar logo",
            description: result.message,
          });
        }
      } catch (error) {
        notification.error({
          message: "Erro ao enviar logo",
          description: "Não foi possível fazer upload da logo.",
        });
      } finally {
        setUploadLoading(false);
      }
    };
    reader.readAsDataURL(file);
    return false; // Previne upload automático
  };

  // Salva configurações da empresa
  const handleSaveSetup = async (values) => {
    try {
      setLoading(true);

      const updatedCompany = {
        ...company,
        companyName: values.companyName,
        companyCNPJ: values.companyCNPJ,
        companyNCM: values.companyNCM,
        companyAddress: values.companyAddress,
        companyPhone: values.companyPhone,
        companyEmail: values.companyEmail,
        receiptFooter: values.receiptFooter,
        sidebarColor: selectedColor,
        companyIntegration: {
          sefazCode: values.sefazCode,
          sefazId: values.sefazId,
        },
      };

      await updateSetup(updatedCompany);

      notification.success({
        message: "Configurações salvas",
        description:
          "As configurações da empresa foram atualizadas com sucesso.",
      });

      // Atualizar o contexto
      updateCompanySetup({
        sidebarColor: selectedColor,
        companyName: values.companyName,
      });

      await fetchCompanySetup();
    } catch (error) {
      notification.error({
        message: "Erro ao salvar configurações",
        description: "Não foi possível salvar as configurações da empresa.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carrega dados iniciais
  useEffect(() => {
    fetchCompanySetup();
    fetchUsers();
  }, []);

  // Atualiza preview da cor quando companySetup muda
  useEffect(() => {
    if (companySetup.sidebarColor) {
      setSelectedColor(companySetup.sidebarColor);
    }
    if (companySetup.logoUrl) {
      setLogoPreview(companySetup.logoUrl);
    }
  }, [companySetup]);

  // Estilos do select nativo
  const nativeSelectStyles = {
    width: "160px",
    height: "32px",
    padding: "0 8px",
    fontSize: "14px",
    border: "1px solid #d9d9d9",
    borderRadius: "6px",
    backgroundColor: "#fff",
    cursor: "pointer",
    outline: "none",
  };

  // Colunas da tabela de usuários
  const userColumns = [
    {
      title: "Usuário",
      dataIndex: "username",
      key: "username",
      render: (text) => (
        <Space>
          <UserOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Função",
      dataIndex: "role",
      key: "role",
      render: (role, record) => (
        <select
          value={role}
          style={nativeSelectStyles}
          onChange={(e) => handleRoleChange(record.username, e.target.value)}
        >
          <option value="visitante">Visitante</option>
          <option value="atendente">Atendente</option>
          <option value="supervisor">Supervisor</option>
          <option value="admin">Administrador</option>
        </select>
      ),
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "role",
      render: (role) => (
        <Tag color={roleColors[role] || "default"}>
          {roleTitles[role] || "Desconhecido"}
        </Tag>
      ),
    },
  ];

  // Componente de preview do sidebar
  const SidebarPreview = () => (
    <div
      style={{
        width: "100%",
        maxWidth: "200px",
        height: "200px",
        background: `linear-gradient(135deg, ${selectedColor} 0%, ${adjustColor(
          selectedColor,
          -30
        )} 100%)`,
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <img
        src={logoPreview || defaultLogo}
        alt="Logo preview"
        style={{
          maxWidth: "80px",
          maxHeight: "60px",
          objectFit: "contain",
          marginBottom: "12px",
          borderRadius: "4px",
          background: "#fff",
          padding: "4px",
        }}
        onError={(e) => {
          e.target.src = defaultLogo;
        }}
      />
      <div style={{ width: "100%" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.2)",
              height: "24px",
              borderRadius: "6px",
              marginBottom: "8px",
            }}
          />
        ))}
      </div>
    </div>
  );

  // Função para ajustar cor
  const adjustColor = (hex, percent) => {
    if (!hex || !hex.startsWith("#")) return hex;
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  // ========== RENDER MOBILE ==========
  if (isMobile) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#667eea",
            borderRadius: 12,
          },
        }}
      >
        <div style={mobileStyles.container}>
          <div style={mobileStyles.header}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div
                  onClick={() => {
                    const isOpen =
                      document.documentElement.classList.contains("nav-open");
                    if (isOpen) {
                      document.documentElement.classList.remove("nav-open");
                      const existingBodyClick =
                        document.getElementById("bodyClick");
                      if (existingBodyClick)
                        existingBodyClick.parentElement.removeChild(
                          existingBodyClick
                        );
                    } else {
                      document.documentElement.classList.add("nav-open");
                      const existingBodyClick =
                        document.getElementById("bodyClick");
                      if (existingBodyClick)
                        existingBodyClick.parentElement.removeChild(
                          existingBodyClick
                        );
                      var node = document.createElement("div");
                      node.id = "bodyClick";
                      node.style.cssText =
                        "position:fixed;top:0;left:0;right:250px;bottom:0;z-index:9999;";
                      node.onclick = function () {
                        this.parentElement.removeChild(this);
                        document.documentElement.classList.remove("nav-open");
                      };
                      document.body.appendChild(node);
                    }
                  }}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    cursor: "pointer",
                  }}
                >
                  <MenuOutlined style={{ color: "#fff", fontSize: "18px" }} />
                </div>
                <div>
                  <h1 style={mobileStyles.headerTitle}>
                    <SettingOutlined style={{ marginRight: "8px" }} />
                    Configurações
                  </h1>
                  <Text style={mobileStyles.headerSubtitle}>
                    Personalize sua empresa
                  </Text>
                </div>
              </div>
              <div
                onClick={() => {
                  fetchCompanySetup();
                  fetchUsers();
                }}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                <ReloadOutlined spin={loading} style={{ color: "#fff" }} />
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <Segmented
                block
                value={mobileTab}
                onChange={setMobileTab}
                options={[
                  {
                    label: "Visual",
                    value: "visual",
                    icon: <PictureOutlined />,
                  },
                  {
                    label: "Empresa",
                    value: "empresa",
                    icon: <ShopOutlined />,
                  },
                  {
                    label: "Usuários",
                    value: "usuarios",
                    icon: <TeamOutlined />,
                  },
                ]}
                style={{ background: "rgba(255,255,255,0.2)", padding: "4px" }}
              />
            </div>
          </div>

          <div style={mobileStyles.content}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
              </div>
            ) : mobileTab === "visual" ? (
              <div style={{ flex: 1, overflow: "auto" }}>
                <div style={mobileStyles.sectionCard}>
                  <div style={mobileStyles.sectionTitle}>
                    <PictureOutlined /> Logo da Empresa
                  </div>
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <Avatar
                      src={logoPreview || defaultLogo}
                      size={100}
                      style={{ marginBottom: "12px" }}
                    />
                  </div>
                  <Upload
                    beforeUpload={handleLogoUpload}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={uploadLoading}
                      block
                      size="large"
                    >
                      Enviar Logo
                    </Button>
                  </Upload>
                </div>

                <div style={mobileStyles.sectionCard}>
                  <div style={mobileStyles.sectionTitle}>
                    <BgColorsOutlined /> Cor do Menu
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      style={{
                        width: "50px",
                        height: "40px",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    />
                    <Button
                      type="primary"
                      onClick={() => handleSaveSetup(form.getFieldsValue())}
                      loading={loading}
                    >
                      Aplicar Cor
                    </Button>
                  </div>
                </div>

                <div style={mobileStyles.sectionCard}>
                  <div style={mobileStyles.sectionTitle}>Preview</div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <SidebarPreview />
                  </div>
                </div>
              </div>
            ) : mobileTab === "empresa" ? (
              <Form form={form} layout="vertical" onFinish={handleSaveSetup}>
                <div style={mobileStyles.sectionCard}>
                  <div style={mobileStyles.sectionTitle}>
                    <IdcardOutlined /> Dados da Empresa
                  </div>
                  <Form.Item
                    name="companyName"
                    label="Nome"
                    rules={[{ required: true }]}
                  >
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item
                    name="companyCNPJ"
                    label="CPF ou CNPJ"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (
                            !value ||
                            value.replace(/[^\d]/g, "").length === 0
                          ) {
                            return Promise.resolve();
                          }
                          if (isValidCPFOrCNPJ(value)) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("CPF ou CNPJ inválido")
                          );
                        },
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      onChange={(e) => {
                        const formatted = formatCPFOrCNPJ(e.target.value);
                        form.setFieldsValue({ companyCNPJ: formatted });
                      }}
                      maxLength={18}
                    />
                  </Form.Item>
                  <Form.Item name="companyAddress" label="Endereço">
                    <Input size="large" prefix={<HomeOutlined />} />
                  </Form.Item>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="companyPhone" label="Telefone">
                        <Input size="large" prefix={<PhoneOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="companyEmail" label="Email">
                        <Input size="large" prefix={<MailOutlined />} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                <div style={mobileStyles.sectionCard}>
                  <div style={mobileStyles.sectionTitle}>
                    <FileTextOutlined /> Rodapé do Cupom
                  </div>
                  <Form.Item name="receiptFooter">
                    <TextArea
                      rows={3}
                      placeholder="Texto que aparecerá no cupom"
                    />
                  </Form.Item>
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  icon={<SaveOutlined />}
                  loading={loading}
                  style={{ height: "48px", borderRadius: "12px" }}
                >
                  Salvar
                </Button>
              </Form>
            ) : (
              <div style={{ flex: 1, overflow: "auto" }}>
                {usersList.length === 0 ? (
                  <Empty description="Nenhum usuário" />
                ) : (
                  usersList.map((userItem) => (
                    <div key={userItem.key} style={mobileStyles.userCard}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={mobileStyles.userName}>
                            <UserOutlined style={{ marginRight: "8px" }} />
                            {userItem.username}
                          </div>
                        </div>
                        <Tag color={roleColors[userItem.role]}>
                          {roleTitles[userItem.role]}
                        </Tag>
                      </div>
                      <select
                        value={userItem.role}
                        style={{
                          width: "100%",
                          marginTop: "8px",
                          height: "40px",
                          padding: "0 12px",
                          fontSize: "14px",
                          border: "1px solid #d9d9d9",
                          borderRadius: "6px",
                          backgroundColor: "#fff",
                          cursor: "pointer",
                        }}
                        onChange={(e) =>
                          handleRoleChange(userItem.username, e.target.value)
                        }
                      >
                        <option value="visitante">Visitante</option>
                        <option value="atendente">Atendente</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </ConfigProvider>
    );
  }

  // ========== RENDER DESKTOP ==========
  return (
    <Layout className="site-layout-background" style={{ padding: "24px" }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        tabBarStyle={{ marginBottom: 24 }}
      >
        <Tabs.TabPane
          tab={
            <span>
              <PictureOutlined /> Identidade Visual
            </span>
          }
          key="1"
        >
          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <PictureOutlined />
                    <span>Logo da Empresa</span>
                  </Space>
                }
                style={{ marginBottom: "24px" }}
              >
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <div
                    style={{
                      width: "200px",
                      height: "120px",
                      margin: "0 auto 16px",
                      border: "2px dashed #d9d9d9",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#fafafa",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={logoPreview || defaultLogo}
                      alt="Logo"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                      onError={(e) => {
                        e.target.src = defaultLogo;
                      }}
                    />
                  </div>
                  <Upload
                    beforeUpload={handleLogoUpload}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={uploadLoading}
                      type="primary"
                    >
                      {logoPreview ? "Trocar Logo" : "Enviar Logo"}
                    </Button>
                  </Upload>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginTop: "8px" }}
                  >
                    Formatos: PNG, JPG, GIF. Máximo 2MB.
                  </Text>
                </div>
              </Card>

              <Card
                title={
                  <Space>
                    <BgColorsOutlined />
                    <span>Cor do Menu Lateral</span>
                  </Space>
                }
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    style={{
                      width: "60px",
                      height: "45px",
                      border: "2px solid #d9d9d9",
                      borderRadius: "8px",
                      cursor: "pointer",
                      padding: "2px",
                    }}
                  />
                  <Text>
                    Cor selecionada: <strong>{selectedColor}</strong>
                  </Text>
                </div>
                <Text type="secondary">
                  Escolha a cor principal do menu lateral do sistema.
                </Text>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <SettingOutlined />
                    <span>Preview do Menu</span>
                  </Space>
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "20px",
                  }}
                >
                  <SidebarPreview />
                </div>
                <Divider />
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={() => handleSaveSetup(form.getFieldsValue())}
                  loading={loading}
                  block
                  size="large"
                >
                  Salvar Identidade Visual
                </Button>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>

        <Tabs.TabPane
          tab={
            <span>
              <ShopOutlined /> Dados da Empresa
            </span>
          }
          key="2"
        >
          <Card
            title={
              <Space>
                <ShopOutlined />
                <span>Informações da Empresa</span>
              </Space>
            }
            extra={
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => form.submit()}
                loading={loading}
              >
                Salvar
              </Button>
            }
          >
            <Form form={form} layout="vertical" onFinish={handleSaveSetup}>
              <Title level={5}>Dados Básicos</Title>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="companyName"
                    label="Nome da Empresa"
                    rules={[{ required: true, message: "Obrigatório" }]}
                  >
                    <Input
                      prefix={<IdcardOutlined />}
                      placeholder="Nome da empresa"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="companyCNPJ"
                    label="CPF ou CNPJ"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (
                            !value ||
                            value.replace(/[^\d]/g, "").length === 0
                          ) {
                            return Promise.resolve();
                          }
                          if (isValidCPFOrCNPJ(value)) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("CPF ou CNPJ inválido")
                          );
                        },
                      },
                    ]}
                    extra="Digite apenas números. O sistema identifica automaticamente se é CPF ou CNPJ."
                  >
                    <Input
                      prefix={<NumberOutlined />}
                      placeholder="CPF: 000.000.000-00 ou CNPJ: 00.000.000/0000-00"
                      onChange={(e) => {
                        const formatted = formatCPFOrCNPJ(e.target.value);
                        form.setFieldsValue({ companyCNPJ: formatted });
                      }}
                      maxLength={18}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col xs={24}>
                  <Form.Item name="companyAddress" label="Endereço">
                    <Input
                      prefix={<HomeOutlined />}
                      placeholder="Endereço completo"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item name="companyPhone" label="Telefone">
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="(00) 00000-0000"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="companyEmail" label="Email">
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="contato@empresa.com"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />
              <Title level={5}>Informações Fiscais</Title>

              <Row gutter={24}>
                <Col xs={24} md={8}>
                  <Form.Item name="companyNCM" label="NCM Padrão">
                    <Input
                      prefix={<BarcodeOutlined />}
                      placeholder="Código NCM"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="sefazCode" label="Código Sefaz">
                    <Input prefix={<KeyOutlined />} placeholder="Código" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="sefazId" label="ID Sefaz">
                    <Input prefix={<KeyOutlined />} placeholder="ID" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />
              <Title level={5}>Cupom Não Fiscal</Title>

              <Form.Item name="receiptFooter" label="Texto do Rodapé do Cupom">
                <TextArea
                  rows={3}
                  placeholder="Texto que aparecerá no rodapé do cupom não fiscal..."
                />
              </Form.Item>
            </Form>
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane
          tab={
            <span>
              <TeamOutlined /> Usuários
            </span>
          }
          key="3"
        >
          <Card
            title={
              <Space>
                <TeamOutlined />
                <span>Usuários do Sistema</span>
              </Space>
            }
            extra={
              <Button type="dashed" onClick={fetchUsers} loading={loading}>
                Atualizar
              </Button>
            }
          >
            <Table
              columns={userColumns}
              dataSource={usersList}
              loading={loading}
              pagination={{ pageSize: 10 }}
              rowKey="key"
            />
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </Layout>
  );
}

export default Configuracoes;
