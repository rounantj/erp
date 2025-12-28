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

    if (!companyId || !user) {
      if (!silent) setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setError(null);

    try {
      const result = await getCompanyFeatures(companyId);

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
    
    pollingRef.current = setInterval(() => {
      const user = getCurrentUser();
      if (user) {
        checkSubscription(true);
      } else {
        stopPolling();
      }
    }, POLLING_INTERVAL);
  };

  // Parar polling
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Verificação inicial ao montar o componente
  useEffect(() => {
    // Verificar se já tem usuário logado
    const user = getCurrentUser();
    if (user) {
      checkSubscription();
      startPolling();
    } else {
      setLoading(false);
    }

    return () => {
      stopPolling();
    };
  }, []);

  // Escutar evento de login
  useEffect(() => {
    const handleLogin = () => {
      checkSubscription();
      startPolling();
    };

    const handleLogout = () => {
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

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;
