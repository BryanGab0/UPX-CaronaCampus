import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { usePerfilContext } from "../context/PerfilContext";
import { cn } from "../lib/cn";
import { useResultados } from "../hooks/useResultados";
import { RideRow } from "./RideRow";
import { lotadosNoFim } from "../lib/vagas";
import { ErroCarga, EsqueletoLista, EstadoVazio, SemMotoristas, SemTrajeto } from "./Estado";

type Ordem = "compat" | "custo" | "horario";
const ORDENS: { id: Ordem; label: string }[] = [
  { id: "compat", label: "Compatibilidade" },
  { id: "custo", label: "Menor custo" },
  { id: "horario", label: "Mais cedo" },
];

export function Caronas() {
  const { resultados, carregando, erro, recarregar } = useResultados();
  const { trajeto, pronto, temTrajeto } = usePerfilContext();
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("compat");

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const filtrada = resultados.filter(
      (r) => r.carona.nome.toLowerCase().includes(q) || r.carona.endereco.toLowerCase().includes(q),
    );
    const ordenada = [...filtrada];
    if (ordem === "custo") ordenada.sort((a, b) => a.custoDia - b.custoDia);
    else if (ordem === "horario") ordenada.sort((a, b) => a.carona.chegada.localeCompare(b.carona.chegada));
    return lotadosNoFim(ordenada);
  }, [resultados, busca, ordem]);

  return (
    <div className="animate-rise px-[22px] pt-[46px]">
      <h1 className="font-display text-[26px] font-bold tracking-tight">Caronas</h1>
      <p className="mt-1 text-sm text-sub">{carregando || !pronto ? "buscando…" : !temTrajeto ? "cadastre seu trajeto para ver as compatíveis" : `${resultados.length} compatíveis com o seu trajeto`}</p>

      <div className="mt-4 flex items-center gap-2.5 rounded-[14px] border border-line bg-surface px-3.5 py-3 transition focus-within:border-brand">
        <Search size={18} className="shrink-0 text-sub" />
        <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou endereço" aria-label="Buscar carona por nome ou endereço"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
      </div>

      {/* Em telas estreitas os filtros rolam de lado em vez de quebrar linha. */}
      <div role="group" aria-label="Ordenar caronas" className="no-scrollbar -mx-[22px] mt-3 flex gap-2 overflow-x-auto px-[22px] py-1">
        {ORDENS.map((o) => (
          <button key={o.id} onClick={() => setOrdem(o.id)} aria-pressed={ordem === o.id}
            className={cn("shrink-0 whitespace-nowrap rounded-[11px] border px-3 py-1.5 text-xs font-semibold transition active:scale-[.98]",
              ordem === o.id ? "border-brand bg-brand text-white" : "border-line bg-surface text-sub")}>
            {o.label}
          </button>
        ))}
      </div>

      {carregando || !pronto ? (
        <EsqueletoLista quantidade={4} className="mt-4" />
      ) : erro ? (
        <ErroCarga onTentar={recarregar} />
      ) : !temTrajeto ? (
        <SemTrajeto className="mt-4" />
      ) : resultados.length === 0 ? (
        <SemMotoristas souMotorista={trajeto.papel === "motorista"} className="mt-4" />
      ) : (
        <div className="mt-4">
          {lista.length === 0 ? (
            <EstadoVazio icone={<Search size={22} />} titulo={`Nada encontrado para “${busca.trim()}”`}
              texto="Tente outro nome ou bairro, ou limpe a busca para ver todas as caronas."
              acao={{ texto: "Limpar busca", onClick: () => setBusca("") }} />
          ) : (
            lista.map((r) => <RideRow key={r.carona.id} resultado={r} />)
          )}
        </div>
      )}
    </div>
  );
}
