import { describe, it, expect } from "vitest";
import { trechosDe, horariosDasColunas, validarHorarios, resumoAntigo } from "../src/horarios.js";

describe("trechosDe", () => {
  it("lista os trechos de seg a sex, com a ida antes da volta, e pula os vazios", () => {
    expect(trechosDe({ qua: { ida: null, volta: "17:00" }, seg: { ida: "08:00", volta: "18:00" } })).toEqual([
      { dia: "seg", sentido: "ida", hora: "08:00" },
      { dia: "seg", sentido: "volta", hora: "18:00" },
      { dia: "qua", sentido: "volta", hora: "17:00" },
    ]);
  });
});

describe("horariosDasColunas", () => {
  it("converte o formato antigo em ida e volta nos dias marcados", () => {
    expect(horariosDasColunas(["qua", "seg"], "08:00", "18:00")).toEqual({
      seg: { ida: "08:00", volta: "18:00" },
      qua: { ida: "08:00", volta: "18:00" },
    });
  });
});

describe("validarHorarios", () => {
  it("limpa os horários: vazio vira null e cada dia guarda só ida e volta", () => {
    expect(validarHorarios({ seg: { ida: "08:00", volta: "", extra: 1 } })).toEqual({ seg: { ida: "08:00", volta: null } });
  });
  it("recusa formatos inválidos", () => {
    for (const v of [null, "seg", [], {}, { dom: { ida: "08:00" } }, { seg: null }, { seg: { ida: "", volta: null } }, { seg: { ida: "08:00", volta: 1800 } }]) {
      expect(validarHorarios(v)).toBeNull();
    }
  });
});

describe("resumoAntigo", () => {
  it("resume na primeira ida e na primeira volta da semana", () => {
    expect(resumoAntigo({ seg: { ida: null, volta: "17:00" }, qua: { ida: "09:00", volta: "18:00" } }))
      .toEqual({ dias: ["seg", "qua"], chegada: "09:00", saida: "17:00" });
  });
});
