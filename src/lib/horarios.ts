import type { DiaSemana, HorarioDia, Horarios, Sentido } from "../types";

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

export interface Trecho { dia: DiaSemana; sentido: Sentido; hora: string; }

// Cada ida e cada volta da semana, de seg a sex, com a ida antes da volta.
export function trechosDe(h: Horarios): Trecho[] {
  return DIAS.flatMap((dia) =>
    (["ida", "volta"] as const).flatMap((sentido) => {
      const hora = h[dia]?.[sentido];
      return hora ? [{ dia, sentido, hora }] : [];
    }),
  );
}

const minutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// Horário do motorista mostrado no card: a ida (ou, se não houver, a volta) nos trechos em comum
// com você (sem nenhum em comum, em todos os dele). hora = null quando muda de um dia para outro.
// minutos = o mais cedo, para ordenar a lista; quem só faz a volta fica depois de quem faz a ida.
export interface ResumoHorario { sentido: Sentido; hora: string | null; minutos: number; }

export function resumoHorario(h: Horarios, comuns: { dia: DiaSemana; sentido: Sentido }[]): ResumoHorario | null {
  const base = comuns.length > 0 ? comuns : trechosDe(h);
  const sentido: Sentido = base.some((t) => t.sentido === "ida") ? "ida" : "volta";
  const horas = [...new Set(base.filter((t) => t.sentido === sentido).flatMap((t) => h[t.dia]?.[sentido] ?? []))];
  if (horas.length === 0) return null;
  const maisCedo = Math.min(...horas.map(minutos));
  return { sentido, hora: horas.length === 1 ? horas[0] : null, minutos: maisCedo + (sentido === "volta" ? 24 * 60 : 0) };
}

// "chega 08:00", "sai 18:00" ou "horários variam".
export function textoHorario(r: ResumoHorario | null): string {
  if (!r || r.hora === null) return "horários variam";
  return `${r.sentido === "ida" ? "chega" : "sai"} ${r.hora}`;
}
