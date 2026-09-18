// Dados fixos só para desenvolver a interface.
import type { Usuario, Stat, MelhorCarona, Carona } from "../types";

export const usuario: Usuario = {
  nome: "Ana",
  origem: "Campolim",
  destino: "UniFacens",
};

export const stats: Stat[] = [
  { icone: "wallet", valor: "R$ 214", label: "economia no mês" },
  { icone: "leaf", valor: "38 kg", label: "CO₂ evitado" },
  { icone: "car", valor: "16", label: "caronas dadas" },
];

export const melhor: MelhorCarona = {
  nome: "Marina Alves",
  bairro: "Parque Campolim",
  carro: "Chevrolet Onix",
  chegada: "08:00",
  ponto: "Shopping Iguatemi Esplanada",
  caminhada: "320 m",
  custoDia: "8,10",
  compat: 92,
};

export const outras: Carona[] = [
  { nome: "Rafael Costa", bairro: "Jardim Vergueiro", chegada: "07:45", custoDia: "9,40", compat: 78 },
  { nome: "Lucas Pereira", bairro: "Vila Hortência", chegada: "08:15", custoDia: "6,90", compat: 64 },
  { nome: "Camila Rocha", bairro: "Éden", chegada: "08:00", custoDia: "7,20", compat: 58 },
];
