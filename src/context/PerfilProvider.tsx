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
  // Guarda o trajeto junto com o RA de quem é dono dele. trajeto null = a busca falhou:
  // não há trajeto confiável, e entregar o inicial deixaria salvar por cima do verdadeiro.
  const [carregado, setCarregado] = useState<{ ra: string; trajeto: Trajeto | null } | null>(null);
  const [tentativa, setTentativa] = useState(0); // incrementar refaz a busca

  useEffect(() => {
    if (!autenticado || !ra) return;
    let ativo = true; // evita atualizar estado após trocar de usuário/desmontar
    buscarTrajeto(ra)
      .then((t) => { if (ativo) setCarregado({ ra, trajeto: t ?? TRAJETO_INICIAL }); })
      .catch((e: unknown) => {
        console.error(e);
        if (ativo) setCarregado({ ra, trajeto: null }); // as telas mostram o erro com "tentar novamente"
      });
    return () => { ativo = false; };
  }, [autenticado, ra, tentativa]);

  // Derivado em vez de "zerado" num efeito: ao sair ou trocar de conta, o trajeto
  // guardado não é do RA atual e o valor volta sozinho ao inicial.
  const doRa = autenticado && carregado?.ra === ra ? carregado : null;
  const pronto = doRa?.trajeto != null;
  const erro = doRa !== null && doRa.trajeto === null;
  const trajeto = doRa?.trajeto ?? TRAJETO_INICIAL;

  const salvar = async (t: Trajeto) => {
    if (ra) await salvarTrajeto(ra, t);
    setCarregado({ ra, trajeto: t });
  };

  const recarregar = () => {
    setCarregado(null); // volta a "carregando" enquanto a nova busca não responde
    setTentativa((n) => n + 1);
  };

  return (
    <PerfilContext.Provider value={{ trajeto, pronto, erro, temTrajeto: trajeto.endereco !== "", salvar, recarregar }}>
      {children}
    </PerfilContext.Provider>
  );
}
