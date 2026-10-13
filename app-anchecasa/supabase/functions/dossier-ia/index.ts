// dossier-ia · l'intelligenza artificiale (Gemini) per il sopralluogo di tutta la casa (12.10.2026, app-28 e app-29).
//
//   { azione: "analizza", id }   (token dell'admin, del tecnico o dell'agente della pratica)
//     Legge solo foto e planimetria, più le note vocali. Il video del giro della casa non si manda a Gemini:
//     resta allegato ai documenti del dossier che vanno al tecnico per il preventivo.
//     e prepara la RELAZIONE DI SOPRALLUOGO: sintesi, stato di ogni ambiente interno ed esterno (anche giardino, facciata,
//     copertura, terrazzi), materiali, criticità con gravità, impianti, sicurezza (amianto sospetto, crepe, umidità),
//     efficienza energetica, interventi con priorità, voci del computo (MAI prezzi), fasi e durata indicativa,
//     documenti da chiedere, didascalie delle foto, trascrizioni, titolo edilizio suggerito, dubbi da chiedere all'agente.
//     Lavora in background: risponde subito { stato: "in_corso" } e salva il risultato nella colonna «ia» della pratica.
//   { azione: "stato", id }      → la colonna «ia» (per sapere quando ha finito).
//   { azione: "render", id, media_id, stile, indicazioni }
//     «Crea il dopo»: dalla foto vera disegna come potrebbe venire (stessa stanza, stesse finestre e porte).
//     Salva l'immagine nel bucket «sopralluoghi» come foto con fonte 'ia' e prima_id = la foto di partenza.
//
// Le misure non si stimano mai dalle foto (troppo errore): solo planimetria quotata, voce o misure scritte dall'agente.
// I file vanno a Gemini con la Files API (fino a 2 GB l'uno, cancellati da Google dopo 48 ore).
// Segreti: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY. Facoltativi: GEMINI_MODEL, GEMINI_IMAGE_MODEL.
// Modelli (12.10.2026): testo «gemini-3.8-flash», immagini «gemini-3.1-flash-image». Se un modello non risponde si prova il successivo.
// Deploy con verify_jwt spento (il controllo di chi chiama è qui dentro).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBBLICA = Deno.env.get("AC_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "sb_publishable_QbYv61SkMkjA9_GGb1hhOA_6v6GEw87";
const KEY = () => Deno.env.get("GEMINI_API_KEY") || "";
const G = "https://generativelanguage.googleapis.com";
const MODELLI = [Deno.env.get("GEMINI_MODEL"), "gemini-3.8-flash", "gemini-3.6-flash", "gemini-2.5-flash"].filter(Boolean) as string[];
const MODELLI_IMG = [Deno.env.get("GEMINI_IMAGE_MODEL"), "gemini-3.1-flash-image", "gemini-3-pro-image", "gemini-nano-banana-2.1"].filter(Boolean) as string[];
const MAX_FOTO = 40, MAX_AUDIO = 20, MAX_VIDEO = 6, MAX_RENDER = 24; // un audio per ambiente, più l'audio finale. I video restano allegati e non si mandano.

