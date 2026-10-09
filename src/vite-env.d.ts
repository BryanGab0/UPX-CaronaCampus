/// <reference types="vite/client" />

// Variáveis de ambiente do Vite (prefixo VITE_ fica disponível no navegador).
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SENTRY_DSN?: string; // registro de erros (opcional); sem ela o Sentry nem é baixado
}
