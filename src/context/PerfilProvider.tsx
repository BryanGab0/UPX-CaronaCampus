import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { buscarTrajeto, salvarTrajeto } from "../lib/api";
import type { Trajeto } from "../types";
import { PerfilContext } from "./PerfilContext";

const TRAJETO_INICIAL: Trajeto = {
  papel: "passageiro",
  endereco: "",
  origem: { lat: -23.5015, lng: -47.4526 }, // centro de Sorocaba (placeholder até escolher endereço)
  dias: ["seg", "ter", "qua", "qui", "sex"],
  chegada: "08:00",
  saida: "18:00",
  carro: { modelo: "", lugares: 4, consumo: 12 },
};

export function PerfilProvider({ children }: { children: ReactNode }) {
  const { autenticado, ra } = useAuth();
  const [trajeto, setTrajeto] = useState<Trajeto>(TRAJETO_INICIAL);

  useEffect(() => {
    if (!autenticado || !ra) { setTrajeto(TRAJETO_INICIAL); return; }
    buscarTrajeto(ra).then((t) => setTrajeto(t ?? TRAJETO_INICIAL)).catch(() => {});
  }, [autenticado, ra]);

  const salvar = async (t: Trajeto) => {
    if (ra) await salvarTrajeto(ra, t);
    setTrajeto(t);
  };

  return <PerfilContext.Provider value={{ trajeto, salvar }}>{children}</PerfilContext.Provider>;
}
