import type { ModelDraft } from "@/lib/sos/diagnosis-rules";
import { parseDiagnosis, type RawDiagnosis } from "@/lib/sos/parse-diagnosis";
import { loadApprovedExamples } from "@/lib/sos/diagnosis-examples";
import { OUT_OF_SCOPE_SLUG, VIDEO_SKILL_SLUGS, videoSkillPromptLines } from "@/lib/sos/video-skills";

const CONFIDENCE_FLOOR = 0.6;
const DEFAULT_FLASH = "gemini-3.7-flash";
const DEFAULT_PRO = "gemini-3.1-pro-preview";
const VIDEO_FPS = 5;
const MODEL_NAME = /^[a-zA-Z0-9._-]+$/;

type VideoPass = "first" | "second";

export type { ModelDraft };

export class VideoDiagnosisError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    in_scope: { type: "boolean" },
    luogo: { type: "string", enum: ["interno", "esterno"] },
    skill_slug: {
      type: "string",
      enum: [...VIDEO_SKILL_SLUGS, OUT_OF_SCOPE_SLUG],
    },
    urgency: { type: "string", enum: ["low", "medium", "high"] },
    confidence: { type: "number" },
    summary: { type: "string" },
    esito: {
      type: "string",
      enum: ["fai_da_te", "professionista", "pericolo", "da_verificare", "fuori_tema"],
    },
    titolo: { type: "string" },
    visto_sentito: { type: "string" },
    prima_cosa: { type: "string" },
    motivo_professionista: { type: "string" },
    parlato: { type: "string" },
    tipo_lavoro: { type: "string", enum: ["pronto_intervento", "ristrutturazione"] },
    fai_da_te: {
      type: "object",
      properties: {
        possibile: { type: "boolean" },
        tempo_minuti: { type: "number" },
        difficolta: { type: "string", enum: ["facile", "media"] },
        attrezzi: { type: "array", items: { type: "string" } },
        passi: { type: "array", items: { type: "string" } },
      },
      required: ["possibile", "tempo_minuti", "difficolta", "attrezzi", "passi"],
    },
  },
  required: [
    "in_scope",
    "luogo",
    "skill_slug",
    "urgency",
    "confidence",
    "summary",
    "esito",
    "titolo",
    "visto_sentito",
    "prima_cosa",
    "motivo_professionista",
    "parlato",
    "tipo_lavoro",
    "fai_da_te",
  ],
};

function modelId(value: string | undefined, fallback: string): string {
  const name = value?.trim() || fallback;
  if (!MODEL_NAME.test(name)) {
    throw new VideoDiagnosisError("Modello video non valido.", 500);
  }
  return name;
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function extractText(payload: unknown): string {
  const data = payload as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    }>;
    promptFeedback?: { blockReason?: string };
  };
  if (data.promptFeedback?.blockReason) {
    throw new VideoDiagnosisError(
      "Il video non può essere analizzato. Inquadra solo il guasto di casa o del giardino.",
      422,
    );
  }
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .filter((part) => part.thought !== true)
    .map((part) => part.text ?? "")
    .join("");
  if (!text.trim()) {
    throw new VideoDiagnosisError("Analisi vuota. Riprova inquadrando il guasto.", 502);
  }
  return text;
}

