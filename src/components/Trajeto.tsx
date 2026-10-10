import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { MapPin, CalendarDays, Clock, Car, Users, Navigation, Check, Loader2, LocateFixed } from "lucide-react";
import { cn } from "../lib/cn";
import { usePerfilContext } from "../context/PerfilContext";
import { useAuth } from "../context/AuthContext";
import { Carregando } from "./Estado";
import type { Trajeto as TrajetoType, DiaSemana, Coord } from "../types";

const DIAS: DiaSemana[] = ["seg", "ter", "qua", "qui", "sex"];

// Busca endereços no Nominatim (OpenStreetMap), limitado à região de Sorocaba.
async function buscarEnderecos(q: string): Promise<{ nome: string; coord: Coord }[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=br` +
    `&viewbox=-47.58,-23.58,-47.38,-23.40&bounded=1&q=${encodeURIComponent(q)}`;
  const resp = await fetch(url, { headers: { "Accept-Language": "pt-BR" } });
  if (!resp.ok) return [];
  const dados = await resp.json();
  return (dados as { display_name: string; lat: string; lon: string }[]).map((d) => ({
    nome: d.display_name,
    coord: { lat: Number(d.lat), lng: Number(d.lon) },
  }));
}

// Coordenada -> endereço (para o botão "usar minha localização").
async function enderecoDaCoord(c: Coord): Promise<string> {
  try {
    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${c.lat}&lon=${c.lng}`, {
      headers: { "Accept-Language": "pt-BR" },
    });
    const d = await resp.json();
    return d?.display_name ?? `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`;
  } catch {
    return `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`;
  }
}

export function Trajeto() {
  const { trajeto, pronto } = usePerfilContext();
  const { ra } = useAuth();

  return (
    <div className="animate-rise px-[22px] pb-6 pt-[46px]">
      <h1 className="font-display text-[26px] font-bold tracking-tight">Meu trajeto</h1>
      <p className="mt-1 text-sm text-sub">É com isso que o app encontra caronas compatíveis.</p>

      {/* O formulário só monta com o trajeto já carregado: o estado local nasce dele.
          Antes disso o contexto entrega o trajeto padrão, e salvar sobrescreveria o verdadeiro.
          A key remonta o formulário ao trocar de conta. */}
      {pronto ? <FormTrajeto key={ra} trajeto={trajeto} /> : <Carregando texto="Carregando seu trajeto…" />}
    </div>
  );
}

