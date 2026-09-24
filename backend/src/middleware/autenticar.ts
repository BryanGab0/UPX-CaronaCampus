import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
 
const SEGREDO = process.env.JWT_SECRET ?? "dev-secret";
 
export interface ReqAuth extends Request {
  usuarioRa?: string;
}
 
// Valida o token JWT do cabeçalho "Authorization: Bearer <token>".
export function autenticar(req: ReqAuth, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    res.status(401).json({ erro: "token ausente" });
    return;
  }
  try {
    const payload = jwt.verify(token, SEGREDO) as { ra: string };
    req.usuarioRa = payload.ra;
    next();
  } catch {
    res.status(401).json({ erro: "token inválido" });
  }
}
 
// Garante que o usuário do token é o dono do :ra da URL.
export function mesmoUsuario(req: ReqAuth, res: Response, next: NextFunction) {
  if (req.usuarioRa !== req.params.ra) {
    res.status(403).json({ erro: "acesso negado" });
    return;
  }
  next();
}
 
// Garante que o usuário autenticado é administrador (consulta o banco).
export async function souAdmin(req: ReqAuth, res: Response, next: NextFunction) {
  try {
    const { rows } = await pool.query("SELECT admin FROM usuarios WHERE ra = $1", [req.usuarioRa]);
    if (!rows[0]?.admin) {
      res.status(403).json({ erro: "acesso restrito a administradores" });
      return;
    }
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha na verificação de admin" });
  }
}
