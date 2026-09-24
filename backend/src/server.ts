import express from "express";
import cors from "cors";
import "dotenv/config";
import { pool } from "./db.js";
import { caronasRouter } from "./routes/caronas.js";
import { usuariosRouter } from "./routes/usuarios.js";
import { solicitacoesRouter } from "./routes/solicitacoes.js";
import { authRouter } from "./routes/auth.js";
 
const app = express();
app.use(cors());
app.use(express.json());
 
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "ok" });
  } catch {
    res.status(500).json({ status: "erro", db: "off" });
  }
});
 
app.use(caronasRouter);
app.use(usuariosRouter);
app.use(solicitacoesRouter);
app.use(authRouter);
 
const PORT = Number(process.env.PORT) || 3333;
app.listen(PORT, () => console.log(`API em http://localhost:${PORT}`));
