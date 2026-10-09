import { Router } from "express";
import { pool } from "../db.js";
import { autenticar } from "../middleware/autenticar.js";
import type { ReqAuth } from "../middleware/autenticar.js";

export const avaliacoesRouter = Router();

// Subconsulta reutilizável: média (1 casa) e total de avaliações recebidas por pessoa.
export const SQL_MEDIAS = `
  SELECT avaliado_ra, ROUND(AVG(nota)::numeric, 1)::float AS media, COUNT(*)::int AS total
  FROM avaliacoes GROUP BY avaliado_ra`;

// POST — passageiro avalia o motorista, ou motorista avalia o passageiro, de um pedido ACEITO.
// Enviar de novo troca a nota (uma avaliação por lado em cada pedido).
avaliacoesRouter.post("/solicitacoes/:id/avaliacao", autenticar, async (req: ReqAuth, res) => {
  const nota = Number(req.body?.nota);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    res.status(400).json({ erro: "A nota deve ser de 1 a 5 estrelas." });
    return;
  }
  try {
    const s = await pool.query("SELECT passageiro_ra, motorista_ra, status FROM solicitacoes WHERE id = $1", [req.params.id]);
    const pedido = s.rows[0];
    if (!pedido) {
      res.status(404).json({ erro: "Pedido não encontrado." });
      return;
    }
    const souPassageiro = pedido.passageiro_ra === req.usuarioRa;
    if (!souPassageiro && pedido.motorista_ra !== req.usuarioRa) {
      res.status(403).json({ erro: "acesso negado" });
      return;
    }
    if (pedido.status !== "aceita") {
      res.status(400).json({ erro: "Só dá para avaliar depois que o pedido é aceito." });
      return;
    }
    const avaliado = souPassageiro ? pedido.motorista_ra : pedido.passageiro_ra;
    const { rows } = await pool.query(
      `INSERT INTO avaliacoes (solicitacao_id, avaliador_ra, avaliado_ra, nota) VALUES ($1, $2, $3, $4)
       ON CONFLICT (solicitacao_id, avaliador_ra) DO UPDATE SET nota = EXCLUDED.nota, criado_em = now()
       RETURNING nota`,
      [req.params.id, req.usuarioRa, avaliado, nota],
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao salvar a avaliação" });
  }
});
