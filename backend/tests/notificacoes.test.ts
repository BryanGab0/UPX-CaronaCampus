import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";

// O envio real (web-push) é simulado: os testes conferem QUEM receberia e O QUÊ.
const { enviar } = vi.hoisted(() => ({ enviar: vi.fn() }));
vi.mock("web-push", () => ({ default: { setVapidDetails: vi.fn(), sendNotification: enviar } }));

import { app } from "../src/app.js";
import { pool } from "../src/db.js";
import { limparBanco, criarUsuario, criarTrajeto } from "./utils.js";

afterAll(() => pool.end());

let passageiro: Awaited<ReturnType<typeof criarUsuario>>;
let motorista: Awaited<ReturnType<typeof criarUsuario>>;
let admin: Awaited<ReturnType<typeof criarUsuario>>;

beforeEach(async () => {
  await limparBanco();
  enviar.mockReset().mockResolvedValue({});
  passageiro = await criarUsuario("100");
  motorista = await criarUsuario("200");
  admin = await criarUsuario("1", { admin: true });
  await criarTrajeto("200", "motorista");
});

const inscricao = (n: string) => ({ endpoint: `https://push.exemplo.com/${n}`, keys: { p256dh: `chave-${n}`, auth: `auth-${n}` } });
const inscrever = (ra: string, quem: { auth: string }, corpo: object) =>
  request(app).post(`/usuarios/${ra}/inscricoes`).set("Authorization", quem.auth).send(corpo);
const pedir = () => request(app).post("/usuarios/100/solicitacoes").set("Authorization", passageiro.auth).send({ motoristaRa: "200" });
// Destinos e conteúdos enviados (a carga é o JSON da notificação).
const enviados = () => enviar.mock.calls.map(([sub, carga]) => ({ para: sub.endpoint, ...JSON.parse(carga) }));

describe("inscrição do aparelho", () => {
  it("entrega a chave pública para o navegador", async () => {
    const res = await request(app).get("/notificacoes/chave");
    expect(res.body).toEqual({ chave: "chave-publica-de-teste" });
  });

  it("valida a inscrição (400) e só o próprio usuário inscreve (403)", async () => {
    expect((await inscrever("100", passageiro, { endpoint: "http://inseguro" })).status).toBe(400);
    expect((await inscrever("200", passageiro, inscricao("a"))).status).toBe(403);
    expect((await inscrever("100", passageiro, inscricao("a"))).status).toBe(201);
  });

  it("o mesmo aparelho passa para quem se inscreveu por último", async () => {
    await inscrever("100", passageiro, inscricao("celular"));
    await inscrever("200", motorista, inscricao("celular"));
    const { rows } = await pool.query("SELECT usuario_ra FROM inscricoes_push");
    expect(rows).toEqual([{ usuario_ra: "200" }]);
  });

  it("desativar remove a inscrição", async () => {
    await inscrever("100", passageiro, inscricao("a"));
    const res = await request(app).delete("/usuarios/100/inscricoes").set("Authorization", passageiro.auth).send({ endpoint: inscricao("a").endpoint });
    expect(res.status).toBe(204);
    expect((await pool.query("SELECT 1 FROM inscricoes_push")).rowCount).toBe(0);
  });
});

describe("quando avisa", () => {
  it("pedido novo avisa o motorista (só na primeira vez)", async () => {
    await inscrever("200", motorista, inscricao("motorista"));
    await pedir();
    await vi.waitFor(() => expect(enviar).toHaveBeenCalledTimes(1));
    expect(enviados()[0]).toMatchObject({ para: inscricao("motorista").endpoint, titulo: "Novo pedido de carona", url: "/perfil" });
    expect(enviados()[0].corpo).toContain("Usuario 100");

    await pedir(); // repetir o pedido não gera outro aviso
    await new Promise((r) => setTimeout(r, 100));
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it("aceite e recusa avisam o passageiro, levando à tela certa", async () => {
    await inscrever("100", passageiro, inscricao("passageiro"));
    const { body } = await pedir();
    await request(app).patch(`/solicitacoes/${body.id}`).set("Authorization", motorista.auth).send({ status: "aceita" });
    await vi.waitFor(() => expect(enviar).toHaveBeenCalledTimes(1));
    expect(enviados()[0]).toMatchObject({ titulo: "Pedido aceito!", url: "/carona/200" });

    await request(app).patch(`/solicitacoes/${body.id}`).set("Authorization", motorista.auth).send({ status: "recusada" });
    await vi.waitFor(() => expect(enviar).toHaveBeenCalledTimes(2));
    expect(enviados()[1]).toMatchObject({ titulo: "Pedido recusado", url: "/caronas" });
  });

  it("envia para todos os aparelhos da pessoa", async () => {
    await inscrever("200", motorista, inscricao("celular"));
    await inscrever("200", motorista, inscricao("notebook"));
    await pedir();
    await vi.waitFor(() => expect(enviar).toHaveBeenCalledTimes(2));
  });

  it("conta bloqueada não recebe avisos", async () => {
    await inscrever("200", motorista, inscricao("motorista"));
    await request(app).patch("/admin/usuarios/200/bloqueio").set("Authorization", admin.auth).send({ bloqueado: true });
    await notificarDireto("200");
    expect(enviar).not.toHaveBeenCalled();
  });

  it("aparelho que cancelou a inscrição (410) é removido", async () => {
    enviar.mockRejectedValue(Object.assign(new Error("Gone"), { statusCode: 410 }));
    await inscrever("200", motorista, inscricao("antigo"));
    await pedir();
    await vi.waitFor(async () => expect((await pool.query("SELECT 1 FROM inscricoes_push")).rowCount).toBe(0));
  });
});

// Chama o envio diretamente (o pedido para um motorista bloqueado nem chegaria a ser listado).
async function notificarDireto(ra: string) {
  const { notificar } = await import("../src/notificacoes.js");
  await notificar(ra, { titulo: "teste", corpo: "teste", url: "/" });
}
