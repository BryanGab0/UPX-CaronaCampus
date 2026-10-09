import webpush from "web-push";
import { pool } from "./db.js";
import { PUSH_CONFIGURADO, VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT } from "./config.js";

export interface Notificacao {
  titulo: string;
  corpo: string;
  url: string; // tela do app aberta ao tocar na notificação
}

let vapidPronto = false;

// Envia a notificação para todos os aparelhos inscritos do usuário. Nunca lança erro:
// uma falha no push não pode atrapalhar a ação principal (pedir, aceitar, recusar).
export async function notificar(ra: string, n: Notificacao): Promise<void> {
  if (!PUSH_CONFIGURADO) return;
  try {
    const { rows } = await pool.query(
      `SELECT i.endpoint, i.p256dh, i.auth FROM inscricoes_push i
       JOIN usuarios u ON u.ra = i.usuario_ra
       WHERE i.usuario_ra = $1 AND NOT u.bloqueado`,
      [ra],
    );
    if (rows.length === 0) return;
    if (!vapidPronto) { webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY); vapidPronto = true; }

    const carga = JSON.stringify(n);
    await Promise.all(rows.map(async (r) => {
      try {
        await webpush.sendNotification({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }, carga, { TTL: 60 * 60 * 24 });
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // 404/410: o aparelho cancelou a inscrição (ou o app foi desinstalado) -> remove.
        if (status === 404 || status === 410) await pool.query("DELETE FROM inscricoes_push WHERE endpoint = $1", [r.endpoint]);
        else console.error("falha ao enviar push", status ?? e);
      }
    }));
  } catch (e) {
    console.error("falha nas notificações", e);
  }
}
