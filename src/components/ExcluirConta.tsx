import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Trash2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { excluirConta } from "../lib/api";
import { desativarPush } from "../lib/push";
import { Folha } from "./Folha";
import type { FolhaControle } from "./Folha";

// Exclusão da própria conta (LGPD). Explica o que some e o que fica, e pede a senha: uma sessão
// esquecida aberta em outro aparelho não basta para apagar a conta de alguém.
export function ExcluirConta({ onFechar }: { onFechar: () => void }) {
  const { ra, sair } = useAuth();
  const navigate = useNavigate();
  const folha = useRef<FolhaControle>(null);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const excluir = async () => {
    if (!senha) { setErro("Digite sua senha para confirmar."); return; }
    setExcluindo(true); setErro(null);
    try {
      await excluirConta(ra, senha);
    } catch (e) {
      console.error(e);
      setErro(e instanceof Error && !e.message.startsWith("Erro ") ? e.message : "Não foi possível excluir a conta. Tente novamente.");
      setExcluindo(false);
      return;
    }
    // A conta já não existe: sai primeiro (sem token, a API não é mais chamada em nome dela) e
    // depois cancela a inscrição de notificações guardada neste navegador.
    sair("Sua conta foi excluída.");
    await desativarPush(ra).catch((e: unknown) => console.error(e));
    navigate("/login");
  };

  return (
    <Folha ref={folha} tituloId="titulo-excluir-conta" onFechar={onFechar}>
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft"><Trash2 size={18} className="text-accent" /></div>
        <div className="min-w-0 flex-1">
          <h2 id="titulo-excluir-conta" className="font-display text-lg font-bold">Excluir minha conta</h2>
          <p className="text-xs text-sub">Não dá para desfazer.</p>
        </div>
        <button onClick={() => folha.current?.fechar()} aria-label="Fechar" className="grid size-9 shrink-0 place-items-center rounded-xl text-sub transition active:scale-[.98]">
          <X size={18} />
        </button>
      </div>

      <ul className="mt-4 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-sub">
        <li>Saem seu cadastro, trajeto, pedidos de carona, avaliações e as denúncias feitas contra você.</li>
        <li>Quem tem carona aceita ou pedido pendente com você recebe um aviso.</li>
        <li>As denúncias que você fez continuam para a moderação, sem o seu nome.</li>
      </ul>

      <label className="mt-4 block">
        <span className="text-xs font-semibold text-sub">Confirme com a sua senha</span>
        <input type="password" value={senha} onChange={(e) => { setSenha(e.target.value); setErro(null); }}
          onKeyDown={(e) => e.key === "Enter" && excluir()} autoComplete="current-password"
          className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-base outline-none focus:border-brand" />
      </label>

      {erro && <p role="alert" className="mt-3 text-[13px] text-accent-ink">{erro}</p>}

      <div className="mt-4 flex gap-2">
        <button onClick={() => folha.current?.fechar()} disabled={excluindo}
          className="flex-1 rounded-[14px] border border-line py-3.5 text-sm font-bold text-sub transition active:scale-[.98] disabled:opacity-40">
          Voltar
        </button>
        <button onClick={excluir} disabled={excluindo}
          className="flex-1 rounded-[14px] bg-accent-ink py-3.5 text-sm font-bold text-on-brand transition active:scale-[.98] disabled:bg-line disabled:text-sub disabled:shadow-none">
          {excluindo ? "Excluindo…" : "Excluir conta"}
        </button>
      </div>
    </Folha>
  );
}
