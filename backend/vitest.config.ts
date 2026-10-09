import { defineConfig } from "vitest/config";
import { DATABASE_URL_TESTE, JWT_SECRET_TESTE } from "./tests/ambiente.js";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/preparar-banco.ts"],
    // Variáveis definidas aqui têm prioridade sobre o .env (o dotenv não as sobrescreve).
    env: {
      DATABASE_URL: DATABASE_URL_TESTE, JWT_SECRET: JWT_SECRET_TESTE, CORS_ORIGINS: "http://localhost:5173",
      VAPID_PUBLIC_KEY: "chave-publica-de-teste", VAPID_PRIVATE_KEY: "chave-privada-de-teste", // o envio é simulado nos testes
    },
    fileParallelism: false, // todos os arquivos usam o mesmo banco de teste
  },
});
