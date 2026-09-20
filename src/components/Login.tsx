import { useState } from "react";
import { useNavigate } from "react-router";
import { Route as RouteIcon, Mail, User } from "lucide-react";
import { useAuth, emailInstitucional } from "../context/AuthContext";
import { cn } from "../lib/cn";
 
export function Login() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
 
  const onEntrar = () => {
    if (!emailInstitucional(email)) {
      setErro("Use seu e-mail institucional no formato RA@facens.br.");
      return;
    }
    if (nome.trim().length < 2) {
      setErro("Digite seu nome.");
      return;
    }
    entrar(email, nome);
    navigate("/");
  };
 
  return (
    <div className="flex min-h-screen justify-center bg-shell px-3 py-5">
      <div className="relative flex min-h-[812px] w-full max-w-[430px] flex-col overflow-hidden rounded-[32px] bg-canvas px-7 pb-8 pt-14 text-ink shadow-2xl">
        {/* Marca */}
        <div className="flex items-center gap-2.5">
          <div className="grid size-11 place-items-center rounded-[13px] bg-brand shadow-[0_8px_20px_rgba(47,75,255,.33)]">
            <RouteIcon size={24} color="#fff" strokeWidth={2.4} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">CaronaCampus</span>
        </div>
 
        <div className="mt-9 flex-1">
          <h1 className="font-display text-[32px] font-bold leading-[1.08] tracking-tight">
            Carona entre<br />quem é <span className="text-brand">da Facens.</span>
          </h1>
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-sub">
            O acesso é só com e-mail institucional, por isso você sabe que quem está do outro lado é colega, não um estranho.
          </p>
 
          <div className="mt-8 space-y-3.5">
            {/* E-mail institucional */}
            <div>
              <label className="text-[13px] font-semibold text-sub">E-mail institucional</label>
              <div className={cn(
                "mt-2 flex items-center gap-2.5 rounded-[14px] border bg-surface px-3.5 py-3",
                erro && !emailInstitucional(email) ? "border-accent" : "border-line",
              )}>
                <Mail size={18} className="text-sub" />
                <input
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErro(""); }}
                  onKeyDown={(e) => e.key === "Enter" && onEntrar()}
                  placeholder="RA@facens.br"
                  inputMode="email"
                  className="flex-1 bg-transparent text-[15px] outline-none"
                />
              </div>
            </div>
 
            {/* Nome */}
            <div>
              <label className="text-[13px] font-semibold text-sub">Seu nome</label>
              <div className="mt-2 flex items-center gap-2.5 rounded-[14px] border border-line bg-surface px-3.5 py-3">
                <User size={18} className="text-sub" />
                <input
                  value={nome}
                  onChange={(e) => { setNome(e.target.value); setErro(""); }}
                  onKeyDown={(e) => e.key === "Enter" && onEntrar()}
                  placeholder="Como quer ser chamado(a)"
                  className="flex-1 bg-transparent text-[15px] outline-none"
                />
              </div>
            </div>
 
            {erro && <p className="text-[13px] text-accent">{erro}</p>}
 
            <button
              onClick={onEntrar}
              className="w-full rounded-[14px] bg-brand py-4 text-[15.5px] font-bold text-white shadow-[0_10px_24px_rgba(47,75,255,.27)] transition active:scale-[.98]"
            >
              Entrar
            </button>
            <button
              onClick={() => { setEmail("123456@facens.br"); setNome("Ana Souza"); setErro(""); }}
              className="w-full text-[13.5px] text-sub"
            >
              usar dados de exemplo
            </button>
          </div>
        </div>
 
        <p className="text-center text-[11.5px] text-sub">
          Login provisório · acesso exclusivo para alunos da Facens · Sorocaba
        </p>
      </div>
    </div>
  );
}
