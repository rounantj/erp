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
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";

// Suprimir erro inofensivo do ResizeObserver (comum com Ant Design)
const resizeObserverErr = (e) => {
  if (e.message && e.message.includes("ResizeObserver loop")) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
  }
};
window.addEventListener("error", resizeObserverErr);

// Também suprimir no console
const originalError = console.error;
console.error = (...args) => {
  if (
    args[0] &&
    typeof args[0] === "string" &&
    args[0].includes("ResizeObserver")
  ) {
    return;
  }
  originalError(...args);
};

import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/css/animate.min.css";
import "./assets/scss/light-bootstrap-dashboard-react.scss?v=2.0.0";
import "./assets/css/demo.css";
import "./assets/css/global-styles.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import AdminLayout from "layouts/Admin.js";
import { UserProvider } from "context/UserContext";
import { CompanyProvider } from "context/CompanyContext";
import { SubscriptionProvider } from "context/SubscriptionContext";
import { ClerkProvider } from "@clerk/clerk-react";

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ClerkProvider publishableKey={clerkPubKey}>
    <UserProvider>
      <CompanyProvider>
        <SubscriptionProvider>
          <BrowserRouter>
          <Switch>
            <Route
              path="/admin"
              render={(props) => <AdminLayout {...props} />}
            />
            <Redirect from="/" to="/admin/login-register" />
            <Redirect from="/produtos" to="/admin/produtos" />
            <Redirect from="/vendas" to="/admin/vendas" />
            <Redirect from="/dashboard" to="/admin/dashboard" />
            <Redirect from="/recursos" to="/admin/recursos" />
            <Redirect from="/setup" to="/admin/setup" />
            <Redirect from="/checkout" to="/admin/checkout" />
          </Switch>
        </BrowserRouter>
      </SubscriptionProvider>
    </CompanyProvider>
  </UserProvider>
  </ClerkProvider>
);
