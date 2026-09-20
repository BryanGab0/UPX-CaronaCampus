import { Bell, Navigation, ChevronRight, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePerfilContext } from "../context/PerfilContext";
import { useResultados } from "../hooks/useResultados";
import { ImpactStats } from "./ImpactStats";
import { BestRideCard } from "./BestRideCard";
import { RideRow } from "./RideRow";
 
export function Home() {
  const { nome } = useAuth();
  const { trajeto } = usePerfilContext();
  const resultados = useResultados(); // recalcula quando o trajeto muda
  const melhor = resultados[0];
  const outras = resultados.slice(1);
 
  return (
    <div className="animate-rise">
      <div className="px-[22px] pb-[18px] pt-[46px]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-sub">Bom dia,</div>
            <h1 className="font-display text-[27px] font-bold tracking-tight">{nome.split(" ")[0]}</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="relative grid size-10 place-items-center rounded-xl border border-line bg-surface transition active:scale-[.98]">
              <Bell size={18} className="text-sub" />
              <span className="absolute right-2.5 top-2.5 size-[7px] rounded-full border-2 border-surface bg-accent" />
            </button>
            <div className="grid size-10 place-items-center rounded-xl bg-brand text-sm font-bold text-white">{nome[0]}</div>
          </div>
        </div>
 
        <button className="mt-4 flex w-full items-center gap-2.5 rounded-[14px] border border-line bg-surface px-3.5 py-3 text-left transition active:scale-[.98]">
          <div className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-brand-soft">
            <Navigation size={16} className="text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] text-sub">seu trajeto</div>
            <div className="truncate text-[13.5px] font-semibold">{trajeto.bairro} → Facens</div>
          </div>
          <ChevronRight size={18} className="text-sub" />
        </button>
      </div>
 
      <ImpactStats />
 
      <div className="px-[22px] pb-2 pt-[22px]">
        <div className="mb-3 flex items-center gap-1.5">
          <Star size={15} className="fill-accent text-accent" />
          <span className="text-sm font-bold">Melhor carona pra você hoje</span>
        </div>
        {melhor && <BestRideCard resultado={melhor} />}
      </div>
 
      <div className="flex items-center justify-between px-[22px] pb-2 pt-[18px]">
        <span className="text-sm font-bold">Outras compatíveis</span>
        <button className="text-xs font-semibold text-brand">ver todas</button>
      </div>
      <div className="px-4">
        {outras.map((r) => (
          <RideRow key={r.carona.id} resultado={r} />
        ))}
      </div>
    </div>
  );
}
