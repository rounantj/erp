// src/views/LoginRegister.js
import React, { useEffect } from "react";
import { SignIn } from "@clerk/clerk-react";
import { useHistory } from "react-router-dom";
import { Row, Col } from "antd";
import { useUser } from "@clerk/clerk-react";

const LoginRegister = () => {
  const history = useHistory();
  const { isSignedIn } = useUser();

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      history.push("/admin/dashboard");
    }
  }, [isSignedIn, history]);

  // If user is already logged in, show loading
  if (isSignedIn) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "80vh" }}>
        <Col>
          <img
            src={require("assets/img/logo.png")}
            alt="logo"
            style={{ maxWidth: "350px" }}
          />
        </Col>
      </Row>
    );
  }

  return (
    <Row justify="center" align="middle" style={{ minHeight: "100vh", padding: "20px" }}>
      <Col xs={22} sm={20} md={16} lg={12} xl={10}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src={require("assets/img/logo.png")}
            alt="logo"
            style={{ maxWidth: "200px", marginBottom: 24 }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <SignIn
            routing="path"
            path="/admin/login-register"
            signUpUrl="/admin/cadastro"
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
  );
};

export default LoginRegister;
