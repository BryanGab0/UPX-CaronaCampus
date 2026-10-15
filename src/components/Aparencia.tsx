import { Check, Moon, Palette, Smartphone, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { usePreferenciaTema } from "../hooks/useTema";
import type { PreferenciaTema } from "../lib/tema";

const OPCOES: { id: PreferenciaTema; texto: string; icone: LucideIcon }[] = [
  { id: "claro", texto: "Claro", icone: Sun },
  { id: "escuro", texto: "Escuro", icone: Moon },
  { id: "dispositivo", texto: "Usar configuração do dispositivo", icone: Smartphone },
];

// Escolha do tema. Rádios nativos (escondidos) dão setas do teclado e leitura correta
// no leitor de tela; cada linha tem pelo menos 44px de altura para o toque.
export function Aparencia() {
  const [preferencia, escolher] = usePreferenciaTema();

  return (
    <fieldset className="mt-5 rounded-[16px] border border-line bg-surface p-4">
      <legend className="sr-only">Aparência</legend>
      <div aria-hidden className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Palette size={18} /></div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">Aparência</div>
          <p className="mt-0.5 text-xs leading-relaxed text-sub">Vale para este aparelho.</p>
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-line">
        {OPCOES.map(({ id, texto, icone: Icone }) => {
          const marcado = preferencia === id;
          return (
            <label key={id}
              className={cn("relative flex min-h-11 cursor-pointer items-center gap-3 border-b border-line px-3.5 py-2.5 text-sm transition last:border-b-0",
                "has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-brand",
                marcado ? "bg-brand-soft font-bold text-brand" : "font-semibold")}>
              <input type="radio" name="tema" value={id} checked={marcado} onChange={() => escolher(id)} className="sr-only" />
              <Icone size={17} aria-hidden className={cn("shrink-0", marcado ? "text-brand" : "text-sub")} />
              <span className="min-w-0 flex-1">{texto}</span>
              {marcado && <Check size={17} aria-hidden className="shrink-0" />}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
