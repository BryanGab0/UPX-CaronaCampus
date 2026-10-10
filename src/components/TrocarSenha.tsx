import { useState } from "react";
import type { ChangeEvent } from "react";
import { KeyRound, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { trocarSenha } from "../lib/api";
import { verificarPush } from "../lib/push";
import { Folha } from "./Folha";

const SENHA_MIN = 6;

// Folha para trocar a senha. A API encerra as sessões dos outros aparelhos e remove as
// inscrições de notificação deles; este aparelho recebe um token novo e se inscreve de novo.
export function TrocarSenha({ onFechar, onTrocada }: { onFechar: () => void; onTrocada: () => void }) {
  const { ra, atualizarSessao } = useAuth();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!atual) { setErro("Digite sua senha atual."); return; }
    if (nova.length < SENHA_MIN) { setErro(`A nova senha deve ter ao menos ${SENHA_MIN} caracteres.`); return; }
    if (nova !== confirmacao) { setErro("A confirmação não é igual à nova senha."); return; }
    setSalvando(true); setErro(null);
    try {
      const token = await trocarSenha(ra, atual, nova);
      atualizarSessao({ token });
      // Se este aparelho recebia notificações, volta a se inscrever (a API apagou todas).
      await verificarPush(ra).catch((e: unknown) => console.error(e));
      onTrocada();
    } catch (e) {
      console.error(e);
      setErro(e instanceof Error && !e.message.startsWith("Erro ") ? e.message : "Não foi possível trocar a senha. Tente novamente.");
      setSalvando(false);
    }
  };

  const campo = "mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-base outline-none focus:border-brand";
  const mudar = (definir: (v: string) => void) => (e: ChangeEvent<HTMLInputElement>) => { definir(e.target.value); setErro(null); };

  return (
    <Folha tituloId="titulo-trocar-senha" onFechar={onFechar}>
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft"><KeyRound size={18} className="text-brand" /></div>
        <div className="min-w-0 flex-1">
          <h2 id="titulo-trocar-senha" className="font-display text-lg font-bold">Trocar senha</h2>
          <p className="text-xs text-sub">Os outros aparelhos em que você está logado vão sair da conta.</p>
        </div>
        <button onClick={onFechar} aria-label="Fechar" className="grid size-9 shrink-0 place-items-center rounded-xl text-sub transition active:scale-[.98]">
          <X size={18} />
        </button>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold text-sub">Senha atual</span>
        <input type="password" value={atual} onChange={mudar(setAtual)} autoComplete="current-password" className={campo} />
      </label>
      <label className="mt-3 block">
        <span className="text-xs font-semibold text-sub">Nova senha (mínimo {SENHA_MIN} caracteres)</span>
        <input type="password" value={nova} onChange={mudar(setNova)} autoComplete="new-password" className={campo} />
      </label>
      <label className="mt-3 block">
        <span className="text-xs font-semibold text-sub">Confirme a nova senha</span>
        <input type="password" value={confirmacao} onChange={mudar(setConfirmacao)} onKeyDown={(e) => e.key === "Enter" && salvar()}
          autoComplete="new-password" className={campo} />
      </label>

      {erro && <p role="alert" className="mt-3 text-[13px] text-accent-ink">{erro}</p>}

      <button onClick={salvar} disabled={salvando}
        className="mt-4 w-full rounded-[14px] bg-brand py-3.5 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-60">
        {salvando ? "Salvando…" : "Trocar senha"}
      </button>
    </Folha>
  );
}
