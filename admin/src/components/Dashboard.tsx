import { useState } from "react";
import { LayoutDashboard, Users, Inbox, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/cn";
import { Estatisticas } from "./Estatisticas";
import { Usuarios } from "./Usuarios";
import { Solicitacoes } from "./Solicitacoes";

type View = "estatisticas" | "usuarios" | "solicitacoes";

const ITENS: { id: View; icone: typeof Users; label: string }[] = [
  { id: "estatisticas", icone: LayoutDashboard, label: "Estatísticas" },
  { id: "usuarios", icone: Users, label: "Usuários" },
  { id: "solicitacoes", icone: Inbox, label: "Solicitações" },
];

export function Dashboard() {
  const { usuario, sair } = useAuth();
  const [view, setView] = useState<View>("estatisticas");

  return (
    <div className="flex h-screen">
      {/* Barra lateral */}
      <aside className="flex w-60 flex-col border-r border-line bg-surface p-4">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="grid size-9 place-items-center rounded-lg bg-brand">
            <ShieldCheck size={19} color="#fff" />
          </div>
          <span className="font-display font-bold">Admin</span>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {ITENS.map(({ id, icone: Icone, label }) => {
            const ativo = view === id;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  ativo ? "bg-brand-soft text-brand" : "text-sub hover:bg-canvas",
                )}
              >
                <Icone size={18} /> {label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-line pt-3">
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
      <main className="flex-1 overflow-y-auto p-8">
        {view === "estatisticas" && <Estatisticas />}
        {view === "usuarios" && <Usuarios />}
        {view === "solicitacoes" && <Solicitacoes />}
      </main>
    </div>
  );
}
