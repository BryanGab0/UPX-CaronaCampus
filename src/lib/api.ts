import type { Carona, Trajeto } from "../types";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

let tokenAtual: string | null = null;
export function definirToken(t: string | null) { tokenAtual = t; }
function authHeaders(): Record<string, string> {
  return tokenAtual ? { Authorization: `Bearer ${tokenAtual}` } : {};
}
// Conta bloqueada pelo admin: a API responde 403 com "bloqueado" e o AuthProvider encerra a sessão.
let aoBloquear: (() => void) | null = null;
export function definirAoBloquear(fn: (() => void) | null) { aoBloquear = fn; }
async function falha(resp: Response, acao: string): Promise<Error> {
  if (resp.status === 403) {
    const d = await resp.json().catch(() => null);
    if (d?.bloqueado) aoBloquear?.();
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

// Caronas = motoristas reais (protegido).
export async function buscarCaronas(): Promise<Carona[]> {
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
}

export async function solicitarCarona(ra: string, motoristaRa: string): Promise<void> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/solicitacoes`, {
    method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ motoristaRa }),
  });
  if (!resp.ok) throw await falha(resp, "ao solicitar carona");
}

export async function buscarSolicitacoes(ra: string): Promise<MinhaSolicitacao[]> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/solicitacoes`, { headers: { ...authHeaders() } });
  if (!resp.ok) throw await falha(resp, "ao buscar solicitações");
  return resp.json();
}

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
  if (!resp.ok) throw await falha(resp, "ao responder solicitação");
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
