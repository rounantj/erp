import React from "react";
import { Card, Row, Col, Statistic, Typography, Badge, Space, Tag } from "antd";
import {
  WalletOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { Text, Title } = Typography;

const CashRegisterStatus = ({ caixaData }) => {
  const formatDate = (dateString) => {
    return moment(dateString).format("DD/MM/YYYY");
  };

  const formatDateTime = (dateString) => {
    return moment(dateString).format("DD/MM/YYYY HH:mm");
  };

  const calculateDuration = () => {
    const start = new Date(caixaData.abertura_data);
    const end = new Date(caixaData.fechamento_data);
    const durationMs = end - start;

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}min`;
  };

  const getStatusColor = () => {
    return caixaData.fechado ? "#ff4d4f" : "#52c41a";
  };

  const getStatusText = () => {
    return caixaData.fechado ? "Fechado" : "Aberto";
  };

  const getStatusIcon = () => {
    return caixaData.fechado ? (
      <ExclamationCircleOutlined />
    ) : (
      <CheckCircleOutlined />
    );
  };

  return (
    <Card title="Status do Caixa" bordered={false} style={{ height: "100%" }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <Badge
          status={caixaData.fechado ? "error" : "success"}
          icon={getStatusIcon()}
          text={
            <Text strong style={{ color: getStatusColor(), fontSize: 16 }}>
              {getStatusText()}
            </Text>
          }
        />
      </div>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Statistic
            title="Saldo Inicial"
            value={caixaData.saldoInicial}
            precision={2}
            valueStyle={{ color: "#1890ff" }}
            prefix={<WalletOutlined style={{ marginRight: 8 }} />}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Saldo Final"
            value={caixaData.saldoFinal}
            precision={2}
            valueStyle={{ color: "#52c41a" }}
            prefix={<WalletOutlined style={{ marginRight: 8 }} />}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <div>
            <Text type="secondary">Abertura</Text>
            <br />
            <Text strong>{formatDateTime(caixaData.abertura_data)}</Text>
          </div>
        </Col>
        <Col span={12}>
          <div>
            <Text type="secondary">Fechamento</Text>
            <br />
            <Text strong>{formatDateTime(caixaData.fechamento_data)}</Text>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Statistic
            title="Duração"
            value={calculateDuration()}
            valueStyle={{ color: "#722ed1" }}
            prefix={<ClockCircleOutlined style={{ marginRight: 8 }} />}
          />
        </Col>
        <Col span={12}>
          <div>
            <Text type="secondary">Diferença</Text>
            <br />
            <Tag color={caixaData.diferenca >= 0 ? "green" : "red"}>
              R$ {caixaData.diferenca.toFixed(2)}
            </Tag>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default CashRegisterStatus;
