import { buscarChavePush, removerInscricao, salvarInscricao } from "./api";

// Situação das notificações NESTE aparelho.
export type EstadoPush =
  | "sem-suporte"   // navegador não tem push
  | "ios-instalar"  // iPhone/iPad: só funciona com o app instalado na Tela de Início (iOS 16.4+)
  | "bloqueado"     // a pessoa negou a permissão; só dá para liberar nas configurações do navegador
  | "inativo"
  | "ativo";

const ehIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const instalado = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
const temPush = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

// A chave VAPID vem em base64 "de URL"; o navegador quer os bytes.
export function base64UrlParaBytes(b64: string): Uint8Array<ArrayBuffer> {
  const preenchido = (b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(preenchido), (c) => c.charCodeAt(0));
}

async function inscricaoAtual(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

// Descobre a situação e, se já estiver ativo, confirma na API que o aparelho é do usuário logado
// (outra conta pode ter usado este navegador antes).
export async function verificarPush(ra: string): Promise<EstadoPush> {
  if (!temPush()) return ehIOS() && !instalado() ? "ios-instalar" : "sem-suporte";
  if (Notification.permission === "denied") return "bloqueado";
  const inscricao = await inscricaoAtual();
  if (!inscricao) return "inativo";
  await salvarInscricao(ra, inscricao.toJSON()).catch((e) => console.error(e));
  return "ativo";
}

export async function ativarPush(ra: string): Promise<EstadoPush> {
  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") return permissao === "denied" ? "bloqueado" : "inativo";
  const chave = await buscarChavePush();
  const reg = await navigator.serviceWorker.ready;
  const inscricao = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlParaBytes(chave) });
  await salvarInscricao(ra, inscricao.toJSON());
  return "ativo";
}

// Também usado ao sair da conta, para o aparelho não continuar recebendo avisos de quem saiu.
export async function desativarPush(ra: string): Promise<void> {
  if (!temPush()) return;
  const inscricao = await inscricaoAtual();
  if (!inscricao) return;
  await removerInscricao(ra, inscricao.endpoint).catch((e) => console.error(e));
  await inscricao.unsubscribe();
}
