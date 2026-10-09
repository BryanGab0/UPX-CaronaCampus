// Só o que o app usa do Sentry. Carregado sob demanda por monitoramento.ts: importar o
// pacote inteiro com import() traria tudo (replay, feedback...) para o navegador.
export { init, captureException } from "@sentry/react";
