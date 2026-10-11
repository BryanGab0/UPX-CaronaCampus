import { describe, it, expect } from "vitest";
import {
  avaliar, haversineKm, distanciaDaRotaKm, litrosTrecho, arredondarKm, regiaoAproximada,
  TOLERANCIA_MIN, DESVIO_MAX_KM, PESO_HORARIO, PESO_ROTA, PRECO_LITRO, PASSO_KM, GRADE_GRAUS,
} from "../src/match.js";
import type { Coord, PerfilMotorista, PerfilPassageiro } from "../src/match.js";
import { DIAS, horariosDasColunas } from "../src/horarios.js";

const FACENS: Coord = { lat: -23.4710, lng: -47.4285 };
// 0,09° de latitude ≈ 10 km ao sul da Facens.
const SUL_10KM: Coord = { lat: FACENS.lat - 0.09, lng: FACENS.lng };
// Seg a sex, ida às 08:00 e volta às 18:00 (10 trechos).
const SEMANA = horariosDasColunas(DIAS, "08:00", "18:00");

const motorista = (extra: Partial<PerfilMotorista> = {}): PerfilMotorista => ({
  origem: SUL_10KM, horarios: SEMANA, consumo: 10, ...extra,
});
const passageiro = (extra: Partial<PerfilPassageiro> = {}): PerfilPassageiro => ({
  origem: SUL_10KM, horarios: SEMANA, ...extra,
});
const multiploDoPasso = (km: number) => Math.abs(km / PASSO_KM - Math.round(km / PASSO_KM)) < 1e-9;

describe("haversineKm", () => {
  it("é zero para o mesmo ponto", () => {
    expect(haversineKm(FACENS, FACENS)).toBe(0);
  });
  it("1° de latitude vale cerca de 111 km", () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.19, 1);
  });
});

describe("distanciaDaRotaKm", () => {
  it("é ~0 para um ponto no meio da rota", () => {
    const meio = { lat: (SUL_10KM.lat + FACENS.lat) / 2, lng: FACENS.lng };
    expect(distanciaDaRotaKm(meio, SUL_10KM, FACENS)).toBeCloseTo(0, 5);
  });
  it("mede a distância perpendicular à rota", () => {
    // 0,0098° de longitude nessa latitude ≈ 1 km
    const aoLado = { lat: (SUL_10KM.lat + FACENS.lat) / 2, lng: FACENS.lng + 0.0098 };
    expect(distanciaDaRotaKm(aoLado, SUL_10KM, FACENS)).toBeCloseTo(1, 1);
  });
  it("além do fim da rota, mede até a ponta mais próxima", () => {
    const depois = { lat: FACENS.lat + 0.045, lng: FACENS.lng }; // ~5 km depois da Facens
    expect(distanciaDaRotaKm(depois, SUL_10KM, FACENS)).toBeCloseTo(haversineKm(depois, FACENS), 1);
  });
});

