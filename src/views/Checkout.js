import { getProducts } from "helpers/api-integrator";
import React, { useState, useEffect, useContext } from "react";
import {
  Layout,
  Button,
  Table,
  Input,
  Select,
  List,
  notification,
  Modal,
  Card,
  Typography,
  Statistic,
  Row,
  Col,
  Divider,
} from "antd";
import {
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import { openCaixa } from "helpers/caixa.adapter";
import { UserContext } from "context/UserContext";
import { getCaixaEmAberto } from "helpers/caixa.adapter";
import { vendaFinaliza } from "helpers/caixa.adapter";
import { getResumoVendas } from "helpers/caixa.adapter";

const { Header, Content, Sider } = Layout;
const { Option } = Select;
const { confirm } = Modal;
const { Text } = Typography;

const Caixa = () => {
  const { user } = useContext(UserContext);
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [caixa, setCaixa] = useState();
  const [busca, setBusca] = useState("");
  const [venda, setVenda] = useState([]);
  const [pagamento, setPagamento] = useState(null);
  const [valorAbertura, setValorAbertura] = useState(0);
  const [horaAbertura, setHoraAbertura] = useState(null);
  const [modalFechamento, setModalFechamento] = useState(false);
  const [valorFechamento, setValorFechamento] = useState(0);
  const [products, setProducts] = useState([]);
  // Novo state para armazenar o histórico de vendas finalizadas
  const [historicoVendas, setHistoricoVendas] = useState([]);
  // State para resumo de vendas por tipo de pagamento
  const [resumoVendas, setResumoVendas] = useState({
    dinheiro: 0,
    pix: 0,
    credito: 0,
    debito: 0,
    total: 0,
  });

  const getResumoCaixa = async (caixaID) => {
    const result = await getResumoVendas(caixaID);
    console.log({ result });
    if (result.data) {
      setResumoVendas(result.data);
    } else {
      notification.error({
        message: "Erro",
        description: "Problema ao buscar resumo de vendas!",
      });
    }
  };

  const money = (valor) =>
    valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  useEffect(() => {
    console.log({ venda });
  }, [venda]);

  useEffect(() => {
    console.log({ historicoVendas });
  }, [historicoVendas]);

  const removeItem = (item) => {
    confirm({
      title: (
        <div>
          <p>
            Deseja realmente remover o item:{" "}
            <strong>{item.descricao.toUpperCase()}</strong>?
          </p>
        </div>
      ),
      icon: <ExclamationCircleOutlined />,
      onOk() {
        setVenda((prev) => prev.filter((p) => p.id !== item.id));
      },
    });
  };

  const gerarCupom = async () => {
    // Verificar se foi selecionado um método de pagamento
    if (!pagamento) {
      notification.error({
        message: "Erro",
        description: "Selecione um método de pagamento!",
      });
      return;
    }

    // Verificar se há produtos na venda
    if (venda.length === 0) {
      notification.error({
        message: "Erro",
        description: "Adicione produtos à venda!",
      });
      return;
    }

    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
    });

    // Estilos e Fontes
    const fontePadrao = "courier";
    const tamanhoFontePadrao = 7;

    // Informações da Empresa (como na imagem)
    const empresa = {
      nome: "FOFA PAPELARIA",
      endereco: "RUA ORLINDO BORGES - BARRA DO SAHY - ARACRUZ - ES",
      cnpj: "CNPJ:63.358.000/0001-49",
      ie: "IE:66994360-NO",
      im: "IM:ISENTO",
      uf: "UF:ES",
    };

    // Informações do Cupom (como na imagem)
    const dataHoraAtual = dayjs().format("DD/MM/YYYY HH:mm:ss");
    const cupom = {
      dataHora: dataHoraAtual,
      ccf: `CCF:${String(historicoVendas.length + 1).padStart(6, "0")}`,
      coo: `COO:${String(historicoVendas.length + 1).padStart(7, "0")}`,
    };

    // Totais e Pagamento (como na imagem)
    const totalVendas = venda.reduce(
      (acc, item) => acc + item.valor * item.qtd,
      0
    );
    const totais = {
      total: `TOTAL R$ ${money(totalVendas)}`,
      dinheiro: `${pagamento.toUpperCase()} - ${money(totalVendas)}`,
    };

    // Função para adicionar texto com formatação e quebra de linha
    const adicionarTexto = (
      texto,
      x,
      y,
      tamanhoFonte = tamanhoFontePadrao,
      alinhamento = "left"
    ) => {
      doc.setFont(fontePadrao, "normal");
      doc.setFontSize(tamanhoFonte);

      const larguraMaxima = 95;
      const linhas = doc.splitTextToSize(texto, larguraMaxima);

      linhas.forEach((linha, index) => {
        doc.text(linha, x, y + index * tamanhoFonte);
      });

      return y + linhas.length * tamanhoFonte;
    };

    let y = 10;

    // Cabeçalho
    y = adicionarTexto(empresa.nome, 10, y);
    y = adicionarTexto(empresa.endereco, 10, y);
    y = adicionarTexto(empresa.cnpj, 10, y);
    y = adicionarTexto(`${empresa.ie} ${empresa.uf}`, 60, y);
    y = adicionarTexto(empresa.im, 10, y);
    y += 8;

    // Informações do Cupom
    y = adicionarTexto(`${cupom.dataHora} ${cupom.ccf} ${cupom.coo}`, 10, y);
    y += 8;

    // Título do Cupom
    y = adicionarTexto("DOCUMENTO NÃO FISCAL", 30, y, 9, "center");
    y += 8;

    // Itens da Venda
    y = adicionarTexto(
      "ITEM CÓDIGO DESCRIÇÃO QTD.UN.VL_UNIT(RS) ST VL_ITEM(RS)",
      10,
      y
    );
    y += 2;

    venda.forEach((item) => {
      const itemTexto = `${item.id} ${item.descricao} ${item.qtd} x ${money(
        item.valor
      )}`;
      y = adicionarTexto(itemTexto, 10, y);
      y += 2;
    });

    // Totais
    y = adicionarTexto(totais.total, 60, y);
    y = adicionarTexto(totais.dinheiro, 60, y);
    y += 8;

    // Rodapé
    y = adicionarTexto("Volte Sempre!!", 45, y);

    doc.autoPrint();
    doc.save("cupom_fiscal_novo.pdf");

    // Adicionar venda ao histórico
    const novaVenda = {
      createdAt: new Date(),
      updatedAt: new Date(),
      caixaId: caixa?.id,
      desconto: 0,
      produtos: venda.map((item) => {
        return {
          id: item.id,
          descricao: item.descricao,
          quantidade: item.qtd,
          desconto: 0,
        };
      }),
      metodoPagamento: pagamento,
      nome_cliente: "Cliente padrão",
      total: totalVendas,
    };
    const result = await vendaFinaliza(novaVenda);
    console.log({ result });
    setHistoricoVendas((prev) => [...prev, novaVenda]);

    // Limpar a venda atual
    setVenda([]);
    setPagamento(null);
    await getResumoCaixa(caixa?.id);
    notification.success({
      message: "Venda finalizada com sucesso!",
      description: `Total: R$ ${money(totalVendas)}`,
    });
  };

  const myColumns = [
    {
      title: "Nome",
      dataIndex: "descricao",
      render: (text) => <Text strong>{text.toUpperCase()}</Text>,
    },
    {
      title: "Preço",
      dataIndex: "valor",
      align: "right",
      render: (valor) => <Text type="erro">R$ {money(valor)}</Text>,
    },
    {
      title: "Quantidade",
      dataIndex: "qtd",
      align: "center",
      render: (_, record) => (
        <Input
          type="number"
          min={1}
          defaultValue={1}
          style={{ width: 70, textAlign: "center" }}
          onChange={(e) => (record.qtd = parseInt(e.target.value) || 1)}
        />
      ),
    },
    {
      title: "Ações",
      align: "center",
      render: (_, record) => (
        <Button
          onClick={() => adicionarProduto(record, record.qtd || 1)}
          type="primary"
        >
          Adicionar
        </Button>
      ),
    },
  ];
  const getProductsList = async () => {
    const result = await getProducts();
    console.log({ result });
    if (result.success) {
      result.data.forEach((element) => {
        if (!element["categoria"]) element["categoria"] = "";
        if (!element["ean"]) element["ean"] = "";
        if (!element["ncm"]) element["ncm"] = "";
        if (!element["valor"]) element["valor"] = 0;
        if (!element["descricao"]) element["descricao"] = "";
      });
      setProducts(result.data);
    } else {
      notification.error({
        message: "Erro",
        description: "Problema ao buscar produtos!",
      });
    }
  };

  const caixaEmAberto = async () => {
    const resultCx = await getCaixaEmAberto();
    console.log({ resultCx });
    if (resultCx.data.length === 0) {
      notification.warning({
        message: "Atenção!",
        description: "Abra um caixa para começar a vender.",
      });
      return; // Não há caixa aberto
    }
    if (resultCx.data.length > 1) {
      notification.warning({
        message: "Atenção!",
        description: "Existe um caixa aberto de um dia anterior.",
      });
    }
    const cx = resultCx.data.pop();
    setCaixa(cx);
    setCaixaAberto(true);

    setHoraAbertura(dayjs(cx.createdAt).format("DD/MM/YYYY HH:mm"));
    setValorAbertura(cx.saldoInicial);
    await getResumoCaixa(cx.id);
  };

  useEffect(() => {
    getProductsList();
    caixaEmAberto();
  }, []);

  useEffect(() => {
    console.log({ caixa });
  }, [caixa]);

  const abrirCaixa = async () => {
    let valorAberturaTemp = 0;

    Modal.confirm({
      title: "Abrir Caixa",
      content: (
        <Input
          type="number"
          placeholder="Valor inicial em caixa"
          onChange={(e) =>
            (valorAberturaTemp = parseFloat(e.target.value) || 0)
          }
        />
      ),
      onOk: async () => {
        try {
          const userId = user?.user?.id || 1;
          const resultOpenCaixa = await openCaixa(userId, valorAberturaTemp);

          console.log({ resultOpenCaixa });
          setCaixa(resultOpenCaixa.data);
          setCaixaAberto(true);
          setHoraAbertura(dayjs().format("DD/MM/YYYY HH:mm"));

          // Reiniciar os dados do caixa
          setHistoricoVendas([]);
          setResumoVendas({
            dinheiro: 0,
            pix: 0,
            credito: 0,
            debito: 0,
            total: 0,
          });

          notification.success({ message: "Caixa aberto com sucesso!" });
        } catch (error) {
          console.error("Erro ao abrir caixa:", error);
          notification.error({
            message: "Erro ao abrir caixa",
            description: error.message || "Tente novamente mais tarde.",
          });
        }
      },
    });
  };

  const fecharCaixa = () => {
    setModalFechamento(true);
  };

  const confirmarFechamento = () => {
    // Calcular apenas o valor total em dinheiro para comparar com o valor em caixa
    // Isso supõe que apenas o dinheiro é guardado na caixa física
    const totalDinheiro = resumoVendas.dinheiro;
    const diferenca = valorFechamento - (valorAbertura + totalDinheiro);

    setCaixaAberto(false);
    setVenda([]);
    setPagamento(null);
    setModalFechamento(false);

    notification.success({
      message: "Caixa fechado com sucesso!",
      description: `Diferença: R$ ${money(diferenca)}`,
    });
  };

  const adicionarProduto = (produto, qtd) => {
    console.log({ produto });
    setVenda((prev) => {
      const index = prev.findIndex((item) => item.id === produto.id);
      if (index >= 0) {
        prev[index].qtd += qtd;
      } else {
        prev.push({ ...produto, qtd });
      }
      return [...prev];
    });
  };

  const totalVenda = venda.reduce(
    (acc, item) => acc + item.valor * item.qtd,
    0
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ color: "white", textAlign: "center", fontSize: 20 }}>
        {caixaAberto ? (
          <>
            <CheckCircleOutlined style={{ color: "green", marginRight: 10 }} />
            Caixa {caixa?.id}:{" "}
            <span style={{ fontWeight: "8px !important" }}>
              {horaAbertura && ` Aberto em ${horaAbertura}`}
            </span>
          </>
        ) : (
          <>
            <ExclamationCircleOutlined
              style={{ color: "red", marginRight: 10 }}
            />
            Abra o caixa!
          </>
        )}
      </Header>
      <Layout>
        <Content style={{ padding: 20 }}>
          {!caixaAberto ? (
            <Button type="primary" onClick={abrirCaixa}>
              Abrir Caixa
            </Button>
          ) : (
            <Button type="danger" onClick={fecharCaixa}>
              Fechar Caixa
            </Button>
          )}
          {caixaAberto && (
            <>
              <Input
                placeholder="Buscar produto..."
                style={{ margin: "20px 0" }}
                onChange={(e) => setBusca(e.target?.value?.toLowerCase())}
              />

              <Table
                dataSource={products.filter((p) =>
                  p.descricao?.toLowerCase().includes(busca)
                )}
                columns={myColumns}
              />

              {/* Resumo de vendas realizadas */}
              {historicoVendas.length > 0 && (
                <Card title="Resumo de Vendas do Dia" style={{ marginTop: 20 }}>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic
                        title="Total em Dinheiro"
                        value={resumoVendas.dinheiro}
                        precision={2}
                        valueStyle={{ color: "#3f8600" }}
                        prefix="R$"
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Total em PIX"
                        value={resumoVendas.pix}
                        precision={2}
                        valueStyle={{ color: "#1890ff" }}
                        prefix="R$"
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Total em Crédito"
                        value={resumoVendas.credito}
                        precision={2}
                        valueStyle={{ color: "#722ed1" }}
                        prefix="R$"
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Total em Débito"
                        value={resumoVendas.debito}
                        precision={2}
                        valueStyle={{ color: "#fa8c16" }}
                        prefix="R$"
                      />
                    </Col>
                  </Row>
                  <Divider />
                  <Row>
                    <Col span={24}>
                      <Statistic
                        title="Total Geral"
                        value={resumoVendas.total}
                        precision={2}
                        valueStyle={{ color: "#cf1322", fontSize: "24px" }}
                        prefix="R$"
                      />
                    </Col>
                  </Row>
                </Card>
              )}
            </>
          )}
        </Content>

        <Sider width={450} style={{ background: "#fff", padding: 20 }}>
          <Card
            style={{
              background: "#FFF8DC",
              padding: "20px",
              borderRadius: "8px",
              zoom: "80%",
            }}
            title="Cupom Não Fiscal"
            bordered
          >
            <List
              style={{ marginBottom: "20px" }}
              dataSource={venda}
              renderItem={(item) => (
                <List.Item
                  style={{
                    borderBottom: "1px dotted #000",
                    paddingBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <div>
                      <CloseCircleOutlined
                        onClick={() => removeItem(item)}
                        style={{ color: "red" }}
                      />{" "}
                      <strong>{item.descricao.toUpperCase()}</strong>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong>Qtd: {item.qtd}</strong> |{" "}
                      <strong>
                        R${" "}
                        {item.valor.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </strong>{" "}
                      x <strong>{item.qtd}</strong> <br />={" "}
                      <strong>
                        R${" "}
                        {(item.valor * item.qtd).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </strong>
                    </div>
                  </div>
                </List.Item>
              )}
            />

            <div
              style={{ borderTop: "2px solid #000", margin: "10px 0" }}
            ></div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <h3>
                <strong>Total:</strong>{" "}
                <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                  R${" "}
                  {totalVenda.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </h3>
            </div>
          </Card>
          <Select
            style={{ width: "100%", margin: "10px 0" }}
            showSearch
            placeholder="Selecione o método de pagamento"
            onChange={(value) => setPagamento(value)}
            value={pagamento}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={[
              { value: "dinheiro", label: "DINHEIRO" },
              { value: "pix", label: "PIX" },
              { value: "credito", label: "CRÉDITO" },
              { value: "debito", label: "DÉBITO" },
            ]}
          />

          <Button
            onClick={gerarCupom}
            type="primary"
            block
            disabled={!pagamento || venda.length === 0}
          >
            Finalizar Venda
          </Button>
        </Sider>
      </Layout>

      <Modal
        title="Fechar Caixa"
        visible={modalFechamento}
        onOk={confirmarFechamento}
        onCancel={() => setModalFechamento(false)}
        width={700}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Card title="Resumo de Vendas">
              <Statistic
                title="Total em Dinheiro"
                value={resumoVendas.dinheiro}
                precision={2}
                prefix="R$"
                style={{ marginBottom: 10 }}
              />
              <Statistic
                title="Total em PIX"
                value={resumoVendas.pix}
                precision={2}
                prefix="R$"
                style={{ marginBottom: 10 }}
              />
              <Statistic
                title="Total em Crédito"
                value={resumoVendas.credito}
                precision={2}
                prefix="R$"
                style={{ marginBottom: 10 }}
              />
              <Statistic
                title="Total em Débito"
                value={resumoVendas.debito}
                precision={2}
                prefix="R$"
                style={{ marginBottom: 10 }}
              />
              <Divider />
              <Statistic
                title="Total Geral"
                value={resumoVendas.total}
                precision={2}
                prefix="R$"
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Conferência de Caixa (apenas dinheiro)">
              <Statistic
                title="Valor inicial do caixa"
                value={valorAbertura}
                precision={2}
                prefix="R$"
                style={{ marginBottom: 10 }}
              />
              <Statistic
                title="Vendas em dinheiro"
                value={resumoVendas.dinheiro}
                precision={2}
                prefix="R$"
                style={{ marginBottom: 10 }}
              />
              <Statistic
                title="Total esperado em caixa"
                value={valorAbertura + resumoVendas.dinheiro}
                precision={2}
                prefix="R$"
                style={{ marginBottom: 20 }}
              />

              <Input
                type="number"
                addonBefore="R$"
                placeholder="Valor real em caixa"
                style={{ marginBottom: 20 }}
                onChange={(e) =>
                  setValorFechamento(parseFloat(e.target.value) || 0)
                }
              />

              <Statistic
                title="Diferença"
                value={
                  valorFechamento - (valorAbertura + resumoVendas.dinheiro)
                }
                precision={2}
                prefix="R$"
                valueStyle={{
                  color:
                    valorFechamento - (valorAbertura + resumoVendas.dinheiro) <
                    0
                      ? "#cf1322"
                      : "#3f8600",
                }}
                suffix={
                  valorFechamento - (valorAbertura + resumoVendas.dinheiro) < 0
                    ? " (falta)"
                    : valorFechamento -
                        (valorAbertura + resumoVendas.dinheiro) >
                      0
                    ? " (sobra)"
                    : " (correto)"
                }
              />
            </Card>
          </Col>
        </Row>
      </Modal>
    </Layout>
  );
};

export default Caixa;
