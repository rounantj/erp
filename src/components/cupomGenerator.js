import React from "react";
import { notification, Modal, Result, Button } from "antd";
import {
  PrinterOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import jsPDF from "jspdf";
import dayjs from "dayjs";

const CupomGenerator = ({
  saleData,
  onSuccess,
  showPreview = true,
  autoDownload = false,
}) => {
  // Função auxiliar para formatação de dinheiro
  const money = (valor) =>
    valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  // Configurações da empresa (você pode externalizar isso como props)
  const empresaConfig = {
    nome: "FOFA PAPELARIA",
    endereco: "RUA ORLINDO BORGES - BARRA DO SAHY",
    cidade: "ARACRUZ - ES",
    cnpj: "CNPJ: 54.007.957/0001-99",
    ie: "IE: 084231440",
    im: "IM: ISENTO",
    uf: "UF: ES",
  };

  const gerarCupom = async () => {
    if (!saleData) {
      notification.error({
        message: "Erro",
        description: "Dados da venda não encontrados!",
      });
      return null;
    }

    try {
      // Configuração do PDF
      const doc = new jsPDF({
        unit: "mm",
        format: [80, 300], // Formato de cupom fiscal
      });

      const fontePadrao = "courier";
      doc.setFont(fontePadrao, "normal");

      // Configurações de layout
      const leftMargin = 5;
      const width = 70;
      const lineHeight = 3.5;

      // Dados do cupom
      const dataHoraVenda = dayjs(saleData.createdAt).format(
        "DD/MM/YYYY HH:mm:ss"
      );
      const cupomInfo = {
        dataHora: dataHoraVenda,
        ccf: `CCF: ${String(saleData.id).padStart(6, "0")}`,
        coo: `COO: ${String(saleData.id).padStart(7, "0")}`,
      };

      // Funções auxiliares para formatação do PDF
      const centerText = (text, y, fontSize = 8) => {
        doc.setFontSize(fontSize);
        const textWidth =
          (doc.getStringUnitWidth(text) * fontSize) / doc.internal.scaleFactor;
        const x = (width - textWidth) / 2 + leftMargin;
        doc.text(text, x, y);
        return y + lineHeight;
      };

      const addText = (text, y, fontSize = 8, alignment = "left") => {
        doc.setFontSize(fontSize);
        let x = leftMargin;

        if (alignment === "center") {
          const textWidth =
            (doc.getStringUnitWidth(text) * fontSize) /
            doc.internal.scaleFactor;
          x = (width - textWidth) / 2 + leftMargin;
        } else if (alignment === "right") {
          const textWidth =
            (doc.getStringUnitWidth(text) * fontSize) /
            doc.internal.scaleFactor;
          x = width - textWidth + leftMargin;
        }

        doc.text(text, x, y);
        return y + lineHeight;
      };

      const addSeparator = (y, spaceBefore = 5, spaceAfter = 9) => {
        const lineY = y + spaceBefore;
        doc.setDrawColor(0);
        doc.setLineWidth(0.1);

        // Criar linha tracejada (dashed)
        const dashLength = 1;
        const gapLength = 0.5;
        let currentX = leftMargin;
        const endX = width + leftMargin;

        while (currentX < endX) {
          const dashEnd = Math.min(currentX + dashLength, endX);
          doc.line(currentX, lineY, dashEnd, lineY);
          currentX = dashEnd + gapLength;
        }

        return lineY + spaceAfter;
      };

      // Construção do cupom
      let y = 10;

      // Cabeçalho da empresa
      y = centerText(empresaConfig.nome, y, 10);
      y = centerText(empresaConfig.endereco, y);
      y = centerText(empresaConfig.cidade, y);
      y = centerText(empresaConfig.cnpj, y);
      y = centerText(`${empresaConfig.ie} ${empresaConfig.uf}`, y);
      y = centerText(empresaConfig.im, y);
      //y = addSeparator(y);

      // Informações do cupom
      y = addText(`DATA: ${cupomInfo.dataHora}`, y);

      // CNPJ do cliente (se fornecido)
      console.log("Dados da venda para cupom:", saleData);
      console.log("CNPJ do cliente:", saleData.cnpjCliente);

      if (saleData.cnpjCliente && saleData.cnpjCliente.trim()) {
        y = addText(`CPF/CNPJ CLIENTE: ${saleData.cnpjCliente}`, y);
      }

      //y = addSeparator(y);

      // Tipo de documento
      y = centerText("DOCUMENTO NÃO FISCAL", y, 9);
      //y = addSeparator(y);

      // Cabeçalho dos produtos
      doc.setFontSize(7);
      y = addText("ITEM CÓDIGO DESCRIÇÃO", y, 7);
      y = addText("QTD UN.  VL_UNIT(R$)   VL_ITEM(R$)", y, 7);
      //y = addSeparator(y);

      // Lista de produtos
      saleData.produtos.forEach((item, index) => {
        doc.setFontSize(7);

        // Linha do produto
        y = addText(
          `${(index + 1).toString().padStart(3, "0")} ${item.id
            .toString()
            .padStart(6, "0")} ${item.descricao
            .toUpperCase()
            .substring(0, 30)}`,
          y,
          8
        );

        // Linha de quantidade e valores
        const unitValue = money(item.valorUnitario);
        const totalValue = money(item.valorUnitario * item.quantidade);
        const qtdText = `${item.quantidade} UN x ${unitValue}`;
        const itemTotal = `= ${totalValue}`;

        const qtdWidth =
          (doc.getStringUnitWidth(qtdText) * 7) / doc.internal.scaleFactor;
        const totalWidth =
          (doc.getStringUnitWidth(itemTotal) * 7) / doc.internal.scaleFactor;

        doc.text(qtdText, leftMargin, y);
        doc.text(itemTotal, width - totalWidth + leftMargin, y);

        y += lineHeight;
      });

      //y = addSeparator(y);

      // Total da venda
      doc.setFontSize(9);
      y = addText(`TOTAL R$ ${money(saleData.total)}`, y, 10, "right");

      // Informações de pagamento
      if (saleData.metodoPagamento) {
        const pagamentoTexto = saleData.metodoPagamento.toUpperCase();
        y = addText(
          `${pagamentoTexto} - ${money(saleData.total)}`,
          y,
          8,
          "right"
        );
      }

      // Troco (se houver)
      if (saleData.troco && saleData.troco > 0) {
        y = addText(
          `VALOR RECEBIDO - ${money(saleData.valorRecebido || saleData.total)}`,
          y,
          8,
          "right"
        );
        y = addText(`TROCO - ${money(saleData.troco)}`, y, 8, "right");
      }

      //y = addSeparator(y);

      // Observações (se fornecidas)
      if (saleData.observacoes && saleData.observacoes.trim()) {
        y = addSeparator(y, 4, 2);
        y = centerText("OBSERVAÇÕES:", y, 8);
        y = centerText(saleData.observacoes, y, 7);
        y = addSeparator(y, 2, 4);
      }

      // Rodapé
      y = centerText("Volte Sempre!!", y, 9);
      y = centerText("Agradecemos sua preferência", y, 8);
      y = centerText(dayjs().format("DD/MM/YYYY - HH:mm:ss"), y + 2, 7);
      y = addSeparator(y, 4, 5);
      y = centerText("FOFA PAPELARIA", y, 8);
      y = addSeparator(y, 2, 5);

      // Configurar para impressão automática
      doc.autoPrint();

      // Download ou preview
      if (autoDownload) {
        doc.save(`cupom_venda_${saleData.id}.pdf`);
      }

      // Callback de sucesso
      if (onSuccess) {
        onSuccess(doc);
      }

      // Notificação de sucesso
      notification.success({
        message: "Cupom gerado com sucesso!",
        description: `Venda #${saleData.id} - Total: R$ ${money(
          saleData.total
        )}`,
        placement: "bottomRight",
        duration: 3,
      });

      return doc;
    } catch (error) {
      notification.error({
        message: "Erro ao gerar cupom",
        description: error.message || "Tente novamente.",
      });
      return null;
    }
  };

  return {
    gerarCupom,
    gerarEBaixar: () => gerarCupom(true),
    gerarEImprimir: () => gerarCupom(false),
  };
};

// Componente de Modal para Preview do Cupom
export const CupomPreviewModal = ({
  visible,
  onClose,
  title = "Cupom Gerado",
}) => {
  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <PrinterOutlined style={{ marginRight: 8 }} />
          <span>{title}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="ok" type="primary" onClick={onClose}>
          OK
        </Button>,
      ]}
    >
      <Result
        icon={<PrinterOutlined style={{ color: "#1890ff" }} />}
        title="Cupom enviado para impressão"
        subTitle="Se a impressão não começar automaticamente, verifique as configurações da impressora."
      />
    </Modal>
  );
};

// Hook personalizado para usar o gerador de cupom
export const useCupomGenerator = (empresaConfig = null) => {
  const [previewVisible, setPreviewVisible] = React.useState(false);

  const gerarCupomComPreview = React.useCallback((saleData) => {
    const generator = CupomGenerator({
      saleData,
      onSuccess: () => setPreviewVisible(true),
      showPreview: true,
      autoDownload: true,
    });

    return generator.gerarCupom();
  }, []);

  const gerarCupomSemPreview = React.useCallback((saleData) => {
    const generator = CupomGenerator({
      saleData,
      showPreview: false,
      autoDownload: true,
    });

    return generator.gerarCupom();
  }, []);

  return {
    gerarCupomComPreview,
    gerarCupomSemPreview,
    previewVisible,
    setPreviewVisible,
    CupomPreviewModal: () => (
      <CupomPreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
      />
    ),
  };
};

export default CupomGenerator;
