import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
 
// Domínio institucional. Ajuste se a Facens usar subdomínio para alunos.
export const DOMINIO_FACENS = "facens.br";
 
// Valida o e-mail institucional no formato RA@facens.br (RA = matrícula numérica).
export function emailInstitucional(email: string): boolean {
  const re = new RegExp(`^\\d+@${DOMINIO_FACENS.replace(".", "\\.")}$`, "i");
  return re.test(email.trim());
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
 
// Login PROVISÓRIO: guarda e-mail + nome em memória.
// (futuramente a validação/identidade virá da própria Facens)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [autenticado, setAutenticado] = useState(false);
 
  const entrar = (e: string, n: string) => {
    setEmail(e.trim());
    setNome(n.trim());
    setAutenticado(true);
  };
  const sair = () => {
    setEmail("");
    setNome("");
    setAutenticado(false);
  };
 
  const ra = email.split("@")[0];
 
  return (
    <AuthContext.Provider value={{ autenticado, nome, email, ra, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}
 
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
