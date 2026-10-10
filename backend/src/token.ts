import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { JWT_SECRET as SEGREDO } from "./config.js";

const OPCOES: SignOptions = { expiresIn: "7d" };

// Gera um token JWT que carrega o RA do usuário e expira em 7 dias.
export function gerarToken(ra: string) {
  return jwt.sign({ ra }, SEGREDO, OPCOES);
}

// O token foi emitido antes da última troca de senha? (iat vem em segundos.) Um token novo,
// emitido logo depois da troca, cai no mesmo segundo ou depois e continua valendo.
export function emitidoAntesDaTroca(iat: number | undefined, senhaAlteradaEm: Date | null): boolean {
  if (!senhaAlteradaEm || iat === undefined) return false;
  return iat < Math.floor(senhaAlteradaEm.getTime() / 1000);
}
