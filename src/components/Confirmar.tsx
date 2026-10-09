import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Folha } from "./Folha";

interface Props {
  titulo: string;
  texto: string;
  acao: string;                       // texto do botão que confirma (ex.: "Cancelar pedido")
  onConfirmar: () => Promise<void>;   // se lançar erro, a mensagem aparece na folha
  onFechar: () => void;
}

// Pede confirmação antes de uma ação que não dá para desfazer pelo próprio usuário.
export function Confirmar({ titulo, texto, acao, onConfirmar, onFechar }: Props) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const confirmar = async () => {
    setEnviando(true); setErro(null);
    try {
      await onConfirmar();
    } catch (e) {
      console.error(e);
      // Mensagens escritas pela API (ex.: o pedido mudou) aparecem; as técnicas ("Erro 500 ...") não.
      setErro(e instanceof Error && !e.message.startsWith("Erro ") ? e.message : "Não foi possível concluir. Tente novamente.");
      setEnviando(false);
    }
  };

  return (
    <Folha tituloId="titulo-confirmar" onFechar={onFechar}>
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft"><TriangleAlert size={18} className="text-accent" /></div>
        <div className="min-w-0 flex-1">
          <h2 id="titulo-confirmar" className="font-display text-lg font-bold">{titulo}</h2>
          <p className="mt-1 text-sm leading-relaxed text-sub">{texto}</p>
        </div>
      </div>

      {erro && <p role="alert" className="mt-3 text-[13px] text-accent-ink">{erro}</p>}

      <div className="mt-5 flex gap-2">
        <button onClick={onFechar} disabled={enviando}
          className="flex-1 rounded-[14px] border border-line py-3.5 text-sm font-bold text-sub transition active:scale-[.98] disabled:opacity-60">
          Voltar
        </button>
        <button onClick={confirmar} disabled={enviando}
          className="flex-1 rounded-[14px] bg-accent-ink py-3.5 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-60">
          {enviando ? "Aguarde…" : acao}
        </button>
      </div>
    </Folha>
  );
}
