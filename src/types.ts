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

export type DiaSemana = "seg" | "ter" | "qua" | "qui" | "sex";

// Coordenada geográfica (usada no mapa).
export interface Coord {
  lat: number;
  lng: number;
}

// Ponto de encontro sugerido, com sua localização e a caminhada até ele.
export interface PontoEncontro extends Coord {
  nome: string;
  caminhada: string; // distância a pé, ex: "320 m"
}

// Uma carona. O `id` permite abrir a tela de detalhe por URL (/carona/:id)
export interface Carona {
  id: string;
  nome: string;
  bairro: string;
  origem: Coord;        // coordenada do bairro (aproximada — protótipo)
  carro: string;
  chegada: string;      // "HH:MM"
  dias: DiaSemana[];
  ponto: PontoEncontro; // ponto de encontro sugerido
  custoDia: string;     // sua parte por dia, ex: "8,10"
  compat: number;       // 0..100 (resultado do algoritmo de match)
}

/* -- Cadastro de trajeto -- */
export type Papel = "motorista" | "passageiro";
 
export interface Carro {
  modelo: string;
  lugares: number;
  consumo: number; // km por litro
}

// O que o aluno cadastra (fase futura)
export interface Trajeto {
  papel: Papel;
  bairro: string;
  dias: DiaSemana[];
  chegada: string; // "HH:MM"
  saida: string;   // "HH:MM"
  carro: Carro;
}
