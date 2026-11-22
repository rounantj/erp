import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Empty, Input, Modal, Segmented, Spin, Switch, Tag, Typography, message } from "antd";
import { DisconnectOutlined, QrcodeOutlined, ReloadOutlined, RobotOutlined, SearchOutlined, WhatsAppOutlined } from "@ant-design/icons";
import moment from "moment";
import ConversationModal from "./ConversationModal";
import { errorMessage, whatsappApi } from "./whatsapp-api";

import "./WhatsAppConexao.css";

const { Text, Title } = Typography;

const QR_REFRESH_MS = 40000;
const STATUS_POLL_MS = 3000;

const formatPhone = (phone) => {
  const digits = String(phone || "").replace(/^55/, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return phone || "";
};

const SENDER_LABEL = { customer: "Cliente", automation: "Assistente", human: "Atendente" };
const MEDIA_LABEL = { audio: "🎤 Áudio", image: "📷 Imagem", document: "📄 Documento", video: "🎬 Vídeo", sticker: "Figurinha" };
const AVATAR_COLORS = ["#25D366", "#1677ff", "#722ed1", "#eb2f96", "#fa8c16", "#13c2c2", "#2f54eb", "#a0d911"];

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const initials = (name) => {
  const words = String(name || "").replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
};

const avatarColor = (key) => {
  let hash = 0;
  for (const ch of String(key)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const formatWhen = (date) => {
  if (!date) return "";
  const m = moment(date);
  if (m.isSame(moment(), "day")) return m.format("HH:mm");
  if (m.isSame(moment().subtract(1, "day"), "day")) return "Ontem";
  return m.format("DD/MM");
};

function WhatsAppConexao({ isAdmin }) {
  const [status, setStatus] = useState(null);
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [openConversation, setOpenConversation] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const qrTimer = useRef(null);
  const [modal, modalContext] = Modal.useModal();

  const loadStatus = useCallback(async () => {
    try {
      const s = await whatsappApi.status();
      setStatus(s);
      if (s.connected) setQr(null);
      return s;
    } catch (err) {
      setStatus((prev) => prev || { state: "error", connected: false, error: errorMessage(err) });
      return null;
    }
  }, []);

  const loadConversations = useCallback(() => {
    whatsappApi
      .conversations()
      .then(setConversations)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadStatus();
    loadConversations();
    const timer = setInterval(loadConversations, 30000);
    return () => clearInterval(timer);
  }, [loadStatus, loadConversations]);

  // Enquanto o QR está na tela, consulta o estado até o celular parear.
  useEffect(() => {
    if (!qr) return undefined;
    const timer = setInterval(async () => {
      const s = await loadStatus();
      if (s?.connected) {
        clearTimeout(qrTimer.current);
        message.success("WhatsApp conectado!");
      }
    }, STATUS_POLL_MS);
    return () => clearInterval(timer);
  }, [qr, loadStatus]);

  useEffect(() => () => clearTimeout(qrTimer.current), []);

  const generateQr = async () => {
    setBusy(true);
    clearTimeout(qrTimer.current);
    try {
      const result = await whatsappApi.connect();
      if (result.state === "open") {
        setQr(null);
        await loadStatus();
      } else {
        setQr(result.qrCode || null);
        if (!result.qrCode) message.warning("A conexão ainda não devolveu o QR Code. Tente de novo em alguns segundos.");
        // O QR do WhatsApp expira; gera outro enquanto a tela estiver aberta.
        qrTimer.current = setTimeout(generateQr, QR_REFRESH_MS);
      }
    } catch (err) {
      message.error(errorMessage(err, "Não foi possível gerar o QR Code."));
    } finally {
      setBusy(false);
    }
  };

  const cancelQr = () => {
    clearTimeout(qrTimer.current);
    setQr(null);
  };

  const toggleBot = async (enabled) => {
    setBusy(true);
    try {
      setStatus(await whatsappApi.setBot(enabled));
      message.success(enabled ? "Atendimento automático ligado." : "Atendimento automático desligado.");
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await whatsappApi.disconnect();
      message.success("WhatsApp desconectado.");
      await loadStatus();
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // Popconfirm abre fora da tela no build de produção; o modal é centralizado e não depende do alinhamento.
  const confirmDisconnect = () =>
    modal.confirm({
      title: "Desconectar o WhatsApp?",
      content: "O assistente para de responder. Para voltar será preciso ler um novo QR Code.",
      okText: "Desconectar",
      okButtonProps: { danger: true },
      cancelText: "Voltar",
      onOk: disconnect,
    });

  const resume = async (id) => {
    try {
      await whatsappApi.resumeAi(id);
      message.success("O assistente voltou a responder esta conversa.");
      loadConversations();
    } catch (err) {
      message.error(errorMessage(err));
    }
  };

  const pause = async (id) => {
    try {
      await whatsappApi.pauseAi(id);
      message.success("Assistente pausado nesta conversa.");
      loadConversations();
    } catch (err) {
      message.error(errorMessage(err));
    }
  };

  const term = normalize(search.trim());
  const humanCount = conversations.filter((c) => c.paused).length;
  const visible = conversations.filter((c) => {
    if (filter === "human" && !c.paused) return false;
    if (filter === "bot" && c.paused) return false;
    if (!term) return true;
    return [c.name, c.phone, formatPhone(c.phone), c.last_text].some((v) => normalize(v).includes(term));
  });

  if (!status) return <Spin />;

  const connected = status.connected;

  return (
    <div>
      {modalContext}
      <ConversationModal
        conversationId={openConversation}
        open={!!openConversation}
        onClose={() => setOpenConversation(null)}
        formatPhone={formatPhone}
      />
      <Modal open={!!qr} onCancel={cancelQr} footer={null} title="Conectar o WhatsApp da loja" width={420} centered>
        <div className="wa-qr-box">
          {qr && <img src={qr} alt="QR Code do WhatsApp" />}
          <Text>
            No celular da loja, abra o WhatsApp → <b>Configurações</b> → <b>Aparelhos conectados</b> → <b>Conectar um aparelho</b> e
            aponte a câmera para o código.
          </Text>
          <Text type="secondary">O código é renovado automaticamente. Esta janela fecha sozinha quando conectar.</Text>
        </div>
      </Modal>

      <div className={`wa-conn-bar${connected ? "" : " is-off"}`}>
        <div className="wa-conn-identity">
          <div className="wa-conn-logo">
            <WhatsAppOutlined />
          </div>
          <div style={{ minWidth: 0 }}>
            <div>
              <span className="wa-dot" style={{ background: connected ? "#52c41a" : "#bfbfbf" }} />
              <Text strong>{connected ? "Conectado" : "Desconectado"}</Text>
              {connected && <Text style={{ marginLeft: 8 }}>{formatPhone(status.phone)}</Text>}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {connected
                ? status.profileName || "WhatsApp da loja"
                : isAdmin
                ? "Conecte o WhatsApp da loja para o assistente atender e registrar pedidos."
                : "Peça a um administrador para conectar o WhatsApp da loja."}
            </Text>
          </div>
        </div>

        <div className="wa-conn-actions">
          {connected && (
            <div className="wa-bot-toggle">
              <RobotOutlined style={{ color: status.botEnabled ? "#25D366" : "#bfbfbf" }} />
              <Text style={{ fontSize: 13 }}>Assistente automático</Text>
              <Switch size="small" checked={status.botEnabled} onChange={toggleBot} loading={busy} disabled={!isAdmin} />
            </div>
          )}
          <Button icon={<ReloadOutlined />} onClick={loadStatus} />
          {isAdmin &&
            (connected ? (
              <Button danger icon={<DisconnectOutlined />} loading={busy} onClick={confirmDisconnect}>
                Desconectar
              </Button>
            ) : (
              <Button type="primary" icon={<QrcodeOutlined />} loading={busy} onClick={generateQr} style={{ background: "#25D366", borderColor: "#25D366" }}>
                Conectar WhatsApp
              </Button>
            ))}
        </div>
      </div>

      {status.error && <Alert type="error" showIcon message={status.error} style={{ marginTop: 12 }} />}
      {connected && !status.botEnabled && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 12 }}
          message="Assistente automático desligado: as mensagens continuam chegando no celular, mas ninguém responde automaticamente."
        />
      )}

      <div className="wa-panel">
        <div className="wa-panel-header">
          <div>
            <Title level={5} style={{ margin: 0 }}>
              Conversas
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Clique numa conversa para ver o histórico completo. Quando alguém da loja responde pelo celular, o assistente fica em
              silêncio naquela conversa por um tempo.
            </Text>
          </div>
          <div className="wa-counters">
            <span className="wa-counter">{conversations.length} conversas</span>
            {humanCount > 0 && <span className="wa-counter is-human">{humanCount} com atendente humano</span>}
          </div>
        </div>

        <div className="wa-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            placeholder="Buscar por nome, telefone ou mensagem"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { label: "Todas", value: "all" },
              { label: "Assistente", value: "bot" },
              { label: `Atendente humano${humanCount ? ` (${humanCount})` : ""}`, value: "human" },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={loadConversations}>
            Atualizar
          </Button>
        </div>

        <div className="wa-conv-list">
          {!visible.length ? (
            <Empty
              style={{ padding: "48px 0" }}
              description={conversations.length ? "Nenhuma conversa encontrada com esse filtro." : "Nenhuma conversa ainda."}
            />
          ) : (
            visible.map((c) => {
              const title = c.name || formatPhone(c.phone);
              return (
                <div key={c.id} className={`wa-conv${c.paused ? " is-human" : ""}`} onClick={() => setOpenConversation(c.id)}>
                  <div className="wa-avatar" style={{ background: avatarColor(c.phone || c.id) }}>
                    {initials(title)}
                  </div>
                  <div className="wa-conv-main">
                    <div className="wa-conv-top">
                      <span className="wa-conv-name">{title}</span>
                      {c.name && (
                        <Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                          {formatPhone(c.phone)}
                        </Text>
                      )}
                      <span className="wa-conv-time">{formatWhen(c.last_message_at)}</span>
                    </div>
                    <div className="wa-conv-preview">
                      {c.last_message_at ? (
                        <>
                          <b style={{ fontWeight: 500, color: "#595959" }}>{SENDER_LABEL[c.last_sender] || "Cliente"}:</b>{" "}
                          {c.last_text || MEDIA_LABEL[c.last_type] || "[mídia]"}
                        </>
                      ) : (
                        "Sem mensagens"
                      )}
                    </div>
                  </div>
                  <div className="wa-conv-side">
                    {c.paused ? (
                      <Tag className="wa-conv-tag" color="orange" style={{ margin: 0 }}>
                        Humano até {moment(c.human_takeover_until).format("HH:mm")}
                      </Tag>
                    ) : (
                      <Tag className="wa-conv-tag" color="green" style={{ margin: 0 }}>
                        Assistente
                      </Tag>
                    )}
                    {c.paused ? (
                      <Button
                        size="small"
                        type="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          resume(c.id);
                        }}
                      >
                        Devolver ao assistente
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          pause(c.id);
                        }}
                      >
                        Pausar assistente
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {!isAdmin && (
        <Text type="secondary" style={{ display: "block", marginTop: 12 }}>
          Somente administradores podem conectar, desconectar ou ligar o atendimento automático.
        </Text>
      )}
    </div>
  );
}

export default WhatsAppConexao;
