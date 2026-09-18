import { Compass } from "lucide-react";

// Telas ainda não desenhadas - só para a navegação não ficar "morta"
export function Placeholder({ titulo }: { titulo: string }) {
  return (
    <div className="animate-rise grid h-[620px] place-items-center px-10 text-center">
      <div>
        <div className="mx-auto mb-4 grid size-[60px] place-items-center rounded-[18px] bg-brand-soft">
          <Compass size={26} className="text-brand" />
        </div>
        <div className="font-display text-xl font-bold">{titulo}</div>
        <p className="mt-1.5 text-sm text-sub">
          Tela em desenho.
          <br />A home é a que estamos montando agora.
        </p>
      </div>
    </div>
  );
}
