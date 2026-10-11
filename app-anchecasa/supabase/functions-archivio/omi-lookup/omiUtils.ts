export function normComune(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function normTipologia(tipologia: string | null | undefined): string {
  const t = (tipologia ?? "").toLowerCase();
  if (t.includes("commerc") || t.includes("negozio") || t.includes("uffic")) return "commerciale";
  if (t.includes("terren") || t.includes("area edific")) return "terreno";
  return "residenziale";
}

/** Quotazioni indicative €/mq per regione (OMI 2025-S1, fascia media). */
export const OMI_PER_REGIONE: Record<string, { min: number; max: number }> = {
  abruzzo: { min: 900, max: 1600 },
  basilicata: { min: 800, max: 1400 },
  calabria: { min: 700, max: 1300 },
  campania: { min: 1200, max: 2400 },
  "emilia-romagna": { min: 1800, max: 3200 },
  "emilia romagna": { min: 1800, max: 3200 },
  "friuli venezia giulia": { min: 1400, max: 2600 },
  lazio: { min: 2100, max: 3800 },
  liguria: { min: 1800, max: 3200 },
  lombardia: { min: 2800, max: 4500 },
  marche: { min: 1100, max: 2000 },
  molise: { min: 800, max: 1400 },
  piemonte: { min: 1600, max: 2800 },
  puglia: { min: 1100, max: 2200 },
  sardegna: { min: 1000, max: 2000 },
  sicilia: { min: 900, max: 1800 },
  toscana: { min: 2000, max: 3500 },
  "trentino-alto adige": { min: 2200, max: 3800 },
  "trentino alto adige": { min: 2200, max: 3800 },
  umbria: { min: 1100, max: 1900 },
  "valle d'aosta": { min: 1800, max: 3000 },
  "valle daosta": { min: 1800, max: 3000 },
  veneto: { min: 1700, max: 3000 },
};

export function normRegione(v: string): string {
  return normComune(v).replace(/-/g, " ");
}

export function omiFromRegione(regione: string, tipologia: string) {
  const key = normRegione(regione);
  const band = OMI_PER_REGIONE[key];
  if (!band) return null;
  const factor = tipologia === "commerciale" ? 1.25 : tipologia === "terreno" ? 0.35 : 1;
  return {
    valoreMinMq: Math.round(band.min * factor),
    valoreMaxMq: Math.round(band.max * factor),
    zona: "Media regionale",
    regione: regione,
  };
}
