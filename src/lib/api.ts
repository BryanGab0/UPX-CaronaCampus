import type { Carona, Trajeto } from "../types";
import type { Avaliacao } from "./match";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

let tokenAtual: string | null = null;
export function definirToken(t: string | null) { tokenAtual = t; }
function authHeaders(): Record<string, string> {
  return tokenAtual ? { Authorization: `Bearer ${tokenAtual}` } : {};
}
// Sessão que deixou de valer: o AuthProvider encerra e explica o motivo no login. Acontece com a
// conta bloqueada pelo admin (403 com "bloqueado") e com o token recusado (401): expirou, a conta
// não existe mais ou a senha foi trocada em outro aparelho.
let aoEncerrar: ((motivo: string) => void) | null = null;
export function definirAoEncerrar(fn: ((motivo: string) => void) | null) { aoEncerrar = fn; }
async function falha(resp: Response, acao: string): Promise<Error> {
  if (resp.status === 403 || (resp.status === 401 && tokenAtual)) {
    const d = await resp.json().catch(() => null);
    if (resp.status === 403 && d?.bloqueado) aoEncerrar?.("Sua conta foi bloqueada pela administração.");
    if (resp.status === 401) {
      aoEncerrar?.(/senha foi alterada/.test(d?.erro ?? "")
        ? "Sua senha foi alterada. Entre novamente com a senha nova."
        : "Sua sessão expirou. Entre novamente.");
    }
  }
  return new Error(`Erro ${resp.status} ${acao}`);
}

async function erroDaResposta(resp: Response, padrao: string): Promise<Error> {
  try { const d = await resp.json(); return new Error(d?.erro ?? padrao); }
  catch { return new Error(padrao); }
}

export interface Sessao {
  token: string;
  usuario: { ra: string; nome: string; email: string; admin: boolean };
}

export async function registrar(ra: string, nome: string, email: string, telefone: string, senha: string): Promise<Sessao> {
  const resp = await fetch(`${API_URL}/auth/registrar`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ra, nome, email, telefone, senha }),
  });
  if (!resp.ok) throw await erroDaResposta(resp, "Não foi possível criar a conta");
  return resp.json();
}

export async function login(ra: string, senha: string): Promise<Sessao> {
  const resp = await fetch(`${API_URL}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ra, senha }),
  });
  if (!resp.ok) throw await erroDaResposta(resp, "RA ou senha inválidos");
  return resp.json();
}

// --- Dados da própria conta ---
export interface MeusDados { ra: string; nome: string; email: string; telefone: string; }

export async function buscarMeusDados(): Promise<MeusDados> {
  const resp = await fetch(`${API_URL}/auth/eu`, { headers: { ...authHeaders() } });
  if (!resp.ok) throw await falha(resp, "ao buscar seus dados");
  return resp.json();
}

export async function atualizarDados(ra: string, dados: { nome?: string; telefone?: string }): Promise<MeusDados> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(dados),
  });
  // 400: dado inválido; a API explica para o usuário.
  if (resp.status === 400) throw await erroDaResposta(resp, "Confira os dados.");
  if (!resp.ok) throw await falha(resp, "ao atualizar seus dados");
  return resp.json();
}

// Devolve o token novo: a troca encerra as outras sessões, e esta continua com ele.
export async function trocarSenha(ra: string, senhaAtual: string, novaSenha: string): Promise<string> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/senha`, {
    method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });
  // 401 aqui é a senha atual errada (não a sessão): mostra a mensagem em vez de deslogar.
  if ([400, 401, 429].includes(resp.status)) throw await erroDaResposta(resp, "Não foi possível trocar a senha.");
  if (!resp.ok) throw await falha(resp, "ao trocar a senha");
  return (await resp.json()).token;
}

// Caronas = motoristas reais (protegido).
// Carona como vem da API: já com a nota e o detalhamento, ou compat null se quem pede ainda não
// cadastrou trajeto. A origem do motorista é uma região aproximada (~1 km), não a casa.
export type CaronaApi = Carona & (Avaliacao | { compat: null });

export async function buscarCaronas(): Promise<CaronaApi[]> {
  const resp = await fetch(`${API_URL}/caronas`, { headers: { ...authHeaders() } });
  if (!resp.ok) throw await falha(resp, "ao buscar caronas");
  return resp.json();
}

export async function buscarTrajeto(ra: string): Promise<Trajeto | null> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/trajeto`, { headers: { ...authHeaders() } });
  if (!resp.ok) throw await falha(resp, "ao buscar trajeto");
  return resp.json();
}

export async function salvarTrajeto(ra: string, trajeto: Trajeto): Promise<Trajeto> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/trajeto`, {
    method: "PUT", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(trajeto),
  });
  // 400/409: vagas fora do limite ou abaixo dos passageiros aceitos; a API explica.
  if (resp.status === 400 || resp.status === 409) throw await erroDaResposta(resp, "Confira os dados do trajeto.");
  if (!resp.ok) throw await falha(resp, "ao salvar trajeto");
  return resp.json();
}

