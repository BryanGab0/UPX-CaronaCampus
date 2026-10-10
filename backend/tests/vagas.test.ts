import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { pool } from "../src/db.js";
import { limparBanco, criarUsuario, criarTrajeto } from "./utils.js";

afterAll(() => pool.end());

type Usuario = Awaited<ReturnType<typeof criarUsuario>>;
let motorista: Usuario, ana: Usuario, bia: Usuario, caio: Usuario;

beforeEach(async () => {
  await limparBanco();
  motorista = await criarUsuario("200");
  ana = await criarUsuario("101");
  bia = await criarUsuario("102");
  caio = await criarUsuario("103");
  await criarTrajeto("200", "motorista");
});

const definirVagas = (n: number) => pool.query("UPDATE trajetos SET carro_lugares = $1 WHERE usuario_ra = '200'", [n]);
const pedir = (p: Usuario) =>
  request(app).post(`/usuarios/${p.ra}/solicitacoes`).set("Authorization", p.auth).send({ motoristaRa: "200" });
const aceitar = (id: number) =>
  request(app).patch(`/solicitacoes/${id}`).set("Authorization", motorista.auth).send({ status: "aceita" });
const carona = async (quem: Usuario) =>
  (await request(app).get("/caronas").set("Authorization", quem.auth)).body.find((c: { id: string }) => c.id === "200");
const salvarVagas = (n: number) =>
  request(app).put("/usuarios/200/trajeto").set("Authorization", motorista.auth).send({
    papel: "motorista", endereco: "Rua A, Sorocaba", origem: { lat: -23.5, lng: -47.45 },
    dias: ["seg", "ter"], chegada: "08:00", saida: "18:00", carro: { modelo: "Gol", lugares: n, consumo: 11 },
  });

describe("vagas na lista de caronas", () => {
  it("mostra as vagas e quantas estão livres", async () => {
    await definirVagas(2);
    expect(await carona(caio)).toMatchObject({ vagas: 2, vagasLivres: 2 });

    const { body } = await pedir(ana);
    expect(await carona(caio)).toMatchObject({ vagasLivres: 2 }); // pedido pendente não ocupa vaga
    await aceitar(body.id);
    expect(await carona(caio)).toMatchObject({ vagas: 2, vagasLivres: 1 });
  });
});

describe("limite de vagas", () => {
  it("não aceita além das vagas (409) e libera a vaga quando alguém desiste", async () => {
    await definirVagas(1);
    const a = (await pedir(ana)).body.id;
    const b = (await pedir(bia)).body.id;
    expect((await aceitar(a)).status).toBe(200);

    const lotado = await aceitar(b);
    expect(lotado.status).toBe(409);
    expect(lotado.body.erro).toMatch(/lotado/i);

    await request(app).patch(`/solicitacoes/${a}/cancelamento`).set("Authorization", ana.auth);
    expect((await aceitar(b)).status).toBe(200);
  });

  it("dois aceites ao mesmo tempo não ocupam a mesma última vaga", async () => {
    await definirVagas(1);
    const a = (await pedir(ana)).body.id;
    const b = (await pedir(bia)).body.id;
    const respostas = await Promise.all([aceitar(a), aceitar(b)]);
    expect(respostas.map((r) => r.status).sort()).toEqual([200, 409]);
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM solicitacoes WHERE status = 'aceita'");
    expect(rows[0].n).toBe(1);
  });

  it("carro lotado não recebe pedido novo nem reaberto (409); recusar continua possível", async () => {
    await definirVagas(1);
    const a = (await pedir(ana)).body.id;
    const b = (await pedir(bia)).body.id; // pendente de antes de lotar
    await aceitar(a);

    const novo = await pedir(caio);
    expect(novo.status).toBe(409);
    expect(novo.body.erro).toMatch(/lotado/i);

    await request(app).patch(`/solicitacoes/${b}/cancelamento`).set("Authorization", bia.auth);
    expect((await pedir(bia)).status).toBe(409); // reabrir depois de cancelar também conta como pedido novo

    expect((await pedir(ana)).status).toBe(201); // repetir o pedido já aceito segue sem efeito
  });

  it("o pendente antigo pode ser recusado mesmo com o carro lotado", async () => {
    await definirVagas(1);
    const a = (await pedir(ana)).body.id;
    const b = (await pedir(bia)).body.id;
    await aceitar(a);
    const res = await request(app).patch(`/solicitacoes/${b}`).set("Authorization", motorista.auth).send({ status: "recusada" });
    expect(res.status).toBe(200);
  });
});

describe("vagas no trajeto", () => {
  it("aceita de 1 a 6 vagas (400 fora disso)", async () => {
    for (const n of [0, 7, 2.5]) expect((await salvarVagas(n)).status).toBe(400);
    expect((await salvarVagas(1)).status).toBe(200);
    expect((await salvarVagas(6)).status).toBe(200);
  });

  it("não reduz abaixo dos passageiros aceitos (409)", async () => {
    await definirVagas(3);
    await aceitar((await pedir(ana)).body.id);
    await aceitar((await pedir(bia)).body.id);

    const res = await salvarVagas(1);
    expect(res.status).toBe(409);
    expect(res.body.erro).toMatch(/2 caronas aceitas/);
    expect((await salvarVagas(2)).status).toBe(200);
  });
});
