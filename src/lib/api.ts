import type { Carona, Trajeto } from "../types";
 
const API_URL = "http://localhost:3333";
 
// Token JWT atual (definido pelo AuthContext). Enviado nas rotas protegidas.
let tokenAtual: string | null = null;
export function definirToken(t: string | null) {
  tokenAtual = t;
}
function authHeaders(): Record<string, string> {
  return tokenAtual ? { Authorization: `Bearer ${tokenAtual}` } : {};
}
 
async function erroDaResposta(resp: Response, padrao: string): Promise<Error> {
  try {
    const d = await resp.json();
    return new Error(d?.erro ?? padrao);
  } catch {
    return new Error(padrao);
  }
}
 
export interface Sessao {
  token: string;
  usuario: { ra: string; nome: string; email: string };
}
 
export async function registrar(ra: string, nome: string, email: string, senha: string): Promise<Sessao> {
  const resp = await fetch(`${API_URL}/auth/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ra, nome, email, senha }),
  });
  if (!resp.ok) throw await erroDaResposta(resp, "Não foi possível criar a conta");
  return resp.json();
}
 
export async function login(ra: string, senha: string): Promise<Sessao> {
  const resp = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ra, senha }),
  });
  if (!resp.ok) throw await erroDaResposta(resp, "RA ou senha inválidos");
  return resp.json();
}
 
// Público (não precisa de token).
export async function buscarCaronas(): Promise<Carona[]> {
  const resp = await fetch(`${API_URL}/caronas`);
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao buscar caronas`);
  return resp.json();
}
 
// --- Rotas protegidas: incluem o token ---
 
export async function buscarTrajeto(ra: string): Promise<Trajeto | null> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/trajeto`, { headers: { ...authHeaders() } });
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao buscar trajeto`);
  return resp.json();
}
 
export async function salvarTrajeto(ra: string, trajeto: Trajeto): Promise<Trajeto> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/trajeto`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(trajeto),
  });
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao salvar trajeto`);
  return resp.json();
}
 
export interface SolicitacaoResumo {
  caronaId: string;
  status: string;
  nome: string;
  bairro: string;
}
 
export async function buscarSolicitacoes(ra: string): Promise<SolicitacaoResumo[]> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/solicitacoes`, { headers: { ...authHeaders() } });
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao buscar solicitações`);
  return resp.json();
}
 
export async function solicitarCarona(ra: string, caronaId: string): Promise<void> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/solicitacoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ caronaId }),
  });
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao solicitar carona`);
}