// --- Solicitações (lado passageiro) ---
export interface MinhaSolicitacao {
  id: number;
  motoristaRa: string;
  status: string;
  motoristaNome: string;
  endereco: string | null;
  motoristaTelefone: string | null;
  minhaNota: number | null; // nota que o passageiro deu ao motorista
  canceladoPor: QuemCancelou | null;
}

export async function solicitarCarona(ra: string, motoristaRa: string): Promise<void> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/solicitacoes`, {
    method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ motoristaRa }),
  });
  // 409: carro lotado; a API explica para o usuário.
  if (resp.status === 409) throw await erroDaResposta(resp, "Carro lotado no momento.");
  if (!resp.ok) throw await falha(resp, "ao solicitar carona");
}

export async function buscarSolicitacoes(ra: string): Promise<MinhaSolicitacao[]> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/solicitacoes`, { headers: { ...authHeaders() } });
  if (!resp.ok) throw await falha(resp, "ao buscar solicitações");
  return resp.json();
}

// Pedido cancelado: o passageiro desistiu ou o motorista desfez o aceite.
export type QuemCancelou = "passageiro" | "motorista";

// --- Pedidos recebidos (lado motorista) ---
export interface Pedido {
  id: number;
  status: string;
  passageiroRa: string;
  passageiroNome: string;
  passageiroTelefone: string | null;
  minhaNota: number | null;      // nota que o motorista deu ao passageiro
  passageiroMedia: number | null;
  passageiroAvaliacoes: number;
  canceladoPor: QuemCancelou | null;
}

export async function buscarPedidos(ra: string): Promise<Pedido[]> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/pedidos`, { headers: { ...authHeaders() } });
  if (!resp.ok) throw await falha(resp, "ao buscar pedidos");
  return resp.json();
}

export async function responderSolicitacao(id: number, status: "aceita" | "recusada"): Promise<void> {
  const resp = await fetch(`${API_URL}/solicitacoes/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status }),
  });
  // 409: o passageiro cancelou nesse meio-tempo; a API explica para o usuário.
  if (resp.status === 409) throw await erroDaResposta(resp, "Este pedido não está mais aguardando resposta.");
  if (!resp.ok) throw await falha(resp, "ao responder solicitação");
}

// Passageiro cancela (pendente ou aceito) ou motorista desfaz o aceite.
export async function cancelarSolicitacao(id: number): Promise<void> {
  const resp = await fetch(`${API_URL}/solicitacoes/${id}/cancelamento`, { method: "PATCH", headers: { ...authHeaders() } });
  // 409: o pedido mudou nesse meio-tempo (ex.: o outro lado respondeu); a API explica para o usuário.
  if (resp.status === 409) throw await erroDaResposta(resp, "Este pedido não pode mais ser cancelado.");
  if (!resp.ok) throw await falha(resp, "ao cancelar solicitação");
}

// --- Denúncias ---
export type MotivoDenuncia = "comportamento" | "seguranca" | "perfil_falso" | "nao_compareceu" | "outro";

export async function denunciar(ra: string, denunciadoRa: string, motivo: MotivoDenuncia, descricao: string): Promise<void> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/denuncias`, {
    method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ denunciadoRa, motivo, descricao }),
  });
  // As mensagens de validação da API já são escritas para o usuário (ex.: denúncia repetida).
  if (resp.status === 403) throw await falha(resp, "ao denunciar");
  if (!resp.ok) throw await erroDaResposta(resp, "Não foi possível enviar a denúncia. Tente novamente.");
}

// --- Avaliações (1 a 5 estrelas, depois do aceite) ---
export async function avaliar(solicitacaoId: number, nota: number): Promise<void> {
  const resp = await fetch(`${API_URL}/solicitacoes/${solicitacaoId}/avaliacao`, {
    method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ nota }),
  });
  if (!resp.ok) throw await falha(resp, "ao avaliar");
}

// --- Notificações push ---
export async function buscarChavePush(): Promise<string> {
  const resp = await fetch(`${API_URL}/notificacoes/chave`);
  if (!resp.ok) throw await falha(resp, "ao buscar a chave de notificações");
  return (await resp.json()).chave;
}

export async function salvarInscricao(ra: string, inscricao: PushSubscriptionJSON): Promise<void> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/inscricoes`, {
    method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(inscricao),
  });
  if (!resp.ok) throw await falha(resp, "ao ativar as notificações");
}

export async function removerInscricao(ra: string, endpoint: string): Promise<void> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/inscricoes`, {
    method: "DELETE", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ endpoint }),
  });
  if (!resp.ok) throw await falha(resp, "ao desativar as notificações");
}
