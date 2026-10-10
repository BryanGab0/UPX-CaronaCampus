// Vagas do carro no app. A API manda as vagas e quantas estão livres (calculadas: vagas − aceitos).
import type { Carona } from "../types";
import type { Resultado } from "./match";

export const VAGAS_MIN = 1;
export const VAGAS_MAX = 6;

export const lotado = (c: Carona) => c.vagasLivres <= 0;

// "Lotado", "1 vaga" ou "3 vagas" (livres).
export function textoVagas(c: Carona): string {
  if (lotado(c)) return "Lotado";
  return c.vagasLivres === 1 ? "1 vaga" : `${c.vagasLivres} vagas`;
}

// Mantém a ordem recebida (compatibilidade, custo ou horário), mas joga os lotados para o fim:
// a nota de compatibilidade não muda, só não adianta mostrar primeiro quem não tem lugar.
export function lotadosNoFim(resultados: Resultado[]): Resultado[] {
  return [...resultados.filter((r) => !lotado(r.carona)), ...resultados.filter((r) => lotado(r.carona))];
}
