import { urlBase } from "./environment";
import axios from "axios";

// Criar instância do axios com configurações otimizadas
const api = axios.create({
  baseURL: urlBase,
  timeout: 10000, // 10 segundos de timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper para obter dados do usuário logado
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (error) {
    console.error("Erro ao obter usuário do localStorage:", error);
  }
  return null;
};

// Helper para obter companyId do usuário logado
export const getCurrentCompanyId = () => {
  const user = getCurrentUser();
  return user?.companyId || null;
};

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("api_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado - limpar localStorage
      localStorage.removeItem("api_token");
      localStorage.removeItem("user");
      window.location.href = "/admin/login-register";
    }
    return Promise.reject(error);
  }
);

// Cache simples para requisições
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Exportar instância do axios para uso direto
export const apiIntegrator = api;

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

export const makeRegister = async (email, password, companyId = null) => {
  const payload = {
    companyId: companyId || 1, // Usar companyId fornecido ou default
    username: email,
    password,
    role: "visitante",
    email,
    name: "",
  };

  try {
    const register = await api.post("/auth/register", payload);
    localStorage.setItem("api_token", register.data.access_token);
    // Armazenar dados do usuário incluindo companyId
    if (register.data.user) {
      localStorage.setItem("user", JSON.stringify(register.data.user));
    }
    return {
      success: true,
      data: register.data,
    };
  } catch (error) {
    return {
      success: null,
      message: "Senha ou e-mail invalidos",
    };
  }
};

export const makeLogin = async (email, password) => {
  const payload = {
    password,
    email,
  };

  try {
    const login = await api.post("/auth/login", payload);
    localStorage.setItem("api_token", login.data.access_token);
    // Armazenar dados do usuário incluindo companyId
    if (login.data.user) {
      localStorage.setItem("user", JSON.stringify(login.data.user));
    }
    return {
      success: true,
      data: login.data,
    };
  } catch (error) {
    console.error("Error during login:", error);
    return {
      success: null,
      message: "Senha ou e-mail invalidos",
    };
  }
};

export const getProducts = async () => {
  const cacheKey = "products";
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    const products = await api.get("/produtos");
    const result = {
      success: true,
      data: products.data,
    };
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error during get products:", error);
    return {
      success: null,
      message: "Erro ao buscar produtos",
    };
  }
};

// Busca otimizada de produtos com paginação (server-side)
export const searchProducts = async ({
  search = "",
  category = "todos",
  page = 1,
  limit = 30,
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category && category !== "todos") params.append("category", category);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    const response = await api.get(`/produtos/search?${params.toString()}`);
    return {
      success: true,
      data: response.data.data,
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
      totalPages: response.data.totalPages,
    };
  } catch (error) {
    console.error("Error during search products:", error);
    return {
      success: null,
      message: "Erro ao buscar produtos",
      data: [],
      total: 0,
    };
  }
};

// Buscar produto por código de barras ou ID (para scanner)
export const findProductByCode = async (code) => {
  try {
    const response = await api.get(
      `/produtos/by-code/${encodeURIComponent(code)}`
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error finding product by code:", error);
    return {
      success: false,
      data: null,
      message: "Produto não encontrado",
    };
  }
};

export const getSells = async (startDate, endDate) => {
  const cacheKey = `sells_${startDate}_${endDate}`;
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    const products = await api.get(
      `/vendas?startDate=${startDate}&endDate=${endDate}`
    );
    const result = {
      success: true,
      data: products.data,
    };
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error during get sells:", error);
    return {
      success: null,
      message: "Erro ao buscar vendas",
    };
  }
};

export const getDashboard = async () => {
  const cacheKey = "dashboard";
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    const products = await api.post("/vendas/dashboard");
    const result = {
      success: true,
      data: products.data,
    };
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error during get dashboard:", error);
    return {
      success: null,
      message: "Erro ao buscar dashboard",
    };
  }
};

export const updateProduct = async (item) => {
  try {
    const products = await api.post("/produtos", item);
    // Limpar cache de produtos após atualização
    cache.delete("products");
    return {
      success: true,
      data: products.data,
    };
  } catch (error) {
    console.error("Error during update product:", error);
    return {
      success: null,
      message: "Erro ao atualizar produto",
    };
  }
};

