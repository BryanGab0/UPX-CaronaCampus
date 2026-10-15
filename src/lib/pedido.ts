// Pedido do passageiro para um motorista (tela de Detalhe).
import type { MinhaSolicitacao } from "./api";

// Uma falha na busca vira { erro: true }, e não "sem pedido": sem saber o status,
// a tela não pode oferecer "Solicitar carona" para quem talvez já tenha pedido.
export type PedidoCarregado = { erro: false; solic: MinhaSolicitacao | null } | { erro: true };

export async function carregarPedido(
  buscar: (ra: string) => Promise<MinhaSolicitacao[]>, ra: string, motoristaRa: string,
): Promise<PedidoCarregado> {
  try {
    const lista = await buscar(ra);
    return { erro: false, solic: lista.find((s) => s.motoristaRa === motoristaRa) ?? null };
  } catch (e) {
    console.error(e);
    return { erro: true };
  }
}
