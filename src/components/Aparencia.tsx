import { useRef, useState } from "react";
import { Check, ChevronRight, Moon, Smartphone, Sun, SunMoon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { usePreferenciaTema } from "../hooks/useTema";
import { escolherTema } from "../lib/tema";
import type { PreferenciaTema } from "../lib/tema";
import { Folha } from "./Folha";
import type { FolhaControle } from "./Folha";

// Nome curto, mostrado no item do Perfil.
const RESUMO: Record<PreferenciaTema, string> = {
  claro: "Modo claro",
  escuro: "Modo escuro",
  dispositivo: "Usar configuração do dispositivo",
};

const OPCOES: { id: PreferenciaTema; texto: string; detalhe?: string; icone: LucideIcon }[] = [
  { id: "claro", texto: "Modo claro", icone: Sun },
  { id: "escuro", texto: "Modo escuro", icone: Moon },
  { id: "dispositivo", texto: "Usar as configurações do dispositivo", detalhe: "Segue o tema claro ou escuro do seu celular.", icone: Smartphone },
];

// Item "Aparência" do Perfil: mostra o tema atual e abre a folha de escolha.
export function Aparencia() {
  const [preferencia] = usePreferenciaTema();
  const [aberta, setAberta] = useState(false);

  return (
    <>
      <button onClick={() => setAberta(true)} aria-haspopup="dialog"
        className="mt-5 flex w-full items-center gap-2.5 rounded-[14px] border border-line bg-surface px-4 py-3 text-left transition active:scale-[.98]">
        <SunMoon size={17} className="shrink-0 text-brand" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Aparência</span>
          <span className="block truncate text-xs text-sub">{RESUMO[preferencia]}</span>
        </span>
        <ChevronRight size={17} className="shrink-0 text-sub" />
      </button>
      {aberta && <FolhaAparencia atual={preferencia} onFechar={() => setAberta(false)} />}
    </>
  );
}

// A escolha fica num rascunho e só vale ao tocar em Salvar; Cancelar, Esc ou tocar fora descartam.
// O Folha cuida do diálogo: foco entra ao abrir, volta para o item "Aparência" ao fechar.
function FolhaAparencia({ atual, onFechar }: { atual: PreferenciaTema; onFechar: () => void }) {
  const folha = useRef<FolhaControle>(null);
  const [escolha, setEscolha] = useState(atual);

  const salvar = () => {
    escolherTema(escolha);
    folha.current?.fechar();
  };

  return (
    <Folha ref={folha} tituloId="titulo-aparencia" onFechar={onFechar}>
      <h2 id="titulo-aparencia" className="font-display text-lg font-bold">Aparência</h2>

      <fieldset className="mt-4">
        <legend className="sr-only">Tema do app</legend>
        <div className="space-y-2">
          {OPCOES.map(({ id, texto, detalhe, icone: Icone }) => {
            const marcado = escolha === id;
            return (
              // Linha inteira tocável; o rádio nativo fica escondido (setas do teclado e leitor de tela).
              // A escolhida ganha fundo e borda da marca e o check; a borda transparente das outras
              // evita que a linha mude de tamanho na troca.
              <label key={id}
                className={cn("relative flex min-h-14 cursor-pointer items-center gap-3 rounded-[14px] border px-3.5 py-3 transition-colors duration-150 motion-reduce:transition-none",
                  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand",
                  marcado ? "border-brand bg-brand-soft" : "border-transparent bg-canvas")}>
                <input type="radio" name="tema" value={id} checked={marcado} onChange={() => setEscolha(id)}
                  aria-describedby={detalhe ? `tema-${id}-detalhe` : undefined} className="sr-only" />
                <Icone size={19} aria-hidden className={cn("shrink-0 transition-colors duration-150 motion-reduce:transition-none", marcado ? "text-brand" : "text-sub")} />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[15px]", marcado ? "font-bold" : "font-semibold")}>{texto}</span>
                  {detalhe && <span id={`tema-${id}-detalhe`} className="mt-0.5 block text-xs text-sub">{detalhe}</span>}
                </span>
                <Check size={19} strokeWidth={2.6} aria-hidden
                  className={cn("shrink-0 text-brand transition duration-150 motion-reduce:transition-none", marcado ? "scale-100 opacity-100" : "scale-75 opacity-0")} />
              </label>
            );
          })}
        </div>
      </fieldset>

      <button onClick={salvar} disabled={escolha === atual}
        className="mt-5 w-full rounded-[14px] bg-brand py-3.5 text-sm font-bold text-on-brand transition active:scale-[.98] disabled:bg-line disabled:text-sub disabled:shadow-none">
        Salvar
      </button>
      <button onClick={() => folha.current?.fechar()}
        className="mt-2 w-full rounded-[14px] border border-line py-3.5 text-sm font-bold text-sub transition active:scale-[.98]">
        Cancelar
      </button>
    </Folha>
  );
}
