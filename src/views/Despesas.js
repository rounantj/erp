import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Button, DatePicker, Form, Input, InputNumber, Modal, Radio, Skeleton, notification } from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  PlusOutlined,
  RetweetOutlined,
  SearchOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import SimplePage, { Chips, EmptyState, Icon, StatCard, useIsMobile } from "components/simple/SimplePage";
import { money } from "components/simple/sales";
import { delDepesa, getDespesas, updateDespesa } from "helpers/api-integrator";

const SUGESTOES = ["Aluguel", "Conta de luz", "Conta de água", "Internet", "Fornecedor", "Salário", "Contador", "Impostos (DAS)"];

const dueDate = (d) => dayjs(String(d.vencimento).slice(0, 10));
const isPaid = (d) => d.status === "Pago";
const daysLeft = (d) => dueDate(d).diff(dayjs().startOf("day"), "day");

const situacao = (d) => {
  if (isPaid(d)) return { tone: "green", text: `Paga · vencia em ${dueDate(d).format("DD/MM/YYYY")}` };
  const n = daysLeft(d);
  if (n < 0) return { tone: "red", text: `Atrasada · venceu há ${-n} ${n === -1 ? "dia" : "dias"} (${dueDate(d).format("DD/MM")})` };
  if (n === 0) return { tone: "orange", text: "Vence hoje" };
  if (n === 1) return { tone: "orange", text: "Vence amanhã" };
  if (n <= 7) return { tone: "orange", text: `Vence em ${n} dias (${dueDate(d).format("DD/MM")})` };
  return { tone: "gray", text: `Vence em ${dueDate(d).format("DD/MM/YYYY")}` };
};

const FILTERS = {
  pagar: { label: "A pagar", test: (d) => !isPaid(d) },
  atrasadas: { label: "Atrasadas", test: (d) => !isPaid(d) && daysLeft(d) < 0 },
  semana: { label: "Vencem em 7 dias", test: (d) => !isPaid(d) && daysLeft(d) >= 0 && daysLeft(d) <= 7 },
  pagas: { label: "Pagas", test: isPaid },
  todas: { label: "Todas", test: () => true },
};

const sum = (list) => list.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

