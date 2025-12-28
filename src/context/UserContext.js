import React, {
  createContext,
  useState,
  useMemo,
  useCallback,
  useContext,
} from "react";

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

  // Função memoizada para atualizar o usuário
  const updateUser = useCallback((newUser) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user");
    }
  }, []);

  // Memoizar o valor do contexto para evitar re-renders desnecessários
  const contextValue = useMemo(
    () => ({
      user,
      setUser: updateUser,
    }),
    [user, updateUser]
  );

  // Carregar usuário do localStorage apenas uma vez na inicialização
  React.useEffect(() => {
    const usr = localStorage.getItem("user");
    if (usr) {
      try {
        setUser(JSON.parse(usr));
      } catch (error) {
        console.error("Erro ao carregar usuário do localStorage:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
