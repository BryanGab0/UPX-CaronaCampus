import type { Coord, DiaSemana } from "../types";
 
export interface Bairro extends Coord {
  nome: string;
}
 
// Bairros de Sorocaba (coordenadas APROXIMADAS — protótipo).
export const BAIRROS: Bairro[] = [
  { nome: "Campolim", lat: -23.520, lng: -47.470 },
  { nome: "Parque Campolim", lat: -23.523, lng: -47.472 },
  { nome: "Centro", lat: -23.502, lng: -47.458 },
  { nome: "Jardim Vergueiro", lat: -23.478, lng: -47.448 },
  { nome: "Vila Hortência", lat: -23.492, lng: -47.478 },
  { nome: "Além Ponte", lat: -23.490, lng: -47.445 },
  { nome: "Santa Rosália", lat: -23.515, lng: -47.440 },
  { nome: "Éden", lat: -23.560, lng: -47.575 },
  { nome: "Wanel Ville", lat: -23.545, lng: -47.490 },
  { nome: "Jardim Simus", lat: -23.535, lng: -47.500 },
  { nome: "Aparecidinha", lat: -23.455, lng: -47.470 },
  { nome: "Vila Barão", lat: -23.508, lng: -47.478 },
];
 
export const DIAS: DiaSemana[] = ["seg", "ter", "qua", "qui", "sex"];
 
// Coordenada de um bairro pelo nome (cai no primeiro se não encontrar).
export function coordDoBairro(nome: string): Coord {
  const b = BAIRROS.find((x) => x.nome === nome) ?? BAIRROS[0];
  return { lat: b.lat, lng: b.lng };
}
