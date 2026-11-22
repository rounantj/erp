import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Empty, Input, List, Modal, Space, Spin, Typography } from "antd";
import { FileDoneOutlined, PrinterOutlined, SettingOutlined } from "@ant-design/icons";
import { MODELO_LABEL, brl, fiscalApi, fiscalErrorMessage, formatDoc, onlyDigits } from "./fiscal-api";
import { DocumentActions, StatusTag, useFiscalActions } from "./FiscalDocumentsTable";

const { Text } = Typography;

const ACTIVE = ["processando", "autorizada", "contingencia"];

/**
 * Notas de uma venda: mostra as já emitidas e permite emitir.
 * Com `autoEmit`, emite assim que abre (fluxo do caixa).
 */
const FiscalSaleModal = ({ open, vendaId, documento: initialDoc = "", nome: initialName = "", troco = 0, autoEmit = false, onClose }) => {
  const [docs, setDocs] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [ready, setReady] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emitting, setEmitting] = useState(false);
  const [error, setError] = useState(null);
  const [cpfCnpj, setCpfCnpj] = useState(initialDoc);
  const [nome, setNome] = useState(initialName);
  const autoEmitted = useRef(false);

  const actions = useFiscalActions((updated) => setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d))));

  const emit = useCallback(
    async (doc = cpfCnpj, name = nome) => {
      setEmitting(true);
      setError(null);
      try {
        const documento = onlyDigits(doc);
        const result = await fiscalApi.emitForSale(vendaId, {
          destinatario: documento ? { documento, nome: name || null } : null,
          troco,
        });
        setDocs(result.documentos);
        setAvisos(result.avisos || []);
      } catch (err) {
        setError(fiscalErrorMessage(err, "Não foi possível emitir a nota."));
      } finally {
        setEmitting(false);
      }
    },
    [vendaId, cpfCnpj, nome, troco]
  );

  useEffect(() => {
    if (!open || !vendaId) return;
    setCpfCnpj(initialDoc);
    setNome(initialName);
    setAvisos([]);
    setError(null);
    autoEmitted.current = false;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [list, config] = await Promise.all([fiscalApi.saleDocuments(vendaId), fiscalApi.getConfig()]);
        if (cancelled) return;
        setDocs(list);
        setReady(config.ready);
        const hasActive = list.some((d) => ACTIVE.includes(d.status));
        if (autoEmit && !hasActive && !autoEmitted.current) {
          autoEmitted.current = true;
          emit(initialDoc, initialName);
        }
      } catch (err) {
        if (!cancelled) setError(fiscalErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, vendaId]);

  const activeDocs = docs.filter((d) => ACTIVE.includes(d.status));
  const printable = docs.filter((d) => actions.canPrint(d) && d.status !== "cancelada");
  const nothingReady = ready && !ready.nfce && !ready.nfe && !ready.nfse;
  const digitsDoc = onlyDigits(cpfCnpj);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <FileDoneOutlined /> {`Nota fiscal da venda #${vendaId}`}
        </Space>
      }
      width={620}
      footer={
        <Space>
          {printable.length > 0 && (
            <Button type="primary" icon={<PrinterOutlined />} onClick={() => printable.forEach((d) => actions.print(d))}>
              Imprimir {printable.length > 1 ? "notas" : "nota"}
            </Button>
          )}
          <Button onClick={onClose}>Fechar</Button>
        </Space>
      }
    >
      <Spin spinning={loading || emitting} tip={emitting ? "Enviando para a SEFAZ..." : undefined}>
        {nothingReady && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="A emissão de notas ainda não está configurada"
            description="Cadastre o certificado digital e os dados fiscais da empresa para emitir notas."
            action={
              <Button size="small" icon={<SettingOutlined />} href="/admin/setup?tab=fiscal">
                Configurar
              </Button>
            }
          />
        )}
        {error && <Alert type="error" showIcon style={{ marginBottom: 16 }} message={error} />}
        {avisos.map((aviso) => (
          <Alert key={aviso} type="warning" showIcon style={{ marginBottom: 12 }} message={aviso} />
        ))}

        {docs.length > 0 ? (
          <List
            dataSource={docs}
            style={{ marginBottom: 16 }}
            renderItem={(d) => (
              <List.Item actions={[<DocumentActions key="a" documento={d} actions={actions} />]}>
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>
                        {MODELO_LABEL[d.modelo]} nº {d.numero}
                      </Text>
                      <StatusTag documento={d} />
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">
                        {brl(d.valor)}
                        {d.destinatario_documento ? ` · ${formatDoc(d.destinatario_documento)}` : " · consumidor não identificado"}
                        {d.ambiente === "homologacao" ? " · homologação" : ""}
                      </Text>
                      {d.status !== "autorizada" && d.motivo && (
                        <Text type={["rejeitada", "erro"].includes(d.status) ? "danger" : "secondary"} style={{ fontSize: 12 }}>
                          {d.motivo}
                        </Text>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          !loading && !emitting && <Empty description="Nenhuma nota emitida para esta venda" style={{ margin: "8px 0 20px" }} />
        )}

        {!nothingReady && activeDocs.length === 0 && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text strong>CPF ou CNPJ do cliente (opcional)</Text>
            <Space.Compact style={{ width: "100%" }}>
              <Input
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder="Deixe vazio para consumidor não identificado"
                style={{ width: "45%" }}
              />
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome (opcional)" style={{ width: "55%" }} />
            </Space.Compact>
            {digitsDoc.length === 14 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Venda para empresa: os produtos saem em NF-e, com o endereço buscado na Receita Federal.
              </Text>
            )}
            <Button type="primary" block size="large" icon={<FileDoneOutlined />} loading={emitting} onClick={() => emit()}>
              {docs.length ? "Emitir de novo" : "Emitir nota fiscal"}
            </Button>
          </Space>
        )}
      </Spin>
    </Modal>
  );
};

export default FiscalSaleModal;
