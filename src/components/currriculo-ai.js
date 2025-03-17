import React, { useState } from "react";
import { Card, Input, Button, Spin, message, Typography, Alert } from "antd";
import {
  RobotOutlined,
  SendOutlined,
  FileTextOutlined,
  BulbOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { makeCurriculum } from "helpers/curriculo.adapter";
import { Radio, Space } from "antd/lib";

const { TextArea } = Input;
const { Title } = Typography;

const CurriculoAICard = ({
  setCurriculoData,
  setAiData,
  setModeloSelecionado,
  modeloSelecionado,
  MODELOS_CURRICULO,
}) => {
  const text = `Descreva as informações pessoais e profissionais para criar o currículo. Inclua:

    Dados pessoais: nome completo, telefone, e-mail, endereço
    Profissão: soldador, pedreiro, pintor, eletricista, etc.
    Experiência profissional: empresas onde trabalhou, período e funções
    Formação: cursos técnicos, certificações (SENAI, SENAC)
    Habilidades específicas: solda MIG/TIG, leitura de projetos, instalações elétricas
    Referências: nome e contato de ex-chefes ou clientes
    
    Exemplo: 'José Silva, (11) 98765-4321, josesilva@email.com, Rua das Flores 123, São Paulo. Pedreiro com 8 anos de experiência em construção civil, trabalhei na Construtora ABC (2018-2022) como pedreiro de acabamento. Certificado pelo SENAI em Assentamento de Revestimentos. Especializado em azulejos e porcelanatos.'`;
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState();

  const getCurriculoAi = async (input) => {
    try {
      const response = await makeCurriculum(input);
      console.log({ iaQuery: response });
      if (response.data && response?.data?.success != false) {
        message.success("Currículo gerado com sucesso!");
        setAiData({ usingAi: true, prompt: input });
        setCurriculoData({ ...response.data, modelo: modeloSelecionado });
        setExpanded(false); // Recolhe o card após sucesso
        setErrorMessage("");
      } else {
        setErrorMessage(response.data.message);
        message.error(
          "Erro ao gerar o currículo. Tente novamente. " + response.data.message
        );
      }
    } catch (error) {
      console.log({ error });
      message.error(
        "Erro ao gerar o currículo. Tente novamente. " + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      message.warning("Por favor, insira suas informações profissionais");
      return;
    }
    setLoading(true);
    await getCurriculoAi(input);
  };

  return (
    <Card
      className="ai-card-container"
      style={{
        boxShadow: expanded
          ? "0 8px 24px rgba(24, 144, 255, 0.15)"
          : "0 4px 12px rgba(0, 0, 0, 0.08)",
        borderRadius: "12px",
        maxWidth: "700px",
        margin: "0 auto",
        transition: "all 0.5s ease",
        border: expanded ? "1px solid #1890ff" : "1px solid #f0f0f0",
        overflow: "hidden",
      }}
      bodyStyle={{
        padding: expanded ? "24px" : "16px",
        transition: "all 0.3s ease",
      }}
      bordered={false}
    >
      {!expanded ? (
        // Card recolhido - Apenas botão chamativo
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() => setExpanded(true)}
        >
          <Button
            type="primary"
            size="large"
            shape="round"
            icon={<BulbOutlined />}
            style={{
              background: "linear-gradient(90deg, #1890ff, #722ed1)",
              border: "none",
              boxShadow: "0 4px 15px rgba(24, 144, 255, 0.3)",
              padding: "0 30px",
              height: "50px",
              fontSize: "16px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span
              className="pulse-effect"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)",
                transform: "translateX(-100%)",
                animation: "pulse 2s infinite",
              }}
            ></span>
            <style>{`
              @keyframes pulse {
                0% { transform: translateX(-100%); }
                60% { transform: translateX(100%); }
                100% { transform: translateX(100%); }
              }
            `}</style>
            CRIE O CURRÍCULO COM A Fofa-AI ✨ NOSSA INTELIGÊNCIA ARTIFICIAL
          </Button>
        </div>
      ) : (
        // Card expandido - Formulário completo
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <RobotOutlined
              style={{
                fontSize: "28px",
                marginRight: "12px",
                color: "#1890ff",
              }}
            />
            <Title level={4} style={{ margin: 0 }}>
              Entreviste o cliente, digite aqui e deixe o resto com Fofa-AI ✨
            </Title>
            <Button
              type="default"
              icon={<CopyOutlined />}
              size="large"
              onClick={() => {
                const textoModelo = `📄 *INFORMAÇÕES PARA SEU CURRÍCULO* 📄

Olá! Para criar seu currículo, preciso que me envie:

*1. DADOS PESSOAIS*
- Nome completo
- Telefone
- Endereço

*2. FORMAÇÃO*
- Escolaridade (Ensino Médio, Técnico, etc.)
- Nome da escola/instituição
- Ano de conclusão

*3. EXPERIÊNCIAS DE TRABALHO*
- Empresas onde trabalhou
- Cargos
- Período
- O que fazia no trabalho

*4. CURSOS*
- Cursos que fez
- Onde fez
- Ano

*5. HABILIDADES*
- O que você sabe fazer bem

*6. OBJETIVO*
- Que tipo de trabalho você busca

Quanto mais informações você enviar, melhor ficará seu currículo!`;

                navigator.clipboard
                  .writeText(textoModelo)
                  .then(() => {
                    message.success(
                      "Texto copiado para a área de transferência!"
                    );
                  })
                  .catch((err) => {
                    message.error("Erro ao copiar texto: " + err);
                  });
              }}
              shape="round"
              style={{
                minWidth: "50px",
                marginLeft: "10px",
                background: "#f0f2f5",
                border: "1px solid #d9d9d9",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              Copiar Modelo
            </Button>
          </div>
          {errorMessage && (
            <div style={{ marginBottom: 16 }}>
              <Alert
                message="Erro na criação do currículo"
                description={errorMessage}
                type="error"
                showIcon
              />
            </div>
          )}

          <div style={{ position: "relative" }}>
            <TextArea
              value={input}
              rows={30}
              onChange={(e) => setInput(e.target.value)}
              placeholder={text}
              autoSize={{ minRows: 6, maxRows: 12 }}
              disabled={loading}
              style={{
                padding: "12px",
                minHeight: "800px",
                fontSize: "16px",
                border: "1px solid #d9d9d9",
                borderRadius: "8px",
                resize: "none",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              }}
            />

            {loading && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                  borderRadius: "8px",
                  zIndex: 10,
                }}
              >
                <div
                  className="ai-loading-container"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    className="ai-brain-pulse"
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #1890ff, #722ed1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 20px rgba(24, 144, 255, 0.6)",
                      animation: "pulse-brain 1.5s infinite",
                      marginBottom: "15px",
                    }}
                  >
                    <RobotOutlined style={{ fontSize: 30, color: "white" }} />
                  </div>
                  <style>{`
                    @keyframes pulse-brain {
                      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.7); }
                      70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(24, 144, 255, 0); }
                      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
                    }
                  `}</style>
                  <p style={{ marginTop: "15px", color: "#555" }}>
                    Nossa IA está analisando suas informações...
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              onClick={() => setExpanded(false)}
              size="middle"
              shape="round"
              style={{ color: "#888" }}
            >
              Cancelar
            </Button>
            <Space style={{ zoom: "75%" }} direction="horizontal">
              {MODELOS_CURRICULO.map((modelo) => (
                <Radio
                  key={modelo.key}
                  value={modelo.key}
                  onChange={(e) => setModeloSelecionado(e.target.value)}
                >
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

            <Button
              type="primary"
              icon={<SendOutlined />}
              size="large"
              onClick={handleSubmit}
              loading={loading}
              disabled={loading || !input.trim()}
              shape="round"
              style={{
                minWidth: "180px",
                background: "linear-gradient(90deg, #1890ff, #722ed1)",
                border: "none",
                color: "white",
                boxShadow: "0 4px 15px rgba(24, 144, 255, 0.3)",
              }}
            >
              Gerar Currículo
            </Button>
          </div>

          <div style={{ marginTop: "15px", color: "#888", fontSize: "13px" }}>
            Dica: Quanto mais detalhes você fornecer, melhor será o currículo
            gerado.
          </div>
        </>
      )}
    </Card>
  );
};

export default CurriculoAICard;
