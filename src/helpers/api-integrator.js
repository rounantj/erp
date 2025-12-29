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
      const data = JSON.parse(userStr);
      // O login salva { user: {...}, access_token: '...' }
      // Retornar o objeto user interno se existir, senão retornar o objeto inteiro
      return data?.user || data;
    }
  } catch (error) {
    console.error("Erro ao obter usuário do localStorage:", error);
  }
  return null;
};

// Helper para obter companyId do usuário logado
export const getCurrentCompanyId = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const data = JSON.parse(userStr);
      // Estrutura pode ser { user: { companyId: 1 } } ou { companyId: 1 }
      return data?.user?.companyId || data?.companyId || null;
    }
  } catch (error) {
    console.error("Erro ao obter companyId do localStorage:", error);
  }
  return null;
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

/**
 * Registra uma nova empresa com trial automático
 * Gera senha automática que é retornada apenas uma vez
 */
export const registerCompany = async (payload) => {
  try {
    const response = await api.post("/auth/register-company", payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Erro ao criar empresa. Tente novamente.";
    return {
      success: false,
      message: errorMessage,
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

    // Disparar evento customizado para que o SubscriptionContext seja atualizado
    window.dispatchEvent(new CustomEvent("userLoggedIn"));

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

export const getMonthlySalesAndExpenses = async () => {
  try {
    const response = await api.get("/vendas/monthly-stats");
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error fetching monthly sales and expenses:", error);
    return {
      success: false,
      data: { meses: [], vendas: [], despesas: [] },
      message: "Erro ao buscar dados mensais",
    };
  }
};

export const getMonthlyCurriculums = async () => {
  try {
    const response = await api.get("/vendas/monthly-curriculums");
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error fetching monthly curriculums:", error);
    return {
      success: false,
      data: { meses: [], curriculos: [] },
      message: "Erro ao buscar dados de currículos",
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
      `${urlBase}/companies/setup/get?companyId=` + companyId,
      { headers }
    );
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

// Upload de logo da empresa
export const uploadCompanyLogo = async (companyId, base64Image) => {
  try {
    const response = await api.post("/companies/upload-logo", {
      companyId,
      base64: base64Image,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Erro ao fazer upload da logo:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao fazer upload da logo",
    };
  }
};

// Completar onboarding da empresa
export const completeOnboarding = async () => {
  try {
    const response = await api.post("/companies/complete-onboarding");
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Erro ao completar onboarding:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao completar onboarding",
    };
  }
};

// Upload de imagem do produto
export const uploadProductImage = async (productId, base64Image) => {
  try {
    const response = await api.post(`/produtos/${productId}/upload-image`, {
      base64: base64Image,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Erro ao fazer upload da imagem",
    };
  }
};

// ============================================
// FUNÇÕES PARA SUBSCRIPTIONS E PLANOS
// ============================================

// Buscar todos os planos disponíveis
export const getPlans = async () => {
  try {
    const response = await api.get("/subscriptions/plans");
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Erro ao buscar planos:", error);
    return {
      success: false,
      message: "Erro ao buscar planos",
    };
  }
};

// Buscar plano por ID
export const getPlanById = async (planId) => {
  try {
    const response = await api.get(`/subscriptions/plans/${planId}`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Erro ao buscar plano:", error);
    return {
      success: false,
      message: "Erro ao buscar plano",
    };
  }
};

// Atualizar dias de trial de um plano
export const updatePlanTrialDays = async (planId, trialDays) => {
  try {
    const response = await api.put(
      `/subscriptions/plans/${planId}/trial-days`,
      {
        trialDays,
      }
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Erro ao atualizar dias de trial:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Erro ao atualizar dias de trial",
    };
  }
};

// Buscar subscription de uma empresa
export const getCompanySubscription = async (companyId) => {
  try {
    const response = await api.get(`/subscriptions/company/${companyId}`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Erro ao buscar subscription:", error);
    return {
      success: false,
      message: "Erro ao buscar subscription",
    };
  }
};

// Criar trial para empresa
export const createTrialSubscription = async (companyId) => {
  try {
    const response = await api.post("/subscriptions/trial", { companyId });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Erro ao criar trial:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao criar trial",
    };
  }
};

// Criar subscription paga
export const createPaidSubscription = async (data) => {
  try {
    const response = await api.post("/subscriptions/create", data);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Erro ao criar subscription:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao criar subscription",
    };
  }
};

// Trocar plano - ADMIN (altera direto, usado na tela de Empresas)
export const changeSubscriptionPlanAdmin = async (subscriptionId, newPlanId) => {
  try {
    const response = await api.put(
      `/subscriptions/${subscriptionId}/change-plan-admin`,
      {
        newPlanId,
      }
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Erro ao trocar plano:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao trocar plano",
    };
  }
};

// Trocar plano - USUÁRIO (gera link de pagamento, plano muda via webhook)
export const changeSubscriptionPlan = async (subscriptionId, newPlanId, billingPeriod, totalAmount) => {
  try {
    const response = await api.put(
      `/subscriptions/${subscriptionId}/change-plan`,
      {
        newPlanId,
        billingPeriod,
        totalAmount,
      }
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Erro ao solicitar troca de plano:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao solicitar troca de plano",
    };
  }
};

// Cancelar subscription
export const cancelSubscription = async (subscriptionId) => {
  try {
    const response = await api.delete(`/subscriptions/${subscriptionId}`);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Erro ao cancelar subscription:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao cancelar subscription",
    };
  }
};

// Criar assinatura paga (com dados do cliente)
export const createSubscription = async (
  planId,
  paymentMethod,
  customerData,
  billingPeriod = "monthly",
  totalAmount = null
) => {
  try {
    const companyId = getCurrentCompanyId();
    const user = getCurrentUser();

    const response = await api.post("/subscriptions/create", {
      companyId,
      planId,
      customerEmail: customerData?.email || user?.email,
      customerName: customerData?.name || user?.name,
      customerCpfCnpj: customerData?.cpfCnpj,
      customerPhone: customerData?.phone,
      paymentMethod,
      billingPeriod,
      totalAmount,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Erro ao criar subscription:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao criar subscription",
    };
  }
};

// Mudar de plano
export const changePlan = async (
  newPlanId,
  billingPeriod = "monthly",
  totalAmount = null
) => {
  try {
    const companyId = getCurrentCompanyId();
    // Primeiro buscar a subscription atual
    const subResponse = await api.get(`/subscriptions/company/${companyId}`);
    const subscriptionId = subResponse.data?.data?.id;

    if (!subscriptionId) {
      throw new Error("Subscription não encontrada");
    }

    const response = await api.put(
      `/subscriptions/${subscriptionId}/change-plan`,
      {
        newPlanId,
        billingPeriod,
        totalAmount,
      }
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Erro ao mudar de plano:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao mudar de plano",
    };
  }
};

// Criar cobrança avulsa (para pagar mensalidade em atraso)
export const createSingleCharge = async (paymentMethod) => {
  try {
    const companyId = getCurrentCompanyId();
    // Buscar subscription atual para pegar o valor do plano
    const subResponse = await api.get(`/subscriptions/company/${companyId}`);
    const subscription = subResponse.data?.data;

    if (!subscription) {
      throw new Error("Subscription não encontrada");
    }

    const response = await api.post("/subscriptions/payments/single", {
      companyId,
      amount: subscription.plan?.price || 0,
      description: `Pagamento em atraso - Plano ${
        subscription.plan?.displayName || "ERP"
      }`,
      paymentMethod,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Erro ao criar cobrança:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao criar cobrança",
    };
  }
};

// Criar cobrança avulsa manual (com valor e descrição)
export const createSinglePayment = async (companyId, amount, description) => {
  try {
    const response = await api.post("/subscriptions/payments/single", {
      companyId,
      amount,
      description,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Erro ao criar cobrança:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao criar cobrança",
    };
  }
};

// Buscar histórico de pagamentos
export const getPaymentHistory = async () => {
  try {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      return { success: true, data: [] };
    }
    const response = await api.get(`/subscriptions/payments/${companyId}`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Erro ao buscar histórico de pagamentos:", error);
    return {
      success: false,
      data: [],
      message: "Erro ao buscar histórico de pagamentos",
    };
  }
};

// Buscar features da empresa
export const getCompanyFeatures = async (companyId) => {
  try {
    const response = await api.get(`/subscriptions/features/${companyId}`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Erro ao buscar features:", error);
    return {
      success: false,
      message: "Erro ao buscar features",
      data: {
        plan: null,
        features: {},
        status: "no_subscription",
        canAccess: false,
      },
    };
  }
};
