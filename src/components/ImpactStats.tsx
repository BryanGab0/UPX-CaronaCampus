import { Wallet, Leaf, Car } from "lucide-react";
import { stats } from "../data/mock";
import type { IconeStat } from "../types";

// Mapa de chave -> ícone (mantém o mock como dado puro, sem JSX).
const ICONES: Record<IconeStat, typeof Wallet> = { wallet: Wallet, leaf: Leaf, car: Car };

// Faixa de impacto no topo da home (economia, CO2, caronas).
export function ImpactStats() {
  return (
    <div className="flex gap-2.5 px-[22px]">
      {stats.map((s, i) => {
        const Icone = ICONES[s.icone];
        return (
          <div key={i} className="flex-1 rounded-[15px] border border-line bg-surface p-3">
            <Icone size={16} className="mb-1.5 text-brand" />
            <div className="font-display text-[17px] font-bold tracking-tight">{s.valor}</div>
            <div className="mt-px text-[10.5px] leading-tight text-sub">{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}
