import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { Button, Input, Skeleton, notification } from "antd";
import {
  ClockCircleOutlined,
  InboxOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import SimplePage, { Chips, EmptyState, Section, StatCard, useIsMobile } from "components/simple/SimplePage";
import SaleList, { useSaleNotes } from "components/simple/SaleList";
import useSaleExclusion from "components/simple/useSaleExclusion";
import { PAYMENTS, fetchSales, money, saleTotal, totalsByPayment } from "components/simple/sales";
import { getCaixaEmAberto } from "helpers/caixa.adapter";
import SaleDetailsModal from "components/modalVenda";
import FiscalSaleModal from "views/fiscal/FiscalSaleModal";

const matches = (venda, term) => {
  if (!term) return true;
  const t = term.toLowerCase().trim();
  return (
    String(venda.id).includes(t) ||
    (venda.nome_cliente || "").toLowerCase().includes(t) ||
    saleTotal(venda).toFixed(2).replace(".", ",").includes(t.replace("r$", "").trim())
  );
};

const VendasDoDia = () => {
  const history = useHistory();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [caixa, setCaixa] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [filter, setFilter] = useState("todas");
  const [search, setSearch] = useState("");
  const [details, setDetails] = useState(null);
  const [notaVendaId, setNotaVendaId] = useState(null);
  const [notesKey, setNotesKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCaixaEmAberto();
      const abertos = Array.isArray(res?.data) ? res.data : [];
      const cx = abertos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0] || null;
      setCaixa(cx);
      const start = cx ? dayjs(cx.createdAt) : dayjs().startOf("day");
      setVendas(await fetchSales(start, dayjs().endOf("day")));
    } catch (error) {
      notification.error({ message: "Não foi possível carregar o resumo", description: "Confira sua internet e toque em Atualizar." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const exclusion = useSaleExclusion(load);
  const notas = useSaleNotes(vendas, notesKey);

  const totals = useMemo(() => totalsByPayment(vendas), [vendas]);
  const total = useMemo(() => vendas.reduce((acc, v) => acc + saleTotal(v), 0), [vendas]);
  const pendentes = vendas.filter((v) => v.exclusionRequested && v.exclusionStatus === "pending");
  const trocoInicial = Number(caixa?.saldoInicial) || 0;
  const abertoDesde = caixa ? dayjs(caixa.createdAt) : null;
  const caixaDeOutroDia = abertoDesde && !abertoDesde.isSame(dayjs(), "day");

  const lista = vendas.filter((v) => (filter === "pedidos" ? pendentes.includes(v) : true)).filter((v) => matches(v, search));

  const subtitle = loading
    ? "Carregando..."
    : caixa
    ? `Caixa aberto desde ${abertoDesde.format(caixaDeOutroDia ? "DD/MM [às] HH:mm" : "HH:mm")}`
    : `Caixa fechado · ${dayjs().format("DD/MM/YYYY")}`;

  const refresh = (
    <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
      Atualizar
    </Button>
  );

  const goCaixa = () => history.push("/admin/checkout");

  return (
    <SimplePage
      title="Resumo do dia"
      subtitle={subtitle}
      actions={
        <>
          {refresh}
          <Button type="primary" icon={<ShoppingCartOutlined />} onClick={goCaixa}>
            Ir para o caixa
          </Button>
        </>
      }
      mobileActions={
        <button type="button" className="sp-round" aria-label="Atualizar" onClick={load}>
          <ReloadOutlined spin={loading} />
        </button>
      }
    >
      {loading && !vendas.length && !caixa ? (
        <div className="sp-card">
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      ) : (
        <div className="sp-stack">
          {!caixa && (
            <div className="sp-card">
              <EmptyState
                icon={<InboxOutlined />}
                title="O caixa está fechado"
                text="Para começar a vender, abra o caixa informando quanto dinheiro tem de troco na gaveta."
                action={
                  <Button type="primary" size="large" icon={<ShoppingCartOutlined />} onClick={goCaixa}>
                    Abrir o caixa
                  </Button>
                }
              />
            </div>
          )}

          {caixaDeOutroDia && (
            <div className="sp-note" style={{ marginTop: 0 }}>
              <ClockCircleOutlined /> Este caixa foi aberto em {abertoDesde.format("DD/MM")} e ainda não foi fechado. Os números abaixo
              somam tudo desde aquele dia. Feche o caixa no fim do expediente para começar o próximo dia zerado.{" "}
              <Button size="small" onClick={goCaixa} style={{ marginTop: 6 }}>
                Fechar o caixa
              </Button>
            </div>
          )}

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

          {(caixa || vendas.length > 0) && (
          <>
          <div className="sp-hero">
            <small>{caixa ? "Vendido desde que o caixa abriu" : "Vendido hoje"}</small>
            <b>{money(total)}</b>
            <span>
              {vendas.length === 0
                ? "Nenhuma venda ainda"
                : `${vendas.length} ${vendas.length === 1 ? "venda" : "vendas"} · valor médio ${money(total / vendas.length)}`}
            </span>
          </div>

          <div className="sp-stats">
            {Object.entries(PAYMENTS).map(([key, p]) => (
              <StatCard key={key} icon={p.icon} tone={p.tone} label={p.short || p.label} value={money(totals[key])} />
            ))}
            {totals.misto > 0 && <StatCard tone="gray" label="Pagamento misto" value={money(totals.misto)} hint="Mais de uma forma" />}
          </div>
          </>
          )}

          {caixa && (
            <Section
              icon={<WalletOutlined />}
              title="Dinheiro que deve ter na gaveta"
              subtitle="Confira na hora de fechar o caixa. Pix e cartão não entram aqui."
            >
              <div className="sp-bars">
                <div className="sp-bar-row" style={{ gridTemplateColumns: "1fr auto" }}>
                  <span>Troco que já estava na abertura</span>
                  <span className="sp-bar-value">{money(trocoInicial)}</span>
                </div>
                <div className="sp-bar-row" style={{ gridTemplateColumns: "1fr auto" }}>
                  <span>+ Vendas em dinheiro</span>
                  <span className="sp-bar-value">{money(totals.dinheiro)}</span>
                </div>
                <div
                  className="sp-bar-row"
                  style={{ gridTemplateColumns: "1fr auto", borderTop: "1px solid #e7e5e4", paddingTop: 10, fontSize: 15 }}
                >
                  <b>= Total na gaveta</b>
                  <b style={{ fontSize: 18 }}>{money(trocoInicial + totals.dinheiro)}</b>
                </div>
              </div>
              {totals.misto > 0 && (
                <div className="sp-note is-info">
                  Há {money(totals.misto)} em vendas com mais de uma forma de pagamento. Some a parte paga em dinheiro.
                </div>
              )}
            </Section>
          )}

          <div className="sp-toolbar" style={{ justifyContent: "space-between" }}>
            <h3 className="sp-card-title" style={{ margin: 0 }}>
              Vendas {caixa ? "deste caixa" : "de hoje"}
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
            emptyText={search ? "Nenhuma venda encontrada com essa busca." : "Nenhuma venda por enquanto. Elas aparecem aqui assim que forem feitas no caixa."}
          />
        </div>
      )}

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
};

export default VendasDoDia;
