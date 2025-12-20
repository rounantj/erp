import React, { useEffect, useState } from "react";
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Typography,
  Space,
  Card,
  Divider,
  Row,
  Col,
  Statistic,
  Badge,
  Avatar,
  Button,
  Tooltip,
  notification,
  Result,
} from "antd";
import {
  ShoppingCartOutlined,
  CalendarOutlined,
  UserOutlined,
  CreditCardOutlined,
  PrinterOutlined,
  DollarOutlined,
  FileTextOutlined,
  CloseOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import jsPDF from "jspdf";

const { Title, Text } = Typography;

// Componente do gerador de cupom integrado
const useCupomGenerator = () => {
  const [previewVisible, setPreviewVisible] = useState(false);

  const gerarCupom = async (saleData, showPreview = true) => {
    if (!saleData) {
      notification.error({
        message: "Erro",
        description: "Dados da venda não encontrados!",
      });
      return null;
    }

    try {
      // Configurações da empresa
      const empresaConfig = {
        nome: "FOFA PAPELARIA",
        endereco: "RUA ORLINDO BORGES - BARRA DO SAHY",
        cidade: "ARACRUZ - ES",
        cnpj: "CNPJ: 54.007.957/0001-99",
        ie: "IE: 084231440",
        im: "IM: ISENTO",
        uf: "UF: ES",
      };

      // Função auxiliar para formatação de dinheiro
      const money = (valor) =>
        valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

      // Configuração do PDF
      const doc = new jsPDF({
        unit: "mm",
        format: [80, 300],
      });

      const fontePadrao = "courier";
      doc.setFont(fontePadrao, "normal");

      const leftMargin = 5;
      const width = 70;
      const lineHeight = 3.5;

      // Dados do cupom
      const dataHoraVenda = dayjs(saleData.createdAt).format(
        "DD/MM/YYYY HH:mm:ss"
      );
      const cupomInfo = {
        dataHora: dataHoraVenda,
        ccf: `CCF: ${String(saleData.id).padStart(6, "0")}`,
        coo: `COO: ${String(saleData.id).padStart(7, "0")}`,
      };

      // Funções auxiliares para formatação do PDF
      const centerText = (text, y, fontSize = 8) => {
        doc.setFontSize(fontSize);
        const textWidth =
          (doc.getStringUnitWidth(text) * fontSize) / doc.internal.scaleFactor;
        const x = (width - textWidth) / 2 + leftMargin;
        doc.text(text, x, y);
        return y + lineHeight;
      };

      const addText = (text, y, fontSize = 8, alignment = "left") => {
        doc.setFontSize(fontSize);
        let x = leftMargin;

        if (alignment === "center") {
          const textWidth =
            (doc.getStringUnitWidth(text) * fontSize) /
            doc.internal.scaleFactor;
          x = (width - textWidth) / 2 + leftMargin;
        } else if (alignment === "right") {
          const textWidth =
            (doc.getStringUnitWidth(text) * fontSize) /
            doc.internal.scaleFactor;
          x = width - textWidth + leftMargin;
        }

        doc.text(text, x, y);
        return y + lineHeight;
      };

      const addSeparator = (y) => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.1);
        doc.line(leftMargin, y - 1, width + leftMargin, y - 1);
        return y + 1;
      };

      // Construção do cupom
      let y = 10;

      // Cabeçalho da empresa
      y = centerText(empresaConfig.nome, y, 10);
      y = centerText(empresaConfig.endereco, y);
      y = centerText(empresaConfig.cidade, y);
      y = centerText(empresaConfig.cnpj, y);
      y = centerText(`${empresaConfig.ie} ${empresaConfig.uf}`, y);
      y = centerText(empresaConfig.im, y);
      y = addSeparator(y + 2);

      // Informações do cupom
      y = addText(`DATA: ${cupomInfo.dataHora}`, y);
      y = addText(`${cupomInfo.ccf}`, y);
      y = addText(`${cupomInfo.coo}`, y);
      y = addSeparator(y + 2);

      // Tipo de documento
      y = centerText("DOCUMENTO NÃO FISCAL", y, 9);
      y = addSeparator(y + 2);

      // Cabeçalho dos produtos
      doc.setFontSize(7);
      y = addText("ITEM CÓDIGO DESCRIÇÃO", y, 7);
      y = addText("QTD UN.  VL_UNIT(R$)   VL_ITEM(R$)", y, 7);
      y = addSeparator(y);

      // Lista de produtos
      (saleData.produtos || []).forEach((item, index) => {
        doc.setFontSize(7);

        // Linha do produto
        y = addText(
          `${(index + 1).toString().padStart(3, "0")} ${(item.id || 0)
            .toString()
            .padStart(6, "0")} ${(item.descricao || "")
            .toUpperCase()
            .substring(0, 30)}`,
          y,
          8
        );

        // Linha de quantidade e valores
        const unitValue = money(item.valorUnitario || 0);
        const totalValue = money((item.valorUnitario || 0) * (item.quantidade || 0));
        const qtdText = `${item.quantidade || 0} UN x ${unitValue}`;
        const itemTotal = `= ${totalValue}`;

        const qtdWidth =
          (doc.getStringUnitWidth(qtdText) * 7) / doc.internal.scaleFactor;
        const totalWidth =
          (doc.getStringUnitWidth(itemTotal) * 7) / doc.internal.scaleFactor;

        doc.text(qtdText, leftMargin, y);
        doc.text(itemTotal, width - totalWidth + leftMargin, y);

        y += lineHeight;
      });

      y = addSeparator(y + 1);

      // Total da venda
      doc.setFontSize(9);
      y = addText(`TOTAL R$ ${money(saleData.total || 0)}`, y + 1, 10, "right");

      // Informações de pagamento
      if (saleData.metodoPagamento) {
        const pagamentoTexto = saleData.metodoPagamento.toUpperCase();
        y = addText(
          `${pagamentoTexto} - ${money(saleData.total || 0)}`,
          y,
          8,
          "right"
        );
      }

      // Troco (se houver)
      if (saleData.troco && saleData.troco > 0) {
        y = addText(
          `VALOR RECEBIDO - ${money(saleData.valorRecebido || saleData.total)}`,
          y,
          8,
          "right"
        );
        y = addText(`TROCO - ${money(saleData.troco)}`, y, 8, "right");
      }

      y = addSeparator(y + 2);

      // Rodapé
      y = centerText("Volte Sempre!!", y + 1, 9);
      y = centerText("Agradecemos sua preferência", y, 8);
      y = centerText(dayjs().format("DD/MM/YYYY - HH:mm:ss"), y + 2, 7);
      y = centerText("==================", y + 5, 8);
      y = centerText("FOFA PAPELARIA", y, 8);
      y = centerText("==================", y, 8);

      // Configurar para impressão automática
      doc.autoPrint();

      // Download do PDF
      doc.save(`cupom_venda_${saleData.id}.pdf`);

      // Mostrar preview se solicitado
      if (showPreview) {
        setPreviewVisible(true);
      }

      // Notificação de sucesso
      notification.success({
        message: "Cupom gerado com sucesso!",
        description: `Venda #${saleData.id} - Total: R$ ${money(
          saleData.total || 0
        )}`,
        placement: "bottomRight",
        duration: 3,
      });

      return doc;
    } catch (error) {
      notification.error({
        message: "Erro ao gerar cupom",
        description: error.message || "Tente novamente.",
      });
      return null;
    }
  };

  return {
    gerarCupom,
    previewVisible,
    setPreviewVisible,
  };
};

