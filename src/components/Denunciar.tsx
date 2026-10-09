import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Flag, X } from "lucide-react";
import { cn } from "../lib/cn";
import { useAuth } from "../context/AuthContext";
import { denunciar } from "../lib/api";
import type { MotivoDenuncia } from "../lib/api";

const MOTIVOS: { id: MotivoDenuncia; texto: string }[] = [
  { id: "seguranca", texto: "Direção perigosa ou me senti inseguro(a)" },
  { id: "comportamento", texto: "Comportamento inadequado ou ofensivo" },
  { id: "perfil_falso", texto: "Perfil falso ou não é aluno da Facens" },
  { id: "nao_compareceu", texto: "Combinou e não compareceu" },
  { id: "outro", texto: "Outro motivo" },
];
const DESCRICAO_MAX = 500;

interface Props {
  denunciadoRa: string;
  denunciadoNome: string;
  onFechar: () => void;
  onEnviada: () => void;
}

// Folha de denúncia: no celular sobe de baixo; no desktop aparece centralizada.
// Fica num portal (direto no <body>) para cobrir a tela inteira, fora da moldura do app.
export function Denunciar({ denunciadoRa, denunciadoNome, onFechar, onEnviada }: Props) {
  const { ra } = useAuth();
  const [motivo, setMotivo] = useState<MotivoDenuncia | null>(null);
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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

  const enviar = async () => {
    if (!motivo) { setErro("Escolha um motivo."); return; }
    setEnviando(true); setErro(null);
    try {
      await denunciar(ra, denunciadoRa, motivo, descricao);
      onEnviada();
    } catch (e) {
      console.error(e);
      setErro(e instanceof Error ? e.message : "Não foi possível enviar a denúncia. Tente novamente.");
      setEnviando(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 desk:items-center" onClick={onFechar}>
      <div ref={painel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="titulo-denuncia" onClick={(e) => e.stopPropagation()}
        className="animate-rise no-scrollbar max-h-[92dvh] focus:outline-none w-full max-w-[430px] overflow-y-auto overscroll-contain rounded-t-[24px] bg-surface px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 text-ink desk:rounded-[24px] desk:pb-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft"><Flag size={18} className="text-accent" /></div>
          <div className="min-w-0 flex-1">
            <h2 id="titulo-denuncia" className="font-display text-lg font-bold">Denunciar</h2>
            <p className="truncate text-xs text-sub">{denunciadoNome}</p>
          </div>
          <button onClick={onFechar} aria-label="Fechar" className="grid size-9 shrink-0 place-items-center rounded-xl text-sub transition active:scale-[.98]">
            <X size={18} />
          </button>
        </div>

        <fieldset className="mt-4 space-y-2">
          <legend className="mb-2 text-xs font-semibold text-sub">O que aconteceu?</legend>
          {MOTIVOS.map((m) => (
            <label key={m.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition",
              motivo === m.id ? "border-brand bg-brand-soft" : "border-line")}>
              <input type="radio" name="motivo" value={m.id} checked={motivo === m.id}
                onChange={() => { setMotivo(m.id); setErro(null); }} className="size-4 shrink-0 accent-brand" />
              {m.texto}
            </label>
          ))}
        </fieldset>

        <label className="mt-4 block">
          <span className="text-xs font-semibold text-sub">Detalhes (opcional)</span>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={DESCRICAO_MAX} rows={3}
            placeholder="Conte o que aconteceu. Só a administração vê."
            className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-3 text-sm outline-none focus:border-brand" />
          <span className="block text-right text-[11px] text-sub">{descricao.length}/{DESCRICAO_MAX}</span>
        </label>

        {erro && <p role="alert" className="mt-1 text-[13px] text-accent-ink">{erro}</p>}

        <button onClick={enviar} disabled={enviando}
          className="mt-3 w-full rounded-[14px] bg-accent-ink py-3.5 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-60">
          {enviando ? "Enviando…" : "Enviar denúncia"}
        </button>
        <p className="mt-2 text-center text-[11px] text-sub">A pessoa denunciada não fica sabendo quem denunciou.</p>
      </div>
    </div>,
    document.body,
  );
}
