// Registro de erros em produção (Sentry). Carregado antes da API pelo --import nos scripts
// dev/start, para o SDK instrumentar o Express. Sem SENTRY_DSN, não faz nada.
import "dotenv/config";
import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.RENDER ? "producao" : "local",
    tracesSampleRate: 0, // só erros, sem medição de desempenho
    // As rotas já registram as falhas com console.error: elas viram eventos no Sentry.
    integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })],
    // Privacidade: por padrão o SDK enviaria o corpo das requisições (senha, telefone),
    // os cabeçalhos (token, IP), os dados das consultas e as variáveis locais das funções.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      stackFrameVariables: false,
    },
    // O captureConsole (no evento) e as migalhas do console (anexadas aos eventos seguintes)
    // guardam os argumentos crus do console. Num erro do Postgres eles trazem o campo detail,
    // com valores da linha (ex.: "Key (ra)=(...) already exists"). A mensagem e o rastro do
    // erro continuam no evento.
    beforeSend(event) {
      if (event.extra) delete event.extra.arguments;
      return event;
    },
    beforeBreadcrumb(migalha) {
      if (migalha.category === "console" && migalha.data) delete migalha.data.arguments;
      return migalha;
    },
  });
}
