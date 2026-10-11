"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatArtisanDistance, type NearbyArtisan } from "@/lib/sos/search-artisans";

const TILE = 256;
const PIN = "/images/supermastro-icona.png";

type Point = { lat: number; lng: number };

function worldPoint(lat: number, lng: number, zoom: number) {
  const scale = TILE * 2 ** zoom;
  const x = ((lng + 180) / 360) * scale;
  const clamped = Math.min(Math.max(lat, -85.05112878), 85.05112878);
  const rad = (clamped * Math.PI) / 180;
  const y = (0.5 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / (2 * Math.PI)) * scale;
  return { x, y };
}

function chooseZoom(points: Point[], width: number, height: number) {
  const pad = 72;
  for (let zoom = 15; zoom >= 13; zoom -= 1) {
    const worlds = points.map((point) => worldPoint(point.lat, point.lng, zoom));
    const xs = worlds.map((point) => point.x);
    const ys = worlds.map((point) => point.y);
    if (Math.max(...xs) - Math.min(...xs) <= width - pad * 2 && Math.max(...ys) - Math.min(...ys) <= height - pad * 2) {
      return zoom;
    }
  }
  return 13;
}

type Props = {
  lat: number;
  lng: number;
  artisans: NearbyArtisan[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

export function ArtisanPinMap({ lat, lng, artisans, selectedId, onSelect }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 360, height: 320 });

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (width > 0 && height > 0) setSize({ width, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => {
    const points = [{ lat, lng }, ...artisans.map((artisan) => ({ lat: artisan.lat, lng: artisan.lng }))];
    const zoom = chooseZoom(points, size.width, size.height);
    const worlds = points.map((point) => worldPoint(point.lat, point.lng, zoom));
    const centerX = (Math.min(...worlds.map((point) => point.x)) + Math.max(...worlds.map((point) => point.x))) / 2;
    const centerY = (Math.min(...worlds.map((point) => point.y)) + Math.max(...worlds.map((point) => point.y))) / 2;
    const originX = centerX - size.width / 2;
    const originY = centerY - size.height / 2;
    const x0 = Math.floor(originX / TILE);
    const y0 = Math.floor(originY / TILE);
    const x1 = Math.floor((originX + size.width) / TILE);
    const y1 = Math.floor((originY + size.height) / TILE);
    const maxTile = 2 ** zoom;
    const tiles: { key: string; left: number; top: number; src: string }[] = [];

    for (let x = x0; x <= x1; x += 1) {
      for (let y = y0; y <= y1; y += 1) {
        if (y < 0 || y >= maxTile) continue;
        const wrapped = ((x % maxTile) + maxTile) % maxTile;
        tiles.push({
          key: `${zoom}-${x}-${y}`,
          left: x * TILE - originX,
          top: y * TILE - originY,
          src: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${zoom}/${y}/${wrapped}`,
        });
      }
    }

    const markers = artisans.map((artisan) => {
      const point = worldPoint(artisan.lat, artisan.lng, zoom);
      return {
        artisan,
        left: point.x - originX,
        top: point.y - originY,
        distance: formatArtisanDistance(artisan.distanceKm),
      };
    });
    const fault = worldPoint(lat, lng, zoom);
    const faultPoint = { x: fault.x - originX, y: fault.y - originY };
    const path = [faultPoint, ...markers.map((marker) => ({ x: marker.left, y: marker.top }))];
    const d = path.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
    const mpp = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;

    return {
      tiles,
      markers,
      fault: faultPoint,
      d,
      bar: Math.max(28, 200 / mpp),
      width: size.width,
      height: size.height,
    };
  }, [artisans, lat, lng, size.height, size.width]);

  return (
    <div
      ref={frame}
      className="relative h-full w-full overflow-hidden bg-[#F4F1EA]"
      role="img"
      aria-label="Mappa degli artigiani, tavola di gioco"
    >
      {layout.tiles.map((tile) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={tile.key}
          src={tile.src}
          alt=""
          width={TILE}
          height={TILE}
          draggable={false}
          className="pointer-events-none absolute max-w-none"
          style={{
            left: tile.left,
            top: tile.top,
            width: TILE,
            height: TILE,
            filter: "sepia(0.28) saturate(0.8) contrast(1.05) brightness(1.02)",
          }}
        />
      ))}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(251,248,243,0.08),rgba(229,107,16,0.1))]" />
      <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full" viewBox={`0 0 ${layout.width} ${layout.height}`}>
        {layout.markers.length > 0 && (
          <path d={layout.d} fill="none" stroke="#E56B10" strokeWidth="3" strokeLinecap="round" strokeDasharray="7 7" />
        )}
        <g transform={`translate(${layout.width - 34} ${layout.height - 28})`}>
          <circle r="16" fill="rgba(251,248,243,0.9)" stroke="#1A2432" strokeWidth="1.2" />
          <path d="M0 -11 L3.4 2 L0 0 L-3.4 2 Z" fill="#E56B10" />
          <path d="M0 11 L3.4 -2 L0 0 L-3.4 -2 Z" fill="#2A3C54" />
          <text y="-18" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1A2432">
            N
          </text>
        </g>
      </svg>

      <span
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ left: layout.fault.x, top: layout.fault.y }}
        title="Posizione del guasto"
      >
        <span className="block size-4 rounded-full border-[3px] border-white bg-[#E56B10] shadow-[0_0_0_8px_rgba(229,107,16,0.25)]" />
        <span className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-[#FBF8F3]/92 px-1.5 text-[10px] font-bold text-[#1A2432]">
          Tu
        </span>
      </span>

      {layout.markers.map(({ artisan, left, top, distance }) => {
        const selected = artisan.id === selectedId;
        const pinLabel = artisan.network ? `${artisan.name}, verificato` : `${artisan.name}, non iscritto`;
        const pin = (
          <>
            <span className={`rounded-full p-0.5 ${artisan.network ? "bg-[#14485B]" : "bg-[#8A929C]"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PIN}
                alt=""
                className={`rounded-full border-[3px] border-white object-cover shadow-[0_6px_8px_rgba(26,36,50,0.28)] ${
                  selected ? "size-14" : "size-11"
                }`}
              />
            </span>
            <span className="mt-0.5 rounded-full bg-[#1A2432] px-1.5 py-0.5 text-[10px] font-bold text-white">{distance}</span>
          </>
        );
        const className = "absolute z-20 flex -translate-x-1/2 -translate-y-full flex-col items-center";
        if (!onSelect) {
          return (
            <span key={artisan.id} className={className} style={{ left, top }} title={pinLabel} role="img" aria-label={pinLabel}>
              {pin}
            </span>
          );
        }
        return (
          <button
            key={artisan.id}
            type="button"
            className={className}
            style={{ left, top }}
            title={pinLabel}
            aria-label={pinLabel}
            onClick={() => onSelect(artisan.id)}
          >
            {pin}
          </button>
        );
      })}

      <div className="pointer-events-none absolute bottom-7 left-2 z-30 flex items-center gap-1.5 text-[10px] font-bold text-[#1A2432]">
        <i className="block h-1 rounded-full bg-[#E56B10] shadow-[0_0_0_2px_rgba(251,248,243,0.85)]" style={{ width: layout.bar }} />
        200 m
      </div>
      <p className="absolute bottom-1 left-2 z-30 rounded bg-[#FBF8F3]/80 px-1 text-[8px] leading-tight text-[#1A2432]/65">
        © Esri, OpenStreetMap
      </p>
    </div>
  );
}
