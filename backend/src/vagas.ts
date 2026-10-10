// Vagas do carro: carro_lugares é o número de vagas para passageiros (sem contar o motorista).
// As vagas livres são sempre calculadas (vagas − pedidos aceitos), nunca guardadas: cancelar ou
// desfazer um aceite libera a vaga sozinho, e não há contador para se desencontrar.
import type { Pool, PoolClient } from "pg";

export const VAGAS_MIN = 1;
export const VAGAS_MAX = 6;

// Subconsulta reutilizável: quantos passageiros cada motorista já aceitou.
export const SQL_OCUPADAS = `
  SELECT motorista_ra, COUNT(*)::int AS ocupadas
  FROM solicitacoes WHERE status = 'aceita' GROUP BY motorista_ra`;

export const LOTADO = "Carro lotado: este motorista não tem vagas no momento.";

// Vagas e ocupação de um motorista (null se ele não tem trajeto). Com `travar`, segura a linha
// do trajeto até o fim da transação: dois aceites ao mesmo tempo não ocupam a mesma última vaga.
export async function vagasDe(banco: Pool | PoolClient, motoristaRa: string, travar = false) {
  const t = await banco.query<{ vagas: number }>(
    `SELECT carro_lugares AS vagas FROM trajetos WHERE usuario_ra = $1${travar ? " FOR UPDATE" : ""}`,
    [motoristaRa],
  );
  if (!t.rows[0]) return null;
  const o = await banco.query<{ ocupadas: number }>(
    "SELECT COUNT(*)::int AS ocupadas FROM solicitacoes WHERE motorista_ra = $1 AND status = 'aceita'",
    [motoristaRa],
  );
  const { vagas } = t.rows[0];
  const { ocupadas } = o.rows[0];
  return { vagas, ocupadas, livres: Math.max(0, vagas - ocupadas) };
}
