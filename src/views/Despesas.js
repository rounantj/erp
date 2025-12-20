import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Form,
  Input,
  Button,
  Modal,
  DatePicker,
  Select,
  Checkbox,
  Space,
  Tag,
  Tooltip,
  Statistic,
  Row,
  Col,
  Divider,
  Typography,
  notification,
  Popconfirm,
  InputNumber,
  ConfigProvider,
  Spin,
  Empty,
  FloatButton,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  DownloadOutlined,
  FilterOutlined,
  WalletOutlined,
  ReloadOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { updateDespesa, getDespesas, delDepesa } from "helpers/api-integrator";
import moment from "moment";
import { CSVLink } from "react-csv";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

// Estilos para mobile
const mobileStyles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    maxWidth: "100vw",
    overflow: "hidden",
    background: "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    zIndex: 100,
  },
  header: {
    background: "transparent",
    padding: "16px",
    flexShrink: 0,
  },
  headerTitle: {
    color: "#fff",
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: "12px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
    marginTop: "12px",
  },
  summaryCard: {
    background: "rgba(255,255,255,0.15)",
    borderRadius: "12px",
    padding: "12px",
    backdropFilter: "blur(10px)",
  },
  summaryValue: {
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    display: "block",
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: "10px",
  },
  totalCard: {
    background: "rgba(255,255,255,0.25)",
    borderRadius: "12px",
    padding: "14px",
    marginTop: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalValue: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "800",
    display: "block",
  },
  totalLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: "11px",
  },
  content: {
    flex: 1,
    background: "#f8f9fa",
    borderTopLeftRadius: "24px",
    borderTopRightRadius: "24px",
    padding: "16px",
    paddingBottom: "20px",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    maxWidth: "100vw",
    boxSizing: "border-box",
    minHeight: 0,
  },
  searchContainer: {
    marginBottom: "12px",
    display: "flex",
    gap: "8px",
    flexShrink: 0,
  },
  despesaCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  despesaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  },
  despesaName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: "8px",
  },
  despesaValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#ff6b6b",
  },
  despesaActions: {
    display: "flex",
    gap: "6px",
    marginTop: "8px",
  },
  actionButton: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

