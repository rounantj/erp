import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Collapse, Form, Input, Modal, Skeleton, notification } from "antd";
import {
  CalendarOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PhoneOutlined,
  PlusOutlined,
  SearchOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import SimplePage, { Chips, EmptyState, StatCard, useIsMobile } from "components/simple/SimplePage";
import { money } from "components/simple/sales";
import { createCliente, deleteCliente, getClientes, updateCliente } from "helpers/api-integrator";

const PAGE = 40;
const AWAY_DAYS = 60;

const digits = (v) => String(v || "").replace(/\D/g, "");
const plain = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const formatPhone = (v) => {
  const d = digits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const formatDoc = (v) => {
  const d = digits(v).slice(0, 14);
  if (d.length <= 11)
    return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

const formatCep = (v) => digits(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

const whatsappLink = (phone) => {
  const d = digits(phone);
  if (d.length < 10) return null;
  return `https://wa.me/${d.length <= 11 ? `55${d}` : d}`;
};

const isDefault = (c) => plain(c.nome).startsWith("cliente padr");

const lastPurchase = (c) => {
  if (!c.ultimaCompra) return null;
  const days = dayjs().startOf("day").diff(dayjs(c.ultimaCompra).startOf("day"), "day");
  if (days <= 0) return "comprou hoje";
  if (days === 1) return "comprou ontem";
  if (days < 30) return `comprou há ${days} dias`;
  if (days < 60) return "comprou há 1 mês";
  if (days < 365) return `comprou há ${Math.floor(days / 30)} meses`;
  return `última compra em ${dayjs(c.ultimaCompra).format("DD/MM/YYYY")}`;
};

const daysAway = (c) => (c.ultimaCompra ? dayjs().diff(dayjs(c.ultimaCompra), "day") : null);

const FILTERS = {
  todos: { label: "Todos", test: () => true },
  mes: { label: "Compraram este mês", test: (c) => c.ultimaCompra && dayjs(c.ultimaCompra).isSame(dayjs(), "month") },
  sumidos: { label: `Sumidos (+${AWAY_DAYS} dias)`, test: (c) => daysAway(c) !== null && daysAway(c) > AWAY_DAYS },
  semTelefone: { label: "Sem telefone", test: (c) => digits(c.telefone).length < 10 },
};

const initials = (name) =>
  String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

export default function Clientes() {
  const isMobile = useIsMobile();
  const [form] = Form.useForm();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(PAGE);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getClientes();
    if (res?.success) setClientes(Array.isArray(res.data) ? res.data : []);
    else notification.error({ message: "Não foi possível carregar os clientes", description: "Confira sua internet e tente de novo." });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => setVisible(PAGE), [filter, search]);

  const reais = useMemo(() => clientes.filter((c) => !isDefault(c)), [clientes]);

  const groups = useMemo(() => {
    const out = {};
    Object.entries(FILTERS).forEach(([key, f]) => (out[key] = reais.filter(f.test)));
    return out;
  }, [reais]);

  const list = useMemo(() => {
    const term = plain(search.trim());
    const num = digits(search);
    const base = filter === "todos" ? clientes : groups[filter];
    return base
      .filter(
        (c) =>
          !term ||
          plain(c.nome).includes(term) ||
          (num.length >= 3 && (digits(c.telefone).includes(num) || digits(c.cpf_cnpj).includes(num))) ||
          plain(c.email).includes(term)
      )
      .sort((a, b) => (isDefault(a) ? 1 : isDefault(b) ? -1 : a.nome.localeCompare(b.nome, "pt-BR")));
  }, [clientes, groups, filter, search]);

  const openForm = (cliente) => setEditing(cliente || {});

  const initialValues = editing
    ? {
        nome: editing.nome || "",
        telefone: formatPhone(editing.telefone),
        cpf_cnpj: formatDoc(editing.cpf_cnpj),
        email: editing.email || "",
        cep: formatCep(editing.cep),
        endereco: editing.endereco || "",
        cidade: editing.cidade || "",
        estado: editing.estado || "",
        observacoes: editing.observacoes || "",
      }
    : {};

  const hasAddress = editing && (editing.cep || editing.endereco || editing.cidade || editing.email || editing.observacoes);

  const lookupCep = async (value) => {
    const cep = digits(value);
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const data = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then((r) => r.json());
      if (!data.erro) {
        form.setFieldsValue({
          endereco: [data.logradouro, data.bairro].filter(Boolean).join(", ") || form.getFieldValue("endereco"),
          cidade: data.localidade,
          estado: data.uf,
        });
      }
    } catch (e) {
      // Sem internet ou ViaCEP fora: o cliente preenche à mão.
    }
    setCepLoading(false);
  };

  const submit = async () => {
    const v = await form.validateFields();
    const payload = {
      nome: v.nome.trim(),
      telefone: digits(v.telefone),
      cpf_cnpj: digits(v.cpf_cnpj),
      email: (v.email || "").trim(),
      cep: digits(v.cep),
      endereco: (v.endereco || "").trim(),
      cidade: (v.cidade || "").trim(),
      estado: (v.estado || "").trim().toUpperCase(),
      observacoes: (v.observacoes || "").trim(),
    };
    setSaving(true);
    const res = editing?.id ? await updateCliente(editing.id, payload) : await createCliente(payload);
    setSaving(false);
    if (!res?.success) return notification.error({ message: "Não foi possível salvar", description: "Tente de novo em instantes." });
    notification.success({ message: editing?.id ? "Cadastro atualizado" : `${payload.nome} cadastrado(a)` });
    setEditing(null);
    load();
  };

  const remove = (c) =>
    Modal.confirm({
      title: "Excluir este cliente?",
      icon: <ExclamationCircleOutlined />,
      content: `${c.nome} vai sair da lista. As compras antigas continuam registradas.`,
      okText: "Excluir",
      okButtonProps: { danger: true },
      cancelText: "Voltar",
      onOk: async () => {
        const res = await deleteCliente(c.id);
        if (!res?.success) return notification.error({ message: "Não foi possível excluir" });
        setClientes((prev) => prev.filter((x) => x.id !== c.id));
        notification.success({ message: "Cliente excluído" });
      },
    });

  const addBtn = (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()} size={isMobile ? "large" : "middle"} block={isMobile}>
      Cadastrar cliente
    </Button>
  );

  return (
    <SimplePage title="Clientes" subtitle="Quem compra na loja e como falar com cada um" actions={addBtn}>
      <div className="sp-stack">
        {isMobile && addBtn}

        {loading && !clientes.length ? (
          <div className="sp-card">
            <Skeleton active avatar paragraph={{ rows: 5 }} />
          </div>
        ) : !reais.length ? (
          <div className="sp-card">
            <EmptyState
              icon={<TeamOutlined />}
              title="Nenhum cliente cadastrado ainda"
              text="Cadastre seus clientes para saber quem compra mais, chamar no WhatsApp e emitir nota no nome deles. Você também pode cadastrar na hora da venda, no caixa."
              action={!isMobile && addBtn}
            />
          </div>
        ) : (
          <>
            <div className="sp-stats">
              <StatCard
                icon={<TeamOutlined />}
                label="Cadastrados"
                value={reais.length}
                onClick={() => setFilter("todos")}
                active={filter === "todos"}
              />
              <StatCard
                icon={<ShoppingOutlined />}
                tone="green"
                label="Compraram este mês"
                value={groups.mes.length}
                onClick={() => setFilter("mes")}
                active={filter === "mes"}
              />
              <StatCard
                icon={<CalendarOutlined />}
                tone="orange"
                label="Sumidos"
                value={groups.sumidos.length}
                hint={`Não compram há mais de ${AWAY_DAYS} dias`}
                onClick={() => setFilter("sumidos")}
                active={filter === "sumidos"}
              />
              <StatCard
                icon={<PhoneOutlined />}
                tone="gray"
                label="Sem telefone"
                value={groups.semTelefone.length}
                hint="Não dá para chamar no WhatsApp"
                onClick={() => setFilter("semTelefone")}
                active={filter === "semTelefone"}
              />
            </div>

            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              placeholder="Buscar por nome, telefone ou CPF"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Chips
              value={filter}
              onChange={setFilter}
              options={Object.entries(FILTERS).map(([value, f]) => ({
                value,
                label: f.label,
                count: value === "todos" ? reais.length : groups[value].length,
              }))}
            />

            {filter === "sumidos" && groups.sumidos.length > 0 && (
              <div className="sp-note is-info" style={{ marginTop: 0 }}>
                Dica: chame esses clientes no WhatsApp com uma novidade ou promoção para eles voltarem. 😉
              </div>
            )}

            {!list.length ? (
              <div className="sp-card" style={{ textAlign: "center", color: "#78716c", padding: 28 }}>
                {search ? "Nenhum cliente encontrado com essa busca." : "Nenhum cliente aqui."}
              </div>
            ) : (
              <div className="sp-list">
                {list.slice(0, visible).map((c) => {
                  const wa = whatsappLink(c.telefone);
                  const padrao = isDefault(c);
                  return (
                    <div className="sp-item" key={c.id}>
                      <span
                        className="sp-icon"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 999,
                          fontWeight: 600,
                          fontSize: 15,
                          "--sp-tone": padrao ? "#78716c" : "var(--sp-primary)",
                          "--sp-tone-bg": padrao ? "#f5f5f4" : "color-mix(in srgb, var(--sp-primary) 12%, white)",
                        }}
                      >
                        {padrao ? <UserOutlined /> : initials(c.nome)}
                      </span>
                      <div className="sp-item-main">
                        <div className="sp-item-top">
                          <span className="sp-item-title is-wrap">{c.nome}</span>
                          {c.totalGasto > 0 && !padrao && <span className="sp-item-value">{money(c.totalGasto)}</span>}
                        </div>
                        <div className="sp-item-meta">
                          {padrao ? (
                            <span>Usado nas vendas em que o cliente não foi identificado</span>
                          ) : (
                            <>
                              {c.telefone ? (
                                <span>
                                  <PhoneOutlined /> {formatPhone(c.telefone)}
                                </span>
                              ) : (
                                <span style={{ color: "#a8a29e" }}>Sem telefone</span>
                              )}
                              {c.compras > 0 ? (
                                <span>
                                  {c.compras} {c.compras === 1 ? "compra" : "compras"} · {lastPurchase(c)}
                                </span>
                              ) : (
                                <span style={{ color: "#a8a29e" }}>Ainda não comprou</span>
                              )}
                            </>
                          )}
                        </div>
                        {c.observacoes && !padrao && <div className="sp-note is-info">{c.observacoes}</div>}
                        {!padrao && (
                          <div className="sp-item-actions">
                            {wa && (
                              <Button
                                icon={<WhatsAppOutlined />}
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#15803d", borderColor: "#bbf7d0" }}
                              >
                                WhatsApp
                              </Button>
                            )}
                            <Button icon={<EditOutlined />} onClick={() => openForm(c)}>
                              Editar
                            </Button>
                            <Button danger icon={<DeleteOutlined />} onClick={() => remove(c)} aria-label="Excluir">
                              {!isMobile && "Excluir"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {list.length > visible && (
                  <Button size="large" onClick={() => setVisible((v) => v + PAGE)}>
                    Mostrar mais ({list.length - visible} restantes)
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={!!editing}
        title={editing?.id ? "Editar cliente" : "Cadastrar cliente"}
        onCancel={() => setEditing(null)}
        destroyOnClose
        width={560}
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
          <Form.Item name="nome" label="Nome" rules={[{ required: true, whitespace: true, message: "Escreva o nome do cliente" }]}>
            <Input size="large" placeholder="Ex.: Maria da Silva" maxLength={120} autoFocus={!editing?.id} />
          </Form.Item>
          <Form.Item
            name="telefone"
            label="WhatsApp ou telefone"
            normalize={formatPhone}
            rules={[{ validator: (_, v) => (!v || digits(v).length >= 10 ? Promise.resolve() : Promise.reject(new Error("Coloque o DDD e o número"))) }]}
          >
            <Input size="large" placeholder="(27) 99999-9999" inputMode="tel" prefix={<WhatsAppOutlined style={{ color: "#16a34a" }} />} />
          </Form.Item>
          <Form.Item
            name="cpf_cnpj"
            label="CPF ou CNPJ"
            extra="Opcional. Precisa só se o cliente pedir nota fiscal no nome dele."
            normalize={formatDoc}
            rules={[
              {
                validator: (_, v) =>
                  !v || [11, 14].includes(digits(v).length) ? Promise.resolve() : Promise.reject(new Error("CPF tem 11 números e CNPJ tem 14")),
              },
            ]}
          >
            <Input size="large" placeholder="000.000.000-00" inputMode="numeric" />
          </Form.Item>

          <Collapse
            ghost
            size="small"
            defaultActiveKey={hasAddress ? ["mais"] : []}
            style={{ margin: "0 -16px" }}
            items={[
              {
                key: "mais",
                forceRender: true,
                label: <b style={{ fontWeight: 600 }}>Endereço, e-mail e anotações (opcional)</b>,
                children: (
                  <>
                    <div className="sp-grid-2" style={{ gap: 12, gridTemplateColumns: isMobile ? "1fr" : "160px 1fr" }}>
                      <Form.Item name="cep" label="CEP" normalize={formatCep} extra={cepLoading ? "Buscando endereço..." : "Preenche o resto sozinho"}>
                        <Input size="large" placeholder="00000-000" inputMode="numeric" onChange={(e) => lookupCep(e.target.value)} />
                      </Form.Item>
                      <Form.Item name="endereco" label="Rua, número e bairro">
                        <Input size="large" />
                      </Form.Item>
                    </div>
                    <div className="sp-grid-2" style={{ gap: 12, gridTemplateColumns: "1fr 90px" }}>
                      <Form.Item name="cidade" label="Cidade">
                        <Input size="large" />
                      </Form.Item>
                      <Form.Item name="estado" label="UF">
                        <Input size="large" maxLength={2} style={{ textTransform: "uppercase" }} />
                      </Form.Item>
                    </div>
                    <Form.Item name="email" label="E-mail" rules={[{ type: "email", message: "E-mail inválido" }]}>
                      <Input size="large" inputMode="email" placeholder="nome@email.com" />
                    </Form.Item>
                    <Form.Item name="observacoes" label="Anotações" style={{ marginBottom: 0 }}>
                      <Input.TextArea rows={2} placeholder="Ex.: prefere pagar no Pix, aniversário em março..." maxLength={500} />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Modal>
    </SimplePage>
  );
}
