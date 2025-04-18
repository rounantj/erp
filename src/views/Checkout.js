import { getProducts } from "helpers/api-integrator";
import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import {
  Layout,
  Button,
  Table,
  Input,
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
  Alert,
  Tabs,
} from "antd";
import {
  CloseCircleOutlined,
  CheckCircleOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
  BarcodeOutlined,
  PrinterOutlined,
  DollarOutlined,
  PlusOutlined,
  MinusOutlined,
  CameraOutlined,
  BarChartOutlined,
  ShoppingOutlined,
  MenuOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import { openCaixa } from "helpers/caixa.adapter";
import { UserContext } from "context/UserContext";
import { getCaixaEmAberto } from "helpers/caixa.adapter";
import { vendaFinaliza } from "helpers/caixa.adapter";
import { getResumoVendas } from "helpers/caixa.adapter";
import { fechaCaixa } from "helpers/caixa.adapter";
import { getSells } from "helpers/api-integrator";
import moment from "moment";
import { Switch } from "antd/lib";
import ReactDOM from "react-dom";
import { calcularTotal } from "./Vendas";
import { toMoneyFormat } from "helpers/formatters";
import { toDateFormat } from "helpers/formatters";

const { Header, Content, Sider } = Layout;
const { Text } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

// Função auxiliar para escanear código de barras com câmera
const BarcodeScannerComponent = ({ onDetect, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);
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
  // Carregar dados iniciais
  useEffect(() => {
    caixaEmAberto();
    getVendas();
  }, []);

  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        const constraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current && mounted) {
          videoRef.current.srcObject = stream;

          // Carregar Quagga de forma dinâmica quando necessário
          if (!window.Quagga) {
            const script = document.createElement("script");
            script.src =
              "https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js";
            script.async = true;

            script.onload = () => {
              if (mounted) initQuagga();
            };

            document.body.appendChild(script);
          } else {
            initQuagga();
          }
        }
      } catch (err) {
        if (mounted) {
          console.error("Erro ao acessar a câmera:", err);
          setError(`Erro ao acessar a câmera: ${err.message}`);
        }
      }
    };

    const initQuagga = () => {
      if (!videoRef.current || !mounted) return;

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const processFrame = () => {
        if (!mounted || !scanning || !videoRef.current || !streamRef.current)
          return;

        if (videoRef.current.videoWidth > 0) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(
            videoRef.current,
            0,
            0,
            canvas.width,
            canvas.height
          );

          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );

          window.Quagga.decodeSingle(
            {
              decoder: {
                readers: [
                  "ean_reader",
                  "ean_8_reader",
                  "code_128_reader",
                  "code_39_reader",
                  "upc_reader",
                  "upc_e_reader",
                ],
              },
              locate: true,
              src: imageData,
            },
            function (result) {
              if (result && result.codeResult) {
                const code = result.codeResult.code;
                setScanning(false);
                onDetect(code);
              } else {
                requestAnimationFrame(processFrame);
              }
            }
          );
        } else {
          requestAnimationFrame(processFrame);
        }
      };

      const frameProcessor = setTimeout(() => {
        requestAnimationFrame(processFrame);
      }, 500); // Aguarda um pouco para garantir que o vídeo esteja pronto

      return () => clearTimeout(frameProcessor);
    };

    initCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onDetect]);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {error ? (
        <Alert message="Erro" description={error} type="error" showIcon />
      ) : (
        <>
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", borderRadius: "8px" }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "80%",
                height: "1px",
                backgroundColor: "red",
                opacity: 0.7,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(90deg)",
                width: "80%",
                height: "1px",
                backgroundColor: "red",
                opacity: 0.7,
              }}
            />
          </div>
          <div style={{ margin: "16px 0", textAlign: "center" }}>
            <Text>Aponte a câmera para o código de barras</Text>
          </div>
          <Space>
            <Button type="primary" danger onClick={onClose}>
              Cancelar
            </Button>
          </Space>
        </>
      )}
    </div>
  );
};

