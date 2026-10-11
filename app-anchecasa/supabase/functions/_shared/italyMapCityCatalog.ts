import { CITTA_PER_REGIONE } from "./cittaPerRegione.ts";

export type CityCatalogEntry = {
  key: string;
  citta: string;
  regione: string;
  lat: number;
  lon: number;
};

/** Coordinate note per città (chiave normalizzata). */
export const KNOWN_CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  milano: { lat: 45.4642, lon: 9.19 },
  roma: { lat: 41.9028, lon: 12.4964 },
  napoli: { lat: 40.8518, lon: 14.2681 },
  torino: { lat: 45.0703, lon: 7.6869 },
  palermo: { lat: 38.1157, lon: 13.3615 },
  catania: { lat: 37.5079, lon: 15.083 },
  bologna: { lat: 44.4949, lon: 11.3426 },
  firenze: { lat: 43.7696, lon: 11.2558 },
  bari: { lat: 41.1171, lon: 16.8719 },
  lecce: { lat: 40.3515, lon: 18.175 },
  taranto: { lat: 40.4644, lon: 17.247 },
  foggia: { lat: 41.4622, lon: 15.5446 },
  brindisi: { lat: 40.6382, lon: 17.9458 },
  genova: { lat: 44.4056, lon: 8.9463 },
  verona: { lat: 45.4384, lon: 10.9916 },
  venezia: { lat: 45.4408, lon: 12.3155 },
  mestre: { lat: 45.4902, lon: 12.2454 },
  padova: { lat: 45.4064, lon: 11.8768 },
  treviso: { lat: 45.6669, lon: 12.243 },
  vicenza: { lat: 45.5455, lon: 11.5354 },
  chioggia: { lat: 45.218, lon: 12.278 },
  modena: { lat: 44.6471, lon: 10.9252 },
  parma: { lat: 44.8015, lon: 10.328 },
  ravenna: { lat: 44.4184, lon: 12.2035 },
  rimini: { lat: 44.0678, lon: 12.5695 },
  salerno: { lat: 40.6824, lon: 14.7681 },
  latina: { lat: 41.4676, lon: 12.9037 },
  frosinone: { lat: 41.6396, lon: 13.3426 },
  "reggio calabria": { lat: 38.1113, lon: 15.6478 },
  cosenza: { lat: 39.3099, lon: 16.2502 },
  sassari: { lat: 40.7259, lon: 8.5557 },
  olbia: { lat: 40.9235, lon: 9.498 },
  potenza: { lat: 40.6395, lon: 15.805 },
  matera: { lat: 40.6664, lon: 16.6043 },
  pescara: { lat: 42.4618, lon: 14.2161 },
  ancona: { lat: 43.6158, lon: 13.5189 },
  pesaro: { lat: 43.909, lon: 12.913 },
  perugia: { lat: 43.1107, lon: 12.3908 },
  campobasso: { lat: 41.561, lon: 14.6684 },
  udine: { lat: 46.0711, lon: 13.2346 },
  trieste: { lat: 45.6495, lon: 13.7768 },
  trento: { lat: 46.0748, lon: 11.1217 },
  bolzano: { lat: 46.4983, lon: 11.3548 },
  aosta: { lat: 45.737, lon: 7.3202 },
  siena: { lat: 43.3188, lon: 11.3308 },
  pisa: { lat: 43.7228, lon: 10.4017 },
  livorno: { lat: 43.5485, lon: 10.3106 },
  bergamo: { lat: 45.6983, lon: 9.6773 },
  brescia: { lat: 45.5416, lon: 10.2118 },
  monza: { lat: 45.5845, lon: 9.2744 },
  siracusa: { lat: 37.0755, lon: 15.2866 },
  messina: { lat: 38.1938, lon: 15.554 },
};

export function cityCatalogKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/'/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function offsetFromHub(hub: { lat: number; lon: number }, key: string): { lat: number; lon: number } {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  const a = Math.abs(h);
  return {
    lat: hub.lat + ((a % 17) - 8) * 0.032,
    lon: hub.lon + ((a % 13) - 6) * 0.042,
  };
}

export function buildCityCatalog(
  regionHub: (regionId: string) => { lat: number; lon: number },
  regionIdByName: (regionName: string) => string | undefined,
): CityCatalogEntry[] {
  const list: CityCatalogEntry[] = [];
  const seen = new Set<string>();

  for (const [regione, cittaList] of Object.entries(CITTA_PER_REGIONE)) {
    const regionId = regionIdByName(regione);
    if (!regionId) continue;
    const hub = regionHub(regionId);

    for (const citta of cittaList) {
      const key = cityCatalogKey(citta);
      if (!key || seen.has(key)) continue;
      seen.add(key);

      const known = KNOWN_CITY_COORDS[key];
      const coords = known ?? offsetFromHub(hub, key);
      list.push({ key, citta, regione, lat: coords.lat, lon: coords.lon });
    }
  }

  return list;
}
