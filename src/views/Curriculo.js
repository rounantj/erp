import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AutoComplete, Button, Form, Input, Modal, Skeleton, Spin, Switch, notification } from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BookOutlined,
  CameraOutlined,
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  HistoryOutlined,
  PlusOutlined,
  PrinterOutlined,
  SearchOutlined,
  StarOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import SimplePage, { Chips, EmptyState, Icon, useIsMobile } from "components/simple/SimplePage";
import { createdCurriculum, getCurriculum, listCurriculums } from "helpers/curriculo.adapter";
import CurriculoDocumento, { A4_HEIGHT, A4_WIDTH, MODELOS } from "./curriculo/CurriculoDocumento";
import { HABILIDADES_COMUNS, PROFISSOES_COMUNS } from "./curriculo/data";

const ESCOLARIDADE = [
  "Ensino Fundamental Incompleto",
  "Ensino Fundamental Completo",
  "Ensino Médio Incompleto",
  "Ensino Médio Completo",
  "Ensino Médio Cursando",
  "Curso Técnico",
  "Ensino Superior Incompleto",
  "Ensino Superior Cursando",
  "Ensino Superior Completo",
];

const HABILIDADES_GERAIS = [
  "Pontualidade",
  "Trabalho em equipe",
  "Responsabilidade",
  "Organização",
  "Proatividade",
  "Facilidade de aprendizado",
  "Boa comunicação",
  "Atendimento ao cliente",
  "Informática básica",
];

const EXTRAS = ["CNH categoria B", "CNH categoria A", "Disponibilidade de horário", "Disponível para trabalhar aos fins de semana", "Disponível para viagens", "Moro perto"];

const STEPS = [
  { title: "Dados pessoais", icon: <UserOutlined /> },
  { title: "Experiência", icon: <ToolOutlined /> },
  { title: "Estudos", icon: <BookOutlined /> },
  { title: "Habilidades", icon: <StarOutlined /> },
];

const PEDIR_AO_CLIENTE = `📄 *Para fazer seu currículo, me mande:*

*1. Seus dados*
- Nome completo
- Telefone
- Bairro e cidade

*2. Trabalho que procura*
- Ex.: auxiliar de serviços gerais, vendedora...

*3. Onde já trabalhou*
- Nome da empresa, cargo, quanto tempo e o que fazia

*4. Estudos*
- Até que série estudou e o nome da escola
- Cursos que fez (onde e quando)

*5. O que você sabe fazer bem*

Se quiser, mande também uma foto de rosto com fundo claro. 😊`;

const EMPTY_CV = {
  modelo: "simples",
  experiencias: [{}],
  cursos: [],
  habilidades: [],
  semExperiencia: false,
};

const text = (v) => (Array.isArray(v) ? v.filter(Boolean).join(", ") : v ? String(v) : "");
const digits = (v) => String(v || "").replace(/\D/g, "");