function Despesas() {
  const isMobile = useIsMobile();
  const [form] = Form.useForm();
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("pagar");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getDespesas();
    if (res?.success) setDespesas(Array.isArray(res.data) ? res.data : []);
    else notification.error({ message: "Não foi possível carregar as despesas", description: "Confira sua internet e tente de novo." });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grupos = useMemo(() => {
    const out = {};
    Object.entries(FILTERS).forEach(([key, f]) => (out[key] = despesas.filter(f.test)));
    return out;
  }, [despesas]);

  const pagoNoMes = useMemo(() => grupos.pagas.filter((d) => dueDate(d).isSame(dayjs(), "month")), [grupos]);

  const lista = useMemo(() => {
    const term = search.toLowerCase().trim();
    return grupos[filter]
      .filter((d) => !term || (d.descricao || "").toLowerCase().includes(term))
      .sort((a, b) => (filter === "pagas" ? dueDate(b) - dueDate(a) : dueDate(a) - dueDate(b)));
  }, [grupos, filter, search]);

  const openForm = (despesa) => setEditing(despesa || {});

  const initialValues = editing?.id
    ? { descricao: editing.descricao, valor: editing.valor, vencimento: dueDate(editing), pago: isPaid(editing), fixa: !!editing.fixa }
    : { descricao: "", valor: null, vencimento: dayjs(), pago: false, fixa: false };

  const save = async (payload) => {
    const res = await updateDespesa(payload);
    if (!res?.success) {
      notification.error({ message: "Não foi possível salvar", description: "Tente de novo em instantes." });
      return false;
    }
    return true;
  };

  const submit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const ok = await save({
      ...(editing?.id ? { id: editing.id } : {}),
      descricao: values.descricao.trim(),
      valor: values.valor,
      vencimento: values.vencimento.format("YYYY-MM-DD"),
      status: values.pago ? "Pago" : "Em Aberto",
      fixa: values.fixa,
    });
    setSaving(false);
    if (!ok) return;
    notification.success({ message: editing?.id ? "Despesa atualizada" : "Despesa cadastrada" });
    setEditing(null);
    load();
  };

  const nextMonthExists = (d) => {
    const next = dueDate(d).add(1, "month");
    return despesas.some((x) => x.id !== d.id && x.descricao === d.descricao && dueDate(x).isSame(next, "month"));
  };

  const markPaid = async (d) => {
    setBusyId(d.id);
    const ok = await save({ ...d, vencimento: dueDate(d).format("YYYY-MM-DD"), status: "Pago" });
    setBusyId(null);
    if (!ok) return;
    notification.success({ message: `“${d.descricao}” marcada como paga` });
    if (d.fixa && !nextMonthExists(d)) {
      const next = dueDate(d).add(1, "month");
      Modal.confirm({
        title: "Deixar a do próximo mês cadastrada?",
        icon: <RetweetOutlined />,
        content: `“${d.descricao}” se repete todo mês. Quer que eu já cadastre a próxima, de ${money(d.valor)}, vencendo em ${next.format("DD/MM/YYYY")}?`,
        okText: "Sim, cadastrar",
        cancelText: "Agora não",
        onOk: async () => {
          if (await save({ descricao: d.descricao, valor: d.valor, fixa: true, status: "Em Aberto", vencimento: next.format("YYYY-MM-DD") })) {
            notification.success({ message: "Próxima conta cadastrada" });
          }
          load();
        },
        onCancel: load,
      });
    } else {
      load();
    }
  };

  const remove = (d) =>
    Modal.confirm({
      title: "Excluir esta despesa?",
      content: `“${d.descricao}” de ${money(d.valor)} será apagada da lista.`,
      okText: "Excluir",
      okButtonProps: { danger: true },
      cancelText: "Voltar",
      onOk: async () => {
        const res = await delDepesa(d.id);
        if (!res?.success) {
          notification.error({ message: "Não foi possível excluir" });
          return;
        }
        notification.success({ message: "Despesa excluída" });
        load();
      },
    });

  const exportar = () => {
    if (!despesas.length) return notification.info({ message: "Ainda não há despesas para baixar." });
    const rows = [...despesas]
      .sort((a, b) => dueDate(a) - dueDate(b))
      .map((d) => ({
        Despesa: d.descricao,
        Valor: Number(d.valor) || 0,
        Vencimento: dueDate(d).format("DD/MM/YYYY"),
        Situação: isPaid(d) ? "Paga" : daysLeft(d) < 0 ? "Atrasada" : "A pagar",
        "Repete todo mês": d.fixa ? "Sim" : "Não",
      }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet["!cols"] = [{ wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }];
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Despesas");
    XLSX.writeFile(book, `despesas_${dayjs().format("DD-MM-YYYY")}.xlsx`);
  };

  const novaBtn = (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()} size={isMobile ? "large" : "middle"} block={isMobile}>
      Nova despesa
    </Button>
  );

  return (
    <SimplePage
      title="Despesas"
      subtitle="Contas da loja: aluguel, luz, fornecedores..."
      actions={
        <>
          <Button icon={<DownloadOutlined />} onClick={exportar}>
            Baixar planilha
          </Button>
          {novaBtn}
        </>
      }
      mobileActions={
        <button type="button" className="sp-round" aria-label="Baixar planilha" onClick={exportar}>
          <DownloadOutlined />
        </button>
      }
    >
      <div className="sp-stack">
        {isMobile && novaBtn}

        {loading && !despesas.length ? (
          <div className="sp-card">
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : !despesas.length ? (
          <div className="sp-card">
            <EmptyState
              icon={<FileTextOutlined />}
              title="Nenhuma despesa cadastrada"
              text="Cadastre as contas da loja (aluguel, luz, fornecedores) para nunca esquecer um vencimento e saber quanto sobra no fim do mês."
              action={!isMobile && novaBtn}
            />
          </div>
        ) : (
          <>
            <div className="sp-stats">
              <StatCard
                icon={<WalletOutlined />}
                label="Total a pagar"
                value={money(sum(grupos.pagar))}
                hint={`${grupos.pagar.length} ${grupos.pagar.length === 1 ? "conta" : "contas"}`}
                onClick={() => setFilter("pagar")}
                active={filter === "pagar"}
              />
              <StatCard
                icon={<ExclamationCircleOutlined />}
                tone="red"
                label="Atrasadas"
                value={money(sum(grupos.atrasadas))}
                hint={grupos.atrasadas.length ? `${grupos.atrasadas.length} vencida(s)` : "Nenhuma, tudo em dia"}
                onClick={() => setFilter("atrasadas")}
                active={filter === "atrasadas"}
              />
              <StatCard
                icon={<CalendarOutlined />}
                tone="orange"
                label="Vencem em 7 dias"
                value={money(sum(grupos.semana))}
                hint={`${grupos.semana.length} ${grupos.semana.length === 1 ? "conta" : "contas"}`}
                onClick={() => setFilter("semana")}
                active={filter === "semana"}
              />
              <StatCard
                icon={<CheckCircleOutlined />}
                tone="green"
                label="Pago este mês"
                value={money(sum(pagoNoMes))}
                hint={`${pagoNoMes.length} ${pagoNoMes.length === 1 ? "conta" : "contas"}`}
                onClick={() => setFilter("pagas")}
                active={filter === "pagas"}
              />
            </div>

            <div className="sp-toolbar" style={{ justifyContent: "space-between" }}>
              <Chips
                value={filter}
                onChange={setFilter}
                options={Object.entries(FILTERS).map(([value, f]) => ({ value, label: f.label, count: grupos[value].length }))}
              />
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Buscar despesa"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: isMobile ? "100%" : 260 }}
              />
            </div>

            {!lista.length ? (
              <div className="sp-card" style={{ textAlign: "center", color: "#78716c", padding: 28 }}>
                {search
                  ? "Nenhuma despesa encontrada com essa busca."
                  : filter === "atrasadas"
                  ? "Nenhuma conta atrasada. Tudo em dia! 🎉"
                  : filter === "pagar"
                  ? "Nenhuma conta a pagar. Tudo pago! 🎉"
                  : filter === "semana"
                  ? "Nenhuma conta vence nos próximos 7 dias."
                  : "Nenhuma despesa aqui."}
              </div>
            ) : (
              <div className="sp-list">
                {lista.map((d) => {
                  const s = situacao(d);
                  return (
                    <div className="sp-item" key={d.id}>
                      <Icon tone={s.tone} size={40}>
                        {isPaid(d) ? <CheckOutlined /> : s.tone === "red" ? <ExclamationCircleOutlined /> : <CalendarOutlined />}
                      </Icon>
                      <div className="sp-item-main">
                        <div className="sp-item-top">
                          <span className="sp-item-title">{d.descricao}</span>
                          <span className="sp-item-value">{money(d.valor)}</span>
                        </div>
                        <div className="sp-item-meta">
                          <span style={{ color: { red: "#dc2626", orange: "#b45309", green: "#15803d" }[s.tone], fontWeight: 500 }}>
                            {s.text}
                          </span>
                          {d.fixa && (
                            <span>
                              <RetweetOutlined /> Todo mês
                            </span>
                          )}
                        </div>
                        <div className="sp-item-actions">
                          {!isPaid(d) && (
                            <Button type="primary" icon={<CheckOutlined />} loading={busyId === d.id} onClick={() => markPaid(d)}>
                              Marcar como paga
                            </Button>
                          )}
                          <Button icon={<EditOutlined />} onClick={() => openForm(d)}>
                            Editar
                          </Button>
                          <Button danger icon={<DeleteOutlined />} onClick={() => remove(d)}>
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={!!editing}
        title={editing?.id ? "Editar despesa" : "Nova despesa"}
        onCancel={() => setEditing(null)}
        destroyOnClose
        footer={[
          <Button key="cancel" onClick={() => setEditing(null)}>
            Cancelar
          </Button>,
          <Button key="ok" type="primary" icon={<CheckOutlined />} loading={saving} onClick={submit}>
            Salvar
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" requiredMark={false} preserve={false} initialValues={initialValues}>
          <Form.Item name="descricao" label="O que é essa conta?" rules={[{ required: true, whitespace: true, message: "Escreva o nome da conta" }]}>
            <Input size="large" placeholder="Ex.: Aluguel, Conta de luz" maxLength={100} />
          </Form.Item>
          {!editing?.id && (
            <Form.Item noStyle shouldUpdate={(a, b) => a.descricao !== b.descricao}>
              {() => (
                <div className="sp-chips" style={{ flexWrap: "wrap", margin: "-12px 0 16px" }}>
                  {SUGESTOES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`sp-chip${form.getFieldValue("descricao") === s ? " is-active" : ""}`}
                      style={{ padding: "4px 12px", fontSize: 13 }}
                      onClick={() => form.setFieldsValue({ descricao: s, fixa: ["Aluguel", "Conta de luz", "Conta de água", "Internet", "Salário", "Contador", "Impostos (DAS)"].includes(s) })}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </Form.Item>
          )}
          <div className="sp-grid-2" style={{ gap: 12, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
            <Form.Item name="valor" label="Valor" rules={[{ required: true, message: "Informe o valor" }]}>
              <InputNumber
                size="large"
                prefix="R$"
                min={0}
                precision={2}
                decimalSeparator=","
                placeholder="0,00"
                inputMode="decimal"
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Form.Item name="vencimento" label="Quando vence?" rules={[{ required: true, message: "Escolha a data" }]}>
              <DatePicker size="large" format="DD/MM/YYYY" allowClear={false} inputReadOnly={isMobile} style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item name="pago" label="Já está paga?">
            <Radio.Group optionType="button" buttonStyle="solid" style={{ display: "flex" }}>
              <Radio.Button value={false} style={{ flex: 1, textAlign: "center" }}>
                Ainda não
              </Radio.Button>
              <Radio.Button value={true} style={{ flex: 1, textAlign: "center" }}>
                Sim, já paguei
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="fixa" label="Essa conta se repete todo mês?" style={{ marginBottom: 0 }}>
            <Radio.Group optionType="button" buttonStyle="solid" style={{ display: "flex" }}>
              <Radio.Button value={false} style={{ flex: 1, textAlign: "center" }}>
                Não, só desta vez
              </Radio.Button>
              <Radio.Button value={true} style={{ flex: 1, textAlign: "center" }}>
                Sim, todo mês
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </SimplePage>
  );
}

export default Despesas;
