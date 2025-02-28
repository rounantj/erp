import axios from "axios";
import { urlBase } from "./environment";
const headers = {
  "Content-Type": "application/json",
};

export const vendaFinaliza = (venda) => {
  return axios.post(`${urlBase}/vendas`, venda, { headers });
};

export const openCaixa = (userId, valorAbertura) => {
  return axios.post(
    `${urlBase}/caixa/open`,
    { companyId: 1, userId, valorAbertura },
    { headers }
  );
};

export const abreCaixa = (userId) => {
  return axios.post(`${urlBase}/vendas`, venda, { headers });
};

export const getCaixaEmAberto = () => {
  return axios.get(`${urlBase}/caixa/no-closeds`, { headers });
};

export const getResumoVendas = (caixaId) => {
  return axios.get(`${urlBase}/caixa/resumo?caixaId=${caixaId}`, { headers });
};
