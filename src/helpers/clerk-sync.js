import { urlBase } from "./environment";
import axios from "axios";

/**
 * Sincroniza o usuário do Clerk com o backend
 * @param {string} clerkToken - Token do Clerk (session token)
 * @returns {Promise<Object>} Dados do usuário sincronizado
 */
export const syncClerkUser = async (clerkToken) => {
  try {
    const response = await axios.post(
      `${urlBase}/auth/clerk/sync`,
      {},
      {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && response.data.success) {
      // Salvar token JWT interno para compatibilidade
      if (response.data.access_token) {
        localStorage.setItem("api_token", response.data.access_token);
      }

      // Salvar dados do usuário
      if (response.data.user) {
        const userData = {
          user: response.data.user,
          access_token: response.data.access_token,
        };
        localStorage.setItem("user", JSON.stringify(userData));
      }

      return {
        success: true,
        data: response.data,
      };
    }

    return {
      success: false,
      message: response.data?.message || "Erro ao sincronizar usuário",
    };
  } catch (error) {
    console.error("Erro ao sincronizar usuário Clerk:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao sincronizar usuário",
    };
  }
};

/**
 * Verifica e obtém dados do usuário a partir do token Clerk
 * @param {string} clerkToken - Token do Clerk
 * @returns {Promise<Object>} Dados do usuário
 */
export const verifyClerkToken = async (clerkToken) => {
  try {
    const response = await axios.post(
      `${urlBase}/auth/clerk/verify`,
      {},
      {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Erro ao verificar token Clerk:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao verificar token",
    };
  }
};

