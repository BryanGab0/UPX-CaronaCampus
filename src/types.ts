export type TabId = "inicio" | "buscar" | "trajeto" | "perfil";

export interface Usuario {
  nome: string;
  origem: string;   // bairro de origem
  destino: string;  // campus
}

export type IconeStat = "wallet" | "leaf" | "car";

export interface Stat {
  icone: IconeStat;
  valor: string;
  label: string;
}

export interface Carona {
  nome: string;
  bairro: string;
  chegada: string;   // "HH:MM"
  custoDia: string;  // valor formatado, ex: "6,90"
  compat: number;    // 0..100 (resultado do algoritmo de match)
}

export interface MelhorCarona extends Carona {
  carro: string;
  ponto: string;      // ponto de encontro sugerido
  caminhada: string;  // distância a pé até o ponto
}
