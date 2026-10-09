import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { JWT_SECRET as SEGREDO } from "../config.js";
 
export interface ReqAuth extends Request {
  usuarioRa?: string;
}
 
// Resposta para conta bloqueada; o campo "bloqueado" avisa o front para encerrar a sessão.
export const RESPOSTA_BLOQUEADO = { erro: "Sua conta foi bloqueada pela administração.", bloqueado: true };

// Valida o token JWT do cabeçalho "Authorization: Bearer <token>" e confere no banco
// se a conta ainda existe e não foi bloqueada (o token sozinho vale por 7 dias).
export async function autenticar(req: ReqAuth, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    res.status(401).json({ erro: "token ausente" });
    return;
  }
  let ra: string;
  try {
    ra = (jwt.verify(token, SEGREDO) as { ra: string }).ra;
  } catch {
    res.status(401).json({ erro: "token inválido" });
    return;
  }
  try {
    const { rows } = await pool.query("SELECT bloqueado FROM usuarios WHERE ra = $1", [ra]);
    if (!rows[0]) {
      res.status(401).json({ erro: "usuário não encontrado" });
      return;
    }
    if (rows[0].bloqueado) {
      res.status(403).json(RESPOSTA_BLOQUEADO);
      return;
    }
    req.usuarioRa = ra;
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha na autenticação" });
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
