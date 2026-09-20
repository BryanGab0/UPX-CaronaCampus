import { useMemo } from "react";
import { usePerfilContext } from "../context/PerfilContext";
import { ranquear } from "../lib/match";
import { caronas, FACENS } from "../data/mock";
import { coordDoBairro } from "../data/bairros";
import type { Perfil } from "../types";
 
// Converte o trajeto cadastrado em Perfil (entrada do algoritmo) e ranqueia.
// useMemo: só recalcula quando o trajeto muda.
export function useResultados() {
  const { trajeto } = usePerfilContext();
  return useMemo(() => {
    const perfil: Perfil = {
      origem: coordDoBairro(trajeto.bairro),
      chegada: trajeto.chegada,
      dias: trajeto.dias,
    };
    return ranquear(perfil, caronas, FACENS);
  }, [trajeto]);
}
