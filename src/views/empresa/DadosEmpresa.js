import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Radio,
  Row,
  Select,
  Skeleton,
  Space,
  Switch,
  Tag,
  Typography,
  Upload,
  notification,
  theme,
} from "antd";
import {
  ApiOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  DeleteOutlined,
  ExclamationCircleFilled,
  FileProtectOutlined,
  MinusCircleFilled,
  SafetyCertificateOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
  ShopOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { UserContext } from "context/UserContext";
import { useCompany } from "context/CompanyContext";
import { getCompanySetup, updateSetup } from "helpers/api-integrator";
import { fiscalApi, fiscalErrorMessage, formatDoc, onlyDigits } from "views/fiscal/fiscal-api";

const { Text, Title, Paragraph } = Typography;

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

// Sugestões comuns para papelaria; o código certo depende da atividade e deve ser confirmado com o contador.
const SERVICE_CODES = [
  { value: "130401", label: "130401 — Cópias, impressões e digitalização" },
  { value: "130501", label: "130501 — Encadernação e confecção de impressos" },
  { value: "170201", label: "170201 — Digitação e apoio administrativo (serviços online, preenchimentos)" },
  { value: "010701", label: "010701 — Suporte técnico em informática" },
];

const FISCAL_FIELDS = [
  "regime",
  "razao_social",
  "inscricao_estadual",
  "inscricao_municipal",
  "logradouro",
  "numero",
  "complemento",
  "bairro",
  "cep",
  "codigo_municipio",
  "municipio",
  "uf",
  "nfce_enabled",
  "nfe_enabled",
  "nfse_enabled",
  "nfce_serie",
  "nfe_serie",
  "nfse_serie",
  "nfse_codigo_tributacao",
  "nfse_codigo_nbs",
  "nfse_descricao_padrao",
  "ncm_padrao",
  "emitir_automaticamente",
];

// Itens do checklist da API traduzidos para o cliente, com o lugar da tela onde se resolve cada um.
const REQUIREMENT = {
  regime: { label: "regime MEI", target: "campo-regime" },
  dados: { label: "CNPJ e razão social", target: "secao-loja" },
  endereco: { label: "endereço completo", target: "campo-endereco" },
  certificado: { label: "certificado digital", target: "secao-certificado" },
  ie: { label: "Inscrição Estadual", target: "campo-ie" },
  uf: { label: "loja no Espírito Santo (outros estados em breve)", target: "campo-endereco" },
  nfse: { label: "código do serviço", target: "campo-servico" },
};

const CAPABILITIES = [
  {
    key: "nfce",
    flag: "nfce_enabled",
    title: "Nota fiscal para consumidor",
    subtitle: "NFC-e · venda de produtos para pessoa física",
    needs: ["regime", "dados", "endereco", "certificado", "ie", "uf"],
  },
  {
    key: "nfe",
    flag: "nfe_enabled",
    title: "Nota fiscal para empresas",
    subtitle: "NF-e · venda de produtos para quem tem CNPJ",
    needs: ["regime", "dados", "endereco", "certificado", "ie", "uf"],
  },
  {
    key: "nfse",
    flag: "nfse_enabled",
    title: "Nota fiscal de serviço",
    subtitle: "NFS-e · cópias, impressões e outros serviços",
    needs: ["regime", "dados", "endereco", "certificado", "nfse"],
  },
];

const isValidCpf = (cpf) => {
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const check = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return (rest === 10 ? 0 : rest) === Number(cpf[len]);
  };
  return check(9) && check(10);
};

const isValidCnpj = (cnpj) => {
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const check = (len) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + Number(cnpj[i]) * w, 0);
    const rest = sum % 11;
    return (rest < 2 ? 0 : 11 - rest) === Number(cnpj[len]);
  };
  return check(12) && check(13);
};

const normalize = (text) =>
  String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

