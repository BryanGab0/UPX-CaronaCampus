import { Bell, Navigation, ChevronRight, Star } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { usePerfilContext } from "../context/PerfilContext";
import { useResultados } from "../hooks/useResultados";
import { usePedidos } from "../hooks/usePedidos";
import { useSolicitacoes } from "../hooks/useSolicitacoes";
import { calcularImpacto } from "../lib/impacto";
import { FACENS } from "../data/mock";
import { ImpactStats } from "./ImpactStats";
import { BestRideCard } from "./BestRideCard";
import { RideRow } from "./RideRow";
import { Carregando, ErroCarga } from "./Estado";

// Saudação conforme o horário local do aparelho.
function saudacao(hora = new Date().getHours()) {
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

export function Home() {
  const { nome } = useAuth();
  const { trajeto } = usePerfilContext();
  const { resultados, carregando, erro, recarregar } = useResultados();
  const { pedidos, pendentes } = usePedidos();
  const { solicitacoes } = useSolicitacoes();
  const impacto = useMemo(
    () => calcularImpacto({ solicitacoes, pedidos, resultados, trajeto, destino: FACENS }),
    [solicitacoes, pedidos, resultados, trajeto],
  );
  const melhor = resultados[0];
  const outras = resultados.slice(1);

  return (
    <div className="animate-rise">
      <div className="px-[22px] pb-[18px] pt-[46px]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-sub">{saudacao()},</div>
            <h1 className="truncate font-display text-[27px] font-bold tracking-tight">{nome.split(" ")[0]}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            {/* Leva aos pedidos recebidos (no Perfil); a bolinha só aparece se houver pedido pendente. */}
            <Link to="/perfil" aria-label={pendentes > 0 ? `Pedidos recebidos: ${pendentes} pendente(s)` : "Pedidos recebidos"}
              className="relative grid size-10 place-items-center rounded-xl border border-line bg-surface transition active:scale-[.98]">
              <Bell size={18} className="text-sub" />
              {pendentes > 0 && <span className="absolute right-2.5 top-2.5 size-[7px] rounded-full border-2 border-surface bg-accent" />}
            </Link>
            <div className="grid size-10 place-items-center rounded-xl bg-brand text-sm font-bold text-white">{nome[0]}</div>
          </div>
        </div>

        <button className="mt-4 flex w-full items-center gap-2.5 rounded-[14px] border border-line bg-surface px-3.5 py-3 text-left transition active:scale-[.98]">
          <div className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-brand-soft">
            <Navigation size={16} className="text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] text-sub">seu trajeto</div>
            <div className="truncate text-[13.5px] font-semibold">
              {trajeto.endereco ? `${trajeto.endereco} → Facens` : "Cadastre seu trajeto"}
            </div>
          </div>
          <ChevronRight size={18} className="shrink-0 text-sub" />
        </button>
      </div>

      <ImpactStats impacto={impacto} />

      {carregando ? (
        <Carregando />
      ) : erro ? (
        <div className="px-[22px]"><ErroCarga onTentar={recarregar} /></div>
      ) : resultados.length === 0 ? (
        <p className="mx-[22px] mt-4 rounded-[18px] border border-line bg-surface p-6 text-center text-sm text-sub">
          Nenhum motorista disponível ainda. Assim que alguém oferecer carona, aparece aqui.
        </p>
      ) : (
        <>
          <div className="px-[22px] pb-2 pt-[22px]">
            <div className="mb-3 flex items-center gap-1.5">
              <Star size={15} className="fill-accent text-accent" />
              <span className="text-sm font-bold">Melhor carona pra você hoje</span>
            </div>
            {melhor && <BestRideCard resultado={melhor} />}
          </div>
          <div className="flex items-center justify-between px-[22px] pb-2 pt-[18px]">
            <span className="text-sm font-bold">Outras compatíveis</span>
          </div>
          <div className="px-4">
            {outras.map((r) => <RideRow key={r.carona.id} resultado={r} />)}
          </div>
        </>
      )}
    </div>
  );
}
