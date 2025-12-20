import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Space,
  Divider,
} from "antd";
import {
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// Função para formatar valor como moeda brasileira
const formatCurrency = (value) => {
  if (!value && value !== 0) return "";
  const numValue = typeof value === "string" ? parseFloat(value.replace(/[^\d]/g, "") || 0) / 100 : value;
  return numValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Função para extrair valor numérico de string formatada
const parseCurrency = (value) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  // Remove tudo exceto números
  const numericValue = value.replace(/[^\d]/g, "");
  return parseFloat(numericValue || 0) / 100;
};

const OpenCaixaModal = ({ visible, onCancel, onConfirm, loading, isMobile }) => {
  const [form] = Form.useForm();
  const [valorAbertura, setValorAbertura] = useState(0);
  const [displayValue, setDisplayValue] = useState("0,00");

  // Reset quando o modal abre
  useEffect(() => {
    if (visible) {
      setValorAbertura(0);
      setDisplayValue("0,00");
      form.setFieldsValue({ valorAbertura: "0,00" });
    }
  }, [visible, form]);

  const handleInputChange = (e) => {
    let value = e.target.value;
    
    // Remove tudo exceto números
    const numericOnly = value.replace(/[^\d]/g, "");
    
    // Converte para número com 2 casas decimais
    const numValue = parseFloat(numericOnly || 0) / 100;
    
    // Formata para exibição
    const formatted = formatCurrency(numValue);
    
    setDisplayValue(formatted);
    setValorAbertura(numValue);
    form.setFieldsValue({ valorAbertura: formatted });
  };

  const handleSubmit = async () => {
    if (valorAbertura < 0) {
      return;
    }
    // Permite valor 0 para abertura de caixa
    onConfirm(valorAbertura);
  };

  const handleCancel = () => {
    form.resetFields();
    setValorAbertura(0);
    setDisplayValue("0,00");
    onCancel();
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <DollarOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          <span>Abrir Caixa</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={isMobile ? "100%" : 400}
      centered
      style={isMobile ? { top: 0, padding: 0, margin: 0 } : {}}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ valorAbertura: "0,00" }}
      >
        <Alert
          message="Abertura de Caixa"
          description="Informe o valor inicial que está no caixa para começar as vendas."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form.Item
          label="Valor Inicial do Caixa (R$)"
          name="valorAbertura"
          rules={[
            {
              required: true,
              message: "Por favor, informe o valor inicial do caixa!",
            },
          ]}
        >
          <Input
            size="large"
            style={{ 
              width: "100%", 
              fontSize: isMobile ? "18px" : "16px",
              textAlign: "right",
              fontWeight: "600",
            }}
            prefix={<Text style={{ color: "#999" }}>R$</Text>}
            placeholder="0,00"
            autoFocus
            value={displayValue}
            onChange={handleInputChange}
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </Form.Item>

        <Divider />

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
            R$ {formatCurrency(valorAbertura)}
          </Title>
          <Text type="secondary">
            Valor que será registrado como saldo inicial
          </Text>
        </div>

        <Space
          size="middle"
          style={{ width: "100%", justifyContent: "center" }}
          direction={isMobile ? "vertical" : "horizontal"}
        >
          {isMobile ? (
            <>
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={handleSubmit}
                loading={loading}
                block
                style={{ height: "48px", borderRadius: "12px" }}
              >
                Abrir Caixa
              </Button>
              <Button
                size="large"
                icon={<CloseCircleOutlined />}
                onClick={handleCancel}
                disabled={loading}
                block
                style={{ height: "48px", borderRadius: "12px" }}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                size="large"
                icon={<CloseCircleOutlined />}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={handleSubmit}
                loading={loading}
              >
                Abrir Caixa
              </Button>
            </>
          )}
        </Space>
      </Form>
    </Modal>
  );
};

export default OpenCaixaModal;
