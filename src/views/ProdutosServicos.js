import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Button, Collapse, Form, Input, InputNumber, Modal, Radio, Select, Skeleton, notification } from "antd";
import {
  AppstoreOutlined,
  BarcodeOutlined,
  CameraOutlined,
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  InboxOutlined,
  PictureOutlined,
  PlusOutlined,
  SearchOutlined,
  ToolOutlined,
  UploadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import BarcodeScanner from "components/Checkout/BarcodeScanner";
import SimplePage, { Chips, EmptyState, StatCard, useIsMobile } from "components/simple/SimplePage";
import { money } from "components/simple/sales";
import { UserContext } from "context/UserContext";
import { deleteProduct, getProducts, updateProduct, uploadProductImage } from "helpers/api-integrator";

const PAGE = 40;
const LOW_STOCK = 5;

const UNIDADES = [
  { value: "und", label: "Unidade" },
  { value: "pct", label: "Pacote" },
  { value: "cx", label: "Caixa" },
  { value: "dz", label: "Dúzia" },
  { value: "m", label: "Metro" },
  { value: "kg", label: "Quilo" },
  { value: "fl", label: "Folha" },
];

const isService = (p) => (p.categoria || "").toLowerCase().includes("servi");
const cleanNcm = (ncm) => String(ncm || "").replace(/\D/g, "");
const plain = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const normalize = (item) => ({
  id: item.id,
  categoria: item.categoria || "produto",
  descricao: item.descricao || "",
  valor: Number(item.valor) || 0,
  ean: item.ean || "",
  ncm: cleanNcm(item.ncm),
  unidade: item.unidade || "und",
  imageUrl: item.imageUrl || null,
  stockQuantity: Number(item.stockQuantity ?? 0),
  updatedAt: item.updatedAt,
});

const stockInfo = (p, tracksStock) => {
  if (isService(p)) return null;
  const q = p.stockQuantity;
  if (!tracksStock && q <= 0) return { tone: "gray", text: "Estoque não informado" };
  if (q <= 0) return { tone: "red", text: q < 0 ? `Acabou (${q} no sistema)` : "Acabou" };
  if (q <= LOW_STOCK) return { tone: "orange", text: `Acabando · só ${q}` };
  return { tone: "green", text: `${q} em estoque` };
};

const TONE_COLOR = { red: "#dc2626", orange: "#b45309", green: "#15803d", gray: "#a8a29e" };

const FILTERS = {
  todos: { label: "Todos", test: () => true },
  produtos: { label: "Produtos", test: (p) => !isService(p) },
  servicos: { label: "Serviços", test: isService },
  acabou: { label: "Acabou", test: (p) => !isService(p) && p.stockQuantity <= 0 },
  acabando: { label: "Acabando", test: (p) => !isService(p) && p.stockQuantity > 0 && p.stockQuantity <= LOW_STOCK },
  semNota: { label: "Sem dados da nota", test: (p) => !isService(p) && cleanNcm(p.ncm).length !== 8 },
};

const SORTS = {
  recentes: { label: "Mais recentes", fn: (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0) },
  nome: { label: "Nome (A a Z)", fn: (a, b) => a.descricao.localeCompare(b.descricao, "pt-BR") },
  estoque: { label: "Menor estoque", fn: (a, b) => a.stockQuantity - b.stockQuantity },
  preco: { label: "Maior preço", fn: (a, b) => b.valor - a.valor },
};

const readImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function Thumb({ src, onClick, size = 56 }) {
  return (
    <button
      type="button"
      onClick={src ? onClick : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        border: "1px solid #e7e5e4",
        background: "#fafaf9",
        overflow: "hidden",
        flexShrink: 0,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: src ? "zoom-in" : "default",
      }}
    >
      {src ? (
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <PictureOutlined style={{ fontSize: 20, color: "#d6d3d1" }} />
      )}
    </button>
  );
}

