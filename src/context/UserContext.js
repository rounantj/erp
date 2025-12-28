import React, {
  createContext,
  useState,
  useMemo,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { useUser as useClerkUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { syncClerkUser } from "helpers/clerk-sync";

export const UserContext = createContext();

// Hook personalizado para usar o contexto
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser deve ser usado dentro de um UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const clerkUser = useClerkUser();
  const { getToken, isSignedIn } = useClerkAuth();

  // Função memoizada para atualizar o usuário
  const updateUser = useCallback((newUser) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("api_token");
    }
  }, []);

  // Sincronizar usuário Clerk com backend
  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn && clerkUser) {
        try {
          setIsLoading(true);
          const token = await getToken();
          if (token) {
            const result = await syncClerkUser(token);
            if (result.success && result.data?.user) {
              // Estrutura compatível com código existente
              const userData = {
                user: result.data.user,
                access_token: result.data.access_token,
              };
              setUser(userData);
            }
          }
        } catch (error) {
          console.error("Erro ao sincronizar usuário Clerk:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (!isSignedIn) {
        // Usuário não está logado no Clerk
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("api_token");
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };

    syncUser();
  }, [isSignedIn, clerkUser, getToken]);

  // Memoizar o valor do contexto para evitar re-renders desnecessários
  const contextValue = useMemo(
    () => ({
      user,
      setUser: updateUser,
      isLoading,
      isSignedIn,
    }),
    [user, updateUser, isLoading, isSignedIn]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
