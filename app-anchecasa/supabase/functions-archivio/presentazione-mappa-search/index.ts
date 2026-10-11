import {
  isCentroOperativoSearchQuery,
  NO_SEARCH_DATA_MESSAGE,
  wantsCompaniesOnlySearch,
  wantsPersonnelSearch,
} from "../_shared/presentazioneSearchIntent.ts";
import {
  detectMapRegionsInQuery,
  detectMapCitiesInQuery,
  hubForRegionName,
  isNationalItalyQuery,
  parseGeoScopeFromQuery,
  regionsMapMatch,
  KNOWN_CITY_COORDS,
  cityCatalogKey,
} from "../_shared/italyMapRegionLexicon.ts";
import { checkRateLimit, getClientIp, rateLimitResponse } from "../_shared/rate-limit.ts";
import { captureEdgeException } from "../_shared/sentry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IP_LIMIT = { maxRequests: 20, windowMs: 10 * 60 * 1000 };

const SYSTEM_PROMPT = `Sei il motore di ricerca del Centro Operativo di AncheCasa.it, piattaforma CRM italiana con 9 profili: azienda, agenzia immobiliare, agente, segnalatore, professionista, amministratore condominio, privato, artigiano, ospitalita/alberghi.

DISTINGUI tre tipi di ricerca:
1. CONTEGGIO CRM — quanti alberghi/condomini/agenzie abbiamo: conteggi per regione, MAI lavoratori. Usa tipo crm_conteggio e campo conteggio, NON postiRichiesti.
2. ELENCO IMPRESE — cerco aziende/imprese: elenco SENZA postiRichiesti salvo richiesta esplicita di personale.
3. PERSONALE — operai, personale, posti, assumere: imprese con postiRichiesti.

Entita CRM: alberghi=ospitalita, condomini=amministratore, agenzie=agenzia, agenti, segnalatori, professionisti, artigiani, privati, aziende/imprese=azienda.

Restituisci SOLO JSON valido:
{
  "regione": "String",
  "settore": "String",
  "ambito": "nazionale | regionale | locale",
  "crmMode": "conteggio_regionale (solo query quanti/quante profili CRM)",
  "entityKind": "azienda|agenzia|agente|segnalatore|professionista|amministratore|privato|artigiano|ospitalita",
  "totaleProfili": "Number opzionale",
  "totalePosti": "Number opzionale — SOLO ricerca personale",
  "riepilogo": "String",
  "risorse": [{
    "nome": "String",
    "descrizione": "String max 12 parole",
    "compatibilita": "Number 70-99",
    "conteggio": "Number opzionale — profili CRM in regione",
    "postiRichiesti": "Number opzionale — SOLO se personale esplicito",
    "tipo": "azienda|commessa|richiesta_personale|crm_conteggio|consorzio",
    "citta": "String",
    "regione": "String"
  }]
}

Regole:
- Solo aziende/imprese senza operai/personale/posti: NON includere postiRichiesti
- Quanti alberghi/condomini/agenzie: crmMode=conteggio_regionale, una risorsa per regione con conteggio
- risorse: 4-8 (mercato) o fino a 20 regioni (conteggio CRM nazionale)
- Coerenza geografica con citta/regione citate
- Mai IA, demo, simulazione nel riepilogo
- Nomi credibili S.r.l./S.p.A. — MAI Team Puglia o Impresa Lazio 3
- Richieste meta piattaforma: risorse [] e riepilogo "Nessun dato disponibile per questa richiesta."`;

/** Coordinate approssimative per archi mappa (hub → risorsa). */
const CITY_COORDS: Record<string, { lat: number; lon: number; citta: string }> = {
  ...Object.fromEntries(
    Object.entries(KNOWN_CITY_COORDS).map(([key, coords]) => [
      key,
      { ...coords, citta: key.charAt(0).toUpperCase() + key.slice(1) },
    ]),
  ),
  mestre: { lat: 45.4902, lon: 12.2454, citta: "Mestre" },
};

const REGION_CENTROIDS: Record<string, { lat: number; lon: number }> = {
  lombardia: { lat: 45.4642, lon: 9.19 },
  sicilia: { lat: 37.5999, lon: 14.0154 },
  lazio: { lat: 41.9028, lon: 12.4964 },
  campania: { lat: 40.8518, lon: 14.2681 },
  piemonte: { lat: 45.0703, lon: 7.6869 },
  "emilia romagna": { lat: 44.4949, lon: 11.3426 },
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
  "friuli venezia giulia": { lat: 45.6495, lon: 13.7768 },
  "trentino alto adige": { lat: 46.4983, lon: 11.3548 },
  "valle daosta": { lat: 45.737, lon: 7.3202 },
};

type LlmResource = {
  nome: string;
  descrizione?: string;
  compatibilita?: number;
  postiRichiesti?: number;
  tipo?: string;
  citta?: string;
  regione?: string;
};

type SearchPayload = {
  regione: string;
  settore: string;
  ambito?: string;
  totalePosti?: number;
  riepilogo?: string;
  risorse: LlmResource[];
};

