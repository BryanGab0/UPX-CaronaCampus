import { describe, it, expect, afterAll, afterEach, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { pool } from "../src/db.js";

afterEach(() => vi.restoreAllMocks());
afterAll(() => pool.end());

describe("verificações de saúde", () => {
  it("/ping responde sem consultar o banco", async () => {
    const consulta = vi.spyOn(pool, "query");
    const res = await request(app).get("/ping");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
    expect(consulta).not.toHaveBeenCalled();
  });

  it("/health confere o banco", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", db: "ok" });
  });

  it("/health responde 500 se o banco cair (o monitor acusa a queda)", async () => {
    vi.spyOn(pool, "query").mockRejectedValueOnce(new Error("banco fora do ar") as never);
    const res = await request(app).get("/health");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ status: "erro", db: "off" });
  });
});
