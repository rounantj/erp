import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner, Modal, Form, Alert } from "react-bootstrap";
import { 
  CheckCircleOutlined, 
  CalendarOutlined,
  UserOutlined,
  SafetyOutlined,
  GiftOutlined,
  PercentageOutlined
} from "@ant-design/icons";
import { message, Tag, Timeline, Empty, Divider } from "antd";
import { SubscriptionContext } from "context/SubscriptionContext";
import { 
  getPlans, 
  createSubscription, 
  changePlan,
  getPaymentHistory,
  createSingleCharge 
} from "helpers/api-integrator";
import "./MeuPlano.css";

// Helper para converter features em array de strings
const getFeaturesList = (features) => {
  if (!features) return [];
  if (Array.isArray(features)) return features;
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object') {
        return Object.entries(parsed)
          .filter(([_, value]) => value === true)
          .map(([key]) => key);
      }
    } catch {
      return [];
    }
  }
  if (typeof features === 'object') {
    return Object.entries(features)
      .filter(([_, value]) => value === true)
      .map(([key]) => key);
  }
  return [];
};

// Labels amigáveis para features
const featureLabels = {
  sales: "Vendas",
  checkout: "Caixa",
  create_products: "Criar Produtos",
  employees: "Funcionários",
  curriculos: "Currículos",
  customization: "Personalização",
  product_images: "Imagens de Produtos",
};

const getFeatureLabel = (feature) => featureLabels[feature] || feature;

// Configuração de períodos com descontos
const BILLING_PERIODS = [
  { id: "monthly", label: "Mensal", months: 1, discount: 0 },
  { id: "quarterly", label: "Trimestral", months: 3, discount: 10 },
  { id: "yearly", label: "Anual", months: 12, discount: 20 },
];

