import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
 
const SEGREDO = process.env.JWT_SECRET ?? "dev-secret";
 
// Request com o RA do usuário autenticado (preenchido pelo middleware).
export interface ReqAuth extends Request {
  usuarioRa?: string;
}
 
// Lê o token do cabeçalho "Authorization: Bearer <token>", valida e libera a rota.
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
