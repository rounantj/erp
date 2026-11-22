import React, { useEffect, useState } from "react";
import { Button, Tag } from "antd";
import { DeleteOutlined, EyeOutlined, FileDoneOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { MODELO_LABEL, STATUS_INFO, fiscalApi } from "views/fiscal/fiscal-api";
import { Icon } from "./SimplePage";
import { money, paymentInfo, paymentLabel, saleTotal, saleWhen } from "./sales";

const PAGE = 20;

export const useSaleNotes = (vendas, refreshKey) => {
  const [notas, setNotas] = useState({});
  useEffect(() => {
    const ids = vendas.map((v) => v.id).filter(Boolean).slice(0, 500);
    if (!ids.length) return setNotas({});
    fiscalApi
      .salesStatus(ids)
      .then((res) => setNotas(res || {}))
      .catch(() => setNotas({}));
  }, [vendas, refreshKey]);
  return notas;
};

const itemCount = (venda) => {
  const produtos = Array.isArray(venda.produtos) ? venda.produtos : [];
  const qtd = produtos.reduce((acc, p) => acc + (Number(p.quantidade ?? p.qtd) || 1), 0);
  return qtd ? `${qtd} ${qtd === 1 ? "item" : "itens"}` : null;
};

export default function SaleList({ vendas, notasPorVenda = {}, onDetails, onNota, exclusion, emptyText }) {
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => setVisible(PAGE), [vendas]);

  if (!vendas.length) {
    return <div className="sp-card" style={{ textAlign: "center", color: "#78716c", padding: 28 }}>{emptyText}</div>;
  }

  return (
    <div className="sp-list">
      {vendas.slice(0, visible).map((venda) => {
        const pay = paymentInfo(venda.metodoPagamento);
        const notas = notasPorVenda[venda.id] || [];
        const pending = venda.exclusionRequested && venda.exclusionStatus === "pending";
        const cliente = venda.nome_cliente && venda.nome_cliente !== "Cliente Padrão" ? venda.nome_cliente : null;

        return (
          <div className="sp-item" key={venda.id}>
            <Icon tone={pay.tone} size={40}>
              {pay.icon}
            </Icon>
            <div className="sp-item-main">
              <div className="sp-item-top">
                <span className="sp-item-title">Venda nº {venda.id}</span>
                <span className="sp-item-value">{money(saleTotal(venda))}</span>
              </div>
              <div className="sp-item-meta">
                <span>{saleWhen(venda.createdAt)}</span>
                <span>{paymentLabel(venda.metodoPagamento)}</span>
                {itemCount(venda) && <span>{itemCount(venda)}</span>}
                {cliente && <span>{cliente}</span>}
                {notas.map((n) => (
                  <Tag key={`${n.modelo}-${n.numero}`} color={STATUS_INFO[n.status]?.color} style={{ marginInlineEnd: 0 }}>
                    {MODELO_LABEL[n.modelo]} nº {n.numero} · {STATUS_INFO[n.status]?.label || n.status}
                  </Tag>
                ))}
              </div>

              {pending && (
                <div className="sp-note">
                  Pedido para excluir esta venda, aguardando o dono decidir
                  {venda.exclusionReason ? `: “${venda.exclusionReason}”` : "."}
                </div>
              )}
              {venda.exclusionStatus === "rejected" && (
                <div className="sp-note is-info">
                  O dono decidiu manter esta venda
                  {venda.exclusionReviewNotes ? `: “${venda.exclusionReviewNotes}”` : "."}
                </div>
              )}

              <div className="sp-item-actions">
                <Button icon={<EyeOutlined />} onClick={() => onDetails(venda)}>
                  Ver venda
                </Button>
                {onNota && (
                  <Button icon={<FileDoneOutlined />} onClick={() => onNota(venda)}>
                    {notas.length ? "Nota fiscal" : "Emitir nota"}
                  </Button>
                )}
                {pending && exclusion.isAdmin && (
                  <Button type="primary" danger icon={<QuestionCircleOutlined />} onClick={() => exclusion.reviewExclusion(venda)}>
                    Responder pedido
                  </Button>
                )}
                {!pending && venda.exclusionStatus !== "approved" && (
                  <Button danger icon={<DeleteOutlined />} onClick={() => exclusion.requestExclusion(venda)}>
                    {exclusion.isAdmin ? "Excluir" : "Pedir exclusão"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {visible < vendas.length && (
        <Button size="large" onClick={() => setVisible((v) => v + PAGE)}>
          Mostrar mais vendas ({vendas.length - visible} restantes)
        </Button>
      )}
    </div>
  );
}
