import React, { useState, useRef, useEffect } from "react";
import {
  Layout,
  Typography,
  Form,
  Input,
  Button,
  Card,
  Divider,
  Row,
  Col,
  Select,
  DatePicker,
  Space,
  message,
  Checkbox,
  Upload,
  Radio,
  Steps,
  Alert,
  Modal,
  notification,
  Tooltip,
  Spin,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  ToolOutlined,
  BookOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  PrinterOutlined,
  DownloadOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import locale from "antd/es/date-picker/locale/pt_BR";
import Paragraph from "antd/es/typography/Paragraph";
import CurriculoAICard from "components/currriculo-ai";
import { SpaceContext } from "antd/es/space";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;
const { RangePicker } = DatePicker;

// Listas de profissões comuns
const PROFISSOES_COMUNS = [
  // Indústria e Construção
  "Mecânico",
  "Soldador",
  "Pedreiro",
  "Ajudante Geral",
  "Auxiliar de Produção",
  "Eletricista",
  "Operador de Máquinas",
  "Carpinteiro",
  "Pintor",
  "Encanador",
  "Serralheiro",
  "Marceneiro",
  "Marmorista",
  "Vidraceiro",
  "Operador de Empilhadeira",
  "Técnico em Manutenção",
  "Montador Industrial",
  "Gesseiro",
  "Azulejista",
  "Torneiro Mecânico",

  // Comércio e Serviços
  "Vendedor",
  "Caixa de Supermercado",
  "Repositor de Mercadorias",
  "Atendente de Loja",
  "Balconista",
  "Gerente de Loja",
  "Estoquista",
  "Consultor de Vendas",
  "Operador de Telemarketing",
  "Recepcionista",
  "Promotor de Vendas",
  "Fiscal de Loja",
  "Atendente de Farmácia",
  "Visual Merchandiser",
  "Vendedor Externo",

  // Alimentação
  "Ajudante de Cozinha",
  "Cozinheiro(a)",
  "Chef de Cozinha",
  "Garçom/Garçonete",
  "Barista",
  "Confeiteiro(a)",
  "Padeiro(a)",
  "Pizzaiolo(a)",
  "Açougueiro(a)",
  "Auxiliar de Confeitaria",
  "Sushiman",
  "Chapeiro",
  "Doceiro(a)",
  "Bartender",

  // Serviços Domésticos e Limpeza
  "Zelador",
  "Auxiliar de Serviços Gerais",
  "Faxineiro(a)",
  "Empregado(a) Doméstico(a)",
  "Diarista",
  "Jardineiro",
  "Babá",
  "Cuidador(a) de Idosos",
  "Governanta",
  "Lavador(a) de Roupas",
  "Passador(a) de Roupas",

  // Transporte e Logística
  "Motorista",
  "Entregador",
  "Motoboy",
  "Motorista de Aplicativo",
  "Motorista de Caminhão",
  "Motorista de Ônibus",
  "Auxiliar de Logística",
  "Conferente de Mercadorias",
  "Despachante",
  "Ajudante de Carga e Descarga",
  "Controlador de Tráfego",

  // Beleza e Estética
  "Cabeleireiro(a)",
  "Manicure/Pedicure",
  "Barbeiro",
  "Esteticista",
  "Maquiador(a)",
  "Massagista",
  "Designer de Sobrancelhas",
  "Depilador(a)",
  "Tatuador(a)",

  // Têxtil
  "Costureiro(a)",
  "Alfaiate",
  "Modelista",
  "Estilista",
  "Cortador de Tecidos",
  "Bordador(a)",
  "Operador de Máquina de Costura Industrial",

  // Saúde
  "Técnico de Enfermagem",
  "Auxiliar de Enfermagem",
  "Enfermeiro(a)",
  "Farmacêutico(a)",
  "Fisioterapeuta",
  "Auxiliar de Dentista",
  "Socorrista",
  "Agente Comunitário de Saúde",
  "Técnico em Radiologia",
  "Médico(a)",

  // Educação
  "Professor(a)",
  "Auxiliar de Classe",
  "Educador(a) Físico(a)",
  "Pedagogo(a)",
  "Bibliotecário(a)",
  "Monitor(a) de Recreação",
  "Instrutor(a) de Cursos Livres",

  // Tecnologia
  "Técnico de Informática",
  "Desenvolvedor(a) de Software",
  "Analista de Sistemas",
  "Designer Gráfico",
  "Técnico de Redes",
  "Suporte Técnico",
  "Web Designer",

  // Segurança
  "Segurança",
  "Vigilante",
  "Porteiro",
  "Bombeiro Civil",
  "Agente de Segurança",

  // Setor Público
  "Servidor Público",
  "Agente Administrativo",
  "Auxiliar Administrativo",
  "Agente de Trânsito",
  "Carteiro",

  // Outros
  "Fotógrafo(a)",
  "Artesão(ã)",
  "Florista",
  "Guia Turístico",
  "Intérprete",
  "Tradutor(a)",
  "Agricultor(a)",
  "Pescador(a)",
  "Veterinário(a)",
  "Apicultor(a)",
  "Astrônomo(a)",
  "Geólogo(a)",
  "Piloto",

  // Profissões Liberais
  "Advogado(a)",
  "Contador(a)",
  "Arquiteto(a)",
  "Engenheiro(a)",
  "Psicólogo(a)",
  "Corretor(a) de Imóveis",
  "Dentista",
  "Jornalista",
  "Economista",

  // Finalização com opção genérica
  "Outro",
];

// Habilidades por categoria
const HABILIDADES_COMUNS = {
  Mecânico: [
    "Manutenção de motores",
    "Troca de óleo",
    "Freios",
    "Suspensão",
    "Elétrica automotiva",
    "Injeção eletrônica",
    "Alinhamento e balanceamento",
    "Diagnóstico de problemas",
  ],
  Soldador: [
    "Solda MIG",
    "Solda TIG",
    "Solda com eletrodo revestido",
    "Interpretação de desenhos técnicos",
    "Corte com plasma",
    "Solda em aço inoxidável",
    "Solda em alumínio",
  ],
  "Ajudante Geral": [
    "Carregamento de materiais",
    "Organização de estoque",
    "Limpeza de ambientes",
    "Manutenção básica",
    "Auxílio em entregas",
    "Montagem de produtos",
  ],
  Pedreiro: [
    "Assentamento de tijolos",
    "Reboco",
    "Construção de alvenaria",
    "Assentamento de pisos",
    "Instalações hidráulicas básicas",
    "Leitura de plantas",
  ],
  "Auxiliar de Produção": [
    "Operação de máquinas",
    "Controle de qualidade",
    "Montagem de peças",
    "Embalagem de produtos",
    "Organização da linha de produção",
    "Etiquetagem",
  ],
  Motorista: [
    "Carteira de Habilitação B",
    "Carteira de Habilitação C",
    "Carteira de Habilitação D",
    "Conhecimento de mecânica básica",
    "Experiência com entregas",
    "Conhecimento das vias da cidade",
  ],
  Eletricista: [
    "Instalações elétricas",
    "Manutenção preventiva",
    "Reparo de equipamentos",
    "Leitura de diagramas elétricos",
    "Instalação de dispositivos",
    "Normas de segurança elétrica",
  ],
  "Ajudante de Cozinha": [
    "Preparação de alimentos",
    "Higienização de utensílios",
    "Organização da cozinha",
    "Cortes de legumes e carnes",
    "Apoio ao cozinheiro",
    "Controle de estoque",
  ],
  "Operador de Máquinas": [
    "Torno mecânico",
    "Fresa",
    "Empilhadeira",
    "Retroescavadeira",
    "Calibração de equipamentos",
    "Manutenção preventiva básica",
  ],
  Outro: [],
};

// Modelos de currículo
const MODELOS_CURRICULO = [
  { key: "simples", nome: "Simples", cor: "#1890ff" },
  { key: "basico", nome: "Básico", cor: "#52c41a" },
  { key: "tradicional", nome: "Tradicional", cor: "#faad14" },
];

// Níveis de escolaridade
const ESCOLARIDADE = [
  "Ensino Fundamental Incompleto",
  "Ensino Fundamental Completo",
  "Ensino Médio Incompleto",
  "Ensino Médio Completo",
  "Curso Técnico",
  "Ensino Superior Incompleto",
  "Ensino Superior Completo",
];

const CriadorCurriculo = () => {
  // Desabilitar interação durante impressão
  useEffect(() => {
    const handleBeforePrint = () => {
      const elements = document.querySelectorAll(
        "button, input, select, textarea"
      );
      elements.forEach((el) => (el.style.display = "none"));

      // Ocultar header, footer e outros elementos que não devem aparecer na impressão
      document
        .querySelectorAll(".ant-layout-header, .ant-layout-footer, .ant-card")
        .forEach((el) => (el.style.display = "none"));
    };

    const handleAfterPrint = () => {
      const elements = document.querySelectorAll(
        "button, input, select, textarea"
      );
      elements.forEach((el) => (el.style.display = ""));

      // Restaurar elementos ocultos
      document
        .querySelectorAll(".ant-layout-header, .ant-layout-footer, .ant-card")
        .forEach((el) => (el.style.display = ""));
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const [form] = Form.useForm();
  const curriculoRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [fotoCandidata, setFotoCandidata] = useState(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [modeloSelecionado, setModeloSelecionado] = useState("simples");
  const [profissaoSelecionada, setProfissaoSelecionada] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);

  // Substitua a função reiniciarCriacao pelo código abaixo
  const reiniciarCriacao = () => {
    setModalVisible(true);
  };

  // Adicione estas funções para manipular o modal
  const handleConfirmReset = () => {
    // Resetar todos os dados
    form.resetFields();
    setExperiencias([{ empresa: "", cargo: "", periodo: "", descricao: "" }]);
    setCursos([{ nome: "", instituicao: "", ano: "" }]);
    setHabilidades([]);
    setFotoCandidata(null);
    setProfissaoSelecionada(null);
    setCurrentStep(0);
    setMostrarPreview(false);

    // Fechar o modal
    setModalVisible(false);
  };

  const handleCancelReset = () => {
    setModalVisible(false);
  };

  const [experiencias, setExperiencias] = useState([
    { empresa: "", cargo: "", periodo: "", descricao: "" },
  ]);
  const [cursos, setCursos] = useState([
    { nome: "", instituicao: "", ano: "" },
  ]);
  const setPersonalData = (field, value) => {
    setDadosCurriculo({ ...dadosCurriculo, [field]: value });
  };
  const [habilidades, setHabilidades] = useState([]);
  const [dadosCurriculo, setDadosCurriculo] = useState({});
  const [carregando, setCarregando] = useState(false);

  // Mudança de profissão selecionada
  const handleProfissaoChange = (value) => {
    setProfissaoSelecionada(value);
    setHabilidades([]);
  };

  useEffect(() => {
    console.log({
      dadosCurriculo,
      txt: JSON.stringify({ ...dadosCurriculo, foto: null }),
    });
  }, [dadosCurriculo]);

  // Adicionar nova experiência
  const adicionarExperiencia = () => {
    setExperiencias([
      ...experiencias,
      { empresa: "", cargo: "", periodo: "", descricao: "" },
    ]);
  };

  // Remover experiência
  const removerExperiencia = (index) => {
    const novasExperiencias = [...experiencias];
    novasExperiencias.splice(index, 1);
    setExperiencias(novasExperiencias);
  };

  // Adicionar novo curso
  const adicionarCurso = () => {
    setCursos([...cursos, { nome: "", instituicao: "", ano: "" }]);
  };

  // Remover curso
  const removerCurso = (index) => {
    const novosCursos = [...cursos];
    novosCursos.splice(index, 1);
    setCursos(novosCursos);
  };

  // Atualizar experiência
  const atualizarExperiencia = (index, campo, valor) => {
    const novasExperiencias = [...experiencias];
    novasExperiencias[index][campo] = valor;
    setExperiencias(novasExperiencias);
  };

  // Atualizar curso
  const atualizarCurso = (index, campo, valor) => {
    const novosCursos = [...cursos];
    novosCursos[index][campo] = valor;
    setCursos(novosCursos);
  };

  // Upload de foto
  const handleFotoChange = (info) => {
    console.log({ info });
    if (info?.file?.originFileObj) {
      // Converter para base64 para armazenar no estado
      getBase64(info.file.originFileObj, (imageUrl) => {
        setFotoCandidata(imageUrl);
      });
      message.success("Foto carregada com sucesso!");
    } else if (info.file.status === "error") {
      message.error("Erro ao carregar a foto.");
    }
  };

  // Converter arquivo para base64
  const getBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(file);
  };

  // Avançar para próxima etapa
  const avancarEtapa = async () => {
    try {
      const values = await form.validateFields();
      setDadosCurriculo({
        ...dadosCurriculo,
        ...values,
      });

      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        // Adicionar outros dados e mostrar preview
        setDadosCurriculo((prevState) => ({
          ...prevState,
          experiencias,
          cursos,
          habilidades,
          foto: fotoCandidata,
        }));
        setMostrarPreview(true);
      }
    } catch (error) {
      // tratamento de erro
    }
  };

  // Voltar para etapa anterior
  const voltarEtapa = () => {
    setCurrentStep(currentStep - 1);
  };

  // Verificar se existem campos obrigatórios vazios na etapa atual
  const verificarCamposVazios = () => {
    const fields = form.getFieldsValue();

    if (currentStep === 0) {
      return (
        !fields.nome ||
        !fields.telefone ||
        !fields.endereco ||
        !fields.profissao
      );
    }

    if (currentStep === 1) {
      return (
        !fields.objetivo ||
        experiencias[0].empresa === "" ||
        experiencias[0].cargo === ""
      );
    }

    if (currentStep === 2) {
      return !fields.escolaridade;
    }

    return false;
  };

  // Gerar alerta de campos faltantes
  const gerarAlertaCamposFaltantes = () => {
    let camposFaltantes = [];

    if (currentStep === 0) {
      const fields = form.getFieldsValue();
      if (!fields.nome) camposFaltantes.push("Nome");
      if (!fields.telefone) camposFaltantes.push("Telefone");
      if (!fields.endereco) camposFaltantes.push("Endereço");
      if (!fields.profissao) camposFaltantes.push("Profissão");
    }

    if (currentStep === 1) {
      const fields = form.getFieldsValue();
      if (!fields.objetivo) camposFaltantes.push("Objetivo");
      if (experiencias[0].empresa === "") camposFaltantes.push("Empresa");
      if (experiencias[0].cargo === "") camposFaltantes.push("Cargo");
    }

    if (currentStep === 2) {
      const fields = form.getFieldsValue();
      if (!fields.escolaridade) camposFaltantes.push("Escolaridade");
    }

    if (camposFaltantes.length > 0) {
      return (
        <Alert
          message="Campos Obrigatórios"
          description={`Preencha os seguintes campos: ${camposFaltantes.join(
            ", "
          )}`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }

    return null;
  };

  // Imprimir currículo
  const imprimirCurriculo = () => {
    if (!curriculoRef.current) {
      message.error("Não foi possível gerar o PDF. Tente novamente.");
      return;
    }

    setCarregando(true);

    const conteudo = curriculoRef.current;

    // Adicionar uma pequena espera para garantir que o conteúdo seja renderizado
    setTimeout(() => {
      html2canvas(conteudo, {
        scale: 2, // Melhor resolução
        useCORS: true,
        logging: false,
        allowTaint: true,
      })
        .then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("p", "mm", "a4");
          const larguraPDF = pdf.internal.pageSize.getWidth();
          const alturaPDF = pdf.internal.pageSize.getHeight();

          pdf.addImage(imgData, "PNG", 0, 0, larguraPDF, alturaPDF);
          pdf.save(
            `curriculo_${
              dadosCurriculo.nome?.replace(/\s+/g, "_") || "sem_nome"
            }.pdf`
          );

          setCarregando(false);
          notification.success({
            message: "Currículo Salvo!",
            description: "O currículo foi salvo com sucesso no formato PDF.",
            icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          });
        })
        .catch((error) => {
          console.error("Erro ao gerar PDF:", error);
          setCarregando(false);
          message.error("Erro ao gerar o PDF. Tente novamente.");
        });
    }, 500);
  };

  // Renderizar o conteúdo de cada etapa
  const renderizarEtapa = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card title="Dados Pessoais" bordered={false}>
            <Form.Item
              name="nome"
              label="Nome Completo"
              rules={[{ required: true, message: "Informe o nome completo" }]}
            >
              <Input
                placeholder="Ex: João da Silva"
                prefix={<UserOutlined />}
                onChange={(e) => setPersonalData("nome", e.target.value)}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="telefone"
                  label="Telefone"
                  rules={[{ required: true, message: "Informe o telefone" }]}
                >
                  <Input
                    placeholder="Ex: (27) 99999-9999"
                    prefix={<PhoneOutlined />}
                    onChange={(e) =>
                      setPersonalData("telefone", e.target.value)
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="email" label="E-mail">
                  <Input
                    placeholder="Ex: joao@email.com"
                    prefix={<MailOutlined />}
                    onChannge={(e) => setPersonalData("email", e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="endereco"
              label="Endereço"
              rules={[{ required: true, message: "Informe o endereço" }]}
            >
              <Input
                placeholder="Ex: Rua das Flores, 123, Bairro - Cidade/UF"
                prefix={<HomeOutlined />}
                onChange={(e) => setPersonalData("endereco", e.target.value)}
              />
            </Form.Item>

            <Form.Item
              name="profissao"
              label="Profissão Principal"
              rules={[{ required: true, message: "Selecione a profissão" }]}
            >
              <Select
                placeholder="Selecione a profissão"
                onChange={handleProfissaoChange}
                showSearch
                optionFilterProp="children"
              >
                {PROFISSOES_COMUNS.map((profissao) => (
                  <Option key={profissao} value={profissao}>
                    {profissao}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="foto" label="Foto (Opcional)">
              <Upload
                name="avatar"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                onChange={handleFotoChange}
                beforeUpload={(file) => {
                  const isJpgOrPng =
                    file.type === "image/jpeg" || file.type === "image/png";
                  if (!isJpgOrPng) {
                    message.error("Você só pode enviar arquivos JPG/PNG!");
                  }
                  const isLt2M = file.size / 1024 / 1024 < 2;
                  if (!isLt2M) {
                    message.error("A imagem deve ser menor que 2MB!");
                  }
                  return isJpgOrPng && isLt2M;
                }}
              >
                {fotoCandidata ? (
                  <img
                    src={fotoCandidata}
                    alt="Foto"
                    style={{ width: "100%" }}
                  />
                ) : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Adicionar Foto</div>
                  </div>
                )}
              </Upload>
              <Text type="secondary">
                Foto 3x4 ou similar, fundo neutro. Máximo 2MB.
              </Text>
            </Form.Item>
          </Card>
        );

      case 1:
        return (
          <Card title="Experiência Profissional" bordered={false}>
            <Form.Item
              name="objetivo"
              label="Objetivo Profissional"
              rules={[
                { required: true, message: "Informe o objetivo profissional" },
              ]}
            >
              <TextArea
                onChange={(e) => setPersonalData("objetivo", e.target.value)}
                rows={3}
                placeholder="Ex: Procuro oportunidade como Mecânico onde possa aplicar minha experiência em manutenção de veículos..."
              />
            </Form.Item>

            <Divider orientation="left">Experiências</Divider>

            {experiencias.map((exp, index) => (
              <div
                key={index}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  border: "1px dashed #d9d9d9",
                  borderRadius: 4,
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Empresa" required={index === 0}>
                      <Input
                        value={exp.empresa}
                        onChange={(e) =>
                          atualizarExperiencia(index, "empresa", e.target.value)
                        }
                        placeholder="Nome da empresa"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Cargo" required={index === 0}>
                      <Input
                        value={exp.cargo}
                        onChange={(e) =>
                          atualizarExperiencia(index, "cargo", e.target.value)
                        }
                        placeholder="Seu cargo"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Período">
                      <Input
                        value={exp.periodo}
                        onChange={(e) =>
                          atualizarExperiencia(index, "periodo", e.target.value)
                        }
                        placeholder="Ex: 2018 - 2021 ou 2018 - Atual"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Descrição das Atividades">
                      <TextArea
                        rows={2}
                        value={exp.descricao}
                        onChange={(e) =>
                          atualizarExperiencia(
                            index,
                            "descricao",
                            e.target.value
                          )
                        }
                        placeholder="Descreva suas principais atividades"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {index > 0 && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removerExperiencia(index)}
                  >
                    Remover
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="dashed"
              onClick={adicionarExperiencia}
              block
              icon={<PlusOutlined />}
            >
              Adicionar Experiência
            </Button>
          </Card>
        );

      case 2:
        return (
          <Card title="Formação e Qualificações" bordered={false}>
            <Form.Item
              name="escolaridade"
              label="Escolaridade"
              rules={[{ required: true, message: "Selecione a escolaridade" }]}
            >
              <Select
                placeholder="Selecione sua escolaridade"
                onChange={(value) => setPersonalData("escolaridade", value)}
              >
                {ESCOLARIDADE.map((nivel) => (
                  <Option key={nivel} value={nivel}>
                    {nivel}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="instituicaoEnsino" label="Instituição de Ensino">
              <Input placeholder="Ex: E.E. Joaquim da Silva" />
            </Form.Item>

            <Form.Item name="anoConclusao" label="Ano de Conclusão">
              <DatePicker
                picker="year"
                locale={locale}
                placeholder="Selecione o ano"
              />
            </Form.Item>

            <Divider orientation="left">Cursos e Certificações</Divider>

            {cursos.map((curso, index) => (
              <div
                key={index}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  border: "1px dashed #d9d9d9",
                  borderRadius: 4,
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Nome do Curso">
                      <Input
                        value={curso.nome}
                        onChange={(e) =>
                          atualizarCurso(index, "nome", e.target.value)
                        }
                        placeholder="Ex: Mecânica Básica"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Instituição">
                      <Input
                        value={curso.instituicao}
                        onChange={(e) =>
                          atualizarCurso(index, "instituicao", e.target.value)
                        }
                        placeholder="Ex: SENAI"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row>
                  <Col span={12}>
                    <Form.Item label="Ano">
                      <Input
                        value={curso.ano}
                        onChange={(e) =>
                          atualizarCurso(index, "ano", e.target.value)
                        }
                        placeholder="Ex: 2020"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removerCurso(index)}
                >
                  Remover
                </Button>
              </div>
            ))}

            <Button
              type="dashed"
              onClick={adicionarCurso}
              block
              icon={<PlusOutlined />}
            >
              Adicionar Curso
            </Button>
          </Card>
        );

      case 3:
        return (
          <Card title="Habilidades e Informações Adicionais" bordered={false}>
            <Form.Item name="habilidades" label="Habilidades e Competências">
              <Select
                mode="multiple"
                placeholder="Selecione ou digite suas habilidades"
                onChange={setHabilidades}
                value={habilidades}
                style={{ width: "100%" }}
                allowClear
                tokenSeparators={[","]}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    {profissaoSelecionada === "Outro" && (
                      <div style={{ padding: "8px", textAlign: "center" }}>
                        <Text type="secondary">
                          Digite suas habilidades e pressione Enter ou vírgula
                        </Text>
                      </div>
                    )}
                  </>
                )}
              >
                {profissaoSelecionada &&
                  HABILIDADES_COMUNS[profissaoSelecionada]?.map(
                    (habilidade) => (
                      <Option key={habilidade} value={habilidade}>
                        {habilidade}
                      </Option>
                    )
                  )}
              </Select>
              <Text type="secondary">
                Selecione habilidades sugeridas ou digite suas próprias
                habilidades
              </Text>
            </Form.Item>

            <Form.Item
              name="informacoesAdicionais"
              label="Informações Adicionais"
            >
              <TextArea
                rows={4}
                placeholder="Informações complementares como disponibilidade de horário, CNH, etc."
              />
            </Form.Item>

            <Divider orientation="left">Modelo do Currículo</Divider>

            <Form.Item name="modelo">
              <Radio.Group
                onChange={(e) => setModeloSelecionado(e.target.value)}
                value={modeloSelecionado}
              >
                <Space direction="vertical">
                  {MODELOS_CURRICULO.map((modelo) => (
                    <Radio key={modelo.key} value={modelo.key}>
                      <Space>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: modelo.cor,
                          }}
                        />
                        {modelo.nome}
                      </Space>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>
          </Card>
        );

      default:
        return null;
    }
  };

  const makeWithAi = (data) => {
    setDadosCurriculo(data);
    setMostrarPreview(true);
  };

  // Renderizar preview do currículo
  const renderizarPreviewCurriculo = () => {
    // Encontrar modelo selecionado
    const modelo =
      MODELOS_CURRICULO.find((m) => m.key === modeloSelecionado) ||
      MODELOS_CURRICULO[0];

    switch (modeloSelecionado) {
      case "simples":
        return (
          <div
            ref={curriculoRef}
            style={{
              padding: 40,
              background: "white",
              border: "1px solid #d9d9d9",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              width: "210mm",
              minHeight: "297mm",
              margin: "0 auto",
              fontFamily: "Arial, sans-serif",
            }}
          >
            <Row gutter={16}>
              <Col span={fotoCandidata ? 18 : 24}>
                <Title level={2} style={{ marginBottom: 5, color: modelo.cor }}>
                  {dadosCurriculo.nome?.toUpperCase()}
                </Title>
                <Title level={4} style={{ marginTop: 0, fontWeight: "normal" }}>
                  {dadosCurriculo.profissao}
                </Title>

                <div style={{ marginBottom: 10 }}>
                  <Text>
                    <HomeOutlined /> {dadosCurriculo.endereco}
                  </Text>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <Text>
                    <PhoneOutlined /> {dadosCurriculo.telefone}
                  </Text>
                  {dadosCurriculo.email && (
                    <Text style={{ marginLeft: 20 }}>
                      <MailOutlined /> {dadosCurriculo.email}
                    </Text>
                  )}
                </div>
              </Col>

              {fotoCandidata && (
                <Col span={6} style={{ textAlign: "right" }}>
                  <img
                    src={fotoCandidata}
                    alt="Foto"
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: "cover",
                      border: `2px solid ${modelo.cor}`,
                      borderRadius: 4,
                    }}
                  />
                </Col>
              )}
            </Row>

            <Divider style={{ background: modelo.cor }} />

            <Title level={4} style={{ color: modelo.cor }}>
              <UserOutlined /> OBJETIVO
            </Title>
            <Paragraph>{dadosCurriculo.objetivo}</Paragraph>

            <Title level={4} style={{ color: modelo.cor, marginTop: 25 }}>
              <BookOutlined /> FORMAÇÃO ACADÊMICA
            </Title>
            <Paragraph>
              <strong>{dadosCurriculo.escolaridade}</strong>
              {dadosCurriculo.instituicaoEnsino && (
                <div>Instituição: {dadosCurriculo.instituicaoEnsino}</div>
              )}
              {dadosCurriculo.anoConclusao && (
                <div>
                  Conclusão: {dayjs(dadosCurriculo.anoConclusao).format("YYYY")}
                </div>
              )}
            </Paragraph>

            <Title level={4} style={{ color: modelo.cor, marginTop: 25 }}>
              <ToolOutlined /> EXPERIÊNCIA PROFISSIONAL
            </Title>
            {dadosCurriculo.experiencias?.map((exp, index) => (
              <div key={index} style={{ marginBottom: 15 }}>
                <Text strong>{exp.cargo}</Text>
                <div>
                  {exp.empresa} {exp.periodo && `(${exp.periodo})`}
                </div>
                {exp.descricao && <div>{exp.descricao}</div>}
              </div>
            ))}

            {dadosCurriculo.cursos?.some((curso) => curso.nome) && (
              <>
                <Title level={4} style={{ color: modelo.cor, marginTop: 25 }}>
                  <FileTextOutlined /> CURSOS E CERTIFICAÇÕES
                </Title>
                {dadosCurriculo.cursos?.map(
                  (curso, index) =>
                    curso.nome && (
                      <div key={index} style={{ marginBottom: 10 }}>
                        <Text strong>{curso.nome}</Text>
                        <div>
                          {curso.instituicao}
                          {curso.ano && ` (${curso.ano})`}
                        </div>
                      </div>
                    )
                )}
              </>
            )}

            {habilidades.length > 0 && (
              <>
                <Title level={4} style={{ color: modelo.cor, marginTop: 25 }}>
                  <ToolOutlined /> HABILIDADES
                </Title>
                <ul style={{ paddingLeft: 20 }}>
                  {habilidades.map((hab, index) => (
                    <li key={index}>{hab}</li>
                  ))}
                </ul>
              </>
            )}

            {dadosCurriculo.informacoesAdicionais && (
              <>
                <Title level={4} style={{ color: modelo.cor, marginTop: 25 }}>
                  <InfoCircleOutlined /> INFORMAÇÕES ADICIONAIS
                </Title>
                <Paragraph>{dadosCurriculo.informacoesAdicionais}</Paragraph>
              </>
            )}
          </div>
        );

      case "basico":
        return (
          <div
            ref={curriculoRef}
            style={{
              padding: 40,
              background: "white",
              border: "1px solid #d9d9d9",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              width: "210mm",
              minHeight: "297mm",
              margin: "0 auto",
              fontFamily: "Arial, sans-serif",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 30 }}>
              <Title level={2} style={{ marginBottom: 5, color: modelo.cor }}>
                {dadosCurriculo.nome}
              </Title>
              <Title level={4} style={{ margin: 0, fontWeight: "normal" }}>
                {dadosCurriculo.profissao}
              </Title>

              <Divider style={{ background: modelo.cor, margin: "15px 0" }} />

              <Row justify="center" gutter={[16, 8]}>
                <Col>
                  <Text>
                    <HomeOutlined /> {dadosCurriculo.endereco}
                  </Text>
                </Col>
                <Col>
                  <Text>
                    <PhoneOutlined /> {dadosCurriculo.telefone}
                  </Text>
                </Col>
                {dadosCurriculo.email && (
                  <Col>
                    <Text>
                      <MailOutlined /> {dadosCurriculo.email}
                    </Text>
                  </Col>
                )}
              </Row>

              {fotoCandidata && (
                <div style={{ margin: "20px auto", textAlign: "center" }}>
                  <img
                    src={fotoCandidata}
                    alt="Foto"
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: "cover",
                      border: `2px solid ${modelo.cor}`,
                      borderRadius: "50%",
                    }}
                  />
                </div>
              )}
            </div>

            <div
              style={{
                background: modelo.cor,
                padding: "5px 10px",
                marginBottom: 15,
              }}
            >
              <Text strong style={{ color: "white" }}>
                OBJETIVO
              </Text>
            </div>
            <Paragraph style={{ marginBottom: 25 }}>
              {dadosCurriculo.objetivo}
            </Paragraph>

            <div
              style={{
                background: modelo.cor,
                padding: "5px 10px",
                marginBottom: 15,
              }}
            >
              <Text strong style={{ color: "white" }}>
                FORMAÇÃO ACADÊMICA
              </Text>
            </div>
            <Paragraph style={{ marginBottom: 25 }}>
              <strong>{dadosCurriculo.escolaridade}</strong>
              {dadosCurriculo.instituicaoEnsino && (
                <div>Instituição: {dadosCurriculo.instituicaoEnsino}</div>
              )}
              {dadosCurriculo.anoConclusao && (
                <div>
                  Conclusão: {dayjs(dadosCurriculo.anoConclusao).format("YYYY")}
                </div>
              )}
            </Paragraph>

            <div
              style={{
                background: modelo.cor,
                padding: "5px 10px",
                marginBottom: 15,
              }}
            >
              <Text strong style={{ color: "white" }}>
                EXPERIÊNCIA PROFISSIONAL
              </Text>
            </div>
            {dadosCurriculo.experiencias?.map((exp, index) => (
              <div key={index} style={{ marginBottom: 15 }}>
                <Text strong>{exp.cargo}</Text>
                <div>
                  {exp.empresa} {exp.periodo && `(${exp.periodo})`}
                </div>
                {exp.descricao && <div>{exp.descricao}</div>}
              </div>
            ))}

            {dadosCurriculo.cursos?.some((curso) => curso.nome) && (
              <>
                <div
                  style={{
                    background: modelo.cor,
                    padding: "5px 10px",
                    marginBottom: 15,
                    marginTop: 25,
                  }}
                >
                  <Text strong style={{ color: "white" }}>
                    CURSOS E CERTIFICAÇÕES
                  </Text>
                </div>
                {dadosCurriculo.cursos?.map(
                  (curso, index) =>
                    curso.nome && (
                      <div key={index} style={{ marginBottom: 10 }}>
                        <Text strong>{curso.nome}</Text>
                        <div>
                          {curso.instituicao}
                          {curso.ano && ` (${curso.ano})`}
                        </div>
                      </div>
                    )
                )}
              </>
            )}

            {habilidades.length > 0 && (
              <>
                <div
                  style={{
                    background: modelo.cor,
                    padding: "5px 10px",
                    marginBottom: 15,
                    marginTop: 25,
                  }}
                >
                  <Text strong style={{ color: "white" }}>
                    HABILIDADES
                  </Text>
                </div>
                <ul style={{ paddingLeft: 20 }}>
                  {habilidades.map((hab, index) => (
                    <li key={index}>{hab}</li>
                  ))}
                </ul>
              </>
            )}

            {dadosCurriculo.informacoesAdicionais && (
              <>
                <div
                  style={{
                    background: modelo.cor,
                    padding: "5px 10px",
                    marginBottom: 15,
                    marginTop: 25,
                  }}
                >
                  <Text strong style={{ color: "white" }}>
                    INFORMAÇÕES ADICIONAIS
                  </Text>
                </div>
                <Paragraph>{dadosCurriculo.informacoesAdicionais}</Paragraph>
              </>
            )}
          </div>
        );

      case "tradicional":
        return (
          <div
            ref={curriculoRef}
            style={{
              padding: 40,
              background: "white",
              border: "1px solid #d9d9d9",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              width: "210mm",
              minHeight: "297mm",
              margin: "0 auto",
              fontFamily: "Arial, sans-serif",
            }}
          >
            <Row>
              <Col span={17}>
                <Title level={2} style={{ marginBottom: 5 }}>
                  {dadosCurriculo.nome}
                </Title>
                <Title
                  level={4}
                  style={{
                    marginTop: 0,
                    marginBottom: 20,
                    fontWeight: "normal",
                  }}
                >
                  {dadosCurriculo.profissao}
                </Title>
              </Col>
              <Col span={7} style={{ textAlign: "right" }}>
                {fotoCandidata && (
                  <img
                    src={fotoCandidata}
                    alt="Foto"
                    style={{
                      width: 100,
                      height: 130,
                      objectFit: "cover",
                      border: "1px solid #ccc",
                    }}
                  />
                )}
              </Col>
            </Row>

            <Row style={{ marginBottom: 20 }}>
              <Col span={24}>
                <div style={{ marginBottom: 5 }}>
                  <Text>
                    <HomeOutlined /> {dadosCurriculo.endereco}
                  </Text>
                </div>
                <div>
                  <Text>
                    <PhoneOutlined /> {dadosCurriculo.telefone}
                  </Text>
                  {dadosCurriculo.email && (
                    <Text style={{ marginLeft: 20 }}>
                      <MailOutlined /> {dadosCurriculo.email}
                    </Text>
                  )}
                </div>
              </Col>
            </Row>

            <div
              style={{
                borderBottom: `2px solid ${modelo.cor}`,
                paddingBottom: 8,
                marginBottom: 15,
              }}
            >
              <Text strong style={{ fontSize: 16 }}>
                OBJETIVO
              </Text>
            </div>
            <Paragraph style={{ marginBottom: 25 }}>
              {dadosCurriculo.objetivo}
            </Paragraph>

            <div
              style={{
                borderBottom: `2px solid ${modelo.cor}`,
                paddingBottom: 8,
                marginBottom: 15,
              }}
            >
              <Text strong style={{ fontSize: 16 }}>
                FORMAÇÃO ACADÊMICA
              </Text>
            </div>
            <Paragraph style={{ marginBottom: 25 }}>
              <strong>{dadosCurriculo.escolaridade}</strong>
              {dadosCurriculo.instituicaoEnsino && (
                <div>Instituição: {dadosCurriculo.instituicaoEnsino}</div>
              )}
              {dadosCurriculo.anoConclusao && (
                <div>
                  Conclusão: {dayjs(dadosCurriculo.anoConclusao).format("YYYY")}
                </div>
              )}
            </Paragraph>

            <div
              style={{
                borderBottom: `2px solid ${modelo.cor}`,
                paddingBottom: 8,
                marginBottom: 15,
              }}
            >
              <Text strong style={{ fontSize: 16 }}>
                EXPERIÊNCIA PROFISSIONAL
              </Text>
            </div>
            {dadosCurriculo.experiencias?.map((exp, index) => (
              <div key={index} style={{ marginBottom: 15 }}>
                <Text strong>{exp.cargo}</Text>
                <div>
                  {exp.empresa} {exp.periodo && `(${exp.periodo})`}
                </div>
                {exp.descricao && <div>{exp.descricao}</div>}
              </div>
            ))}

            {dadosCurriculo.cursos?.some((curso) => curso.nome) && (
              <>
                <div
                  style={{
                    borderBottom: `2px solid ${modelo.cor}`,
                    paddingBottom: 8,
                    marginBottom: 15,
                    marginTop: 25,
                  }}
                >
                  <Text strong style={{ fontSize: 16 }}>
                    CURSOS E CERTIFICAÇÕES
                  </Text>
                </div>
                {dadosCurriculo.cursos?.map(
                  (curso, index) =>
                    curso.nome && (
                      <div key={index} style={{ marginBottom: 10 }}>
                        <Text strong>{curso.nome}</Text>
                        <div>
                          {curso.instituicao}
                          {curso.ano && ` (${curso.ano})`}
                        </div>
                      </div>
                    )
                )}
              </>
            )}

            {habilidades.length > 0 && (
              <>
                <div
                  style={{
                    borderBottom: `2px solid ${modelo.cor}`,
                    paddingBottom: 8,
                    marginBottom: 15,
                    marginTop: 25,
                  }}
                >
                  <Text strong style={{ fontSize: 16 }}>
                    HABILIDADES
                  </Text>
                </div>
                <Row gutter={[16, 8]}>
                  {habilidades.map((hab, index) => (
                    <Col span={12} key={index}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: modelo.cor,
                            marginRight: 8,
                          }}
                        />
                        {hab}
                      </div>
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {dadosCurriculo.informacoesAdicionais && (
              <>
                <div
                  style={{
                    borderBottom: `2px solid ${modelo.cor}`,
                    paddingBottom: 8,
                    marginBottom: 15,
                    marginTop: 25,
                  }}
                >
                  <Text strong style={{ fontSize: 16 }}>
                    INFORMAÇÕES ADICIONAIS
                  </Text>
                </div>
                <Paragraph>{dadosCurriculo.informacoesAdicionais}</Paragraph>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#1890ff", padding: "0 20px" }}>
        <Row align="middle" style={{ height: "100%" }}>
          <Col>
            <Title level={3} style={{ color: "white", margin: 0 }}>
              <FileTextOutlined /> Criador de Currículo
            </Title>
          </Col>
        </Row>
      </Header>

      <Content style={{ padding: "20px", background: "#f0f2f5" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {mostrarPreview ? (
            <div>
              <Card
                title="Visualização do Currículo"
                bordered={false}
                extra={
                  <Space>
                    <Tooltip title="Editar">
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => setMostrarPreview(false)}
                      >
                        Editar
                      </Button>
                    </Tooltip>

                    <Tooltip title="Salvar PDF">
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={imprimirCurriculo}
                        loading={carregando}
                      >
                        Salvar PDF
                      </Button>
                    </Tooltip>
                    <Tooltip title="Reiniciar">
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={reiniciarCriacao}
                      >
                        Reiniciar
                      </Button>
                    </Tooltip>
                  </Space>
                }
              >
                <div style={{ overflow: "auto" }}>
                  {renderizarPreviewCurriculo()}
                </div>
              </Card>
            </div>
          ) : (
            <div>
              <div style={{ paddingBottom: 20 }}>
                <CurriculoAICard
                  setModeloSelecionado={setModeloSelecionado}
                  modeloSelecionado={modeloSelecionado}
                  setCurriculoData={makeWithAi}
                  MODELOS_CURRICULO={MODELOS_CURRICULO}
                />
              </div>
              <Card bordered={false} style={{ marginBottom: 20 }}>
                <Steps current={currentStep} responsive={true}>
                  <Step title="Dados Pessoais" icon={<UserOutlined />} />
                  <Step title="Experiência" icon={<ToolOutlined />} />
                  <Step title="Formação" icon={<BookOutlined />} />
                  <Step title="Habilidades" icon={<FileTextOutlined />} />
                </Steps>
              </Card>

              {gerarAlertaCamposFaltantes()}

              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  modelo: "simples",
                  ...dadosCurriculo,
                }}
              >
                {renderizarEtapa()}

                <div style={{ marginTop: 20, textAlign: "right" }}>
                  {currentStep > 0 && (
                    <Button
                      style={{ marginRight: 8 }}
                      onClick={voltarEtapa}
                      icon={<ArrowLeftOutlined />}
                    >
                      Voltar
                    </Button>
                  )}

                  <Button
                    type="primary"
                    onClick={avancarEtapa}
                    icon={
                      currentStep === 3 ? (
                        <EyeOutlined />
                      ) : (
                        <ArrowRightOutlined />
                      )
                    }
                  >
                    {currentStep === 3 ? "Visualizar Currículo" : "Próximo"}
                  </Button>
                </div>
              </Form>
            </div>
          )}
        </div>
      </Content>

      <Footer style={{ textAlign: "center" }}>
        <Text type="secondary">
          Criador de Currículo © {new Date().getFullYear()}
        </Text>
      </Footer>

      {carregando && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255, 255, 255, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <Spin size="large" tip="Gerando PDF..." />
        </div>
      )}
      <Modal
        open={modalVisible}
        title="Reiniciar Criação"
        footer={null}
        onCancel={handleCancelReset}
        centered
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <WarningOutlined
            style={{ color: "#faad14", fontSize: "24px", marginBottom: "12px" }}
          />
          <p>
            Tem certeza que deseja reiniciar a criação do currículo? Todos os
            dados serão perdidos.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <Button onClick={handleCancelReset}>Não</Button>
          <Button type="primary" danger onClick={handleConfirmReset}>
            Sim
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};

export default CriadorCurriculo;
