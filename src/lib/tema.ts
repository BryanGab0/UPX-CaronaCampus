// Tema do app (claro/escuro). A pessoa escolhe no Perfil; o padrão segue o aparelho.
// O <html> recebe data-tema="escuro" e o index.css troca os valores dos tokens.
// O script no <head> do index.html repete a resolução antes da primeira pintura (sem piscar no claro):
// ao mudar a chave ou os valores aqui, mudar lá também.

export type PreferenciaTema = "claro" | "escuro" | "dispositivo";
export type Tema = "claro" | "escuro";

export const CHAVE_TEMA = "tema";
const CONSULTA_ESCURO = "(prefers-color-scheme: dark)";

// Valor salvo -> preferência válida; qualquer outra coisa (nada salvo, valor antigo) vira "dispositivo".
export function lerPreferencia(valor: string | null): PreferenciaTema {
  return valor === "claro" || valor === "escuro" ? valor : "dispositivo";
}

export function resolverTema(preferencia: PreferenciaTema, aparelhoEscuro: boolean): Tema {
  if (preferencia === "dispositivo") return aparelhoEscuro ? "escuro" : "claro";
  return preferencia;
}

// --- Estado no navegador (só usado depois de iniciarTema, que roda no main.tsx). ---

let preferencia: PreferenciaTema = "dispositivo";
const ouvintes = new Set<() => void>();

export function preferenciaAtual(): PreferenciaTema {
  return preferencia;
}

export function assinarTema(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => { ouvintes.delete(ouvinte); };
}

function lerSalva(): PreferenciaTema {
  try {
    return lerPreferencia(localStorage.getItem(CHAVE_TEMA));
  } catch {
    return "dispositivo"; // navegador sem storage / modo privado
  }
}

function aplicar() {
  const raiz = document.documentElement;
  const tema = resolverTema(preferencia, matchMedia(CONSULTA_ESCURO).matches);
  if (tema === "escuro") raiz.dataset.tema = "escuro";
  else delete raiz.dataset.tema;

  // Barra do navegador/PWA com a cor do fundo do tema (lida do token, não repetida aqui).
  const fundo = getComputedStyle(raiz).getPropertyValue("--color-canvas").trim();
  if (fundo) document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => { m.content = fundo; });

  ouvintes.forEach((o) => o());
}

export function escolherTema(nova: PreferenciaTema) {
  preferencia = nova;
  try {
    localStorage.setItem(CHAVE_TEMA, nova);
  } catch {
    // sem storage: vale só até fechar o app
  }
  aplicar();
}

export function iniciarTema() {
  preferencia = lerSalva();
  aplicar();
  // No modo "dispositivo", acompanha na hora a troca de tema do celular/computador.
  matchMedia(CONSULTA_ESCURO).addEventListener("change", () => {
    if (preferencia === "dispositivo") aplicar();
  });
  // Escolha feita em outra aba do app.
  window.addEventListener("storage", (e) => {
    if (e.key !== CHAVE_TEMA) return;
    preferencia = lerPreferencia(e.newValue);
    aplicar();
  });
}
