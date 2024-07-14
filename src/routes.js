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
  // {
  //   path: "/user",
  //   name: "User Profile",
  //   icon: "nc-icon nc-circle-09",
  //   component: UserProfile,
  //   layout: "/admin"
  // },
  // {
  //   path: "/table",
  //   name: "Table List",
  //   icon: "nc-icon nc-notes",
  //   component: TableList,
  //   layout: "/admin"
  // },
  // {
  //   path: "/typography",
  //   name: "Typography",
  //   icon: "nc-icon nc-paper-2",
  //   component: Typography,
  //   layout: "/admin"
  // },
  // {
  //   path: "/icons",
  //   name: "Icons",
  //   icon: "nc-icon nc-atom",
  //   component: Icons,
  //   layout: "/admin"
  // },
  // {
  //   path: "/maps",
  //   name: "Maps",
  //   icon: "nc-icon nc-pin-3",
  //   component: Maps,
  //   layout: "/admin"
  // },
  // {
  //   path: "/notifications",
  //   name: "Notifications",
  //   icon: "nc-icon nc-bell-55",
  //   component: Notifications,
  //   layout: "/admin"
  // },
  // My pages <i className="nc-icon nc-credit-card"></i>

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
  // {
  //   path: "/financas",
  //   name: "Saude Financeira",
  //   icon: "nc-icon nc-bulb-63",
  //   component: SaudeFinanceira,
  //   layout: "/admin",
  //   rule: ["admin"]
  // },
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
