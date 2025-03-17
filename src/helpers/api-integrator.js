import { urlBase } from "./environment";
import axios from "axios";

export const makeRegister = async (email, password) => {
  const payload = {
    companyId: 1,
    username: email,
    password,
    role: "visitante",
    email,
    name: "",
  };
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const register = await axios.post(`${urlBase}/auth/register`, payload, {
      headers,
    });
    console.log({ register });
    localStorage.setItem("api_token", register.data.access_token);
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
    companyId: 1,
    password,
    email,
  };
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const login = await axios.post(`${urlBase}/auth/login`, payload, {
      headers,
    });
    console.log({ login });
    localStorage.setItem("api_token", login.data.access_token);
    return {
      success: true,
      data: login.data,
    };
  } catch (error) {
    console.error("Error during registration:", error);
    return {
      success: null,
      message: "Senha ou e-mail invalidos",
    };
  }
};

export const getProducts = async () => {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const products = await axios.get(`${urlBase}/produtos`, { headers });
    return {
      success: true,
      data: products.data,
    };
  } catch (error) {
    console.error("Error during get products:", error);
    return {
      success: null,
      message: "Erro ao buscar produtos",
    };
  }
};

export const getSells = async (startDate, endDate) => {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const products = await axios.get(
      `${urlBase}/vendas?startDate=${startDate}&endDate=${endDate}`,
      { headers }
    );
    return {
      success: true,
      data: products.data,
    };
  } catch (error) {
    console.error("Error during get products:", error);
    return {
      success: null,
      message: "Erro ao buscar produtos",
    };
  }
};

export const getDashboard = async () => {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const products = await axios.post(`${urlBase}/vendas/dashboard`, {
      headers,
    });
    return {
      success: true,
      data: products.data,
    };
  } catch (error) {
    console.error("Error during get products:", error);
    return {
      success: null,
      message: "Erro ao buscar produtos",
    };
  }
};

export const updateProduct = async (item) => {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const products = await axios.post(`${urlBase}/produtos`, item, { headers });
    console.log({ products });
    return {
      success: true,
      data: products.data,
    };
  } catch (error) {
    console.error("Error during get products:", error);
    return {
      success: null,
      message: "Erro ao buscar produtos",
    };
  }
};

export const deleteProduct = async (itemId) => {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const products = await axios.delete(
      `${urlBase}/produtos?produtoId=${itemId}`,
      { headers }
    );
    console.log({ products });
    return {
      success: true,
      data: products.data,
    };
  } catch (error) {
    console.error("Error during get products:", error);
    return {
      success: null,
      message: "Erro ao buscar produtos",
    };
  }
};

export const finalizaVenda = async (venda) => {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const vendas = await axios.post(`${urlBase}/vendas`, venda, { headers });
    console.log({ vendas });
    return {
      success: true,
      data: vendas.data,
    };
  } catch (error) {
    console.log({ error });
    console.error("Error during venda:", error);
    return {
      success: null,
      message: "Erro ao vender",
    };
  }
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
