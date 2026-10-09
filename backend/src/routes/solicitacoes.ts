import { Router } from "express";
import { pool } from "../db.js";
import { autenticar, mesmoUsuario } from "../middleware/autenticar.js";
import type { ReqAuth } from "../middleware/autenticar.js";

export const solicitacoesRouter = Router();

// POST — passageiro solicita carona a um motorista.
solicitacoesRouter.post("/usuarios/:ra/solicitacoes", autenticar, mesmoUsuario, async (req, res) => {
  const { motoristaRa } = req.body ?? {};
  if (!motoristaRa) {
    res.status(400).json({ erro: "motoristaRa é obrigatório" });
    return;
  }
  if (String(motoristaRa) === req.params.ra) {
    res.status(400).json({ erro: "não é possível pedir carona para si mesmo" });
    return;
  }
  try {
    // O destinatário precisa existir e oferecer carona (trajeto como motorista).
    const alvo = await pool.query(
      `SELECT t.papel FROM usuarios u LEFT JOIN trajetos t ON t.usuario_ra = u.ra WHERE u.ra = $1`,
      [motoristaRa],
    );
    if (alvo.rows.length === 0) {
      res.status(404).json({ erro: "motorista não encontrado" });
      return;
    }
    if (alvo.rows[0].papel !== "motorista") {
      res.status(400).json({ erro: "este usuário não oferece carona" });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO solicitacoes (passageiro_ra, motorista_ra) VALUES ($1, $2)
       ON CONFLICT (passageiro_ra, motorista_ra) DO UPDATE SET status = solicitacoes.status
       RETURNING id, passageiro_ra, motorista_ra, status, criado_em`,
      [req.params.ra, motoristaRa],
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao solicitar carona" });
  }
});

// GET — solicitações do PASSAGEIRO. Telefone do motorista só quando aceita.
solicitacoesRouter.get("/usuarios/:ra/solicitacoes", autenticar, mesmoUsuario, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.motorista_ra, s.status, s.criado_em, m.nome AS motorista_nome,
              t.endereco AS motorista_endereco,
              CASE WHEN s.status = 'aceita' THEN m.telefone ELSE NULL END AS motorista_telefone
       FROM solicitacoes s
       JOIN usuarios m ON m.ra = s.motorista_ra
       LEFT JOIN trajetos t ON t.usuario_ra = s.motorista_ra
       WHERE s.passageiro_ra = $1
       ORDER BY s.criado_em DESC`,
      [req.params.ra],
    );
    res.json(rows.map((r) => ({
      motoristaRa: r.motorista_ra, status: r.status, motoristaNome: r.motorista_nome,
      endereco: r.motorista_endereco, motoristaTelefone: r.motorista_telefone,
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao listar solicitações" });
  }
});

// GET — pedidos RECEBIDOS pelo motorista. Telefone do passageiro só quando aceita.
solicitacoesRouter.get("/usuarios/:ra/pedidos", autenticar, mesmoUsuario, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.status, s.criado_em, p.nome AS passageiro_nome,
              CASE WHEN s.status = 'aceita' THEN p.telefone ELSE NULL END AS passageiro_telefone
       FROM solicitacoes s
       JOIN usuarios p ON p.ra = s.passageiro_ra
       WHERE s.motorista_ra = $1
       ORDER BY s.criado_em DESC`,
      [req.params.ra],
    );
    res.json(rows.map((r) => ({
      id: r.id, status: r.status, passageiroNome: r.passageiro_nome,
      passageiroTelefone: r.passageiro_telefone,
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao listar pedidos" });
  }
});

// PATCH — motorista aceita ou recusa (só o motorista dono do pedido).
solicitacoesRouter.patch("/solicitacoes/:id", autenticar, async (req: ReqAuth, res) => {
  const { status } = req.body ?? {};
  if (status !== "aceita" && status !== "recusada") {
    res.status(400).json({ erro: "status deve ser 'aceita' ou 'recusada'" });
    return;
  }
  try {
    const dono = await pool.query("SELECT motorista_ra FROM solicitacoes WHERE id = $1", [req.params.id]);
    if (dono.rows.length === 0) {
      res.status(404).json({ erro: "solicitação não encontrada" });
      return;
    }
    if (dono.rows[0].motorista_ra !== req.usuarioRa) {
      res.status(403).json({ erro: "acesso negado" });
      return;
    }
    const { rows } = await pool.query(
      "UPDATE solicitacoes SET status = $1 WHERE id = $2 RETURNING id, status",
      [status, req.params.id],
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao atualizar solicitação" });
  }
});
