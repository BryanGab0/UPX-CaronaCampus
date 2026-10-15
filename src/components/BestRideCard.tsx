import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { Car, Clock, Wallet, MapPin, Navigation, Users } from "lucide-react";
import { iniciais } from "../lib/formato";
import { reais } from "../lib/match";
import type { Resultado } from "../lib/match";
import { CompatRing } from "./CompatRing";
import { NotaMedia } from "./Estrelas";
import { textoVagas } from "../lib/vagas";
import { resumoHorario, textoHorario } from "../lib/horarios";

export function BestRideCard({ resultado }: { resultado: Resultado }) {
  const navigate = useNavigate();
  const { carona, compat, custoTrecho, trechosComuns } = resultado;

  return (
    <div className="relative overflow-hidden rounded-[22px] bg-linear-to-br from-brand to-brand-dark p-5 text-on-brand sombra-brand-lg">
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-on-brand/10" />
      <div className="relative flex items-center gap-3">
        <div className="grid size-[50px] shrink-0 place-items-center rounded-[15px] bg-on-brand/20 text-[17px] font-bold">{iniciais(carona.nome)}</div>
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
        <Pill icone={<Clock size={13} />} texto={textoHorario(resumoHorario(carona.horarios, trechosComuns))} />
        <Pill icone={<Wallet size={13} />} texto={`${reais(custoTrecho)}/viagem`} />
        <Pill icone={<Users size={13} />} texto={textoVagas(carona)} />
        <span className="inline-flex items-center rounded-[9px] bg-on-brand/15 px-2.5 py-1.5">
          <NotaMedia media={carona.notaMedia} total={carona.totalAvaliacoes} className="text-on-brand [&_svg]:text-on-brand" />
        </span>
      </div>

      <button
        onClick={() => navigate(`/carona/${carona.id}`)}
        className="relative mt-4 w-full rounded-[13px] bg-on-brand py-3.5 text-sm font-bold text-brand transition active:scale-[.98]"
      >
        Ver detalhes e solicitar
      </button>
    </div>
  );
}

function Pill({ icone, texto }: { icone: ReactNode; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[9px] bg-on-brand/15 px-2.5 py-1.5 text-[11.5px] font-semibold">
      {icone}{texto}
    </span>
  );
}
