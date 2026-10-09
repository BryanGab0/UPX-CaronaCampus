import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { pool } from "../src/db.js";
import { limparBanco, criarUsuario, criarTrajeto } from "./utils.js";

afterAll(() => pool.end());

let passageiro: Awaited<ReturnType<typeof criarUsuario>>;
let motorista: Awaited<ReturnType<typeof criarUsuario>>;
let terceiro: Awaited<ReturnType<typeof criarUsuario>>;

beforeEach(async () => {
  await limparBanco();
  passageiro = await criarUsuario("100", { telefone: "15911110000" });
  motorista = await criarUsuario("200", { telefone: "15922220000" });
  terceiro = await criarUsuario("300");
  await criarTrajeto("200", "motorista");
});

// Passageiro pede carona e devolve o id do pedido (visto pelo motorista).
async function pedir() {
  const res = await request(app).post("/usuarios/100/solicitacoes").set("Authorization", passageiro.auth).send({ motoristaRa: "200" });
  expect(res.status).toBe(201);
  return res.body.id as number;
}

describe("solicitar carona", () => {
  it("cria o pedido como pendente e sem expor telefones", async () => {
    await pedir();

    const pedidos = await request(app).get("/usuarios/200/pedidos").set("Authorization", motorista.auth);
    expect(pedidos.body).toEqual([expect.objectContaining({ status: "pendente", passageiroTelefone: null })]);

    const minhas = await request(app).get("/usuarios/100/solicitacoes").set("Authorization", passageiro.auth);
    expect(minhas.body).toEqual([expect.objectContaining({ status: "pendente", motoristaTelefone: null })]);
  });

  it("exige o motorista (400)", async () => {
    const res = await request(app).post("/usuarios/100/solicitacoes").set("Authorization", passageiro.auth).send({});
    expect(res.status).toBe(400);
  });

  it("não deixa pedir carona para si mesmo (400)", async () => {
    const res = await request(app).post("/usuarios/200/solicitacoes").set("Authorization", motorista.auth).send({ motoristaRa: "200" });
    expect(res.status).toBe(400);
  });

  it("recusa motorista inexistente (404) e quem não oferece carona (400)", async () => {
    const inexistente = await request(app).post("/usuarios/100/solicitacoes").set("Authorization", passageiro.auth).send({ motoristaRa: "999" });
    expect(inexistente.status).toBe(404);
    // o "terceiro" existe, mas não tem trajeto de motorista
    const naoMotorista = await request(app).post("/usuarios/100/solicitacoes").set("Authorization", passageiro.auth).send({ motoristaRa: "300" });
    expect(naoMotorista.status).toBe(400);
  });

  it("não deixa pedir em nome de outro RA (403)", async () => {
    const res = await request(app).post("/usuarios/100/solicitacoes").set("Authorization", terceiro.auth).send({ motoristaRa: "200" });
    expect(res.status).toBe(403);
  });
});

describe("aceitar ou recusar", () => {
  it("só o motorista do pedido pode responder (403)", async () => {
    const id = await pedir();
    for (const outro of [passageiro, terceiro]) {
      const res = await request(app).patch(`/solicitacoes/${id}`).set("Authorization", outro.auth).send({ status: "aceita" });
      expect(res.status).toBe(403);
    }
  });

  it("após o aceite, cada lado vê o telefone do outro", async () => {
    const id = await pedir();
    const res = await request(app).patch(`/solicitacoes/${id}`).set("Authorization", motorista.auth).send({ status: "aceita" });
    expect(res.status).toBe(200);

    const pedidos = await request(app).get("/usuarios/200/pedidos").set("Authorization", motorista.auth);
    expect(pedidos.body[0]).toMatchObject({ status: "aceita", passageiroTelefone: "15911110000" });

    const minhas = await request(app).get("/usuarios/100/solicitacoes").set("Authorization", passageiro.auth);
    expect(minhas.body[0]).toMatchObject({ status: "aceita", motoristaTelefone: "15922220000" });
  });

  it("recusado não expõe telefone", async () => {
    const id = await pedir();
    await request(app).patch(`/solicitacoes/${id}`).set("Authorization", motorista.auth).send({ status: "recusada" });
    const minhas = await request(app).get("/usuarios/100/solicitacoes").set("Authorization", passageiro.auth);
    expect(minhas.body[0]).toMatchObject({ status: "recusada", motoristaTelefone: null });
  });

  it("recusa status inválido (400) e pedido inexistente (404)", async () => {
    const id = await pedir();
    const invalido = await request(app).patch(`/solicitacoes/${id}`).set("Authorization", motorista.auth).send({ status: "talvez" });
    expect(invalido.status).toBe(400);
    const inexistente = await request(app).patch("/solicitacoes/9999").set("Authorization", motorista.auth).send({ status: "aceita" });
    expect(inexistente.status).toBe(404);
  });
});
