import { describe, it, expect, vi } from "vitest";
import { carregarPedido } from "./pedido";
import type { MinhaSolicitacao } from "./api";

const pedido = (motoristaRa: string, status = "pendente"): MinhaSolicitacao => ({
  id: 1, motoristaRa, status, motoristaNome: "Motorista", endereco: "Jardim A, Sorocaba",
  motoristaTelefone: null, minhaNota: null, canceladoPor: null,
});

describe("carregarPedido", () => {
  it("devolve o pedido para o motorista da tela", async () => {
    const r = await carregarPedido(async () => [pedido("100"), pedido("200", "aceita")], "1", "200");
    expect(r).toEqual({ erro: false, solic: pedido("200", "aceita") });
  });

  it("sem pedido para esse motorista, devolve null (pode solicitar)", async () => {
    const r = await carregarPedido(async () => [pedido("100")], "1", "200");
    expect(r).toEqual({ erro: false, solic: null });
  });

  it("falha na busca vira erro, e não 'sem pedido'", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await carregarPedido(async () => { throw new Error("Erro 500 ao buscar solicitações"); }, "1", "200");
    expect(r).toEqual({ erro: true });
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });
});
