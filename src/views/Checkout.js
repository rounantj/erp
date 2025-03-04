import { getProducts } from "helpers/api-integrator";
import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Layout,
  Button,
  Table,
  Input,
  Select,
  List,
  notification,
  Modal,
  Card,
  Typography,
  Statistic,
  Row,
  Col,
  Divider,
  Badge,
  Space,
  Empty,
  Tag,
  Drawer,
  Form,
  InputNumber,
  Tooltip,
  Result,
} from "antd";
import {
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
  BarcodeOutlined,
  PrinterOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  LoadingOutlined,
  PlusOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import { openCaixa } from "helpers/caixa.adapter";
import { UserContext } from "context/UserContext";
import { getCaixaEmAberto } from "helpers/caixa.adapter";
import { vendaFinaliza } from "helpers/caixa.adapter";
import { getResumoVendas } from "helpers/caixa.adapter";
import { fechaCaixa } from "helpers/caixa.adapter";
import { columnsVendas } from "./Vendas";
import { getSells } from "helpers/api-integrator";
import moment from "moment";

const { Header, Content, Sider } = Layout;
const { Option } = Select;
const { confirm } = Modal;
const { Text, Title } = Typography;
const { Search } = Input;

const Caixa = () => {
  const [vendas, setVendas] = useState([]);
  const { user } = useContext(UserContext);
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [caixa, setCaixa] = useState();
  const [busca, setBusca] = useState("");
  const [venda, setVenda] = useState([]);
  const [pagamento, setPagamento] = useState(null);
  const [valorAbertura, setValorAbertura] = useState(0);
  const [horaAbertura, setHoraAbertura] = useState(null);
  const [modalFechamento, setModalFechamento] = useState(false);
  const [valorFechamento, setValorFechamento] = useState(0);
  const [products, setProducts] = useState([]);
  const [historicoVendas, setHistoricoVendas] = useState([]);
  const [resumoVendas, setResumoVendas] = useState({
    dinheiro: 0,
    pix: 0,
    credito: 0,
    debito: 0,
    total: 0,
  });
  // New states
  const [loading, setLoading] = useState(false);
  const [quickAddDrawer, setQuickAddDrawer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [printPreviewModal, setPrintPreviewModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [totalVendaAtual, setTotalVendaAtual] = useState(0);
  const [troco, setTroco] = useState(0);
  const [valorRecebido, setValorRecebido] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loadingVendas, setLoadingVendas] = useState(false);

  const getVendas = async () => {
    try {
      setLoadingVendas(true);
      const formattedStart = moment().format("YYYY-MM-DD 00:00:00");
      const formattedEnd = moment().format("YYYY-MM-DD 23:59:59");
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
      setLoadingVendas(false);
    }
  };
  // Refs
  const barcodeInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // Focus on barcode input field when component mounts
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [caixaAberto, quickAddDrawer]);

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

  const money = (valor) =>
    valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  useEffect(() => {
    // Calculate total whenever venda changes
    const total = venda.reduce((acc, item) => acc + item.valor * item.qtd, 0);
    setTotalVendaAtual(total);
  }, [venda]);

  const removeItem = (item) => {
    confirm({
      title: (
        <div>
          <p>
            Deseja realmente remover o item:{" "}
            <strong>{item.descricao.toUpperCase()}</strong>?
          </p>
        </div>
      ),
      icon: <ExclamationCircleOutlined />,
      onOk() {
        setVenda((prev) => prev.filter((p) => p.id !== item.id));
      },
    });
  };

  const gerarCupom = async () => {
    // Verificar se foi selecionado um método de pagamento
    if (!pagamento) {
      notification.error({
        message: "Erro",
        description: "Selecione um método de pagamento!",
      });
      return;
    }

    // Verificar se há produtos na venda
    if (venda.length === 0) {
      notification.error({
        message: "Erro",
        description: "Adicione produtos à venda!",
      });
      return;
    }

    try {
      setLoading(true);

      const doc = new jsPDF({
        unit: "mm",
        format: [80, 300], // Standard receipt width, dynamic height
      });

      // Estilos e Fontes
      const fontePadrao = "courier";
      doc.setFont(fontePadrao, "normal");

      // Document margins and dimensions
      const leftMargin = 5;
      const width = 70;
      const lineHeight = 3.5;

      // Informações da Empresa
      const empresa = {
        nome: "FOFA PAPELARIA",
        endereco: "RUA ORLINDO BORGES - BARRA DO SAHY",
        cidade: "ARACRUZ - ES",
        cnpj: "CNPJ: 63.358.000/0001-49",
        ie: "IE: 66994360-NO",
        im: "IM: ISENTO",
        uf: "UF: ES",
      };

      // Informações do Cupom
      const dataHoraAtual = dayjs().format("DD/MM/YYYY HH:mm:ss");
      const cupom = {
        dataHora: dataHoraAtual,
        ccf: `CCF: ${String(historicoVendas.length + 1).padStart(6, "0")}`,
        coo: `COO: ${String(historicoVendas.length + 1).padStart(7, "0")}`,
      };

      // Totais e Pagamento
      const totalVendas = venda.reduce(
        (acc, item) => acc + item.valor * item.qtd,
        0
      );
      const totais = {
        total: `TOTAL R$ ${money(totalVendas)}`,
        pagamento: `${pagamento.toUpperCase()} - ${money(totalVendas)}`,
      };

      // Helper function to center text
      const centerText = (text, y, fontSize = 8) => {
        doc.setFontSize(fontSize);
        const textWidth =
          (doc.getStringUnitWidth(text) * fontSize) / doc.internal.scaleFactor;
        const x = (width - textWidth) / 2 + leftMargin;
        doc.text(text, x, y);
        return y + lineHeight;
      };

      // Helper function to add text with alignment
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

      // Helper function to add a separator line
      const addSeparator = (y) => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.1);
        doc.line(leftMargin, y - 1, width + leftMargin, y - 1);
        return y + 1;
      };

      let y = 10;

      // Header
      y = centerText(empresa.nome, y, 10);
      y = centerText(empresa.endereco, y);
      y = centerText(empresa.cidade, y);
      y = centerText(empresa.cnpj, y);
      y = centerText(`${empresa.ie} ${empresa.uf}`, y);
      y = centerText(empresa.im, y);

      y = addSeparator(y + 2);

      // Receipt info
      y = addText(`DATA: ${cupom.dataHora}`, y);
      y = addText(`${cupom.ccf}`, y);
      y = addText(`${cupom.coo}`, y);

      y = addSeparator(y + 2);

      // Title
      y = centerText("DOCUMENTO NÃO FISCAL", y, 9);

      y = addSeparator(y + 2);

      // Header for items
      doc.setFontSize(7);
      y = addText("ITEM CÓDIGO DESCRIÇÃO", y, 7);
      y = addText("QTD UN.  VL_UNIT(R$)   VL_ITEM(R$)", y, 7);

      y = addSeparator(y);

      // Items
      venda.forEach((item, index) => {
        doc.setFontSize(7);
        y = addText(
          `${(index + 1).toString().padStart(3, "0")} ${item.id
            .toString()
            .padStart(6, "0")} ${item.descricao
            .toUpperCase()
            .substring(0, 30)}`,
          y,
          8
        );

        const unitValue = money(item.valor);
        const totalValue = money(item.valor * item.qtd);
        const qtdText = `${item.qtd} UN x ${unitValue}`;
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

      // Totals
      doc.setFontSize(9);
      y = addText(totais.total, y + 1, 10, "right");
      y = addText(totais.pagamento, y, 8, "right");

      if (pagamento === "dinheiro" && troco > 0) {
        y = addText(`VALOR RECEBIDO - ${money(valorRecebido)}`, y, 8, "right");
        y = addText(`TROCO - ${money(troco)}`, y, 8, "right");
      }

      y = addSeparator(y + 2);

      // Footer
      y = centerText("Volte Sempre!!", y + 1, 9);
      y = centerText("Agradecemos sua preferência", y, 8);
      y = centerText(dayjs().format("DD/MM/YYYY - HH:mm:ss"), y + 2, 7);

      // QR Code (optional)
      // If you want to add QR code here with an external library

      // Logo or blank space at the bottom
      y = centerText("==================", y + 5, 8);
      y = centerText("FOFA PAPELARIA", y, 8);
      y = centerText("==================", y, 8);

      // Auto print and save
      doc.autoPrint();
      doc.save("cupom_fiscal.pdf");
      setPrintPreviewModal(true);

      // Adicionar venda ao histórico
      const novaVenda = {
        createdAt: new Date(),
        updatedAt: new Date(),
        caixaId: caixa?.id,
        desconto: 0,
        produtos: venda.map((item) => {
          return {
            id: item.id,
            descricao: item.descricao,
            quantidade: item.qtd,
            desconto: 0,
          };
        }),
        metodoPagamento: pagamento,
        nome_cliente: "Cliente padrão",
        total: totalVendas,
        valorRecebido: valorRecebido || totalVendas,
        troco: troco || 0,
      };

      const result = await vendaFinaliza(novaVenda);

      setHistoricoVendas((prev) => [...prev, novaVenda]);
      await getResumoCaixa(caixa?.id);
      await getVendas();
      // Show success modal
      setSuccessModal(true);

      // Reset venda state
      setVenda([]);
      setPagamento(null);
      setValorRecebido(0);
      setTroco(0);
      setShowPaymentModal(false);
    } catch (error) {
      notification.error({
        message: "Erro ao finalizar venda",
        description: error.message || "Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const myColumns = [
    {
      title: "Código",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id) => <Text code>{id}</Text>,
    },
    {
      title: "Produto",
      dataIndex: "descricao",
      key: "descricao",
      render: (text) => <Text strong>{text.toUpperCase()}</Text>,
    },
    {
      title: "Preço",
      dataIndex: "valor",
      key: "valor",
      align: "right",
      width: 120,
      render: (valor) => <Text>R$ {money(valor)}</Text>,
    },
    {
      title: "Ações",
      key: "acoes",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Button
          onClick={() => {
            setSelectedProduct(record);
            setQuantity(1);
            setQuickAddDrawer(true);
          }}
          type="primary"
          icon={<PlusOutlined />}
        >
          Adicionar
        </Button>
      ),
    },
  ];

  const getProductsList = async () => {
    try {
      setLoading(true);
      const result = await getProducts();

      if (result.success) {
        result.data.forEach((element) => {
          if (!element["categoria"]) element["categoria"] = "";
          if (!element["ean"]) element["ean"] = "";
          if (!element["ncm"]) element["ncm"] = "";
          if (!element["valor"]) element["valor"] = 0;
          if (!element["descricao"]) element["descricao"] = "";
        });
        setProducts(result.data);
      } else {
        notification.error({
          message: "Erro",
          description: "Problema ao buscar produtos!",
        });
      }
    } catch (error) {
      notification.error({
        message: "Erro",
        description: "Não foi possível carregar os produtos: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

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

      setHoraAbertura(dayjs(cx.createdAt).format("DD/MM/YYYY HH:mm"));
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

  useEffect(() => {
    getProductsList();
    caixaEmAberto();
    getVendas();
  }, []);

  const abrirCaixa = async () => {
    console.log({ abrirCaixa: true });
    let valorAberturaTemp = 0;

    Modal.confirm({
      title: "Abrir Caixa",
      icon: <DollarOutlined style={{ color: "green" }} />,
      content: (
        <div style={{ padding: "20px 0" }}>
          <p>Informe o valor inicial em caixa:</p>
          <InputNumber
            style={{ width: "100%" }}
            prefix="R$"
            placeholder="Valor inicial em caixa"
            onChange={(value) => (valorAberturaTemp = value || 0)}
            min={0}
            precision={2}
            step={10}
          />
        </div>
      ),
      onOk: async () => {
        try {
          setLoading(true);
          const userId = user?.user?.id || 1;
          const resultOpenCaixa = await openCaixa(userId, valorAberturaTemp);

          setCaixa(resultOpenCaixa.data);
          setCaixaAberto(true);
          setHoraAbertura(dayjs().format("DD/MM/YYYY HH:mm"));

          // Reiniciar os dados do caixa
          setHistoricoVendas([]);
          setResumoVendas({
            dinheiro: 0,
            pix: 0,
            credito: 0,
            debito: 0,
            total: 0,
          });

          notification.success({
            message: "Caixa aberto com sucesso!",
            description: `Valor inicial: R$ ${money(valorAberturaTemp)}`,
            icon: <CheckCircleOutlined style={{ color: "green" }} />,
          });

          // Focus on barcode input after opening caixa
          setTimeout(() => {
            if (barcodeInputRef.current) {
              barcodeInputRef.current.focus();
            }
          }, 500);
        } catch (error) {
          console.error("Erro ao abrir caixa:", error);
          notification.error({
            message: "Erro ao abrir caixa",
            description: error.message || "Tente novamente mais tarde.",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const fecharCaixa = () => {
    setModalFechamento(true);
  };

  const confirmarFechamento = async () => {
    try {
      setLoading(true);

      // Calcular apenas o valor total em dinheiro para comparar com o valor em caixa
      const totalDinheiro = resumoVendas.dinheiro;
      const diferenca = valorFechamento - (valorAbertura + totalDinheiro);

      const resultFechaCaixa = await fechaCaixa(
        caixa.id,
        user?.user?.id,
        valorFechamento,
        diferenca
      );

      setCaixaAberto(false);
      setVenda([]);
      setPagamento(null);
      setModalFechamento(false);

      notification.success({
        message: "Caixa fechado com sucesso!",
        description: `Diferença: R$ ${money(diferenca)}`,
        icon: <CheckCircleOutlined style={{ color: "green" }} />,
      });
    } catch (error) {
      notification.error({
        message: "Erro ao fechar o caixa",
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarProduto = (produto, qtd) => {
    setVenda((prev) => {
      const index = prev.findIndex((item) => item.id === produto.id);
      if (index >= 0) {
        const newVenda = [...prev];
        newVenda[index].qtd += qtd;
        return newVenda;
      } else {
        return [...prev, { ...produto, qtd }];
      }
    });

    // Notify user
    notification.success({
      message: "Produto adicionado",
      description: `${produto.descricao.toUpperCase()} (${qtd}x)`,
      placement: "bottomRight",
      duration: 2,
    });

    // Close drawer if open
    setQuickAddDrawer(false);

    // Focus back on barcode input
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 100);
  };

  // Handle barcode scan
  const handleBarcodeScan = (value) => {
    if (!value) return;

    // Find product by EAN (barcode) or by ID
    const product = products.find(
      (p) => p.ean === value || p.id.toString() === value
    );

    if (product) {
      adicionarProduto(product, 1);
      // Clear the input
      setBusca("");
    } else {
      notification.warning({
        message: "Produto não encontrado",
        description: `Código de barras: ${value}`,
        placement: "bottomRight",
      });
    }
  };

  // Handler for payment process
  const handleFinalizarVenda = () => {
    if (venda.length === 0) {
      notification.warning({
        message: "Atenção",
        description: "Adicione produtos à venda primeiro!",
      });
      return;
    }

    setShowPaymentModal(true);
  };

  // Handle payment process
  const handlePayment = (metodoPagamento) => {
    setPagamento(metodoPagamento);

    // If payment method is cash, we need to calculate change
    if (metodoPagamento === "dinheiro") {
      setValorRecebido(totalVendaAtual);
    } else {
      // For other payment methods, proceed to generate receipt
      gerarCupom();
    }
  };

  // Calculate change when valor recebido changes
  useEffect(() => {
    if (pagamento === "dinheiro") {
      setTroco(Math.max(0, valorRecebido - totalVendaAtual));
    }
  }, [valorRecebido, totalVendaAtual, pagamento]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          padding: "0 20px",
          background: "#001529",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
          }}
        >
          {caixaAberto ? (
            <>
              <Badge status="success" />
              <span style={{ marginLeft: 10 }}>
                Caixa {caixa?.id} • Aberto em {horaAbertura}
              </span>
            </>
          ) : (
            <>
              <Badge status="error" />
              <span style={{ marginLeft: 10 }}>Caixa Fechado</span>
            </>
          )}
        </div>
        <div>
          {caixaAberto ? (
            <Tooltip title="Fechar Caixa">
              <Button
                type="primary"
                danger
                icon={<CloseCircleOutlined />}
                onClick={fecharCaixa}
                loading={loading}
              >
                Fechar Caixa
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Abrir Caixa">
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={abrirCaixa}
                loading={loading}
              >
                Abrir Caixa
              </Button>
            </Tooltip>
          )}
        </div>
      </Header>

      <Layout>
        {caixaAberto && (
          <>
            <Content style={{ padding: "20px", background: "#f0f2f5" }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 16,
                      }}
                    >
                      <Input
                        ref={barcodeInputRef}
                        placeholder="Código de barras..."
                        prefix={
                          <BarcodeOutlined
                            style={{ color: "rgba(0,0,0,.45)" }}
                          />
                        }
                        size="large"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        onPressEnter={() => handleBarcodeScan(busca)}
                        style={{ marginRight: 16 }}
                        autoFocus
                      />
                      <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        size="large"
                        onClick={() => handleBarcodeScan(busca)}
                      >
                        Buscar
                      </Button>
                    </div>

                    <Search
                      ref={searchInputRef}
                      placeholder="Buscar produto por nome..."
                      onChange={(e) => setBusca(e.target?.value?.toLowerCase())}
                      style={{ marginBottom: 16 }}
                      allowClear
                    />

                    <Table
                      dataSource={products.filter(
                        (p) =>
                          p.descricao
                            ?.toLowerCase()
                            .includes(busca.toLowerCase()) ||
                          p.id.toString().includes(busca) ||
                          (p.ean && p.ean.includes(busca))
                      )}
                      columns={myColumns}
                      rowKey="id"
                      size="middle"
                      pagination={{ pageSize: 8 }}
                      loading={loading}
                      locale={{
                        emptyText: (
                          <Empty description="Nenhum produto encontrado" />
                        ),
                      }}
                    />
                  </Card>
                </Col>

                {resumoVendas.total > 0 && (
                  <Col span={24}>
                    <Card
                      title={
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <DollarOutlined
                            style={{ marginRight: 8, color: "#1890ff" }}
                          />
                          <span>Resumo de Vendas do Dia</span>
                        </div>
                      }
                    >
                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={5}>
                          <Statistic
                            title="Total em Dinheiro"
                            value={resumoVendas.dinheiro}
                            precision={2}
                            valueStyle={{ color: "#3f8600" }}
                            prefix="R$"
                          />
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                          <Statistic
                            title="Total em PIX"
                            value={resumoVendas.pix}
                            precision={2}
                            valueStyle={{ color: "#1890ff" }}
                            prefix="R$"
                          />
                        </Col>
                        <Col xs={24} sm={12} md={5}>
                          <Statistic
                            title="Total em Crédito"
                            value={resumoVendas.credito}
                            precision={2}
                            valueStyle={{ color: "#722ed1" }}
                            prefix="R$"
                          />
                        </Col>
                        <Col xs={24} sm={12} md={5}>
                          <Statistic
                            title="Total em Débito"
                            value={resumoVendas.debito}
                            precision={2}
                            valueStyle={{ color: "#fa8c16" }}
                            prefix="R$"
                          />
                        </Col>
                        <Col xs={24} sm={12} md={5}>
                          <Statistic
                            title="Total Geral"
                            value={resumoVendas.total}
                            precision={2}
                            valueStyle={{ color: "#cf1322", fontSize: "24px" }}
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
                      pagination={{ pageSize: 10 }}
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

            <Sider
              width={380}
              style={{
                background: "#fff",
                padding: "20px",
                boxShadow: "-2px 0 8px rgba(0,0,0,0.15)",
              }}
              breakpoint="lg"
              collapsedWidth={0}
            >
              <Card
                title={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <ShoppingCartOutlined
                      style={{ marginRight: 8, color: "#1890ff" }}
                    />
                    <span>Venda em andamento</span>
                    {venda.length > 0 && (
                      <Badge
                        count={venda.length}
                        style={{ marginLeft: 8, backgroundColor: "#52c41a" }}
                      />
                    )}
                  </div>
                }
                style={{
                  background: "#f8f8f8",
                  height: "calc(100vh - 120px)",
                  display: "flex",
                  flexDirection: "column",
                }}
                bodyStyle={{
                  flex: 1,
                  overflow: "auto",
                  paddingTop: 0,
                }}
              >
                {venda.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    <div
                      style={{ flex: 1, overflow: "auto", marginBottom: 16 }}
                    >
                      <List
                        itemLayout="horizontal"
                        dataSource={venda}
                        renderItem={(item) => (
                          <List.Item
                            style={{
                              padding: "12px 0",
                              borderBottom: "1px solid #f0f0f0",
                            }}
                            actions={[
                              <Button
                                type="text"
                                danger
                                icon={<CloseCircleOutlined />}
                                onClick={() => removeItem(item)}
                              />,
                            ]}
                          >
                            <List.Item.Meta
                              title={
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <Text strong>
                                    {item.descricao.toUpperCase()}
                                  </Text>
                                  <Text type="secondary">#{item.id}</Text>
                                </div>
                              }
                              description={
                                <div>
                                  <Space
                                    style={{
                                      width: "100%",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <div>
                                      <Button
                                        size="small"
                                        icon={<MinusOutlined />}
                                        onClick={() => {
                                          if (item.qtd > 1) {
                                            setVenda((prev) =>
                                              prev.map((i) =>
                                                i.id === item.id
                                                  ? { ...i, qtd: i.qtd - 1 }
                                                  : i
                                              )
                                            );
                                          } else {
                                            removeItem(item);
                                          }
                                        }}
                                      />
                                      <Text style={{ margin: "0 8px" }}>
                                        {item.qtd}
                                      </Text>
                                      <Button
                                        size="small"
                                        icon={<PlusOutlined />}
                                        onClick={() => {
                                          setVenda((prev) =>
                                            prev.map((i) =>
                                              i.id === item.id
                                                ? { ...i, qtd: i.qtd + 1 }
                                                : i
                                            )
                                          );
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <Text>
                                        R$ {money(item.valor)} × {item.qtd} =
                                      </Text>
                                      <Text strong style={{ marginLeft: 5 }}>
                                        R$ {money(item.valor * item.qtd)}
                                      </Text>
                                    </div>
                                  </Space>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </div>

                    <div
                      style={{ borderTop: "1px solid #e8e8e8", paddingTop: 16 }}
                    >
                      <Row gutter={[0, 16]}>
                        <Col span={24}>
                          <Statistic
                            title="Total da Compra"
                            value={totalVendaAtual}
                            precision={2}
                            prefix="R$"
                            valueStyle={{ color: "#cf1322", fontSize: 28 }}
                          />
                        </Col>
                        <Col span={24}>
                          <Button
                            type="primary"
                            size="large"
                            block
                            icon={<DollarOutlined />}
                            onClick={handleFinalizarVenda}
                            disabled={venda.length === 0}
                          >
                            Finalizar Venda
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Nenhum produto adicionado"
                    style={{ margin: "40px 0" }}
                  />
                )}
              </Card>
            </Sider>
          </>
        )}
      </Layout>

      {/* Quick Add Product Drawer */}
      <Drawer
        title={
          <div>
            <Text>Adicionar Produto</Text>
            {selectedProduct && (
              <div>
                <Text strong>{selectedProduct.descricao.toUpperCase()}</Text>
                <br />
                <Text type="secondary">Código: {selectedProduct.id}</Text>
                {selectedProduct.ean && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    <BarcodeOutlined /> {selectedProduct.ean}
                  </Tag>
                )}
              </div>
            )}
          </div>
        }
        placement="right"
        onClose={() => setQuickAddDrawer(false)}
        open={quickAddDrawer}
        width={400}
        footer={
          <div style={{ textAlign: "right" }}>
            <Button
              onClick={() => setQuickAddDrawer(false)}
              style={{ marginRight: 8 }}
            >
              Cancelar
            </Button>
            <Button
              type="primary"
              onClick={() => adicionarProduto(selectedProduct, quantity)}
              disabled={!selectedProduct}
            >
              Adicionar a venda
            </Button>
          </div>
        }
      >
        {selectedProduct && (
          <div>
            <Card>
              <Statistic
                title="Preço Unitário"
                value={selectedProduct.valor}
                precision={2}
                prefix="R$"
              />
            </Card>

            <div style={{ margin: "20px 0" }}>
              <Text>Quantidade:</Text>
              <div
                style={{ display: "flex", alignItems: "center", marginTop: 8 }}
              >
                <Button
                  icon={<MinusOutlined />}
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                />
                <InputNumber
                  min={1}
                  value={quantity}
                  onChange={(value) => setQuantity(value)}
                  style={{ margin: "0 8px", width: 60, textAlign: "center" }}
                />
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setQuantity((prev) => prev + 1)}
                />
              </div>
            </div>

            <Card style={{ marginTop: 16 }}>
              <Statistic
                title="Total"
                value={selectedProduct.valor * quantity}
                precision={2}
                prefix="R$"
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </div>
        )}
      </Drawer>

      {/* Payment Modal */}
      <Modal
        title="Finalizar Venda"
        open={showPaymentModal}
        onCancel={() => setShowPaymentModal(false)}
        footer={null}
        width={600}
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Statistic
              title="Total da Venda"
              value={totalVendaAtual}
              precision={2}
              prefix="R$"
              valueStyle={{ color: "#cf1322", fontSize: 24 }}
            />
          </Col>

          <Col span={24}>
            <Divider orientation="left">Forma de Pagamento</Divider>
            <Space
              size="large"
              style={{ width: "100%", justifyContent: "space-between" }}
            >
              <Button
                type="primary"
                size="large"
                icon={<DollarOutlined />}
                onClick={() => setPagamento("dinheiro")}
                style={{ height: 80, width: 120 }}
              >
                Dinheiro
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => handlePayment("pix")}
                style={{
                  height: 80,
                  width: 120,
                  background: "#52c41a",
                  borderColor: "#52c41a",
                }}
              >
                PIX
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => handlePayment("credito")}
                style={{
                  height: 80,
                  width: 120,
                  background: "#722ed1",
                  borderColor: "#722ed1",
                }}
              >
                Crédito
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => handlePayment("debito")}
                style={{
                  height: 80,
                  width: 120,
                  background: "#fa8c16",
                  borderColor: "#fa8c16",
                }}
              >
                Débito
              </Button>
            </Space>
          </Col>

          {pagamento === "dinheiro" && (
            <>
              <Col span={24}>
                <Divider orientation="left">Troco</Divider>
                <Form layout="vertical">
                  <Form.Item label="Valor Recebido">
                    <InputNumber
                      style={{ width: "100%" }}
                      size="large"
                      min={totalVendaAtual}
                      step={1}
                      precision={2}
                      prefix="R$"
                      value={valorRecebido}
                      onChange={setValorRecebido}
                      autoFocus
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Troco"
                        value={troco}
                        precision={2}
                        prefix="R$"
                        valueStyle={{
                          color: troco > 0 ? "#3f8600" : "#8c8c8c",
                        }}
                      />
                    </Col>
                    <Col span={12} style={{ textAlign: "right" }}>
                      <Button
                        type="primary"
                        size="large"
                        onClick={gerarCupom}
                        disabled={valorRecebido < totalVendaAtual}
                      >
                        Concluir Venda
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Col>
            </>
          )}
        </Row>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={successModal}
        footer={null}
        onCancel={() => setSuccessModal(false)}
        width={400}
        bodyStyle={{ padding: 0 }}
      >
        <Result
          status="success"
          title="Venda Finalizada com Sucesso!"
          subTitle={`Total: R$ ${money(totalVendaAtual)}`}
          extra={[
            <Button
              type="primary"
              key="console"
              onClick={() => {
                setSuccessModal(false);
                setPrintPreviewModal(false);
                if (barcodeInputRef.current) {
                  barcodeInputRef.current.focus();
                }
              }}
            >
              Nova Venda
            </Button>,
          ]}
        />
      </Modal>

      {/* Print Preview Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <PrinterOutlined style={{ marginRight: 8 }} />
            <span>Impressão do Cupom</span>
          </div>
        }
        open={printPreviewModal}
        onCancel={() => setPrintPreviewModal(false)}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setPrintPreviewModal(false)}
          >
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

      {/* Fechamento de Caixa Modal */}
      <Modal
        title="Fechar Caixa"
        open={modalFechamento}
        onOk={confirmarFechamento}
        onCancel={() => setModalFechamento(false)}
        width={700}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Card
              title={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <DollarOutlined
                    style={{ marginRight: 8, color: "#1890ff" }}
                  />
                  <span>Resumo de Vendas</span>
                </div>
              }
            >
              <Statistic
                title="Total em Dinheiro"
                value={resumoVendas.dinheiro}
                precision={2}
                prefix="R$"
                style={{ marginBottom: 10 }}
              />
              <Statistic
                title="Total em PIX"
                value={resumoVendas.pix}
                precision={2}
                prefix="R$"
                style={{ marginBottom: 10 }}
              />
              <Statistic
                title="Total em Crédito"
                value={resumoVendas.credito}
                precision={2}
                prefix="R$"
                style={{ marginBottom: 10 }}
              />
              <Statistic
                title="Total em Débito"
                value={resumoVendas.debito}
                precision={2}
                prefix="R$"
                style={{ marginBottom: 10 }}
              />
              <Divider />
              <Statistic
                title="Total Geral"
                value={resumoVendas.total}
                precision={2}
                prefix="R$"
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <CheckCircleOutlined
                    style={{ marginRight: 8, color: "green" }}
                  />
                  <span>Conferência de Caixa (apenas dinheiro)</span>
                </div>
              }
            >
              <Statistic
                title="Valor inicial do caixa"
                value={valorAbertura}
                precision={2}
                prefix="R$"
                style={{ marginBottom: 10 }}
              />
              <Statistic
                title="Vendas em dinheiro"
                value={resumoVendas.dinheiro}
                precision={2}
                prefix="R$"
                style={{ marginBottom: 10 }}
              />
              <Statistic
                title="Total esperado em caixa"
                value={valorAbertura + resumoVendas.dinheiro}
                precision={2}
                prefix="R$"
                style={{ marginBottom: 20 }}
              />

              <Input
                type="number"
                addonBefore="R$"
                placeholder="Valor real em caixa"
                style={{ marginBottom: 20 }}
                onChange={(e) =>
                  setValorFechamento(parseFloat(e.target.value) || 0)
                }
              />

              <Statistic
                title="Diferença"
                value={
                  valorFechamento - (valorAbertura + resumoVendas.dinheiro)
                }
                precision={2}
                prefix="R$"
                valueStyle={{
                  color:
                    valorFechamento - (valorAbertura + resumoVendas.dinheiro) <
                    0
                      ? "#cf1322"
                      : "#3f8600",
                }}
                suffix={
                  valorFechamento - (valorAbertura + resumoVendas.dinheiro) < 0
                    ? " (falta)"
                    : valorFechamento -
                        (valorAbertura + resumoVendas.dinheiro) >
                      0
                    ? " (sobra)"
                    : " (correto)"
                }
              />
            </Card>
          </Col>
        </Row>
      </Modal>
    </Layout>
  );
};

export default Caixa;
