// Funzione Supabase «supermastro-analisi» — app AncheCasa (09.10.2026).
// Nasce da «diagnosi-video» (04.10.2026, web app del privato nelle viste): stesso cervello
// (prompt e controlli di sicurezza), in più:
//   - entra solo chi ha fatto l'accesso all'app (si controlla il suo token con Supabase Auth);
//   - limite di analisi al giorno per persona e in totale, PRENOTATE prima di chiamare l'IA
//     (funzione SQL app_prenota_analisi, sicura anche con richieste in parallelo);
//   - salva lei la richiesta (tabella marketplace.app_richieste) con l'analisi già controllata:
//     dal telefono l'analisi non si può falsificare;
//   - motore Claude (Anthropic) oltre a Gemini e OpenAI.
// Il video NON viene salvato: si analizza e si butta.
//
// Variabili (Supabase → Edge Functions → Secrets). Basta UNA chiave tra queste tre:
//   GEMINI_API_KEY (guarda il video intero; GEMINI_MODEL facoltativa, predefinita gemini-2.5-flash)
//   ANTHROPIC_API_KEY (guarda i fotogrammi; ANTHROPIC_MODEL facoltativa, predefinita claude-sonnet-5-5)
//   OPENAI_API_KEY (guarda i fotogrammi; OPENAI_MODEL facoltativa, predefinita gpt-4o-mini)
//   ANALISI_AL_GIORNO (facoltativa, predefinita 15 a persona), ANALISI_TOTALI_AL_GIORNO (facoltativa, predefinita 500)
//   DIAGNOSI_ORIGINI (consigliata: domini dell'app ammessi, separati da virgola)
// Chiavi di Supabase: le mette Supabase da solo (SUPABASE_URL e le chiavi del progetto). Se il progetto
// usa solo le chiavi nuove e la funzione risponde «configurazione_mancante», aggiungere nei Secrets
// AC_PUBLISHABLE_KEY (chiave sb_publishable_…) e AC_SECRET_KEY (chiave sb_secret_…): restano solo lì.
// Pubblicazione: dashboard Supabase → Edge Functions → Deploy a new function → «Via Editor»,
// nome supermastro-analisi, incollare questo file. «Verify JWT» si può lasciare spento: il controllo
// dell'utente lo fa la funzione stessa.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MESTIERI = [
  "idraulico", "elettricista", "fabbro", "muratore", "imbianchino", "falegname", "serramentista",
  "caldaista", "tecnico elettrodomestici", "tecnico condizionatori", "vetraio", "giardiniere",
  "impresa di pulizie", "antennista", "altro",
];

const PROMPT = `Sei il tecnico di AncheCasa. Guardi un breve video (o alcune foto) di un problema in una casa italiana, girato da un privato con il telefono.
Rispondi SOLO con un oggetto JSON, in italiano semplice, con questi campi:
{
 "problema": "nome breve del problema, max 60 caratteri",
 "descrizione": "cosa si vede e la causa più probabile, max 240 caratteri",
 "mestiere": uno tra ${MESTIERI.join(", ")},
 "urgenza": "bassa" | "media" | "alta",
 "pericolo": true | false,
 "motivo_pericolo": "perché è pericoloso, vuoto se non lo è",
 "fai_da_te": true | false,
 "passi": ["massimo 6 passi brevi e sicuri per risolvere da solo; vuoto se fai_da_te è false"],
 "attrezzi": ["attrezzi e ricambi necessari"],
 "avvertenze": ["quando fermarsi e chiamare un professionista"],
 "titolo_richiesta": "titolo per cercare un artigiano, 10-70 caratteri, es. 'Rubinetto della cucina che perde'",
 "testo_richiesta": "due righe che il privato manda all'artigiano, max 280 caratteri, senza dati personali",
 "confidenza": numero da 0 a 1,
 "chiarimento": "se il video non basta, cosa rifilmare; altrimenti vuoto"
}
Regole di sicurezza, obbligatorie:
- Odore di gas, caldaia o fornelli con fiamma anomala, fumo, scintille, cavi bruciati, quadro elettrico, acqua vicino a prese o fili, crepe nei muri portanti o nei soffitti, lavori sul tetto o in altezza, amianto: pericolo=true e fai_da_te=false. Se c'è odore di gas scrivi di aprire le finestre, non toccare interruttori, uscire e chiamare il pronto intervento gas o il 112.
- Su impianti a gas e quadri elettrici non dare mai passi di riparazione.
- Se non riconosci il problema: confidenza bassa, mestiere "altro", chiarimento con cosa rifilmare. Non inventare.
- Niente marche, niente prezzi.`;

type Diagnosi = Record<string, unknown>;

function cors(origin: string | null): Record<string, string> {
  const ammessi = (Deno.env.get("DIAGNOSI_ORIGINI") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = !ammessi.length || (origin && ammessi.includes(origin));
  const h: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (ok) h["Access-Control-Allow-Origin"] = origin || "*";
  return h;
}

function rispondi(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(origin) } });
}

