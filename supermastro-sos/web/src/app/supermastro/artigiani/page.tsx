import type { Metadata } from "next";
import { ArtisanFinder } from "@/components/supermastro/artisan-finder";
import { HardLink } from "@/components/layout/hard-link";
import { searchGoogleArtisans } from "@/lib/sos/google-places";

export const metadata: Metadata = {
  title: "Artigiani vicini — SuperMastro",
};

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function coord(value: string, min: number, max: number): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export default async function ArtigianiPage({
  searchParams,
}: {
  searchParams: Promise<{
    mestiere?: string | string[];
    lat?: string | string[];
    lng?: string | string[];
    guasto?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const trade = one(params.mestiere).trim() || "Artigiano";
  const summary = one(params.guasto).trim() || `Serve un ${trade.toLowerCase()}`;
  const lat = coord(one(params.lat), -90, 90);
  const lng = coord(one(params.lng), -180, 180);

  if (lat == null || lng == null) {
    return (
      <section className="mx-auto max-w-lg bg-[#FBF8F3] px-4 py-8 text-[#1A2432]">
        <h1 className="text-xl font-semibold">Artigiani del guasto</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#2A3C54]">
          La posizione del guasto manca. Torna alla richiesta, completa la diagnosi e cerca di nuovo.
        </p>
        <HardLink href="/supermastro/nuova" className="mt-4 inline-flex text-sm font-semibold text-[#E56B10]">
          Torna alla richiesta
        </HardLink>
      </section>
    );
  }

  const result = await searchGoogleArtisans(trade, lat, lng);

  return (
    <ArtisanFinder
      trade={trade}
      summary={summary}
      lat={lat}
      lng={lng}
      status={result.status}
      artisans={result.artisans}
    />
  );
}