// Modal de Preview do Cupom
const CupomPreviewModal = ({ visible, onClose }) => {
  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <PrinterOutlined style={{ marginRight: 8 }} />
          <span>Cupom Fiscal Gerado</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="ok" type="primary" onClick={onClose}>
          OK
        </Button>,
      ]}
    >
      <Result
        icon={<PrinterOutlined style={{ color: "#1890ff" }} />}
        title="Cupom enviado para impressão"
        subTitle="Se a impressão não começar automaticamente, verifique as configurações da impressora."
      />
    </Modal>
  );
};

const SaleDetailsModal = ({ visible, onClose, saleData }) => {
  const [loadingCupom, setLoadingCupom] = useState(false);
  const { gerarCupom, previewVisible, setPreviewVisible } = useCupomGenerator();

  useEffect(() => {
    console.log("saleData:", saleData);
  }, [saleData]);

  if (!saleData) return null;

  // Função para gerar cupom com loading
  const handleGerarCupom = async (comPreview = true) => {
    try {
      setLoadingCupom(true);
      await gerarCupom(saleData, comPreview);
    } catch (error) {
      notification.error({
        message: "Erro ao gerar cupom",
        description: error.message || "Tente novamente.",
      });
    } finally {
      setLoadingCupom(false);
    }
  };

  // Configuração das colunas da tabela de produtos
  const productColumns = [
    {
      title: "Produto",
      dataIndex: "descricao",
      key: "descricao",
      render: (text, record) => (
        <Space>
          <Avatar
            icon={<ShoppingCartOutlined />}
            style={{
              backgroundColor:
                record.categoria === "serviço" ? "#52c41a" : "#1890ff",
            }}
          />
          <div>
            <Text strong>{text || "Sem descrição"}</Text>
            <br />
            <Tag color={record.categoria === "serviço" ? "green" : "blue"}>
              {(record.categoria || "produto").toUpperCase()}
            </Tag>
          </div>
        </Space>
      ),
    },
    {
      title: "Quantidade",
      dataIndex: "quantidade",
      key: "quantidade",
      align: "center",
      render: (qty) => (
        <Badge count={qty} style={{ backgroundColor: "#52c41a" }} />
      ),
    },
    {
      title: "Valor Unitário",
      dataIndex: "valorUnitario",
      key: "valorUnitario",
      align: "right",
      render: (value) => (
        <Text strong style={{ color: "#1890ff" }}>
          R$ {(value || 0).toFixed(2)}
        </Text>
      ),
    },
    {
      title: "Desconto",
      dataIndex: "desconto",
      key: "desconto",
      align: "right",
      render: (desconto) => (
        <Text style={{ color: (desconto || 0) > 0 ? "#ff4d4f" : "#8c8c8c" }}>
          {(desconto || 0) > 0 ? `-R$ ${(desconto || 0).toFixed(2)}` : "Sem desconto"}
        </Text>
      ),
    },
    {
      title: "Subtotal",
      key: "subtotal",
      align: "right",
      render: (_, record) => {
        const subtotal =
          (record.quantidade || 0) * (record.valorUnitario || 0) - (record.desconto || 0);
        return (
          <Text strong style={{ fontSize: "16px", color: "#52c41a" }}>
            R$ {subtotal.toFixed(2)}
          </Text>
        );
      },
    },
  ];

  // Função para obter cor do método de pagamento
  const getPaymentMethodColor = (method) => {
    const colors = {
      pix: "#52c41a",
      cartao: "#1890ff",
      dinheiro: "#faad14",
      boleto: "#722ed1",
    };
    return colors[method] || "#8c8c8c";
  };

  // Função para obter ícone do método de pagamento
  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "pix":
        return "💳";
      case "cartao":
        return "💳";
      case "dinheiro":
        return "💵";
      case "boleto":
        return "📄";
      default:
        return "💰";
    }
  };

  const closeModal = () => {
    onClose(false);
  };

  return (
    <>
      <Modal
        title={null}
        open={visible}
        onCancel={closeModal}
        footer={null}
        width={900}
        centered
        closeIcon={<CloseOutlined style={{ fontSize: "18px" }} />}
        styles={{
          body: { padding: 0 },
          header: { display: "none" },
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "24px",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <Row align="middle" justify="space-between">
            <Col>
              <Space size="large">
                <Avatar
                  size={64}
                  icon={<ShoppingCartOutlined />}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    border: "2px solid white",
                  }}
                />
                <div>
                  <Title level={3} style={{ color: "white", margin: 0 }}>
                    Venda #{saleData.id}
                  </Title>
                  <Text
                    style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px" }}
                  >
                    {saleData.nome_cliente}
                  </Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Statistic
                title={
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>
                    Total da Venda
                  </span>
                }
                value={saleData.total}
                precision={2}
                prefix="R$"
                valueStyle={{
                  color: "white",
                  fontSize: "32px",
                  fontWeight: "bold",
                }}
              />
            </Col>
          </Row>
        </div>

        <div style={{ padding: "24px" }}>
          {/* Informações Gerais */}
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: "#1890ff" }} />
                <span>Informações da Venda</span>
              </Space>
            }
            style={{ marginBottom: "24px" }}
            headStyle={{ backgroundColor: "#f0f2f5" }}
          >
            <Row gutter={[24, 16]}>
              <Col span={8}>
                <Statistic
                  title="Data da Venda"
                  value={dayjs(saleData.createdAt).format("DD/MM/YYYY HH:mm")}
                  prefix={<CalendarOutlined style={{ color: "#52c41a" }} />}
                  valueStyle={{ fontSize: "14px" }}
                />
              </Col>
              <Col span={8}>
                <div>
                  <Text type="secondary">Método de Pagamento</Text>
                  <br />
                  <Tag
                    color={getPaymentMethodColor(saleData.metodoPagamento)}
                    style={{
                      fontSize: "14px",
                      padding: "4px 12px",
                      marginTop: "4px",
                    }}
                  >
                    {getPaymentMethodIcon(saleData.metodoPagamento)}{" "}
                    {saleData.metodoPagamento.toUpperCase()}
                  </Tag>
                </div>
              </Col>
              <Col span={8}>
                <Statistic
                  title="Desconto Total"
                  value={saleData.desconto}
                  precision={2}
                  prefix="R$"
                  valueStyle={{
                    color: saleData.desconto > 0 ? "#ff4d4f" : "#8c8c8c",
                    fontSize: "14px",
                  }}
                />
              </Col>
            </Row>
          </Card>

          {/* Produtos */}
          <Card
            title={
              <Space>
                <span>Produtos ({(saleData.produtos || []).length} itens)</span>
              </Space>
            }
            headStyle={{ backgroundColor: "#f0f2f5" }}
          >
            <Table
              columns={productColumns}
              dataSource={(saleData.produtos || []).map((produto, index) => ({
                ...produto,
                key: index,
              }))}
              pagination={false}
              size="middle"
              style={{ marginBottom: "16px" }}
            />

            <Divider />

            {/* Resumo Financeiro */}
            <Row justify="end">
              <Col span={8}>
                <div style={{ textAlign: "right" }}>
                  <Space
                    direction="vertical"
                    size="small"
                    style={{ width: "100%" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>Subtotal:</Text>
                      <Text>
                        R${" "}
                        {(saleData.produtos || [])
                          .reduce(
                            (acc, prod) =>
                              acc + (prod.quantidade || 0) * (prod.valorUnitario || 0),
                            0
                          )
                          .toFixed(2)}
                      </Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>Desconto:</Text>
                      <Text style={{ color: "#ff4d4f" }}>
                        -R${" "}
                        {(
                          (saleData.desconto || 0) +
                          (saleData.produtos || []).reduce(
                            (acc, prod) => acc + (prod.desconto || 0),
                            0
                          )
                        ).toFixed(2)}
                      </Text>
                    </div>
                    <Divider style={{ margin: "8px 0" }} />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Title level={4} style={{ margin: 0 }}>
                        Total:
                      </Title>
                      <Title level={4} style={{ margin: 0, color: "#52c41a" }}>
                        R$ {(saleData.total || 0).toFixed(2)}
                      </Title>
                    </div>
                  </Space>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Rodapé com ações */}
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Space size="middle">
              <Tooltip title="Gerar e imprimir cupom fiscal">
                <Button
                  type="primary"
                  icon={<PrinterOutlined />}
                  size="large"
                  loading={loadingCupom}
                  onClick={() => handleGerarCupom(true)}
                >
                  Imprimir Cupom
                </Button>
              </Tooltip>

              <Tooltip title="Baixar cupom em PDF">
                <Button
                  icon={<DownloadOutlined />}
                  size="large"
                  loading={loadingCupom}
                  onClick={() => handleGerarCupom(false)}
                >
                  Baixar PDF
                </Button>
              </Tooltip>

              <Button onClick={closeModal} size="large">
                Fechar
              </Button>
            </Space>
          </div>
        </div>
      </Modal>

      {/* Modal de Preview do Cupom */}
      <CupomPreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
      />
    </>
  );
};

export default SaleDetailsModal;
