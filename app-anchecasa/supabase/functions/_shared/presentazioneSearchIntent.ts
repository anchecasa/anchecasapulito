import {
  detectMapCitiesInQuery,
  detectMapRegionsInQuery,
  isNationalItalyQuery,
} from "./italyMapRegionLexicon.ts";

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

const OPERATIONAL_RE = [
  /operai|manodopera|lavorator|personale|addett|muratore|elettricist|idraulic|montator|figure/,
  /imprese?|aziende?|commess|appalt|subappalt|cantier|fornitor|consorzi|subappaltator/,
  /albergh|\bhotel\b|ospitalit|strutture?\s+ricettiv|catena\s+albergh/,
  /aziend[a]?\s+edil|imprese?\s+edil|\bedil\b|ediliz|costrutt/,
  /barist|barman|cuoch|chef|cucin|camerier|hostess|puliz|igiene|sanit/,
  /gdo|grande\s+distrib|supermercat|ipermercat|retail/,
  /ediliz|ristruttur|facciat|restaur|condomin|ospitalit|albergh|ristoraz|impiant/,
  /manuali|etic|hse|compliance|sicurezza|\bpos\b|durc/,
  /\b(cerc|trov|richied|servono|bisogno|disponibil|assum|posti|offro)/,
  /general contractor|property|opportunit/,
  /agenzi[a]?\s+immobili|agenti?\s+immobili|professionist|artigian|segnalator|privat/,
  /amministr(?:ator)?(?:e|i)?\s*(?:di\s+)?condomin|\bcondomini\b/,
  /quanti|numero|totale|conta|quante|abbiamo|registrati|iscritti|nel\s+crm|profili/,
];

const PLATFORM_META_RE = [
  /\bchi\s+(ha|e|è)\s+(ideato|creato|fondato|sviluppato|realizzato|inventato|costruito|pensato|lanciato)/,
  /\b(cos[ae]|che\s+cos[ae])\s+(e|è)\s+(anche\s*)?casa\b/,
  /\b(storia|origine|fondazione|fondatore|ideatore|creatore|proprietari[oi])\b/,
  /\bcome\s+(funziona|registr|acced|usare|iscriver|entrare)\b/,
  /\b(prezzi|costi|abbonament|tariff|pagament|quanto\s+costa)\b/,
  /\b(privacy|termini|cookie|gdpr)\b/,
];

const PLATFORM_BRAND_RE = /\b(anche\s*casa|anchecasa|anche\s+casa)\b/i;

const COUNT_QUERY_RE =
  /\b(quanti|quante|numero|totale|conta|conteggio|quanto\s+sono|abbiamo|registrati|iscritti|in\s+piattaforma|nel\s+crm|su\s+anchecasa)\b/;

const PERSONNEL_RE =
  /\b(operai|manodopera|lavorator|personale|addett|muratore|elettricist|idraulic|montator|figure|posti|assum|assunzioni|in\s+cerca\s+di|cercano|servono|bisogno|richiedono|barist|cuoch|camerier|chef|puliz|hostess)\b/;

const COMPANIES_ONLY_RE =
  /\b(imprese?|aziende?|fornitor|consorzi|subappaltator|general\s+contractor)\b/;

export const NO_SEARCH_DATA_MESSAGE =
  "Nessun dato disponibile per questa richiesta.";

export function isCountQuery(query: string): boolean {
  return COUNT_QUERY_RE.test(norm(query));
}

export function detectCrmEntityKind(query: string): string | null {
  const q = norm(query);
  if (/albergh|\balbergo\b|\bhotel\b|ospitalit|strutture?\s+ricettiv|ricettiv/.test(q)) return "ospitalita";
  if (/condomin|\bamministr/.test(q)) return "amministratore";
  if (/agenzi[a]?\s+immobili/.test(q)) return "agenzia";
  if (/\bagenti\b/.test(q)) return "agente";
  if (/segnalator/.test(q)) return "segnalatore";
  if (/professionist/.test(q)) return "professionista";
  if (/artigian/.test(q)) return "artigiano";
  if (/\bprivat[oi]?\b/.test(q)) return "privato";
  if (/\baziende?\b|\bimprese?\b/.test(q)) return "azienda";
  return null;
}

function hasOperationalIntent(q: string): boolean {
  return OPERATIONAL_RE.some((re) => re.test(q));
}

function hasGeoScope(query: string): boolean {
  return (
    isNationalItalyQuery(query) ||
    detectMapRegionsInQuery(query).length > 0 ||
    detectMapCitiesInQuery(query).length > 0
  );
}

export function isCentroOperativoSearchQuery(query: string): boolean {
  const q = norm(query);
  if (!q || q.length < 2) return false;

  if (PLATFORM_META_RE.some((re) => re.test(q))) {
    const operationalWithContext =
      /(imprese|operai|lavorator|commess|appalt|personale|albergh|condomin|profili|quanti)/.test(q);
    if (!operationalWithContext) return false;
  }

  if (PLATFORM_BRAND_RE.test(q) && !hasOperationalIntent(q)) {
    return false;
  }

  if (isCountQuery(q) && detectCrmEntityKind(q)) return true;
  if (hasOperationalIntent(q)) return true;
  if (hasGeoScope(query)) return true;

  return false;
}

export function wantsPersonnelSearch(query: string): boolean {
  return PERSONNEL_RE.test(norm(query));
}

export function wantsCompaniesOnlySearch(query: string): boolean {
  const q = norm(query);
  if (wantsPersonnelSearch(q)) return false;
  if (isCountQuery(q) && detectCrmEntityKind(q)) return true;
  return COMPANIES_ONLY_RE.test(q) && !PERSONNEL_RE.test(q);
}
