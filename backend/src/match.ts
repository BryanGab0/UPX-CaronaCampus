// Algoritmo de compatibilidade entre passageiro e motorista. Roda na API para que a coordenada
// exata da casa do motorista nunca saia do servidor: o aluno recebe só a nota, o detalhamento
// (com distâncias arredondadas) e uma região aproximada.

import { trechosDe } from "./horarios.js";
import type { DiaSemana, Horarios, Sentido } from "./horarios.js";

export const TOLERANCIA_MIN = 45;   // diferença de horário (min) que ainda pontua
export const DESVIO_MAX_KM = 8;     // desvio da rota (km) que ainda pontua
export const PESO_HORARIO = 0.55;
export const PESO_ROTA = 0.45;
export const PRECO_LITRO = 6.09;    // R$/litro (gasolina)

// Privacidade: distâncias em passos de 0,5 km antes de entrar na nota e no combustível. Sem isso,
// quem mudasse o próprio trajeto várias vezes e comparasse os números poderia triangular a casa.
export const PASSO_KM = 0.5;
// Região aproximada: a coordenada é encaixada numa grade de 0,01° (~1 km). É fixa por motorista;
// um deslocamento sorteado a cada requisição poderia ser desfeito tirando a média.
export const GRADE_GRAUS = 0.01;

export const FACENS: Coord = { lat: -23.47097531229756, lng: -47.42845107751073 };

export interface Coord { lat: number; lng: number; }

// O que o algoritmo precisa de cada lado (a origem do motorista é a exata, só usada aqui dentro).
export interface PerfilPassageiro { origem: Coord; horarios: Horarios; }
export interface PerfilMotorista { origem: Coord; horarios: Horarios; consumo: number; }

// Trecho do passageiro que o motorista também faz (mesmo dia e sentido) e a diferença de horário.
export interface TrechoComum { dia: DiaSemana; sentido: Sentido; difMin: number; }

export interface Avaliacao {
  compat: number;
  scoreHorario: number;
  scoreRota: number;
  trechosComuns: TrechoComum[];
  totalTrechos: number;   // trechos do passageiro na semana
  desvioKm: number;       // arredondado (PASSO_KM)
  litrosTrecho: number;   // combustível do motorista numa viagem casa ↔ Facens (distância arredondada)
  custoTrecho: number;    // R$ por viagem, parte do passageiro (estimado)
}

const rad = (d: number) => (d * Math.PI) / 180;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const minutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const arredondarKm = (km: number) => Math.round(km / PASSO_KM) * PASSO_KM;

export function haversineKm(a: Coord, b: Coord): number {
  const R = 6371;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function paraXY(p: Coord, ref: Coord) {
  const R = 6371;
  return { x: rad(p.lng - ref.lng) * Math.cos(rad(ref.lat)) * R, y: rad(p.lat - ref.lat) * R };
}

// Distância do ponto p ao segmento a → b (projeção local, boa para poucos km).
export function distanciaDaRotaKm(p: Coord, a: Coord, b: Coord): number {
  const P = paraXY(p, a);
  const B = paraXY(b, a);
  const len2 = B.x * B.x + B.y * B.y || 1;
  let t = (P.x * B.x + P.y * B.y) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(P.x - t * B.x, P.y - t * B.y);
}

// Centro da célula da grade em que a coordenada cai: o mesmo para toda a vizinhança (~1 km).
export function regiaoAproximada(c: Coord): Coord {
  const centro = (v: number) => Number(((Math.floor(v / GRADE_GRAUS) + 0.5) * GRADE_GRAUS).toFixed(4));
  return { lat: centro(c.lat), lng: centro(c.lng) };
}

// Litros gastos numa viagem do motorista (casa → Facens ou a volta; linha reta, distância arredondada).
export function litrosTrecho(origem: Coord, destino: Coord, consumo: number): number {
  const km = arredondarKm(haversineKm(origem, destino));
  return km / (consumo > 0 ? consumo : 12);
}

// Média, entre os trechos do passageiro, da proximidade de horário. O trecho que o motorista não
// faz (outro dia ou outro sentido) vale 0: assim dias e horários entram numa conta só.
function avaliarHorario(p: PerfilPassageiro, m: PerfilMotorista) {
  const trechos = trechosDe(p.horarios);
  const trechosComuns: TrechoComum[] = [];
  let soma = 0;
  for (const t of trechos) {
    const hora = m.horarios[t.dia]?.[t.sentido];
    if (!hora) continue;
    const difMin = Math.abs(minutos(t.hora) - minutos(hora));
    trechosComuns.push({ dia: t.dia, sentido: t.sentido, difMin });
    soma += clamp01(1 - difMin / TOLERANCIA_MIN);
  }
  const score = trechos.length === 0 ? 0 : soma / trechos.length;
  return { trechosComuns, totalTrechos: trechos.length, score };
}

export function avaliar(p: PerfilPassageiro, m: PerfilMotorista, destino: Coord = FACENS): Avaliacao {
  const h = avaliarHorario(p, m);
  const desvioKm = arredondarKm(distanciaDaRotaKm(p.origem, m.origem, destino));
  const scoreRota = clamp01(1 - desvioKm / DESVIO_MAX_KM);
  const compat = Math.round(100 * (PESO_HORARIO * h.score + PESO_ROTA * scoreRota));
  const litros = litrosTrecho(m.origem, destino, m.consumo);
  // Combustível de cada viagem dividido entre 2 (motorista + passageiro).
  const custoTrecho = (litros * PRECO_LITRO) / 2;
  return {
    compat, scoreHorario: h.score, scoreRota, trechosComuns: h.trechosComuns, totalTrechos: h.totalTrechos,
    desvioKm, litrosTrecho: litros, custoTrecho,
  };
}
