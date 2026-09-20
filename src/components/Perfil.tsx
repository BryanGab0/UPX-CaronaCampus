import { useNavigate } from "react-router";
import { LogOut, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
 
export function Perfil() {
  const { nome, email, sair } = useAuth();
  const navigate = useNavigate();
  const iniciais = nome.split(" ").slice(0, 2).map((n) => n[0]).join("");
 
  const onSair = () => {
    sair();
    navigate("/login");
  };
 
  return (
    <div className="animate-rise px-[22px] pt-[46px]">
      <h1 className="font-display text-[26px] font-bold tracking-tight">Perfil</h1>
 
      <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-line bg-surface p-4">
        <div className="grid size-14 place-items-center rounded-2xl bg-brand text-lg font-bold text-white">{iniciais}</div>
        <div className="min-w-0">
          <div className="font-bold">{nome}</div>
          <div className="flex items-center gap-1.5 truncate text-xs text-sub">
            <Mail size={13} /> {email}
          </div>
        </div>
      </div>
 
      <button
        onClick={onSair}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] border border-line bg-surface py-4 text-sm font-bold text-sub transition active:scale-[.98]"
      >
        <LogOut size={17} /> Sair
      </button>
    </div>
  );
}
