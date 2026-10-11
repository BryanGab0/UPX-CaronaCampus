import { describe, it, expect } from "vitest";
import { diasDe, horarioUnico } from "./horarios";

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
