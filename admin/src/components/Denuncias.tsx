import { useEffect, useState } from "react";
import { alterarBloqueio, alterarStatusDenuncia, buscarDenuncias } from "../lib/api";
import type { DenunciaAdmin } from "../lib/api";
import { cn } from "../lib/cn";
import { Carregando, ErroCarga } from "./Estado";

const MOTIVOS: Record<string, string> = {
  comportamento: "Comportamento inadequado",
  seguranca: "Direção perigosa / insegurança",
  perfil_falso: "Perfil falso ou não é aluno",
  nao_compareceu: "Não compareceu",
  outro: "Outro",
};

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function Denuncias() {
  const [lista, setLista] = useState<DenunciaAdmin[] | null>(null);
  const [erro, setErro] = useState(false);
  const [versao, setVersao] = useState(0);
  const [alterando, setAlterando] = useState<number | null>(null); // id da denúncia em andamento
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  useEffect(() => {
    buscarDenuncias().then(setLista).catch((e: unknown) => { console.error(e); setErro(true); });
  }, [versao]);

  const tentar = () => { setErro(false); setVersao((v) => v + 1); };
  const abertas = lista?.filter((d) => d.status === "aberta").length ?? 0;

  // Executa a ação e recarrega a lista (o bloqueio afeta todas as denúncias da mesma pessoa).
  const agir = async (d: DenunciaAdmin, acao: () => Promise<void>, falhou: string) => {
    setAlterando(d.id); setErroAcao(null);
    try {
      await acao();
      setLista(await buscarDenuncias());
    } catch (e) {
      console.error(e);
      setErroAcao(falhou);
    } finally {
      setAlterando(null);
    }
  };

  const alternarBloqueio = (d: DenunciaAdmin) => {
    const bloquear = !d.denunciadoBloqueado;
    if (bloquear && !window.confirm(`Bloquear ${d.denunciadoNome}? A pessoa perde o acesso ao app na hora.`)) return;
    agir(d, () => alterarBloqueio(d.denunciadoRa, bloquear), `Não foi possível ${bloquear ? "bloquear" : "desbloquear"} ${d.denunciadoNome}.`);
  };

  const alternarStatus = (d: DenunciaAdmin) =>
    agir(d, () => alterarStatusDenuncia(d.id, d.status === "aberta" ? "resolvida" : "aberta"), "Não foi possível atualizar a denúncia.");

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Denúncias</h1>
      <p className="mt-1 text-sm text-sub">{lista ? `${abertas} em aberto · ${lista.length} no total` : "Carregando…"}</p>

      {erro ? (
        <div className="mt-6"><ErroCarga onTentar={tentar} /></div>
      ) : !lista ? (
        <Carregando />
      ) : lista.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-line bg-surface p-6 text-center text-sm text-sub">Nenhuma denúncia recebida.</p>
      ) : (
        <>
          {erroAcao && <p role="alert" className="mt-4 text-sm font-semibold text-accent">{erroAcao}</p>}
          <div className="mt-6 space-y-3">
            {lista.map((d) => (
              <article key={d.id} className={cn("rounded-2xl border border-line bg-surface p-4 sm:p-5", d.status === "resolvida" && "opacity-60")}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">{MOTIVOS[d.motivo] ?? d.motivo}</span>
                  <span className={cn("text-xs font-semibold", d.status === "aberta" ? "text-accent" : "text-good")}>{d.status}</span>
                  <span className="ml-auto text-xs text-sub">{dataHora(d.criadoEm)}</span>
                </div>

                <p className="mt-3 text-sm">
                  <b>{d.denuncianteNome}</b> <span className="text-sub">({d.denuncianteRa})</span> denunciou{" "}
                  <b>{d.denunciadoNome}</b> <span className="text-sub">({d.denunciadoRa})</span>
                  {d.denunciadoBloqueado && <span className="ml-2 text-xs font-semibold text-accent">bloqueado</span>}
                </p>
                {d.descricao && <p className="mt-2 whitespace-pre-line break-words rounded-xl bg-canvas p-3 text-sm text-sub">{d.descricao}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => alternarBloqueio(d)} disabled={alterando === d.id}
                    className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50",
                      d.denunciadoBloqueado ? "border border-line text-sub hover:border-ink hover:text-ink" : "bg-accent text-white hover:opacity-90")}>
                    {d.denunciadoBloqueado ? `Desbloquear ${d.denunciadoNome}` : `Bloquear ${d.denunciadoNome}`}
                  </button>
                  <button onClick={() => alternarStatus(d)} disabled={alterando === d.id}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-sub transition hover:border-ink hover:text-ink disabled:opacity-50">
                    {d.status === "aberta" ? "Marcar como resolvida" : "Reabrir"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
