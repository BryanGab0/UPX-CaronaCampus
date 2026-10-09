import { readdirSync, readFileSync } from "node:fs";
import type { Client } from "pg";

// Migrações: arquivos SQL numerados em db/migracoes (001_..., 002_...), aplicados
// em ordem, uma única vez por banco. A tabela "migracoes" guarda quais já rodaram.
// Para mudar o schema, crie um arquivo novo; nunca edite um que já foi aplicado.

const PASTA = new URL("../db/migracoes/", import.meta.url);
const FORMATO = /^\d{3}_[a-z0-9_]+\.sql$/;
const TRAVA = 4242; // número qualquer: impede duas execuções ao mesmo tempo no mesmo banco

export function listarMigracoes(): string[] {
  return readdirSync(PASTA).filter((f) => FORMATO.test(f)).sort();
}

// Aplica as migrações pendentes e devolve os nomes das que rodaram agora.
export async function aplicarMigracoes(banco: Client): Promise<string[]> {
  await banco.query("SELECT pg_advisory_lock($1)", [TRAVA]);
  try {
    await banco.query(`CREATE TABLE IF NOT EXISTS migracoes (
      nome        TEXT PRIMARY KEY,
      aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    const { rows } = await banco.query<{ nome: string }>("SELECT nome FROM migracoes");
    const jaAplicadas = new Set(rows.map((r) => r.nome));

    const aplicadas: string[] = [];
    for (const nome of listarMigracoes()) {
      if (jaAplicadas.has(nome)) continue;
      const sql = readFileSync(new URL(nome, PASTA), "utf8");
      // Cada migração numa transação: se falhar no meio, nada dela fica no banco.
      await banco.query("BEGIN");
      try {
        await banco.query(sql);
        await banco.query("INSERT INTO migracoes (nome) VALUES ($1)", [nome]);
        await banco.query("COMMIT");
      } catch (e) {
        await banco.query("ROLLBACK");
        throw new Error(`Falha na migração ${nome}: ${e instanceof Error ? e.message : e}`, { cause: e });
      }
      aplicadas.push(nome);
    }
    return aplicadas;
  } finally {
    await banco.query("SELECT pg_advisory_unlock($1)", [TRAVA]);
  }
}
