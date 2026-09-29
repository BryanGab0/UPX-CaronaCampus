import { useEffect, useState } from "react";

export function usePersistedState<T>(chave: string, inicial: T) {
  const [valor, setValor] = useState<T>(() => {
    try {
      const salvo = localStorage.getItem(chave);
      return salvo !== null ? (JSON.parse(salvo) as T) : inicial;
    } catch {
      return inicial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch {
      // ignora
    }
  }, [chave, valor]);
  return [valor, setValor] as const;
}