export const deleteProduct = async (itemId) => {
  try {
    const products = await api.delete(`/produtos?produtoId=${itemId}`);
    // Limpar cache de produtos após exclusão
    cache.delete("products");
    return {
      success: true,
      data: products.data,
    };
  } catch (error) {
    console.error("Error during delete product:", error);
    return {
      success: null,
      message: "Erro ao excluir produto",
    };
  }
};

export const finalizaVenda = async (venda) => {
  try {
    const vendas = await api.post("/vendas", venda);
    // Limpar caches relacionados a vendas
    cache.delete("dashboard");
    return {
      success: true,
      data: vendas.data,
    };
  } catch (error) {
    console.error("Error during venda:", error);
    return {
      success: null,
      message: "Erro ao finalizar venda",
    };
  }
};

export const getTopSellers = async (startDate, endDate) => {
  const cacheKey = `topSellers_${startDate}_${endDate}`;
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await api.get(
      `/vendas/top-sellers?startDate=${startDate}&endDate=${endDate}`
    );
    const result = {
      success: true,
      data: response.data,
    };
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error during get top sellers:", error);
    return {
      success: null,
      message: "Erro ao buscar top sellers",
    };
  }
};

// Função para limpar cache
export const clearCache = () => {
  cache.clear();
};

// Função para limpar cache específico
export const clearCacheByKey = (key) => {
  cache.delete(key);
};

export const solicitaExclusaoVenda = async (vendaId, motivo) => {
  const headers = {
    "Content-Type": "application/json",
  };

  const payload = {
    vendaId,
    motivo,
  };

  try {
    const resposta = await axios.post(
      `${urlBase}/vendas/${vendaId}/request-exclusion`,
      payload,
      { headers }
    );

    return {
      success: true,
      data: resposta.data,
      message: "Solicitação de exclusão enviada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao solicitar exclusão da venda:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Erro ao solicitar exclusão da venda",
    };
  }
};

export const aprovaExclusaoVenda = async (vendaId, observacoes, adminId) => {
  const headers = {
    "Content-Type": "application/json",
  };

  const payload = {
    observacoes,
    reviewedById: adminId,
  };

  try {
    const resposta = await axios.post(
      `${urlBase}/vendas/${vendaId}/approve-exclusion`,
      payload,
      { headers }
    );

    return {
      success: true,
      data: resposta.data,
      message: "Exclusão aprovada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao aprovar exclusão da venda:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Erro ao aprovar exclusão da venda",
    };
  }
};

export const rejeitaExclusaoVenda = async (vendaId, observacoes, adminId) => {
  const headers = {
    "Content-Type": "application/json",
  };

  const payload = {
    observacoes,
    reviewedById: adminId,
  };

  try {
    const resposta = await axios.post(
      `${urlBase}/vendas/${vendaId}/reject-exclusion`,
      payload,
      { headers }
    );

    return {
      success: true,
      data: resposta.data,
      message: "Exclusão rejeitada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao rejeitar exclusão da venda:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Erro ao rejeitar exclusão da venda",
    };
  }
};

export const getPendingExclusionRequests = async () => {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const resposta = await axios.get(`${urlBase}/vendas/pending-exclusions`, {
      headers,
    });

    return {
      success: true,
      data: resposta.data,
    };
  } catch (error) {
    console.error("Erro ao buscar solicitações de exclusão pendentes:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Erro ao buscar solicitações de exclusão pendentes",
    };
  }
};

export const updateDespesa = async (item) => {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const despesas = await axios.post(`${urlBase}/despesas`, item, { headers });
    console.log({ despesas });
    return {
      success: true,
      data: despesas.data,
    };
  } catch (error) {
    console.error("Error during update despesas:", error);
    return {
      success: null,
      message: "Erro ao salvar despesas",
    };
  }
};

export const getDespesas = async () => {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const despesas = await axios.get(`${urlBase}/despesas`, { headers });
    console.log({ despesas });
    return {
      success: true,
      data: despesas.data,
    };
  } catch (error) {
    console.error("Error during get despesas:", error);
    return {
      success: null,
      message: "Erro ao buscar despesas",
    };
  }
};

export const delDepesa = async (id) => {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const despesas = await axios.delete(`${urlBase}/despesas?id=` + id, {
      headers,
    });
    console.log({ despesas });
    return {
      success: true,
      data: despesas.data,
    };
  } catch (error) {
    console.error("Error during get despesas:", error);
    return {
      success: null,
      message: "Erro ao buscar despesas",
    };
  }
};

