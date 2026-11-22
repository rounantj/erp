import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Button, DatePicker, Input, Skeleton, notification } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BarChartOutlined,
  CalendarOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  TagOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import SimplePage, { Chips, Section, StatCard, useIsMobile } from "components/simple/SimplePage";
import SaleList, { useSaleNotes } from "components/simple/SaleList";
import useSaleExclusion from "components/simple/useSaleExclusion";
import { PAYMENTS, fetchSales, money, paymentLabel, saleTotal, totalsByPayment } from "components/simple/sales";
import SaleDetailsModal from "components/modalVenda";
import FiscalSaleModal from "views/fiscal/FiscalSaleModal";

export const calcularTotal = (valor, desconto) => {
  return +valor - +desconto;
};

export const calcularTotalItens = (itens) => {
  if (!Array.isArray(itens)) return 0;

  return itens.reduce((total, item) => {
    const valor = parseFloat(item.valorEditado !== undefined ? item.valorEditado : item.valor) || 0;
    const quantidade = parseInt(item.qtd) || 0;
    return total + valor * quantidade;
  }, 0);
};

const PERIODS = {
  hoje: { label: "Hoje", range: () => [dayjs().startOf("day"), dayjs().endOf("day")] },
  ontem: { label: "Ontem", range: () => [dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")] },
  semana: { label: "Últimos 7 dias", range: () => [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")] },
  mes: { label: "Este mês", range: () => [dayjs().startOf("month"), dayjs().endOf("day")] },
  mesPassado: {
    label: "Mês passado",
    range: () => [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")],
  },
  outro: { label: "Escolher datas" },
};

const describeRange = ([start, end]) => {
  if (start.isSame(end, "day")) return start.format("DD [de] MMMM");
  if (start.isSame(end, "month")) return `${start.format("D")} a ${end.format("D [de] MMMM")}`;
  return `${start.format("DD/MM/YY")} a ${end.format("DD/MM/YY")}`;
};

const previousRange = ([start, end], period) => {
  if (period === "mes") {
    const prevStart = start.subtract(1, "month");
    return [prevStart, prevStart.add(end.diff(start, "day"), "day").endOf("day")];
  }
  if (period === "mesPassado") return [start.subtract(1, "month"), start.subtract(1, "month").endOf("month")];
  const days = end.startOf("day").diff(start.startOf("day"), "day") + 1;
  return [start.subtract(days, "day"), end.subtract(days, "day")];
};

const groupSales = (vendas, [start, end]) => {
  const oneDay = start.isSame(end, "day");
  const byMonth = end.diff(start, "day") > 62;
  const key = (d) => (oneDay ? d.format("HH") : byMonth ? d.format("YYYY-MM") : d.format("YYYY-MM-DD"));
  const label = (d) => (oneDay ? `${d.format("HH")}h` : byMonth ? d.format("MMM/YY") : d.format("ddd DD/MM"));
  const groups = new Map();
  vendas.forEach((v) => {
    const d = dayjs(v.createdAt);
    const k = key(d);
    const g = groups.get(k) || { key: k, label: label(d), total: 0, count: 0 };
    g.total += saleTotal(v);
    g.count += 1;
    groups.set(k, g);
  });
  return {
    title: oneDay ? "Vendas por horário" : byMonth ? "Vendas por mês" : "Vendas por dia",
    rows: [...groups.values()].sort((a, b) => a.key.localeCompare(b.key)),
  };
};

const matches = (venda, term) => {
  if (!term) return true;
  const t = term.toLowerCase().trim();
  return (
    String(venda.id).includes(t) ||
    (venda.nome_cliente || "").toLowerCase().includes(t) ||
    saleTotal(venda).toFixed(2).replace(".", ",").includes(t.replace("r$", "").trim())
  );
};

function Vendas() {
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState("mes");
  const [range, setRange] = useState(PERIODS.mes.range());
  const [vendas, setVendas] = useState([]);
  const [anterior, setAnterior] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todas");
  const [search, setSearch] = useState("");
  const [details, setDetails] = useState(null);
  const [notaVendaId, setNotaVendaId] = useState(null);
  const [notesKey, setNotesKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [atual, prev] = await Promise.all([
        fetchSales(range[0], range[1]),
        fetchSales(...previousRange(range, period)).catch(() => null),
      ]);
      setVendas(atual);
      setAnterior(prev ? prev.reduce((acc, v) => acc + saleTotal(v), 0) : null);
    } catch (error) {
      notification.error({ message: "Não foi possível carregar as vendas", description: "Confira sua internet e tente de novo." });
    } finally {
      setLoading(false);
    }
  }, [range, period]);

  useEffect(() => {
    load();
  }, [load]);

  const exclusion = useSaleExclusion(load);
  const notas = useSaleNotes(vendas, notesKey);

  const choosePeriod = (key) => {
    setPeriod(key);
    if (PERIODS[key].range) setRange(PERIODS[key].range());
  };

  const setCustom = (index, value) => {
    if (!value) return;
    const next = [...range];
    next[index] = index === 0 ? value.startOf("day") : value.endOf("day");
    if (next[0].isAfter(next[1])) next[index === 0 ? 1 : 0] = index === 0 ? value.endOf("day") : value.startOf("day");
    setRange(next);
  };

  const total = useMemo(() => vendas.reduce((acc, v) => acc + saleTotal(v), 0), [vendas]);
  const pagamentos = useMemo(() => totalsByPayment(vendas), [vendas]);
  const grupos = useMemo(() => groupSales(vendas, range), [vendas, range]);
  const melhor = useMemo(() => grupos.rows.reduce((best, g) => (!best || g.total > best.total ? g : best), null), [grupos]);
  const pendentes = vendas.filter((v) => v.exclusionRequested && v.exclusionStatus === "pending");
  const lista = vendas.filter((v) => (filter === "pedidos" ? pendentes.includes(v) : true)).filter((v) => matches(v, search));
  const variacao = anterior ? ((total - anterior) / anterior) * 100 : null;
  const maxGrupo = Math.max(...grupos.rows.map((g) => g.total), 1);

  const exportar = () => {
    if (!vendas.length) {
      notification.info({ message: "Não há vendas nesse período para baixar." });
      return;
    }
    const rows = vendas.map((v) => ({
      "Nº da venda": v.id,
      Data: dayjs(v.createdAt).format("DD/MM/YYYY HH:mm"),
      Cliente: v.nome_cliente || "",
      "Forma de pagamento": paymentLabel(v.metodoPagamento),
      Valor: Number(v.total) || 0,
      Desconto: Number(v.desconto) || 0,
      "Valor final": saleTotal(v),
      Situação: v.exclusionStatus === "pending" ? "Pedido de exclusão" : "Normal",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet["!cols"] = [{ wch: 12 }, { wch: 18 }, { wch: 28 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 20 }];
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Vendas");
    XLSX.writeFile(book, `vendas_${range[0].format("DD-MM-YYYY")}_a_${range[1].format("DD-MM-YYYY")}.xlsx`);
  };

  const comparacao =
    variacao === null
      ? null
      : Math.abs(variacao) < 0.5
      ? "Igual ao período anterior"
      : (
          <>
            {variacao > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(variacao).toFixed(0)}%{" "}
            {variacao > 0 ? "a mais" : "a menos"} que no período anterior ({money(anterior)})
          </>
        );

  return (
    <SimplePage
      title="Faturamento"
      subtitle="Quanto a loja vendeu"
      actions={
        <>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Atualizar
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportar}>
            Baixar planilha
          </Button>
        </>
      }
      mobileActions={
        <button type="button" className="sp-round" aria-label="Baixar planilha" onClick={exportar}>
          <DownloadOutlined />
        </button>
      }
    >
      <div className="sp-stack">
        <div>
          <Chips value={period} onChange={choosePeriod} options={Object.entries(PERIODS).map(([value, p]) => ({ value, label: p.label }))} />
          {period === "outro" && (
            <div className="sp-toolbar" style={{ marginTop: 10 }}>
              <DatePicker
                value={range[0]}
                onChange={(v) => setCustom(0, v)}
                format="DD/MM/YYYY"
                allowClear={false}
                inputReadOnly={isMobile}
                placeholder="De"
                style={{ flex: isMobile ? 1 : "0 0 170px" }}
              />
              <span style={{ color: "#78716c" }}>até</span>
              <DatePicker
                value={range[1]}
                onChange={(v) => setCustom(1, v)}
                format="DD/MM/YYYY"
                allowClear={false}
                inputReadOnly={isMobile}
                placeholder="Até"
                style={{ flex: isMobile ? 1 : "0 0 170px" }}
              />
            </div>
          )}
        </div>

        {loading && !vendas.length ? (
          <div className="sp-card">
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : (
          <>
            {exclusion.isAdmin && pendentes.length > 0 && filter !== "pedidos" && (
              <div className="sp-note" style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ flex: "1 1 220px" }}>
                  {pendentes.length === 1 ? "1 pedido de exclusão de venda espera" : `${pendentes.length} pedidos de exclusão de venda esperam`} sua resposta.
                </span>
                <Button size="small" onClick={() => setFilter("pedidos")}>
                  Ver pedidos
                </Button>
              </div>
            )}

            <div className="sp-hero">
              <small>
                <CalendarOutlined /> Vendido {period === "hoje" ? "hoje" : period === "ontem" ? "ontem" : `de ${describeRange(range)}`}
              </small>
              <b>{money(total)}</b>
              <span>{comparacao || (vendas.length ? "" : "Nenhuma venda nesse período")}</span>
            </div>

            <div className="sp-stats">
              <StatCard icon={<ShoppingCartOutlined />} label="Número de vendas" value={vendas.length} />
              <StatCard
                icon={<TagOutlined />}
                tone="blue"
                label="Valor médio por venda"
                value={money(vendas.length ? total / vendas.length : 0)}
              />
              <StatCard
                icon={<StarOutlined />}
                tone="orange"
                label={grupos.title === "Vendas por horário" ? "Melhor horário" : grupos.title === "Vendas por mês" ? "Melhor mês" : "Melhor dia"}
                value={melhor ? money(melhor.total) : "—"}
                hint={melhor ? `${melhor.label} · ${melhor.count} ${melhor.count === 1 ? "venda" : "vendas"}` : null}
              />
            </div>

            {vendas.length > 0 && (
              <div className="sp-grid-2">
                <Section icon={<WalletOutlined />} title="Como os clientes pagaram" subtitle="Quanto entrou em cada forma de pagamento">
                  <div className="sp-bars">
                    {[...Object.entries(PAYMENTS), ["misto", { label: "Misto", tone: "gray" }]]
                      .filter(([key]) => key !== "misto" || pagamentos.misto > 0)
                      .map(([key, p]) => {
                        const pct = total ? (pagamentos[key] / total) * 100 : 0;
                        return (
                          <div className="sp-bar-row" key={key} style={{ gridTemplateColumns: isMobile ? "64px 1fr auto" : "110px 1fr auto" }}>
                            <span>{isMobile ? p.short || p.label : p.label}</span>
                            <div className="sp-bar-track">
                              <div
                                className="sp-bar-fill"
                                style={{ width: `${pct}%`, background: { green: "#16a34a", blue: "#2563eb", purple: "#7c3aed", orange: "#d97706" }[p.tone] || "#a8a29e" }}
                              />
                            </div>
                            <span className="sp-bar-value">
                              {money(pagamentos[key])} <span style={{ color: "#a8a29e", fontWeight: 400 }}>{pct.toFixed(0)}%</span>
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </Section>

                <Section icon={<BarChartOutlined />} title={grupos.title} subtitle="Quanto foi vendido em cada período">
                  <div className="sp-bars" style={{ maxHeight: 300, overflowY: "auto", paddingRight: 4 }}>
                    {grupos.rows.map((g) => (
                      <div className="sp-bar-row" key={g.key} style={{ gridTemplateColumns: isMobile ? "76px 1fr auto" : "96px 1fr auto" }}>
                        <span style={{ textTransform: "capitalize" }}>{g.label}</span>
                        <div className="sp-bar-track">
                          <div className="sp-bar-fill" style={{ width: `${(g.total / maxGrupo) * 100}%` }} />
                        </div>
                        <span className="sp-bar-value">{money(g.total)}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            <div className="sp-toolbar" style={{ justifyContent: "space-between" }}>
              <h3 className="sp-card-title" style={{ margin: 0 }}>
                Lista de vendas
              </h3>
              {vendas.length > 0 && (
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Buscar nº da venda, cliente ou valor"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: isMobile ? "100%" : 320 }}
                />
              )}
            </div>

            {pendentes.length > 0 && (
              <Chips
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "todas", label: "Todas", count: vendas.length },
                  { value: "pedidos", label: "Pedidos de exclusão", count: pendentes.length },
                ]}
              />
            )}

            <SaleList
              vendas={lista}
              notasPorVenda={notas}
              onDetails={setDetails}
              onNota={(v) => setNotaVendaId(v.id)}
              exclusion={exclusion}
              emptyText={search ? "Nenhuma venda encontrada com essa busca." : "Nenhuma venda nesse período."}
            />
          </>
        )}
      </div>

      {exclusion.modals}
      <SaleDetailsModal visible={!!details} onClose={() => setDetails(null)} saleData={details} />
      <FiscalSaleModal
        open={!!notaVendaId}
        vendaId={notaVendaId}
        onClose={() => {
          setNotaVendaId(null);
          setNotesKey((k) => k + 1);
        }}
      />
    </SimplePage>
  );
}

export default Vendas;