const B64 = /^[A-Za-z0-9+/=]+$/;
const MIME_VIDEO = ["video/webm", "video/mp4", "video/quicktime", "video/3gpp", "video/mpeg"];

/** Pulisce e controlla la risposta del modello: qualsiasi campo strano viene scartato o corretto. */
export function normalizza(x: Diagnosi) {
  const testo = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const lista = (v: unknown, n: number, max: number) => (Array.isArray(v) ? v : []).map((s) => testo(s, max)).filter(Boolean).slice(0, n);
  const mestiere = MESTIERI.includes(String(x.mestiere)) ? String(x.mestiere) : "altro";
  const urgenza = ["bassa", "media", "alta"].includes(String(x.urgenza)) ? String(x.urgenza) : "media";
  const pericolo = x.pericolo === true;
  const faiDaTe = !pericolo && x.fai_da_te === true;
  const conf = Math.max(0, Math.min(1, Number(x.confidenza) || 0));
  return {
    problema: testo(x.problema, 60) || "Problema da verificare",
    descrizione: testo(x.descrizione, 240),
    mestiere,
    urgenza: pericolo ? "alta" : urgenza,
    pericolo,
    motivo_pericolo: pericolo ? testo(x.motivo_pericolo, 240) : "",
    fai_da_te: faiDaTe,
    passi: faiDaTe ? lista(x.passi, 6, 160) : [],
    attrezzi: lista(x.attrezzi, 8, 60),
    avvertenze: lista(x.avvertenze, 4, 160),
    titolo_richiesta: testo(x.titolo_richiesta, 70),
    testo_richiesta: testo(x.testo_richiesta, 280),
    confidenza: Math.round(conf * 100) / 100,
    chiarimento: testo(x.chiarimento, 160),
  };
}

async function conGemini(video: { mime: string; data: string } | null, fotogrammi: string[], nota: string) {
  const key = Deno.env.get("GEMINI_API_KEY") || "";
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
  const parts: unknown[] = [];
  if (video) parts.push({ inline_data: { mime_type: video.mime, data: video.data } });
  else fotogrammi.forEach((f) => parts.push({ inline_data: { mime_type: "image/jpeg", data: f } }));
  parts.push({ text: PROMPT + (nota ? `\nNota del privato: ${nota}` : "") });
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { temperature: 0.2, response_mime_type: "application/json" } }),
    signal: AbortSignal.timeout(45000),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const j = await r.json();
  const t = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "{}";
  return JSON.parse(t);
}

