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

const responder = (id: number, status: string) =>
  request(app).patch(`/solicitacoes/${id}`).set("Authorization", motorista.auth).send({ status });
const cancelar = (id: number, quem: { auth: string }) =>
  request(app).patch(`/solicitacoes/${id}/cancelamento`).set("Authorization", quem.auth);
const minhas = async () => (await request(app).get("/usuarios/100/solicitacoes").set("Authorization", passageiro.auth)).body;
const recebidos = async () => (await request(app).get("/usuarios/200/pedidos").set("Authorization", motorista.auth)).body;

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

  it("só responde pedido pendente (409): não troca um aceite por recusa", async () => {
    const id = await pedir();
    await responder(id, "aceita");
    const res = await responder(id, "recusada");
    expect(res.status).toBe(409);
    expect((await minhas())[0]).toMatchObject({ status: "aceita" });
  });

  it("recusa status inválido (400) e pedido inexistente (404)", async () => {
    const id = await pedir();
    const invalido = await request(app).patch(`/solicitacoes/${id}`).set("Authorization", motorista.auth).send({ status: "talvez" });
    expect(invalido.status).toBe(400);
    const inexistente = await request(app).patch("/solicitacoes/9999").set("Authorization", motorista.auth).send({ status: "aceita" });
    expect(inexistente.status).toBe(404);
  });
});

describe("cancelar pedido", () => {
  it("passageiro cancela um pedido pendente", async () => {
    const id = await pedir();
    const res = await cancelar(id, passageiro);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id, status: "cancelada", canceladoPor: "passageiro" });
    expect(await recebidos()).toEqual([expect.objectContaining({ status: "cancelada", canceladoPor: "passageiro" })]);
  });

  it("passageiro desiste de um pedido aceito e os telefones somem dos dois lados", async () => {
    const id = await pedir();
    await responder(id, "aceita");
    expect((await cancelar(id, passageiro)).status).toBe(200);
    expect((await minhas())[0]).toMatchObject({ status: "cancelada", motoristaTelefone: null });
    expect((await recebidos())[0]).toMatchObject({ status: "cancelada", passageiroTelefone: null });
  });

  it("motorista desfaz um aceite", async () => {
    const id = await pedir();
    await responder(id, "aceita");
    expect((await cancelar(id, motorista)).status).toBe(200);
    expect((await minhas())[0]).toMatchObject({ status: "cancelada", canceladoPor: "motorista", motoristaTelefone: null });
  });

  it("motorista não cancela pedido pendente: usa recusar (409)", async () => {
    const id = await pedir();
    expect((await cancelar(id, motorista)).status).toBe(409);
    expect((await minhas())[0]).toMatchObject({ status: "pendente" });
  });

  it("não cancela pedido recusado nem já cancelado (409)", async () => {
    const recusado = await pedir();
    await responder(recusado, "recusada");
    expect((await cancelar(recusado, passageiro)).status).toBe(409);

    await pool.query("UPDATE solicitacoes SET status = 'pendente' WHERE id = $1", [recusado]);
    expect((await cancelar(recusado, passageiro)).status).toBe(200);
    expect((await cancelar(recusado, passageiro)).status).toBe(409);
  });

  it("só as partes do pedido cancelam (403) e o pedido precisa existir (404)", async () => {
    const id = await pedir();
    expect((await cancelar(id, terceiro)).status).toBe(403);
    expect((await cancelar(9999, passageiro)).status).toBe(404);
  });

  it("motorista não aceita um pedido cancelado (409)", async () => {
    const id = await pedir();
    await cancelar(id, passageiro);
    expect((await responder(id, "aceita")).status).toBe(409);
  });

  it("depois de cancelar, pedir de novo volta a pendente", async () => {
    const id = await pedir();
    await cancelar(id, passageiro);
    expect(await pedir()).toBe(id); // o mesmo pedido (um por par), reaberto
    expect((await recebidos())[0]).toMatchObject({ status: "pendente", canceladoPor: null });
  });

  it("depois de uma recusa, pedir de novo não reabre", async () => {
    const id = await pedir();
    await responder(id, "recusada");
    await pedir();
    expect((await minhas())[0]).toMatchObject({ status: "recusada" });
  });

  it("mantém as avaliações feitas durante a carona, mas não aceita nota nova", async () => {
    const id = await pedir();
    await responder(id, "aceita");
    await request(app).post(`/solicitacoes/${id}/avaliacao`).set("Authorization", passageiro.auth).send({ nota: 5 });
    await cancelar(id, passageiro);

    expect((await minhas())[0]).toMatchObject({ minhaNota: 5 });
    const nova = await request(app).post(`/solicitacoes/${id}/avaliacao`).set("Authorization", passageiro.auth).send({ nota: 1 });
    expect(nova.status).toBe(400);
  });
});
