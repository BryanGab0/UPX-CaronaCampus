import { useEffect, useMemo, useState } from "react";
import { alterarBloqueio, buscarUsuarios, gerarSenhaTemporaria } from "../lib/api";
import type { UsuarioAdmin } from "../lib/api";
import { KeyRound, Copy, Check, X } from "lucide-react";
import { cn } from "../lib/cn";
import { combina, paginar } from "../lib/filtro";
import { Carregando, ErroCarga } from "./Estado";
import { BarraFiltros, Busca, Opcoes, Paginacao, SemResultado } from "./Filtros";

type Filtro = "todos" | "alunos" | "admins" | "bloqueados";
const FILTROS: { id: Filtro; texto: string; teste: (u: UsuarioAdmin) => boolean }[] = [
  { id: "todos", texto: "Todos", teste: () => true },
  { id: "alunos", texto: "Alunos", teste: (u) => !u.admin },
  { id: "admins", texto: "Admins", teste: (u) => u.admin },
  { id: "bloqueados", texto: "Bloqueados", teste: (u) => u.bloqueado },
];
const testeDo = (id: Filtro) => FILTROS.find((f) => f.id === id)!.teste;

const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export function Usuarios() {
  const [lista, setLista] = useState<UsuarioAdmin[] | null>(null);
  const [erro, setErro] = useState(false);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    buscarUsuarios().then(setLista).catch((e: unknown) => { console.error(e); setErro(true); });
  }, [versao]);

  const tentar = () => { setErro(false); setVersao((v) => v + 1); };

  // Busca + filtro; mudar qualquer um volta para a página 1.
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [pagina, setPagina] = useState(1);
  const mudarBusca = (v: string) => { setBusca(v); setPagina(1); };
  const mudarFiltro = (v: Filtro) => { setFiltro(v); setPagina(1); };
  const limpar = () => { setBusca(""); setFiltro("todos"); setPagina(1); };

  const filtrada = useMemo(
    () => (lista ?? []).filter((u) => testeDo(filtro)(u) && combina([u.ra, u.nome, u.email, u.telefone], busca)),
    [lista, filtro, busca],
  );
  const pag = paginar(filtrada, pagina);

  const [alterando, setAlterando] = useState<string | null>(null); // RA em andamento
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const alternarBloqueio = async (u: UsuarioAdmin) => {
    const bloquear = !u.bloqueado;
    if (bloquear && !window.confirm(`Bloquear ${u.nome}? A pessoa perde o acesso ao app na hora.`)) return;
    setAlterando(u.ra); setErroAcao(null);
    try {
      await alterarBloqueio(u.ra, bloquear);
      setLista((l) => l?.map((x) => (x.ra === u.ra ? { ...x, bloqueado: bloquear } : x)) ?? l);
    } catch (e) {
      console.error(e);
      setErroAcao(`Não foi possível ${bloquear ? "bloquear" : "desbloquear"} ${u.nome}. Tente novamente.`);
    } finally {
      setAlterando(null);
    }
  };

  // Senha temporária recém-gerada: aparece uma única vez, até o admin fechar o aviso.
  const [gerada, setGerada] = useState<{ nome: string; senha: string } | null>(null);
  const [copiada, setCopiada] = useState(false);

  const gerarSenha = async (u: UsuarioAdmin) => {
    if (!window.confirm(`Gerar uma senha temporária para ${u.nome}? A senha atual deixa de valer e a pessoa sai da conta em todos os aparelhos. Confira a identidade antes de entregar a nova senha.`)) return;
    setAlterando(u.ra); setErroAcao(null); setCopiada(false);
    try {
      const senha = await gerarSenhaTemporaria(u.ra);
      setGerada({ nome: u.nome, senha });
      setLista((l) => l?.map((x) => (x.ra === u.ra ? { ...x, senha_temporaria: true } : x)) ?? l);
    } catch (e) {
      console.error(e);
      setErroAcao(`Não foi possível gerar a senha temporária de ${u.nome}. Tente novamente.`);
    } finally {
      setAlterando(null);
    }
  };

  const copiar = async () => {
    if (!gerada) return;
    try { await navigator.clipboard.writeText(gerada.senha); setCopiada(true); }
    catch { setCopiada(false); } // sem permissão de área de transferência: a senha continua visível para copiar à mão
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Usuários</h1>
      <p className="mt-1 text-sm text-sub">{lista ? `${lista.length} cadastrados` : erro ? "" : "Carregando…"}</p>

      {erro ? (
        <div className="mt-6"><ErroCarga onTentar={tentar} /></div>
      ) : !lista ? (
        <Carregando />
      ) : (
        <>
        <BarraFiltros>
          <Busca valor={busca} onChange={mudarBusca} placeholder="Buscar usuário" rotulo="Buscar por RA, nome, e-mail ou telefone" />
          <Opcoes rotulo="Filtrar usuários" valor={filtro} onChange={mudarFiltro}
            opcoes={FILTROS.map((f) => ({ id: f.id, texto: f.texto, total: lista.filter(f.teste).length }))} />
        </BarraFiltros>
        {erroAcao && <p role="alert" className="mt-4 text-sm font-semibold text-accent-ink">{erroAcao}</p>}
        {gerada && (
          <div role="status" className="mt-4 rounded-2xl border border-brand bg-brand-soft p-4">
            <div className="flex items-start gap-3">
              <KeyRound size={18} className="mt-0.5 shrink-0 text-brand" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Senha temporária de {gerada.nome}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="rounded-lg bg-surface px-3 py-1.5 font-mono text-base tracking-wider">{gerada.senha}</code>
                  <button onClick={copiar}
                    className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-sub transition hover:border-ink hover:text-ink">
                    {copiada ? <><Check size={14} /> Copiada</> : <><Copy size={14} /> Copiar</>}
                  </button>
                </div>
                <p className="mt-2 text-xs text-sub">
                  Entregue pessoalmente ou pelo WhatsApp. Ela não aparece de novo, e o aluno vai ter que trocá-la ao entrar.
                </p>
              </div>
              <button onClick={() => setGerada(null)} aria-label="Fechar o aviso da senha temporária"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-sub transition hover:text-ink">
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        {filtrada.length === 0 ? <SemResultado onLimpar={limpar} /> : (
        <>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-sub">
              <tr>
                <th className="px-4 py-3 sm:px-5 font-semibold">RA</th>
                <th className="px-4 py-3 sm:px-5 font-semibold">Nome</th>
                <th className="px-4 py-3 sm:px-5 font-semibold">E-mail</th>
                <th className="px-4 py-3 sm:px-5 font-semibold">Telefone</th>
                <th className="px-4 py-3 sm:px-5 font-semibold">Tipo</th>
                <th className="px-4 py-3 sm:px-5 font-semibold">Cadastro</th>
                <th className="px-4 py-3 sm:px-5 font-semibold">Situação</th>
              </tr>
            </thead>
            <tbody>
              {pag.itens.map((u) => (
                <tr key={u.ra} className={cn("border-b border-line last:border-0", u.bloqueado && "bg-canvas")}>
                  <td className="px-4 py-3 sm:px-5 font-mono text-xs">{u.ra}</td>
                  <td className="px-4 py-3 sm:px-5 font-semibold">{u.nome}</td>
                  <td className="px-4 py-3 sm:px-5 text-sub">{u.email}</td>
                  <td className="px-4 py-3 sm:px-5 text-sub">{u.telefone ?? "—"}</td>
                  <td className="px-4 py-3 sm:px-5">
                    {u.admin ? (
                      <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">admin</span>
                    ) : (
                      <span className="text-xs text-sub">aluno</span>
                    )}
                  </td>
                  <td className="px-4 py-3 sm:px-5 text-sub">{data(u.criado_em)}</td>
                  <td className="px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-3">
                      <span className={cn("text-xs font-semibold", u.bloqueado ? "text-accent-ink" : "text-good-ink")}>
                        {u.bloqueado ? "bloqueado" : "ativo"}
                      </span>
                      {u.senha_temporaria && (
                        <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">senha temporária</span>
                      )}
                      {!u.admin && (
                        <button onClick={() => alternarBloqueio(u)} disabled={alterando === u.ra}
                          className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-sub transition hover:border-ink hover:text-ink disabled:opacity-50">
                          {u.bloqueado ? "Desbloquear" : "Bloquear"}
                        </button>
                      )}
                      {!u.admin && (
                        <button onClick={() => gerarSenha(u)} disabled={alterando === u.ra}
                          className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-sub transition hover:border-ink hover:text-ink disabled:opacity-50">
                          Senha temporária
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paginacao pagina={pag} total={filtrada.length} onMudar={setPagina} />
        </>
        )}
        </>
      )}
    </div>
  );
}
