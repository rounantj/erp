import React, { useCallback, useEffect, useState } from "react";
import { Alert, Avatar, Button, Card, Col, Empty, Form, Input, Modal, Radio, Row, Skeleton, Space, Tag, Typography, notification } from "antd";
import {
  CheckCircleFilled,
  CopyOutlined,
  CrownOutlined,
  DeleteOutlined,
  KeyOutlined,
  LockOutlined,
  ShoppingCartOutlined,
  UnlockOutlined,
  UserAddOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pt-br";
import { apiIntegrator as api } from "helpers/api-integrator";
import { fiscalErrorMessage as errorMessage } from "views/fiscal/fiscal-api";

dayjs.extend(relativeTime);

const { Text, Title, Paragraph } = Typography;

const data = (promise) => promise.then((r) => r.data);
const teamApi = {
  list: () => data(api.get("/team")),
  create: (body) => data(api.post("/team", body)),
  update: (id, body) => data(api.patch(`/team/${id}`, body)),
  resetPassword: (id) => data(api.post(`/team/${id}/reset-password`)),
  remove: (id) => data(api.delete(`/team/${id}`)),
};

const ACCESS = {
  admin: {
    label: "Dono / Administrador",
    short: "Administrador",
    color: "gold",
    icon: <CrownOutlined />,
    description: "Vê e mexe em tudo: faturamento, despesas, configurações e equipe.",
  },
  atendente: {
    label: "Funcionário",
    short: "Funcionário",
    color: "blue",
    icon: <ShoppingCartOutlined />,
    description: "Usa o caixa, produtos, clientes e WhatsApp. Não vê faturamento nem configurações.",
  },
};

const AVATAR_COLORS = ["#f56a00", "#7265e6", "#00a2ae", "#eb2f96", "#52c41a", "#1677ff"];
const initials = (person) =>
  (person.name || person.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

const lastAccess = (person) => {
  if (!person.lastLogin || dayjs(person.lastLogin).diff(dayjs(person.createdAt), "minute") < 1) {
    return `Adicionado em ${dayjs(person.createdAt).format("DD/MM/YYYY")}`;
  }
  return `Último acesso ${dayjs(person.lastLogin).locale("pt-br").fromNow()}`;
};

const AccessChoice = ({ value, onChange }) => (
  <Radio.Group value={value} onChange={(e) => onChange?.(e.target.value)} style={{ width: "100%" }}>
    <Space direction="vertical" style={{ width: "100%" }}>
      {["atendente", "admin"].map((key) => (
        <Radio.Button
          key={key}
          value={key}
          style={{ width: "100%", height: "auto", padding: "10px 14px", borderRadius: 10, lineHeight: 1.4, whiteSpace: "normal" }}
        >
          <Space align="start">
            <span style={{ fontSize: 18 }}>{ACCESS[key].icon}</span>
            <span>
              <b>{ACCESS[key].label}</b>
              <br />
              <span style={{ fontSize: 12, opacity: 0.8 }}>{ACCESS[key].description}</span>
            </span>
          </Space>
        </Radio.Button>
      ))}
    </Space>
  </Radio.Group>
);

const Equipe = () => {
  const [people, setPeople] = useState(null);
  const [busy, setBusy] = useState(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    try {
      setPeople(await teamApi.list());
    } catch (err) {
      setPeople([]);
      notification.error({ message: "Não foi possível carregar a equipe", description: errorMessage(err) });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (key, action, success) => {
    setBusy(key);
    try {
      const result = await action();
      if (success) notification.success({ message: success });
      await load();
      return result;
    } catch (err) {
      notification.error({ message: "Não deu certo", description: errorMessage(err) });
      return null;
    } finally {
      setBusy(null);
    }
  };

  const add = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    try {
      const result = await teamApi.create(values);
      setAdding(false);
      form.resetFields();
      setCredentials({ ...result, isNew: true });
      await load();
    } catch (err) {
      notification.error({ message: "Não foi possível adicionar", description: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const changeAccess = (person, role) =>
    Modal.confirm({
      title: `Mudar o acesso de ${person.name || person.email}?`,
      content: (
        <span>
          Passa a ser <b>{ACCESS[role].label}</b>: {ACCESS[role].description}
        </span>
      ),
      okText: "Sim, mudar",
      cancelText: "Voltar",
      onOk: () => run(`role-${person.id}`, () => teamApi.update(person.id, { role }), "Acesso alterado ✓"),
    });

  const toggleBlock = (person) =>
    Modal.confirm({
      title: person.active ? `Bloquear ${person.name || person.email}?` : `Desbloquear ${person.name || person.email}?`,
      content: person.active
        ? "A pessoa não vai mais conseguir entrar no sistema. Você pode desbloquear quando quiser."
        : "A pessoa volta a conseguir entrar com o mesmo e-mail e senha.",
      okText: person.active ? "Bloquear" : "Desbloquear",
      okButtonProps: { danger: person.active },
      cancelText: "Voltar",
      onOk: () =>
        run(`block-${person.id}`, () => teamApi.update(person.id, { active: !person.active }), person.active ? "Acesso bloqueado" : "Acesso liberado ✓"),
    });

  const resetPassword = (person) =>
    Modal.confirm({
      title: `Criar uma senha nova para ${person.name || person.email}?`,
      content: "A senha antiga para de funcionar. Depois é só passar a nova senha para a pessoa.",
      okText: "Criar senha nova",
      cancelText: "Voltar",
      onOk: async () => {
        const result = await run(`pass-${person.id}`, () => teamApi.resetPassword(person.id));
        if (result) setCredentials(result);
      },
    });

  const remove = (person) =>
    Modal.confirm({
      title: `Tirar ${person.name || person.email} da equipe?`,
      content: "A pessoa perde o acesso ao sistema. As vendas que ela fez continuam guardadas.",
      okText: "Tirar da equipe",
      okButtonProps: { danger: true },
      cancelText: "Voltar",
      onOk: () => run(`del-${person.id}`, () => teamApi.remove(person.id), "Pessoa removida da equipe"),
    });

  const credentialText = credentials
    ? `Seu acesso ao sistema da loja:\nSite: ${window.location.origin}\nE-mail: ${credentials.user.email}\nSenha: ${credentials.password}`
    : "";

  const copyCredentials = async () => {
    try {
      await navigator.clipboard.writeText(credentialText);
      notification.success({ message: "Copiado ✓", description: "Agora é só colar na conversa com a pessoa." });
    } catch {
      notification.info({ message: "Selecione o texto e copie manualmente" });
    }
  };

  if (!people) return <Skeleton active paragraph={{ rows: 8 }} />;

  const members = people.filter((p) => ACCESS[p.role]);
  const pending = people.filter((p) => !ACCESS[p.role]);

  const personCard = (person, index) => {
    const access = ACCESS[person.role];
    const locked = person.isMe || person.protected;
    return (
      <Card key={person.id} size="small" style={{ borderRadius: 12, marginBottom: 12, opacity: person.active ? 1 : 0.7 }} styles={{ body: { padding: 16 } }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <Avatar size={48} style={{ background: person.active ? AVATAR_COLORS[index % AVATAR_COLORS.length] : "#bfbfbf", flexShrink: 0 }}>
            {initials(person)}
          </Avatar>
          <div style={{ flex: "1 1 220px", minWidth: 0 }}>
            <Space size={6} wrap>
              <Text strong style={{ fontSize: 15 }}>
                {person.name || person.email.split("@")[0]}
              </Text>
              {person.isMe && <Tag color="purple">Você</Tag>}
              {!person.active && (
                <Tag color="red" icon={<LockOutlined />}>
                  Bloqueado
                </Tag>
              )}
            </Space>
            <div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {person.email}
              </Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {lastAccess(person)}
            </Text>
          </div>
          <div style={{ flex: "0 1 auto" }}>
            {access && (
              <Tag color={access.color} icon={access.icon} style={{ fontSize: 13, padding: "3px 10px" }}>
                {access.short}
              </Tag>
            )}
          </div>
        </div>

        {!locked && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 8,
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid #f0f0f0",
            }}
          >
            <Button
              icon={person.role === "admin" ? <ShoppingCartOutlined /> : <CrownOutlined />}
              loading={busy === `role-${person.id}`}
              onClick={() => changeAccess(person, person.role === "admin" ? "atendente" : "admin")}
            >
              {person.role === "admin" ? "Tornar funcionário" : "Tornar administrador"}
            </Button>
            <Button icon={<KeyOutlined />} loading={busy === `pass-${person.id}`} onClick={() => resetPassword(person)}>
              Senha nova
            </Button>
            <Button icon={person.active ? <LockOutlined /> : <UnlockOutlined />} loading={busy === `block-${person.id}`} onClick={() => toggleBlock(person)}>
              {person.active ? "Bloquear" : "Desbloquear"}
            </Button>
            <Button danger icon={<DeleteOutlined />} loading={busy === `del-${person.id}`} onClick={() => remove(person)}>
              Remover
            </Button>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <Card style={{ borderRadius: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Quem usa o sistema
            </Title>
            <Text type="secondary">
              {members.length === 1 ? "Só você por enquanto." : `${members.length} pessoas na equipe.`} Cada pessoa entra com o próprio e-mail e senha.
            </Text>
          </div>
          <Button type="primary" size="large" icon={<UserAddOutlined />} onClick={() => setAdding(true)}>
            Adicionar pessoa
          </Button>
        </div>

        <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
          {Object.entries(ACCESS).map(([key, a]) => (
            <Col xs={24} md={12} key={key}>
              <div style={{ background: "#fafafa", borderRadius: 10, padding: "10px 14px", height: "100%" }}>
                <Space align="start">
                  <span style={{ fontSize: 18 }}>{a.icon}</span>
                  <span>
                    <Text strong>{a.label}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {a.description}
                    </Text>
                  </span>
                </Space>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {pending.length > 0 && (
        <Card style={{ borderRadius: 12, marginBottom: 20, borderColor: "#ffe58f", background: "#fffdf3" }} title={`Pedidos de acesso (${pending.length})`}>
          <Paragraph type="secondary" style={{ marginTop: -8 }}>
            Estas pessoas criaram conta, mas ainda não conseguem usar o sistema. Se não conhece, é só remover.
          </Paragraph>
          {pending.map((person) => (
            <div
              key={person.id}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid #f5f0d8", flexWrap: "wrap" }}
            >
              <Avatar style={{ background: "#d9d9d9" }}>{initials(person)}</Avatar>
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <Text strong>{person.name || person.email}</Text>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Pediu acesso {dayjs(person.createdAt).locale("pt-br").fromNow()}
                  </Text>
                </div>
              </div>
              <Space wrap>
                <Button
                  type="primary"
                  ghost
                  icon={<CheckCircleFilled />}
                  loading={busy === `role-${person.id}`}
                  onClick={() =>
                    run(`role-${person.id}`, () => teamApi.update(person.id, { role: "atendente", active: true }), "Acesso liberado como funcionário ✓")
                  }
                >
                  Liberar como funcionário
                </Button>
                <Button danger type="text" icon={<DeleteOutlined />} loading={busy === `del-${person.id}`} onClick={() => remove(person)}>
                  Remover
                </Button>
              </Space>
            </div>
          ))}
        </Card>
      )}

      {members.length ? members.map(personCard) : <Empty description="Ninguém na equipe ainda" />}

      <Modal
        open={adding}
        title="Adicionar pessoa à equipe"
        okText="Adicionar"
        cancelText="Cancelar"
        confirmLoading={saving}
        onOk={add}
        onCancel={() => setAdding(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false} initialValues={{ role: "atendente" }} preserve={false}>
          <Form.Item name="name" label="Nome" rules={[{ required: true, message: "Digite o nome da pessoa" }]}>
            <Input size="large" placeholder="Ex.: Maria" autoFocus />
          </Form.Item>
          <Form.Item
            name="email"
            label="E-mail"
            extra="É com ele que a pessoa vai entrar no sistema."
            rules={[
              { required: true, message: "Digite o e-mail" },
              { type: "email", message: "E-mail inválido" },
            ]}
          >
            <Input size="large" placeholder="maria@email.com" inputMode="email" />
          </Form.Item>
          <Form.Item name="role" label="O que ela pode fazer?">
            <AccessChoice />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 13 }}>
            A senha é criada automaticamente e aparece na próxima tela.
          </Text>
        </Form>
      </Modal>

      <Modal
        open={!!credentials}
        title={credentials?.isNew ? "Pronto! Pessoa adicionada ✓" : "Senha nova criada ✓"}
        onCancel={() => setCredentials(null)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setCredentials(null)}>
            Já passei os dados
          </Button>,
        ]}
      >
        {credentials && (
          <>
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="Passe estes dados para a pessoa agora"
              description="Por segurança, a senha só aparece desta vez. Se perder, é só criar uma senha nova."
            />
            <div style={{ background: "#f5f5f5", borderRadius: 10, padding: 16, fontSize: 15, lineHeight: 1.9 }}>
              <div>
                <Text type="secondary">Site: </Text>
                <Text strong>{window.location.origin}</Text>
              </div>
              <div>
                <Text type="secondary">E-mail: </Text>
                <Text strong>{credentials.user.email}</Text>
              </div>
              <div>
                <Text type="secondary">Senha: </Text>
                <Text strong code style={{ fontSize: 17 }}>
                  {credentials.password}
                </Text>
              </div>
            </div>
            <Space wrap style={{ marginTop: 16 }}>
              <Button size="large" icon={<CopyOutlined />} onClick={copyCredentials}>
                Copiar
              </Button>
              <Button
                size="large"
                icon={<WhatsAppOutlined />}
                style={{ background: "#25d366", borderColor: "#25d366", color: "#fff" }}
                href={`https://wa.me/?text=${encodeURIComponent(credentialText)}`}
                target="_blank"
              >
                Enviar pelo WhatsApp
              </Button>
            </Space>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Equipe;
