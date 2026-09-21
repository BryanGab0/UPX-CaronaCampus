import type { Carona } from "../types";
 
// URL da API. Em produção, mover para uma variável de ambiente (VITE_API_URL).
const API_URL = "http://localhost:3333";
 
// Busca a lista de caronas no backend.
export async function buscarCaronas(): Promise<Carona[]> {
  const resp = await fetch(`${API_URL}/caronas`);
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao buscar caronas`);
  return resp.json();
}
