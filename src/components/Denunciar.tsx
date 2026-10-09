import { useState } from "react";
import { Flag, X } from "lucide-react";
import { cn } from "../lib/cn";
import { useAuth } from "../context/AuthContext";
import { denunciar } from "../lib/api";
import type { MotivoDenuncia } from "../lib/api";
import { Folha } from "./Folha";

const MOTIVOS: { id: MotivoDenuncia; texto: string }[] = [
  { id: "seguranca", texto: "Direção perigosa ou me senti inseguro(a)" },
  { id: "comportamento", texto: "Comportamento inadequado ou ofensivo" },
  { id: "perfil_falso", texto: "Perfil falso ou não é aluno da Facens" },
  { id: "nao_compareceu", texto: "Combinou e não compareceu" },
  { id: "outro", texto: "Outro motivo" },
];
const DESCRICAO_MAX = 500;

interface Props {
  denunciadoRa: string;
  denunciadoNome: string;
  onFechar: () => void;
  onEnviada: () => void;
}

// Folha de denúncia (ver Folha: no celular sobe de baixo, no desktop fica centralizada).
export function Denunciar({ denunciadoRa, denunciadoNome, onFechar, onEnviada }: Props) {
  const { ra } = useAuth();
  const [motivo, setMotivo] = useState<MotivoDenuncia | null>(null);
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const enviar = async () => {
    if (!motivo) { setErro("Escolha um motivo."); return; }
    setEnviando(true); setErro(null);
    try {
      await denunciar(ra, denunciadoRa, motivo, descricao);
      onEnviada();
    } catch (e) {
      console.error(e);
      setErro(e instanceof Error ? e.message : "Não foi possível enviar a denúncia. Tente novamente.");
      setEnviando(false);
    }
  };

  return (
    <Folha tituloId="titulo-denuncia" onFechar={onFechar}>
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft"><Flag size={18} className="text-accent" /></div>
        <div className="min-w-0 flex-1">
          <h2 id="titulo-denuncia" className="font-display text-lg font-bold">Denunciar</h2>
          <p className="truncate text-xs text-sub">{denunciadoNome}</p>
        </div>
        <button onClick={onFechar} aria-label="Fechar" className="grid size-9 shrink-0 place-items-center rounded-xl text-sub transition active:scale-[.98]">
          <X size={18} />
        </button>
      </div>

      <fieldset className="mt-4 space-y-2">
        <legend className="mb-2 text-xs font-semibold text-sub">O que aconteceu?</legend>
        {MOTIVOS.map((m) => (
          <label key={m.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition",
            motivo === m.id ? "border-brand bg-brand-soft" : "border-line")}>
            <input type="radio" name="motivo" value={m.id} checked={motivo === m.id}
              onChange={() => { setMotivo(m.id); setErro(null); }} className="size-4 shrink-0 accent-brand" />
            {m.texto}
          </label>
        ))}
      </fieldset>

      <label className="mt-4 block">
        <span className="text-xs font-semibold text-sub">Detalhes (opcional)</span>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={DESCRICAO_MAX} rows={3}
          placeholder="Conte o que aconteceu. Só a administração vê."
          className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-3 text-sm outline-none focus:border-brand" />
        <span className="block text-right text-[11px] text-sub">{descricao.length}/{DESCRICAO_MAX}</span>
      </label>

      {erro && <p role="alert" className="mt-1 text-[13px] text-accent-ink">{erro}</p>}

      <button onClick={enviar} disabled={enviando}
        className="mt-3 w-full rounded-[14px] bg-accent-ink py-3.5 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-60">
        {enviando ? "Enviando…" : "Enviar denúncia"}
      </button>
      <p className="mt-2 text-center text-[11px] text-sub">A pessoa denunciada não fica sabendo quem denunciou.</p>
    </Folha>
  );
}
