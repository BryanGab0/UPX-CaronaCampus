import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, Fuel, Users, Leaf, Check, Clock, MessageCircle, Flag, X } from "lucide-react";
import { cn } from "../lib/cn";
import { iniciais, linkWhatsapp, primeiroNome } from "../lib/formato";
import { FACENS } from "../data/mock";
import { useResultados } from "../hooks/useResultados";
import { usePerfilContext } from "../context/PerfilContext";
import { useAuth } from "../context/AuthContext";
import { avaliar, buscarSolicitacoes, cancelarSolicitacao, solicitarCarona } from "../lib/api";
import type { MinhaSolicitacao } from "../lib/api";
import { PESO_HORARIO, PESO_ROTA, reais } from "../lib/match";
import { CompatRing } from "./CompatRing";
import { MapaRota } from "./MapaRota";
import { useAviso } from "../hooks/useAviso";
import { Carregando, ErroCarga } from "./Estado";
import { Aviso } from "./Aviso";
import { Denunciar } from "./Denunciar";
import { Confirmar } from "./Confirmar";
import { Estrelas, NotaMedia } from "./Estrelas";

export function Detalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ra } = useAuth();
  const { trajeto } = usePerfilContext();
  const { resultados, carregando, erro, recarregar: recarregarCaronas } = useResultados();

  const [solic, setSolic] = useState<MinhaSolicitacao | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [denunciando, setDenunciando] = useState(false);
  const [cancelando, setCancelando] = useState(false); // folha de confirmação aberta
  const { aviso, mostrar } = useAviso();
  const [avaliando, setAvaliando] = useState(false);

  const recarregar = () => {
    if (!ra || !id) return;
    buscarSolicitacoes(ra).then((lista) => setSolic(lista.find((s) => s.motoristaRa === id) ?? null)).catch(() => {});
  };
  useEffect(recarregar, [ra, id]);

  const onSolicitar = async () => {
    if (!ra || !id) return;
    setEnviando(true); setErroAcao(null);
    try { await solicitarCarona(ra, id); recarregar(); }
    catch (e) { console.error(e); setErroAcao("Não foi possível enviar o pedido. Tente novamente."); }
    finally { setEnviando(false); }
  };

  // Lança o erro para a folha de confirmação mostrar (ex.: o motorista respondeu nesse meio-tempo).
  const onCancelar = async () => {
    if (!solic) return;
    const desistiu = solic.status === "aceita";
    await cancelarSolicitacao(solic.id);
    setCancelando(false);
    recarregar();
    mostrar("ok", desistiu ? "Você desistiu da carona. O motorista foi avisado." : "Pedido cancelado.");
  };

  const onAvaliar = async (nota: number) => {
    if (!solic) return;
    setAvaliando(true);
    try { await avaliar(solic.id, nota); recarregar(); mostrar("ok", "Avaliação salva. Obrigado!"); }
    catch (e) { console.error(e); mostrar("erro", "Não foi possível salvar a avaliação. Tente novamente."); }
    finally { setAvaliando(false); }
  };

  if (carregando) return <div className="pt-[46px]"><Carregando /></div>;
  if (erro) return <div className="px-[22px] pt-[46px]"><ErroCarga titulo="Não foi possível carregar esta carona" onTentar={recarregarCaronas} /></div>;

  const resultado = resultados.find((r) => r.carona.id === id);
  if (!resultado) {
    return (
      <div className="grid min-h-[60dvh] place-items-center px-10 text-center text-sub">
        <div>
          <p className="text-sm">Carona não encontrada.</p>
          <button onClick={() => navigate("/")} className="mt-3 font-semibold text-brand">Voltar para o início</button>
        </div>
      </div>
    );
  }

  const { carona, compat, scoreHorario, scoreRota, diasComuns, difChegadaMin, desvioKm, custoDia } = resultado;
  const mensal = reais(custoDia * 22);
  const status = solic?.status;

  return (
    <div className="animate-rise pb-6">
      <div className="flex items-center gap-3 border-b border-line bg-surface px-[22px] pb-3 pt-[44px]">
        <button onClick={() => navigate(-1)} aria-label="Voltar" className="grid size-10 shrink-0 place-items-center rounded-xl border border-line transition active:scale-[.98]">
          <ChevronLeft size={19} className="text-sub" />
        </button>
        <div className="hidden size-11 shrink-0 place-items-center rounded-[13px] bg-brand text-sm font-bold text-white min-[360px]:grid">{iniciais(carona.nome)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="min-w-0 truncate font-bold">{carona.nome}</span>
            <NotaMedia media={carona.notaMedia} total={carona.totalAvaliacoes} />
          </div>
          <div className="truncate text-xs text-sub">motorista · {carona.endereco}</div>
        </div>
        <CompatRing valor={compat} />
      </div>

      <div className="px-[22px]">
        <div className="mt-4 rounded-[18px] border border-line bg-surface p-2">
          <MapaRota voce={trajeto.origem} motorista={carona.origem} destino={FACENS} />
          <div className="flex flex-wrap justify-center gap-4 py-1.5 text-[11px] text-sub">
            <Legenda className="bg-accent" texto="você" />
            <Legenda className="bg-brand" texto="motorista / rota" />
            <Legenda className="bg-ink" texto="Facens" />
          </div>
        </div>

        <div className="mt-3.5 rounded-[18px] border border-line bg-surface p-4">
          <div className="font-display font-bold">Por que esse match?</div>
          <Barra titulo="Compatibilidade de horário" pct={Math.round(scoreHorario * 100)}
            detalhe={`chega ${carona.chegada} · ${difChegadaMin} min de diferença · ${diasComuns.length} dias em comum`} cor="bg-brand" />
          <Barra titulo="Proximidade de rota" pct={Math.round(scoreRota * 100)}
            detalhe={`${desvioKm.toFixed(1)} km fora da sua rota direta até a Facens`} cor="bg-good" />
          <p className="mt-3 text-[11.5px] leading-relaxed text-sub">
            Nota final = {Math.round(PESO_HORARIO * 100)}% horário + {Math.round(PESO_ROTA * 100)}% rota = <b className="text-ink">{compat}%</b>
          </p>
        </div>

        <div className="mt-3.5 rounded-[18px] border border-line bg-surface p-4">
          <div className="font-display font-bold">Divisão do combustível</div>
          <div className="mt-3 flex gap-2.5">
            <Metric icone={<Fuel size={16} />} valor={reais(custoDia)} label="sua parte por dia (estimado)" destaque />
            <Metric icone={<Users size={16} />} valor={mensal} label="estimativa no mês" />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-good-soft px-3.5 py-3">
            <Leaf size={18} className="shrink-0 text-good" />
            <div className="text-xs text-ink">Combinem o ponto de encontro e os detalhes pelo WhatsApp após o aceite.</div>
          </div>
        </div>

        {/* Ação / status */}
        {erroAcao && <p role="alert" className="mt-5 text-[13px] text-accent-ink">{erroAcao}</p>}
        {status === "aceita" && solic?.motoristaTelefone ? (
          <a href={linkWhatsapp(solic.motoristaTelefone, `Oi ${primeiroNome(carona.nome)}! Topei a carona pra Facens. Vamos combinar o ponto de encontro?`)}
            target="_blank" rel="noopener noreferrer"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-[14px] bg-good-ink px-4 py-4 text-center text-sm font-bold text-white transition active:scale-[.98]">
            <MessageCircle size={18} className="shrink-0" /> Chamar {primeiroNome(carona.nome)} no WhatsApp
          </a>
        ) : status === "pendente" ? (
          <>
            <div className="mt-2 flex items-center justify-center gap-2 rounded-[14px] bg-brand-soft px-4 py-4 text-center text-sm font-bold text-brand">
              <Clock size={18} className="shrink-0" /> Pedido enviado · aguardando o motorista
            </div>
            <BotaoCancelar texto="Cancelar pedido" onClick={() => setCancelando(true)} />
          </>
        ) : status === "recusada" ? (
          <div className="mt-2 rounded-[14px] bg-canvas py-4 text-center text-sm font-bold text-sub">Pedido recusado</div>
        ) : (
          <>
            {/* Cancelado: explica o que houve; dá para pedir de novo. */}
            {status === "cancelada" && (
              <p className={cn("text-center text-[13px] text-sub", erroAcao ? "mt-2" : "mt-5")}>
                {solic?.canceladoPor === "motorista"
                  ? `${primeiroNome(carona.nome)} desfez o aceite. Se quiser, peça de novo.`
                  : "Você cancelou este pedido. Pode pedir de novo quando quiser."}
              </p>
            )}
            <button onClick={onSolicitar} disabled={enviando}
              className={cn("w-full rounded-[14px] bg-brand py-4 text-sm font-bold text-white transition active:scale-[.98]", erroAcao || status === "cancelada" ? "mt-3" : "mt-5")}>
              {enviando ? "Enviando…" : "Solicitar carona"}
            </button>
          </>
        )}
        {status === "aceita" && (
          <>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-good-ink"><Check size={14} /> Carona aceita!</div>
            <BotaoCancelar texto="Desistir da carona" onClick={() => setCancelando(true)} />
          </>
        )}
        {status === "aceita" && solic && (
          <div className="mt-4 flex flex-col items-center rounded-[18px] border border-line bg-surface p-4">
            <div className="text-sm font-bold">{solic.minhaNota ? "Sua avaliação" : `Como foi a carona com ${primeiroNome(carona.nome)}?`}</div>
            <p className="mt-0.5 text-center text-xs text-sub">A nota ajuda outros alunos a escolher com quem ir. Dá para mudar depois.</p>
            <div className="mt-2"><Estrelas valor={solic.minhaNota} onEscolher={onAvaliar} desabilitado={avaliando} /></div>
          </div>
        )}

        <Aviso aviso={aviso} />
        <button onClick={() => setDenunciando(true)}
          className="mx-auto mt-6 flex items-center gap-1.5 text-xs font-semibold text-sub transition active:scale-[.98]">
          <Flag size={13} /> Denunciar este motorista
        </button>
      </div>

      {cancelando && solic && (
        <Confirmar
          titulo={solic.status === "aceita" ? "Desistir da carona?" : "Cancelar o pedido?"}
          texto={solic.status === "aceita"
            ? `${primeiroNome(carona.nome)} recebe um aviso e o telefone de cada um deixa de aparecer no app. Se já tinham combinado algo, avise pelo WhatsApp antes.`
            : `O pedido para ${primeiroNome(carona.nome)} deixa de aguardar resposta. Você pode pedir de novo depois.`}
          acao={solic.status === "aceita" ? "Desistir" : "Cancelar pedido"}
          onConfirmar={onCancelar} onFechar={() => setCancelando(false)} />
      )}
      {denunciando && (
        <Denunciar denunciadoRa={carona.id} denunciadoNome={carona.nome} onFechar={() => setDenunciando(false)}
          onEnviada={() => { setDenunciando(false); mostrar("ok", "Denúncia enviada. A administração vai analisar."); }} />
      )}
    </div>
  );
}

