import { useSyncExternalStore } from "react";
import { assinarTema, escolherTema, preferenciaAtual } from "../lib/tema";

// Preferência de tema (claro/escuro/dispositivo) e a função para trocá-la.
// Atualiza também quando a escolha muda em outra aba.
export function usePreferenciaTema() {
  const preferencia = useSyncExternalStore(assinarTema, preferenciaAtual);
  return [preferencia, escolherTema] as const;
}
