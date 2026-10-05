const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

// Token do admin (setado pelo AuthContext), enviado nas rotas de admin.
let tokenAtual: string | null = null;
export function definirToken(t: string | null) {
  tokenAtual = t;
}
function authHeaders(): Record<string, string> {
  return tokenAtual ? { Authorization: `Bearer ${tokenAtual}` } : {};
}

export interface Sessao {
  token: string;
  usuario: { ra: string; nome: string; email: string; admin: boolean };
}

export async function login(ra: string, senha: string): Promise<Sessao> {
  const resp = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ra, senha }),
  });
  if (!resp.ok) {
    const d = await resp.json().catch(() => ({}));
    throw new Error(d?.erro ?? "RA ou senha inválidos");
  }
  return resp.json();
}

export interface Estatisticas {
  usuarios: number;
  caronas: number;
  trajetos: number;
  solicitacoes: number;
}

export async function buscarEstatisticas(): Promise<Estatisticas> {
  const resp = await fetch(`${API_URL}/admin/estatisticas`, { headers: { ...authHeaders() } });
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao buscar estatísticas`);
  return resp.json();
}

export interface UsuarioAdmin {
  ra: string;
  nome: string;
  email: string;
  admin: boolean;
  criado_em: string;
}

export async function buscarUsuarios(): Promise<UsuarioAdmin[]> {
  const resp = await fetch(`${API_URL}/admin/usuarios`, { headers: { ...authHeaders() } });
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao buscar usuários`);
  return resp.json();
}

export interface SolicitacaoAdmin {
  id: number;
  status: string;
  criado_em: string;
  usuario_ra: string;
  usuario_nome: string;
  carona_nome: string;
  carona_bairro: string;
}

export async function buscarSolicitacoes(): Promise<SolicitacaoAdmin[]> {
  const resp = await fetch(`${API_URL}/admin/solicitacoes`, { headers: { ...authHeaders() } });
  if (!resp.ok) throw new Error(`Erro ${resp.status} ao buscar solicitações`);
  return resp.json();
}
