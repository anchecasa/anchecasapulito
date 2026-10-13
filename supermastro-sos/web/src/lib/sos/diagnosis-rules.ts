import { diyForTrade } from "@/lib/sos/diy";
import { OUT_OF_SCOPE_SLUG, isVideoSkill, videoSkillLabel } from "@/lib/sos/video-skills";

export type Esito = "fai_da_te" | "professionista" | "pericolo" | "da_verificare" | "fuori_tema";

export type ModelDraft = {
  inScope: boolean;
  luogo: "interno" | "esterno";
  skillSlug: string;
  skillLabel: string;
  urgency: "low" | "medium" | "high";
  confidence: number;
  summary: string;
  model: string;
  titolo: string;
  vistoSentito: string;
  primaCosa: string;
  motivoProfessionista: string;
  /** Trascrizione di ciò che la persona dice nel video. Vuota se nessuno parla. */
  parlato?: string;
  tempoMinuti: number | null;
  difficolta: "facile" | "media" | null;
  attrezzi: string[];
  passi: string[];
  /** Esito proposto dal modello. null se assente (vecchie diagnosi o prove). */
  esitoModello?: Esito | null;
  /** fai_da_te.possibile detto dal modello. null se assente. */
  diyPossibile?: boolean | null;
};

export type Pericolo = "gas" | "fuoco" | "crollo" | "elettrico" | "altro";

export type DiagnosisPayload = {
  visto_sentito: string;
  /** Trascrizione AI di ciò che la persona ha detto nel video (assente nelle diagnosi vecchie). */
  parlato?: string;
  prima_cosa: string;
  azioni: string[];
  fai_da_te: {
    possibile: boolean;
    tempo_minuti: number | null;
    difficolta: "facile" | "media" | null;
    attrezzi: string[];
    passi: string[];
  } | null;
  motivo_professionista: string;
  skill_label: string;
  luogo: "interno" | "esterno";
  urgency: "low" | "medium" | "high";
  summary: string;
  lat: number | null;
  lng: number | null;
  /** Solo per l'esito pericolo: che tipo di pericolo (per il numero da chiamare). */
  pericolo?: Pericolo | null;
};

export type RuledDiagnosis = {
  esito: Esito;
  titolo: string;
  skillSlug: string;
  skillLabel: string;
  confidence: number;
  model: string;
  payload: DiagnosisPayload;
};

const CONFIDENCE_FLOOR = 0.6;

// ---------------------------------------------------------------------------
// Segnali di pericolo: si cercano solo in ciò che il modello ha visto e sentito
// (titolo, visto_sentito, summary, motivo), non nei passi suggeriti, che
// contengono istruzioni come "chiudi l'acqua" o "stacca la presa".
// ---------------------------------------------------------------------------

const GAS_WORD = /\bgas\b|\bgpl\b|\bmetano\b/;
const GAS_SIGN = /odore|puzza|sibil|fischi|fuga|fuoriusc|esce gas|perdita di gas|perde gas|sento (il )?gas/;
const FUOCO = /\bfiamm|\bfum(o|i|a|ano)\b|incendi|bruciat|bruciacchiat|cortocircuit|corto circuito|\bscintill|\bscoppiett|sfrigol/;
const CROLLO = /crollo|crollat|crolla|che cede|sta cedendo|cedimento|soffitto che cade|calcinacci che cadono|trave spezzat/;
const ELECTRIC_THING =
  "(pres[ae]|spin[ae]|ciabatt\\w*|quadr[oi] elettric\\w*|quadro della (luce|corrente)|quadro generale|salvavita|cav[io]|fili|interruttor\\w*|elettrodomestic\\w* (collegat|acces|attaccat)\\w*|collegat\\w* alla corrente|attaccat\\w* alla corrente|sotto tensione)";