type MapResource = LlmResource & {
  lat: number;
  lon: number;
  rilevanza: number;
  tipo: string;
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function coordsForResource(
  nome: string,
  regione: string,
  index: number,
  cittaHint?: string,
): { lat: number; lon: number; citta?: string; regione?: string } {
  const text = norm(cittaHint ?? nome);
  for (const [key, c] of Object.entries(CITY_COORDS)) {
    if (text.includes(key)) return { ...c, regione: c.citta === "Milano" ? "Lombardia" : regione };
  }
  for (const [key, c] of Object.entries(CITY_COORDS)) {
    if (norm(nome).includes(key)) return { ...c, regione };
  }
  const r = norm(regione).replace(/-/g, " ");
  const hub = REGION_CENTROIDS[r] ?? hubForRegionName(regione);
  if (hub) {
    const jitter = (index - 2) * 0.35;
    return { lat: hub.lat + jitter * 0.08, lon: hub.lon + jitter * 0.12, citta: cittaHint ?? regione, regione };
  }
  return { lat: 41.9 + index * 0.05, lon: 12.5 + index * 0.07, citta: cittaHint ?? regione, regione };
}

function regionsMatch(a: string, b: string): boolean {
  return regionsMapMatch(a, b);
}

function detectRegionsInQuery(query: string): string[] {
  return detectMapRegionsInQuery(query);
}

function filterByGeoScope(risorse: MapResource[], query: string): MapResource[] {
  const scope = parseGeoScopeFromQuery(query);
  if (scope.isNational && scope.regions.length === 0 && scope.cities.length === 0) {
    return risorse;
  }
  if (scope.regions.length === 0 && scope.cities.length === 0) {
    return risorse;
  }

  let filtered = risorse.filter((r) => {
    if (scope.regions.length > 0) {
      return scope.regions.some((reg) => regionsMatch(r.regione ?? "", reg));
    }
    return true;
  });

  if (scope.cities.length === 1 && scope.regions.length <= 1) {
    const cityKey = cityCatalogKey(scope.cities[0].citta);
    filtered = filtered.filter((r) => {
      const rCity = cityCatalogKey(r.citta ?? "");
      return rCity.includes(cityKey) || cityKey.includes(rCity);
    });
  }

  return filtered;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildRiepilogo(risorse: MapResource[], totalePosti?: number): string {
  const n = risorse.length;
  if (totalePosti && totalePosti > 0) {
    return `${n} ${n === 1 ? "impresa" : "imprese"} · ${totalePosti.toLocaleString("it-IT")} lavoratori richiesti`;
  }
  return `${n} ${n === 1 ? "risultato" : "risultati"} trovati`;
}

function emptySearchResult() {
  return {
    regione: "—",
    settore: "—",
    riepilogo: NO_SEARCH_DATA_MESSAGE,
    risorse: [] as MapResource[],
  };
}

function sanitizeResult(raw: SearchPayload, query: string): {
  regione: string;
  settore: string;
  ambito?: string;
  totalePosti?: number;
  riepilogo?: string;
  risorse: MapResource[];
} {
  if (!isCentroOperativoSearchQuery(query)) {
    return emptySearchResult();
  }

  const regione = String(raw.regione ?? "Italia").trim();
  const settore = String(raw.settore ?? "Edilizia").trim();
  const ambito = raw.ambito ? String(raw.ambito).trim() : undefined;
  const scopedRegions = detectRegionsInQuery(query);
  const scopedCities = detectMapCitiesInQuery(query);
  const nationalQuery = isNationalItalyQuery(query);

  let risorse = (raw.risorse ?? [])
    .filter((r) => r && typeof r.nome === "string" && r.nome.trim())
    .slice(0, 8)
    .map((r, i) => {
      const itemRegione = r.regione ? String(r.regione).trim() : regione;
      const compat = typeof r.compatibilita === "number"
        ? Math.min(99, Math.max(70, Math.round(r.compatibilita)))
        : 85 - i * 2;
      const geo = coordsForResource(r.nome, itemRegione, i, r.citta);
      const companiesOnly = wantsCompaniesOnlySearch(query) && !wantsPersonnelSearch(query);
      const posti =
        companiesOnly || r.tipo === "crm_conteggio"
          ? undefined
          : typeof r.postiRichiesti === "number"
            ? Math.max(1, Math.round(r.postiRichiesti))
            : wantsPersonnelSearch(query)
              ? Math.max(6, 8 + i * 5 + (compat % 7))
              : undefined;
      const tipo = r.tipo
        ? String(r.tipo).trim()
        : posti
          ? "richiesta_personale"
          : settore.toLowerCase().includes("manodopera")
            ? "richiesta_personale"
            : "azienda";
      return {
        nome: String(r.nome).trim(),
        descrizione: r.descrizione ? String(r.descrizione).trim().slice(0, 120) : undefined,
        compatibilita: compat,
        postiRichiesti: posti,
        lat: geo.lat,
        lon: geo.lon,
        citta: r.citta ? String(r.citta).trim() : geo.citta,
        regione: itemRegione,
        rilevanza: compat / 100,
        tipo,
      };
    });

  risorse = filterByGeoScope(risorse, query);

  const displayRegion =
    scopedRegions.length > 1
      ? scopedRegions.join(" · ")
      : scopedRegions.length === 1
        ? scopedRegions[0]
        : scopedCities.length === 1
          ? scopedCities[0].citta
          : nationalQuery
            ? "Italia"
            : regione;

  const displayAmbito =
    scopedCities.length === 1 && scopedRegions.length <= 1
      ? "locale"
      : scopedRegions.length > 0
        ? "regionale"
        : nationalQuery
          ? "nazionale"
          : ambito;

  const totalePosti = risorse.some((r) => r.postiRichiesti)
    ? risorse.reduce((s, r) => s + (r.postiRichiesti ?? 0), 0)
    : undefined;

  if (risorse.length === 0) {
    return emptySearchResult();
  }

  if (risorse.length >= 3) {
    return {
      regione: displayRegion,
      settore,
      ambito: displayAmbito,
      totalePosti,
      riepilogo: raw.riepilogo ? String(raw.riepilogo).trim().slice(0, 160) : buildRiepilogo(risorse, totalePosti),
      risorse,
    };
  }

  const fallbackReg =
    scopedRegions[0] ?? scopedCities[0]?.regione ?? (regione === "Italia" ? "Veneto" : regione);
  const fallback: MapResource[] = [
    {
      nome: "Meridiane Costruzioni S.p.A.",
      descrizione: "General contractor attivo sul territorio",
      compatibilita: 88,
      postiRichiesti: 14,
      lat: coordsForResource(fallbackReg, fallbackReg, 0).lat,
      lon: coordsForResource(fallbackReg, fallbackReg, 0).lon,
      citta: coordsForResource(fallbackReg, fallbackReg, 0).citta,
      regione: fallbackReg,
      rilevanza: 0.88,
      tipo: "azienda",
    },
    {
      nome: "Cooperativa Edilizia Integrata",
      descrizione: "Rete partner verificati",
      compatibilita: 84,
      postiRichiesti: 10,
      lat: coordsForResource(fallbackReg, fallbackReg, 1).lat,
      lon: coordsForResource(fallbackReg, fallbackReg, 1).lon,
      citta: coordsForResource(fallbackReg, fallbackReg, 1).citta,
      regione: fallbackReg,
      rilevanza: 0.84,
      tipo: "consorzio",
    },
    {
      nome: "Cooperativa Maestranze Associate",
      descrizione: "Figure specializzate disponibili",
      compatibilita: 80,
      postiRichiesti: 12,
      lat: coordsForResource(fallbackReg, fallbackReg, 2).lat,
      lon: coordsForResource(fallbackReg, fallbackReg, 2).lon,
      citta: coordsForResource(fallbackReg, fallbackReg, 2).citta,
      regione: fallbackReg,
      rilevanza: 0.8,
      tipo: "richiesta_personale",
    },
  ];

  const fbTotale = fallback.reduce((s, r) => s + (r.postiRichiesti ?? 0), 0);
  return {
    regione: displayRegion,
    settore,
    ambito: scopedRegions.length > 0 ? "regionale" : (displayAmbito ?? "regionale"),
    totalePosti: fbTotale || totalePosti,
    riepilogo: buildRiepilogo(fallback, fbTotale || totalePosti),
    risorse: fallback,
  };
}

async function callGemini(query: string, apiKey: string): Promise<SearchPayload> {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
    encodeURIComponent(apiKey);

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: query }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Gemini ${resp.status}: ${t.slice(0, 400)}`);
  }

  const data = await resp.json();
  const text =
    data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "{}";
  return JSON.parse(text) as SearchPayload;
}

async function callOpenAi(query: string, apiKey: string): Promise<SearchPayload> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OpenAI ${resp.status}: ${t.slice(0, 400)}`);
  }

  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(text) as SearchPayload;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = getClientIp(req);
    const ipCheck = checkRateLimit(`presentazione-mappa-search:ip:${clientIp}`, IP_LIMIT);
    if (!ipCheck.allowed) {
      return rateLimitResponse(ipCheck.retryAfterSec, corsHeaders);
    }

    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) {
      return jsonResponse({ error: "Query mancante." }, 400);
    }

    if (!isCentroOperativoSearchQuery(query)) {
      return jsonResponse(emptySearchResult());
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_AI_API_KEY");
    const openAiKey = Deno.env.get("OPENAI_API_KEY");

    let parsed: SearchPayload;
    if (geminiKey) {
      parsed = await callGemini(query, geminiKey);
    } else if (openAiKey) {
      parsed = await callOpenAi(query, openAiKey);
    } else {
      return jsonResponse({
        error: "Nessuna chiave IA configurata (GEMINI_API_KEY o OPENAI_API_KEY).",
      }, 503);
    }

    return jsonResponse(sanitizeResult(parsed, query));
  } catch (e) {
    console.error("presentazione-mappa-search error:", e);
    await captureEdgeException(e, "presentazione-mappa-search");
    const errMsg = e instanceof Error ? e.message : "Errore sconosciuto";
    return jsonResponse({ error: errMsg }, 500);
  }
});
