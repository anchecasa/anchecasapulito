/** Mestiere usato nella ricerca, senza il testo dopo la barra. */
export function artisanTradeLabel(label: string): string {
  return (label.split("/")[0] ?? label).trim() || "artigiano";
}

/** Ricerca Google Maps del mestiere, centrata sulla posizione dell'utente. */
export function nearestArtisanMapsUrl(label: string, lat: number, lng: number): string {
  const query = encodeURIComponent(artisanTradeLabel(label));
  return `https://www.google.com/maps/search/${query}/@${lat.toFixed(6)},${lng.toFixed(6)},14z`;
}

/** Mappa incorporata: ricerca del mestiere, centrata sul guasto, dentro SuperMastro. */
export function artisanMapEmbedUrl(label: string, lat: number, lng: number): string {
  const trade = encodeURIComponent(artisanTradeLabel(label));
  return `https://maps.google.com/maps?q=${trade}&ll=${lat.toFixed(6)},${lng.toFixed(6)}&z=14&hl=it&output=embed`;
}

/** Scheda artigiano su Google Maps. */
export function artisanPlaceMapsUrl(name: string, lat: number, lng: number): string {
  const query = encodeURIComponent(name);
  return `https://www.google.com/maps/search/${query}/@${lat.toFixed(6)},${lng.toFixed(6)},17z`;
}

export function faultSearchParams(input: {
  label: string;
  lat: number;
  lng: number;
  summary?: string | null;
}): URLSearchParams {
  const params = new URLSearchParams({
    mestiere: artisanTradeLabel(input.label),
    lat: input.lat.toFixed(6),
    lng: input.lng.toFixed(6),
  });
  const summary = input.summary?.trim();
  if (summary) params.set("guasto", summary.slice(0, 180));
  return params;
}

export function artisanSearchHref(input: {
  label: string;
  lat: number;
  lng: number;
  summary?: string | null;
}): string {
  return `/supermastro/artigiani?${faultSearchParams(input).toString()}`;
}

export function problemaHref(input: {
  label: string;
  lat: number;
  lng: number;
  summary?: string | null;
}): string {
  return `/supermastro/problema?${faultSearchParams(input).toString()}`;
}

export function daSoloHref(input: {
  label: string;
  lat: number;
  lng: number;
  summary?: string | null;
}): string {
  return `/supermastro/da-solo?${faultSearchParams(input).toString()}`;
}

export function ricercaHref(input: {
  label: string;
  lat: number;
  lng: number;
  summary?: string | null;
}): string {
  return `/supermastro/ricerca?${faultSearchParams(input).toString()}`;
}
