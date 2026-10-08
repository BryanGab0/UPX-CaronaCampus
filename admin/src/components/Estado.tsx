import { Loader2, AlertTriangle, RotateCw } from "lucide-react";

export function Carregando() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sub">
      <Loader2 size={22} className="animate-spin text-brand" />
      <span className="text-sm">Carregando…</span>
    </div>
  );
}

// Mensagem para quem usa o painel: o detalhe técnico do erro fica só no console.
export function ErroCarga({ titulo = "Não foi possível carregar os dados", onTentar }: { titulo?: string; onTentar?: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 text-sm sm:flex-row sm:items-center">
      <AlertTriangle size={18} className="shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{titulo}</div>
        <div className="text-sub">Verifique sua conexão. O servidor pode levar alguns segundos para responder após ficar parado.</div>
      </div>
      {onTentar && (
        <button onClick={onTentar}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-bold text-white transition active:scale-[.98]">
          <RotateCw size={14} /> Tentar novamente
        </button>
      )}
    </div>
  );
}
