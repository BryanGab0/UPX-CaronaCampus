import { createContext, useContext } from "react";

// Contexto de autenticação: o componente AuthProvider fica em AuthProvider.tsx
// (separado para o Fast Refresh do Vite, que exige arquivos só com componentes).

export const DOMINIO_FACENS = "facens.br";

export function emailInstitucional(email: string): boolean {
  const re = new RegExp(`^\\d+@${DOMINIO_FACENS.replace(".", "\\.")}$`, "i");
  return re.test(email.trim());
}

export interface AuthContextValue {
  autenticado: boolean;
  nome: string;
  email: string;
  ra: string;
  login: (email: string, senha: string) => Promise<void>;
  registrar: (email: string, nome: string, telefone: string, senha: string) => Promise<void>;
  sair: () => void;
  avisoSaida: string | null; // ex.: conta bloqueada; aparece na tela de login
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
