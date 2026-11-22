import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { formatDoc, onlyDigits } from "./fiscal-api";

const WIDTH = 80;
const MARGIN = 4;
const CONTENT = WIDTH - MARGIN * 2;
const LINE = 3.4;

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateTime = (value) => (value ? new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "");
const groupKey = (chave) => String(chave || "").replace(/(\d{4})(?=\d)/g, "$1 ");

const PAGAMENTO_LABEL = {
  "01": "Dinheiro",
  "03": "Cartão de Crédito",
  "04": "Cartão de Débito",
  "05": "Crédito Loja",
  "15": "Boleto",
  "17": "PIX",
  "20": "PIX",
  "99": "Outros",
};

// O jsPDF grava as coordenadas a partir da base da página, então a altura não pode mudar depois de desenhar:
// uma passada mede o conteúdo e a segunda desenha numa página do tamanho da bobina.
async function renderReceipt(draw) {
  const measure = createWriter(600);
  await draw(measure);
  const writer = createWriter(Math.max(measure.y + 8, 80));
  await draw(writer);
  return writer.doc;
}

function createWriter(height) {
  const doc = new jsPDF({ unit: "mm", format: [WIDTH, height] });
  doc.setFont("helvetica", "normal");
  let y = 6;

  const wrap = (text, size) => {
    doc.setFontSize(size);
    return doc.splitTextToSize(String(text ?? ""), CONTENT);
  };

  const writer = {
    doc,
    get y() {
      return y;
    },
    set y(value) {
      y = value;
    },
    center(text, { size = 7.5, bold = false } = {}) {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      for (const line of wrap(text, size)) {
        doc.text(line, WIDTH / 2, y, { align: "center" });
        y += LINE * (size / 7.5);
      }
    },
    left(text, { size = 7, bold = false } = {}) {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      for (const line of wrap(text, size)) {
        doc.text(line, MARGIN, y);
        y += LINE * (size / 7.5);
      }
    },
    pair(label, value, { size = 7.5, bold = false } = {}) {
      doc.setFontSize(size);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.text(String(label), MARGIN, y);
      doc.text(String(value), WIDTH - MARGIN, y, { align: "right" });
      y += LINE * (size / 7.5);
    },
    rule() {
      y += 0.8;
      doc.setLineDashPattern([0.8, 0.6], 0);
      doc.setLineWidth(0.15);
      doc.line(MARGIN, y, WIDTH - MARGIN, y);
      doc.setLineDashPattern([], 0);
      y += 3;
    },
    space(mm = 1.5) {
      y += mm;
    },
    async qr(content, size = 34) {
      const dataUrl = await QRCode.toDataURL(content, { errorCorrectionLevel: "M", margin: 0, width: 400 });
      doc.addImage(dataUrl, "PNG", (WIDTH - size) / 2, y, size, size);
      y += size + 3;
    },
  };
  return writer;
}

function header(w, emitente) {
  w.center(emitente?.nomeFantasia || emitente?.razaoSocial || "", { size: 9, bold: true });
  if (emitente?.nomeFantasia && emitente?.razaoSocial) w.center(emitente.razaoSocial, { size: 7 });
  w.center(`CNPJ: ${formatDoc(emitente?.cnpj)}${emitente?.inscricaoEstadual ? `  IE: ${emitente.inscricaoEstadual}` : ""}`, { size: 7 });
  const endereco = [emitente?.logradouro, emitente?.numero, emitente?.bairro, emitente?.municipio, emitente?.uf].filter(Boolean).join(", ");
  if (endereco) w.center(endereco, { size: 7 });
}

function stamps(w, documento) {
  if (documento.ambiente === "homologacao") {
    w.center("EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL", { size: 7.5, bold: true });
  }
  if (documento.status === "cancelada") w.center("*** DOCUMENTO CANCELADO ***", { size: 9, bold: true });
}

export async function danfeNfce(documento) {
  return renderReceipt((w) => drawNfce(w, documento));
}

