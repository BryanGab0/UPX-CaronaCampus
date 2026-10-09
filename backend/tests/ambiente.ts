// Ambiente dos testes: banco PRÓPRIO (nunca o de desenvolvimento ou o Neon) e segredo só de teste.
export const DATABASE_URL_TESTE =
  process.env.DATABASE_URL_TEST ?? "postgresql://carona:carona@localhost:5432/caronacampus_test";

export const JWT_SECRET_TESTE = "segredo-so-dos-testes";

// Trava de segurança: os testes apagam as tabelas, então só rodam num banco "..._test".
export function nomeDoBancoDeTeste(url: string): string {
  const nome = new URL(url).pathname.slice(1);
  if (!nome.endsWith("_test")) {
    throw new Error(`Testes recusados: o banco "${nome}" não termina em "_test".`);
  }
  return nome;
}
