import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ReactNode, Ref } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";

// Controle da folha para quem a usa: `fechar` toca a animação de saída e, no fim,
// chama `depois` (ex.: avisar que salvou) ou, sem ele, o onFechar.
export interface FolhaControle {
  fechar: (depois?: () => void) => void;
}

interface Props {
  tituloId: string; // id do título, lido pelo leitor de tela ao abrir
  onFechar: () => void;
  ref?: Ref<FolhaControle>;
  children: ReactNode;
}

// A saída dura 250ms (.animate-folha-sai no index.css). Reserva caso o animationend não chegue
// (ex.: aba em segundo plano), para a folha nunca ficar presa na tela.
const RESERVA_SAIDA_MS = 400;

// Folha de diálogo: sobe de baixo e fica colada na base, cobrindo a navegação, como no celular.
// Fica num portal dentro da moldura do app (#moldura, no Layout), que recorta a folha também no
// desktop. Fora do Layout (sem moldura), vai para o <body> e cobre a tela inteira.
export function Folha({ tituloId, onFechar, ref, children }: Props) {
  const moldura = document.getElementById("moldura");
  const painel = useRef<HTMLDivElement>(null);

  // Fechamento animado: a folha desce e o véu some; só no fim quem abriu a folha é avisado.
  const [fechando, setFechando] = useState(false);
  const aoTerminar = useRef<(() => void) | null>(null);
  const reserva = useRef<number | undefined>(undefined);

  const terminar = useCallback(() => {
    const acao = aoTerminar.current;
    if (!acao) return;
    aoTerminar.current = null;
    clearTimeout(reserva.current);
    acao();
  }, []);

  const fechar = useCallback((depois?: () => void) => {
    if (aoTerminar.current) return; // já está fechando
    aoTerminar.current = depois ?? onFechar;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { terminar(); return; }
    setFechando(true);
    reserva.current = window.setTimeout(terminar, RESERVA_SAIDA_MS);
  }, [onFechar, terminar]);

  useImperativeHandle(ref, () => ({ fechar }), [fechar]);
  useEffect(() => () => clearTimeout(reserva.current), []);

  // Acessibilidade: o foco entra na folha ao abrir e volta para quem a abriu ao fechar.
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    // preventScroll: no 1º quadro a folha ainda está abaixo da base (animação); sem isso, o
    // navegador rolava a moldura para mostrá-la e o app inteiro dava um tranco.
    painel.current?.focus({ preventScroll: true });
    return () => anterior?.focus();
  }, []);

  // Esc fecha; Tab circula só dentro da folha (não "vaza" para a página atrás).
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") { fechar(); return; }
      if (e.key !== "Tab" || !painel.current) return;
      const focaveis = [...painel.current.querySelectorAll<HTMLElement>("button, input, textarea, [href]")].filter(alcancavelPorTab);
      if (focaveis.length === 0) { e.preventDefault(); return; }
      const primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === painel.current)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [fechar]);

  return createPortal(
    // Durante a saída, toques não chegam mais à folha (evita fechar ou enviar duas vezes).
    <div className={cn("inset-0 z-50 flex items-end justify-center", moldura ? "absolute" : "fixed", fechando && "pointer-events-none")}>
      {/* Véu separado da folha: o fade dele não apaga a folha junto (opacidade vale para os filhos). */}
      <div aria-hidden className={cn("absolute inset-0 bg-scrim", fechando ? "animate-veu-sai" : "animate-veu")} onClick={() => fechar()} />
      <div ref={painel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={tituloId}
        // Só o fim da animação da própria folha (as de dentro, como um ícone girando, também disparam o evento).
        onAnimationEnd={(e) => { if (fechando && e.target === e.currentTarget) terminar(); }}
        className={cn("relative no-scrollbar focus:outline-none w-full max-w-[430px] overflow-y-auto overscroll-contain rounded-t-[24px] bg-surface px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 text-ink",
          fechando ? "animate-folha-sai" : "animate-folha", moldura ? "max-h-[92%]" : "max-h-[92dvh]")}>
        {children}
      </div>
    </div>,
    moldura ?? document.body,
  );
}

// Mesma regra do navegador para o Tab: desabilitados ficam de fora e, num grupo de rádios,
// só o marcado recebe o foco (sem nenhum marcado, todos contam).
function alcancavelPorTab(el: HTMLElement, _: number, todos: HTMLElement[]) {
  if (el.matches(":disabled")) return false;
  if (!(el instanceof HTMLInputElement) || el.type !== "radio" || el.checked) return true;
  return !todos.some((r) => r instanceof HTMLInputElement && r.type === "radio" && r.name === el.name && r.checked);
}
