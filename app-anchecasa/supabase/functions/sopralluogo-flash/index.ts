// Funzione Supabase «sopralluogo-flash» — app AncheCasa (11.10.2026).
// L'agente registra una nota vocale durante il sopralluogo. Questa funzione:
//   1. controlla chi chiama (token della persona) e che possa lavorare su quel sopralluogo (app_flash_posso);
//   2. prenota l'analisi nel limite giornaliero (stessa regola di SuperMastro: app_prenota_analisi);
//   3. prende la nota vocale dal bucket «sopralluoghi» e la manda a Gemini;
//   4. salva trascrizione, computo (lavorazioni + quantità) e titolo edilizio SUGGERITO;
//   5. ricalcola la stima con i prezzari regionali (app_stima_calcola).
// L'AI non inventa prezzi: dà solo lavorazioni e quantità. I prezzi vengono dal prezzario caricato dall'admin.
// Il titolo edilizio è solo un suggerito: il tecnico lo conferma. Vincoli e zona sismica non li tocca.
// L'audio si tiene 90 giorni (app_impostazioni.stima_flash.audio_giorni), poi si cancella e resta il testo:
// la pulizia gira da sola a ogni analisi; l'admin può lanciarla con { "azione": "pulisci" }.
//
// Variabili (Supabase → Edge Functions → Secrets):
//   GEMINI_API_KEY (già presente per SuperMastro), GEMINI_MODEL facoltativa (predefinita gemini-2.5-flash)
//   FLASH_AL_GIORNO (facoltativa, predefinita 20 a persona), ANALISI_TOTALI_AL_GIORNO (facoltativa, 500)
//   DIAGNOSI_ORIGINI (consigliata: domini dell'app ammessi, separati da virgola)
//   AC_PUBLISHABLE_KEY / AC_SECRET_KEY solo se il progetto usa le chiavi nuove (come per supermastro-analisi)
// Pubblicazione: dashboard Supabase → Edge Functions → Deploy a new function → «Via Editor»,
// nome sopralluogo-flash, incollare questo file. «Verify JWT» si può lasciare spento.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TITOLI = ["da_verificare", "edilizia_libera", "cila", "scia", "scia_alternativa", "pdc"];
const UM = ["mq", "m", "n", "corpo"];
const MIME_AUDIO: Record<string, string> = { webm: "audio/webm", mp4: "audio/mp4", m4a: "audio/mp4", ogg: "audio/ogg" };
const MAX_AUDIO = 15_000_000; // oltre, Gemini non lo accetta in una sola richiesta (circa 15 minuti di nota)

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

function chiave(tipo: "pubblica" | "segreta"): string {
  const daJson = (nome: string) => {
    try { const j = JSON.parse(Deno.env.get(nome) || "{}"); return String(j.default || Object.values(j)[0] || ""); } catch { return ""; }
  };
  if (tipo === "pubblica") return Deno.env.get("AC_PUBLISHABLE_KEY") || daJson("SUPABASE_PUBLISHABLE_KEYS") || Deno.env.get("SUPABASE_ANON_KEY") || "";
  return Deno.env.get("AC_SECRET_KEY") || daJson("SUPABASE_SECRET_KEYS") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}
