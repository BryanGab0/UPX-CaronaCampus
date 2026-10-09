import { Router } from "express";
import { pool } from "../db.js";
import { autenticar, mesmoUsuario } from "../middleware/autenticar.js";

export const denunciasRouter = Router();

const MOTIVOS = ["comportamento", "seguranca", "perfil_falso", "nao_compareceu", "outro"];
const DESCRICAO_MAX = 500;

// POST — o usuário denuncia outro (motorista de uma carona ou passageiro de um pedido).
denunciasRouter.post("/usuarios/:ra/denuncias", autenticar, mesmoUsuario, async (req, res) => {
  const { denunciadoRa, motivo, descricao = "" } = req.body ?? {};
  if (!denunciadoRa || !MOTIVOS.includes(motivo)) {
    res.status(400).json({ erro: "Escolha o motivo da denúncia." });
    return;
  }
  if (typeof descricao !== "string" || descricao.length > DESCRICAO_MAX) {
    res.status(400).json({ erro: `A descrição pode ter até ${DESCRICAO_MAX} caracteres.` });
    return;
  }
  if (String(denunciadoRa) === req.params.ra) {
    res.status(400).json({ erro: "Não é possível denunciar a si mesmo." });
    return;
  }
  try {
    const alvo = await pool.query("SELECT 1 FROM usuarios WHERE ra = $1", [denunciadoRa]);
    if (alvo.rows.length === 0) {
      res.status(404).json({ erro: "Usuário não encontrado." });
      return;
    }
    const { rows } = await pool.query(
      `INSERT INTO denuncias (denunciante_ra, denunciado_ra, motivo, descricao) VALUES ($1, $2, $3, $4)
       ON CONFLICT (denunciante_ra, denunciado_ra) WHERE status = 'aberta' DO NOTHING
       RETURNING id, status`,
      [req.params.ra, denunciadoRa, motivo, descricao.trim()],
    );
    if (rows.length === 0) {
      res.status(409).json({ erro: "Você já tem uma denúncia em análise sobre esta pessoa." });
      return;
    }
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao registrar a denúncia" });
  }
});
