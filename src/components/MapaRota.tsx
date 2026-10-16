import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coord } from "../types";

type LatLng = [number, number];

async function buscarRota(a: LatLng, b: LatLng): Promise<LatLng[] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/` +
      `${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates as LatLng[] | undefined;
    if (!coords) return null;
    return coords.map(([lng, lat]) => [lat, lng] as LatLng);
  } catch {
    return null;
  }
}

// Raio do círculo da região do motorista: cobre a célula de ~1 km em que a API encaixa a casa dele.
const RAIO_REGIAO_M = 800;

// Mostra: você (origem do passageiro), a REGIÃO do motorista (a API manda só o centro de uma área
// de ~1 km, nunca a casa) e a Facens, com uma rota aproximada saindo do centro da região.
export function MapaRota({ voce, regiaoMotorista, destino }: { voce: Coord; regiaoMotorista: Coord; destino: Coord }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let ativo = true;
    // O mapa fica dentro de uma tela que rola: no celular, arrastar com 1 dedo
    // rolaria o mapa em vez da página, e no desktop a roda do mouse dava zoom.
    // Zoom continua funcionando com pinça (toque) e duplo clique.
    const map = L.map(ref.current, {
      zoomControl: false,
      dragging: !L.Browser.mobile,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap", maxZoom: 19,
    }).addTo(map);

    const V: LatLng = [voce.lat, voce.lng];
    const M: LatLng = [regiaoMotorista.lat, regiaoMotorista.lng];
    const F: LatLng = [destino.lat, destino.lng];

    // Cores pelas classes (tokens do tema): o CSS vence os atributos SVG que o Leaflet grava,
    // então o mapa acompanha a troca de tema sem ser recriado.
    let rota = L.polyline([M, F], { className: "stroke-brand", weight: 4, opacity: 0.45, dashArray: "6 6" }).addTo(map);

    L.marker(V, { icon: pino("bg-accent", 15) }).addTo(map);
    L.circle(M, { radius: RAIO_REGIAO_M, className: "stroke-brand fill-brand", weight: 2, fillOpacity: 0.15 }).addTo(map);
    L.marker(F, { icon: pino("bg-ink", 16) }).addTo(map);
    // Área do círculo calculada pela coordenada: o getBounds() do círculo só funciona com o mapa já posicionado.
    const areaRegiao = L.latLng(M).toBounds(RAIO_REGIAO_M * 2);
    map.fitBounds(L.latLngBounds([V, F]).extend(areaRegiao).pad(0.3));

    buscarRota(M, F).then((r) => {
      if (!ativo || !r) return;
      map.removeLayer(rota);
      rota = L.polyline(r, { className: "stroke-brand", weight: 4 }).addTo(map);
      map.fitBounds(L.latLngBounds([V, ...r]).extend(areaRegiao).pad(0.2));
    });

    return () => { ativo = false; map.remove(); };
  }, [voce.lat, voce.lng, regiaoMotorista.lat, regiaoMotorista.lng, destino.lat, destino.lng]);

  return <div ref={ref} role="img" aria-label="Mapa com a sua localização, a região aproximada do motorista e a rota até a Facens" className="isolate h-52 w-full overflow-hidden rounded-[14px]" />;
}

// O próprio elemento do ícone é o pino (o Leaflet dá o tamanho pelo iconSize).
function pino(cor: "bg-accent" | "bg-ink", size: number) {
  return L.divIcon({
    className: `rounded-full border-3 border-surface shadow-md ${cor}`, iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}
