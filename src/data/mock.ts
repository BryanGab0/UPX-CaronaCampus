// Dados fixos que ainda não vêm da API (destino e estatísticas ilustrativas).
// As caronas agora são buscadas do backend (ver lib/api.ts).
import type { Coord, Stat } from "../types";

// Destino fixo de todos os trajetos.
export const FACENS: Coord = { lat: -23.4703, lng: -47.4294 }; // Facens (Alto da Boa Vista)

export const stats: Stat[] = [
  { icone: "wallet", valor: "R$ 214", label: "economia no mês" },
  { icone: "leaf", valor: "38 kg", label: "CO₂ evitado" },
  { icone: "car", valor: "16", label: "caronas dadas" },
];
