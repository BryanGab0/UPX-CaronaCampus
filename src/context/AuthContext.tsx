import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { usePersistedState } from "../hooks/usePersistedState";
import { registrarUsuario } from "../lib/api";
 
export const DOMINIO_FACENS = "facens.br";
 
// Valida o e-mail institucional no formato RA@facens.br (RA = matrícula numérica).
export function emailInstitucional(email: string): boolean {
  const re = new RegExp(`^\\d+@${DOMINIO_FACENS.replace(".", "\\.")}$`, "i");
  return re.test(email.trim());
}
 
interface Sessao {
  email: string;
  nome: string;
}
 
interface AuthContextValue {
  autenticado: boolean;
  nome: string;
  email: string;
  ra: string;
  entrar: (email: string, nome: string) => void;
  sair: () => void;
}
 
const AuthContext = createContext<AuthContextValue | null>(null);
 
export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = usePersistedState<Sessao | null>("carona:sessao", null);
 
  const entrar = (email: string, nome: string) => {
    const e = email.trim();
    const n = nome.trim();
    setSessao({ email: e, nome: n });
    // Registra o usuário no banco. Melhor-esforço: não bloqueia o login se a API cair.
    registrarUsuario(e.split("@")[0], n, e).catch(() => {});
  };
  const sair = () => setSessao(null);
 
  const email = sessao?.email ?? "";
  const nome = sessao?.nome ?? "";
 
  return (
    <AuthContext.Provider value={{ autenticado: sessao !== null, nome, email, ra: email.split("@")[0], entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}
 
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
