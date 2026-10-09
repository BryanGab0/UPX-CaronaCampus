// Registro de erros em produção (Sentry). O SDK só é baixado se houver VITE_SENTRY_DSN:
// fica num arquivo separado do bundle e não pesa no carregamento do app.
import { API_URL } from "./api";

type Sentry = typeof import("./sentry");
let carregando: Promise<Sentry | null> | null = null;

// As migalhas de rede guardam a URL completa. A busca de endereço (Nominatim) e a rota do
// mapa (OSRM) levam o endereço digitado e as coordenadas da casa do aluno, na query ou no
// caminho: delas fica só o site. Da nossa API fica o caminho, sem a query.
function limparUrl(url: string): string {
  try {
    const u = new URL(url, location.href);
    return u.origin === new URL(API_URL).origin ? u.origin + u.pathname : u.origin;
  } catch {
    return "[url]";
  }
}

export function iniciarMonitoramento() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  carregando = import("./sentry")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: import.meta.env.PROD ? "producao" : "local",
        tracesSampleRate: 0, // só erros, sem medição de desempenho
        // Mesma restrição da API: nada de corpo das requisições (senha, telefone), cabeçalhos
        // (token), cookies, query string, IP nem variáveis locais.
        dataCollection: {
          userInfo: false,
          cookies: false,
          httpHeaders: false,
          httpBodies: [],
          urlQueryParams: false,
          databaseQueryData: false,
          stackFrameVariables: false,
        },
        beforeBreadcrumb(migalha) {
          const dados = migalha.data;
          if (!dados) return migalha;
          // Argumentos crus do console podem trazer dados da tela.
          if (migalha.category === "console") delete dados.arguments;
          if ((migalha.category === "fetch" || migalha.category === "xhr") && typeof dados.url === "string") {
            dados.url = limparUrl(dados.url);
          }
          // Navegação entre telas do app (ex.: /carona/3): fica a rota, sem a query.
          if (migalha.category === "navigation") {
            if (typeof dados.from === "string") dados.from = dados.from.split("?")[0];
            if (typeof dados.to === "string") dados.to = dados.to.split("?")[0];
          }
          return migalha;
        },
      });
      return Sentry;
    })
    .catch(() => null); // sem rede ou bloqueado por extensão: o app segue sem monitoramento
}

// Erros de renderização pegos pela ErroTela. Os demais (eventos, promessas) o SDK captura sozinho.
export function registrarErro(erro: unknown, pilhaComponentes?: string | null) {
  void carregando?.then((Sentry) => {
    Sentry?.captureException(erro, { contexts: { react: { componentStack: pilhaComponentes ?? "" } } });
  });
}
