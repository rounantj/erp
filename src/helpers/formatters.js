
import moment from "moment"

export const toMoneyFormat = (value) => {

    console.log({ value })
    if (!value) return 0
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export const toDateFormat = (date, full) => {
    return full ? moment(date).format("DD/MM/YYYY HH:mm:ss") : moment(date).format("DD/MM/YYYY")
}

export const moneyToDecimal = (value) => {
    if (!value) return 0
    value = value?.replace("R$", "")
    value = +value
    return value
}

export const monthName = (month) => {
    if (!month) return "Invalid Month"
    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ]
    return months[+month]

}