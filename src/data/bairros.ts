import type { DiaSemana } from "../types";

// Bairros de Sorocaba disponíveis para a seleção de origem
export const BAIRROS = [
  "Campolim", "Parque Campolim", "Centro", "Jardim Vergueiro",
  "Vila Hortência", "Além Ponte", "Santa Rosália", "Éden",
  "Wanel Ville", "Jardim Simus", "Aparecidinha", "Vila Barão",
] as const;
 
export const DIAS: DiaSemana[] = ["seg", "ter", "qua", "qui", "sex"];
