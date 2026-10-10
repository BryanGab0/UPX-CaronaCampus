import { useEffect, useState } from "react";
import { UserPen, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { atualizarDados, buscarMeusDados } from "../lib/api";
import { formatarTelefone, telefoneValido } from "../lib/formato";
import { Folha } from "./Folha";
import { Carregando } from "./Estado";

// Folha para o aluno alterar o próprio nome e telefone (RA e e-mail identificam a conta e não mudam).
export function EditarDados({ onFechar, onSalvo }: { onFechar: () => void; onSalvo: () => void }) {
  const { ra, atualizarSessao } = useAuth();
  const [nome, setNome] = useState<string | null>(null); // null = ainda carregando os dados atuais
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // O telefone não fica na sessão do navegador: busca os dados atuais ao abrir.
  useEffect(() => {
    let ativo = true;
    buscarMeusDados()
      .then((d) => { if (ativo) { setNome(d.nome); setTelefone(formatarTelefone(d.telefone)); } })
      .catch((e: unknown) => { console.error(e); if (ativo) { setNome(""); setErro("Não foi possível carregar seus dados."); } });
    return () => { ativo = false; };
  }, []);

  const salvar = async () => {
    if (nome === null) return;
    if (nome.trim().length < 2) { setErro("Digite seu nome."); return; }
    if (!telefoneValido(telefone)) { setErro("Digite um telefone válido com DDD (ex.: 11 99999-9999)."); return; }
    setSalvando(true); setErro(null);
    try {
      const d = await atualizarDados(ra, { nome: nome.trim(), telefone: telefone.replace(/\D/g, "") });
      atualizarSessao({ nome: d.nome });
      onSalvo();
    } catch (e) {
      console.error(e);
      setErro(e instanceof Error && !e.message.startsWith("Erro ") ? e.message : "Não foi possível salvar. Tente novamente.");
      setSalvando(false);
    }
  };

  return (
    <Folha tituloId="titulo-editar-dados" onFechar={onFechar}>
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft"><UserPen size={18} className="text-brand" /></div>
        <div className="min-w-0 flex-1">
          <h2 id="titulo-editar-dados" className="font-display text-lg font-bold">Editar dados</h2>
          <p className="text-xs text-sub">O telefone só aparece para quem tiver carona aceita com você.</p>
        </div>
        <button onClick={onFechar} aria-label="Fechar" className="grid size-9 shrink-0 place-items-center rounded-xl text-sub transition active:scale-[.98]">
          <X size={18} />
        </button>
      </div>

      {nome === null ? <Carregando texto="Carregando seus dados…" /> : (
        <>
          <label className="mt-4 block">
            <span className="text-xs font-semibold text-sub">Nome</span>
            <input value={nome} onChange={(e) => { setNome(e.target.value); setErro(null); }} autoComplete="name" maxLength={80}
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-base outline-none focus:border-brand" />
          </label>
          <label className="mt-3 block">
            <span className="text-xs font-semibold text-sub">Telefone com DDD (WhatsApp)</span>
            <input value={telefone} onChange={(e) => { setTelefone(formatarTelefone(e.target.value)); setErro(null); }}
              placeholder="(11) 99999-9999" autoComplete="tel-national" inputMode="tel"
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-base outline-none focus:border-brand" />
          </label>

          {erro && <p role="alert" className="mt-3 text-[13px] text-accent-ink">{erro}</p>}

          <button onClick={salvar} disabled={salvando}
            className="mt-4 w-full rounded-[14px] bg-brand py-3.5 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-60">
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </>
      )}
    </Folha>
  );
}
