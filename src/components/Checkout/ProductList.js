import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Input,
  List,
  Button,
  Tag,
  Typography,
  Empty,
  Spin,
  Pagination,
  Segmented,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  ShoppingOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { searchProducts } from "helpers/api-integrator";

const { Search } = Input;
const { Text } = Typography;

// Hook para debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const ProductList = ({
  loading: externalLoading,
  onAddProduct,
  onBarcodeSearch,
  onOpenScanner,
  isMobile,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(30);
  const isInitialMount = useRef(true);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Buscar produtos
  const fetchProducts = useCallback(async (search, category, page) => {
    setLoading(true);
    try {
      const result = await searchProducts({
        search,
        category,
        page,
        limit: pageSize,
      });

      if (result.success) {
        setProducts(result.data || []);
        setTotal(result.total || 0);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchProducts("", "todos", 1);
    }
  }, [fetchProducts]);

  useEffect(() => {
    if (!isInitialMount.current) {
      setCurrentPage(1);
      fetchProducts(debouncedSearchTerm, selectedCategory, 1);
    }
  }, [debouncedSearchTerm, selectedCategory, fetchProducts]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    fetchProducts(debouncedSearchTerm, selectedCategory, page);
  }, [debouncedSearchTerm, selectedCategory, fetchProducts]);

  // Handler para busca por código
  const handleSearchSubmit = (value) => {
    const trimmed = value?.trim();
    if (trimmed) {
      onBarcodeSearch(trimmed);
      setSearchTerm("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      const value = e.target.value?.trim();
      if (value) {
        e.preventDefault();
        onBarcodeSearch(value);
        setSearchTerm("");
      }
    }
  };

  const formatCurrency = (value) => {
    const numValue = parseFloat(value || 0);
    return `R$ ${numValue.toFixed(2).replace(".", ",")}`;
  };

  const isLoading = loading || externalLoading;

  // ========== MOBILE RENDER ==========
  if (isMobile) {
    return (
      <div style={{ 
        height: "100%", 
        display: "flex", 
        flexDirection: "column",
        overflow: "hidden",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}>
        {/* Search Bar Mobile */}
        <div style={{ marginBottom: "12px", flexShrink: 0 }}>
          <Search
            placeholder="Buscar ou digitar código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearchSubmit}
            onKeyDown={handleKeyDown}
            size="large"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ 
              borderRadius: "12px",
            }}
          />
        </div>

        {/* Category Filter Mobile */}
        <div style={{ marginBottom: "12px", flexShrink: 0 }}>
          <Segmented
            block
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[
              { label: "Todos", value: "todos", icon: <FireOutlined /> },
              { label: "Produtos", value: "produtos" },
              { label: "Serviços", value: "serviços" },
            ]}
            style={{
              background: "#fff",
              padding: "4px",
              borderRadius: "12px",
            }}
          />
        </div>

        {/* Products List Mobile */}
        <div style={{ 
          flex: 1, 
          overflow: "auto", 
          paddingBottom: "16px",
          minHeight: 0,
          WebkitOverflowScrolling: "touch",
        }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Spin />
              <div style={{ marginTop: "12px" }}>
                <Text type="secondary">Carregando...</Text>
              </div>
            </div>
          ) : products.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Nenhum produto encontrado"
              style={{ marginTop: "40px" }}
            />
          ) : (
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "8px",
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
            }}>
              {products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    overflow: "hidden",
                  }}
                  onClick={() => onAddProduct(product, 1)}
                >
                  <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <Text
                      strong
                      style={{
                        fontSize: "13px",
                        display: "block",
                        marginBottom: "4px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                      }}
                    >
                      {product.descricao?.toUpperCase()}
                    </Text>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <Tag
                        color={product.categoria?.toLowerCase() === "serviço" ? "green" : "blue"}
                        style={{ 
                          margin: 0, 
                          borderRadius: "6px",
                          fontSize: "10px",
                        }}
                      >
                        {product.categoria?.toUpperCase()}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: "10px" }}>
                        #{product.id}
                      </Text>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", marginLeft: "8px", flexShrink: 0 }}>
                    <Text
                      strong
                      style={{
                        fontSize: "14px",
                        color: "#667eea",
                        display: "block",
                      }}
                    >
                      {formatCurrency(product.valor)}
                    </Text>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      style={{
                        marginTop: "4px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        border: "none",
                        padding: "0 8px",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddProduct(product, 1);
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Mobile */}
        {!isLoading && products.length > 0 && total > pageSize && (
          <div style={{ 
            padding: "12px 0", 
            background: "#f8f9fa",
            borderRadius: "12px",
            textAlign: "center",
          }}>
            <Pagination
              current={currentPage}
              total={total}
              pageSize={pageSize}
              onChange={handlePageChange}
              showSizeChanger={false}
              showQuickJumper={false}
              size="small"
              simple
            />
          </div>
        )}
      </div>
    );
  }

  // ========== DESKTOP RENDER ==========
  return (
    <Card
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <ShoppingOutlined style={{ marginRight: 4, fontSize: "13px" }} />
            <span style={{ fontSize: "13px" }}>Produtos</span>
          </div>
          <Tag color={total > 0 ? "green" : "default"}>{total} itens</Tag>
        </div>
      }
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "6px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        minHeight: 0,
      }}
      bodyStyle={{
        flex: 1,
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
      }}
      size="small"
    >
      {/* Search Desktop */}
      <div style={{ marginBottom: "8px" }}>
        <Search
          placeholder="Buscar ou digitar código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={handleSearchSubmit}
          onKeyDown={handleKeyDown}
          size="small"
          prefix={<SearchOutlined />}
          allowClear
          enterButton
          loading={loading}
        />
      </div>

      {/* Category Filter Desktop */}
      <div style={{ marginBottom: "8px" }}>
        <Segmented
          block
          size="small"
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={[
            { label: "Todos", value: "todos" },
            { label: "Produtos", value: "produtos" },
            { label: "Serviços", value: "serviços" },
          ]}
        />
      </div>

      {/* Products List Desktop */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px", minHeight: 0 }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <Spin size="small" />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Buscando...
              </Text>
            </div>
          </div>
        ) : products.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Nenhum produto encontrado"
            style={{ margin: 0 }}
            imageStyle={{ height: 60 }}
          />
        ) : (
          <List
            dataSource={products}
            renderItem={(product) => (
              <List.Item
                key={product.id}
                style={{
                  padding: "8px 6px",
                  border: "1px solid #f0f0f0",
                  borderRadius: "4px",
                  marginBottom: "4px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                }}
                onClick={() => onAddProduct(product, 1)}
              >
                <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ fontSize: "12px", display: "block" }}>
                      {product.descricao?.toUpperCase()}
                    </Text>
                    <Tag
                      color={product.categoria?.toLowerCase() === "serviço" ? "green" : "blue"}
                      style={{ marginTop: "2px" }}
                    >
                      {product.categoria?.toUpperCase()}
                    </Tag>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Text strong style={{ fontSize: "13px", color: "#1890ff" }}>
                      {formatCurrency(product.valor)}
                    </Text>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      size="small"
                      style={{ marginLeft: "8px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddProduct(product, 1);
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </List.Item>
            )}
            pagination={false}
          />
        )}
      </div>

      {/* Pagination Desktop */}
      {!isLoading && products.length > 0 && total > pageSize && (
        <div style={{ marginTop: "8px", textAlign: "center" }}>
          <Pagination
            current={currentPage}
            total={total}
            pageSize={pageSize}
            onChange={handlePageChange}
            showSizeChanger={false}
            size="small"
            showTotal={(total, range) => `${range[0]}-${range[1]} de ${total}`}
          />
        </div>
      )}
    </Card>
  );
};

export default ProductList;
