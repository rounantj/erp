import React, { useContext, useEffect, useState } from "react";
import {
  Layout,
  Card,
  Form,
  Input,
  Button,
  Select,
  Typography,
  Row,
  Col,
  Divider,
  notification,
  Tabs,
  Space,
  Table,
  Tag,
  Tooltip,
  ConfigProvider,
  Spin,
  Empty,
  Segmented,
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
} from "@ant-design/icons";

import { UserContext } from "context/UserContext";
import {
  getCompanySetup,
  getUsers,
  updateUserRole,
  updateSetup,
} from "helpers/api-integrator";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

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
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState("1");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileTab, setMobileTab] = useState("empresa");

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
    companyName: "",
    companyCNPJ: "",
    companyNCM: "",
    companyIntegration: {
      sefazCode: "",
      sefazId: "",
    },
  });

  // Busca configurações iniciais
  const fetchCompanySetup = async () => {
    try {
      setLoading(true);
      const companyId = 1; // ID fixo conforme código original
      const response = await getCompanySetup(companyId);

      if (response.data && response.data[0]) {
        setCompany(response.data[0]);

        // Atualiza o formulário com os dados recebidos
        form.setFieldsValue({
          companyName: response.data[0].companyName,
          companyCNPJ: response.data[0].companyCNPJ,
          companyNCM: response.data[0].companyNCM,
          sefazCode: response.data[0].companyIntegration.sefazCode,
          sefazId: response.data[0].companyIntegration.sefazId,
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
      const companyId = 1; // ID fixo conforme código original
      const response = await getUsers(companyId);

      if (response.data && Array.isArray(response.data)) {
        // Prepara dados para a tabela
        const formattedUsers = response.data.map((user) => ({
          key: user.id || user.username,
          id: user.id,
          username: user.username,
          role: user.role,
        }));

        setUsersList(formattedUsers);
      }
    } catch (error) {
      notification.error({
        message: "Erro ao carregar usuários",
        description: "Não foi possível buscar a lista de usuários.",
      });
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  // Atualiza papel do usuário
  const handleRoleChange = async (username, newRole) => {
    try {
      setLoading(true);
      const companyId = 1; // ID fixo conforme código original
      await updateUserRole(companyId, username, newRole);

      notification.success({
        message: "Função atualizada",
        description: `Função do usuário ${username} atualizada com sucesso.`,
      });

      // Recarrega usuários após atualização
      await fetchUsers();
    } catch (error) {
      notification.error({
        message: "Erro ao atualizar função",
        description: `Não foi possível atualizar a função do usuário ${username}.`,
      });
      console.error("Erro ao atualizar papel do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  // Salva configurações da empresa
  const handleSaveSetup = async (values) => {
    try {
      setLoading(true);

      // Prepara objeto para envio conforme estrutura original
      const updatedCompany = {
        ...company,
        companyName: values.companyName,
        companyCNPJ: values.companyCNPJ,
        companyNCM: values.companyNCM,
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

      // Recarrega configurações após salvar
      await fetchCompanySetup();
    } catch (error) {
      notification.error({
        message: "Erro ao salvar configurações",
        description: "Não foi possível salvar as configurações da empresa.",
      });
      console.error("Erro ao salvar configurações:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carrega dados iniciais
  useEffect(() => {
    fetchCompanySetup();
    fetchUsers();
  }, []);

  // Definição das colunas da tabela de usuários
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
        <Select
          value={role}
          style={{ width: 160 }}
          onChange={(value) => handleRoleChange(record.username, value)}
        >
          <Option value="visitante">
            <Tag color={roleColors.visitante}>Visitante</Tag>
          </Option>
          <Option value="atendente">
            <Tag color={roleColors.atendente}>Atendente</Tag>
          </Option>
          <Option value="supervisor">
            <Tag color={roleColors.supervisor}>Supervisor</Tag>
          </Option>
          <Option value="admin">
            <Tag color={roleColors.admin}>Administrador</Tag>
          </Option>
        </Select>
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
          {/* Header Mobile */}
          <div style={mobileStyles.header}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={mobileStyles.headerTitle}>
                  <SettingOutlined style={{ marginRight: "8px" }} />
                  Configurações
                </h1>
                <Text style={mobileStyles.headerSubtitle}>
                  Gerenciar empresa e usuários
                </Text>
              </div>
              <div
                onClick={() => { fetchCompanySetup(); fetchUsers(); }}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                <ReloadOutlined spin={loading} style={{ color: "#fff" }} />
              </div>
            </div>

            {/* Tab Switcher */}
            <div style={{ marginTop: "16px" }}>
              <Segmented
                block
                value={mobileTab}
                onChange={setMobileTab}
                options={[
                  { label: "Empresa", value: "empresa", icon: <ShopOutlined /> },
                  { label: "Usuários", value: "usuarios", icon: <TeamOutlined /> },
                ]}
                style={{ 
                  background: "rgba(255,255,255,0.2)",
                  padding: "4px",
                }}
              />
            </div>
          </div>

          {/* Content Area */}
          <div style={mobileStyles.content}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
                <div style={{ marginTop: "12px" }}>
                  <Text type="secondary">Carregando...</Text>
                </div>
              </div>
            ) : mobileTab === "empresa" ? (
              // Configurações da Empresa
              <div style={{ 
                flex: 1, 
                overflow: "auto",
                minHeight: 0,
                WebkitOverflowScrolling: "touch",
              }}>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSaveSetup}
                >
                  <div style={mobileStyles.sectionCard}>
                    <div style={mobileStyles.sectionTitle}>
                      <IdcardOutlined />
                      Informações Básicas
                    </div>
                    
                    <Form.Item
                      name="companyName"
                      label="Nome da Empresa"
                      rules={[{ required: true, message: "Obrigatório" }]}
                    >
                      <Input placeholder="Nome da empresa" size="large" />
                    </Form.Item>

                    <Form.Item
                      name="companyCNPJ"
                      label="CNPJ"
                      rules={[{ required: true, message: "Obrigatório" }]}
                    >
                      <Input placeholder="00.000.000/0000-00" size="large" />
                    </Form.Item>
                  </div>

                  <div style={mobileStyles.sectionCard}>
                    <div style={mobileStyles.sectionTitle}>
                      <BarcodeOutlined />
                      Informações Fiscais
                    </div>
                    
                    <Form.Item
                      name="companyNCM"
                      label="NCM"
                      rules={[{ required: true, message: "Obrigatório" }]}
                    >
                      <Input placeholder="Código NCM" size="large" />
                    </Form.Item>

                    <Row gutter={12}>
                      <Col span={12}>
                        <Form.Item name="sefazCode" label="Código Sefaz">
                          <Input placeholder="Código" size="large" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="sefazId" label="ID Sefaz">
                          <Input placeholder="ID" size="large" />
                        </Form.Item>
                      </Col>
                    </Row>
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
                    Salvar Configurações
                  </Button>
                </Form>
              </div>
            ) : (
              // Gerenciamento de Usuários
              <div style={{ 
                flex: 1, 
                overflow: "auto",
                minHeight: 0,
                WebkitOverflowScrolling: "touch",
              }}>
                {usersList.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Nenhum usuário encontrado"
                    style={{ marginTop: "40px" }}
                  />
                ) : (
                  usersList.map((userItem) => (
                    <div key={userItem.key} style={mobileStyles.userCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={mobileStyles.userName}>
                            <UserOutlined style={{ marginRight: "8px" }} />
                            {userItem.username}
                          </div>
                          <Text type="secondary" style={{ fontSize: "11px" }}>
                            ID: {userItem.id}
                          </Text>
                        </div>
                        <Tag color={roleColors[userItem.role] || "default"}>
                          {roleTitles[userItem.role] || "Desconhecido"}
                        </Tag>
                      </div>
                      
                      <div style={{ marginTop: "12px" }}>
                        <Text style={{ fontSize: "12px", marginBottom: "4px", display: "block" }}>
                          Alterar função:
                        </Text>
                        <Select
                          value={userItem.role}
                          style={{ width: "100%" }}
                          onChange={(value) => handleRoleChange(userItem.username, value)}
                          size="large"
                        >
                          <Option value="visitante">
                            <Tag color={roleColors.visitante}>Visitante</Tag>
                          </Option>
                          <Option value="atendente">
                            <Tag color={roleColors.atendente}>Atendente</Tag>
                          </Option>
                          <Option value="supervisor">
                            <Tag color={roleColors.supervisor}>Supervisor</Tag>
                          </Option>
                          <Option value="admin">
                            <Tag color={roleColors.admin}>Administrador</Tag>
                          </Option>
                        </Select>
                      </div>
                    </div>
                  ))
                )}

                {/* Results count */}
                {usersList.length > 0 && (
                  <div style={{ 
                    textAlign: "center", 
                    padding: "8px 0",
                    flexShrink: 0,
                  }}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {usersList.length} {usersList.length === 1 ? "usuário" : "usuários"}
                    </Text>
                  </div>
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
        <TabPane
          tab={
            <span>
              <SettingOutlined /> Configurações da Empresa
            </span>
          }
          key="1"
        >
          <Card
            title={
              <Space>
                <SettingOutlined />
                <span> Configurações de Loja</span>
              </Space>
            }
            extra={
              <Tooltip title="Salvar Configurações">
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={() => form.submit()}
                  loading={loading}
                >
                  Salvar
                </Button>
              </Tooltip>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveSetup}
              initialValues={{
                companyName: company.companyName,
                companyCNPJ: company.companyCNPJ,
                companyNCM: company.companyNCM,
                sefazCode: company.companyIntegration.sefazCode,
                sefazId: company.companyIntegration.sefazId,
              }}
            >
              <Title level={5}>Informações Básicas</Title>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="companyName"
                    label="Nome da Empresa"
                    rules={[
                      {
                        required: true,
                        message: "Por favor, informe o nome da empresa",
                      },
                    ]}
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
                    label="CNPJ"
                    rules={[
                      { required: true, message: "Por favor, informe o CNPJ" },
                      {
                        pattern: /^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/,
                        message: "CNPJ inválido (formato: 00.000.000/0000-00)",
                      },
                    ]}
                  >
                    <Input
                      prefix={<NumberOutlined />}
                      placeholder="00.000.000/0000-00"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />
              <Title level={5}>Informações Fiscais</Title>

              <Row gutter={24}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="companyNCM"
                    label="NCM"
                    rules={[
                      { required: true, message: "Por favor, informe o NCM" },
                    ]}
                  >
                    <Input
                      prefix={<BarcodeOutlined />}
                      placeholder="Código NCM"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="sefazCode" label="Código Sefaz">
                    <Input
                      prefix={<KeyOutlined />}
                      placeholder="Código Sefaz"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="sefazId" label="ID Sefaz">
                    <Input prefix={<KeyOutlined />} placeholder="ID Sefaz" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <TeamOutlined /> Gerenciamento de Usuários
            </span>
          }
          key="2"
        >
          <Card
            title={
              <Space>
                <TeamOutlined />
                <span>Usuários do Sistema</span>
              </Space>
            }
            extra={
              <Space>
                <Button type="dashed" onClick={fetchUsers} loading={loading}>
                  Atualizar
                </Button>
              </Space>
            }
          >
            <Table
              columns={userColumns}
              dataSource={usersList}
              loading={loading}
              pagination={{ pageSize: 10 }}
              rowKey="key"
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ margin: 0 }}>
                    <Text type="secondary">ID: {record.id}</Text>
                    <Divider type="vertical" />
                    <Text type="secondary">Permissões: {record.role}</Text>
                  </div>
                ),
              }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </Layout>
  );
}

export default Configuracoes;
