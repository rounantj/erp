import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Typography,
  Divider,
  Badge,
  Space,
  Tabs,
  Tag,
  Skeleton,
  Avatar,
  Empty,
  Button,
  Alert,
} from "antd";
import {
  ShoppingOutlined,
  DollarOutlined,
  ReloadOutlined,
  SyncOutlined,
  ShopOutlined,
  FundOutlined,
  TagOutlined,
  BoxPlotOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { getDashboard } from "helpers/api-integrator";
import { toMoneyFormat, monthName } from "helpers/formatters";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Dados padrão seguros para evitar erros
const defaultDashData = {
  produtosVendidos: [],
  totalProdutos: 0,
  totalServicos: 0,
  totalHoje: 0,
  totalEsseMes: 0,
  dias: [],
  despesa: [{ total: 0 }],
};

function TopSellingItemsDashboard() {
  const [dashData, setDashData] = useState(defaultDashData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Buscar dados do dashboard
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDashboard();
      if (result?.success) {
        setDashData({
          ...defaultDashData,
          ...result.data,
        });
      } else {
        throw new Error("Falha ao carregar dados do dashboard");
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      setError(error?.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Processar dados de produtos vendidos para as tabelas
  const processItemsData = () => {
    if (!dashData?.produtosVendidos?.length) {
      return { produtos: [], servicos: [] };
    }

    // Separar produtos e serviços
    const produtosArray = [];
    const servicosArray = [];
    const categoriaDecide = (item) => {
      if (item != "servico" && item != "serviço") {
        return "produto";
      } else {
        return "serviço";
      }
    };
    dashData.produtosVendidos.forEach((item) => {
      const processedItem = {
        id: item.id,
        descricao: item.descricao,
        categoria: categoriaDecide(item.categoria),
        quantidade: Number(item.quantidade) || 0,
        valorUnitario: item.valor || 0,
        valorTotal: item.valorTotal || 0,
      };

      if (
        item.categoria?.toLowerCase() === "serviço" ||
        item.categoria?.toLowerCase() === "servico"
      ) {
        servicosArray.push(processedItem);
      } else {
        produtosArray.push(processedItem);
      }
    });

    return {
      produtos: produtosArray,
      servicos: servicosArray,
    };
  };

  const { produtos, servicos } = processItemsData();

  // Ordenar por quantidade (decrescente)
  const produtosByQtd = [...produtos].sort(
    (a, b) => b.quantidade - a.quantidade
  );
  const servicosByQtd = [...servicos].sort(
    (a, b) => b.quantidade - a.quantidade
  );

  // Ordenar por valor total (decrescente)
  const produtosByValor = [...produtos].sort(
    (a, b) => b.valorTotal - a.valorTotal
  );
  const servicosByValor = [...servicos].sort(
    (a, b) => b.valorTotal - a.valorTotal
  );

  // Colunas para a tabela de produtos
  const produtosColumns = [
    {
      title: "Produto",
      dataIndex: "descricao",
      key: "descricao",
      render: (text, record) => (
        <Space>
          <Avatar
            style={{ backgroundColor: "#1890ff" }}
            icon={<TagOutlined />}
          />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Categoria",
      dataIndex: "categoria",
      key: "categoria",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Quantidade",
      dataIndex: "quantidade",
      key: "quantidade",
      sorter: (a, b) => a.quantidade - b.quantidade,
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Valor Unitário",
      dataIndex: "valorUnitario",
      key: "valorUnitario",
      render: (value) => <Text type="success">{toMoneyFormat(value)}</Text>,
    },
    {
      title: "Valor Total",
      dataIndex: "valorTotal",
      key: "valorTotal",
      sorter: (a, b) => a.valorTotal - b.valorTotal,
      render: (value) => (
        <Text strong style={{ color: "#52c41a" }}>
          {toMoneyFormat(value)}
        </Text>
      ),
    },
  ];

  // Colunas para a tabela de serviços
  const servicosColumns = [
    {
      title: "Serviço",
      dataIndex: "descricao",
      key: "descricao",
      render: (text, record) => (
        <Space>
          <Avatar
            style={{ backgroundColor: "#722ed1" }}
            icon={<BoxPlotOutlined />}
          />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Categoria",
      dataIndex: "categoria",
      key: "categoria",
      render: (text) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: "Quantidade",
      dataIndex: "quantidade",
      key: "quantidade",
      sorter: (a, b) => a.quantidade - b.quantidade,
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Valor Unitário",
      dataIndex: "valorUnitario",
      key: "valorUnitario",
      render: (value) => <Text type="success">{toMoneyFormat(value)}</Text>,
    },
    {
      title: "Valor Total",
      dataIndex: "valorTotal",
      key: "valorTotal",
      sorter: (a, b) => a.valorTotal - b.valorTotal,
      render: (value) => (
        <Text strong style={{ color: "#52c41a" }}>
          {toMoneyFormat(value)}
        </Text>
      ),
    },
  ];

  // Componente de card para estatísticas
  const StatCard = ({ title, value, icon, color }) => (
    <Card bordered={false} className="stat-card" style={{ height: "100%" }}>
      <Statistic
        title={<Text strong>{title}</Text>}
        value={value}
        valueStyle={{ color }}
        prefix={React.cloneElement(icon, {
          style: { fontSize: 20, marginRight: 8 },
        })}
      />
      <div style={{ marginTop: 8 }}>
        <Divider style={{ margin: "8px 0" }} />
        <Space>
          <SyncOutlined spin={loading} />
          <Text type="secondary">
            {loading ? "Atualizando..." : "Atualizado agora"}
          </Text>
        </Space>
      </div>
    </Card>
  );

  // Componente para exibir tabelas em abas
  const TableWithTabs = ({ title, produtosData, servicosData }) => (
    <Card
      title={title}
      style={{ marginBottom: 24 }}
      extra={
        <Button
          type="text"
          icon={<ReloadOutlined />}
          onClick={fetchDashboardData}
          loading={loading}
        >
          Atualizar
        </Button>
      }
    >
      <Tabs defaultActiveKey="produtos">
        <TabPane
          tab={
            <span>
              <TagOutlined /> Produtos ({produtosData.length})
            </span>
          }
          key="produtos"
        >
          <Table
            dataSource={produtosData}
            columns={produtosColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            loading={loading}
            locale={{
              emptyText: <Empty description="Nenhum produto encontrado" />,
            }}
            size="middle"
            scroll={{ x: 800 }}
          />
        </TabPane>
        <TabPane
          tab={
            <span>
              <BoxPlotOutlined /> Serviços ({servicosData.length})
            </span>
          }
          key="servicos"
        >
          <Table
            dataSource={servicosData}
            columns={servicosColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            loading={loading}
            locale={{
              emptyText: <Empty description="Nenhum serviço encontrado" />,
            }}
            size="middle"
            scroll={{ x: 800 }}
          />
        </TabPane>
      </Tabs>
    </Card>
  );

  // Calcular os totais para os cards
  const totalProdutosQtd = produtos.reduce(
    (acc, item) => acc + item.quantidade,
    0
  );
  const totalServicosQtd = servicos.reduce(
    (acc, item) => acc + item.quantidade,
    0
  );
  const totalProdutosValor = produtos.reduce(
    (acc, item) => acc + item.valorTotal,
    0
  );
  const totalServicosValor = servicos.reduce(
    (acc, item) => acc + item.valorTotal,
    0
  );
  const totalVendas = totalProdutosValor + totalServicosValor;

  return (
    <div
      className="dashboard-container"
      style={{ padding: 24, background: "#f0f2f5", minHeight: "100vh" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={2}>Detalhamento das Vendas</Title>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={fetchDashboardData}
          loading={loading}
        >
          Atualizar Dados
        </Button>
      </div>

      {error && (
        <Alert
          message="Erro ao carregar dados"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" danger onClick={fetchDashboardData}>
              Tentar novamente
            </Button>
          }
        />
      )}

      {/* Cards de estatísticas */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={8}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ) : (
            <StatCard
              title="Total Produtos"
              value={toMoneyFormat(totalProdutosValor)}
              icon={<ShoppingOutlined />}
              color="#1890ff"
            />
          )}
        </Col>

        <Col xs={24} sm={12} md={8} lg={8}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ) : (
            <StatCard
              title="Total Serviços"
              value={toMoneyFormat(totalServicosValor)}
              icon={<ShopOutlined />}
              color="#722ed1"
            />
          )}
        </Col>

        <Col xs={24} sm={12} md={8} lg={8}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ) : (
            <StatCard
              title="Itens Vendidos (Produtos + Serviços)"
              value={totalProdutosQtd + totalServicosQtd}
              icon={<FundOutlined />}
              color="#fa8c16"
            />
          )}
        </Col>
      </Row>

      {/* Tabelas de Ranking por Quantidade */}
      <TableWithTabs
        title={
          <>
            <FundOutlined /> Ranking por Quantidade
          </>
        }
        produtosData={produtosByQtd}
        servicosData={servicosByQtd}
      />

      {/* Tabelas de Ranking por Valor */}
      <TableWithTabs
        title={
          <>
            <DollarOutlined /> Ranking por Valor
          </>
        }
        produtosData={produtosByValor}
        servicosData={servicosByValor}
      />

      {/* Rodapé informativo */}
      <div
        style={{
          textAlign: "center",
          marginTop: 24,
          padding: "16px 0",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <Text type="secondary">
          O dashboard mostra os produtos e serviços mais vendidos por quantidade
          e valor. Última atualização: {new Date().toLocaleString()}
        </Text>
      </div>
    </div>
  );
}

export default TopSellingItemsDashboard;
