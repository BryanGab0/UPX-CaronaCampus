import pg from "pg";
import { aplicarMigracoes } from "../src/migracoes.js";
import { DATABASE_URL_TESTE, nomeDoBancoDeTeste } from "./ambiente.js";

// Roda uma vez antes de todos os testes: cria o banco de teste (se faltar)
// e recria as tabelas do zero aplicando todas as migrações.
export default async function prepararBanco() {
  const nome = nomeDoBancoDeTeste(DATABASE_URL_TESTE);

  // Conecta no banco padrão "postgres" do mesmo servidor só para criar o de teste.
  const urlServidor = new URL(DATABASE_URL_TESTE);
  urlServidor.pathname = "/postgres";
  const servidor = new pg.Client({ connectionString: urlServidor.toString() });
  await servidor.connect();
  const existe = await servidor.query("SELECT 1 FROM pg_database WHERE datname = $1", [nome]);
  if (existe.rowCount === 0) await servidor.query(`CREATE DATABASE "${nome}"`);
  await servidor.end();

  const banco = new pg.Client({ connectionString: DATABASE_URL_TESTE });
  await banco.connect();
  await banco.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await aplicarMigracoes(banco);
  await banco.end();
}
