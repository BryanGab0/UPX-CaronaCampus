import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../src/app.js";
import { pool } from "../src/db.js";
import { emitidoAntesDaTroca } from "../src/token.js";
import { JWT_SECRET_TESTE } from "./ambiente.js";
import { limparBanco, criarUsuario, SENHA } from "./utils.js";

afterAll(() => pool.end());

type Usuario = Awaited<ReturnType<typeof criarUsuario>>;
let ana: Usuario, bia: Usuario;

beforeEach(async () => {
  await limparBanco();
  ana = await criarUsuario("100", { telefone: "15911110000" });
  bia = await criarUsuario("200");
});

const editar = (quem: Usuario, ra: string, corpo: object) =>
  request(app).patch(`/usuarios/${ra}`).set("Authorization", quem.auth).send(corpo);
const trocarSenha = (auth: string, corpo: object) =>
  request(app).patch("/usuarios/100/senha").set("Authorization", auth).send(corpo);
const eu = (auth: string) => request(app).get("/auth/eu").set("Authorization", auth);
// Token "de outro aparelho", emitido 1 minuto atrás (antes da troca de senha).
const tokenAntigo = () => `Bearer ${jwt.sign({ ra: "100", iat: Math.floor(Date.now() / 1000) - 60 }, JWT_SECRET_TESTE)}`;

describe("editar nome e telefone", () => {
  it("altera os dois e o /auth/eu devolve os novos (com o telefone)", async () => {
    const res = await editar(ana, "100", { nome: "  Ana Souza  ", telefone: "(15) 98888-7777" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ra: "100", nome: "Ana Souza", email: "100@facens.br", telefone: "15988887777" });
    expect((await eu(ana.auth)).body).toMatchObject({ nome: "Ana Souza", telefone: "15988887777" });
  });

  it("aceita alterar só um dos campos", async () => {
    const res = await editar(ana, "100", { telefone: "15977776666" });
    expect(res.body).toMatchObject({ nome: "Usuario 100", telefone: "15977776666" });
  });

  it("valida nome, telefone e corpo vazio (400)", async () => {
    expect((await editar(ana, "100", { nome: "A" })).status).toBe(400);
    expect((await editar(ana, "100", { nome: "x".repeat(81) })).status).toBe(400);
    expect((await editar(ana, "100", { telefone: "1234" })).status).toBe(400);
    expect((await editar(ana, "100", {})).status).toBe(400);
  });

  it("só o dono altera os próprios dados (403)", async () => {
    expect((await editar(bia, "100", { nome: "Invasora" })).status).toBe(403);
  });
});

describe("trocar senha", () => {
  it("confere a senha atual (401) e valida a nova (400)", async () => {
    expect((await trocarSenha(ana.auth, { senhaAtual: "errada", novaSenha: "nova-senha" })).status).toBe(401);
    expect((await trocarSenha(ana.auth, { senhaAtual: SENHA, novaSenha: "123" })).status).toBe(400);
    expect((await trocarSenha(ana.auth, { senhaAtual: SENHA, novaSenha: SENHA })).status).toBe(400);
    expect((await trocarSenha(ana.auth, { senhaAtual: SENHA })).status).toBe(400);
  });

  it("depois da troca, o login usa a senha nova", async () => {
    expect((await trocarSenha(ana.auth, { senhaAtual: SENHA, novaSenha: "nova-senha" })).status).toBe(200);
    expect((await request(app).post("/auth/login").send({ ra: "100", senha: SENHA })).status).toBe(401);
    expect((await request(app).post("/auth/login").send({ ra: "100", senha: "nova-senha" })).status).toBe(200);
  });

  it("derruba as sessões antigas; o token novo continua valendo", async () => {
    const antigo = tokenAntigo();
    expect((await eu(antigo)).status).toBe(200); // antes da troca, o token antigo funciona

    const res = await trocarSenha(ana.auth, { senhaAtual: SENHA, novaSenha: "nova-senha" });
    const novo = `Bearer ${res.body.token}`;

    const recusado = await eu(antigo);
    expect(recusado.status).toBe(401);
    expect(recusado.body.erro).toMatch(/senha foi alterada/);
    expect((await eu(novo)).status).toBe(200);
    // um login feito depois da troca também vale
    const login = await request(app).post("/auth/login").send({ ra: "100", senha: "nova-senha" });
    expect((await eu(`Bearer ${login.body.token}`)).status).toBe(200);
  });

  it("remove as inscrições de push (os aparelhos das sessões encerradas param de receber avisos)", async () => {
    await pool.query(
      "INSERT INTO inscricoes_push (endpoint, usuario_ra, p256dh, auth) VALUES ('https://push.exemplo.com/perdido', '100', 'k', 'a'), ('https://push.exemplo.com/bia', '200', 'k', 'a')",
    );
    await trocarSenha(ana.auth, { senhaAtual: SENHA, novaSenha: "nova-senha" });
    const { rows } = await pool.query("SELECT usuario_ra FROM inscricoes_push");
    expect(rows).toEqual([{ usuario_ra: "200" }]); // só os da própria pessoa
  });

  it("só o dono troca a própria senha (403)", async () => {
    expect((await trocarSenha(bia.auth, { senhaAtual: SENHA, novaSenha: "nova-senha" })).status).toBe(403);
  });

  // Por último no arquivo: as falhas contam para o mesmo limite do login (por IP, em memória).
  it("tentativas com a senha atual errada têm limite (429)", async () => {
    let ultima = 0;
    for (let i = 0; i < 11; i++) ultima = (await trocarSenha(ana.auth, { senhaAtual: "errada", novaSenha: "nova-senha" })).status;
    expect(ultima).toBe(429);
  });
});

describe("emitidoAntesDaTroca", () => {
  const troca = new Date("2026-10-10T12:00:00.700Z"); // 12:00:00 e 700 ms
  it("token de antes da troca é recusado; do mesmo segundo ou depois, aceito", () => {
    expect(emitidoAntesDaTroca(Math.floor(troca.getTime() / 1000) - 1, troca)).toBe(true);
    expect(emitidoAntesDaTroca(Math.floor(troca.getTime() / 1000), troca)).toBe(false);
    expect(emitidoAntesDaTroca(Math.floor(troca.getTime() / 1000) + 5, troca)).toBe(false);
  });
  it("sem troca registrada, nada é recusado", () => {
    expect(emitidoAntesDaTroca(0, null)).toBe(false);
  });
});
