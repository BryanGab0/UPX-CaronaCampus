import { createContext, useContext } from "react";
import type { Sessao } from "../lib/api";

// Contexto de autenticação: o componente AuthProvider fica em AuthProvider.tsx
// (separado para o Fast Refresh do Vite, que exige arquivos só com componentes).

export const DOMINIO_FACENS = "facens.br";
export function emailInstitucional(email: string): boolean {
  const re = new RegExp(`^\\d+@${DOMINIO_FACENS.replace(".", "\\.")}$`, "i");
  return re.test(email.trim());
}

export interface AuthContextValue {
  autenticado: boolean;
  usuario: Sessao["usuario"] | null;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
