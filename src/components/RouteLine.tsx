import { Star } from "lucide-react";
import { cn } from "../lib/cn";

export function RouteLine({ origem, ponto, destino }: { origem: string; ponto: string; destino: string }) {
  return (
    <div className="mt-[18px]">
      <div className="flex items-center">
        <Node /><Seg /><Node estrela /><Seg /><Node quadrado />
      </div>
      <div className="mt-[7px] flex justify-between text-[10.5px] text-white/85">
        <span>{origem}</span>
        <span className="font-semibold text-white">{ponto}</span>
        <span>{destino}</span>
      </div>
    </div>
  );
}

function Node({ estrela, quadrado }: { estrela?: boolean; quadrado?: boolean }) {
  return (
    <div className={cn("grid size-[15px] shrink-0 place-items-center", quadrado ? "rounded-[4px]" : "rounded-full",
      estrela ? "bg-accent shadow-[0_0_0_4px_rgba(255,122,69,.27)]" : "bg-white")}>
      {estrela && <Star size={8} className="fill-white text-white" />}
    </div>
  );
}

function Seg() {
  return <div className="mx-1 h-[2.5px] flex-1 rounded-sm bg-white/40" />;
}
