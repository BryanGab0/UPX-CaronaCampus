import { useState } from "react";
import { ShieldCheck, Mail, Lock } from "lucide-react";
import { useAuth, emailInstitucional } from "../context/AuthContext";

export function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const enviar = async () => {
    setErro("");
    if (!emailInstitucional(email)) {
      setErro("Use um e-mail institucional (RA@facens.br).");
      return;
    }
    setCarregando(true);
    try {
      await entrar(email, senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-xl sm:p-8">
        <div className="flex items-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-xl bg-brand">
            <ShieldCheck size={22} color="#fff" />
          </div>
          <div>
            <div className="font-display text-lg font-bold leading-tight">CaronaCampus</div>
            <div className="text-xs text-sub">Painel administrativo</div>
          </div>
        </div>

        <div className="mt-7 space-y-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-line px-3.5 py-3">
            <Mail size={18} className="shrink-0 text-sub" />
            <input
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErro(""); }}
              placeholder="RA@facens.br"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-line px-3.5 py-3">
            <Lock size={18} className="shrink-0 text-sub" />
            <input
              type="password"
              value={senha}
              onChange={(e) => { setSenha(e.target.value); setErro(""); }}
              onKeyDown={(e) => e.key === "Enter" && enviar()}
              placeholder="Senha"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>

          {erro && <p className="text-[13px] text-accent">{erro}</p>}

          <button
            onClick={enviar}
            disabled={carregando}
            className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition active:scale-[.98]"
          >
            {carregando ? "Entrando…" : "Entrar"}
          </button>
        </div>

        <p className="mt-5 text-center text-[11.5px] text-sub">Acesso restrito a administradores</p>
      </div>
    </div>
  );
}
