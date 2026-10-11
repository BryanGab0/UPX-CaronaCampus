// Horários do trajeto: em cada dia de aula, a ida (chegada na Facens) e a volta (saída da Facens)
// são opcionais, mas o dia precisa de pelo menos uma das duas. Cada par (dia, sentido) é um "trecho".

export type DiaSemana = "seg" | "ter" | "qua" | "qui" | "sex";
export type Sentido = "ida" | "volta";
export interface HorarioDia { ida: string | null; volta: string | null; }
export type Horarios = Partial<Record<DiaSemana, HorarioDia>>;
export interface Trecho { dia: DiaSemana; sentido: Sentido; hora: string; }

export const DIAS: DiaSemana[] = ["seg", "ter", "qua", "qui", "sex"];
export const SENTIDOS: Sentido[] = ["ida", "volta"];

// Trechos em ordem fixa (seg → sex, ida antes da volta), para a resposta ser estável.
export function trechosDe(h: Horarios): Trecho[] {
  const trechos: Trecho[] = [];
  for (const dia of DIAS) {
    for (const sentido of SENTIDOS) {
      const hora = h[dia]?.[sentido];
      if (hora) trechos.push({ dia, sentido, hora });
    }
  }
  return trechos;
}

// Formato antigo (mesma chegada e saída em todos os dias) → horários por dia, com ida e volta.
export function horariosDasColunas(dias: string[], chegada: string, saida: string): Horarios {
  const h: Horarios = {};
  for (const dia of DIAS) if (dias.includes(dia)) h[dia] = { ida: chegada, volta: saida };
  return h;
}
