import type { Coord, Trajeto } from "../types";
import type { MinhaSolicitacao, Pedido } from "./api";
import { litrosDia, PRECO_LITRO } from "./match";
import type { Resultado } from "./match";

// Estimativa do impacto das caronas ACEITAS do usuário (módulo puro, sem React).
// Premissas:
// - cada carona aceita tira um carro da rua no trajeto do motorista (ida e volta);
// - o combustível é dividido entre 2, então cada parte economiza a metade;
// - o mês tem SEMANAS_MES semanas, nos dias em que a carona acontece.
export const SEMANAS_MES = 4;
export const CO2_KG_POR_LITRO = 2.3; // queima de 1 L de gasolina (aproximado)

export interface Impacto {
  caronas: number;     // caronas aceitas (como passageiro + como motorista)
  economiaMes: number; // R$ por mês, estimado
  co2Mes: number;      // kg de CO₂ evitado por mês, estimado
}

interface Viagem { litrosDia: number; diasPorSemana: number; }

interface Entrada {
  solicitacoes: MinhaSolicitacao[]; // enviadas como passageiro
  pedidos: Pedido[];                // recebidos como motorista
  resultados: Resultado[];          // motoristas ranqueados pela API (combustível e dias em comum)
  trajeto: Trajeto;                 // trajeto do próprio usuário
  destino: Coord;
}

export function calcularImpacto({ solicitacoes, pedidos, resultados, trajeto, destino }: Entrada): Impacto {
  const viagens: Viagem[] = [];

  // Como passageiro: usa o trajeto do motorista e os dias em comum com ele.
  const aceitasPassageiro = solicitacoes.filter((s) => s.status === "aceita");
  for (const s of aceitasPassageiro) {
    const r = resultados.find((x) => x.carona.id === s.motoristaRa);
    if (r) viagens.push({ litrosDia: r.litrosDia, diasPorSemana: r.diasComuns.length }); // calculado pela API
  }

  // Como motorista: usa o próprio trajeto (o pedido não traz os dias do passageiro).
  const aceitosMotorista = pedidos.filter((p) => p.status === "aceita").length;
  if (trajeto.endereco) {
    const litros = litrosDia(trajeto.origem, destino, trajeto.carro.consumo);
    for (let i = 0; i < aceitosMotorista; i++) viagens.push({ litrosDia: litros, diasPorSemana: trajeto.dias.length });
  }

  let economiaMes = 0;
  let co2Mes = 0;
  for (const v of viagens) {
    const litrosMes = v.litrosDia * v.diasPorSemana * SEMANAS_MES;
    economiaMes += (litrosMes * PRECO_LITRO) / 2;
    co2Mes += litrosMes * CO2_KG_POR_LITRO;
  }

  return { caronas: aceitasPassageiro.length + aceitosMotorista, economiaMes, co2Mes };
}
