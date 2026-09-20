import { useEffect, useState } from "react";
 
// Igual ao useState, mas o valor é lido e salvo no localStorage sob `chave`.
// Assim o estado sobrevive ao recarregar a página.
export function usePersistedState<T>(chave: string, inicial: T) {
  const [valor, setValor] = useState<T>(() => {
    try {
      const salvo = localStorage.getItem(chave);
      return salvo !== null ? (JSON.parse(salvo) as T) : inicial;
    } catch {
      return inicial; // ex.: navegador sem storage / modo privado
    }
  });
 
  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch {
      // ignora falha de escrita (não deve travar o app)
    }
  }, [chave, valor]);
 
  return [valor, setValor] as const;
}
