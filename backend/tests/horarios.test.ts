import { describe, it, expect } from "vitest";
import { trechosDe, horariosDasColunas } from "../src/horarios.js";

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
