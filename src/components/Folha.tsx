import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props {
  tituloId: string; // id do título, lido pelo leitor de tela ao abrir
  onFechar: () => void;
  children: ReactNode;
}

// Folha de diálogo: no celular sobe de baixo; no desktop aparece centralizada.
// Fica num portal (direto no <body>) para cobrir a tela inteira, fora da moldura do app.
export function Folha({ tituloId, onFechar, children }: Props) {
  // Acessibilidade: o foco entra na folha ao abrir e volta para quem a abriu ao fechar.
  const painel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    painel.current?.focus();
    return () => anterior?.focus();
  }, []);

  // Esc fecha; Tab circula só dentro da folha (não "vaza" para a página atrás).
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onFechar(); return; }
      if (e.key !== "Tab" || !painel.current) return;
      const focaveis = painel.current.querySelectorAll<HTMLElement>("button, input, textarea, [href]");
      const primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === painel.current)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 desk:items-center" onClick={onFechar}>
      <div ref={painel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={tituloId} onClick={(e) => e.stopPropagation()}
        className="animate-rise no-scrollbar max-h-[92dvh] focus:outline-none w-full max-w-[430px] overflow-y-auto overscroll-contain rounded-t-[24px] bg-surface px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 text-ink desk:rounded-[24px] desk:pb-5">
        {children}
      </div>
    </div>,
    document.body,
  );
}