const URL_SB = () => Deno.env.get("SUPABASE_URL") || "";
function servizio(extra: Record<string, string> = {}) {
  const k = chiave("segreta");
  const h: Record<string, string> = { apikey: k, "Content-Type": "application/json", "Accept-Profile": "marketplace", "Content-Profile": "marketplace", ...extra };
  if (!k.startsWith("sb_")) h.Authorization = `Bearer ${k}`;
  return h;
}
function comePersona(token: string) {
  return { apikey: chiave("pubblica"), Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Accept-Profile": "marketplace", "Content-Profile": "marketplace" };
}
async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(`${URL_SB()}/rest/v1/${path}`, { ...init, headers: { ...servizio(), ...(init.headers as Record<string, string> || {}) } });
  if (!r.ok) throw new Error(`${path.split("?")[0]} ${r.status} ${(await r.text()).slice(0, 200)}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

async function chiEUtente(token: string): Promise<string | null> {
  if (!token || !URL_SB() || !chiave("pubblica")) return null;
  const u = await fetch(`${URL_SB()}/auth/v1/user`, { headers: { apikey: chiave("pubblica"), Authorization: `Bearer ${token}` } });
  if (!u.ok) return null;
  const j = await u.json().catch(() => ({}));
  return typeof j?.id === "string" ? j.id : null;
}
async function posso(token: string, sopralluogo: string): Promise<boolean> {
  const r = await fetch(`${URL_SB()}/rest/v1/rpc/app_flash_posso`, { method: "POST", headers: comePersona(token), body: JSON.stringify({ p_sopralluogo: sopralluogo }) });
  return r.ok && (await r.json()) === true;
}
async function sonoAdmin(token: string): Promise<boolean> {
  const r = await fetch(`${URL_SB()}/rest/v1/rpc/is_admin`, { method: "POST", headers: comePersona(token), body: "{}" });
  return r.ok && (await r.json()) === true;
}

function prompt(lavorazioni: { chiave: string; nome: string; um: string }[], s: Record<string, unknown>) {
  return `Sei il tecnico di cantiere di AncheCasa. Ascolti la nota vocale che un agente ha registrato durante un sopralluogo in una casa italiana.
Dati già scritti dall'agente: lavori «${String(s.lavori || "")}», superficie ${s.mq ? s.mq + " mq" : "non indicata"}, note «${String(s.note || "").slice(0, 400)}».
Rispondi SOLO con un oggetto JSON:
{
 "trascrizione": "la nota parola per parola, in italiano, senza aggiungere nulla",
 "computo": [ { "lavorazione": una chiave dell'elenco qui sotto oppure "", "descrizione": "breve, max 120 caratteri", "quantita": numero, "um": "mq" | "m" | "n" | "corpo", "stanza": "es. bagno, cucina; vuoto se generale" } ],
 "titolo": "edilizia_libera" | "cila" | "scia" | "scia_alternativa" | "pdc" | "da_verificare",
 "titolo_motivo": "perché, max 300 caratteri, citando le lavorazioni",
 "dubbi": ["cose dette in modo poco chiaro o misure mancanti, max 5"]
}
Lavorazioni conosciute (usa la chiave esatta; se una lavorazione non c'è, lavorazione "" e descrivila):
${lavorazioni.map((l) => `- ${l.chiave}: ${l.nome} (${l.um})`).join("\n")}
Regole obbligatorie:
- Usa SOLO le quantità che l'agente dice o che si ricavano con un calcolo semplice da misure dette (es. 3 x 2,5 = 7,5 mq). Se una quantità non è detta, metti 0 e scrivila nei dubbi. Non inventare misure.
- Niente prezzi, niente marche, niente nomi di persone.
- Titolo edilizio: è solo un suggerimento per il tecnico. Opere interne senza toccare strutture né prospetti, con modifica di tramezzi o impianti: di solito CILA. Solo manutenzione ordinaria (pavimenti, tinteggiature, sanitari senza spostamenti): di solito edilizia libera. Interventi su strutture portanti, prospetti, aumenti di volume o cambi di destinazione: "da_verificare" e spiega perché. Nel dubbio: "da_verificare".
- Se l'audio è vuoto o incomprensibile: trascrizione vuota, computo vuoto, titolo "da_verificare", dubbi con il motivo.`;
}

function normalizza(x: Record<string, unknown>, chiavi: Map<string, string>) {
  const testo = (v: unknown, max: number) => String(v ?? "").replace(/[ \t]+/g, " ").trim().slice(0, max);
  const computo = (Array.isArray(x.computo) ? x.computo : []).slice(0, 80).map((r: Record<string, unknown>) => {
    const lav = chiavi.has(String(r?.lavorazione)) ? String(r.lavorazione) : "";
    const q = Math.max(0, Math.min(100000, Math.round((Number(r?.quantita) || 0) * 100) / 100));
    const um = UM.includes(String(r?.um)) ? String(r.um) : (lav ? chiavi.get(lav)! : "corpo");
    return { lavorazione: lav, descrizione: testo(r?.descrizione, 120) || "Lavorazione da descrivere", quantita: q, um, stanza: testo(r?.stanza, 40) };
  }).filter((r) => r.descrizione);
  const titolo = TITOLI.includes(String(x.titolo)) ? String(x.titolo) : "da_verificare";
  return {
    trascrizione: testo(x.trascrizione, 20000),
    computo,
    titolo,
    titolo_motivo: testo(x.titolo_motivo, 300),
    dubbi: (Array.isArray(x.dubbi) ? x.dubbi : []).map((d) => testo(d, 200)).filter(Boolean).slice(0, 5),
  };
}

function base64(buf: Uint8Array): string {
  let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}

async function conGemini(audio: Uint8Array, mime: string, testo: string) {
  const key = Deno.env.get("GEMINI_API_KEY") || "";
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ inline_data: { mime_type: mime, data: base64(audio) } }, { text: testo }] }],
      generationConfig: { temperature: 0.1, response_mime_type: "application/json" },
    }),
    signal: AbortSignal.timeout(110000),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const j = await r.json();
  const t = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "{}";
  return JSON.parse(t);
}

