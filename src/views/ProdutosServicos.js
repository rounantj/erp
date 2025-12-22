import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Layout,
  Card,
  Table,
  Button,
  Input,
  Modal,
  Form,
  Select,
  InputNumber,
  Typography,
  Space,
  Tag,
  Divider,
  Breadcrumb,
  Statistic,
  Row,
  Col,
  Empty,
  Tooltip,
  ConfigProvider,
  Spin,
  FloatButton,
  Avatar,
  message,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
  ShoppingOutlined,
  TagOutlined,
  BarcodeOutlined,
  FileTextOutlined,
  CameraOutlined,
  HomeOutlined,
  AppstoreOutlined,
  MenuOutlined,
  UploadOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import BarcodeScanner from "components/Checkout/BarcodeScanner";
import { UserContext } from "context/UserContext";

// Import API helpers
import {
  getProducts,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from "helpers/api-integrator";

const { Header, Content } = Layout;
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
    background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
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
  statsRow: {
    display: "flex",
    gap: "12px",
    marginTop: "12px",
  },
  statCard: {
    flex: 1,
    background: "rgba(255,255,255,0.2)",
    borderRadius: "12px",
    padding: "10px",
    textAlign: "center",
  },
  statValue: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "700",
    display: "block",
  },
  statLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: "10px",
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
  productCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  productName: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "4px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  productPrice: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#11998e",
  },
  productCategory: {
    fontSize: "10px",
    marginRight: "6px",
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

const ProductAndServiceTable = () => {
  // State management
  const [form] = Form.useForm();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [productStats, setProductStats] = useState({
    total: 0,
    categories: 0,
    avgPrice: 0,
  });
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [eanScannerVisible, setEanScannerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageModalData, setImageModalData] = useState({ url: null, name: "" });

  // Abrir modal de visualização da imagem
  const openImageModal = (imageUrl, productName) => {
    if (imageUrl) {
      setImageModalData({ url: imageUrl, name: productName });
      setImageModalVisible(true);
    }
  };

  // References and context
  const { user } = useContext(UserContext);
  const searchInput = useRef(null);
  const fileInputRef = useRef(null);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Format money values
  const formatCurrency = (value) => {
    return `R$ ${parseFloat(value || 0)
      .toFixed(2)
      .replace(".", ",")}`;
  };

  // Calculate product statistics
  const calculateStats = (productsList) => {
    if (!productsList.length) return;

    const total = productsList.length;
    const uniqueCategories = new Set(productsList.map((p) => p.categoria)).size;
    const totalPrice = productsList.reduce(
      (sum, product) => sum + (parseFloat(product.valor) || 0),
      0
    );
    const avgPrice = totalPrice / total;

    setProductStats({
      total,
      categories: uniqueCategories,
      avgPrice,
    });
  };

  // Fetch products from API - memoizado
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProducts();
      if (result.success) {
        // Normalize data
        const normalizedData = result.data.map((item, index) => ({
          key: item.id || index.toString(),
          id: item.id,
          categoria: item.categoria || "",
          ean: item.ean || "",
          ncm: item.ncm || "",
          valor: parseFloat(item.valor) || 0,
          descricao: item.descricao || "",
          imageUrl: item.imageUrl || null,
        }));

        setProducts(normalizedData);
        calculateStats(normalizedData);
      } else {
        Modal.error({
          title: "Erro ao carregar produtos",
          content: "Não foi possível buscar os produtos. Tente novamente.",
        });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      Modal.error({
        title: "Erro ao carregar produtos",
        content: "Ocorreu um erro ao buscar os produtos.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter products based on search - memoizado para performance
  const filteredProducts = useMemo(() => {
    if (!searchText) return products;

    const searchTerm = searchText.toLowerCase();
    return products.filter(
      (item) =>
        (item.categoria?.toLowerCase() || "").includes(searchTerm) ||
        (item.ncm?.toLowerCase() || "").includes(searchTerm) ||
        (item.ean?.toLowerCase() || "").includes(searchTerm) ||
        (item.descricao?.toLowerCase() || "").includes(searchTerm) ||
        formatCurrency(item.valor).toLowerCase().includes(searchTerm)
    );
  }, [products, searchText]);

  // Handle form submission
  const handleFormSubmit = async (values) => {
    try {
      const productData = {
        ...values,
        id: editingProduct?.id,
      };

      const result = await updateProduct(productData);

      if (result.success) {
        const actionText = editingProduct
          ? "atualizado"
          : form.getFieldValue("descricao")?.startsWith("Cópia de")
          ? "duplicado"
          : "adicionado";

        Modal.success({
          title: editingProduct
            ? "Produto atualizado"
            : form.getFieldValue("descricao")?.startsWith("Cópia de")
            ? "Produto duplicado"
            : "Produto adicionado",
          content: `${values.descricao} foi ${actionText} com sucesso.`,
        });

        setModalVisible(false);
        fetchProducts();
      } else {
        Modal.error({
          title: "Operação falhou",
          content: result.message || "Tente novamente.",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      Modal.error({
        title: "Erro ao salvar produto",
        content: "Ocorreu um erro ao processar sua solicitação.",
      });
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirm = (product) => {
    setProductToDelete(product);
    setDeleteModalVisible(true);
  };

  // Handle product deletion
  const handleDelete = async () => {
    if (!productToDelete) return;

    setDeletingProduct(true);
    try {
      const result = await deleteProduct(productToDelete.id);

      if (result.success) {
        Modal.success({
          title: "Produto excluído",
          content: `${productToDelete.descricao} foi excluído com sucesso.`,
        });
        setDeleteModalVisible(false);
        setProductToDelete(null);
        fetchProducts();
      } else {
        Modal.error({
          title: "Falha ao excluir",
          content: result.message || "Tente novamente.",
        });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      Modal.error({
        title: "Erro ao excluir produto",
        content: "Ocorreu um erro ao processar sua solicitação.",
      });
    } finally {
      setDeletingProduct(false);
    }
  };

  // Cancel delete operation
  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setProductToDelete(null);
  };

  // Handle edit button click
  const handleEdit = (record) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setImagePreview(record.imageUrl || null);
    setModalVisible(true);
  };

  // Handle duplicate button click
  const handleDuplicate = (record) => {
    setEditingProduct(null); // Ensure it's treated as a new product
    const duplicatedProduct = {
      ...record,
      descricao: `Cópia de ${record.descricao}`, // Add prefix to description
    };
    delete duplicatedProduct.id; // Remove ID so it will be created as new
    delete duplicatedProduct.key; // Remove key as well

    form.setFieldsValue(duplicatedProduct);
    setModalVisible(true);
  };

  // Handle add button click
  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setImagePreview(null);
    setModalVisible(true);
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    console.log("=== handleFileInputChange chamado ===");
    console.log("Event:", e);
    console.log("Files:", e.target.files);
    const file = e.target.files?.[0];
    if (!file) {
      console.log("Nenhum arquivo selecionado");
      return;
    }
    console.log("Arquivo selecionado:", file.name, file.type, file.size);

    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Apenas imagens são permitidas!");
      return;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("A imagem deve ter menos de 2MB!");
      return;
    }

    // Se estiver editando, faz upload direto
    if (editingProduct?.id) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        setImagePreview(base64);

        try {
          setUploadingImage(true);
          const result = await uploadProductImage(editingProduct.id, base64);

          if (result.success) {
            message.success("Imagem atualizada com sucesso!");
            setImagePreview(result.data.imageUrl);
          } else {
            message.error(result.message || "Erro ao enviar imagem");
          }
        } catch (error) {
          message.error("Erro ao fazer upload da imagem");
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Se for novo produto, apenas mostra preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target.result);
        message.info("A imagem será salva após criar o produto");
      };
      reader.readAsDataURL(file);
    }

    // Reset input para permitir selecionar o mesmo arquivo novamente
    e.target.value = "";
  };

  // Trigger file input click
  const triggerFileInput = () => {
    console.log("=== triggerFileInput chamado ===");
    console.log("fileInputRef.current:", fileInputRef.current);
    if (fileInputRef.current) {
      console.log("Chamando click() no input...");
      fileInputRef.current.click();
      console.log("click() executado");
    } else {
      console.error("ERRO: fileInputRef.current é null!");
    }
  };

  // Define table columns
  const columns = [
    {
      title: "Imagem",
      dataIndex: "imageUrl",
      key: "image",
      width: 80,
      render: (imageUrl, record) => (
        <div
          onClick={() => openImageModal(imageUrl, record.descricao)}
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            overflow: "hidden",
            background: imageUrl ? "#fff" : "#f5f5f5",
            border: "1px solid #e8e8e8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
            cursor: imageUrl ? "pointer" : "default",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            if (imageUrl) {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.06)";
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Produto"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <PictureOutlined style={{ fontSize: 20, color: "#bfbfbf" }} />
          )}
        </div>
      ),
    },
    {
      title: "Categoria",
      dataIndex: "categoria",
      key: "categoria",
      render: (text) => (
        <Tag color="blue" icon={<TagOutlined />}>
          {text || "Não categorizado"}
        </Tag>
      ),
      sorter: (a, b) => a.categoria.localeCompare(b.categoria),
    },
    {
      title: "Preço",
      dataIndex: "valor",
      key: "valor",
      render: (text) => <Text strong>{formatCurrency(text)}</Text>,
      sorter: (a, b) => a.valor - b.valor,
    },
    {
      title: "Descrição",
      dataIndex: "descricao",
      key: "descricao",
      render: (text) => (
        <Tooltip title={text}>
          <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 250 }}>
            {text.toUpperCase()}
          </Text>
        </Tooltip>
      ),
      sorter: (a, b) => a.descricao.localeCompare(b.descricao),
    },
    {
      title: "NCM",
      dataIndex: "ncm",
      key: "ncm",
      render: (text) => (
        <Text type="secondary">
          <FileTextOutlined style={{ marginRight: 5 }} />
          {text ? text.split('"')[0] : "N/A"}
        </Text>
      ),
    },
    {
      title: "EAN",
      dataIndex: "ean",
      key: "ean",
      sorter: (a, b) => a.ean - b.ean,
      render: (text) => (
        <Text type="secondary">
          <BarcodeOutlined style={{ marginRight: 5 }} />
          {text || "Não cadastrado"}
        </Text>
      ),
    },
  ];

  // Add actions column if user is admin
  if (user?.user?.role === "admin" || user?.user?.role === "atendente") {
    columns.push({
      title: "Ações",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar produto">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Duplicar produto">
            <Button
              type="default"
              icon={<CopyOutlined />}
              size="small"
              onClick={() => handleDuplicate(record)}
            />
          </Tooltip>
          <Tooltip title="Excluir produto">
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => showDeleteConfirm(record)}
            />
          </Tooltip>
        </Space>
      ),
    });
  }

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle barcode detected from scanner
  const handleBarcodeDetected = (barcode) => {
    setScannerVisible(false);
    setSearchText(barcode);

    // Verificar se encontrou algum produto
    const found = products.find(
      (p) => p.ean === barcode || p.id?.toString() === barcode
    );

    if (found) {
      Modal.success({
        title: "Produto encontrado!",
        content: `${found.descricao} - ${formatCurrency(found.valor)}`,
      });
    } else {
      Modal.info({
        title: "Produto não encontrado",
        content: `Nenhum produto com código "${barcode}" foi encontrado. Deseja cadastrar?`,
        okText: "Cadastrar",
        cancelText: "Fechar",
        onOk: () => {
          setEditingProduct(null);
          form.resetFields();
          form.setFieldsValue({ ean: barcode });
          setModalVisible(true);
        },
      });
    }
  };

  // Handle EAN barcode detected in the modal
  const handleEanDetected = (barcode) => {
    setEanScannerVisible(false);
    form.setFieldsValue({ ean: barcode });
  };

  // Verificar permissão de edição
  const canEdit =
    user?.user?.role === "admin" || user?.user?.role === "atendente";

  // ========== RENDER MOBILE ==========
  if (isMobile) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#11998e",
            borderRadius: 12,
          },
        }}
      >
        <div style={mobileStyles.container}>
          {/* Header Mobile */}
          <div style={mobileStyles.header}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                {/* Botão Menu */}
                <div
                  onClick={() => {
                    const isOpen =
                      document.documentElement.classList.contains("nav-open");
                    if (isOpen) {
                      document.documentElement.classList.remove("nav-open");
                      const existingBodyClick =
                        document.getElementById("bodyClick");
                      if (existingBodyClick)
                        existingBodyClick.parentElement.removeChild(
                          existingBodyClick
                        );
                    } else {
                      document.documentElement.classList.add("nav-open");
                      const existingBodyClick =
                        document.getElementById("bodyClick");
                      if (existingBodyClick)
                        existingBodyClick.parentElement.removeChild(
                          existingBodyClick
                        );
                      var node = document.createElement("div");
                      node.id = "bodyClick";
                      node.style.cssText =
                        "position:fixed;top:0;left:0;right:250px;bottom:0;z-index:9999;";
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
                    <AppstoreOutlined style={{ marginRight: "8px" }} />
                    Produtos
                  </h1>
                  <Text style={mobileStyles.headerSubtitle}>
                    Gerenciar produtos e serviços
                  </Text>
                </div>
              </div>
              <Button
                type="primary"
                icon={<CameraOutlined />}
                onClick={() => setScannerVisible(true)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: "10px",
                }}
              />
            </div>

            {/* Stats Row */}
            <div style={mobileStyles.statsRow}>
              <div style={mobileStyles.statCard}>
                <span style={mobileStyles.statValue}>{productStats.total}</span>
                <span style={mobileStyles.statLabel}>Produtos</span>
              </div>
              <div style={mobileStyles.statCard}>
                <span style={mobileStyles.statValue}>
                  {productStats.categories}
                </span>
                <span style={mobileStyles.statLabel}>Categorias</span>
              </div>
              <div style={mobileStyles.statCard}>
                <span style={mobileStyles.statValue}>
                  {formatCurrency(productStats.avgPrice).replace("R$ ", "")}
                </span>
                <span style={mobileStyles.statLabel}>Preço Médio</span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div style={mobileStyles.content}>
            {/* Search */}
            <div style={mobileStyles.searchContainer}>
              <Search
                placeholder="Buscar produto ou código..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                size="large"
                style={{ flex: 1, borderRadius: "12px" }}
              />
            </div>

            {/* Products List */}
            <div
              style={{
                flex: 1,
                overflow: "auto",
                minHeight: 0,
                WebkitOverflowScrolling: "touch",
              }}
            >
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <Spin size="large" />
                  <div style={{ marginTop: "12px" }}>
                    <Text type="secondary">Carregando produtos...</Text>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Nenhum produto encontrado"
                  style={{ marginTop: "40px" }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {filteredProducts.map((product) => (
                    <div key={product.id} style={mobileStyles.productCard}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        {/* Miniatura do Produto */}
                        <div
                          onClick={() =>
                            openImageModal(product.imageUrl, product.descricao)
                          }
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            overflow: "hidden",
                            background: product.imageUrl ? "#fff" : "#f5f5f5",
                            border: "1px solid #e8e8e8",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                            flexShrink: 0,
                            cursor: product.imageUrl ? "pointer" : "default",
                          }}
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.descricao}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <PictureOutlined
                              style={{ fontSize: 18, color: "#bfbfbf" }}
                            />
                          )}
                        </div>

                        <div
                          style={{ flex: 1, minWidth: 0, marginRight: "12px" }}
                        >
                          <div style={mobileStyles.productName}>
                            {product.descricao?.toUpperCase()}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              marginBottom: "6px",
                              flexWrap: "wrap",
                            }}
                          >
                            <Tag
                              color={
                                product.categoria?.toLowerCase() === "serviço"
                                  ? "green"
                                  : "blue"
                              }
                              style={mobileStyles.productCategory}
                            >
                              {product.categoria?.toUpperCase()}
                            </Tag>
                            {product.ean && (
                              <Text
                                type="secondary"
                                style={{ fontSize: "10px" }}
                              >
                                <BarcodeOutlined /> {product.ean}
                              </Text>
                            )}
                          </div>
                          <div style={mobileStyles.productPrice}>
                            {formatCurrency(product.valor)}
                          </div>
                        </div>

                        {canEdit && (
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexShrink: 0,
                            }}
                          >
                            <Button
                              type="primary"
                              icon={<EditOutlined />}
                              size="small"
                              onClick={() => handleEdit(product)}
                              style={mobileStyles.actionButton}
                            />
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              size="small"
                              onClick={() => showDeleteConfirm(product)}
                              style={mobileStyles.actionButton}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quantidade de resultados */}
            {!loading && filteredProducts.length > 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "8px 0",
                  flexShrink: 0,
                }}
              >
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "produto" : "produtos"}
                </Text>
              </div>
            )}
          </div>

          {/* Floating Add Button */}
          {canEdit && (
            <FloatButton
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{
                right: 20,
                bottom: 20,
                width: 56,
                height: 56,
              }}
            />
          )}

          {/* Modais */}
          <Modal
            title={editingProduct ? "Editar Produto" : "Adicionar Produto"}
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={null}
            destroyOnClose
            width="100%"
            style={{ top: 0, maxWidth: "100vw", margin: 0, padding: 0 }}
            styles={{ body: { padding: "16px" } }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFormSubmit}
              initialValues={{
                categoria: "produto",
                valor: 0,
                descricao: "",
                ean: "",
                ncm: "",
              }}
            >
              <Form.Item
                name="descricao"
                label="Nome do Produto"
                rules={[{ required: true, message: "Informe o nome!" }]}
              >
                <Input placeholder="Nome/descrição do produto" size="large" />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="categoria"
                    label="Categoria"
                    rules={[{ required: true, message: "Selecione!" }]}
                  >
                    <Select placeholder="Categoria" size="large">
                      <Option value="produto">Produto</Option>
                      <Option value="serviço">Serviço</Option>
                      <Option value="papelaria">Papelaria</Option>
                      <Option value="escritório">Escritório</Option>
                      <Option value="informática">Informática</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="valor"
                    label="Preço (R$)"
                    rules={[{ required: true, message: "Informe!" }]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      precision={2}
                      min={0}
                      step={0.01}
                      prefix="R$"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="ean" label="Código de Barras (EAN)">
                <Input
                  placeholder="Código de barras"
                  size="large"
                  addonAfter={
                    <CameraOutlined
                      style={{ cursor: "pointer" }}
                      onClick={() => setEanScannerVisible(true)}
                    />
                  }
                />
              </Form.Item>

              <Form.Item name="ncm" label="NCM (opcional)">
                <Input placeholder="Código NCM" size="large" />
              </Form.Item>

              {/* Image Upload - Mobile */}
              <Form.Item label="Imagem do Produto">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <Avatar
                    src={imagePreview}
                    icon={!imagePreview && <PictureOutlined />}
                    size={64}
                    shape="square"
                    style={{
                      background: imagePreview ? "transparent" : "#f0f0f0",
                    }}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  <Button
                    icon={<UploadOutlined />}
                    loading={uploadingImage}
                    size="large"
                    onClick={triggerFileInput}
                  >
                    {imagePreview ? "Trocar" : "Enviar"}
                  </Button>
                </div>
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: "16px" }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  style={{ height: "48px", borderRadius: "12px" }}
                >
                  {editingProduct ? "Atualizar Produto" : "Adicionar Produto"}
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          {/* Modal de Confirmação de Exclusão */}
          <Modal
            title={
              <Space>
                <ExclamationCircleOutlined style={{ color: "#faad14" }} />
                Confirmar exclusão
              </Space>
            }
            open={deleteModalVisible}
            onCancel={handleCancelDelete}
            footer={[
              <Button key="cancel" onClick={handleCancelDelete}>
                Cancelar
              </Button>,
              <Button
                key="delete"
                type="primary"
                danger
                loading={deletingProduct}
                onClick={handleDelete}
              >
                Excluir
              </Button>,
            ]}
          >
            <div style={{ padding: "16px 0" }}>
              <p>Tem certeza que deseja excluir este produto?</p>
              {productToDelete && (
                <div
                  style={{
                    background: "#f5f5f5",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text strong>{productToDelete.descricao}</Text>
                  <br />
                  <Text type="secondary">
                    {formatCurrency(productToDelete.valor)}
                  </Text>
                </div>
              )}
            </div>
          </Modal>

          {/* Scanners */}
          <BarcodeScanner
            visible={scannerVisible}
            onClose={() => setScannerVisible(false)}
            onDetect={handleBarcodeDetected}
          />
          <BarcodeScanner
            visible={eanScannerVisible}
            onClose={() => setEanScannerVisible(false)}
            onDetect={handleEanDetected}
          />

          {/* Modal de Visualização da Imagem */}
          <Modal
            open={imageModalVisible}
            onCancel={() => setImageModalVisible(false)}
            footer={null}
            width="90%"
            style={{ maxWidth: 600 }}
            centered
            title={imageModalData.name}
          >
            <div style={{ textAlign: "center" }}>
              <img
                src={imageModalData.url}
                alt={imageModalData.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                  borderRadius: 8,
                }}
              />
            </div>
          </Modal>
        </div>
      </ConfigProvider>
    );
  }

  // ========== RENDER DESKTOP ==========
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "0 24px", marginTop: 16 }}>
        <Breadcrumb
          style={{ margin: "16px 0" }}
          items={[
            { title: "Início" },
            { title: "Cadastros" },
            { title: "Produtos e Serviços" },
          ]}
        />

        {/* Page Header - Using Card instead of PageHeader */}
        <Card
          title={<Title level={4}>Produtos e Serviços</Title>}
          extra={
            (user?.user?.role === "admin" ||
              user?.user?.role === "atendente") && [
              <Button
                key="add"
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Adicionar Produto
              </Button>,
            ]
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Total de Produtos"
                value={productStats.total}
                prefix={<ShoppingOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Categorias"
                value={productStats.categories}
                prefix={<TagOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Preço Médio"
                value={productStats.avgPrice}
                precision={2}
                prefix="R$"
                formatter={(value) => value.toFixed(2).replace(".", ",")}
              />
            </Col>
          </Row>
        </Card>

        <Card bordered={false} className="shadow-sm">
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <Input
              placeholder="Buscar produtos..."
              prefix={<SearchOutlined />}
              allowClear
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                // Selecionar todo o texto após cada alteração
                e.target.select();
              }}
              style={{ width: 300 }}
              ref={searchInput}
            />
            <Tooltip title="Escanear código de barras">
              <Button
                icon={<CameraOutlined />}
                onClick={() => setScannerVisible(true)}
              >
                Scanner
              </Button>
            </Tooltip>
          </div>

          <Table
            columns={columns}
            dataSource={filteredProducts}
            loading={loading}
            rowKey="key"
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} de ${total} itens`,
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Nenhum produto encontrado"
                />
              ),
            }}
          />
        </Card>

        {/* Modal para Adicionar/Editar/Duplicar Produto */}
        <Modal
          title={
            editingProduct
              ? "Editar Produto"
              : form.getFieldValue("descricao")?.startsWith("Cópia de")
              ? "Duplicar Produto"
              : "Adicionar Produto"
          }
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          destroyOnClose
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
            initialValues={{
              categoria: "produto",
              valor: 0,
              descricao: "",
              ean: "",
              ncm: "",
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="categoria"
                  label="Categoria"
                  rules={[
                    {
                      required: true,
                      message: "Por favor selecione uma categoria!",
                    },
                  ]}
                >
                  <Select placeholder="Selecione uma categoria">
                    <Option value="produto">Produto</Option>
                    <Option value="serviço">Serviço</Option>
                    <Option value="papelaria">Papelaria</Option>
                    <Option value="escritório">Material de Escritório</Option>
                    <Option value="informática">Informática</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="valor"
                  label="Preço (R$)"
                  rules={[
                    { required: true, message: "Por favor informe o preço!" },
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    precision={2}
                    min={0}
                    step={0.01}
                    prefix="R$"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="descricao"
              label="Descrição"
              rules={[
                { required: true, message: "Por favor informe a descrição!" },
              ]}
            >
              <Input placeholder="Nome/descrição do produto" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="ncm"
                  label="NCM"
                  tooltip="Nomenclatura Comum do Mercosul"
                >
                  <Input placeholder="Código NCM" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="ean"
                  label="EAN"
                  tooltip="Código de barras do produto"
                >
                  <Input
                    placeholder="Código de barras"
                    addonAfter={
                      <Tooltip title="Escanear código">
                        <CameraOutlined
                          style={{ cursor: "pointer" }}
                          onClick={() => setEanScannerVisible(true)}
                        />
                      </Tooltip>
                    }
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Image Upload Section */}
            <Form.Item label="Imagem do Produto">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    border: "2px dashed #d9d9d9",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#fafafa",
                    overflow: "hidden",
                  }}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <PictureOutlined
                      style={{ fontSize: "32px", color: "#999" }}
                    />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  <Button
                    icon={<UploadOutlined />}
                    loading={uploadingImage}
                    onClick={triggerFileInput}
                  >
                    {imagePreview ? "Trocar Imagem" : "Enviar Imagem"}
                  </Button>
                  <div style={{ marginTop: "8px" }}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      PNG, JPG ou GIF. Máx 2MB.
                    </Text>
                  </div>
                </div>
              </div>
            </Form.Item>

            <Divider />

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button onClick={() => setModalVisible(false)}>Cancelar</Button>
                <Button type="primary" htmlType="submit">
                  {editingProduct
                    ? "Atualizar"
                    : form.getFieldValue("descricao")?.startsWith("Cópia de")
                    ? "Duplicar"
                    : "Adicionar"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal de Confirmação de Exclusão */}
        <Modal
          title={
            <Space>
              <ExclamationCircleOutlined style={{ color: "#faad14" }} />
              Confirmar exclusão
            </Space>
          }
          open={deleteModalVisible}
          onCancel={handleCancelDelete}
          footer={[
            <Button key="cancel" onClick={handleCancelDelete}>
              Cancelar
            </Button>,
            <Button
              key="delete"
              type="primary"
              danger
              loading={deletingProduct}
              onClick={handleDelete}
            >
              Sim, excluir
            </Button>,
          ]}
          width={450}
        >
          <div style={{ padding: "20px 0" }}>
            <p style={{ marginBottom: 16 }}>
              Tem certeza que deseja excluir este produto?
            </p>
            {productToDelete && (
              <div
                style={{ background: "#f5f5f5", padding: 16, borderRadius: 6 }}
              >
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  {productToDelete.descricao}
                </Text>
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 4 }}
                >
                  Categoria: {productToDelete.categoria}
                </Text>
                <Text type="secondary">
                  Preço: {formatCurrency(productToDelete.valor)}
                </Text>
              </div>
            )}
          </div>
        </Modal>

        {/* Scanner de Código de Barras - Busca */}
        <BarcodeScanner
          visible={scannerVisible}
          onClose={() => setScannerVisible(false)}
          onDetect={handleBarcodeDetected}
        />

        {/* Scanner de Código de Barras - EAN no Modal */}
        <BarcodeScanner
          visible={eanScannerVisible}
          onClose={() => setEanScannerVisible(false)}
          onDetect={handleEanDetected}
        />

        {/* Modal de Visualização da Imagem */}
        <Modal
          open={imageModalVisible}
          onCancel={() => setImageModalVisible(false)}
          footer={null}
          width={600}
          centered
          title={imageModalData.name}
        >
          <div style={{ textAlign: "center" }}>
            <img
              src={imageModalData.url}
              alt={imageModalData.name}
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          </div>
        </Modal>
      </Content>
    </Layout>
  );
};

export default ProductAndServiceTable;
