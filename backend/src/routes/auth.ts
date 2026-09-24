import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { pool } from "../db.js";
import { autenticar } from "../middleware/autenticar.js";
import type { ReqAuth } from "../middleware/autenticar.js";
 
const SEGREDO = process.env.JWT_SECRET ?? "dev-secret";
const OPCOES: SignOptions = { expiresIn: "7d" };
 
export const authRouter = Router();
 
// Gera um token JWT que carrega o RA do usuário e expira em 7 dias.
function gerarToken(ra: string) {
  return jwt.sign({ ra }, SEGREDO, OPCOES);
}
 
// POST /auth/registrar — cria a conta guardando o HASH da senha.
authRouter.post("/auth/registrar", async (req, res) => {
  const { ra, nome, email, senha } = req.body ?? {};
  if (!ra || !nome || !email || !senha) {
    res.status(400).json({ erro: "campos obrigatórios: ra, nome, email, senha" });
    return;
  }
  if (String(senha).length < 6) {
    res.status(400).json({ erro: "a senha deve ter ao menos 6 caracteres" });
    return;
  }
  try {
    // bcrypt transforma a senha num hash irreversível (com "sal" embutido).
    const hash = await bcrypt.hash(String(senha), 10);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (ra, nome, email, senha_hash) VALUES ($1, $2, $3, $4)
       ON CONFLICT (ra) DO NOTHING
       RETURNING ra, nome, email, admin`,
      [ra, nome, email, hash],
    );
    if (rows.length === 0) {
      res.status(409).json({ erro: "RA já cadastrado" });
      return;
    }
    res.status(201).json({ token: gerarToken(ra), usuario: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao registrar" });
  }
});
 
// POST /auth/login — confere a senha contra o hash e devolve o token.
authRouter.post("/auth/login", async (req, res) => {
  const { ra, senha } = req.body ?? {};
  if (!ra || !senha) {
    res.status(400).json({ erro: "ra e senha são obrigatórios" });
    return;
  }
  try {
    const { rows } = await pool.query(
      "SELECT ra, nome, email, senha_hash, admin FROM usuarios WHERE ra = $1",
      [ra],
    );
    const u = rows[0];
    // bcrypt.compare confere a senha digitada contra o hash guardado.
    if (!u || !u.senha_hash || !(await bcrypt.compare(String(senha), u.senha_hash))) {
      res.status(401).json({ erro: "RA ou senha inválidos" });
      return;
    }
    res.json({ token: gerarToken(ra), usuario: { ra: u.ra, nome: u.nome, email: u.email, admin: u.admin } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha no login" });
  }
});
 
// GET /auth/eu — rota PROTEGIDA: devolve o usuário do token (prova o middleware).
authRouter.get("/auth/eu", autenticar, async (req: ReqAuth, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT ra, nome, email FROM usuarios WHERE ra = $1",
      [req.usuarioRa],
    );
    if (!rows[0]) {
      res.status(404).json({ erro: "usuário não encontrado" });
      return;
    }
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha" });
  }
});