function FormTrajeto({ trajeto }: { trajeto: TrajetoType }) {
  const { salvar } = usePerfilContext();
  const navigate = useNavigate();

  const [papel, setPapel] = useState(trajeto.papel);
  const [endereco, setEndereco] = useState(trajeto.endereco);
  const [origem, setOrigem] = useState<Coord | null>(trajeto.endereco ? trajeto.origem : null);
  const [dias, setDias] = useState<DiaSemana[]>(trajeto.dias);
  const [chegada, setChegada] = useState(trajeto.chegada);
  const [saida, setSaida] = useState(trajeto.saida);
  const [carro, setCarro] = useState(trajeto.carro);

  const [sugestoes, setSugestoes] = useState<{ nome: string; coord: Coord }[]>([]);
  const [buscandoEnd, setBuscandoEnd] = useState(false);
  const [gpsCarregando, setGpsCarregando] = useState(false);

  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const limpar = () => { setSalvo(false); setErro(null); };
  const toggleDia = (d: DiaSemana) => { limpar(); setDias((ds) => ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]); };

  // Autocomplete com atraso (debounce): a busca só sai quando a pessoa para de digitar,
  // respeitando o limite de ~1 requisição/s do Nominatim.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const buscaAtual = useRef(0); // respostas de buscas antigas são descartadas
  useEffect(() => () => clearTimeout(timer.current), []); // cancela a busca pendente ao sair da tela

  const cancelarBusca = () => {
    clearTimeout(timer.current);
    buscaAtual.current++;
    setBuscandoEnd(false);
  };

  const digitarEndereco = (valor: string) => {
    setEndereco(valor);
    setOrigem(null);
    limpar();
    cancelarBusca();
    if (valor.trim().length < 3) { setSugestoes([]); return; }
    setBuscandoEnd(true);
    const id = buscaAtual.current;
    timer.current = setTimeout(async () => {
      const r = await buscarEnderecos(valor).catch(() => []);
      if (id !== buscaAtual.current) return; // a pessoa já digitou de novo ou escolheu um endereço
      setSugestoes(r);
      setBuscandoEnd(false);
    }, 450);
  };

  const escolher = (s: { nome: string; coord: Coord }) => {
    cancelarBusca();
    setEndereco(s.nome);
    setOrigem(s.coord);
    setSugestoes([]);
    limpar();
  };

  const usarLocalizacao = () => {
    if (!navigator.geolocation) { setErro("Seu navegador não suporta localização."); return; }
    setGpsCarregando(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        cancelarBusca();
        setOrigem(c);
        setEndereco(await enderecoDaCoord(c));
        setSugestoes([]);
        setGpsCarregando(false);
        limpar();
      },
      () => { setErro("Não foi possível obter sua localização."); setGpsCarregando(false); },
    );
  };

  const onSalvar = async () => {
    if (!origem || !endereco.trim()) { setErro("Escolha seu endereço de origem."); return; }
    if (dias.length === 0) { setErro("Selecione ao menos um dia."); return; }
    setSalvando(true); setErro(null);
    try {
      const novo: TrajetoType = { papel, endereco, origem, dias, chegada, saida, carro };
      await salvar(novo);
      setSalvo(true);
    } catch (e) {
      console.error(e);
      setErro("Não foi possível salvar seu trajeto. Verifique sua conexão e tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <Section icone={<Users size={16} />} titulo="Como você vai?">
        <div className="flex gap-2.5">
          <Toggle ativo={papel === "passageiro"} onClick={() => { limpar(); setPapel("passageiro"); }} texto="Preciso de carona" />
          <Toggle ativo={papel === "motorista"} onClick={() => { limpar(); setPapel("motorista"); }} texto="Ofereço carona" />
        </div>
      </Section>

      <Section icone={<MapPin size={16} />} titulo="De onde você sai">
        <div className="relative">
          <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-3 transition focus-within:border-brand">
            <MapPin size={18} className="shrink-0 text-sub" />
            <input
              value={endereco}
              onChange={(e) => digitarEndereco(e.target.value)}
              placeholder="Digite seu endereço (rua, número, bairro)"
              aria-label="Endereço de saída"
              autoComplete="street-address"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            {buscandoEnd && <Loader2 size={16} className="shrink-0 animate-spin text-sub" />}
          </div>

          {sugestoes.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-line bg-surface shadow-lg">
              {sugestoes.map((s, i) => (
                <button key={i} onClick={() => escolher(s)}
                  className="block w-full border-b border-line px-3.5 py-2.5 text-left text-xs last:border-0 hover:bg-canvas">
                  {s.nome}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={usarLocalizacao} disabled={gpsCarregando}
          className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand">
          {gpsCarregando ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
          usar minha localização atual
        </button>

        {origem && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-good-ink"><Check size={13} /> endereço definido</p>
        )}
        <p className="mt-1 flex items-center gap-1.5 text-xs text-sub"><Navigation size={13} /> destino fixo: Facens (Sorocaba)</p>
      </Section>

      <Section icone={<CalendarDays size={16} />} titulo="Dias de aula">
        <div className="grid grid-cols-5 gap-1.5 min-[360px]:gap-2">
          {DIAS.map((d) => <Chip key={d} ativo={dias.includes(d)} onClick={() => toggleDia(d)} texto={d} />)}
        </div>
      </Section>

      <Section icone={<Clock size={16} />} titulo="Horários">
        <div className="flex gap-3">
          <TimeField label="Chego às" value={chegada} onChange={(v) => { limpar(); setChegada(v); }} />
          <TimeField label="Saio às" value={saida} onChange={(v) => { limpar(); setSaida(v); }} />
        </div>
      </Section>

      {papel === "motorista" && (
        <Section icone={<Car size={16} />} titulo="Seu carro">
          <input value={carro.modelo} onChange={(e) => { limpar(); setCarro({ ...carro, modelo: e.target.value }); }}
            placeholder="Modelo do carro" className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-sm outline-none focus:border-brand" />
          <div className="mt-2.5 flex gap-3">
            <NumberField label="Lugares" value={carro.lugares} onChange={(v) => { limpar(); setCarro({ ...carro, lugares: v }); }} />
            <NumberField label="km / litro" value={carro.consumo} onChange={(v) => { limpar(); setCarro({ ...carro, consumo: v }); }} />
          </div>
        </Section>
      )}

      {salvo ? (
        <div className="mt-6 rounded-[14px] bg-good-soft p-4">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-good-ink"><Check size={18} /> Trajeto salvo!</div>
          <button onClick={() => navigate("/")} className="mt-2 w-full text-center text-xs font-semibold text-good-ink">ver caronas</button>
        </div>
      ) : (
        <>
          {erro && <p role="alert" className="mt-6 text-[13px] text-accent-ink">{erro}</p>}
          <button onClick={onSalvar} disabled={salvando}
            className={cn("w-full rounded-[14px] bg-brand py-4 text-sm font-bold text-white transition active:scale-[.98]", erro ? "mt-3" : "mt-6")}>
            {salvando ? "Salvando…" : "Salvar trajeto"}
          </button>
        </>
      )}
    </>
  );
}

function Section({ icone, titulo, children }: { icone: ReactNode; titulo: string; children: ReactNode }) {
  return (
    <div className="mt-3 rounded-[18px] border border-line bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold"><span className="text-brand">{icone}</span>{titulo}</div>
      {children}
    </div>
  );
}
function Toggle({ ativo, onClick, texto }: { ativo: boolean; onClick: () => void; texto: string }) {
  return <button onClick={onClick} aria-pressed={ativo} className={cn("flex-1 rounded-[13px] border px-2.5 py-3 text-[13.5px] font-semibold transition active:scale-[.98]", ativo ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface text-sub")}>{texto}</button>;
}
function Chip({ ativo, onClick, texto }: { ativo: boolean; onClick: () => void; texto: string }) {
  return <button onClick={onClick} aria-pressed={ativo} className={cn("rounded-[11px] border py-2 text-center text-[13px] font-semibold transition active:scale-[.98]", ativo ? "border-brand bg-brand text-white" : "border-line bg-surface text-sub")}>{texto}</button>;
}
function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="min-w-0 flex-1"><span className="text-xs font-semibold text-sub">{label}</span><input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-sm outline-none focus:border-brand" /></label>;
}
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return <label className="min-w-0 flex-1"><span className="text-xs font-semibold text-sub">{label}</span><input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-sm outline-none focus:border-brand" /></label>;
}