const WET = "(acqua|bagnat\\w*|allagat\\w*|gocciol\\w*|infiltrazion\\w*)";
const WATER_ELECTRIC = [
  new RegExp(`\\b${WET}\\b[^.;]{0,50}\\b${ELECTRIC_THING}`),
  new RegExp(`\\b${ELECTRIC_THING}\\b[^.;]{0,40}\\b${WET}`),
];
/** Annerito è pericolo solo vicino a prese, cavi, quadro: le fughe annerite dalla muffa no. */
const ELECTRIC_BLACK = [
  new RegExp(`\\b${ELECTRIC_THING}\\b[^.;]{0,40}\\bannerit`),
  new RegExp(`\\bannerit\\w*[^.;]{0,40}\\b${ELECTRIC_THING}`),
];
/**
 * Annerito o bruciato su muffa, fughe, silicone, pentole e cibo: guasto o sporco
 * normale, non un incendio. Si neutralizza prima di cercare il fuoco.
 */
const BENIGN_BURN =
  /\b(fughe|silicon\w*|piastrell\w*|muff\w*|pentol\w*|padell\w*|tegam\w*|teglie?|teglia|cibo|arrosto|torta|sugo|caffettiera|moka)\b[^.;]{0,40}\b(annerit\w*|bruciat\w*|bruciacchiat\w*)|\b(annerit\w*|bruciat\w*|bruciacchiat\w*)[^.;]{0,25}\b(muff\w*|fughe|silicon\w*)/g;
/** "lampadina bruciata" è un guasto normale, non un incendio. */
const LAMPADINA = /lampadin\w*( \w+){0,2} (e )?bruciat\w*|bruciat\w* (la |una )?lampadin\w*/g;

// ---------------------------------------------------------------------------
// Mai fai da te: lavori soggetti a DM 37/08, gas, quota, strutture, amianto.
// Qui si guarda tutto il testo, passi compresi ("sali sulla scala").
// ---------------------------------------------------------------------------

const NEVER_DIY = [
  /\bgas\b|\bgpl\b|\bmetano\b/,
  /caldai|scaldabagno a gas|bruciatore/,
  /quadr[oi] elettric|quadro della (luce|corrente)|quadro generale|salvavita|differenzial|impianto elettric|contatore|messa a terra|\bdm\s*37/,
  /tubi in pressione|in pressione|autoclave/,
  /\btett[oi]\b|grondai|pluvial|\bscal[ae]\b|in quota|in altezza|lavori in altezza|cornicion|abbaino/,
  /(crep[ae]|crepat|lesion[ei]|fessur\w*|spaccatur\w*)[^.;]{0,40}(struttural|portant|pilastr|\btrav|solai|fondazion|muro|muri|parete|soffitt|balcon)/,
  /struttural|muro portante|parete portante|pilastr/,
  /amianto|eternit/,
];

const GUIDE_PART: Record<string, RegExp> = {
  idraulico: /sifone|sotto il lavandino/,
  fabbro: /serratura|cilindro/,
  giardiniere: /irrigat|testina/,
  climatizzazione: /filtro del climatizzatore|filtro sporco/,
  imbianchino: /scrostat|pittura/,
  piastrellista: /piastrell/,
  falegname: /anta|cerniera/,
  serramentista: /finestra|persiana|binario/,
};

