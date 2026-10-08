import { useEffect, useState } from "react";
import { buscarSolicitacoes } from "../lib/api";
import type { SolicitacaoAdmin } from "../lib/api";
import { Carregando, ErroCarga } from "./Estado";

export function Solicitacoes() {
  const [lista, setLista] = useState<SolicitacaoAdmin[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    buscarSolicitacoes().then(setLista).catch((e) => setErro(e instanceof Error ? e.message : "Falha"));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Solicitações</h1>
      <p className="mt-1 text-sm text-sub">{lista ? `${lista.length} no total` : "Carregando…"}</p>

      {erro ? (
        <div className="mt-6"><ErroCarga msg={erro} /></div>
      ) : !lista ? (
        <Carregando />
      ) : lista.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-line bg-surface p-6 text-center text-sm text-sub">Nenhuma solicitação ainda.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-sub">
              <tr>
                <th className="px-5 py-3 font-semibold">Passageiro</th>
                <th className="px-5 py-3 font-semibold">Motorista</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-semibold">{s.passageiroNome}</td>
                  <td className="px-5 py-3">{s.motoristaNome}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-canvas px-2 py-0.5 text-xs font-semibold capitalize text-sub">{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
