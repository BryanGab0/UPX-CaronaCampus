import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coord } from "../types";
 
// Mapa real (Leaflet + OpenStreetMap). Mostra origem -> ponto de encontro -> Facens.
// O Leaflet é uma biblioteca imperativa; encapsulamos ela num componente React:
// o useEffect cria o mapa ao montar e o destrói ao desmontar (cleanup).
export function MapaRota({ origem, ponto, destino }: { origem: Coord; ponto: Coord; destino: Coord }) {
  const ref = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    if (!ref.current) return;
 
    const map = L.map(ref.current, { zoomControl: false });
 
    // Camada de tiles (o "fundo" do mapa) — OpenStreetMap, gratuito.
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
 
    const A: [number, number] = [origem.lat, origem.lng];   // você
    const P: [number, number] = [ponto.lat, ponto.lng];     // ponto de encontro
    const F: [number, number] = [destino.lat, destino.lng]; // Facens
 
    // Caminhada (você -> ponto), tracejada; trajeto de carro (ponto -> Facens), sólido.
    L.polyline([A, P], { color: "#FF7A45", weight: 3, dashArray: "4 6" }).addTo(map);
    L.polyline([P, F], { color: "#2F4BFF", weight: 4 }).addTo(map);
 
    L.marker(A, { icon: pino("#FF7A45", 13) }).addTo(map);
    L.marker(P, { icon: pinoPonto() }).addTo(map);
    L.marker(F, { icon: pino("#161A22", 16) }).addTo(map);
 
    // Enquadra os três pontos na área visível.
    map.fitBounds(L.latLngBounds([A, P, F]).pad(0.35));
 
    return () => { map.remove(); }; // limpa o mapa ao sair da tela
  }, [origem.lat, origem.lng, ponto.lat, ponto.lng, destino.lat, destino.lng]);
 
  return <div ref={ref} className="h-52 w-full overflow-hidden rounded-[14px]" />;
}
 
// Marcador circular simples.
function pino(cor: string, size: number) {
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${cor};border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35)"></div>`,
  });
}
 
// Marcador do ponto de encontro (alvo laranja com miolo branco).
function pinoPonto() {
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div style="width:22px;height:22px;border-radius:50%;background:#FF7A45;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center"><div style="width:7px;height:7px;border-radius:50%;background:#fff"></div></div>`,
  });
}