import React from "react";
import { Row, Col, Progress, Badge, Typography, Card } from "antd";

const { Text } = Typography;

const PieChartVisual = ({ totalProdutos, totalServicos }) => {
  const total = totalProdutos + totalServicos;
  const pP = +((totalProdutos * 100) / total).toFixed(2);
  const pS = +((totalServicos * 100) / total).toFixed(2);

  return (
    <Card
      title="Distribuição de Itens"
      bordered={false}
      style={{ height: "100%" }}
    >
      <div style={{ padding: "10px 0" }}>
        <Row gutter={[16, 16]} justify="center">
          <Col xs={24} md={12}>
            <div style={{ textAlign: "center" }}>
              <Progress
                type="circle"
                percent={pP}
                format={() => `${pP}%`}
                strokeColor="#ff4d4f"
                width={120}
              />
              <div style={{ marginTop: 8 }}>
                <Badge color="#ff4d4f" text={<Text strong>Produtos</Text>} />
              </div>
              <Text type="secondary">{totalProdutos} itens</Text>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ textAlign: "center" }}>
              <Progress
                type="circle"
                percent={pS}
                format={() => `${pS}%`}
                strokeColor="#52c41a"
                width={120}
              />
              <div style={{ marginTop: 8 }}>
                <Badge color="#52c41a" text={<Text strong>Serviços</Text>} />
              </div>
              <Text type="secondary">{totalServicos} itens</Text>
            </div>
          </Col>
        </Row>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Text strong>Total: {total} itens</Text>
        </div>
      </div>
    </Card>
  );
};

export default PieChartVisual;
