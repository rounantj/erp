import React, { useEffect, useState, useMemo } from "react";
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
import { useThemeColor, quietMobileStyles } from "helpers/theme";
import "./admin-ui.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

function Despesas() {
  const { primary, theme, pageStyle } = useThemeColor();
  const mobileStyles = useMemo(
    () => ({
      ...quietMobileStyles(primary),
      totalCard: {
        ...quietMobileStyles(primary).totalCard,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        textAlign: "left",
      },
    }),
    [primary]
  );
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
        <span
          className={`qui-status ${
            status === "Pago" ? "qui-status--ok" : "qui-status--warn"
          }`}
        >
          {status}
        </span>
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
        <span className="qui-status qui-status--muted">
          {fixa ? "Fixa" : "Variável"}
        </span>
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
              className="qui-icon-btn"
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
                className="qui-icon-btn"
                danger
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
      <ConfigProvider theme={theme}>
        <div className="qui-page" style={{ ...mobileStyles.container, ...pageStyle }}>
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
                  <h1 style={mobileStyles.headerTitle}>Despesas</h1>
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
                            <span
                              className={`qui-status ${
                                despesa.status === "Pago"
                                  ? "qui-status--ok"
                                  : "qui-status--warn"
                              }`}
                            >
                              {despesa.status}
                            </span>
                            <span className="qui-status qui-status--muted">
                              {despesa.fixa ? "Fixa" : "Variável"}
                            </span>
                            {isLate && (
                              <span className="qui-status qui-status--danger">
                                Atrasada
                              </span>
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
            title={editingId ? "Editar despesa" : "Nova despesa"}
            open={isModalVisible}
            onCancel={handleCancel}
            footer={null}
            destroyOnClose
            wrapClassName="qui-sheet"
            classNames={{ mask: "qui-dialog-mask" }}
            width="100%"
            centered={false}
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
    <ConfigProvider theme={theme}>
    <div className="qui-page" style={pageStyle}>
      <div className="qui-header">
        <div>
          <h1>Despesas</h1>
          <p>Contas a pagar e recorrentes</p>
        </div>
        <Button type="primary" onClick={showCreateModal} icon={<PlusOutlined />}>
          Nova despesa
        </Button>
      </div>
      <div className="qui-stats">
        <div className="qui-stat">
          <small>Cadastradas</small>
          <b>{estatisticas.totalDespesas}</b>
        </div>
        <div className="qui-stat">
          <small>Pendente</small>
          <b>{formatCurrency(estatisticas.totalValorPendente)}</b>
        </div>
        <div className="qui-stat">
          <small>Pago</small>
          <b>{formatCurrency(estatisticas.totalValorPago)}</b>
        </div>
        <div className="qui-stat">
          <small>Fixas</small>
          <b>
            {estatisticas.despesasFixas}/{estatisticas.totalDespesas}
          </b>
        </div>
      </div>
      <div className="qui-panel" style={{ padding: 16 }}>

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
      </div>

      {/* Modal de Cadastro/Edição */}
      <Modal
        title={editingId ? "Editar despesa" : "Nova despesa"}
        open={isModalVisible}
        onCancel={handleCancel}
        wrapClassName="qui-dialog"
        classNames={{ mask: "qui-dialog-mask" }}
        centered
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
    </div>
    </ConfigProvider>
  );
}

export default Despesas;
