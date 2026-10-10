import { Router } from "express";
import { pool } from "../db.js";
import { autenticar } from "../middleware/autenticar.js";
import type { ReqAuth } from "../middleware/autenticar.js";
import { SQL_MEDIAS } from "./avaliacoes.js";
import { SQL_OCUPADAS } from "../vagas.js";
import { avaliar, regiaoAproximada, PESO_HORARIO, PESO_ROTA } from "../match.js";
import type { Avaliacao, DiaSemana, PerfilPassageiro } from "../match.js";

export const caronasRouter = Router();

// Endereço que os outros alunos veem: só bairro e cidade (a rua e o CEP ficam no servidor).
export const enderecoPublico = (bairro: string | null, cidade: string | null) =>
  [bairro, cidade || "Sorocaba"].filter(Boolean).join(", ");

// Caronas = usuários com trajeto papel='motorista' (exceto o próprio usuário e contas bloqueadas),
// já ranqueadas pela compatibilidade com o trajeto SALVO de quem pede. A origem nunca vem da
// requisição: assim ninguém sonda a casa do motorista testando coordenadas arbitrárias.
caronasRouter.get("/caronas", autenticar, async (req: ReqAuth, res) => {
  try {
    const eu = await pool.query(
      "SELECT origem_lat, origem_lng, chegada, dias, endereco FROM trajetos WHERE usuario_ra = $1",
      [req.usuarioRa],
    );
    const t = eu.rows[0];
    // Sem trajeto cadastrado não há com o que comparar: a lista vem sem nota (o app pede o cadastro).
    const perfil: PerfilPassageiro | null = t?.endereco
      ? { origem: { lat: t.origem_lat, lng: t.origem_lng }, chegada: t.chegada, dias: t.dias as DiaSemana[] }
      : null;

    const { rows } = await pool.query(
      `SELECT u.ra, u.nome, t.bairro, t.cidade, t.origem_lat, t.origem_lng,
              t.dias, t.chegada, t.carro_modelo, t.carro_consumo, t.carro_lugares,
              COALESCE(oc.ocupadas, 0) AS ocupadas,
              md.media AS nota_media, COALESCE(md.total, 0) AS total_avaliacoes
       FROM trajetos t
       JOIN usuarios u ON u.ra = t.usuario_ra
       LEFT JOIN (${SQL_MEDIAS}) md ON md.avaliado_ra = u.ra
       LEFT JOIN (${SQL_OCUPADAS}) oc ON oc.motorista_ra = u.ra
       WHERE t.papel = 'motorista' AND u.ra <> $1 AND NOT u.bloqueado`,
      [req.usuarioRa],
    );

    const caronas = rows.map((r) => {
      const consumo = Number(r.carro_consumo);
      // A origem exata só é usada aqui dentro; para fora vai a região aproximada (~1 km).
      const exata = { lat: r.origem_lat, lng: r.origem_lng };
      const avaliacao: Avaliacao | null = perfil
        ? avaliar(perfil, { origem: exata, chegada: r.chegada, dias: r.dias, consumo })
        : null;
      return {
        id: r.ra,
        nome: r.nome,
        endereco: enderecoPublico(r.bairro, r.cidade),
        origem: regiaoAproximada(exata),
        dias: r.dias,
        chegada: r.chegada,
        carro: r.carro_modelo || "Carro",
        consumo,
        vagas: r.carro_lugares,
        vagasLivres: Math.max(0, r.carro_lugares - r.ocupadas), // 0 = lotado
        notaMedia: r.nota_media,         // null enquanto não houver avaliação
        totalAvaliacoes: r.total_avaliacoes,
        // Compatibilidade calculada aqui (null sem trajeto de quem pede). Os pesos vão junto para
        // o app explicar a nota sem repetir as constantes do algoritmo.
        ...(avaliacao ?? { compat: null }),
        pesos: { horario: PESO_HORARIO, rota: PESO_ROTA },
      };
    });
    caronas.sort((a, b) => (b.compat ?? -1) - (a.compat ?? -1));
    res.json(caronas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao listar caronas" });
  }
});
