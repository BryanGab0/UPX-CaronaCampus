import type { Carona, Trajeto } from "../types";
 
// URL da API. Em produção, mover para uma variável de ambiente (VITE_API_URL).
const API_URL = "http://localhost:3333";
 
// Busca a lista de caronas no backend.
export async function buscarCaronas(): Promise<Carona[]> {
  const resp = await fetch(`${API_URL}/caronas`);
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao buscar caronas`);
  return resp.json();
}
 
// Registra/atualiza o usuário no banco (chamado no login).
export async function registrarUsuario(ra: string, nome: string, email: string): Promise<void> {
  const resp = await fetch(`${API_URL}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ra, nome, email }),
  });
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao registrar usuário`);
}
 
// Busca o trajeto salvo do usuário (null se ainda não cadastrou).
export async function buscarTrajeto(ra: string): Promise<Trajeto | null> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/trajeto`);
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao buscar trajeto`);
  return resp.json();
}
 
// Salva (cria ou atualiza) o trajeto do usuário no banco.
export async function salvarTrajeto(ra: string, trajeto: Trajeto): Promise<Trajeto> {
  const resp = await fetch(`${API_URL}/usuarios/${ra}/trajeto`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trajeto),
  });
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao salvar trajeto`);
  return resp.json();
}
