import { Pool } from "pg";
import "dotenv/config";

// Configuração de conexão: SSL só fora da máquina local (o Neon exige SSL).
export function configConexao(url: string) {
  const local = url.includes("localhost") || url.includes("127.0.0.1");
  return { connectionString: url, ssl: local ? false : { rejectUnauthorized: false } };
}

export const pool = new Pool(configConexao(process.env.DATABASE_URL ?? ""));
