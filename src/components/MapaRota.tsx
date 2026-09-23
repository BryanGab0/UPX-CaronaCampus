import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coord } from "../types";
 
type LatLng = [number, number];
 
// Busca a rota de carro (pelas ruas) entre dois pontos, via OSRM (gratuito, sem chave).
// Devolve a lista de coordenadas do trajeto, ou null se falhar.
async function buscarRota(a: LatLng, b: LatLng): Promise<LatLng[] | null> {
  try {
    // OSRM espera lng,lat na URL; a resposta (GeoJSON) também é [lng, lat].
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates as LatLng[] | undefined;
    if (!coords) return null;
    return coords.map(([lng, lat]) => [lat, lng] as LatLng); // converte para [lat, lng] do Leaflet
  } catch {
    return null;
  }
}
 
// Mapa real (Leaflet + OpenStreetMap): origem -> ponto de encontro -> Facens.
export function MapaRota({ origem, ponto, destino }: { origem: Coord; ponto: Coord; destino: Coord }) {
  const ref = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    if (!ref.current) return;
    let ativo = true;
 
    const map = L.map(ref.current, { zoomControl: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
 
    const A: LatLng = [origem.lat, origem.lng];   // você
    const P: LatLng = [ponto.lat, ponto.lng];     // ponto de encontro
    const F: LatLng = [destino.lat, destino.lng]; // Facens
 
    // Caminhada (você -> ponto): linha reta tracejada.
    L.polyline([A, P], { color: "#FF7A45", weight: 3, dashArray: "4 6" }).addTo(map);
 
    // Trajeto de carro (ponto -> Facens): começa como reta provisória (fallback)
    // e é substituído pela rota real quando o OSRM responde.
    let linhaCarro = L.polyline([P, F], { color: "#2F4BFF", weight: 4, opacity: 0.45, dashArray: "6 6" }).addTo(map);
 
    L.marker(A, { icon: pino("#FF7A45", 13) }).addTo(map);
    L.marker(P, { icon: pinoPonto() }).addTo(map);
    L.marker(F, { icon: pino("#161A22", 16) }).addTo(map);
 
    map.fitBounds(L.latLngBounds([A, P, F]).pad(0.35));
 
    // Tenta a rota real pelas ruas; se falhar, mantém a reta provisória.
    buscarRota(P, F).then((rota) => {
      if (!ativo || !rota) return;
      map.removeLayer(linhaCarro);
      linhaCarro = L.polyline(rota, { color: "#2F4BFF", weight: 4 }).addTo(map);
      map.fitBounds(L.latLngBounds([A, ...rota]).pad(0.2));
    });
 
    return () => { ativo = false; map.remove(); };
  }, [origem.lat, origem.lng, ponto.lat, ponto.lng, destino.lat, destino.lng]);
 
  return <div ref={ref} className="h-52 w-full overflow-hidden rounded-[14px]" />;
}
 
function pino(cor: string, size: number) {
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${cor};border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35)"></div>`,
  });
}
 
function pinoPonto() {
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div style="width:22px;height:22px;border-radius:50%;background:#FF7A45;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center"><div style="width:7px;height:7px;border-radius:50%;background:#fff"></div></div>`,
  });
}
