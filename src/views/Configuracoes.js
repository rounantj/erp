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
