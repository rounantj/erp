import { apiIntegrator as api } from "helpers/api-integrator";

const data = (promise) => promise.then((r) => r.data);

export const errorMessage = (err, fallback = "Não foi possível concluir a ação.") => {
  const message = err?.response?.data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(" ");
  if (message?.message) return message.message;
  return fallback;
};

// O caixa lê este item ao abrir e, ao concluir a venda, marca o pedido como entregue.
export const CHECKOUT_IMPORT_KEY = "whatsapp_checkout_import";

export const brl = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const whatsappApi = {
  listOrders: (status) => data(api.get("/whatsapp/pedidos", { params: { status } })),
  ordersSummary: () => data(api.get("/whatsapp/pedidos/resumo")),
  getOrder: (id) => data(api.get(`/whatsapp/pedidos/${id}`)),
  checkoutPayload: (id) => data(api.get(`/whatsapp/pedidos/${id}/caixa`)),
  markSold: (id, vendaId) => data(api.post(`/whatsapp/pedidos/${id}/vendido`, { vendaId })),
  updateOrderStatus: (id, status) => data(api.patch(`/whatsapp/pedidos/${id}/status`, { status })),
  retryNotification: (id) => data(api.post(`/whatsapp/pedidos/${id}/reenviar-aviso`, {})),
  filePreview: (fileId) => data(api.get(`/whatsapp/arquivos/${fileId}/preview`)),
  fileDownload: (fileId) => data(api.get(`/whatsapp/arquivos/${fileId}/download`)),

  status: () => data(api.get("/whatsapp/status", { timeout: 30000 })),
  connect: () => data(api.post("/whatsapp/conectar", {}, { timeout: 60000 })),
  disconnect: () => data(api.post("/whatsapp/desconectar", {}, { timeout: 30000 })),
  setBot: (enabled) => data(api.post("/whatsapp/bot", { enabled }, { timeout: 30000 })),
  conversations: () => data(api.get("/whatsapp/conversas")),
  conversationMessages: (conversationId) => data(api.get(`/whatsapp/conversas/${conversationId}/mensagens`)),
  pauseAi: (conversationId) => data(api.post(`/whatsapp/conversas/${conversationId}/pausar-ia`, {})),
  resumeAi: (conversationId) => data(api.post(`/whatsapp/conversas/${conversationId}/retomar-ia`, {})),

  getSettings: () => data(api.get("/whatsapp/configuracao")),
  updateSettings: (body) => data(api.put("/whatsapp/configuracao", body)),
  replaceHours: (weekly) => data(api.put("/whatsapp/horarios", { weekly })),
  addException: (body) => data(api.post("/whatsapp/horarios/excecoes", body)),
  removeException: (id) => data(api.delete(`/whatsapp/horarios/excecoes/${id}`)),
};
