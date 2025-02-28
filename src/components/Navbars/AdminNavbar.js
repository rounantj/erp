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
import React, { useContext } from "react";
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
  const notificationItems = [
    { key: "1", label: "Notification 1" },
    { key: "2", label: "Notification 2" },
    { key: "3", label: "Notification 3" },
    { key: "4", label: "Notification 4" },
    { key: "5", label: "Another notification" },
  ];

  return (
    <Header
      style={{
        background: "#fff",
        padding: "0 20px",
        boxShadow: "0 1px 4px rgba(0,21,41,.08)",
      }}
    >
      <div className="d-flex justify-content-center align-items-center ml-2 ml-lg-0">
        <Button
          type="default"
          className="d-lg-none btn-fill d-flex justify-content-center align-items-center rounded-circle p-2"
          onClick={mobileSidebarToggle}
          icon={<MenuOutlined />}
          shape="circle"
          style={{ marginRight: "10px" }}
        />
        <a
          href="#home"
          onClick={(e) => e.preventDefault()}
          className="mr-2"
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "rgba(0, 0, 0, 0.85)",
            marginLeft: "10px",
          }}
        >
          {getBrandText()}
        </a>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Menús ocultos (mantidos como no original) */}
        <div style={{ display: "none" }}>
          <Space size="large">
            <Button type="text" icon={<UserOutlined />}>
              <span className="d-lg-none ml-1">Dashboard</span>
            </Button>

            <Dropdown
              menu={{ items: notificationItems }}
              placement="bottomRight"
            >
              <Button type="text">
                <i className="nc-icon nc-planet"></i>
                <span className="notification">5</span>
                <span className="d-lg-none ml-1">Notification</span>
              </Button>
            </Dropdown>

            <Button type="text">
              <i className="nc-icon nc-zoom-split"></i>
              <span className="d-lg-block"> Search</span>
            </Button>
          </Space>
        </div>

        {/* User info e logout */}
        <div
          style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}
        >
          <Dropdown
            menu={{
              items: [
                {
                  key: "1",
                  label: "Sair",
                  icon: <LogoutOutlined />,
                  onClick: logout,
                },
              ],
            }}
            onClick={logout}
            placement="bottomRight"
            style={{ display: "none" }}
          >
            <a onClick={(e) => e.preventDefault()}>
              <Space>
                <span style={{ marginRight: "15px" }}>
                  {user?.user.email} | <b>{user?.user.role ?? "Admin"}</b>
                </span>
                <DownOutlined />
              </Space>
            </a>
          </Dropdown>
        </div>
      </div>
    </Header>
  );
}

export default AdminNavbar;
