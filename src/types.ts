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

export interface Coord {
  lat: number;
  lng: number;
}

export interface PontoEncontro extends Coord {
  nome: string;
  caminhada: string; // distância a pé
}

export interface Carona {
  id: string;
  nome: string;
  bairro: string;
  origem: Coord;        // coordenada do bairro (aproximada - protótipo)
  carro: string;
  chegada: string;      // "HH:MM"
  dias: DiaSemana[];
  ponto: PontoEncontro; // ponto de encontro sugerido
  custoDia: string;     // sua parte por dia, ex: "8,10"
}

export interface Perfil {
  origem: Coord;
  chegada: string;
  dias: DiaSemana[];
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
  chegada: string;
  saida: string;
  carro: Carro;
}
