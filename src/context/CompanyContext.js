import React, {
  createContext,
  useState,
  useMemo,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { getCompanySetup } from "helpers/api-integrator";

export const CompanyContext = createContext();

// Hook personalizado para usar o contexto
export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany deve ser usado dentro de um CompanyProvider");
  }
  return context;
};

// Logo padrão como fallback
const DEFAULT_LOGO = null; // Será usado o logo.png do assets
const DEFAULT_SIDEBAR_COLOR = "#667eea";

export const CompanyProvider = ({ children }) => {
  const [companySetup, setCompanySetup] = useState({
    logoUrl: DEFAULT_LOGO,
    sidebarColor: DEFAULT_SIDEBAR_COLOR,
    companyName: "",
    companyAddress: "",
    companyCNPJ: "",
    companyPhone: "",
    companyEmail: "",
    receiptFooter: "",
    onboardingCompleted: false,
    companyIntegration: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para carregar configurações da empresa
  const loadCompanySetup = useCallback(async (companyId) => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getCompanySetup(companyId);

      if (response.data && response.data[0]) {
        const data = response.data[0];
        setCompanySetup({
          id: data.id,
          companyId: data.companyId,
          logoUrl: data.logoUrl || DEFAULT_LOGO,
          sidebarColor: data.sidebarColor || DEFAULT_SIDEBAR_COLOR,
          companyName: data.companyName || "",
          companyAddress: data.companyAddress || "",
          companyCNPJ: data.companyCNPJ || "",
          companyPhone: data.companyPhone || "",
          companyEmail: data.companyEmail || "",
          receiptFooter: data.receiptFooter || "",
          onboardingCompleted: data.onboardingCompleted || false,
          companyIntegration: data.companyIntegration || {},
          companyNCM: data.companyNCM || "",
        });

        // Salvar no localStorage para acesso rápido
        localStorage.setItem("companySetup", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Erro ao carregar configurações da empresa:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para atualizar o setup localmente (após salvar no backend)
  const updateCompanySetup = useCallback((newSetup) => {
    setCompanySetup((prev) => ({
      ...prev,
      ...newSetup,
    }));

    // Atualizar localStorage
    const currentSetup = JSON.parse(
      localStorage.getItem("companySetup") || "{}"
    );
    localStorage.setItem(
      "companySetup",
      JSON.stringify({
        ...currentSetup,
        ...newSetup,
      })
    );
  }, []);

  // Função para recarregar setup
  const refreshSetup = useCallback(async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const companyId = user?.user?.companyId;
    if (companyId) {
      await loadCompanySetup(companyId);
    }
  }, [loadCompanySetup]);

  // Carregar do localStorage ou API na inicialização
  useEffect(() => {
    const cachedSetup = localStorage.getItem("companySetup");
    if (cachedSetup) {
      try {
        const parsed = JSON.parse(cachedSetup);
        setCompanySetup((prev) => ({
          ...prev,
          ...parsed,
          logoUrl: parsed.logoUrl || DEFAULT_LOGO,
          sidebarColor: parsed.sidebarColor || DEFAULT_SIDEBAR_COLOR,
        }));
      } catch (err) {
        console.error("Erro ao carregar setup do localStorage:", err);
      }
    }

    // Carregar da API
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const companyId = user?.user?.companyId;
    if (companyId) {
      loadCompanySetup(companyId);
    } else {
      setLoading(false);
    }
  }, [loadCompanySetup]);

  // Memoizar o valor do contexto
  const contextValue = useMemo(
    () => ({
      companySetup,
      loading,
      error,
      loadCompanySetup,
      updateCompanySetup,
      refreshSetup,
      // Helpers
      logoUrl: companySetup.logoUrl,
      sidebarColor: companySetup.sidebarColor,
      onboardingCompleted: companySetup.onboardingCompleted,
      needsOnboarding:
        !companySetup.onboardingCompleted && !companySetup.logoUrl,
    }),
    [
      companySetup,
      loading,
      error,
      loadCompanySetup,
      updateCompanySetup,
      refreshSetup,
    ]
  );

  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  );
};

