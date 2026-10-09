import { Link } from "react-router";
import { MapPin, Clock } from "lucide-react";
import { cn } from "../lib/cn";
import { iniciais } from "../lib/formato";
import { reais } from "../lib/match";
import type { Resultado } from "../lib/match";
import { NotaMedia } from "./Estrelas";

export function RideRow({ resultado }: { resultado: Resultado }) {
  const { carona, compat, custoDia } = resultado;
  const cor = compat >= 75 ? "text-good-ink" : compat >= 50 ? "text-brand" : "text-accent-ink";

  return (
    <Link
      to={`/carona/${carona.id}`}
      className="mb-2.5 flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left transition active:scale-[.98]"
    >
      <div className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-canvas text-sm font-bold text-ink">{iniciais(carona.nome)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate text-[14.5px] font-bold">{carona.nome}</span>
          <NotaMedia media={carona.notaMedia} total={carona.totalAvaliacoes} />
        </div>
        <div className="mt-0.5 flex items-center gap-2.5 text-xs text-sub">
          <span className="inline-flex min-w-0 items-center gap-1"><MapPin size={12} className="shrink-0" /><span className="truncate">{carona.endereco}</span></span>
          <span className="inline-flex shrink-0 items-center gap-1"><Clock size={12} />{carona.chegada}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className={cn("font-display text-sm font-bold", cor)}>{compat}%</div>
        <div className="mt-px text-[11.5px] text-sub">{reais(custoDia)}</div>
      </div>
    </Link>
  );
}
