import { Outlet } from "react-router";
import { BottomNav } from "./BottomNav";

// Casca visual. No celular ocupa a tela toda; no desktop (desk:) vira a moldura
// centralizada com fundo escuro em volta. A altura é travada na tela (h-dvh)
// e só o conteúdo rola, assim a navegação fica sempre visível embaixo.
export function Layout() {
  return (
    <div className="flex h-dvh justify-center bg-canvas desk:items-center desk:bg-shell desk:p-5">
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-canvas pt-[env(safe-area-inset-top)] text-ink desk:h-[min(812px,100%)] desk:max-w-[430px] desk:rounded-[32px] desk:pt-0 desk:shadow-2xl">
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(6rem+env(safe-area-inset-bottom))]">
          <Outlet />
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
