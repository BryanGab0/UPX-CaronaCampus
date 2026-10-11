import { describe, it, expect } from "vitest";
import { diasDe, horarioUnico, trechosDe, resumoHorario, textoHorario } from "./horarios";

describe("diasDe", () => {
  it("lista os dias com horário, de seg a sex", () => {
    expect(diasDe({ sex: { ida: "08:00", volta: null }, seg: { ida: null, volta: "18:00" } })).toEqual(["seg", "sex"]);
  });
});

describe("horarioUnico", () => {
  it("devolve o horário quando todos os dias são iguais", () => {
    const dia = { ida: "08:00", volta: null };
    expect(horarioUnico({ seg: dia, qua: { ...dia } })).toEqual(dia);
  });
  it("é null quando algum dia difere (na ida ou na volta) ou sem dias", () => {
    expect(horarioUnico({ seg: { ida: "08:00", volta: "18:00" }, qua: { ida: "08:00", volta: null } })).toBeNull();
    expect(horarioUnico({ seg: { ida: "08:00", volta: "18:00" }, qua: { ida: "10:00", volta: "18:00" } })).toBeNull();
    expect(horarioUnico({})).toBeNull();
  });
});

describe("trechosDe", () => {
  it("lista cada ida e cada volta de seg a sex, pulando os sentidos vazios", () => {
    expect(trechosDe({ qua: { ida: null, volta: "17:00" }, seg: { ida: "08:00", volta: "18:00" } })).toEqual([
      { dia: "seg", sentido: "ida", hora: "08:00" },
      { dia: "seg", sentido: "volta", hora: "18:00" },
      { dia: "qua", sentido: "volta", hora: "17:00" },
    ]);
  });
});

describe("resumoHorario / textoHorario", () => {
  const motorista = { seg: { ida: "08:00", volta: "18:00" }, qua: { ida: "10:00", volta: "18:00" } };

  it("usa a ida dos trechos em comum", () => {
    const r = resumoHorario(motorista, [{ dia: "seg", sentido: "ida" }, { dia: "seg", sentido: "volta" }]);
    expect(textoHorario(r)).toBe("chega 08:00");
  });
  it("sem ida em comum, mostra a volta e fica depois na ordenação", () => {
    const r = resumoHorario(motorista, [{ dia: "qua", sentido: "volta" }]);
    expect(textoHorario(r)).toBe("sai 18:00");
    expect(r!.minutos).toBeGreaterThan(resumoHorario(motorista, [{ dia: "qua", sentido: "ida" }])!.minutos);
  });
  it("horário que muda entre os dias: 'horários variam', ordenando pelo mais cedo", () => {
    const r = resumoHorario(motorista, []); // nada em comum: todos os trechos do motorista
    expect(textoHorario(r)).toBe("horários variam");
    expect(r!.minutos).toBe(8 * 60);
  });
});
