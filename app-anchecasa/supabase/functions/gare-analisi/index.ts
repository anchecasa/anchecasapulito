// Funzione Supabase «gare-analisi» — app AncheCasa, modulo Gare (09.10.2026).
// Riceve il bando (PDF) o il suo testo e restituisce l'analisi: oggetto, ente, importo, scadenza,
// categorie SOA, requisiti, criteri, documenti, rischi e un punteggio «conviene partecipare» da 0 a 100.
// Il PDF NON viene salvato. Entra solo chi ha fatto l'accesso; le analisi contano nel limite giornaliero
// insieme a quelle di SuperMastro (funzione SQL app_prenota_analisi).
//
// Secrets (gli stessi di supermastro-analisi): GEMINI_API_KEY oppure ANTHROPIC_API_KEY (leggono il PDF),
// oppure OPENAI_API_KEY (solo testo incollato). Facoltative: GEMINI_MODEL, ANTHROPIC_MODEL, OPENAI_MODEL,
// ANALISI_AL_GIORNO, ANALISI_TOTALI_AL_GIORNO, DIAGNOSI_ORIGINI, AC_PUBLISHABLE_KEY, AC_SECRET_KEY.
// Pubblicazione: Edge Functions → Deploy a new function → Via Editor, nome gare-analisi.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const PROMPT = `Sei l'ufficio gare di un'impresa edile italiana. Leggi il bando o il disciplinare di gara e rispondi SOLO con un oggetto JSON in italiano semplice:
{
 "oggetto": "oggetto dell'appalto, max 160 caratteri",
 "ente": "stazione appaltante",
 "importo": numero in euro (base d'asta, senza IVA) oppure null,
 "scadenza": "data di scadenza delle offerte in formato AAAA-MM-GG oppure vuoto",
 "luogo": "comune dei lavori",
 "categorie": ["categorie SOA richieste, es. OG1 cl. II"],
 "criterio": "minor prezzo | offerta economicamente più vantaggiosa | altro",
 "requisiti": ["requisiti principali, max 8"],
 "documenti": ["documenti da preparare, max 10"],
 "sopralluogo": "obbligatorio / facoltativo / non previsto, con data se c'è",
 "rischi": ["punti critici o clausole pesanti, max 6"],
 "punteggio": numero da 0 a 100 = quanto conviene partecipare a un'impresa edile media con quelle categorie,
 "consiglio": "partecipa | valuta | lascia perdere, con il motivo in max 240 caratteri"
}
Non inventare: se un dato non c'è scrivi vuoto o null.`;

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

function normalizza(x: Record<string, unknown>) {
  const t = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
  const l = (v: unknown, k: number, n: number) => (Array.isArray(v) ? v : []).map((s) => t(s, n)).filter(Boolean).slice(0, k);
  const imp = Number(x.importo);
  const sc = t(x.scadenza, 10);
  return {
    oggetto: t(x.oggetto, 160), ente: t(x.ente, 120), importo: Number.isFinite(imp) && imp > 0 ? Math.round(imp * 100) / 100 : null,
    scadenza: /^\d{4}-\d{2}-\d{2}$/.test(sc) ? sc : "", luogo: t(x.luogo, 80), categorie: l(x.categorie, 8, 40),
    criterio: t(x.criterio, 80), requisiti: l(x.requisiti, 8, 200), documenti: l(x.documenti, 10, 160),
    sopralluogo: t(x.sopralluogo, 120), rischi: l(x.rischi, 6, 200),
    punteggio: Math.max(0, Math.min(100, Math.round(Number(x.punteggio) || 0))), consiglio: t(x.consiglio, 260),
  };
}

const json = (t: string) => { const a = t.indexOf("{"), b = t.lastIndexOf("}"); return JSON.parse(a >= 0 && b > a ? t.slice(a, b + 1) : "{}"); };

async function conGemini(pdf: string | null, testo: string) {
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
  const parts: unknown[] = [];
  if (pdf) parts.push({ inline_data: { mime_type: "application/pdf", data: pdf } });
  parts.push({ text: PROMPT + (testo ? "\n\nTesto del bando:\n" + testo : "") });
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": Deno.env.get("GEMINI_API_KEY") || "" },
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { temperature: 0.1, response_mime_type: "application/json" } }),
    signal: AbortSignal.timeout(90000),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const j = await r.json();
  return json(j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "{}");
}
async function conClaude(pdf: string | null, testo: string) {
  const content: unknown[] = [];
  if (pdf) content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf } });
  content.push({ type: "text", text: (testo ? "Testo del bando:\n" + testo + "\n\n" : "") + "Rispondi solo con il JSON." });
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") || "", "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5-5", max_tokens: 2500, system: PROMPT, messages: [{ role: "user", content }] }),
    signal: AbortSignal.timeout(90000),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}`);
  const j = await r.json();
  return json((j?.content || []).map((p: { type: string; text?: string }) => (p.type === "text" ? p.text || "" : "")).join(""));
}
async function conOpenAI(testo: string) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY") || ""}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini", temperature: 0.1, response_format: { type: "json_object" },
      messages: [{ role: "system", content: PROMPT }, { role: "user", content: testo }] }),
    signal: AbortSignal.timeout(90000),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}`);
  const j = await r.json();
  return json(j?.choices?.[0]?.message?.content || "{}");
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return rispondi({ error: "metodo_non_ammesso" }, 405, origin);
  if (Number(req.headers.get("Content-Length") || 0) > 15_000_000) return rispondi({ error: "file_troppo_grande" }, 413, origin);
  let utente: string | null = null;
  try { utente = await chiEUtente(req); } catch { utente = null; }
  if (!utente) return rispondi({ error: "accesso_richiesto" }, 401, origin);
  if (!chiave("segreta")) return rispondi({ error: "configurazione_mancante" }, 503, origin);
  let body: { pdf?: string; testo?: string };
  try { body = await req.json(); } catch { return rispondi({ error: "json_non_valido" }, 400, origin); }
  const pdf = typeof body.pdf === "string" && body.pdf.length < 14_000_000 && B64.test(body.pdf) ? body.pdf : null;
  const testo = String(body.testo || "").slice(0, 60000);
  if (!pdf && testo.length < 200) return rispondi({ error: "manca_il_bando" }, 400, origin);
  const motore = Deno.env.get("GEMINI_API_KEY") ? "gemini-gara" : Deno.env.get("ANTHROPIC_API_KEY") ? "claude-gara" : Deno.env.get("OPENAI_API_KEY") && testo ? "openai-gara" : "";
  if (!motore) return rispondi({ error: "motore_non_configurato" }, 503, origin);
  try {
    if (!(await prenota(utente, motore))) return rispondi({ error: "troppe_analisi_oggi" }, 429, origin);
  } catch (e) {
    console.error("gare-analisi prenota", e instanceof Error ? e.message : e);
    return rispondi({ error: "configurazione_mancante" }, 503, origin);
  }
  try {
    const grezza = motore === "gemini-gara" ? await conGemini(pdf, testo) : motore === "claude-gara" ? await conClaude(pdf, testo) : await conOpenAI(testo);
    return rispondi({ ok: true, motore, analisi: normalizza(grezza) }, 200, origin);
  } catch (e) {
    console.error("gare-analisi", e instanceof Error ? e.message : e);
    return rispondi({ error: "analisi_non_riuscita" }, 502, origin);
  }
});
