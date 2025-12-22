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
import React from "react";
import { useLocation, NavLink } from "react-router-dom";
import { Nav } from "react-bootstrap";
import { useCompany } from "context/CompanyContext";
import { CrownOutlined } from "@ant-design/icons";

// Logo padrão como fallback
import defaultLogo from "assets/img/logo.png";

function Sidebar({ color, image, routes }) {
  const location = useLocation();
  const { logoUrl } = useCompany();

  // A cor do sidebar é controlada pelo CSS dinâmico injetado no Admin.js

  const activeRoute = (routeName) => {
    return location.pathname.indexOf(routeName) > -1 ? "active" : "";
  };

  // Usar logo da empresa ou fallback para a logo padrão
  const displayLogo = logoUrl || defaultLogo;

  return (
    <div className="sidebar" data-image={image} data-color={color}>
      <div
        className="sidebar-background"
        style={{
          backgroundImage: image ? `url(${image})` : "none",
          opacity: image ? 0.3 : 0,
        }}
      />
      <div className="sidebar-wrapper">
        <div className="logo d-flex align-items-center justify-content-start">
          <img
            style={{
              maxWidth: "150px",
              maxHeight: "80px",
              margin: "auto",
              objectFit: "contain",
              borderRadius: "8px",
            }}
            src={displayLogo}
            alt="Logo da empresa"
            onError={(e) => {
              // Fallback para logo padrão se a imagem falhar
              e.target.src = defaultLogo;
            }}
          />
        </div>
        <Nav>
          {routes
            .filter(
              (item) =>
                item.path !== "/login-register" &&
                item.path !== "/meu-plano" &&
                item.path !== "/cadastro" &&
                !item.hideFromMenu
            )
            .map((prop, key) => {
              if (!prop.redirect)
                return (
                  <li
                    className={
                      prop.upgrade
                        ? "active active-pro"
                        : activeRoute(prop.layout + prop.path)
                    }
                    key={key}
                  >
                    <NavLink
                      to={prop.layout + prop.path}
                      className="nav-link"
                      activeClassName="active"
                    >
                      <i className={prop.icon} />
                      <p>{prop.name}</p>
                    </NavLink>
                  </li>
                );
              return null;
            })}
        </Nav>

        {/* Seção fixa no rodapé do sidebar */}
        <div className="sidebar-footer">
          <Nav>
            <li className={activeRoute("/admin/meu-plano")}>
              <NavLink
                to="/admin/meu-plano"
                className="nav-link"
                activeClassName="active"
              >
                <CrownOutlined className="sidebar-crown-icon" />
                <p>Meu Plano</p>
              </NavLink>
            </li>
          </Nav>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
