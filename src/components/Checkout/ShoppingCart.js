import React from "react";
import {
  Card,
  List,
  Button,
  InputNumber,
  Typography,
  Space,
  Tag,
  Empty,
  Tooltip,
  Row,
  Col,
} from "antd";
import {
  MinusOutlined,
  PlusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const ShoppingCart = ({
  venda,
  removeItem,
  updateQuantity,
  updatePrice,
  totalVendaAtual,
  isMobile,
  onFinalizarVenda,
  loading,
  caixaAberto,
}) => {
  const formatCurrency = (value) => {
    const numValue = parseFloat(value || 0);
    if (isNaN(numValue)) return "R$ 0,00";
    return `R$ ${numValue.toFixed(2).replace(".", ",")}`;
  };

  // ========== MOBILE RENDER ==========
  if (isMobile) {
    return (
      <div style={{ 
        height: "100%", 
        display: "flex", 
        flexDirection: "column",
        overflow: "hidden",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}>
        {/* Cart Header Mobile */}
        {venda.length > 0 && (
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "16px",
              padding: "12px 14px",
              marginBottom: "12px",
              color: "#fff",
              flexShrink: 0,
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px" }}>
                  Total da Venda
                </Text>
                <div style={{ fontSize: "22px", fontWeight: "700", lineHeight: 1.2 }}>
                  {formatCurrency(totalVendaAtual)}
                </div>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px" }}>
                  {venda.length} {venda.length === 1 ? "item" : "itens"}
                </Text>
              </div>
              <Button
                type="primary"
                size="middle"
                icon={<DollarOutlined />}
                onClick={onFinalizarVenda}
                disabled={!caixaAberto}
                loading={loading}
                style={{
                  height: "44px",
                  borderRadius: "10px",
                  background: "#fff",
                  color: "#667eea",
                  border: "none",
                  fontWeight: "600",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                  flexShrink: 0,
                  padding: "0 16px",
                }}
              >
                Pagar
              </Button>
            </div>
          </div>
        )}

        {/* Cart Items Mobile */}
        <div style={{ 
          flex: 1, 
          overflow: "auto",
          minHeight: 0,
          WebkitOverflowScrolling: "touch",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}>
          {venda.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #667eea20 0%, #764ba220 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <ShoppingCartOutlined style={{ fontSize: "36px", color: "#667eea" }} />
              </div>
              <Text strong style={{ fontSize: "16px", marginBottom: "4px" }}>
                Carrinho vazio
              </Text>
              <Text type="secondary" style={{ fontSize: "13px" }}>
                Adicione produtos para começar
              </Text>
            </div>
          ) : (
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "8px",
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
            }}>
              {venda.map((item, index) => {
                const valorUnitario = parseFloat(item.valorEditado ?? item.valor) || 0;
                const quantidade = parseInt(item.qtd) || 0;
                const totalItem = valorUnitario * quantidade;

                return (
                  <div
                    key={`${item.id}-${index}`}
                    style={{
                      background: "#fff",
                      borderRadius: "12px",
                      padding: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      width: "100%",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                        <Text
                          strong
                          style={{
                            fontSize: "13px",
                            display: "block",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "100%",
                          }}
                        >
                          {item.descricao?.toUpperCase()}
                        </Text>
                        <Text type="secondary" style={{ fontSize: "11px" }}>
                          {formatCurrency(valorUnitario)} cada
                        </Text>
                      </div>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeItem(item)}
                        style={{ padding: "4px", flexShrink: 0 }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Button
                          size="small"
                          icon={<MinusOutlined />}
                          onClick={() => updateQuantity(item.id, Math.max(1, quantidade - 1))}
                          disabled={quantidade <= 1}
                          style={{
                            borderRadius: "8px",
                            width: "28px",
                            height: "28px",
                          }}
                        />
                        <Text strong style={{ fontSize: "14px", minWidth: "20px", textAlign: "center" }}>
                          {quantidade}
                        </Text>
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => updateQuantity(item.id, quantidade + 1)}
                          style={{
                            borderRadius: "8px",
                            width: "28px",
                            height: "28px",
                          }}
                        />
                      </div>
                      <Text
                        strong
                        style={{
                          fontSize: "14px",
                          color: "#667eea",
                        }}
                      >
                        {formatCurrency(totalItem)}
                      </Text>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== DESKTOP RENDER ==========
  const renderCartItem = (item, index) => {
    const valorUnitario = parseFloat(item.valorEditado ?? item.valor) || 0;
    const quantidade = parseInt(item.qtd) || 0;
    const totalItem = valorUnitario * quantidade;

    return (
      <List.Item
        key={`${item.id}-${index}`}
        style={{
          padding: "10px 6px",
          borderBottom: "1px solid #f0f0f0",
          backgroundColor: "#fff",
          borderRadius: "4px",
          marginBottom: "4px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ width: "100%" }}>
          <Row gutter={[8, 6]} align="middle">
            <Col sm={12} md={10}>
              <div>
                <Text strong style={{ fontSize: "12px", display: "block", marginBottom: "2px" }}>
                  {item.descricao?.toUpperCase()}
                </Text>
                <Space size="small" wrap>
                  <Tag color={item.categoria === "serviço" ? "green" : "blue"} size="small">
                    {item.categoria?.toUpperCase()}
                  </Tag>
                  <Text code style={{ fontSize: "9px" }}>#{item.id}</Text>
                </Space>
              </div>
            </Col>

            <Col sm={6} md={4}>
              <div style={{ textAlign: "center" }}>
                <Text type="secondary" style={{ fontSize: "9px", display: "block", marginBottom: "1px" }}>Qtd</Text>
                <Space size="small">
                  <Button
                    size="small"
                    icon={<MinusOutlined />}
                    onClick={() => updateQuantity(item.id, Math.max(1, quantidade - 1))}
                    disabled={quantidade <= 1}
                    style={{ minWidth: "22px", height: "22px", padding: 0 }}
                  />
                  <Text strong style={{ minWidth: "14px", textAlign: "center", fontSize: "11px" }}>
                    {quantidade}
                  </Text>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => updateQuantity(item.id, quantidade + 1)}
                    style={{ minWidth: "22px", height: "22px", padding: 0 }}
                  />
                </Space>
              </div>
            </Col>

            <Col sm={6} md={4}>
              <div style={{ textAlign: "center" }}>
                <Text type="secondary" style={{ fontSize: "9px", display: "block", marginBottom: "1px" }}>Preço</Text>
                <Tooltip title="Clique para editar">
                  <InputNumber
                    size="small"
                    value={valorUnitario}
                    onChange={(value) => updatePrice(item.id, value)}
                    prefix="R$"
                    precision={2}
                    min={0}
                    style={{ width: "95px", fontSize: "12px", height: "26px" }}
                  />
                </Tooltip>
              </div>
            </Col>

            <Col sm={6} md={4}>
              <div style={{ textAlign: "center" }}>
                <Text type="secondary" style={{ fontSize: "9px", display: "block", marginBottom: "1px" }}>Total</Text>
                <Text strong style={{ color: "#1890ff", fontSize: "12px" }}>
                  {formatCurrency(totalItem)}
                </Text>
              </div>
            </Col>

            <Col sm={6} md={2}>
              <div style={{ textAlign: "center" }}>
                <Tooltip title="Remover item">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(item)}
                    size="small"
                    style={{ minWidth: "24px", height: "24px", padding: 0 }}
                  />
                </Tooltip>
              </div>
            </Col>
          </Row>
        </div>
      </List.Item>
    );
  };

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <ShoppingCartOutlined style={{ marginRight: 4, fontSize: "13px" }} />
            <span style={{ fontSize: "13px" }}>Carrinho</span>
          </div>
          {venda.length > 0 && (
            <Tag color="blue" size="small" style={{ marginLeft: 4 }}>
              {venda.length} {venda.length === 1 ? "item" : "itens"}
            </Tag>
          )}
        </div>
      }
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "6px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        minHeight: 0,
      }}
      bodyStyle={{
        flex: 1,
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
      }}
      size="small"
    >
      {venda.length > 0 && (
        <div
          style={{
            background: "#f8f9fa",
            borderRadius: "6px",
            padding: "10px",
            marginBottom: "8px",
            border: "1px solid #e9ecef",
          }}
        >
          <Row gutter={[12, 6]} align="middle">
            <Col sm={16} md={18}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div>
                  <Text type="secondary" style={{ fontSize: "10px" }}>Total da Venda</Text>
                  <div>
                    <Text strong style={{ fontSize: "16px", color: "#cf1322", lineHeight: 1.2 }}>
                      {formatCurrency(totalVendaAtual)}
                    </Text>
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: "10px" }}>Itens</Text>
                  <div>
                    <Text strong style={{ fontSize: "14px", color: "#1890ff" }}>
                      {venda.length}
                    </Text>
                  </div>
                </div>
              </div>
            </Col>
            <Col sm={8} md={6}>
              <Button
                type="primary"
                size="small"
                icon={<ShoppingCartOutlined />}
                onClick={onFinalizarVenda}
                disabled={venda.length === 0 || !caixaAberto}
                loading={loading}
                style={{ width: "100%", height: "28px", fontSize: "10px", fontWeight: "bold", borderRadius: "4px" }}
              >
                Finalizar Venda
              </Button>
            </Col>
          </Row>
        </div>
      )}

      {venda.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Carrinho vazio"
            style={{ margin: 0 }}
            imageStyle={{ height: 60 }}
          >
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Adicione produtos para começar
            </Text>
          </Empty>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          <List dataSource={venda} renderItem={renderCartItem} />
        </div>
      )}
    </Card>
  );
};

export default ShoppingCart;
