import React, { lazy, Suspense } from "react";
import { Spin } from "antd";

// Lazy loading de todos os componentes
const Dashboard = lazy(() => import("views/Dashboard.js"));
const UserProfile = lazy(() => import("views/UserProfile.js"));
const TableList = lazy(() => import("views/TableList.js"));
const Typography = lazy(() => import("views/Typography.js"));
const Icons = lazy(() => import("views/Icons.js"));
const Maps = lazy(() => import("views/Maps.js"));
const Upgrade = lazy(() => import("views/Upgrade.js"));
const Checkout = lazy(() => import("views/Checkout"));
const Vendas = lazy(() => import("views/Vendas"));
const Despesas = lazy(() => import("views/Despesas"));
const SaudeFinanceira = lazy(() => import("views/SaudeFinanceira"));
const ProductAndServiceTable = lazy(() => import("views/ProdutosServicos"));
const Login = lazy(() => import("views/LoginRegister"));
const Configuracoes = lazy(() => import("views/Configuracoes"));
const Curriculo = lazy(() => import("views/Curriculo"));
const CriadorCurriculo = lazy(() => import("views/Curriculo"));
const VendasDoDia = lazy(() => import("views/VendasDoDia"));
const Clientes = lazy(() => import("views/Clientes"));
const Empresas = lazy(() => import("views/Empresas"));

// Componente de loading para Suspense
const LoadingComponent = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "200px",
    }}
  >
    <Spin size="large" />
  </div>
);

// Wrapper para componentes com Suspense
const withSuspense = (Component) => (props) =>
  (
    <Suspense fallback={<LoadingComponent />}>
      <Component {...props} />
    </Suspense>
  );

const dashboardRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: "nc-icon nc-chart-pie-35",
    component: withSuspense(Dashboard),
    layout: "/admin",
    rule: ["admin"],
  },
  {
    path: "/checkout",
    name: "Caixa",
    icon: "nc-icon nc-credit-card",
    component: withSuspense(Checkout),
    layout: "/admin",
    rule: ["atendente", "admin"],
  },
  {
    path: "/vendas",
    name: "Faturamento",
    icon: "nc-icon nc-money-coins",
    component: withSuspense(Vendas),
    layout: "/admin",
    rule: ["admin"],
  },
  // {
  //   path: "/saude-financeira",
  //   name: "Saude Financeira",
  //   icon: "nc-icon nc-money-coins",
  //   component: withSuspense(SaudeFinanceira),
  //   layout: "/admin",
  //   rule: ["admin"],
  // },

  {
    path: "/resumo-do-dia",
    name: "Resumo do dia",
    icon: "nc-icon nc-money-coins",
    component: withSuspense(VendasDoDia),
    layout: "/admin",
    rule: ["admin", "atendente"],
  },
  {
    path: "/despesas",
    name: "Despesas",
    icon: "nc-icon nc-chart-pie-36",
    component: withSuspense(Despesas),
    layout: "/admin",
    rule: ["admin"],
  },
  {
    path: "/recursos",
    name: "Produtos e Serviços",
    icon: "nc-icon nc-bullet-list-67",
    component: withSuspense(ProductAndServiceTable),
    layout: "/admin",
    rule: ["atendente", "admin"],
  },
  {
    path: "/clientes",
    name: "Clientes",
    icon: "nc-icon nc-single-02",
    component: withSuspense(Clientes),
    layout: "/admin",
    rule: ["atendente", "admin"],
  },
  {
    path: "/login-register",
    name: "Logout or Login",
    icon: "nc-icon nc-bullet-list-67",
    component: withSuspense(Login),
    layout: "/admin",
    rule: ["atendente", "admin", "visitante", null, undefined],
  },
  {
    path: "/curriculo",
    name: "Curriculo",
    icon: "nc-icon nc-single-copy-04",
    component: withSuspense(CriadorCurriculo),
    layout: "/admin",
    rule: ["admin", "atendente"],
  },

  {
    path: "/setup",
    name: "Configurações",
    icon: "nc-icon nc-settings-gear-64",
    component: withSuspense(Configuracoes),
    layout: "/admin",
    rule: ["admin"],
  },
  {
    path: "/empresas",
    name: "Empresas",
    icon: "nc-icon nc-bank",
    component: withSuspense(Empresas),
    layout: "/admin",
    rule: ["superadmin"], // Acesso exclusivo para rounantj@hotmail.com
    superAdminOnly: true,
  },
];

export default dashboardRoutes;
