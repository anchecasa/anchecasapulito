/* «Quanto costa ristrutturare?» — pagina pubblica, senza account (16.10.2026).
   - vero: tipi di lavoro e stima dal database (marketplace.app_simulatore_*, prezzari regionali di app-11);
           l'invio passa da app_simulatore_invia, che ricalcola la stima sul server.
   - prova (?prova): prezzi di ESEMPIO nel browser, niente viene inviato.
   Se il file SQL app-32 non è ancora stato eseguito, la pagina funziona lo stesso senza stima
   e manda la richiesta come «Sopralluogo» nelle richieste dai siti: nessun cliente si perde.
   Parametri dell'indirizzo: ?lavoro=bagno (scelta già fatta), ?codice=XXX (codice di chi porta il cliente). */
import { CONFIG } from "./config.js";
// stesse regioni di flash-api.js (copiate qui per non caricare tutta l'app nella pagina pubblica)
const REGIONI = ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"];

const qs = new URLSearchParams(location.search);
const PROVA = qs.has("prova");
const CODICE = (qs.get("codice") || "").replace(/[^\w-]/g, "").slice(0, 30);
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const euro = (n) => Number(n).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/* Tipi di riserva (uguali al file SQL) se il database non risponde */
const TIPI_BASE = [
  { chiave: "bagno", nome: "Bagno", spiegazione: "Pavimento, rivestimento, sanitari e impianti del bagno", mq_min: 2, mq_max: 20, solo_sopralluogo: false },
  { chiave: "cucina", nome: "Cucina", spiegazione: "Pavimento, rivestimento e impianti (mobili esclusi)", mq_min: 4, mq_max: 40, solo_sopralluogo: false },
  { chiave: "pareti", nome: "Pareti e tinteggiatura", spiegazione: "Ripresa intonaci e tinteggiatura di pareti e soffitti", mq_min: 5, mq_max: 400, solo_sopralluogo: false },
  { chiave: "completa", nome: "Casa completa", spiegazione: "Dalla demolizione alla consegna, impianti e infissi compresi", mq_min: 25, mq_max: 400, solo_sopralluogo: false },
  { chiave: "facciata", nome: "Condominio o facciata", spiegazione: "Serve vedere il palazzo: ti mandiamo un tecnico", mq_min: 1, mq_max: 100000, solo_sopralluogo: true },
  { chiave: "altro", nome: "Altro", spiegazione: "Raccontaci il lavoro: ti richiamiamo noi", mq_min: 1, mq_max: 100000, solo_sopralluogo: true },
];
/* Solo per la PROVA: € al mq di ESEMPIO, non sono prezzi veri */
const ESEMPIO_MQ = { bagno: 1100, cucina: 520, pareti: 32, completa: 640 };
const ESEMPIO_FIN = { base: 1, medio: 1.2, alto: 1.5 };

const S = { tipi: TIPI_BASE, tipo: null, dati: null, stima: null, motore: PROVA ? "prova" : "vero" };
let sb = null;
if (!PROVA) {
  try { sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, { db: { schema: "marketplace" }, auth: { persistSession: false, autoRefreshToken: false } }); }
  catch (e) { sb = null; }
}

function mostra(id) {
  ["p1", "p2", "p3", "p4"].forEach((x) => { $(x).hidden = x !== id; });
  const el = $(id);
  window.scrollTo({ top: 0, behavior: "smooth" });
  const h = el.querySelector("h2");
  if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
}

async function caricaTipi() {
  if (sb) {
    try {
      const r = await sb.from("app_simulatore_tipi").select("chiave,nome,spiegazione,mq_min,mq_max,solo_sopralluogo,ordine").eq("attivo", true).order("ordine");
      if (!r.error && r.data && r.data.length) S.tipi = r.data;
      else if (r.error) S.motore = "riserva";
    } catch (e) { S.motore = "riserva"; }
  }
  $("lavori").innerHTML = S.tipi.map((t) => `<button type="button" data-tipo="${esc(t.chiave)}" aria-pressed="false"><b>${esc(t.nome)}</b><span>${esc(t.spiegazione)}</span></button>`).join("");
  const pre = qs.get("lavoro");
  if (pre && S.tipi.some((t) => t.chiave === pre)) scegli(pre);
}

