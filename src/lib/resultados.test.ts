import { describe, it, expect } from "vitest";
import { paraResultados } from "./resultados";
import type { CaronaApi } from "./api";
import type { Carona } from "../types";

const carona: Carona = {
  id: "200", nome: "Motorista", endereco: "Jardim A, Sorocaba", origem: { lat: -23.505, lng: -47.455 },
  dias: ["seg"], chegada: "08:00", carro: "Gol", consumo: 11,
  notaMedia: null, totalAvaliacoes: 0, vagas: 3, vagasLivres: 3,
};
const avaliacao = {
  compat: 80, scoreHorario: 1, scoreRota: 0.5, diasComuns: ["seg" as const], difChegadaMin: 0,
  desvioKm: 4, litrosDia: 2, custoDia: 6.09, pesos: { horario: 0.55, rota: 0.45 },
};

describe("paraResultados", () => {
  it("separa a carona da avaliação, mantendo a ordem da API", () => {
    const lista: CaronaApi[] = [{ ...carona, ...avaliacao }, { ...carona, id: "300", ...avaliacao, compat: 40 }];
    const r = paraResultados(lista);
    expect(r.map((x) => x.carona.id)).toEqual(["200", "300"]);
    expect(r[0]).toEqual({ carona, ...avaliacao });
    expect("compat" in r[0].carona).toBe(false);
  });

  it("sem nota (quem pede não tem trajeto), a carona fica de fora", () => {
    expect(paraResultados([{ ...carona, compat: null }])).toEqual([]);
  });
});