describe("avaliar", () => {
  it("dá 100% quando horários, dias e origem coincidem", () => {
    const a = avaliar(passageiro(), motorista(), FACENS);
    expect(a.compat).toBe(100);
    expect(a.scoreHorario).toBe(1);
    expect(a.scoreRota).toBe(1);
    expect(a.totalTrechos).toBe(10);
    expect(a.trechosComuns).toHaveLength(10);
  });

  it("o horário deixa de pontuar a partir da tolerância", () => {
    const a = avaliar(passageiro(), motorista({ horarios: horariosDasColunas(DIAS, "08:45", "18:45") }), FACENS);
    expect(a.trechosComuns.every((t) => t.difMin === TOLERANCIA_MIN)).toBe(true);
    expect(a.scoreHorario).toBe(0);
  });

  it("avalia a ida e a volta separadamente", () => {
    const a = avaliar(
      passageiro({ horarios: { seg: { ida: "08:00", volta: "18:00" } } }),
      motorista({ horarios: { seg: { ida: "08:00", volta: "18:15" } } }),
      FACENS,
    );
    expect(a.trechosComuns).toEqual([
      { dia: "seg", sentido: "ida", difMin: 0 },
      { dia: "seg", sentido: "volta", difMin: 15 },
    ]);
    expect(a.scoreHorario).toBeCloseTo((1 + (1 - 15 / TOLERANCIA_MIN)) / 2, 10);
  });

  it("trecho que o motorista não faz (outro dia ou sentido) vale 0", () => {
    // Passageiro: seg ida e volta + qua só ida (3 trechos). Motorista: seg só ida + qua ida e volta.
    const a = avaliar(
      passageiro({ horarios: { seg: { ida: "08:00", volta: "18:00" }, qua: { ida: "08:00", volta: null } } }),
      motorista({ horarios: { seg: { ida: "08:00", volta: null }, qua: { ida: "08:00", volta: "18:00" } } }),
      FACENS,
    );
    expect(a.totalTrechos).toBe(3);
    expect(a.trechosComuns.map((t) => `${t.dia}-${t.sentido}`)).toEqual(["seg-ida", "qua-ida"]);
    expect(a.scoreHorario).toBeCloseTo(2 / 3, 10);
  });

  it("não confunde a ida de um com a volta do outro", () => {
    const a = avaliar(
      passageiro({ horarios: { seg: { ida: null, volta: "18:00" } } }),
      motorista({ horarios: { seg: { ida: "18:00", volta: null } } }),
      FACENS,
    );
    expect(a.trechosComuns).toEqual([]);
    expect(a.scoreHorario).toBe(0);
  });

  it("sem trechos do passageiro, o horário não pontua", () => {
    const a = avaliar(passageiro({ horarios: {} }), motorista(), FACENS);
    expect(a.totalTrechos).toBe(0);
    expect(a.scoreHorario).toBe(0);
  });

  it("a rota deixa de pontuar a partir do desvio máximo", () => {
    const longe = { lat: SUL_10KM.lat, lng: SUL_10KM.lng + 0.0098 * (DESVIO_MAX_KM + 1) };
    const a = avaliar(passageiro({ origem: longe }), motorista(), FACENS);
    expect(a.desvioKm).toBeGreaterThan(DESVIO_MAX_KM);
    expect(a.scoreRota).toBe(0);
    expect(a.compat).toBe(Math.round(100 * PESO_HORARIO));
  });

  it("combina horário e rota com os pesos definidos", () => {
    const aoLado = { lat: SUL_10KM.lat + 0.03, lng: SUL_10KM.lng + 0.03 };
    const a = avaliar(passageiro({ origem: aoLado }), motorista({ horarios: horariosDasColunas(DIAS, "08:20", "18:00") }), FACENS);
    expect(a.compat).toBe(Math.round(100 * (PESO_HORARIO * a.scoreHorario + PESO_ROTA * a.scoreRota)));
  });

  it("divide o combustível de cada viagem entre 2, com a distância arredondada", () => {
    const a = avaliar(passageiro(), motorista({ consumo: 10 }), FACENS);
    const km = arredondarKm(haversineKm(SUL_10KM, FACENS));
    expect(a.litrosTrecho).toBeCloseTo(km / 10, 10);
    expect(a.custoTrecho).toBeCloseTo((km / 10) * PRECO_LITRO / 2, 10);
  });
});

describe("privacidade: arredondamentos", () => {
  it("o desvio sai em passos de 0,5 km", () => {
    for (const d of [0.003, 0.011, 0.027, 0.041]) {
      const a = avaliar(passageiro({ origem: { lat: SUL_10KM.lat + 0.04, lng: SUL_10KM.lng + d } }), motorista(), FACENS);
      expect(multiploDoPasso(a.desvioKm)).toBe(true);
    }
  });

  it("mover a casa do motorista ~100 m não muda o desvio nem o combustível", () => {
    const p = passageiro({ origem: { lat: SUL_10KM.lat + 0.04, lng: SUL_10KM.lng + 0.02 } });
    const antes = avaliar(p, motorista(), FACENS);
    const depois = avaliar(p, motorista({ origem: { lat: SUL_10KM.lat, lng: SUL_10KM.lng + 0.001 } }), FACENS);
    expect(depois.desvioKm).toBe(antes.desvioKm);
    expect(depois.custoTrecho).toBe(antes.custoTrecho);
  });

  it("arredonda para o passo mais próximo", () => {
    expect(arredondarKm(0.2)).toBe(0);
    expect(arredondarKm(0.3)).toBe(0.5);
    expect(arredondarKm(2.74)).toBe(2.5);
    expect(arredondarKm(2.76)).toBe(3);
  });
});

describe("privacidade: região aproximada", () => {
  it("devolve o centro da célula da grade, igual para toda a vizinhança", () => {
    const casa = { lat: -23.50123, lng: -47.45678 };
    const vizinho = { lat: -23.5049, lng: -47.4501 }; // mesma célula de 0,01°
    expect(regiaoAproximada(casa)).toEqual({ lat: -23.505, lng: -47.455 });
    expect(regiaoAproximada(vizinho)).toEqual(regiaoAproximada(casa));
  });

  it("fica a no máximo meia célula (na diagonal) da coordenada real", () => {
    const casa = { lat: -23.50123, lng: -47.45678 };
    const metadeDiagonalKm = haversineKm({ lat: 0, lng: 0 }, { lat: GRADE_GRAUS / 2, lng: GRADE_GRAUS / 2 });
    expect(haversineKm(casa, regiaoAproximada(casa))).toBeLessThanOrEqual(metadeDiagonalKm);
  });
});

describe("litrosTrecho", () => {
  it("usa 12 km/L quando o consumo não foi informado", () => {
    expect(litrosTrecho(SUL_10KM, FACENS, 0)).toBeCloseTo(litrosTrecho(SUL_10KM, FACENS, 12), 10);
  });
});
