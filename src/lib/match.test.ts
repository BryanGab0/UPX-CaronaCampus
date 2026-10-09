import { describe, it, expect } from "vitest";
import {
  avaliar, ranquear, haversineKm, distanciaDaRotaKm, litrosDia,
  TOLERANCIA_MIN, DESVIO_MAX_KM, PESO_HORARIO, PESO_ROTA, PRECO_LITRO,
} from "./match";
import type { Carona, Coord, Perfil } from "../types";

const FACENS: Coord = { lat: -23.4710, lng: -47.4285 };
// 0,09° de latitude ≈ 10 km ao sul da Facens.
const SUL_10KM: Coord = { lat: FACENS.lat - 0.09, lng: FACENS.lng };

function carona(extra: Partial<Carona> = {}): Carona {
  return {
    id: "111", nome: "Motorista Teste", endereco: "Rua A", origem: SUL_10KM,
    dias: ["seg", "ter", "qua", "qui", "sex"], chegada: "08:00", carro: "Carro", consumo: 10,
    notaMedia: null, totalAvaliacoes: 0,
    ...extra,
  };
}

const perfil = (extra: Partial<Perfil> = {}): Perfil => ({
  origem: SUL_10KM, chegada: "08:00", dias: ["seg", "ter", "qua", "qui", "sex"], ...extra,
});

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
  it("dá 100% quando horário, dias e origem coincidem", () => {
    const a = avaliar(perfil(), carona(), FACENS);
    expect(a.compat).toBe(100);
    expect(a.scoreHorario).toBe(1);
    expect(a.scoreRota).toBeCloseTo(1, 5);
  });

  it("o horário deixa de pontuar a partir da tolerância", () => {
    const a = avaliar(perfil({ chegada: "08:00" }), carona({ chegada: "08:45" }), FACENS);
    expect(a.difChegadaMin).toBe(TOLERANCIA_MIN);
    // dias todos em comum (0,5) + chegada zerada (0) = 0,5
    expect(a.scoreHorario).toBe(0.5);
  });

  it("conta só os dias em comum", () => {
    const a = avaliar(perfil({ dias: ["seg", "qua"] }), carona({ dias: ["seg", "ter"] }), FACENS);
    expect(a.diasComuns).toEqual(["seg"]);
    expect(a.scoreHorario).toBe(0.5 * 0.5 + 0.5 * 1);
  });

  it("a rota deixa de pontuar a partir do desvio máximo", () => {
    const longe = { lat: SUL_10KM.lat, lng: SUL_10KM.lng + 0.0098 * (DESVIO_MAX_KM + 1) };
    const a = avaliar(perfil({ origem: longe }), carona(), FACENS);
    expect(a.desvioKm).toBeGreaterThan(DESVIO_MAX_KM);
    expect(a.scoreRota).toBe(0);
    expect(a.compat).toBe(Math.round(100 * PESO_HORARIO));
  });

  it("combina horário e rota com os pesos definidos", () => {
    const a = avaliar(perfil({ chegada: "08:00" }), carona({ chegada: "08:45" }), FACENS);
    expect(a.compat).toBe(Math.round(100 * (PESO_HORARIO * a.scoreHorario + PESO_ROTA * a.scoreRota)));
  });

  it("divide o combustível de ida e volta entre 2", () => {
    const a = avaliar(perfil(), carona({ consumo: 10 }), FACENS);
    const km = haversineKm(SUL_10KM, FACENS);
    expect(a.custoDia).toBeCloseTo(((km * 2) / 10) * PRECO_LITRO / 2, 6);
  });
});

describe("litrosDia", () => {
  it("usa 12 km/L quando o consumo não foi informado", () => {
    expect(litrosDia(SUL_10KM, FACENS, 0)).toBeCloseTo(litrosDia(SUL_10KM, FACENS, 12), 10);
  });
});

describe("ranquear", () => {
  it("ordena da maior para a menor compatibilidade", () => {
    const boa = carona({ id: "boa" });
    const media = carona({ id: "media", chegada: "08:30" });
    const ruim = carona({ id: "ruim", chegada: "10:00", dias: [] });
    const r = ranquear(perfil(), [ruim, boa, media], FACENS);
    expect(r.map((x) => x.carona.id)).toEqual(["boa", "media", "ruim"]);
  });
});
