import { Component, type ErrorInfo, type ReactNode } from "react";
import { Route as RouteIcon, TriangleAlert, RotateCw } from "lucide-react";
import { registrarErro } from "../lib/monitoramento";

// Sem isto, um erro ao desenhar qualquer tela deixa o app em branco. Fica por fora de tudo
// (router e providers), então a tela de erro não depende de nada que possa ter falhado.
// Precisa ser classe: o React só pega erros de renderização com componentDidCatch.
export class ErroTela extends Component<{ children: ReactNode }, { falhou: boolean }> {
  state = { falhou: false };

  static getDerivedStateFromError() {
    return { falhou: true };
  }

  componentDidCatch(erro: unknown, info: ErrorInfo) {
    registrarErro(erro, info.componentStack);
  }

  render() {
    if (!this.state.falhou) return this.props.children;
    return (
      // Mesma moldura do Login e do Layout.
      <div className="flex h-dvh justify-center bg-canvas desk:items-center desk:bg-shell desk:p-5">
        <main className="flex h-full w-full flex-col bg-canvas px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(3.5rem+env(safe-area-inset-top))] text-ink min-[380px]:px-7 desk:h-[min(812px,100%)] desk:max-w-[430px] desk:rounded-[32px] desk:pb-8 desk:pt-14 desk:shadow-2xl">
          <div className="flex items-center gap-2.5">
            <div className="grid size-11 place-items-center rounded-[13px] bg-brand shadow-[0_8px_20px_rgba(47,75,255,.33)]">
              <RouteIcon size={24} color="#fff" strokeWidth={2.4} />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">CaronaCampus</span>
          </div>

          <div role="alert" className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent-ink">
              <TriangleAlert size={26} />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Algo deu errado</h1>
            <p className="mt-2 max-w-[290px] text-sm leading-relaxed text-sub">
              O app encontrou um erro inesperado. Recarregue a página para continuar; seus dados não foram perdidos.
            </p>
            <button type="button" onClick={() => window.location.reload()}
              className="mt-6 flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition active:scale-[.98]">
              <RotateCw size={16} /> Recarregar
            </button>
          </div>
        </main>
      </div>
    );
  }
}