/** Cancella le note vocali scadute (resta la trascrizione). Restituisce quante. */
async function pulisci(max = 20): Promise<number> {
  const oggi = new Date().toISOString().slice(0, 10);
  const righe: { id: string; audio: string }[] = await rest(`app_sopralluoghi?select=id,audio&audio=neq.&audio_scade=lt.${oggi}&limit=${max}`);
  let n = 0;
  for (const r of righe || []) {
    const d = await fetch(`${URL_SB()}/storage/v1/object/sopralluoghi/${r.audio}`, { method: "DELETE", headers: servizio() });
    if (!d.ok && d.status !== 404) continue;
    await rest(`app_sopralluoghi?id=eq.${r.id}`, { method: "PATCH", body: JSON.stringify({ audio: "", audio_scade: null }) });
    n++;
  }
  return n;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return rispondi({ error: "metodo_non_ammesso" }, 405, origin);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  let utente: string | null = null;
  try { utente = await chiEUtente(token); } catch { utente = null; }
  if (!utente) return rispondi({ error: "accesso_richiesto" }, 401, origin);
  if (!chiave("segreta")) return rispondi({ error: "configurazione_mancante" }, 503, origin);

  let body: { azione?: string; sopralluogo?: string };
  try { body = await req.json(); } catch { return rispondi({ error: "json_non_valido" }, 400, origin); }

  if (body.azione === "pulisci") {
    if (!(await sonoAdmin(token))) return rispondi({ error: "solo_admin" }, 403, origin);
    try { return rispondi({ ok: true, cancellati: await pulisci(200) }, 200, origin); }
    catch (e) { console.error("flash pulisci", e instanceof Error ? e.message : e); return rispondi({ error: "pulizia_non_riuscita" }, 502, origin); }
  }

  const id = String(body.sopralluogo || "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return rispondi({ error: "sopralluogo_mancante" }, 400, origin);
  if (!(await posso(token, id))) return rispondi({ error: "non_autorizzato" }, 403, origin);
  if (!Deno.env.get("GEMINI_API_KEY")) return rispondi({ error: "motore_non_configurato" }, 503, origin);

  try {
    const [s] = await rest(`app_sopralluoghi?select=id,lavori,note,mq,audio,stato,computo_validato&id=eq.${id}`);
    if (!s?.audio) return rispondi({ error: "manca_la_nota_vocale" }, 400, origin);
    const est = String(s.audio).split(".").pop() || "";
    const mime = MIME_AUDIO[est];
    if (!mime) return rispondi({ error: "formato_audio" }, 400, origin);

    const prenota = await rest("rpc/app_prenota_analisi", {
      method: "POST",
      body: JSON.stringify({
        p_utente: utente,
        p_max_utente: Math.max(1, Number(Deno.env.get("FLASH_AL_GIORNO")) || 20),
        p_max_totale: Math.max(1, Number(Deno.env.get("ANALISI_TOTALI_AL_GIORNO")) || 500),
        p_motore: "gemini-audio-flash",
      }),
    });
    if (prenota !== true) return rispondi({ error: "troppe_analisi_oggi" }, 429, origin);

    const a = await fetch(`${URL_SB()}/storage/v1/object/sopralluoghi/${s.audio}`, { headers: servizio() });
    if (!a.ok) return rispondi({ error: "audio_non_trovato" }, 404, origin);
    const audio = new Uint8Array(await a.arrayBuffer());
    if (audio.length > MAX_AUDIO) return rispondi({ error: "audio_troppo_lungo" }, 413, origin);

    const lavorazioni: { chiave: string; nome: string; um: string }[] = await rest("app_stima_lavorazioni?select=chiave,nome,um&attiva=eq.true&order=chiave");
    const chiavi = new Map(lavorazioni.map((l) => [l.chiave, l.um]));
    const esito = normalizza(await conGemini(audio, mime, prompt(lavorazioni, s)), chiavi);

    const [imp] = await rest("app_impostazioni?select=valore&chiave=eq.stima_flash");
    const giorni = Number(imp?.valore?.audio_giorni) || 90;
    const scade = new Date(Date.now() + giorni * 86400000).toISOString().slice(0, 10);
    const modifica: Record<string, unknown> = { trascrizione: esito.trascrizione, audio_scade: scade };
    // Se l'ufficio ha già validato il computo, l'AI non lo sovrascrive.
    if (!s.computo_validato) modifica.computo = esito.computo;
    if (s.stato === "programmato") modifica.stato = "completato";
    await rest(`app_sopralluoghi?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(modifica) });

    // Titolo edilizio suggerito: solo se il tecnico non l'ha già confermato.
    const [p] = await rest(`app_sopralluoghi_pratica?select=titolo_da&sopralluogo=eq.${id}`);
    if (!p) {
      await rest("app_sopralluoghi_pratica", { method: "POST", body: JSON.stringify({ sopralluogo: id, titolo: esito.titolo, titolo_motivo: esito.titolo_motivo, titolo_da: "ai" }) });
    } else if (p.titolo_da === "ai") {
      await rest(`app_sopralluoghi_pratica?sopralluogo=eq.${id}`, { method: "PATCH", body: JSON.stringify({ titolo: esito.titolo, titolo_motivo: esito.titolo_motivo }) });
    }

    const stima = await rest("rpc/app_stima_calcola", { method: "POST", body: JSON.stringify({ p_sopralluogo: id }) });
    pulisci().catch((e) => console.error("flash pulisci", e instanceof Error ? e.message : e));
    return rispondi({ ok: true, ...esito, computo_tenuto: !!s.computo_validato, stima }, 200, origin);
  } catch (e) {
    console.error("sopralluogo-flash", e instanceof Error ? e.message : e);
    return rispondi({ error: "analisi_non_riuscita" }, 502, origin);
  }
});
