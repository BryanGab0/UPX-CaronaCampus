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
  // Guarda o trajeto junto com o RA de quem é dono dele.
  const [carregado, setCarregado] = useState<{ ra: string; trajeto: Trajeto } | null>(null);

  useEffect(() => {
    if (!autenticado || !ra) return;
    let ativo = true; // evita atualizar estado após trocar de usuário/desmontar
    buscarTrajeto(ra)
      .then((t) => { if (ativo) setCarregado({ ra, trajeto: t ?? TRAJETO_INICIAL }); })
      .catch(() => {});
    return () => { ativo = false; };
  }, [autenticado, ra]);

  // Derivado em vez de "zerado" num efeito: ao sair ou trocar de conta, o trajeto
  // guardado não é do RA atual e o valor volta sozinho ao inicial.
  const trajeto = autenticado && carregado?.ra === ra ? carregado.trajeto : TRAJETO_INICIAL;

  const salvar = async (t: Trajeto) => {
    if (ra) await salvarTrajeto(ra, t);
    setCarregado({ ra, trajeto: t });
  };

  return <PerfilContext.Provider value={{ trajeto, salvar }}>{children}</PerfilContext.Provider>;
}
