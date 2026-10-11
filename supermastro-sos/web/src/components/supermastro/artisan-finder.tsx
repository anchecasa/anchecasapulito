"use client";

import { useEffect, useState } from "react";
import { ArtisanPinMap } from "@/components/supermastro/artisan-pin-map";
import { formatArtisanDistance, type NearbyArtisan } from "@/lib/sos/search-artisans";
import type { GoogleArtisanSearch } from "@/lib/sos/google-places";

type Props = {
  trade: string;
  summary: string;
  lat: number;
  lng: number;
  status: GoogleArtisanSearch["status"];
  artisans: NearbyArtisan[];
};

export function ArtisanFinder({ trade, summary, lat, lng, status, artisans }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(artisans[0]?.id ?? null);

  useEffect(() => {
    const artisan = artisans.find((item) => item.id === selectedId);
    if (!artisan) return;
    document.getElementById(`artisan-${artisan.id}`)?.scrollIntoView({ block: "nearest" });
  }, [artisans, selectedId]);

  return (
    <section className="flex h-[calc(100dvh-66px)] min-h-0 flex-col bg-[#FBF8F3] text-[#1A2432]">
      <div className="relative h-[calc(50dvh-66px)] min-h-0 shrink-0 overflow-hidden bg-[#F4F1EA]">
        {status === "ready" ? (
          <ArtisanPinMap
            lat={lat}
            lng={lng}
            artisans={artisans}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ) : (
          <div className="flex h-full items-end p-4">
            <p className="rounded-2xl bg-[#2A3C54] px-4 py-3 text-sm leading-snug text-[#FBF8F3]">
              {status === "missing-key"
                ? "Google Maps è collegato nel codice. Manca la chiave GOOGLE_MAPS_API_KEY."
                : "Google Maps non ha accettato la chiave. Controlla Places API e Maps JavaScript API."}
            </p>
          </div>
        )}
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-30 rounded-2xl bg-[#FBF8F3]/95 px-3 py-2 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E56B10]">{trade}</p>
          <p className="truncate text-sm font-semibold">{summary}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <p className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#2A3C54]">Artigiani</p>
        {artisans.length === 0 ? (
          <p className="px-1 pt-2 text-sm text-[#1A2432]/70">Nessun artigiano da Google in questa zona.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {artisans.map((artisan) => {
              const selected = artisan.id === selectedId;
              return (
                <li key={artisan.id} id={`artisan-${artisan.id}`}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(artisan.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") setSelectedId(artisan.id);
                    }}
                    className={`w-full rounded-2xl border px-3 py-3 text-left ${
                      selected ? "border-[#E56B10] bg-white shadow-sm" : "border-[#2A3C54]/10 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug">{artisan.name}</p>
                        <p className="mt-1 text-sm leading-snug text-[#1A2432]/70">{artisan.address}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#2A3C54] px-2.5 py-1 text-xs font-semibold text-white">
                        {formatArtisanDistance(artisan.distanceKm)}
                      </span>
                    </div>
                    {selected && (
                      <div className="mt-3">
                        {artisan.phoneHref && artisan.phone ? (
                          <a
                            href={artisan.phoneHref}
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex rounded-xl bg-[#E56B10] px-4 py-2 text-sm font-semibold text-white"
                          >
                            Chiama {artisan.phone}
                          </a>
                        ) : (
                          <p className="text-sm text-[#1A2432]/70">Numero non pubblicato su Google.</p>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
