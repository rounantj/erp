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
import { useLocation, Route, Switch } from "react-router-dom";

import AdminNavbar from "components/Navbars/AdminNavbar";
import Footer from "components/Footer/Footer";
import Sidebar from "components/Sidebar/Sidebar";
import FixedPlugin from "components/FixedPlugin/FixedPlugin.js";
import OnboardingTour, { WelcomeModal } from "components/OnboardingTour";

import routes from "routes.js";

import sidebarImage from "assets/img/sidebar-3.jpg";
import { UserContext } from "context/UserContext";
import { useCompany } from "context/CompanyContext";

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
  const [trustRoutes, setTrustRoutes] = useState([]);

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
      {!user && (
        <>
          <div ref={mainPanel}>
            <div>
              <Switch>{getRoutes(routes)}</Switch>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Admin;
