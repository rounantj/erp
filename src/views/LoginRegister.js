// src/views/LoginRegister.js
import React, { useState, useContext, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Alert,
  Typography,
  Row,
  Col,
  Spin,
  notification,
} from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { UserContext } from "context/UserContext";
import { makeLogin, makeRegister } from "helpers/api-integrator";

const { Title, Text } = Typography;

const LoginRegister = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const { user, setUser } = useContext(UserContext);
  const [logged, setLogged] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    if (user?.access_token) {
      setLogged(true);
    }
  }, [user]);

  // Function to handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Validate passwords match for registration
      if (isRegister && values.password !== values.confirmPassword) {
        notification.error({
          message: "Erro de validação",
          description: "As senhas não coincidem",
          duration: 4,
        });
        setLoading(false);
        return;
      }

      // Call API for login or register
      const response = isRegister
        ? await makeRegister(values.email, values.password)
        : await makeLogin(values.email, values.password);

      if (!response.success) {
        notification.error({
          message: "Erro",
          description: response.message,
          duration: 4,
        });
      } else {
        notification.success({
          message: "Sucesso",
          description: "Operação realizada com sucesso!",
          duration: 4,
        });

        // Set user in context and localStorage
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
        window.location.replace("/");
      }
    } catch (error) {
      notification.error({
        message: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação.",
        duration: 4,
      });
      console.error(error);
    }
    setLoading(false);
  };

  // Toggle between login and register
  const toggleRegister = () => {
    form.resetFields();
    setIsRegister(!isRegister);
  };

  // Password validation rules
  const validatePassword = (_, value) => {
    const pattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
    const ok = pattern.test(value);
    console.log({ value, ok });

    if (!value || ok) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        "A senha deve ter pelo menos 6 caracteres, uma letra e um número"
      )
    );
  };

  // If user is already logged in, show logo
  if (logged) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "80vh" }}>
        <Col>
          <img
            src={require("assets/img/logo.png")}
            alt="logo"
            style={{ maxWidth: "350px" }}
          />
        </Col>
      </Row>
    );
  }

  return (
    <Row justify="center" style={{ marginTop: 50 }}>
      <Col xs={22} sm={16} md={12} lg={8} xl={6}>
        <Card
          bordered={false}
          style={{
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            borderRadius: "8px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <img
              src={require("assets/img/logo.png")}
              alt="logo"
              style={{ maxWidth: "150px" }}
            />
            <Title level={3}>
              {isRegister ? "Crie sua conta" : "Bem-vindo de volta"}
            </Title>
            <Text type="secondary">
              {isRegister
                ? "Preencha os dados para criar sua conta"
                : "Faça login para continuar"}
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            name="loginForm"
            onFinish={handleSubmit}
            requiredMark={false}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Por favor, insira seu e-mail" },
                { type: "email", message: "E-mail inválido" },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                placeholder="E-mail"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Por favor, insira sua senha" },
                { validator: validatePassword },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                placeholder="Senha"
                size="large"
              />
            </Form.Item>

            {isRegister && (
              <Form.Item
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Por favor, confirme sua senha" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("As senhas não coincidem")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                  placeholder="Confirme a senha"
                  size="large"
                />
              </Form.Item>
            )}

            {!isRegister && (
              <Form.Item>
                <Button type="link" style={{ padding: 0 }}>
                  Esqueceu a senha?
                </Button>
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{ width: "100%", height: "40px" }}
                loading={loading}
              >
                {isRegister ? "Criar conta" : "Entrar"}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center" }}>
            <Text type="secondary">
              {isRegister ? "Já tem uma conta?" : "Ainda não tem uma conta?"}
            </Text>{" "}
            <Button
              type="link"
              onClick={toggleRegister}
              style={{ padding: "0 4px" }}
            >
              {isRegister ? "Faça login" : "Registre-se agora"}
            </Button>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default LoginRegister;
