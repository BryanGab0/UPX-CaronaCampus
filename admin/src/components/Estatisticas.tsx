import { useEffect, useState } from "react";
import { Users, Car, Route, Inbox } from "lucide-react";
import { buscarEstatisticas } from "../lib/api";
import type { Estatisticas as Est } from "../lib/api";
import { Carregando, ErroCarga } from "./Estado";

export function Estatisticas() {
  const [dados, setDados] = useState<Est | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    buscarEstatisticas().then(setDados).catch((e) => setErro(e instanceof Error ? e.message : "Falha"));
  }, []);

  const cards = [
    { icone: <Users size={20} />, label: "Usuários", valor: dados?.usuarios },
    { icone: <Car size={20} />, label: "Caronas", valor: dados?.caronas },
    { icone: <Route size={20} />, label: "Trajetos", valor: dados?.trajetos },
    { icone: <Inbox size={20} />, label: "Solicitações", valor: dados?.solicitacoes },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Estatísticas</h1>
      <p className="mt-1 text-sm text-sub">Visão geral do sistema.</p>

      {erro ? (
        <div className="mt-6"><ErroCarga msg={erro} /></div>
      ) : !dados ? (
        <Carregando />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-line bg-surface p-5">
              <div className="text-brand">{c.icone}</div>
              <div className="font-display mt-3 text-3xl font-bold tracking-tight">{c.valor}</div>
              <div className="mt-1 text-sm text-sub">{c.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
