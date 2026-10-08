// Arquivo separado: cada arquivo de teste recebe uma API "nova",
// então a contagem de tentativas começa do zero aqui.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { pool } from "../src/db.js";
import { limparBanco, criarUsuario, SENHA } from "./utils.js";

beforeAll(async () => { await limparBanco(); await criarUsuario("100"); });
afterAll(() => pool.end());

describe("limite de tentativas no login", () => {
  it("logins certos não contam para o limite", async () => {
    for (let i = 0; i < 12; i++) {
      expect((await request(app).post("/auth/login").send({ ra: "100", senha: SENHA })).status).toBe(200);
    }
  });

  it("bloqueia depois de 10 falhas (429) com mensagem amigável", async () => {
    for (let i = 0; i < 10; i++) {
      expect((await request(app).post("/auth/login").send({ ra: "100", senha: "errada" })).status).toBe(401);
    }
    const bloqueado = await request(app).post("/auth/login").send({ ra: "100", senha: SENHA });
    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body.erro).toMatch(/Muitas tentativas/);
  });
});
