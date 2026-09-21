import { Router } from "express";
import { pool } from "../db.js";
 
export const caronasRouter = Router();
 
interface CaronaRow {
  id: string; nome: string; bairro: string;
  origem_lat: number; origem_lng: number;
  carro: string; chegada: string; dias: string[];
  ponto_nome: string; ponto_lat: number; ponto_lng: number; ponto_caminhada: string;
  custo_dia: string;
}
 
// Converte a linha do banco no formato que o front espera (tipo Carona).
function mapCarona(r: CaronaRow) {
  return {
    id: r.id, nome: r.nome, bairro: r.bairro,
    origem: { lat: r.origem_lat, lng: r.origem_lng },
    carro: r.carro, chegada: r.chegada, dias: r.dias,
    ponto: { nome: r.ponto_nome, lat: r.ponto_lat, lng: r.ponto_lng, caminhada: r.ponto_caminhada },
    custoDia: Number(r.custo_dia).toFixed(2).replace(".", ","),
  };
}
 
caronasRouter.get("/caronas", async (_req, res) => {
  try {
    const { rows } = await pool.query<CaronaRow>("SELECT * FROM caronas ORDER BY nome");
    res.json(rows.map(mapCarona));
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao buscar caronas" });
  }
});
