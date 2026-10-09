import { Router } from "express";
import { pool } from "../db.js";
import { autenticar, mesmoUsuario } from "../middleware/autenticar.js";
import type { ReqAuth } from "../middleware/autenticar.js";
import { SQL_MEDIAS } from "./avaliacoes.js";
import { notificar } from "../notificacoes.js";

export const solicitacoesRouter = Router();

// Avisa o motorista de um pedido novo. Roda depois da resposta e nunca lança erro.
async function avisarNovoPedido(motoristaRa: string, passageiroRa: string) {
  try {
    const p = await pool.query("SELECT nome FROM usuarios WHERE ra = $1", [passageiroRa]);
    await notificar(motoristaRa, {
      titulo: "Novo pedido de carona",
      corpo: `${p.rows[0]?.nome ?? "Um passageiro"} quer ir com você até a Facens.`,
      url: "/perfil",
    });
  } catch (e) {
    console.error("falha ao avisar o motorista", e);
  }
}

// POST — passageiro solicita carona a um motorista.
solicitacoesRouter.post("/usuarios/:ra/solicitacoes", autenticar, mesmoUsuario, async (req, res) => {
  const { motoristaRa } = req.body ?? {};
  if (!motoristaRa) {
    res.status(400).json({ erro: "motoristaRa é obrigatório" });
    return;
  }
  if (String(motoristaRa) === req.params.ra) {
    res.status(400).json({ erro: "não é possível pedir carona para si mesmo" });
    return;
  }
  try {
    // O destinatário precisa existir e oferecer carona (trajeto como motorista).
    const alvo = await pool.query(
      `SELECT t.papel FROM usuarios u LEFT JOIN trajetos t ON t.usuario_ra = u.ra WHERE u.ra = $1`,
      [motoristaRa],
    );
    if (alvo.rows.length === 0) {
      res.status(404).json({ erro: "motorista não encontrado" });
      return;
    }
    if (alvo.rows[0].papel !== "motorista") {
      res.status(400).json({ erro: "este usuário não oferece carona" });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO solicitacoes (passageiro_ra, motorista_ra) VALUES ($1, $2)
       ON CONFLICT (passageiro_ra, motorista_ra) DO UPDATE SET status = solicitacoes.status
       RETURNING id, passageiro_ra, motorista_ra, status, criado_em, (xmax = 0) AS novo`,
      [req.params.ra, motoristaRa],
    );
    const { novo, ...pedido } = rows[0]; // "novo": o INSERT criou a linha (não era um pedido repetido)
    res.status(201).json(pedido);

    if (novo) void avisarNovoPedido(String(motoristaRa), String(req.params.ra));
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao solicitar carona" });
  }
});

// GET — solicitações do PASSAGEIRO. Telefone do motorista só quando aceita.
solicitacoesRouter.get("/usuarios/:ra/solicitacoes", autenticar, mesmoUsuario, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.motorista_ra, s.status, s.criado_em, m.nome AS motorista_nome,
              t.endereco AS motorista_endereco,
              CASE WHEN s.status = 'aceita' THEN m.telefone ELSE NULL END AS motorista_telefone,
              a.nota AS minha_nota
       FROM solicitacoes s
       JOIN usuarios m ON m.ra = s.motorista_ra
       LEFT JOIN trajetos t ON t.usuario_ra = s.motorista_ra
       LEFT JOIN avaliacoes a ON a.solicitacao_id = s.id AND a.avaliador_ra = $1
       WHERE s.passageiro_ra = $1
       ORDER BY s.criado_em DESC`,
      [req.params.ra],
    );
    res.json(rows.map((r) => ({
      id: r.id, motoristaRa: r.motorista_ra, status: r.status, motoristaNome: r.motorista_nome,
      endereco: r.motorista_endereco, motoristaTelefone: r.motorista_telefone, minhaNota: r.minha_nota,
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao listar solicitações" });
  }
});

// GET — pedidos RECEBIDOS pelo motorista. Telefone do passageiro só quando aceita.
solicitacoesRouter.get("/usuarios/:ra/pedidos", autenticar, mesmoUsuario, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.status, s.criado_em, p.ra AS passageiro_ra, p.nome AS passageiro_nome,
              CASE WHEN s.status = 'aceita' THEN p.telefone ELSE NULL END AS passageiro_telefone,
              a.nota AS minha_nota, md.media AS passageiro_media, COALESCE(md.total, 0) AS passageiro_avaliacoes
       FROM solicitacoes s
       JOIN usuarios p ON p.ra = s.passageiro_ra
       LEFT JOIN avaliacoes a ON a.solicitacao_id = s.id AND a.avaliador_ra = $1
       LEFT JOIN (${SQL_MEDIAS}) md ON md.avaliado_ra = s.passageiro_ra
       WHERE s.motorista_ra = $1
       ORDER BY s.criado_em DESC`,
      [req.params.ra],
    );
    res.json(rows.map((r) => ({
      id: r.id, status: r.status, passageiroRa: r.passageiro_ra, passageiroNome: r.passageiro_nome,
      passageiroTelefone: r.passageiro_telefone, minhaNota: r.minha_nota,
      passageiroMedia: r.passageiro_media, passageiroAvaliacoes: r.passageiro_avaliacoes,
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao listar pedidos" });
  }
});

// PATCH — motorista aceita ou recusa (só o motorista dono do pedido).
solicitacoesRouter.patch("/solicitacoes/:id", autenticar, async (req: ReqAuth, res) => {
  const { status } = req.body ?? {};
  if (status !== "aceita" && status !== "recusada") {
    res.status(400).json({ erro: "status deve ser 'aceita' ou 'recusada'" });
    return;
  }
  try {
    const dono = await pool.query(
      `SELECT s.motorista_ra, s.passageiro_ra, m.nome AS motorista_nome
       FROM solicitacoes s JOIN usuarios m ON m.ra = s.motorista_ra WHERE s.id = $1`,
      [req.params.id],
    );
    if (dono.rows.length === 0) {
      res.status(404).json({ erro: "solicitação não encontrada" });
      return;
    }
    if (dono.rows[0].motorista_ra !== req.usuarioRa) {
      res.status(403).json({ erro: "acesso negado" });
      return;
    }
    const { rows } = await pool.query(
      "UPDATE solicitacoes SET status = $1 WHERE id = $2 RETURNING id, status",
      [status, req.params.id],
    );
    res.json(rows[0]);

    const { passageiro_ra, motorista_ra, motorista_nome } = dono.rows[0];
    void notificar(passageiro_ra, status === "aceita"
      ? { titulo: "Pedido aceito!", corpo: `${motorista_nome} aceitou sua carona. Combine os detalhes pelo WhatsApp.`, url: `/carona/${motorista_ra}` }
      : { titulo: "Pedido recusado", corpo: `${motorista_nome} não pode levar você desta vez. Veja outras caronas compatíveis.`, url: "/caronas" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao atualizar solicitação" });
  }
});
