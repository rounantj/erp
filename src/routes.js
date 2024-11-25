
import Dashboard from "views/Dashboard.js";
import UserProfile from "views/UserProfile.js";
import TableList from "views/TableList.js";
import Typography from "views/Typography.js";
import Icons from "views/Icons.js";
import Maps from "views/Maps.js";
import Upgrade from "views/Upgrade.js";
import Checkout from "views/Checkout";
import Vendas from "views/Vendas";
import Despesas from "views/Despesas";
import SaudeFinanceira from "views/SaudeFinanceira";
import ProductAndServiceTable from "views/ProdutosServicos";
import Login from "views/LoginRegister";
import Configuracoes from "views/Configuracoes";

const dashboardRoutes = [

  {
    path: "/dashboard",
    name: "Dashboard",
    icon: "nc-icon nc-chart-pie-35",
    component: Dashboard,
    layout: "/admin",
    rule: ["admin"]
  },
  {
    path: "/checkout",
    name: "Caixa",
    icon: "nc-icon nc-credit-card",
    component: Checkout,
    layout: "/admin",
    rule: ["atendente", "admin"]
  },
  {
    path: "/vendas",
    name: "Faturamento",
    icon: "nc-icon nc-money-coins",
    component: Vendas,
    layout: "/admin",
    rule: ["admin"]
  },
  {
    path: "/despesas",
    name: "Despesas",
    icon: "nc-icon nc-chart-pie-36",
    component: Despesas,
    layout: "/admin",
    rule: ["admin"]
  },
  {
    path: "/recursos",
    name: "Produtos e Serviços",
    icon: "nc-icon nc-bullet-list-67",
    component: ProductAndServiceTable,
    layout: "/admin",
    rule: ["atendente", "admin"]
  },
  {
    path: "/login-register",
    name: "Logout or Login",
    icon: "nc-icon nc-bullet-list-67",
    component: Login,
    layout: "/admin",
    rule: ["atendente", "admin", "visitante", null, undefined]
  },
  {
    path: "/setup",
    name: "Configurações",
    icon: "nc-icon nc-settings-gear-64",
    component: Configuracoes,
    layout: "/admin",
    rule: ["admin"]
  }
];

export default dashboardRoutes;
