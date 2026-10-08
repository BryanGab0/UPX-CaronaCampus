import { useEffect, useState } from "react";
import { buscarUsuarios } from "../lib/api";
import type { UsuarioAdmin } from "../lib/api";
import { Carregando, ErroCarga } from "./Estado";

const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export function Usuarios() {
  const [lista, setLista] = useState<UsuarioAdmin[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    buscarUsuarios().then(setLista).catch((e) => setErro(e instanceof Error ? e.message : "Falha"));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Usuários</h1>
      <p className="mt-1 text-sm text-sub">{lista ? `${lista.length} cadastrados` : "Carregando…"}</p>

      {erro ? (
        <div className="mt-6"><ErroCarga msg={erro} /></div>
      ) : !lista ? (
        <Carregando />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-sub">
              <tr>
                <th className="px-4 py-3 sm:px-5 font-semibold">RA</th>
                <th className="px-4 py-3 sm:px-5 font-semibold">Nome</th>
                <th className="px-4 py-3 sm:px-5 font-semibold">E-mail</th>
                <th className="px-4 py-3 sm:px-5 font-semibold">Telefone</th>
                <th className="px-4 py-3 sm:px-5 font-semibold">Tipo</th>
                <th className="px-4 py-3 sm:px-5 font-semibold">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.ra} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 sm:px-5 font-mono text-xs">{u.ra}</td>
                  <td className="px-4 py-3 sm:px-5 font-semibold">{u.nome}</td>
                  <td className="px-4 py-3 sm:px-5 text-sub">{u.email}</td>
                  <td className="px-4 py-3 sm:px-5 text-sub">{u.telefone ?? "—"}</td>
                  <td className="px-4 py-3 sm:px-5">
                    {u.admin ? (
                      <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">admin</span>
                    ) : (
                      <span className="text-xs text-sub">aluno</span>
                    )}
                  </td>
                  <td className="px-4 py-3 sm:px-5 text-sub">{data(u.criado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
