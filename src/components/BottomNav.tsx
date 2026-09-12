import { Home as HomeIcon, Compass, CalendarDays, User } from "lucide-react";
import { cn } from "../lib/cn";
import type { TabId } from "../types";

const ITENS: { id: TabId; icone: typeof HomeIcon; label: string }[] = [
  { id: "inicio", icone: HomeIcon, label: "Início" },
  { id: "buscar", icone: Compass, label: "Caronas" },
  { id: "trajeto", icone: CalendarDays, label: "Trajeto" },
  { id: "perfil", icone: User, label: "Perfil" },
];

// Navegação inferior. Recebe a aba ativa e a função de troca por prop —
// o estado de qual aba está ativa vive no App (pai).
export function BottomNav({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex border-t border-line bg-white/90 px-3 pb-[22px] pt-2.5 backdrop-blur-md">
      {ITENS.map(({ id, icone: Icone, label }) => {
        const ativo = tab === id;
        return (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn("flex flex-1 flex-col items-center gap-1 transition active:scale-[.98]", ativo ? "text-brand" : "text-sub")}
          >
            <Icone size={22} strokeWidth={ativo ? 2.5 : 2} />
            <span className={cn("text-[10.5px]", ativo ? "font-bold" : "font-medium")}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