async function drawNfce(w, documento) {
  const p = documento.payload || {};
  header(w, p.emitente);
  w.rule();
  w.center("DANFE NFC-e - Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica", { size: 7, bold: true });
  stamps(w, documento);
  if (Number(documento.tp_emis) === 9) w.center("EMITIDA EM CONTINGÊNCIA", { size: 8, bold: true });
  w.rule();

  w.left("Código  Descrição  Qtde  UN  Vl Unit  Vl Total", { size: 6.5, bold: true });
  (p.itens || []).forEach((item) => {
    w.left(`${item.codigo} ${item.descricao}`, { size: 6.8 });
    w.pair(
      `   ${Number(item.quantidade).toLocaleString("pt-BR")} ${String(item.unidade || "UN").toUpperCase()} x ${money(item.valorUnitario)}`,
      money(item.valorBruto),
      { size: 6.8 }
    );
  });
  w.rule();

  const totals = p.totals || {};
  w.pair("Qtde. total de itens", String((p.itens || []).length));
  w.pair("Valor total R$", money(totals.vProd ?? documento.valor));
  if (Number(totals.vDesc) > 0) w.pair("Desconto R$", money(totals.vDesc));
  w.pair("Valor a pagar R$", money(totals.vNF ?? documento.valor), { bold: true, size: 8.5 });
  w.space(1);
  w.pair("FORMA DE PAGAMENTO", "VALOR PAGO R$", { size: 6.8, bold: true });
  (p.pagamentos || []).forEach((pag) => w.pair(PAGAMENTO_LABEL[pag.tipo] || "Outros", money(pag.valor), { size: 7 }));
  if (Number(p.troco) > 0) w.pair("Troco R$", money(p.troco), { size: 7 });
  w.rule();

  w.center("Consulte pela Chave de Acesso em", { size: 7, bold: true });
  w.center(p.urlChave || "", { size: 7 });
  w.center(groupKey(documento.chave), { size: 7.2 });
  w.rule();

  const destDoc = onlyDigits(documento.destinatario_documento);
  if (destDoc) {
    w.center(`CONSUMIDOR - ${destDoc.length === 14 ? "CNPJ" : "CPF"} ${formatDoc(destDoc)}`, { size: 7.2, bold: true });
    if (documento.destinatario_nome) w.center(documento.destinatario_nome, { size: 7 });
  } else {
    w.center("CONSUMIDOR NÃO IDENTIFICADO", { size: 7.2, bold: true });
  }
  w.space(1);
  w.center(
    `NFC-e nº ${String(documento.numero).padStart(9, "0")}  Série ${String(documento.serie).padStart(3, "0")}  ${dateTime(p.dhEmi || documento.emitted_at)}`,
    { size: 7.2, bold: true }
  );
  if (documento.protocolo) {
    w.center(`Protocolo de autorização: ${documento.protocolo}`, { size: 7 });
    w.center(`Data de autorização: ${dateTime(documento.authorized_at)}`, { size: 7 });
  } else if (Number(documento.tp_emis) === 9) {
    w.center("Pendente de autorização", { size: 7 });
  }
  w.space(1);
  if (documento.qrcode_url) await w.qr(documento.qrcode_url);
  w.center("Documento emitido por Microempreendedor Individual - MEI", { size: 6.5 });
}

export async function danfse(documento) {
  return renderReceipt((w) => drawNfse(w, documento));
}

async function drawNfse(w, documento) {
  const p = documento.payload || {};
  header(w, p.emitente);
  w.rule();
  w.center("DANFSe - Documento Auxiliar da NFS-e", { size: 8, bold: true });
  stamps(w, documento);
  w.rule();
  w.pair("Número / Série", `${documento.numero} / ${documento.serie}`);
  w.pair("Emissão", dateTime(p.dhEmi || documento.emitted_at));
  if (documento.authorized_at) w.pair("Autorização", dateTime(documento.authorized_at));
  w.rule();

  w.left("TOMADOR", { size: 7, bold: true });
  if (documento.destinatario_documento) {
    w.left(`${formatDoc(documento.destinatario_documento)} ${documento.destinatario_nome || ""}`, { size: 7 });
  } else {
    w.left("Não identificado", { size: 7 });
  }
  w.rule();
  w.left("DISCRIMINAÇÃO DO SERVIÇO", { size: 7, bold: true });
  w.left(p.descricao || "", { size: 7 });
  w.rule();
  w.pair("Valor do serviço R$", money(documento.valor), { bold: true, size: 8.5 });
  w.left("ISS: recolhido no DAS-MEI", { size: 6.8 });
  w.rule();

  if (documento.chave) {
    w.center("Chave de acesso da NFS-e", { size: 7, bold: true });
    w.center(groupKey(documento.chave), { size: 7 });
    w.space(1);
    const url = `https://www.nfse.gov.br/ConsultaPublica/?tpc=1&chave=${documento.chave}`;
    await w.qr(url, 30);
    w.center("Consulte em www.nfse.gov.br/ConsultaPublica", { size: 6.8 });
  }
  w.center("O XML da NFS-e é o documento fiscal válido.", { size: 6.5 });
}