async function findIbgeCode(municipio, uf) {
  if (!municipio || !uf) return null;
  try {
    const res = await fetch(`https://brasilapi.com.br/api/ibge/municipios/v1/${uf}?providers=dados-abertos-br,gov,wikipedia`);
    if (!res.ok) return null;
    const list = await res.json();
    return list.find((m) => normalize(m.nome) === normalize(municipio))?.codigo_ibge?.slice(0, 7) || null;
  } catch {
    return null;
  }
}

const composeAddress = (v) => {
  const rua = [v.logradouro, v.numero, v.complemento].filter(Boolean).join(", ");
  const cidade = [v.municipio, v.uf].filter(Boolean).join("/");
  const cep = onlyDigits(v.cep).length === 8 ? `CEP ${onlyDigits(v.cep).replace(/(\d{5})(\d{3})/, "$1-$2")}` : "";
  return [rua, v.bairro, cidade, cep].filter(Boolean).join(" - ");
};

const scrollableParent = (el) => {
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (p.scrollHeight > p.clientHeight && /(auto|scroll)/.test(getComputedStyle(p).overflowY)) return p;
  }
  return null;
};

// Rola só o container mais próximo: scrollIntoView também rolaria o painel por trás da tela mobile.
const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  const parent = scrollableParent(el);
  if (parent) {
    const top = el.getBoundingClientRect().top - parent.getBoundingClientRect().top + parent.scrollTop - parent.clientHeight / 4;
    parent.scrollTo({ top, behavior: "smooth" });
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  (el.matches("input") ? el : el.querySelector("input, .ant-select-selector, button"))?.focus?.({ preventScroll: true });
};

const SectionTitle = ({ number, icon, title, subtitle }) => {
  const { token } = theme.useToken();
  return (
    <Space align="start" size={12}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: token.colorPrimary,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {number}
      </div>
      <div>
        <Space size={6}>
          {icon}
          <Text strong style={{ fontSize: 16 }}>
            {title}
          </Text>
        </Space>
        {subtitle && (
          <div>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: "normal", whiteSpace: "normal" }}>
              {subtitle}
            </Text>
          </div>
        )}
      </div>
    </Space>
  );
};

const StatusRow = ({ icon, color, title, subtitle, status, action }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap" }}>
    <span style={{ fontSize: 22, color }}>{icon}</span>
    <div style={{ flex: "1 1 220px", minWidth: 0 }}>
      <Text strong>{title}</Text>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {subtitle}
        </Text>
      </div>
    </div>
    <div style={{ flex: "1 1 260px", minWidth: 0 }}>{status}</div>
    {action && <div>{action}</div>}
  </div>
);

