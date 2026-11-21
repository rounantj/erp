import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Col, Empty, List, Popconfirm, Row, Space, Spin, Switch, Tag, Typography, message } from "antd";
import { QrcodeOutlined, ReloadOutlined, WhatsAppOutlined } from "@ant-design/icons";
import moment from "moment";
import { errorMessage, whatsappApi } from "./whatsapp-api";

const { Text, Title, Paragraph } = Typography;

const QR_REFRESH_MS = 40000;
const STATUS_POLL_MS = 3000;

const formatPhone = (phone) => {
  const digits = String(phone || "").replace(/^55/, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return phone || "";
};

function WhatsAppConexao({ isAdmin }) {
  const [status, setStatus] = useState(null);
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [conversations, setConversations] = useState([]);
  const qrTimer = useRef(null);

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

  if (!status) return <Spin />;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title={<><WhatsAppOutlined style={{ color: "#25D366" }} /> Conexão do WhatsApp</>} extra={<Button size="small" icon={<ReloadOutlined />} onClick={loadStatus} />}>
          {status.error && <Alert type="error" showIcon message={status.error} style={{ marginBottom: 16 }} />}

          {status.connected ? (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Space>
                <Tag color="green">Conectado</Tag>
                <Text strong>{formatPhone(status.phone)}</Text>
                {status.profileName && <Text type="secondary">{status.profileName}</Text>}
              </Space>

              <Space align="center">
                <Switch checked={status.botEnabled} onChange={toggleBot} loading={busy} disabled={!isAdmin} />
                <Text>{status.botEnabled ? "Atendimento automático ligado" : "Atendimento automático desligado"}</Text>
              </Space>
              {!status.botEnabled && (
                <Text type="secondary">
                  Com o atendimento desligado, as mensagens continuam chegando no celular normalmente, mas o assistente não responde.
                </Text>
              )}

              {isAdmin && (
                <Popconfirm
                  title="Desconectar o WhatsApp?"
                  description="O assistente para de responder. Para voltar será preciso ler um novo QR Code."
                  okText="Desconectar"
                  cancelText="Voltar"
                  onConfirm={disconnect}
                >
                  <Button danger loading={busy}>
                    Desconectar
                  </Button>
                </Popconfirm>
              )}
            </Space>
          ) : qr ? (
            <Space direction="vertical" align="center" style={{ width: "100%" }}>
              <img src={qr} alt="QR Code do WhatsApp" style={{ width: 280, height: 280 }} />
              <Paragraph style={{ textAlign: "center", marginBottom: 0 }}>
                No celular da loja, abra o WhatsApp → <b>Configurações</b> → <b>Aparelhos conectados</b> →{" "}
                <b>Conectar um aparelho</b> e aponte a câmera para o código.
              </Paragraph>
              <Text type="secondary">O código é renovado automaticamente.</Text>
              <Button onClick={cancelQr}>Cancelar</Button>
            </Space>
          ) : (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Tag color="default">Desconectado</Tag>
              {isAdmin ? (
                <>
                  <Text>Conecte o WhatsApp da loja para o assistente atender os clientes e registrar pedidos.</Text>
                  <Button type="primary" icon={<QrcodeOutlined />} loading={busy} onClick={generateQr}>
                    Gerar QR Code
                  </Button>
                </>
              ) : (
                <Text type="secondary">Peça a um administrador para conectar o WhatsApp da loja.</Text>
              )}
            </Space>
          )}
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title="Conversas" extra={<Button size="small" icon={<ReloadOutlined />} onClick={loadConversations} />}>
          <Paragraph type="secondary">
            Quando alguém da loja responde um cliente pelo celular, o assistente fica em silêncio naquela conversa por um tempo
            (definido na configuração). Aqui você pode devolver a conversa ao assistente ou pausá-lo manualmente.
          </Paragraph>
          <List
            locale={{ emptyText: <Empty description="Nenhuma conversa ainda." /> }}
            dataSource={conversations}
            renderItem={(c) => (
              <List.Item
                actions={[
                  c.paused ? (
                    <Button key="resume" size="small" type="primary" onClick={() => resume(c.id)}>
                      Devolver ao assistente
                    </Button>
                  ) : (
                    <Button key="pause" size="small" onClick={() => pause(c.id)}>
                      Pausar assistente
                    </Button>
                  ),
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space size={6} wrap>
                      <Text strong>{c.name || formatPhone(c.phone)}</Text>
                      {c.name && <Text type="secondary">{formatPhone(c.phone)}</Text>}
                      {c.paused ? (
                        <Tag color="orange">Atendente humano até {moment(c.human_takeover_until).format("HH:mm")}</Tag>
                      ) : (
                        <Tag color="green">Assistente</Tag>
                      )}
                    </Space>
                  }
                  description={
                    c.last_message_at && (
                      <Text type="secondary" ellipsis style={{ maxWidth: 360, display: "inline-block" }}>
                        {moment(c.last_message_at).format("DD/MM HH:mm")} ·{" "}
                        {c.last_sender === "customer" ? "Cliente" : c.last_sender === "human" ? "Atendente" : "Assistente"}:{" "}
                        {c.last_text || `[${c.last_type}]`}
                      </Text>
                    )
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>
      {!isAdmin && (
        <Col span={24}>
          <Title level={5} type="secondary" style={{ fontWeight: 400 }}>
            Somente administradores podem conectar, desconectar ou ligar o atendimento automático.
          </Title>
        </Col>
      )}
    </Row>
  );
}

export default WhatsAppConexao;
