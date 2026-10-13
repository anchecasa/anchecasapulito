import type { Esito, ModelDraft } from "@/lib/sos/diagnosis-rules";
import { OUT_OF_SCOPE_SLUG, isVideoSkill, videoSkillLabel } from "@/lib/sos/video-skills";

// Lettura della risposta JSON del modello. Modulo puro: si prova con node --test.

export type RawDiagnosis = {
  in_scope?: unknown;
  luogo?: unknown;
  skill_slug?: unknown;
  urgency?: unknown;
  confidence?: unknown;
  summary?: unknown;
  esito?: unknown;
  titolo?: unknown;
  visto_sentito?: unknown;
  prima_cosa?: unknown;
  motivo_professionista?: unknown;
  parlato?: unknown;
  tipo_lavoro?: unknown;
  fai_da_te?: {
    possibile?: unknown;
    tempo_minuti?: unknown;
    difficolta?: unknown;
    attrezzi?: unknown;
    passi?: unknown;
  };
};

function clipSummary(value: string): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= 120) return text;
  return `${text.slice(0, 117).trimEnd()}...`;
}

function asUrgency(value: unknown): "low" | "medium" | "high" {
  if (value === "low" || value === "high" || value === "medium") return value;
  return "medium";
}

function asLuogo(value: unknown, skill: string): "interno" | "esterno" {
  if (value === "interno" || value === "esterno") return value;
  if (skill === "giardiniere" || skill === "lattoniere" || skill === "disinfestazione") {
    return "esterno";
  }
  return "interno";
}

function textList(value: unknown, max: number) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, max);
}

const ESITI: readonly Esito[] = ["fai_da_te", "professionista", "pericolo", "da_verificare", "fuori_tema"];

function asEsito(value: unknown): Esito | null {
  return typeof value === "string" && (ESITI as readonly string[]).includes(value) ? (value as Esito) : null;
}

export function parseDiagnosis(raw: RawDiagnosis, model: string): ModelDraft {
  const inScope = raw.in_scope === true;
  const slug = typeof raw.skill_slug === "string" ? raw.skill_slug.trim().toLowerCase() : "";
  const summary =
    typeof raw.summary === "string" && raw.summary.trim()
      ? clipSummary(raw.summary)
      : "Guasto visibile in casa o in giardino.";
  const confidence =
    typeof raw.confidence === "number" && Number.isFinite(raw.confidence)
      ? Math.min(1, Math.max(0, raw.confidence))
      : 0;

  const diy = raw.fai_da_te;
  const difficolta: "facile" | "media" | null =
    diy?.difficolta === "facile" ? "facile" : diy?.difficolta === "media" ? "media" : null;
  const tempo =
    typeof diy?.tempo_minuti === "number" && diy.tempo_minuti >= 1 && diy.tempo_minuti <= 180
      ? Math.round(diy.tempo_minuti)
      : null;
  const shared = {
    titolo: typeof raw.titolo === "string" ? raw.titolo.replace(/\s+/g, " ").trim().slice(0, 60) : "",
    vistoSentito: typeof raw.visto_sentito === "string" ? raw.visto_sentito.replace(/\s+/g, " ").trim().slice(0, 160) : "",
    primaCosa: typeof raw.prima_cosa === "string" ? raw.prima_cosa.replace(/\s+/g, " ").trim().slice(0, 160) : "",
    motivoProfessionista:
      typeof raw.motivo_professionista === "string"
        ? raw.motivo_professionista.replace(/\s+/g, " ").trim().slice(0, 160)
        : "",
    // Quello che la persona dice nel video, trascritto dal modello.
    parlato: typeof raw.parlato === "string" ? raw.parlato.replace(/\s+/g, " ").trim().slice(0, 300) : "",
    // 13.10.2026: i lavori di ristrutturazione non vanno agli artigiani ma al sopralluogo AncheCasa.
    ristrutturazione: raw.tipo_lavoro === "ristrutturazione",
    tempoMinuti: tempo,
    difficolta,
    attrezzi: textList(diy?.attrezzi, 8),
    passi: textList(diy?.passi, 8),
    // Esito e fai_da_te.possibile del modello restano nella bozza: le regole li usano.
    esitoModello: asEsito(raw.esito),
    diyPossibile: typeof diy?.possibile === "boolean" ? diy.possibile : null,
  };

  if (!inScope || slug === OUT_OF_SCOPE_SLUG || !isVideoSkill(slug)) {
    return {
      inScope: false,
      luogo: "interno",
      skillSlug: OUT_OF_SCOPE_SLUG,
      skillLabel: "",
      urgency: "low",
      confidence,
      summary: clipSummary(
        typeof raw.summary === "string" && raw.summary.trim()
          ? raw.summary
          : "Il video non mostra un problema di casa o di giardino.",
      ),
      model,
      ...shared,
      esitoModello: shared.esitoModello === "pericolo" ? "pericolo" : "fuori_tema",
    };
  }

  return {
    inScope: true,
    luogo: asLuogo(raw.luogo, slug),
    skillSlug: slug,
    skillLabel: videoSkillLabel(slug),
    urgency: asUrgency(raw.urgency),
    confidence,
    summary,
    model,
    ...shared,
  };
}