function BotaoCancelar({ texto, onClick }: { texto: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="mx-auto mt-3 flex items-center gap-1.5 text-xs font-semibold text-sub transition active:scale-[.98]">
      <X size={13} /> {texto}
    </button>
  );
}

function Legenda({ className, texto }: { className: string; texto: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className={cn("size-2.5 rounded-full", className)} />{texto}</span>;
}
function Barra({ titulo, pct, detalhe, cor }: { titulo: string; pct: number; detalhe: string; cor: string }) {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[13px] font-semibold"><span>{titulo}</span><span className="font-display">{pct}%</span></div>
      <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-canvas"><div className={cn("h-full rounded-full", cor)} style={{ width: `${pct}%` }} /></div>
      <div className="mt-1.5 text-[11.5px] text-sub">{detalhe}</div>
    </div>
  );
}
function Metric({ icone, valor, label, destaque }: { icone: ReactNode; valor: string; label: string; destaque?: boolean }) {
  return (
    <div className={cn("min-w-0 flex-1 rounded-[13px] p-3.5", destaque ? "bg-brand-soft" : "bg-canvas")}>
      <div className={destaque ? "text-brand" : "text-sub"}>{icone}</div>
      <div className={cn("font-display mt-1.5 text-lg font-bold tracking-tight", destaque && "text-brand")}>{valor}</div>
      <div className="mt-0.5 text-[11px] leading-tight text-sub">{label}</div>
    </div>
  );
}
