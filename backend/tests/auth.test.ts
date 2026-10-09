import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../src/app.js";
import { pool } from "../src/db.js";
import { limparBanco, criarUsuario, SENHA } from "./utils.js";

beforeEach(limparBanco);
afterAll(() => pool.end());

const novoUsuario = { ra: "100", nome: "Ana Souza", email: "100@facens.br", telefone: "(15) 99999-0000", senha: "123456" };

describe("POST /auth/registrar", () => {
  it("cria a conta, devolve token e guarda só o hash da senha", async () => {
    const res = await request(app).post("/auth/registrar").send(novoUsuario);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.usuario).toEqual({ ra: "100", nome: "Ana Souza", email: "100@facens.br", admin: false });

    const { rows } = await pool.query("SELECT senha_hash, telefone FROM usuarios WHERE ra = '100'");
    expect(rows[0].senha_hash).not.toBe("123456");
    expect(rows[0].telefone).toBe("15999990000"); // guardado só com dígitos
  });

  it("recusa RA já cadastrado (409)", async () => {
    await criarUsuario("100");
    const res = await request(app).post("/auth/registrar").send(novoUsuario);
    expect(res.status).toBe(409);
  });

  it("recusa telefone inválido e senha curta (400)", async () => {
    const tel = await request(app).post("/auth/registrar").send({ ...novoUsuario, telefone: "123" });
    expect(tel.status).toBe(400);
    const senha = await request(app).post("/auth/registrar").send({ ...novoUsuario, senha: "123" });
    expect(senha.status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  it("devolve um token que funciona nas rotas protegidas", async () => {
    await criarUsuario("200");
    const login = await request(app).post("/auth/login").send({ ra: "200", senha: SENHA });
    expect(login.status).toBe(200);

    const eu = await request(app).get("/auth/eu").set("Authorization", `Bearer ${login.body.token}`);
    expect(eu.status).toBe(200);
    expect(eu.body.ra).toBe("200");
  });

  it("recusa senha errada e RA inexistente com a mesma resposta (401)", async () => {
    await criarUsuario("200");
    const errada = await request(app).post("/auth/login").send({ ra: "200", senha: "errada" });
    const inexistente = await request(app).post("/auth/login").send({ ra: "999", senha: "errada" });
    expect(errada.status).toBe(401);
    expect(inexistente.status).toBe(401);
    expect(errada.body).toEqual(inexistente.body); // não revela se o RA existe
  });
});

describe("token", () => {
  it("recusa requisição sem token (401)", async () => {
    expect((await request(app).get("/auth/eu")).status).toBe(401);
  });

  it("recusa token assinado com outro segredo (401)", async () => {
    await criarUsuario("200");
    const falso = jwt.sign({ ra: "200" }, "dev-secret");
    const res = await request(app).get("/auth/eu").set("Authorization", `Bearer ${falso}`);
    expect(res.status).toBe(401);
  });
});
