import { Router } from "express";
import { pool } from "../db.js";
import { autenticar, souAdmin } from "../middleware/autenticar.js";

export const adminRouter = Router();
adminRouter.use(autenticar, souAdmin);

adminRouter.get("/estatisticas", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT count(*) FROM usuarios) AS usuarios,
        (SELECT count(*) FROM trajetos WHERE papel = 'motorista') AS motoristas,
        (SELECT count(*) FROM trajetos) AS trajetos,
        (SELECT count(*) FROM solicitacoes) AS solicitacoes
    `);
    const r = rows[0];
    res.json({
      usuarios: Number(r.usuarios), motoristas: Number(r.motoristas),
      trajetos: Number(r.trajetos), solicitacoes: Number(r.solicitacoes),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao buscar estatísticas" });
  }
});

adminRouter.get("/usuarios", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT ra, nome, email, telefone, admin, criado_em FROM usuarios ORDER BY criado_em DESC",
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao listar usuários" });
  }
});

adminRouter.get("/solicitacoes", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.status, s.criado_em,
             p.nome AS passageiro_nome, m.nome AS motorista_nome
      FROM solicitacoes s
      JOIN usuarios p ON p.ra = s.passageiro_ra
      JOIN usuarios m ON m.ra = s.motorista_ra
      ORDER BY s.criado_em DESC
    `);
    res.json(rows.map((r) => ({
      id: r.id, status: r.status,
      passageiroNome: r.passageiro_nome, motoristaNome: r.motorista_nome,
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao listar solicitações" });
  }
});
