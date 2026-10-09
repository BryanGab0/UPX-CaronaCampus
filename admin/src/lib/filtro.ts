// Busca e paginação das tabelas do painel (funções puras, sem React).
// Tudo roda no navegador: o volume do projeto é pequeno e a resposta fica instantânea.
// Se as tabelas crescerem muito, o próximo passo é paginar na API (LIMIT/OFFSET).

export const POR_PAGINA = 20;

// "José Ávila" -> "jose avila": a busca ignora maiúsculas e acentos.
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

// Verdadeiro se algum dos campos contém o texto buscado (busca vazia aceita tudo).
export function combina(campos: (string | null | undefined)[], busca: string): boolean {
  const q = normalizar(busca);
  if (!q) return true;
  return campos.some((c) => c != null && normalizar(c).includes(q));
}

export interface Pagina<T> {
  itens: T[];
  pagina: number;       // página exibida, já ajustada ao intervalo válido (começa em 1)
  totalPaginas: number; // pelo menos 1, mesmo com a lista vazia
  inicio: number;       // posição (1, 2, ...) do primeiro item exibido; 0 se vazia
  fim: number;          // posição do último item exibido
}

export function paginar<T>(lista: T[], pagina: number, porPagina = POR_PAGINA): Pagina<T> {
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const atual = Math.min(Math.max(1, pagina), totalPaginas);
  const desde = (atual - 1) * porPagina;
  const itens = lista.slice(desde, desde + porPagina);
  return { itens, pagina: atual, totalPaginas, inicio: itens.length ? desde + 1 : 0, fim: desde + itens.length };
}