const Caixa = () => {
  // Estados existentes
  const [formaPagamento, setFormaPagamento] = useState([]);
  const [valoresPorForma, setValoresPorForma] = useState({});
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
  const [makePdf, setMakePdf] = useState(false);
  const [historicoVendas, setHistoricoVendas] = useState([]);
  const [resumoVendas, setResumoVendas] = useState({
    dinheiro: 0,
    pix: 0,
    credito: 0,
    debito: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [quickAddDrawer, setQuickAddDrawer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [printPreviewModal, setPrintPreviewModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [totalVendaAtual, setTotalVendaAtual] = useState(0);
  const [valorRecebido, setValorRecebido] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [troco1, setTroco] = useState(0);

  // Novos estados para responsividade e leitor de código de barras
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [siderCollapsed, setSiderCollapsed] = useState(isMobile);
  const [activeTab, setActiveTab] = useState("products");
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  // Refs
  const barcodeInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // Cálculos e Memos
  const troco = useMemo(() => {
    return formaPagamento.includes("dinheiro")
      ? (valorRecebido || 0) - (valoresPorForma["dinheiro"] || 0)
      : 0;
  }, [valorRecebido, valoresPorForma, formaPagamento]);

  const totalPago = useMemo(() => {
    return Object.values(valoresPorForma).reduce(
      (sum, valor) => sum + (valor || 0),
      0
    );
  }, [valoresPorForma]);

  const remainingAmount = useMemo(() => {
    return totalVendaAtual - (valoresPorForma[formaPagamento[0]] || 0);
  }, [totalVendaAtual, valoresPorForma, formaPagamento]);

  // Funções auxiliares
  const money = (valor) =>
    valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  // Monitora o tamanho da tela para responsividade
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile !== isMobile) {
        setSiderCollapsed(mobile);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  // Foco no input de código de barras quando componente monta
  useEffect(() => {
    if (barcodeInputRef.current && !showBarcodeScanner) {
      barcodeInputRef.current.focus();
    }
  }, [caixaAberto, quickAddDrawer, showBarcodeScanner]);

  // Calcula o total da venda atual
  useEffect(() => {
    const total = venda.reduce(
      (acc, item) =>
        acc +
        (item.valorEditado !== undefined ? item.valorEditado : item.valor) *
          item.qtd,
      0
    );
    setTotalVendaAtual(total);
  }, [venda]);

  // Recalcula o troco quando houver pagamento em dinheiro
  useEffect(() => {
    if (pagamento === "dinheiro") {
      setTroco(Math.max(0, valorRecebido - totalVendaAtual));
    }
  }, [valorRecebido, totalVendaAtual, pagamento]);

  // Reseta formas de pagamento quando modal é aberto
  useEffect(() => {
    if (showPaymentModal) {
      setFormaPagamento([]);
      setValoresPorForma({});
      setValorRecebido(0);
    }
  }, [showPaymentModal]);

  // Buscar lista de produtos
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

      setHoraAbertura(dayjs(cx.createdAt).format("DD/MM/YYYY HH:mm"));
      setValorAbertura(cx.saldoInicial);
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
    getProductsList();
    caixaEmAberto();
  }, []);

  // Adicionar produto à venda
  const adicionarProduto = (produto, qtd) => {
    setVenda((prev) => {
      const index = prev.findIndex((item) => item.id === produto.id);
      if (index >= 0) {
        const newVenda = [...prev];
        newVenda[index].qtd += qtd;
        return newVenda;
      } else {
        // Adicionamos o valorEditado igual ao valor original do produto
        return [...prev, { ...produto, qtd, valorEditado: produto.valor }];
      }
    });
    notification.success({
      message: "Produto adicionado",
      description: `${produto.descricao.toUpperCase()} (${qtd}x)`,
      placement: "bottomRight",
      duration: 2,
    });
    setQuickAddDrawer(false);
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 100);
  };

  const atualizarValorProduto = (id, novoValor) => {
    setVenda((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, valorEditado: novoValor } : item
      )
    );
  };

  // Remover item da venda
  const removeItem = (item) => {
    setVenda((prev) => prev.filter((p) => p.id !== item.id));
  };

  // Handler para leitura de código de barras
  const handleBarcodeScan = (value) => {
    if (!value) return;
    const product = products.find(
      (p) => p.ean === value || p.id.toString() === value
    );

    if (product) {
      adicionarProduto(product, 1);
      setBusca("");
    } else {
      notification.warning({
        message: "Produto não encontrado",
        description: `Código de barras: ${value}`,
        placement: "bottomRight",
      });
    }
  };

  // Iniciar leitura de código de barras via câmera
  const startBarcodeScanner = () => {
    setShowBarcodeScanner(true);
  };

  // Handler para detecção de código via câmera
  const handleBarcodeDetected = (barcode) => {
    setShowBarcodeScanner(false);
    handleBarcodeScan(barcode);
  };

  // Toggle forma de pagamento
  const toggleFormaPagamento = (forma) => {
    setFormaPagamento((prev) => {
      if (prev.includes(forma)) {
        const newFormas = prev.filter((f) => f !== forma);
        setValoresPorForma((prevValores) => {
          const newValores = { ...prevValores };
          delete newValores[forma];
          return newValores;
        });
        return newFormas;
      } else if (prev.length < 2) {
        const newFormas = [...prev, forma];
        if (prev.length === 0) {
          setValoresPorForma({ [forma]: totalVendaAtual });
        } else if (prev.length === 1) {
          const firstValue = valoresPorForma[prev[0]] || 0;
          const secondValue = Math.max(0, totalVendaAtual - firstValue);
          setValoresPorForma((prevValores) => ({
            ...prevValores,
            [forma]: secondValue,
          }));
        }
        if (forma === "dinheiro") {
          const valorDinheiro =
            prev.length === 0
              ? totalVendaAtual
              : Math.max(0, totalVendaAtual - (valoresPorForma[prev[0]] || 0));
          setValorRecebido(valorDinheiro);
        }
        return newFormas;
      }
      return prev;
    });
  };

  // Handler para alteração do valor de pagamento
  const handleValorPagamentoChange = (forma, valor) => {
    setValoresPorForma((prev) => {
      const newValores = { ...prev, [forma]: valor || 0 };
      if (formaPagamento.length === 2) {
        const outraForma = formaPagamento.find((f) => f !== forma);
        if (outraForma) {
          if (forma === formaPagamento[0]) {
            newValores[outraForma] = Math.max(
              0,
              totalVendaAtual - (valor || 0)
            );
          } else {
            newValores[formaPagamento[0]] = Math.max(
              0,
              totalVendaAtual - (valor || 0)
            );
          }
        }
      }
      if (forma === "dinheiro" && valor > (prev[forma] || 0)) {
        setValorRecebido(valor);
      }
      return newValores;
    });
  };

  // Preparar para finalizar venda
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

  // Finalizar a venda atual
  const finalizarVenda = () => {
    const infoPagamento = {
      formas: formaPagamento.map((forma) => ({
        tipo: forma,
        valor: valoresPorForma[forma] || 0,
      })),
      troco: troco,
      total: totalVendaAtual,
    };
    gerarCupom(infoPagamento);
  };

  // Gerar cupom e finalizar venda
  const gerarCupom = async (infoPagamento) => {
    if (!formaPagamento || formaPagamento.length === 0) {
      notification.error({
        message: "Erro",
        description: "Selecione pelo menos um método de pagamento!",
      });
      return;
    }
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
        format: [80, 300],
      });
      const fontePadrao = "courier";
      doc.setFont(fontePadrao, "normal");
      const leftMargin = 5;
      const width = 70;
      const lineHeight = 3.5;
      const empresa = {
        nome: "FOFA PAPELARIA",
        endereco: "RUA ORLINDO BORGES - BARRA DO SAHY",
        cidade: "ARACRUZ - ES",
        cnpj: "CNPJ: 54.007.957/0001-99",
        ie: "IE: 084231440",
        im: "IM: ISENTO",
        uf: "UF: ES",
      };
      const dataHoraAtual = dayjs().format("DD/MM/YYYY HH:mm:ss");
      const cupom = {
        dataHora: dataHoraAtual,
        ccf: `CCF: ${String(historicoVendas.length + 1).padStart(6, "0")}`,
        coo: `COO: ${String(historicoVendas.length + 1).padStart(7, "0")}`,
      };
      const totalVendas = venda.reduce(
        (acc, item) =>
          acc +
          (item.valorEditado !== undefined ? item.valorEditado : item.valor) *
            item.qtd,
        0
      );

      if (makePdf) {
        const centerText = (text, y, fontSize = 8) => {
          doc.setFontSize(fontSize);
          const textWidth =
            (doc.getStringUnitWidth(text) * fontSize) /
            doc.internal.scaleFactor;
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
        let y = 10;
        y = centerText(empresa.nome, y, 10);
        y = centerText(empresa.endereco, y);
        y = centerText(empresa.cidade, y);
        y = centerText(empresa.cnpj, y);
        y = centerText(`${empresa.ie} ${empresa.uf}`, y);
        y = centerText(empresa.im, y);
        y = addSeparator(y + 2);
        y = addText(`DATA: ${cupom.dataHora}`, y);
        y = addText(`${cupom.ccf}`, y);
        y = addText(`${cupom.coo}`, y);
        y = addSeparator(y + 2);
        y = centerText("DOCUMENTO NÃO FISCAL", y, 9);
        y = addSeparator(y + 2);
        doc.setFontSize(7);
        y = addText("ITEM CÓDIGO DESCRIÇÃO", y, 7);
        y = addText("QTD UN.  VL_UNIT(R$)   VL_ITEM(R$)", y, 7);
        y = addSeparator(y);
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
        doc.setFontSize(9);
        y = addText(`TOTAL R$ ${money(totalVendas)}`, y + 1, 10, "right");
        formaPagamento.forEach((forma, index) => {
          const valorForma = valoresPorForma[forma] || 0;
          const formaTexto = forma.toUpperCase();
          y = addText(`${formaTexto} - ${money(valorForma)}`, y, 8, "right");
        });
        if (formaPagamento.includes("dinheiro") && troco > 0) {
          y = addText(
            `VALOR RECEBIDO - ${money(valorRecebido)}`,
            y,
            8,
            "right"
          );
          y = addText(`TROCO - ${money(troco)}`, y, 8, "right");
        }
        y = addSeparator(y + 2);
        y = centerText("Volte Sempre!!", y + 1, 9);
        y = centerText("Agradecemos sua preferência", y, 8);
        y = centerText(dayjs().format("DD/MM/YYYY - HH:mm:ss"), y + 2, 7);
        y = centerText("==================", y + 5, 8);
        y = centerText("FOFA PAPELARIA", y, 8);
        y = centerText("==================", y, 8);
        doc.autoPrint();
        doc.save("cupom_fiscal.pdf");
        setPrintPreviewModal(true);
      }
      // Preparar informações do pagamento para salvar na venda
      const metodoPagamentoInfo = formaPagamento.map((forma) => ({
        tipo: forma,
        valor: valoresPorForma[forma] || 0,
      }));

      const novaVenda = {
        createdAt: new Date(),
        updatedAt: new Date(),
        caixaId: caixa?.id,
        desconto: 0,
        produtos: venda.map((item) => {
          return {
            id: item.id,
            descricao: item.descricao,
            categoria: item.categoria,
            quantidade: item.qtd,
            valorUnitario:
              item.valorEditado !== undefined ? item.valorEditado : item.valor,
            desconto: 0,
          };
        }),
        metodoPagamento: formaPagamento[0],
        metodosPagamento: metodoPagamentoInfo,
        nome_cliente: "Cliente padrão",
        total: totalVendas,
        valorRecebido: formaPagamento.includes("dinheiro")
          ? valorRecebido
          : totalVendas,
        troco: troco || 0,
      };

      const result = await vendaFinaliza(novaVenda);

      setHistoricoVendas((prev) => [...prev, novaVenda]);
      setSuccessModal(true);
      setVenda([]);
      setFormaPagamento([]);
      setValoresPorForma({});
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
  const columnsVendas = [
    {
      title: "Data",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => toDateFormat(text, !isMobile),
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
      responsive: ["md"],
    },
    {
      title: "Cliente",
      dataIndex: "nome_cliente",
      key: "nome_cliente",
      render: (text) => (
        <Space>
          <UserOutlined />
          <span
            className="mobile-ellipsis"
            style={{
              maxWidth: isMobile ? "120px" : "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            {text}
          </span>
        </Space>
      ),
    },
    {
      title: "Total",
      key: "totalComDesconto",
      render: (_, record) => {
        const total = calcularTotal(record.total, record.desconto);
        return <Text strong>{toMoneyFormat(total)}</Text>;
      },
      sorter: (a, b) =>
        calcularTotal(a.total, a.desconto) - calcularTotal(b.total, b.desconto),
    },
    {
      title: "Data",
      dataIndex: "createdAt",
      key: "createdAtMobile",
      render: (text) => toDateFormat(text, false),
      responsive: ["xs", "sm"],
    },
  ];
  // Abrir o caixa
  const abrirCaixa = async () => {
    const modalRoot = document.createElement("div");
    modalRoot.id = "modal-root-" + Date.now();
    document.body.appendChild(modalRoot);

    const AbrirCaixaModal = ({ onClose, onConfirm }) => {
      const [valorAbertura, setValorAbertura] = useState(0);

      return ReactDOM.createPortal(
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              minWidth: "300px",
              maxWidth: "90%",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <span
                style={{
                  color: "green",
                  fontSize: "20px",
                  marginRight: "8px",
                }}
              >
                $
              </span>
              <h3 style={{ margin: 0 }}>Abrir Caixa</h3>
            </div>

            <div style={{ padding: "20px 0" }}>
              <p>Informe o valor inicial em caixa:</p>
              <InputNumber
                style={{ width: "100%" }}
                prefix="R$"
                placeholder="Valor inicial em caixa"
                onChange={(value) => setValorAbertura(value || 0)}
                min={0}
                precision={2}
                step={10}
                autoFocus
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "16px",
              }}
            >
              <Button onClick={onClose} style={{ marginRight: "8px" }}>
                Cancelar
              </Button>
              <Button type="primary" onClick={() => onConfirm(valorAbertura)}>
                OK
              </Button>
            </div>
          </div>
        </div>,
        modalRoot
      );
    };

    const modalContainer = document.createElement("div");
    document.body.appendChild(modalContainer);

    const handleConfirm = async (valorAberturaTemp) => {
      try {
        setLoading(true);
        const userId = user?.user?.id || 1;

        const resultOpenCaixa = await openCaixa(userId, valorAberturaTemp);

        if (resultOpenCaixa && resultOpenCaixa.data) {
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

          setTimeout(() => {
            if (barcodeInputRef.current) {
              barcodeInputRef.current.focus();
            }
          }, 500);
        } else {
          throw new Error("Resposta inválida ao abrir caixa");
        }
      } catch (error) {
        console.error("Erro ao abrir caixa:", error);
        notification.error({
          message: "Erro ao abrir caixa",
          description: error.message || "Tente novamente mais tarde.",
        });
      } finally {
        setLoading(false);
        if (modalContainer && document.body.contains(modalContainer)) {
          document.body.removeChild(modalContainer);
        }
        if (modalRoot && document.body.contains(modalRoot)) {
          document.body.removeChild(modalRoot);
        }
      }
    };

    const handleClose = () => {
      // Remover o modal do DOM
      if (modalContainer && document.body.contains(modalContainer)) {
        document.body.removeChild(modalContainer);
      }
      if (modalRoot && document.body.contains(modalRoot)) {
        document.body.removeChild(modalRoot);
      }
    };

    try {
      ReactDOM.render(
        <AbrirCaixaModal onClose={handleClose} onConfirm={handleConfirm} />,
        modalContainer
      );
    } catch (error) {
      console.error("Erro ao renderizar modal:", error);
      const valorDigitado = prompt(
        "Informe o valor inicial em caixa (R$):",
        "0"
      );
      if (valorDigitado !== null) {
        const valorAbertura = parseFloat(valorDigitado) || 0;
        handleConfirm(valorAbertura);
      }
    }
  };

  const editarValorProduto = (id, novoValor) => {
    setVenda((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, valorEditado: novoValor } : item
      )
    );
    // Adicionar notificação para confirmar a alteração
    notification.info({
      message: "Valor atualizado",
      description: `O valor do produto foi alterado`,
      placement: "bottomRight",
      duration: 1,
    });
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
  // Fechar o caixa
  const fecharCaixa = async () => {
    await getResumoCaixa(caixa.id);
    setModalFechamento(true);
  };

  // Confirmar fechamento do caixa
  const confirmarFechamento = async () => {
    try {
      setLoading(true);
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

  // Configuração de colunas para tabela de produtos
  const myColumns = [
    {
      title: "Código",
      dataIndex: "id",
      key: "id",
      width: 80,
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
      width: 100,
      render: (valor) => <Text>R$ {money(valor)}</Text>,
    },
    {
      title: "Ações",
      key: "acoes",
      align: "center",
      width: 100,
      render: (_, record) => (
        <Button
          onClick={() => {
            setSelectedProduct(record);
            setQuantity(1);
            setQuickAddDrawer(true);
          }}
          type="primary"
          icon={<PlusOutlined />}
          size={isMobile ? "small" : "middle"}
        >
          {!isMobile && "Adicionar"}
        </Button>
      ),
    },
  ];

  // Renderizar o componente
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
            fontSize: isMobile ? 14 : 18,
            display: "flex",
            alignItems: "center",
          }}
        >
          {isMobile && (
            <MenuOutlined
              style={{ marginRight: 16, fontSize: 20 }}
              onClick={() => setMobileDrawerVisible(true)}
            />
          )}

          {caixaAberto ? (
            <>
              <Badge status="success" />
              <span style={{ marginLeft: 10 }}>
                {isMobile
                  ? `Caixa ${caixa?.id}`
                  : `Caixa ${caixa?.id} • Aberto em ${horaAbertura}`}
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
                size={isMobile ? "small" : "middle"}
              >
                {!isMobile && "Fechar Caixa"}
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Abrir Caixa">
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={abrirCaixa}
                loading={loading}
                size={isMobile ? "small" : "middle"}
              >
                {!isMobile && "Abrir Caixa"}
              </Button>
            </Tooltip>
          )}
        </div>
      </Header>

      <Layout>
        {/* Conteúdo principal quando o caixa está aberto */}
        {caixaAberto && (
          <>
            {/* Interface Mobile */}
            {isMobile ? (
              <Content style={{ padding: "10px", background: "#f0f2f5" }}>
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  centered
                  style={{ marginBottom: 16 }}
                >
                  <TabPane
                    tab={
                      <span>
                        <ShoppingOutlined />
                        Produtos
                      </span>
                    }
                    key="products"
                  />
                  <TabPane
                    tab={
                      <span>
                        <ShoppingCartOutlined />
                        Carrinho{" "}
                        {venda.length > 0 && (
                          <Badge
                            count={venda.length}
                            size="small"
                            style={{ marginLeft: 4 }}
                          />
                        )}
                      </span>
                    }
                    key="cart"
                  />
                  <TabPane
                    tab={
                      <span>
                        <BarChartOutlined />
                        Resumo
                      </span>
                    }
                    key="summary"
                  />
                </Tabs>

                {activeTab === "products" && (
                  <Card bodyStyle={{ padding: "12px" }}>
                    <div style={{ display: "flex", marginBottom: 12 }}>
                      <Input
                        ref={barcodeInputRef}
                        placeholder="Código de barras..."
                        prefix={
                          <BarcodeOutlined
                            style={{ color: "rgba(0,0,0,.45)" }}
                          />
                        }
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        onPressEnter={() => handleBarcodeScan(busca)}
                        style={{ flex: 1, marginRight: 8 }}
                      />
                      <Button
                        type="primary"
                        icon={<CameraOutlined />}
                        onClick={startBarcodeScanner}
                      />
                    </div>

                    <Search
                      placeholder="Buscar produto por nome..."
                      onChange={(e) => setBusca(e.target?.value?.toLowerCase())}
                      style={{ marginBottom: 12 }}
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
                      size="small"
                      pagination={{ pageSize: 8, size: "small" }}
                      loading={loading}
                      scroll={{ x: "max-content" }}
                      locale={{
                        emptyText: (
                          <Empty description="Nenhum produto encontrado" />
                        ),
                      }}
                    />
                  </Card>
                )}

                {activeTab === "cart" && (
                  <Card
                    bodyStyle={{ padding: "12px" }}
                    style={{ marginBottom: 70 }} // Espaço para o botão fixo
                  >
                    {venda.length > 0 ? (
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
                                size="small"
                              />,
                            ]}
                          >
                            <List.Item.Meta
                              title={
                                <div style={{ fontSize: 14 }}>
                                  <Text strong>
                                    {item.descricao.toUpperCase()}
                                  </Text>
                                  <Text
                                    type="secondary"
                                    style={{ marginLeft: 8 }}
                                  >
                                    #{item.id}
                                  </Text>
                                </div>
                              }
                              description={
                                <div>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      marginTop: 8,
                                      marginBottom: 8,
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
                                  </div>

                                  <div style={{ marginTop: 8 }}>
                                    <div style={{ marginBottom: 8 }}>
                                      <Text>Valor unitário:</Text>
                                      <InputNumber
                                        size="small"
                                        style={{ width: 100, marginLeft: 8 }}
                                        min={0.01}
                                        step={0.01}
                                        precision={2}
                                        defaultValue={item.valor}
                                        value={
                                          item.valorEditado !== undefined
                                            ? item.valorEditado
                                            : item.valor
                                        }
                                        onChange={(valor) =>
                                          editarValorProduto(item.id, valor)
                                        }
                                        bordered={true}
                                        controls={false}
                                        addonBefore="R$"
                                      />
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                      }}
                                    >
                                      <Text strong>
                                        Total: R${" "}
                                        {money(
                                          (item.valorEditado !== undefined
                                            ? item.valorEditado
                                            : item.valor) * item.qtd
                                        )}
                                      </Text>
                                    </div>
                                  </div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Nenhum produto adicionado"
                        style={{ margin: "20px 0" }}
                      />
                    )}
                  </Card>
                )}

                {activeTab === "summary" && (
                  <>
                    {resumoVendas.total > 0 && (
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
                  </>
                )}

                {/* Botão flutuante para finalizar venda no mobile */}
                {venda.length > 0 && (
                  <div
                    style={{
                      position: "fixed",
                      bottom: 0,
                      left: 0,
                      width: "100%",
                      padding: "10px 16px",
                      background: "#fff",
                      boxShadow: "0 -2px 8px rgba(0,0,0,0.15)",
                      zIndex: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <Text>Total: </Text>
                      <Text strong style={{ fontSize: 18, color: "#cf1322" }}>
                        R$ {money(totalVendaAtual)}
                      </Text>
                    </div>
                    <Button
                      type="primary"
                      size="middle"
                      icon={<DollarOutlined />}
                      onClick={handleFinalizarVenda}
                    >
                      Finalizar
                    </Button>
                  </div>
                )}
              </Content>
            ) : (
              /* Interface Desktop */
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
                            style={{ marginRight: 8 }}
                          >
                            Buscar
                          </Button>
                          <Button
                            type="default"
                            icon={<CameraOutlined />}
                            size="large"
                            onClick={startBarcodeScanner}
                          >
                            Escanear
                          </Button>
                        </div>

                        <Search
                          ref={searchInputRef}
                          placeholder="Buscar produto por nome..."
                          onChange={(e) =>
                            setBusca(e.target?.value?.toLowerCase())
                          }
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
                  collapsed={siderCollapsed}
                  onCollapse={(collapsed) => setSiderCollapsed(collapsed)}
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
                            style={{
                              marginLeft: 8,
                              backgroundColor: "#52c41a",
                            }}
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
                          style={{
                            flex: 1,
                            overflow: "auto",
                            marginBottom: 16,
                          }}
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
                                    size="small"
                                  />,
                                ]}
                              >
                                <List.Item.Meta
                                  title={
                                    <div style={{ fontSize: 14 }}>
                                      <Text strong>
                                        {item.descricao.toUpperCase()}
                                      </Text>
                                      <Text
                                        type="secondary"
                                        style={{ marginLeft: 8 }}
                                      >
                                        #{item.id}
                                      </Text>
                                    </div>
                                  }
                                  description={
                                    <div>
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          marginTop: 8,
                                          marginBottom: 8,
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
                                      </div>

                                      <div style={{ marginTop: 8 }}>
                                        <div style={{ marginBottom: 8 }}>
                                          <Text>Valor unitário:</Text>
                                          <InputNumber
                                            size="small"
                                            style={{
                                              width: 100,
                                              marginLeft: 8,
                                            }}
                                            min={0.01}
                                            step={0.01}
                                            precision={2}
                                            defaultValue={item.valor}
                                            value={
                                              item.valorEditado !== undefined
                                                ? item.valorEditado
                                                : item.valor
                                            }
                                            onChange={(valor) =>
                                              editarValorProduto(item.id, valor)
                                            }
                                            bordered={true}
                                            controls={false}
                                            addonBefore="R$"
                                          />
                                        </div>
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "flex-end",
                                          }}
                                        >
                                          <Text strong>
                                            Total: R${" "}
                                            {money(
                                              (item.valorEditado !== undefined
                                                ? item.valorEditado
                                                : item.valor) * item.qtd
                                            )}
                                          </Text>
                                        </div>
                                      </div>
                                    </div>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        </div>

                        <div
                          style={{
                            borderTop: "1px solid #e8e8e8",
                            paddingTop: 16,
                          }}
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
                              <Switch
                                onChange={(checked) => setMakePdf(checked)}
                                checkedChildren="Com COMPROVANTE!"
                                unCheckedChildren="Sem COMPROVANTE!"
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
          </>
        )}
      </Layout>

      {/* Drawer para menu mobile */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setMobileDrawerVisible(false)}
        open={mobileDrawerVisible}
        width={250}
      >
        <div style={{ marginBottom: 20 }}>
          <Statistic
            title="Caixa"
            value={caixaAberto ? `#${caixa?.id} - Aberto` : "Fechado"}
            valueStyle={{ color: caixaAberto ? "#3f8600" : "#cf1322" }}
            prefix={
              caixaAberto ? <CheckCircleOutlined /> : <CloseCircleOutlined />
            }
          />
          {caixaAberto && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Aberto em: {horaAbertura}</Text>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          {caixaAberto ? (
            <Button
              type="primary"
              danger
              icon={<CloseCircleOutlined />}
              block
              onClick={() => {
                setMobileDrawerVisible(false);
                fecharCaixa();
              }}
            >
              Fechar Caixa
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              block
              onClick={() => {
                setMobileDrawerVisible(false);
                abrirCaixa();
              }}
            >
              Abrir Caixa
            </Button>
          )}
        </div>

        <Divider />

        {caixaAberto && (
          <>
            <div>
              <List>
                <List.Item
                  onClick={() => {
                    setActiveTab("products");
                    setMobileDrawerVisible(false);
                  }}
                >
                  <List.Item.Meta
                    avatar={<ShoppingOutlined />}
                    title="Produtos"
                    description="Buscar e adicionar produtos"
                  />
                </List.Item>
                <List.Item
                  onClick={() => {
                    setActiveTab("cart");
                    setMobileDrawerVisible(false);
                  }}
                >
                  <List.Item.Meta
                    avatar={<ShoppingCartOutlined />}
                    title="Carrinho"
                    description={`${venda.length} itens no carrinho`}
                  />
                </List.Item>
                <List.Item
                  onClick={() => {
                    setActiveTab("summary");
                    setMobileDrawerVisible(false);
                  }}
                >
                  <List.Item.Meta
                    avatar={<BarChartOutlined />}
                    title="Resumo do Dia"
                    description="Ver vendas e totais"
                  />
                </List.Item>
              </List>
            </div>

            {venda.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <Button
                  type="primary"
                  icon={<DollarOutlined />}
                  block
                  onClick={() => {
                    setMobileDrawerVisible(false);
                    handleFinalizarVenda();
                  }}
                >
                  Finalizar Venda (R$ {money(totalVendaAtual)})
                </Button>
              </div>
            )}
          </>
        )}
      </Drawer>

      {/* Drawer para adicionar produto */}
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
        width={isMobile ? "80%" : 400}
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

      {/* Modal de finalização de venda */}
      <Modal
        title="Finalizar Venda"
        open={showPaymentModal}
        onCancel={() => setShowPaymentModal(false)}
        footer={null}
        width={isMobile ? "95%" : 700}
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
            <Divider orientation="left">Formas de Pagamento</Divider>
            <Alert
              message="Selecione até duas formas de pagamento"
              description="Para pagamento com múltiplas formas, você precisará informar o valor para cada método."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {/* Botões de seleção de pagamento */}
            <Space
              size="large"
              style={{
                width: "100%",
                justifyContent: isMobile ? "space-between" : "space-around",
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <Button
                type={
                  formaPagamento.includes("dinheiro") ? "primary" : "default"
                }
                size="large"
                icon={<DollarOutlined />}
                onClick={() => toggleFormaPagamento("dinheiro")}
                style={{
                  height: isMobile ? 60 : 80,
                  width: isMobile ? "46%" : 120,
                  margin: isMobile ? "4px 0" : 0,
                  background: formaPagamento.includes("dinheiro")
                    ? "#1890ff"
                    : undefined,
                  borderColor: formaPagamento.includes("dinheiro")
                    ? "#1890ff"
                    : undefined,
                }}
              >
                Dinheiro
              </Button>
              <Button
                type={formaPagamento.includes("pix") ? "primary" : "default"}
                size="large"
                onClick={() => toggleFormaPagamento("pix")}
                style={{
                  height: isMobile ? 60 : 80,
                  width: isMobile ? "46%" : 120,
                  margin: isMobile ? "4px 0" : 0,
                  background: formaPagamento.includes("pix")
                    ? "#52c41a"
                    : undefined,
                  borderColor: formaPagamento.includes("pix")
                    ? "#52c41a"
                    : undefined,
                }}
              >
                PIX
              </Button>
              <Button
                type={
                  formaPagamento.includes("credito") ? "primary" : "default"
                }
                size="large"
                onClick={() => toggleFormaPagamento("credito")}
                style={{
                  height: isMobile ? 60 : 80,
                  width: isMobile ? "46%" : 120,
                  margin: isMobile ? "4px 0" : 0,
                  background: formaPagamento.includes("credito")
                    ? "#722ed1"
                    : undefined,
                  borderColor: formaPagamento.includes("credito")
                    ? "#722ed1"
                    : undefined,
                }}
              >
                Crédito
              </Button>
              <Button
                type={formaPagamento.includes("debito") ? "primary" : "default"}
                size="large"
                onClick={() => toggleFormaPagamento("debito")}
                style={{
                  height: isMobile ? 60 : 80,
                  width: isMobile ? "46%" : 120,
                  margin: isMobile ? "4px 0" : 0,
                  background: formaPagamento.includes("debito")
                    ? "#fa8c16"
                    : undefined,
                  borderColor: formaPagamento.includes("debito")
                    ? "#fa8c16"
                    : undefined,
                }}
              >
                Débito
              </Button>
            </Space>
          </Col>

          {/* Seção para inserir valores por forma de pagamento */}
          {formaPagamento.length > 0 && (
            <Col span={24}>
              <Divider orientation="left">
                Valores por Forma de Pagamento
              </Divider>
              <Form layout="vertical">
                {formaPagamento.map((forma, index) => (
                  <Form.Item
                    key={forma}
                    label={`Valor ${
                      index === 0 ? "Primeira" : "Segunda"
                    } Forma (${
                      forma.charAt(0).toUpperCase() + forma.slice(1)
                    })`}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      size="large"
                      min={0.01}
                      max={
                        formaPagamento.length === 1
                          ? totalVendaAtual
                          : index === 0
                          ? totalVendaAtual - 0.01
                          : remainingAmount
                      }
                      step={1}
                      precision={2}
                      prefix="R$"
                      value={valoresPorForma[forma]}
                      onChange={(value) =>
                        handleValorPagamentoChange(forma, value)
                      }
                      autoFocus={index === 0}
                    />
                  </Form.Item>
                ))}

                {/* Seção específica para pagamento em dinheiro */}
                {formaPagamento.includes("dinheiro") && (
                  <>
                    <Form.Item label="Valor Recebido em Dinheiro">
                      <InputNumber
                        style={{ width: "100%" }}
                        size="large"
                        min={valoresPorForma["dinheiro"] || 0}
                        step={1}
                        precision={2}
                        prefix="R$"
                        value={valorRecebido}
                        onChange={setValorRecebido}
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
                    </Row>
                  </>
                )}

                {/* Resumo de pagamento e validação */}
                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={isMobile ? 24 : 12}>
                    <Statistic
                      title="Total Pago"
                      value={totalPago}
                      precision={2}
                      prefix="R$"
                      valueStyle={{
                        color:
                          totalPago === totalVendaAtual ? "#3f8600" : "#cf1322",
                      }}
                    />

                    {totalPago !== totalVendaAtual && (
                      <Alert
                        message={
                          totalPago > totalVendaAtual
                            ? `Valor excede o total em R$ ${(
                                totalPago - totalVendaAtual
                              ).toFixed(2)}`
                            : `Faltam R$ ${(
                                totalVendaAtual - totalPago
                              ).toFixed(2)}`
                        }
                        type={totalPago > totalVendaAtual ? "warning" : "error"}
                        style={{ marginTop: 8 }}
                        showIcon
                      />
                    )}
                  </Col>

                  <Col
                    span={isMobile ? 24 : 12}
                    style={{
                      textAlign: isMobile ? "center" : "right",
                      marginTop: isMobile ? 16 : 0,
                    }}
                  >
                    <Button
                      type="primary"
                      size="large"
                      onClick={finalizarVenda}
                      disabled={
                        totalPago !== totalVendaAtual ||
                        (formaPagamento.includes("dinheiro") &&
                          valorRecebido < valoresPorForma["dinheiro"])
                      }
                    >
                      Concluir Venda
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Col>
          )}
        </Row>
      </Modal>

      {/* Modal de sucesso após finalizar venda */}
      <Modal
        visible={successModal}
        footer={null}
        onCancel={() => setSuccessModal(false)}
        width={isMobile ? "90%" : 400}
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

      {/* Modal de visualização da impressão do cupom */}
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

      {/* Modal de fechamento de caixa */}
      <Modal
        title="Fechar Caixa"
        open={modalFechamento}
        onOk={confirmarFechamento}
        onCancel={() => setModalFechamento(false)}
        width={isMobile ? "95%" : 700}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
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
          <Col xs={24} md={12} style={{ marginTop: isMobile ? 16 : 0 }}>
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

      {/* Modal para Scanner de Código de Barras */}
      <Modal
        title="Leitor de Código de Barras"
        open={showBarcodeScanner}
        onCancel={() => setShowBarcodeScanner(false)}
        footer={null}
        width={isMobile ? "95%" : 650}
        bodyStyle={{ padding: "12px" }}
        centered={true}
        destroyOnClose={true}
        style={{ top: isMobile ? 20 : 100 }}
        wrapClassName="barcode-scanner-modal"
      >
        <BarcodeScannerComponent
          onDetect={handleBarcodeDetected}
          onClose={() => setShowBarcodeScanner(false)}
        />
      </Modal>
    </Layout>
  );
};

export default Caixa;
