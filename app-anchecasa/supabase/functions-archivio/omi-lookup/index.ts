import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  normComune,
  normTipologia,
  omiFromRegione,
} from "./omiUtils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SEMESTRE = "2025-S1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const comune = String(body.comune ?? "").trim();
    const provincia = String(body.provincia ?? "").trim();
    const regioneHint = String(body.regione ?? "").trim();
    const tipologia = normTipologia(body.tipologia);
    const stato = String(body.stato ?? "normale").trim().toLowerCase();

    if (!comune) {
      const naz = omiFromRegione("Lombardia", tipologia);
      return jsonOk({
        comune: "Non specificato",
        zona: "Media nazionale",
        tipologia,
        stato,
        valoreMinMq: naz?.valoreMinMq ?? 1500,
        valoreMaxMq: naz?.valoreMaxMq ?? 2800,
        semestre: SEMESTRE,
        notaMetodologica:
          "Comune non indicato nell'annuncio PVP: stima OMI nazionale indicativa per analisi di fattibilità.",
        isFallback: true,
        matchLevel: "nazionale",
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const comuneNorm = normComune(comune);

    let matchLevel: "comune" | "regione" | "nazionale" = "comune";

    const { data: comuneOmi } = await supabase
      .from("omi_comuni")
      .select("*")
      .eq("comune_norm", comuneNorm)
      .eq("tipologia", tipologia)
      .maybeSingle();

    if (comuneOmi) {
      return jsonOk(mapRow(comuneOmi, comune, false, "comune"));
    }

    const { data: zoneRows } = await supabase
      .from("omi_quotazioni")
      .select("*")
      .eq("comune_norm", comuneNorm)
      .eq("tipologia", tipologia)
      .eq("stato", stato)
      .order("semestre", { ascending: false });

    if (zoneRows?.length) {
      const avgMin = Math.round(zoneRows.reduce((s, r) => s + Number(r.valore_min), 0) / zoneRows.length);
      const avgMax = Math.round(zoneRows.reduce((s, r) => s + Number(r.valore_max), 0) / zoneRows.length);
      return jsonOk({
        comune: String(zoneRows[0].comune ?? comune),
        zona: zoneRows.length > 1 ? `Media ${zoneRows.length} zone` : String(zoneRows[0].zona),
        tipologia,
        stato,
        valoreMinMq: avgMin,
        valoreMaxMq: avgMax,
        semestre: String(zoneRows[0].semestre ?? SEMESTRE),
        notaMetodologica:
          "Fonte OMI — media zone disponibili per il comune (Agenzia delle Entrate).",
        isFallback: false,
        matchLevel: "comune",
      });
    }

    const { data: fuzzyComune } = await supabase
      .from("omi_comuni")
      .select("*")
      .ilike("comune", comune)
      .eq("tipologia", tipologia)
      .limit(1)
      .maybeSingle();

    if (fuzzyComune) {
      return jsonOk(mapRow(fuzzyComune, comune, true, "comune"));
    }

    const regione =
      regioneHint ||
      (await resolveRegione(supabase, comuneNorm, provincia));

    if (regione) {
      const synth = omiFromRegione(regione, tipologia);
      if (synth) {
        matchLevel = "regione";
        return jsonOk({
          comune,
          zona: synth.zona,
          tipologia,
          stato,
          valoreMinMq: synth.valoreMinMq,
          valoreMaxMq: synth.valoreMaxMq,
          semestre: SEMESTRE,
          notaMetodologica:
            `Quotazione stimata da fascia OMI regionale (${regione}). Valori indicativi per analisi di fattibilità.`,
          isFallback: true,
          matchLevel,
          regione,
        });
      }
    }

    matchLevel = "nazionale";
    const naz = omiFromRegione("Lombardia", tipologia);
    return jsonOk({
      comune,
      zona: "Media nazionale",
      tipologia,
      stato,
      valoreMinMq: naz?.valoreMinMq ?? 1500,
      valoreMaxMq: naz?.valoreMaxMq ?? 2800,
      semestre: SEMESTRE,
      notaMetodologica: "Stima OMI nazionale indicativa.",
      isFallback: true,
      matchLevel,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Errore OMI" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function resolveRegione(
  supabase: ReturnType<typeof createClient>,
  comuneNorm: string,
  provincia: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("omi_comuni")
    .select("regione")
    .eq("comune_norm", comuneNorm)
    .limit(1)
    .maybeSingle();
  if (data?.regione) return String(data.regione);

  if (provincia) {
    const { data: byProv } = await supabase
      .from("omi_comuni")
      .select("regione")
      .ilike("provincia", provincia)
      .limit(1)
      .maybeSingle();
    if (byProv?.regione) return String(byProv.regione);
  }
  return null;
}

function mapRow(
  row: Record<string, unknown>,
  comuneFallback: string,
  isFallback: boolean,
  matchLevel: "comune" | "regione" | "nazionale",
) {
  return {
    comune: String(row.comune ?? comuneFallback),
    zona: String(row.zona ?? "Centro"),
    tipologia: String(row.tipologia ?? "residenziale"),
    stato: String(row.stato ?? "normale"),
    valoreMinMq: Number(row.valore_min),
    valoreMaxMq: Number(row.valore_max),
    semestre: String(row.semestre ?? SEMESTRE),
    notaMetodologica:
      "Fonte: Osservatorio del Mercato Immobiliare (OMI) — Agenzia delle Entrate.",
    isFallback,
    matchLevel,
    regione: row.regione ? String(row.regione) : undefined,
  };
}

function jsonOk(data: Record<string, unknown>) {
  return new Response(JSON.stringify({ ok: true, data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