const formatPhone = (v) => {
  const d = digits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const yearOf = (v) => {
  if (!v) return "";
  const s = String(v);
  if (/^\d{4}$/.test(s)) return s;
  const d = dayjs(s);
  return d.isValid() ? d.format("YYYY") : s;
};

const clean = (s) => String(s || "").trim();

// Aceita tanto o formato novo quanto currículos antigos (profissão/escolaridade em lista, ano como data).
const normalizeCv = (raw = {}) => ({
  ...EMPTY_CV,
  nome: text(raw.nome),
  telefone: text(raw.telefone),
  email: text(raw.email),
  endereco: text(raw.endereco),
  profissao: text(raw.profissao),
  foto: raw.foto || null,
  objetivo: text(raw.objetivo),
  semExperiencia: !!raw.semExperiencia,
  experiencias: Array.isArray(raw.experiencias) && raw.experiencias.length ? raw.experiencias.map((e) => ({ ...e })) : [{}],
  escolaridade: text(raw.escolaridade),
  instituicaoEnsino: text(raw.instituicaoEnsino),
  anoConclusao: yearOf(raw.anoConclusao),
  cursos: Array.isArray(raw.cursos) ? raw.cursos.filter((c) => c && (c.nome || c.instituicao)) : [],
  habilidades: Array.isArray(raw.habilidades) ? raw.habilidades.filter(Boolean) : [],
  informacoesAdicionais: text(raw.informacoesAdicionais),
  modelo: MODELOS.some((m) => m.key === raw.modelo) ? raw.modelo : "simples",
});

const finalCv = (values) => {
  const cv = normalizeCv(values);
  return {
    ...cv,
    nome: clean(cv.nome),
    experiencias: cv.semExperiencia ? [] : cv.experiencias.map((e) => ({ empresa: clean(e.empresa), cargo: clean(e.cargo), periodo: clean(e.periodo), descricao: clean(e.descricao) })).filter((e) => e.empresa || e.cargo),
    cursos: cv.cursos.map((c) => ({ nome: clean(c.nome), instituicao: clean(c.instituicao), ano: clean(c.ano) })).filter((c) => c.nome),
  };
};

const resizePhoto = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const size = 360;
        const scale = Math.min(1, size / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const objetivoPronto = (profissao) =>
  profissao
    ? `Busco uma oportunidade como ${profissao}, onde eu possa contribuir com dedicação e responsabilidade, aprender coisas novas e crescer junto com a empresa.`
    : "Busco uma oportunidade de trabalho onde eu possa contribuir com dedicação e responsabilidade, aprender coisas novas e crescer junto com a empresa.";

function ChoiceChips({ options, value = [], onToggle }) {
  return (
    <div className="sp-chips" style={{ flexWrap: "wrap" }}>
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button key={opt} type="button" className={`sp-chip${active ? " is-active" : ""}`} style={{ padding: "5px 12px", fontSize: 13 }} onClick={() => onToggle(opt)}>
            {active ? <CheckOutlined style={{ marginRight: 4 }} /> : <PlusOutlined style={{ marginRight: 4, opacity: 0.6 }} />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function SkillsField({ value = [], onChange, suggestions }) {
  const [draft, setDraft] = useState("");
  const toggle = (s) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  const add = () => {
    const items = draft
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !value.includes(s));
    if (items.length) onChange([...value, ...items]);
    setDraft("");
  };
  const custom = value.filter((v) => !suggestions.includes(v));
  return (
    <div className="sp-stack" style={{ gap: 10 }}>
      <ChoiceChips options={[...custom, ...suggestions]} value={value} onToggle={toggle} />
      <Input.Search size="large" placeholder="Outra habilidade" enterButton="Adicionar" value={draft} onChange={(e) => setDraft(e.target.value)} onSearch={add} />
    </div>
  );
}

function PhotoField({ value, onChange }) {
  const ref = useRef(null);
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return notification.warning({ message: "Escolha uma foto (imagem)." });
    onChange(await resizePhoto(file));
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 12,
          background: "#fafaf9",
          border: "1px dashed #d6d3d1",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {value ? <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UserOutlined style={{ fontSize: 26, color: "#d6d3d1" }} />}
      </div>
      <input ref={ref} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button icon={<CameraOutlined />} onClick={() => ref.current?.click()}>
          {value ? "Trocar foto" : "Colocar foto"}
        </Button>
        {value && (
          <Button type="text" danger onClick={() => onChange(null)}>
            Tirar
          </Button>
        )}
      </div>
    </div>
  );
}

function A4Preview({ cv, docRef, fullSize }) {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const update = () => setScale(Math.min(1, el.clientWidth / A4_WIDTH));
    update();
    const ro = new ResizeObserver(() => window.requestAnimationFrame(update));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const s = fullSize ? 1 : scale;
  return (
    <div ref={boxRef} style={{ width: "100%", overflow: fullSize ? "visible" : "hidden" }}>
      <div style={{ width: A4_WIDTH * s, margin: "0 auto", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e7e5e4", overflow: fullSize ? "visible" : "hidden" }}>
        <div style={{ width: A4_WIDTH, transform: `scale(${s})`, transformOrigin: "top left", height: fullSize ? "auto" : undefined }}>
          <CurriculoDocumento ref={docRef} cv={cv} />
        </div>
        {!fullSize && <ScaleSpacer docRef={docRef} scale={s} />}
      </div>
    </div>
  );
}

// Compensa a altura perdida pelo transform: scale(), que não encolhe o espaço ocupado.
function ScaleSpacer({ docRef, scale }) {
  const [h, setH] = useState(A4_HEIGHT);
  useLayoutEffect(() => {
    const el = docRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    setH(el.offsetHeight);
    return () => ro.disconnect();
  }, [docRef]);
  return <div style={{ marginTop: -(h * (1 - scale)) }} />;
}

export default function Curriculo() {
  const isMobile = useIsMobile();
  const [form] = Form.useForm();
  const docRef = useRef(null);
  const [tab, setTab] = useState("novo");
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [opening, setOpening] = useState(null);

  const profissao = Form.useWatch("profissao", form);
  const semExperiencia = Form.useWatch("semExperiencia", form);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      setHistory(await listCurriculums());
    } catch (e) {
      notification.error({ message: "Não foi possível carregar os currículos feitos" });
      setHistory([]);
    }
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredHistory = useMemo(() => {
    const term = historySearch.trim().toLowerCase();
    const num = digits(historySearch);
    return (history || []).filter(
      (c) => !term || c.nome.toLowerCase().includes(term) || c.profissao.toLowerCase().includes(term) || (num.length >= 3 && digits(c.telefone).includes(num))
    );
  }, [history, historySearch]);

  const skillSuggestions = useMemo(() => {
    const own = HABILIDADES_COMUNS[profissao] || [];
    return [...own, ...HABILIDADES_GERAIS.filter((h) => !own.includes(h))];
  }, [profissao]);

  const startNew = () => {
    form.resetFields();
    form.setFieldsValue(EMPTY_CV);
    setSavedId(null);
    setPreview(null);
    setStep(0);
    setTab("novo");
  };

  const confirmNew = () => {
    const nome = form.getFieldValue("nome");
    if (!nome || preview) return startNew();
    Modal.confirm({
      title: "Começar outro currículo?",
      content: `O que você preencheu de ${nome} será apagado.`,
      okText: "Sim, começar outro",
      cancelText: "Voltar",
      onOk: startNew,
    });
  };

  const next = async () => {
    try {
      await form.validateFields();
    } catch (e) {
      notification.warning({ message: "Falta preencher algo", description: "Os campos em vermelho são obrigatórios." });
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
      document.querySelector(".sp-mobile-body")?.scrollTo({ top: 0 });
    } else {
      setPreview(finalCv(form.getFieldsValue(true)));
    }
  };

  const openSaved = async (item, mode) => {
    setOpening(item.id);
    try {
      const res = await getCurriculum(item.id);
      const cv = normalizeCv(res.data);
      form.resetFields();
      form.setFieldsValue(cv);
      setSavedId(item.id);
      setTab("novo");
      if (mode === "edit") {
        setPreview(null);
        setStep(0);
      } else {
        setPreview(finalCv(cv));
      }
    } catch (e) {
      notification.error({ message: "Não foi possível abrir esse currículo" });
    }
    setOpening(null);
  };

  const buildPdf = async () => {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 120));
    try {
      const canvas = await html2canvas(docRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const sliceH = Math.floor((canvas.width * pageH) / pageW);
      for (let y = 0, i = 0; y < canvas.height; y += sliceH, i += 1) {
        const h = Math.min(sliceH, canvas.height - y);
        if (h < 40 && i > 0) break;
        const part = document.createElement("canvas");
        part.width = canvas.width;
        part.height = h;
        part.getContext("2d").drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        if (i > 0) pdf.addPage();
        pdf.addImage(part.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pageW, (h * pageW) / canvas.width);
      }
      return pdf;
    } finally {
      setExporting(false);
    }
  };

  const save = async () => {
    try {
      const res = await createdCurriculum(JSON.stringify(preview), false, null, savedId || undefined);
      if (res?.data?.id) setSavedId(res.data.id);
      loadHistory();
    } catch (e) {
      // O PDF já foi gerado; não salvar no histórico não deve travar o atendimento.
    }
  };

  const fileName = `curriculo_${(preview?.nome || "sem_nome").replace(/\s+/g, "_")}.pdf`;

  const download = async () => {
    try {
      const pdf = await buildPdf();
      pdf.save(fileName);
      notification.success({ message: "PDF baixado", description: fileName });
      save();
    } catch (e) {
      notification.error({ message: "Não foi possível gerar o PDF", description: "Tente de novo." });
    }
  };

  const print = async () => {
    const win = window.open("", "_blank");
    try {
      const pdf = await buildPdf();
      pdf.autoPrint();
      const url = pdf.output("bloburl");
      if (win) win.location.href = url;
      else pdf.save(fileName);
      save();
    } catch (e) {
      win?.close();
      notification.error({ message: "Não foi possível preparar a impressão", description: "Tente de novo." });
    }
  };

  const copyAsk = () =>
    navigator.clipboard
      .writeText(PEDIR_AO_CLIENTE)
      .then(() => notification.success({ message: "Mensagem copiada", description: "Cole no WhatsApp do cliente." }))
      .catch(() => notification.error({ message: "Não foi possível copiar" }));

  const toggleExtra = (extra) => {
    const current = form.getFieldValue("informacoesAdicionais") || "";
    const lines = current.split("\n").map((l) => l.trim()).filter(Boolean);
    const nextLines = lines.includes(extra) ? lines.filter((l) => l !== extra) : [...lines, extra];
    form.setFieldsValue({ informacoesAdicionais: nextLines.join("\n") });
  };

  const extrasWatch = Form.useWatch("informacoesAdicionais", form) || "";

  const renderStep = () => {
    if (step === 0)
      return (
        <>
          <Form.Item name="nome" label="Nome completo" rules={[{ required: true, whitespace: true, message: "Escreva o nome completo" }]}>
            <Input size="large" placeholder="Ex.: Maria Aparecida da Silva" autoComplete="off" />
          </Form.Item>
          <div className="sp-grid-2" style={{ gap: 12, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
            <Form.Item name="telefone" label="Telefone" normalize={formatPhone} rules={[{ required: true, message: "Coloque um telefone para a empresa ligar" }]}>
              <Input size="large" placeholder="(27) 99999-9999" inputMode="tel" />
            </Form.Item>
            <Form.Item name="email" label="E-mail (se tiver)">
              <Input size="large" placeholder="nome@email.com" inputMode="email" />
            </Form.Item>
          </div>
          <Form.Item name="endereco" label="Onde mora" extra="Bairro e cidade já bastam. Não precisa do número da casa." rules={[{ required: true, whitespace: true, message: "Informe pelo menos bairro e cidade" }]}>
            <Input size="large" placeholder="Ex.: Barra do Sahy, Aracruz - ES" />
          </Form.Item>
          <Form.Item name="profissao" label="Que trabalho procura?" extra="Escolha da lista ou escreva do seu jeito" rules={[{ required: true, whitespace: true, message: "Diga o trabalho que procura" }]}>
            <AutoComplete
              size="large"
              options={PROFISSOES_COMUNS.map((p) => ({ value: p }))}
              filterOption={(input, opt) => opt.value.toLowerCase().includes(input.toLowerCase())}
              placeholder="Ex.: Auxiliar de serviços gerais"
            />
          </Form.Item>
          <Form.Item name="foto" label="Foto (opcional)" extra="De rosto, com fundo claro." style={{ marginBottom: 0 }}>
            <PhotoField />
          </Form.Item>
        </>
      );

    if (step === 1)
      return (
        <>
          <Form.Item
            name="objetivo"
            label={
              <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                Objetivo
                <Button size="small" type="link" style={{ padding: 0 }} onClick={() => form.setFieldsValue({ objetivo: objetivoPronto(profissao) })}>
                  Usar texto pronto
                </Button>
              </span>
            }
            rules={[{ required: true, whitespace: true, message: "Escreva o objetivo ou use o texto pronto" }]}
          >
            <Input.TextArea rows={3} placeholder="O que a pessoa busca. Toque em “Usar texto pronto” se não souber o que escrever." />
          </Form.Item>

          <div className="sp-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, marginBottom: 16, background: "#fafaf9" }}>
            <Form.Item name="semExperiencia" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
            <span style={{ fontSize: 14 }}>
              <b>É o primeiro emprego</b>
              <br />
              <span style={{ color: "#78716c" }}>Ainda não trabalhou com carteira ou em empresa</span>
            </span>
          </div>

          {!semExperiencia && (
            <Form.List name="experiencias">
              {(fields, { add, remove }) => (
                <div className="sp-stack" style={{ gap: 12 }}>
                  {fields.map((field, i) => (
                    <div key={field.key} className="sp-card" style={{ padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <b>{i === 0 ? "Último trabalho" : `Trabalho ${i + 1}`}</b>
                        {fields.length > 1 && (
                          <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                            Tirar
                          </Button>
                        )}
                      </div>
                      <div className="sp-grid-2" style={{ gap: 12, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
                        <Form.Item name={[field.name, "empresa"]} label="Empresa" style={{ marginBottom: 12 }}>
                          <Input size="large" placeholder="Nome da empresa" />
                        </Form.Item>
                        <Form.Item name={[field.name, "cargo"]} label="Cargo / função" style={{ marginBottom: 12 }}>
                          <Input size="large" placeholder="Ex.: Auxiliar de limpeza" />
                        </Form.Item>
                      </div>
                      <Form.Item name={[field.name, "periodo"]} label="Quanto tempo" style={{ marginBottom: 12 }}>
                        <Input size="large" placeholder="Ex.: 2021 a 2023, ou 2 anos" />
                      </Form.Item>
                      <Form.Item name={[field.name, "descricao"]} label="O que fazia (opcional)" style={{ marginBottom: 0 }}>
                        <Input.TextArea rows={2} placeholder="Ex.: limpeza dos setores, organização do estoque..." />
                      </Form.Item>
                    </div>
                  ))}
                  <Button type="dashed" size="large" icon={<PlusOutlined />} onClick={() => add({})} block>
                    Adicionar outro trabalho
                  </Button>
                </div>
              )}
            </Form.List>
          )}
        </>
      );

    if (step === 2)
      return (
        <>
          <Form.Item name="escolaridade" label="Até onde estudou?" rules={[{ required: true, whitespace: true, message: "Escolha a escolaridade" }]}>
            <AutoComplete size="large" options={ESCOLARIDADE.map((e) => ({ value: e }))} placeholder="Toque para escolher" filterOption={(input, opt) => opt.value.toLowerCase().includes(input.toLowerCase())} />
          </Form.Item>
          <div className="sp-grid-2" style={{ gap: 12, gridTemplateColumns: isMobile ? "1fr" : "1fr 160px" }}>
            <Form.Item name="instituicaoEnsino" label="Nome da escola (opcional)">
              <Input size="large" placeholder="Ex.: EEEFM Primo Bitti" />
            </Form.Item>
            <Form.Item name="anoConclusao" label="Ano que terminou">
              <Input size="large" placeholder="Ex.: 2019" inputMode="numeric" maxLength={4} />
            </Form.Item>
          </div>

          <div style={{ fontWeight: 600, margin: "4px 0 10px" }}>Cursos (opcional)</div>
          <Form.List name="cursos">
            {(fields, { add, remove }) => (
              <div className="sp-stack" style={{ gap: 12 }}>
                {fields.map((field) => (
                  <div key={field.key} className="sp-card" style={{ padding: 14 }}>
                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "2fr 1.5fr 90px auto", alignItems: "end" }}>
                      <Form.Item name={[field.name, "nome"]} label="Curso" style={{ marginBottom: 0 }}>
                        <Input size="large" placeholder="Ex.: Informática básica" />
                      </Form.Item>
                      <Form.Item name={[field.name, "instituicao"]} label="Onde fez" style={{ marginBottom: 0 }}>
                        <Input size="large" placeholder="Ex.: SENAI" />
                      </Form.Item>
                      <Form.Item name={[field.name, "ano"]} label="Ano" style={{ marginBottom: 0 }}>
                        <Input size="large" inputMode="numeric" maxLength={4} />
                      </Form.Item>
                      <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(field.name)} size="large">
                        {isMobile && "Tirar curso"}
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="dashed" size="large" icon={<PlusOutlined />} onClick={() => add({})} block>
                  Adicionar curso
                </Button>
              </div>
            )}
          </Form.List>
        </>
      );

    return (
      <>
        <Form.Item name="habilidades" label="O que a pessoa sabe fazer bem?" extra="Toque para marcar. Pode marcar várias.">
          <SkillsField suggestions={skillSuggestions} />
        </Form.Item>
        <Form.Item label="Informações adicionais (opcional)" style={{ marginBottom: 8 }}>
          <ChoiceChips options={EXTRAS} value={extrasWatch.split("\n").map((l) => l.trim())} onToggle={toggleExtra} />
        </Form.Item>
        <Form.Item name="informacoesAdicionais">
          <Input.TextArea rows={3} placeholder="Ex.: CNH B, disponibilidade de horário..." />
        </Form.Item>
        <Form.Item name="modelo" label="Escolha o modelo" style={{ marginBottom: 0 }}>
          <ModelPicker />
        </Form.Item>
      </>
    );
  };

  const progress = (
    <div className="sp-card" style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon size={30}>{STEPS[step].icon}</Icon>
          {STEPS[step].title}
        </span>
        <span style={{ color: "#78716c", fontSize: 13, whiteSpace: "nowrap" }}>
          Passo {step + 1} de {STEPS.length}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, gap: 6 }}>
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={s.title}
            onClick={() => i < step && setStep(i)}
            style={{
              height: 6,
              border: 0,
              padding: 0,
              borderRadius: 99,
              background: i <= step ? "var(--sp-primary)" : "#e7e5e4",
              cursor: i < step ? "pointer" : "default",
            }}
          />
        ))}
      </div>
    </div>
  );

  const navButtons = (
    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
      {step > 0 && (
        <Button size="large" icon={<ArrowLeftOutlined />} onClick={() => setStep(step - 1)} style={isMobile ? { flex: 1 } : undefined}>
          Voltar
        </Button>
      )}
      <Button
        size="large"
        type="primary"
        icon={step === STEPS.length - 1 ? <EyeOutlined /> : <ArrowRightOutlined />}
        iconPosition={step === STEPS.length - 1 ? "start" : "end"}
        onClick={next}
        style={isMobile ? { flex: 2 } : undefined}
      >
        {step === STEPS.length - 1 ? "Ver currículo pronto" : "Próximo"}
      </Button>
    </div>
  );

  return (
    <SimplePage
      title="Currículos"
      subtitle="Monte o currículo do cliente em 4 passos e imprima na hora"
      actions={
        <>
          <Button icon={<CopyOutlined />} onClick={copyAsk}>
            Copiar o que pedir ao cliente
          </Button>
          {(tab === "historico" || preview || step > 0) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={confirmNew}>
              Novo currículo
            </Button>
          )}
        </>
      }
      mobileActions={
        <button type="button" className="sp-round" aria-label="Copiar o que pedir ao cliente" onClick={copyAsk}>
          <CopyOutlined />
        </button>
      }
    >
      <Form form={form} layout="vertical" requiredMark={false} initialValues={EMPTY_CV}>
      <div className="sp-stack">
        <Chips
          value={tab}
          onChange={setTab}
          options={[
            { value: "novo", label: savedId ? "Currículo aberto" : "Fazer currículo" },
            { value: "historico", label: "Feitos antes", count: history ? history.length : undefined },
          ]}
        />

        {tab === "historico" ? (
          <>
            <Input allowClear size="large" prefix={<SearchOutlined />} placeholder="Buscar pelo nome, telefone ou profissão" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
            {historyLoading && !history ? (
              <div className="sp-card">
                <Skeleton active paragraph={{ rows: 5 }} />
              </div>
            ) : !history?.length ? (
              <div className="sp-card">
                <EmptyState icon={<HistoryOutlined />} title="Nenhum currículo feito ainda" text="Os currículos que você imprimir ou baixar ficam guardados aqui para reimprimir depois." />
              </div>
            ) : !filteredHistory.length ? (
              <div className="sp-card" style={{ textAlign: "center", color: "#78716c", padding: 28 }}>
                Nenhum currículo encontrado com essa busca.
              </div>
            ) : (
              <div className="sp-list">
                {filteredHistory.slice(0, 60).map((c) => (
                  <div className="sp-item" key={c.id}>
                    <Icon size={40}>
                      <FileTextOutlined />
                    </Icon>
                    <div className="sp-item-main">
                      <div className="sp-item-top">
                        <span className="sp-item-title is-wrap">{c.nome}</span>
                      </div>
                      <div className="sp-item-meta">
                        {c.profissao && <span>{c.profissao}</span>}
                        {c.telefone && <span>{c.telefone}</span>}
                        <span>feito em {dayjs(c.updatedAt || c.createdAt).format("DD/MM/YYYY")}</span>
                      </div>
                      <div className="sp-item-actions">
                        <Button type="primary" icon={<PrinterOutlined />} loading={opening === c.id} onClick={() => openSaved(c, "view")}>
                          Abrir para imprimir
                        </Button>
                        <Button icon={<EditOutlined />} disabled={opening === c.id} onClick={() => openSaved(c, "edit")}>
                          Atualizar dados
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredHistory.length > 60 && (
                  <div style={{ textAlign: "center", color: "#a8a29e", fontSize: 13 }}>Mostrando os 60 mais recentes. Use a busca para achar os outros.</div>
                )}
              </div>
            )}
          </>
        ) : preview ? (
          <>
            <div className="sp-card" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                <b style={{ fontSize: 15 }}>Currículo de {preview.nome} pronto! 🎉</b>
                <div style={{ color: "#78716c", fontSize: 13 }}>Confira abaixo. Se algo estiver errado, toque em Corrigir.</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
                <Button type="primary" size="large" icon={<PrinterOutlined />} onClick={print} loading={exporting} style={isMobile ? { flex: 1 } : undefined}>
                  Imprimir
                </Button>
                <Button size="large" icon={<DownloadOutlined />} onClick={download} disabled={exporting} style={isMobile ? { flex: 1 } : undefined}>
                  Baixar PDF
                </Button>
                <Button
                  size="large"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setPreview(null);
                    setStep(0);
                  }}
                  style={isMobile ? { flex: 1 } : undefined}
                >
                  Corrigir
                </Button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: "#78716c", marginBottom: 8 }}>Modelo</div>
              <ModelPicker
                value={preview.modelo}
                onChange={(modelo) => {
                  form.setFieldsValue({ modelo });
                  setPreview({ ...preview, modelo });
                }}
              />
            </div>
            <A4Preview cv={preview} docRef={docRef} fullSize={exporting} />
          </>
        ) : (
          <>
            {progress}
            <div className="sp-card">{renderStep()}</div>
            {navButtons}
          </>
        )}
      </div>
      </Form>

      {exporting && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.75)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spin size="large" tip="Preparando o PDF...">
            <div style={{ width: 200, height: 80 }} />
          </Spin>
        </div>
      )}
    </SimplePage>
  );
}

function ModelPicker({ value, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))", gap: 10 }}>
      {MODELOS.map((m) => {
        const active = value === m.key;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onChange?.(m.key)}
            style={{
              textAlign: "left",
              background: "#fff",
              border: `1px solid ${active ? "var(--sp-primary)" : "#e7e5e4"}`,
              boxShadow: active ? "0 0 0 1px var(--sp-primary)" : "none",
              borderRadius: 12,
              padding: 12,
              cursor: "pointer",
              font: "inherit",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
              <span style={{ width: 14, height: 14, borderRadius: 99, background: m.cor, flexShrink: 0 }} />
              {m.nome}
              {active && <CheckOutlined style={{ marginLeft: "auto", color: "var(--sp-primary)" }} />}
            </div>
            <div style={{ fontSize: 12, color: "#78716c", marginTop: 4 }}>{m.desc}</div>
          </button>
        );
      })}
    </div>
  );
}
