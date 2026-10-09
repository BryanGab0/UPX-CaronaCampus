import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../src/db.js";
import { JWT_SECRET_TESTE } from "./ambiente.js";

export const SENHA = "senha-de-teste";
const hash = bcrypt.hashSync(SENHA, 4); // custo baixo: só para os testes rodarem rápido

// Esvazia as tabelas entre um teste e outro.
export async function limparBanco() {
  await pool.query("TRUNCATE avaliacoes, denuncias, solicitacoes, trajetos, usuarios RESTART IDENTITY CASCADE");
}

// Cria o usuário direto no banco (sem passar pelo /auth/registrar e seu limite)
// e devolve um token válido para ele.
export async function criarUsuario(ra: string, { admin = false, telefone = "15999990000" } = {}) {
  await pool.query(
    "INSERT INTO usuarios (ra, nome, email, senha_hash, telefone, admin) VALUES ($1, $2, $3, $4, $5, $6)",
    [ra, `Usuario ${ra}`, `${ra}@facens.br`, hash, telefone, admin],
  );
  const token = jwt.sign({ ra }, JWT_SECRET_TESTE);
  return { ra, telefone, auth: `Bearer ${token}` };
}

export async function criarTrajeto(ra: string, papel: "motorista" | "passageiro") {
  await pool.query(
    `INSERT INTO trajetos (usuario_ra, papel, endereco, origem_lat, origem_lng, dias, chegada, saida)
     VALUES ($1, $2, 'Rua Teste, Sorocaba', -23.5, -47.45, ARRAY['seg','qua'], '08:00', '18:00')`,
    [ra, papel],
  );
}
