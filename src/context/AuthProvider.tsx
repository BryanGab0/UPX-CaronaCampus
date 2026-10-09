import type { ReactNode } from "react";
import { usePersistedState } from "../hooks/usePersistedState";
import { login as apiLogin, registrar as apiRegistrar, definirToken } from "../lib/api";
import type { Sessao } from "../lib/api";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = usePersistedState<Sessao | null>("carona:sessao", null);

  // Mantém o token do api em sincronia com a sessão (síncrono: evita corrida
  // com efeitos filhos que fazem requisições logo após o login/recarregar).
  definirToken(sessao?.token ?? null);

  const login = async (email: string, senha: string) => {
    const ra = email.trim().split("@")[0];
    const s = await apiLogin(ra, senha);
    definirToken(s.token);
    setSessao(s);
  };

  const registrar = async (email: string, nome: string, telefone: string, senha: string) => {
    const e = email.trim();
    const ra = e.split("@")[0];
    const s = await apiRegistrar(ra, nome.trim(), e, telefone, senha);
    definirToken(s.token);
    setSessao(s);
  };

  const sair = () => {
    definirToken(null);
    setSessao(null);
  };

  const u = sessao?.usuario;
  return (
    <AuthContext.Provider
      value={{ autenticado: sessao !== null, nome: u?.nome ?? "", email: u?.email ?? "", ra: u?.ra ?? "", login, registrar, sair }}
    >
      {children}
    </AuthContext.Provider>
  );
}
