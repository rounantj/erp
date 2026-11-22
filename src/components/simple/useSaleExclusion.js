import React, { useContext, useState } from "react";
import { Button, Input, Modal, Typography, notification } from "antd";
import { CheckOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { UserContext } from "context/UserContext";
import { aprovaExclusaoVenda, rejeitaExclusaoVenda, solicitaExclusaoVenda } from "helpers/api-integrator";
import { money, paymentLabel, saleTotal, saleWhen } from "./sales";

const { Text } = Typography;

const REASONS = ["Lancei a venda errada", "Venda repetida", "Cliente desistiu", "Valor ou produto errado"];

const SaleBox = ({ venda }) => (
  <div style={{ background: "#f6f5f4", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <Text strong>Venda nº {venda.id}</Text>
      <Text strong>{money(saleTotal(venda))}</Text>
    </div>
    <Text type="secondary" style={{ fontSize: 13 }}>
      {saleWhen(venda.createdAt)} · {paymentLabel(venda.metodoPagamento)}
      {venda.nome_cliente && venda.nome_cliente !== "Cliente Padrão" ? ` · ${venda.nome_cliente}` : ""}
    </Text>
  </div>
);

/** Pedido, aprovação e recusa de exclusão de venda. O dono exclui direto; funcionário pede aprovação. */
export default function useSaleExclusion(onChanged) {
  const { user } = useContext(UserContext);
  const isAdmin = user?.user?.role === "admin";
  const [mode, setMode] = useState(null);
  const [venda, setVenda] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => {
    setMode(null);
    setReason("");
  };

  const fail = (res, fallback) => {
    if (res?.success) return false;
    notification.error({ message: res?.message || fallback });
    return true;
  };

  const submitRequest = async () => {
    if (reason.trim().length < 5) {
      notification.warning({ message: "Conte em poucas palavras por que a venda deve ser excluída." });
      return;
    }
    setBusy(true);
    try {
      const requested = await solicitaExclusaoVenda(venda.id, reason.trim());
      if (fail(requested, "Não foi possível pedir a exclusão")) return;
      if (isAdmin) {
        const approved = await aprovaExclusaoVenda(venda.id, "Excluída pelo administrador", user.user.id);
        if (fail(approved, "Não foi possível excluir a venda")) return;
        notification.success({ message: "Venda excluída", description: "Os produtos voltaram para o estoque." });
      } else {
        notification.success({ message: "Pedido enviado", description: "O dono da loja vai aprovar ou recusar." });
      }
      close();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  const answer = async (approve) => {
    setBusy(true);
    try {
      const notes = reason.trim() || (approve ? "Aprovado" : "Pedido recusado");
      const res = approve
        ? await aprovaExclusaoVenda(venda.id, notes, user.user.id)
        : await rejeitaExclusaoVenda(venda.id, notes, user.user.id);
      if (fail(res, "Não foi possível responder o pedido")) return;
      notification.success({
        message: approve ? "Venda excluída" : "Pedido recusado",
        description: approve ? "Os produtos voltaram para o estoque." : "A venda continua valendo.",
      });
      close();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  const modals = (
    <>
      <Modal
        open={mode === "request"}
        onCancel={close}
        title={isAdmin ? "Excluir esta venda?" : "Pedir para excluir esta venda"}
        destroyOnClose
        footer={[
          <Button key="no" onClick={close}>
            Voltar
          </Button>,
          <Button key="yes" danger type="primary" icon={<DeleteOutlined />} loading={busy} onClick={submitRequest}>
            {isAdmin ? "Excluir venda" : "Enviar pedido"}
          </Button>,
        ]}
      >
        {venda && <SaleBox venda={venda} />}
        <Text style={{ display: "block", marginBottom: 8 }}>
          {isAdmin
            ? "A venda sai do faturamento e os produtos voltam para o estoque. Por que ela vai ser excluída?"
            : "O dono da loja recebe o pedido e decide. Por que ela deve ser excluída?"}
        </Text>
        <div className="sp-chips" style={{ flexWrap: "wrap", marginBottom: 10 }}>
          {REASONS.map((r) => (
            <button key={r} type="button" className={`sp-chip${reason === r ? " is-active" : ""}`} onClick={() => setReason(r)}>
              {r}
            </button>
          ))}
        </div>
        <Input.TextArea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ou escreva o motivo aqui"
          maxLength={500}
        />
      </Modal>

      <Modal
        open={mode === "review"}
        onCancel={close}
        title="Pedido para excluir venda"
        destroyOnClose
        footer={[
          <Button key="no" icon={<CloseOutlined />} loading={busy} onClick={() => answer(false)}>
            Não excluir
          </Button>,
          <Button key="yes" danger type="primary" icon={<CheckOutlined />} loading={busy} onClick={() => answer(true)}>
            Sim, excluir venda
          </Button>,
        ]}
      >
        {venda && (
          <>
            <SaleBox venda={venda} />
            <div className="sp-note" style={{ marginTop: 0, marginBottom: 14 }}>
              <b>{venda.exclusionRequestedByUser?.name || "Um funcionário"}</b> pediu para excluir
              {venda.exclusionRequestedAt ? ` (${saleWhen(venda.exclusionRequestedAt)})` : ""}:
              <br />“{venda.exclusionReason || "sem motivo informado"}”
            </div>
          </>
        )}
        <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>
          Se quiser, deixe um recado para o funcionário:
        </Text>
        <Input.TextArea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
      </Modal>
    </>
  );

  return {
    isAdmin,
    modals,
    requestExclusion: (v) => {
      setVenda(v);
      setReason("");
      setMode("request");
    },
    reviewExclusion: (v) => {
      setVenda(v);
      setReason("");
      setMode("review");
    },
  };
}
