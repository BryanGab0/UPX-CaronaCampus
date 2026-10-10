import { useState } from "react";
import type { ReactNode } from "react";
import { usePersistedState } from "../lib/usePersistedState";
import { login as apiLogin, definirToken, definirAoEncerrar } from "../lib/api";
import type { Sessao } from "../lib/api";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = usePersistedState<Sessao | null>("carona-admin:sessao", null);

  definirToken(sessao?.token ?? null); // sincroniza o token do api

  // Se a API recusar a sessão (expirou, senha trocada, conta bloqueada ou sem acesso de admin),
  // encerra e explica o motivo no login.
  const [avisoSaida, setAvisoSaida] = useState<string | null>(null);
  definirAoEncerrar((motivo) => {
    definirToken(null);
    setSessao(null);
    setAvisoSaida(motivo);
  });

  const entrar = async (email: string, senha: string) => {
    const ra = email.trim().split("@")[0];
    const s = await apiLogin(ra, senha);
    // Só entra se a conta for de administrador.
    if (!s.usuario.admin) throw new Error("Esta conta não tem acesso de administrador.");
    definirToken(s.token);
    setSessao(s);
    setAvisoSaida(null);
  };

  const sair = () => {
    definirToken(null);
    setSessao(null);
  };

  return (
    <AuthContext.Provider value={{ autenticado: sessao !== null, usuario: sessao?.usuario ?? null, entrar, sair, avisoSaida }}>
      {children}
    </AuthContext.Provider>
  );
}
