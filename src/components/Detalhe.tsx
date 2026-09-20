import { useState } from "react";
import type { ReactNode } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, MapPin, Footprints, Fuel, Users, Leaf, Check } from "lucide-react";
import { cn } from "../lib/cn";
import { FACENS } from "../data/mock";
import { resultados } from "../data/resultados";
import { PESO_HORARIO, PESO_ROTA } from "../lib/match";
import { CompatRing } from "./CompatRing";
import { MapaRota } from "./MapaRota";

const paraNumero = (v: string) => Number(v.replace(",", "."));
const reais = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

export function Detalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [solicitado, setSolicitado] = useState(false);

  // Procura no ranking já calculado pelo algoritmo
  const resultado = resultados.find((r) => r.carona.id === id);
 
  if (!resultado) {
    return (
      <div className="grid h-[620px] place-items-center px-10 text-center text-sub">
        <div>
          <p className="text-sm">Carona não encontrada.</p>
          <button onClick={() => navigate("/")} className="mt-3 font-semibold text-brand">Voltar para o início</button>
        </div>
      </div>
    );
  }

  const { carona, compat, scoreHorario, scoreRota, diasComuns, difChegadaMin, desvioKm } = resultado;
  const iniciais = carona.nome.split(" ").slice(0, 2).map((n) => n[0]).join("");
  const mensal = reais(paraNumero(carona.custoDia) * 22);

  return (
    <div className="animate-rise pb-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 border-b border-line bg-surface px-[22px] pb-3 pt-[44px]">
        <button onClick={() => navigate(-1)} className="grid size-9 place-items-center rounded-xl border border-line transition active:scale-[.98]">
          <ChevronLeft size={19} className="text-sub" />
        </button>
        <div className="grid size-11 place-items-center rounded-[13px] bg-brand text-sm font-bold text-white">{iniciais}</div>
        <div className="flex-1">
          <div className="font-bold">{carona.nome}</div>
          <div className="text-xs text-sub">motorista · {carona.bairro}</div>
        </div>
        <CompatRing valor={compat} />
      </div>
 
      <div className="px-[22px]">
        {/* Mapa */}
        <div className="mt-4 rounded-[18px] border border-line bg-surface p-2">
          <MapaRota origem={carona.origem} ponto={carona.ponto} destino={FACENS} />
          <div className="flex flex-wrap justify-center gap-4 py-1.5 text-[11px] text-sub">
            <Legenda className="bg-accent" texto="você / ponto de encontro" />
            <Legenda className="bg-brand" texto="trajeto de carro" />
            <Legenda className="bg-ink" texto="Facens" />
          </div>
        </div>

        {/* Ponto de encontro */}
        <div className="mt-3.5 rounded-[18px] border border-line bg-surface p-4">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft">
              <MapPin size={17} className="text-accent" />
            </div>
            <div>
              <div className="text-xs text-sub">Ponto de encontro sugerido</div>
              <div className="font-bold">{carona.ponto.nome}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-sub">
                <Footprints size={13} /> {carona.ponto.caminhada} de caminhada
              </div>
            </div>
          </div>
        </div>
 
        {/* Por que esse match? — transparência do algoritmo */}
        <div className="mt-3.5 rounded-[18px] border border-line bg-surface p-4">
          <div className="font-display font-bold">Por que esse match?</div>
 
          <Barra
            titulo="Compatibilidade de horário"
            pct={Math.round(scoreHorario * 100)}
            detalhe={`chega ${carona.chegada} · ${difChegadaMin} min de diferença · ${diasComuns.length} dias em comum`}
            cor="bg-brand"
          />
          <Barra
            titulo="Proximidade de rota"
            pct={Math.round(scoreRota * 100)}
            detalhe={`${desvioKm.toFixed(1)} km fora da sua rota direta até a Facens`}
            cor="bg-good"
          />
 
          <div className="mt-3 flex flex-wrap gap-1.5">
            {diasComuns.map((d) => (
              <span key={d} className="rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">{d}</span>
            ))}
          </div>
 
          <p className="mt-3 text-[11.5px] leading-relaxed text-sub">
            Nota final = {Math.round(PESO_HORARIO * 100)}% horário + {Math.round(PESO_ROTA * 100)}% rota ={" "}
            <b className="text-ink">{compat}%</b>
          </p>
        </div>
 
        {/* Divisão de custo */}
        <div className="mt-3.5 rounded-[18px] border border-line bg-surface p-4">
          <div className="font-display font-bold">Divisão do combustível</div>
          <div className="mt-3 flex gap-2.5">
            <Metric icone={<Fuel size={16} />} valor={`R$ ${carona.custoDia}`} label="sua parte por dia" destaque />
            <Metric icone={<Users size={16} />} valor={mensal} label="estimativa no mês" />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-good-soft px-3.5 py-3">
            <Leaf size={18} className="shrink-0 text-good" />
            <div className="text-xs text-ink">Dividindo essa carona, é um carro a menos na rua nos dias em comum.</div>
          </div>
        </div>
 
        {/* Ação */}
        {solicitado ? (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-[14px] bg-good-soft py-4 text-sm font-bold text-good">
            <Check size={18} /> Pedido enviado para {carona.nome.split(" ")[0]}
          </div>
        ) : (
          <button onClick={() => setSolicitado(true)} className="mt-5 w-full rounded-[14px] bg-brand py-4 text-sm font-bold text-white transition active:scale-[.98]">
            Solicitar carona
          </button>
        )}
      </div>
    </div>
  );
}

/* -- Peças locais -- */

function Legenda({ className, texto }: { className: string; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-full", className)} />
      {texto}
    </span>
  );
}

// Barra de progresso de um critério do algoritmo
function Barra({ titulo, pct, detalhe, cor }: { titulo: string; pct: number; detalhe: string; cor: string }) {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[13px] font-semibold">
        <span>{titulo}</span>
        <span className="font-display">{pct}%</span>
      </div>
      <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-canvas">
        <div className={cn("h-full rounded-full", cor)} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 text-[11.5px] text-sub">{detalhe}</div>
    </div>
  );
}

function Metric({ icone, valor, label, destaque }: { icone: ReactNode; valor: string; label: string; destaque?: boolean }) {
  return (
    <div className={cn("flex-1 rounded-[13px] p-3.5", destaque ? "bg-brand-soft" : "bg-canvas")}>
      <div className={destaque ? "text-brand" : "text-sub"}>{icone}</div>
      <div className={cn("font-display mt-1.5 text-lg font-bold tracking-tight", destaque && "text-brand")}>{valor}</div>
      <div className="mt-0.5 text-[11px] leading-tight text-sub">{label}</div>
    </div>
  );
}
