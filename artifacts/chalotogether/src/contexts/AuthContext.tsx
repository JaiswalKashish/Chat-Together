import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@workspace/api-client-react";

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("ct_token");
    if (storedToken) {
      setToken(storedToken);
      // In a real app we'd fetch the user profile here if we didn't store it
      // For now we'll rely on the API hook to fetch it if there's a token
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("ct_token", newToken);
    setToken(newToken);
    setUserState(newUser);
  };

  const logout = () => {
    localStorage.removeItem("ct_token");
    setToken(null);
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, setUser: setUserState }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
