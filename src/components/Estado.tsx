import { Loader2, WifiOff, RotateCw } from "lucide-react";

export function Carregando({ texto = "Carregando caronas…" }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-sub">
      <Loader2 size={26} className="animate-spin text-brand" />
      <span className="text-sm">{texto}</span>
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
