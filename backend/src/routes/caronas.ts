import { Router } from "express";
import { pool } from "../db.js";
import { autenticar } from "../middleware/autenticar.js";
import type { ReqAuth } from "../middleware/autenticar.js";

export const caronasRouter = Router();

// Caronas = usuários com trajeto papel='motorista' (exceto o próprio usuário e contas bloqueadas).
caronasRouter.get("/caronas", autenticar, async (req: ReqAuth, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.ra, u.nome, t.endereco, t.origem_lat, t.origem_lng,
              t.dias, t.chegada, t.carro_modelo, t.carro_consumo
       FROM trajetos t
       JOIN usuarios u ON u.ra = t.usuario_ra
       WHERE t.papel = 'motorista' AND u.ra <> $1 AND NOT u.bloqueado`,
      [req.usuarioRa],
    );
    res.json(rows.map((r) => ({
      id: r.ra,
      nome: r.nome,
      endereco: r.endereco,
      origem: { lat: r.origem_lat, lng: r.origem_lng },
      dias: r.dias,
      chegada: r.chegada,
      carro: r.carro_modelo || "Carro",
      consumo: Number(r.carro_consumo),
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao listar caronas" });
  }
});
