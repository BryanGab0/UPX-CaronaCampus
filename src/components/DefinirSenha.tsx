import { useState } from "react";
import type { ChangeEvent } from "react";
import { Route as RouteIcon, KeyRound, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { trocarSenha } from "../lib/api";

const SENHA_MIN = 6;

// Troca obrigatória: quem entrou com a senha temporária gerada pelo admin só usa o app depois de
// definir a própria (o admin viu a temporária). A API também barra o resto até a troca.
// Mesma moldura do Login.
export function DefinirSenha() {
  const { ra, nome, sair, atualizarSessao, senhaDigitadaNoLogin } = useAuth();
  // A temporária fica na memória desde o login; depois de recarregar a página, é pedida de novo.
  const [temporaria, setTemporaria] = useState(senhaDigitadaNoLogin ?? "");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!temporaria) { setErro("Digite a senha temporária que você recebeu."); return; }
    if (nova.length < SENHA_MIN) { setErro(`A nova senha deve ter ao menos ${SENHA_MIN} caracteres.`); return; }
    if (nova !== confirmacao) { setErro("A confirmação não é igual à nova senha."); return; }
    setSalvando(true); setErro(null);
    try {
      const token = await trocarSenha(ra, temporaria, nova);
      atualizarSessao({ token, senhaTemporaria: false }); // libera o app
    } catch (e) {
      console.error(e);
      setErro(e instanceof Error && !e.message.startsWith("Erro ") ? e.message : "Não foi possível definir a senha. Tente novamente.");
      setSalvando(false);
    }
  };

  const campo = "mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-base outline-none focus:border-brand";
  const mudar = (definir: (v: string) => void) => (e: ChangeEvent<HTMLInputElement>) => { definir(e.target.value); setErro(null); };

  return (
    <div className="flex min-h-dvh justify-center bg-canvas desk:h-dvh desk:items-center desk:bg-shell desk:p-5">
      <main className="no-scrollbar relative flex min-h-dvh w-full flex-col overflow-y-auto bg-canvas px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(3.5rem+env(safe-area-inset-top))] text-ink min-[380px]:px-7 desk:h-[min(812px,100%)] desk:min-h-0 desk:max-w-[430px] desk:rounded-[32px] desk:pb-8 desk:pt-14 desk:shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div className="grid size-11 place-items-center rounded-[13px] bg-brand shadow-[0_8px_20px_rgba(47,75,255,.33)]">
            <RouteIcon size={24} color="#fff" strokeWidth={2.4} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">CaronaCampus</span>
        </div>

        <div className="mt-9 flex-1">
          <div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><KeyRound size={22} /></div>
          <h1 className="mt-4 font-display text-[28px] font-bold leading-[1.1] tracking-tight">Defina sua nova senha</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-sub">
            {nome ? `${nome.split(" ")[0]}, você` : "Você"} entrou com uma senha temporária da administração. Para continuar, crie uma senha que só você conheça.
          </p>

          <div className="mt-6 space-y-3">
            {!senhaDigitadaNoLogin && (
              <label className="block">
                <span className="text-xs font-semibold text-sub">Senha temporária</span>
                <input type="password" value={temporaria} onChange={mudar(setTemporaria)} autoComplete="current-password" className={campo} />
              </label>
            )}
            <label className="block">
              <span className="text-xs font-semibold text-sub">Nova senha (mínimo {SENHA_MIN} caracteres)</span>
              <input type="password" value={nova} onChange={mudar(setNova)} autoComplete="new-password" className={campo} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-sub">Confirme a nova senha</span>
              <input type="password" value={confirmacao} onChange={mudar(setConfirmacao)} onKeyDown={(e) => e.key === "Enter" && salvar()}
                autoComplete="new-password" className={campo} />
            </label>

            {erro && <p role="alert" className="text-[13px] text-accent-ink">{erro}</p>}

            <button onClick={salvar} disabled={salvando}
              className="w-full rounded-[14px] bg-brand py-4 text-[15.5px] font-bold text-white transition active:scale-[.98] disabled:opacity-60">
              {salvando ? "Salvando…" : "Salvar e continuar"}
            </button>
          </div>
        </div>

        <button onClick={() => sair()} className="mx-auto mt-6 flex items-center gap-1.5 text-[13.5px] font-semibold text-sub">
          <LogOut size={15} /> Sair
        </button>
      </main>
    </div>
  );
}
