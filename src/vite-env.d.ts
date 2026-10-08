/// <reference types="vite/client" />

// Variáveis de ambiente do Vite (prefixo VITE_ fica disponível no navegador).
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}
