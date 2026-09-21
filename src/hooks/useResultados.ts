import { useMemo } from "react";
import { usePerfilContext } from "../context/PerfilContext";
import { useCaronas } from "./useCaronas";
import { ranquear } from "../lib/match";
import { FACENS } from "../data/mock";
import { coordDoBairro } from "../data/bairros";
import type { Perfil } from "../types";
 
// Deriva o perfil do trajeto, ranqueia as caronas VINDAS DA API e
// repassa os estados de carga/erro para as telas.
export function useResultados() {
  const { trajeto } = usePerfilContext();
  const { caronas, carregando, erro } = useCaronas();
 
  const resultados = useMemo(() => {
    const perfil: Perfil = {
      origem: coordDoBairro(trajeto.bairro),
      chegada: trajeto.chegada,
      dias: trajeto.dias,
    };
    return ranquear(perfil, caronas, FACENS);
  }, [trajeto, caronas]);
 
  return { resultados, carregando, erro };
}
