import moment from "moment";

export const toMoneyFormat = (value) => {
  // Se o valor for falsy (0, null, undefined, etc.)
  if (value === null || value === undefined || value === "" || isNaN(value)) {
    return "R$ 0,00"; // Retorna uma string formatada para zero
  }

  // Converta para número caso seja uma string numérica
  const numericValue = typeof value === "string" ? parseFloat(value) : value;

  // Usar toLocaleString para formatar como moeda
  try {
    return numericValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  } catch (error) {
    console.warn("Erro ao formatar valor monetário:", error);
    return "R$ 0,00"; // Fallback seguro em caso de erro
  }
};

export const toDateFormat = (date, full) => {
  return full
    ? moment(date).format("DD/MM/YYYY HH:mm:ss")
    : moment(date).format("DD/MM/YYYY");
};

export const moneyToDecimal = (value) => {
  if (!value) return 0;
  value = value?.replace("R$", "");
  value = +value;
  return value;
};

export const monthName = (month) => {
  if (!month) return "Invalid Month";
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return months[+month];
};
