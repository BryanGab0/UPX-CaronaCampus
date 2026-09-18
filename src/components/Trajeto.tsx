import { useState } from "react";
import type { ReactNode } from "react";
import { MapPin, CalendarDays, Clock, Car, Users, Navigation, Check } from "lucide-react";
import { cn } from "../lib/cn";
import { BAIRROS, DIAS } from "../data/bairros";
import { usuario } from "../data/mock";
import type { Trajeto as TrajetoType, DiaSemana } from "../types";

// Tela de cadastro de trajeto
export function Trajeto() {
  const [form, setForm] = useState<TrajetoType>({
    papel: "passageiro",
    bairro: usuario.origem,
    dias: ["seg", "ter", "qua", "qui", "sex"],
    chegada: "08:00",
    saida: "18:00",
    carro: { modelo: "", lugares: 4, consumo: 12 },
  });
  const [salvo, setSalvo] = useState(false);

  // Atualiza parte do formulário e some com o aviso de "salvo".
  const set = (patch: Partial<TrajetoType>) => {
    setForm((f) => ({ ...f, ...patch }));
    setSalvo(false);
  };

  // Marca/desmarca um dia da semana
  const toggleDia = (d: DiaSemana) =>
    set({ dias: form.dias.includes(d) ? form.dias.filter((x) => x !== d) : [...form.dias, d] });
 
  const podeSalvar = form.dias.length > 0;

  return (
    <div className="animate-rise px-[22px] pb-6 pt-[46px]">
      <h1 className="font-display text-[26px] font-bold tracking-tight">Meu trajeto</h1>
      <p className="mt-1 text-sm text-sub">É com isso que o app encontra caronas compatíveis.</p>
 
      {/* Papel */}
      <Section icone={<Users size={16} />} titulo="Como você vai?">
        <div className="flex gap-2.5">
          <Toggle ativo={form.papel === "passageiro"} onClick={() => set({ papel: "passageiro" })} texto="Preciso de carona" />
          <Toggle ativo={form.papel === "motorista"} onClick={() => set({ papel: "motorista" })} texto="Ofereço carona" />
        </div>
      </Section>
 
      {/* Origem */}
      <Section icone={<MapPin size={16} />} titulo="De onde você sai">
        <div className="flex flex-wrap gap-2">
          {BAIRROS.map((b) => (
            <Chip key={b} ativo={form.bairro === b} onClick={() => set({ bairro: b })} texto={b} />
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-sub">
          <Navigation size={13} /> destino fixo: Facens (Sorocaba)
        </p>
      </Section>
 
      {/* Dias */}
      <Section icone={<CalendarDays size={16} />} titulo="Dias de aula">
        <div className="flex gap-2">
          {DIAS.map((d) => (
            <Chip key={d} ativo={form.dias.includes(d)} onClick={() => toggleDia(d)} texto={d} />
          ))}
        </div>
      </Section>
 
      {/* Horários */}
      <Section icone={<Clock size={16} />} titulo="Horários">
        <div className="flex gap-3">
          <TimeField label="Chego às" value={form.chegada} onChange={(v) => set({ chegada: v })} />
          <TimeField label="Saio às" value={form.saida} onChange={(v) => set({ saida: v })} />
        </div>
      </Section>
 
      {/* Carro — só aparece para quem oferece carona */}
      {form.papel === "motorista" && (
        <Section icone={<Car size={16} />} titulo="Seu carro">
          <input
            value={form.carro.modelo}
            onChange={(e) => set({ carro: { ...form.carro, modelo: e.target.value } })}
            placeholder="Modelo do carro"
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-sm outline-none focus:border-brand"
          />
          <div className="mt-2.5 flex gap-3">
            <NumberField label="Lugares" value={form.carro.lugares} onChange={(v) => set({ carro: { ...form.carro, lugares: v } })} />
            <NumberField label="km / litro" value={form.carro.consumo} onChange={(v) => set({ carro: { ...form.carro, consumo: v } })} />
          </div>
        </Section>
      )}
 
      {/* Ação */}
      {salvo ? (
        <div className="mt-6 flex items-center justify-center gap-2 rounded-[14px] bg-good-soft py-4 text-sm font-bold text-good">
          <Check size={18} /> Trajeto salvo!
        </div>
      ) : (
        <button
          onClick={() => setSalvo(true)}
          disabled={!podeSalvar}
          className={cn(
            "mt-6 w-full rounded-[14px] py-4 text-sm font-bold transition active:scale-[.98]",
            podeSalvar ? "bg-brand text-white" : "bg-line text-sub",
          )}
        >
          Salvar trajeto
        </button>
      )}
    </div>
  );
}

/* -- Blocos de formulário -- */

// Cartão de uma seção do formulário
function Section({ icone, titulo, children }: { icone: ReactNode; titulo: string; children: ReactNode }) {
  return (
    <div className="mt-3 rounded-[18px] border border-line bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold">
        <span className="text-brand">{icone}</span>
        {titulo}
      </div>
      {children}
    </div>
  );
}

// Botão grande de escolha única (papel).
function Toggle({ ativo, onClick, texto }: { ativo: boolean; onClick: () => void; texto: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-[13px] border px-2.5 py-3 text-[13.5px] font-semibold transition active:scale-[.98]",
        ativo ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface text-sub",
      )}
    >
      {texto}
    </button>
  );
}

// Etiqueta clicável (bairro / dia).
function Chip({ ativo, onClick, texto }: { ativo: boolean; onClick: () => void; texto: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-[11px] border px-3.5 py-2 text-[13px] font-semibold transition active:scale-[.98]",
        ativo ? "border-brand bg-brand text-white" : "border-line bg-surface text-sub",
      )}
    >
      {texto}
    </button>
  );
}

// Campo de horário.
function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex-1">
      <span className="text-xs font-semibold text-sub">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-sm outline-none focus:border-brand"
      />
    </label>
  );
}

// Campo numérico.
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex-1">
      <span className="text-xs font-semibold text-sub">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-sm outline-none focus:border-brand"
      />
    </label>
  );
}
