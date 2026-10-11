/* Rete AncheCasa (10.10.2026):
   - «Il mio ruolo»: per ogni figura, cosa fa e come guadagna, con esempi e le regole comuni;
   - «Documenti»: contratto, regolamento e circolari; si firmano sul telefono e la firma arriva all'admin;
   - admin: tutti i contratti e documenti, chi ha firmato, nuove circolari; clienti di AncheCasa da affidare. */
import { I, esc, voce, lista, sez, stato, num, btn, campo, vuoto, avviso, virgola, quando, toast, spiegaErrore } from "./ui.js";
import { Q } from "./q.js";
import { euro } from "./schede.js";
import { REGIONI } from "./catalogo.js";
import { RUOLI_RETE } from "./viste-rete.js";
import { RUOLI_TESTI, REGOLE, VERSIONE_REGOLE } from "./testi-rete.js";

const ORDINE = ["reteitalia", "sviluppo", "capoarea", "agente", "subagente"];
const TIPI_DOC = { contratto: "Contratto", regolamento: "Regolamento", circolare: "Circolare", altro: "Documento" };
// quota di ogni 100 € di utile sui servizi, per il conto d'esempio (Allegato A: 35% alla rete)
const CONTO = {
  agente: { label: "Aziende che porti", k: 0.35 * 0.70, nota: "70% della quota della rete" },
  subagente: { label: "Aziende che porti", k: 0.35 * 0.70 * 0.70, nota: "70% della quota di chi porta" },
  capoarea: { label: "Aziende della tua linea e della tua regione", k: 0.35 * 0.08, nota: "8% della quota della rete" },
  sviluppo: { label: "Aziende della tua linea", k: 0.35 * 0.17, nota: "17% della quota della rete" },
  reteitalia: { label: "Aziende di tutta Italia", k: 0.35 * 0.05, nota: "5% della quota della rete" },
};

