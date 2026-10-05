import { Pool } from "pg";
import "dotenv/config";

const url = process.env.DATABASE_URL ?? "";

const local = url.includes("localhost") || url.includes("127.0.0.1");

export const pool = new Pool({
  connectionString: url,
  ssl: local ? false : { rejectUnauthorized: false },
});
