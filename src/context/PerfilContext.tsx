import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { buscarTrajeto, salvarTrajeto } from "../lib/api";
import type { Trajeto } from "../types";
 
const TRAJETO_INICIAL: Trajeto = {
  papel: "passageiro",
  bairro: "Campolim",
  dias: ["seg", "ter", "qua", "qui", "sex"],
  chegada: "08:00",
  saida: "18:00",
  carro: { modelo: "", lugares: 4, consumo: 12 },
};
 
interface PerfilContextValue {
  trajeto: Trajeto;
  salvar: (t: Trajeto) => Promise<void>;
}
 
const PerfilContext = createContext<PerfilContextValue | null>(null);
 
export function PerfilProvider({ children }: { children: ReactNode }) {
  const { autenticado, ra } = useAuth();
  const [trajeto, setTrajeto] = useState<Trajeto>(TRAJETO_INICIAL);
 
  // Ao logar, carrega o trajeto salvo do usuário no banco (fonte da verdade).
  useEffect(() => {
    if (!autenticado || !ra) {
      setTrajeto(TRAJETO_INICIAL);
      return;
    }
    buscarTrajeto(ra)
      .then((t) => setTrajeto(t ?? TRAJETO_INICIAL))
      .catch(() => {});
  }, [autenticado, ra]);
 
  // Salva no banco e, dando certo, atualiza o estado local.
  const salvar = async (t: Trajeto) => {
    if (ra) await salvarTrajeto(ra, t);
    setTrajeto(t);
  };
 
  return <PerfilContext.Provider value={{ trajeto, salvar }}>{children}</PerfilContext.Provider>;
}
 
export function usePerfilContext() {
  const ctx = useContext(PerfilContext);
  if (!ctx) throw new Error("usePerfilContext deve ser usado dentro de PerfilProvider");
  return ctx;
}
