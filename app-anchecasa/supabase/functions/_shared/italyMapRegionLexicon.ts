/** Lessico regioni mappa Italia — condiviso tra edge functions (Deno). */

import { buildCityCatalog, cityCatalogKey, KNOWN_CITY_COORDS } from "./italyMapCityCatalog.ts";

export type MapRegionCity = { key: string; citta: string; regione: string; lat: number; lon: number };

export type MapRegionLexiconEntry = {
  id: string;
  name: string;
  capital: string;
  tokens: string[];
};

const REGIONS: { id: string; name: string; capital: string }[] = [
  { id: "piemonte", name: "Piemonte", capital: "Torino" },
  { id: "valle-daosta", name: "Valle d'Aosta", capital: "Aosta" },
  { id: "lombardia", name: "Lombardia", capital: "Milano" },
  { id: "trentino-alto-adige", name: "Trentino-Alto Adige", capital: "Trento" },
  { id: "veneto", name: "Veneto", capital: "Venezia" },
  { id: "friuli-venezia-giulia", name: "Friuli Venezia Giulia", capital: "Trieste" },
  { id: "liguria", name: "Liguria", capital: "Genova" },
  { id: "emilia-romagna", name: "Emilia-Romagna", capital: "Bologna" },
  { id: "toscana", name: "Toscana", capital: "Firenze" },
  { id: "umbria", name: "Umbria", capital: "Perugia" },
  { id: "marche", name: "Marche", capital: "Ancona" },
  { id: "lazio", name: "Lazio", capital: "Roma" },
  { id: "abruzzo", name: "Abruzzo", capital: "L'Aquila" },
  { id: "molise", name: "Molise", capital: "Campobasso" },
  { id: "campania", name: "Campania", capital: "Napoli" },
  { id: "puglia", name: "Puglia", capital: "Bari" },
  { id: "basilicata", name: "Basilicata", capital: "Potenza" },
  { id: "calabria", name: "Calabria", capital: "Catanzaro" },
  { id: "sicilia", name: "Sicilia", capital: "Palermo" },
  { id: "sardegna", name: "Sardegna", capital: "Cagliari" },
];

const EXTRA_ALIASES: Record<string, string[]> = {
  lombardia: ["lombardy"],
  lazio: ["latium"],
  sicilia: ["sicily", "sicilian"],
  piemonte: ["piedmont"],
  veneto: ["venetia"],
  toscana: ["tuscany", "tuscan"],
  puglia: ["apulia"],
  sardegna: ["sardinia"],
  marche: ["marches", "le marche"],
  basilicata: ["lucania"],
  "emilia-romagna": ["emilia romagna"],
  "friuli-venezia-giulia": ["friuli", "venezia giulia", "friuli venezia giulia"],
  "trentino-alto-adige": ["trentino", "alto adige", "south tyrol", "trentino alto adige"],
  "valle-daosta": ["valle daosta", "valle d aosta", "aosta valley", "aosta"],
};

export function normGeoToken(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/'/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildLexicon(): MapRegionLexiconEntry[] {
  return REGIONS.map((r) => {
    const tokens = new Set<string>();
    tokens.add(normGeoToken(r.name));
    tokens.add(normGeoToken(r.id.replace(/-/g, " ")));
    tokens.add(normGeoToken(r.capital));
    for (const alias of EXTRA_ALIASES[r.id] ?? []) {
      tokens.add(normGeoToken(alias));
    }
    return { id: r.id, name: r.name, capital: r.capital, tokens: [...tokens].filter(Boolean) };
  });
}

export const REGION_HUB: Record<string, { lat: number; lon: number }> = {
  lombardia: { lat: 45.4642, lon: 9.19 },
  lazio: { lat: 41.9028, lon: 12.4964 },
  sicilia: { lat: 37.5999, lon: 14.0154 },
  campania: { lat: 40.8518, lon: 14.2681 },
  piemonte: { lat: 45.0703, lon: 7.6869 },
  "emilia-romagna": { lat: 44.4949, lon: 11.3426 },
  veneto: { lat: 45.4408, lon: 12.3155 },
  toscana: { lat: 43.7696, lon: 11.2558 },
  puglia: { lat: 41.1171, lon: 16.8719 },
  liguria: { lat: 44.4056, lon: 8.9463 },
  sardegna: { lat: 39.2238, lon: 9.1217 },
  calabria: { lat: 38.9108, lon: 16.5877 },
  abruzzo: { lat: 42.3498, lon: 13.3995 },
  marche: { lat: 43.6168, lon: 13.5189 },
  umbria: { lat: 43.1107, lon: 12.3908 },
  molise: { lat: 41.561, lon: 14.6684 },
  basilicata: { lat: 40.6389, lon: 15.8064 },
  "friuli-venezia-giulia": { lat: 45.6495, lon: 13.7768 },
  "trentino-alto-adige": { lat: 46.4983, lon: 11.3548 },
  "valle-daosta": { lat: 45.737, lon: 7.3202 },
};

export const MAP_REGION_LEXICON = buildLexicon();

const LEXICON_BY_NAME = new Map(MAP_REGION_LEXICON.map((e) => [e.name, e]));

