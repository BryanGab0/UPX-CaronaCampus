import { useState } from "react";
import { LayoutDashboard, Users, Inbox, Flag, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/cn";
import { Estatisticas } from "./Estatisticas";
import { Usuarios } from "./Usuarios";
import { Solicitacoes } from "./Solicitacoes";
import { Denuncias } from "./Denuncias";

type View = "estatisticas" | "usuarios" | "solicitacoes" | "denuncias";

const ITENS: { id: View; icone: typeof Users; label: string }[] = [
  { id: "estatisticas", icone: LayoutDashboard, label: "Estatísticas" },
  { id: "usuarios", icone: Users, label: "Usuários" },
  { id: "solicitacoes", icone: Inbox, label: "Solicitações" },
  { id: "denuncias", icone: Flag, label: "Denúncias" },
];

export function Dashboard() {
  const { usuario, sair } = useAuth();
  const [view, setView] = useState<View>("estatisticas");

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      {/* Barra lateral no desktop; no celular vira um cabeçalho com abas que rolam de lado */}
      <aside className="flex shrink-0 flex-col border-b border-line bg-surface px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] md:w-60 md:border-b-0 md:border-r md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="grid size-9 place-items-center rounded-lg bg-brand">
              <ShieldCheck size={19} color="#fff" />
            </div>
            <span className="font-display font-bold">Admin</span>
          </div>
          <button
            onClick={sair}
            aria-label="Sair"
            className="grid size-10 place-items-center rounded-xl text-sub transition hover:bg-canvas md:hidden"
          >
            <LogOut size={18} />
          </button>
        </div>

        <nav className="no-scrollbar -mx-3 mt-1 flex gap-1 overflow-x-auto px-3 md:mx-0 md:mt-6 md:block md:flex-1 md:space-y-1 md:px-0">
          {ITENS.map(({ id, icone: Icone, label }) => {
            const ativo = view === id;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition md:w-full md:gap-3 md:py-2.5",
                  ativo ? "bg-brand-soft text-brand" : "text-sub hover:bg-canvas",
                )}
              >
                <Icone size={18} /> {label}
              </button>
            );
          })}
        </nav>

        <div className="hidden border-t border-line pt-3 md:block">
          <div className="px-3 pb-2 text-xs text-sub">
            <div className="truncate font-semibold text-ink">{usuario?.nome}</div>
            <div className="truncate">{usuario?.email}</div>
          </div>
          <button
            onClick={sair}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sub transition hover:bg-canvas"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8">
        {view === "estatisticas" && <Estatisticas />}
        {view === "usuarios" && <Usuarios />}
        {view === "solicitacoes" && <Solicitacoes />}
        {view === "denuncias" && <Denuncias />}
      </main>
    </div>
  );
}
