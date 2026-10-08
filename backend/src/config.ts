import "dotenv/config";

// Lê uma variável de ambiente obrigatória; sem ela a API não sobe.
function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    console.error(`Variável de ambiente ${nome} não definida (ver .env.example).`);
    process.exit(1);
  }
  return valor;
}

// Sem valor padrão: com um segredo conhecido, qualquer um poderia gerar tokens válidos.
export const JWT_SECRET = obrigatoria("JWT_SECRET");
