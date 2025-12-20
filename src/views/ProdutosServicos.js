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
} from "@ant-design/icons";
import BarcodeScanner from "components/Checkout/BarcodeScanner";
import { UserContext } from "context/UserContext";

// Import API helpers
import {
  getProducts,
  updateProduct,
  deleteProduct,
} from "helpers/api-integrator";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

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

  // References and context
  const { user } = useContext(UserContext);
  const searchInput = useRef(null);

  // Format money values
  const formatCurrency = (value) => {
    return `R$ ${parseFloat(value).toFixed(2).replace(".", ",")}`;
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
    setModalVisible(true);
  };

  // Define table columns
  const columns = [
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

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "0 24px", marginTop: 16 }}>
        <Breadcrumb style={{ margin: "16px 0" }}>
          <Breadcrumb.Item>Início</Breadcrumb.Item>
          <Breadcrumb.Item>Cadastros</Breadcrumb.Item>
          <Breadcrumb.Item>Produtos e Serviços</Breadcrumb.Item>
        </Breadcrumb>

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
          <div style={{ marginBottom: 16, display: "flex", gap: "8px", alignItems: "center" }}>
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
      </Content>
    </Layout>
  );
};

export default ProductAndServiceTable;
