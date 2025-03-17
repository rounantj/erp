import { getSells } from "helpers/api-integrator";
import React, { useState, useEffect, useContext } from "react";
import {
  Layout,
  Table,
  Typography,
  Card,
  Statistic,
  Row,
  Col,
  Divider,
  Space,
  Empty,
  Spin,
  notification,
  Button,
  Modal,
  Form,
  Input,
  Tag,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  DollarOutlined,
  UserOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { UserContext } from "context/UserContext";
import { getResumoVendas } from "helpers/caixa.adapter";
import { getCaixaEmAberto } from "helpers/caixa.adapter";
import { calcularTotal } from "./Vendas";
import { toMoneyFormat } from "helpers/formatters";
import { toDateFormat } from "helpers/formatters";
import { solicitaExclusaoVenda } from "helpers/api-integrator";
import {
  aprovaExclusaoVenda,
  rejeitaExclusaoVenda,
} from "helpers/api-integrator";

const { Content } = Layout;
const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const requestVendaExclusion = async (vendaId, motivo) => {
  return await solicitaExclusaoVenda(vendaId, motivo);
};

const VendasDoDia = () => {
  // Estados necessários
  const [vendas, setVendas] = useState([]);
  const { user } = useContext(UserContext);
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [caixa, setCaixa] = useState();
  const [horaAbertura, setHoraAbertura] = useState(null);
  const [valorAbertura, setValorAbertura] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [resumoVendas, setResumoVendas] = useState({
    dinheiro: 0,
    pix: 0,
    credito: 0,
    debito: 0,
    total: 0,
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Estados para a exclusão
  const [exclusionModalVisible, setExclusionModalVisible] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState(null);
  const [exclusionLoading, setExclusionLoading] = useState(false);
  const [exclusionForm] = Form.useForm();

  useEffect(() => {
    console.log({ user });
  }, [user]);
  // 1. Importe as funções da API

  // 2. Adicione estados para o modal de revisão
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewForm] = Form.useForm();

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

  // Monitora o tamanho da tela para responsividade
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Buscar vendas do dia atual
  const getVendas = async () => {
    try {
      setLoadingVendas(true);
      const formattedStart = moment().format("YYYY-MM-DD 00:00:00");
      const formattedEnd = moment().format("YYYY-MM-DD 23:59:59");
      const items = await getSells(formattedStart, formattedEnd);

      if (items.success) {
        // Simulando algumas vendas com solicitação de exclusão
        const vendas = items.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setVendas(vendas);
      }
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    } finally {
      setLoadingVendas(false);
    }
  };

  // Buscar resumo do caixa
  const getResumoCaixa = async (caixaID) => {
    try {
      setLoading(true);
      const result = await getResumoVendas(caixaID);
      if (result.data) {
        setResumoVendas(result.data);
      } else {
        notification.error({
          message: "Erro",
          description: "Problema ao buscar resumo de vendas!",
        });
      }
    } catch (error) {
      notification.error({
        message: "Erro",
        description:
          "Não foi possível obter o resumo do caixa: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar se existe caixa aberto
  const caixaEmAberto = async () => {
    try {
      setLoading(true);
      const resultCx = await getCaixaEmAberto();

      if (resultCx.data.length === 0) {
        notification.warning({
          message: "Atenção!",
          description: "Abra um caixa para começar a vender.",
        });
        return; // Não há caixa aberto
      }

      if (resultCx.data.length > 1) {
        notification.warning({
          message: "Atenção!",
          description: "Existe um caixa aberto de um dia anterior.",
        });
      }

      const cx = resultCx.data.pop();
      setCaixa(cx);
      setCaixaAberto(true);

      setHoraAbertura(moment(cx.createdAt).format("DD/MM/YYYY HH:mm"));
      setValorAbertura(cx.saldoInicial);
      await getResumoCaixa(cx.id);
      await getVendas();
    } catch (error) {
      notification.error({
        message: "Erro",
        description: "Não foi possível verificar o caixa: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    caixaEmAberto();
    getVendas();
  }, []);

  // Abrir modal de solicitação de exclusão
  const openExclusionModal = (venda) => {
    setSelectedVenda(venda);
    setExclusionModalVisible(true);
    exclusionForm.resetFields();
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

  // Configuração de colunas para tabela de vendas
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

  // Renderizar o componente
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        {/* Conteúdo principal */}
        {caixaAberto ? (
          <>
            {/* Interface Mobile */}
            {isMobile ? (
              <Content style={{ padding: "10px", background: "#f0f2f5" }}>
                {resumoVendas.total > 0 && (
                  <Card
                    title={
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <DollarOutlined
                          style={{ marginRight: 8, color: "#1890ff" }}
                        />
                        <span>Resumo de Vendas do Dia</span>
                      </div>
                    }
                    style={{ marginBottom: 16 }}
                    bodyStyle={{ padding: "12px" }}
                  >
                    <Row gutter={[8, 16]}>
                      <Col span={12}>
                        <Statistic
                          title="Total em Dinheiro"
                          value={resumoVendas.dinheiro}
                          precision={2}
                          valueStyle={{ color: "#3f8600", fontSize: 16 }}
                          prefix="R$"
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Total em PIX"
                          value={resumoVendas.pix}
                          precision={2}
                          valueStyle={{ color: "#1890ff", fontSize: 16 }}
                          prefix="R$"
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Total em Crédito"
                          value={resumoVendas.credito}
                          precision={2}
                          valueStyle={{ color: "#722ed1", fontSize: 16 }}
                          prefix="R$"
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Total em Débito"
                          value={resumoVendas.debito}
                          precision={2}
                          valueStyle={{ color: "#fa8c16", fontSize: 16 }}
                          prefix="R$"
                        />
                      </Col>
                      <Col span={24}>
                        <Divider style={{ margin: "12px 0" }} />
                        <Statistic
                          title="Total Geral"
                          value={resumoVendas.total}
                          precision={2}
                          valueStyle={{
                            color: "black",
                            fontWeight: "bold",
                            fontSize: "20px",
                          }}
                          prefix="R$"
                        />
                      </Col>
                    </Row>
                  </Card>
                )}

                <Card
                  title={
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <DollarOutlined
                        style={{ marginRight: 8, color: "#1890ff" }}
                      />
                      <span>Vendas do Dia</span>
                    </div>
                  }
                  bodyStyle={{ padding: "12px" }}
                >
                  <Table
                    columns={columnsVendas.map((col) => ({
                      ...col,
                      ellipsis: true,
                    }))}
                    dataSource={vendas.map((venda) => ({
                      ...venda,
                      key: venda.id,
                    }))}
                    pagination={{ pageSize: 5, size: "small" }}
                    bordered
                    loading={loadingVendas}
                    size="small"
                    scroll={{ x: "max-content" }}
                    locale={{
                      emptyText: "Sem dados para o período selecionado",
                    }}
                  />
                </Card>
              </Content>
            ) : (
              /* Interface Desktop */
              <Content style={{ padding: "20px", background: "#f0f2f5" }}>
                <Row gutter={[16, 16]}>
                  {resumoVendas.total > 0 && (
                    <Col span={24}>
                      <Card
                        title={
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <DollarOutlined
                              style={{ marginRight: 8, color: "#1890ff" }}
                            />
                            <span>Resumo de Vendas do Dia</span>
                          </div>
                        }
                      >
                        <Row gutter={16}>
                          <Col xs={24} sm={12} md={4}>
                            <Statistic
                              style={{ zoom: "90%" }}
                              title="Total em Dinheiro"
                              value={resumoVendas.dinheiro}
                              precision={2}
                              valueStyle={{ color: "#3f8600" }}
                              prefix="R$"
                            />
                          </Col>
                          <Col xs={24} sm={12} md={4}>
                            <Statistic
                              style={{ zoom: "90%" }}
                              title="Total em PIX"
                              value={resumoVendas.pix}
                              precision={2}
                              valueStyle={{ color: "#1890ff" }}
                              prefix="R$"
                            />
                          </Col>
                          <Col xs={24} sm={12} md={4}>
                            <Statistic
                              style={{ zoom: "90%" }}
                              title="Total em Crédito"
                              value={resumoVendas.credito}
                              precision={2}
                              valueStyle={{ color: "#722ed1" }}
                              prefix="R$"
                            />
                          </Col>
                          <Col xs={24} sm={12} md={4}>
                            <Statistic
                              style={{ zoom: "90%" }}
                              title="Total em Débito"
                              value={resumoVendas.debito}
                              precision={2}
                              valueStyle={{ color: "#fa8c16" }}
                              prefix="R$"
                            />
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Statistic
                              style={{ float: "right" }}
                              title="Total Geral"
                              value={resumoVendas.total}
                              precision={2}
                              valueStyle={{
                                color: "black",
                                fontWeight: "bold",
                                fontSize: "24px",
                              }}
                              prefix="R$"
                            />
                          </Col>
                        </Row>
                      </Card>
                    </Col>
                  )}
                </Row>
                <Row>
                  <Col span={24}>
                    <Card
                      title={
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <DollarOutlined
                            style={{ marginRight: 8, color: "#1890ff" }}
                          />
                          <span>Vendas do Dia</span>
                        </div>
                      }
                    >
                      <Table
                        columns={columnsVendas}
                        dataSource={vendas.map((venda) => ({
                          ...venda,
                          key: venda.id,
                        }))}
                        pagination={{ pageSize: 50 }}
                        bordered
                        loading={loadingVendas}
                        size="middle"
                        locale={{
                          emptyText: "Sem dados para o período selecionado",
                        }}
                      />
                    </Card>
                  </Col>
                </Row>
              </Content>
            )}
          </>
        ) : (
          // Quando não há caixa aberto
          <Content
            style={{
              padding: "20px",
              background: "#f0f2f5",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Spin spinning={loading}>
              <Empty
                description="Abra o caixa para visualizar as vendas do dia"
                style={{ margin: "40px 0" }}
              />
            </Spin>
          </Content>
        )}
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
    </Layout>
  );
};

export default VendasDoDia;
