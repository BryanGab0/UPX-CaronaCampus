import type { Carona, Trajeto } from "../types";
 
// URL da API. Em produção, mover para uma variável de ambiente (VITE_API_URL).
const API_URL = "http://localhost:3333";
 
export async function buscarCaronas(): Promise<Carona[]> {
  const resp = await fetch(`${API_URL}/caronas`);
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao buscar caronas`);
  return resp.json();
}
 
export async function registrarUsuario(ra: string, nome: string, email: string): Promise<void> {
  const resp = await fetch(`${API_URL}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ra, nome, email }),
  });
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao registrar usuário`);
}
 
export async function buscarTrajeto(ra: string): Promise<Trajeto | null> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/trajeto`);
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao buscar trajeto`);
  return resp.json();
}
 
export async function salvarTrajeto(ra: string, trajeto: Trajeto): Promise<Trajeto> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/trajeto`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trajeto),
  });
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao salvar trajeto`);
  return resp.json();
}
 
// Resumo de uma solicitação (o que o GET devolve).
export interface SolicitacaoResumo {
  caronaId: string;
  status: string;
  nome: string;
  bairro: string;
}
 
export async function buscarSolicitacoes(ra: string): Promise<SolicitacaoResumo[]> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/solicitacoes`);
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao buscar solicitações`);
  return resp.json();
}
 
export async function solicitarCarona(ra: string, caronaId: string): Promise<void> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/solicitacoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caronaId }),
  });
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao solicitar carona`);
}
