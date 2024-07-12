
import moment from "moment"

export const toMoneyFormat = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export const toDateFormat = (date, full) => {
    return full ? moment(date).format("DD/MM/YYYY HH:mm:ss") : moment(date).format("DD/MM/YYYY")
}

export const moneyToDecimal = (value) => {
    value = value.replace("R$", "")
    value = +value
    return value
}