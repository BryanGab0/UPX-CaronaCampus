import { useEffect, useState } from "react";
import { buscarCaronas } from "../lib/api";
import type { CaronaApi } from "../lib/api";

interface Estado { chave: string | null; versao: number; caronas: CaronaApi[]; erro: string | null; }

// Busca as caronas da API, expondo carregando/erro além dos dados.
// `chave` muda quando o trajeto salvo muda (a nota é calculada na API com ele): aí busca de novo.
// Com `chave` null (trajeto ainda carregando), espera em vez de buscar à toa.
// `recarregar` busca de novo (ex.: botão "Tentar novamente").
export function useCaronas(chave: string | null) {
  const [versao, setVersao] = useState(0);
  const [estado, setEstado] = useState<Estado | null>(null);

  useEffect(() => {
    if (chave === null) return;
    let ativo = true; // evita atualizar estado após desmontar ou após uma busca mais nova
    buscarCaronas()
      .then((caronas) => { if (ativo) setEstado({ chave, versao, caronas, erro: null }); })
      .catch((e: unknown) => {
        console.error(e);
        if (ativo) setEstado({ chave, versao, caronas: [], erro: e instanceof Error ? e.message : "Falha ao carregar" });
      });
    return () => { ativo = false; };
  }, [chave, versao]);

  // Derivado em vez de um "carregando" ligado num efeito: a resposta só vale para a busca atual.
  const atual = estado?.chave === chave && estado.versao === versao ? estado : null;
  const recarregar = () => setVersao((v) => v + 1);

  return { caronas: atual?.caronas ?? [], carregando: atual === null, erro: atual?.erro ?? null, recarregar };
}
