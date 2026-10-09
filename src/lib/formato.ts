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
