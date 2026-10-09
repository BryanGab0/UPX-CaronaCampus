import type { ReactNode } from "react";
import { Link } from "react-router";
import { Loader2, WifiOff, RotateCw, MapPin, Car } from "lucide-react";
import { cn } from "../lib/cn";

export function Carregando({ texto = "Carregando caronas…" }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-sub">
      <Loader2 size={26} className="animate-spin text-brand" />
      <span className="text-sm">{texto}</span>
    </div>
  );
}

// --- Esqueletos: o formato do conteúdo aparece enquanto ele carrega (parece mais rápido que um spinner). ---

function Bloco({ className }: { className: string }) {
  return <div className={cn("animate-pulse rounded-md bg-line motion-reduce:animate-none", className)} />;
}

// Anuncia o carregamento para leitores de tela; o desenho em si é decorativo.
function Esqueleto({ texto, children, className }: { texto: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{texto}</span>
      <div aria-hidden>{children}</div>
    </div>
  );
}

// Mesmo formato do RideRow (avatar, nome, endereço/horário, compatibilidade).
export function EsqueletoLista({ quantidade = 3, texto = "Carregando caronas…", className }: { quantidade?: number; texto?: string; className?: string }) {
  return (
    <Esqueleto texto={texto} className={className}>
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className="mb-2.5 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
          <Bloco className="size-11 shrink-0 rounded-[13px]" />
          <div className="min-w-0 flex-1 space-y-2">
            <Bloco className="h-3.5 w-2/5" />
            <Bloco className="h-3 w-4/5" />
          </div>
          <div className="space-y-2">
            <Bloco className="ml-auto h-3.5 w-9" />
            <Bloco className="h-3 w-12" />
          </div>
        </div>
      ))}
    </Esqueleto>
  );
}

// Mesmo formato do BestRideCard da Home.
export function EsqueletoDestaque() {
  return (
    <div aria-hidden className="animate-pulse rounded-[22px] bg-brand-soft p-5 motion-reduce:animate-none">
      <div className="flex items-center gap-3">
        <div className="size-[50px] rounded-[15px] bg-white/70" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded-md bg-white/70" />
          <div className="h-3 w-1/3 rounded-md bg-white/70" />
        </div>
      </div>
      <div className="mt-4 h-3 w-3/4 rounded-md bg-white/70" />
      <div className="mt-4 flex gap-2"><div className="h-7 w-24 rounded-[9px] bg-white/70" /><div className="h-7 w-20 rounded-[9px] bg-white/70" /></div>
      <div className="mt-4 h-12 rounded-[13px] bg-white/70" />
    </div>
  );
}

// --- Estado vazio: explica por que não há nada e sugere o próximo passo. ---

interface Acao { texto: string; para?: string; onClick?: () => void }

export function EstadoVazio({ icone, titulo, texto, acao, className }: { icone: ReactNode; titulo: string; texto: string; acao?: Acao; className?: string }) {
  const estilo = "mt-4 inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white transition active:scale-[.98]";
  return (
    <div className={cn("rounded-[18px] border border-line bg-surface p-6 text-center", className)}>
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">{icone}</div>
      <p className="mt-3 text-sm font-bold">{titulo}</p>
      <p className="mx-auto mt-1 max-w-[280px] text-xs leading-relaxed text-sub">{texto}</p>
      {acao && (acao.para
        ? <Link to={acao.para} className={estilo}>{acao.texto}</Link>
        : <button onClick={acao.onClick} className={estilo}>{acao.texto}</button>)}
    </div>
  );
}

// Mensagem para o usuário final: o detalhe técnico do erro fica só no console.
export function ErroCarga({ titulo = "Não foi possível carregar as caronas", onTentar }: { titulo?: string; onTentar?: () => void }) {
  return (
    <div className="mt-4 rounded-[18px] border border-line bg-surface p-6 text-center">
      <WifiOff size={26} className="mx-auto text-accent" />
      <p className="mt-2 text-sm font-semibold">{titulo}</p>
      <p className="mt-1 text-xs text-sub">
        Verifique sua conexão. Se o app ficou um tempo parado, o servidor pode levar alguns segundos para responder.
      </p>
      {onTentar && (
        <button onClick={onTentar}
          className="mx-auto mt-4 flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white transition active:scale-[.98]">
          <RotateCw size={14} /> Tentar novamente
        </button>
      )}
    </div>
  );
}

// Sem endereço cadastrado, a compatibilidade não tem com o que comparar: orienta a cadastrar.
export function SemTrajeto({ className }: { className?: string }) {
  return (
    <EstadoVazio className={className} icone={<MapPin size={22} />} titulo="Cadastre seu trajeto"
      texto="Com seu endereço, dias e horário de chegada, o app calcula quais motoristas combinam com você."
      acao={{ texto: "Cadastrar trajeto", para: "/trajeto" }} />
  );
}

export function SemMotoristas({ souMotorista, className }: { souMotorista: boolean; className?: string }) {
  return souMotorista ? (
    <EstadoVazio className={className} icone={<Car size={22} />} titulo="Nenhum outro motorista por enquanto"
      texto="Você já está oferecendo carona. Quando um passageiro pedir, o pedido aparece no seu Perfil e o sino avisa." />
  ) : (
    <EstadoVazio className={className} icone={<Car size={22} />} titulo="Ainda não há motoristas"
      texto="Assim que alguém oferecer carona, aparece aqui. Se você vai de carro, ofereça a sua e divida o combustível."
      acao={{ texto: "Oferecer carona", para: "/trajeto" }} />
  );
}
