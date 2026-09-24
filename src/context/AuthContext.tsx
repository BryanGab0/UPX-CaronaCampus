import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { usePersistedState } from "../hooks/usePersistedState";
import { login as apiLogin, registrar as apiRegistrar, definirToken } from "../lib/api";
import type { Sessao } from "../lib/api";
 
export const DOMINIO_FACENS = "facens.br";
 
export function emailInstitucional(email: string): boolean {
  const re = new RegExp(`^\\d+@${DOMINIO_FACENS.replace(".", "\\.")}$`, "i");
  return re.test(email.trim());
}
 
interface AuthContextValue {
  autenticado: boolean;
  nome: string;
  email: string;
  ra: string;
  login: (email: string, senha: string) => Promise<void>;
  registrar: (email: string, nome: string, senha: string) => Promise<void>;
  sair: () => void;
}
 
const AuthContext = createContext<AuthContextValue | null>(null);
 
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
 
  const registrar = async (email: string, nome: string, senha: string) => {
    const e = email.trim();
    const ra = e.split("@")[0];
    const s = await apiRegistrar(ra, nome.trim(), e, senha);
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
 
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
