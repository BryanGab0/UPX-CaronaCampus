import { Wallet, Leaf, Car } from "lucide-react";
import type { Impacto } from "../lib/impacto";

export function ImpactStats({ impacto }: { impacto: Impacto }) {
  const cards = [
    { Icone: Wallet, valor: `R$ ${Math.round(impacto.economiaMes)}`, label: "economia no mês (estim.)" },
    { Icone: Leaf, valor: `${Math.round(impacto.co2Mes)} kg`, label: "CO₂ evitado no mês" },
    { Icone: Car, valor: String(impacto.caronas), label: impacto.caronas === 1 ? "carona aceita" : "caronas aceitas" },
  ];

  return (
    <div className="px-[22px]">
      <div className="flex gap-2 min-[360px]:gap-2.5">
        {cards.map(({ Icone, valor, label }) => (
          <div key={label} className="min-w-0 flex-1 rounded-[15px] border border-line bg-surface p-2.5 min-[360px]:p-3">
            <Icone size={16} className="mb-1.5 text-brand" />
            <div className="truncate font-display text-[15px] font-bold tracking-tight min-[360px]:text-[17px]">{valor}</div>
            <div className="mt-px text-[10.5px] leading-tight text-sub">{label}</div>
          </div>
        ))}
      </div>
      {impacto.caronas === 0 && (
        <p className="mt-2 text-xs text-sub">Solicite ou aceite uma carona para ver seu impacto aqui.</p>
      )}
    </div>
  );
}
