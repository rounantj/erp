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
import React, { Component, useContext, useEffect, useState } from "react";
import { useLocation, Route, Switch } from "react-router-dom";

import AdminNavbar from "components/Navbars/AdminNavbar";
import Footer from "components/Footer/Footer";
import Sidebar from "components/Sidebar/Sidebar";
import FixedPlugin from "components/FixedPlugin/FixedPlugin.js";

import routes from "routes.js";

import sidebarImage from "assets/img/sidebar-3.jpg";
import { UserContext } from "context/UserContext";

function Admin() {
  const [image, setImage] = React.useState(sidebarImage);
  const [color, setColor] = React.useState("black");
  const [hasImage, setHasImage] = React.useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const mainPanel = React.useRef(null);
  const { user } = useContext(UserContext);
  const [trustRoutes, setTrustRoutes] = useState([]);

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

  // Controlar a abertura/fechamento da sidebar em dispositivos móveis
  useEffect(() => {
    const handleSidebarToggle = () => {
      setSidebarOpen(!sidebarOpen);
    };

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
      let newRoutes = routes.filter(
        (a) =>
          a?.rule.includes(role) ||
          a?.rule.includes(undefined) ||
          a?.rule.includes(null)
      );
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
