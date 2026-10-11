import type { DiaSemana, HorarioDia, Horarios } from "../types";

// Horários do trajeto (mesmo formato da API): em cada dia de aula, a ida (chegada na Facens) e a
// volta (saída da Facens) são opcionais, mas o dia precisa de pelo menos uma das duas.
export const DIAS: DiaSemana[] = ["seg", "ter", "qua", "qui", "sex"];

export const diasDe = (h: Horarios): DiaSemana[] => DIAS.filter((d) => h[d]);

// Se todos os dias têm a mesma ida e a mesma volta, devolve esse horário (o formulário abre no
// modo "mesmo horário todos os dias"); senão, null.
export function horarioUnico(h: Horarios): HorarioDia | null {
  const dias = diasDe(h);
  if (dias.length === 0) return null;
  const primeiro = h[dias[0]]!;
  return dias.every((d) => h[d]!.ida === primeiro.ida && h[d]!.volta === primeiro.volta) ? primeiro : null;
}
