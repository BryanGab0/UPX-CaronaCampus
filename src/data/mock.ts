// Dados fixos só para desenvolver a interface
import type { Coord, Stat } from "../types";
 
// Destino fixo de todos os trajetos.
export const FACENS: Coord = { lat: -23.594, lng: -47.526 };
 
export const stats: Stat[] = [
  { icone: "wallet", valor: "R$ 214", label: "economia no mês" },
  { icone: "leaf", valor: "38 kg", label: "CO₂ evitado" },
  { icone: "car", valor: "16", label: "caronas dadas" },
];
