import React from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import {
  BankOutlined,
  CreditCardOutlined,
  QrcodeOutlined,
  WalletOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { apiIntegrator } from "helpers/api-integrator";

dayjs.locale("pt-br");

export const money = (value) =>
  (Number(value) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const saleTotal = (venda) => (Number(venda?.total) || 0) - (Number(venda?.desconto) || 0);

export const PAYMENTS = {
  dinheiro: { label: "Dinheiro", tone: "green", icon: <WalletOutlined /> },
  pix: { label: "Pix", tone: "blue", icon: <QrcodeOutlined /> },
  credito: { label: "Cartão de crédito", short: "Crédito", tone: "purple", icon: <CreditCardOutlined /> },
  debito: { label: "Cartão de débito", short: "Débito", tone: "orange", icon: <BankOutlined /> },
};

const normalize = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export const paymentKeys = (metodo) =>
  normalize(metodo)
    .split(/[,+/]/)
    .map((s) => s.trim())
    .filter(Boolean);

export const paymentLabel = (metodo) => {
  const keys = paymentKeys(metodo);
  if (!keys.length) return "Não informado";
  return keys.map((k) => PAYMENTS[k]?.label || k.charAt(0).toUpperCase() + k.slice(1)).join(" + ");
};

export const paymentInfo = (metodo) => {
  const keys = paymentKeys(metodo);
  if (keys.length === 1 && PAYMENTS[keys[0]]) return PAYMENTS[keys[0]];
  return { label: paymentLabel(metodo), tone: "gray", icon: <ShoppingOutlined /> };
};

/** Soma por forma de pagamento; vendas com mais de uma forma vão para "Misto". */
export const totalsByPayment = (vendas) => {
  const totals = { dinheiro: 0, pix: 0, credito: 0, debito: 0, misto: 0 };
  vendas.forEach((v) => {
    const keys = paymentKeys(v.metodoPagamento);
    const key = keys.length === 1 && totals[keys[0]] !== undefined ? keys[0] : "misto";
    totals[key] += saleTotal(v);
  });
  return totals;
};

export const isActiveSale = (v) => v.exclusionStatus !== "approved";

export const fetchSales = async (start, end) => {
  const { data } = await apiIntegrator.get("/vendas", {
    params: { startDate: dayjs(start).toISOString(), endDate: dayjs(end).toISOString() },
  });
  return (Array.isArray(data) ? data : []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const saleWhen = (date) => {
  const d = dayjs(date);
  if (d.isSame(dayjs(), "day")) return `hoje às ${d.format("HH:mm")}`;
  if (d.isSame(dayjs().subtract(1, "day"), "day")) return `ontem às ${d.format("HH:mm")}`;
  return d.format("DD/MM/YYYY [às] HH:mm");
};
