import { ranquear } from "../lib/match";
import { caronas, meuPerfil, FACENS } from "./mock";
 
export const resultados = ranquear(meuPerfil, caronas, FACENS);
export const melhor = resultados[0];
export const outras = resultados.slice(1);
