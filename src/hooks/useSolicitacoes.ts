import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { buscarSolicitacoes } from "../lib/api";
import type { MinhaSolicitacao } from "../lib/api";

// Solicitações de carona enviadas pelo usuário logado (lado passageiro).
export function useSolicitacoes() {
  const { ra } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState<MinhaSolicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!ra) return;
    let ativo = true; // evita atualizar estado após desmontar o componente
    buscarSolicitacoes(ra)
      .then((dados) => { if (ativo) { setSolicitacoes(dados); setErro(null); } })
      .catch((e: unknown) => { if (ativo) setErro(e instanceof Error ? e.message : "Falha ao carregar"); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [ra]);

  return { solicitacoes, carregando, erro };
}
