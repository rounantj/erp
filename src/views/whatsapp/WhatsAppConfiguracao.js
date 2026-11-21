import React, { useEffect, useState } from "react";
import { Button, Card, Col, Divider, Form, Input, InputNumber, List, Popconfirm, Row, Space, Spin, Switch, Tag, Typography, message } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import moment from "moment";
import { errorMessage, whatsappApi } from "./whatsapp-api";

const { Text, Paragraph } = Typography;

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const INSTRUCTIONS_PLACEHOLDER = `Exemplos:
- Impressão P&B A4 custa R$ 0,50 por página; colorida R$ 1,50.
- Não fazemos entregas, apenas retirada na loja.
- Encadernação fica pronta no dia seguinte.
- Aceitamos Pix, cartão e dinheiro.`;

function HoursEditor({ initialWeekly }) {
  const [weekly, setWeekly] = useState(initialWeekly);
  const [saving, setSaving] = useState(false);

  const slotsOf = (weekday) => weekly.map((s, index) => ({ ...s, index })).filter((s) => s.weekday === weekday);
  const update = (index, patch) => setWeekly((w) => w.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  const remove = (index) => setWeekly((w) => w.filter((_, i) => i !== index));
  const add = (weekday) => setWeekly((w) => [...w, { weekday, opensAt: "08:00", closesAt: "18:00" }]);

  const save = async () => {
    const invalid = weekly.find((s) => !s.opensAt || !s.closesAt || s.opensAt >= s.closesAt);
    if (invalid) {
      message.error(`Confira o horário de ${WEEKDAYS[invalid.weekday]}: a abertura precisa ser antes do fechamento.`);
      return;
    }
    setSaving(true);
    try {
      const result = await whatsappApi.replaceHours(weekly);
      setWeekly(result.weekly);
      message.success("Horário de funcionamento salvo.");
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {WEEK_ORDER.map((weekday) => {
        const slots = slotsOf(weekday);
        return (
          <Row key={weekday} align="middle" gutter={8} style={{ marginBottom: 8 }}>
            <Col flex="90px">
              <Text strong>{WEEKDAYS[weekday]}</Text>
            </Col>
            <Col flex="auto">
              <Space wrap>
                {slots.length === 0 && <Tag>Fechado</Tag>}
                {slots.map((slot) => (
                  <Space key={slot.index} size={4}>
                    <Input type="time" value={slot.opensAt} onChange={(e) => update(slot.index, { opensAt: e.target.value })} style={{ width: 110 }} />
                    <Text type="secondary">às</Text>
                    <Input type="time" value={slot.closesAt} onChange={(e) => update(slot.index, { closesAt: e.target.value })} style={{ width: 110 }} />
                    <Button size="small" type="text" icon={<DeleteOutlined />} onClick={() => remove(slot.index)} />
                  </Space>
                ))}
                <Button size="small" icon={<PlusOutlined />} onClick={() => add(weekday)}>
                  {slots.length ? "Turno" : "Abrir"}
                </Button>
              </Space>
            </Col>
          </Row>
        );
      })}
      <Button type="primary" onClick={save} loading={saving} style={{ marginTop: 8 }}>
        Salvar horário
      </Button>
    </>
  );
}

function ExceptionsEditor({ initialExceptions }) {
  const [exceptions, setExceptions] = useState(initialExceptions);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const closed = Form.useWatch("closed", form);

  const add = async (values) => {
    setSaving(true);
    try {
      const result = await whatsappApi.addException({ ...values, closed: values.closed !== false });
      setExceptions(result.exceptions);
      form.resetFields();
      message.success("Data especial salva.");
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      const result = await whatsappApi.removeException(id);
      setExceptions(result.exceptions);
    } catch (err) {
      message.error(errorMessage(err));
    }
  };

  return (
    <>
      <Form form={form} layout="inline" onFinish={add} initialValues={{ closed: true }} style={{ rowGap: 8, marginBottom: 12 }}>
        <Form.Item name="localDate" rules={[{ required: true, message: "Informe a data" }]}>
          <Input type="date" />
        </Form.Item>
        <Form.Item name="description">
          <Input placeholder="Motivo (ex.: Feriado)" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="closed" valuePropName="checked">
          <Switch checkedChildren="Fechado" unCheckedChildren="Horário especial" />
        </Form.Item>
        {closed === false && (
          <>
            <Form.Item name="opensAt" rules={[{ required: true, message: "Abertura" }]}>
              <Input type="time" style={{ width: 110 }} />
            </Form.Item>
            <Form.Item name="closesAt" rules={[{ required: true, message: "Fechamento" }]}>
              <Input type="time" style={{ width: 110 }} />
            </Form.Item>
          </>
        )}
        <Form.Item>
          <Button htmlType="submit" icon={<PlusOutlined />} loading={saving}>
            Adicionar
          </Button>
        </Form.Item>
      </Form>
      <List
        size="small"
        locale={{ emptyText: "Nenhuma data especial cadastrada." }}
        dataSource={exceptions}
        renderItem={(e) => (
          <List.Item
            actions={[
              <Popconfirm key="del" title="Remover esta data?" onConfirm={() => remove(e.id)} okText="Remover" cancelText="Voltar">
                <Button size="small" type="text" icon={<DeleteOutlined />} />
              </Popconfirm>,
            ]}
          >
            <Space>
              <Text strong>{moment(e.localDate).format("DD/MM/YYYY")}</Text>
              {e.closed ? <Tag color="red">Fechado</Tag> : <Tag color="blue">{`${e.opensAt} às ${e.closesAt}`}</Tag>}
              {e.description && <Text type="secondary">{e.description}</Text>}
            </Space>
          </List.Item>
        )}
      />
    </>
  );
}

function WhatsAppConfiguracao() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    whatsappApi
      .getSettings()
      .then(setSettings)
      .catch((err) => message.error(errorMessage(err, "Não foi possível carregar a configuração.")));
  }, []);

  const save = async (values) => {
    setSaving(true);
    try {
      setSettings(await whatsappApi.updateSettings(values));
      message.success("Configuração salva. Vale para as próximas mensagens.");
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <Spin />;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={13}>
        <Card title="Assistente">
          <Form
            form={form}
            layout="vertical"
            onFinish={save}
            initialValues={{
              botName: settings.botName,
              instructions: settings.instructions,
              humanTakeoverMinutes: settings.humanTakeoverMinutes,
              productCardsEnabled: settings.productCardsEnabled,
              autoProductImages: settings.autoProductImages,
            }}
          >
            <Form.Item
              name="botName"
              label="Nome do assistente"
              extra="É como ele se apresenta para o cliente."
              rules={[{ required: true, message: "Dê um nome ao assistente" }]}
            >
              <Input maxLength={60} placeholder="Ex.: Fofinha" />
            </Form.Item>
            <Form.Item
              name="instructions"
              label="Instruções gerais"
              extra="Informações da loja que o assistente deve seguir: preços de serviços, prazos, formas de pagamento, o que vocês não fazem etc. Ele não muda as regras de pedido por causa deste texto."
            >
              <Input.TextArea rows={10} maxLength={4000} showCount placeholder={INSTRUCTIONS_PLACEHOLDER} />
            </Form.Item>
            <Form.Item
              name="humanTakeoverMinutes"
              label="Pausa quando um atendente responde (minutos)"
              extra="Se alguém da loja responder pelo celular, o assistente fica em silêncio nessa conversa por este tempo."
            >
              <InputNumber min={5} max={1440} />
            </Form.Item>
            <Divider />
            <Form.Item name="productCardsEnabled" valuePropName="checked" style={{ marginBottom: 4 }}>
              <Switch />
            </Form.Item>
            <Paragraph>
              <Text strong>Enviar card de produto</Text>
              <br />
              <Text type="secondary">Ao responder sobre um produto, envia a foto com nome e preço.</Text>
            </Paragraph>
            <Form.Item name="autoProductImages" valuePropName="checked" style={{ marginBottom: 4 }}>
              <Switch />
            </Form.Item>
            <Paragraph>
              <Text strong>Buscar foto na internet para produtos sem foto</Text>
              <br />
              <Text type="secondary">
                Procura uma foto pelo nome, EAN e NCM, confere se é o produto certo e salva no cadastro do produto.
              </Text>
            </Paragraph>
            <Button type="primary" htmlType="submit" loading={saving}>
              Salvar
            </Button>
          </Form>
        </Card>
      </Col>
      <Col xs={24} xl={11}>
        <Card title="Horário de funcionamento" style={{ marginBottom: 16 }}>
          <Paragraph type="secondary">
            O assistente atende a qualquer hora. Fora do horário ele registra o pedido e avisa o cliente quando a loja vai
            começar a prepará-lo. Fuso: {settings.timezone}.
          </Paragraph>
          <HoursEditor initialWeekly={settings.weekly} />
        </Card>
        <Card title="Feriados e datas especiais">
          <ExceptionsEditor initialExceptions={settings.exceptions} />
        </Card>
      </Col>
    </Row>
  );
}

export default WhatsAppConfiguracao;
