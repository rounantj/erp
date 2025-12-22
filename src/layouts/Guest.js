import React, { lazy, Suspense } from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import { Spin } from "antd";

// Lazy loading dos componentes públicos
const LoginRegister = lazy(() => import("views/LoginRegister"));
const Cadastro = lazy(() => import("views/Cadastro"));

// Componente de loading
const LoadingComponent = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    <Spin size="large" />
  </div>
);

function Guest() {
  return (
    <div className="guest-layout">
      <Suspense fallback={<LoadingComponent />}>
        <Switch>
          <Route path="/admin/login-register" component={LoginRegister} />
          <Route path="/admin/cadastro" component={Cadastro} />
          <Redirect from="/admin" to="/admin/login-register" />
        </Switch>
      </Suspense>
    </div>
  );
}

export default Guest;
