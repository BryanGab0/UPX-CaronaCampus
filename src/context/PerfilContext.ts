import { createContext, useContext } from "react";
import type { Trajeto } from "../types";

// Contexto do trajeto do usuário: o componente PerfilProvider fica em PerfilProvider.tsx.

export interface PerfilContextValue {
  trajeto: Trajeto;
  salvar: (t: Trajeto) => Promise<void>;
}

export const PerfilContext = createContext<PerfilContextValue | null>(null);

export function usePerfilContext() {
  const ctx = useContext(PerfilContext);
  if (!ctx) throw new Error("usePerfilContext deve ser usado dentro de PerfilProvider");
  return ctx;
}
