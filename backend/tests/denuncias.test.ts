import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { pool } from "../src/db.js";
import { limparBanco, criarUsuario, criarTrajeto } from "./utils.js";

afterAll(() => pool.end());

let admin: Awaited<ReturnType<typeof criarUsuario>>;
let ana: Awaited<ReturnType<typeof criarUsuario>>;
let beto: Awaited<ReturnType<typeof criarUsuario>>;

beforeEach(async () => {
  await limparBanco();
  admin = await criarUsuario("1", { admin: true });
  ana = await criarUsuario("100");
  beto = await criarUsuario("200");
});

const denunciar = (corpo: object, quem = ana, ra = "100") =>
  request(app).post(`/usuarios/${ra}/denuncias`).set("Authorization", quem.auth).send(corpo);

describe("denunciar", () => {
  it("registra a denúncia como aberta", async () => {
    const res = await denunciar({ denunciadoRa: "200", motivo: "seguranca", descricao: "  Dirigiu acima do limite.  " });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("aberta");
    const { rows } = await pool.query("SELECT descricao FROM denuncias");
    expect(rows[0].descricao).toBe("Dirigiu acima do limite."); // sem espaços sobrando
  });

  it("valida motivo, descrição, alvo e autor", async () => {
    expect((await denunciar({ denunciadoRa: "200", motivo: "qualquer" })).status).toBe(400);
    expect((await denunciar({ denunciadoRa: "200", motivo: "outro", descricao: "x".repeat(501) })).status).toBe(400);
    expect((await denunciar({ denunciadoRa: "100", motivo: "outro" })).status).toBe(400); // a si mesmo
    expect((await denunciar({ denunciadoRa: "999", motivo: "outro" })).status).toBe(404);
    expect((await denunciar({ denunciadoRa: "200", motivo: "outro" }, beto)).status).toBe(403); // em nome de outro RA
  });

  it("aceita só uma denúncia aberta por par (409), e outra depois de resolvida", async () => {
    await denunciar({ denunciadoRa: "200", motivo: "comportamento" });
    expect((await denunciar({ denunciadoRa: "200", motivo: "outro" })).status).toBe(409);

    await request(app).patch("/admin/denuncias/1").set("Authorization", admin.auth).send({ status: "resolvida" });
    expect((await denunciar({ denunciadoRa: "200", motivo: "outro" })).status).toBe(201);
  });
});

describe("denúncias no admin", () => {
  it("só administrador vê e resolve (403)", async () => {
    await denunciar({ denunciadoRa: "200", motivo: "outro" });
    expect((await request(app).get("/admin/denuncias").set("Authorization", ana.auth)).status).toBe(403);
    expect((await request(app).patch("/admin/denuncias/1").set("Authorization", ana.auth).send({ status: "resolvida" })).status).toBe(403);
  });

  it("lista com nomes, situação do denunciado e as abertas primeiro", async () => {
    await denunciar({ denunciadoRa: "200", motivo: "outro" });                 // id 1
    await denunciar({ denunciadoRa: "100", motivo: "perfil_falso" }, beto, "200"); // id 2
    await request(app).patch("/admin/denuncias/1").set("Authorization", admin.auth).send({ status: "resolvida" });
    await request(app).patch("/admin/usuarios/100/bloqueio").set("Authorization", admin.auth).send({ bloqueado: true });

    const res = await request(app).get("/admin/denuncias").set("Authorization", admin.auth);
    expect(res.body.map((d: { id: number }) => d.id)).toEqual([2, 1]);
    expect(res.body[0]).toMatchObject({
      motivo: "perfil_falso", status: "aberta", denuncianteNome: "Usuario 200", denunciadoRa: "100", denunciadoBloqueado: true,
    });
  });

  it("valida o status (400) e a denúncia (404)", async () => {
    await denunciar({ denunciadoRa: "200", motivo: "outro" });
    expect((await request(app).patch("/admin/denuncias/1").set("Authorization", admin.auth).send({ status: "talvez" })).status).toBe(400);
    expect((await request(app).patch("/admin/denuncias/99").set("Authorization", admin.auth).send({ status: "resolvida" })).status).toBe(404);
  });
});

describe("pedidos recebidos", () => {
  it("trazem o RA do passageiro (para o motorista poder denunciar)", async () => {
    await criarTrajeto("200", "motorista");
    await request(app).post("/usuarios/100/solicitacoes").set("Authorization", ana.auth).send({ motoristaRa: "200" });
    const res = await request(app).get("/usuarios/200/pedidos").set("Authorization", beto.auth);
    expect(res.body[0].passageiroRa).toBe("100");
  });
});
