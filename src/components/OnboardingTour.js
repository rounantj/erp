import React, { useState, useEffect } from "react";
import Joyride, { STATUS, ACTIONS, EVENTS } from "react-joyride";
import { useHistory } from "react-router-dom";
import { useCompany } from "context/CompanyContext";
import { completeOnboarding } from "helpers/api-integrator";
import { notification, Button, Modal } from "antd";
import {
  RocketOutlined,
  SettingOutlined,
  PictureOutlined,
  BgColorsOutlined,
  ShopOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

// Estilos customizados para o tour
const tourStyles = {
  options: {
    arrowColor: "#fff",
    backgroundColor: "#fff",
    overlayColor: "rgba(0, 0, 0, 0.6)",
    primaryColor: "#667eea",
    textColor: "#333",
    width: 380,
    zIndex: 10000,
  },
  buttonNext: {
    backgroundColor: "#667eea",
    borderRadius: "8px",
    color: "#fff",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
  },
  buttonBack: {
    color: "#667eea",
    marginRight: "10px",
  },
  buttonSkip: {
    color: "#999",
  },
  tooltip: {
    borderRadius: "12px",
    padding: "20px",
  },
  tooltipContainer: {
    textAlign: "left",
  },
  tooltipTitle: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "10px",
    color: "#333",
  },
  tooltipContent: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#666",
  },
};

// Passos do tour
const tourSteps = [
  {
    target: "body",
    content: (
      <div>
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <RocketOutlined style={{ fontSize: "48px", color: "#667eea" }} />
        </div>
        <h3
          style={{
            fontSize: "20px",
            fontWeight: "700",
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          Bem-vindo ao Sistema! 🎉
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "#666",
            textAlign: "center",
            lineHeight: "1.6",
          }}
        >
          Vamos configurar sua empresa em poucos passos para você começar a usar
          o sistema.
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
    styles: {
      tooltip: {
        width: "400px",
      },
    },
  },
  {
    target: '[href="/admin/setup"]',
    content: (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <SettingOutlined style={{ fontSize: "24px", color: "#667eea" }} />
          <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>
            Menu de Configurações
          </h3>
        </div>
        <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.6" }}>
          Clique aqui para acessar as configurações da sua empresa. É onde você
          personaliza tudo!
        </p>
      </div>
    ),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: "body",
    content: (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <PictureOutlined style={{ fontSize: "24px", color: "#667eea" }} />
          <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>
            Adicione sua Logo
          </h3>
        </div>
        <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.6" }}>
          Na aba "Identidade Visual", você pode fazer upload da logo da sua
          empresa. Ela aparecerá no menu lateral e nos cupons.
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: "body",
    content: (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <BgColorsOutlined style={{ fontSize: "24px", color: "#667eea" }} />
          <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>
            Personalize as Cores
          </h3>
        </div>
        <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.6" }}>
          Escolha a cor do menu lateral para combinar com a identidade visual da
          sua marca. O sistema inteiro se adapta à sua escolha!
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: "body",
    content: (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <ShopOutlined style={{ fontSize: "24px", color: "#667eea" }} />
          <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>
            Dados para o Cupom
          </h3>
        </div>
        <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.6" }}>
          Na aba "Dados da Empresa", preencha as informações que aparecerão no
          cupom não fiscal: nome, CNPJ, endereço, telefone e email.
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: ".sidebar",
    content: (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <CheckCircleOutlined style={{ fontSize: "24px", color: "#52c41a" }} />
          <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>
            Explore o Sistema!
          </h3>
        </div>
        <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.6" }}>
          Use o menu lateral para navegar entre as funcionalidades:
          <br />• <strong>Caixa</strong> - Realizar vendas
          <br />• <strong>Faturamento</strong> - Ver vendas realizadas
          <br />• <strong>Produtos</strong> - Gerenciar catálogo
        </p>
      </div>
    ),
    placement: "right",
    disableBeacon: true,
  },
];

function OnboardingTour({ run, onFinish }) {
  const history = useHistory();
  const { refreshSetup } = useCompany();
  const [stepIndex, setStepIndex] = useState(0);

  const handleJoyrideCallback = async (data) => {
    const { action, index, status, type } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      // Avançar para o próximo passo
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }

    // Quando o tour terminar ou for pulado
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      try {
        // Marcar onboarding como concluído no backend
        await completeOnboarding();
        refreshSetup();

        notification.success({
          message: "Configuração concluída!",
          description:
            "Você pode acessar este tour novamente nas configurações.",
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        });

        // Se terminou, redirecionar para configurações
        if (status === STATUS.FINISHED) {
          history.push("/admin/setup");
        }
      } catch (error) {
        console.error("Erro ao completar onboarding:", error);
      }

      if (onFinish) {
        onFinish();
      }
    }
  };

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      spotlightClicks
      disableOverlayClose
      styles={tourStyles}
      callback={handleJoyrideCallback}
      locale={{
        back: "Voltar",
        close: "Fechar",
        last: "Concluir",
        next: "Próximo",
        skip: "Pular tour",
      }}
      floaterProps={{
        disableAnimation: true,
      }}
    />
  );
}

// Modal de boas-vindas que aparece antes do tour
export function WelcomeModal({ visible, onStart, onSkip }) {
  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      centered
      width={450}
      styles={{ body: { padding: "32px", textAlign: "center" } }}
    >
      <div style={{ marginBottom: "24px" }}>
        <RocketOutlined style={{ fontSize: "64px", color: "#667eea" }} />
      </div>

      <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "12px" }}>
        Bem-vindo! 🎉
      </h2>

      <p
        style={{
          fontSize: "16px",
          color: "#666",
          marginBottom: "24px",
          lineHeight: "1.6",
        }}
      >
        Parece que é sua primeira vez por aqui!
        <br />
        Vamos configurar sua empresa rapidinho?
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Button
          type="primary"
          size="large"
          icon={<RocketOutlined />}
          onClick={onStart}
          style={{
            height: "48px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "600",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
          }}
        >
          Iniciar Configuração
        </Button>

        <Button type="text" onClick={onSkip} style={{ color: "#999" }}>
          Configurar depois
        </Button>
      </div>
    </Modal>
  );
}

export default OnboardingTour;


