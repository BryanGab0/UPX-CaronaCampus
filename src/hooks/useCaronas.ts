import { useEffect, useState } from "react";
import { buscarCaronas } from "../lib/api";
import type { Carona } from "../types";

// Busca as caronas da API, expondo carregando/erro além dos dados.
// `recarregar` busca de novo (ex.: botão "Tentar novamente").
export function useCaronas() {
  const [caronas, setCaronas] = useState<Carona[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true; // evita atualizar estado após desmontar o componente
    buscarCaronas()
      .then((dados) => { if (ativo) { setCaronas(dados); setErro(null); } })
      .catch((e: unknown) => {
        console.error(e);
        if (ativo) setErro(e instanceof Error ? e.message : "Falha ao carregar");
      })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [versao]);

  const recarregar = () => { setCarregando(true); setVersao((v) => v + 1); };

  return { caronas, carregando, erro, recarregar };
}
