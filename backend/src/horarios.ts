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

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const hora = (v: unknown) => (typeof v === "string" && HORA.test(v) ? v : null);

// Confere o que veio do app: só dias de seg a sex, horas no formato HH:MM e cada dia com pelo
// menos a ida ou a volta. Devolve os horários limpos (só as chaves conhecidas) ou null se inválidos.
export function validarHorarios(v: unknown): Horarios | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const h: Horarios = {};
  for (const [dia, valor] of Object.entries(v)) {
    if (!DIAS.includes(dia as DiaSemana) || !valor || typeof valor !== "object") return null;
    const { ida, volta } = valor as Record<string, unknown>;
    // Vazio vale como "não faz esse sentido"; preenchido precisa ser uma hora válida.
    if ((ida != null && ida !== "" && !hora(ida)) || (volta != null && volta !== "" && !hora(volta))) return null;
    if (!hora(ida) && !hora(volta)) return null;
    h[dia as DiaSemana] = { ida: hora(ida), volta: hora(volta) };
  }
  return Object.keys(h).length > 0 ? h : null;
}