const SERVIZI: [string, string][] = [
  ["demolizioni", "Demolizioni e scavi"], ["murature", "Opere murarie"], ["strutture", "Strutture in cemento armato"], ["cartongesso", "Cartongesso"],
  ["intonaci", "Intonaci e rasature"], ["pavimenti", "Pavimenti e rivestimenti"], ["tinteggiatura", "Tinteggiatura"], ["cappotto", "Cappotto e isolamento"],
  ["tetto", "Tetti e impermeabilizzazioni"], ["infissi", "Infissi e serramenti"], ["carpenteria", "Carpenteria e ferro"], ["ponteggi", "Ponteggi"],
  ["imp_elettrico", "Impianto elettrico"], ["imp_idraulico", "Impianto idraulico"], ["imp_termico", "Riscaldamento e climatizzazione"],
  ["imp_fotovoltaico", "Fotovoltaico"], ["imp_gas", "Impianto gas"], ["materiali", "Materiali e forniture (sanitari, cucine, porte…)"], ["noleggio", "Noleggio mezzi"],
  ["giardino", "Giardino e verde (prato, piante, irrigazione)"], ["esterni", "Pavimentazioni esterne, recinzioni, cancelli"],
];
const CHIAVI = new Set(SERVIZI.map((s) => s[0]));
const UM = ["mq", "m", "mc", "cad", "punti", "a corpo", "kg", "ore"];
const TITOLI = ["edilizia_libera", "cila", "scia", "pdc", "da_verificare"];
const CATEGORIE = ["bagno", "cucina", "soggiorno", "camera", "studio", "corridoio", "ripostiglio", "lavanderia", "scala", "cantina", "box", "soffitta", "balcone", "terrazzo", "giardino", "cortile", "piscina", "facciata", "copertura", "altro"];
const GRAVITA = ["bassa", "media", "alta", "urgente"];
const PRIORITA = ["necessario", "consigliato", "migliorativo"];
const STILI: Record<string, string> = {
  base: "finiture essenziali e luminose: pareti bianche, pavimento in gres effetto legno chiaro, arredi semplici",
  medio: "stile contemporaneo caldo: gres effetto pietra, legno di rovere, luci a LED indirette, colori neutri",
  alto: "finiture di pregio: lastre grande formato effetto marmo, boiserie, rubinetteria incassata, illuminazione d'architetto",
  mediterraneo: "stile mediterraneo: cotto e maioliche, intonaco a calce bianco, legno naturale, verde",
  moderno: "stile moderno minimal: superfici lisce, grigio caldo e nero opaco, linee pulite",
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const uuid = (s: unknown) => typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const testo = (v: unknown, max: number) => String(v ?? "").replace(/[ \t]+/g, " ").trim().slice(0, max);
const numero = (v: unknown, max: number) => { const n = Math.round((Number(String(v ?? "").replace(",", ".")) || 0) * 100) / 100; return n > 0 && n <= max ? n : null; };
const voto = (v: unknown) => { const n = Math.round(Number(v)); return n >= 1 && n <= 5 ? n : null; };
const tra = <T,>(v: unknown, lista: T[], d: T) => (lista.includes(v as T) ? (v as T) : d);
const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const nfoto = (v: unknown, max: number) => arr(v).map((n) => Math.round(Number(n))).filter((n) => n >= 1 && n <= max).slice(0, 8);

function mimeDi(path: string, tipo: string, dato: string) {
  if (dato && dato !== "application/octet-stream") return dato;
  const e = (path.split(".").pop() || "").toLowerCase();
  if (tipo === "audio") return ({ webm: "audio/webm", ogg: "audio/ogg", mp3: "audio/mp3", m4a: "audio/aac", aac: "audio/aac", wav: "audio/wav", mp4: "audio/mp4" } as Record<string, string>)[e] || "audio/webm";
  if (tipo === "video") return ({ mov: "video/quicktime", webm: "video/webm", mp4: "video/mp4", "3gp": "video/3gpp" } as Record<string, string>)[e] || "video/mp4";
  return ({ png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif" } as Record<string, string>)[e] || "image/jpeg";
}

// ── Gemini ────────────────────────────────────────────────────────────────
async function carica(blob: Blob, mime: string, nome: string): Promise<{ uri: string; mime: string }> {
  const start = await fetch(`${G}/upload/v1beta/files`, {
    method: "POST",
    headers: { "x-goog-api-key": KEY(), "X-Goog-Upload-Protocol": "resumable", "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(blob.size), "X-Goog-Upload-Header-Content-Type": mime, "Content-Type": "application/json" },
    body: JSON.stringify({ file: { display_name: nome.slice(0, 120) } }),
  });
  const url = start.headers.get("x-goog-upload-url");
  if (!start.ok || !url) throw new Error("Gemini file " + start.status);
  const up = await fetch(url, { method: "POST", headers: { "Content-Length": String(blob.size), "X-Goog-Upload-Offset": "0", "X-Goog-Upload-Command": "upload, finalize" }, body: blob });
  if (!up.ok) throw new Error("Gemini file " + up.status);
  let f = (await up.json())?.file;
  // I video vanno elaborati: aspetta che il file sia ACTIVE (max ~90 secondi).
  for (let i = 0; f && f.state === "PROCESSING" && i < 45; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    f = await (await fetch(`${G}/v1beta/${f.name}`, { headers: { "x-goog-api-key": KEY() } })).json();
  }
  if (!f?.uri || f.state === "FAILED") throw new Error("Gemini file non pronto");
  return { uri: f.uri, mime: f.mimeType || mime };
}

async function genera(modelli: string[], corpo: Record<string, unknown>) {
  let ultimo = "";
  for (const m of modelli) {
    const r = await fetch(`${G}/v1beta/models/${encodeURIComponent(m)}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": KEY() }, body: JSON.stringify(corpo), signal: AbortSignal.timeout(300000),
    });
    if (r.ok) return { j: await r.json(), modello: m };
    let d = ""; try { d = String((await r.json())?.error?.message || "").replace(/AIza[0-9A-Za-z_-]+/g, "").slice(0, 140); } catch { d = ""; }
    ultimo = `Gemini ${r.status} ${d}`.trim();
    if (r.status !== 404 && r.status !== 400) break; // modello inesistente o non adatto: prova il prossimo; altro errore: fermati
  }
  throw new Error(ultimo || "Gemini");
}

function prompt(r: Record<string, unknown>, foto: string[], noteAudio: string[], nVideoAllegati: number) {
  const audioRiga = noteAudio.length ? noteAudio.map((n, i) => (i + 1) + "=" + (n || "audio")).join("; ") : "nessuna";
  return `Sei il direttore tecnico di AncheCasa, general contractor di ristrutturazioni in Italia. Un agente ha fatto un sopralluogo e ti manda il materiale.
Devi scrivere la RELAZIONE DI SOPRALLUOGO più professionale e completa possibile: la leggono il tecnico che fa il preventivo e, dopo il suo controllo, il cliente.
Materiale che vedi: ${foto.length} foto numerate (${foto.map((f, i) => (i + 1) + "=" + (f || "foto")).join("; ")}).
Note vocali, nell'ordine in cui ti arrivano: ${audioRiga}.
«Audio ambiente · nome» è la stanza appena chiusa: misure e lavori di quello spazio, da unire alle foto con lo stesso nome. «Audio chiusura» è l'ultimo, su tutta la casa: gusti, stili del cliente e problemi visti. Non è una stanza.
I video non ti arrivano (${nVideoAllegati} eventuali allegati vecchi, da ignorare). Non descriverli. L'array "video" deve essere [].
Scritto dall'agente: richiesta «${testo(r.descrizione, 600)}»; progetto «${testo(r.riepilogo, 1000)}»; note «${testo(r.nota_agente, 1000)}»; da controllare «${testo(r.criticita, 500)}»;
casa ${JSON.stringify(r.immobile || {}).slice(0, 600)}; misure ${JSON.stringify(r.ambienti || []).slice(0, 2500)}; comune ${testo(r.comune, 60)} (${testo(r.provincia, 2)}); finitura scelta ${testo(r.pacchetto, 10) || "non indicata"}.

Rispondi SOLO con un oggetto JSON con queste chiavi:
{
 "sintesi": "5-7 frasi in italiano chiaro e professionale: che immobile è, stato generale, cosa va fatto e perché, cosa conviene fare insieme",
 "immobile": { "tipologia": "appartamento|villa|villetta a schiera|casa indipendente|rustico|altro", "epoca": "es. anni '70 (stima)", "piani": "es. 2 fuori terra", "stato_generale": 1-5, "superficie_planimetria": mq solo se leggibile dalla planimetria altrimenti null, "note": "max 300 caratteri" },
 "ambienti": [ { "nome": "es. Soggiorno", "categoria": una di ${CATEGORIE.join("|")}, "esterno": true/false, "larg": metri o null, "lung": metri o null, "alt": metri o null, "superficie": mq o null, "fonte_misure": "planimetria|nota vocale|agente|nessuna",
     "stato": 1-5, "descrizione": "2-3 frasi: com'è oggi", "materiali": ["pavimento in cotto", "infissi in alluminio senza taglio termico", ...],
     "criticita": [ { "testo": "cosa e dove", "gravita": "bassa|media|alta|urgente", "foto": [numeri] } ],
     "interventi": [ { "testo": "cosa fare", "priorita": "necessario|consigliato|migliorativo" } ], "foto": [numeri delle foto di questo ambiente] } ],
 "impianti": [ { "tipo": "elettrico|idraulico|riscaldamento|gas|climatizzazione|scarichi|fotovoltaico", "stato": 1-5, "osservazioni": "max 200 caratteri", "da_verificare": true/false } ],
 "sicurezza": [ { "testo": "es. lastre in fibrocemento sul box: possibile amianto, serve analisi", "gravita": "bassa|media|alta|urgente" } ],
 "energia": { "osservazioni": "max 400 caratteri su dispersioni, infissi, impianti", "interventi": [ { "testo": "es. cappotto termico 10 cm", "beneficio": "es. meno dispersioni, comfort estivo", "incentivi": "es. detrazione possibile, da verificare con il tecnico" } ] },
 "voci": [ { "servizio": chiave, "voce": "max 120 caratteri", "qta": numero, "um": una di ${UM.join(", ")}, "ambiente": "nome", "priorita": "necessario|consigliato|migliorativo" } ],
 "fasi": [ { "nome": "es. Demolizioni e rimozioni", "settimane": numero, "descrizione": "max 160 caratteri" } ],
 "durata_settimane": numero totale indicativo,
 "foto": [ { "n": numero, "ambiente": "nome", "didascalia": "max 120 caratteri, cosa mostra e perché conta" } ],
 "trascrizioni": ["nota 1 parola per parola", ...],
 "video": [ { "n": numero, "sintesi": "cosa si vede, stanza per stanza, max 600 caratteri" } ],
 "documenti": ["documenti da chiedere al cliente: planimetria catastale, APE, conformità impianti, regolamento di condominio, titoli edilizi precedenti…"],
 "dubbi": ["misure mancanti o cose da chiedere all'agente, max 8"],
 "titolo": ${TITOLI.map((t) => '"' + t + '"').join("|")}, "titolo_motivo": "max 250 caratteri"
}
Chiavi dei servizi per le voci: ${SERVIZI.map((s) => s[0] + " (" + s[1] + ")").join("; ")}.
Regole obbligatorie:
- Considera TUTTA la casa: ogni stanza, impianti, facciata, copertura, balconi, giardino, cortile, recinzioni, piscina se ci sono. Un ambiente per ogni spazio che vedi o che viene nominato.
- MISURE: solo da planimetria quotata, nota vocale o misure scritte dall'agente. MAI dal video e MAI stimandole guardando le foto: null e scrivilo nei dubbi.
- Quantità delle voci: calcolale dalle misure (pavimento = L×P, pareti = perimetro × altezza − aperture). Senza misure: qta 0 e un dubbio.
- Niente prezzi, niente marche, niente nomi di persone. Tono professionale, frasi brevi, niente promesse.
- Sicurezza: segnala ciò che SEMBRA un rischio (amianto, crepe strutturali, distacchi, umidità di risalita, impianti non a norma) sempre come «da verificare».
- Stato da 1 (pessimo) a 5 (ottimo). Gravità: urgente solo per pericoli o danni che peggiorano in fretta.
- Energia e incentivi: solo indicazioni generali, sempre «da verificare con il tecnico».
- Titolo edilizio solo come suggerimento: opere interne con impianti o tramezzi di solito "cila"; manutenzione ordinaria "edilizia_libera"; strutture, prospetti, volumi, facciate in zone vincolate "da_verificare".
- Se un audio è vuoto o incomprensibile, scrivilo nei dubbi. Il video non lo commentare: non lo hai visto.`;
}

function normalizza(x: Record<string, unknown>, nFoto: number) {
  const imm = (x.immobile || {}) as Record<string, unknown>;
  const en = (x.energia || {}) as Record<string, unknown>;
  return {
    sintesi: testo(x.sintesi, 1400),
    immobile: { tipologia: testo(imm.tipologia, 40), epoca: testo(imm.epoca, 40), piani: testo(imm.piani, 40), stato_generale: voto(imm.stato_generale), superficie_planimetria: numero(imm.superficie_planimetria, 5000), note: testo(imm.note, 300) },
    ambienti: arr(x.ambienti).slice(0, 40).map((a: Record<string, unknown>) => ({
      nome: testo(a?.nome, 40) || "Ambiente", categoria: tra(a?.categoria, CATEGORIE, "altro"), esterno: !!a?.esterno,
      larg: numero(a?.larg, 200), lung: numero(a?.lung, 200), alt: numero(a?.alt, 20), superficie: numero(a?.superficie, 20000), fonte_misure: testo(a?.fonte_misure, 20),
      stato: voto(a?.stato), descrizione: testo(a?.descrizione, 500), materiali: arr(a?.materiali).map((m) => testo(m, 80)).filter(Boolean).slice(0, 10),
      criticita: arr(a?.criticita).slice(0, 10).map((c: Record<string, unknown>) => ({ testo: testo(c?.testo, 200), gravita: tra(c?.gravita, GRAVITA, "media"), foto: nfoto(c?.foto, nFoto) })).filter((c) => c.testo),
      interventi: arr(a?.interventi).slice(0, 12).map((c: Record<string, unknown>) => ({ testo: testo(c?.testo, 200), priorita: tra(c?.priorita, PRIORITA, "consigliato") })).filter((c) => c.testo),
      foto: nfoto(a?.foto, nFoto),
    })),
    impianti: arr(x.impianti).slice(0, 10).map((i: Record<string, unknown>) => ({ tipo: testo(i?.tipo, 30), stato: voto(i?.stato), osservazioni: testo(i?.osservazioni, 200), da_verificare: !!i?.da_verificare })).filter((i) => i.tipo),
    sicurezza: arr(x.sicurezza).slice(0, 10).map((s: Record<string, unknown>) => ({ testo: testo(s?.testo, 220), gravita: tra(s?.gravita, GRAVITA, "media") })).filter((s) => s.testo),
    energia: { osservazioni: testo(en.osservazioni, 400), interventi: arr(en.interventi).slice(0, 8).map((i: Record<string, unknown>) => ({ testo: testo(i?.testo, 120), beneficio: testo(i?.beneficio, 160), incentivi: testo(i?.incentivi, 160) })).filter((i) => i.testo) },
    voci: arr(x.voci).slice(0, 120).map((v: Record<string, unknown>) => ({
      servizio: CHIAVI.has(String(v?.servizio)) ? String(v.servizio) : "murature", voce: testo(v?.voce, 120), qta: numero(v?.qta, 100000),
      um: tra(v?.um, UM, "a corpo"), ambiente: testo(v?.ambiente, 40), priorita: tra(v?.priorita, PRIORITA, "necessario"),
    })).filter((v) => v.voce.length >= 2),
    fasi: arr(x.fasi).slice(0, 12).map((f: Record<string, unknown>) => ({ nome: testo(f?.nome, 60), settimane: numero(f?.settimane, 52) || 1, descrizione: testo(f?.descrizione, 160) })).filter((f) => f.nome),
    durata_settimane: numero(x.durata_settimane, 104),
    foto: arr(x.foto).slice(0, MAX_FOTO).map((f: Record<string, unknown>) => ({ n: Math.round(Number(f?.n)) || 0, ambiente: testo(f?.ambiente, 40), didascalia: testo(f?.didascalia, 120) })).filter((f) => f.n >= 1 && f.n <= nFoto),
    trascrizioni: arr(x.trascrizioni).map((t) => testo(t, 8000)).slice(0, MAX_AUDIO),
    video: [],
    documenti: arr(x.documenti).map((t) => testo(t, 120)).filter(Boolean).slice(0, 10),
    dubbi: arr(x.dubbi).map((t) => testo(t, 200)).filter(Boolean).slice(0, 8),
    titolo: tra(x.titolo, TITOLI, "da_verificare"), titolo_motivo: testo(x.titolo_motivo, 250),
  };
}

// ── Lettura completa (in background) ───────────────────────────────────────
async function analizza(admin: ReturnType<typeof createClient>, id: string) {
  const db = admin.schema("marketplace");
  const salva = (ia: Record<string, unknown>) => db.from("ristrutturazioni").update({ ia }).eq("id", id);
  const inizio = new Date().toISOString();
  try {
    const { data: r } = await db.from("ristrutturazioni").select("id,descrizione,riepilogo,nota_agente,criticita,ambienti,immobile,comune,provincia,pacchetto").eq("id", id).maybeSingle();
    const { data: media } = await db.from("ristrutturazioni_media").select("id,path,tipo,nota,fonte").eq("ristrutturazione_id", id).order("creato");
    const agente = (media || []).filter((m) => m.fonte !== "ia");
    const tutte = agente.filter((m) => m.tipo === "foto");
    const foto = tutte.filter((m) => /planimetri/i.test(m.nota || "")).concat(tutte.filter((m) => !/planimetri/i.test(m.nota || ""))).slice(0, MAX_FOTO);
    const audio = agente.filter((m) => m.tipo === "audio").slice(-MAX_AUDIO);
    const video = agente.filter((m) => m.tipo === "video").slice(-MAX_VIDEO);
    const parti: unknown[] = [];
    const idFoto: string[] = [], noteFoto: string[] = [], noteAudio: string[] = [];
    for (const m of [...audio, ...foto]) {
      const { data: blob } = await admin.storage.from("sopralluoghi").download(m.path);
      if (!blob) continue;
      const f = await carica(blob, mimeDi(m.path, m.tipo, blob.type), m.path.split("/").pop() || "file");
      parti.push({ file_data: { mime_type: f.mime, file_uri: f.uri } });
      if (m.tipo === "foto") { idFoto.push(m.id); noteFoto.push(testo(m.nota, 60)); }
      else noteAudio.push(testo(m.nota, 80));
    }
    if (!idFoto.length) throw new Error("niente_da_leggere");
    parti.push({ text: prompt(r || {}, noteFoto, noteAudio, video.length) });
    const { j, modello } = await genera(MODELLI, { contents: [{ role: "user", parts: parti }], generationConfig: { temperature: 0.2, response_mime_type: "application/json" } });
    const t = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "{}";
    const x = normalizza(JSON.parse(t.replace(/^```json\s*|\s*```$/g, "")), idFoto.length);
    await salva({ stato: "fatto", ...x, foto_id: idFoto, letti: { foto: idFoto.length, audio: noteAudio.length, video: 0, video_allegati: video.length }, modello, iniziato: inizio, creato: new Date().toISOString() });
  } catch (e) {
    console.error("dossier-ia analizza", e);
    await salva({ stato: "errore", errore: String((e as Error)?.message || e).slice(0, 200), iniziato: inizio, creato: new Date().toISOString() });
  }
}

// ── «Crea il dopo» ─────────────────────────────────────────────────────────
async function render(admin: ReturnType<typeof createClient>, id: string, mediaId: string, stile: string, indicazioni: string) {
  const db = admin.schema("marketplace");
  const { data: m } = await db.from("ristrutturazioni_media").select("id,path,tipo,nota,ristrutturazione_id").eq("id", mediaId).maybeSingle();
  if (!m || m.ristrutturazione_id !== id || m.tipo !== "foto") throw new Error("foto_non_valida");
  const { count } = await db.from("ristrutturazioni_media").select("id", { count: "exact", head: true }).eq("ristrutturazione_id", id).eq("fonte", "ia");
  if ((count || 0) >= MAX_RENDER) throw new Error("troppi_render");
  const { data: blob } = await admin.storage.from("sopralluoghi").download(m.path);
  if (!blob) throw new Error("foto_non_trovata");
  const buf = new Uint8Array(await blob.arrayBuffer());
  let b64 = ""; for (let i = 0; i < buf.length; i += 0x8000) b64 += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  const descr = STILI[stile] || testo(stile, 200) || STILI.medio;
  const istruzioni = `Ristruttura questo ambiente della foto come lo farebbe un'impresa italiana di qualità. Stile: ${descr}. ${testo(indicazioni, 300)}
Regole: stessa inquadratura, stessa prospettiva, stessa forma della stanza o dello spazio esterno; porte, finestre, travi e muri portanti al loro posto;
nessuna persona, nessuna scritta, nessun logo; luce naturale realistica; deve sembrare una foto vera scattata dopo i lavori, non un disegno.`;
  const { j, modello } = await genera(MODELLI_IMG, {
    contents: [{ role: "user", parts: [{ inline_data: { mime_type: mimeDi(m.path, "foto", blob.type), data: btoa(b64) } }, { text: istruzioni }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  });
  const p = (j?.candidates?.[0]?.content?.parts || []).find((x: Record<string, unknown>) => x.inline_data || x.inlineData);
  const dati = p?.inline_data || p?.inlineData;
  if (!dati?.data) throw new Error("nessuna_immagine");
  const mime = dati.mime_type || dati.mimeType || "image/png";
  const bytes = Uint8Array.from(atob(dati.data), (c) => c.charCodeAt(0));
  const path = `${id}/render-${Date.now()}.${mime.includes("jpeg") ? "jpg" : "png"}`;
  const up = await admin.storage.from("sopralluoghi").upload(path, bytes, { contentType: mime, upsert: false });
  if (up.error) throw up.error;
  const nota = ("Simulazione · " + (STILI[stile] ? stile : "su misura") + (m.nota ? " · " + m.nota : "")).slice(0, 300);
  const { data: riga, error } = await db.from("ristrutturazioni_media").insert({ ristrutturazione_id: id, path, tipo: "foto", nota, fonte: "ia", prima_id: m.id }).select("id").single();
  if (error) throw error;
  const { data: s } = await admin.storage.from("sopralluoghi").createSignedUrl(path, 3600);
  return { id: riga.id, path, url: s?.signedUrl || "", nota, modello };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ errore: "metodo" }, 405);
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { return json({ errore: "richiesta_non_valida" }, 400); }
  const azione = String(b.azione || "");
  if (!["analizza", "stato", "render"].includes(azione) || !uuid(b.id)) return json({ errore: "richiesta_non_valida" }, 400);
  const auth = req.headers.get("Authorization") || "";
  if (!/^Bearer\s+/i.test(auth)) return json({ errore: "serve_accesso" }, 401);

  try {
    const comeLui = createClient(SUPABASE_URL, PUBBLICA, { auth: { persistSession: false }, global: { headers: { Authorization: auth } } });
    const { data: puo } = await comeLui.schema("marketplace").rpc("ristrutturazione_puo", { p_id: b.id });
    if (puo !== true) return json({ errore: "non_autorizzato" }, 403);
    const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } });
    const db = admin.schema("marketplace");
    const { data: r } = await db.from("ristrutturazioni").select("id,ia").eq("id", b.id).maybeSingle();
    if (!r) return json({ errore: "non_trovata" }, 404);

    if (azione === "stato") return json({ ia: r.ia || null });
    if (!KEY()) return json({ errore: "motore_non_configurato" }, 503);

    if (azione === "render") {
      if (!uuid(b.media_id)) return json({ errore: "richiesta_non_valida" }, 400);
      return json({ ok: true, ...(await render(admin, String(b.id), String(b.media_id), testo(b.stile, 200), testo(b.indicazioni, 300))) });
    }

    // analizza: una lettura alla volta per pratica, e non più di una ogni 2 minuti.
    const ia = r.ia as Record<string, unknown> | null;
    if (ia?.stato === "in_corso" && Date.now() - new Date(String(ia.iniziato)).getTime() < 10 * 60000) return json({ stato: "in_corso" });
    if (ia?.creato && ia?.stato !== "in_corso" && Date.now() - new Date(String(ia.creato)).getTime() < 120000) return json({ errore: "aspetta_due_minuti", ia }, 429);
    await db.from("ristrutturazioni").update({ ia: { ...(ia || {}), stato: "in_corso", iniziato: new Date().toISOString() } }).eq("id", b.id);
    const lavoro = analizza(admin, String(b.id));
    // deno-lint-ignore no-explicit-any
    const rt = (globalThis as any).EdgeRuntime;
    if (rt?.waitUntil) { rt.waitUntil(lavoro); return json({ stato: "in_corso" }, 202); }
    await lavoro;
    const { data: fine } = await db.from("ristrutturazioni").select("ia").eq("id", b.id).maybeSingle();
    return json({ stato: fine?.ia?.stato || "fatto", ia: fine?.ia || null });
  } catch (e) {
    console.error("dossier-ia", e);
    const m = String((e as Error)?.message || e);
    const noti = ["foto_non_valida", "troppi_render", "foto_non_trovata", "nessuna_immagine"];
    return json({ errore: noti.find((x) => m.includes(x)) || (/Gemini 4\d\d/.test(m) ? "chiave_o_richiesta_rifiutata" : "errore_ia"), dettaglio: m.slice(0, 160) }, 502);
  }
});
