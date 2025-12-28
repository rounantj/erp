// src/views/Cadastro.js
import React, { useEffect } from "react";
import { SignUp } from "@clerk/clerk-react";
import { useHistory } from "react-router-dom";
import { Row, Col } from "antd";
import { useUser } from "@clerk/clerk-react";

const Cadastro = () => {
  const history = useHistory();
  const { isSignedIn } = useUser();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (isSignedIn) {
      history.push("/admin/dashboard");
    }
  }, [isSignedIn, history]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #e4e6f1 100%)", padding: "20px" }}>
      <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
        <Col xs={24} sm={22} md={20} lg={16} xl={14}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img
              src={require("assets/img/logo.png")}
              alt="Fofa AI"
              style={{ maxWidth: "200px", marginBottom: 24 }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <SignUp
              routing="path"
              path="/admin/cadastro"
              signInUrl="/admin/login-register"
              redirectUrl="/admin/dashboard"
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-lg",
                },
              }}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Cadastro;

