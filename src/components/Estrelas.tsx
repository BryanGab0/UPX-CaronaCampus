import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "../lib/cn";
import { umaCasa } from "../lib/formato";

// Reputação de uma pessoa: "★ 4,5 (2)"; sem avaliações, "novo".
// sobreCor: dentro de um fundo da marca (card de destaque), texto e estrela em on-brand.
// A cor vem daqui, e não de um className de fora: o cn() não resolve conflito de classes,
// e o text-sub do "novo" vencia o text-on-brand passado pelo card (ficava cinza no lilás).
export function NotaMedia({ media, total, sobreCor = false }: { media: number | null; total: number; sobreCor?: boolean }) {
  if (!media || total === 0) {
    return <span className={cn("inline-flex shrink-0 items-center gap-1 text-[11.5px]", sobreCor ? "text-on-brand" : "text-sub")}>novo</span>;
  }
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 text-[11.5px] font-semibold", sobreCor && "text-on-brand")}
      aria-label={`Nota ${umaCasa(media)} de 5, ${total} ${total === 1 ? "avaliação" : "avaliações"}`}>
      <Star size={12} className={cn("fill-current", sobreCor ? "text-on-brand" : "text-star")} aria-hidden />
      {umaCasa(media)} <span className="font-normal">({total})</span>
    </span>
  );
}

// Escolha de 1 a 5 estrelas. Mostra a nota atual (se já avaliou) e destaca ao passar o dedo/mouse.
export function Estrelas({ valor, onEscolher, desabilitado }: { valor: number | null; onEscolher: (nota: number) => void; desabilitado?: boolean }) {
  const [sobre, setSobre] = useState<number | null>(null);
  const mostrada = sobre ?? valor ?? 0;
  return (
    <div className="flex gap-1" role="group" aria-label="Sua avaliação, de 1 a 5 estrelas" onMouseLeave={() => setSobre(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-pressed={valor === n} aria-label={`Dar ${n} ${n === 1 ? "estrela" : "estrelas"}`}
          disabled={desabilitado} onClick={() => onEscolher(n)} onMouseEnter={() => setSobre(n)} onFocus={() => setSobre(n)} onBlur={() => setSobre(null)}
          className="grid size-10 place-items-center rounded-xl transition active:scale-[.9] disabled:opacity-40">
          <Star size={26} className={cn("transition", n <= mostrada ? "fill-star text-star" : "text-line-strong")} />
        </button>
      ))}
    </div>
  );
}
