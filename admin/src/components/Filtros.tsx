import type { ReactNode } from "react";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";
import type { Pagina } from "../lib/filtro";

// Barra acima das tabelas: busca + opções de filtro. Quebra linha no celular.
export function BarraFiltros({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">{children}</div>;
}

// "placeholder" curto (cabe no celular); "rotulo" diz ao leitor de tela em quais campos a busca procura.
export function Busca({ valor, onChange, placeholder, rotulo }: { valor: string; onChange: (v: string) => void; placeholder: string; rotulo: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 transition focus-within:border-brand sm:max-w-sm">
      <Search size={16} className="shrink-0 text-sub" />
      <input type="search" value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={rotulo}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:hidden" />
      {valor && (
        <button onClick={() => onChange("")} aria-label="Limpar busca" className="grid size-6 shrink-0 place-items-center rounded-md text-sub hover:text-ink">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// Grupo de botões em que só um fica ativo (ex.: Todos / Alunos / Bloqueados), com contagem opcional.
export function Opcoes<T extends string>({ rotulo, opcoes, valor, onChange }: {
  rotulo: string; opcoes: { id: T; texto: string; total?: number }[]; valor: T; onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={rotulo} className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 py-0.5 sm:mx-0 sm:px-0">
      {opcoes.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} aria-pressed={valor === o.id}
          className={cn("shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
            valor === o.id ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface text-sub hover:text-ink")}>
          {o.texto}{o.total !== undefined && <span className="ml-1 opacity-70">{o.total}</span>}
        </button>
      ))}
    </div>
  );
}

// "21–40 de 45" + anterior/próxima. Some quando cabe tudo numa página.
export function Paginacao({ pagina, total, onMudar }: { pagina: Pagina<unknown>; total: number; onMudar: (p: number) => void }) {
  if (pagina.totalPaginas <= 1) return null;
  const botao = "grid size-9 place-items-center rounded-lg border border-line bg-surface text-sub transition hover:text-ink disabled:opacity-40";
  return (
    <nav aria-label="Paginação" className="mt-4 flex items-center justify-between gap-3 text-sm text-sub">
      <span aria-live="polite">{pagina.inicio}–{pagina.fim} de {total}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onMudar(pagina.pagina - 1)} disabled={pagina.pagina === 1} aria-label="Página anterior" className={botao}>
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[4.5rem] text-center text-xs">Página {pagina.pagina} de {pagina.totalPaginas}</span>
        <button onClick={() => onMudar(pagina.pagina + 1)} disabled={pagina.pagina === pagina.totalPaginas} aria-label="Próxima página" className={botao}>
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}

// Quando o filtro não encontra nada (diferente de "não há dados ainda").
export function SemResultado({ onLimpar }: { onLimpar: () => void }) {
  return (
    <div className="mt-4 rounded-2xl border border-line bg-surface p-6 text-center text-sm text-sub">
      Nenhum resultado com esses filtros.{" "}
      <button onClick={onLimpar} className="font-semibold text-brand">Limpar filtros</button>
    </div>
  );
}
