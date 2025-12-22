import React, { createContext, useState, useEffect, useRef } from "react";
import { getCompanyFeatures, getCurrentCompanyId, getCurrentUser } from "../helpers/api-integrator";

// Intervalo de polling em milissegundos (30 segundos)
const POLLING_INTERVAL = 30000;

export const SubscriptionContext = createContext({
  subscription: null,
  plan: null,
  features: {},
  status: "no_subscription",
  canAccess: false,
  isReadonly: false,
  trialEndsAt: null,
  loading: true,
  error: null,
  refreshSubscription: () => {},
});

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [features, setFeatures] = useState({});
  const [status, setStatus] = useState("no_subscription");
  const [canAccess, setCanAccess] = useState(true);
  const [isReadonly, setIsReadonly] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const pollingRef = useRef(null);
  const isFirstRender = useRef(true);

  // Função para verificar subscription
  const checkSubscription = async (silent = false) => {
    const companyId = getCurrentCompanyId();
    const user = getCurrentUser();

    console.log("🔍 [Subscription] Verificando... companyId:", companyId, "user:", user ? user.email : "null");

    if (!companyId || !user) {
      console.log("⚠️ [Subscription] Sem companyId ou user, ignorando verificação");
      if (!silent) setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setError(null);

    try {
      console.log("📡 [Subscription] Chamando API getCompanyFeatures...");
      const result = await getCompanyFeatures(companyId);
      console.log("📦 [Subscription] Resposta da API:", result);

      if (result.success && result.data) {
        const data = result.data;

        setPlan(data.plan);
        setFeatures(data.features || {});
        setStatus(data.status);
        setCanAccess(data.canAccess);
        setTrialEndsAt(data.trialEndsAt);
        setCurrentPeriodEnd(data.currentPeriodEnd);

        // Determinar se está bloqueado
        const blockedStatuses = ["readonly", "past_due", "cancelled", "expired"];
        const blocked = blockedStatuses.includes(data.status) || !data.canAccess;
        setIsReadonly(blocked);

        console.log("✅ [Subscription] Status:", data.status);
        console.log("✅ [Subscription] canAccess:", data.canAccess);
        console.log("✅ [Subscription] isBlocked:", blocked);

        // Buscar subscription completa
        setSubscription({
          id: data.subscriptionId,
          plan: data.plan,
          status: data.status,
          trialEndsAt: data.trialEndsAt,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd,
        });
      } else {
        console.log("⚠️ [Subscription] Sem subscription encontrada");
        setStatus("no_subscription");
        setCanAccess(true);
        setIsReadonly(false);
      }
    } catch (err) {
      console.error("❌ [Subscription] Erro na API:", err);
      setError("Erro ao verificar subscription");
    }

    if (!silent) setLoading(false);
  };

  // Iniciar polling
  const startPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    console.log("🔄 [Subscription] Iniciando polling a cada 30 segundos");
    
    pollingRef.current = setInterval(() => {
      const user = getCurrentUser();
      if (user) {
        console.log("🔄 [Subscription] Polling tick...");
        checkSubscription(true);
      } else {
        console.log("🛑 [Subscription] Usuário deslogou, parando polling");
        stopPolling();
      }
    }, POLLING_INTERVAL);
  };

  // Parar polling
  const stopPolling = () => {
    if (pollingRef.current) {
      console.log("🛑 [Subscription] Polling parado");
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Verificação inicial ao montar o componente
  useEffect(() => {
    console.log("🚀 [Subscription] Provider montado!");
    
    // Verificar se já tem usuário logado
    const user = getCurrentUser();
    if (user) {
      console.log("👤 [Subscription] Usuário já logado, verificando subscription...");
      checkSubscription();
      startPolling();
    } else {
      console.log("👤 [Subscription] Nenhum usuário logado ainda");
      setLoading(false);
    }

    return () => {
      stopPolling();
    };
  }, []);

  // Escutar evento de login
  useEffect(() => {
    const handleLogin = () => {
      console.log("🎉 [Subscription] Evento de login recebido!");
      checkSubscription();
      startPolling();
    };

    const handleLogout = () => {
      console.log("👋 [Subscription] Evento de logout recebido!");
      stopPolling();
      setStatus("no_subscription");
      setCanAccess(true);
      setIsReadonly(false);
      setSubscription(null);
    };

    window.addEventListener("userLoggedIn", handleLogin);
    window.addEventListener("userLoggedOut", handleLogout);
    
    return () => {
      window.removeEventListener("userLoggedIn", handleLogin);
      window.removeEventListener("userLoggedOut", handleLogout);
    };
  }, []);

  const value = {
    subscription,
    plan,
    features,
    status,
    canAccess,
    isReadonly,
    trialEndsAt,
    currentPeriodEnd,
    loading,
    error,
    refreshSubscription: checkSubscription,
  };

  console.log("🎯 [Subscription] Estado atual - status:", status, "canAccess:", canAccess, "isReadonly:", isReadonly);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;
