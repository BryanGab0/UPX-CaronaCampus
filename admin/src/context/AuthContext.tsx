import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { usePersistedState } from "../lib/usePersistedState";
import { login as apiLogin, definirToken } from "../lib/api";
import type { Sessao } from "../lib/api";

export const DOMINIO_FACENS = "facens.br";
export function emailInstitucional(email: string): boolean {
  const re = new RegExp(`^\\d+@${DOMINIO_FACENS.replace(".", "\\.")}$`, "i");
  return re.test(email.trim());
}

interface AuthContextValue {
  autenticado: boolean;
  usuario: Sessao["usuario"] | null;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = usePersistedState<Sessao | null>("carona-admin:sessao", null);

  definirToken(sessao?.token ?? null); // sincroniza o token do api

  const entrar = async (email: string, senha: string) => {
    const ra = email.trim().split("@")[0];
    const s = await apiLogin(ra, senha);
    // Só entra se a conta for de administrador.
    if (!s.usuario.admin) throw new Error("Esta conta não tem acesso de administrador.");
    definirToken(s.token);
    setSessao(s);
  };

  const sair = () => {
    definirToken(null);
    setSessao(null);
  };

  return (
    <AuthContext.Provider value={{ autenticado: sessao !== null, usuario: sessao?.usuario ?? null, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
