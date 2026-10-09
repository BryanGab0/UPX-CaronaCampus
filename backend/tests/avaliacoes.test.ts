import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { pool } from "../src/db.js";
import { limparBanco, criarUsuario, criarTrajeto } from "./utils.js";

afterAll(() => pool.end());

let passageiro: Awaited<ReturnType<typeof criarUsuario>>;
let passageiro2: Awaited<ReturnType<typeof criarUsuario>>;
let motorista: Awaited<ReturnType<typeof criarUsuario>>;
let terceiro: Awaited<ReturnType<typeof criarUsuario>>;

beforeEach(async () => {
  await limparBanco();
  passageiro = await criarUsuario("100");
  passageiro2 = await criarUsuario("101");
  motorista = await criarUsuario("200");
  terceiro = await criarUsuario("300");
  await criarTrajeto("200", "motorista");
});

// Passageiro pede e (opcionalmente) o motorista aceita; devolve o id do pedido.
async function pedido(quem = passageiro, ra = "100", aceitar = true) {
  const res = await request(app).post(`/usuarios/${ra}/solicitacoes`).set("Authorization", quem.auth).send({ motoristaRa: "200" });
  if (aceitar) await request(app).patch(`/solicitacoes/${res.body.id}`).set("Authorization", motorista.auth).send({ status: "aceita" });
  return res.body.id as number;
}
const avaliar = (id: number, nota: unknown, quem = passageiro) =>
  request(app).post(`/solicitacoes/${id}/avaliacao`).set("Authorization", quem.auth).send({ nota });

describe("avaliar", () => {
  it("só depois que o pedido é aceito (400)", async () => {
    const id = await pedido(passageiro, "100", false);
    expect((await avaliar(id, 5)).status).toBe(400);
  });

  it("só quem participa do pedido (403) e pedido existente (404)", async () => {
    const id = await pedido();
    expect((await avaliar(id, 5, terceiro)).status).toBe(403);
    expect((await avaliar(9999, 5)).status).toBe(404);
  });

  it("a nota vai de 1 a 5, inteira (400)", async () => {
    const id = await pedido();
    for (const nota of [0, 6, 4.5, "boa", null]) expect((await avaliar(id, nota)).status).toBe(400);
  });

  it("cada lado avalia o outro, e reenviar troca a nota", async () => {
    const id = await pedido();
    expect((await avaliar(id, 3)).status).toBe(200);           // passageiro -> motorista
    expect((await avaliar(id, 4, motorista)).status).toBe(200); // motorista -> passageiro
    await avaliar(id, 5);                                       // passageiro muda de ideia

    const { rows } = await pool.query("SELECT avaliador_ra, avaliado_ra, nota FROM avaliacoes ORDER BY avaliador_ra");
    expect(rows).toEqual([
      { avaliador_ra: "100", avaliado_ra: "200", nota: 5 },
      { avaliador_ra: "200", avaliado_ra: "100", nota: 4 },
    ]);
  });
});

describe("reputação exibida", () => {
  it("a lista de caronas traz a média do motorista (null sem avaliações)", async () => {
    const antes = await request(app).get("/caronas").set("Authorization", terceiro.auth);
    expect(antes.body[0]).toMatchObject({ notaMedia: null, totalAvaliacoes: 0 });

    await avaliar(await pedido(), 5);
    await avaliar(await pedido(passageiro2, "101"), 4, passageiro2);
    const depois = await request(app).get("/caronas").set("Authorization", terceiro.auth);
    expect(depois.body[0]).toMatchObject({ notaMedia: 4.5, totalAvaliacoes: 2 });
  });

  it("o passageiro vê o id do pedido e a nota que já deu", async () => {
    const id = await pedido();
    await avaliar(id, 4);
    const res = await request(app).get("/usuarios/100/solicitacoes").set("Authorization", passageiro.auth);
    expect(res.body[0]).toMatchObject({ id, minhaNota: 4 });
  });

  it("o motorista vê a nota que deu e a reputação do passageiro", async () => {
    const id = await pedido();
    await avaliar(id, 2, motorista);
    const res = await request(app).get("/usuarios/200/pedidos").set("Authorization", motorista.auth);
    expect(res.body[0]).toMatchObject({ id, minhaNota: 2, passageiroMedia: 2, passageiroAvaliacoes: 1 });
  });
});
