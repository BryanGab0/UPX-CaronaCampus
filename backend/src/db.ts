import { Pool } from "pg";
import "dotenv/config";

// Pool de conexões: reaproveita conexões em vez de abrir uma por requisição.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
