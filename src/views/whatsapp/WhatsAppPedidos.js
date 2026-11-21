import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Button, Card, Col, Descriptions, Drawer, Empty, List, Row, Segmented, Space, Spin, Tag, Typography, message } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  MessageOutlined,
  PaperClipOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { brl, CHECKOUT_IMPORT_KEY, errorMessage, whatsappApi } from "./whatsapp-api";

const { Text, Paragraph } = Typography;

const STATUS = {
  pending: { label: "Aguardando", color: "orange", accent: "#fa8c16" },
  in_progress: { label: "Em execução", color: "blue", accent: "#1677ff" },
  ready: { label: "Pronto", color: "green", accent: "#52c41a" },
  delivered: { label: "Entregue", color: "default", accent: "#bfbfbf" },
  cancelled: { label: "Cancelado", color: "red", accent: "#ff4d4f" },
};

const NEXT_ACTIONS = {
  pending: [
    { status: "in_progress", label: "Iniciar", type: "primary" },
    { status: "cancelled", label: "Cancelar", danger: true, secondary: true },
  ],
  in_progress: [
    { status: "ready", label: "Pronto (avisa o cliente)", type: "primary" },
    { status: "pending", label: "Voltar para a fila", secondary: true },
    { status: "cancelled", label: "Cancelar", danger: true, secondary: true },
  ],
  ready: [
    { status: "delivered", label: "Entregue", type: "primary" },
    { status: "in_progress", label: "Voltar para execução", secondary: true },
  ],
};

const FILTERS = [
  { label: "Fila", value: "pending,in_progress" },
  { label: "Prontos", value: "ready" },
  { label: "Finalizados", value: "delivered,cancelled" },
  { label: "Todos", value: "all" },
];

const NOTIFICATION_LABEL = { pending: "aviso na fila", sending: "enviando aviso", sent: "cliente avisado", failed: "falha no aviso" };

