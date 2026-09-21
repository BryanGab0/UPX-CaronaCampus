import { Loader2, WifiOff } from "lucide-react";
 
export function Carregando({ texto = "Carregando caronas…" }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-sub">
      <Loader2 size={26} className="animate-spin text-brand" />
      <span className="text-sm">{texto}</span>
    </div>
  );
}
 
export function ErroCarga({ msg }: { msg: string }) {
  return (
    <div className="mt-4 rounded-[18px] border border-line bg-surface p-6 text-center">
      <WifiOff size={26} className="mx-auto text-accent" />
      <p className="mt-2 text-sm font-semibold">Não foi possível carregar as caronas</p>
      <p className="mt-1 text-xs text-sub">{msg}. Verifique se a API está rodando (localhost:3333).</p>
    </div>
  );
}