function cleanNote(note: string) {
  return note.replace(/[\u0000-\u001f«»]/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
}

function promptText(note: string, examples: string) {
  const hint = note
    ? `\nIl privato ha anche scritto, come aiuto: «${note}». Il mestiere lo decidi solo da ciò che vedi e senti nel video.`
    : "\nIl mestiere lo decidi solo da ciò che vedi e senti nel video.";
  const learned = examples
    ? `\nEsempi già approvati. Usali solo se il video è lo stesso caso. Non copiarli se la scena è diversa.\n${examples}`
    : "";
  return `Sei SuperMastro. Guardi e ascolti un video di circa 5 secondi.
Ascolta i rumori: gocciolio, sibilo, ronzio, scatti, scintille.
Ambito unico: interno di un'abitazione, oppure esterno della stessa casa, compreso giardino, cortile, balcone, terrazzo, cancello, recinzione, irrigazione, tetto e grondaia.
Se la scena è un'auto, una persona come soggetto, un negozio, un cantiere, un ufficio, una strada o qualunque luogo che non sia casa o giardino, imposta in_scope false e skill_slug ${OUT_OF_SCOPE_SLUG}.
Non identificare persone. Non leggere nomi, targhe o indirizzi. Descrivi solo il guasto visibile e i rumori che senti.${hint}${learned}
Se nel video qualcuno parla, trascrivi in parlato le sue parole esatte, in italiano, massimo 300 caratteri. Se nessuno parla, parlato è vuoto. Usa quello che dice per capire il guasto: spesso spiega cosa non va o da quando.
Compila esito, titolo, visto_sentito, parlato, tipo_lavoro, prima_cosa, motivo_professionista e fai_da_te.
tipo_lavoro è pronto_intervento se c'è un guasto da riparare o un pezzo da sostituire; è ristrutturazione se la persona vuole rifare o rinnovare un ambiente (bagno, cucina, pavimenti, una stanza, la facciata) o se servono più mestieri insieme. Nel dubbio pronto_intervento.
esito è la tua ipotesi: fai_da_te, professionista, pericolo, da_verificare o fuori_tema.
Se non è sicuro, metti da_verificare e passi vuoti. Se è pericoloso, passi e attrezzi vuoti e prima_cosa è l'azione di sicurezza.
Pericolo: odore o sibilo di gas, fiamma, fumo, odore di bruciato, scintille, cavi bruciati, acqua vicino a prese, quadro o cavi, crollo.
Mai fai da te: gas e raccordi del gas, caldaia, quadro elettrico, salvavita, impianto elettrico, tubi in pressione, tetto, grondaia, scale e lavori in altezza, crepe nei muri, amianto. Qui esito è professionista e fai_da_te.possibile è false.
Scegli un solo mestiere:
${videoSkillPromptLines()}
summary è una frase in italiano, massimo 120 caratteri.
confidence va da 0, incerto, a 1, guasto evidente.
urgency è high se esce acqua, ci sono scintille, odore di gas, crollo o un nido di insetti. medium se il guasto blocca l'uso. low se è lento o estetico.`;
}

async function generate(
  model: string,
  apiKey: string,
  bytes: Uint8Array,
  mime: string,
  pass: VideoPass,
  precise: boolean,
  note: string,
  examples: string,
): Promise<ModelDraft> {
  const generationConfig: Record<string, unknown> = {
    // Il ragionamento consuma token di uscita: con 2048 il JSON poteva arrivare troncato.
    maxOutputTokens: precise ? (pass === "second" ? 8192 : 4096) : 1024,
    responseMimeType: "application/json",
    responseSchema: RESPONSE_SCHEMA,
  };
  if (precise) {
    generationConfig.mediaResolution = "MEDIA_RESOLUTION_HIGH";
    generationConfig.thinkingConfig = {
      thinkingLevel: pass === "second" ? "HIGH" : "LOW",
    };
  }

  const videoPart: Record<string, unknown> = {
    inlineData: {
      mimeType: mime,
      data: toBase64(bytes),
    },
  };
  if (precise) {
    videoPart.videoMetadata = { fps: VIDEO_FPS };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        generationConfig,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: promptText(note, examples),
              },
              videoPart,
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    if (precise && response.status === 400) {
      return generate(model, apiKey, bytes, mime, pass, false, note, examples);
    }
    throw new VideoDiagnosisError("Analisi non riuscita. Riprova tra poco.", 502);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new VideoDiagnosisError("Analisi non riuscita. Riprova tra poco.", 502);
  }

  const text = extractText(payload);
  try {
    return parseDiagnosis(JSON.parse(text) as RawDiagnosis, model);
  } catch (err) {
    if (err instanceof VideoDiagnosisError) throw err;
    throw new VideoDiagnosisError("Analisi non riuscita. Riprova inquadrando il guasto.", 502);
  }
}

export async function diagnoseHomeVideo(
  bytes: Uint8Array,
  mime: string,
  note = "",
): Promise<ModelDraft> {
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new VideoDiagnosisError("Analisi video non configurata. Manca GEMINI_API_KEY.", 503);
  }

  const hint = cleanNote(note);
  const examples = await loadApprovedExamples();
  const flash = modelId(process.env.GEMINI_VIDEO_MODEL, DEFAULT_FLASH);
  const pro = modelId(process.env.GEMINI_VIDEO_MODEL_PRO, DEFAULT_PRO);
  const first = await generate(flash, apiKey, bytes, mime, "first", true, hint, examples);
  if (!first.inScope || first.confidence >= CONFIDENCE_FLOOR || flash === pro) return first;

  try {
    const second = await generate(pro, apiKey, bytes, mime, "second", true, hint, examples);
    return second;
  } catch {
    return first;
  }
}
