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

// Origens (sites) que podem chamar a API pelo navegador: app do aluno e painel admin.
// Separadas por vírgula; sem a variável, vale o padrão de desenvolvimento local.
export const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, "")) // tolera espaço e "/" no final
  .filter(Boolean);

// Notificações push (Web Push / VAPID). Opcionais: sem as chaves, a API sobe normalmente
// e só não envia notificações. Gerar o par com: npx web-push generate-vapid-keys
export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:caronacampus.contato@gmail.com";
export const PUSH_CONFIGURADO = VAPID_PUBLIC_KEY !== "" && VAPID_PRIVATE_KEY !== "";