function Despesas() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detectar mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [despesas, setDespesas] = useState([]);
  const [filteredDespesas, setFilteredDespesas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [tipoFilter, setTipoFilter] = useState("Todos");

  // Estatísticas
  const [estatisticas, setEstatisticas] = useState({
    totalDespesas: 0,
    despesasFixas: 0,
    despesasVariaveis: 0,
    despesasPagas: 0,
    despesasPendentes: 0,
    totalValorPago: 0,
    totalValorPendente: 0,
  });

  // Modal de cadastro/edição
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);

  // Obtém as despesas da API
  const getFullDespesas = async () => {
    setLoading(true);
    try {
      const request = await getDespesas();
      if (request && request.data) {
        setDespesas(request.data);
        setFilteredDespesas(request.data);
        calcularEstatisticas(request.data);
      }
    } catch (error) {
      notification.error({
        message: "Erro ao buscar despesas",
        description:
          "Não foi possível carregar as despesas. Tente novamente mais tarde.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const calcularEstatisticas = (data) => {
    const stats = {
      totalDespesas: data.length,
      despesasFixas: data.filter((d) => d.fixa).length,
      despesasVariaveis: data.filter((d) => !d.fixa).length,
      despesasPagas: data.filter((d) => d.status === "Pago").length,
      despesasPendentes: data.filter((d) => d.status === "Em Aberto").length,
      totalValorPago: data
        .filter((d) => d.status === "Pago")
        .reduce((acc, curr) => acc + curr.valor, 0),
      totalValorPendente: data
        .filter((d) => d.status === "Em Aberto")
        .reduce((acc, curr) => acc + curr.valor, 0),
    };
    setEstatisticas(stats);
  };

  // Filtrar despesas
  useEffect(() => {
    const filtrarDespesas = () => {
      let dadosFiltrados = [...despesas];

      // Filtro de texto (descrição)
      if (searchText) {
        dadosFiltrados = dadosFiltrados.filter((item) =>
          item.descricao.toLowerCase().includes(searchText.toLowerCase())
        );
      }

      // Filtro de status
      if (statusFilter !== "Todos") {
        dadosFiltrados = dadosFiltrados.filter(
          (item) => item.status === statusFilter
        );
      }

      // Filtro de tipo (fixa ou variável)
      if (tipoFilter !== "Todos") {
        const isFixa = tipoFilter === "Fixa";
        dadosFiltrados = dadosFiltrados.filter((item) => item.fixa === isFixa);
      }

      setFilteredDespesas(dadosFiltrados);
    };

    filtrarDespesas();
  }, [despesas, searchText, statusFilter, tipoFilter]);

  // Carregar dados ao iniciar
  useEffect(() => {
    getFullDespesas();
  }, []);

  // Abrir modal para criar nova despesa
  const showCreateModal = () => {
    form.resetFields();
    setEditingId(null);
    setIsModalVisible(true);
  };

  // Abrir modal para editar despesa existente
  const showEditModal = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      descricao: record.descricao,
      valor: record.valor,
      status: record.status,
      fixa: record.fixa,
      vencimento: moment(record.vencimento),
    });
    setIsModalVisible(true);
  };

  // Fechar modal
  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  // Salvar despesa (criar ou atualizar)
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const despesa = {
        id: editingId || despesas.length + 1,
        descricao: values.descricao,
        valor: values.valor,
        status: values.status,
        fixa: values.fixa || false,
        vencimento: values.vencimento.format("YYYY-MM-DD"),
        categoria: values.fixa ? "Recorrente" : "Passageira",
      };

      setLoading(true);
      await updateDespesa(despesa);

      notification.success({
        message: editingId ? "Despesa atualizada" : "Despesa cadastrada",
        description: `A despesa "${values.descricao}" foi ${
          editingId ? "atualizada" : "cadastrada"
        } com sucesso!`,
      });

      setIsModalVisible(false);
      form.resetFields();
      getFullDespesas();
    } catch (error) {
      notification.error({
        message: "Erro ao salvar",
        description: "Verifique os campos e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Excluir despesa
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await delDepesa(id);
      notification.success({
        message: "Despesa removida",
        description: "A despesa foi removida com sucesso!",
      });
      getFullDespesas();
    } catch (error) {
      notification.error({
        message: "Erro ao remover",
        description: "Não foi possível remover a despesa. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Configuração das colunas da tabela
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Descrição",
      dataIndex: "descricao",
      key: "descricao",
      sorter: (a, b) => a.descricao.localeCompare(b.descricao),
    },
    {
      title: "Valor",
      dataIndex: "valor",
      key: "valor",
      render: (valor) =>
        `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      sorter: (a, b) => a.valor - b.valor,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={status === "Pago" ? "green" : "volcano"}
          icon={
            status === "Pago" ? (
              <CheckCircleOutlined />
            ) : (
              <ClockCircleOutlined />
            )
          }
        >
          {status}
        </Tag>
      ),
      filters: [
        { text: "Pago", value: "Pago" },
        { text: "Em Aberto", value: "Em Aberto" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Tipo",
      dataIndex: "fixa",
      key: "fixa",
      render: (fixa) => (
        <Tag color={fixa ? "blue" : "orange"}>{fixa ? "Fixa" : "Variável"}</Tag>
      ),
      filters: [
        { text: "Fixa", value: true },
        { text: "Variável", value: false },
      ],
      onFilter: (value, record) => record.fixa === value,
    },
    {
      title: "Vencimento",
      dataIndex: "vencimento",
      key: "vencimento",
      render: (vencimento) => {
        const date = moment(vencimento);
        const isLate = date.isBefore(moment(), "day") && status !== "Pago";
        return (
          <span style={{ color: isLate ? "red" : "inherit" }}>
            {date.format("DD/MM/YYYY")}
            {isLate && (
              <ExclamationCircleOutlined
                style={{ marginLeft: 8, color: "red" }}
              />
            )}
          </span>
        );
      },
      sorter: (a, b) =>
        moment(a.vencimento).unix() - moment(b.vencimento).unix(),
    },
    {
      title: "Ações",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button
              type="primary"
              shape="circle"
              icon={<EditOutlined />}
              size="small"
              onClick={() => showEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Excluir">
            <Popconfirm
              title="Tem certeza que deseja excluir esta despesa?"
              onConfirm={() => handleDelete(record.id)}
              okText="Sim"
              cancelText="Não"
            >
              <Button
                type="primary"
                danger
                shape="circle"
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Preparar dados para exportação CSV
  const csvData = filteredDespesas.map((item) => ({
    ID: item.id,
    Descrição: item.descricao,
    Valor: item.valor,
    Status: item.status,
    Tipo: item.fixa ? "Fixa" : "Variável",
    Vencimento: moment(item.vencimento).format("DD/MM/YYYY"),
  }));

  // Formatar moeda
  const formatCurrency = (value) => {
    return `R$ ${(parseFloat(value) || 0).toFixed(2).replace(".", ",")}`;
  };

  // ========== RENDER MOBILE ==========
  if (isMobile) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#ff6b6b",
            borderRadius: 12,
          },
        }}
      >
        <div style={mobileStyles.container}>
          {/* Header Mobile */}
          <div style={mobileStyles.header}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                {/* Botão Menu */}
                <div
                  onClick={() => {
                    const isOpen = document.documentElement.classList.contains("nav-open");
                    if (isOpen) {
                      document.documentElement.classList.remove("nav-open");
                      const existingBodyClick = document.getElementById("bodyClick");
                      if (existingBodyClick) existingBodyClick.parentElement.removeChild(existingBodyClick);
                    } else {
                      document.documentElement.classList.add("nav-open");
                      const existingBodyClick = document.getElementById("bodyClick");
                      if (existingBodyClick) existingBodyClick.parentElement.removeChild(existingBodyClick);
                      var node = document.createElement("div");
                      node.id = "bodyClick";
                      node.style.cssText = "position:fixed;top:0;left:0;right:250px;bottom:0;z-index:9999;";
                      node.onclick = function () {
                        this.parentElement.removeChild(this);
                        document.documentElement.classList.remove("nav-open");
                      };
                      document.body.appendChild(node);
                    }
                  }}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MenuOutlined style={{ color: "#fff", fontSize: "18px" }} />
                </div>
                <div>
                  <h1 style={mobileStyles.headerTitle}>
                    <WalletOutlined style={{ marginRight: "8px" }} />
                    Despesas
                  </h1>
                  <Text style={mobileStyles.headerSubtitle}>
                    {estatisticas.totalDespesas} despesas cadastradas
                  </Text>
                </div>
              </div>
              <div
                onClick={getFullDespesas}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                <ReloadOutlined spin={loading} style={{ color: "#fff" }} />
              </div>
            </div>

            {/* Summary Cards */}
            <div style={mobileStyles.summaryGrid}>
              <div style={mobileStyles.summaryCard}>
                <ClockCircleOutlined style={{ color: "rgba(255,255,255,0.8)", marginBottom: "4px" }} />
                <span style={mobileStyles.summaryValue}>{estatisticas.despesasPendentes}</span>
                <span style={mobileStyles.summaryLabel}>Pendentes</span>
              </div>
              <div style={mobileStyles.summaryCard}>
                <CheckCircleOutlined style={{ color: "rgba(255,255,255,0.8)", marginBottom: "4px" }} />
                <span style={mobileStyles.summaryValue}>{estatisticas.despesasPagas}</span>
                <span style={mobileStyles.summaryLabel}>Pagas</span>
              </div>
              <div style={mobileStyles.summaryCard}>
                <ExclamationCircleOutlined style={{ color: "rgba(255,255,255,0.8)", marginBottom: "4px" }} />
                <span style={mobileStyles.summaryValue}>
                  {formatCurrency(estatisticas.totalValorPendente).replace("R$ ", "")}
                </span>
                <span style={mobileStyles.summaryLabel}>Valor Pendente</span>
              </div>
              <div style={mobileStyles.summaryCard}>
                <CheckCircleOutlined style={{ color: "rgba(255,255,255,0.8)", marginBottom: "4px" }} />
                <span style={mobileStyles.summaryValue}>
                  {formatCurrency(estatisticas.totalValorPago).replace("R$ ", "")}
                </span>
                <span style={mobileStyles.summaryLabel}>Valor Pago</span>
              </div>
            </div>

            {/* Total Card */}
            <div style={mobileStyles.totalCard}>
              <div>
                <span style={mobileStyles.totalLabel}>PENDENTE</span>
                <span style={mobileStyles.totalValue}>
                  {formatCurrency(estatisticas.totalValorPendente)}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={mobileStyles.totalLabel}>PAGO</span>
                <span style={{ ...mobileStyles.totalValue, color: "rgba(255,255,255,0.9)" }}>
                  {formatCurrency(estatisticas.totalValorPago)}
                </span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div style={mobileStyles.content}>
            {/* Search */}
            <div style={mobileStyles.searchContainer}>
              <Search
                placeholder="Buscar despesa..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                size="large"
                style={{ flex: 1, borderRadius: "12px" }}
              />
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexShrink: 0 }}>
              <Select
                size="small"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ flex: 1 }}
              >
                <Option value="Todos">Todos</Option>
                <Option value="Pago">Pago</Option>
                <Option value="Em Aberto">Pendente</Option>
              </Select>
              <Select
                size="small"
                value={tipoFilter}
                onChange={setTipoFilter}
                style={{ flex: 1 }}
              >
                <Option value="Todos">Todos</Option>
                <Option value="Fixa">Fixa</Option>
                <Option value="Variável">Variável</Option>
              </Select>
            </div>

            {/* Despesas List */}
            <div style={{ 
              flex: 1, 
              overflow: "auto",
              minHeight: 0,
              WebkitOverflowScrolling: "touch",
            }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <Spin size="large" />
                  <div style={{ marginTop: "12px" }}>
                    <Text type="secondary">Carregando despesas...</Text>
                  </div>
                </div>
              ) : filteredDespesas.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Nenhuma despesa encontrada"
                  style={{ marginTop: "40px" }}
                />
              ) : (
                filteredDespesas.map((despesa) => {
                  const isLate = moment(despesa.vencimento).isBefore(moment(), "day") && despesa.status !== "Pago";
                  return (
                    <div key={despesa.id} style={mobileStyles.despesaCard}>
                      <div style={mobileStyles.despesaHeader}>
                        <div style={{ flex: 1 }}>
                          <div style={mobileStyles.despesaName}>
                            {despesa.descricao}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                            <Tag
                              color={despesa.status === "Pago" ? "green" : "volcano"}
                              icon={despesa.status === "Pago" ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                              style={{ margin: 0, fontSize: "10px" }}
                            >
                              {despesa.status}
                            </Tag>
                            <Tag
                              color={despesa.fixa ? "blue" : "orange"}
                              style={{ margin: 0, fontSize: "10px" }}
                            >
                              {despesa.fixa ? "Fixa" : "Variável"}
                            </Tag>
                            {isLate && (
                              <Tag color="red" icon={<ExclamationCircleOutlined />} style={{ margin: 0, fontSize: "10px" }}>
                                Atrasada
                              </Tag>
                            )}
                          </div>
                          <Text style={{ fontSize: "11px", color: "#999", display: "block", marginTop: "4px" }}>
                            Venc: {moment(despesa.vencimento).format("DD/MM/YYYY")}
                          </Text>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <Text style={mobileStyles.despesaValue}>
                            {formatCurrency(despesa.valor)}
                          </Text>
                        </div>
                      </div>

                      <div style={mobileStyles.despesaActions}>
                        <Button
                          type="primary"
                          icon={<EditOutlined />}
                          size="small"
                          onClick={() => showEditModal(despesa)}
                          style={{ flex: 1, borderRadius: "8px" }}
                        >
                          Editar
                        </Button>
                        <Popconfirm
                          title="Excluir despesa?"
                          onConfirm={() => handleDelete(despesa.id)}
                          okText="Sim"
                          cancelText="Não"
                        >
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            style={{ flex: 1, borderRadius: "8px" }}
                          >
                            Excluir
                          </Button>
                        </Popconfirm>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Results count */}
            {!loading && filteredDespesas.length > 0 && (
              <div style={{ 
                textAlign: "center", 
                padding: "8px 0",
                flexShrink: 0,
              }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {filteredDespesas.length} {filteredDespesas.length === 1 ? "despesa" : "despesas"}
                </Text>
              </div>
            )}
          </div>

          {/* Floating Add Button */}
          <FloatButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={showCreateModal}
            style={{
              right: 20,
              bottom: 20,
              width: 56,
              height: 56,
            }}
          />

          {/* Modal de Cadastro/Edição */}
          <Modal
            title={editingId ? "Editar Despesa" : "Nova Despesa"}
            open={isModalVisible}
            onCancel={handleCancel}
            footer={null}
            destroyOnClose
            width="100%"
            style={{ top: 0, maxWidth: "100vw", margin: 0, padding: 0 }}
            bodyStyle={{ padding: "16px" }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              initialValues={{
                status: "Em Aberto",
                fixa: false,
                vencimento: moment(),
              }}
            >
              <Form.Item
                name="descricao"
                label="Descrição"
                rules={[{ required: true, message: "Informe a descrição" }]}
              >
                <Input placeholder="Ex.: Conta de luz" size="large" />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="valor"
                    label="Valor (R$)"
                    rules={[{ required: true, message: "Informe o valor" }]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="0,00"
                      precision={2}
                      min={0}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="status"
                    label="Status"
                    rules={[{ required: true }]}
                  >
                    <Select placeholder="Status" size="large">
                      <Option value="Pago">Pago</Option>
                      <Option value="Em Aberto">Em Aberto</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="vencimento"
                    label="Vencimento"
                    rules={[{ required: true }]}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="fixa"
                    valuePropName="checked"
                    style={{ marginTop: 29 }}
                  >
                    <Checkbox>Despesa Fixa</Checkbox>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginBottom: 0, marginTop: "16px" }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                  style={{ height: "48px", borderRadius: "12px" }}
                >
                  {editingId ? "Atualizar" : "Cadastrar"}
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </ConfigProvider>
    );
  }

  // ========== RENDER DESKTOP ==========
  return (
    <>
      <Card
        title={<Title level={4}>Controle de Despesas</Title>}
        extra={
          <Button
            type="primary"
            onClick={showCreateModal}
            icon={<PlusOutlined />}
          >
            Nova Despesa
          </Button>
        }
      >
        {/* Painel de Estatísticas */}
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Total de Despesas"
              value={estatisticas.totalDespesas}
              suffix="despesas"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Valor Pendente"
              value={estatisticas.totalValorPendente}
              precision={2}
              prefix="R$"
              valueStyle={{ color: "#cf1322" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Valor Pago"
              value={estatisticas.totalValorPago}
              precision={2}
              prefix="R$"
              valueStyle={{ color: "#3f8600" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Despesas Fixas"
              value={estatisticas.despesasFixas}
              suffix={`/ ${estatisticas.totalDespesas}`}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
        </Row>

        <Divider />

        {/* Filtros */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input
              placeholder="Buscar por descrição"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col span={5}>
            <Select
              style={{ width: "100%" }}
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="Todos">Todos os status</Option>
              <Option value="Pago">Pago</Option>
              <Option value="Em Aberto">Em Aberto</Option>
            </Select>
          </Col>
          <Col span={5}>
            <Select
              style={{ width: "100%" }}
              placeholder="Tipo"
              value={tipoFilter}
              onChange={setTipoFilter}
            >
              <Option value="Todos">Todos os tipos</Option>
              <Option value="Fixa">Fixa</Option>
              <Option value="Variável">Variável</Option>
            </Select>
          </Col>
          <Col span={6} style={{ textAlign: "right" }}>
            <CSVLink
              data={csvData}
              filename="despesas.csv"
              className="ant-btn ant-btn-default"
              style={{ marginRight: 8 }}
            >
              <DownloadOutlined /> Exportar CSV
            </CSVLink>
          </Col>
        </Row>

        {/* Tabela de Despesas */}
        <Table
          columns={columns}
          dataSource={filteredDespesas}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total de ${total} despesas`,
          }}
        />
      </Card>

      {/* Modal de Cadastro/Edição */}
      <Modal
        title={editingId ? "Editar Despesa" : "Cadastrar Nova Despesa"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleSave}
          >
            {editingId ? "Atualizar" : "Cadastrar"}
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: "Em Aberto",
            fixa: false,
            vencimento: moment(),
          }}
        >
          <Form.Item
            name="descricao"
            label="Descrição"
            rules={[
              {
                required: true,
                message: "Por favor, informe a descrição da despesa",
              },
            ]}
          >
            <Input placeholder="Ex.: Conta de luz" maxLength={100} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="valor"
                label="Valor (R$)"
                rules={[
                  { required: true, message: "Por favor, informe o valor" },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0,00"
                  precision={2}
                  min={0}
                  formatter={(value) =>
                    `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                  }
                  parser={(value) =>
                    value.replace(/R\$\s?|(\.)/g, "").replace(",", ".")
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: "Selecione o status" }]}
              >
                <Select placeholder="Selecione o status">
                  <Option value="Pago">Pago</Option>
                  <Option value="Em Aberto">Em Aberto</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vencimento"
                label="Data de Vencimento"
                rules={[
                  { required: true, message: "Selecione a data de vencimento" },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Selecione a data"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fixa"
                valuePropName="checked"
                style={{ marginTop: 29 }}
              >
                <Checkbox>Despesa Fixa (recorrente)</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}

export default Despesas;
