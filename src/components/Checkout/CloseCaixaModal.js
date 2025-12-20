import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Button,
  Typography,
  Divider,
  Row,
  Col,
  Statistic,
  Alert,
} from "antd";
import {
  DollarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const CloseCaixaModal = ({
  visible,
  onCancel,
  onConfirm,
  loading,
  caixa,
  resumoVendas,
  valorAbertura,
}) => {
  const [form] = Form.useForm();
  const [saldoFinal, setSaldoFinal] = useState(0);
  const [diferenca, setDiferenca] = useState(0);

  // Calcular saldo esperado
  const saldoEsperado = (valorAbertura || 0) + (resumoVendas?.dinheiro || 0);

  // Recalcular diferença quando saldo final mudar
  useEffect(() => {
    const diff = saldoFinal - saldoEsperado;
    setDiferenca(diff);
  }, [saldoFinal, saldoEsperado]);

  const handleSubmit = () => {
    if (!caixa?.id) {
      return;
    }
    onConfirm(caixa.id, saldoFinal, diferenca);
  };

  const handleCancel = () => {
    form.resetFields();
    setSaldoFinal(0);
    setDiferenca(0);
    onCancel();
  };

  const formatCurrency = (value) => {
    return `R$ ${(value || 0).toFixed(2).replace(".", ",")}`;
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <DollarOutlined style={{ marginRight: 8, color: "#ff4d4f" }} />
          <span>Fechar Caixa</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
      destroyOnClose
    >
      {/* Resumo do Caixa */}
      <div
        style={{
          background: "#f5f5f5",
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <Title level={5} style={{ marginBottom: 16 }}>
          Resumo do Caixa
        </Title>

        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="Saldo Inicial"
              value={valorAbertura || 0}
              precision={2}
              prefix="R$"
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Vendas em Dinheiro"
              value={resumoVendas?.dinheiro || 0}
              precision={2}
              prefix="R$"
              valueStyle={{ fontSize: 16, color: "#52c41a" }}
            />
          </Col>
        </Row>

        <Divider style={{ margin: "12px 0" }} />

        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="Total Vendas"
              value={resumoVendas?.total || 0}
              precision={2}
              prefix="R$"
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Qtd. Vendas"
              value={resumoVendas?.totalVendas || 0}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
        </Row>

        <Divider style={{ margin: "12px 0" }} />

        <Statistic
          title="Saldo Esperado em Caixa"
          value={saldoEsperado}
          precision={2}
          prefix="R$"
          valueStyle={{ fontSize: 20, color: "#1890ff", fontWeight: "bold" }}
        />
      </div>

      {/* Formulário */}
      <Form form={form} layout="vertical">
        <Form.Item
          label={<Text strong>Saldo Final Contado (dinheiro no caixa)</Text>}
        >
          <InputNumber
            style={{ width: "100%" }}
            size="large"
            min={0}
            precision={2}
            value={saldoFinal}
            onChange={(value) => setSaldoFinal(value || 0)}
            formatter={(value) =>
              `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
            }
            parser={(value) =>
              value.replace(/R\$\s?|(\.)/g, "").replace(",", ".")
            }
            placeholder="0,00"
          />
        </Form.Item>

        {/* Diferença */}
        {saldoFinal > 0 && (
          <Alert
            type={
              diferenca === 0 ? "success" : diferenca > 0 ? "warning" : "error"
            }
            icon={
              diferenca === 0 ? (
                <CheckCircleOutlined />
              ) : (
                <ExclamationCircleOutlined />
              )
            }
            message={
              diferenca === 0
                ? "Caixa fechando correto!"
                : diferenca > 0
                ? `Sobra de ${formatCurrency(diferenca)}`
                : `Falta de ${formatCurrency(Math.abs(diferenca))}`
            }
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Divider />

        {/* Botões */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={handleCancel}>Cancelar</Button>
          <Button
            type="primary"
            danger
            onClick={handleSubmit}
            loading={loading}
            icon={<CheckCircleOutlined />}
          >
            Confirmar Fechamento
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CloseCaixaModal;
