import { describe, it, expect } from "vitest";
import { lerPreferencia, resolverTema } from "./tema";

describe("lerPreferencia", () => {
  it("aceita claro e escuro", () => {
    expect(lerPreferencia("claro")).toBe("claro");
    expect(lerPreferencia("escuro")).toBe("escuro");
  });
  it("sem valor salvo ou valor inválido, segue o aparelho", () => {
    expect(lerPreferencia(null)).toBe("dispositivo");
    expect(lerPreferencia("dispositivo")).toBe("dispositivo");
    expect(lerPreferencia('"escuro"')).toBe("dispositivo"); // formato JSON não é usado
    expect(lerPreferencia("")).toBe("dispositivo");
  });
});

describe("resolverTema", () => {
  it("no modo dispositivo, segue o aparelho", () => {
    expect(resolverTema("dispositivo", true)).toBe("escuro");
    expect(resolverTema("dispositivo", false)).toBe("claro");
  });
  it("escolha explícita ignora o aparelho", () => {
    expect(resolverTema("claro", true)).toBe("claro");
    expect(resolverTema("escuro", false)).toBe("escuro");
  });
});
