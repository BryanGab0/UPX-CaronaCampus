import express from "express";
import cors from "cors";
import "dotenv/config";
import { pool } from "./db.js";
import { caronasRouter } from "./routes/caronas.js";
import { usuariosRouter } from "./routes/usuarios.js";
 
const app = express();
app.use(cors());          // libera o front (localhost:5173) a chamar a API
app.use(express.json());  // interpreta o corpo JSON das requisições
 
// Saúde da API + do banco.
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "ok" });
  } catch {
    res.status(500).json({ status: "erro", db: "off" });
  }
});
 
// Rotas por recurso.
app.use(caronasRouter);
app.use(usuariosRouter);
 
const PORT = Number(process.env.PORT) || 3333;
app.listen(PORT, () => console.log(`API em http://localhost:${PORT}`));