export const MAP_REGION_CITIES: MapRegionCity[] = (() => {
  const byKey = new Map<string, MapRegionCity>();

  for (const r of REGIONS) {
    const key = normGeoToken(r.capital);
    if (byKey.has(key)) continue;
    const hub = REGION_HUB[r.id] ?? { lat: 41.9, lon: 12.5 };
    byKey.set(key, { key, citta: r.capital, regione: r.name, lat: hub.lat, lon: hub.lon });
  }

  for (const entry of buildCityCatalog(
    (id) => REGION_HUB[id] ?? { lat: 41.9, lon: 12.5 },
    (name) => LEXICON_BY_NAME.get(name)?.id,
  )) {
    if (!byKey.has(entry.key)) {
      byKey.set(entry.key, {
        key: entry.key,
        citta: entry.citta,
        regione: entry.regione,
        lat: entry.lat,
        lon: entry.lon,
      });
    }
  }

  const mestre = byKey.get("mestre");
  if (mestre) {
    for (const alias of ["venezia mestre", "marghera"]) {
      if (!byKey.has(alias)) byKey.set(alias, { ...mestre, key: alias });
    }
  }

  return [...byKey.values()];
})();

const MAP_CITIES_BY_KEY = new Map(MAP_REGION_CITIES.map((c) => [c.key, c]));

export function resolveCityFromWholeQuery(query: string): MapRegionCity | null {
  const q = normGeoToken(query.trim());
  if (!q) return null;
  const direct = MAP_CITIES_BY_KEY.get(q);
  if (direct) return direct;
  for (const c of MAP_REGION_CITIES) {
    if (normGeoToken(c.citta) === q) return c;
  }
  return null;
}

export function detectMapCitiesInQuery(query: string): MapRegionCity[] {
  const whole = resolveCityFromWholeQuery(query);
  if (whole) return [whole];

  const q = normGeoToken(query);
  const found: MapRegionCity[] = [];
  const sorted = [...MAP_REGION_CITIES].sort((a, b) => b.key.length - a.key.length);

  for (const c of sorted) {
    if (tokenMatchesQuery(c.key, q) && !found.some((x) => x.citta === c.citta)) {
      found.push(c);
    }
  }
  return found;
}

export function parseGeoScopeFromQuery(query: string): {
  isNational: boolean;
  regions: string[];
  cities: MapRegionCity[];
  primaryRegion: string | null;
} {
  const regions = detectMapRegionsInQuery(query);
  const cities = detectMapCitiesInQuery(query);
  const isNational = isNationalItalyQuery(query);

  for (const city of cities) {
    if (!regions.includes(city.regione)) regions.push(city.regione);
  }

  return {
    isNational,
    regions,
    cities,
    primaryRegion: regions[0] ?? cities[0]?.regione ?? null,
  };
}

export { cityCatalogKey, KNOWN_CITY_COORDS };

function tokenMatchesQuery(token: string, q: string): boolean {
  if (token.length < 2) return false;
  if (token.includes(" ")) return q.includes(token);
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[\\s,.;:!?()\\[\\"'/\\\\-])${escaped}(?:$|[\\s,.;:!?()\\[\\"'/\\\\-])`).test(` ${q} `);
}

/** Regioni citate nella query, ordinate per prima occorrenza. */
export function detectMapRegionsInQuery(query: string): string[] {
  const q = normGeoToken(query);
  const hits: { name: string; index: number }[] = [];

  for (const entry of MAP_REGION_LEXICON) {
    let best = Infinity;
    for (const token of entry.tokens) {
      if (!tokenMatchesQuery(token, q)) continue;
      const idx = q.indexOf(token);
      if (idx >= 0 && idx < best) best = idx;
    }
    if (best < Infinity && !hits.some((h) => h.name === entry.name)) {
      hits.push({ name: entry.name, index: best });
    }
  }

  hits.sort((a, b) => a.index - b.index);
  return hits.map((h) => h.name);
}

/** Italia intera — non se la query cita regioni o città specifiche. */
export function isNationalItalyQuery(query: string): boolean {
  if (detectMapRegionsInQuery(query).length > 0) return false;
  if (detectMapCitiesInQuery(query).length > 0) return false;

  const q = normGeoToken(query);
  if (!q) return false;

  if (
    /\btutta\s+italia\b|\btutto\s+italia\b|\bnazionale\b|\bsu\s+tutta\s+italia\b|\bin\s+italia\b|\ball\s+italy\b|\bacross\s+italy\b/.test(
      q,
    )
  ) {
    return true;
  }

  if (q === "italia" || q === "italy") return true;

  return /(?:^|[\s,.;:!?()\[\"'/-])(?:italia|italy)(?:$|[\s,.;:!?()\[\"'/-])/.test(` ${q} `);
}

export function regionsMapMatch(a: string, b: string): boolean {
  const na = normGeoToken(a);
  const nb = normGeoToken(b);
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  const entryA = MAP_REGION_LEXICON.find((e) => e.name === a || e.tokens.includes(na));
  const entryB = MAP_REGION_LEXICON.find((e) => e.name === b || e.tokens.includes(nb));
  return entryA != null && entryB != null && entryA.id === entryB.id;
}

export function hubForRegionName(name: string): { lat: number; lon: number } {
  const entry = MAP_REGION_LEXICON.find((e) => e.name === name || regionsMapMatch(e.name, name));
  const id = entry?.id ?? "lazio";
  return REGION_HUB[id] ?? { lat: 41.9, lon: 12.5 };
}
