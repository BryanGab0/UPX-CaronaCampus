import type { Coord, Carona, Perfil, DiaSemana } from "../types";

export const TOLERANCIA_MIN = 45;
export const DESVIO_MAX_KM = 8;
export const PESO_HORARIO = 0.55;
export const PESO_ROTA = 0.45;

const rad = (d: number) => (d * Math.PI) / 180;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const minutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// Distância em km entre dois pontos geográficos (fórmula de Haversine)
export function haversineKm(a: Coord, b: Coord): number {
  const R = 6371; // raio da Terra em km
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Projeção local (equiretangular) em km - usada para medir distância ponto->reta
function paraXY(p: Coord, ref: Coord) {
  const R = 6371;
  return {
    x: rad(p.lng - ref.lng) * Math.cos(rad(ref.lat)) * R,
    y: rad(p.lat - ref.lat) * R,
  };
}

// Distância (km) de um ponto ao segmento a->b
export function distanciaDaRotaKm(p: Coord, a: Coord, b: Coord): number {
  const P = paraXY(p, a);
  const B = paraXY(b, a);
  const len2 = B.x * B.x + B.y * B.y || 1;
  let t = (P.x * B.x + P.y * B.y) / len2;
  t = Math.max(0, Math.min(1, t)); // limita a projeção ao segmento
  return Math.hypot(P.x - t * B.x, P.y - t * B.y);
}

export interface Avaliacao {
  compat: number;        // 0..100 (nota final)
  scoreHorario: number;  // 0..1
  scoreRota: number;     // 0..1
  diasComuns: DiaSemana[];
  difChegadaMin: number; // diferença de horário de chegada
  desvioKm: number;      // quão fora da rota o passageiro está
}

export interface Resultado extends Avaliacao {
  carona: Carona;
}

// Compatibilidade de horário (0..1): dias em comum + proximidade da chegada
function avaliarHorario(perfil: Perfil, carona: Carona) {
  const diasComuns = perfil.dias.filter((d) => carona.dias.includes(d));
  const fracaoDias = perfil.dias.length === 0 ? 0 : diasComuns.length / perfil.dias.length;
  const difChegadaMin = Math.abs(minutos(perfil.chegada) - minutos(carona.chegada));
  const scoreChegada = clamp01(1 - difChegadaMin / TOLERANCIA_MIN);
  return { diasComuns, difChegadaMin, score: 0.5 * fracaoDias + 0.5 * scoreChegada };
}

// Avalia UMA carona para um perfil e devolve a nota + os detalhes do cálculo
export function avaliar(perfil: Perfil, carona: Carona, destino: Coord): Avaliacao {
  const h = avaliarHorario(perfil, carona);
  const desvioKm = distanciaDaRotaKm(perfil.origem, carona.origem, destino);
  const scoreRota = clamp01(1 - desvioKm / DESVIO_MAX_KM);
  const compat = Math.round(100 * (PESO_HORARIO * h.score + PESO_ROTA * scoreRota));
  return { compat, scoreHorario: h.score, scoreRota, diasComuns: h.diasComuns, difChegadaMin: h.difChegadaMin, desvioKm };
}

// Ranqueia todas as caronas para um perfil (maior compatibilidade primeiro)
export function ranquear(perfil: Perfil, caronas: Carona[], destino: Coord): Resultado[] {
  return caronas
    .map((carona) => ({ carona, ...avaliar(perfil, carona, destino) }))
    .sort((a, b) => b.compat - a.compat);
}
