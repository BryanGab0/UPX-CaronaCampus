import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Route as RouteIcon, Mail, User, Lock, Phone } from "lucide-react";
import { useAuth, emailInstitucional } from "../context/AuthContext";
import { cn } from "../lib/cn";

// Valida só o FORMATO do telefone (DDD + número). Não verifica se é real.
function telefoneValido(t: string): boolean {
  const d = t.replace(/\D/g, "");
  return d.length >= 10 && d.length <= 13;
}

// Formata enquanto digita: (11) 99999-9999 (máscara só visual).
function formatarTelefone(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11); // no máx. 11 dígitos (DDD + número)
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export function Login() {
  const { login, registrar, avisoSaida } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(avisoSaida ?? "");
  const [carregando, setCarregando] = useState(false);

  const enviar = async () => {
    setErro("");
    if (!emailInstitucional(email)) {
      setErro("Use seu e-mail institucional no formato RA@facens.br.");
      return;
    }
    if (modo === "registro") {
      if (nome.trim().length < 2) {
        setErro("Digite seu nome.");
        return;
      }
      if (!telefoneValido(telefone)) {
        setErro("Digite um telefone válido com DDD (ex.: 11 99999-9999).");
        return;
      }
    }
    if (senha.length < 6) {
      setErro("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    setCarregando(true);
    try {
      if (modo === "login") await login(email, senha);
      else await registrar(email, nome, telefone.replace(/\D/g, ""), senha);
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
    // Mesma moldura do Layout (h-dvh + até 812px centralizada), para o tamanho
    // não mudar ao entrar no app. Se o conteúdo não couber, rola por dentro.
    <div className="flex min-h-dvh justify-center bg-canvas desk:h-dvh desk:items-center desk:bg-shell desk:p-5">
      <div className="no-scrollbar relative flex min-h-dvh w-full flex-col overflow-y-auto bg-canvas px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(3.5rem+env(safe-area-inset-top))] text-ink min-[380px]:px-7 desk:h-[min(812px,100%)] desk:min-h-0 desk:max-w-[430px] desk:rounded-[32px] desk:pb-8 desk:pt-14 desk:shadow-2xl">
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

          <div className="mt-6 space-y-3">
            <Campo icone={<Mail size={18} />}>
              <input
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErro(""); }}
                placeholder="RA@facens.br"
                aria-label="E-mail no formato RA@facens.br"
                autoComplete="username"
                inputMode="email"
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
              />
            </Campo>

            {modo === "registro" && (
              <>
                <Campo icone={<User size={18} />}>
                  <input
                    value={nome}
                    onChange={(e) => { setNome(e.target.value); setErro(""); }}
                    placeholder="Seu nome"
                    aria-label="Nome"
                    autoComplete="name"
                    className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
                  />
                </Campo>
                <Campo icone={<Phone size={18} />}>
                  <input
                    value={telefone}
                    onChange={(e) => { setTelefone(formatarTelefone(e.target.value)); setErro(""); }}
                    placeholder="(11) 99999-9999"
                    aria-label="Telefone com DDD"
                    autoComplete="tel-national"
                    inputMode="tel"
                    className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
                  />
                </Campo>
              </>
            )}

            <Campo icone={<Lock size={18} />}>
              <input
                type="password"
                value={senha}
                onChange={(e) => { setSenha(e.target.value); setErro(""); }}
                onKeyDown={(e) => e.key === "Enter" && enviar()}
                placeholder="Senha"
                aria-label="Senha"
                autoComplete={modo === "login" ? "current-password" : "new-password"}
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
              />
            </Campo>

            {erro && <p role="alert" className="text-[13px] text-accent-ink">{erro}</p>}

            <button
              onClick={enviar}
              disabled={carregando}
              className="w-full rounded-[14px] bg-brand py-4 text-[15.5px] font-bold text-white shadow-[0_10px_24px_rgba(47,75,255,.27)] transition active:scale-[.98]"
            >
              {carregando ? "Aguarde…" : modo === "login" ? "Entrar" : "Criar conta"}
            </button>
            {modo === "registro" && (
              <p className="text-center text-[11.5px] leading-snug text-sub">
                Ao criar a conta, você concorda com o uso dos dados descrito na{" "}
                <Link to="/privacidade" className="font-semibold text-brand">política de privacidade</Link>.
              </p>
            )}
          </div>

          <button onClick={trocarModo} className="mt-5 w-full text-[13.5px] text-sub">
            {modo === "login" ? (
              <>Não tem conta? <span className="font-semibold text-brand">Cadastre-se</span></>
            ) : (
              <>Já tem conta? <span className="font-semibold text-brand">Entrar</span></>
            )}
          </button>
        </div>

        <p className="text-center text-[11.5px] text-sub">
          Facens · Sorocaba · <Link to="/privacidade" className="font-semibold text-sub underline underline-offset-2">Privacidade</Link>
        </p>
      </div>
    </div>
  );
}

function Campo({ icone, children }: { icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-[14px] border border-line bg-surface px-3.5 py-3 transition focus-within:border-brand")}>
      <span className="shrink-0 text-sub">{icone}</span>
      {children}
    </div>
  );
}
