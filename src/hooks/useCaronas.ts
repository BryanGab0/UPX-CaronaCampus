import { useEffect, useState } from "react";
import { buscarCaronas } from "../lib/api";
import type { Carona } from "../types";
 
// Busca as caronas da API uma vez, expondo carregando/erro além dos dados.
export function useCaronas() {
  const [caronas, setCaronas] = useState<Carona[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
 
  useEffect(() => {
    let ativo = true; // evita atualizar estado após desmontar o componente
    buscarCaronas()
      .then((dados) => { if (ativo) { setCaronas(dados); setErro(null); } })
      .catch((e: unknown) => { if (ativo) setErro(e instanceof Error ? e.message : "Falha ao carregar"); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);
 
  return { caronas, carregando, erro };
}
