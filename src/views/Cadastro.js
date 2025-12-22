// src/views/Cadastro.js
import React, { useState, useContext, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Checkbox,
  Alert,
  Typography,
  Row,
  Col,
  Spin,
  notification,
  Modal,
  message,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  IdcardOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  RocketOutlined,
  CustomerServiceOutlined,
} from "@ant-design/icons";
import { registerCompany } from "helpers/api-integrator";
import { useHistory } from "react-router-dom";
import { UserContext } from "context/UserContext";

const { Title, Text, Paragraph } = Typography;

const Cadastro = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const history = useHistory();
  const { user } = useContext(UserContext);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user?.access_token) {
      history.push("/admin/dashboard");
    }
  }, [user, history]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        companyName: values.companyName,
        adminName: values.adminName,
        email: values.email,
        phone: values.phone || "",
        cpfCnpj: values.cpfCnpj || "",
        acceptTerms: values.acceptTerms,
      };

      const response = await registerCompany(payload);

      if (response.success) {
        setGeneratedPassword(response.data.password);
        setRegisteredEmail(response.data.email);
        setShowSuccessModal(true);
        form.resetFields();
      } else {
        notification.error({
          message: "Erro no cadastro",
          description: response.message,
          duration: 5,
        });
      }
    } catch (error) {
      notification.error({
        message: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação.",
        duration: 5,
      });
      console.error(error);
    }
    setLoading(false);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    message.success("Senha copiada para a área de transferência!");
    setTimeout(() => setCopied(false), 3000);
  };

  const goToLogin = () => {
    setShowSuccessModal(false);
    history.push("/admin/login-register");
  };

  // Formatação de CPF/CNPJ
  const formatCpfCnpj = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      // CPF
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      // CNPJ
      return numbers
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }
  };

  // Formatação de telefone
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
  };

  return (
    <div style={styles.container}>
      <Row justify="center" align="middle" style={{ minHeight: "100vh", padding: "20px" }}>
        <Col xs={24} sm={24} md={20} lg={18} xl={16}>
          <Card bordered={false} style={styles.mainCard}>
            <Row gutter={[48, 24]}>
              {/* Coluna Esquerda - Formulário */}
              <Col xs={24} md={12}>
                <div style={styles.formSection}>
                  <div style={styles.logoSection}>
                    <img
                      src={require("assets/img/logo.png")}
                      alt="Fofa AI"
                      style={styles.logo}
                    />
                  </div>

                  <Title level={2} style={styles.title}>
                    Crie sua conta grátis
                  </Title>
                  <Text type="secondary" style={styles.subtitle}>
                    Teste por 15 dias sem compromisso. Sem cartão de crédito.
                  </Text>

                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    requiredMark={false}
                    style={{ marginTop: 32 }}
                  >
                    <Form.Item
                      name="companyName"
                      label="Nome da Empresa"
                      rules={[
                        { required: true, message: "Digite o nome da empresa" },
                      ]}
                    >
                      <Input
                        prefix={<ShopOutlined style={styles.inputIcon} />}
                        placeholder="Ex: Papelaria Central"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="adminName"
                      label="Seu Nome"
                      rules={[
                        { required: true, message: "Digite seu nome" },
                      ]}
                    >
                      <Input
                        prefix={<UserOutlined style={styles.inputIcon} />}
                        placeholder="Ex: João Silva"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="email"
                      label="E-mail"
                      rules={[
                        { required: true, message: "Digite seu e-mail" },
                        { type: "email", message: "E-mail inválido" },
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined style={styles.inputIcon} />}
                        placeholder="seu@email.com"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      name="phone"
                      label="Telefone (opcional)"
                    >
                      <Input
                        prefix={<PhoneOutlined style={styles.inputIcon} />}
                        placeholder="(00) 00000-0000"
                        size="large"
                        maxLength={15}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          form.setFieldsValue({ phone: formatted });
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="cpfCnpj"
                      label="CPF ou CNPJ (opcional)"
                    >
                      <Input
                        prefix={<IdcardOutlined style={styles.inputIcon} />}
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        size="large"
                        maxLength={18}
                        onChange={(e) => {
                          const formatted = formatCpfCnpj(e.target.value);
                          form.setFieldsValue({ cpfCnpj: formatted });
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="acceptTerms"
                      valuePropName="checked"
                      rules={[
                        {
                          validator: (_, value) =>
                            value
                              ? Promise.resolve()
                              : Promise.reject(new Error("Aceite os termos para continuar")),
                        },
                      ]}
                    >
                      <Checkbox>
                        Li e aceito os{" "}
                        <a href="/terms" target="_blank" rel="noopener noreferrer">
                          Termos de Uso
                        </a>{" "}
                        e{" "}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer">
                          Política de Privacidade
                        </a>
                      </Checkbox>
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        block
                        loading={loading}
                        style={styles.submitButton}
                      >
                        Criar minha conta grátis
                      </Button>
                    </Form.Item>

                    <div style={styles.loginLink}>
                      <Text type="secondary">Já tem uma conta? </Text>
                      <Button
                        type="link"
                        onClick={() => history.push("/admin/login-register")}
                        style={{ padding: 0 }}
                      >
                        Fazer login
                      </Button>
                    </div>
                  </Form>
                </div>
              </Col>

              {/* Coluna Direita - Benefícios */}
              <Col xs={24} md={12}>
                <div style={styles.benefitsSection}>
                  <Title level={3} style={styles.benefitsTitle}>
                    O que você terá no período de teste:
                  </Title>

                  <div style={styles.benefitsList}>
                    <div style={styles.benefitItem}>
                      <div style={styles.benefitIcon}>
                        <RocketOutlined style={{ fontSize: 24, color: "#10B981" }} />
                      </div>
                      <div>
                        <Text strong style={styles.benefitTitle}>Acesso completo ao sistema</Text>
                        <br />
                        <Text type="secondary">
                          PDV, gestão de produtos, relatórios e muito mais
                        </Text>
                      </div>
                    </div>

                    <div style={styles.benefitItem}>
                      <div style={styles.benefitIcon}>
                        <SafetyOutlined style={{ fontSize: 24, color: "#10B981" }} />
                      </div>
                      <div>
                        <Text strong style={styles.benefitTitle}>Sem cartão de crédito</Text>
                        <br />
                        <Text type="secondary">
                          Teste sem compromisso por 15 dias completos
                        </Text>
                      </div>
                    </div>

                    <div style={styles.benefitItem}>
                      <div style={styles.benefitIcon}>
                        <CustomerServiceOutlined style={{ fontSize: 24, color: "#10B981" }} />
                      </div>
                      <div>
                        <Text strong style={styles.benefitTitle}>Suporte incluído</Text>
                        <br />
                        <Text type="secondary">
                          Tire suas dúvidas por WhatsApp ou e-mail
                        </Text>
                      </div>
                    </div>
                  </div>

                  <div style={styles.trustBadge}>
                    <CheckCircleOutlined style={{ color: "#10B981", fontSize: 18 }} />
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      Mais de 500 empresas já confiam no Fofa AI
                    </Text>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Modal de Sucesso com Senha */}
      <Modal
        open={showSuccessModal}
        closable={false}
        footer={null}
        centered
        width={480}
        maskClosable={false}
      >
        <div style={styles.successModal}>
          <div style={styles.successIcon}>
            <CheckCircleOutlined style={{ fontSize: 48, color: "#10B981" }} />
          </div>

          <Title level={3} style={{ marginBottom: 8, textAlign: "center" }}>
            Conta criada com sucesso! 🎉
          </Title>

          <Paragraph type="secondary" style={{ textAlign: "center", marginBottom: 24 }}>
            Sua empresa foi cadastrada e você já pode acessar o sistema.
          </Paragraph>

          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
            message={
              <Text strong style={{ fontSize: 14 }}>
                ⚠️ IMPORTANTE: Salve sua senha agora!
              </Text>
            }
            description={
              <Text type="secondary">
                Esta senha será exibida apenas uma vez. Você poderá alterá-la depois nas Configurações.
              </Text>
            }
          />

          <div style={styles.passwordBox}>
            <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
              Sua senha de acesso:
            </Text>
            <div style={styles.passwordDisplay}>
              <Text strong style={{ fontSize: 24, letterSpacing: 2, fontFamily: "monospace" }}>
                {generatedPassword}
              </Text>
              <Button
                type={copied ? "primary" : "default"}
                icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />}
                onClick={copyPassword}
                style={{ marginLeft: 12 }}
              >
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </div>
            <Text type="secondary" style={{ display: "block", marginTop: 12 }}>
              E-mail: <Text strong>{registeredEmail}</Text>
            </Text>
          </div>

          <Button
            type="primary"
            size="large"
            block
            onClick={goToLogin}
            style={{ ...styles.submitButton, marginTop: 24 }}
          >
            Copiei minha senha, ir para o login
          </Button>
        </div>
      </Modal>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #e4e6f1 100%)",
  },
  mainCard: {
    borderRadius: 16,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
  },
  formSection: {
    padding: "20px 10px",
  },
  logoSection: {
    textAlign: "center",
    marginBottom: 24,
  },
  logo: {
    maxWidth: 150,
    height: "auto",
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    color: "#1F2937",
  },
  subtitle: {
    display: "block",
    textAlign: "center",
    fontSize: 15,
  },
  inputIcon: {
    color: "#9CA3AF",
  },
  submitButton: {
    height: 48,
    fontSize: 16,
    fontWeight: 600,
    background: "#10B981",
    borderColor: "#10B981",
  },
  loginLink: {
    textAlign: "center",
    marginTop: 16,
  },
  benefitsSection: {
    padding: "40px 20px",
    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    borderRadius: 12,
    height: "100%",
  },
  benefitsTitle: {
    marginBottom: 32,
    color: "#1F2937",
  },
  benefitsList: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  benefitItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    background: "#fff",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    flexShrink: 0,
  },
  benefitTitle: {
    fontSize: 15,
    color: "#1F2937",
  },
  trustBadge: {
    display: "flex",
    alignItems: "center",
    marginTop: 40,
    padding: "12px 16px",
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
  },
  successModal: {
    padding: "20px 0",
  },
  successIcon: {
    textAlign: "center",
    marginBottom: 16,
  },
  passwordBox: {
    background: "#F9FAFB",
    borderRadius: 12,
    padding: 20,
    border: "2px dashed #D1D5DB",
  },
  passwordDisplay: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px 0",
    background: "#fff",
    borderRadius: 8,
    marginTop: 8,
  },
};

export default Cadastro;

