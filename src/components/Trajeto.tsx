import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { MapPin, CalendarDays, Clock, Car, Users, Navigation, Check, Loader2, LocateFixed } from "lucide-react";
import { cn } from "../lib/cn";
import { usePerfilContext } from "../context/PerfilContext";
import { useAuth } from "../context/AuthContext";
import { Carregando, ErroCarga } from "./Estado";
import type { Trajeto as TrajetoType, DiaSemana, Coord, HorarioDia, Horarios } from "../types";
import { regiaoDoEndereco } from "../lib/regiao";
import type { Regiao } from "../lib/regiao";
import { VAGAS_MAX, VAGAS_MIN } from "../lib/vagas";
import { DIAS, diasDe, horarioUnico } from "../lib/horarios";

interface Sugestao { nome: string; coord: Coord; regiao: Regiao; }

// No formulário, cada sentido guarda a hora mesmo desmarcado: marcar de novo devolve o valor.
interface Campo { hora: string; ativo: boolean; }
interface DiaForm { ida: Campo; volta: Campo; }

const PADRAO: DiaForm = { ida: { hora: "08:00", ativo: true }, volta: { hora: "18:00", ativo: true } };

const paraForm = (h: HorarioDia | undefined, base: DiaForm): DiaForm => h
  ? { ida: { hora: h.ida ?? base.ida.hora, ativo: h.ida !== null }, volta: { hora: h.volta ?? base.volta.hora, ativo: h.volta !== null } }
  : base;
const paraHorario = (f: DiaForm): HorarioDia => ({
  ida: f.ida.ativo ? f.ida.hora : null,
  volta: f.volta.ativo ? f.volta.hora : null,
});

// O que falta para o dia valer: ao menos um sentido marcado, e todo sentido marcado com a hora.
function problemaDoDia(f: DiaForm, dia: string | null): string | null {
  const onde = dia ? ` de ${dia}` : "";
  if (!f.ida.ativo && !f.volta.ativo) return `Marque a ida ou a volta${onde}.`;
  for (const s of ["ida", "volta"] as const) {
    if (f[s].ativo && !f[s].hora) return `Preencha o horário de ${s}${onde}.`;
  }
  return null;
}

// Busca endereços no Nominatim (OpenStreetMap), limitado à região de Sorocaba, com os detalhes
// (bairro, cidade) de cada um.
async function buscarEnderecos(q: string): Promise<Sugestao[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=br` +
    `&viewbox=-47.58,-23.58,-47.38,-23.40&bounded=1&q=${encodeURIComponent(q)}`;
  const resp = await fetch(url, { headers: { "Accept-Language": "pt-BR" } });
  if (!resp.ok) return [];
  const dados = await resp.json();
  return (dados as { display_name: string; lat: string; lon: string; address?: Record<string, string> }[]).map((d) => ({
    nome: d.display_name,
    coord: { lat: Number(d.lat), lng: Number(d.lon) },
    regiao: regiaoDoEndereco(d.address),
  }));
}

// Coordenada -> endereço e região (botão "usar minha localização" e trajetos antigos sem bairro).
async function enderecoDaCoord(c: Coord): Promise<{ nome: string; regiao: Regiao }> {
  const semNome = `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`;
  try {
    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${c.lat}&lon=${c.lng}`, {
      headers: { "Accept-Language": "pt-BR" },
    });
    const d = await resp.json();
    return { nome: d?.display_name ?? semNome, regiao: regiaoDoEndereco(d?.address) };
  } catch {
    return { nome: semNome, regiao: regiaoDoEndereco(null) };
  }
}

export function Trajeto() {
  const { trajeto, pronto, erro, recarregar } = usePerfilContext();
  const { ra } = useAuth();

  return (
    <div className="animate-rise px-[22px] pb-6 pt-[46px]">
      <h1 className="font-display text-[26px] font-bold tracking-tight">Meu trajeto</h1>
      <p className="mt-1 text-sm text-sub">É com isso que o app encontra caronas compatíveis.</p>

      {/* O formulário só monta com o trajeto já carregado: o estado local nasce dele.
          Antes disso o contexto entrega o trajeto padrão, e salvar sobrescreveria o verdadeiro.
          Se a busca falhou, também não há trajeto confiável: mostra o erro em vez do formulário.
          A key remonta o formulário ao trocar de conta. */}
      {erro ? <ErroCarga titulo="Não foi possível carregar seu trajeto" onTentar={recarregar} />
        : pronto ? <FormTrajeto key={ra} trajeto={trajeto} />
        : <Carregando texto="Carregando seu trajeto…" />}
    </div>
  );
}

