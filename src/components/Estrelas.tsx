import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "../lib/cn";

const umaCasa = (n: number) => n.toFixed(1).replace(".", ",");

// Reputação de uma pessoa: "★ 4,5 (2)"; sem avaliações, "novo".
export function NotaMedia({ media, total, className }: { media: number | null; total: number; className?: string }) {
  if (!media || total === 0) {
    return <span className={cn("inline-flex shrink-0 items-center gap-1 text-[11.5px] text-sub", className)}>novo</span>;
  }
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 text-[11.5px] font-semibold", className)}
      aria-label={`Nota ${umaCasa(media)} de 5, ${total} ${total === 1 ? "avaliação" : "avaliações"}`}>
      <Star size={12} className="fill-current text-accent" aria-hidden />
      {umaCasa(media)} <span className="font-normal opacity-70">({total})</span>
    </span>
  );
}

// Escolha de 1 a 5 estrelas. Mostra a nota atual (se já avaliou) e destaca ao passar o dedo/mouse.
export function Estrelas({ valor, onEscolher, desabilitado }: { valor: number | null; onEscolher: (nota: number) => void; desabilitado?: boolean }) {
  const [sobre, setSobre] = useState<number | null>(null);
  const mostrada = sobre ?? valor ?? 0;
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Sua avaliação" onMouseLeave={() => setSobre(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={valor === n} aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
          disabled={desabilitado} onClick={() => onEscolher(n)} onMouseEnter={() => setSobre(n)}
          className="grid size-10 place-items-center rounded-xl transition active:scale-[.9] disabled:opacity-50">
          <Star size={26} className={cn("transition", n <= mostrada ? "fill-accent text-accent" : "text-line")} />
        </button>
      ))}
    </div>
  );
}
