// Dados fixos só para desenvolver a interface
import type { Usuario, Stat, Carona, Coord } from "../types";
 
export const FACENS: Coord = { lat: -23.594, lng: -47.526 };
 
export const usuario: Usuario = {
  nome: "Ana",
  origem: "Campolim",
  destino: "Facens",
};
 
export const stats: Stat[] = [
  { icone: "wallet", valor: "R$ 214", label: "economia no mês" },
  { icone: "leaf", valor: "38 kg", label: "CO₂ evitado" },
  { icone: "car", valor: "16", label: "caronas dadas" },
];
 
export const caronas: Carona[] = [
  {
    id: "marina-alves",
    nome: "Marina Alves",
    bairro: "Parque Campolim",
    origem: { lat: -23.523, lng: -47.472 },
    carro: "Chevrolet Onix",
    chegada: "08:00",
    dias: ["seg", "ter", "qua", "qui", "sex"],
    ponto: { nome: "Shopping Iguatemi Esplanada", lat: -23.545, lng: -47.518, caminhada: "320 m" },
    custoDia: "8,10",
  },
  {
    id: "rafael-costa",
    nome: "Rafael Costa",
    bairro: "Jardim Vergueiro",
    origem: { lat: -23.478, lng: -47.448 },
    carro: "Hyundai HB20",
    chegada: "07:45",
    dias: ["seg", "qua", "sex"],
    ponto: { nome: "Shopping Cidade Sorocaba", lat: -23.512, lng: -47.466, caminhada: "450 m" },
    custoDia: "9,40",
  },
  {
    id: "lucas-pereira",
    nome: "Lucas Pereira",
    bairro: "Vila Hortência",
    origem: { lat: -23.492, lng: -47.478 },
    carro: "Renault Kwid",
    chegada: "08:15",
    dias: ["seg", "ter", "qua", "qui", "sex"],
    ponto: { nome: "Terminal Santo Antônio", lat: -23.506, lng: -47.458, caminhada: "600 m" },
    custoDia: "6,90",
  },
  {
    id: "camila-rocha",
    nome: "Camila Rocha",
    bairro: "Éden",
    origem: { lat: -23.560, lng: -47.575 },
    carro: "Toyota Corolla",
    chegada: "08:00",
    dias: ["seg", "ter", "qua", "qui"],
    ponto: { nome: "Terminal Éden", lat: -23.558, lng: -47.560, caminhada: "700 m" },
    custoDia: "7,20",
  },
];
