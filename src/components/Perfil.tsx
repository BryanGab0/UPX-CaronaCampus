import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { LogOut, Mail, Inbox, Check, X, MessageCircle, Flag, ShieldCheck, ChevronRight, Undo2, Users } from "lucide-react";
import { cn } from "../lib/cn";
import { iniciais, linkWhatsapp, primeiroNome } from "../lib/formato";
import { useAuth } from "../context/AuthContext";
import { usePedidos } from "../hooks/usePedidos";
import { useAviso } from "../hooks/useAviso";
import { avaliar, cancelarSolicitacao, responderSolicitacao } from "../lib/api";
import type { Pedido } from "../lib/api";
import { ErroCarga, EsqueletoLista, EstadoVazio } from "./Estado";
import { usePerfilContext } from "../context/PerfilContext";
import { Aviso } from "./Aviso";
import { Denunciar } from "./Denunciar";
import { Confirmar } from "./Confirmar";
import { Notificacoes } from "./Notificacoes";
import { desativarPush } from "../lib/push";
import { Estrelas, NotaMedia } from "./Estrelas";

export function Perfil() {
  const { nome, email, ra, sair } = useAuth();
  const navigate = useNavigate();

  const { pedidos, carregando, erro, recarregar } = usePedidos();
  const { trajeto } = usePerfilContext();
  const { aviso, mostrar } = useAviso();
  const [respondendo, setRespondendo] = useState<number | null>(null); // id do pedido em andamento
  const [denunciado, setDenunciado] = useState<Pedido | null>(null);
  const [avaliando, setAvaliando] = useState<number | null>(null); // id do pedido sendo avaliado
  const [desfazendo, setDesfazendo] = useState<Pedido | null>(null); // aceite a desfazer (folha de confirmação)

  // Vagas do carro: as do trajeto menos os passageiros aceitos (mesma conta da API).
  const souMotorista = trajeto.papel === "motorista";
  const vagas = trajeto.carro.lugares;
  const ocupadas = pedidos.filter((p) => p.status === "aceita").length;
  const cheio = souMotorista && ocupadas >= vagas;

  const onAvaliar = async (p: Pedido, nota: number) => {
    setAvaliando(p.id);
    try { await avaliar(p.id, nota); recarregar(); mostrar("ok", `Avaliação de ${primeiroNome(p.passageiroNome)} salva.`); }
    catch (e) { console.error(e); mostrar("erro", "Não foi possível salvar a avaliação. Tente novamente."); }
    finally { setAvaliando(null); }
  };

  const responder = async (p: Pedido, status: "aceita" | "recusada") => {
    const primeiro = primeiroNome(p.passageiroNome);
    setRespondendo(p.id);
    try {
      await responderSolicitacao(p.id, status);
      mostrar("ok", status === "aceita"
        ? `Pedido de ${primeiro} aceito! Chame no WhatsApp para combinar.`
        : `Pedido de ${primeiro} recusado.`);
      recarregar(); // os botões somem quando a lista atualizada chegar
    } catch (e) {
      console.error(e);
      // Mensagem escrita pela API (ex.: o passageiro cancelou nesse meio-tempo) ou a genérica.
      mostrar("erro", e instanceof Error && !e.message.startsWith("Erro ") ? e.message : "Não foi possível responder o pedido. Tente novamente.");
      setRespondendo(null);
      recarregar();
    }
  };

  // Lança o erro para a folha de confirmação mostrar (ex.: o passageiro cancelou nesse meio-tempo).
  const onDesfazer = async (p: Pedido) => {
    await cancelarSolicitacao(p.id);
    setDesfazendo(null);
    recarregar();
    mostrar("ok", `Aceite desfeito. ${primeiroNome(p.passageiroNome)} recebeu um aviso.`);
  };

  // Ao sair, o aparelho para de receber avisos desta conta (melhor esforço: não impede a saída).
  const onSair = async () => {
    await desativarPush(ra).catch((e) => console.error(e));
    sair();
    navigate("/login");
  };

  return (
    <div className="animate-rise px-[22px] pt-[46px]">
      <h1 className="font-display text-[26px] font-bold tracking-tight">Perfil</h1>

      <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-line bg-surface p-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-lg font-bold text-white">{iniciais(nome)}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{nome}</div>
          <div className="flex items-center gap-1.5 text-xs text-sub"><Mail size={13} className="shrink-0" /> <span className="truncate">{email}</span></div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm font-bold">
        <Inbox size={16} className="text-brand" /> Pedidos recebidos
      </div>
      <p className="mt-0.5 text-xs text-sub">Pedidos de carona que você recebeu como motorista.</p>
      {souMotorista && !carregando && !erro && (
        <p className={cn("mt-2 flex items-center gap-1.5 text-xs font-semibold", cheio ? "text-accent-ink" : "text-sub")}>
          <Users size={13} className="shrink-0" /> {ocupadas} de {vagas} {vagas === 1 ? "vaga ocupada" : "vagas ocupadas"}{cheio && " · carro lotado"}
        </p>
      )}
      <Aviso aviso={aviso} />

      {carregando ? (
        <EsqueletoLista quantidade={2} texto="Carregando pedidos…" className="mt-3" />
      ) : erro ? (
        <ErroCarga titulo="Não foi possível carregar seus pedidos" onTentar={recarregar} />
      ) : pedidos.length === 0 ? (
        trajeto.papel === "motorista" ? (
          <EstadoVazio className="mt-3" icone={<Inbox size={22} />} titulo="Nenhum pedido ainda"
            texto="Quando um passageiro pedir carona, o pedido aparece aqui e o sino da tela inicial avisa." />
        ) : (
          <EstadoVazio className="mt-3" icone={<Inbox size={22} />} titulo="Você está como passageiro"
            texto="Pedidos recebidos aparecem aqui quando você oferece carona. Para pedir a sua, veja as caronas compatíveis."
            acao={{ texto: "Ver caronas", para: "/caronas" }} />
        )
      ) : (
        <div className="mt-3 space-y-2.5">
          {pedidos.map((p) => (
            <div key={p.id} className="rounded-[16px] border border-line bg-surface p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 truncate font-semibold">{p.passageiroNome}</span>
                  <NotaMedia media={p.passageiroMedia} total={p.passageiroAvaliacoes} />
                </div>
                <StatusTag status={p.status} />
              </div>
              {p.status === "pendente" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => responder(p, "aceita")} disabled={respondendo === p.id || cheio}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-good-ink py-2.5 text-xs font-bold text-white transition active:scale-[.98] disabled:opacity-60">
                    <Check size={15} /> Aceitar
                  </button>
                  <button onClick={() => responder(p, "recusada")} disabled={respondendo === p.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-xs font-bold text-sub transition active:scale-[.98] disabled:opacity-60">
                    <X size={15} /> Recusar
                  </button>
                </div>
              )}
              {p.status === "pendente" && cheio && (
                <p className="mt-2 text-xs text-sub">
                  Carro lotado: desfaça um aceite ou <Link to="/trajeto" className="font-semibold text-brand">aumente as vagas</Link> para aceitar.
                </p>
              )}
              {p.status === "aceita" && p.passageiroTelefone && (
                <a href={linkWhatsapp(p.passageiroTelefone, `Oi ${primeiroNome(p.passageiroNome)}! Aceitei seu pedido de carona pra Facens. Vamos combinar?`)}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-good-ink py-2.5 text-xs font-bold text-white transition active:scale-[.98]">
                  <MessageCircle size={15} /> Chamar no WhatsApp
                </a>
              )}
              {p.status === "aceita" && (
                <div className="mt-3 flex flex-col items-center border-t border-line pt-3">
                  <div className="text-xs font-semibold text-sub">{p.minhaNota ? "Sua avaliação" : `Como foi com ${primeiroNome(p.passageiroNome)}?`}</div>
                  <Estrelas valor={p.minhaNota} onEscolher={(n) => onAvaliar(p, n)} desabilitado={avaliando === p.id} />
                </div>
              )}
              {p.status === "cancelada" && (
                <p className="mt-2 text-xs text-sub">
                  {p.canceladoPor === "motorista" ? "Você desfez o aceite." : `${primeiroNome(p.passageiroNome)} cancelou o pedido.`}
                </p>
              )}
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <button onClick={() => setDenunciado(p)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-sub transition active:scale-[.98]">
                  <Flag size={12} /> Denunciar
                </button>
                {p.status === "aceita" && (
                  <button onClick={() => setDesfazendo(p)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-sub transition active:scale-[.98]">
                    <Undo2 size={12} /> Desfazer aceite
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Notificacoes onAviso={mostrar} />

      <Link to="/privacidade"
        className="mt-5 flex w-full items-center gap-2.5 rounded-[14px] border border-line bg-surface px-4 py-3.5 text-sm font-semibold transition active:scale-[.98]">
        <ShieldCheck size={17} className="shrink-0 text-brand" />
        <span className="flex-1">Privacidade e uso dos dados</span>
        <ChevronRight size={17} className="shrink-0 text-sub" />
      </Link>

      <button onClick={onSair}
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-[14px] border border-line bg-surface py-4 text-sm font-bold text-sub transition active:scale-[.98]">
        <LogOut size={17} /> Sair
      </button>

      {desfazendo && (
        <Confirmar titulo="Desfazer o aceite?"
          texto={`${primeiroNome(desfazendo.passageiroNome)} recebe um aviso e o telefone de cada um deixa de aparecer no app. Se já tinham combinado algo, avise pelo WhatsApp antes.`}
          acao="Desfazer aceite" onConfirmar={() => onDesfazer(desfazendo)} onFechar={() => setDesfazendo(null)} />
      )}
      {denunciado && (
        <Denunciar denunciadoRa={denunciado.passageiroRa} denunciadoNome={denunciado.passageiroNome}
          onFechar={() => setDenunciado(null)}
          onEnviada={() => { setDenunciado(null); mostrar("ok", "Denúncia enviada. A administração vai analisar."); }} />
      )}
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  const cor = status === "aceita" ? "bg-good-soft text-good-ink" : status === "pendente" ? "bg-brand-soft text-brand" : "bg-canvas text-sub";
  return <span className={cn("shrink-0 rounded-lg px-2.5 py-0.5 text-xs font-semibold capitalize", cor)}>{status}</span>;
}
