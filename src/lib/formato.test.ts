import { describe, it, expect } from "vitest";
import { primeiroNome, iniciais, linkWhatsapp } from "./formato";

describe("primeiroNome", () => {
  it("pega a primeira palavra", () => expect(primeiroNome("Ana Clara Souza")).toBe("Ana"));
  it("ignora espaços sobrando", () => expect(primeiroNome("  Ana  Souza")).toBe("Ana"));
  it("devolve vazio para nome vazio", () => expect(primeiroNome("")).toBe(""));
});

describe("iniciais", () => {
  it("usa até duas palavras", () => expect(iniciais("Ana Clara Souza")).toBe("AC"));
  it("sai em maiúscula", () => expect(iniciais("ana souza")).toBe("AS"));
  it("funciona com um nome só", () => expect(iniciais("Ana")).toBe("A"));
  it("não quebra com espaços duplos", () => expect(iniciais("Ana  Souza")).toBe("AS"));
});

describe("linkWhatsapp", () => {
  it("adiciona o 55 e codifica a mensagem", () => {
    expect(linkWhatsapp("15999990000", "Oi Ana! Vamos?"))
      .toBe("https://wa.me/5515999990000?text=Oi%20Ana!%20Vamos%3F");
  });
});
