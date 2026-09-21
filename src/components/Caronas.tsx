import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { cn } from "../lib/cn";
import { useResultados } from "../hooks/useResultados";
import { RideRow } from "./RideRow";
import { Carregando, ErroCarga } from "./Estado";
 
type Ordem = "compat" | "custo" | "horario";
 
const ORDENS: { id: Ordem; label: string }[] = [
  { id: "compat", label: "Compatibilidade" },
  { id: "custo", label: "Menor custo" },
  { id: "horario", label: "Mais cedo" },
];
 
const paraNumero = (v: string) => Number(v.replace(",", "."));
 
export function Caronas() {
  const { resultados, carregando, erro } = useResultados();
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("compat");
 
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const filtrada = resultados.filter(
      (r) => r.carona.nome.toLowerCase().includes(q) || r.carona.bairro.toLowerCase().includes(q),
    );
    const ordenada = [...filtrada];
    if (ordem === "custo") {
      ordenada.sort((a, b) => paraNumero(a.carona.custoDia) - paraNumero(b.carona.custoDia));
    } else if (ordem === "horario") {
      ordenada.sort((a, b) => a.carona.chegada.localeCompare(b.carona.chegada));
    }
    return ordenada;
  }, [resultados, busca, ordem]);
 
  return (
    <div className="animate-rise px-[22px] pt-[46px]">
      <h1 className="font-display text-[26px] font-bold tracking-tight">Caronas</h1>
      <p className="mt-1 text-sm text-sub">
        {carregando ? "buscando…" : `${resultados.length} compatíveis com o seu trajeto`}
      </p>
 
      <div className="mt-4 flex items-center gap-2.5 rounded-[14px] border border-line bg-surface px-3.5 py-3">
        <Search size={18} className="text-sub" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou bairro"
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>
 
      <div className="mt-3 flex gap-2">
        {ORDENS.map((o) => (
          <button
            key={o.id}
            onClick={() => setOrdem(o.id)}
            className={cn(
              "rounded-[11px] border px-3 py-1.5 text-xs font-semibold transition active:scale-[.98]",
              ordem === o.id ? "border-brand bg-brand text-white" : "border-line bg-surface text-sub",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
 
      {carregando ? (
        <Carregando />
      ) : erro ? (
        <ErroCarga msg={erro} />
      ) : (
        <div className="mt-4">
          {lista.length === 0 ? (
            <p className="py-16 text-center text-sm text-sub">Nenhuma carona encontrada.</p>
          ) : (
            lista.map((r) => <RideRow key={r.carona.id} resultado={r} />)
          )}
        </div>
      )}
    </div>
  );
}
