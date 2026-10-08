export type DiaSemana = "seg" | "ter" | "qua" | "qui" | "sex";
export type Papel = "passageiro" | "motorista";

export interface Coord { lat: number; lng: number; }
export interface Carro { modelo: string; lugares: number; consumo: number; }

// O que o usuário cadastra (com endereço + coordenada real).
export interface Trajeto {
  papel: Papel;
  endereco: string;
  origem: Coord;
  dias: DiaSemana[];
  chegada: string;
  saida: string;
  carro: Carro;
}

// Carona oferecida = um motorista real (id = RA do motorista).
export interface Carona {
  id: string;
  nome: string;
  endereco: string;
  origem: Coord;
  dias: DiaSemana[];
  chegada: string;
  carro: string;
  consumo: number;
}

// Entrada do algoritmo de match.
export interface Perfil {
  origem: Coord;
  chegada: string;
  dias: DiaSemana[];
}
