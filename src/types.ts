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
  // O que os outros alunos veem no lugar da rua (detalhes do Nominatim; vazio em trajetos antigos).
  bairro?: string | null;
  cidade?: string | null;
}

// Carona oferecida = um motorista real (id = RA do motorista).
export interface Carona {
  id: string;
  nome: string;
  endereco: string;    // só bairro e cidade (a rua fica no servidor)
  origem: Coord;       // região aproximada (~1 km), não a casa do motorista
  dias: DiaSemana[];
  chegada: string;
  carro: string;
  consumo: number;
  notaMedia: number | null; // média das avaliações recebidas (null = ainda sem avaliação)
  totalAvaliacoes: number;
  vagas: number;       // vagas para passageiros (sem contar o motorista)
  vagasLivres: number; // vagas − pedidos aceitos (0 = lotado)
}