function scegli(chiave) {
  S.tipo = S.tipi.find((t) => t.chiave === chiave);
  document.querySelectorAll("#lavori button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tipo === chiave)));
  const solo = S.tipo.solo_sopralluogo;
  $("campo-mq").hidden = solo;
  $("campo-finitura").hidden = solo;
  $("t2-sotto").textContent = solo ? `${S.tipo.nome}: per questo lavoro serve vedere di persona. Dicci dove e quando.` : `${S.tipo.nome}: indica la superficie da rifare, anche a occhio.`;
  $("vai2").textContent = solo ? "Avanti" : "Calcola";
  const r = $("mq");
  r.min = S.tipo.mq_min; r.max = Math.min(S.tipo.mq_max, 400);
  const tipico = { bagno: 6, cucina: 12, pareti: 80, completa: 80 }[chiave] || S.tipo.mq_min;
  r.value = Math.max(S.tipo.mq_min, Math.min(tipico, r.max));
  aggMq();
  $("err2").textContent = "";
  mostra("p2");
}
function aggMq() { $("mq-val").textContent = $("mq").value + " mq"; }

async function calcola(d) {
  if (S.tipo.solo_sopralluogo) return { disponibile: false, motivo: "serve_sopralluogo" };
  if (S.motore === "prova") {
    const base = ESEMPIO_MQ[S.tipo.chiave] * d.mq * (ESEMPIO_FIN[d.finitura] || 1);
    return { disponibile: true, min: Math.round(base * 0.75 / 100) * 100, max: Math.round(base * 1.25 / 100) * 100, completa: true, fonti: ["Prezzi di ESEMPIO"] };
  }
  if (S.motore !== "vero" || !sb) return { disponibile: false, motivo: "spento" };
  const r = await sb.rpc("app_simulatore_stima", { p_tipo: S.tipo.chiave, p_mq: d.mq, p_regione: d.regione, p_finitura: d.finitura });
  if (r.error) return { disponibile: false, motivo: "spento" };
  return r.data;
}

function disegnaEsito(st, d) {
  let h = "";
  if (S.motore === "prova") h += `<div class="nota esempio">Stima di ESEMPIO: nella versione vera i prezzi arrivano dai prezzari regionali.</div>`;
  if (st && st.disponibile) {
    h += `<div class="risultato"><small>${esc(S.tipo.nome)} · ${esc(d.mq)} mq · finitura ${esc({ base: "base", medio: "media", alto: "alta" }[d.finitura] || d.finitura)} · ${esc(d.regione)}</small>
      <div class="cifra">${euro(st.min)} – ${euro(st.max)}</div>
      <p>Stima indicativa${st.fonti && st.fonti.length ? " su " + esc(st.fonti.join(", ")) : ""}. IVA, pratiche, smaltimento e mobili esclusi.${st.completa === false ? " Alcune voci non hanno ancora il prezzo regionale: la forbice è più larga." : ""}</p></div>`;
  } else if (st && st.motivo === "serve_sopralluogo") {
    h += `<div class="nota">Per <b>${esc(S.tipo.nome.toLowerCase())}</b> non diamo numeri a distanza: il prezzo dipende da cose che si vedono solo sul posto. Il sopralluogo è gratuito.</div>`;
  } else if (st && st.motivo === "mq_fuori_misura") {
    h += `<div class="nota">Per questo lavoro la stima va da ${esc(st.mq_min)} a ${esc(st.mq_max)} mq. Lasciaci il telefono e ne parliamo.</div>`;
  } else {
    h += `<div class="nota">Per ${esc(d.regione || "la tua regione")} non abbiamo ancora i prezzi di riferimento: non ti diamo numeri inventati. Lasciaci il telefono e la stima la fa la ditta, con il sopralluogo gratuito.</div>`;
  }
  $("esito").innerHTML = h;
}

async function avanti2(ev) {
  ev.preventDefault();
  const f = ev.target;
  const d = { mq: Number($("mq").value), regione: f.regione.value, comune: f.comune.value.trim(), finitura: (f.querySelector('input[name="finitura"]:checked') || {}).value || "medio", quando: f.quando.value };
  if (!d.regione) { $("err2").textContent = "Scegli la regione: i prezzi cambiano da regione a regione."; f.regione.focus(); return; }
  $("err2").textContent = "";
  const b = $("vai2"); b.disabled = true; b.textContent = "Calcolo…";
  try { S.stima = await calcola(d); } catch (e) { S.stima = { disponibile: false, motivo: "spento" }; }
  b.disabled = false; b.textContent = S.tipo.solo_sopralluogo ? "Avanti" : "Calcola";
  S.dati = d;
  disegnaEsito(S.stima, d);
  $("t3").textContent = S.stima && S.stima.disponibile ? "Vuoi il prezzo vero?" : "Ti chiamiamo noi";
  mostra("p3");
}

const ERRORI = {
  serve_il_consenso: "Spunta la casella dell'informativa privacy.",
  manca_il_nome: "Scrivi nome e cognome.",
  manca_il_telefono: "Scrivi un numero di telefono valido.",
  troppe_richieste: "In questo momento arrivano tante richieste: riprova tra un minuto.",
};
async function invia(ev) {
  ev.preventDefault();
  const f = ev.target;
  const c = { nome: f.nome.value.trim(), telefono: f.telefono.value.trim(), email: f.email.value.trim(), note: f.note.value.trim(), consenso: f.consenso.checked };
  const err = $("err3");
  if (c.nome.length < 2) { err.textContent = ERRORI.manca_il_nome; f.nome.focus(); return; }
  if (c.telefono.replace(/\D/g, "").length < 6) { err.textContent = ERRORI.manca_il_telefono; f.telefono.focus(); return; }
  if (!c.consenso) { err.textContent = ERRORI.serve_il_consenso; return; }
  err.textContent = "";
  const b = $("vai3"); b.disabled = true; b.textContent = "Invio…";
  try {
    if (S.motore === "prova") {
      await new Promise((r) => setTimeout(r, 400));
    } else if (S.motore === "vero" && sb) {
      const r = await sb.rpc("app_simulatore_invia", {
        p_tipo: S.tipo.chiave, p_mq: S.tipo.solo_sopralluogo ? null : S.dati.mq, p_regione: S.dati.regione, p_comune: S.dati.comune,
        p_finitura: S.tipo.solo_sopralluogo ? "" : S.dati.finitura, p_quando: S.dati.quando, p_nome: c.nome, p_telefono: c.telefono,
        p_email: c.email, p_note: c.note, p_consenso: c.consenso, p_codice: CODICE,
      });
      if (r.error) throw r.error;
      S.rif = r.data && r.data.rif;
    } else if (sb) {
      // riserva: il file SQL del simulatore non c'è ancora → richiesta di sopralluogo normale
      const r = await sb.from("app_contatti").insert({
        sito: "anchecasa", tipo: "sopralluogo", nome: c.nome.slice(0, 120), email: c.email.slice(0, 120), telefono: c.telefono.slice(0, 30),
        dati: { origine: "Quanto costa (pagina pubblica)", lavoro: S.tipo.nome, mq: S.tipo.solo_sopralluogo ? undefined : S.dati.mq, regione: S.dati.regione, comune: S.dati.comune, finitura: S.dati.finitura, quando: S.dati.quando, note: c.note || undefined, codice_agente: CODICE || undefined },
      });
      if (r.error) throw r.error;
    } else {
      throw new Error("offline");
    }
    preparaCondividi(c);
    mostra("p4");
  } catch (e) {
    const m = String((e && e.message) || e);
    const k = Object.keys(ERRORI).find((x) => m.includes(x));
    err.textContent = k ? ERRORI[k] : "Non siamo riusciti a inviare la richiesta. Controlla la connessione e riprova, oppure chiamaci.";
  } finally {
    b.disabled = false; b.textContent = "Voglio il sopralluogo gratuito";
  }
}

/* Scheda per la ditta di fiducia del cliente: lavori senza prezzi, su carta intestata AncheCasa */
function preparaCondividi(c) {
  let url = "";
  if (S.motore === "prova") {
    const d = { lavoro: S.tipo.nome, tipo: S.tipo.chiave, mq: S.tipo.solo_sopralluogo ? null : S.dati.mq, comune: S.dati.comune, regione: S.dati.regione, finitura: S.tipo.solo_sopralluogo ? "" : S.dati.finitura, quando: S.dati.quando, note: c.note, cliente: c.nome.split(/\s+/)[0] };
    url = new URL("ditta.html?prova&d=" + encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(d))))), location.href).href;
  } else if (S.rif) {
    url = new URL("ditta.html?r=" + encodeURIComponent(S.rif), location.href).href;
  }
  $("condividi").hidden = !url;
  if (!url) return;
  S.urlDitta = url;
  $("link-ditta").textContent = "";
}
async function mandaDitta() {
  const url = S.urlDitta; if (!url) return;
  const testo = "Ciao, ho fatto una stima per " + S.tipo.nome.toLowerCase() + " con AncheCasa. Qui trovi la scheda dei lavori (senza prezzi): ti va di farmi un preventivo o di seguirlo con AncheCasa?";
  try {
    if (navigator.share) { await navigator.share({ title: "Scheda lavori AncheCasa", text: testo, url }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(url); } catch (e) { /* niente */ }
  $("link-ditta").innerHTML = `Link copiato. <a href="https://wa.me/?text=${encodeURIComponent(testo + " " + url)}" target="_blank" rel="noopener">Mandalo su WhatsApp</a> oppure incollalo in una mail.`;
}

function avvia() {
  $("manda-ditta").addEventListener("click", mandaDitta);
  if (PROVA) $("banner-prova").hidden = false;
  $("regione").insertAdjacentHTML("beforeend", REGIONI.map((r) => `<option>${esc(r)}</option>`).join(""));
  if (CONFIG.privacyUrl) $("privacy").href = CONFIG.privacyUrl;
  $("lavori").addEventListener("click", (e) => { const b = e.target.closest("button[data-tipo]"); if (b) scegli(b.dataset.tipo); });
  $("mq").addEventListener("input", aggMq);
  $("f2").addEventListener("submit", avanti2);
  $("f3").addEventListener("submit", invia);
  document.querySelectorAll("[data-indietro]").forEach((b) => b.addEventListener("click", () => mostra(b.dataset.indietro)));
  caricaTipi();
}
avvia();
