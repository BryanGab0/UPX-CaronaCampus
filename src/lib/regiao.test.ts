import { describe, it, expect } from "vitest";
import { regiaoDoEndereco } from "./regiao";

describe("regiaoDoEndereco", () => {
  it("usa o bairro (suburb) e a cidade, nunca a rua nem o CEP", () => {
    const r = regiaoDoEndereco({ suburb: "Jardim São Guilherme I", city: "Sorocaba", road: "Rua X", postcode: "18074-640" } as never);
    expect(r).toEqual({ bairro: "Jardim São Guilherme I", cidade: "Sorocaba" });
  });

  it("cai para campos mais amplos quando não há suburb", () => {
    expect(regiaoDoEndereco({ neighbourhood: "Vila A", town: "Votorantim" })).toEqual({ bairro: "Vila A", cidade: "Votorantim" });
    expect(regiaoDoEndereco({ residential: "Condomínio B", municipality: "Sorocaba" })).toEqual({ bairro: "Condomínio B", cidade: "Sorocaba" });
  });

  it("descarta o \"bairro\" que só repete a cidade (city_district em Sorocaba)", () => {
    expect(regiaoDoEndereco({ city_district: "Sorocaba", city: "Sorocaba" })).toEqual({ bairro: null, cidade: "Sorocaba" });
    expect(regiaoDoEndereco({ suburb: "Alto da Boa Vista", city_district: "Sorocaba", city: "Sorocaba" }))
      .toEqual({ bairro: "Alto da Boa Vista", cidade: "Sorocaba" });
  });

  it("sem detalhes, devolve tudo vazio", () => {
    expect(regiaoDoEndereco(undefined)).toEqual({ bairro: null, cidade: null });
    expect(regiaoDoEndereco({})).toEqual({ bairro: null, cidade: null });
  });
});
