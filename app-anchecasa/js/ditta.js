/* Scheda lavori per la ditta di fiducia del cliente (16.10.2026).
   - vero: ditta.html?r=<riferimento> → marketplace.app_simulatore_scheda (lavori e quantità, MAI prezzi né telefono del cliente);
           il modulo «Chiedi di lavorare con AncheCasa» → app_simulatore_ditta (arriva all'admin come «Partner»).
   - prova: ditta.html?prova&d=<dati> (scheda di ESEMPIO, niente inviato). */
import { CONFIG } from "./config.js";

const qs = new URLSearchParams(location.search);
const PROVA = qs.has("prova");
const RIF = (qs.get("r") || "").trim();
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (n) => Number(n).toLocaleString("it-IT", { maximumFractionDigits: 1 });
const UM = { mq: "mq", m: "m", n: "n.", corpo: "a corpo" };
const FIN = { base: "Base", medio: "Media", alto: "Alta" };

/* Solo per la PROVA: stesse quantità di partenza del file SQL app-32 */
const RICETTE = {
  bagno: [["Demolizione di pavimenti e massetti", "mq", 1, 0], ["Demolizione di rivestimenti", "mq", 3.5, 0], ["Rimozione di sanitari", "n", 0, 4], ["Massetto di sottofondo", "mq", 1, 0], ["Pavimento posato", "mq", 1, 0], ["Rivestimento posato", "mq", 3.5, 0], ["Impianto idrico-sanitario (punti)", "n", 0, 6], ["Impianto elettrico (punti)", "n", 0, 4], ["Fornitura e posa di sanitari", "n", 0, 4], ["Tinteggiatura", "mq", 1, 0]],
  cucina: [["Demolizione di pavimenti e massetti", "mq", 1, 0], ["Massetto di sottofondo", "mq", 1, 0], ["Pavimento posato", "mq", 1, 0], ["Rivestimento posato", "mq", 0, 6], ["Impianto idrico-sanitario (punti)", "n", 0, 3], ["Impianto elettrico (punti)", "n", 0, 8], ["Tinteggiatura", "mq", 3.5, 0]],
  pareti: [["Intonaco", "mq", 0.3, 0], ["Tinteggiatura", "mq", 3.5, 0]],
  completa: [["Demolizione di pavimenti e massetti", "mq", 1, 0], ["Demolizione di rivestimenti", "mq", 0.4, 0], ["Demolizione di tramezzi", "mq", 0.2, 0], ["Massetto di sottofondo", "mq", 1, 0], ["Pavimento posato", "mq", 1, 0], ["Rivestimento posato", "mq", 0.4, 0], ["Tramezzo in laterizio o cartongesso", "mq", 0.2, 0], ["Intonaco", "mq", 0.5, 0], ["Tinteggiatura", "mq", 3.5, 0], ["Impianto elettrico (punti)", "n", 0.5, 0], ["Impianto idrico-sanitario (punti)", "n", 0.15, 0], ["Fornitura e posa di sanitari", "n", 0.08, 0], ["Porte interne", "n", 0.08, 0], ["Infissi esterni", "mq", 0.15, 0]],
};

let sb = null;
if (!PROVA) {
  try { sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, { db: { schema: "marketplace" }, auth: { persistSession: false, autoRefreshToken: false } }); }
  catch (e) { sb = null; }
}

async function leggi() {
  if (PROVA) {
    let d = {};
    try { d = JSON.parse(decodeURIComponent(escape(atob(qs.get("d") || "")))); } catch (e) { d = {}; }
    if (!d.lavoro) d = { lavoro: "Bagno", tipo: "bagno", mq: 6, comune: "Roma", regione: "Lazio", finitura: "medio", quando: "prima possibile", cliente: "Giulia" };
    const voci = (RICETTE[d.tipo] || []).map(([nome, um, perMq, fisso]) => ({ nome, um, quantita: d.mq ? Math.round((perMq * d.mq + fisso) * 10) / 10 : null }));
    return { trovato: true, data: new Date().toISOString(), cliente: d.cliente, lavoro: d.lavoro, mq: d.mq, comune: d.comune, regione: d.regione, finitura: d.finitura, quando: d.quando, note: d.note, voci };
  }
  if (!sb || !/^[0-9a-f-]{36}$/i.test(RIF)) return { trovato: false };
  const r = await sb.rpc("app_simulatore_scheda", { p_rif: RIF });
  if (r.error || !r.data) return { trovato: false };
  return r.data;
}