async function conClaude(fotogrammi: string[], nota: string) {
  const key = Deno.env.get("ANTHROPIC_API_KEY") || "";
  const model = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5-5";
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system: PROMPT,
      messages: [{
        role: "user",
        content: [
          ...fotogrammi.map((f) => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: f } })),
          { type: "text", text: "Fotogrammi del video del guasto, in ordine." + (nota ? ` Nota del privato: ${nota}` : "") + " Rispondi solo con il JSON." },
        ],
      }],
    }),
    signal: AbortSignal.timeout(50000),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}`);
  const j = await r.json();
  const t = (j?.content || []).map((p: { type: string; text?: string }) => (p.type === "text" ? p.text || "" : "")).join("");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  return JSON.parse(a >= 0 && b > a ? t.slice(a, b + 1) : "{}");
}

/** Chiavi del progetto: quelle che mette Supabase, oppure quelle scritte a mano nei Secrets. */
function chiave(tipo: "pubblica" | "segreta"): string {
  const daJson = (nome: string) => {
    try { const j = JSON.parse(Deno.env.get(nome) || "{}"); return String(j.default || Object.values(j)[0] || ""); } catch { return ""; }
  };
  if (tipo === "pubblica") return Deno.env.get("AC_PUBLISHABLE_KEY") || daJson("SUPABASE_PUBLISHABLE_KEYS") || Deno.env.get("SUPABASE_ANON_KEY") || "";
  return Deno.env.get("AC_SECRET_KEY") || daJson("SUPABASE_SECRET_KEYS") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}
const URL_SB = () => Deno.env.get("SUPABASE_URL") || "";
function intestazioniServizio(extra: Record<string, string> = {}) {
  const k = chiave("segreta");
  const h: Record<string, string> = { apikey: k, "Content-Type": "application/json", "Accept-Profile": "marketplace", "Content-Profile": "marketplace", ...extra };
  if (!k.startsWith("sb_")) h.Authorization = `Bearer ${k}`; // le chiavi vecchie (JWT) vanno anche qui
  return h;
}

/** Chi chiama: si chiede a Supabase Auth con il token della persona. */
async function chiEUtente(req: Request): Promise<string | null> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || !URL_SB() || !chiave("pubblica")) return null;
  const u = await fetch(`${URL_SB()}/auth/v1/user`, { headers: { apikey: chiave("pubblica"), Authorization: `Bearer ${token}` } });
  if (!u.ok) return null;
  const j = await u.json().catch(() => ({}));
  return typeof j?.id === "string" ? j.id : null;
}

/** Prenota un'analisi (conta e registra insieme). false = limite raggiunto. Errore = configurazione. */
async function prenota(utente: string, motore: string): Promise<boolean> {
  const r = await fetch(`${URL_SB()}/rest/v1/rpc/app_prenota_analisi`, {
    method: "POST",
    headers: intestazioniServizio(),
    body: JSON.stringify({
      p_utente: utente,
      p_max_utente: Math.max(1, Number(Deno.env.get("ANALISI_AL_GIORNO")) || 15),
      p_max_totale: Math.max(1, Number(Deno.env.get("ANALISI_TOTALI_AL_GIORNO")) || 500),
      p_motore: motore,
    }),
  });
  if (!r.ok) throw new Error(`prenotazione ${r.status}`);
  return (await r.json()) === true;
}

/** Salva la richiesta con l'analisi controllata. Restituisce l'id. */
async function salvaRichiesta(utente: string, d: ReturnType<typeof normalizza>, nota: string, citta: string): Promise<string> {
  const r = await fetch(`${URL_SB()}/rest/v1/app_richieste?select=id`, {
    method: "POST",
    headers: intestazioniServizio({ Prefer: "return=representation" }),
    body: JSON.stringify({
      privato: utente, analisi: d, problema: d.problema.slice(0, 80), mestiere: d.mestiere, urgenza: d.urgenza,
      pericolo: d.pericolo, nota: nota.slice(0, 400), citta: citta.slice(0, 80),
    }),
  });
  if (!r.ok) throw new Error(`salvataggio ${r.status}`);
  const j = await r.json();
  return String(j?.[0]?.id || "");
}

async function conOpenAI(fotogrammi: string[], nota: string) {
  const key = Deno.env.get("OPENAI_API_KEY") || "";
  const model = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Fotogrammi del video del guasto, in ordine." + (nota ? ` Nota del privato: ${nota}` : "") },
            ...fotogrammi.map((f) => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${f}`, detail: "low" } })),
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}`);
  const j = await r.json();
  return JSON.parse(j?.choices?.[0]?.message?.content || "{}");
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return rispondi({ error: "metodo_non_ammesso" }, 405, origin);
  if (Number(req.headers.get("Content-Length") || 0) > 17_000_000) return rispondi({ error: "video_troppo_grande" }, 413, origin);

  // 1. Chi è (prima di leggere il video).
  let utente: string | null = null;
  try { utente = await chiEUtente(req); } catch { utente = null; }
  if (!utente) return rispondi({ error: "accesso_richiesto" }, 401, origin);
  if (!chiave("segreta")) return rispondi({ error: "configurazione_mancante" }, 503, origin);

  let body: { video?: string; video_mime?: string; fotogrammi?: string[]; nota?: string; citta?: string };
  try {
    body = await req.json();
  } catch {
    return rispondi({ error: "json_non_valido" }, 400, origin);
  }

  const fotogrammi = (Array.isArray(body.fotogrammi) ? body.fotogrammi : []).map(String).filter((f) => f.length < 1_500_000 && B64.test(f)).slice(0, 4);
  const mime = String(body.video_mime || "").split(";")[0].trim();
  const video = typeof body.video === "string" && body.video.length < 16_000_000 && MIME_VIDEO.includes(mime) && B64.test(body.video)
    ? { mime, data: body.video }
    : null;
  const nota = String(body.nota || "").slice(0, 200);
  const citta = String(body.citta || "").slice(0, 80);
  if (!video && !fotogrammi.length) return rispondi({ error: "manca_il_video" }, 400, origin);

  const motore = Deno.env.get("GEMINI_API_KEY") ? (video ? "gemini-video" : "gemini-foto")
    : Deno.env.get("ANTHROPIC_API_KEY") && fotogrammi.length ? "claude-foto"
    : Deno.env.get("OPENAI_API_KEY") && fotogrammi.length ? "openai-foto" : "";
  if (!motore) return rispondi({ error: "motore_non_configurato" }, 503, origin);

  // 2. Prenota (limite al giorno), poi 3. analizza, poi 4. salva.
  try {
    if (!(await prenota(utente, motore))) return rispondi({ error: "troppe_analisi_oggi" }, 429, origin);
  } catch (e) {
    console.error("supermastro-analisi prenota", e instanceof Error ? e.message : e);
    return rispondi({ error: "configurazione_mancante" }, 503, origin);
  }
  try {
    let grezza: Diagnosi;
    if (motore.startsWith("gemini")) grezza = await conGemini(video, fotogrammi, nota);
    else if (motore === "claude-foto") grezza = await conClaude(fotogrammi, nota);
    else grezza = await conOpenAI(fotogrammi, nota);
    const diagnosi = normalizza(grezza);
    const id = await salvaRichiesta(utente, diagnosi, nota, citta);
    return rispondi({ ok: true, motore, id, diagnosi }, 200, origin);
  } catch (e) {
    console.error("supermastro-analisi", e instanceof Error ? e.message : e);
    return rispondi({ error: "analisi_non_riuscita" }, 502, origin);
  }
});
