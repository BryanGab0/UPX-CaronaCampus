import { Loader2, AlertTriangle } from "lucide-react";

export function Carregando() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sub">
      <Loader2 size={22} className="animate-spin text-brand" />
      <span className="text-sm">Carregando…</span>
    </div>
  );
}

export function ErroCarga({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-surface p-4 text-sm text-sub">
      <AlertTriangle size={18} className="text-accent" />
      {msg}. Verifique se a API está rodando (localhost:3333).
    </div>
  );
}