function disegna(s) {
  const data = new Date(s.data).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  $("s-data").textContent = data;
  $("s-titolo").textContent = "Lavori richiesti: " + (s.lavoro || "ristrutturazione").toLowerCase();
  $("s-sotto").textContent = `Richiesta di ${s.cliente || "un cliente"}${s.comune ? ", " + s.comune : ""}${s.regione ? " (" + s.regione + ")" : ""}.`;
  const box = [["Lavoro", s.lavoro], ["Superficie", s.mq ? num(s.mq) + " mq" : ""], ["Finitura", FIN[s.finitura] || ""], ["Inizio", s.quando ? s.quando.charAt(0).toUpperCase() + s.quando.slice(1) : ""], ["Luogo", [s.comune, s.regione].filter(Boolean).join(", ")]].filter(([, v]) => v);
  $("s-riepilogo").innerHTML = box.map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join("");
  const voci = Array.isArray(s.voci) ? s.voci : [];
  $("s-voci").innerHTML = voci.length
    ? `<table><thead><tr><th>Lavorazione</th><th style="text-align:right">Quantità indicativa</th></tr></thead><tbody>${voci.map((v) => `<tr><td>${esc(v.nome)}</td><td class="q">${v.quantita == null ? "da misurare" : esc(num(v.quantita)) + " " + esc(UM[v.um] || v.um)}</td></tr>`).join("")}</tbody></table>`
    : `<p class="sotto">Il cliente chiede un sopralluogo: le lavorazioni si definiscono sul posto.</p>`;
  $("s-note").innerHTML = s.note ? `<p class="nota" style="background:var(--carta)"><b>Note del cliente:</b> ${esc(s.note)}</p>` : "";
  document.title = "Scheda lavori · " + (s.lavoro || "AncheCasa") + " · AncheCasa";
  $("carico").hidden = true; $("foglio").hidden = false; $("strumenti").hidden = false; $("invito").hidden = false;
}

const ERRORI = { serve_il_consenso: "Spunta la casella dell'informativa privacy.", manca_la_ditta: "Scrivi il nome della ditta.", manca_il_telefono: "Scrivi un numero di telefono valido.", troppe_richieste: "In questo momento arrivano tante richieste: riprova tra un minuto." };
async function invia(ev) {
  ev.preventDefault();
  const f = ev.target, err = $("err");
  const v = { ditta: f.ditta.value.trim(), referente: f.referente.value.trim(), telefono: f.telefono.value.trim(), email: f.email.value.trim(), piva: f.piva.value.trim(), comune: f.comune.value.trim(), mestieri: f.mestieri.value.trim(), consenso: f.consenso.checked };
  if (v.ditta.length < 2) { err.textContent = ERRORI.manca_la_ditta; f.ditta.focus(); return; }
  if (v.telefono.replace(/\D/g, "").length < 6) { err.textContent = ERRORI.manca_il_telefono; f.telefono.focus(); return; }
  if (!v.consenso) { err.textContent = ERRORI.serve_il_consenso; return; }
  err.textContent = "";
  const b = $("invia"); b.disabled = true; b.textContent = "Invio…";
  try {
    if (PROVA) await new Promise((r) => setTimeout(r, 400));
    else {
      const r = await sb.rpc("app_simulatore_ditta", { p_rif: RIF, p_ditta: v.ditta, p_referente: v.referente, p_telefono: v.telefono, p_email: v.email, p_piva: v.piva, p_comune: v.comune, p_mestieri: v.mestieri, p_consenso: v.consenso });
      if (r.error) throw r.error;
    }
    b.hidden = true; $("fatto").hidden = false; $("fatto").focus();
  } catch (e) {
    const m = String((e && e.message) || e);
    const k = Object.keys(ERRORI).find((x) => m.includes(x));
    err.textContent = k ? ERRORI[k] : "Non siamo riusciti a inviare la richiesta. Riprova tra poco.";
    b.disabled = false; b.textContent = "Invia la richiesta";
  }
}

async function avvia() {
  if (PROVA) $("banner-prova").hidden = false;
  if (CONFIG.privacyUrl) $("privacy").href = CONFIG.privacyUrl;
  $("stampa").addEventListener("click", () => window.print());
  $("f-ditta").addEventListener("submit", invia);
  let s = { trovato: false };
  try { s = await leggi(); } catch (e) { s = { trovato: false }; }
  if (s && s.trovato) disegna(s);
  else { $("carico").hidden = true; $("manca").hidden = false; }
}
avvia();
