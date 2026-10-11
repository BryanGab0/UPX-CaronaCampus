import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../src/app.js";
import { pool } from "../src/db.js";
import { gerarSenhaTemporaria } from "../src/token.js";
import { JWT_SECRET_TESTE } from "./ambiente.js";
import { limparBanco, criarUsuario, SENHA } from "./utils.js";

afterAll(() => pool.end());

type Usuario = Awaited<ReturnType<typeof criarUsuario>>;
let admin: Usuario, outro: Usuario;

beforeEach(async () => {
  await limparBanco();
  admin = await criarUsuario("1", { admin: true });
  await criarUsuario("100"); // o aluno: os testes entram com a senha (login), não com o token
  outro = await criarUsuario("200");
});

const gerar = (quem: Usuario, ra: string) =>
  request(app).post(`/admin/usuarios/${ra}/senha-temporaria`).set("Authorization", quem.auth);
const login = (senha: string) => request(app).post("/auth/login").send({ ra: "100", senha });
// Sessão aberta no celular do aluno antes de pedir a senha nova (emitida 1 minuto atrás).
const sessaoAntiga = () => `Bearer ${jwt.sign({ ra: "100", iat: Math.floor(Date.now() / 1000) - 60 }, JWT_SECRET_TESTE)}`;

describe("admin gera senha temporária", () => {
  it("devolve a senha uma vez e só o hash fica no banco", async () => {
    const res = await gerar(admin, "100");
    expect(res.status).toBe(200);
    expect(res.body.senha).toMatch(/^[A-HJ-NP-Za-km-np-z2-9]{10}$/);
    const { rows } = await pool.query("SELECT senha_hash, senha_temporaria FROM usuarios WHERE ra = '100'");
    expect(rows[0].senha_hash).not.toContain(res.body.senha);
    expect(rows[0].senha_temporaria).toBe(true);
  });

  it("só admin gera (403), não vale para administradores (400) e o RA precisa existir (404)", async () => {
    expect((await gerar(outro, "100")).status).toBe(403);
    expect((await gerar(admin, "1")).status).toBe(400);
    expect((await gerar(admin, "999")).status).toBe(404);
  });

  it("encerra as sessões e os avisos dos aparelhos do aluno", async () => {
    const antiga = sessaoAntiga();
    await pool.query("INSERT INTO inscricoes_push (endpoint, usuario_ra, p256dh, auth) VALUES ('https://push.exemplo.com/a', '100', 'k', 'a')");
    await gerar(admin, "100");
    expect((await request(app).get("/auth/eu").set("Authorization", antiga)).status).toBe(401);
    expect((await pool.query("SELECT 1 FROM inscricoes_push")).rowCount).toBe(0);
  });

  it("a lista de usuários do admin mostra quem está com senha temporária", async () => {
    await gerar(admin, "100");
    const lista = (await request(app).get("/admin/usuarios").set("Authorization", admin.auth)).body;
    expect(lista.find((u: { ra: string }) => u.ra === "100").senha_temporaria).toBe(true);
  });
});

describe("troca obrigatória", () => {
  it("a senha antiga deixa de valer e o login com a temporária avisa o app", async () => {
    const { senha } = (await gerar(admin, "100")).body;
    expect((await login(SENHA)).status).toBe(401);
    const res = await login(senha);
    expect(res.status).toBe(200);
    expect(res.body.usuario.senhaTemporaria).toBe(true);
  });

  it("com a temporária, a API só libera trocar a senha e ver os próprios dados", async () => {
    const { senha } = (await gerar(admin, "100")).body;
    const auth = `Bearer ${(await login(senha)).body.token}`;

    const barrado = await request(app).get("/caronas").set("Authorization", auth);
    expect(barrado.status).toBe(403);
    expect(barrado.body.trocarSenha).toBe(true);
    expect((await request(app).get("/usuarios/100/trajeto").set("Authorization", auth)).status).toBe(403);
    expect((await request(app).get("/auth/eu").set("Authorization", auth)).status).toBe(200);
  });

  it("depois de definir a própria senha, tudo volta ao normal", async () => {
    const { senha } = (await gerar(admin, "100")).body;
    const auth = `Bearer ${(await login(senha)).body.token}`;
    const troca = await request(app).patch("/usuarios/100/senha").set("Authorization", auth)
      .send({ senhaAtual: senha, novaSenha: "minha-senha-nova" });
    expect(troca.status).toBe(200);

    expect((await request(app).get("/caronas").set("Authorization", `Bearer ${troca.body.token}`)).status).toBe(200);
    const denovo = await login("minha-senha-nova");
    expect(denovo.body.usuario.senhaTemporaria).toBe(false);
  });
});

describe("gerarSenhaTemporaria", () => {
  it("usa só caracteres fáceis de ditar e não se repete", () => {
    const senhas = Array.from({ length: 50 }, () => gerarSenhaTemporaria());
    for (const s of senhas) expect(s).toMatch(/^[^0O1lI]{10}$/);
    expect(new Set(senhas).size).toBe(50);
  });
});
