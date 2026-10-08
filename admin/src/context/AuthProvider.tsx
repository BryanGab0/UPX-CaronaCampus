import type { ReactNode } from "react";
import { usePersistedState } from "../lib/usePersistedState";
import { login as apiLogin, definirToken } from "../lib/api";
import type { Sessao } from "../lib/api";
import { AuthContext } from "./AuthContext";

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