const formatPhone = (phone) => {
  const digits = String(phone || "").replace(/^55/, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
};

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const elapsed = (date) => {
  const minutes = moment().diff(moment(date), "minutes");
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h${minutes % 60 ? ` ${minutes % 60}min` : ""}`;
  return moment(date).format("DD/MM HH:mm");
};

function useSendToCheckout() {
  const history = useHistory();
  return async (orderId) => {
    try {
      const payload = await whatsappApi.checkoutPayload(orderId);
      if (!payload.items.length) {
        message.warning("Este pedido não tem itens com preço. Adicione os produtos ou serviços no caixa.");
      }
      localStorage.setItem(CHECKOUT_IMPORT_KEY, JSON.stringify({ ...payload, createdAt: Date.now() }));
      history.push("/admin/checkout");
    } catch (err) {
      message.error(errorMessage(err, "Não foi possível enviar o pedido para o caixa."));
    }
  };
}

function CustomerNote({ note }) {
  if (!note) return null;
  return (
    <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 8, padding: "6px 10px", margin: "8px 0" }}>
      <Text>
        <MessageOutlined style={{ color: "#d48806" }} /> <Text strong>Recado do cliente:</Text> {note}
      </Text>
    </div>
  );
}

function FilePreview({ file }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(file.preview_kind !== "none");

  useEffect(() => {
    if (file.preview_kind === "none") return undefined;
    let alive = true;
    whatsappApi
      .filePreview(file.id)
      .then((p) => alive && setPreview(p))
      .catch(() => alive && setPreview({ kind: "none" }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [file.id, file.preview_kind]);

  const download = async () => {
    try {
      const { url } = await whatsappApi.fileDownload(file.id);
      window.open(url, "_blank", "noopener");
    } catch (err) {
      message.error(errorMessage(err, "Não foi possível baixar o arquivo."));
    }
  };

  const box = { width: "100%", borderRadius: 8, border: "1px solid #eee", background: "#fafafa" };
  let body = null;
  if (loading) body = <Spin />;
  else if (preview?.kind === "image") body = <img src={preview.url} alt={file.original_name} style={{ ...box, maxHeight: 420, objectFit: "contain" }} />;
  else if (preview?.kind === "pdf") body = <iframe title={file.original_name} src={preview.url} style={{ ...box, height: 480 }} />;
  else if (preview?.kind === "audio") body = <audio controls src={preview.url} style={{ width: "100%" }} />;
  else if (preview?.kind === "video") body = <video controls src={preview.url} style={{ ...box, maxHeight: 420 }} />;
  else if (preview?.kind === "text") body = <iframe title={file.original_name} src={preview.url} style={{ ...box, height: 240 }} />;
  else body = <Text type="secondary">Sem pré-visualização para este tipo de arquivo. Use o botão de baixar.</Text>;

  return (
    <div style={{ marginBottom: 16 }}>
      <Space style={{ marginBottom: 8, width: "100%", justifyContent: "space-between" }}>
        <Text strong>
          <PaperClipOutlined /> {file.original_name} <Text type="secondary">{formatSize(Number(file.size_bytes))}</Text>
        </Text>
        <Button size="small" icon={<DownloadOutlined />} onClick={download}>
          Baixar
        </Button>
      </Space>
      {body}
    </div>
  );
}

function OrderDrawer({ orderId, onClose, onChanged }) {
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const sendToCheckout = useSendToCheckout();

  useEffect(() => {
    setOrder(null);
    if (!orderId) return;
    whatsappApi
      .getOrder(orderId)
      .then(setOrder)
      .catch((err) => message.error(errorMessage(err, "Não foi possível abrir o pedido.")));
  }, [orderId]);

  const run = async (fn, successText) => {
    setBusy(true);
    try {
      setOrder(await fn());
      if (successText) message.success(successText);
      onChanged();
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const notification = order?.notifications?.find((n) => n.type === "ready");
  const total = (order?.items || []).reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price || 0), 0);

  return (
    <Drawer
      open={Boolean(orderId)}
      onClose={onClose}
      width={Math.min(720, window.innerWidth)}
      title={order ? `Pedido nº ${order.number}` : "Pedido"}
      extra={order && <Tag color={STATUS[order.status]?.color}>{STATUS[order.status]?.label}</Tag>}
    >
      {!order ? (
        <Spin />
      ) : (
        <>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Cliente">
              {order.customer_name || "Sem nome"} · {formatPhone(order.customer_phone)}
            </Descriptions.Item>
            <Descriptions.Item label="Recebido">{moment(order.created_at).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
            {order.expected_processing_from && order.status === "pending" && (
              <Descriptions.Item label="Começar a partir de">
                {moment(order.expected_processing_from).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            )}
            {order.operator_name && <Descriptions.Item label="Responsável">{order.operator_name}</Descriptions.Item>}
            {order.venda_id && <Descriptions.Item label="Venda no caixa">nº {order.venda_id}</Descriptions.Item>}
            {notification && (
              <Descriptions.Item label="Aviso ao cliente">
                <Space>
                  <Tag color={notification.status === "sent" ? "green" : notification.status === "failed" ? "red" : "blue"}>
                    {NOTIFICATION_LABEL[notification.status]}
                  </Tag>
                  {notification.status === "failed" && (
                    <Button size="small" loading={busy} onClick={() => run(() => whatsappApi.retryNotification(order.id), "Aviso reenviado para a fila.")}>
                      Reenviar aviso
                    </Button>
                  )}
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>

          <Text strong>O que fazer</Text>
          <Paragraph style={{ whiteSpace: "pre-wrap", background: "#f6f8fa", padding: 12, borderRadius: 8, marginTop: 4 }}>
            {order.description}
          </Paragraph>
          <CustomerNote note={order.customer_note} />

          {order.items?.length > 0 && (
            <>
              <Text strong>Itens</Text>
              <List
                size="small"
                style={{ marginBottom: 16 }}
                dataSource={order.items}
                footer={<Text strong>Total estimado: {brl(total)}</Text>}
                renderItem={(item) => (
                  <List.Item extra={item.unit_price != null && <Text>{brl(Number(item.quantity) * Number(item.unit_price))}</Text>}>
                    {Number(item.quantity)}x {item.description}
                    {item.unit_price != null && <Text type="secondary"> · {brl(item.unit_price)} cada</Text>}
                  </List.Item>
                )}
              />
            </>
          )}

          {order.files?.length > 0 && (
            <>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Arquivos ({order.files.length})
              </Text>
              {order.files.map((file) => (
                <FilePreview key={file.id} file={file} />
              ))}
            </>
          )}

          <Space wrap style={{ marginTop: 8 }}>
            {(NEXT_ACTIONS[order.status] || []).map((action) => (
              <Button
                key={action.status}
                type={action.type}
                danger={action.danger}
                loading={busy}
                onClick={() =>
                  run(
                    () => whatsappApi.updateOrderStatus(order.id, action.status),
                    action.status === "ready" ? "Pedido pronto. O cliente será avisado pelo WhatsApp." : null
                  )
                }
              >
                {action.label}
              </Button>
            ))}
            {order.status !== "cancelled" && !order.venda_id && (
              <Button icon={<ShoppingCartOutlined />} onClick={() => sendToCheckout(order.id)}>
                Finalizar no caixa
              </Button>
            )}
          </Space>
        </>
      )}
    </Drawer>
  );
}

function StatCard({ title, value, extra, accent, icon, active, onClick }) {
  return (
    <Card
      size="small"
      hoverable={Boolean(onClick)}
      onClick={onClick}
      style={{ borderRadius: 10, borderTop: `3px solid ${accent}`, background: active ? "#fafafa" : undefined, height: "100%" }}
      bodyStyle={{ padding: "12px 14px" }}
    >
      <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {title}
          </Text>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2, color: "#262626" }}>{value}</div>
          {extra && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {extra}
            </Text>
          )}
        </div>
        <span style={{ fontSize: 22, color: accent }}>{icon}</span>
      </Space>
    </Card>
  );
}

function OrderCard({ order, onOpen, onStatus, onCheckout, busy }) {
  const status = STATUS[order.status] || {};
  const items = order.items || [];
  const total = Number(order.total || 0);
  const primary = (NEXT_ACTIONS[order.status] || []).find((a) => !a.secondary);
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  return (
    <Card
      hoverable
      onClick={() => onOpen(order.id)}
      style={{ borderRadius: 10, borderLeft: `5px solid ${status.accent}`, marginBottom: 12 }}
      bodyStyle={{ padding: "12px 16px" }}
    >
      <Row gutter={16} wrap={false} align="top">
        <Col flex="auto" style={{ minWidth: 0 }}>
          <Space wrap size={8}>
            <Text strong style={{ fontSize: 18 }}>
              nº {order.number}
            </Text>
            <Tag color={status.color}>{status.label}</Tag>
            <Text>{order.customer_name || "Sem nome"}</Text>
            <Text type="secondary">{formatPhone(order.customer_phone)}</Text>
          </Space>
          <Paragraph ellipsis={{ rows: 2 }} style={{ margin: "6px 0 0" }}>
            {order.description}
          </Paragraph>
          <CustomerNote note={order.customer_note} />
          {items.length > 0 && (
            <Space wrap size={[4, 4]} style={{ marginTop: 4 }}>
              {items.map((item, index) => (
                <Tag key={index} style={{ marginRight: 0 }}>
                  {Number(item.quantidade)}x {item.descricao}
                  {item.valor_unitario != null && ` · ${brl(item.valor_unitario)}`}
                </Tag>
              ))}
            </Space>
          )}
          <div style={{ marginTop: 6 }}>
            <Space size={12} wrap>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined /> recebido {elapsed(order.created_at)}
              </Text>
              {order.status === "pending" && order.expected_processing_from && moment(order.expected_processing_from).isAfter(moment()) && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  começar a partir de {moment(order.expected_processing_from).format("DD/MM HH:mm")}
                </Text>
              )}
              {order.file_count > 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <PaperClipOutlined /> {order.file_count} arquivo{order.file_count > 1 ? "s" : ""}
                </Text>
              )}
              {order.operator_name && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  responsável: {order.operator_name}
                </Text>
              )}
              {order.notification_status === "failed" && <Tag color="red">falha no aviso</Tag>}
              {order.notification_status === "sent" && order.status === "ready" && <Tag color="green">cliente avisado</Tag>}
              {order.venda_id && <Tag color="purple">venda nº {order.venda_id}</Tag>}
            </Space>
          </div>
        </Col>
        <Col flex="none" style={{ textAlign: "right", minWidth: 170 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Valor
          </Text>
          <div style={{ fontSize: 22, fontWeight: 700, color: total > 0 ? "#262626" : "#bfbfbf" }}>{total > 0 ? brl(total) : "a orçar"}</div>
          <Space direction="vertical" size={6} style={{ marginTop: 8, width: "100%" }}>
            {primary && (
              <Button block type="primary" loading={busy} onClick={stop(() => onStatus(order.id, primary.status))}>
                {primary.label}
              </Button>
            )}
            {order.status !== "cancelled" && !order.venda_id && (
              <Button block icon={<ShoppingCartOutlined />} onClick={stop(() => onCheckout(order.id))}>
                Finalizar no caixa
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );
}

function WhatsAppPedidos() {
  const [filter, setFilter] = useState(FILTERS[0].value);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const sendToCheckout = useSendToCheckout();

  const load = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true);
      whatsappApi.ordersSummary().then(setSummary).catch(() => {});
      whatsappApi
        .listOrders(filter)
        .then(setOrders)
        .catch((err) => !silent && message.error(errorMessage(err, "Não foi possível carregar os pedidos.")))
        .finally(() => setLoading(false));
    },
    [filter]
  );

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 15000);
    return () => clearInterval(timer);
  }, [load]);

  const changeStatus = async (id, status) => {
    setBusyId(id);
    try {
      await whatsappApi.updateOrderStatus(id, status);
      if (status === "ready") message.success("Pedido pronto. O cliente será avisado pelo WhatsApp.");
      load(true);
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const s = summary || {};
  return (
    <>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={8} xl={4}>
          <StatCard title="Aguardando" value={s.pending ?? "–"} accent={STATUS.pending.accent} icon={<ClockCircleOutlined />} active={filter === "pending,in_progress"} onClick={() => setFilter("pending,in_progress")} />
        </Col>
        <Col xs={12} md={8} xl={5}>
          <StatCard title="Em execução" value={s.in_progress ?? "–"} accent={STATUS.in_progress.accent} icon={<SyncOutlined />} active={filter === "pending,in_progress"} onClick={() => setFilter("pending,in_progress")} />
        </Col>
        <Col xs={12} md={8} xl={5}>
          <StatCard title="Prontos para retirada" value={s.ready ?? "–"} accent={STATUS.ready.accent} icon={<CheckCircleOutlined />} active={filter === "ready"} onClick={() => setFilter("ready")} />
        </Col>
        <Col xs={12} md={12} xl={5}>
          <StatCard title="Entregues hoje" value={s.delivered_today ?? "–"} extra={s.delivered_today_total ? brl(s.delivered_today_total) : null} accent="#8c8c8c" icon={<ShoppingCartOutlined />} active={filter === "delivered,cancelled"} onClick={() => setFilter("delivered,cancelled")} />
        </Col>
        <Col xs={24} md={12} xl={5}>
          <StatCard title="Valor em aberto" value={brl(s.open_total)} extra="pedidos aguardando, em execução e prontos" accent="#722ed1" icon={<span style={{ fontWeight: 700 }}>R$</span>} />
        </Col>
      </Row>

      <Space style={{ marginBottom: 12, width: "100%", justifyContent: "space-between" }} wrap>
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
        <Button icon={<ReloadOutlined />} onClick={() => load()}>
          Atualizar
        </Button>
      </Space>

      <Spin spinning={loading}>
        {orders.length === 0 && !loading ? (
          <Empty description="Nenhum pedido aqui." style={{ padding: 32 }} />
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} busy={busyId === order.id} onOpen={setOpenId} onStatus={changeStatus} onCheckout={sendToCheckout} />
          ))
        )}
      </Spin>

      <OrderDrawer orderId={openId} onClose={() => setOpenId(null)} onChanged={() => load(true)} />
    </>
  );
}

export default WhatsAppPedidos;
