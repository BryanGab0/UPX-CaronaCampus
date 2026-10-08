import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { Car, Clock, Wallet, MapPin, Navigation } from "lucide-react";
import { reais } from "../lib/match";
import type { Resultado } from "../lib/match";
import { CompatRing } from "./CompatRing";

export function BestRideCard({ resultado }: { resultado: Resultado }) {
  const navigate = useNavigate();
  const { carona, compat, custoDia } = resultado;
  const iniciais = carona.nome.split(" ").slice(0, 2).map((n) => n[0]).join("");

  return (
    <div className="relative overflow-hidden rounded-[22px] bg-linear-to-br from-brand to-brand-dark p-5 text-white shadow-[0_18px_40px_rgba(47,75,255,.27)]">
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
      <div className="relative flex items-center gap-3">
        <div className="grid size-[50px] shrink-0 place-items-center rounded-[15px] bg-white/20 text-[17px] font-bold">{iniciais}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16.5px] font-bold">{carona.nome}</div>
          <div className="mt-px flex items-center gap-1.5 text-xs opacity-85"><Car size={13} className="shrink-0" /> <span className="truncate">{carona.carro}</span></div>
        </div>
        <CompatRing valor={compat} light />
      </div>

      <div className="relative mt-3 flex items-center gap-1.5 text-xs opacity-90">
        <MapPin size={13} className="shrink-0" /> <span className="truncate">{carona.endereco}</span>
        <Navigation size={13} className="ml-1 shrink-0" /> Facens
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <Pill icone={<Clock size={13} />} texto={`chega ${carona.chegada}`} />
        <Pill icone={<Wallet size={13} />} texto={`${reais(custoDia)}/dia`} />
      </div>

      <button
        onClick={() => navigate(`/carona/${carona.id}`)}
        className="relative mt-4 w-full rounded-[13px] bg-white py-3.5 text-sm font-bold text-brand transition active:scale-[.98]"
      >
        Ver detalhes e solicitar
      </button>
    </div>
  );
}

function Pill({ icone, texto }: { icone: ReactNode; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[9px] bg-white/15 px-2.5 py-1.5 text-[11.5px] font-semibold">
      {icone}{texto}
    </span>
  );
}
