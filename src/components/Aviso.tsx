import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "../lib/cn";
import type { AvisoMsg } from "../hooks/useAviso";

// Retorno de uma ação (sucesso ou erro). Leitores de tela anunciam o texto (aria-live).
export function Aviso({ aviso }: { aviso: AvisoMsg | null }) {
  return (
    <div role="status" aria-live="polite">
      {aviso && (
        <div className={cn("animate-rise mt-3 flex items-center gap-2 rounded-xl px-3.5 py-3 text-xs font-semibold",
          aviso.tipo === "ok" ? "bg-good-soft text-good-ink" : "bg-accent-soft text-accent-ink")}>
          {aviso.tipo === "ok" ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
          <span className="min-w-0">{aviso.texto}</span>
        </div>
      )}
    </div>
  );
}