function plain(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’`]/g, "'");
}

function clip(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function coords(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Segnale di pericolo nel testo osservato. Esportata per i test. */
export function dangerOf(observed: string): Exclude<Pericolo, "altro"> | null {
  const text = plain(observed).replace(LAMPADINA, "lampadina guasta").replace(BENIGN_BURN, "macchia scura");
  if (GAS_WORD.test(text) && GAS_SIGN.test(text)) return "gas";
  if (/odore di gas|puzza di gas|fuga di gas|sibilo di gas/.test(text)) return "gas";
  if (CROLLO.test(text)) return "crollo";
  if (WATER_ELECTRIC.some((rule) => rule.test(text))) return "elettrico";
  if (ELECTRIC_BLACK.some((rule) => rule.test(text))) return "elettrico";
  if (FUOCO.test(text)) {
    return /scintill|cortocircuit|corto circuito|presa|spina|cav[io]|fili|quadro|interruttor/.test(text)
      ? "elettrico"
      : "fuoco";
  }
  return null;
}

/**
 * Nei passi suggeriti le frasi negative ("non salire sulla scala", "non serve
 * chiudere il gas") sono avvertenze, non lavori: non devono bloccare il fai da te.
 * Nel testo osservato invece restano tutte ("la caldaia non parte").
 */
export function affirmativeOnly(lines: string[]): string {
  return lines
    .flatMap((line) => line.split(/[.;!?]+/))
    .map((part) => part.trim())
    .filter((part) => part && !/^(non|mai|evita|senza)\b/i.test(part) && !/\bnon (serve|c'?e|bisogna|toccare|salire|usare|aprire)\b/i.test(plain(part)))
    .join(". ");
}

/** Lavoro che non si fa da solo. Esportata per i test. */
export function neverDiy(text: string): boolean {
  const value = plain(text);
  return NEVER_DIY.some((rule) => rule.test(value));
}

function azioniFor(danger: Pericolo, primaCosa: string): string[] {
  if (danger === "gas") {
    return [
      "Non accendere luci, fiamme o interruttori.",
      "Apri le finestre ed esci.",
      "Chiudi il gas solo se la manopola è subito accanto a te.",
      "Chiama il pronto intervento da fuori.",
    ];
  }
  if (danger === "fuoco") {
    return [
      "Fai uscire tutti.",
      "Chiudi la porta della stanza se c'è fumo.",
      "Non rientrare.",
      "Chiama il pronto intervento.",
    ];
  }
  if (danger === "crollo") {
    return [
      "Allontanati e non rientrare.",
      "Non spostare i pezzi caduti.",
      "Tieni lontani bambini e animali.",
      "Chiama il pronto intervento.",
    ];
  }
  if (danger === "elettrico") {
    return [
      "Non toccare presa, cavi o acqua.",
      "Stacca la corrente solo se l'interruttore è asciutto e lontano dal guasto.",
      "Allontana le persone.",
      "Chiama il pronto intervento.",
    ];
  }
  const first = clip(primaCosa, 160);
  return [
    ...(first ? [first] : []),
    "Allontanati dal guasto e fai allontanare le persone.",
    "Non toccare niente e non provare a riparare.",
    "Chiama il pronto intervento.",
  ].slice(0, 4);
}

function emptyPayload(draft: ModelDraft, place: { lat: number | null; lng: number | null }): DiagnosisPayload {
  return {
    visto_sentito: clip(draft.vistoSentito || draft.summary, 160),
    parlato: clip(draft.parlato ?? "", 300),
    prima_cosa: "",
    azioni: [],
    fai_da_te: null,
    motivo_professionista: "",
    skill_label: draft.skillLabel,
    luogo: draft.luogo,
    urgency: draft.urgency,
    summary: clip(draft.summary, 160),
    lat: place.lat,
    lng: place.lng,
  };
}

function withSafety(prima: string, passi: string[]) {
  const first = prima.trim();
  if (!first) return passi;
  if (passi.some((step) => plain(step).includes(plain(first)))) return passi;
  return [first, ...passi];
}

/**
 * Regole di sicurezza sul server, dopo la risposta del modello.
 * Ordine: pericolo (anche con confidenza bassa: prima la sicurezza) → fuori tema
 * → confidenza bassa → esito del modello → mai fai da te → fai da te.
 */
export function applyRules(
  draft: ModelDraft,
  place: { lat?: number | null; lng?: number | null } = {},
): RuledDiagnosis {
  const lat = coords(place.lat);
  const lng = coords(place.lng);
  const observed = [draft.titolo, draft.vistoSentito, draft.summary, draft.motivoProfessionista].join(". ");
  const instructions = affirmativeOnly([draft.primaCosa, ...draft.passi, ...draft.attrezzi]);
  const skillSlug = isVideoSkill(draft.skillSlug) ? draft.skillSlug : OUT_OF_SCOPE_SLUG;
  const skillLabel = isVideoSkill(skillSlug) ? videoSkillLabel(skillSlug) : "";
  const base: ModelDraft = { ...draft, skillSlug, skillLabel };
  const payload = emptyPayload(base, { lat, lng });
  const esitoModello = draft.esitoModello ?? null;

  // Prima la sicurezza: il pericolo vale anche se il modello è poco sicuro
  // o se pensa che la scena non sia di casa.
  // Anche le parole della persona contano per il pericolo ("sento puzza di gas").
  const signal = dangerOf([observed, draft.parlato ?? ""].join(". "));
  if (signal || esitoModello === "pericolo") {
    const danger: Pericolo = signal ?? "altro";
    const azioni = azioniFor(danger, draft.primaCosa);
    return {
      esito: "pericolo",
      titolo: "Attenzione: non farlo da solo",
      skillSlug,
      skillLabel,
      confidence: draft.confidence,
      model: draft.model,
      payload: {
        ...payload,
        prima_cosa: azioni[0] ?? "",
        azioni,
        urgency: "high",
        pericolo: danger,
      },
    };
  }

  if (!draft.inScope || skillSlug === OUT_OF_SCOPE_SLUG) {
    return {
      esito: "fuori_tema",
      titolo: "Questo non è un problema di casa",
      skillSlug: OUT_OF_SCOPE_SLUG,
      skillLabel: "",
      confidence: draft.confidence,
      model: draft.model,
      payload: {
        ...payload,
        skill_label: "",
        visto_sentito: clip(
          draft.vistoSentito || draft.summary || "Il video non mostra un guasto di casa o di giardino.",
          160,
        ),
      },
    };
  }

  if (draft.confidence < CONFIDENCE_FLOOR || esitoModello === "da_verificare") {
    return {
      esito: "da_verificare",
      titolo: "Non vedo bene",
      skillSlug,
      skillLabel,
      confidence: draft.confidence,
      model: draft.model,
      payload,
    };
  }

  if (esitoModello === "fuori_tema") {
    return {
      esito: "fuori_tema",
      titolo: "Questo non è un problema di casa",
      skillSlug: OUT_OF_SCOPE_SLUG,
      skillLabel: "",
      confidence: draft.confidence,
      model: draft.model,
      payload: { ...payload, skill_label: "" },
    };
  }

  const professionista = (motivo: string): RuledDiagnosis => ({
    esito: "professionista",
    titolo: clip(draft.titolo || draft.summary || `Serve un ${skillLabel.toLowerCase()}`, 60),
    skillSlug,
    skillLabel,
    confidence: draft.confidence,
    model: draft.model,
    payload: {
      ...payload,
      // Anche quando serve il professionista, la persona sa cosa fare subito
      // (es. chiudere il rubinetto generale) mentre aspetta.
      prima_cosa: clip(draft.primaCosa, 160),
      motivo_professionista: clip(draft.motivoProfessionista || motivo, 160),
    },
  });

  if (neverDiy(observed) || neverDiy(instructions)) {
    return professionista("Questo lavoro non si fa da solo. Serve chi è abilitato.");
  }

  // Il modello dice che serve il professionista, o che il fai da te non è possibile:
  // non lo promuoviamo mai a fai da te.
  if (esitoModello === "professionista" || draft.diyPossibile === false) {
    return professionista("Da qui non basta una guida. Serve chi fa questo mestiere.");
  }

  const modelSteps = draft.passi.filter(Boolean);
  const usableModel = modelSteps.length >= 3 && (draft.difficolta === "facile" || draft.difficolta === "media");
  if (usableModel) {
    const passi = withSafety(draft.primaCosa, modelSteps).slice(0, 8);
    return {
      esito: "fai_da_te",
      titolo: clip(draft.titolo || draft.summary || "Puoi provarci tu", 60),
      skillSlug,
      skillLabel,
      confidence: draft.confidence,
      model: draft.model,
      payload: {
        ...payload,
        prima_cosa: clip(draft.primaCosa, 160),
        fai_da_te: {
          possibile: true,
          tempo_minuti: draft.tempoMinuti,
          difficolta: draft.difficolta,
          attrezzi: draft.attrezzi.slice(0, 8),
          passi,
        },
      },
    };
  }

  const part = GUIDE_PART[skillSlug];
  const guideFits = Boolean(part && part.test(plain(observed)));
  if (guideFits) {
    const guide = diyForTrade(skillLabel || skillSlug);
    const passi = withSafety(draft.primaCosa, guide.passi).slice(0, 8);
    if (passi.length >= 3) {
      return {
        esito: "fai_da_te",
        titolo: clip(draft.titolo || "Puoi provarci tu", 60),
        skillSlug,
        skillLabel,
        confidence: draft.confidence,
        model: draft.model,
        payload: {
          ...payload,
          prima_cosa: clip(draft.primaCosa || passi[0] || "", 160),
          visto_sentito: clip(draft.vistoSentito || guide.spiegazione, 160),
          fai_da_te: {
            possibile: true,
            tempo_minuti: draft.tempoMinuti,
            difficolta: draft.difficolta ?? "media",
            attrezzi: guide.attrezzi.slice(0, 8),
            passi,
          },
        },
      };
    }
  }

  return professionista("Da qui non basta una guida. Serve chi fa questo mestiere.");
}

export const SAMPLE_CASES: Record<string, ModelDraft> = {
  sifone: {
    inScope: true,
    luogo: "interno",
    skillSlug: "idraulico",
    skillLabel: "Idraulico",
    urgency: "medium",
    confidence: 0.9,
    summary: "Perde acqua dal sifone sotto il lavandino.",
    model: "prova",
    titolo: "Perde il sifone",
    vistoSentito: "Vedo acqua sul sifone sotto il lavandino. Non sento altri rumori.",
    primaCosa: "Chiudi l'acqua sotto il lavandino.",
    motivoProfessionista: "",
    tempoMinuti: null,
    difficolta: null,
    attrezzi: [],
    passi: [],
  },
  scintille: {
    inScope: true,
    luogo: "interno",
    skillSlug: "elettricista",
    skillLabel: "Elettricista",
    urgency: "high",
    confidence: 0.92,
    summary: "La presa fa scintille quando entra la spina.",
    model: "prova",
    titolo: "Presa con scintille",
    vistoSentito: "Vedo scintille sulla presa. Sento un crepitio.",
    primaCosa: "",
    motivoProfessionista: "",
    tempoMinuti: null,
    difficolta: null,
    attrezzi: [],
    passi: ["Stacca la spina."],
  },
  gas: {
    inScope: true,
    luogo: "interno",
    skillSlug: "idraulico",
    skillLabel: "Idraulico",
    urgency: "high",
    confidence: 0.88,
    summary: "Sento odore di gas e un sibilo di gas vicino al piano.",
    model: "prova",
    titolo: "Odore di gas",
    vistoSentito: "Sento odore di gas e un sibilo di gas. Non vedo una fiamma.",
    primaCosa: "",
    motivoProfessionista: "",
    tempoMinuti: null,
    difficolta: null,
    attrezzi: [],
    passi: [],
  },
  buio: {
    inScope: true,
    luogo: "interno",
    skillSlug: "idraulico",
    skillLabel: "Idraulico",
    urgency: "low",
    confidence: 0.3,
    summary: "Il video è buio. Non vedo il guasto.",
    model: "prova",
    titolo: "Video buio",
    vistoSentito: "Non vedo il guasto. Non sento un rumore chiaro.",
    primaCosa: "",
    motivoProfessionista: "",
    tempoMinuti: null,
    difficolta: null,
    attrezzi: [],
    passi: [],
  },
  auto: {
    inScope: false,
    luogo: "esterno",
    skillSlug: OUT_OF_SCOPE_SLUG,
    skillLabel: "",
    urgency: "low",
    confidence: 0.95,
    summary: "Il video mostra un'auto, non un guasto di casa.",
    model: "prova",
    titolo: "Un'auto",
    vistoSentito: "Vedo un'auto in strada. Non è un guasto di casa.",
    primaCosa: "",
    motivoProfessionista: "",
    tempoMinuti: null,
    difficolta: null,
    attrezzi: [],
    passi: [],
  },
};
