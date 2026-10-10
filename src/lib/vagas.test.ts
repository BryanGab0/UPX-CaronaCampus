import { describe, it, expect } from "vitest";
import { lotado, lotadosNoFim, textoVagas } from "./vagas";
import type { Resultado } from "./match";
import type { Carona } from "../types";

const carona = (id: string, vagasLivres: number): Carona => ({
  id, nome: `Motorista ${id}`, endereco: "Rua A", origem: { lat: -23.5, lng: -47.45 },
  dias: ["seg"], chegada: "08:00", carro: "Carro", consumo: 10,
  notaMedia: null, totalAvaliacoes: 0, vagas: 3, vagasLivres,
});
const resultado = (id: string, vagasLivres: number): Resultado => ({
  carona: carona(id, vagasLivres), compat: 80, scoreHorario: 1, scoreRota: 1,
  diasComuns: ["seg"], difChegadaMin: 0, desvioKm: 0, custoDia: 5, litrosDia: 1.6, pesos: { horario: 0.55, rota: 0.45 },
});

describe("vagas", () => {
  it("texto da etiqueta: plural, singular e lotado", () => {
    expect(textoVagas(carona("a", 3))).toBe("3 vagas");
    expect(textoVagas(carona("a", 1))).toBe("1 vaga");
    expect(textoVagas(carona("a", 0))).toBe("Lotado");
    expect(lotado(carona("a", 0))).toBe(true);
  });

  it("lotados vão para o fim sem mudar a ordem dos demais", () => {
    const ordem = lotadosNoFim([resultado("a", 0), resultado("b", 2), resultado("c", 0), resultado("d", 1)]);
    expect(ordem.map((r) => r.carona.id)).toEqual(["b", "d", "a", "c"]);
  });
});
