import { useState } from "react";
import { useNavigate } from "react-router";
import { LogOut, Mail, Inbox, Check, X, MessageCircle } from "lucide-react";
import { cn } from "../lib/cn";
import { useAuth } from "../context/AuthContext";
import { usePedidos } from "../hooks/usePedidos";
import { useAviso } from "../hooks/useAviso";
import { responderSolicitacao } from "../lib/api";
import type { Pedido } from "../lib/api";
import { Carregando, ErroCarga } from "./Estado";
import { Aviso } from "./Aviso";

const whatsapp = (tel: string, texto: string) => `https://wa.me/55${tel}?text=${encodeURIComponent(texto)}`;

export function Perfil() {
  const { nome, email, sair } = useAuth();
  const navigate = useNavigate();
  const iniciais = nome.split(" ").slice(0, 2).map((n) => n[0]).join("");

  const { pedidos, carregando, erro, recarregar } = usePedidos();
  const { aviso, mostrar } = useAviso();
  const [respondendo, setRespondendo] = useState<number | null>(null); // id do pedido em andamento

  const responder = async (p: Pedido, status: "aceita" | "recusada") => {
    const primeiroNome = p.passageiroNome.split(" ")[0];
    setRespondendo(p.id);
    try {
      await responderSolicitacao(p.id, status);
      mostrar("ok", status === "aceita"
        ? `Pedido de ${primeiroNome} aceito! Chame no WhatsApp para combinar.`
        : `Pedido de ${primeiroNome} recusado.`);
      recarregar(); // os botões somem quando a lista atualizada chegar
    } catch (e) {
      console.error(e);
      mostrar("erro", "Não foi possível responder o pedido. Tente novamente.");
      setRespondendo(null);
    }
  };

  const onSair = () => { sair(); navigate("/login"); };

  return (
    <div className="animate-rise px-[22px] pt-[46px]">
      <h1 className="font-display text-[26px] font-bold tracking-tight">Perfil</h1>

      <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-line bg-surface p-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-lg font-bold text-white">{iniciais}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{nome}</div>
          <div className="flex items-center gap-1.5 text-xs text-sub"><Mail size={13} className="shrink-0" /> <span className="truncate">{email}</span></div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm font-bold">
        <Inbox size={16} className="text-brand" /> Pedidos recebidos
      </div>
      <p className="mt-0.5 text-xs text-sub">Pedidos de carona que você recebeu como motorista.</p>
      <Aviso aviso={aviso} />

      {carregando ? (
        <Carregando />
      ) : erro ? (
        <ErroCarga titulo="Não foi possível carregar seus pedidos" onTentar={recarregar} />
      ) : pedidos.length === 0 ? (
        <p className="mt-3 rounded-[18px] border border-line bg-surface p-6 text-center text-sm text-sub">
          Nenhum pedido ainda.
        </p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {pedidos.map((p) => (
            <div key={p.id} className="rounded-[16px] border border-line bg-surface p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 truncate font-semibold">{p.passageiroNome}</div>
                <StatusTag status={p.status} />
              </div>
              {p.status === "pendente" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => responder(p, "aceita")} disabled={respondendo === p.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-good py-2.5 text-xs font-bold text-white transition active:scale-[.98] disabled:opacity-60">
                    <Check size={15} /> Aceitar
                  </button>
                  <button onClick={() => responder(p, "recusada")} disabled={respondendo === p.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-xs font-bold text-sub transition active:scale-[.98] disabled:opacity-60">
                    <X size={15} /> Recusar
                  </button>
                </div>
              )}
              {p.status === "aceita" && p.passageiroTelefone && (
                <a href={whatsapp(p.passageiroTelefone, `Oi ${p.passageiroNome.split(" ")[0]}! Aceitei seu pedido de carona pra Facens. Vamos combinar?`)}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-good py-2.5 text-xs font-bold text-white transition active:scale-[.98]">
                  <MessageCircle size={15} /> Chamar no WhatsApp
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={onSair}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-[14px] border border-line bg-surface py-4 text-sm font-bold text-sub transition active:scale-[.98]">
        <LogOut size={17} /> Sair
      </button>
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  const cor = status === "aceita" ? "bg-good-soft text-good" : status === "recusada" ? "bg-canvas text-sub" : "bg-brand-soft text-brand";
  return <span className={cn("shrink-0 rounded-lg px-2.5 py-0.5 text-xs font-semibold capitalize", cor)}>{status}</span>;
}
