import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { LogOut, Mail, Inbox, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { buscarSolicitacoes } from "../lib/api";
import type { SolicitacaoResumo } from "../lib/api";
import { Carregando, ErroCarga } from "./Estado";
 
export function Perfil() {
  const { nome, email, ra, sair } = useAuth();
  const navigate = useNavigate();
  const iniciais = nome.split(" ").slice(0, 2).map((n) => n[0]).join("");
 
  const [solic, setSolic] = useState<SolicitacaoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
 
  // Busca as solicitações do usuário ao abrir o perfil.
  useEffect(() => {
    if (!ra) return;
    let ativo = true;
    buscarSolicitacoes(ra)
      .then((l) => { if (ativo) { setSolic(l); setErro(null); } })
      .catch((e: unknown) => { if (ativo) setErro(e instanceof Error ? e.message : "Falha ao carregar"); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [ra]);
 
  const onSair = () => {
    sair();
    navigate("/login");
  };
 
  return (
    <div className="animate-rise px-[22px] pt-[46px]">
      <h1 className="font-display text-[26px] font-bold tracking-tight">Perfil</h1>
 
      <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-line bg-surface p-4">
        <div className="grid size-14 place-items-center rounded-2xl bg-brand text-lg font-bold text-white">{iniciais}</div>
        <div className="min-w-0">
          <div className="font-bold">{nome}</div>
          <div className="flex items-center gap-1.5 truncate text-xs text-sub">
            <Mail size={13} /> {email}
          </div>
        </div>
      </div>
 
      {/* Minhas solicitações */}
      <div className="mt-5 flex items-center gap-2 text-sm font-bold">
        <Inbox size={16} className="text-brand" /> Minhas solicitações
      </div>
 
      {carregando ? (
        <Carregando texto="Carregando solicitações…" />
      ) : erro ? (
        <ErroCarga msg={erro} />
      ) : solic.length === 0 ? (
        <p className="mt-3 rounded-[18px] border border-line bg-surface p-6 text-center text-sm text-sub">
          Você ainda não solicitou nenhuma carona.
        </p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {solic.map((s) => (
            <Link
              key={s.caronaId}
              to={`/carona/${s.caronaId}`}
              className="flex items-center gap-3 rounded-[16px] border border-line bg-surface p-3.5 transition active:scale-[.98]"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-canvas text-sm font-bold text-ink">
                {s.nome.split(" ").slice(0, 2).map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{s.nome}</div>
                <div className="text-xs text-sub">{s.bairro}</div>
              </div>
              <span className="rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-semibold capitalize text-brand">{s.status}</span>
              <ChevronRight size={16} className="text-sub" />
            </Link>
          ))}
        </div>
      )}
 
      <button
        onClick={onSair}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-[14px] border border-line bg-surface py-4 text-sm font-bold text-sub transition active:scale-[.98]"
      >
        <LogOut size={17} /> Sair
      </button>
    </div>
  );
}
