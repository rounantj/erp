import React, { useState } from "react";
import {
  Layout,
  Row,
  Col,
  Statistic,
  Card,
  Button,
  Space,
  Typography,
  Badge,
  Tooltip,
  Switch,
} from "antd";
import {
  DollarOutlined,
  BarChartOutlined,
  MenuOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Header } = Layout;
const { Text, Title } = Typography;

const CheckoutHeader = ({
  caixa,
  caixaAberto,
  resumoVendas,
  horaAbertura,
  valorAbertura,
  isMobile,
  onOpenCaixa,
  onCloseCaixa,
  onToggleSidebar,
  user,
}) => {
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  const formatCurrency = (value) => {
    const numValue = parseFloat(value || 0);
    if (isNaN(numValue)) return "R$ 0,00";
    return `R$ ${numValue.toFixed(2).replace(".", ",")}`;
  };

  const renderSensitiveStatistic = (
    title,
    value,
    color,
    precision = 0,
    prefix = ""
  ) => {
    if (!showSensitiveInfo) {
      return (
        <div style={{ textAlign: "center" }}>
          <Text type="secondary" style={{ fontSize: "10px" }}>
            {title}
          </Text>
          <br />
          <Text strong style={{ color, fontSize: "12px" }}>
            ••••••
          </Text>
        </div>
      );
    }

    return (
      <Statistic
        title={<Text style={{ fontSize: "10px" }}>{title}</Text>}
        value={value}
        precision={precision}
        prefix={prefix}
        valueStyle={{
          color,
          fontSize: "12px",
        }}
      />
    );
  };

  return (
    <Header
      style={{
        background: "#fff",
        padding: isMobile ? "8px 12px" : "12px 16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        minHeight: isMobile ? "60px" : "70px",
        height: "auto",
        lineHeight: "normal",
        overflow: "hidden",
      }}
    >
      <Row gutter={[12, 8]} align="middle" style={{ minHeight: "100%" }}>
        {/* Logo e título */}
        <Col xs={12} sm={8} md={6}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              minHeight: "100%",
            }}
          >
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={onToggleSidebar}
                style={{ marginRight: 8, padding: "4px 8px" }}
                size="small"
              />
            )}
            <div>
              <Title
                level={5}
                style={{
                  margin: 0,
                  fontSize: isMobile ? "14px" : "16px",
                  lineHeight: 1.2,
                }}
              >
                Sistema de Vendas
              </Title>
              <Text type="secondary" style={{ fontSize: "10px" }}>
                {user?.user?.username ||
                    user?.user?.name ||
                    user?.username ||
                    user?.name ||
                    "Usuário"}
              </Text>
            </div>
          </div>
        </Col>

        {/* Status do caixa */}
        <Col xs={12} sm={6} md={4}>
          <Card
            size="small"
            style={{
              background: caixaAberto ? "#f6ffed" : "#fff2f0",
              border: caixaAberto ? "1px solid #b7eb8f" : "1px solid #ffccc7",
              borderRadius: "6px",
              margin: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
            styles={{
              body: {
                padding: "6px",
                textAlign: "center",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }
            }}
          >
            <Badge
              status={caixaAberto ? "success" : "error"}
              text={
                <Text
                  strong
                  style={{
                    color: caixaAberto ? "#52c41a" : "#ff4d4f",
                    fontSize: "11px",
                  }}
                >
                  {caixaAberto ? "Caixa Aberto" : "Caixa Fechado"}
                </Text>
              }
            />
            {caixaAberto && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: "9px" }}>
                  {horaAbertura}
                </Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Estatísticas do caixa - Desktop */}
        {caixaAberto && !isMobile && (
          <>
            <Col xs={0} sm={4} md={3}>
              {renderSensitiveStatistic(
                "Saldo Caixa",
                (valorAbertura || 0) + (resumoVendas?.dinheiro || 0),
                "#1890ff",
                2,
                "R$"
              )}
            </Col>
            <Col xs={0} sm={4} md={3}>
              {renderSensitiveStatistic(
                "Vendas",
                resumoVendas?.totalVendas || 0,
                "#52c41a"
              )}
            </Col>
            <Col xs={0} sm={4} md={3}>
              {renderSensitiveStatistic(
                "Total",
                resumoVendas?.total || 0,
                "#cf1322",
                2,
                "R$"
              )}
            </Col>
          </>
        )}

        {/* Controles */}
        <Col xs={24} sm={8} md={5}>
          <Space
            size="small"
            style={{
              width: "100%",
              justifyContent: isMobile ? "space-between" : "flex-end",
              height: "100%",
              alignItems: "center",
            }}
          >
            {/* Switch para mostrar/ocultar informações */}
            {caixaAberto && !isMobile && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Switch
                  checked={showSensitiveInfo}
                  onChange={setShowSensitiveInfo}
                  checkedChildren={<EyeOutlined />}
                  unCheckedChildren={<EyeInvisibleOutlined />}
                  size="small"
                />
                <Text type="secondary" style={{ fontSize: "10px" }}>
                  {showSensitiveInfo ? "Ocultar" : "Mostrar"}
                </Text>
              </div>
            )}

            {/* Botões de ação */}
            {!caixaAberto ? (
              <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={onOpenCaixa}
                size="small"
                style={{
                  height: "32px",
                  fontSize: "12px",
                }}
              >
                {isMobile ? "Abrir" : "Abrir Caixa"}
              </Button>
            ) : (
              <Tooltip title="Fechar caixa">
                <Button
                  danger
                  icon={<BarChartOutlined />}
                  onClick={onCloseCaixa}
                  size="small"
                  style={{
                    height: "32px",
                    fontSize: "12px",
                  }}
                >
                  {isMobile ? "Fechar" : "Fechar"}
                </Button>
              </Tooltip>
            )}
          </Space>
        </Col>
      </Row>

      {/* Informações adicionais em mobile */}
      {isMobile && caixaAberto && (
        <Row gutter={8} style={{ marginTop: 6, paddingBottom: 4 }}>
          <Col span={8}>
            {renderSensitiveStatistic(
              "Saldo Caixa",
              (valorAbertura || 0) + (resumoVendas?.dinheiro || 0),
              "#1890ff",
              2,
              "R$"
            )}
          </Col>
          <Col span={8}>
            {renderSensitiveStatistic(
              "Vendas",
              resumoVendas?.totalVendas || 0,
              "#52c41a"
            )}
          </Col>
          <Col span={8}>
            {renderSensitiveStatistic(
              "Total",
              resumoVendas?.total || 0,
              "#cf1322",
              2,
              "R$"
            )}
          </Col>
        </Row>
      )}
    </Header>
  );
};

export default CheckoutHeader;
