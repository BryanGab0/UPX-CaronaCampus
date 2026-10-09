import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ativarPush, desativarPush, verificarPush } from "../lib/push";
import type { EstadoPush } from "../lib/push";
import { cn } from "../lib/cn";

const TEXTOS: Record<EstadoPush, string> = {
  inativo: "Receba um aviso quando chegar um pedido de carona ou quando responderem o seu.",
  ativo: "Ativadas neste aparelho. Você recebe um aviso a cada pedido novo e a cada resposta.",
  bloqueado: "As notificações estão bloqueadas para este site. Libere nas configurações do navegador para ativar.",
  "ios-instalar": "No iPhone, primeiro adicione o app à Tela de Início (Compartilhar → Adicionar à Tela de Início) e abra por lá.",
  "sem-suporte": "Este navegador não permite notificações. Tente pelo Chrome, Edge, Firefox ou pelo app instalado.",
};

// Ativação pedida pela pessoa (não ao abrir o app): os navegadores penalizam pedidos de permissão sem contexto.
export function Notificacoes({ onAviso }: { onAviso: (tipo: "ok" | "erro", texto: string) => void }) {
  const { ra } = useAuth();
  const [estado, setEstado] = useState<EstadoPush | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let ativo = true;
    verificarPush(ra).then((e) => { if (ativo) setEstado(e); }).catch((e) => { console.error(e); if (ativo) setEstado("sem-suporte"); });
    return () => { ativo = false; };
  }, [ra]);

  const alternar = async () => {
    setOcupado(true);
    try {
      if (estado === "ativo") {
        await desativarPush(ra);
        setEstado("inativo");
        onAviso("ok", "Notificações desativadas neste aparelho.");
      } else {
        const novo = await ativarPush(ra);
        setEstado(novo);
        if (novo === "ativo") onAviso("ok", "Notificações ativadas!");
      }
    } catch (e) {
      console.error(e);
      onAviso("erro", "Não foi possível ativar as notificações. Tente novamente.");
    } finally {
      setOcupado(false);
    }
  };

  if (!estado) return null;
  const podeAlternar = estado === "ativo" || estado === "inativo";

  return (
    <div className="mt-5 flex items-start gap-3 rounded-[16px] border border-line bg-surface p-4">
      <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", estado === "ativo" ? "bg-brand-soft text-brand" : "bg-canvas text-sub")}>
        {estado === "ativo" ? <Bell size={18} /> : <BellOff size={18} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">Notificações</div>
        <p className="mt-0.5 text-xs leading-relaxed text-sub">{TEXTOS[estado]}</p>
        {podeAlternar && (
          <button onClick={alternar} disabled={ocupado}
            className={cn("mt-3 rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-[.98] disabled:opacity-60",
              estado === "ativo" ? "border border-line text-sub" : "bg-brand text-white")}>
            {ocupado ? "Aguarde…" : estado === "ativo" ? "Desativar" : "Ativar notificações"}
          </button>
        )}
      </div>
    </div>
  );
}
