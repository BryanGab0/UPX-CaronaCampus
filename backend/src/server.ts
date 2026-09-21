import express from "express";
import cors from "cors";
import "dotenv/config";
import { pool } from "./db.js";

const app = express();
app.use(cors());          // libera o front (localhost:5173) a chamar a API
app.use(express.json());

// Formato de linha do banco (nomes das colunas).
interface CaronaRow {
  id: string;
  nome: string;
  bairro: string;
  origem_lat: number;
  origem_lng: number;
  carro: string;
  chegada: string;
  dias: string[];
  ponto_nome: string;
  ponto_lat: number;
  ponto_lng: number;
  ponto_caminhada: string;
  custo_dia: string; // NUMERIC volta como string no pg
}

// Converte a linha do banco no formato que o front espera (tipo Carona).
function mapCarona(r: CaronaRow) {
  return {
    id: r.id,
    nome: r.nome,
    bairro: r.bairro,
    origem: { lat: r.origem_lat, lng: r.origem_lng },
    carro: r.carro,
    chegada: r.chegada,
    dias: r.dias,
    ponto: { nome: r.ponto_nome, lat: r.ponto_lat, lng: r.ponto_lng, caminhada: r.ponto_caminhada },
    custoDia: Number(r.custo_dia).toFixed(2).replace(".", ","),
  };
}

// Saúde da API + do banco.
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "ok" });
  } catch {
    res.status(500).json({ status: "erro", db: "off" });
  }
});

// Lista todas as caronas do banco.
app.get("/caronas", async (_req, res) => {
  try {
    const { rows } = await pool.query<CaronaRow>("SELECT * FROM caronas ORDER BY nome");
    res.json(rows.map(mapCarona));
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao buscar caronas" });
  }
});

const PORT = Number(process.env.PORT) || 3333;
app.listen(PORT, () => console.log(`API em http://localhost:${PORT}`));
