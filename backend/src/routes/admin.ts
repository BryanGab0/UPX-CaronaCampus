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
      "SELECT ra, nome, email, telefone, admin, bloqueado, criado_em FROM usuarios ORDER BY criado_em DESC",
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao listar usuários" });
  }
});

// PATCH — bloqueia ou desbloqueia um usuário (moderação). Administradores não podem ser bloqueados.
adminRouter.patch("/usuarios/:ra/bloqueio", async (req, res) => {
  const { bloqueado } = req.body ?? {};
  if (typeof bloqueado !== "boolean") {
    res.status(400).json({ erro: "informe bloqueado: true ou false" });
    return;
  }
  try {
    const alvo = await pool.query("SELECT admin FROM usuarios WHERE ra = $1", [req.params.ra]);
    if (alvo.rows.length === 0) {
      res.status(404).json({ erro: "usuário não encontrado" });
      return;
    }
    if (alvo.rows[0].admin) {
      res.status(400).json({ erro: "não é possível bloquear um administrador" });
      return;
    }
    const { rows } = await pool.query(
      "UPDATE usuarios SET bloqueado = $1 WHERE ra = $2 RETURNING ra, bloqueado",
      [bloqueado, req.params.ra],
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao atualizar o bloqueio" });
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
