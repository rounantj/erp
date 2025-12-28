import React, { useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Layout, Button, Space, Avatar, Divider, Tooltip } from "antd";
import { MenuOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { UserContext } from "context/UserContext";
import { useCompany } from "context/CompanyContext";
import { useAuth } from "@clerk/clerk-react";
import routes from "routes.js";

const { Header } = Layout;

// Função para ajustar cor (escurecer)
const adjustColor = (hex, percent) => {
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

function AdminNavbar() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { user, setUser } = useContext(UserContext);
  const { sidebarColor, companySetup } = useCompany();
  const { signOut } = useAuth();
  const companyName = companySetup?.companyName || "";

  // Usar cor da empresa ou fallback
  const primaryColor = sidebarColor || "#667eea";
  const gradientColor = adjustColor(primaryColor, -30);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const mobileSidebarToggle = (e) => {
    e.preventDefault();
    const existingBodyClick = document.getElementById("bodyClick");
    if (existingBodyClick) {
      existingBodyClick.parentElement.removeChild(existingBodyClick);
    }
    document.documentElement.classList.toggle("nav-open");
    if (document.documentElement.classList.contains("nav-open")) {
      var node = document.createElement("div");
      node.id = "bodyClick";
      node.onclick = function () {
        this.parentElement.removeChild(this);
        document.documentElement.classList.remove("nav-open");
      };
      document.body.appendChild(node);
    }
  };

  const getBrandText = () => {
    for (let i = 0; i < routes.length; i++) {
      if (location.pathname.indexOf(routes[i].layout + routes[i].path) !== -1) {
        return routes[i].name;
      }
    }
    return "Dashboard";
  };

  const logout = async () => {
    try {
      // Limpar sessão do Clerk
      await signOut();
    } catch (error) {
      console.error("Erro ao fazer logout do Clerk:", error);
    }
    
    // Limpar dados locais
    setUser(null);
    localStorage.clear();
    
    // Redirecionar para login
    window.location.replace("/");
  };

  // Pegar iniciais do email para o avatar
  const getInitials = () => {
    const email = user?.user?.email || "";
    return email.charAt(0).toUpperCase();
  };

  return (
    <Header
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${gradientColor} 100%)`,
        padding: isMobile ? "0 12px" : "0 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: "64px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      {/* Lado esquerdo - Menu e Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Button
          type="text"
          onClick={mobileSidebarToggle}
          icon={<MenuOutlined style={{ fontSize: "18px" }} />}
          style={{
            color: "#fff",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.1)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {companyName && !isMobile && (
            <>
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                {companyName}
              </span>
              <span
                style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}
              >
                ›
              </span>
            </>
          )}
          <span
            style={{
              fontSize: isMobile ? "16px" : "18px",
              fontWeight: "600",
              color: "#fff",
              letterSpacing: "-0.3px",
            }}
          >
            {getBrandText()}
          </span>
        </div>
      </div>

      {/* Lado direito - Usuário e Logout */}
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Info do usuário */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255,255,255,0.1)",
              padding: "6px 12px",
              borderRadius: "24px",
            }}
          >
            <Avatar
              size={32}
              style={{
                backgroundColor: "#fff",
                color: primaryColor,
                fontWeight: "bold",
              }}
            >
              {getInitials()}
            </Avatar>
            {!isMobile && (
              <div style={{ lineHeight: 1.2 }}>
                <div
                  style={{
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "500",
                    maxWidth: "180px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.user?.email}
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "11px",
                    textTransform: "capitalize",
                  }}
                >
                  {user?.user?.role || "Usuário"}
                </div>
              </div>
            )}
          </div>

          {/* Botão Logout */}
          <Tooltip title="Sair do sistema">
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              onClick={logout}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                height: "40px",
                borderRadius: "8px",
                fontWeight: "500",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              {!isMobile && "Sair"}
            </Button>
          </Tooltip>
        </div>
      )}
    </Header>
  );
}

export default AdminNavbar;
