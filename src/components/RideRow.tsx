import { MapPin, Clock } from "lucide-react";
import { cn } from "../lib/cn";
import type { Carona } from "../types";

// Uma linha do feed "outras compatíveis". Recebe a carona por prop
// (é reutilizada várias vezes, então não busca dado sozinha).
export function RideRow({ carona }: { carona: Carona }) {
  const iniciais = carona.nome.split(" ").slice(0, 2).map((n) => n[0]).join("");
  const cor = carona.compat >= 75 ? "text-good" : carona.compat >= 50 ? "text-brand" : "text-accent";

  return (
    <button className="mb-2.5 flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left transition active:scale-[.98]">
      <div className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-canvas text-sm font-bold text-ink">{iniciais}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-bold">{carona.nome}</div>
        <div className="mt-0.5 flex items-center gap-2.5 text-xs text-sub">
          <span className="inline-flex items-center gap-1"><MapPin size={12} />{carona.bairro}</span>
          <span className="inline-flex items-center gap-1"><Clock size={12} />{carona.chegada}</span>
        </div>
      </div>
      <div className="text-right">
        <div className={cn("font-display text-sm font-bold", cor)}>{carona.compat}%</div>
        <div className="mt-px text-[11.5px] text-sub">R$ {carona.custoDia}</div>
      </div>
    </button>
  );
}
