import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { pool } from "../src/db.js";
import { limparBanco, criarUsuario, criarTrajeto } from "./utils.js";

beforeEach(limparBanco);
afterAll(() => pool.end());

const trajeto = {
  papel: "motorista", endereco: "Rua A, Sorocaba", origem: { lat: -23.5, lng: -47.45 },
  dias: ["seg", "ter"], chegada: "08:00", saida: "18:00", carro: { modelo: "Gol", lugares: 4, consumo: 11 },
};

describe("trajeto (só o dono)", () => {
  it("salva e lê o próprio trajeto", async () => {
    const ana = await criarUsuario("100");
    const put = await request(app).put("/usuarios/100/trajeto").set("Authorization", ana.auth).send(trajeto);
    expect(put.status).toBe(200);

    const get = await request(app).get("/usuarios/100/trajeto").set("Authorization", ana.auth);
    expect(get.body).toMatchObject({ papel: "motorista", endereco: "Rua A, Sorocaba", dias: ["seg", "ter"] });
  });

  it("recusa trajeto incompleto (400)", async () => {
    const ana = await criarUsuario("100");
    const res = await request(app).put("/usuarios/100/trajeto").set("Authorization", ana.auth).send({ papel: "motorista" });
    expect(res.status).toBe(400);
  });

  it("não deixa ler nem alterar o trajeto de outro RA (403)", async () => {
    const ana = await criarUsuario("100");
    await criarUsuario("200");
    expect((await request(app).get("/usuarios/200/trajeto").set("Authorization", ana.auth)).status).toBe(403);
    expect((await request(app).put("/usuarios/200/trajeto").set("Authorization", ana.auth).send(trajeto)).status).toBe(403);
  });
});

describe("GET /caronas", () => {
  it("exige login (401)", async () => {
    expect((await request(app).get("/caronas")).status).toBe(401);
  });

  it("lista só motoristas e nunca o próprio usuário", async () => {
    const ana = await criarUsuario("100");
    await criarTrajeto("100", "motorista");
    await criarUsuario("200");
    await criarTrajeto("200", "motorista");
    await criarUsuario("300");
    await criarTrajeto("300", "passageiro");

    const res = await request(app).get("/caronas").set("Authorization", ana.auth);
    expect(res.body.map((c: { id: string }) => c.id)).toEqual(["200"]);
  });
});

describe("rotas /admin", () => {
  it("recusam quem não é administrador (403)", async () => {
    const aluno = await criarUsuario("100");
    for (const rota of ["/admin/estatisticas", "/admin/usuarios", "/admin/solicitacoes"]) {
      expect((await request(app).get(rota).set("Authorization", aluno.auth)).status).toBe(403);
    }
  });

  it("liberam o administrador", async () => {
    const admin = await criarUsuario("100", { admin: true });
    await criarUsuario("200");
    const res = await request(app).get("/admin/estatisticas").set("Authorization", admin.auth);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ usuarios: 2, motoristas: 0, trajetos: 0, solicitacoes: 0 });
  });
});
