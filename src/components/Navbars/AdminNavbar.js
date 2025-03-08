import React, { useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Layout, Button, Menu, Dropdown, Space } from "antd";
import {
  MenuOutlined,
  DownOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { UserContext } from "context/UserContext";
import routes from "routes.js";

const { Header } = Layout;

function AdminNavbar() {
  const location = useLocation();
  // Adicionando estado para detectar dispositivos móveis
  const [isMobile, setIsMobile] = useState(false);

  // Hook para detectar tamanho da tela
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificar tamanho inicial
    checkMobile();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener("resize", checkMobile);

    // Limpar listener
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const mobileSidebarToggle = (e) => {
    e.preventDefault();
    document.documentElement.classList.toggle("nav-open");
    var node = document.createElement("div");
    node.id = "bodyClick";
    node.onclick = function () {
      this.parentElement.removeChild(this);
      document.documentElement.classList.toggle("nav-open");
    };
    document.body.appendChild(node);
  };
  const { user, setUser } = useContext(UserContext);

  const getBrandText = () => {
    for (let i = 0; i < routes.length; i++) {
      if (location.pathname.indexOf(routes[i].layout + routes[i].path) !== -1) {
        return routes[i].name;
      }
    }
    return "Brand";
  };

  const logout = () => {
    console.log("Saindo...");
    setUser(null);
    localStorage.clear();
    window.location.replace("/");
  };

  // Dropdown items para notificações
  const notificationItems = [];

  // Menu items para o dropdown do usuário
  const userMenuItems = [
    {
      key: "1",
      label: "Sair",
      icon: <LogoutOutlined />,
      onClick: logout,
    },
  ];

  return (
    <Header
      style={{
        background: "#fff",
        padding: isMobile ? "0 10px" : "0 20px",
        boxShadow: "0 1px 4px rgba(0,21,41,.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
      className="responsive-header"
    >
      <div className="d-flex align-items-center">
        <Button
          type="default"
          className="d-flex justify-content-center align-items-center rounded-circle p-2"
          onClick={mobileSidebarToggle}
          icon={<MenuOutlined />}
          shape="circle"
          style={{ marginRight: "10px" }}
        />
        <span
          style={{
            fontSize: isMobile ? "16px" : "18px",
            fontWeight: "bold",
            color: "rgba(0, 0, 0, 0.85)",
            marginLeft: "10px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: isMobile ? "150px" : "auto",
          }}
          className="brand-text"
        >
          {getBrandText()}
        </span>
      </div>

      {/* Área de notificações (opcional) */}
      {notificationItems.length > 0 ? (
        <div
          className={isMobile ? "notification-mobile" : "notification-desktop"}
        >
          <Space size={isMobile ? "small" : "large"}>
            <Dropdown
              menu={{ items: notificationItems }}
              placement="bottomRight"
            >
              <Button type="text">
                <i className="nc-icon nc-planet"></i>
                <span className="notification">5</span>
                <span className={isMobile ? "d-none" : "d-lg-none ml-1"}>
                  Notification
                </span>
              </Button>
            </Dropdown>
          </Space>
        </div>
      ) : (
        <></>
      )}

      {/* Área do usuário - agora visível */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {user && (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <span
              style={{ cursor: "pointer" }}
              className="user-dropdown-trigger"
            >
              <Space>
                <UserOutlined style={{ fontSize: "16px" }} />
                {!isMobile ? (
                  <span className="user-email">
                    {user?.user.email} | <b>{user?.user.role ?? "Admin"}</b>
                  </span>
                ) : null}
                <DownOutlined />
              </Space>
            </span>
          </Dropdown>
        )}
      </div>
    </Header>
  );
}

export default AdminNavbar;
