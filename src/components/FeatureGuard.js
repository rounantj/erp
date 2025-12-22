import React, { useContext } from "react";
import { SubscriptionContext } from "../context/SubscriptionContext";
import { Alert, Button, Space, Typography } from "antd";
import { LockOutlined, CrownOutlined } from "@ant-design/icons";

const { Text } = Typography;

/**
 * Componente para verificar se o usuário tem acesso a uma feature específica
 * baseada no plano da empresa.
 *
 * Features disponíveis:
 * - create_products: Criar produtos
 * - checkout: Usar tela de caixa
 * - sales: Ver/registrar vendas
 * - product_images: Upload de imagens em produtos
 * - customization: Personalização da aparência
 * - curriculos: Criar currículos
 * - employees: Inserir funcionários
 *
 * @param {string} feature - Nome da feature a verificar
 * @param {React.ReactNode} children - Conteúdo a exibir se autorizado
 * @param {React.ReactNode} fallback - Conteúdo alternativo se não autorizado (opcional)
 * @param {boolean} showMessage - Exibir mensagem de upgrade (default: true)
 * @param {string} messageType - Tipo de mensagem: "inline", "block", "hide" (default: "inline")
 */
const FeatureGuard = ({
  feature,
  children,
  fallback = null,
  showMessage = true,
  messageType = "inline",
}) => {
  const { features, subscription, loading, isReadonly } = useContext(SubscriptionContext);

  // Enquanto carrega, mostrar children (para evitar flicker)
  if (loading) {
    return <>{children}</>;
  }

  // Se não tem subscription, bloquear
  if (!subscription) {
    if (!showMessage || messageType === "hide") {
      return fallback;
    }

    return (
      <Alert
        type="warning"
        showIcon
        icon={<LockOutlined />}
        message="Funcionalidade bloqueada"
        description="Sua empresa não possui um plano ativo. Entre em contato com o administrador."
        style={messageType === "inline" ? { margin: "8px 0" } : { margin: "16px 0" }}
      />
    );
  }

  // Verificar se a feature está disponível
  const hasFeature = features[feature] === true;

  if (hasFeature && !isReadonly) {
    return <>{children}</>;
  }

  // Se está em modo readonly
  if (isReadonly) {
    if (!showMessage || messageType === "hide") {
      return fallback;
    }

    return (
      <Alert
        type="info"
        showIcon
        icon={<LockOutlined />}
        message="Modo somente leitura"
        description={
          <Space direction="vertical" size="small">
            <Text>
              {subscription.status === "past_due"
                ? "Seu pagamento está em atraso. Regularize para usar todas as funcionalidades."
                : "Seu período de teste expirou. Assine um plano para continuar."}
            </Text>
          </Space>
        }
        style={messageType === "inline" ? { margin: "8px 0" } : { margin: "16px 0" }}
      />
    );
  }

  // Feature não disponível no plano
  if (!showMessage || messageType === "hide") {
    return fallback;
  }

  const featureNames = {
    create_products: "Criar produtos",
    checkout: "Tela de caixa",
    sales: "Vendas",
    product_images: "Imagens em produtos",
    customization: "Personalização",
    curriculos: "Currículos",
    employees: "Funcionários",
  };

  const upgradeMessage = {
    product_images: "Faça upgrade para o plano Profissional para usar imagens nos produtos.",
    customization: "Faça upgrade para o plano Profissional para personalizar a aparência.",
    curriculos: "Faça upgrade para o plano Profissional para criar currículos.",
    employees: "Faça upgrade para o plano Profissional para inserir funcionários.",
  };

  return (
    <Alert
      type="warning"
      showIcon
      icon={<CrownOutlined style={{ color: "#722ed1" }} />}
      message={`${featureNames[feature] || feature} - Recurso Premium`}
      description={
        <Space direction="vertical" size="small">
          <Text>{upgradeMessage[feature] || "Esta funcionalidade requer um plano superior."}</Text>
        </Space>
      }
      style={messageType === "inline" ? { margin: "8px 0" } : { margin: "16px 0" }}
    />
  );
};

/**
 * Hook para verificar features programaticamente
 */
export const useFeatureCheck = () => {
  const { features, subscription, isReadonly, loading } = useContext(SubscriptionContext);

  const checkFeature = (feature) => {
    if (loading) return true; // Assume permitido durante loading
    if (!subscription) return false;
    if (isReadonly) return false;
    return features[feature] === true;
  };

  const canAddUser = () => {
    if (!subscription) return false;
    const plan = subscription.plan;
    if (!plan) return false;

    // -1 significa ilimitado
    if (plan.maxUsers === -1) return true;

    // Verificar limite (nota: precisaria do count real de users)
    return true; // Por padrão permite, a API vai verificar
  };

  return {
    checkFeature,
    canAddUser,
    isReadonly,
    subscription,
    features,
    loading,
  };
};

export default FeatureGuard;

