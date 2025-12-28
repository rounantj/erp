/*!

=========================================================
* Light Bootstrap Dashboard React - v2.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/light-bootstrap-dashboard-react
* Copyright 2022 Reboot Soluções (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/light-bootstrap-dashboard-react/blob/master/LICENSE.md)

* Coded by Reboot Soluções

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React, { useContext, useEffect, useState } from "react";
import { useLocation, Route, Switch, useHistory } from "react-router-dom";
import { Button, Spinner } from "react-bootstrap";
import {
  CreditCardOutlined,
  CloseCircleOutlined,
  LockOutlined,
  ClockCircleOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";

import AdminNavbar from "components/Navbars/AdminNavbar";
import Footer from "components/Footer/Footer";
import Sidebar from "components/Sidebar/Sidebar";
import FixedPlugin from "components/FixedPlugin/FixedPlugin.js";
import OnboardingTour, { WelcomeModal } from "components/OnboardingTour";

import routes from "routes.js";

import sidebarImage from "assets/img/sidebar-3.jpg";
import { UserContext } from "context/UserContext";
import { useCompany } from "context/CompanyContext";
import { SubscriptionContext } from "context/SubscriptionContext";
import { createSingleCharge } from "helpers/api-integrator";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

// Email do Super Admin - único usuário com acesso a funcionalidades exclusivas
const SUPER_ADMIN_EMAIL = "rounantj@hotmail.com";

// Função para verificar se é Super Admin
const isSuperAdmin = (userEmail) => {
  if (!userEmail) return false;
  return userEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
};

// Função para escurecer cor hex
const darkenColor = (hex, percent) => {
  if (!hex || !hex.startsWith("#")) return hex;
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, Math.min(255, r + percent));
  g = Math.max(0, Math.min(255, g + percent));
  b = Math.max(0, Math.min(255, b + percent));
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

function Admin() {
  const [image, setImage] = React.useState(sidebarImage);
  const [color, setColor] = React.useState("black");
  const [hasImage, setHasImage] = React.useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const mainPanel = React.useRef(null);
  const { user } = useContext(UserContext);
  const {
    needsOnboarding,
    loading: companyLoading,
    onboardingCompleted,
    sidebarColor,
  } = useCompany();
  const {
    status,
    isReadonly,
    canAccess,
    plan,
    loading: subscriptionLoading,
  } = useContext(SubscriptionContext);
  const [trustRoutes, setTrustRoutes] = useState([]);
  const history = useHistory();

  // Verificar se deve bloquear o sistema
  const isBlocked =
    !canAccess && status !== "no_subscription" && !subscriptionLoading;
  const blockedStatuses = ["past_due", "cancelled", "readonly", "expired"];
  const showBlockBanner =
    blockedStatuses.includes(status) && !subscriptionLoading;

  // Estado para loading do pagamento
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Função para abrir checkout de pagamento diretamente
  const handlePayNow = async () => {
    if (status !== "past_due") {
      history.push("/admin/meu-plano");
      return;
    }

    setPaymentLoading(true);
    try {
      const response = await createSingleCharge();
      const checkoutUrl =
        response?.data?.paymentUrl ||
        response?.data?.invoiceUrl ||
        response?.data?.payment?.invoiceUrl;

      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      } else {
        // Se não conseguir gerar, redireciona para a página de planos
        history.push("/admin/meu-plano");
      }
    } catch (error) {
      console.error("Erro ao gerar pagamento:", error);
      history.push("/admin/meu-plano");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Estados para o onboarding tour
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  // Injetar CSS dinâmico para a cor do sidebar da empresa
  useEffect(() => {
    if (sidebarColor && sidebarColor !== "#667eea") {
      const styleId = "dynamic-sidebar-color";
      let styleEl = document.getElementById(styleId);

      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      const darkerColor = darkenColor(sidebarColor, -40);

      styleEl.textContent = `
        .sidebar::after {
          background: ${sidebarColor} !important;
          background: linear-gradient(to bottom, ${sidebarColor} 0%, ${darkerColor} 100%) !important;
        }
      `;

      return () => {
        const el = document.getElementById(styleId);
        if (el) el.remove();
      };
    }
  }, [sidebarColor]);

  // Verificar tamanho da tela para responsividade
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 992;
      setIsMobile(isMobileView);
    };

    // Verificar no carregamento inicial
    checkIfMobile();

    // Adicionar event listener para mudanças de tamanho
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Verificar se precisa mostrar onboarding
  useEffect(() => {
    if (user && !companyLoading && !hasCheckedOnboarding) {
      setHasCheckedOnboarding(true);

      // Verificar se já viu o onboarding nesta sessão
      const sessionOnboardingShown = sessionStorage.getItem("onboardingShown");

      if (needsOnboarding && !sessionOnboardingShown) {
        // Aguardar um pouco para a interface carregar
        const timer = setTimeout(() => {
          setShowWelcomeModal(true);
          sessionStorage.setItem("onboardingShown", "true");
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [user, companyLoading, needsOnboarding, hasCheckedOnboarding]);

  // Controlar a abertura/fechamento da sidebar em dispositivos móveis
  useEffect(() => {
    // Adicionar classe ao documento quando a sidebar estiver aberta em mobile
    if (isMobile) {
      document.body.classList.toggle("sidebar-open", sidebarOpen);
    } else {
      document.body.classList.remove("sidebar-open");
    }

    // Limpar o event listener quando o componente é desmontado
    return () => {
      document.body.classList.remove("sidebar-open");
    };
  }, [sidebarOpen, isMobile]);

  useEffect(() => {
    if (user) {
      const role = user?.user?.role;
      const userEmail = user?.user?.email;
      const userIsSuperAdmin = isSuperAdmin(userEmail);

      let newRoutes = routes.filter((route) => {
        // Se a rota é exclusiva para super admin
        if (route.superAdminOnly) {
          return userIsSuperAdmin;
        }

        // Filtro normal por role
        return (
          route?.rule.includes(role) ||
          route?.rule.includes(undefined) ||
          route?.rule.includes(null) ||
          // Super admin também pode acessar rotas de admin
          (userIsSuperAdmin && route?.rule.includes("admin"))
        );
      });

      setTrustRoutes(newRoutes);
    }
  }, [user]);

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/admin") {
        return (
          <Route
            key={key}
            path={prop.layout + prop.path}
            component={prop.component}
          />
        );
      }
      return null;
    });
  };

  React.useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    if (mainPanel.current) {
      mainPanel.current.scrollTop = 0;
    }

    // Fechar o sidebar quando mudar de rota em dispositivos móveis
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }

    if (
      window.innerWidth < 993 &&
      document.documentElement.className.indexOf("nav-open") !== -1
    ) {
      document.documentElement.classList.toggle("nav-open");
      var element = document.getElementById("bodyClick");
      if (element) {
        element.parentNode.removeChild(element);
      }
    }
  }, [location]);

  // Função para alternar a sidebar em mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handlers para o onboarding
  const handleStartTour = () => {
    setShowWelcomeModal(false);
    setTimeout(() => {
      setRunTour(true);
    }, 500);
  };

  const handleSkipTour = () => {
    setShowWelcomeModal(false);
  };

  const handleTourFinish = () => {
    setRunTour(false);
  };

  return (
    <>
      <SignedIn>
        {user && (
          <>
            <div className={`wrapper ${isMobile ? "mobile" : ""}`}>
            <Sidebar
              color={color}
              image={hasImage ? image : ""}
              routes={trustRoutes}
              isMobile={isMobile}
              isOpen={sidebarOpen}
              toggleSidebar={toggleSidebar}
            />
            <div
              className={`main-panel ${isMobile ? "mobile" : ""} ${
                sidebarOpen ? "sidebar-open" : ""
              }`}
              ref={mainPanel}
            >
              <AdminNavbar toggleSidebar={toggleSidebar} isMobile={isMobile} />

              {/* Banner de Subscription Bloqueada - Design Moderno */}
              {showBlockBanner && (
                <div className="subscription-block-banner">
                  <div className="block-banner-content">
                    <div className="block-banner-icon">
                      {status === "past_due" && "⚠️"}
                      {status === "cancelled" && "❌"}
                      {status === "readonly" && "🔒"}
                      {status === "expired" && "⏰"}
                    </div>
                    <div className="block-banner-text">
                      <strong>
                        {status === "past_due" && "Pagamento em Atraso"}
                        {status === "cancelled" && "Assinatura Cancelada"}
                        {status === "readonly" && "Acesso Limitado"}
                        {status === "expired" && "Período de Teste Expirado"}
                      </strong>
                      <span>
                        {status === "past_due" &&
                          "Regularize seu pagamento para continuar usando o sistema."}
                        {status === "cancelled" &&
                          "Sua assinatura foi cancelada. Reative para continuar."}
                        {status === "readonly" &&
                          "Assine um plano para usar todas as funcionalidades."}
                        {status === "expired" &&
                          "Escolha um plano para continuar usando o sistema."}
                      </span>
                    </div>
                    <Button
                      variant="light"
                      className="block-banner-btn"
                      onClick={
                        status === "past_due"
                          ? handlePayNow
                          : () => history.push("/admin/meu-plano")
                      }
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? (
                        <Spinner size="sm" animation="border" />
                      ) : status === "past_due" ? (
                        "Pagar Agora"
                      ) : (
                        "Ver Planos"
                      )}
                    </Button>
                    <a
                      href="https://wa.me/5527996011204"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block-banner-contact"
                    >
                      Contato: (27) 99601-1204
                    </a>
                  </div>
                </div>
              )}

              {/* Overlay de Bloqueio Total */}
              {isBlocked &&
                location.pathname !== "/admin/meu-plano" &&
                location.pathname !== "/admin/setup" && (
                  <div className="subscription-block-overlay">
                    <div className="block-overlay-content">
                      <div className="block-overlay-icon">
                        {status === "past_due" && <CreditCardOutlined />}
                        {status === "cancelled" && <CloseCircleOutlined />}
                        {status === "readonly" && <LockOutlined />}
                        {status === "expired" && <ClockCircleOutlined />}
                        {!blockedStatuses.includes(status) && <LockOutlined />}
                      </div>
                      <h2>
                        {status === "past_due" && "Pagamento Pendente"}
                        {status === "cancelled" && "Assinatura Cancelada"}
                        {status === "readonly" && "Acesso Bloqueado"}
                        {status === "expired" && "Período de Teste Encerrado"}
                        {!blockedStatuses.includes(status) && "Acesso Restrito"}
                      </h2>
                      <p>
                        {status === "past_due" &&
                          "Regularize seu pagamento para continuar utilizando todas as funcionalidades do sistema."}
                        {status === "cancelled" &&
                          "Sua assinatura foi cancelada. Reative seu plano para voltar a usar o sistema."}
                        {status === "readonly" &&
                          "Seu acesso está limitado. Escolha um plano para desbloquear."}
                        {status === "expired" &&
                          "Seu período de avaliação chegou ao fim. Escolha um plano para continuar."}
                        {!blockedStatuses.includes(status) &&
                          "Você não possui acesso a esta funcionalidade."}
                      </p>
                      <div className="block-overlay-actions">
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={
                            status === "past_due"
                              ? handlePayNow
                              : () => history.push("/admin/meu-plano")
                          }
                          disabled={paymentLoading}
                        >
                          {paymentLoading ? (
                            <Spinner size="sm" animation="border" />
                          ) : status === "past_due" ? (
                            "Pagar Agora"
                          ) : (
                            "Ver Planos"
                          )}
                        </Button>
                        <a
                          href="https://wa.me/5527996011204?text=Olá! Preciso de ajuda com minha assinatura."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block-overlay-whatsapp"
                        >
                          <WhatsAppOutlined /> Falar no WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                )}

              <div className="content">
                <Switch>{getRoutes(trustRoutes)}</Switch>
              </div>
              <Footer />
            </div>
          </div>
          {!isMobile && (
            <FixedPlugin
              hasImage={hasImage}
              setHasImage={() => setHasImage(!hasImage)}
              color={color}
              setColor={(color) => setColor(color)}
              image={image}
              setImage={(image) => setImage(image)}
            />
          )}

          {/* Onboarding Tour */}
          <WelcomeModal
            visible={showWelcomeModal}
            onStart={handleStartTour}
            onSkip={handleSkipTour}
          />
            <OnboardingTour run={runTour} onFinish={handleTourFinish} />
          </>
        )}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export default Admin;
