import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";

// O envio real (web-push) é simulado: os testes conferem QUEM receberia o aviso.
const { enviar } = vi.hoisted(() => ({ enviar: vi.fn() }));
vi.mock("web-push", () => ({ default: { setVapidDetails: vi.fn(), sendNotification: enviar } }));

import { app } from "../src/app.js";
import { pool } from "../src/db.js";
import { limparBanco, criarUsuario, criarTrajeto, SENHA } from "./utils.js";

afterAll(() => pool.end());

type Usuario = Awaited<ReturnType<typeof criarUsuario>>;
let ana: Usuario, bia: Usuario, caio: Usuario, admin: Usuario;

beforeEach(async () => {
  await limparBanco();
  enviar.mockReset().mockResolvedValue({});
  ana = await criarUsuario("100");
  await criarUsuario("200"); // motorista: os testes só usam o RA dele
  bia = await criarUsuario("300");
  caio = await criarUsuario("400");
  admin = await criarUsuario("1", { admin: true });
  await criarTrajeto("100", "passageiro");
  await criarTrajeto("200", "motorista");
});

const excluir = (quem: Usuario, ra: string, corpo: object) =>
  request(app).delete(`/usuarios/${ra}`).set("Authorization", quem.auth).send(corpo);
const contar = async (sql: string) => Number((await pool.query(sql)).rows[0].n);
const inscrever = (ra: string) =>
  pool.query("INSERT INTO inscricoes_push (endpoint, usuario_ra, p256dh, auth) VALUES ($1, $2, 'k', 'a')", [`https://push.exemplo.com/${ra}`, ra]);
const enviados = () => enviar.mock.calls.map(([sub, carga]) => ({ para: sub.endpoint, ...JSON.parse(carga) }));

describe("excluir a própria conta: validações", () => {
  it("exige a senha (400) e confere (401)", async () => {
    expect((await excluir(ana, "100", {})).status).toBe(400);
    expect((await excluir(ana, "100", { senha: "errada" })).status).toBe(401);
    expect(await contar("SELECT count(*) AS n FROM usuarios WHERE ra = '100'")).toBe(1);
  });

  it("só a própria pessoa (403) e nunca um administrador (400)", async () => {
    expect((await excluir(bia, "100", { senha: SENHA })).status).toBe(403);
    expect((await excluir(admin, "1", { senha: SENHA })).status).toBe(400);
  });
});

describe("excluir a própria conta: o que acontece", () => {
  it("apaga a conta e os dados ligados; o login e o token deixam de valer", async () => {
    const { rows: [s] } = await pool.query(
      "INSERT INTO solicitacoes (passageiro_ra, motorista_ra, status) VALUES ('100', '200', 'aceita') RETURNING id",
    );
    await pool.query("INSERT INTO avaliacoes (solicitacao_id, avaliador_ra, avaliado_ra, nota) VALUES ($1, '200', '100', 5)", [s.id]);
    await inscrever("100");

    expect((await excluir(ana, "100", { senha: SENHA })).status).toBe(204);

    for (const tabela of ["trajetos WHERE usuario_ra", "solicitacoes WHERE passageiro_ra", "avaliacoes WHERE avaliado_ra", "inscricoes_push WHERE usuario_ra"]) {
      expect(await contar(`SELECT count(*) AS n FROM ${tabela} = '100'`)).toBe(0);
    }
    expect((await request(app).post("/auth/login").send({ ra: "100", senha: SENHA })).status).toBe(401);
    expect((await request(app).get("/auth/eu").set("Authorization", ana.auth)).status).toBe(401);
  });

  it("denúncias feitas pela pessoa ficam anônimas; as recebidas somem", async () => {
    await pool.query("INSERT INTO denuncias (denunciante_ra, denunciado_ra, motivo) VALUES ('100', '200', 'comportamento'), ('300', '100', 'outro')");
    await excluir(ana, "100", { senha: SENHA });

    const { rows } = await pool.query("SELECT denunciante_ra, denunciado_ra FROM denuncias");
    expect(rows).toEqual([{ denunciante_ra: null, denunciado_ra: "200" }]);

    const lista = (await request(app).get("/admin/denuncias").set("Authorization", admin.auth)).body;
    expect(lista).toEqual([expect.objectContaining({ denuncianteRa: null, denuncianteNome: null, denunciadoRa: "200" })]);
  });

  it("avisa quem tinha pedido pendente ou carona aceita com a pessoa (recusados não)", async () => {
    // Ana passageira com carona aceita com o motorista; Bia pediu carona a Ana (pendente); Caio foi recusado.
    await pool.query(`INSERT INTO solicitacoes (passageiro_ra, motorista_ra, status) VALUES
      ('100', '200', 'aceita'), ('300', '100', 'pendente'), ('400', '100', 'recusada')`);
    for (const ra of ["200", "300", "400"]) await inscrever(ra);

    await excluir(ana, "100", { senha: SENHA });
    await vi.waitFor(() => expect(enviar).toHaveBeenCalledTimes(2));
    await new Promise((r) => setTimeout(r, 100));
    expect(enviar).toHaveBeenCalledTimes(2);

    const avisos = enviados();
    expect(avisos).toEqual(expect.arrayContaining([
      expect.objectContaining({ para: "https://push.exemplo.com/200", titulo: "Pedido cancelado", url: "/perfil" }),
      expect.objectContaining({ para: "https://push.exemplo.com/300", titulo: "Carona cancelada", url: "/caronas" }),
    ]));
    expect(avisos[0].corpo).toContain("Usuario saiu do CaronaCampus");
  });
});

// Por último no arquivo: as tentativas com a senha errada contam para o limite do login.
describe("limite de tentativas", () => {
  it("senha errada repetida recebe 429", async () => {
    let ultima = 0;
    for (let i = 0; i < 11; i++) ultima = (await excluir(caio, "400", { senha: "errada" })).status;
    expect(ultima).toBe(429);
  });
});
