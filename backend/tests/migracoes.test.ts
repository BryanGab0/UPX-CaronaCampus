import { describe, it, expect, afterAll } from "vitest";
import pg from "pg";
import { aplicarMigracoes, listarMigracoes } from "../src/migracoes.js";
import { DATABASE_URL_TESTE } from "./ambiente.js";

const banco = new pg.Client({ connectionString: DATABASE_URL_TESTE });
await banco.connect();
afterAll(() => banco.end());

describe("migrações", () => {
  it("os arquivos seguem a numeração 001, 002, ... sem buracos nem repetição", () => {
    const numeros = listarMigracoes().map((f) => Number(f.slice(0, 3)));
    expect(numeros).toEqual(numeros.map((_, i) => i + 1));
  });

  it("todas ficam registradas no banco de teste", async () => {
    const { rows } = await banco.query("SELECT nome FROM migracoes ORDER BY nome");
    expect(rows.map((r) => r.nome)).toEqual(listarMigracoes());
  });

  it("rodar de novo não aplica nada (cada migração roda uma vez só)", async () => {
    expect(await aplicarMigracoes(banco)).toEqual([]);
  });
});
