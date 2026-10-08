import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { buscarPedidos } from "../lib/api";
import type { Pedido } from "../lib/api";

// Pedidos de carona recebidos pelo usuário logado (lado motorista).
// `recarregar` busca de novo, ex.: depois de aceitar/recusar ou de uma falha.
export function usePedidos() {
  const { ra } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    if (!ra) return;
    let ativo = true; // evita atualizar estado após desmontar o componente
    buscarPedidos(ra)
      .then((dados) => { if (ativo) { setPedidos(dados); setErro(null); } })
      .catch((e: unknown) => {
        console.error(e);
        if (ativo) setErro(e instanceof Error ? e.message : "Falha ao carregar");
      })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [ra, versao]);

  // Só mostra o "carregando" ao tentar de novo após um erro; depois de aceitar/recusar,
  // a lista atual continua na tela enquanto a nova chega (sem piscar).
  const recarregar = () => { if (erro) setCarregando(true); setVersao((v) => v + 1); };
  const pendentes = pedidos.filter((p) => p.status === "pendente").length;

  return { pedidos, pendentes, carregando, erro, recarregar };
}
