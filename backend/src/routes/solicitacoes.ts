import { Router } from "express";
import { pool } from "../db.js";
 
export const solicitacoesRouter = Router();
 
// POST /usuarios/:ra/solicitacoes — solicita uma carona. Idempotente:
// pedir a mesma carona de novo devolve o pedido existente (não duplica).
solicitacoesRouter.post("/usuarios/:ra/solicitacoes", async (req, res) => {
  const { caronaId } = req.body ?? {};
  if (!caronaId) {
    res.status(400).json({ erro: "caronaId é obrigatório" });
    return;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO solicitacoes (usuario_ra, carona_id) VALUES ($1, $2)
       ON CONFLICT (usuario_ra, carona_id) DO UPDATE SET status = solicitacoes.status
       RETURNING id, usuario_ra, carona_id, status, criado_em`,
      [req.params.ra, caronaId],
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    // erro de chave estrangeira (usuário/carona inexistente) cai aqui
    console.error(e);
    res.status(500).json({ erro: "falha ao solicitar carona" });
  }
});
 
// GET /usuarios/:ra/solicitacoes — lista os pedidos do usuário (com dados da carona).
solicitacoesRouter.get("/usuarios/:ra/solicitacoes", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.carona_id, s.status, s.criado_em, c.nome, c.bairro
       FROM solicitacoes s
       JOIN caronas c ON c.id = s.carona_id
       WHERE s.usuario_ra = $1
       ORDER BY s.criado_em DESC`,
      [req.params.ra],
    );
    res.json(rows.map((r) => ({ caronaId: r.carona_id, status: r.status, nome: r.nome, bairro: r.bairro })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao listar solicitações" });
  }
});
