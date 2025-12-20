import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import {
  Layout,
  notification,
  Badge,
  Button,
  Typography,
  ConfigProvider,
} from "antd";
import {
  ShoppingCartOutlined,
  AppstoreOutlined,
  ScanOutlined,
  UserOutlined,
  DollarOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
import { findProductByCode } from "helpers/api-integrator";
import { openCaixa } from "helpers/caixa.adapter";
import { UserContext } from "context/UserContext";
import { getCaixaEmAberto } from "helpers/caixa.adapter";
import { vendaFinaliza } from "helpers/caixa.adapter";
import { getResumoVendas } from "helpers/caixa.adapter";
import { fechaCaixa } from "helpers/caixa.adapter";
import { getSells } from "helpers/api-integrator";
import moment from "moment";
import { calcularTotalItens } from "./Vendas";
import { useCupomGenerator } from "components/cupomGenerator";

// Componentes
import CheckoutHeader from "components/Checkout/CheckoutHeader";
import ProductList from "components/Checkout/ProductList";
import ShoppingCart from "components/Checkout/ShoppingCart";
import PaymentModal from "components/Checkout/PaymentModal";
import BarcodeScanner from "components/Checkout/BarcodeScanner";
import OpenCaixaModal from "components/Checkout/OpenCaixaModal";
import CloseCaixaModal from "components/Checkout/CloseCaixaModal";
import ClienteSelector from "components/Checkout/ClienteSelector";

const { Content } = Layout;

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
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    zIndex: 100,
  },
  header: {
    background: "transparent",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "600",
    margin: 0,
  },
  headerInfo: {
    color: "rgba(255,255,255,0.9)",
    fontSize: "12px",
  },
  content: {
    flex: 1,
    background: "#f8f9fa",
    borderTopLeftRadius: "24px",
    borderTopRightRadius: "24px",
    padding: "16px",
    paddingBottom: "90px",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    maxWidth: "100vw",
    boxSizing: "border-box",
    minHeight: 0,
  },
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: "70px",
    background: "#fff",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: "env(safe-area-inset-bottom)",
    zIndex: 9999,
    transform: "translateZ(0)",
    WebkitTransform: "translateZ(0)",
  },
  navItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 16px",
    borderRadius: "12px",
    transition: "all 0.2s ease",
    cursor: "pointer",
    minWidth: "60px",
  },
  navItemActive: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
  },
  navIcon: {
    fontSize: "22px",
    marginBottom: "2px",
  },
  navLabel: {
    fontSize: "10px",
    fontWeight: "500",
  },
  floatingTotal: {
    position: "fixed",
    bottom: "90px",
    right: "16px",
    background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "50px",
    boxShadow: "0 4px 20px rgba(17,153,142,0.4)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    zIndex: 9998,
    fontWeight: "600",
    fontSize: "13px",
  },
};

