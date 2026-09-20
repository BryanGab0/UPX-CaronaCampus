import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { usePersistedState } from "../hooks/usePersistedState";
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
  salvar: (t: Trajeto) => void;
}
 
const PerfilContext = createContext<PerfilContextValue | null>(null);
 
export function PerfilProvider({ children }: { children: ReactNode }) {
  // Persistido: o trajeto cadastrado continua salvo ao recarregar.
  const [trajeto, setTrajeto] = usePersistedState<Trajeto>("carona:trajeto", TRAJETO_INICIAL);
  return <PerfilContext.Provider value={{ trajeto, salvar: setTrajeto }}>{children}</PerfilContext.Provider>;
}
 
export function usePerfilContext() {
  const ctx = useContext(PerfilContext);
  if (!ctx) throw new Error("usePerfilContext deve ser usado dentro de PerfilProvider");
  return ctx;
}
