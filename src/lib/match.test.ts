import { describe, it, expect } from "vitest";
import { haversineKm, litrosDia, reais } from "./match";
import type { Coord } from "../types";

// Os testes do algoritmo de compatibilidade ficam na API (backend/tests/match.test.ts).
const FACENS: Coord = { lat: -23.4710, lng: -47.4285 };
const SUL_10KM: Coord = { lat: FACENS.lat - 0.09, lng: FACENS.lng };

describe("haversineKm", () => {
  it("é zero para o mesmo ponto", () => {
    expect(haversineKm(FACENS, FACENS)).toBe(0);
  });
  it("1° de latitude vale cerca de 111 km", () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.19, 1);
  });
});

describe("litrosDia", () => {
  it("ida e volta dividida pelo consumo", () => {
    expect(litrosDia(SUL_10KM, FACENS, 10)).toBeCloseTo((haversineKm(SUL_10KM, FACENS) * 2) / 10, 10);
  });
  it("usa 12 km/L quando o consumo não foi informado", () => {
    expect(litrosDia(SUL_10KM, FACENS, 0)).toBeCloseTo(litrosDia(SUL_10KM, FACENS, 12), 10);
  });
});

describe("reais", () => {
  it("formata no padrão brasileiro", () => {
    expect(reais(3.5)).toBe("R$ 3,50");
  });
});
