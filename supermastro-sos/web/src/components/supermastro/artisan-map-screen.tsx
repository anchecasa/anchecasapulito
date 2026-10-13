import { HardLink } from "@/components/layout/hard-link";
import { ArtisanPinMap } from "@/components/supermastro/artisan-pin-map";
import { Mascot } from "@/components/supermastro/mascot";
import { artisanMapEmbedUrl } from "@/lib/sos/artisan-maps";
import { formatArtisanDistance, type NearbyArtisan } from "@/lib/sos/search-artisans";

type Props = {
  trade: string;
  summary: string;
  lat: number;
  lng: number;
  artisans: NearbyArtisan[];
};

export function ArtisanMapScreen({ trade, summary, lat, lng, artisans }: Props) {
  const mapUrl = artisanMapEmbedUrl(trade, lat, lng);

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col bg-[#FBF8F3] text-[#1A2432]">
      <div className="px-4 pt-4">
        <HardLink href="/supermastro/video" className="text-sm font-medium text-[#2A3C54]">
          Torna al video
        </HardLink>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#E56B10]">
          Guasto trovato
        </p>
        <h1 className="mt-1 text-[1.35rem] font-semibold leading-tight">{summary}</h1>
        <p className="mt-2 text-sm text-[#2A3C54]">
          {trade} vicino a te, sulla mappa.
        </p>
      </div>

      <div className="relative mx-4 mt-4 h-[42dvh] min-h-64 overflow-hidden rounded-2xl border border-[#2A3C54]/15 bg-white shadow-sm">
        {artisans.length > 0 ? (
          <ArtisanPinMap lat={lat} lng={lng} artisans={artisans} />
        ) : (
          <iframe
            title={`Mappa ${trade}`}
            src={mapUrl}
            className="h-full w-full"
            loading="eager"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>

      <div className="px-4 pb-10 pt-5">
        <h2 className="text-base font-semibold">Artigiani</h2>
        {artisans.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <Mascot
              pose="viso"
              size={72}
              alt=""
              speech="Ancora nessun artigiano della rete qui. Torna al video e riprova."
            />
          </div>
        ) : (
          <p className="mt-1 text-sm text-[#1A2432]/70">
            {artisans.length === 1
              ? "1 artigiano vicino al guasto."
              : `${artisans.length} artigiani vicini al guasto.`}
          </p>
        )}

        <ul className="mt-4 space-y-3">
          {artisans.map((artisan) => (
            <li
              key={artisan.id}
              className="rounded-2xl border border-[#2A3C54]/10 bg-white p-4 shadow-sm"
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
              <a
                href={artisan.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-sm font-semibold text-[#E56B10]"
              >
                Apri su Maps
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
