import { NavLink } from "react-router";
import { Home as HomeIcon, Compass, CalendarDays, User } from "lucide-react";
import { cn } from "../lib/cn";
 
const ITENS = [
  { to: "/", icone: HomeIcon, label: "Início", end: true },
  { to: "/caronas", icone: Compass, label: "Caronas" },
  { to: "/trajeto", icone: CalendarDays, label: "Trajeto" },
  { to: "/perfil", icone: User, label: "Perfil" },
];

// Navegação inferior. Cada item é um NavLink: ao tocar, muda a URL
// o próprio NavLink informa (isActive) se a rota dele é a atual
export function BottomNav() {
  return (
    <div className="absolute inset-x-0 bottom-0 flex border-t border-line bg-white/90 px-3 pb-[22px] pt-2.5 backdrop-blur-md">
      {ITENS.map(({ to, icone: Icone, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn("flex flex-1 flex-col items-center gap-1 transition active:scale-[.98]", isActive ? "text-brand" : "text-sub")
          }
        >
          {({ isActive }) => (
            <>
              <Icone size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn("text-[10.5px]", isActive ? "font-bold" : "font-medium")}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
