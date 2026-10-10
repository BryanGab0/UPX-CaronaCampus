import { Router } from "express";
import { pool } from "../db.js";
import { autenticar, mesmoUsuario } from "../middleware/autenticar.js";
import { VAGAS_MAX, VAGAS_MIN, vagasDe } from "../vagas.js";

export const usuariosRouter = Router();

interface TrajetoRow {
  papel: string; endereco: string; origem_lat: number; origem_lng: number;
  dias: string[]; chegada: string; saida: string;
  carro_modelo: string; carro_lugares: number; carro_consumo: string;
}

function mapTrajeto(r: TrajetoRow) {
  return {
    papel: r.papel,
    endereco: r.endereco,
    origem: { lat: r.origem_lat, lng: r.origem_lng },
    dias: r.dias,
    chegada: r.chegada,
    saida: r.saida,
    carro: { modelo: r.carro_modelo, lugares: r.carro_lugares, consumo: Number(r.carro_consumo) },
  };
}

usuariosRouter.get("/usuarios/:ra/trajeto", autenticar, mesmoUsuario, async (req, res) => {
  try {
    const { rows } = await pool.query<TrajetoRow>("SELECT * FROM trajetos WHERE usuario_ra = $1", [req.params.ra]);
    res.json(rows[0] ? mapTrajeto(rows[0]) : null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao buscar trajeto" });
  }
});

usuariosRouter.put("/usuarios/:ra/trajeto", autenticar, mesmoUsuario, async (req, res) => {
  const t = req.body ?? {};
  const o = t.origem ?? {};
  const carro = t.carro ?? {};
  if (!t.papel || !t.endereco || typeof o.lat !== "number" || typeof o.lng !== "number"
      || !Array.isArray(t.dias) || !t.chegada || !t.saida) {
    res.status(400).json({ erro: "trajeto incompleto (papel, endereço, origem, dias, horários)" });
    return;
  }
  const vagas = carro.lugares ?? 4;
  if (t.papel === "motorista" && (!Number.isInteger(vagas) || vagas < VAGAS_MIN || vagas > VAGAS_MAX)) {
    res.status(400).json({ erro: `As vagas devem ser de ${VAGAS_MIN} a ${VAGAS_MAX}.` });
    return;
  }
  // Transação: trava o trajeto enquanto confere os aceitos, para um aceite simultâneo não passar.
  const banco = await pool.connect();
  try {
    await banco.query("BEGIN");
    if (t.papel === "motorista") {
      const atual = await vagasDe(banco, String(req.params.ra), true);
      if (atual && vagas < atual.ocupadas) {
        await banco.query("ROLLBACK");
        res.status(409).json({ erro: `Você tem ${atual.ocupadas} caronas aceitas. Desfaça um aceite antes de reduzir as vagas para ${vagas}.` });
        return;
      }
    }
    const { rows } = await banco.query<TrajetoRow>(
      `INSERT INTO trajetos
         (usuario_ra, papel, endereco, origem_lat, origem_lng, dias, chegada, saida, carro_modelo, carro_lugares, carro_consumo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (usuario_ra) DO UPDATE SET
         papel = EXCLUDED.papel, endereco = EXCLUDED.endereco,
         origem_lat = EXCLUDED.origem_lat, origem_lng = EXCLUDED.origem_lng,
         dias = EXCLUDED.dias, chegada = EXCLUDED.chegada, saida = EXCLUDED.saida,
         carro_modelo = EXCLUDED.carro_modelo, carro_lugares = EXCLUDED.carro_lugares,
         carro_consumo = EXCLUDED.carro_consumo, atualizado_em = now()
       RETURNING *`,
      [req.params.ra, t.papel, t.endereco, o.lat, o.lng, t.dias, t.chegada, t.saida,
       carro.modelo ?? "", vagas, carro.consumo ?? 12],
    );
    await banco.query("COMMIT");
    res.json(mapTrajeto(rows[0]));
  } catch (e) {
    await banco.query("ROLLBACK").catch(() => {});
    console.error(e);
    res.status(500).json({ erro: "falha ao salvar trajeto" });
  } finally {
    banco.release();
  }
});