export default function ProdutosServicos() {
  const isMobile = useIsMobile();
  const { user } = useContext(UserContext);
  const canEdit = ["admin", "atendente"].includes(user?.user?.role);

  const [form] = Form.useForm();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos");
  const [sort, setSort] = useState("recentes");
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(PAGE);

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const [stockItem, setStockItem] = useState(null);
  const [stockMode, setStockMode] = useState("add");
  const [stockValue, setStockValue] = useState(null);
  const [stockSaving, setStockSaving] = useState(false);

  const [scanner, setScanner] = useState(null);
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getProducts();
    if (res?.success) setProducts((Array.isArray(res.data) ? res.data : []).map(normalize));
    else notification.error({ message: "Não foi possível carregar os produtos", description: "Confira sua internet e tente de novo." });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => setVisible(PAGE), [filter, search, sort]);

  const groups = useMemo(() => {
    const out = {};
    Object.entries(FILTERS).forEach(([key, f]) => (out[key] = products.filter(f.test)));
    return out;
  }, [products]);

  const tracksStock = groups.produtos.length > 0 && groups.acabou.length / groups.produtos.length < 0.7;
  const filterKeys = Object.keys(FILTERS).filter((k) => tracksStock || k !== "acabou");

  const list = useMemo(() => {
    const term = plain(search.trim());
    return groups[filter]
      .filter((p) => !term || plain(p.descricao).includes(term) || p.ean.includes(term) || String(p.id) === term)
      .sort(SORTS[sort].fn);
  }, [groups, filter, search, sort]);

  const replaceProduct = (saved) =>
    setProducts((prev) => {
      const item = normalize(saved);
      return prev.some((p) => p.id === item.id) ? prev.map((p) => (p.id === item.id ? item : p)) : [item, ...prev];
    });

  // ---------- Cadastro / edição ----------
  const openForm = (product, { duplicate = false, ean } = {}) => {
    if (duplicate) {
      setEditing({ ...product, id: undefined, descricao: `Cópia de ${product.descricao}`, ean: "", stockQuantity: 0, duplicate: true });
      setImage(null);
    } else {
      setEditing(product || { ean: ean || "" });
      setImage(product?.imageUrl || null);
    }
  };

  const initialValues = editing
    ? {
        tipo: editing.id || editing.duplicate ? (isService(editing) ? "servico" : "produto") : "produto",
        descricao: editing.descricao || "",
        valor: editing.valor ?? null,
        stockQuantity: editing.stockQuantity ?? 0,
        ean: editing.ean || "",
        ncm: cleanNcm(editing.ncm),
        unidade: editing.unidade || "und",
      }
    : {};

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return notification.warning({ message: "Escolha um arquivo de imagem (foto)." });
    if (file.size > 2 * 1024 * 1024) return notification.warning({ message: "Foto muito grande", description: "Use uma imagem de até 2 MB." });
    const base64 = await readImage(file);
    setImage(base64);
    if (editing?.id) {
      setUploading(true);
      const res = await uploadProductImage(editing.id, base64);
      setUploading(false);
      if (res?.success) {
        setImage(res.data.imageUrl);
        setProducts((prev) => prev.map((p) => (p.id === editing.id ? { ...p, imageUrl: res.data.imageUrl } : p)));
        notification.success({ message: "Foto atualizada" });
      } else {
        notification.error({ message: "Não foi possível enviar a foto" });
      }
    }
  };

  const submit = async () => {
    const values = await form.validateFields();
    const servico = values.tipo === "servico";
    setSaving(true);
    const res = await updateProduct({
      ...(editing?.id ? { id: editing.id } : {}),
      categoria: servico ? "serviço" : "produto",
      descricao: values.descricao.trim(),
      valor: values.valor,
      stockQuantity: servico ? editing?.stockQuantity || 0 : Number(values.stockQuantity || 0),
      ean: (values.ean || "").trim(),
      ncm: cleanNcm(values.ncm),
      unidade: values.unidade || "und",
    });
    if (!res?.success || !res.data?.id) {
      setSaving(false);
      notification.error({ message: "Não foi possível salvar", description: "Tente de novo em instantes." });
      return;
    }
    let saved = res.data;
    if (!editing?.id && image?.startsWith("data:")) {
      const up = await uploadProductImage(saved.id, image);
      if (up?.success) saved = { ...saved, imageUrl: up.data.imageUrl };
      else notification.warning({ message: "Produto salvo, mas a foto não foi enviada", description: "Abra o produto e tente enviar a foto de novo." });
    }
    setSaving(false);
    replaceProduct({ ...saved, stockQuantity: saved.stockQuantity ?? values.stockQuantity });
    notification.success({ message: editing?.id ? "Alterações salvas" : `“${values.descricao.trim()}” cadastrado` });
    setEditing(null);
  };

  const remove = (p) =>
    Modal.confirm({
      title: "Excluir este item?",
      icon: <ExclamationCircleOutlined />,
      content: `“${p.descricao}” vai sair da lista e não aparece mais no caixa. As vendas antigas continuam registradas.`,
      okText: "Excluir",
      okButtonProps: { danger: true },
      cancelText: "Voltar",
      onOk: async () => {
        const res = await deleteProduct(p.id);
        if (!res?.success) return notification.error({ message: "Não foi possível excluir" });
        setProducts((prev) => prev.filter((x) => x.id !== p.id));
        notification.success({ message: "Item excluído" });
      },
    });

  // ---------- Estoque rápido ----------
  const openStock = (p) => {
    setStockItem(p);
    setStockMode("add");
    setStockValue(null);
  };

  const newStock = stockItem
    ? stockMode === "add"
      ? stockItem.stockQuantity + Number(stockValue || 0)
      : Number(stockValue ?? stockItem.stockQuantity)
    : 0;

  const saveStock = async () => {
    if (stockValue === null || stockValue === undefined) return notification.warning({ message: "Digite a quantidade" });
    setStockSaving(true);
    const res = await updateProduct({ ...stockItem, ncm: cleanNcm(stockItem.ncm), stockQuantity: newStock });
    setStockSaving(false);
    if (!res?.success) return notification.error({ message: "Não foi possível atualizar o estoque" });
    setProducts((prev) => prev.map((p) => (p.id === stockItem.id ? { ...p, stockQuantity: newStock } : p)));
    notification.success({ message: `Estoque atualizado: agora tem ${newStock}` });
    setStockItem(null);
  };

  // ---------- Leitor de código ----------
  const onScan = (code) => {
    const target = scanner;
    setScanner(null);
    if (target === "form") return form.setFieldsValue({ ean: code });
    const found = products.find((p) => p.ean === code);
    if (found) {
      setFilter("todos");
      setSearch(code);
      return;
    }
    Modal.confirm({
      title: "Nenhum produto com esse código",
      content: `O código ${code} ainda não está cadastrado. Quer cadastrar agora?`,
      okText: "Cadastrar",
      cancelText: "Agora não",
      onOk: () => openForm(null, { ean: code }),
    });
  };

  const addBtn = canEdit && (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()} size={isMobile ? "large" : "middle"} block={isMobile}>
      Cadastrar produto ou serviço
    </Button>
  );

  const emptyText = search
    ? "Nada encontrado com essa busca. Confira o nome ou o código."
    : filter === "acabou"
    ? "Nenhum produto zerado. Estoque em dia! 🎉"
    : filter === "acabando"
    ? "Nenhum produto acabando."
    : filter === "semNota"
    ? "Todos os produtos têm os dados para nota fiscal. 🎉"
    : "Nenhum item aqui.";

  return (
    <SimplePage
      title="Produtos e serviços"
      subtitle="Tudo o que a loja vende, com preço e estoque"
      actions={
        <>
          <Button icon={<CameraOutlined />} onClick={() => setScanner("search")}>
            Ler código de barras
          </Button>
          {addBtn}
        </>
      }
      mobileActions={
        <button type="button" className="sp-round" aria-label="Ler código de barras" onClick={() => setScanner("search")}>
          <CameraOutlined />
        </button>
      }
    >
      <div className="sp-stack">
        {isMobile && addBtn}

        {loading && !products.length ? (
          <div className="sp-card">
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : !products.length ? (
          <div className="sp-card">
            <EmptyState
              icon={<AppstoreOutlined />}
              title="Nenhum produto cadastrado ainda"
              text="Cadastre o que a loja vende (produtos e serviços) para aparecer no caixa na hora de vender."
              action={!isMobile && addBtn}
            />
          </div>
        ) : (
          <>
            <div className="sp-stats">
              <StatCard
                icon={<AppstoreOutlined />}
                label="Cadastrados"
                value={products.length.toLocaleString("pt-BR")}
                hint={`${groups.produtos.length.toLocaleString("pt-BR")} produtos · ${groups.servicos.length} serviços`}
                onClick={() => setFilter("todos")}
                active={filter === "todos"}
              />
              {tracksStock ? (
                <StatCard
                  icon={<InboxOutlined />}
                  tone="red"
                  label="Acabou"
                  value={groups.acabou.length.toLocaleString("pt-BR")}
                  hint={groups.acabou.length ? "Hora de repor" : "Nenhum zerado"}
                  onClick={() => setFilter("acabou")}
                  active={filter === "acabou"}
                />
              ) : (
                <StatCard
                  icon={<ToolOutlined />}
                  tone="purple"
                  label="Serviços"
                  value={groups.servicos.length}
                  hint="Impressão, xerox..."
                  onClick={() => setFilter("servicos")}
                  active={filter === "servicos"}
                />
              )}
              <StatCard
                icon={<WarningOutlined />}
                tone="orange"
                label="Acabando"
                value={groups.acabando.length}
                hint={`Com ${LOW_STOCK} ou menos`}
                onClick={() => setFilter("acabando")}
                active={filter === "acabando"}
              />
              <StatCard
                icon={<FileTextOutlined />}
                tone="gray"
                label="Sem dados da nota"
                value={groups.semNota.length}
                hint={groups.semNota.length ? "Falta o NCM" : "Tudo certo"}
                onClick={() => setFilter("semNota")}
                active={filter === "semNota"}
              />
            </div>

            {!tracksStock && canEdit && (
              <div className="sp-note is-info" style={{ marginTop: 0 }}>
                <InboxOutlined /> A maioria dos produtos está sem quantidade no estoque. Se quiser que o sistema avise quando algo estiver
                acabando, toque em <b>Estoque</b> no produto sempre que chegar mercadoria.
              </div>
            )}

            <div className="sp-toolbar">
              <Input
                allowClear
                size="large"
                prefix={<SearchOutlined />}
                placeholder="Buscar pelo nome ou código de barras"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: "1 1 260px" }}
              />
              <Select
                size="large"
                value={sort}
                onChange={setSort}
                options={Object.entries(SORTS).map(([value, s]) => ({ value, label: s.label }))}
                style={{ width: isMobile ? "100%" : 180 }}
              />
            </div>
            <Chips
              value={filter}
              onChange={setFilter}
              options={filterKeys.map((value) => ({ value, label: FILTERS[value].label, count: groups[value].length.toLocaleString("pt-BR") }))}
            />

            {!list.length ? (
              <div className="sp-card" style={{ textAlign: "center", color: "#78716c", padding: 28 }}>
                {emptyText}
              </div>
            ) : (
              <div className="sp-list">
                {list.slice(0, visible).map((p) => {
                  const st = stockInfo(p, tracksStock);
                  return (
                    <div className="sp-item" key={p.id}>
                      <Thumb src={p.imageUrl} size={isMobile ? 48 : 56} onClick={() => setPreview(p)} />
                      <div className="sp-item-main">
                        <div className="sp-item-top">
                          <span className="sp-item-title is-wrap" title={p.descricao}>
                            {p.descricao}
                          </span>
                          <span className="sp-item-value">{money(p.valor)}</span>
                        </div>
                        <div className="sp-item-meta">
                          {isService(p) ? (
                            <span>
                              <ToolOutlined /> Serviço
                            </span>
                          ) : (
                            <span style={{ color: TONE_COLOR[st.tone], fontWeight: 500 }}>{st.text}</span>
                          )}
                          {p.ean && (
                            <span>
                              <BarcodeOutlined /> {p.ean}
                            </span>
                          )}
                          {filter === "semNota" && <span style={{ color: "#b45309" }}>Falta o NCM</span>}
                        </div>
                        {canEdit && (
                          <div className="sp-item-actions">
                            {!isService(p) && (
                              <Button icon={<InboxOutlined />} onClick={() => openStock(p)}>
                                Estoque
                              </Button>
                            )}
                            <Button icon={<EditOutlined />} onClick={() => openForm(p)}>
                              Editar
                            </Button>
                            <Button icon={<CopyOutlined />} onClick={() => openForm(p, { duplicate: true })}>
                              Duplicar
                            </Button>
                            <Button danger icon={<DeleteOutlined />} onClick={() => remove(p)} aria-label="Excluir">
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
                    Mostrar mais ({(list.length - visible).toLocaleString("pt-BR")} restantes)
                  </Button>
                )}
                <div style={{ textAlign: "center", color: "#a8a29e", fontSize: 13 }}>
                  Mostrando {Math.min(visible, list.length).toLocaleString("pt-BR")} de {list.length.toLocaleString("pt-BR")}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={!!editing}
        title={editing?.id ? "Editar item" : editing?.duplicate ? "Duplicar item" : "Cadastrar produto ou serviço"}
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
          <Form.Item name="tipo" label="O que você está cadastrando?">
            <Radio.Group optionType="button" buttonStyle="solid" style={{ display: "flex" }}>
              <Radio.Button value="produto" style={{ flex: 1, textAlign: "center" }}>
                <AppstoreOutlined /> Produto
              </Radio.Button>
              <Radio.Button value="servico" style={{ flex: 1, textAlign: "center" }}>
                <ToolOutlined /> Serviço
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(a, b) => a.tipo !== b.tipo}>
            {({ getFieldValue }) => {
              const servico = getFieldValue("tipo") === "servico";
              return (
                <>
                  <Form.Item
                    name="descricao"
                    label="Nome"
                    rules={[{ required: true, whitespace: true, message: "Escreva o nome" }]}
                    extra={servico ? "Ex.: Impressão colorida, Plastificação, Xerox" : "Do jeito que aparece no caixa e no cupom"}
                  >
                    <Input size="large" placeholder={servico ? "Nome do serviço" : "Ex.: Caderno 10 matérias"} maxLength={120} />
                  </Form.Item>

                  <div className="sp-grid-2" style={{ gap: 12, gridTemplateColumns: servico || isMobile ? "1fr" : "1fr 1fr" }}>
                    <Form.Item name="valor" label="Preço de venda" rules={[{ required: true, message: "Informe o preço" }]}>
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
                    {!servico && (
                      <Form.Item name="stockQuantity" label="Quantos você tem agora?">
                        <InputNumber size="large" precision={0} inputMode="numeric" style={{ width: "100%" }} />
                      </Form.Item>
                    )}
                  </div>

                  {!servico && (
                    <Form.Item name="ean" label="Código de barras" extra="Use a câmera ou o leitor para preencher sozinho">
                      <Input
                        size="large"
                        placeholder="Opcional"
                        inputMode="numeric"
                        suffix={
                          <Button type="text" size="small" icon={<CameraOutlined />} onClick={() => setScanner("form")}>
                            Ler
                          </Button>
                        }
                      />
                    </Form.Item>
                  )}

                  <Form.Item label="Foto" extra={editing?.id ? "A foto é salva na hora." : "Aparece no caixa e no catálogo do WhatsApp."}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Thumb src={image} size={64} />
                      <input type="file" ref={fileRef} accept="image/*" onChange={pickImage} style={{ display: "none" }} />
                      <Button icon={<UploadOutlined />} loading={uploading} onClick={() => fileRef.current?.click()}>
                        {image ? "Trocar foto" : "Escolher foto"}
                      </Button>
                    </div>
                  </Form.Item>

                  {!servico && (
                    <Collapse
                      ghost
                      size="small"
                      style={{ margin: "0 -16px" }}
                      items={[
                        {
                          key: "nota",
                          label: <b style={{ fontWeight: 600 }}>Dados para nota fiscal</b>,
                          children: (
                            <div className="sp-grid-2" style={{ gap: 12, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
                              <Form.Item
                                name="ncm"
                                label="NCM (8 números)"
                                extra="Vem na nota do fornecedor. Se não souber, pergunte ao contador."
                                rules={[{ validator: (_, v) => (!v || cleanNcm(v).length === 8 ? Promise.resolve() : Promise.reject(new Error("O NCM tem 8 números"))) }]}
                              >
                                <Input size="large" placeholder="Ex.: 48201000" inputMode="numeric" maxLength={10} />
                              </Form.Item>
                              <Form.Item name="unidade" label="Vendido por">
                                <Select
                                  size="large"
                                  options={
                                    UNIDADES.some((u) => u.value === initialValues.unidade)
                                      ? UNIDADES
                                      : [...UNIDADES, { value: initialValues.unidade, label: initialValues.unidade }]
                                  }
                                />
                              </Form.Item>
                            </div>
                          ),
                        },
                      ]}
                    />
                  )}
                </>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={!!stockItem}
        title="Atualizar estoque"
        onCancel={() => setStockItem(null)}
        destroyOnClose
        width={440}
        footer={[
          <Button key="cancel" onClick={() => setStockItem(null)}>
            Cancelar
          </Button>,
          <Button key="ok" type="primary" icon={<CheckOutlined />} loading={stockSaving} onClick={saveStock}>
            Salvar
          </Button>,
        ]}
      >
        {stockItem && (
          <div className="sp-stack" style={{ gap: 16 }}>
            <div className="sp-note is-info" style={{ marginTop: 0 }}>
              <b>{stockItem.descricao}</b>
              <br />
              Hoje o sistema diz que tem <b>{stockItem.stockQuantity}</b>.
            </div>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={stockMode}
              onChange={(e) => {
                setStockMode(e.target.value);
                setStockValue(null);
              }}
              style={{ display: "flex" }}
            >
              <Radio.Button value="add" style={{ flex: 1, textAlign: "center" }}>
                Chegou mercadoria
              </Radio.Button>
              <Radio.Button value="set" style={{ flex: 1, textAlign: "center" }}>
                Contei e corrigi
              </Radio.Button>
            </Radio.Group>
            <div>
              <div style={{ fontSize: 14, marginBottom: 6, color: "#44403c" }}>
                {stockMode === "add" ? "Quantos chegaram?" : "Quantos tem de verdade na loja?"}
              </div>
              <InputNumber
                autoFocus
                size="large"
                precision={0}
                min={stockMode === "add" ? 1 : undefined}
                inputMode="numeric"
                value={stockValue}
                onChange={setStockValue}
                onPressEnter={saveStock}
                style={{ width: "100%" }}
              />
              {stockMode === "add" && (
                <div className="sp-chips" style={{ marginTop: 8 }}>
                  {[1, 5, 10, 12, 24, 50].map((n) => (
                    <button key={n} type="button" className="sp-chip" style={{ padding: "4px 12px", fontSize: 13 }} onClick={() => setStockValue(n)}>
                      +{n}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {stockValue !== null && stockValue !== undefined && (
              <div className="sp-note is-ok" style={{ marginTop: 0 }}>
                Vai ficar com <b>{newStock}</b> no estoque.
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!preview} onCancel={() => setPreview(null)} footer={null} centered width={560} title={preview?.descricao}>
        {preview && (
          <img src={preview.imageUrl} alt={preview.descricao} style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 10 }} />
        )}
      </Modal>

      <BarcodeScanner visible={!!scanner} onClose={() => setScanner(null)} onDetect={onScan} />
    </SimplePage>
  );
}
