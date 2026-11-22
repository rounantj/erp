import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Empty, Image, Input, Modal, Space, Spin, Tag, Typography, message as toast } from "antd";
import { FileOutlined, ReloadOutlined } from "@ant-design/icons";
import moment from "moment";
import { errorMessage, whatsappApi } from "./whatsapp-api";

const { Text } = Typography;

const SENDERS = {
  customer: { label: "Cliente", align: "flex-start", background: "#ffffff", border: "#e5e7eb" },
  automation: { label: "Assistente", align: "flex-end", background: "#dcf8c6", border: "#c5e8a8" },
  human: { label: "Atendente", align: "flex-end", background: "#e6f0ff", border: "#c7dbff" },
};

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function Highlight({ text, term }) {
  if (!term || !text) return text || null;
  const normalizedText = normalize(text);
  const parts = [];
  let cursor = 0;
  let index = normalizedText.indexOf(term);
  while (index !== -1) {
    parts.push(text.slice(cursor, index));
    parts.push(
      <mark key={index} style={{ padding: 0, background: "#ffe58f" }}>
        {text.slice(index, index + term.length)}
      </mark>
    );
    cursor = index + term.length;
    index = normalizedText.indexOf(term, cursor);
  }
  parts.push(text.slice(cursor));
  return parts;
}

function MessageBody({ m, term }) {
  const openFile = async () => {
    try {
      const { url } = await whatsappApi.fileDownload(m.file_id);
      window.open(url, "_blank", "noopener");
    } catch (err) {
      toast.error(errorMessage(err, "Não foi possível abrir o arquivo."));
    }
  };
  const caption = m.text && <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}><Highlight text={m.text} term={term} /></div>;

  if (m.type === "audio") {
    return (
      <div>
        {m.media_url ? <audio controls preload="none" src={m.media_url} style={{ width: 260, maxWidth: "100%" }} /> : <Text type="secondary">[Áudio]</Text>}
        <div style={{ marginTop: 4 }}>
          {m.media_status === "transcribed" && m.text ? (
            <Text>
              <Text type="secondary">Transcrição: </Text>
              <Highlight text={m.text} term={term} />
            </Text>
          ) : (
            <Text type="secondary">Transcrição indisponível.</Text>
          )}
        </div>
      </div>
    );
  }
  if (m.file_kind === "image" && m.media_url) {
    return (
      <div>
        <Image src={m.media_url} width={220} style={{ borderRadius: 6, objectFit: "cover" }} />
        {caption}
      </div>
    );
  }
  if (m.file_kind === "video" && m.media_url) {
    return (
      <div>
        <video controls preload="none" src={m.media_url} style={{ width: 260, maxWidth: "100%", borderRadius: 6 }} />
        {caption}
      </div>
    );
  }
  if (m.file_id) {
    return (
      <div>
        <Button size="small" icon={<FileOutlined />} onClick={openFile}>
          <Highlight text={m.original_name || "Arquivo"} term={term} />
        </Button>
        {caption}
      </div>
    );
  }
  if (m.type !== "text" && !m.text) return <Text type="secondary">[{m.type === "sticker" ? "Figurinha" : m.type === "image" ? "Imagem" : "Mídia"}]</Text>;
  return <div style={{ whiteSpace: "pre-wrap" }}><Highlight text={m.text} term={term} /></div>;
}

function ConversationModal({ conversationId, open, onClose, formatPhone }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const bottomRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await whatsappApi.conversationMessages(conversationId));
    } catch (err) {
      setError(errorMessage(err, "Não foi possível carregar a conversa."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !conversationId) return;
    setSearch("");
    setData(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, conversationId]);

  const term = normalize(search.trim());
  const messages = useMemo(() => {
    const all = data?.messages || [];
    if (!term) return all;
    return all.filter((m) => normalize(m.text).includes(term) || normalize(m.original_name).includes(term));
  }, [data, term]);

  useEffect(() => {
    if (!term && messages.length) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, term]);

  const conv = data?.conversation;
  let lastDay = null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
      title={
        <Space size={8} wrap>
          <span>{conv ? conv.name || formatPhone(conv.phone) : "Conversa"}</span>
          {conv?.name && <Text type="secondary">{formatPhone(conv.phone)}</Text>}
          {conv && (conv.paused ? <Tag color="orange">Atendente humano</Tag> : <Tag color="green">Assistente</Tag>)}
        </Space>
      }
    >
      <Space style={{ width: "100%", marginBottom: 12 }}>
        <Input.Search
          allowClear
          autoFocus
          placeholder="Buscar mensagem, transcrição de áudio ou nome de arquivo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 560, maxWidth: "100%" }}
        />
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading} />
      </Space>
      {term && data && (
        <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
          {messages.length === 1 ? "1 mensagem encontrada" : `${messages.length} mensagens encontradas`}
        </Text>
      )}
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}

      <div style={{ height: "60vh", overflowY: "auto", background: "#efeae2", borderRadius: 8, padding: 12 }}>
        {loading && !data ? (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <Spin />
          </div>
        ) : !messages.length ? (
          <Empty style={{ paddingTop: 60 }} description={term ? "Nenhuma mensagem com esse texto." : "Nenhuma mensagem nesta conversa."} />
        ) : (
          messages.map((m) => {
            const sender = SENDERS[m.sender] || SENDERS.customer;
            const day = moment(m.created_at).format("DD/MM/YYYY");
            const showDay = day !== lastDay;
            lastDay = day;
            return (
              <React.Fragment key={m.id}>
                {showDay && (
                  <div style={{ textAlign: "center", margin: "8px 0" }}>
                    <Tag style={{ background: "#fff" }}>{day}</Tag>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: sender.align, marginBottom: 6 }}>
                  <div
                    style={{
                      maxWidth: "78%",
                      background: sender.background,
                      border: `1px solid ${sender.border}`,
                      borderRadius: 8,
                      padding: "6px 10px",
                    }}
                  >
                    <Space size={6} style={{ marginBottom: 2 }}>
                      <Text strong style={{ fontSize: 12 }}>
                        {sender.label}
                      </Text>
                      {m.order_number && <Tag color="purple">Pedido {m.order_number}</Tag>}
                    </Space>
                    <MessageBody m={m} term={term} />
                    <div style={{ textAlign: "right" }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {moment(m.created_at).format("HH:mm")}
                      </Text>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </Modal>
  );
}

export default ConversationModal;
