// A compatibilidade é calculada na API (backend/src/match.ts): o app recebe a nota, o detalhamento
// e uma região aproximada do motorista, nunca a coordenada exata da casa dele. Aqui ficam só os
// tipos do resultado e o que o app calcula sobre o PRÓPRIO trajeto (combustível do motorista).
import type { Carona, Coord, DiaSemana } from "../types";

export const PRECO_LITRO = 6.09; // R$/litro (gasolina); o mesmo valor da API

export interface Avaliacao {
  compat: number;
  scoreHorario: number;
  scoreRota: number;
  diasComuns: DiaSemana[];
  difChegadaMin: number;
  desvioKm: number;   // arredondado pela API (passos de 0,5 km)
  litrosDia: number;  // combustível do motorista por dia, ida e volta
  custoDia: number;   // R$ por dia (sua parte), estimado
  pesos: { horario: number; rota: number }; // pesos da nota, para explicar o cálculo
}

export interface Resultado extends Avaliacao {
  carona: Carona;
}

const rad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(a: Coord, b: Coord): number {
  const R = 6371;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Litros gastos por dia num trajeto (ida e volta, em linha reta). Usado só com o trajeto do
// próprio usuário; o dos motoristas vem pronto da API.
export function litrosDia(origem: Coord, destino: Coord, consumo: number): number {
  const kmIda = haversineKm(origem, destino);
  return (kmIda * 2) / (consumo > 0 ? consumo : 12);
}

// Formata R$ no padrão brasileiro.
export const reais = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
