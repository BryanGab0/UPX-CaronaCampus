import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { usePersistedState } from "../hooks/usePersistedState";
 
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
  ra: string; // matrícula (parte antes do @)
  entrar: (email: string, nome: string) => void;
  sair: () => void;
}
 
const AuthContext = createContext<AuthContextValue | null>(null);
 
// Login PROVISÓRIO, agora persistido: a sessão sobrevive ao recarregar a página.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = usePersistedState<Sessao | null>("carona:sessao", null);
 
  const entrar = (email: string, nome: string) => setSessao({ email: email.trim(), nome: nome.trim() });
  const sair = () => setSessao(null);
 
  const email = sessao?.email ?? "";
  const nome = sessao?.nome ?? "";
 
  return (
    <AuthContext.Provider
      value={{ autenticado: sessao !== null, nome, email, ra: email.split("@")[0], entrar, sair }}
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
