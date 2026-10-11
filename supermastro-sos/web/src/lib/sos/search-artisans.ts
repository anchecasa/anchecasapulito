import { artisanPlaceMapsUrl, artisanTradeLabel } from "@/lib/sos/artisan-maps";

export type NearbyArtisan = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  mapsUrl: string;
  phone?: string | null;
  phoneHref?: string | null;
  /** Artigiano iscritto e attivo nella rete AncheCasa. */
  network?: boolean;
  /** Identità stabile OpenStreetMap: "node/123", "way/456"… */
  osmRef?: string | null;
  /** Gettone firmato dal server per "Mandagli il video". */
  leadToken?: string | null;
};

const NOMINATIM_HEADERS = {
  "User-Agent": "AncheCasa-SuperMastro/1.0 (contact@anchecasa.it)",
  Accept: "application/json",
};

const SKIP_TYPES = new Set([
  "dam",
  "weir",
  "waterway",
  "river",
  "canal",
  "lock",
  "flow_control",
  "board",
  "information",
  "artwork",
  "memorial",
  "tourism",
  "highway",
  "natural",
  "water",
]);

type NominatimRow = {
  place_id?: number;
  osm_type?: string;
  osm_id?: number | string;
  name?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  class?: string;
  extratags?: Record<string, string>;
};

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function osmPhone(row: NominatimRow): string | null {
  const tags = row.extratags ?? {};
  const phone = (tags.phone || tags["contact:phone"] || tags["contact:mobile"] || "").trim();
  return phone || null;
}

/** Tipo e id OSM (stabili), non il place_id di Nominatim (cambia nel tempo). */
export function osmRefOf(row: { osm_type?: string; osm_id?: number | string }): string | null {
  const type = (row.osm_type ?? "").toLowerCase();
  const kind = type === "n" ? "node" : type === "w" ? "way" : type === "r" ? "relation" : type;
  const id = String(row.osm_id ?? "").trim();
  if (!["node", "way", "relation"].includes(kind) || !/^\d{1,20}$/.test(id)) return null;
  return `${kind}/${id}`;
}

function shortAddress(displayName: string, name: string): string {
  const parts = displayName
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part.toLowerCase() !== name.toLowerCase());
  return parts.slice(0, 3).join(", ") || displayName;
}

function tradeRoot(trade: string): string {
  const word = trade.toLowerCase();
  if (word.startsWith("idraulic")) return "idraulic";
  if (word.startsWith("elettric")) return "elettric";
  if (word.startsWith("fabbr")) return "fabbr";
  return word.slice(0, Math.min(word.length, 8));
}

function isRelevant(row: NominatimRow, root: string): boolean {
  const type = (row.type ?? "").toLowerCase();
  const klass = (row.class ?? "").toLowerCase();
  if (SKIP_TYPES.has(type) || SKIP_TYPES.has(klass)) return false;
  const name = (row.name ?? "").toLowerCase();
  const craftTypes = ["plumber", "electrician", "locksmith", "hvac", "craft"];
  if (craftTypes.includes(type) || craftTypes.includes(klass)) return true;
  return name.includes(root);
}

export async function searchArtisansNearby(
  label: string,
  lat: number,
  lng: number
): Promise<NearbyArtisan[]> {
  const trade = artisanTradeLabel(label);
  const root = tradeRoot(trade);
  const span = 0.12;
  const viewbox = `${lng - span},${lat + span},${lng + span},${lat - span}`;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", trade);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "12");
  url.searchParams.set("countrycodes", "it");
  url.searchParams.set("bounded", "1");
  url.searchParams.set("viewbox", viewbox);
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");

  try {
    const res = await fetch(url, {
      headers: NOMINATIM_HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as NominatimRow[];
    const seen = new Set<string>();

    return rows
      .filter((row) => isRelevant(row, root))
      .map((row): NearbyArtisan | null => {
        const name = row.name?.trim() || trade;
        const placeLat = Number(row.lat);
        const placeLng = Number(row.lon);
        if (!Number.isFinite(placeLat) || !Number.isFinite(placeLng)) return null;
        const key = `${name.toLowerCase()}@${placeLat.toFixed(4)},${placeLng.toFixed(4)}`;
        if (seen.has(key)) return null;
        seen.add(key);
        const phone = osmPhone(row);
        const osmRef = osmRefOf(row);
        return {
          id: osmRef ?? String(row.place_id ?? key),
          osmRef,
          name,
          address: shortAddress(row.display_name ?? "", name),
          lat: placeLat,
          lng: placeLng,
          distanceKm: distanceKm(lat, lng, placeLat, placeLng),
          mapsUrl: artisanPlaceMapsUrl(name, placeLat, placeLng),
          phone,
          phoneHref: phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null,
          network: false,
        };
      })
      .filter((row): row is NearbyArtisan => row !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 8);
  } catch {
    return [];
  }
}

export function formatArtisanDistance(km: number): string {
  if (km < 1) {
    const meters = Math.max(50, Math.round((km * 1000) / 10) * 10);
    return `${meters} m`;
  }
  return `${km.toFixed(1).replace(".", ",")} km`;
}
