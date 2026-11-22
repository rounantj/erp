import React, { useEffect, useState } from "react";
import { Layout, Card, Typography, Tabs, ConfigProvider, Segmented } from "antd";
import {
  TeamOutlined,
  SettingOutlined,
  ShopOutlined,
  MenuOutlined,
  PictureOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import DadosEmpresa from "views/empresa/DadosEmpresa";
import Equipe from "views/empresa/Equipe";
import IdentidadeVisual from "views/empresa/IdentidadeVisual";
import FiscalDocumentsTable from "views/fiscal/FiscalDocumentsTable";
import { toggleMobileNav } from "components/simple/SimplePage";
import { useThemeColor } from "helpers/theme";

const { Text } = Typography;

const mobileStyles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    maxWidth: "100vw",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    zIndex: 100,
  },
  header: {
    background: "transparent",
    padding: "16px",
    flexShrink: 0,
  },
  headerTitle: {
    color: "#fff",
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: "12px",
  },
  content: {
    flex: 1,
    background: "#f8f9fa",
    borderTopLeftRadius: "24px",
    borderTopRightRadius: "24px",
    padding: "16px",
    paddingBottom: "20px",
    overflow: "auto",
    overscrollBehavior: "contain",
    display: "flex",
    flexDirection: "column",
    maxWidth: "100vw",
    boxSizing: "border-box",
    minHeight: 0,
  },
};

function Configuracoes() {
  const requestedTab = new URLSearchParams(window.location.search).get("tab");
  const [activeTab, setActiveTab] = useState({ empresa: "2", fiscal: "2", usuarios: "3", notas: "5" }[requestedTab] || "1");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { primary } = useThemeColor();
  const [mobileTab, setMobileTab] = useState(
    { notas: "notas", usuarios: "usuarios", empresa: "empresa", fiscal: "empresa" }[requestedTab] || "visual"
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile) {
    return (
      <ConfigProvider
        theme={{
          token: { colorPrimary: primary, borderRadius: 12 },
          components: { Card: { paddingLG: 16, headerPadding: 16 } },
        }}
      >
        <div style={{ ...mobileStyles.container, background: primary }}>
          <div style={mobileStyles.header}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div
                onClick={toggleMobileNav}
                style={{ background: "rgba(255,255,255,0.2)", borderRadius: "10px", padding: "8px 10px", cursor: "pointer" }}
              >
                <MenuOutlined style={{ color: "#fff", fontSize: "18px" }} />
              </div>
              <div>
                <h1 style={mobileStyles.headerTitle}>
                  <SettingOutlined style={{ marginRight: "8px" }} />
                  Configurações
                </h1>
                <Text style={mobileStyles.headerSubtitle}>Personalize sua empresa</Text>
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <Segmented
                block
                value={mobileTab}
                onChange={setMobileTab}
                options={[
                  ["visual", "Visual", <PictureOutlined />],
                  ["empresa", "Empresa", <ShopOutlined />],
                  ["usuarios", "Usuários", <TeamOutlined />],
                  ["notas", "Notas", <FileDoneOutlined />],
                ].map(([value, label, icon]) => ({
                  value,
                  label: (
                    <div style={{ padding: "4px 0", lineHeight: 1.25, color: value === mobileTab ? primary : "#fff" }}>
                      <div style={{ fontSize: 16 }}>{icon}</div>
                      <div style={{ fontSize: 12 }}>{label}</div>
                    </div>
                  ),
                }))}
                style={{ background: "rgba(255,255,255,0.2)", padding: "4px" }}
              />
            </div>
          </div>

          <div style={mobileStyles.content}>
            {mobileTab === "notas" ? (
              <FiscalDocumentsTable />
            ) : mobileTab === "visual" ? (
              <IdentidadeVisual />
            ) : mobileTab === "empresa" ? (
              <DadosEmpresa focus={requestedTab} />
            ) : (
              <Equipe />
            )}
          </div>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: primary } }}>
      <Layout className="site-layout-background" style={{ padding: "24px" }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" tabBarStyle={{ marginBottom: 24 }}>
          <Tabs.TabPane
            tab={
              <span>
                <PictureOutlined /> Identidade Visual
              </span>
            }
            key="1"
          >
            <IdentidadeVisual />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <span>
                <ShopOutlined /> Dados da Empresa
              </span>
            }
            key="2"
          >
            <DadosEmpresa focus={requestedTab} />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <span>
                <TeamOutlined /> Usuários
              </span>
            }
            key="3"
          >
            <Equipe />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <span>
                <FileDoneOutlined /> Notas fiscais
              </span>
            }
            key="5"
          >
            <Card style={{ borderRadius: 12 }}>
              <FiscalDocumentsTable />
            </Card>
          </Tabs.TabPane>
        </Tabs>
      </Layout>
    </ConfigProvider>
  );
}

export default Configuracoes;
