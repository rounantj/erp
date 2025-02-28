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
} from "@ant-design/icons";
import { updateDespesa, getDespesas, delDepesa } from "helpers/api-integrator";
import moment from "moment";
import { CSVLink } from "react-csv";

const { Title, Text } = Typography;
const { Option } = Select;

function Despesas() {
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
