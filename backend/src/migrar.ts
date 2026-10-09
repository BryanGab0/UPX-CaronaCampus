// Comando "npm run migrar": aplica as migrações pendentes no banco do DATABASE_URL.
import pg from "pg";
import "dotenv/config";
import { configConexao } from "./db.js";
import { aplicarMigracoes } from "./migracoes.js";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Variável de ambiente DATABASE_URL não definida (ver .env.example).");
  process.exit(1);
}

const banco = new pg.Client(configConexao(url));
try {
  await banco.connect();
  const aplicadas = await aplicarMigracoes(banco);
  console.log(aplicadas.length
    ? `Migrações aplicadas: ${aplicadas.join(", ")}`
    : "Banco já está atualizado (nenhuma migração pendente).");
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await banco.end();
}
