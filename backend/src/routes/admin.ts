import { Router } from "express";
import { pool } from "../db.js";
import { autenticar, souAdmin } from "../middleware/autenticar.js";
 
export const adminRouter = Router();
 
// Todas as rotas de admin exigem: token válido E ser administrador.
adminRouter.use(autenticar, souAdmin);
 
// GET /admin/estatisticas — contagens gerais.
adminRouter.get("/estatisticas", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT count(*) FROM usuarios)     AS usuarios,
        (SELECT count(*) FROM caronas)      AS caronas,
        (SELECT count(*) FROM trajetos)     AS trajetos,
        (SELECT count(*) FROM solicitacoes) AS solicitacoes
    `);
    const r = rows[0];
    res.json({
      usuarios: Number(r.usuarios),
      caronas: Number(r.caronas),
      trajetos: Number(r.trajetos),
      solicitacoes: Number(r.solicitacoes),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao buscar estatísticas" });
  }
});
 
// GET /admin/usuarios — lista todos os usuários.
adminRouter.get("/usuarios", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT ra, nome, email, admin, criado_em FROM usuarios ORDER BY criado_em DESC",
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao listar usuários" });
  }
});
 
// GET /admin/solicitacoes — todas as solicitações (com usuário e carona).
adminRouter.get("/solicitacoes", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.status, s.criado_em,
             u.ra AS usuario_ra, u.nome AS usuario_nome,
             c.nome AS carona_nome, c.bairro AS carona_bairro
      FROM solicitacoes s
      JOIN usuarios u ON u.ra = s.usuario_ra
      JOIN caronas  c ON c.id = s.carona_id
      ORDER BY s.criado_em DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao listar solicitações" });
  }
});
