import { Link } from "react-router";
import { MapPin, Clock } from "lucide-react";
import { cn } from "../lib/cn";
import type { Resultado } from "../lib/match";

// Linha do feed. Recebe o Resultado do algoritmo (carona + compatibilidade calculada)
export function RideRow({ resultado }: { resultado: Resultado }) {
  const { carona, compat } = resultado;
  const iniciais = carona.nome.split(" ").slice(0, 2).map((n) => n[0]).join("");
  const cor = compat >= 75 ? "text-good" : compat >= 50 ? "text-brand" : "text-accent";
 
  return (
    <Link
      to={`/carona/${carona.id}`}
      className="mb-2.5 flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left transition active:scale-[.98]"
    >
      <div className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-canvas text-sm font-bold text-ink">{iniciais}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-bold">{carona.nome}</div>
        <div className="mt-0.5 flex items-center gap-2.5 text-xs text-sub">
          <span className="inline-flex items-center gap-1"><MapPin size={12} />{carona.bairro}</span>
          <span className="inline-flex items-center gap-1"><Clock size={12} />{carona.chegada}</span>
        </div>
      </div>
      <div className="text-right">
        <div className={cn("font-display text-sm font-bold", cor)}>{compat}%</div>
        <div className="mt-px text-[11.5px] text-sub">R$ {carona.custoDia}</div>
      </div>
    </Link>
  );
}
