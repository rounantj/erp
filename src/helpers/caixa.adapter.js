import axios from "axios";
import { urlBase } from "./environment";
const headers = {
  "Content-Type": "application/json",
};

export const vendaFinaliza = (
  venda,
  infoPagamento,
  opcoesCupom,
  caixaId,
  selectedCliente
) => {
  // Calcular total da venda
  const total = venda.reduce((sum, item) => {
    const valor =
      parseFloat(
        item.valorEditado !== undefined ? item.valorEditado : item.valor
      ) || 0;
    const quantidade = parseInt(item.qtd) || 0;
    return sum + valor * quantidade;
  }, 0);

  // Preparar produtos para o formato esperado pelo backend
  const produtos = venda.map((item) => ({
    ...item,
    quantidade: parseInt(item.qtd) || 0,
    desconto: 0, // Por enquanto sem desconto
  }));

  // Criar objeto de venda completo
  const vendaData = {
    nome_cliente: selectedCliente?.nome || "Cliente Padrão",
    total: total,
    metodoPagamento: infoPagamento?.formaPagamento?.join(", ") || "Dinheiro",
    produtos: produtos,
    caixaId: caixaId || 1, // Usar o ID do caixa atual
    desconto: 0,
    clienteId: selectedCliente?.id || null,
  };

  return axios.post(`${urlBase}/vendas`, vendaData, { headers });
};

export const openCaixa = (valorAbertura) => {
  return axios.post(
    `${urlBase}/caixa/open`,
    { valorAbertura },
    { headers }
  );
};

export const fechaCaixa = (caixaId, userId, saldoFinal, diferenca) => {
  return axios.post(
    `${urlBase}/caixa/close`,
    { caixaId, userId, saldoFinal, diferenca },
    { headers }
  );
};

export const getCaixaEmAberto = () => {
  return axios.get(`${urlBase}/caixa/no-closeds`, { headers });
};

export const getResumoVendas = (caixaId) => {
  return axios.get(`${urlBase}/caixa/resumo?caixaId=${caixaId}`, { headers });
};
