import { Router } from "express";
import { pool } from "../db.js";
import { autenticar, mesmoUsuario } from "../middleware/autenticar.js";
import { PUSH_CONFIGURADO, VAPID_PUBLIC_KEY } from "../config.js";

export const inscricoesRouter = Router();

// GET — chave pública VAPID: o navegador precisa dela para criar a inscrição.
inscricoesRouter.get("/notificacoes/chave", (_req, res) => {
  if (!PUSH_CONFIGURADO) {
    res.status(503).json({ erro: "Notificações indisponíveis no momento." });
    return;
  }
  res.json({ chave: VAPID_PUBLIC_KEY });
});

// POST — inscreve o aparelho do usuário. Se o mesmo aparelho já estava inscrito
// (ex.: outra conta usou o celular antes), passa a pertencer a este usuário.
inscricoesRouter.post("/usuarios/:ra/inscricoes", autenticar, mesmoUsuario, async (req, res) => {
  const { endpoint, keys } = req.body ?? {};
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || typeof keys?.p256dh !== "string" || typeof keys?.auth !== "string") {
    res.status(400).json({ erro: "inscrição inválida" });
    return;
  }
  try {
    await pool.query(
      `INSERT INTO inscricoes_push (endpoint, usuario_ra, p256dh, auth) VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET usuario_ra = EXCLUDED.usuario_ra, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
      [endpoint, req.params.ra, keys.p256dh, keys.auth],
    );
    res.status(201).json({ inscrito: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao ativar as notificações" });
  }
});

// DELETE — cancela a inscrição deste aparelho (ao desativar ou ao sair da conta).
inscricoesRouter.delete("/usuarios/:ra/inscricoes", autenticar, mesmoUsuario, async (req, res) => {
  const { endpoint } = req.body ?? {};
  if (typeof endpoint !== "string") {
    res.status(400).json({ erro: "informe o endpoint" });
    return;
  }
  try {
    await pool.query("DELETE FROM inscricoes_push WHERE endpoint = $1 AND usuario_ra = $2", [endpoint, req.params.ra]);
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao desativar as notificações" });
  }
});
