const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

// Token do admin (setado pelo AuthContext), enviado nas rotas de admin.
let tokenAtual: string | null = null;
export function definirToken(t: string | null) {
  tokenAtual = t;
}
function authHeaders(): Record<string, string> {
  return tokenAtual ? { Authorization: `Bearer ${tokenAtual}` } : {};
}

// Sessão que deixou de valer: o AuthProvider encerra e explica o motivo no login. 401 = token
// expirado ou senha trocada; 403 = a conta foi bloqueada ou deixou de ser administradora.
let aoEncerrar: ((motivo: string) => void) | null = null;
export function definirAoEncerrar(fn: ((motivo: string) => void) | null) { aoEncerrar = fn; }
async function falha(resp: Response, acao: string): Promise<Error> {
  if (tokenAtual && (resp.status === 401 || resp.status === 403)) {
    const d = await resp.json().catch(() => null);
    aoEncerrar?.(resp.status === 401
      ? (/senha foi alterada/.test(d?.erro ?? "") ? "Sua senha foi alterada. Entre novamente." : "Sua sessão expirou. Entre novamente.")
      : (d?.bloqueado ? "Sua conta foi bloqueada." : "Esta conta não tem mais acesso de administrador."));
  }
  return new Error(`Erro ${resp.status} ${acao}`);
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
  motoristas: number;
  trajetos: number;
  solicitacoes: number;
}

export async function buscarEstatisticas(): Promise<Estatisticas> {
  const resp = await fetch(`${API_URL}/admin/estatisticas`, { headers: { ...authHeaders() } });
  if (!resp.ok) throw await falha(resp, "ao buscar estatísticas");
  return resp.json();
}

export interface UsuarioAdmin {
  ra: string;
  nome: string;
  email: string;
  telefone: string | null;
  admin: boolean;
  bloqueado: boolean;
  senha_temporaria: boolean; // aguardando o aluno trocar a senha gerada pelo admin
  criado_em: string;
}

export async function buscarUsuarios(): Promise<UsuarioAdmin[]> {
  const resp = await fetch(`${API_URL}/admin/usuarios`, { headers: { ...authHeaders() } });
  if (!resp.ok) throw await falha(resp, "ao buscar usuários");
  return resp.json();
}

// Bloqueia ou desbloqueia um usuário (moderação).
export async function alterarBloqueio(ra: string, bloqueado: boolean): Promise<void> {
  const resp = await fetch(`${API_URL}/admin/usuarios/${ra}/bloqueio`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ bloqueado }),
  });
  if (!resp.ok) throw await falha(resp, "ao alterar bloqueio");
}

// Gera uma senha temporária para quem esqueceu a senha. Ela só aparece nesta resposta.
export async function gerarSenhaTemporaria(ra: string): Promise<string> {
  const resp = await fetch(`${API_URL}/admin/usuarios/${ra}/senha-temporaria`, { method: "POST", headers: { ...authHeaders() } });
  if (!resp.ok) throw await falha(resp, "ao gerar a senha temporária");
  return (await resp.json()).senha;
}

export interface SolicitacaoAdmin {
  id: number;
  status: string;
  canceladoPor: "passageiro" | "motorista" | null; // quem cancelou (pedido com status "cancelada")
  passageiroNome: string;
  motoristaNome: string;
}

export async function buscarSolicitacoes(): Promise<SolicitacaoAdmin[]> {
  const resp = await fetch(`${API_URL}/admin/solicitacoes`, { headers: { ...authHeaders() } });
  if (!resp.ok) throw await falha(resp, "ao buscar solicitações");
  return resp.json();
}

// --- Denúncias (moderação) ---
export interface DenunciaAdmin {
  id: number;
  motivo: string;
  descricao: string;
  status: "aberta" | "resolvida";
  criadoEm: string;
  denuncianteRa: string;
  denuncianteNome: string;
  denunciadoRa: string;
  denunciadoNome: string;
  denunciadoBloqueado: boolean;
}

export async function buscarDenuncias(): Promise<DenunciaAdmin[]> {
  const resp = await fetch(`${API_URL}/admin/denuncias`, { headers: { ...authHeaders() } });
  if (!resp.ok) throw await falha(resp, "ao buscar denúncias");
  return resp.json();
}

export async function alterarStatusDenuncia(id: number, status: "aberta" | "resolvida"): Promise<void> {
  const resp = await fetch(`${API_URL}/admin/denuncias/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status }),
  });
  if (!resp.ok) throw await falha(resp, "ao atualizar denúncia");
}