function barcodeDataUrl(value) {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, value, { format: "CODE128C", displayValue: false, margin: 0, height: 60, width: 2 });
  return canvas.toDataURL("image/png");
}

// DANFE retrato da NF-e (modelo 55), com os blocos exigidos para acompanhar a mercadoria.
export async function danfeNfe(documento) {
  const p = documento.payload || {};
  const emit = p.emitente || {};
  const dest = p.destinatario || {};
  const end = dest.endereco || {};
  const totals = p.totals || {};
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const L = 8;
  const R = 202;
  let y = 8;

  const box = (x, top, w, h, label, value, { size = 8, bold = false, align = "left" } = {}) => {
    doc.setLineWidth(0.2);
    doc.rect(x, top, w, h);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text(label.toUpperCase(), x + 1, top + 2.4);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const text = doc.splitTextToSize(String(value ?? ""), w - 2)[0] || "";
    const tx = align === "right" ? x + w - 1 : align === "center" ? x + w / 2 : x + 1;
    doc.text(text, tx, top + h - 1.6, { align });
  };
  const title = (text) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(text, L, y + 3);
    y += 4;
  };

  // Cabeçalho: emitente, quadro DANFE e chave com código de barras.
  doc.rect(L, y, 80, 32);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(emit.razaoSocial || "", 76), L + 40, y + 7, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    doc.splitTextToSize(
      [
        [emit.logradouro, emit.numero, emit.complemento].filter(Boolean).join(", "),
        [emit.bairro, `${emit.municipio || ""} - ${emit.uf || ""}`, `CEP ${emit.cep || ""}`].join(" - "),
        emit.telefone ? `Fone: ${emit.telefone}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      76
    ),
    L + 40,
    y + 17,
    { align: "center" }
  );

  doc.rect(L + 80, y, 34, 32);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("DANFE", L + 97, y + 6, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(["Documento Auxiliar da", "Nota Fiscal Eletrônica", "", "0 - ENTRADA", "1 - SAÍDA      [ 1 ]"], L + 97, y + 10, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text([`Nº ${String(documento.numero).padStart(9, "0")}`, `SÉRIE ${String(documento.serie).padStart(3, "0")}`], L + 97, y + 26, {
    align: "center",
  });

  doc.rect(L + 114, y, R - L - 114, 32);
  doc.addImage(barcodeDataUrl(documento.chave), "PNG", L + 117, y + 2, R - L - 120, 11);
  box(L + 114, y + 14, R - L - 114, 8, "Chave de acesso", groupKey(documento.chave), { size: 7.5, bold: true, align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(["Consulta de autenticidade no portal nacional da NF-e", "www.nfe.fazenda.gov.br/portal ou no site da SEFAZ"], L + 114 + (R - L - 114) / 2, y + 26, {
    align: "center",
  });
  y += 32;

  box(L, y, 110, 8, "Natureza da operação", "VENDA");
  box(L + 110, y, R - L - 110, 8, "Protocolo de autorização de uso", documento.protocolo ? `${documento.protocolo} - ${dateTime(documento.authorized_at)}` : "");
  y += 8;
  box(L, y, 65, 8, "Inscrição estadual", emit.inscricaoEstadual);
  box(L + 65, y, 65, 8, "Inscrição estadual do subst. trib.", "");
  box(L + 130, y, R - L - 130, 8, "CNPJ", formatDoc(emit.cnpj));
  y += 10;

  title("DESTINATÁRIO / REMETENTE");
  box(L, y, 120, 8, "Nome / razão social", documento.destinatario_nome || dest.nome);
  box(L + 120, y, 45, 8, "CNPJ / CPF", formatDoc(documento.destinatario_documento));
  box(L + 165, y, R - L - 165, 8, "Data da emissão", dateTime(p.dhEmi).slice(0, 10));
  y += 8;
  box(L, y, 95, 8, "Endereço", [end.logradouro, end.numero, end.complemento].filter(Boolean).join(", "));
  box(L + 95, y, 45, 8, "Bairro / distrito", end.bairro);
  box(L + 140, y, 25, 8, "CEP", end.cep);
  box(L + 165, y, R - L - 165, 8, "Data da saída", dateTime(p.dhEmi).slice(0, 10));
  y += 8;
  box(L, y, 95, 8, "Município", end.municipio);
  box(L + 95, y, 15, 8, "UF", end.uf);
  box(L + 110, y, 55, 8, "Inscrição estadual", dest.inscricaoEstadual || "");
  box(L + 165, y, R - L - 165, 8, "Hora da saída", dateTime(p.dhEmi).slice(12));
  y += 10;

  title("CÁLCULO DO IMPOSTO");
  const tw = (R - L) / 6;
  [
    ["Base de cálc. do ICMS", "0,00"],
    ["Valor do ICMS", "0,00"],
    ["Base de cálc. ICMS ST", "0,00"],
    ["Valor do ICMS ST", "0,00"],
    ["Valor total dos produtos", money(totals.vProd)],
    ["Desconto", money(totals.vDesc)],
  ].forEach(([label, value], i) => box(L + tw * i, y, tw, 8, label, value, { align: "right" }));
  y += 8;
  [
    ["Valor do frete", "0,00"],
    ["Valor do seguro", "0,00"],
    ["Outras despesas", "0,00"],
    ["Valor total do IPI", "0,00"],
    ["", ""],
    ["Valor total da nota", money(totals.vNF ?? documento.valor)],
  ].forEach(([label, value], i) => box(L + tw * i, y, tw, 8, label, value, { align: "right", bold: i === 5 }));
  y += 10;

  title("TRANSPORTADOR / VOLUMES TRANSPORTADOS");
  box(L, y, 120, 8, "Razão social", "");
  box(L + 120, y, R - L - 120, 8, "Frete por conta", "9 - Sem ocorrência de transporte");
  y += 10;

  title("DADOS DOS PRODUTOS / SERVIÇOS");
  const cols = [
    ["Código", 16],
    ["Descrição do produto / serviço", 62],
    ["NCM/SH", 16],
    ["CSOSN", 10],
    ["CFOP", 10],
    ["UN", 9],
    ["Qtd", 14],
    ["Vl. unit", 18],
    ["Vl. desc", 16],
    ["Vl. total", 23],
  ];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  let x = L;
  cols.forEach(([label, w]) => {
    doc.rect(x, y, w, 5);
    doc.text(label, x + 1, y + 3.5);
    x += w;
  });
  y += 5;
  doc.setFont("helvetica", "normal");
  const cfop = end.uf && end.uf !== emit.uf ? "6102" : "5102";
  (p.itens || []).forEach((item) => {
    const values = [
      item.codigo,
      item.descricao,
      item.ncm,
      "102",
      cfop,
      String(item.unidade || "UN").toUpperCase().slice(0, 6),
      Number(item.quantidade).toLocaleString("pt-BR"),
      money(item.valorUnitario),
      money(item.desconto),
      money(item.valorBruto - item.desconto),
    ];
    const lines = doc.splitTextToSize(String(item.descricao), 60);
    const h = Math.max(5, lines.length * 3 + 2);
    if (y + h > 270) {
      doc.addPage();
      y = 10;
    }
    x = L;
    cols.forEach(([, w], i) => {
      doc.rect(x, y, w, h);
      doc.setFontSize(6.3);
      if (i === 1) doc.text(lines, x + 1, y + 3.3);
      else doc.text(String(values[i] ?? ""), i >= 6 ? x + w - 1 : x + 1, y + 3.3, { align: i >= 6 ? "right" : "left" });
      x += w;
    });
    y += h;
  });
  y += 3;

  title("DADOS ADICIONAIS");
  doc.rect(L, y, R - L, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const adicionais = [
    "DOCUMENTO EMITIDO POR MICROEMPREENDEDOR INDIVIDUAL - MEI.",
    documento.ambiente === "homologacao" ? "EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL." : "",
    documento.status === "cancelada" ? "NOTA FISCAL CANCELADA." : "",
  ]
    .filter(Boolean)
    .join("\n");
  doc.text(doc.splitTextToSize(adicionais, R - L - 4), L + 2, y + 4);
  return doc;
}

export async function printFiscalDocument(documento) {
  const pdf =
    documento.modelo === "nfse" ? await danfse(documento) : documento.modelo === "nfe" ? await danfeNfe(documento) : await danfeNfce(documento);
  pdf.autoPrint();
  const url = pdf.output("bloburl");
  const win = window.open(url, "_blank");
  if (!win) pdf.save(`${documento.modelo}-${documento.numero}.pdf`);
}