const Checkout = () => {
  const { user } = useContext(UserContext);
  const { gerarCupomComPreview } = useCupomGenerator();
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [venda, setVenda] = useState([]);
  const [caixa, setCaixa] = useState(null);
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [resumoVendas, setResumoVendas] = useState({});
  const [horaAbertura, setHoraAbertura] = useState("");
  const [valorAbertura, setValorAbertura] = useState(0);
  const [vendas, setVendas] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Estados para mobile
  const [activeTab, setActiveTab] = useState("produtos");

  // Estados para modais
  const [modalPagamentoVisible, setModalPagamentoVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [modalAbrirCaixaVisible, setModalAbrirCaixaVisible] = useState(false);
  const [modalFecharCaixaVisible, setModalFecharCaixaVisible] = useState(false);

  // Estados para pagamento
  const [formaPagamento, setFormaPagamento] = useState([]);
  const [valoresPorForma, setValoresPorForma] = useState({});
  const [valorRecebido, setValorRecebido] = useState(0);
  const [gerarCupomState, setGerarCupomState] = useState(false);
  const [cupomCnpj, setCupomCnpj] = useState("");
  const [cupomObs, setCupomObs] = useState("");

  // Estados para busca
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");

  // Estados para cliente
  const [selectedCliente, setSelectedCliente] = useState(null);

  // Verificar responsividade
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setSidebarCollapsed(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Verificar caixa aberto
  const caixaEmAberto = async () => {
    try {
      setLoading(true);
      const resultCx = await getCaixaEmAberto();

      // Verificar se a resposta é válida
      if (!resultCx || !resultCx.data) {
        notification.warning({
          message: "Atenção!",
          description: "Abra um caixa para começar a vender.",
        });
        return;
      }

      const caixas = Array.isArray(resultCx.data) ? resultCx.data : [];

      if (caixas.length === 0) {
        notification.warning({
          message: "Atenção!",
          description: "Abra um caixa para começar a vender.",
        });
        return;
      }

      if (caixas.length > 1) {
        notification.warning({
          message: "Atenção!",
          description: "Existe um caixa aberto de um dia anterior.",
        });
      }

      const cx = caixas[caixas.length - 1];
      if (cx) {
        setCaixa(cx);
        setCaixaAberto(true);
        setHoraAbertura(moment(cx.createdAt).format("DD/MM/YYYY HH:mm"));
        setValorAbertura(cx.saldoInicial || 0);
        await getResumoCaixa(cx.id);
        await getVendas();
      }
    } catch (error) {
      console.error("Erro ao verificar caixa:", error);
      notification.error({
        message: "Erro",
        description: "Não foi possível verificar o caixa: " + (error?.message || "Erro desconhecido"),
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar resumo do caixa
  const getResumoCaixa = async (caixaID) => {
    try {
      const result = await getResumoVendas(caixaID);
      if (result.data) {
        setResumoVendas(result.data);
      }
    } catch (error) {
      console.error("Erro ao buscar resumo:", error);
    }
  };

  // Carregar vendas
  const getVendas = async () => {
    try {
      const result = await getSells();
      if (result.data) {
        setVendas(result.data);
      }
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    caixaEmAberto();
  }, []);

  // Calcular total da venda atual
  const totalVendaAtual = useMemo(() => {
    return calcularTotalItens(venda);
  }, [venda]);

  // Quantidade de itens no carrinho
  const cartItemCount = useMemo(() => {
    return venda.reduce((sum, item) => sum + (item.qtd || 1), 0);
  }, [venda]);

  // Adicionar produto ao carrinho
  const adicionarProduto = (produto, qtd) => {
    const produtoExistente = venda.find((item) => item.id === produto.id);

    if (produtoExistente) {
      setVenda(
        venda.map((item) =>
          item.id === produto.id ? { ...item, qtd: item.qtd + qtd } : item
        )
      );
    } else {
      setVenda([...venda, { ...produto, qtd }]);
    }

    // No mobile, mostrar feedback visual
    if (isMobile) {
      notification.success({
        message: "Adicionado!",
        description: produto.descricao,
        duration: 1,
        placement: "top",
      });
    }
  };

  // Atualizar quantidade
  const updateQuantity = (id, newQty) => {
    setVenda(
      venda.map((item) => (item.id === id ? { ...item, qtd: newQty } : item))
    );
  };

  // Atualizar preço
  const updatePrice = (id, newPrice) => {
    setVenda(
      venda.map((item) =>
        item.id === id ? { ...item, valorEditado: newPrice } : item
      )
    );
  };

  // Remover item
  const removeItem = (item) => {
    setVenda(venda.filter((i) => i.id !== item.id));
  };

  // Busca por código de barras
  const handleBarcodeSearch = async (value) => {
    if (!value) return;

    const codigoLimpo = value.toString().trim();
    
    try {
      setLoading(true);
      const result = await findProductByCode(codigoLimpo);

      if (result.success && result.data) {
        const produto = result.data;
        adicionarProduto(produto, 1);
      } else {
        notification.warning({
          message: "Não encontrado",
          description: `Código "${codigoLimpo}" não cadastrado`,
          placement: isMobile ? "top" : "topRight",
        });
      }
    } catch (error) {
      notification.error({
        message: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Abrir scanner
  const handleOpenScanner = () => {
    setScannerVisible(true);
  };

  // Detectar código de barras
  const handleBarcodeDetected = (barcode) => {
    setScannerVisible(false);
    handleBarcodeSearch(barcode);
  };

  // Toggle forma de pagamento
  const toggleFormaPagamento = useCallback(
    (forma) => {
      if (formaPagamento.includes(forma)) {
        setFormaPagamento(formaPagamento.filter((f) => f !== forma));
        const novosValores = { ...valoresPorForma };
        delete novosValores[forma];
        setValoresPorForma(novosValores);
      } else {
        if (formaPagamento.length < 2) {
          setFormaPagamento([...formaPagamento, forma]);
          if (formaPagamento.length === 0) {
            setValoresPorForma({ [forma]: totalVendaAtual });
          }
        }
      }
    },
    [formaPagamento, valoresPorForma, totalVendaAtual]
  );

  // Alterar valor por forma de pagamento
  const handleValorPagamentoChange = useCallback(
    (forma, valor) => {
      setValoresPorForma({ ...valoresPorForma, [forma]: valor });
    },
    [valoresPorForma]
  );

  // Calcular total pago
  const totalPago = useMemo(() => {
    return Object.values(valoresPorForma).reduce(
      (sum, valor) => sum + (valor || 0),
      0
    );
  }, [valoresPorForma]);

  // Calcular troco
  const troco = useMemo(() => {
    if (!formaPagamento.includes("dinheiro")) return 0;
    const valorDinheiro = valoresPorForma["dinheiro"] || 0;
    return Math.max(0, valorRecebido - valorDinheiro);
  }, [valorRecebido, valoresPorForma, formaPagamento]);

  // Finalizar venda
  const handleFinalizarVenda = useCallback(() => {
    if (venda.length === 0) {
      notification.warning({
        message: "Carrinho vazio",
        description: "Adicione produtos antes de finalizar.",
      });
      return;
    }

    if (!caixaAberto) {
      notification.warning({
        message: "Caixa fechado",
        description: "Abra um caixa primeiro.",
      });
      return;
    }

    setModalPagamentoVisible(true);
  }, [venda.length, caixaAberto]);

  // Confirmar finalização
  const finalizarVenda = useCallback(async () => {
    try {
      setLoading(true);

      const infoPagamento = {
        formaPagamento,
        valoresPorForma,
        valorRecebido,
        troco,
      };

      const opcoesCupom = {
        gerarCupom: gerarCupomState,
        cnpj: cupomCnpj,
        observacoes: cupomObs,
      };

      const vendaSalva = await vendaFinaliza(
        venda,
        infoPagamento,
        opcoesCupom,
        caixa?.id,
        selectedCliente
      );

      if (gerarCupomState && vendaSalva.data) {
        try {
          const dadosVenda = {
            ...vendaSalva.data,
            produtos: venda.map((item) => ({
              ...item,
              quantidade: parseInt(item.qtd) || 0,
              valorUnitario: parseFloat(item.valorEditado ?? item.valor) || 0,
            })),
            valorRecebido,
            troco,
            cnpjCliente: cupomCnpj,
            observacoes: cupomObs,
          };
          await gerarCupomComPreview(dadosVenda);
        } catch (error) {
          console.error("Erro ao gerar cupom:", error);
        }
      }

      // Limpar estados
      setVenda([]);
      setFormaPagamento([]);
      setValoresPorForma({});
      setValorRecebido(0);
      setGerarCupomState(false);
      setCupomCnpj("");
      setCupomObs("");
      setSelectedCliente(null);
      setModalPagamentoVisible(false);

      await getResumoCaixa(caixa.id);
      await getVendas();

      notification.success({
        message: "Venda finalizada! ✓",
        placement: isMobile ? "top" : "topRight",
      });
    } catch (error) {
      notification.error({
        message: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [
    formaPagamento,
    valoresPorForma,
    valorRecebido,
    troco,
    gerarCupomState,
    cupomCnpj,
    cupomObs,
    venda,
    caixa?.id,
    selectedCliente,
    isMobile,
  ]);

  // Abrir caixa
  const handleOpenCaixa = useCallback(() => {
    setModalAbrirCaixaVisible(true);
  }, []);

  // Confirmar abertura de caixa
  const handleConfirmOpenCaixa = useCallback(async (valorAberturaTemp) => {
    try {
      setLoading(true);
      await openCaixa(valorAberturaTemp);
      setModalAbrirCaixaVisible(false);
      await caixaEmAberto();
      notification.success({
        message: "Caixa aberto!",
        description: `Saldo inicial: R$ ${valorAberturaTemp.toFixed(2).replace(".", ",")}`,
      });
    } catch (error) {
      notification.error({
        message: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Abrir modal de fechamento de caixa
  const handleCloseCaixa = useCallback(() => {
    setModalFecharCaixaVisible(true);
  }, []);

  // Confirmar fechamento de caixa
  const handleConfirmCloseCaixa = useCallback(async (caixaId, saldoFinal, diferenca) => {
    try {
      setLoading(true);
      await fechaCaixa(caixaId, null, saldoFinal, diferenca);
      setCaixaAberto(false);
      setCaixa(null);
      setResumoVendas({});
      setModalFecharCaixaVisible(false);
      notification.success({ message: "Caixa fechado com sucesso!" });
    } catch (error) {
      notification.error({ message: "Erro ao fechar caixa", description: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle sidebar
  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed]);

  // Formatar moeda
  const formatCurrency = (value) => {
    return `R$ ${(value || 0).toFixed(2).replace(".", ",")}`;
  };

  // ========== RENDER MOBILE ==========
  if (isMobile) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#667eea",
            borderRadius: 12,
          },
        }}
      >
        <div style={mobileStyles.container}>
          {/* Header Mobile */}
          <div style={mobileStyles.header}>
            <div>
              <h1 style={mobileStyles.headerTitle}>PDV</h1>
              <Text style={mobileStyles.headerInfo}>
                {caixaAberto ? `Caixa aberto • ${resumoVendas?.totalVendas || 0} vendas` : "Caixa fechado"}
              </Text>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {!caixaAberto ? (
                <Button
                  type="primary"
                  size="small"
                  onClick={handleOpenCaixa}
                  style={{ 
                    background: "rgba(255,255,255,0.2)", 
                    border: "none",
                    color: "#fff",
                  }}
                >
                  Abrir Caixa
                </Button>
              ) : (
                <Button
                  size="small"
                  onClick={handleCloseCaixa}
                  style={{ 
                    background: "rgba(255,255,255,0.2)", 
                    border: "none",
                    color: "#fff",
                  }}
                >
                  Fechar
                </Button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div style={mobileStyles.content}>
            {activeTab === "produtos" && (
              <ProductList
                loading={loading}
                onAddProduct={adicionarProduto}
                onBarcodeSearch={handleBarcodeSearch}
                onOpenScanner={handleOpenScanner}
                isMobile={true}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            )}

            {activeTab === "carrinho" && (
              <div style={{ height: "100%" }}>
                <ClienteSelector
                  selectedCliente={selectedCliente}
                  onClienteSelect={setSelectedCliente}
                  onClienteChange={(cliente) => {
                    setSelectedCliente(cliente);
                    if (cliente?.cpf_cnpj) setCupomCnpj(cliente.cpf_cnpj);
                  }}
                />
                <ShoppingCart
                  venda={venda}
                  removeItem={removeItem}
                  updateQuantity={updateQuantity}
                  updatePrice={updatePrice}
                  totalVendaAtual={totalVendaAtual}
                  isMobile={true}
                  onFinalizarVenda={handleFinalizarVenda}
                  loading={loading}
                  caixaAberto={caixaAberto}
                />
              </div>
            )}
          </div>

          {/* Floating Total - Mostra quando tem itens no carrinho e está na aba de produtos */}
          {cartItemCount > 0 && activeTab === "produtos" && (
            <div 
              style={mobileStyles.floatingTotal}
              onClick={() => setActiveTab("carrinho")}
            >
              <ShoppingCartOutlined style={{ fontSize: "18px" }} />
              <span>{formatCurrency(totalVendaAtual)}</span>
              <Badge 
                count={cartItemCount} 
                size="small"
                style={{ 
                  backgroundColor: "#fff", 
                  color: "#11998e",
                  fontWeight: "bold",
                }}
              />
            </div>
          )}

          {/* Bottom Navigation */}
          <div style={mobileStyles.bottomNav}>
            <div
              style={{
                ...mobileStyles.navItem,
                ...(activeTab === "produtos" ? mobileStyles.navItemActive : {}),
              }}
              onClick={() => setActiveTab("produtos")}
            >
              <AppstoreOutlined 
                style={{ 
                  ...mobileStyles.navIcon,
                  color: activeTab === "produtos" ? "#fff" : "#666",
                }} 
              />
              <span 
                style={{ 
                  ...mobileStyles.navLabel,
                  color: activeTab === "produtos" ? "#fff" : "#666",
                }}
              >
                Produtos
              </span>
            </div>

            <div
              style={{
                ...mobileStyles.navItem,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                marginTop: "-30px",
                boxShadow: "0 4px 15px rgba(102,126,234,0.4)",
              }}
              onClick={handleOpenScanner}
            >
              <ScanOutlined style={{ fontSize: "24px", color: "#fff" }} />
            </div>

            <div
              style={{
                ...mobileStyles.navItem,
                ...(activeTab === "carrinho" ? mobileStyles.navItemActive : {}),
              }}
              onClick={() => setActiveTab("carrinho")}
            >
              <Badge count={cartItemCount} size="small" offset={[-2, 0]}>
                <ShoppingCartOutlined 
                  style={{ 
                    ...mobileStyles.navIcon,
                    color: activeTab === "carrinho" ? "#fff" : "#666",
                  }} 
                />
              </Badge>
              <span 
                style={{ 
                  ...mobileStyles.navLabel,
                  color: activeTab === "carrinho" ? "#fff" : "#666",
                }}
              >
                Carrinho
              </span>
            </div>
          </div>

          {/* Modais */}
          <PaymentModal
            visible={modalPagamentoVisible}
            onCancel={() => setModalPagamentoVisible(false)}
            onConfirm={finalizarVenda}
            totalVendaAtual={totalVendaAtual}
            formaPagamento={formaPagamento}
            valoresPorForma={valoresPorForma}
            toggleFormaPagamento={toggleFormaPagamento}
            handleValorPagamentoChange={handleValorPagamentoChange}
            valorRecebido={valorRecebido}
            setValorRecebido={setValorRecebido}
            troco={troco}
            totalPago={totalPago}
            isMobile={true}
            gerarCupomState={gerarCupomState}
            setGerarCupomState={setGerarCupomState}
            cupomCnpj={cupomCnpj}
            setCupomCnpj={setCupomCnpj}
            cupomObs={cupomObs}
            setCupomObs={setCupomObs}
            loading={loading}
          />

          <BarcodeScanner
            visible={scannerVisible}
            onDetect={handleBarcodeDetected}
            onClose={() => setScannerVisible(false)}
          />

          <OpenCaixaModal
            visible={modalAbrirCaixaVisible}
            onCancel={() => setModalAbrirCaixaVisible(false)}
            onConfirm={handleConfirmOpenCaixa}
            loading={loading}
          />

          <CloseCaixaModal
            visible={modalFecharCaixaVisible}
            onCancel={() => setModalFecharCaixaVisible(false)}
            onConfirm={handleConfirmCloseCaixa}
            loading={loading}
            caixa={caixa}
            resumoVendas={resumoVendas}
            valorAbertura={valorAbertura}
          />
        </div>
      </ConfigProvider>
    );
  }

  // ========== RENDER DESKTOP ==========
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <CheckoutHeader
        caixa={caixa}
        caixaAberto={caixaAberto}
        resumoVendas={resumoVendas}
        horaAbertura={horaAbertura}
        valorAbertura={valorAbertura}
        isMobile={isMobile}
        onOpenCaixa={handleOpenCaixa}
        onCloseCaixa={handleCloseCaixa}
        onToggleSidebar={handleToggleSidebar}
        user={user}
      />

      <Layout>
        <Content
          style={{
            padding: "16px",
            background: "#f5f5f5",
            height: "calc(100vh - 70px)",
            maxHeight: "calc(100vh - 70px)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              gap: "12px",
              flexDirection: "row",
              minHeight: 0,
            }}
          >
            {/* Lista de Produtos */}
            <div
              style={{
                flex: 2,
                minWidth: 0,
                maxWidth: "45%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <ProductList
                loading={loading}
                onAddProduct={adicionarProduto}
                onBarcodeSearch={handleBarcodeSearch}
                onOpenScanner={handleOpenScanner}
                isMobile={false}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            </div>

            {/* Carrinho de Compras */}
            <div
              style={{
                flex: 3,
                minWidth: "450px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <ClienteSelector
                selectedCliente={selectedCliente}
                onClienteSelect={setSelectedCliente}
                onClienteChange={(cliente) => {
                  setSelectedCliente(cliente);
                  if (cliente?.cpf_cnpj) setCupomCnpj(cliente.cpf_cnpj);
                }}
              />
              <ShoppingCart
                venda={venda}
                removeItem={removeItem}
                updateQuantity={updateQuantity}
                updatePrice={updatePrice}
                totalVendaAtual={totalVendaAtual}
                isMobile={false}
                onFinalizarVenda={handleFinalizarVenda}
                loading={loading}
                caixaAberto={caixaAberto}
              />
            </div>
          </div>
        </Content>
      </Layout>

      {/* Modais */}
      <PaymentModal
        visible={modalPagamentoVisible}
        onCancel={() => setModalPagamentoVisible(false)}
        onConfirm={finalizarVenda}
        totalVendaAtual={totalVendaAtual}
        formaPagamento={formaPagamento}
        valoresPorForma={valoresPorForma}
        toggleFormaPagamento={toggleFormaPagamento}
        handleValorPagamentoChange={handleValorPagamentoChange}
        valorRecebido={valorRecebido}
        setValorRecebido={setValorRecebido}
        troco={troco}
        totalPago={totalPago}
        isMobile={false}
        gerarCupomState={gerarCupomState}
        setGerarCupomState={setGerarCupomState}
        cupomCnpj={cupomCnpj}
        setCupomCnpj={setCupomCnpj}
        cupomObs={cupomObs}
        setCupomObs={setCupomObs}
        loading={loading}
      />

      <BarcodeScanner
        visible={scannerVisible}
        onDetect={handleBarcodeDetected}
        onClose={() => setScannerVisible(false)}
      />

      <OpenCaixaModal
        visible={modalAbrirCaixaVisible}
        onCancel={() => setModalAbrirCaixaVisible(false)}
        onConfirm={handleConfirmOpenCaixa}
        loading={loading}
      />

      <CloseCaixaModal
        visible={modalFecharCaixaVisible}
        onCancel={() => setModalFecharCaixaVisible(false)}
        onConfirm={handleConfirmCloseCaixa}
        loading={loading}
        caixa={caixa}
        resumoVendas={resumoVendas}
        valorAbertura={valorAbertura}
      />
    </Layout>
  );
};

export default Checkout;
