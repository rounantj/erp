import React, { useCallback, useMemo, useEffect } from "react";
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

// CSS para modal fullscreen no mobile
const mobileModalCSS = `
  .mobile-fullscreen-modal .ant-modal {
    top: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    max-width: 100vw !important;
    height: 100vh !important;
  }
  .mobile-fullscreen-modal .ant-modal-content {
    height: 100vh !important;
    border-radius: 0 !important;
    display: flex;
    flex-direction: column;
  }
  .mobile-fullscreen-modal .ant-modal-header {
    flex-shrink: 0;
  }
  .mobile-fullscreen-modal .ant-modal-body {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

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
  // Injetar CSS para modal fullscreen no mobile
  useEffect(() => {
    if (isMobile) {
      const styleId = "payment-modal-mobile-css";
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        styleEl.textContent = mobileModalCSS;
        document.head.appendChild(styleEl);
      }
    }
  }, [isMobile]);

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
      width={isMobile ? "100%" : 700}
      centered={!isMobile}
      style={
        isMobile
          ? {
              top: 0,
              margin: 0,
              maxWidth: "100vw",
              padding: 0,
              height: "100vh",
              maxHeight: "100vh",
            }
          : {}
      }
      styles={{
        body: isMobile
          ? {
              padding: "12px",
              height: "calc(100vh - 55px)",
              maxHeight: "calc(100vh - 55px)",
              overflowY: "auto",
            }
          : {}
      }}
      wrapClassName={isMobile ? "mobile-fullscreen-modal" : ""}
    >
      <Row gutter={[12, 12]}>
        <Col span={24}>
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: isMobile ? 12 : 8,
              padding: isMobile ? "12px 16px" : "16px 24px",
              color: "#fff",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: isMobile ? 11 : 12, opacity: 0.9 }}>
              Total da Venda
            </div>
            <div style={{ fontSize: isMobile ? 28 : 32, fontWeight: 700 }}>
              R$ {totalVendaAtual.toFixed(2).replace(".", ",")}
            </div>
          </div>
        </Col>

        <Col span={24}>
          <Divider
            orientation="left"
            style={{
              margin: isMobile ? "8px 0" : "16px 0",
              fontSize: isMobile ? 12 : 14,
            }}
          >
            Formas de Pagamento
          </Divider>
          {!isMobile && (
            <Alert
              message="Selecione até duas formas de pagamento"
              description="Para pagamento com múltiplas formas, você precisará informar o valor para cada método."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
              gap: isMobile ? 8 : 12,
              marginBottom: 12,
            }}
          >
            {paymentMethods.map((method) => (
              <Button
                key={method.key}
                type={
                  formaPagamento.includes(method.key) ? "primary" : "default"
                }
                size={isMobile ? "middle" : "large"}
                icon={method.icon}
                onClick={() => handlePaymentMethodToggle(method.key)}
                style={{
                  height: isMobile ? 50 : 70,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isMobile ? 12 : 14,
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
          </div>
        </Col>

        {formaPagamento.length > 0 && (
          <Col span={24}>
            <Divider
              orientation="left"
              style={{
                margin: isMobile ? "8px 0" : "16px 0",
                fontSize: isMobile ? 12 : 14,
              }}
            >
              Valores
            </Divider>
            <Form layout="vertical" size={isMobile ? "middle" : "large"}>
              {formaPagamento.map((forma) => (
                <Form.Item
                  key={forma}
                  label={`Valor em ${forma.toUpperCase()}`}
                  style={{ marginBottom: isMobile ? 8 : 16 }}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    size={isMobile ? "middle" : "large"}
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
                  <Form.Item
                    label="Valor Recebido"
                    style={{ marginBottom: isMobile ? 8 : 16 }}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      size={isMobile ? "middle" : "large"}
                      min={valoresPorForma["dinheiro"] || 0}
                      step={1}
                      precision={2}
                      prefix="R$"
                      value={valorRecebido}
                      onChange={handleValorRecebidoChange}
                    />
                  </Form.Item>

                  {troco > 0 && (
                    <div
                      style={{
                        background: "#f6ffed",
                        border: "1px solid #b7eb8f",
                        borderRadius: 8,
                        padding: isMobile ? "8px 12px" : "12px 16px",
                        marginBottom: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: isMobile ? 12 : 14 }}>
                        Troco:
                      </span>
                      <span
                        style={{
                          fontSize: isMobile ? 16 : 18,
                          fontWeight: 700,
                          color: "#52c41a",
                        }}
                      >
                        R$ {troco.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  )}
                </>
              )}

              <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                <Col span={12}>
                  <div
                    style={{
                      background:
                        totalPago >= totalVendaAtual ? "#f6ffed" : "#fff2f0",
                      border: `1px solid ${
                        totalPago >= totalVendaAtual ? "#b7eb8f" : "#ffccc7"
                      }`,
                      borderRadius: 8,
                      padding: isMobile ? "8px" : "12px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{ fontSize: isMobile ? 10 : 12, color: "#666" }}
                    >
                      Total Pago
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? 14 : 18,
                        fontWeight: 700,
                        color:
                          totalPago >= totalVendaAtual ? "#52c41a" : "#ff4d4f",
                      }}
                    >
                      R$ {totalPago.toFixed(2).replace(".", ",")}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div
                    style={{
                      background:
                        totalPago >= totalVendaAtual ? "#f6ffed" : "#fff2f0",
                      border: `1px solid ${
                        totalPago >= totalVendaAtual ? "#b7eb8f" : "#ffccc7"
                      }`,
                      borderRadius: 8,
                      padding: isMobile ? "8px" : "12px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{ fontSize: isMobile ? 10 : 12, color: "#666" }}
                    >
                      Restante
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? 14 : 18,
                        fontWeight: 700,
                        color:
                          totalPago >= totalVendaAtual ? "#52c41a" : "#ff4d4f",
                      }}
                    >
                      R${" "}
                      {Math.max(0, totalVendaAtual - totalPago)
                        .toFixed(2)
                        .replace(".", ",")}
                    </div>
                  </div>
                </Col>
              </Row>
            </Form>
          </Col>
        )}

        {formaPagamento.length > 0 && (
          <Col span={24}>
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 8,
                marginTop: 8,
              }}
            >
              <Button
                type="default"
                size={isMobile ? "middle" : "large"}
                block={isMobile}
                onClick={onCancel}
                style={{ flex: isMobile ? undefined : 1 }}
              >
                Cancelar
              </Button>
              <Button
                type="primary"
                size={isMobile ? "middle" : "large"}
                block={isMobile}
                onClick={onConfirm}
                disabled={
                  totalPago !== totalVendaAtual ||
                  (formaPagamento.includes("dinheiro") &&
                    valorRecebido < valoresPorForma["dinheiro"])
                }
                loading={loading}
                icon={<CheckCircleOutlined />}
                style={{
                  flex: isMobile ? undefined : 2,
                  background:
                    totalPago === totalVendaAtual ? "#52c41a" : undefined,
                  borderColor:
                    totalPago === totalVendaAtual ? "#52c41a" : undefined,
                }}
              >
                Concluir Venda
              </Button>
            </div>
          </Col>
        )}

        <Col span={24}>
          <Divider
            orientation="left"
            style={{
              margin: isMobile ? "8px 0" : "16px 0",
              fontSize: isMobile ? 12 : 14,
            }}
          >
            Cupom
          </Divider>
          <Form layout="vertical" size={isMobile ? "middle" : "large"}>
            <Form.Item style={{ marginBottom: isMobile ? 8 : 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Switch
                  checked={gerarCupomState}
                  onChange={handleCupomToggle}
                  checkedChildren="Sim"
                  unCheckedChildren="Não"
                />
                <span style={{ fontSize: isMobile ? 12 : 14 }}>
                  Gerar cupom?
                </span>
              </div>
            </Form.Item>
            {gerarCupomState && (
              <>
                <Form.Item
                  label="CNPJ no cupom (opcional)"
                  style={{ marginBottom: isMobile ? 8 : 16 }}
                >
                  <Input
                    value={cupomCnpj}
                    onChange={handleCnpjChange}
                    placeholder="Digite o CNPJ"
                    size={isMobile ? "middle" : "large"}
                  />
                </Form.Item>
                <Form.Item
                  label="Observações (opcional)"
                  style={{ marginBottom: isMobile ? 8 : 16 }}
                >
                  <TextArea
                    value={cupomObs}
                    onChange={handleObsChange}
                    placeholder="Observações"
                    rows={isMobile ? 2 : 3}
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
