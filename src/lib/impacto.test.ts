import { describe, it, expect } from "vitest";
import { calcularImpacto, SEMANAS_MES, CO2_KG_POR_LITRO } from "./impacto";
import { ranquear, litrosDia, PRECO_LITRO } from "./match";
import type { MinhaSolicitacao, Pedido } from "./api";
import type { Carona, Coord, Trajeto } from "../types";

const FACENS: Coord = { lat: -23.4710, lng: -47.4285 };
const SUL_10KM: Coord = { lat: FACENS.lat - 0.09, lng: FACENS.lng };

const motorista: Carona = {
  id: "222", nome: "Motorista", endereco: "Rua B", origem: SUL_10KM,
  dias: ["seg", "qua", "sex"], chegada: "08:00", carro: "Carro", consumo: 10,
};

const trajeto = (extra: Partial<Trajeto> = {}): Trajeto => ({
  papel: "passageiro", endereco: "Rua A", origem: SUL_10KM,
  dias: ["seg", "ter", "qua", "qui", "sex"], chegada: "08:00", saida: "18:00",
  carro: { modelo: "", lugares: 4, consumo: 12 },
  ...extra,
});

const solicitacao = (status: string): MinhaSolicitacao => ({
  motoristaRa: "222", status, motoristaNome: "Motorista", endereco: "Rua B", motoristaTelefone: null,
});
const pedido = (id: number, status: string): Pedido => ({ id, status, passageiroNome: "Ana", passageiroTelefone: null });

const perfilDe = (t: Trajeto) => ({ origem: t.origem, chegada: t.chegada, dias: t.dias });

describe("calcularImpacto", () => {
  it("é zero sem caronas aceitas", () => {
    const t = trajeto();
    const r = calcularImpacto({
      solicitacoes: [solicitacao("pendente"), solicitacao("recusada")],
      pedidos: [pedido(1, "pendente")],
      resultados: ranquear(perfilDe(t), [motorista], FACENS),
      trajeto: t, destino: FACENS,
    });
    expect(r).toEqual({ caronas: 0, economiaMes: 0, co2Mes: 0 });
  });

  it("como passageiro, usa o trajeto do motorista e só os dias em comum", () => {
    const t = trajeto();
    const r = calcularImpacto({
      solicitacoes: [solicitacao("aceita")], pedidos: [],
      resultados: ranquear(perfilDe(t), [motorista], FACENS),
      trajeto: t, destino: FACENS,
    });
    const litrosMes = litrosDia(SUL_10KM, FACENS, 10) * 3 * SEMANAS_MES; // seg, qua, sex
    expect(r.caronas).toBe(1);
    expect(r.economiaMes).toBeCloseTo((litrosMes * PRECO_LITRO) / 2, 6);
    expect(r.co2Mes).toBeCloseTo(litrosMes * CO2_KG_POR_LITRO, 6);
  });

  it("como motorista, conta cada pedido aceito com o próprio trajeto", () => {
    const t = trajeto({ papel: "motorista", dias: ["seg", "ter"], carro: { modelo: "Gol", lugares: 4, consumo: 10 } });
    const r = calcularImpacto({
      solicitacoes: [], pedidos: [pedido(1, "aceita"), pedido(2, "aceita"), pedido(3, "pendente")],
      resultados: [], trajeto: t, destino: FACENS,
    });
    const litrosMes = litrosDia(SUL_10KM, FACENS, 10) * 2 * SEMANAS_MES;
    expect(r.caronas).toBe(2);
    expect(r.economiaMes).toBeCloseTo(2 * (litrosMes * PRECO_LITRO) / 2, 6);
  });

  it("conta a carona, mas não estima nada, se faltar o trajeto", () => {
    const r = calcularImpacto({
      solicitacoes: [solicitacao("aceita")], pedidos: [pedido(1, "aceita")],
      resultados: [], // motorista não está mais na lista
      trajeto: trajeto({ endereco: "" }), destino: FACENS,
    });
    expect(r).toEqual({ caronas: 2, economiaMes: 0, co2Mes: 0 });
  });
});
