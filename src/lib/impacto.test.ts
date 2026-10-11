import { describe, it, expect } from "vitest";
import { calcularImpacto, custoMensal, SEMANAS_MES, CO2_KG_POR_LITRO } from "./impacto";
import { DIAS } from "./horarios";
import { litrosTrecho, PRECO_LITRO } from "./match";
import type { Resultado } from "./match";
import type { MinhaSolicitacao, Pedido } from "./api";
import type { Carona, Coord, Trajeto } from "../types";

const FACENS: Coord = { lat: -23.4710, lng: -47.4285 };
const SUL_10KM: Coord = { lat: FACENS.lat - 0.09, lng: FACENS.lng };

const motorista: Carona = {
  id: "222", nome: "Motorista", endereco: "Rua B", origem: SUL_10KM,
  horarios: { seg: { ida: "08:00", volta: "18:00" }, qua: { ida: "08:00", volta: "18:00" }, sex: { ida: "08:00", volta: "18:00" } }, carro: "Carro", consumo: 10,
  notaMedia: null, totalAvaliacoes: 0, vagas: 4, vagasLivres: 4,
};

const trajeto = (extra: Partial<Trajeto> = {}): Trajeto => ({
  papel: "passageiro", endereco: "Rua A", origem: SUL_10KM,
  horarios: Object.fromEntries(DIAS.map((d) => [d, { ida: "08:00", volta: "18:00" }])),
  carro: { modelo: "", lugares: 4, consumo: 12 },
  ...extra,
});

const solicitacao = (status: string): MinhaSolicitacao => ({
  id: 1, motoristaRa: "222", status, motoristaNome: "Motorista", endereco: "Rua B", motoristaTelefone: null, minhaNota: null, canceladoPor: null,
});
const pedido = (id: number, status: string): Pedido => ({ id, status, passageiroRa: "100", passageiroNome: "Ana", passageiroTelefone: null, minhaNota: null, passageiroMedia: null, passageiroAvaliacoes: 0, canceladoPor: null });

// Como a API devolve o motorista para um passageiro com aulas de seg a sex: ida e volta em seg, qua
// e sex (6 viagens em comum) e o combustível de cada viagem já calculado, que o app só soma.
const LITROS_MOTORISTA = 1.1;
const COMUNS = (["seg", "qua", "sex"] as const).flatMap((dia) =>
  (["ida", "volta"] as const).map((sentido) => ({ dia, sentido, difMin: 0 })));
const resultado: Resultado = {
  carona: motorista, compat: 90, scoreHorario: 0.6, scoreRota: 1, trechosComuns: COMUNS, totalTrechos: 10,
  desvioKm: 0, litrosTrecho: LITROS_MOTORISTA, custoTrecho: (LITROS_MOTORISTA * PRECO_LITRO) / 2,
  pesos: { horario: 0.55, rota: 0.45 },
};

describe("calcularImpacto", () => {
  it("é zero sem caronas aceitas (pendentes, recusadas e canceladas não contam)", () => {
    const t = trajeto();
    const r = calcularImpacto({
      solicitacoes: [solicitacao("pendente"), solicitacao("recusada"), solicitacao("cancelada")],
      pedidos: [pedido(1, "pendente"), pedido(2, "cancelada")],
      resultados: [resultado],
      trajeto: t, destino: FACENS,
    });
    expect(r).toEqual({ caronas: 0, economiaMes: 0, co2Mes: 0 });
  });

  it("como passageiro, usa o combustível do motorista (vindo da API) e só as viagens em comum", () => {
    const t = trajeto();
    const r = calcularImpacto({
      solicitacoes: [solicitacao("aceita")], pedidos: [],
      resultados: [resultado],
      trajeto: t, destino: FACENS,
    });
    const litrosMes = LITROS_MOTORISTA * 6 * SEMANAS_MES; // ida e volta em seg, qua e sex
    expect(r.caronas).toBe(1);
    expect(r.economiaMes).toBeCloseTo((litrosMes * PRECO_LITRO) / 2, 6);
    expect(r.co2Mes).toBeCloseTo(litrosMes * CO2_KG_POR_LITRO, 6);
  });

  it("como motorista, conta cada pedido aceito com o próprio trajeto", () => {
    const t = trajeto({ papel: "motorista", horarios: { seg: { ida: "08:00", volta: "18:00" }, ter: { ida: "08:00", volta: "18:00" } }, carro: { modelo: "Gol", lugares: 4, consumo: 10 } });
    const r = calcularImpacto({
      solicitacoes: [], pedidos: [pedido(1, "aceita"), pedido(2, "aceita"), pedido(3, "pendente")],
      resultados: [], trajeto: t, destino: FACENS,
    });
    const litrosMes = litrosTrecho(SUL_10KM, FACENS, 10) * 4 * SEMANAS_MES; // ida e volta em seg e ter
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

describe("custoMensal", () => {
  it("multiplica a sua parte por viagem pelas viagens em comum em cada semana do mês", () => {
    expect(custoMensal(resultado)).toBeCloseTo(resultado.custoTrecho * 6 * SEMANAS_MES, 10);
  });
  it("só a ida em comum custa metade de ida e volta", () => {
    const soIda = { ...resultado, trechosComuns: COMUNS.filter((t) => t.sentido === "ida") };
    expect(custoMensal(soIda)).toBeCloseTo(custoMensal(resultado) / 2, 10);
  });
});
