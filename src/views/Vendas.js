import { getSells } from "helpers/api-integrator";
import { toDateFormat, toMoneyFormat } from "helpers/formatters";
import React, { useEffect, useState, useRef, useContext } from "react";
import ptBR from "antd/lib/locale/pt_BR";
import moment from "moment";
import "moment/locale/pt-br";
import {
  Table,
  DatePicker,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  ConfigProvider,
  Layout,
  Divider,
  Space,
  Tag,
  Empty,
  Spin,
  Button,
  Drawer,
  Tooltip,
  Form,
  Modal,
  Popconfirm,
} from "antd";
import {
  BarChartOutlined,
  CalendarOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  FilterOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { UserContext } from "context/UserContext";
import Paragraph from "antd/lib/typography/Paragraph";
import TextArea from "antd/lib/input/TextArea";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Content } = Layout;

// Função para calcular o total da venda com desconto
export const calcularTotal = (valor, desconto) => {
  return +valor - +desconto;
};

function Vendas() {
  // Estados
  const { user } = useContext(UserContext);
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(moment().subtract(1, "month"));
  const [endDate, setEndDate] = useState(moment().add(10, "day"));
  const [isMobile, setIsMobile] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);

  // Estados para a exclusão
  const [exclusionModalVisible, setExclusionModalVisible] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState(null);
  const [exclusionReason, setExclusionReason] = useState("");
  const [exclusionLoading, setExclusionLoading] = useState(false);
  const [exclusionForm] = Form.useForm();

  // 2. Adicione estados para o modal de revisão
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    console.log({ selectedVenda, user });
  }, [user, selectedVenda]);
  // 1. Importe as funções da API

  // 3. Função para abrir o modal de revisão
  const openReviewModal = (venda) => {
    setSelectedVenda(venda);
    setReviewModalVisible(true);
    reviewForm.resetFields();
  };

  // 4. Função para aprovar solicitação
  const handleApproveExclusion = async () => {
    try {
      setReviewLoading(true);
      const observacoes = reviewForm.getFieldValue("observacoes") || "";

      const response = await aprovaExclusaoVenda(
        selectedVenda.id,
        observacoes,
        user.user.id
      );

      if (response.success) {
        notification.success({
          message: "Exclusão aprovada",
          description: "A venda será removida do sistema.",
        });

        // Atualizar a venda na lista local
        setVendas((prev) =>
          prev.map((v) =>
            v.id === selectedVenda.id
              ? {
                  ...v,
                  exclusionStatus: "approved",
                  exclusionReviewedAt: new Date(),
                  exclusionReviewNotes: observacoes,
                }
              : v
          )
        );

        setReviewModalVisible(false);
        // Recarregar a lista de vendas
        await getVendas();
      }
    } catch (error) {
      notification.error({
        message: "Erro",
        description: error.message || "Falha ao aprovar exclusão",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  // 5. Função para rejeitar solicitação
  const handleRejectExclusion = async () => {
    try {
      await reviewForm.validateFields();
      const values = reviewForm.getFieldsValue();

      setReviewLoading(true);

      const response = await rejeitaExclusaoVenda(
        selectedVenda.id,
        values.observacoes,
        user.user.id
      );

      if (response.success) {
        notification.success({
          message: "Exclusão rejeitada",
          description: "A solicitação de exclusão foi rejeitada.",
        });

        // Atualizar a venda na lista local
        setVendas((prev) =>
          prev.map((v) =>
            v.id === selectedVenda.id
              ? {
                  ...v,
                  exclusionStatus: "rejected",
                  exclusionReviewedAt: new Date(),
                  exclusionReviewNotes: values.observacoes,
                }
              : v
          )
        );

        setReviewModalVisible(false);
      }
    } catch (error) {
      notification.error({
        message: "Erro",
        description: error.message || "Falha ao rejeitar exclusão",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  // Renderizar tags de status de exclusão
  const renderExclusionStatus = (venda) => {
    console.log({ venda });
    if (!venda.exclusionRequested) return null;

    if (venda.exclusionStatus === "pending") {
      return (
        <Tag icon={<ClockCircleOutlined />} color="warning">
          Aguardando aprovação
        </Tag>
      );
    } else if (venda.exclusionStatus === "approved") {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Exclusão aprovada
        </Tag>
      );
    } else if (venda.exclusionStatus === "rejected") {
      return (
        <Tag icon={<CloseCircleOutlined />} color="error">
          Exclusão negada
        </Tag>
      );
    }

    return null;
  };

  // Abrir modal de solicitação de exclusão
  const openExclusionModal = (venda) => {
    setSelectedVenda(venda);
    setExclusionModalVisible(true);
    exclusionForm.resetFields();
  };

  const columnsVendas = [
    {
      title: "Número",
      dataIndex: "id",
      key: "id",
      // render: (text) => toDateFormat(text, !isMobile),
      sorter: (a, b) => a.id - b.id,
      responsive: ["sm"],
    },
    {
      title: "Data",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => toDateFormat(text, !isMobile),
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
      responsive: ["md"],
    },
    // {
    //   title: "Cliente",
    //   dataIndex: "nome_cliente",
    //   key: "nome_cliente",
    //   render: (text) => (
    //     <Space>
    //       <UserOutlined />
    //       <span
    //         className="mobile-ellipsis"
    //         style={{
    //           maxWidth: isMobile ? "120px" : "100%",
    //           overflow: "hidden",
    //           textOverflow: "ellipsis",
    //           whiteSpace: "nowrap",
    //           display: "inline-block",
    //         }}
    //       >
    //         {text}
    //       </span>
    //     </Space>
    //   ),
    // },
    {
      title: "Total",
      key: "totalComDesconto",
      render: (_, record) => {
        const total = calcularTotal(record.total, record.desconto);
        return (
          <>
            <Text strong>{toMoneyFormat(total)}</Text>
            <Tag
              style={{ float: "right" }}
              //icon={<CheckCircleOutlined />}
              color={
                record.metodoPagamento == "dinheiro" ? "success" : "default"
              }
            >
              {record?.metodoPagamento}
            </Tag>
          </>
        );
      },
      sorter: (a, b) =>
        calcularTotal(a.total, a.desconto) - calcularTotal(b.total, b.desconto),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => renderExclusionStatus(record),
    },
    {
      title: "Data",
      dataIndex: "createdAt",
      key: "createdAtMobile",
      render: (text) => toDateFormat(text, false),
      responsive: ["xs", "sm"],
    },
    {
      title: "Ações",
      key: "actions",
      width: 140,
      render: (_, record) => {
        const isAdmin = user?.user?.role === "admin";

        // Se solicitação pendente e o usuário é admin
        if (
          record.exclusionRequested &&
          record.exclusionStatus === "pending" &&
          isAdmin
        ) {
          return (
            <Space size="small">
              <Tooltip title="Revisar solicitação">
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  size={isMobile ? "small" : "middle"}
                  onClick={() => openReviewModal(record)}
                />
              </Tooltip>
            </Space>
          );
        }

        // Não mostrar botão de exclusão se já houver solicitação pendente
        if (record.exclusionRequested && record.exclusionStatus === "pending") {
          return (
            <Tooltip title="Solicitação de exclusão pendente">
              <Button
                icon={<DeleteOutlined />}
                disabled
                size={isMobile ? "small" : "middle"}
              />
            </Tooltip>
          );
        }

        // Não mostrar botão se a exclusão já foi aprovada
        if (record.exclusionStatus === "approved") {
          return (
            <Tooltip title="Exclusão aprovada">
              <Button
                icon={<DeleteOutlined />}
                disabled
                size={isMobile ? "small" : "middle"}
              />
            </Tooltip>
          );
        }

        // Só mostrar o botão de solicitar exclusão se não houver solicitação ou a anterior foi rejeitada
        if (
          !record.exclusionRequested ||
          record.exclusionStatus === "rejected"
        ) {
          return (
            <Tooltip title="Solicitar exclusão">
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => openExclusionModal(record)}
                size={isMobile ? "small" : "middle"}
              />
            </Tooltip>
          );
        }

        return null;
      },
    },
  ];

  // Referência para o container principal
  const containerRef = useRef(null);

  // Verificar se é mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificar no carregamento inicial
    checkIfMobile();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Filtrar vendas por período
  const filtrarVendas = () => {
    return vendas;
  };

  // Calcular totais por dia
  const calcularTotaisPorDia = () => {
    const totaisPorDia = vendas.reduce((acc, venda) => {
      const data = moment(venda.createdAt).format("YYYY-MM-DD");
      acc[data] = (acc[data] || 0) + calcularTotal(venda.total, venda.desconto);
      return acc;
    }, {});
    return totaisPorDia;
  };

  // Função para alterar as datas
  const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
      setStartDate(dates[0]);
      setEndDate(dates[1]);
      if (isMobile) {
        setFilterDrawerVisible(false);
      }
    }
  };

  // Calcular total por período
  const calcularTotalPorPeriodo = () => {
    const filteredVendas = filtrarVendas();
    const total = filteredVendas.reduce((acc, venda) => {
      return acc + calcularTotal(venda.total, venda.desconto);
    }, 0);
    return total;
  };

  // Número de clientes únicos
  const calcularClientesUnicos = () => {
    const clientesUnicos = new Set(vendas.map((venda) => venda.nome_cliente));
    return clientesUnicos.size;
  };

  // Valor médio por venda
  const calcularValorMedioPorVenda = () => {
    if (vendas.length === 0) return 0;
    return calcularTotalPorPeriodo() / vendas.length;
  };

  const getVendas = async (start, end) => {
    try {
      setLoading(true);
      // Garante que estamos usando o início do dia para a data de início
      // e o final do dia para a data de fim
      const formattedStart = start.startOf("day").format("YYYY-MM-DD");
      const formattedEnd = end.endOf("day").format("YYYY-MM-DD");

      const items = await getSells(formattedStart, formattedEnd);

      if (items.success) {
        setVendas(
          items.data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
        );
      }
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getVendas(startDate, endDate);
  }, [startDate, endDate]);

  // Colunas para a tabela de totais por dia
  const dailyColumns = [
    {
      title: "Data",
      dataIndex: "data",
      key: "data",
      render: (text) => toDateFormat(text),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (text) => toMoneyFormat(text),
    },
  ];

  // Preparar dados para a tabela diária
  const dailyData = Object.entries(calcularTotaisPorDia()).map(
    ([data, total], index) => ({
      key: index,
      data,
      total,
    })
  );

  // Customizando o formatter para Statistic
  const moneyFormatter = (value) => {
    const formatted = toMoneyFormat(value);
    // Se for uma string, tenta remover o "R$ ", caso contrário retorna o valor original
    return typeof formatted === "string"
      ? formatted.replace("R$ ", "")
      : formatted;
  };

  // Componente para o filtro de data (para mobile)
  const DateFilterDrawer = () => (
    <Drawer
      title="Filtro de Período"
      placement="right"
      onClose={() => setFilterDrawerVisible(false)}
      open={filterDrawerVisible}
      width={300}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Text>Selecione o período:</Text>
        <RangePicker
          allowClear={false}
          value={[startDate, endDate]}
          onChange={handleDateChange}
          format="DD/MM/YYYY"
          style={{ width: "100%" }}
          ranges={{
            Hoje: [moment().startOf("day"), moment().endOf("day")],
            "Últimos 7 dias": [
              moment().subtract(6, "days").startOf("day"),
              moment().endOf("day"),
            ],
            "Últimos 30 dias": [
              moment().subtract(29, "days").startOf("day"),
              moment().endOf("day"),
            ],
            "Este mês": [moment().startOf("month"), moment().endOf("month")],
            "Mês passado": [
              moment().subtract(1, "month").startOf("month"),
              moment().subtract(1, "month").endOf("month"),
            ],
          }}
          direction="vertical"
        />
      </Space>
    </Drawer>
  );

  // Componente de DatePicker Responsivo
  const ResponsiveDatePicker = () => {
    if (isMobile) {
      return (
        <Button
          type="primary"
          icon={<FilterOutlined />}
          onClick={() => setFilterDrawerVisible(true)}
        >
          Filtrar
        </Button>
      );
    }

    return (
      <Space align="center" wrap>
        <CalendarOutlined />
        <span style={{ fontSize: "10pt" }}>Período: </span>
        <RangePicker
          allowClear={false}
          value={[startDate, endDate]}
          onChange={handleDateChange}
          format="DD/MM/YYYY"
          ranges={{
            Hoje: [moment().startOf("day"), moment().endOf("day")],
            "Últimos 7 dias": [
              moment().subtract(6, "days").startOf("day"),
              moment().endOf("day"),
            ],
            "Últimos 30 dias": [
              moment().subtract(29, "days").startOf("day"),
              moment().endOf("day"),
            ],
            "Este mês": [moment().startOf("month"), moment().endOf("month")],
            "Mês passado": [
              moment().subtract(1, "month").startOf("month"),
              moment().subtract(1, "month").endOf("month"),
            ],
          }}
          style={{ maxWidth: "100%" }}
          dropdownClassName="date-range-dropdown"
        />
      </Space>
    );
  };

  // Função para solicitar exclusão
  const handleExclusionRequest = async () => {
    try {
      await exclusionForm.validateFields();
      const values = exclusionForm.getFieldsValue();

      setExclusionLoading(true);

      // Chamar a API
      const response = await requestVendaExclusion(
        selectedVenda.id,
        values.motivo
      );

      if (response.success) {
        notification.success({
          message: "Solicitação enviada",
          description:
            "Sua solicitação de exclusão foi enviada para aprovação.",
        });

        // Atualizar a venda na lista local
        setVendas((prev) =>
          prev.map((v) =>
            v.id === selectedVenda.id
              ? {
                  ...v,
                  exclusionRequested: true,
                  exclusionStatus: "pending",
                  exclusionRequestedAt: new Date(),
                  exclusionReason: values.motivo,
                }
              : v
          )
        );

        setExclusionModalVisible(false);
      }
    } catch (error) {
      notification.error({
        message: "Erro",
        description: error.message || "Falha ao solicitar exclusão",
      });
    } finally {
      setExclusionLoading(false);
    }
  };

  return (
    <ConfigProvider locale={ptBR}>
      <Layout
        style={{
          background: "#f0f2f5",
          minHeight: "100vh",
          padding: isMobile ? "8px" : "16px",
        }}
        ref={containerRef}
      >
        <Content>
          <Card bodyStyle={{ padding: isMobile ? "12px" : "24px" }}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Row justify="space-between" align="middle" gutter={[8, 8]} wrap>
                <Col xs={16} md={12}>
                  <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
                    <ShoppingCartOutlined /> Gestão de Vendas
                  </Title>
                </Col>
                <Col xs={8} md={12} style={{ textAlign: "right" }}>
                  <ResponsiveDatePicker />
                </Col>
              </Row>

              <Divider style={{ margin: isMobile ? "12px 0" : "24px 0" }} />

              {loading ? (
                <div style={{ textAlign: "center", padding: "50px" }}>
                  <Spin size="large" />
                </div>
              ) : (
                <>
                  <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                    <Col xs={12} sm={12} md={6}>
                      <Card bodyStyle={{ padding: isMobile ? "12px" : "24px" }}>
                        <Statistic
                          title="Total do Período"
                          value={calcularTotalPorPeriodo()}
                          prefix={<DollarOutlined />}
                          formatter={moneyFormatter}
                          valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                        />
                        <Text
                          type="secondary"
                          style={{ fontSize: isMobile ? "12px" : "14px" }}
                        >
                          {startDate.format("DD/MM")} a{" "}
                          {endDate.format("DD/MM")}
                        </Text>
                      </Card>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <Card bodyStyle={{ padding: isMobile ? "12px" : "24px" }}>
                        <Statistic
                          title="Número de Vendas"
                          value={vendas.length}
                          prefix={<ShoppingCartOutlined />}
                          valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <Card bodyStyle={{ padding: isMobile ? "12px" : "24px" }}>
                        <Statistic
                          title="Clientes Únicos"
                          value={calcularClientesUnicos()}
                          prefix={<UserOutlined />}
                          valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <Card bodyStyle={{ padding: isMobile ? "12px" : "24px" }}>
                        <Statistic
                          title="Valor Médio"
                          value={calcularValorMedioPorVenda()}
                          prefix={<BarChartOutlined />}
                          formatter={moneyFormatter}
                          valueStyle={{ fontSize: isMobile ? "18px" : "24px" }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Divider
                    orientation="left"
                    style={{ margin: isMobile ? "12px 0" : "24px 0" }}
                  >
                    Detalhamento
                  </Divider>

                  <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <>
                            <BarChartOutlined /> Totais por Dia
                          </>
                        }
                        style={{ height: "100%" }}
                        bodyStyle={{ padding: isMobile ? "8px" : "24px" }}
                      >
                        {dailyData.length > 0 ? (
                          <div className="responsive-table-container">
                            <Table
                              columns={dailyColumns}
                              dataSource={dailyData}
                              size={isMobile ? "small" : "middle"}
                              pagination={{ pageSize: isMobile ? 3 : 5 }}
                              scroll={{ x: isMobile ? 300 : undefined }}
                            />
                          </div>
                        ) : (
                          <Empty description="Sem dados para o período selecionado" />
                        )}
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <>
                            <DollarOutlined /> Resumo por Cliente
                          </>
                        }
                        style={{ height: "100%" }}
                        bodyStyle={{ padding: isMobile ? "8px" : "24px" }}
                      >
                        {vendas.length > 0 ? (
                          <div
                            style={{
                              maxHeight: isMobile ? "200px" : "300px",
                              overflow: "auto",
                            }}
                          >
                            {Array.from(
                              new Set(vendas.map((v) => v.nome_cliente))
                            ).map((cliente) => {
                              const vendasCliente = vendas.filter(
                                (v) => v.nome_cliente === cliente
                              );
                              const totalCliente = vendasCliente.reduce(
                                (acc, v) =>
                                  acc + calcularTotal(v.total, v.desconto),
                                0
                              );
                              return (
                                <div
                                  key={cliente}
                                  style={{
                                    marginBottom: "10px",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "4px",
                                  }}
                                >
                                  <Space
                                    size={isMobile ? "small" : "middle"}
                                    wrap
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        maxWidth: isMobile ? "100%" : "auto",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <UserOutlined
                                        style={{ marginRight: "4px" }}
                                      />
                                      <Text
                                        strong
                                        style={{
                                          maxWidth: isMobile
                                            ? "120px"
                                            : "200px",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {cliente}
                                      </Text>
                                    </div>
                                    <Tag color="blue">
                                      {vendasCliente.length} venda(s)
                                    </Tag>
                                    <Text>{toMoneyFormat(totalCliente)}</Text>
                                  </Space>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <Empty description="Sem dados para o período selecionado" />
                        )}
                      </Card>
                    </Col>
                  </Row>

                  <Divider
                    orientation="left"
                    style={{ margin: isMobile ? "12px 0" : "24px 0" }}
                  >
                    Lista de Vendas
                  </Divider>

                  <div className="responsive-table-container">
                    <Table
                      columns={columnsVendas}
                      dataSource={vendas.map((venda) => ({
                        ...venda,
                        key: venda.id,
                      }))}
                      pagination={{
                        pageSize: isMobile ? 5 : 50,
                        size: isMobile ? "small" : "default",
                      }}
                      bordered
                      size={isMobile ? "small" : "middle"}
                      locale={{
                        emptyText: "Sem dados para o período selecionado",
                      }}
                      scroll={{ x: isMobile ? 400 : undefined }}
                    />
                  </div>
                </>
              )}
            </Space>
          </Card>
        </Content>
      </Layout>
      {/* Modal de Solicitação de Exclusão */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <ExclamationCircleOutlined
              style={{ color: "#ff4d4f", marginRight: 8 }}
            />
            <span>Solicitar Exclusão de Venda</span>
          </div>
        }
        open={exclusionModalVisible}
        onCancel={() => setExclusionModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setExclusionModalVisible(false)}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={exclusionLoading}
            onClick={handleExclusionRequest}
          >
            Solicitar Exclusão
          </Button>,
        ]}
        destroyOnClose
      >
        <Form form={exclusionForm} layout="vertical" requiredMark="optional">
          {selectedVenda && (
            <div style={{ marginBottom: 16 }}>
              <Paragraph>
                <Text strong>Venda ID:</Text> {selectedVenda.id}
              </Paragraph>
              <Paragraph>
                <Text strong>Cliente:</Text> {selectedVenda.nome_cliente}
              </Paragraph>
              <Paragraph>
                <Text strong>Valor:</Text>{" "}
                {toMoneyFormat(
                  calcularTotal(selectedVenda.total, selectedVenda.desconto)
                )}
              </Paragraph>
              <Paragraph>
                <Text strong>Data:</Text>{" "}
                {toDateFormat(selectedVenda.createdAt, true)}
              </Paragraph>
            </div>
          )}

          <Paragraph type="secondary">
            A solicitação de exclusão será enviada para aprovação do
            administrador. Por favor, informe detalhadamente o motivo da
            exclusão.
          </Paragraph>

          <Form.Item
            name="motivo"
            label="Motivo da Exclusão"
            rules={[
              {
                required: true,
                message: "Por favor, informe o motivo da exclusão",
              },
              { min: 10, message: "O motivo deve ter no mínimo 10 caracteres" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Descreva o motivo da exclusão..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <ExclamationCircleOutlined
              style={{ color: "#1890ff", marginRight: 8 }}
            />
            <span>Revisar Solicitação de Exclusão</span>
          </div>
        }
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={reviewForm} layout="vertical" requiredMark="optional">
          {selectedVenda && (
            <div style={{ marginBottom: 16 }}>
              <Paragraph>
                <Text strong>Venda ID:</Text> {selectedVenda.id}
              </Paragraph>
              <Paragraph>
                <Text strong>Cliente:</Text> {selectedVenda.nome_cliente}
              </Paragraph>
              <Paragraph>
                <Text strong>Valor:</Text>{" "}
                {toMoneyFormat(
                  calcularTotal(selectedVenda.total, selectedVenda.desconto)
                )}
              </Paragraph>
              <Paragraph>
                <Text strong>Data:</Text>{" "}
                {toDateFormat(selectedVenda.createdAt, true)}
              </Paragraph>
              <Paragraph>
                <Text strong>Motivo da solicitação:</Text>{" "}
                {selectedVenda.exclusionReason}
              </Paragraph>
              <Paragraph>
                <Text strong>Solicitado por:</Text>{" "}
                {selectedVenda.exclusionRequestedByUser?.name || "Usuário"}
              </Paragraph>
              <Paragraph>
                <Text strong>Data da solicitação:</Text>{" "}
                {selectedVenda.exclusionRequestedAt
                  ? toDateFormat(selectedVenda.exclusionRequestedAt, true)
                  : "Não disponível"}
              </Paragraph>
            </div>
          )}

          <Divider />

          <Form.Item
            name="observacoes"
            label="Observações (opcional para aprovação, obrigatório para rejeição)"
            rules={[
              {
                required: false,
                message: "Por favor, informe o motivo da rejeição",
              },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Adicione observações ou motivo da rejeição..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Row gutter={16} justify="end">
            <Col>
              <Button onClick={() => setReviewModalVisible(false)}>
                Cancelar
              </Button>
            </Col>
            <Col>
              <Popconfirm
                title="Rejeitar solicitação"
                description="Tem certeza que deseja rejeitar esta solicitação?"
                onConfirm={handleRejectExclusion}
                okText="Sim"
                cancelText="Não"
                okButtonProps={{ danger: true }}
              >
                <Button danger loading={reviewLoading}>
                  Rejeitar
                </Button>
              </Popconfirm>
            </Col>
            <Col>
              <Popconfirm
                title="Aprovar exclusão"
                description="Tem certeza que deseja aprovar a exclusão desta venda?"
                onConfirm={handleApproveExclusion}
                okText="Sim"
                cancelText="Não"
              >
                <Button type="primary" loading={reviewLoading}>
                  Aprovar
                </Button>
              </Popconfirm>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Drawer para filtros em dispositivos móveis */}
      <DateFilterDrawer />

      {/* CSS para responsividade adicional */}
      <style jsx global>{`
        .responsive-table-container {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .date-range-dropdown {
          max-width: 90vw;
        }

        @media (max-width: 767px) {
          .ant-card-head-title {
            font-size: 14px;
          }

          .ant-table {
            font-size: 12px;
          }

          .ant-statistic-title {
            font-size: 12px;
            margin-bottom: 4px;
          }

          .ant-divider-inner-text {
            font-size: 14px;
          }

          .ant-card-body {
            padding: 12px !important;
          }

          .ant-picker-panels {
            flex-direction: column;
          }
        }
      `}</style>
    </ConfigProvider>
  );
}

export default Vendas;