export const getCompanySetup = async (companyId) => {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const setup = await axios.get(
      `${urlBase}/companies/setup?id=` + companyId,
      { headers }
    );
    console.log({ setup });
    return {
      success: true,
      data: setup.data,
    };
  } catch (error) {
    console.error("Error during get despesas:", error);
    return {
      success: null,
      message: "Erro ao buscar setup",
    };
  }
};

export const updateSetup = async (payload) => {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const setup = await axios.post(`${urlBase}/companies/setup`, payload, {
      headers,
    });
    console.log({ setup });
    return {
      success: true,
      data: setup.data,
    };
  } catch (error) {
    console.error("Error during get despesas:", error);
    return {
      success: null,
      message: "Erro ao buscar setup",
    };
  }
};

export const getUsers = async (companyId) => {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const setup = await axios.get(
      `${urlBase}/user/list?companyId=` + companyId,
      { headers }
    );
    console.log({ setup });
    return {
      success: true,
      data: setup.data,
    };
  } catch (error) {
    console.error("Error during get despesas:", error);
    return {
      success: null,
      message: "Erro ao buscar setup",
    };
  }
};

export const updateUserRole = async (companyId, userName, userRule) => {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const setup = await axios.post(
      `${urlBase}/user/update-role`,
      { companyId, userName, userRule },
      { headers }
    );
    console.log({ setup });
    return {
      success: true,
      data: setup.data,
    };
  } catch (error) {
    console.error("Error during get despesas:", error);
    return {
      success: null,
      message: "Erro ao buscar setup",
    };
  }
};

// Funções para Clientes
export const getClientes = async (search) => {
  try {
    const response = await apiIntegrator.get("/clientes", {
      params: { search },
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return {
      success: false,
      message: "Erro ao buscar clientes",
    };
  }
};

export const createCliente = async (cliente) => {
  try {
    const response = await apiIntegrator.post("/clientes", cliente);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return {
      success: false,
      message: "Erro ao criar cliente",
    };
  }
};

export const updateCliente = async (id, cliente) => {
  try {
    const response = await apiIntegrator.put(`/clientes/${id}`, cliente);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return {
      success: false,
      message: "Erro ao atualizar cliente",
    };
  }
};

export const deleteCliente = async (id) => {
  try {
    const response = await apiIntegrator.delete(`/clientes/${id}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    return {
      success: false,
      message: "Erro ao excluir cliente",
    };
  }
};

// ============================================
// FUNÇÕES PARA GERENCIAMENTO DE EMPRESAS
// ============================================

export const getCompanies = async () => {
  try {
    const response = await api.get("/companies");
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    return {
      success: false,
      message: "Erro ao buscar empresas",
    };
  }
};

export const getMyCompanies = async () => {
  try {
    const response = await api.get("/companies/my-companies");
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Erro ao buscar minhas empresas:", error);
    return {
      success: false,
      message: "Erro ao buscar minhas empresas",
    };
  }
};

export const getCompany = async (companyId) => {
  try {
    const response = await api.get(`/companies/${companyId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    return {
      success: false,
      message: "Erro ao buscar empresa",
    };
  }
};

export const createCompany = async (companyData) => {
  try {
    const response = await api.post("/companies", companyData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Erro ao criar empresa:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao criar empresa",
    };
  }
};

export const updateCompany = async (companyId, companyData) => {
  try {
    const response = await api.put(`/companies/${companyId}`, companyData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao atualizar empresa",
    };
  }
};

export const deleteCompany = async (companyId) => {
  try {
    const response = await api.delete(`/companies/${companyId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Erro ao excluir empresa:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao excluir empresa",
    };
  }
};

export const getCompanyUsers = async (companyId) => {
  try {
    const response = await api.get(`/companies/${companyId}/users`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Erro ao buscar usuários da empresa:", error);
    return {
      success: false,
      message: "Erro ao buscar usuários da empresa",
    };
  }
};

export const addUserToCompany = async (companyId, userId) => {
  try {
    const response = await api.post(`/companies/${companyId}/users/${userId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Erro ao associar usuário à empresa:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Erro ao associar usuário à empresa",
    };
  }
};

// Criar usuário para uma empresa (Super Admin only)
export const createUserForCompany = async (companyId, userData) => {
  try {
    const response = await api.post(
      `/companies/${companyId}/create-user`,
      userData
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao criar usuário",
    };
  }
};
