import type { Coord } from "../types";

const W = 300;
const H = 200;
const PAD = 34;

// Mapa estilizado. Projeta lat/lng em x/y ajustando os 3 pontos na área visível
// (coordenadas aproximadas)
export function MapaRota({ origem, ponto, destino }: { origem: Coord; ponto: Coord; destino: Coord }) {
  const pts = [origem, ponto, destino];
  const minLat = Math.min(...pts.map((p) => p.lat));
  const maxLat = Math.max(...pts.map((p) => p.lat));
  const minLng = Math.min(...pts.map((p) => p.lng));
  const maxLng = Math.max(...pts.map((p) => p.lng));
 
  const project = (p: Coord) => ({
    x: PAD + (maxLng === minLng ? 0.5 : (p.lng - minLng) / (maxLng - minLng)) * (W - 2 * PAD),
    y: PAD + (maxLat === minLat ? 0.5 : (maxLat - p.lat) / (maxLat - minLat)) * (H - 2 * PAD),
  });
 
  const a = project(origem);  // casa
  const b = project(ponto);   // ponto de encontro
  const c = project(destino); // UniFacens

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-[14px] bg-canvas">
      {/* grade sutil para dar textura de mapa */}
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={"h" + i} x1={0} y1={(H / 5) * i} x2={W} y2={(H / 5) * i} className="stroke-line" strokeWidth="1" />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <line key={"v" + i} x1={(W / 7) * i} y1={0} x2={(W / 7) * i} y2={H} className="stroke-line" strokeWidth="1" />
      ))}
 
      {/* trajeto de carro: ponto de encontro -> UniFacens */}
      <path d={`M ${b.x} ${b.y} L ${c.x} ${c.y}`} className="stroke-brand" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* caminhada: casa -> ponto de encontro (tracejado) */}
      <path d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} className="stroke-accent" strokeWidth="2.5" strokeDasharray="2 5" fill="none" strokeLinecap="round" />
 
      {/* marcadores */}
      <Marcador x={a.x} y={a.y} className="fill-accent" />
      <Marcador x={b.x} y={b.y} className="fill-accent" grande />
      <Marcador x={c.x} y={c.y} className="fill-ink" grande />
    </svg>
  );
}

function Marcador({ x, y, className, grande }: { x: number; y: number; className: string; grande?: boolean }) {
  const r = grande ? 7 : 5;
  return (
    <g>
      <circle cx={x} cy={y} r={r + 3} className={className} opacity={0.18} />
      <circle cx={x} cy={y} r={r} className={className} />
    </g>
  );
}
