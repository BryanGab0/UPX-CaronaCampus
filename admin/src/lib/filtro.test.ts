import { describe, it, expect } from "vitest";
import { normalizar, combina, paginar } from "./filtro";

describe("normalizar", () => {
  it("ignora maiúsculas, acentos e espaços nas pontas", () => {
    expect(normalizar("  José ÁVILA ")).toBe("jose avila");
  });
});

describe("combina", () => {
  it("busca vazia aceita tudo", () => {
    expect(combina(["Ana"], "   ")).toBe(true);
  });
  it("procura em qualquer campo, sem diferenciar acentos", () => {
    expect(combina(["123", "João Souza", "123@facens.br"], "joao")).toBe(true);
    expect(combina(["123", "João Souza", "123@facens.br"], "facens")).toBe(true);
    expect(combina(["123", "João Souza"], "maria")).toBe(false);
  });
  it("ignora campos vazios", () => {
    expect(combina([null, undefined, "Ana"], "ana")).toBe(true);
  });
});

describe("paginar", () => {
  const lista = Array.from({ length: 45 }, (_, i) => i + 1);

  it("divide em páginas e informa o intervalo exibido", () => {
    const p = paginar(lista, 2, 20);
    expect(p.itens).toEqual(lista.slice(20, 40));
    expect(p).toMatchObject({ pagina: 2, totalPaginas: 3, inicio: 21, fim: 40 });
  });

  it("última página pode vir incompleta", () => {
    expect(paginar(lista, 3, 20)).toMatchObject({ itens: [41, 42, 43, 44, 45], inicio: 41, fim: 45 });
  });

  it("corrige página fora do intervalo (ex.: depois de filtrar)", () => {
    expect(paginar(lista, 99, 20).pagina).toBe(3);
    expect(paginar(lista, 0, 20).pagina).toBe(1);
  });

  it("lista vazia tem 1 página e nada exibido", () => {
    expect(paginar([], 1)).toEqual({ itens: [], pagina: 1, totalPaginas: 1, inicio: 0, fim: 0 });
  });
});
