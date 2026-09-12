import type { ReactNode } from "react";
import { Car, Clock, Footprints, Wallet } from "lucide-react";
import { melhor } from "../data/mock";
import { RouteLine } from "./RouteLine";
import { CompatRing } from "./CompatRing";

// Card em destaque (hero): a melhor carona do dia.
// Único elemento com peso visual forte na tela — o resto fica quieto.
export function BestRideCard() {
  const iniciais = melhor.nome.split(" ").slice(0, 2).map((n) => n[0]).join("");

  return (
    <div className="relative overflow-hidden rounded-[22px] bg-linear-to-br from-brand to-brand-dark p-5 text-white shadow-[0_18px_40px_rgba(47,75,255,.27)]">
      {/* círculo decorativo que "vaza" no canto */}
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />

      <div className="relative flex items-center gap-3">
        <div className="grid size-[50px] place-items-center rounded-[15px] bg-white/20 text-[17px] font-bold">{iniciais}</div>
        <div className="flex-1">
          <div className="text-[16.5px] font-bold">{melhor.nome}</div>
          <div className="mt-px flex items-center gap-1.5 text-xs opacity-85">
            <Car size={13} /> {melhor.carro} · {melhor.bairro}
          </div>
        </div>
        <CompatRing valor={melhor.compat} light />
      </div>

      <RouteLine origem="Você" ponto={melhor.ponto} destino="Campus" />

      <div className="relative mt-4 flex gap-2">
        <Pill icone={<Clock size={13} />} texto={`chega ${melhor.chegada}`} />
        <Pill icone={<Footprints size={13} />} texto={melhor.caminhada} />
        <Pill icone={<Wallet size={13} />} texto={`R$ ${melhor.custoDia}/dia`} />
      </div>

      <button className="relative mt-4 w-full rounded-[13px] bg-white py-3.5 text-sm font-bold text-brand transition active:scale-[.98]">
        Ver detalhes e solicitar
      </button>
    </div>
  );
}

// Etiqueta translúcida usada no rodapé do card (horário, caminhada, custo).
function Pill({ icone, texto }: { icone: ReactNode; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[9px] bg-white/15 px-2.5 py-1.5 text-[11.5px] font-semibold">
      {icone}
      {texto}
    </span>
  );
}
