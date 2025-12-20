import React, { useState } from "react";
import {
  Modal,
  Form,
  InputNumber,
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

const OpenCaixaModal = ({ visible, onCancel, onConfirm, loading }) => {
  const [form] = Form.useForm();
  const [valorAbertura, setValorAbertura] = useState(0);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onConfirm(values.valorAbertura);
    } catch (error) {
      console.error("Erro na validação:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setValorAbertura(0);
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
      width={400}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ valorAbertura: 0 }}
        onValuesChange={(changedValues) => {
          if (changedValues.valorAbertura !== undefined) {
            setValorAbertura(changedValues.valorAbertura);
          }
        }}
      >
        <Alert
          message="Abertura de Caixa"
          description="Informe o valor inicial que está no caixa para começar as vendas."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form.Item
          label="Valor Inicial do Caixa"
          name="valorAbertura"
          rules={[
            {
              required: true,
              message: "Por favor, informe o valor inicial do caixa!",
            },
            {
              type: "number",
              min: 0,
              message: "O valor deve ser maior ou igual a zero!",
            },
          ]}
        >
          <InputNumber
            size="large"
            style={{ width: "100%" }}
            prefix="R$"
            precision={2}
            min={0}
            step={0.01}
            placeholder="0,00"
            autoFocus
          />
        </Form.Item>

        <Divider />

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
            R$ {valorAbertura.toFixed(2).replace(".", ",")}
          </Title>
          <Text type="secondary">
            Valor que será registrado como saldo inicial
          </Text>
        </div>

        <Space
          size="middle"
          style={{ width: "100%", justifyContent: "center" }}
        >
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
            disabled={valorAbertura <= 0}
          >
            Abrir Caixa
          </Button>
        </Space>
      </Form>
    </Modal>
  );
};

export default OpenCaixaModal;
