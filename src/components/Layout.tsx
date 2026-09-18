import { Outlet } from "react-router";
import { BottomNav } from "./BottomNav";

export function Layout() {
  return (
    <div className="flex min-h-screen justify-center bg-shell px-3 py-5">
      <div className="relative flex min-h-[812px] w-full max-w-[430px] flex-col overflow-hidden rounded-[32px] bg-canvas text-ink shadow-2xl">
        <div className="no-scrollbar flex-1 overflow-y-auto pb-24">
          <Outlet />
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
