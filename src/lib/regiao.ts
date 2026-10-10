// Bairro e cidade a partir dos detalhes de endereço do Nominatim (OpenStreetMap). É o que os
// outros alunos veem do motorista no lugar da rua: o endereço completo fica só com o dono.
export interface Regiao { bairro: string | null; cidade: string | null; }

// Campos do "address" do Nominatim, do mais específico ao mais amplo (em Sorocaba, os bairros
// costumam vir em "suburb"; condomínios e loteamentos, em "residential" ou "neighbourhood").
type EnderecoNominatim = Partial<Record<
  "suburb" | "neighbourhood" | "quarter" | "city_district" | "residential" | "city" | "town" | "municipality" | "village",
  string
>>;

export function regiaoDoEndereco(a: EnderecoNominatim | null | undefined): Regiao {
  if (!a) return { bairro: null, cidade: null };
  const cidade = a.city ?? a.town ?? a.municipality ?? a.village ?? null;
  const bairro = a.suburb ?? a.neighbourhood ?? a.quarter ?? a.residential ?? a.city_district ?? null;
  // Em Sorocaba o city_district costuma repetir a cidade: aí não é bairro.
  return { bairro: bairro && bairro !== cidade ? bairro : null, cidade };
}
