import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Grid,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  notification,
} from "antd";
import { DeleteOutlined, DownloadOutlined, PrinterOutlined, ReloadOutlined, SearchOutlined, StopOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { MODELO_LABEL, STATUS_INFO, brl, fiscalApi, fiscalErrorMessage, formatDoc } from "./fiscal-api";
import { printFiscalDocument } from "./danfe";

const { Text } = Typography;

export const StatusTag = ({ documento }) => {
  const info = STATUS_INFO[documento.status] || { label: documento.status, color: "default" };
  const tag = <Tag color={info.color}>{info.label}</Tag>;
  return documento.motivo && documento.status !== "autorizada" ? <Tooltip title={documento.motivo}>{tag}</Tooltip> : tag;
};

// Ações comuns sobre uma nota; `onChange` recebe a nota atualizada.
export function useFiscalActions(onChange) {
  const [busy, setBusy] = useState(null);

  const run = useCallback(
    async (documento, action, fn, success) => {
      setBusy(`${documento.id}:${action}`);
      try {
        const updated = await fn();
        if (updated) onChange?.(updated);
        if (success) notification.success({ message: success });
      } catch (err) {
        notification.error({ message: "Não foi possível concluir", description: fiscalErrorMessage(err) });
      } finally {
        setBusy(null);
      }
    },
    [onChange],
  );

  const print = (documento) => run(documento, "print", () => printFiscalDocument(documento).then(() => null));
  const xml = (documento, tipo) => run(documento, "xml", () => fiscalApi.downloadXml(documento.id, tipo).then(() => null));
  const retry = (documento) => run(documento, "retry", () => fiscalApi.retry(documento.id), "Nota reenviada");

  const discard = (documento) =>
    Modal.confirm({
      title: "Descartar esta nota?",
      content: documento.modelo === "nfse" ? "A nota rejeitada será descartada." : "O número será inutilizado na SEFAZ e não poderá ser usado de novo.",
      okText: "Descartar",
      okButtonProps: { danger: true },
      onOk: () => run(documento, "discard", () => fiscalApi.discard(documento.id), "Nota descartada"),
    });

  const cancel = (documento) => {
    let motivo = "";
    Modal.confirm({
      title: `Cancelar ${MODELO_LABEL[documento.modelo]} nº ${documento.numero}?`,
      width: 480,
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>
            {documento.modelo === "nfce"
              ? "A NFC-e só pode ser cancelada pouco tempo depois da emissão (em geral, 30 minutos)."
              : documento.modelo === "nfe"
                ? "A NF-e pode ser cancelada em até 24 horas após a autorização."
                : "O prazo de cancelamento da NFS-e depende do município."}
          </p>
          <Input.TextArea
            rows={3}
            placeholder="Motivo do cancelamento (mínimo 15 caracteres)"
            onChange={(e) => {
              motivo = e.target.value;
            }}
          />
        </div>
      ),
      okText: "Cancelar nota",
      cancelText: "Voltar",
      okButtonProps: { danger: true },
      onOk: () => {
        if (motivo.trim().length < 15) {
          notification.warning({ message: "Descreva o motivo com pelo menos 15 caracteres" });
          return Promise.reject();
        }
        return run(documento, "cancel", () => fiscalApi.cancel(documento.id, motivo.trim()), "Nota cancelada");
      },
    });
  };

  const canPrint = (documento) => ["autorizada", "contingencia", "cancelada"].includes(documento.status);

  return { busy, print, xml, retry, cancel, discard, canPrint };
}

export const DocumentActions = ({ documento, actions, labels }) => {
  const { status } = documento;
  const loading = (action) => actions.busy === `${documento.id}:${action}`;
  return (
    <Space size={4} wrap style={{ justifyContent: "flex-end" }}>
      {actions.canPrint(documento) && (
        <Tooltip title="Imprimir">
          <Button size="small" icon={<PrinterOutlined />} loading={loading("print")} onClick={() => actions.print(documento)}>
            {labels && "Imprimir"}
          </Button>
        </Tooltip>
      )}
      {documento.tem_xml && (
        <Tooltip title="Baixar XML">
          <Button size="small" icon={<DownloadOutlined />} loading={loading("xml")} onClick={() => actions.xml(documento)}>
            {labels && "XML"}
          </Button>
        </Tooltip>
      )}
      {status === "cancelada" && (
        <Tooltip title="XML do cancelamento">
          <Button size="small" danger icon={<DownloadOutlined />} onClick={() => actions.xml(documento, "cancelamento")}>
            {labels && "XML cancel."}
          </Button>
        </Tooltip>
      )}
      {["rejeitada", "erro", "contingencia"].includes(status) && (
        <Button size="small" icon={<ReloadOutlined />} loading={loading("retry")} onClick={() => actions.retry(documento)}>
          Reenviar
        </Button>
      )}
      {status === "autorizada" && (
        <Button size="small" danger icon={<StopOutlined />} loading={loading("cancel")} onClick={() => actions.cancel(documento)}>
          Cancelar
        </Button>
      )}
      {["rejeitada", "erro"].includes(status) && (
        <Button size="small" danger icon={<DeleteOutlined />} loading={loading("discard")} onClick={() => actions.discard(documento)}>
          Descartar
        </Button>
      )}
    </Space>
  );
};

