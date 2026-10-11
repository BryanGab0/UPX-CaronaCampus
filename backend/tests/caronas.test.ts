import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { pool } from "../src/db.js";
import { PASSO_KM } from "../src/match.js";
import { horariosDasColunas } from "../src/horarios.js";
import { limparBanco, criarUsuario } from "./utils.js";

afterAll(() => pool.end());

type Usuario = Awaited<ReturnType<typeof criarUsuario>>;
let aluna: Usuario, perto: Usuario, longe: Usuario;

// Casa do motorista "perto": coordenada com muitas casas decimais, rua e CEP no endereço.
const CASA = { lat: -23.501234, lng: -47.456789 };
const ENDERECO_COMPLETO = "Rua das Flores, 123, Jardim Secreto, Sorocaba, 18000-000";

// Seg, qua e sex, ida no horário dado e volta às 18:00.
const semana = (ida: string) => horariosDasColunas(["seg", "qua", "sex"], ida, "18:00");

const trajeto = (extra: Record<string, unknown>) => ({
  papel: "motorista", endereco: ENDERECO_COMPLETO, origem: CASA,
  horarios: semana("08:00"),
  carro: { modelo: "Gol", lugares: 3, consumo: 11 }, bairro: "Jardim Secreto", cidade: "Sorocaba",
  ...extra,
});
const salvar = (u: Usuario, t: Record<string, unknown>) =>
  request(app).put(`/usuarios/${u.ra}/trajeto`).set("Authorization", u.auth).send(t);
const caronas = async (u: Usuario) => (await request(app).get("/caronas").set("Authorization", u.auth)).body;

beforeEach(async () => {
  await limparBanco();
  aluna = await criarUsuario("100");
  perto = await criarUsuario("200");
  longe = await criarUsuario("300");
  await salvar(perto, trajeto({}));
  await salvar(longe, trajeto({ origem: { lat: -23.60, lng: -47.35 }, horarios: semana("10:00"), bairro: null, cidade: null }));
});

describe("GET /caronas: privacidade", () => {
  it("não envia a coordenada exata nem a rua/CEP do motorista", async () => {
    await salvar(aluna, trajeto({ papel: "passageiro", origem: { lat: -23.49, lng: -47.44 }, bairro: "Centro" }));
    const lista = await caronas(aluna);
    const texto = JSON.stringify(lista);

    expect(texto).not.toContain("Rua das Flores");
    expect(texto).not.toContain("18000-000");
    expect(texto).not.toContain(String(CASA.lat));
    expect(texto).not.toContain(String(CASA.lng));

    const c = lista.find((x: { id: string }) => x.id === "200");
    expect(c.endereco).toBe("Jardim Secreto, Sorocaba");
    expect(c.origem).toEqual({ lat: -23.505, lng: -47.455 }); // centro da célula de ~1 km
  });

  it("sem bairro salvo, mostra só a cidade", async () => {
    const c = (await caronas(aluna)).find((x: { id: string }) => x.id === "300");
    expect(c.endereco).toBe("Sorocaba");
  });

  it("distâncias saem arredondadas em passos de 0,5 km", async () => {
    await salvar(aluna, trajeto({ papel: "passageiro", origem: { lat: -23.4876, lng: -47.4412 } }));
    for (const c of await caronas(aluna)) {
      expect(Math.abs(c.desvioKm / PASSO_KM - Math.round(c.desvioKm / PASSO_KM))).toBeLessThan(1e-9);
    }
  });
});

describe("GET /caronas: compatibilidade calculada na API", () => {
  it("ranqueia pelo trajeto salvo de quem pede e envia o detalhamento e os pesos", async () => {
    await salvar(aluna, trajeto({ papel: "passageiro", origem: { lat: -23.50, lng: -47.455 } }));
    const lista = await caronas(aluna);
    expect(lista.map((c: { id: string }) => c.id)).toEqual(["200", "300"]);
    expect(lista[0].compat).toBeGreaterThan(lista[1].compat);
    expect(lista[0]).toMatchObject({ totalTrechos: 6, pesos: { horario: 0.55, rota: 0.45 } });
    expect(lista[0].trechosComuns).toHaveLength(6);
    expect(lista[0].trechosComuns[0]).toEqual({ dia: "seg", sentido: "ida", difMin: 0 });
    expect(lista[0].custoTrecho).toBeGreaterThan(0);
    expect(lista[0].litrosTrecho).toBeGreaterThan(0);
  });

  it("sem trajeto de quem pede, a lista vem sem nota", async () => {
    const lista = await caronas(aluna);
    expect(lista).toHaveLength(2);
    expect(lista.every((c: { compat: unknown }) => c.compat === null)).toBe(true);
  });
});