const MeuPlano = () => {
  const { status, plan, subscription, refreshSubscription } = useContext(SubscriptionContext);
  const [plans, setPlans] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [paymentMethod] = useState("pix");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, historyRes] = await Promise.all([
        getPlans(),
        getPaymentHistory()
      ]);
      if (plansRes?.data) setPlans(plansRes.data);
      if (historyRes?.data) setPaymentHistory(historyRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const config = {
      active: { bg: "success", text: "Ativo", variant: "success" },
      trial: { bg: "info", text: "Período de Teste", variant: "info" },
      past_due: { bg: "warning", text: "Pagamento em Atraso", variant: "warning" },
      cancelled: { bg: "danger", text: "Cancelado", variant: "danger" },
      expired: { bg: "danger", text: "Expirado", variant: "danger" },
      readonly: { bg: "secondary", text: "Somente Leitura", variant: "secondary" },
      no_subscription: { bg: "secondary", text: "Sem Plano", variant: "secondary" }
    };
    return config[status] || config.no_subscription;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value || 0);
  };

  // Calcular preço com desconto
  const calculatePrice = (basePrice, periodId) => {
    const period = BILLING_PERIODS.find(p => p.id === periodId);
    if (!period || basePrice === 0) return { total: 0, monthly: 0, discount: 0, savings: 0 };
    
    const fullPrice = basePrice * period.months;
    const discount = period.discount;
    const total = fullPrice * (1 - discount / 100);
    const monthly = total / period.months;
    const savings = fullPrice - total;
    
    return { total, monthly, discount, savings, months: period.months };
  };

  const handleSelectPlan = (planItem) => {
    if (planItem.name === "empresarial") {
      window.open("https://wa.me/5527996011204?text=Olá! Tenho interesse no plano Empresarial.", "_blank");
      return;
    }
    setSelectedPlan(planItem);
    setSelectedPeriod("monthly");
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;
    
    setLoadingPayment(true);
    try {
      const priceInfo = calculatePrice(selectedPlan.price, selectedPeriod);
      const response = subscription?.id 
        ? await changePlan(selectedPlan.id, selectedPeriod, priceInfo.total)
        : await createSubscription(selectedPlan.id, paymentMethod, null, selectedPeriod, priceInfo.total);
      
      // Sempre redirecionar para o checkout do Asaas
      const checkoutUrl = response?.data?.paymentUrl || response?.data?.invoiceUrl;
      
      if (checkoutUrl) {
        message.success("Abrindo página de pagamento...");
        setShowUpgradeModal(false);
        // Abrir em nova aba
        window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
      } else if (response?.data?.subscription) {
        message.success("Plano atualizado com sucesso!");
        refreshSubscription();
        setShowUpgradeModal(false);
      } else {
        message.error("Erro ao gerar link de pagamento. Tente novamente.");
      }
    } catch (error) {
      message.error("Erro ao processar. Tente novamente.");
      console.error(error);
    } finally {
      setLoadingPayment(false);
    }
  };

  const handlePayNow = async () => {
    setLoadingPayment(true);
    try {
      const response = await createSingleCharge(paymentMethod);
      
      // Abrir checkout do Asaas em nova aba
      const checkoutUrl = response?.data?.paymentUrl || response?.data?.invoiceUrl || response?.data?.payment?.invoiceUrl;
      
      if (checkoutUrl) {
        message.success("Abrindo página de pagamento...");
        window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
      } else {
        message.error("Erro ao gerar link de pagamento.");
      }
    } catch (error) {
      message.error("Erro ao gerar cobrança.");
      console.error(error);
    } finally {
      setLoadingPayment(false);
    }
  };

  const currentPlanFeatures = getFeaturesList(plan?.features);
  const statusConfig = getStatusConfig(status);

  if (loading) {
    return (
      <Container fluid className="meu-plano-container">
        <div className="loading-state">
          <Spinner animation="border" />
          <p>Carregando...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="meu-plano-container">
      {/* Header */}
      <div className="page-header">
        <h2>Meu Plano</h2>
        <p>Gerencie sua assinatura e veja seu histórico de pagamentos</p>
      </div>

      {/* Alert para pagamento pendente */}
      {(status === "past_due" || status === "expired") && (
        <Alert variant={statusConfig.variant} className="payment-alert">
          <div className="alert-content">
            <div>
              <strong>{status === "past_due" ? "Pagamento em Atraso" : "Período de Teste Expirado"}</strong>
              <p className="mb-0">
                {status === "past_due" 
                  ? "Regularize seu pagamento para continuar usando todas as funcionalidades."
                  : "Seu período de teste acabou. Escolha um plano para continuar."}
              </p>
            </div>
            <Button variant="dark" onClick={handlePayNow} disabled={loadingPayment}>
              {loadingPayment ? <Spinner size="sm" /> : "Pagar Agora"}
            </Button>
          </div>
        </Alert>
      )}

      <Row>
        {/* Plano Atual */}
        <Col lg={4} md={12} className="mb-4">
          <Card className="current-plan-card">
            <Card.Body>
              <div className="plan-header">
                <h4>{plan?.displayName || "Sem Plano"}</h4>
                <Badge bg={statusConfig.bg}>{statusConfig.text}</Badge>
              </div>

              <div className="plan-price-display">
                <span className="price">{formatCurrency(plan?.price || 0)}</span>
                <span className="period">/mês</span>
              </div>

              <div className="plan-details">
                <div className="detail-row">
                  <UserOutlined />
                  <span>Usuários</span>
                  <strong>{plan?.maxUsers === -1 ? "Ilimitados" : `Até ${plan?.maxUsers || 1}`}</strong>
                </div>
                <div className="detail-row">
                  <CalendarOutlined />
                  <span>Vencimento</span>
                  <strong>
                    {subscription?.currentPeriodEnd 
                      ? formatDate(subscription.currentPeriodEnd)
                      : subscription?.trialEndsAt 
                        ? formatDate(subscription.trialEndsAt)
                        : "-"}
                  </strong>
                </div>
              </div>

              <Divider style={{ margin: "16px 0" }} />

              <div className="features-section">
                <h6>Recursos Inclusos</h6>
                {currentPlanFeatures.length > 0 ? (
                  <ul className="features-list">
                    {currentPlanFeatures.map((feature, idx) => (
                      <li key={idx}>
                        <CheckCircleOutlined />
                        <span>{getFeatureLabel(feature)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-features">Nenhum recurso disponível</p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Planos Disponíveis */}
        <Col lg={8} md={12}>
          <Card className="plans-card">
            <Card.Header>
              <h5>Planos Disponíveis</h5>
              <p>Escolha o plano ideal para o seu negócio</p>
            </Card.Header>
            <Card.Body>
              <Row className="plans-grid">
                {plans.filter(p => p.isActive && !p.isInternal).map((planItem) => {
                  const isCurrentPlan = plan?.id === planItem.id;
                  const isFree = planItem.price === 0;
                  const isEnterprise = planItem.name === "empresarial";
                  const isProfessional = planItem.name === "profissional";

                  return (
                    <Col md={6} lg={3} key={planItem.id} className="mb-3">
                      <div className={`plan-card ${isCurrentPlan ? 'current' : ''} ${isProfessional ? 'popular' : ''}`}>
                        {isProfessional && <div className="popular-tag">Mais Popular</div>}
                        
                        <h6 className="plan-name">{planItem.displayName}</h6>
                        
                        <div className="plan-pricing">
                          {isFree ? (
                            <span className="price-free">Grátis</span>
                          ) : isEnterprise ? (
                            <span className="price-custom">Sob consulta</span>
                          ) : (
                            <>
                              <span className="currency">R$</span>
                              <span className="price-value">{Number(planItem.price).toFixed(0)}</span>
                              <span className="price-period">/mês</span>
                            </>
                          )}
                        </div>
                        
                        <div className="plan-users-info">
                          {planItem.maxUsers === -1 
                            ? "Usuários ilimitados" 
                            : `${planItem.maxUsers} usuário${planItem.maxUsers > 1 ? 's' : ''}`}
                        </div>

                        <ul className="plan-features">
                          {getFeaturesList(planItem.features).slice(0, 3).map((f, i) => (
                            <li key={i}>
                              <CheckCircleOutlined />
                              <span>{getFeatureLabel(f)}</span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          variant={isCurrentPlan ? "outline-secondary" : isProfessional ? "dark" : "outline-dark"}
                          className="plan-button"
                          onClick={() => handleSelectPlan(planItem)}
                          disabled={isCurrentPlan}
                        >
                          {isCurrentPlan ? "Plano Atual" : 
                            isEnterprise ? "Falar com Vendas" : "Assinar"}
                        </Button>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>

          {/* Histórico de Pagamentos */}
          <Card className="history-card mt-4">
            <Card.Header>
              <h5>Histórico de Pagamentos</h5>
            </Card.Header>
            <Card.Body>
              {paymentHistory.length > 0 ? (
                <div className="payment-list">
                  {paymentHistory.slice(0, 10).map((payment, idx) => (
                    <div key={idx} className="payment-item">
                      <div className="payment-status">
                        <span className={`status-dot ${payment.status === "confirmed" || payment.status === "received" ? 'success' : payment.status === "pending" ? 'pending' : 'error'}`}></span>
                      </div>
                      <div className="payment-details">
                        <strong>{formatCurrency(payment.amount)}</strong>
                        <span className="payment-date">{formatDate(payment.createdAt)}</span>
                      </div>
                      <div className="payment-method-tag">
                        {payment.paymentMethod === "pix" ? "PIX" :
                         payment.paymentMethod === "boleto" ? "Boleto" : "Cartão"}
                      </div>
                      <Tag color={
                        payment.status === "confirmed" || payment.status === "received" ? "success" :
                        payment.status === "pending" ? "processing" : "error"
                      }>
                        {payment.status === "confirmed" || payment.status === "received" ? "Pago" :
                         payment.status === "pending" ? "Pendente" : "Falhou"}
                      </Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty 
                  description="Nenhum pagamento registrado"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de Upgrade - Design Premium */}
      <Modal show={showUpgradeModal} onHide={() => setShowUpgradeModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Assinar {selectedPlan?.displayName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPlan && (
            <>
              <div className="selected-plan-info">
                <h5>Plano {selectedPlan.displayName}</h5>
                <p>Selecione o período que melhor atende suas necessidades</p>
              </div>

              {/* Seletor de Período */}
              <div className="period-selector">
                {BILLING_PERIODS.map((period) => {
                  const priceInfo = calculatePrice(selectedPlan.price, period.id);
                  const isSelected = selectedPeriod === period.id;
                  
                  return (
                    <div 
                      key={period.id}
                      className={`period-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedPeriod(period.id)}
                    >
                      {period.discount > 0 && (
                        <div className="discount-badge">
                          {period.discount}% OFF
                        </div>
                      )}
                      
                      <div className="period-label">{period.label}</div>
                      
                      <div className="period-price">
                        {selectedPlan.price === 0 ? (
                          <span className="free-text">Grátis</span>
                        ) : (
                          <>
                            <span className="total">{formatCurrency(priceInfo.total)}</span>
                            {period.months > 1 && (
                              <span className="monthly">{formatCurrency(priceInfo.monthly)}/mês</span>
                            )}
                          </>
                        )}
                      </div>

                      {priceInfo.savings > 0 && (
                        <div className="savings">
                          Economia de {formatCurrency(priceInfo.savings)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Resumo do Pedido */}
              <div className="order-summary">
                <h6>Resumo da Compra</h6>
                <div className="summary-row">
                  <span>Plano {selectedPlan.displayName} × {BILLING_PERIODS.find(p => p.id === selectedPeriod).months} {BILLING_PERIODS.find(p => p.id === selectedPeriod).months > 1 ? 'meses' : 'mês'}</span>
                  <span>{formatCurrency(selectedPlan.price * BILLING_PERIODS.find(p => p.id === selectedPeriod).months)}</span>
                </div>
                {calculatePrice(selectedPlan.price, selectedPeriod).discount > 0 && (
                  <div className="summary-row discount">
                    <span>Desconto {calculatePrice(selectedPlan.price, selectedPeriod).discount}%</span>
                    <span>- {formatCurrency(calculatePrice(selectedPlan.price, selectedPeriod).savings)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total a pagar</span>
                  <span>{formatCurrency(calculatePrice(selectedPlan.price, selectedPeriod).total)}</span>
                </div>
              </div>

              <Alert variant="secondary">
                <small>
                  <SafetyOutlined style={{ marginRight: 8 }} />
                  Pagamento seguro via Asaas. Aceita PIX, Boleto ou Cartão de Crédito.
                </small>
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowUpgradeModal(false)}>
            Voltar
          </Button>
          <Button 
            variant="dark" 
            onClick={handleConfirmUpgrade}
            disabled={loadingPayment}
          >
            {loadingPayment ? (
              <Spinner size="sm" />
            ) : (
              <>Pagar {formatCurrency(calculatePrice(selectedPlan?.price || 0, selectedPeriod).total)}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      </Container>
  );
};

export default MeuPlano;
