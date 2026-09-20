import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Trajeto } from "../types";
 
// Trajeto inicial (Ana). Depois pode vir de um "salvo" real / back-end.
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
 
// Provedor: mantém o trajeto em estado e o disponibiliza para toda a árvore.
export function PerfilProvider({ children }: { children: ReactNode }) {
  const [trajeto, setTrajeto] = useState<Trajeto>(TRAJETO_INICIAL);
  return <PerfilContext.Provider value={{ trajeto, salvar: setTrajeto }}>{children}</PerfilContext.Provider>;
}
 
// Hook de acesso. Garante que só é usado dentro do provedor.
export function usePerfilContext() {
  const ctx = useContext(PerfilContext);
  if (!ctx) throw new Error("usePerfilContext deve ser usado dentro de PerfilProvider");
  return ctx;
}