describe("trajeto: bairro e cidade", () => {
  it("o dono do trajeto vê o endereço completo e o bairro salvos", async () => {
    const res = await request(app).get("/usuarios/200/trajeto").set("Authorization", perto.auth);
    expect(res.body).toMatchObject({ endereco: ENDERECO_COMPLETO, bairro: "Jardim Secreto", cidade: "Sorocaba", origem: CASA });
  });

  it("bairro e cidade são opcionais e limitados a texto curto", async () => {
    await salvar(perto, trajeto({ bairro: "  " + "x".repeat(200), cidade: 42 }));
    const res = await request(app).get("/usuarios/200/trajeto").set("Authorization", perto.auth);
    expect(res.body.bairro).toHaveLength(80);
    expect(res.body.cidade).toBeNull();
  });
});

describe("trajeto: horários por dia, com ida e volta", () => {
  const lerTrajeto = async (u: Usuario) =>
    (await request(app).get(`/usuarios/${u.ra}/trajeto`).set("Authorization", u.auth)).body;

  it("salva dias diferentes, só ida ou só volta", async () => {
    const horarios = { seg: { ida: "08:00", volta: null }, qua: { ida: null, volta: "17:30" }, sex: { ida: "10:00", volta: "18:00" } };
    expect((await salvar(perto, trajeto({ horarios }))).status).toBe(200);
    expect((await lerTrajeto(perto)).horarios).toEqual(horarios);
  });

  it("recusa dia sem ida nem volta, dia inválido, hora fora do formato ou nenhum dia", async () => {
    for (const horarios of [
      { seg: { ida: null, volta: null } },
      { sab: { ida: "08:00", volta: null } },
      { seg: { ida: "8h", volta: null } },
      { seg: { ida: "25:00", volta: null } },
      {},
      ["seg"],
      undefined,
    ]) {
      const res = await salvar(perto, trajeto({ horarios }));
      expect(res.status).toBe(400);
    }
  });

  it("o passageiro só de volta não pontua com o motorista só de ida", async () => {
    await salvar(perto, trajeto({ horarios: { seg: { ida: "08:00", volta: null } } }));
    await salvar(aluna, trajeto({ papel: "passageiro", horarios: { seg: { ida: null, volta: "08:00" } } }));
    const c = (await caronas(aluna)).find((x: { id: string }) => x.id === "200");
    expect(c).toMatchObject({ trechosComuns: [], totalTrechos: 1, scoreHorario: 0 });
  });
});

// O app aberto antes do deploy (aba ou PWA) ainda manda e lê o formato antigo.
describe("trajeto: transição do formato antigo", () => {
  it("aceita dias + chegada + saida e devolve também esses campos", async () => {
    const antigo = trajeto({ horarios: undefined, dias: ["ter", "qui"], chegada: "07:30", saida: "17:00" });
    expect((await salvar(perto, antigo)).status).toBe(200);
    const res = await request(app).get("/usuarios/200/trajeto").set("Authorization", perto.auth);
    expect(res.body).toMatchObject({
      horarios: { ter: { ida: "07:30", volta: "17:00" }, qui: { ida: "07:30", volta: "17:00" } },
      dias: ["ter", "qui"], chegada: "07:30", saida: "17:00",
    });
  });

  it("GET /caronas mantém os campos que o app antigo lê", async () => {
    await salvar(aluna, trajeto({ papel: "passageiro", origem: { lat: -23.50, lng: -47.455 } }));
    const c = (await caronas(aluna)).find((x: { id: string }) => x.id === "200");
    expect(c).toMatchObject({ dias: ["seg", "qua", "sex"], chegada: "08:00", diasComuns: ["seg", "qua", "sex"], difChegadaMin: 0 });
    expect(c.custoDia).toBeCloseTo(c.custoTrecho * 2, 10);
    expect(c.litrosDia).toBeCloseTo(c.litrosTrecho * 2, 10);
  });
});
