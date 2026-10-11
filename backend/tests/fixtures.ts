import { DIAS } from "../src/horarios.js";
import type { DiaSemana, Horarios } from "../src/horarios.js";

// Mesma ida e mesma volta nos dias dados (dados de teste; não depende do banco).
export function horariosIguais(dias: DiaSemana[], ida: string | null, volta: string | null): Horarios {
  return Object.fromEntries(DIAS.filter((d) => dias.includes(d)).map((d) => [d, { ida, volta }]));
}
