import { useEffect, useMemo, useState } from "react";
import { buscarSolicitacoes } from "../lib/api";
import type { SolicitacaoAdmin } from "../lib/api";
import { combina, paginar } from "../lib/filtro";
import { Carregando, ErroCarga } from "./Estado";
import { BarraFiltros, Busca, Opcoes, Paginacao, SemResultado } from "./Filtros";

type Status = "todas" | "pendente" | "aceita" | "recusada" | "cancelada";
const STATUS: { id: Status; texto: string }[] = [
  { id: "todas", texto: "Todas" }, { id: "pendente", texto: "Pendentes" }, { id: "aceita", texto: "Aceitas" }, { id: "recusada", texto: "Recusadas" },
  { id: "cancelada", texto: "Canceladas" },
];
const doStatus = (s: SolicitacaoAdmin, st: Status) => st === "todas" || s.status === st;

export function Solicitacoes() {
  const [lista, setLista] = useState<SolicitacaoAdmin[] | null>(null);
  const [erro, setErro] = useState(false);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    buscarSolicitacoes().then(setLista).catch((e: unknown) => { console.error(e); setErro(true); });
  }, [versao]);

  const tentar = () => { setErro(false); setVersao((v) => v + 1); };

  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<Status>("todas");
  const [pagina, setPagina] = useState(1);
  const limpar = () => { setBusca(""); setStatus("todas"); setPagina(1); };
  const filtrada = useMemo(
    () => (lista ?? []).filter((s) => doStatus(s, status) && combina([s.passageiroNome, s.motoristaNome], busca)),
    [lista, status, busca],
  );
  const pag = paginar(filtrada, pagina);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Solicitações</h1>
      <p className="mt-1 text-sm text-sub">{lista ? `${lista.length} no total` : erro ? "" : "Carregando…"}</p>

      {erro ? (
        <div className="mt-6"><ErroCarga onTentar={tentar} /></div>
      ) : !lista ? (
        <Carregando />
      ) : lista.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-line bg-surface p-6 text-center text-sm text-sub">Nenhuma solicitação ainda.</p>
      ) : (
        <>
        <BarraFiltros>
          <Busca valor={busca} onChange={(v) => { setBusca(v); setPagina(1); }} placeholder="Buscar por nome" rotulo="Buscar por nome do passageiro ou do motorista" />
          <Opcoes rotulo="Filtrar por status" valor={status} onChange={(v) => { setStatus(v); setPagina(1); }}
            opcoes={STATUS.map((o) => ({ ...o, total: lista.filter((s) => doStatus(s, o.id)).length }))} />
        </BarraFiltros>
        {filtrada.length === 0 ? <SemResultado onLimpar={limpar} /> : (
        <>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-sub">
              <tr>
                <th className="px-4 py-3 sm:px-5 font-semibold">Passageiro</th>
                <th className="px-4 py-3 sm:px-5 font-semibold">Motorista</th>
                <th className="px-4 py-3 sm:px-5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {pag.itens.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 sm:px-5 font-semibold">{s.passageiroNome}</td>
                  <td className="px-4 py-3 sm:px-5">{s.motoristaNome}</td>
                  <td className="px-4 py-3 sm:px-5">
                    <span className="rounded-md bg-canvas px-2 py-0.5 text-xs font-semibold capitalize text-sub">{s.status}</span>
                    {s.canceladoPor && <span className="ml-2 text-xs text-sub">pelo {s.canceladoPor}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paginacao pagina={pag} total={filtrada.length} onMudar={setPagina} />
        </>
        )}
        </>
      )}
    </div>
  );
}
