import { useEffect, useState } from "react";

export interface AvisoMsg { tipo: "ok" | "erro"; texto: string; }

// Aviso rápido que some sozinho depois de alguns segundos.
export function useAviso(duracaoMs = 3500) {
  const [aviso, setAviso] = useState<AvisoMsg | null>(null);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), duracaoMs);
    return () => clearTimeout(t); // novo aviso reinicia a contagem
  }, [aviso, duracaoMs]);

  const mostrar = (tipo: AvisoMsg["tipo"], texto: string) => setAviso({ tipo, texto });

  return { aviso, mostrar };
}
