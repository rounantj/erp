import React from "react";
import { Card, Tabs } from "antd";
import FeatureGuard from "components/FeatureGuard";
import { getCurrentUser } from "helpers/api-integrator";
import WhatsAppPedidos from "./WhatsAppPedidos";
import WhatsAppConexao from "./WhatsAppConexao";
import WhatsAppConfiguracao from "./WhatsAppConfiguracao";

function WhatsApp() {
  const user = getCurrentUser();
  const isAdmin = user?.role === "admin" || (user?.email || "").toLowerCase() === "rounantj@hotmail.com";

  const items = [
    { key: "pedidos", label: "Pedidos", children: <WhatsAppPedidos /> },
    { key: "conexao", label: "Conexão", children: <WhatsAppConexao isAdmin={isAdmin} /> },
  ];
  if (isAdmin) items.push({ key: "configuracao", label: "Configuração do bot", children: <WhatsAppConfiguracao /> });

  return (
    <FeatureGuard feature="whatsapp_atendimento" messageType="block">
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Tabs defaultActiveKey="pedidos" items={items} destroyInactiveTabPane />
      </Card>
    </FeatureGuard>
  );
}

export default WhatsApp;
