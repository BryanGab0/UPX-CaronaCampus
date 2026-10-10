// Converte a resposta de GET /caronas (já ranqueada e com a nota calculada na API) no formato
// usado pelas telas: { carona, ...avaliação }.
import type { CaronaApi } from "./api";
import type { Resultado } from "./match";

// Sem nota (quem pede ainda não cadastrou trajeto), a carona não entra na lista: as telas
// mostram o convite para cadastrar o trajeto.
export function paraResultados(lista: CaronaApi[]): Resultado[] {
  return lista.flatMap((item) => {
    if (item.compat === null) return [];
    const { compat, scoreHorario, scoreRota, diasComuns, difChegadaMin, desvioKm, litrosDia, custoDia, pesos, ...carona } = item;
    return [{ carona, compat, scoreHorario, scoreRota, diasComuns, difChegadaMin, desvioKm, litrosDia, custoDia, pesos }];
  });
}