function FormTrajeto({ trajeto }: { trajeto: TrajetoType }) {
  const { salvar } = usePerfilContext();
  const navigate = useNavigate();

  const [papel, setPapel] = useState(trajeto.papel);
  const [endereco, setEndereco] = useState(trajeto.endereco);
  const [origem, setOrigem] = useState<Coord | null>(trajeto.endereco ? trajeto.origem : null);
  const [regiao, setRegiao] = useState<Regiao>({ bairro: trajeto.bairro ?? null, cidade: trajeto.cidade ?? null });
  const [dias, setDias] = useState<DiaSemana[]>(diasDe(trajeto.horarios));
  // "Mesmo horário todos os dias": ligado se o trajeto salvo já é assim (ou ainda não tem dias).
  const unicoSalvo = horarioUnico(trajeto.horarios);
  const [igual, setIgual] = useState(unicoSalvo !== null || dias.length === 0);
  const [unico, setUnico] = useState<DiaForm>(() => paraForm(unicoSalvo ?? trajeto.horarios[dias[0]], PADRAO));
  const [porDia, setPorDia] = useState<Record<DiaSemana, DiaForm>>(
    () => Object.fromEntries(DIAS.map((d) => [d, paraForm(trajeto.horarios[d], unico)])) as Record<DiaSemana, DiaForm>,
  );
  const [carro, setCarro] = useState(trajeto.carro);

  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [buscandoEnd, setBuscandoEnd] = useState(false);
  const [gpsCarregando, setGpsCarregando] = useState(false);

  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const limpar = () => { setSalvo(false); setErro(null); };
  // Mantém os dias na ordem da semana (seg → sex), que é a ordem das linhas por dia.
  const toggleDia = (d: DiaSemana) => { limpar(); setDias((ds) => DIAS.filter((x) => (x === d ? !ds.includes(x) : ds.includes(x)))); };

  // Ao separar por dia, cada dia começa com o horário único; ao juntar, vale o do primeiro dia.
  const alternarIgual = () => {
    limpar();
    if (igual) setPorDia(Object.fromEntries(DIAS.map((d) => [d, unico])) as Record<DiaSemana, DiaForm>);
    else if (dias.length > 0) setUnico(porDia[dias[0]]);
    setIgual(!igual);
  };
  const mudarDia = (d: DiaSemana, f: DiaForm) => { limpar(); setPorDia((p) => ({ ...p, [d]: f })); };
  const formDo = (d: DiaSemana) => (igual ? unico : porDia[d]);

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
    setRegiao({ bairro: null, cidade: null });
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

  const escolher = (s: Sugestao) => {
    cancelarBusca();
    setEndereco(s.nome);
    setOrigem(s.coord);
    setRegiao(s.regiao);
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
        const { nome, regiao: r } = await enderecoDaCoord(c);
        setEndereco(nome);
        setRegiao(r);
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
    const problema = igual ? problemaDoDia(unico, null) : dias.map((d) => problemaDoDia(porDia[d], d)).find(Boolean);
    if (problema) { setErro(problema); return; }
    const horarios: Horarios = Object.fromEntries(dias.map((d) => [d, paraHorario(formDo(d))]));
    if (papel === "motorista" && (!Number.isInteger(carro.lugares) || carro.lugares < VAGAS_MIN || carro.lugares > VAGAS_MAX)) {
      setErro(`As vagas devem ser de ${VAGAS_MIN} a ${VAGAS_MAX}.`); return;
    }
    setSalvando(true); setErro(null);
    try {
      // Trajeto antigo, salvo antes de existir o bairro: descobre pela coordenada (1 consulta).
      const r = regiao.bairro || regiao.cidade ? regiao : (await enderecoDaCoord(origem)).regiao;
      const novo: TrajetoType = { papel, endereco, origem, horarios, carro, bairro: r.bairro, cidade: r.cidade };
      await salvar(novo);
      setSalvo(true);
    } catch (e) {
      console.error(e);
      // Mensagem escrita pela API (ex.: vagas abaixo dos passageiros aceitos) ou a genérica.
      setErro(e instanceof Error && !e.message.startsWith("Erro ") ? e.message : "Não foi possível salvar seu trajeto. Verifique sua conexão e tente novamente.");
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
          <div className="flex items-center gap-2.5 rounded-xl border border-line-strong bg-surface px-3.5 py-3 transition focus-within:border-brand">
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
        <button type="button" role="switch" aria-checked={igual} onClick={alternarIgual}
          className="flex w-full items-center justify-between gap-3 text-left text-[13px] font-semibold">
          <span className="min-w-0">Mesmo horário todos os dias</span>
          <span className={cn("relative h-6 w-10 shrink-0 rounded-full transition", igual ? "bg-brand" : "bg-sub")}>
            <span className={cn("absolute top-0.5 size-5 rounded-full bg-surface shadow transition-all", igual ? "left-[18px]" : "left-0.5")} />
          </span>
        </button>

        {igual ? (
          <div className="mt-3 flex gap-3">
            <CampoHorario rotulo="Ida · chego às" nome="ida" campo={unico.ida} onChange={(c) => { limpar(); setUnico({ ...unico, ida: c }); }} />
            <CampoHorario rotulo="Volta · saio às" nome="volta" campo={unico.volta} onChange={(c) => { limpar(); setUnico({ ...unico, volta: c }); }} />
          </div>
        ) : dias.length === 0 ? (
          <p className="mt-3 text-xs text-sub">Selecione os dias de aula acima.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {dias.map((d) => (
              <div key={d} className="flex items-end gap-2">
                <span className="w-7 shrink-0 pb-3.5 text-[13px] font-bold">{d}</span>
                <CampoHorario rotulo="ida" nome={`ida de ${d}`} campo={porDia[d].ida} onChange={(c) => mudarDia(d, { ...porDia[d], ida: c })} />
                <CampoHorario rotulo="volta" nome={`volta de ${d}`} campo={porDia[d].volta} onChange={(c) => mudarDia(d, { ...porDia[d], volta: c })} />
              </div>
            ))}
          </div>
        )}
        <p className="mt-2.5 text-[11.5px] leading-relaxed text-sub">
          Ida: chegada na Facens. Volta: saída da Facens. Desmarque o sentido em que você não precisa (ou não oferece) carona.
        </p>
      </Section>

      {papel === "motorista" && (
        <Section icone={<Car size={16} />} titulo="Seu carro">
          <input value={carro.modelo} onChange={(e) => { limpar(); setCarro({ ...carro, modelo: e.target.value }); }}
            placeholder="Modelo do carro" className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-sm outline-none focus:border-brand" />
          <div className="mt-2.5 flex gap-3">
            <NumberField label="Vagas" value={carro.lugares} min={VAGAS_MIN} max={VAGAS_MAX} onChange={(v) => { limpar(); setCarro({ ...carro, lugares: v }); }} />
            <NumberField label="km / litro" value={carro.consumo} onChange={(v) => { limpar(); setCarro({ ...carro, consumo: v }); }} />
          </div>
          <p className="mt-1.5 text-[11.5px] text-sub">Vagas: lugares livres para passageiros, sem contar você ({VAGAS_MIN} a {VAGAS_MAX}).</p>
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
            className={cn("w-full rounded-[14px] bg-brand py-4 text-sm font-bold text-on-brand transition active:scale-[.98]", erro ? "mt-3" : "mt-6")}>
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
  return <button onClick={onClick} aria-pressed={ativo} className={cn("rounded-[11px] border py-2 text-center text-[13px] font-semibold transition active:scale-[.98]", ativo ? "border-brand bg-brand text-on-brand" : "border-line bg-surface text-sub")}>{texto}</button>;
}
// Sentido da viagem (ida/volta): a caixa diz se a pessoa faz esse sentido; desmarcada, a hora
// fica guardada mas desabilitada.
function CampoHorario({ rotulo, nome, campo, onChange }: { rotulo: string; nome: string; campo: Campo; onChange: (c: Campo) => void }) {
  return (
    <div className="min-w-0 flex-1">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-sub">
        <input type="checkbox" checked={campo.ativo} aria-label={`Incluir ${nome}`}
          onChange={(e) => onChange({ ...campo, ativo: e.target.checked })} className="size-4 shrink-0 accent-brand" />
        <span className="truncate">{rotulo}</span>
      </label>
      <input type="time" value={campo.hora} disabled={!campo.ativo} aria-label={`Horário de ${nome}`}
        onChange={(e) => onChange({ ...campo, hora: e.target.value })}
        className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3 py-3 text-sm outline-none focus:border-brand disabled:opacity-40" />
    </div>
  );
}
function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return <label className="min-w-0 flex-1"><span className="text-xs font-semibold text-sub">{label}</span><input type="number" inputMode="decimal" value={value} min={min} max={max} onChange={(e) => onChange(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-sm outline-none focus:border-brand" /></label>;
}
