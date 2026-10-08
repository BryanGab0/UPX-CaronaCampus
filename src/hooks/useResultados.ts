import { useMemo } from "react";
import { usePerfilContext } from "../context/PerfilContext";
import { useCaronas } from "./useCaronas";
import { ranquear } from "../lib/match";
import { FACENS } from "../data/mock";
import type { Perfil } from "../types";

export function useResultados() {
  const { trajeto } = usePerfilContext();
  const { caronas, carregando, erro, recarregar } = useCaronas();

  const resultados = useMemo(() => {
    const perfil: Perfil = { origem: trajeto.origem, chegada: trajeto.chegada, dias: trajeto.dias };
    return ranquear(perfil, caronas, FACENS);
  }, [trajeto, caronas]);

  return { resultados, carregando, erro, recarregar };
}
