import React, { useCallback, useMemo } from "react";
import {
  Modal,
  Row,
  Col,
  Statistic,
  Divider,
  Alert,
  Space,
  Button,
  Form,
  InputNumber,
  Input,
  Switch,
} from "antd";
import {
  DollarOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;

const PaymentModal = ({
  visible,
  onCancel,
  onConfirm,
  totalVendaAtual,
  formaPagamento,
  valoresPorForma,
  toggleFormaPagamento,
  handleValorPagamentoChange,
  valorRecebido,
  setValorRecebido,
  troco,
  totalPago,
  isMobile,
  gerarCupomState,
  setGerarCupomState,
  cupomCnpj,
  setCupomCnpj,
  cupomObs,
  setCupomObs,
  loading,
}) => {
  // Memoizar os métodos de pagamento para evitar re-criação
  const paymentMethods = useMemo(
    () => [
      {
        key: "dinheiro",
        label: "Dinheiro",
        icon: <DollarOutlined />,
        color: "#1890ff",
      },
      { key: "pix", label: "PIX", icon: null, color: "#52c41a" },
      {
        key: "credito",
        label: "Crédito",
        icon: <CreditCardOutlined />,
        color: "#722ed1",
      },
      {
        key: "debito",
        label: "Débito",
        icon: <CreditCardOutlined />,
        color: "#fa8c16",
      },
    ],
    []
  );

  // Otimizar handlers para evitar re-criação
  const handleCnpjChange = useCallback((e) => {
    setCupomCnpj(e.target.value);
  }, []);

  const handleObsChange = useCallback((e) => {
    setCupomObs(e.target.value);
  }, []);

  const handleCupomToggle = useCallback((checked) => {
    setGerarCupomState(checked);
  }, []);

  // Otimizar handlers de pagamento
  const handlePaymentMethodToggle = useCallback((methodKey) => {
    toggleFormaPagamento(methodKey);
  }, []);

  const handlePaymentValueChange = useCallback((forma, valor) => {
    handleValorPagamentoChange(forma, valor);
  }, []);

  const handleValorRecebidoChange = useCallback((valor) => {
    setValorRecebido(valor);
  }, []);

  return (
    <Modal
      title="Finalizar Venda"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={isMobile ? "95%" : 700}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Statistic
            title="Total da Venda"
            value={totalVendaAtual}
            precision={2}
            prefix="R$"
            valueStyle={{ color: "#cf1322", fontSize: 24 }}
          />
        </Col>

        <Col span={24}>
          <Divider orientation="left">Formas de Pagamento</Divider>
          <Alert
            message="Selecione até duas formas de pagamento"
            description="Para pagamento com múltiplas formas, você precisará informar o valor para cada método."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Space
            size="large"
            style={{
              width: "100%",
              justifyContent: isMobile ? "space-between" : "space-around",
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            {paymentMethods.map((method) => (
              <Button
                key={method.key}
                type={
                  formaPagamento.includes(method.key) ? "primary" : "default"
                }
                size="large"
                icon={method.icon}
                onClick={() => handlePaymentMethodToggle(method.key)}
                style={{
                  height: isMobile ? 60 : 80,
                  width: isMobile ? "46%" : 120,
                  margin: isMobile ? "4px 0" : 0,
                  background: formaPagamento.includes(method.key)
                    ? method.color
                    : undefined,
                  borderColor: formaPagamento.includes(method.key)
                    ? method.color
                    : undefined,
                }}
              >
                {method.label}
              </Button>
            ))}
          </Space>
        </Col>

        {formaPagamento.length > 0 && (
          <Col span={24}>
            <Divider orientation="left">Valores por Forma de Pagamento</Divider>
            <Form layout="vertical">
              {formaPagamento.map((forma) => (
                <Form.Item
                  key={forma}
                  label={`Valor em ${forma.toUpperCase()}`}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    size="large"
                    min={0}
                    max={totalVendaAtual}
                    step={0.01}
                    precision={2}
                    prefix="R$"
                    value={valoresPorForma[forma] || 0}
                    onChange={(valor) => handlePaymentValueChange(forma, valor)}
                  />
                </Form.Item>
              ))}

              {formaPagamento.includes("dinheiro") && (
                <>
                  <Form.Item label="Valor Recebido em Dinheiro">
                    <InputNumber
                      style={{ width: "100%" }}
                      size="large"
                      min={valoresPorForma["dinheiro"] || 0}
                      step={1}
                      precision={2}
                      prefix="R$"
                      value={valorRecebido}
                      onChange={handleValorRecebidoChange}
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Troco"
                        value={troco}
                        precision={2}
                        prefix="R$"
                        valueStyle={{
                          color: troco > 0 ? "#3f8600" : "#8c8c8c",
                        }}
                      />
                    </Col>
                  </Row>
                </>
              )}

              <Row gutter={16}>
                <Col span={isMobile ? 24 : 12}>
                  <Statistic
                    title="Total Pago"
                    value={totalPago}
                    precision={2}
                    prefix="R$"
                    valueStyle={{
                      color:
                        totalPago === totalVendaAtual ? "#3f8600" : "#cf1322",
                    }}
                  />
                </Col>
                <Col span={isMobile ? 24 : 12}>
                  <Statistic
                    title="Restante"
                    value={Math.max(0, totalVendaAtual - totalPago)}
                    precision={2}
                    prefix="R$"
                    valueStyle={{
                      color:
                        totalPago >= totalVendaAtual ? "#3f8600" : "#cf1322",
                    }}
                  />
                </Col>
              </Row>

              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={isMobile ? 24 : 12}>
                  <Button type="default" size="large" block onClick={onCancel}>
                    Cancelar
                  </Button>
                </Col>
                <Col
                  span={isMobile ? 24 : 12}
                  style={{
                    textAlign: isMobile ? "center" : "right",
                    marginTop: isMobile ? 16 : 0,
                  }}
                >
                  <Button
                    type="primary"
                    size="large"
                    onClick={onConfirm}
                    disabled={
                      totalPago !== totalVendaAtual ||
                      (formaPagamento.includes("dinheiro") &&
                        valorRecebido < valoresPorForma["dinheiro"])
                    }
                    loading={loading}
                    icon={<CheckCircleOutlined />}
                  >
                    Concluir Venda
                  </Button>
                </Col>
              </Row>
            </Form>
          </Col>
        )}

        <Col span={24}>
          <Divider orientation="left">Cupom</Divider>
          <Form layout="vertical">
            <Form.Item>
              <Switch
                checked={gerarCupomState}
                onChange={handleCupomToggle}
                checkedChildren="Com Cupom"
                unCheckedChildren="Sem Cupom"
              />
              <span style={{ marginLeft: 8 }}>Gerar cupom?</span>
            </Form.Item>
            {gerarCupomState && (
              <>
                <Form.Item label="CNPJ no cupom (opcional)">
                  <Input
                    value={cupomCnpj}
                    onChange={handleCnpjChange}
                    placeholder="Digite o CNPJ para o cupom"
                  />
                </Form.Item>
                <Form.Item label="Observações (opcional)">
                  <TextArea
                    value={cupomObs}
                    onChange={handleObsChange}
                    placeholder="Observações para o cupom"
                    rows={3}
                  />
                </Form.Item>
              </>
            )}
          </Form>
        </Col>
      </Row>
    </Modal>
  );
};

export default PaymentModal;
