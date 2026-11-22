import { apiIntegrator as api } from "helpers/api-integrator";

const data = (promise) => promise.then((r) => r.data);
const SLOW = { timeout: 90000 };

export const fiscalErrorMessage = (err, fallback = "Não foi possível concluir a ação.") => {
  const message = err?.response?.data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(" ");
  if (message?.message) return message.message;
  if (err?.code === "ECONNABORTED") return "A SEFAZ demorou para responder. Confira a nota na lista em instantes.";
  return fallback;
};

export const fiscalApi = {
  getConfig: () => data(api.get("/fiscal/config")),
  updateConfig: (body) => data(api.put("/fiscal/config", body)),
  uploadCertificate: (file, senha) => {
    const form = new FormData();
    form.append("arquivo", file);
    form.append("senha", senha);
    return data(api.post("/fiscal/config/certificado", form, { headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 }));
  },
  removeCertificate: () => data(api.delete("/fiscal/config/certificado")),
  lookupCnpj: (cnpj) => data(api.get(`/fiscal/consulta-cnpj/${String(cnpj).replace(/\D/g, "")}`, { timeout: 20000 })),
  testConnection: () => data(api.post("/fiscal/testar-conexao", {}, SLOW)),

  emitForSale: (vendaId, body = {}) => data(api.post(`/fiscal/vendas/${vendaId}/emitir`, body, SLOW)),
  saleDocuments: (vendaId) => data(api.get(`/fiscal/vendas/${vendaId}`)),
  salesStatus: (vendaIds) => data(api.post("/fiscal/vendas/status", { vendaIds })),
  list: (params) => data(api.get("/fiscal/documentos", { params })),
  get: (id) => data(api.get(`/fiscal/documentos/${id}`)),
  retry: (id) => data(api.post(`/fiscal/documentos/${id}/reenviar`, {}, SLOW)),
  cancel: (id, motivo) => data(api.post(`/fiscal/documentos/${id}/cancelar`, { motivo }, SLOW)),
  discard: (id) => data(api.post(`/fiscal/documentos/${id}/descartar`, {}, SLOW)),
  downloadXml: async (id, tipo = "nota") => {
    const response = await api.get(`/fiscal/documentos/${id}/xml`, { params: { tipo }, responseType: "blob" });
    const disposition = response.headers["content-disposition"] || "";
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `nota-${id}.xml`;
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

export const MODELO_LABEL = { nfce: "NFC-e", nfe: "NF-e", nfse: "NFS-e" };

export const STATUS_INFO = {
  processando: { label: "Processando", color: "processing" },
  autorizada: { label: "Autorizada", color: "success" },
  contingencia: { label: "Contingência", color: "warning" },
  rejeitada: { label: "Rejeitada", color: "error" },
  erro: { label: "Erro de envio", color: "error" },
  cancelada: { label: "Cancelada", color: "default" },
  inutilizada: { label: "Inutilizada", color: "default" },
  descartada: { label: "Descartada", color: "default" },
};

export const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

export const formatDoc = (value) => {
  const d = onlyDigits(value);
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return value || "";
};

export const brl = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
