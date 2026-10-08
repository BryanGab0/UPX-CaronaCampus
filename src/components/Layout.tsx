import { Outlet } from "react-router";
import { BottomNav } from "./BottomNav";

// Casca visual. No celular ocupa a tela toda; no desktop (sm+) vira a moldura
// centralizada com fundo escuro em volta.
export function Layout() {
  return (
    <div className="flex min-h-dvh justify-center bg-canvas sm:bg-shell sm:px-3 sm:py-5">
      <div className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-canvas text-ink sm:min-h-[812px] sm:max-w-[430px] sm:rounded-[32px] sm:shadow-2xl">
        <div className="no-scrollbar flex-1 overflow-y-auto pb-24">
          <Outlet />
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
