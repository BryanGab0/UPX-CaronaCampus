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

// Mostra: você (origem do passageiro), o motorista e a Facens, com a rota do motorista.
export function MapaRota({ voce, motorista, destino }: { voce: Coord; motorista: Coord; destino: Coord }) {
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
    const M: LatLng = [motorista.lat, motorista.lng];
    const F: LatLng = [destino.lat, destino.lng];

    let rota = L.polyline([M, F], { color: "#2F4BFF", weight: 4, opacity: 0.45, dashArray: "6 6" }).addTo(map);

    L.marker(V, { icon: pino("#FF7A45", 15) }).addTo(map);
    L.marker(M, { icon: pino("#2F4BFF", 13) }).addTo(map);
    L.marker(F, { icon: pino("#161A22", 16) }).addTo(map);
    map.fitBounds(L.latLngBounds([V, M, F]).pad(0.3));

    buscarRota(M, F).then((r) => {
      if (!ativo || !r) return;
      map.removeLayer(rota);
      rota = L.polyline(r, { color: "#2F4BFF", weight: 4 }).addTo(map);
      map.fitBounds(L.latLngBounds([V, ...r]).pad(0.2));
    });

    return () => { ativo = false; map.remove(); };
  }, [voce.lat, voce.lng, motorista.lat, motorista.lng, destino.lat, destino.lng]);

  return <div ref={ref} role="img" aria-label="Mapa com a sua localização, a do motorista e a rota até a Facens" className="isolate h-52 w-full overflow-hidden rounded-[14px]" />;
}

function pino(cor: string, size: number) {
  return L.divIcon({
    className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${cor};border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35)"></div>`,
  });
}