const DEFAULT_FILTERS = { q: "", modelo: undefined, status: undefined, ambiente: undefined, range: [dayjs().startOf("month"), dayjs()] };

const RANGE_PRESETS = [
  { label: "Hoje", value: [dayjs().startOf("day"), dayjs()] },
  { label: "Últimos 7 dias", value: [dayjs().subtract(6, "day"), dayjs()] },
  { label: "Este mês", value: [dayjs().startOf("month"), dayjs()] },
  { label: "Mês passado", value: [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")] },
  { label: "Este ano", value: [dayjs().startOf("year"), dayjs()] },
];

const SummaryCard = ({ label, value, color, active, onClick }) => (
  <Card size="small" hoverable={!!onClick} onClick={onClick} style={{ borderRadius: 10, borderColor: active ? color : undefined, height: "100%" }}>
    <Text type="secondary" style={{ fontSize: 12 }}>
      {label}
    </Text>
    <div style={{ fontSize: 20, fontWeight: 600, color }}>{value}</div>
  </Card>
);

const MobileDocument = ({ documento, actions }) => (
  <Card size="small" style={{ borderRadius: 12, marginBottom: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
      <div style={{ minWidth: 0 }}>
        <Text strong>
          {MODELO_LABEL[documento.modelo]} nº {documento.numero}
        </Text>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(documento.created_at).format("DD/MM/YY HH:mm")}
            {documento.venda_id ? ` · venda #${documento.venda_id}` : ""}
            {documento.ambiente === "homologacao" ? " · teste" : ""}
          </Text>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <Text strong style={{ fontSize: 15 }}>
          {brl(documento.valor)}
        </Text>
        <div>
          <StatusTag documento={documento} />
        </div>
      </div>
    </div>
    <Text type="secondary" ellipsis style={{ display: "block", fontSize: 13, marginTop: 4 }}>
      {documento.destinatario_documento ? `${formatDoc(documento.destinatario_documento)} ${documento.destinatario_nome || ""}` : "Consumidor"}
    </Text>
    {documento.motivo && documento.status !== "autorizada" && (
      <Text type={documento.status === "cancelada" ? "secondary" : "danger"} style={{ display: "block", fontSize: 12, marginTop: 4 }}>
        {documento.status === "cancelada" ? `Motivo: ${documento.motivo}` : documento.motivo}
      </Text>
    )}
    <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
      <DocumentActions documento={documento} actions={actions} labels />
    </div>
  </Card>
);

const FiscalDocumentsTable = () => {
  const isMobile = !Grid.useBreakpoint().md;
  const [result, setResult] = useState({ items: [], total: 0, autorizadas: 0, valor_autorizado: 0, pendencias: 0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });

  useEffect(() => {
    const timer = setTimeout(() => setFilters((f) => (f.q === search.trim() ? f : { ...f, q: search.trim() })), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const updateFilter = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResult(
        await fiscalApi.list({
          q: filters.q || undefined,
          modelo: filters.modelo,
          status: filters.status,
          ambiente: filters.ambiente,
          from: filters.range?.[0]?.format("YYYY-MM-DD"),
          to: filters.range?.[1]?.format("YYYY-MM-DD"),
          page: pagination.page,
          pageSize: pagination.pageSize,
        }),
      );
    } catch (err) {
      notification.error({ message: "Erro ao carregar notas", description: fiscalErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination]);

  useEffect(() => {
    load();
  }, [load]);

  const actions = useFiscalActions(() => load());

  const hasFilters = !!filters.q || !!filters.modelo || !!filters.status || !!filters.ambiente || !filters.range?.[0]?.isSame(DEFAULT_FILTERS.range[0], "day");

  const columns = [
    {
      title: "Nota",
      key: "nota",
      width: 150,
      render: (_, d) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            {MODELO_LABEL[d.modelo]} nº {d.numero}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Série {d.serie}
            {d.ambiente === "homologacao" ? " · homologação" : ""}
          </Text>
        </Space>
      ),
    },
    { title: "Emissão", dataIndex: "created_at", render: (v) => dayjs(v).format("DD/MM/YY HH:mm"), width: 120 },
    {
      title: "Cliente",
      key: "cliente",
      render: (_, d) => (d.destinatario_documento ? `${formatDoc(d.destinatario_documento)} ${d.destinatario_nome || ""}` : "Consumidor"),
      ellipsis: true,
    },
    { title: "Venda", dataIndex: "venda_id", render: (v) => (v ? `#${v}` : "-"), width: 80 },
    { title: "Valor", dataIndex: "valor", render: brl, align: "right", width: 110 },
    { title: "Situação", key: "status", render: (_, d) => <StatusTag documento={d} />, width: 130 },
    { title: "", key: "acoes", render: (_, d) => <DocumentActions documento={d} actions={actions} />, width: 180, align: "right", fixed: "right" },
  ];

  return (
    <>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <SummaryCard label="Notas no período" value={result.total} />
        </Col>
        <Col xs={12} md={6}>
          <SummaryCard
            label="Autorizadas"
            value={result.autorizadas}
            color="#389e0d"
            active={filters.status === "autorizada"}
            onClick={() => updateFilter({ status: filters.status === "autorizada" ? undefined : "autorizada" })}
          />
        </Col>
        <Col xs={12} md={6}>
          <SummaryCard label="Valor autorizado" value={brl(result.valor_autorizado)} color="#389e0d" />
        </Col>
        <Col xs={12} md={6}>
          <SummaryCard
            label="Com pendência"
            value={result.pendencias}
            color={result.pendencias ? "#cf1322" : undefined}
            active={filters.status === "pendente"}
            onClick={() => updateFilter({ status: filters.status === "pendente" ? undefined : "pendente" })}
          />
        </Col>
      </Row>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Número, chave, CPF/CNPJ, cliente ou venda"
          style={{ width: isMobile ? "100%" : 300 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {isMobile ? (
          <Select
            style={{ width: "100%" }}
            value={RANGE_PRESETS.findIndex((p) => p.value[0].isSame(filters.range?.[0], "day") && p.value[1].isSame(filters.range?.[1], "day"))}
            onChange={(i) => updateFilter({ range: RANGE_PRESETS[i].value })}
            options={RANGE_PRESETS.map((p, i) => ({ value: i, label: p.label }))}
          />
        ) : (
          <DatePicker.RangePicker
            value={filters.range}
            format="DD/MM/YYYY"
            presets={RANGE_PRESETS}
            onChange={(range) => updateFilter({ range })}
            allowClear={false}
          />
        )}
        <Select
          allowClear
          placeholder="Tipo"
          style={{ width: isMobile ? "calc(50% - 4px)" : 110 }}
          value={filters.modelo}
          onChange={(modelo) => updateFilter({ modelo })}
          options={Object.entries(MODELO_LABEL).map(([value, label]) => ({ value, label }))}
        />
        <Select
          allowClear
          placeholder="Situação"
          style={{ width: isMobile ? "calc(50% - 4px)" : 150 }}
          value={filters.status}
          onChange={(status) => updateFilter({ status })}
          options={[{ value: "pendente", label: "Com pendência" }, ...Object.entries(STATUS_INFO).map(([value, info]) => ({ value, label: info.label }))]}
        />
        <Select
          allowClear
          placeholder="Ambiente"
          style={{ width: isMobile ? "calc(50% - 4px)" : 140 }}
          value={filters.ambiente}
          onChange={(ambiente) => updateFilter({ ambiente })}
          options={[
            { value: "producao", label: "Produção" },
            { value: "homologacao", label: "Homologação" },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading} style={isMobile ? { width: "calc(50% - 4px)" } : undefined}>
          Atualizar
        </Button>
        {hasFilters && (
          <Button
            type="link"
            onClick={() => {
              setSearch("");
              updateFilter(DEFAULT_FILTERS);
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {isMobile ? (
        <Spin spinning={loading}>
          {result.items.length ? (
            result.items.map((d) => <MobileDocument key={d.id} documento={d} actions={actions} />)
          ) : (
            <Empty description={hasFilters ? "Nenhuma nota encontrada com esses filtros" : "Nenhuma nota no período"} />
          )}
          {result.total > pagination.pageSize && (
            <Pagination
              simple
              style={{ textAlign: "center", marginTop: 12 }}
              current={pagination.page}
              pageSize={pagination.pageSize}
              total={result.total}
              onChange={(page) => setPagination((p) => ({ ...p, page }))}
            />
          )}
        </Spin>
      ) : (
        <Table
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={result.items}
          loading={loading}
          scroll={{ x: 960 }}
          locale={{ emptyText: hasFilters ? "Nenhuma nota encontrada com esses filtros" : "Nenhuma nota no período" }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: result.total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            locale: { items_per_page: "/ página" },
            showTotal: (total, [start, end]) => `${start}-${end} de ${total} nota(s)`,
          }}
          onChange={(p) => setPagination({ page: p.current, pageSize: p.pageSize })}
        />
      )}
    </>
  );
};

export default FiscalDocumentsTable;
