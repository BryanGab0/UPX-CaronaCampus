// Pequenos formatadores usados em vários componentes.

const partes = (nome: string) => nome.trim().split(/\s+/).filter(Boolean);

// "Ana Clara Souza" -> "Ana"
export const primeiroNome = (nome: string) => partes(nome)[0] ?? "";

// "Ana Clara Souza" -> "AC" (até duas letras, para o avatar)
export const iniciais = (nome: string) =>
  partes(nome).slice(0, 2).map((p) => p[0].toUpperCase()).join("");

// Link que abre o WhatsApp com a mensagem já escrita (telefone salvo só com DDD + número).
export const linkWhatsapp = (telefone: string, texto: string) =>
  `https://wa.me/55${telefone}?text=${encodeURIComponent(texto)}`;

// Valida só o FORMATO do telefone (DDD + número). Não verifica se é real.
export function telefoneValido(t: string): boolean {
  const d = t.replace(/\D/g, "");
  return d.length >= 10 && d.length <= 13;
}

// Formata enquanto digita: (11) 99999-9999 (máscara só visual).
export function formatarTelefone(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11); // no máx. 11 dígitos (DDD + número)
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}
