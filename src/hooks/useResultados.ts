import { useMemo } from "react";
import { usePerfilContext } from "../context/PerfilContext";
import { useCaronas } from "./useCaronas";
import { paraResultados } from "../lib/resultados";

// Caronas já ranqueadas pela API, com a nota calculada a partir do trajeto salvo do usuário.
export function useResultados() {
  const { trajeto, pronto } = usePerfilContext();
  // Ao salvar outro trajeto, a nota muda: a chave faz a lista ser buscada de novo.
  const chave = pronto ? JSON.stringify([trajeto.origem, trajeto.chegada, trajeto.dias]) : null;
  const { caronas, carregando, erro, recarregar } = useCaronas(chave);
  const resultados = useMemo(() => paraResultados(caronas), [caronas]);
  return { resultados, carregando, erro, recarregar };
}
