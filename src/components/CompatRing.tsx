import { cn } from "../lib/cn";

export function CompatRing({ valor, light = false }: { valor: number; light?: boolean }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const cor = light ? "text-white" : valor >= 75 ? "text-good-ink" : valor >= 50 ? "text-brand" : "text-accent-ink";

  return (
    <div className={cn("relative grid size-[50px] shrink-0 place-items-center", cor)}>
      <svg width="50" height="50" className="-rotate-90">
        <circle cx="25" cy="25" r={r} fill="none" strokeWidth="4" className={light ? "stroke-white/25" : "stroke-line"} />
        <circle cx="25" cy="25" r={r} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - valor / 100)} />
      </svg>
      <span className="font-display absolute text-sm font-bold">{valor}</span>
    </div>
  );
}
