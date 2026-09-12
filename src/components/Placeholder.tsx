import { Compass } from "lucide-react";
import type { TabId } from "../types";

const NOMES: Record<Exclude<TabId, "inicio">, string> = {
  buscar: "Caronas",
  trajeto: "Trajeto",
  perfil: "Perfil",
};

// Telas ainda não desenhadas — só para a navegação não ficar "morta".
export function Placeholder({ tab }: { tab: Exclude<TabId, "inicio"> }) {
  return (
    <div className="animate-rise grid h-[620px] place-items-center px-10 text-center">
      <div>
        <div className="mx-auto mb-4 grid size-[60px] place-items-center rounded-[18px] bg-brand-soft">
          <Compass size={26} className="text-brand" />
        </div>
        <div className="font-display text-xl font-bold">{NOMES[tab]}</div>
        <p className="mt-1.5 text-sm text-sub">
          Tela em desenho.
          <br />A home é a que estamos montando agora.
        </p>
      </div>
    </div>
  );
}
