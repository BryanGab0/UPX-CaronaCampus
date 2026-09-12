import { cn } from "../lib/cn";

// Anel de % de compatibilidade. A cor acompanha o valor: o texto define
// a cor (text-good/brand/accent) e o traço do SVG usa stroke="currentColor".
export function CompatRing({ valor, light = false }: { valor: number; light?: boolean }) {
  const r = 20;
  const circ = 2 * Math.PI * r; // circunferência: base para "preencher" o anel

  const cor = light ? "text-white" : valor >= 75 ? "text-good" : valor >= 50 ? "text-brand" : "text-accent";

  return (
    <div className={cn("relative grid size-[50px] shrink-0 place-items-center", cor)}>
      <svg width="50" height="50" className="-rotate-90">
        {/* trilho de fundo */}
        <circle cx="25" cy="25" r={r} fill="none" strokeWidth="4" className={light ? "stroke-white/25" : "stroke-line"} />
        {/* arco preenchido (quanto maior o valor, mais fecha o círculo) */}
        <circle
          cx="25" cy="25" r={r} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - valor / 100)}
        />
      </svg>
      <span className="font-display absolute text-sm font-bold">{valor}</span>
    </div>
  );
}
