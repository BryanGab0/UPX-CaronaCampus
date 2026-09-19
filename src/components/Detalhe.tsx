import { useState } from "react";
import type { ReactNode } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, MapPin, Footprints, Clock, Car, Fuel, Users, Leaf, Check } from "lucide-react";
import { cn } from "../lib/cn";
import { caronas, FACENS } from "../data/mock";
import { CompatRing } from "./CompatRing";
import { MapaRota } from "./MapaRota";

// Converte "8,10" -> 8.1 para poder calcular a estimativa mensal
const paraNumero = (v: string) => Number(v.replace(",", "."));
const reais = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

// Tela de detalhe. Lê o :id da URL, encontra a carona e mostra tudo
export function Detalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [solicitado, setSolicitado] = useState(false);

  const carona = caronas.find((c) => c.id === id);

  // Se a URL tiver um id inválido, avisa em vez de quebrar.
  if (!carona) {
    return (
      <div className="grid h-[620px] place-items-center px-10 text-center text-sub">
        <div>
          <p className="text-sm">Carona não encontrada.</p>
          <button onClick={() => navigate("/")} className="mt-3 font-semibold text-brand">
            Voltar para o início
          </button>
        </div>
      </div>
    );
  }

  const iniciais = carona.nome.split(" ").slice(0, 2).map((n) => n[0]).join("");
  const mensal = reais(paraNumero(carona.custoDia) * 22); // ~22 dias letivos/mês

  return (
    <div className="animate-rise pb-6">
      {/* Cabeçalho com voltar */}
      <div className="flex items-center gap-3 border-b border-line bg-surface px-[22px] pb-3 pt-[44px]">
        <button
          onClick={() => navigate(-1)}
          className="grid size-9 place-items-center rounded-xl border border-line transition active:scale-[.98]"
        >
          <ChevronLeft size={19} className="text-sub" />
        </button>
        <div className="grid size-11 place-items-center rounded-[13px] bg-brand text-sm font-bold text-white">{iniciais}</div>
        <div className="flex-1">
          <div className="font-bold">{carona.nome}</div>
          <div className="text-xs text-sub">motorista · {carona.bairro}</div>
        </div>
        <CompatRing valor={carona.compat} />
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
 
        {/* Fatos da carona */}
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <Fato icone={<Clock size={16} />} titulo="Chega às" valor={carona.chegada} />
          <Fato icone={<Car size={16} />} titulo="Carro" valor={carona.carro} />
        </div>
        <div className="mt-2.5 rounded-[18px] border border-line bg-surface p-4">
          <div className="mb-2 text-xs font-semibold text-sub">Dias</div>
          <div className="flex gap-2">
            {carona.dias.map((d) => (
              <span key={d} className="rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">{d}</span>
            ))}
          </div>
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
            <div className="text-xs text-ink">
              Dividindo essa carona, é um carro a menos na rua nos dias em que vocês fazem o mesmo trajeto.
            </div>
          </div>
        </div>
 
        {/* Ação */}
        {solicitado ? (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-[14px] bg-good-soft py-4 text-sm font-bold text-good">
            <Check size={18} /> Pedido enviado para {carona.nome.split(" ")[0]}
          </div>
        ) : (
          <button
            onClick={() => setSolicitado(true)}
            className="mt-5 w-full rounded-[14px] bg-brand py-4 text-sm font-bold text-white transition active:scale-[.98]"
          >
            Solicitar carona
          </button>
        )}
      </div>
    </div>
  );
}

/* -- Peças locais desta tela -- */

function Legenda({ className, texto }: { className: string; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-full", className)} />
      {texto}
    </span>
  );
}

function Fato({ icone, titulo, valor }: { icone: ReactNode; titulo: string; valor: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-surface p-4">
      <div className="text-brand">{icone}</div>
      <div className="mt-2 text-xs text-sub">{titulo}</div>
      <div className="font-semibold">{valor}</div>
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