const DadosEmpresa = ({ focus }) => {
  const { user } = useContext(UserContext);
  const { updateCompanySetup, refreshSetup } = useCompany();
  const companyId = user?.user?.companyId;
  const [form] = Form.useForm();
  const [config, setConfig] = useState(null);
  const [setup, setSetup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lookup, setLookup] = useState(false);
  const [certFile, setCertFile] = useState(null);
  const [certPassword, setCertPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const documento = onlyDigits(Form.useWatch("documento", form));
  const nomeLoja = Form.useWatch("companyName", form);
  const isCnpj = documento.length === 14;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [setupRes, fiscal] = await Promise.all([getCompanySetup(companyId), fiscalApi.getConfig()]);
      const s = setupRes?.data?.[0] || {};
      const f = fiscal.settings;
      setSetup(s);
      setConfig(fiscal);
      form.setFieldsValue({
        ...Object.fromEntries(FISCAL_FIELDS.map((field) => [field, f[field]])),
        companyName: s.companyName || f.nome_fantasia || f.razao_social || "",
        documento: formatDoc(f.cnpj || onlyDigits(s.companyCNPJ)),
        telefone: f.telefone || onlyDigits(s.companyPhone),
        email: f.email || s.companyEmail || "",
        receiptFooter: s.receiptFooter || "",
        allowNegativeStock: s.allowNegativeStock !== false,
      });
      setDirty(false);
    } catch (err) {
      notification.error({ message: "Não foi possível carregar os dados da empresa", description: fiscalErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [companyId, form]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loading && focus === "fiscal") setTimeout(() => scrollTo("secao-fiscal"), 300);
  }, [loading, focus]);

  const searchCnpj = async () => {
    if (!isCnpj) return notification.warning({ message: "Digite os 14 números do CNPJ" });
    setLookup(true);
    try {
      const info = await fiscalApi.lookupCnpj(documento);
      const keep = (field, value) => value || form.getFieldValue(field);
      form.setFieldsValue({
        documento: formatDoc(info.cnpj),
        razao_social: info.razao_social,
        companyName: form.getFieldValue("companyName") || info.nome_fantasia || info.razao_social,
        logradouro: keep("logradouro", info.logradouro),
        numero: keep("numero", info.numero),
        complemento: keep("complemento", info.complemento),
        bairro: keep("bairro", info.bairro),
        cep: keep("cep", info.cep),
        codigo_municipio: keep("codigo_municipio", info.codigo_municipio),
        municipio: keep("municipio", info.municipio),
        uf: keep("uf", info.uf),
        telefone: keep("telefone", info.telefone),
        email: keep("email", info.email),
      });
      setDirty(true);
      notification.success({
        message: "Dados encontrados na Receita ✓",
        description: `${info.razao_social}${info.mei ? " · MEI" : ""}. Confira e clique em Salvar.`,
      });
    } catch (err) {
      notification.error({ message: "Busca pelo CNPJ", description: fiscalErrorMessage(err) });
    } finally {
      setLookup(false);
    }
  };

  const searchCep = async () => {
    const cep = onlyDigits(form.getFieldValue("cep"));
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
      if (!res.ok) return;
      const data = await res.json();
      form.setFieldsValue({
        logradouro: form.getFieldValue("logradouro") || data.street || "",
        bairro: form.getFieldValue("bairro") || data.neighborhood || "",
        municipio: data.city || form.getFieldValue("municipio"),
        uf: data.state || form.getFieldValue("uf"),
        codigo_municipio: (await findIbgeCode(data.city, data.state)) || form.getFieldValue("codigo_municipio"),
      });
      setDirty(true);
    } catch {
      // Sem internet ou CEP desconhecido: a pessoa preenche à mão.
    }
  };

  const save = async () => {
    let values;
    try {
      await form.validateFields();
      values = form.getFieldsValue(true);
    } catch (err) {
      const first = err?.errorFields?.[0];
      if (first) scrollTo(String(first.name[0]));
      notification.warning({ message: "Confira o campo destacado em vermelho", description: first?.errors?.[0] });
      return;
    }
    setSaving(true);
    try {
      if (values.municipio && values.uf) {
        const sameCity = config.settings.municipio === values.municipio && config.settings.uf === values.uf;
        if (!onlyDigits(values.codigo_municipio) || !sameCity) {
          values.codigo_municipio = (await findIbgeCode(values.municipio, values.uf)) || values.codigo_municipio;
        }
      }
      const doc = onlyDigits(values.documento);
      const fiscal = await fiscalApi.updateConfig({
        ...Object.fromEntries(FISCAL_FIELDS.filter((field) => values[field] !== undefined).map((field) => [field, values[field]])),
        cnpj: doc.length === 14 ? doc : null,
        razao_social: doc.length === 14 ? values.razao_social : null,
        nome_fantasia: values.companyName,
        telefone: onlyDigits(values.telefone),
        email: values.email,
      });

      const latest = (await getCompanySetup(companyId))?.data?.[0] || setup || {};
      const result = await updateSetup({
        ...latest,
        companyId: latest.companyId || companyId,
        companyName: values.companyName,
        companyCNPJ: formatDoc(doc),
        companyAddress: composeAddress(values),
        companyPhone: values.telefone,
        companyEmail: values.email,
        receiptFooter: values.receiptFooter,
        allowNegativeStock: values.allowNegativeStock !== false,
      });
      if (!result?.success) throw new Error("setup");

      setConfig(fiscal);
      form.setFieldsValue({ codigo_municipio: fiscal.settings.codigo_municipio });
      updateCompanySetup({ companyName: values.companyName, allowNegativeStock: values.allowNegativeStock !== false });
      refreshSetup?.();
      setDirty(false);
      notification.success({ message: "Dados salvos ✓" });
    } catch (err) {
      notification.error({
        message: "Não foi possível salvar",
        description: err?.message === "setup" ? "Os dados fiscais foram salvos, mas o cadastro da loja falhou. Tente de novo." : fiscalErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadCertificate = async () => {
    if (!certFile) return notification.warning({ message: "Escolha o arquivo do certificado (.pfx)" });
    if (!certPassword) return notification.warning({ message: "Digite a senha do certificado" });
    setUploading(true);
    try {
      setConfig(await fiscalApi.uploadCertificate(certFile, certPassword));
      setCertFile(null);
      setCertPassword("");
      notification.success({ message: "Certificado digital instalado ✓" });
    } catch (err) {
      notification.error({ message: "Certificado não aceito", description: fiscalErrorMessage(err) });
    } finally {
      setUploading(false);
    }
  };

  const removeCertificate = () =>
    Modal.confirm({
      title: "Remover o certificado digital?",
      content: "Sem o certificado, nenhuma nota poderá ser emitida.",
      okText: "Remover",
      cancelText: "Voltar",
      okButtonProps: { danger: true },
      onOk: async () => setConfig(await fiscalApi.removeCertificate()),
    });

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(await fiscalApi.testConnection());
    } catch (err) {
      notification.error({ message: "Teste de conexão", description: fiscalErrorMessage(err) });
    } finally {
      setTesting(false);
    }
  };

  const changeEnvironment = (ambiente) => {
    if (ambiente === config.settings.ambiente) return;
    Modal.confirm({
      title: ambiente === "producao" ? "Começar a emitir notas que valem?" : "Voltar para o modo teste?",
      icon: <ExclamationCircleFilled />,
      content:
        ambiente === "producao"
          ? "A partir de agora as notas serão reais, enviadas à SEFAZ e à Receita. Faça antes ao menos uma venda de teste."
          : "No modo teste as notas não têm valor fiscal.",
      okText: ambiente === "producao" ? "Sim, emitir notas reais" : "Usar modo teste",
      cancelText: "Voltar",
      onOk: async () => {
        setConfig(await fiscalApi.updateConfig({ ambiente }));
        notification.success({ message: ambiente === "producao" ? "Notas reais ativadas" : "Modo teste ativado" });
      },
    });
  };

  const turnOn = async (cap) => {
    form.setFieldsValue({ [cap.flag]: true });
    try {
      setConfig(await fiscalApi.updateConfig({ [cap.flag]: true }));
      notification.success({ message: `${cap.title} ligada ✓` });
    } catch (err) {
      notification.error({ message: "Não foi possível ligar", description: fiscalErrorMessage(err) });
    }
  };

  const okByKey = useMemo(() => Object.fromEntries((config?.checklist || []).map((c) => [c.key, c.ok])), [config]);

  const nfseOptions = useMemo(() => {
    const current = config?.settings?.nfse_codigo_tributacao;
    if (!current || SERVICE_CODES.some((o) => o.value === current)) return SERVICE_CODES;
    return [{ value: current, label: current }, ...SERVICE_CODES];
  }, [config]);

  if (loading && !config) return <Skeleton active paragraph={{ rows: 14 }} />;
  if (!config) return <Button onClick={load}>Tentar de novo</Button>;

  const cert = config.certificate;
  const certExpiring = cert && cert.daysLeft !== null && cert.daysLeft <= 30;
  const producao = config.settings.ambiente === "producao";

  const missingLinks = (keys) =>
    keys.map((key, i) => (
      <React.Fragment key={key}>
        {i > 0 && ", "}
        <Button type="link" size="small" style={{ padding: 0, height: "auto" }} onClick={() => scrollTo(REQUIREMENT[key].target)}>
          {REQUIREMENT[key].label}
        </Button>
      </React.Fragment>
    ));

  const capabilityRow = (cap) => {
    const missing = cap.needs.filter((k) => !okByKey[k]);
    const enabled = !!config.settings[cap.flag];
    if (!missing.length && enabled) {
      return (
        <StatusRow
          key={cap.key}
          icon={<CheckCircleFilled />}
          color="#52c41a"
          title={cap.title}
          subtitle={cap.subtitle}
          status={
            <Space wrap>
              <Text style={{ color: "#389e0d" }} strong>
                Funcionando
              </Text>
              {!producao && <Tag color="gold">modo teste</Tag>}
            </Space>
          }
        />
      );
    }
    if (!enabled) {
      return (
        <StatusRow
          key={cap.key}
          icon={<MinusCircleFilled />}
          color="#bfbfbf"
          title={cap.title}
          subtitle={cap.subtitle}
          status={
            missing.length ? (
              <span>
                <Text type="secondary">Desligada. Para usar, falta: </Text>
                {missingLinks(missing)}
              </span>
            ) : (
              <Text type="secondary">Tudo pronto, só está desligada</Text>
            )
          }
          action={
            !missing.length && (
              <Button size="small" type="primary" ghost onClick={() => turnOn(cap)}>
                Ligar
              </Button>
            )
          }
        />
      );
    }
    return (
      <StatusRow
        key={cap.key}
        icon={<ClockCircleFilled />}
        color="#faad14"
        title={cap.title}
        subtitle={cap.subtitle}
        status={
          <span>
            <Text type="secondary">Falta: </Text>
            {missingLinks(missing)}
          </span>
        }
      />
    );
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <Card style={{ borderRadius: 12, marginBottom: 20 }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
          <Title level={4} style={{ margin: 0 }}>
            O que sua loja já pode fazer
          </Title>
          {(config.settings.nfce_enabled || config.settings.nfe_enabled || config.settings.nfse_enabled) && (
            <Tag color={producao ? "green" : "gold"} style={{ fontSize: 13, padding: "2px 10px" }}>
              {producao ? "Notas reais (valendo)" : "Notas em modo teste"}
            </Tag>
          )}
        </Space>
        <StatusRow
          icon={nomeLoja ? <CheckCircleFilled /> : <ClockCircleFilled />}
          color={nomeLoja ? "#52c41a" : "#faad14"}
          title="Vender no caixa e imprimir recibo"
          subtitle="Recibo simples, sem valor fiscal"
          status={
            nomeLoja ? (
              <Text style={{ color: "#389e0d" }} strong>
                Funcionando
              </Text>
            ) : (
              <span>
                <Text type="secondary">Falta: </Text>
                <Button type="link" size="small" style={{ padding: 0 }} onClick={() => scrollTo("secao-loja")}>
                  nome da loja
                </Button>
              </span>
            )
          }
        />
        {CAPABILITIES.map(capabilityRow)}
        <Paragraph type="secondary" style={{ margin: "12px 0 0", fontSize: 13 }}>
          Clique no que está faltando para ir direto ao campo.
        </Paragraph>
      </Card>

      <Form form={form} layout="vertical" requiredMark={false} onValuesChange={() => setDirty(true)}>
        <Card
          id="secao-loja"
          style={{ borderRadius: 12, marginBottom: 20 }}
          title={<SectionTitle number={1} icon={<ShopOutlined />} title="Dados da loja" subtitle="Aparecem no sistema, no recibo e nas notas." />}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="CPF ou CNPJ"
                extra={isCnpj ? "Clique em Buscar para preencher o resto sozinho." : "Para emitir nota fiscal é preciso CNPJ."}
                required
              >
                <Space.Compact style={{ width: "100%" }}>
                  <Form.Item
                    name="documento"
                    noStyle
                    normalize={(v) => formatDoc(onlyDigits(v).slice(0, 14))}
                    rules={[
                      {
                        validator: (_, v) => {
                          const d = onlyDigits(v);
                          if (!d || (d.length === 11 && isValidCpf(d)) || (d.length === 14 && isValidCnpj(d))) return Promise.resolve();
                          return Promise.reject(new Error("CPF ou CNPJ inválido. Confira os números."));
                        },
                      },
                    ]}
                  >
                    <Input size="large" placeholder="Só números" inputMode="numeric" onPressEnter={searchCnpj} />
                  </Form.Item>
                  {isCnpj && (
                    <Button size="large" icon={<SearchOutlined />} loading={lookup} onClick={searchCnpj}>
                      Buscar
                    </Button>
                  )}
                </Space.Compact>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="companyName"
                label="Nome da loja"
                rules={[{ required: true, message: "Digite o nome da loja" }]}
                extra="Como seus clientes conhecem a loja."
              >
                <Input size="large" placeholder="Ex.: Papelaria da Maria" />
              </Form.Item>
            </Col>
            {isCnpj && (
              <Col xs={24}>
                <Form.Item name="razao_social" label="Razão social (nome oficial na Receita)">
                  <Input size="large" />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} md={12}>
              <Form.Item name="telefone" label="Telefone / WhatsApp">
                <Input size="large" placeholder="(00) 00000-0000" inputMode="tel" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="E-mail" rules={[{ type: "email", message: "E-mail inválido" }]}>
                <Input size="large" placeholder="loja@email.com" inputMode="email" />
              </Form.Item>
            </Col>
          </Row>

          <div id="campo-endereco">
            <Text strong>Endereço da loja</Text>
            {setup?.companyAddress && !config.settings.logradouro && (
              <Alert
                type="info"
                showIcon
                style={{ margin: "8px 0" }}
                message={`Endereço cadastrado antes: ${setup.companyAddress}`}
                description="Preencha nos campos abaixo."
              />
            )}
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col xs={24} sm={8} md={6}>
                <Form.Item name="cep" label="CEP" extra="Preenche a rua e a cidade.">
                  <Input size="large" placeholder="00000-000" inputMode="numeric" maxLength={9} onBlur={searchCep} onPressEnter={searchCep} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={16} md={12}>
                <Form.Item name="logradouro" label="Rua / Avenida">
                  <Input size="large" />
                </Form.Item>
              </Col>
              <Col xs={10} md={6}>
                <Form.Item name="numero" label="Número">
                  <Input size="large" placeholder="S/N" />
                </Form.Item>
              </Col>
              <Col xs={14} md={8}>
                <Form.Item name="complemento" label="Complemento">
                  <Input size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="bairro" label="Bairro">
                  <Input size="large" />
                </Form.Item>
              </Col>
              <Col xs={16} md={5}>
                <Form.Item name="municipio" label="Cidade">
                  <Input size="large" />
                </Form.Item>
              </Col>
              <Col xs={8} md={3}>
                <Form.Item name="uf" label="UF">
                  <Select size="large" showSearch options={UFS.map((uf) => ({ value: uf, label: uf }))} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Card>

        <Card style={{ borderRadius: 12, marginBottom: 20 }} title={<SectionTitle number={2} icon={<SettingOutlined />} title="Recibo e estoque" />}>
          <Row gutter={16}>
            <Col xs={24} md={14}>
              <Form.Item name="receiptFooter" label="Mensagem no fim do recibo (opcional)">
                <Input.TextArea rows={3} placeholder="Ex.: Obrigado pela preferência! Trocas em até 7 dias." />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item
                name="allowNegativeStock"
                label="Vender produto com estoque zerado?"
                valuePropName="checked"
                extra="Se desligar, o caixa não deixa vender o que não tem no estoque."
              >
                <Switch checkedChildren="Pode" unCheckedChildren="Não pode" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card
          id="secao-fiscal"
          style={{ borderRadius: 12, marginBottom: 20 }}
          title={<SectionTitle number={3} icon={<FileProtectOutlined />} title="Nota fiscal" subtitle="Só precisa preencher se você vai emitir nota fiscal." />}
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <div id="campo-regime">
                <Form.Item name="regime" label="Tipo de empresa">
                  <Select
                    size="large"
                    options={(config.regimes || []).map((r) => ({
                      value: r.value,
                      disabled: !r.available,
                      label: r.available ? r.label : `${r.label} (em breve)`,
                    }))}
                  />
                </Form.Item>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div id="campo-ie">
                <Form.Item
                  name="inscricao_estadual"
                  label="Inscrição Estadual"
                  extra="Necessária para nota de produtos. Está no documento da SEFAZ do seu estado."
                >
                  <Input size="large" placeholder="Só números" inputMode="numeric" />
                </Form.Item>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="inscricao_municipal" label="Inscrição Municipal (opcional)">
                <Input size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Card
            id="secao-certificado"
            size="small"
            type="inner"
            style={{ marginBottom: 16 }}
            title={
              <Space>
                <SafetyCertificateOutlined /> Certificado digital A1
              </Space>
            }
          >
            {cert ? (
              <Alert
                type={certExpiring ? "warning" : "success"}
                showIcon
                style={{ marginBottom: 12 }}
                message={certExpiring ? `Certificado vence em ${cert.daysLeft} dia(s). Renove com sua certificadora.` : "Certificado instalado ✓"}
                description={
                  <Space direction="vertical" size={0} style={{ wordBreak: "break-word" }}>
                    <Text>{cert.subject}</Text>
                    <Text type="secondary">Válido até {dayjs(cert.validUntil).format("DD/MM/YYYY")}</Text>
                    <Button size="small" danger type="link" icon={<DeleteOutlined />} onClick={removeCertificate} style={{ padding: 0, marginTop: 4 }}>
                      Remover certificado
                    </Button>
                  </Space>
                }
              />
            ) : (
              <Paragraph type="secondary">
                É o arquivo que a certificadora te entregou (termina em <b>.pfx</b> ou <b>.p12</b>), junto com a senha dele. Ele fica guardado com segurança e
                serve só para assinar as suas notas.
              </Paragraph>
            )}
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} md={8}>
                <Upload
                  accept=".pfx,.p12"
                  maxCount={1}
                  beforeUpload={(file) => {
                    setCertFile(file);
                    return false;
                  }}
                  onRemove={() => setCertFile(null)}
                  fileList={certFile ? [{ uid: "cert", name: certFile.name, status: "done" }] : []}
                >
                  <Button size="large" icon={<UploadOutlined />}>
                    {cert ? "Trocar certificado" : "Escolher arquivo"}
                  </Button>
                </Upload>
              </Col>
              {(certFile || !cert) && (
                <>
                  <Col xs={24} md={8}>
                    <Input.Password
                      size="large"
                      placeholder="Senha do certificado"
                      value={certPassword}
                      onChange={(e) => setCertPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <Button size="large" type="primary" block loading={uploading} onClick={uploadCertificate} disabled={!certFile}>
                      Instalar certificado
                    </Button>
                  </Col>
                </>
              )}
            </Row>
          </Card>

          <Text strong>Quais notas você quer emitir?</Text>
          <Row gutter={[12, 12]} style={{ margin: "8px 0 16px" }}>
            {CAPABILITIES.map((cap) => (
              <Col xs={24} md={8} key={cap.key}>
                <Card size="small" style={{ height: "100%", borderRadius: 10 }}>
                  <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                    <div>
                      <Text strong>{cap.title}</Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {cap.subtitle}
                        </Text>
                      </div>
                    </div>
                    <Form.Item name={cap.flag} valuePropName="checked" style={{ margin: 0 }}>
                      <Switch checkedChildren="Sim" unCheckedChildren="Não" />
                    </Form.Item>
                  </Space>
                  {cap.key === "nfse" && (
                    <div id="campo-servico" style={{ marginTop: 12 }}>
                      <Form.Item name="nfse_codigo_tributacao" label="Qual serviço você presta?" extra="Confirme com seu contador." style={{ marginBottom: 0 }}>
                        <Select showSearch allowClear placeholder="Escolha o serviço" options={nfseOptions} />
                      </Form.Item>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="emitir_automaticamente"
                label="No caixa, já deixar marcado “Emitir nota”?"
                valuePropName="checked"
                extra="Você ainda pode desmarcar em cada venda."
              >
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Text strong>As notas valem de verdade?</Text>
              <div style={{ margin: "8px 0" }}>
                <Radio.Group value={config.settings.ambiente} onChange={(e) => changeEnvironment(e.target.value)} buttonStyle="solid" size="large">
                  <Radio.Button value="homologacao">Modo teste</Radio.Button>
                  <Radio.Button value="producao">Valendo</Radio.Button>
                </Radio.Group>
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {producao ? "As notas são reais e vão para a SEFAZ e a Receita." : "Use para treinar. As notas não têm valor fiscal."}
              </Text>
            </Col>
          </Row>

          <Collapse
            ghost
            style={{ marginTop: 8 }}
            items={[
              {
                key: "teste",
                label: (
                  <Space>
                    <ApiOutlined /> Testar a conexão com a SEFAZ
                  </Space>
                ),
                children: (
                  <div>
                    <Button loading={testing} onClick={testConnection} disabled={!cert}>
                      Testar agora
                    </Button>
                    {!cert && (
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        Instale o certificado primeiro.
                      </Text>
                    )}
                    {testResult && (
                      <List
                        size="small"
                        style={{ marginTop: 12 }}
                        dataSource={testResult.resultados}
                        renderItem={(r) => (
                          <List.Item>
                            <Space align="start">
                              <Badge status={r.ok ? "success" : "error"} />
                              <span>
                                <Text strong>{r.servico}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {r.mensagem}
                                </Text>
                              </span>
                            </Space>
                          </List.Item>
                        )}
                      />
                    )}
                  </div>
                ),
              },
              {
                key: "avancado",
                label: (
                  <Space>
                    <SettingOutlined /> Opções avançadas (normalmente não precisa mexer)
                  </Space>
                ),
                children: (
                  <Row gutter={16}>
                    <Col xs={8} md={4}>
                      <Form.Item name="nfce_serie" label="Série NFC-e">
                        <InputNumber min={1} max={889} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={8} md={4}>
                      <Form.Item name="nfe_serie" label="Série NF-e">
                        <InputNumber min={1} max={889} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={8} md={4}>
                      <Form.Item name="nfse_serie" label="Série NFS-e">
                        <InputNumber min={1} max={889} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Item name="ncm_padrao" label="NCM padrão" tooltip="Usado só para produto sem NCM no cadastro.">
                        <Input maxLength={8} placeholder="8 dígitos" />
                      </Form.Item>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Item name="codigo_municipio" label="Código IBGE da cidade" tooltip="Preenchido sozinho pela cidade.">
                        <Input maxLength={7} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="nfse_descricao_padrao" label="Texto antes da descrição do serviço">
                        <Input placeholder="Ex.: Serviços de papelaria" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item name="nfse_codigo_nbs" label="Código NBS (opcional)">
                        <Input maxLength={9} />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
            ]}
          />
        </Card>
      </Form>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 10,
          background: dirty ? "#fffbe6" : "#fff",
          border: `1px solid ${dirty ? "#ffe58f" : "#f0f0f0"}`,
          borderRadius: 12,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
        }}
      >
        <Text type={dirty ? "warning" : "secondary"}>{dirty ? "Você tem alterações que ainda não foram salvas." : "Tudo salvo."}</Text>
        <Button type="primary" size="large" icon={<SaveOutlined />} loading={saving} onClick={save}>
          Salvar
        </Button>
      </div>
    </div>
  );
};

export default DadosEmpresa;
