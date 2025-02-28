import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Skeleton,
  Typography,
  Checkbox,
  Button,
  Tooltip,
  Divider,
  Badge,
  Space,
  Modal,
  Form,
  Input,
  message,
  Empty,
  Progress,
} from "antd";
import {
  CalendarOutlined,
  SyncOutlined,
  ShoppingOutlined,
  DollarOutlined,
  PieChartOutlined,
  EditOutlined,
  DeleteOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { getDashboard } from "helpers/api-integrator";
import { toMoneyFormat, monthName } from "helpers/formatters";
import ChartistGraph from "react-chartist"; // Keeping the existing chart library

const { Title, Text } = Typography;

function Dashboard() {
  const [dataDash, setDataDash] = useState({
    produtosVendidos: [
      {
        id: 301,
        descricao: "IMPRESSÃO COLORIDO",
        valor: 2,
        companyId: 1,
        categoria: "Serviço",
        ean: "",
        ncm: '48053000"Papel sulfito p/embalagem,n/revestido,em rolos/folhas"',
        createdAt: "2024-11-25T21:38:56.949Z",
        updatedAt: "2024-06-13T17:18:03.879Z",
        updatedByUser: 1,
        createdByUser: 1,
        deletedAt: null,
        quantidade: "9",
        valorTotal: 18,
      },
    ],
    totalProdutos: 10,
    totalServicos: 10,
    totalHoje: 10,
    totalEsseMes: 10,
    dias: ["25/11"],
    servicosValues: [24],
    fullValues: [53.980000000000004],
    produtosValues: [29.98],
    meses: ["Jun", "Jul", "Nov"],
    mesesSerValues: [28.47, 144.73, 29.98],
    mesesPrdValues: [6.75, 7, 24],
    despesa: [
      {
        total: 1350,
      },
    ],
  });

  // State for tasks management
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Cliente BELTRANA ficou devendo R$ 2,00",
      completed: false,
    },
    {
      id: 2,
      title:
        "Ligar para fornecedor XXXXX para orçar cartolinas que estão acabando",
      completed: true,
    },
    {
      id: 3,
      title: "Cliente BELTRANA ficou devendo R$ 2,00",
      completed: false,
    },
    {
      id: 4,
      title:
        "Ligar para fornecedor XXXXX para orçar cartolinas que estão acabando",
      completed: true,
    },
    {
      id: 5,
      title: "Cliente BELTRANA ficou devendo R$ 2,00",
      completed: false,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();

  // Fetch dashboard data
  const getDataDash = async () => {
    setLoading(true);
    try {
      const result = await getDashboard();
      if (result.success) {
        setDataDash(result.data);
      }
    } catch (error) {
      message.error("Falha ao carregar dados do dashboard");
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDataDash();
  }, []);

  // Task management functions
  const showTaskModal = (task = null) => {
    setEditingTask(task);
    if (task) {
      form.setFieldsValue({ title: task.title });
    } else {
      form.resetFields();
    }
    setTaskModalVisible(true);
  };

  const handleTaskModalOk = () => {
    form.validateFields().then((values) => {
      if (editingTask) {
        // Update existing task
        setTasks(
          tasks.map((task) =>
            task.id === editingTask.id ? { ...task, title: values.title } : task
          )
        );
      } else {
        // Add new task
        const newTask = {
          id: Date.now(),
          title: values.title,
          completed: false,
        };
        setTasks([...tasks, newTask]);
      }
      setTaskModalVisible(false);
      form.resetFields();
    });
  };

  const handleTaskModalCancel = () => {
    setTaskModalVisible(false);
  };

  const toggleTaskComplete = (taskId) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (taskId) => {
    Modal.confirm({
      title: "Tem certeza que deseja excluir esta tarefa?",
      content: "Esta ação não pode ser desfeita.",
      okText: "Sim",
      okType: "danger",
      cancelText: "Não",
      onOk() {
        setTasks(tasks.filter((task) => task.id !== taskId));
      },
    });
  };

  // Data transformations for charts
  const dataPizza = () => {
    const total = dataDash.totalProdutos + dataDash.totalServicos;
    const pP = +((dataDash.totalProdutos * 100) / total).toFixed(2);
    const pS = +((dataDash.totalServicos * 100) / total).toFixed(2);

    return {
      labels: [`Produtos ${pP}%`, `Serviços ${pS}%`],
      series: [pP, pS],
    };
  };

  // Component for stats cards
  const StatCard = ({ title, value, icon, color }) => (
    <Card className="stat-card" bordered={false} style={{ height: "100%" }}>
      <Statistic
        title={<Text strong>{title}</Text>}
        value={value}
        valueStyle={{ color }}
        prefix={React.cloneElement(icon, {
          style: { fontSize: 20, marginRight: 8 },
        })}
      />
      <div className="stat-footer">
        <Divider style={{ margin: "12px 0" }} />
        <Space>
          <SyncOutlined spin={loading} />
          <Text type="secondary">Atualizado agora</Text>
        </Space>
      </div>
    </Card>
  );

  // Pie chart visualization using Progress components
  const PieChartVisual = () => {
    const total = dataDash.totalProdutos + dataDash.totalServicos;
    const pP = +((dataDash.totalProdutos * 100) / total).toFixed(2);
    const pS = +((dataDash.totalServicos * 100) / total).toFixed(2);

    return (
      <div style={{ padding: "20px 0" }}>
        <Row gutter={[0, 16]} justify="center">
          <Col span={24} style={{ textAlign: "center" }}>
            <Progress
              type="circle"
              percent={pP}
              format={() => `${pP}%`}
              strokeColor="#ff4d4f"
              width={180}
            />
            <div style={{ marginTop: 8 }}>
              <Badge color="#ff4d4f" text={<Text strong>Produtos</Text>} />
            </div>
          </Col>
          <Col span={24} style={{ textAlign: "center", marginTop: 16 }}>
            <Progress
              type="circle"
              percent={pS}
              format={() => `${pS}%`}
              strokeColor="#1890ff"
              width={180}
            />
            <div style={{ marginTop: 8 }}>
              <Badge color="#1890ff" text={<Text strong>Serviços</Text>} />
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  // Task table columns
  const taskColumns = [
    {
      title: "Concluído",
      dataIndex: "completed",
      key: "completed",
      width: "80px",
      render: (_, record) => (
        <Checkbox
          checked={record.completed}
          onChange={() => toggleTaskComplete(record.id)}
        />
      ),
    },
    {
      title: "Tarefa",
      dataIndex: "title",
      key: "title",
      render: (text, record) => <Text delete={record.completed}>{text}</Text>,
    },
    {
      title: "Ações",
      key: "action",
      width: "100px",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showTaskModal(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteTask(record.id)}
          />
        </Space>
      ),
    },
  ];

  // Monthly sales summary for bar chart alternative
  const MonthlySalesVisual = () => {
    return (
      <div style={{ padding: "10px 0" }}>
        {dataDash.meses.map((month, index) => {
          const serValue = dataDash.mesesSerValues[index] || 0;
          const prdValue = dataDash.mesesPrdValues[index] || 0;
          const total = serValue + prdValue;

          // Calculate percentages
          const serPercent = total > 0 ? (serValue / total) * 100 : 0;
          const prdPercent = total > 0 ? (prdValue / total) * 100 : 0;

          return (
            <div key={month} style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text strong>{month}</Text>
                <Text>{toMoneyFormat(total)}</Text>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <div style={{ width: "100%", marginRight: 16 }}>
                  <div style={{ display: "flex", height: 20 }}>
                    <div
                      style={{
                        width: `${serPercent}%`,
                        backgroundColor: "#1890ff",
                        height: "100%",
                        borderRadius: "4px 0 0 4px",
                      }}
                    />
                    <div
                      style={{
                        width: `${prdPercent}%`,
                        backgroundColor: "#ff4d4f",
                        height: "100%",
                        borderRadius: "0 4px 4px 0",
                      }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">
                  <Badge
                    color="#1890ff"
                    text={`Serviços: ${toMoneyFormat(serValue)}`}
                  />
                </Text>
                <Text type="secondary">
                  <Badge
                    color="#ff4d4f"
                    text={`Produtos: ${toMoneyFormat(prdValue)}`}
                  />
                </Text>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="dashboard-container"
      style={{ padding: 24, background: "#f0f2f5", minHeight: "100vh" }}
    >
      <Title level={2} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ) : (
            <StatCard
              title={`Dias trabalhados ${monthName(new Date().getMonth())}`}
              value={`${dataDash.dias.length} dias`}
              icon={<CalendarOutlined />}
              color="#1890ff"
            />
          )}
        </Col>

        <Col xs={24} sm={12} lg={6}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ) : (
            <StatCard
              title={`Vendas ${monthName(new Date().getMonth())}`}
              value={toMoneyFormat(dataDash.totalEsseMes)}
              icon={<DollarOutlined />}
              color="#52c41a"
            />
          )}
        </Col>

        <Col xs={24} sm={12} lg={6}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ) : (
            <StatCard
              title="Vendas Hoje"
              value={toMoneyFormat(dataDash.totalHoje)}
              icon={<ShoppingOutlined />}
              color="#722ed1"
            />
          )}
        </Col>

        <Col xs={24} sm={12} lg={6}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ) : (
            <StatCard
              title={`Despesas ${monthName(new Date().getMonth())}`}
              value={toMoneyFormat(dataDash?.despesa[0]?.total || 0)}
              icon={<DollarOutlined />}
              color="#f5222d"
            />
          )}
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          ) : (
            <Card
              title="Vendas por dia"
              extra={<LineChartOutlined />}
              bordered={false}
            >
              <div className="ct-chart" id="chartHours">
                <ChartistGraph
                  data={{
                    labels: dataDash.dias,
                    series: [
                      dataDash.fullValues,
                      dataDash.servicosValues,
                      dataDash.produtosValues,
                    ],
                  }}
                  type="Line"
                  options={{
                    low: 0,
                    high: Math.max(...dataDash.fullValues) + 50,
                    showArea: false,
                    height: "245px",
                    axisX: {
                      showGrid: false,
                    },
                    lineSmooth: true,
                    showLine: true,
                    showPoint: true,
                    fullWidth: true,
                    chartPadding: {
                      right: 50,
                    },
                  }}
                  responsiveOptions={[
                    [
                      "screen and (max-width: 640px)",
                      {
                        axisX: {
                          labelInterpolationFnc: function (value) {
                            return value[0];
                          },
                        },
                      },
                    ],
                  ]}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <Space>
                  <Badge color="#1890ff" text="Total" />
                  <Badge color="#f5222d" text="Serviços" />
                  <Badge color="#faad14" text="Produtos" />
                </Space>
              </div>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          ) : (
            <Card
              title="Divisão de Receita"
              extra={<PieChartOutlined />}
              bordered={false}
            >
              <PieChartVisual />
            </Card>
          )}
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          ) : (
            <Card
              title="Vendas por Mês em 2024"
              extra={<BarChartOutlined />}
              bordered={false}
            >
              <MonthlySalesVisual />
            </Card>
          )}
        </Col>

        <Col xs={24} lg={12}>
          {loading ? (
            <Card>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          ) : (
            <Card
              style={{ filter: "blur(5px)" }}
              title="Recados e Tarefas"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => showTaskModal()}
                >
                  Nova Tarefa
                </Button>
              }
              bordered={false}
            >
              {tasks.length > 0 ? (
                <Table
                  dataSource={tasks}
                  columns={taskColumns}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                  scroll={{ y: 300 }}
                />
              ) : (
                <Empty description="Sem tarefas no momento" />
              )}
            </Card>
          )}
        </Col>
      </Row>

      {/* Task Modal */}
      <Modal
        title={editingTask ? "Editar Tarefa" : "Adicionar Nova Tarefa"}
        open={taskModalVisible}
        onOk={handleTaskModalOk}
        onCancel={handleTaskModalCancel}
        okText={editingTask ? "Atualizar" : "Adicionar"}
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Descrição da Tarefa"
            rules={[
              { required: true, message: "Por favor, descreva a tarefa" },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Dashboard;
