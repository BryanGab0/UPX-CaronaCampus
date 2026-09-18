import { useState } from "react";
import type { TabId } from "./types";
import { Home } from "./components/Home";
import { BottomNav } from "./components/BottomNav";
import { Placeholder } from "./components/Placeholder";
import { Trajeto } from "./components/trajeto";

// Casca do app: a moldura do celular + qual aba está ativa (estado central).
export default function App() {
  const [tab, setTab] = useState<TabId>("inicio");
 
  return (
    <div className="flex min-h-screen justify-center bg-shell px-3 py-5">
      <div className="relative flex min-h-[812px] w-full max-w-[430px] flex-col overflow-hidden rounded-[32px] bg-canvas text-ink shadow-2xl">
        <div className="no-scrollbar flex-1 overflow-y-auto pb-24">
          {tab === "inicio" ? (
            <Home />
          ) : tab === "trajeto" ? (
            <Trajeto />
          ) : (
            <Placeholder tab={tab} />
          )}
        </div>
        <BottomNav tab={tab} setTab={setTab} />
      </div>
    </div>
  );
}
