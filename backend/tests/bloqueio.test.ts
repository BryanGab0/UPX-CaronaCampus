import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { pool } from "../src/db.js";
import { limparBanco, criarUsuario, criarTrajeto, SENHA } from "./utils.js";

afterAll(() => pool.end());

let admin: Awaited<ReturnType<typeof criarUsuario>>;
let aluno: Awaited<ReturnType<typeof criarUsuario>>;
let motorista: Awaited<ReturnType<typeof criarUsuario>>;

beforeEach(async () => {
  await limparBanco();
  admin = await criarUsuario("1", { admin: true });
  aluno = await criarUsuario("100");
  motorista = await criarUsuario("200");
  await criarTrajeto("200", "motorista");
});

const bloquear = (ra: string, bloqueado = true, quem = admin) =>
  request(app).patch(`/admin/usuarios/${ra}/bloqueio`).set("Authorization", quem.auth).send({ bloqueado });

describe("bloqueio pelo administrador", () => {
  it("só administrador pode bloquear (403)", async () => {
    expect((await bloquear("200", true, aluno)).status).toBe(403);
  });

  it("valida o pedido: corpo inválido (400), RA inexistente (404), administrador (400)", async () => {
    const invalido = await request(app).patch("/admin/usuarios/200/bloqueio").set("Authorization", admin.auth).send({ bloqueado: "sim" });
    expect(invalido.status).toBe(400);
    expect((await bloquear("999")).status).toBe(404);
    expect((await bloquear("1")).status).toBe(400);
  });

  it("aparece na listagem do admin", async () => {
    await bloquear("200");
    const res = await request(app).get("/admin/usuarios").set("Authorization", admin.auth);
    const m = res.body.find((u: { ra: string }) => u.ra === "200");
    expect(m.bloqueado).toBe(true);
  });
});

describe("conta bloqueada", () => {
  it("não consegue fazer login, mesmo com a senha certa (403)", async () => {
    await bloquear("100");
    const res = await request(app).post("/auth/login").send({ ra: "100", senha: SENHA });
    expect(res.status).toBe(403);
    expect(res.body.bloqueado).toBe(true);
  });

  it("perde o acesso na hora, mesmo com token ainda válido (403)", async () => {
    await bloquear("100");
    const res = await request(app).get("/caronas").set("Authorization", aluno.auth);
    expect(res.status).toBe(403);
    expect(res.body.bloqueado).toBe(true);
  });

  it("motorista bloqueado some da lista de caronas", async () => {
    const antes = await request(app).get("/caronas").set("Authorization", aluno.auth);
    expect(antes.body).toHaveLength(1);
    await bloquear("200");
    const depois = await request(app).get("/caronas").set("Authorization", aluno.auth);
    expect(depois.body).toHaveLength(0);
  });

  it("desbloquear devolve o acesso", async () => {
    await bloquear("100");
    await bloquear("100", false);
    expect((await request(app).get("/caronas").set("Authorization", aluno.auth)).status).toBe(200);
    expect((await request(app).post("/auth/login").send({ ra: "100", senha: SENHA })).status).toBe(200);
  });

  it("token de conta que não existe mais é recusado (401)", async () => {
    await pool.query("DELETE FROM usuarios WHERE ra = '200'");
    expect((await request(app).get("/caronas").set("Authorization", motorista.auth)).status).toBe(401);
  });
});