export function installa(core) {
  const { S, V, AZIONI, FORM, vai, render } = core;
  const io = () => (S.miei && S.miei.rete) || {};
  const sonoAdmin = () => !!(S.admin && S.base === "admin");

  /* ====================================================================== */
  /* IL MIO RUOLO                                                           */
  /* ====================================================================== */
  V["mio-ruolo"] = async (k) => {
    k = k || io().ruolo;
    const r = RUOLI_TESTI[k];
    if (!r) return { t: "Il mio ruolo", h: `<div class="pad">${lista(ORDINE.map((x) => voce("rete", esc(RUOLI_TESTI[x].nome), esc(RUOLI_TESTI[x].breve), "mio-ruolo/" + x, "blu")))}</div>` };
    const c = CONTO[k];
    return {
      t: "Il mio ruolo",
      h: `<div class="pad"><div class="eroe"><h3>${esc(r.nome)}</h3><p>${esc(r.breve)}</p></div><div style="height:12px"></div>
        <div class="card"><dl class="campi"><dt>Rispondi a</dt><dd>${esc(r.risponde)}</dd><dt>Hai sotto</dt><dd>${esc(r.sotto)}</dd></dl></div>
        ${sez("Cosa fai", `<div class="card"><ul style="margin:0;padding-left:18px;display:grid;gap:6px">${r.fai.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`)}
        ${sez("Come guadagni", r.guadagni.map(([t, q, e]) => `<div class="card" style="margin-bottom:8px"><b>${esc(t)}</b><p style="margin:4px 0 0">${esc(q)}</p>${e ? `<p class="sotto" style="margin:4px 0 0">Esempio: ${esc(e)}</p>` : ""}</div>`).join("") +
          `<p class="sotto piccolo">Esempi su 100 € di utile AncheCasa (servizi) e 10.000 € di margine (lavori): numeri di esempio, non promesse. Sui lavori le provvigioni maturano a tranche quando AncheCasa incassa: 30% firma, 30% metà lavori, 40% collaudo.</p>`)}
        ${c ? sez("Fai un conto (esempio)", `<div class="card"><div class="griglia2">${campo(esc(c.label), `<input id="conto-n" type="number" min="0" step="1" value="10">`)}${campo("Utile AncheCasa al mese per azienda (€)", `<input id="conto-u" type="number" min="0" step="1" value="30">`)}</div>
          <p style="margin:6px 0 0">Ogni mese: <b id="conto-r">–</b></p><p class="sotto piccolo">${esc(c.nota)}. L'utile per azienda dipende dai servizi venduti: il numero qui è solo un esempio da cambiare.</p></div>`) : ""}
        ${sez("Attenzione", r.attenzione.map((x) => avviso(esc(x))).join('<div style="height:8px"></div>'))}
        ${sez("Come si sale", `<div class="card"><p style="margin:0">${esc(r.sali)}</p></div>`)}
        ${sez("Le regole uguali per tutti", REGOLE.map(([t, x]) => `<details class="card" style="margin-bottom:6px"><summary><b>${esc(t)}</b></summary><p style="margin:8px 0 0">${esc(x)}</p></details>`).join("") + `<p class="sotto piccolo">Allegato C dei contratti, versione ${esc(VERSIONE_REGOLE)}.</p>`)}
        ${lista([voce("doc", "I miei documenti", "Contratto, regolamento e circolari da firmare", "documenti", "arancio"), voce("euro", "I miei guadagni", "Provvigioni maturate e pagate", "re-guadagni", "verde")])}
        ${sonoAdmin() ? `<div style="height:12px"></div>${lista(ORDINE.filter((x) => x !== k).map((x) => voce("rete", esc(RUOLI_TESTI[x].nome), "Vedi come lo vede lui", "mio-ruolo/" + x, "blu")))}` : ""}</div>`,
      dopo: (el) => {
        const n = el.querySelector("#conto-n"), u = el.querySelector("#conto-u"), out = el.querySelector("#conto-r");
        if (!n || !c) return;
        const calc = () => { out.textContent = euro(Math.round(Number(n.value || 0) * Number(u.value || 0) * c.k * 100) / 100) || "0 €"; };
        n.addEventListener("input", calc); u.addEventListener("input", calc); calc();
      },
    };
  };

  /* ====================================================================== */
  /* DOCUMENTI                                                              */
  /* ====================================================================== */
  async function mieFirme() { return Q.sel("app_firme", { eq: { utente: S.utente.id }, lim: 500 }).catch(() => []); }
  core.daFirmare = async () => {
    const [d, f] = await Promise.all([Q.sel("app_documenti", { eq: { attivo: true }, lim: 300 }).catch(() => []), mieFirme()]);
    const mio = io().ruolo;
    return d.filter((x) => x.richiede_firma && (!(x.ruoli || []).length || (x.ruoli || []).includes(mio)) && !f.some((y) => y.documento === x.id)).length;
  };
  V.documenti = async () => {
    const [d, f] = await Promise.all([Q.sel("app_documenti", { eq: { attivo: true }, ord: ["pubblicato", false], lim: 300 }).catch(() => []), mieFirme()]);
    const mio = io().ruolo;
    const miei = sonoAdmin() ? d : d.filter((x) => !(x.ruoli || []).length || (x.ruoli || []).includes(mio));
    const firmato = (x) => f.find((y) => y.documento === x.id);
    const da = miei.filter((x) => x.richiede_firma && !firmato(x));
    const ok = miei.filter((x) => firmato(x));
    const leggi = miei.filter((x) => !x.richiede_firma);
    const riga = (x) => voce(x.tipo === "contratto" ? "doc" : x.tipo === "circolare" ? "campana" : "lista", esc(x.titolo), `${esc(TIPI_DOC[x.tipo] || "")}${x.versione ? " · versione " + esc(x.versione) : ""} · ${quando(x.pubblicato)}`, "documento/" + x.id,
      firmato(x) ? "verde" : x.richiede_firma ? "arancio" : "blu", firmato(x) ? stato("verde", "Firmato") : x.richiede_firma ? stato("giallo", "Da firmare") : "");
    return {
      t: "Documenti",
      h: `<div class="pad"><p class="sotto">Il tuo contratto, il regolamento della rete e le circolari di AncheCasa. Firmi sul telefono e la firma arriva subito ad AncheCasa.</p><div style="height:10px"></div>
        ${sonoAdmin() ? `${btn("Tutti i contratti e chi ha firmato", "go:ad-documenti")}<div style="height:12px"></div>` : ""}
        ${da.length ? sez("Da firmare", lista(da.map(riga))) : ""}
        ${ok.length ? sez("Firmati", lista(ok.map(riga))) : ""}
        ${leggi.length ? sez("Da leggere", lista(leggi.map(riga))) : ""}
        ${!miei.length ? vuoto("Nessun documento per ora.") : ""}
        ${lista([voce("rete", "Il mio ruolo", "Cosa fai e come guadagni", "mio-ruolo", "blu")])}</div>`,
    };
  };

  V.documento = async (id) => {
    const d = await Q.uno("app_documenti", { id });
    if (!d) return { t: "Documento", h: vuoto("Documento non trovato.") };
    const f = (await mieFirme()).find((x) => x.documento === id);
    const nome = ((S.profilo || {}).nome || "").trim();
    return {
      t: TIPI_DOC[d.tipo] || "Documento",
      h: `<div class="pad"><div class="card"><small>${esc(TIPI_DOC[d.tipo] || "")}${d.versione ? " · versione " + esc(d.versione) : ""} · pubblicato ${quando(d.pubblicato)}</small><h3 style="margin:6px 0">${esc(d.titolo)}</h3>
          ${d.testo ? `<p style="margin:0;white-space:pre-line">${esc(d.testo)}</p>` : ""}
          ${d.file ? `<div style="margin-top:12px"><a class="btn chiaro" href="${esc(d.file)}" target="_blank" rel="noopener">Apri il documento completo (PDF)</a></div>` : ""}</div><div style="height:12px"></div>
        ${f ? `<div class="card"><p style="margin:0">${stato("verde", "Firmato")} il ${new Date(f.firmato).toLocaleString("it-IT")} da <b>${esc(f.nome)}</b>. La firma è arrivata ad AncheCasa.</p>
            <img src="${esc(f.firma)}" alt="La tua firma" style="max-width:100%;height:90px;object-fit:contain;margin-top:8px;background:#fff;border-radius:8px">
            <div style="margin-top:8px">${btn("Ricevuta della firma", "ricevuta-firma:" + d.id, "piccolo chiaro")}</div></div>`
          : d.richiede_firma ? `<form data-form="firma-doc" data-id="${esc(d.id)}" novalidate class="card">
            <h3 style="margin:0 0 8px">Firma il documento</h3>
            ${campo("Nome e cognome", `<input name="nome" maxlength="120" required value="${esc(nome)}" autocomplete="name">`)}
            <div class="campo"><span>La tua firma (col dito)</span><div class="firma-box"><canvas class="firma" aria-label="Spazio per la firma"></canvas><input type="hidden" name="firma" value=""><button type="button" class="link" data-cancella-firma>Cancella la firma</button></div></div>
            <label style="display:flex;gap:8px;align-items:flex-start;margin:6px 0 10px"><input type="checkbox" name="letto" style="margin-top:3px"><span>Ho letto tutto il documento${d.file ? " (anche il PDF)" : ""} e lo accetto.</span></label>
            <button class="btn" type="submit">Firma e invia ad AncheCasa</button>
            <p class="sotto piccolo" style="margin-top:8px">Si registrano il tuo nome, la firma, la data e l'ora e un'impronta del documento, così si sa esattamente cosa hai firmato. AncheCasa ti mette a disposizione la ricevuta.</p></form>`
          : avviso("Questo documento è da leggere: non serve firmarlo.")}</div>`,
      dopo: (el) => { if (core.legaFirme) core.legaFirme(el); },
    };
  };
  async function impronta(d) {
    try {
      let buf;
      if (d.file) { const r = await fetch(d.file, { cache: "no-store" }); buf = await r.arrayBuffer(); }
      else buf = new TextEncoder().encode(d.titolo + "\n" + d.testo).buffer;
      const h = await crypto.subtle.digest("SHA-256", buf);
      return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) { return ""; }
  }
  FORM["firma-doc"] = async (f) => {
    if (f.nome.value.trim().length < 3) return toast("Scrivi nome e cognome.", "errore");
    if (!f.firma.value) return toast("Firma col dito nello spazio bianco.", "errore");
    if (!f.letto.checked) return toast("Spunta «Ho letto tutto il documento».", "errore");
    const d = await Q.uno("app_documenti", { id: f.dataset.id });
    const imp = await impronta(d || {});
    try { await Q.rpc("app_firma_documento", { p_documento: f.dataset.id, p_nome: f.nome.value.trim(), p_firma: f.firma.value, p_impronta: imp, p_dispositivo: navigator.userAgent.slice(0, 300) }); }
    catch (e) { return toast(String(e.message || e).includes("gia_firmato") ? "Hai già firmato questo documento." : spiegaErrore(e), "errore"); }
    toast("Firmato e inviato ad AncheCasa."); render();
  };
  AZIONI["ricevuta-firma:"] = async (arg) => {
    const [docId, utente] = arg.split(":");
    const d = await Q.uno("app_documenti", { id: docId });
    const f = await Q.uno("app_firme", { documento: docId, utente: utente || S.utente.id });
    if (!d || !f) return toast("Firma non trovata.", "errore");
    const w = window.open("", "_blank");
    if (!w) return toast("Il telefono ha bloccato la finestra: consenti i popup e riprova.", "errore");
    const base = location.origin + location.pathname.replace(/[^/]*$/, "");
    w.document.write(`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ricevuta di firma · ${esc(d.titolo)}</title>
      <style>@page{size:A4;margin:0}body{margin:0;font-family:Arial,sans-serif;color:#1b2a41}.p{max-width:190mm;margin:0 auto}header{background:#0f2a4a;color:#fff;padding:12mm 14mm;display:flex;justify-content:space-between;align-items:center}header img{height:12mm}.f{height:3mm;background:#f28c28}main{padding:10mm 14mm}h1{color:#0f2a4a;font-size:19pt;margin:0 0 6mm}dl{display:grid;grid-template-columns:45mm 1fr;gap:3mm 6mm;font-size:11pt}dt{color:#5b6b80}dd{margin:0;word-break:break-all}.firma{border:1px solid #dfe6ef;border-radius:3mm;padding:4mm;margin-top:6mm;text-align:center}.firma img{max-width:100%;height:35mm;object-fit:contain}.n{font-size:9pt;color:#5b6b80;margin-top:8mm}button{position:fixed;right:12px;bottom:12px;background:#f28c28;color:#fff;border:0;border-radius:999px;padding:12px 18px;font-size:15px}@media print{button{display:none}}</style></head><body><div class="p">
      <header><img src="${base}img/logo-negativo.png" alt="AncheCasa"><span>Ricevuta di firma</span></header><div class="f"></div><main><h1>${esc(d.titolo)}</h1>
      <dl><dt>Firmato da</dt><dd>${esc(f.nome)}</dd><dt>Data e ora</dt><dd>${new Date(f.firmato).toLocaleString("it-IT")}</dd><dt>Documento</dt><dd>${esc(TIPI_DOC[d.tipo] || "")}${d.versione ? ", versione " + esc(d.versione) : ""}</dd>${d.file ? `<dt>File</dt><dd>${esc(d.file.split("/").pop())}</dd>` : ""}<dt>Impronta SHA-256</dt><dd>${esc(f.impronta || "–")}</dd><dt>Dispositivo</dt><dd>${esc(f.dispositivo || "–")}</dd></dl>
      <div class="firma"><img src="${esc(f.firma)}" alt="Firma"></div>
      <p class="n">Firma raccolta nell'app AncheCasa. L'impronta SHA-256 identifica esattamente il documento firmato. Palumbo Investment S.r.l. · AncheCasa · anchecasa.it</p></main></div><button onclick="print()">Salva in PDF</button></body></html>`);
    w.document.close();
  };

  /* ====================================================================== */
  /* ADMIN: tutti i contratti, chi ha firmato, nuove circolari              */
  /* ====================================================================== */
  V["ad-documenti"] = async () => {
    const [d, f, rete] = await Promise.all([Q.sel("app_documenti", { ord: ["pubblicato", false], lim: 500 }).catch(() => []), Q.sel("app_firme", { lim: 5000 }).catch(() => []), Q.sel("app_rete", { lim: 2000 }).catch(() => [])]);
    const attivi = rete.filter((r) => r.stato === "attivo");
    const devono = (x) => attivi.filter((r) => !(x.ruoli || []).length || (x.ruoli || []).includes(r.ruolo));
    const riga = (x) => { const n = f.filter((y) => y.documento === x.id).length, tot = devono(x).length; return voce(x.tipo === "contratto" ? "doc" : "campana", esc(x.titolo), `${esc(TIPI_DOC[x.tipo])} · ${(x.ruoli || []).length ? esc(x.ruoli.map((r) => RUOLI_RETE[r]).join(", ")) : "tutta la rete"}${x.richiede_firma ? ` · firmato da ${n} su ${tot}` : " · da leggere"}${x.attivo ? "" : " · non attivo"}`, "ad-documento/" + x.id, !x.attivo ? "rosso" : x.richiede_firma && n < tot ? "giallo" : "verde"); };
    const contratti = d.filter((x) => x.tipo === "contratto");
    return {
      t: "Contratti e documenti",
      h: `<div class="pad">${sez("Tutti i contratti", `<div class="griglia2">${contratti.map((x) => `<a class="tile" href="${esc(x.file)}" target="_blank" rel="noopener"><span class="ico blu">${I.doc}</span><b>${esc(x.titolo.replace("Contratto ", ""))}</b><small>PDF · versione ${esc(x.versione || "")}</small></a>`).join("")}</div>`)}
        ${sez("Chi ha firmato", lista(d.map(riga)) || vuoto("Nessun documento."))}
        ${sez("Nuova circolare o documento", `<form data-form="nuovo-doc" novalidate>
          ${campo("Tipo", `<select name="tipo"><option value="circolare">Circolare</option><option value="regolamento">Regolamento</option><option value="contratto">Contratto</option><option value="altro">Altro documento</option></select>`)}
          ${campo("Titolo", `<input name="titolo" maxlength="160" required placeholder="Es. Circolare n. 2/2026 · Premi del trimestre">`)}
          ${campo("Testo", `<textarea name="testo" rows="6" maxlength="20000" placeholder="Il testo che leggono e firmano"></textarea>`)}
          ${campo("Indirizzo del PDF (facoltativo)", `<input name="file" maxlength="200" placeholder="docs/nome-del-file.pdf">`, "Il PDF va messo nella cartella docs dell'app prima di pubblicare.")}
          <div class="campo"><span>Per chi</span><div style="display:flex;flex-wrap:wrap;gap:8px 14px">${ORDINE.map((r) => `<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" name="r_${r}"> ${esc(RUOLI_RETE[r])}</label>`).join("")}</div><small class="aiuto">Nessuna spunta = tutta la rete.</small></div>
          <label style="display:flex;gap:8px;align-items:center;margin:4px 0 12px"><input type="checkbox" name="firma" checked> Da firmare</label>
          <button class="btn" type="submit">Pubblica</button></form><p class="sotto piccolo">Chi deve leggerlo riceve l'avviso e lo trova in «Documenti».</p>`)}</div>`,
    };
  };
  FORM["nuovo-doc"] = async (f) => {
    if (f.titolo.value.trim().length < 3) return toast("Scrivi il titolo.", "errore");
    if (!f.testo.value.trim() && !f.file.value.trim()) return toast("Scrivi il testo o l'indirizzo del PDF.", "errore");
    const ruoli = ORDINE.filter((r) => f["r_" + r].checked);
    try {
      await Q.ins("app_documenti", { tipo: f.tipo.value, titolo: f.titolo.value.trim(), testo: f.testo.value.trim(), file: f.file.value.trim(), ruoli, richiede_firma: f.firma.checked, versione: new Date().toLocaleDateString("it-IT") });
    } catch (e) { return toast(spiegaErrore(e), "errore"); }
    toast("Pubblicato."); render();
  };
  V["ad-documento"] = async (id) => {
    const [d, f, rete] = await Promise.all([Q.uno("app_documenti", { id }), Q.sel("app_firme", { eq: { documento: id }, lim: 2000 }).catch(() => []), Q.sel("app_rete", { lim: 2000 }).catch(() => [])]);
    if (!d) return { t: "Documento", h: vuoto("Non trovato.") };
    const devono = rete.filter((r) => r.stato === "attivo" && (!(d.ruoli || []).length || d.ruoli.includes(r.ruolo)));
    const chi = (u) => rete.find((r) => r.utente === u) || {};
    const firmati = f.map((x) => `<div class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:8px"><div><b>${esc(x.nome)}</b><p class="sotto" style="margin:2px 0 0">${esc(RUOLI_RETE[chi(x.utente).ruolo] || "")} · ${new Date(x.firmato).toLocaleString("it-IT")}</p></div>${stato("verde", "Firmato")}</div>
      <img src="${esc(x.firma)}" alt="Firma di ${esc(x.nome)}" style="max-width:100%;height:70px;object-fit:contain;margin-top:6px;background:#fff;border-radius:8px"><div style="margin-top:6px">${btn("Ricevuta", "ricevuta-firma:" + id + ":" + x.utente, "piccolo chiaro")}</div></div>`).join("");
    const mancano = devono.filter((r) => !f.some((x) => x.utente === r.utente));
    return {
      t: d.titolo,
      h: `<div class="pad"><div class="card"><small>${esc(TIPI_DOC[d.tipo])} · ${(d.ruoli || []).length ? esc(d.ruoli.map((r) => RUOLI_RETE[r]).join(", ")) : "tutta la rete"}</small>${d.testo ? `<p style="margin:8px 0 0;white-space:pre-line">${esc(d.testo)}</p>` : ""}${d.file ? `<div style="margin-top:10px"><a class="btn chiaro" href="${esc(d.file)}" target="_blank" rel="noopener">Apri il PDF</a></div>` : ""}</div><div style="height:12px"></div>
        <div class="griglia2">${num(f.length, "Hanno firmato", "verde")}${num(mancano.length, "Devono ancora firmare", mancano.length ? "giallo" : "")}</div><div style="height:12px"></div>
        ${d.richiede_firma && mancano.length ? sez("Devono ancora firmare", lista(mancano.map((r) => voce("utente", esc(r.nome || r.codice), esc(RUOLI_RETE[r.ruolo]), null, "giallo")))) : ""}
        ${firmati ? sez("Firme ricevute", firmati) : ""}
        <div style="height:8px"></div>${btn(d.attivo ? "Togli dalla cartella (non attivo)" : "Rimetti nella cartella", "doc-attivo:" + id + ":" + (d.attivo ? "0" : "1"), "chiaro")}
        <p class="sotto piccolo">Le firme non si cancellano: restano come prova di cosa ha firmato ciascuno.</p></div>`,
    };
  };
  AZIONI["doc-attivo:"] = async (arg) => { const [id, v] = arg.split(":"); await Q.upd("app_documenti", { id }, { attivo: v === "1" }); toast("Fatto."); render(); };

  /* ====================================================================== */
  /* ADMIN: clienti di AncheCasa da affidare (Allegato C.5)                 */
  /* ====================================================================== */
  const COSA = { modulo: "Modulo dell'app", pacchetto: "Pacchetto Impresa completa", corso: "Corso AncheSicura", servizio: "Servizio AncheSicura", supermastro: "SuperMastro per artigiani", altro: "Altro" };
  V["ad-affida"] = async () => {
    const [v, rete] = await Promise.all([Q.sel("app_vendite", { eq: { affidato: true }, ord: ["creato", false], lim: 500 }).catch(() => []), Q.sel("app_rete", { eq: { stato: "attivo" }, lim: 2000 })]);
    const opz = (sel) => rete.map((r) => `<option value="${esc(r.utente)}" ${r.utente === sel ? "selected" : ""}>${esc(r.nome || r.codice)} · ${esc(RUOLI_RETE[r.ruolo])}${r.regione ? " · " + esc(r.regione) : ""}</option>`).join("");
    const ore = (x) => Math.floor((Date.now() - new Date(x.creato)) / 36e5);
    const aperti = v.filter((x) => x.stato === "proposta");
    return {
      t: "Clienti da affidare",
      h: `<div class="pad"><p class="sotto">Clienti di AncheCasa: portati da te o arrivati dal sito senza il codice di un agente. Chi li segue prende metà della quota di chi porta; niente quote di sviluppo, capo area e Rete Italia. Deve chiamarli entro 48 ore.</p><div style="height:10px"></div>
        <form data-form="affida" novalidate>
          ${campo("Cliente", `<input name="cliente" required maxlength="120">`)}
          <div class="griglia2">${campo("Partita IVA", `<input name="piva" maxlength="20" inputmode="numeric">`)}${campo("Telefono o mail", `<input name="contatto" maxlength="120">`)}</div>
          ${campo("Regione", `<select name="regione"><option value="">—</option>${REGIONI.map((r) => `<option>${r}</option>`).join("")}</select>`)}
          ${campo("Cosa ha chiesto", `<select name="cosa">${Object.entries(COSA).map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select>`)}
          ${campo("Dettaglio", `<input name="dettaglio" maxlength="200" placeholder="Es. abbonamento Impresa + modulo Sicurezza">`)}
          <div class="griglia2">${campo("Importo", `<input name="importo" type="number" min="0" step="0.01" value="0">`)}${campo("È", `<select name="tipo"><option value="mese">al mese</option><option value="una_tantum">una volta</option></select>`)}</div>
          ${campo("Affidalo a", `<select name="a" required><option value="">Scegli…</option>${opz("")}</select>`, "Di solito chi lavora nella regione del cliente.")}
          <button class="btn" type="submit">Affida il cliente</button></form>
        ${aperti.length ? sez("Affidati, da confermare", aperti.map((x) => `<div class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(x.cliente_nome)}</b>${ore(x) > 48 ? stato("rosso", "oltre 48 ore") : stato("giallo", ore(x) + " ore")}</div>
            <p class="sotto" style="margin:4px 0 8px">${esc(x.dettaglio || COSA[x.cosa] || "")} · ${euro(x.importo) || "0 €"}${x.tipo_importo === "mese" ? "/mese" : ""}</p>
            <div style="display:flex;gap:8px"><select id="riaff-${esc(x.id)}" style="flex:1">${opz(x.venditore)}</select>${btn("Riassegna", "riaffida:" + x.id, "piccolo chiaro")}</div></div>`).join("")) : ""}
        ${v.length ? sez("Tutti gli affidati", lista(v.map((x) => voce("utente", esc(x.cliente_nome), esc((rete.find((r) => r.utente === x.venditore) || {}).nome || "") + " · " + quando(x.creato), "re-vendita/" + x.id, x.stato === "attiva" ? "verde" : x.stato === "persa" ? "rosso" : "giallo")))) : ""}</div>`,
    };
  };
  FORM.affida = async (f) => {
    if (f.cliente.value.trim().length < 2) return toast("Scrivi il nome del cliente.", "errore");
    if (!f.a.value) return toast("Scegli a chi affidarlo.", "errore");
    try { await Q.ins("app_vendite", { venditore: f.a.value, cliente_nome: f.cliente.value.trim(), cliente_tipo: "azienda", cliente_piva: f.piva.value.trim(), cliente_contatto: f.contatto.value.trim(), cliente_regione: f.regione.value, cosa: f.cosa.value, dettaglio: f.dettaglio.value.trim(), importo: Number(f.importo.value || 0), tipo_importo: f.tipo.value, affidato: true }); }
    catch (e) { return toast(spiegaErrore(e), "errore"); }
    toast("Affidato: ha 48 ore per chiamarlo."); render();
  };
  AZIONI["riaffida:"] = async (id) => {
    const s = document.getElementById("riaff-" + id);
    if (!s) return;
    await Q.upd("app_vendite", { id }, { venditore: s.value });
    toast("Riassegnato."); render();
  };
}
