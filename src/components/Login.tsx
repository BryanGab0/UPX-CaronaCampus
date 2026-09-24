import { useState } from "react";
import { useNavigate } from "react-router";
import { Route as RouteIcon, Mail, User, Lock } from "lucide-react";
import { useAuth, emailInstitucional } from "../context/AuthContext";
import { cn } from "../lib/cn";
 
export function Login() {
  const { login, registrar } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
 
  const enviar = async () => {
    setErro("");
    if (!emailInstitucional(email)) {
      setErro("Use seu e-mail institucional no formato RA@facens.br.");
      return;
    }
    if (modo === "registro" && nome.trim().length < 2) {
      setErro("Digite seu nome.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    setCarregando(true);
    try {
      if (modo === "login") await login(email, senha);
      else await registrar(email, nome, senha);
      navigate("/");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  };
 
  const trocarModo = () => {
    setModo((m) => (m === "login" ? "registro" : "login"));
    setErro("");
  };
 
  return (
    <div className="flex min-h-screen justify-center bg-shell px-3 py-5">
      <div className="relative flex min-h-[812px] w-full max-w-[430px] flex-col overflow-hidden rounded-[32px] bg-canvas px-7 pb-8 pt-14 text-ink shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div className="grid size-11 place-items-center rounded-[13px] bg-brand shadow-[0_8px_20px_rgba(47,75,255,.33)]">
            <RouteIcon size={24} color="#fff" strokeWidth={2.4} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">CaronaCampus</span>
        </div>
 
        <div className="mt-9 flex-1">
          <h1 className="font-display text-[30px] font-bold leading-[1.1] tracking-tight">
            {modo === "login" ? (
              <>Bem-vindo<br />de <span className="text-brand">volta.</span></>
            ) : (
              <>Crie sua<br /><span className="text-brand">conta.</span></>
            )}
          </h1>
          <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-sub">
            Acesso exclusivo para alunos da Facens, com e-mail institucional.
          </p>
 
          <div className="mt-7 space-y-3">
            <Campo icone={<Mail size={18} />}>
              <input
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErro(""); }}
                placeholder="RA@facens.br"
                inputMode="email"
                className="flex-1 bg-transparent text-[15px] outline-none"
              />
            </Campo>
 
            {modo === "registro" && (
              <Campo icone={<User size={18} />}>
                <input
                  value={nome}
                  onChange={(e) => { setNome(e.target.value); setErro(""); }}
                  placeholder="Seu nome"
                  className="flex-1 bg-transparent text-[15px] outline-none"
                />
              </Campo>
            )}
 
            <Campo icone={<Lock size={18} />}>
              <input
                type="password"
                value={senha}
                onChange={(e) => { setSenha(e.target.value); setErro(""); }}
                onKeyDown={(e) => e.key === "Enter" && enviar()}
                placeholder="Senha"
                className="flex-1 bg-transparent text-[15px] outline-none"
              />
            </Campo>
 
            {erro && <p className="text-[13px] text-accent">{erro}</p>}
 
            <button
              onClick={enviar}
              disabled={carregando}
              className="w-full rounded-[14px] bg-brand py-4 text-[15.5px] font-bold text-white shadow-[0_10px_24px_rgba(47,75,255,.27)] transition active:scale-[.98]"
            >
              {carregando ? "Aguarde…" : modo === "login" ? "Entrar" : "Criar conta"}
            </button>
          </div>
 
          <button onClick={trocarModo} className="mt-5 w-full text-[13.5px] text-sub">
            {modo === "login" ? (
              <>Não tem conta? <span className="font-semibold text-brand">Cadastre-se</span></>
            ) : (
              <>Já tem conta? <span className="font-semibold text-brand">Entrar</span></>
            )}
          </button>
        </div>
 
        <p className="text-center text-[11.5px] text-sub">Facens · Sorocaba</p>
      </div>
    </div>
  );
}
 
function Campo({ icone, children }: { icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-[14px] border border-line bg-surface px-3.5 py-3")}>
      <span className="text-sub">{icone}</span>
      {children}
    </div>
  );
}
