/* Subappalti e Profit Guard (parte 12, 11.10.2026).
   - Ufficio tecnico (nel dossier): costi di sicurezza e logistica, smaltimento CER, subappalti, Profit Guard,
     approvazione finale del preventivo ufficiale, pagamenti del cliente su misura.
   - Richiesta di subappalto: lavorazioni, scadenza, pagamenti su misura (righe libere), inviti per mail.
   - Amministrazione (titolare o admin): offerte da decidere, margine prima e dopo, approva / chiedi modifica / rifiuta.
   - Agente: fornitori della zona da proporre e invitare per mail.
   - Fornitore: pagina #/offerta/<token> senza password (AncheCasa + ditta), offerta con pagamenti accettati o controproposti. */
import { I, esc, voce, lista, sez, stato, btn, campo, vuoto, avviso, toast, foglio, chiudiFoglio, spiegaErrore } from "./ui.js";
import { SB, PAGAMENTI_PROPOSTA, ERRORI_PAG, errorePagamenti, quote } from "./sub-api.js";
import { FL } from "./flash-api.js";

const ERRORI = Object.assign({}, ERRORI_PAG, {
  non_autorizzato: "Non hai i permessi per farlo.", preventivo_blindato: "Il preventivo ufficiale è già approvato: computo e costi non si cambiano più.",
  subappalti_aperti: "Ci sono richieste di subappalto ancora aperte: decidi le offerte o annulla le richieste.",
  voci_senza_prezzo: "Ci sono voci del computo senza prezzo.", margine_da_confermare: "Il margine non è sopra la soglia: serve la conferma.",
  scrivi_perche_forzi: "Scrivi perché approvi sotto soglia.", computo_da_validare: "Prima l'ufficio deve validare il computo.",
  scadenza_non_valida: "La scadenza delle offerte non può essere nel passato.", richiesta_chiusa: "Questa richiesta è chiusa.",
  offerta_gia_decisa: "Questa offerta è già stata decisa.", scrivi_cosa_negoziare: "Scrivi cosa chiedi di cambiare.",
  codice_cer_non_valido: "Codice CER nel formato 17 09 04 (con * se pericoloso).", mail_non_configurata: "Inviti salvati, ma l'invio mail non è ancora configurato: AncheCasa lo sta attivando.",
  troppe_mail_oggi: "Troppe mail oggi per questa ditta: riprova domani.", manca_la_ditta: "Scrivi il nome della tua ditta.",
  importo_non_valido: "Scrivi un importo valido.", invito_non_trovato: "Invito non trovato.", preventivo_gia_accettato: "Il preventivo è già accettato.",
  ci_sono_gia_offerte: "Ci sono già offerte: i pagamenti non si cambiano più.", richiesta_gia_assegnata: "Richiesta già assegnata.",
  ha_chiesto_di_non_ricevere: "Questo fornitore ha chiesto di non ricevere più mail.",
});
const errore = (e) => ERRORI[String((e && e.message) || e)] || spiegaErrore(e);
const euro = (n) => (n == null ? "–" : Number(n).toLocaleString("it-IT", { style: "currency", currency: "EUR" }));
const euro0 = (n) => (n == null ? "–" : Number(n).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }));
const data = (d) => (d ? new Date(String(d).length === 10 ? d + "T12:00:00" : d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");
const num = (v) => (v === "" || v == null ? null : Number(String(v).replace(",", ".")));
const STATO_OFF = { in_revisione: ["Da decidere", "giallo"], in_trattativa: ["In trattativa", "blu"], approvata: ["Approvata", "verde"], rifiutata: ["Non scelta", "rosso"] };
const STATO_RIC = { aperta: ["Aperta", "giallo"], assegnata: ["Assegnata", "verde"], annullata: ["Annullata", "rosso"] };
const STATO_MAIL = { da_inviare: ["Da inviare", "giallo"], inviata: ["Inviata", "verde"], errore: ["Errore", "rosso"], bloccata: ["Non vuole mail", "rosso"] };
const SEM = { verde: ["Margine sopra la soglia", "verde"], giallo: ["Margine sotto la soglia", "giallo"], rosso: ["In perdita", "rosso"], grigio: ["Da completare", "blu"] };

function stile() {
  if (document.getElementById("stile-sub")) return;
  const s = document.createElement("style");
  s.id = "stile-sub";
  s.textContent = `
  .pg{background:#fff;border:1px solid #e7ecf3;border-radius:16px;overflow:hidden}
  .pg-testa{padding:14px;display:flex;justify-content:space-between;align-items:center;gap:10px}
  .pg-testa b{font:800 24px var(--titoli);color:var(--blu)}
  .pg-testa small{display:block;color:var(--grigio);font-size:12px;text-transform:uppercase;letter-spacing:.05em;font-weight:700}
  .pg.verde{border-left:6px solid var(--verde)} .pg.giallo{border-left:6px solid var(--giallo)} .pg.rosso{border-left:6px solid var(--rosso)} .pg.grigio{border-left:6px solid var(--linea)}
  .pg table{width:100%;border-collapse:collapse;font-size:13.5px;font-variant-numeric:tabular-nums}
  .pg td{padding:6px 14px;border-top:1px solid #f0f3f7}
  .pg td.r{text-align:right;white-space:nowrap}
  .pg tr.t td{font-weight:800;color:var(--blu)}
  .pag{display:flex;flex-direction:column;gap:8px}
  .pag-riga{background:#fff;border:1px solid #e7ecf3;border-radius:14px;padding:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .pag-riga .tutta{grid-column:1/-1}
  .pag-riga input,.pag-riga select{font:inherit;border:1.5px solid var(--linea);border-radius:10px;padding:9px;min-height:44px;width:100%;background:#fff}
  .pag-riga label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:700;color:var(--grigio)}
  .pag-somma{font-size:13.5px;padding:8px 12px;border-radius:12px;background:var(--carta)}
  .pag-somma.no{background:var(--rosso-2);color:var(--rosso);font-weight:700}
  .pag-somma.si{background:var(--verde-2);color:var(--verde);font-weight:700}
  .sub-scelta{display:flex;flex-direction:column;gap:6px}
  .sub-scelta label{display:flex;gap:10px;align-items:flex-start;background:#fff;border:1px solid #e7ecf3;border-radius:12px;padding:10px;font-size:14px}
  .sub-scelta input{width:22px;height:22px;flex:0 0 auto;margin-top:1px}
  .sub-scelta small{display:block;color:var(--grigio)}
  .sub-dest{display:grid;grid-template-columns:1fr;gap:8px}
  .sub-dest input{font:inherit;border:1.5px solid var(--linea);border-radius:10px;padding:9px;min-height:44px;width:100%}
  .sub-lista{background:#fff;border:1px solid #e7ecf3;border-radius:14px;overflow:hidden}
  .sub-lista>div{padding:10px 12px;border-top:1px solid #f0f3f7;display:flex;justify-content:space-between;gap:10px;align-items:center;font-size:14px}
  .sub-lista>div:first-child{border-top:0}
  .sub-lista small{display:block;color:var(--grigio)}
  `;
  document.head.appendChild(s);
}

/* ---------- Generatore dei pagamenti su misura (righe libere) ---------- */
const TIPI = [["perc", "Percentuale"], ["importo", "Importo fisso"], ["saldo", "Saldo (il resto)"]];
function rigaPag(r, k) {
  return `<div class="pag-riga" data-pag-riga>
    <label class="tutta">Descrizione<input name="descrizione" maxlength="200" value="${esc(r.descrizione || "")}" placeholder="es. Acconto, SAL a fine demolizioni, Collaudo"></label>
    <label class="tutta">Quando (facoltativo)<input name="evento" maxlength="200" value="${esc(r.evento || "")}" placeholder="es. alla firma, a massetto finito, a 30 giorni"></label>
    <label>Tipo<select name="tipo">${TIPI.map(([v, t]) => `<option value="${v}" ${r.tipo === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
    <label>Valore<input name="valore" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(r.valore ?? "")}" ${r.tipo === "saldo" ? "disabled" : ""} placeholder="${r.tipo === "importo" ? "€" : "%"}"></label>
    <button type="button" class="btn chiaro piccolo tutta" data-pag-via="${esc(k)}">Togli</button></div>`;
}
export function editorPagamenti(k, righe, totale) {
  return `<div class="pag" data-pag="${esc(k)}" data-totale="${esc(totale ?? "")}">${(righe && righe.length ? righe : PAGAMENTI_PROPOSTA).map((r) => rigaPag(r, k)).join("")}</div>
    <div style="height:8px"></div><div class="pag-somma" data-pag-somma="${esc(k)}"></div><div style="height:8px"></div>
    <button type="button" class="btn chiaro piccolo" data-pag-piu="${esc(k)}">${I.piu} Aggiungi un pagamento</button>`;
}
export function leggiPagamenti(el, k) {
  return [...el.querySelectorAll(`[data-pag="${k}"] [data-pag-riga]`)].map((r) => {
    const v = (n) => r.querySelector(`[name="${n}"]`).value;
    const tipo = v("tipo");
    return { descrizione: v("descrizione").trim(), evento: v("evento").trim(), tipo, valore: tipo === "saldo" ? null : num(v("valore")) };
  });
}
function riassunto(el, k) {
  const box = el.querySelector(`[data-pag-somma="${k}"]`);
  if (!box) return;
  const p = leggiPagamenti(el, k);
  const e = errorePagamenti(p);
  const perc = p.filter((r) => r.tipo === "perc").reduce((a, r) => a + (Number(r.valore) || 0), 0);
  const imp = p.filter((r) => r.tipo === "importo").reduce((a, r) => a + (Number(r.valore) || 0), 0);
  const tot = Number(el.querySelector(`[data-pag="${k}"]`).dataset.totale) || 0;
  let q = "";
  if (!e && tot > 0) { try { q = " · " + quote(p, tot).map((x) => esc(x.descrizione) + " " + euro(x.importo)).join(" · "); } catch (er) { box.className = "pag-somma no"; box.innerHTML = esc(ERRORI_PAG[er.message] || er.message); return; } }
  box.className = "pag-somma " + (e ? "no" : "si");
  box.innerHTML = e ? esc(ERRORI_PAG[e] || e) : `Percentuali ${String(Math.round(perc * 100) / 100).replace(".", ",")}%${imp ? " · importi fissi " + euro(imp) : ""}${p.some((r) => r.tipo === "saldo") ? " · saldo il resto" : ""} ✓${q}`;
}
export function attivaPagamenti(el) {
  el.querySelectorAll("[data-pag]").forEach((box) => {
    const k = box.dataset.pag;
    riassunto(el, k);
    box.addEventListener("input", () => riassunto(el, k));
    box.addEventListener("change", (e) => {
      if (e.target.name === "tipo") { const v = e.target.closest("[data-pag-riga]").querySelector('[name="valore"]'); v.disabled = e.target.value === "saldo"; if (v.disabled) v.value = ""; v.placeholder = e.target.value === "importo" ? "€" : "%"; }
      riassunto(el, k);
    });
    box.addEventListener("click", (e) => { const b = e.target.closest("[data-pag-via]"); if (b) { b.closest("[data-pag-riga]").remove(); riassunto(el, k); } });
  });
  el.querySelectorAll("[data-pag-piu]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.pagPiu;
    el.querySelector(`[data-pag="${k}"]`).insertAdjacentHTML("beforeend", rigaPag({ descrizione: "", tipo: "perc", valore: "" }, k));
    riassunto(el, k);
  }));
}
const elencoPagamenti = (p, totale) => {
  if (!p || !p.length) return vuoto("Nessun pagamento indicato.");
  let q = null; try { if (totale > 0) q = quote(p, totale); } catch (e) { q = null; }
  return `<div class="sub-lista">${p.map((r, i) => `<div><span>${esc(r.descrizione)}${r.evento ? `<small>${esc(r.evento)}</small>` : ""}</span><span>${r.tipo === "perc" ? String(r.valore).replace(".", ",") + "%" : r.tipo === "importo" ? euro(r.valore) : "saldo"}${q ? `<small>${euro(q[i].importo)}</small>` : ""}</span></div>`).join("")}</div>`;
};

export function installa(core) {
  const { S, V, AZIONI, FORM, vai, render } = core;
  stile();
  const io = () => core.DB.idUtente();
  const ruoloIn = (org) => (((S.miei && S.miei.org) || []).find((o) => o.id === org) || {}).ruolo;
  const gestisco = (org) => !!S.admin || ["titolare", "responsabile"].includes(ruoloIn(org));
  const amministro = (org) => !!S.admin || ruoloIn(org) === "titolare";

  /* ====================================================================== */
  /* Collegamenti                                                            */
  /* ====================================================================== */
  const modVecchio = V.mod;
  if (modVecchio) V.mod = async (id) => {
    const out = await modVecchio(id);
    if (id === "ufficio" && out && out.h) out.h = out.h.replace('<div class="pad">', `<div class="pad">${lista([voce("euro", "Offerte dei fornitori", "Subappalti da decidere e margini", "ad-offerte", "arancio")])}<div style="height:12px"></div>`);
    return out;
  };
  const adVecchio = V["ad-home"];
  if (adVecchio) V["ad-home"] = async (...a) => {
    const out = await adVecchio(...a);
    if (out && out.h) out.h = out.h.replace('<div class="pad">', `<div class="pad">${lista([voce("euro", "Offerte dei fornitori e Profit Guard", "Approvazioni, margini, soglia minima", "ad-offerte", "arancio")])}<div style="height:12px"></div>`);
    return out;
  };

  /* ====================================================================== */
  /* UFFICIO: dentro il dossier                                              */
  /* ====================================================================== */
  const dossierVecchio = V["so-dossier"];
  if (dossierVecchio) V["so-dossier"] = async (id) => {
    const out = await dossierVecchio(id);
    try {
      const s = await FL.sopralluogo(id);
      if (!s || !gestisco(s.org) || !out.h.includes("<!--sub-ufficio-->")) return out;
      const [c, pg, ric] = await Promise.all([SB.computo(id), SB.profitGuard(id), SB.richieste(id)]);
      const k = c || { smaltimento: [] };
      const bl = !!(c && c.blindato_il);
      const dis = bl ? "disabled" : "";
      const offerte = {};
      for (const r of ric) offerte[r.id] = await SB.offerte(r.id);
      const docPag = pg.preventivo ? await SB.milestone({ documento: pg.preventivo }) : [];
      const prev = pg.preventivo ? await core.Q.uno("app_fe_documenti", { id: pg.preventivo }) : null;
      const blocco = `
        ${sez("Sicurezza, logistica e smaltimento", `<form data-form="sub-costi" data-id="${esc(id)}" novalidate>
          <div class="griglia2">${campo("Oneri sicurezza (%)", `<input name="sicurezza_perc" type="number" inputmode="decimal" min="0" max="100" step="0.01" value="${esc(k.sicurezza_perc ?? "")}" ${dis}>`)}
          ${campo("Oppure importo dal PSC (€)", `<input name="sicurezza_importo" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(k.sicurezza_importo ?? "")}" ${dis}>`, "Se c'è l'importo, vale quello.")}</div>
          <div class="griglia2">${campo("Piano", `<input name="piano" type="number" min="-3" max="80" value="${esc(k.piano ?? "")}" ${dis}>`)}
          ${campo("Ascensore", `<select name="ascensore" ${dis}><option value="">Non so</option><option value="si" ${k.ascensore === true ? "selected" : ""}>Sì</option><option value="no" ${k.ascensore === false ? "selected" : ""}>No</option></select>`)}</div>
          ${campo("Maggiorazione per trasporto ai piani (%)", `<input name="piano_perc" type="number" inputmode="decimal" min="0" max="100" step="0.01" value="${esc(k.piano_perc ?? 0)}" ${dis}>`, "La decide il tecnico: si applica alle lavorazioni.")}
          <div class="griglia2">${campo("Zona a traffico limitato", `<select name="ztl" ${dis}><option value="no">No</option><option value="si" ${k.ztl ? "selected" : ""}>Sì</option></select>`)}
          ${campo("Costo permessi ZTL (€)", `<input name="ztl_costo" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(k.ztl_costo ?? 0)}" ${dis}>`)}</div>
          ${campo("Smaltimento rifiuti (una riga per codice CER)", `<textarea name="smaltimento" rows="3" ${dis} placeholder="17 09 04; misti da demolizione; 2,5 t; 120 €/t">${esc((k.smaltimento || []).map((x) => `${x.cer}; ${x.descrizione || ""}; ${String(x.tonnellate).replace(".", ",")} t; ${String(x.prezzo_t).replace(".", ",")} €/t`).join("\n"))}</textarea>`, "Formato: codice CER; descrizione; tonnellate; prezzo a tonnellata. Il prezzo è quello del vostro impianto.")}
          <div class="griglia2">${campo("Spese generali (%)", `<input name="spese_generali_perc" type="number" inputmode="decimal" min="0" max="100" step="0.01" value="${esc(k.spese_generali_perc ?? 0)}" ${dis}>`)}
          ${campo("Costi interni (€)", `<input name="costi_interni" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(k.costi_interni ?? 0)}" ${dis}>`, "Vostra manodopera e materiali.")}</div>
          ${bl ? "" : `<button class="btn chiaro" type="submit">Salva e aggiorna il margine</button>`}</form>`)}
        ${sez("Subappalti", `${ric.length ? `<div class="sub-lista">${ric.map((r) => { const o = offerte[r.id] || []; const ap = o.find((x) => x.stato === "approvata"); return `<div data-go="sub-vedi/${esc(r.id)}" role="button" tabindex="0" style="cursor:pointer"><span><b>${esc(r.titolo)}</b><small>${o.length} offerte · entro il ${data(r.scadenza)}${ap ? " · " + esc(ap.ditta) + " " + euro(ap.importo) : ""}</small></span>${stato(STATO_RIC[r.stato][1], STATO_RIC[r.stato][0])}</div>`; }).join("")}</div>` : vuoto("Nessuna richiesta di subappalto.")}
          ${bl ? "" : `<div style="height:10px"></div>${btn(I.piu + " Nuova richiesta di subappalto", "go:sub-nuova/" + id, "chiaro")}`}`)}
        ${sez("Profit Guard", profitHtml(pg))}
        ${amministro(s.org) ? sez("Approvazione amministrativa", bl
          ? `${avviso("Preventivo ufficiale approvato il " + data(c.blindato_il) + ". Computo, costi e subappalti sono bloccati.", "")}<div style="height:10px"></div>${pg.preventivo ? btn(I.doc + " Apri il preventivo", "go:fe-vedi/" + pg.preventivo, "blu") : ""}`
          : `<p class="sotto">Controlla il margine e approva: si crea (o si aggiorna) il preventivo ufficiale per il cliente con lavorazioni, logistica, smaltimento e oneri della sicurezza. Dopo, computo e costi non si cambiano più.</p>${btn(I.ok + " Approva e genera il preventivo ufficiale", "sub-ufficiale:" + id)}`)
          : (bl ? avviso("Preventivo ufficiale approvato dall'amministrazione.", "") : `<p class="sotto">Il preventivo ufficiale lo approva il titolare.</p>`)}
        ${prev ? sez("Pagamenti del cliente", prev.stato_preventivo === "accettato" ? elencoPagamenti(docPag, Number(prev.totale)) : `<form data-form="sub-pag-cliente" data-doc="${esc(prev.id)}" novalidate>
          <p class="sotto">Su misura per questa commessa. Totale del preventivo: <b>${euro(prev.totale)}</b>. Finiscono nelle condizioni del preventivo.</p>
          ${editorPagamenti("cliente", docPag, prev.totale)}<div style="height:12px"></div><button class="btn chiaro" type="submit">Salva i pagamenti del cliente</button></form>`) : ""}`;
      out.h = out.h.replace("<!--sub-ufficio-->", blocco);
      const d = out.dopo;
      out.dopo = async (el) => {
        if (d) await d(el);
        attivaPagamenti(el);
        if (bl) { // preventivo ufficiale approvato: il computo resta solo da leggere
          el.querySelectorAll('form[data-form="fl-computo"] input, form[data-form="fl-computo"] select').forEach((x) => { x.disabled = true; });
          el.querySelectorAll('form[data-form="fl-computo"] button, [data-az="fl-riga-piu"]').forEach((x) => { x.style.display = "none"; });
        }
      };
    } catch (e) { console.warn("subappalti", e); }
    return out;
  };

  function profitHtml(pg) {
    const sm = SEM[pg.semaforo] || SEM.grigio;
    const r = pg.ricavi, c = pg.costi;
    const avvisi = [];
    if ((pg.senza_prezzo || []).length) avvisi.push("Voci senza prezzo: " + pg.senza_prezzo.map(esc).join(", ") + ".");
    if (pg.soglia == null) avvisi.push("Soglia minima di margine non impostata: la decide l'admin.");
    if (pg.richieste_aperte) avvisi.push(pg.richieste_aperte + (pg.richieste_aperte === 1 ? " richiesta di subappalto aperta" : " richieste di subappalto aperte") + ": il costo non è ancora chiuso.");
    return `<div class="pg ${esc(pg.semaforo)}"><div class="pg-testa"><div><small>Margine operativo netto</small><b>${euro0(pg.mon)}</b> <span class="sotto">${pg.mon_perc != null ? String(pg.mon_perc).replace(".", ",") + "%" : ""}</span></div>${stato(sm[1], sm[0])}</div>
      <table><tr><td>Lavorazioni</td><td class="r">${euro(r.lavori)}</td></tr>${r.piani ? `<tr><td>Trasporto ai piani</td><td class="r">${euro(r.piani)}</td></tr>` : ""}${r.ztl ? `<tr><td>ZTL</td><td class="r">${euro(r.ztl)}</td></tr>` : ""}${r.smaltimento ? `<tr><td>Smaltimento</td><td class="r">${euro(r.smaltimento)}</td></tr>` : ""}${r.sicurezza ? `<tr><td>Oneri sicurezza</td><td class="r">${euro(r.sicurezza)}</td></tr>` : ""}
      <tr class="t"><td>Ricavi (imponibile)</td><td class="r">${euro(r.totale)}</td></tr>
      <tr><td>Subappalti approvati (${c.subappalti_n})</td><td class="r">− ${euro(c.subappalti)}</td></tr><tr><td>Costi interni</td><td class="r">− ${euro(c.interni)}</td></tr><tr><td>Spese generali</td><td class="r">− ${euro(c.spese_generali)}</td></tr><tr><td>Costi passanti (sicurezza, ZTL, smaltimento)</td><td class="r">− ${euro(c.passanti)}</td></tr>
      <tr class="t"><td>Margine</td><td class="r">${euro(pg.mon)}</td></tr>${pg.soglia != null ? `<tr><td>Soglia minima</td><td class="r">${String(pg.soglia).replace(".", ",")}%</td></tr>` : ""}</table></div>
      ${avvisi.length ? `<div style="height:8px"></div>${avviso(avvisi.join("<br>"), "")}` : ""}`;
  }

  FORM["sub-costi"] = async (f) => {
    const v = (n) => f[n].value;
    const smalt = [];
    for (const riga of v("smaltimento").split("\n").map((x) => x.trim()).filter(Boolean)) {
      const p = riga.split(";").map((x) => x.trim());
      const cer = (p[0] || "").replace(/\s+/g, " ").replace(/^(\d{2})(\d{2})(\d{2})(\*?)$/, "$1 $2 $3$4");
      const t = num((p[2] || "").replace(/[^\d.,]/g, "")), pr = num((p[3] || "").replace(/[^\d.,]/g, ""));
      if (!/^\d{2} \d{2} \d{2}\*?$/.test(cer)) return toast(ERRORI.codice_cer_non_valido + " Riga: " + riga, "errore");
      if (t == null || pr == null) return toast("Smaltimento: servono tonnellate e prezzo a tonnellata. Riga: " + riga, "errore");
      smalt.push({ cer, descrizione: (p[1] || "").slice(0, 80), tonnellate: t, prezzo_t: pr });
    }
    try {
      await SB.salvaComputo(f.dataset.id, { sicurezza_perc: num(v("sicurezza_perc")), sicurezza_importo: num(v("sicurezza_importo")), piano: num(v("piano")), ascensore: v("ascensore") === "" ? null : v("ascensore") === "si",
        piano_perc: num(v("piano_perc")) || 0, ztl: v("ztl") === "si", ztl_costo: num(v("ztl_costo")) || 0, smaltimento: smalt, spese_generali_perc: num(v("spese_generali_perc")) || 0, costi_interni: num(v("costi_interni")) || 0 });
      toast("Salvato: margine aggiornato."); render();
    } catch (e) { toast(errore(e), "errore"); }
  };
  FORM["sub-pag-cliente"] = async (f) => {
    const p = leggiPagamenti(f, "cliente");
    const e = errorePagamenti(p); if (e) return toast(ERRORI_PAG[e], "errore");
    try { await SB.pagamentiPreventivo(f.dataset.doc, p); toast("Pagamenti del cliente salvati nel preventivo."); render(); } catch (er) { toast(errore(er), "errore"); }
  };
  AZIONI["sub-ufficiale:"] = async (id) => {
    let pg; try { pg = await SB.profitGuard(id); } catch (e) { return toast(errore(e), "errore"); }
    const sotto = pg.semaforo !== "verde";
    foglio(`<h2>Approvare il preventivo ufficiale?</h2>${profitHtml(pg)}<div style="height:10px"></div>
      ${sotto ? `${pg.semaforo === "rosso" || pg.soglia != null ? avviso(pg.semaforo === "rosso" ? "Attenzione: con questi costi il lavoro è in perdita." : "Il margine è sotto la soglia minima.", "rosso") + '<div style="height:10px"></div>' : ""}
        <label class="campo"><span>Perché approvi lo stesso?</span><textarea id="sub-nota-forza" maxlength="300" placeholder="es. cliente strategico, lavoro di completamento"></textarea></label>` : ""}
      ${btn(I.ok + (sotto ? " Approva comunque" : " Sì, approva"), "sub-ufficiale-ok:" + id + ":" + (sotto ? "1" : "0"))}<div style="height:8px"></div>${btn("Annulla", "sub-chiudi", "chiaro")}`);
  };
  AZIONI["sub-ufficiale-ok:"] = async (arg) => {
    const [id, forza] = arg.split(":");
    const nota = (document.getElementById("sub-nota-forza") || {}).value || "";
    try { const pid = await SB.preventivoUfficiale(id, forza === "1", nota); chiudiFoglio(); toast("Preventivo ufficiale pronto: ora puoi decidere i pagamenti del cliente."); render(); return pid; }
    catch (e) { toast(errore(e), "errore"); }
  };
  AZIONI["sub-chiudi"] = () => chiudiFoglio();

  /* ====================================================================== */
  /* Nuova richiesta di subappalto                                           */
  /* ====================================================================== */
  function destinatariHtml(rete, zona) {
    return `${rete.length ? `<p class="sotto" style="margin:0 0 6px;font-weight:700;color:var(--blu)">Della rete AncheCasa</p><div class="sub-scelta">${rete.map((o) => `<label><input type="checkbox" data-dest="rete" data-email="${esc(o.email)}" data-ditta="${esc(o.nome)}" data-org="${esc(o.id)}"><span>${esc(o.nome)}<small>${esc(o.citta || "")} · ${esc(o.email)}</small></span></label>`).join("")}</div><div style="height:10px"></div>` : ""}
      ${zona.length ? `<p class="sotto" style="margin:0 0 6px;font-weight:700;color:var(--blu)">Proposti dagli agenti (non iscritti)</p><div class="sub-scelta">${zona.map((z) => `<label><input type="checkbox" data-dest="territorio" data-email="${esc(z.email)}" data-ditta="${esc(z.ditta)}" data-nome="${esc(z.nome)}" data-tel="${esc(z.telefono)}"><span>${esc(z.ditta)}${z.mestiere ? " · " + esc(z.mestiere) : ""}<small>${esc(z.comune || "")} · ${esc(z.email)}</small></span></label>`).join("")}</div><div style="height:10px"></div>` : ""}
      ${campo("Altri indirizzi (uno per riga)", `<textarea name="altri" rows="3" placeholder="Ditta Rossi; info@ditta-rossi.it"></textarea>`, "Solo contatti professionali. Ogni mail spiega chi siamo e ha il link per non riceverne più.")}`;
  }
  function leggiDestinatari(f) {
    const d = [...f.querySelectorAll("[data-dest]:checked")].map((x) => ({ email: x.dataset.email, ditta: x.dataset.ditta || "", nome: x.dataset.nome || "", telefono: x.dataset.tel || "", origine: x.dataset.dest, rete_org: x.dataset.org || null }));
    String((f.altri || {}).value || "").split("\n").map((x) => x.trim()).filter(Boolean).forEach((r) => {
      const p = r.split(/[;,]/).map((x) => x.trim()); const email = p.find((x) => x.includes("@")) || ""; const ditta = p.find((x) => !x.includes("@")) || "";
      d.push({ email, ditta, nome: "", telefono: "", origine: "territorio", rete_org: null });
    });
    return d;
  }
  async function mandaInviti(richiesta, dest) {
    if (!dest.length) return null;
    try {
      const r = await SB.invita(richiesta, dest);
      toast(`Mail inviate: ${r.inviate}${r.gia_invitati ? ` · già invitati ${r.gia_invitati}` : ""}${r.bloccate ? ` · ${r.bloccate} non vogliono mail` : ""}${r.errori ? ` · errori ${r.errori}` : ""}.`);
      return r;
    } catch (e) { toast(errore(e), "errore"); return null; }
  }
  function mostraProva(r) {
    if (!r || !r.prova || !r.prova.length) return;
    foglio(`<h2>Prova: mail simulate</h2><p class="sotto">Nella prova le mail non partono. Ecco il link che riceverebbe ogni fornitore:</p><div class="sub-lista">${r.prova.map((x) => `<div><span>${esc(x.email)}<small><a href="${esc(SB.linkOfferta(x.token))}" style="text-decoration:underline">Apri la pagina del fornitore</a></small></span></div>`).join("")}</div><div style="height:12px"></div>${btn("Chiudi", "sub-chiudi", "chiaro")}`);
  }

  V["sub-nuova"] = async (id) => {
    const s = await FL.sopralluogo(id);
    if (!s || !gestisco(s.org)) return { t: "Subappalto", h: `<div class="pad">${vuoto("Non trovato o non è della tua ditta.")}</div>` };
    const [rete, zona] = await Promise.all([SB.fornitoriRete().catch(() => []), SB.fornitoriZona(s.org).catch(() => [])]);
    const tra10 = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
    return {
      t: "Nuova richiesta di subappalto",
      h: `<div class="pad"><form data-form="sub-nuova" data-id="${esc(id)}" novalidate>
        ${sez("Il lavoro", `${campo("Titolo", `<input name="titolo" maxlength="120" placeholder="es. Opere murarie bagno">`)}
          <div class="griglia2">${campo("Mestiere", `<input name="mestiere" maxlength="60" placeholder="es. muratore">`)}${campo("Offerte entro il", `<input name="scadenza" type="date" value="${tra10}" min="${new Date().toISOString().slice(0, 10)}">`)}</div>
          ${campo("Capitolato e note", `<textarea name="descrizione" maxlength="3000" rows="4" placeholder="Cosa deve fare, materiali compresi o no, orari, accesso al cantiere"></textarea>`, `Il fornitore vede solo il comune (${esc(s.comune || "da indicare")}), non il cliente.`)}`)}
        ${sez("Lavorazioni del computo", (s.computo || []).length ? `<div class="sub-scelta">${s.computo.map((r, i) => `<label><input type="checkbox" name="voce" value="${i}"><span>${esc(r.descrizione || r.lavorazione)}<small>${esc(String(r.quantita).replace(".", ","))} ${esc(r.um || "")}${r.stanza ? " · " + esc(r.stanza) : ""}</small></span></label>`).join("")}</div>` : vuoto("Computo vuoto."))}
        ${sez("Come pagate questo fornitore", `<p class="sotto">Su misura per questo lavoro: aggiungi, togli e cambia le righe. Il fornitore può accettare o proporre altro.</p>${editorPagamenti("sub", PAGAMENTI_PROPOSTA)}`)}
        ${sez("A chi mandare la richiesta (mail)", destinatariHtml(rete, zona))}
        <button class="btn" type="submit">Pubblica e manda le mail</button></form></div>`,
      dopo: (el) => attivaPagamenti(el),
    };
  };
  FORM["sub-nuova"] = async (f) => {
    const id = f.dataset.id;
    const s = await FL.sopralluogo(id);
    const titolo = f.titolo.value.trim();
    if (titolo.length < 3) return toast("Scrivi il titolo.", "errore");
    if (!f.scadenza.value) return toast("Scegli la scadenza delle offerte.", "errore");
    const pag = leggiPagamenti(f, "sub");
    const e = errorePagamenti(pag); if (e) return toast(ERRORI_PAG[e], "errore");
    const voci = [...f.querySelectorAll('input[name="voce"]:checked')].map((x) => { const r = s.computo[Number(x.value)]; return { descrizione: r.descrizione || r.lavorazione, quantita: r.quantita, um: r.um, stanza: r.stanza || "" }; });
    const dest = leggiDestinatari(f);
    let rid;
    try { rid = await SB.crea(id, { titolo, descrizione: f.descrizione.value.trim(), voci, mestiere: f.mestiere.value.trim(), scadenza: f.scadenza.value }, pag); } catch (er) { return toast(errore(er), "errore"); }
    const r = await mandaInviti(rid, dest);
    if (!dest.length) toast("Richiesta pubblicata. Aggiungi i fornitori da invitare.");
    await vai("sub-vedi/" + rid, true);
    setTimeout(() => mostraProva(r), 400);
  };

  /* ====================================================================== */
  /* Richiesta: inviti, offerte, decisioni                                   */
  /* ====================================================================== */
  V["sub-vedi"] = async (id) => {
    const r = await SB.richiesta(id);
    if (!r || !gestisco(r.org)) return { t: "Subappalto", h: `<div class="pad">${vuoto("Richiesta non trovata.")}</div>` };
    const [pag, inviti, off, pg, rete, zona] = await Promise.all([SB.milestone({ richiesta: id }), SB.inviti(id), SB.offerte(id), SB.profitGuard(r.sopralluogo), SB.fornitoriRete().catch(() => []), SB.fornitoriZona(r.org).catch(() => [])]);
    const contro = {};
    for (const o of off) if (!o.accetta_pagamenti) contro[o.id] = await SB.milestone({ offerta: o.id });
    const decide = amministro(r.org);
    const st = STATO_RIC[r.stato];
    const invitoDi = (o) => inviti.find((i) => i.id === o.invito) || {};
    return {
      t: "Subappalto",
      h: `<div class="pad">
        <h2 class="saluto" style="font-size:20px">${esc(r.titolo)}</h2><p class="sotto">${esc(r.mestiere || "")}${r.comune ? " · " + esc(r.comune) : ""} · offerte entro il ${data(r.scadenza)} ${stato(st[1], st[0])}</p>
        ${r.descrizione ? `<div class="card" style="white-space:pre-line">${esc(r.descrizione)}</div><div style="height:12px"></div>` : ""}
        ${sez("Pagamenti proposti", elencoPagamenti(pag))}
        ${sez("Offerte", off.length ? `<div class="sub-lista">${off.map((o) => {
          const so = STATO_OFF[o.stato]; const p = o.accetta_pagamenti ? pag : contro[o.id];
          const dopo = pg.ricavi.totale > 0 && o.stato !== "approvata" ? pg.mon - Number(o.importo) : null;
          return `<div style="flex-direction:column;align-items:stretch"><div style="display:flex;justify-content:space-between;gap:10px"><span><b>${esc(o.ditta)}</b><small>${esc(invitoDi(o).email || "")}${o.piva ? " · P.IVA " + esc(o.piva) : ""}${o.tempi_giorni ? " · " + esc(o.tempi_giorni) + " giorni" : ""}</small></span><span style="text-align:right"><b>${euro(o.importo)}</b>${stato(so[1], so[0])}</span></div>
            ${o.note ? `<small style="white-space:pre-line">${esc(o.note)}</small>` : ""}
            <small>${o.accetta_pagamenti ? "Accetta i vostri pagamenti" : "<b style='color:var(--giallo)'>Propone pagamenti diversi:</b>"}</small>${o.accetta_pagamenti ? "" : elencoPagamenti(p, Number(o.importo))}
            ${dopo != null && ["in_revisione", "in_trattativa"].includes(o.stato) ? `<small>Se la approvi, il margine passa a <b>${euro0(dopo)}</b>${pg.ricavi.totale ? " (" + String(Math.round(dopo / pg.ricavi.totale * 1000) / 10).replace(".", ",") + "%)" : ""}.</small>` : ""}
            ${o.nota_admin ? `<small>Nota: ${esc(o.nota_admin)}</small>` : ""}
            ${decide && ["in_revisione", "in_trattativa"].includes(o.stato) && r.stato === "aperta" ? `<div class="btns" style="margin-top:8px">${btn("Approva", "sub-decidi:approvata:" + o.id, "piccolo")}${btn("Chiedi modifica", "sub-decidi:in_trattativa:" + o.id, "chiaro piccolo")}${btn("Rifiuta", "sub-decidi:rifiutata:" + o.id, "chiaro piccolo")}</div>` : ""}</div>`;
        }).join("")}</div>${decide ? "" : `<p class="sotto" style="margin-top:8px">Le offerte le approva il titolare.</p>`}` : vuoto("Nessuna offerta ancora."))}
        ${sez("Profit Guard", profitHtml(pg))}
        ${sez("Inviti", `${inviti.length ? `<div class="sub-lista">${inviti.map((i) => { const sm = STATO_MAIL[i.stato_mail]; return `<div><span>${esc(i.ditta || i.email)}<small>${esc(i.email)} · ${i.origine === "rete" ? "rete" : "zona"}${i.aperto_il ? " · ha aperto il link" : ""}${i.mail_errore ? " · " + esc(i.mail_errore) : ""}</small></span><span>${stato(sm[1], sm[0])}${r.stato === "aperta" && ["da_inviare", "errore"].includes(i.stato_mail) ? btn("Rimanda", "sub-reinvia:" + i.id, "chiaro piccolo") : ""}</span></div>`; }).join("")}</div>` : vuoto("Nessun invito.")}
          ${r.stato === "aperta" ? `<div style="height:12px"></div><form data-form="sub-invita" data-id="${esc(id)}" novalidate>${destinatariHtml(rete.filter((o) => !inviti.some((i) => i.email === String(o.email).toLowerCase())), zona.filter((z) => !inviti.some((i) => i.email === z.email)))}<button class="btn chiaro" type="submit">Manda le mail</button></form>` : ""}`)}
        ${r.stato === "aperta" ? `<div style="height:6px"></div>${btn("Annulla la richiesta", "sub-annulla:" + id, "chiaro")}` : ""}
        <div style="height:10px"></div>${btn("Torna al dossier", "go:so-dossier/" + r.sopralluogo, "chiaro")}
      </div>`,
    };
  };
  FORM["sub-invita"] = async (f) => {
    const d = leggiDestinatari(f);
    if (!d.length) return toast("Scegli o scrivi almeno un fornitore.", "errore");
    const r = await mandaInviti(f.dataset.id, d);
    await render(); mostraProva(r);
  };
  AZIONI["sub-reinvia:"] = async (id) => { try { await SB.reinvia(id); toast("Mail rimandata."); render(); } catch (e) { toast(errore(e), "errore"); } };
  AZIONI["sub-annulla:"] = async (id) => {
    foglio(`<h2>Annullare la richiesta?</h2><p class="sotto">Le offerte non ancora decise diventano «non scelte».</p>${btn("Sì, annulla", "sub-annulla-ok:" + id)}<div style="height:8px"></div>${btn("No", "sub-chiudi", "chiaro")}`);
  };
  AZIONI["sub-annulla-ok:"] = async (id) => { chiudiFoglio(); try { await SB.annulla(id); toast("Richiesta annullata."); render(); } catch (e) { toast(errore(e), "errore"); } };
  AZIONI["sub-decidi:"] = async (arg) => {
    const [dec, id] = arg.split(":");
    const titoli = { approvata: "Approvare questa offerta?", in_trattativa: "Chiedere una modifica?", rifiutata: "Rifiutare questa offerta?" };
    const testi = { approvata: "Il costo entra nel Profit Guard, le altre offerte diventano «non scelte» e il fornitore riceve la mail con i pagamenti concordati.", in_trattativa: "Il fornitore riceve la tua nota per mail e può rimandare l'offerta dallo stesso link.", rifiutata: "Il fornitore riceve una mail di cortesia." };
    foglio(`<h2>${titoli[dec]}</h2><p class="sotto">${testi[dec]}</p><label class="campo"><span>${dec === "in_trattativa" ? "Cosa chiedi di cambiare" : "Nota (facoltativa)"}</span><textarea id="sub-nota" maxlength="1000"></textarea></label><div style="height:10px"></div>${btn(dec === "approvata" ? I.ok + " Approva" : dec === "in_trattativa" ? "Manda la richiesta" : "Rifiuta", "sub-decidi-ok:" + dec + ":" + id)}<div style="height:8px"></div>${btn("Annulla", "sub-chiudi", "chiaro")}`);
  };
  AZIONI["sub-decidi-ok:"] = async (arg) => {
    const [dec, id] = arg.split(":");
    const nota = (document.getElementById("sub-nota") || {}).value || "";
    try {
      const r = await SB.decidi(id, dec, nota);
      chiudiFoglio();
      toast((dec === "approvata" ? "Approvata. Margine: " + euro0(r.pg.mon) : "Fatto.") + (r.mail && r.mail.error ? " · " + (ERRORI[r.mail.error] || "mail non partita") : " · mail al fornitore inviata."), r.mail && r.mail.error ? "errore" : "");
      render();
    } catch (e) { toast(errore(e), "errore"); }
  };

  /* ====================================================================== */
  /* AMMINISTRAZIONE: offerte da decidere, soglia del Profit Guard           */
  /* ====================================================================== */
  V["ad-offerte"] = async () => {
    const tutte = await SB.daRivedere();
    const ric = {}; for (const o of tutte) if (!ric[o.richiesta]) ric[o.richiesta] = await SB.richiesta(o.richiesta);
    const mie = tutte.filter((o) => ric[o.richiesta] && amministro(ric[o.richiesta].org));
    const soglia = await SB.soglia();
    return {
      t: "Offerte dei fornitori",
      h: `<div class="pad">
        <p class="sotto">Offerte da decidere. Approvare chiude il costo del subappalto nel Profit Guard della commessa.</p>
        ${mie.length ? lista(mie.map((o) => { const r = ric[o.richiesta]; const so = STATO_OFF[o.stato]; return voce("euro", `${esc(o.ditta)} · ${euro(o.importo)}`, `${esc(r.titolo)}${r.comune ? " · " + esc(r.comune) : ""}${o.accetta_pagamenti ? "" : " · pagamenti diversi"}`, "sub-vedi/" + r.id, "arancio", stato(so[1], so[0])); })) : vuoto("Nessuna offerta da decidere.")}
        ${S.admin ? sez("Soglia minima di margine", `<form data-form="sub-soglia" novalidate>${campo("Margine minimo (%)", `<input name="soglia" type="number" inputmode="decimal" min="-100" max="100" step="0.1" value="${esc(soglia ?? "")}">`, "Sotto questa soglia il preventivo ufficiale si approva solo con una nota. Vuoto = da decidere.")}<button class="btn chiaro" type="submit">Salva la soglia</button></form>`) : ""}
      </div>`,
    };
  };
  FORM["sub-soglia"] = async (f) => { try { await SB.salvaSoglia(f.soglia.value === "" ? null : num(f.soglia.value)); toast("Soglia salvata."); render(); } catch (e) { toast(errore(e), "errore"); } };

  /* ====================================================================== */
  /* AGENTE: fornitori della zona (nella schermata Flash)                    */
  /* ====================================================================== */
  const flashVecchio = V["so-flash"];
  if (flashVecchio) V["so-flash"] = async (id) => {
    const out = await flashVecchio(id);
    try {
      const s = await FL.sopralluogo(id);
      if (!s || !out.h.includes("<!--sub-agente-->") || ["annullato"].includes(s.stato)) return out;
      const [prop, ric] = await Promise.all([SB.fornitoriProposti(id).catch(() => []), SB.richieste(id).catch(() => [])]);
      const aperte = ric.filter((r) => r.stato === "aperta");
      const blocco = sez("6. Fornitori della zona", `<p class="sotto">Conosci ditte serie qui vicino, non ancora iscritte? Proponile: l'ufficio le invita per mail ai lavori.</p>
        ${prop.length ? `<div class="sub-lista">${prop.map((p) => `<div><span>${esc(p.ditta)}${p.mestiere ? " · " + esc(p.mestiere) : ""}<small>${esc(p.email)}${p.telefono ? " · " + esc(p.telefono) : ""}</small></span><span>${aperte.map((r) => btn("Invita a «" + esc(r.titolo.slice(0, 24)) + "»", "sub-ag-invita:" + r.id + ":" + p.id, "chiaro piccolo")).join("")}${p.proposto_da === io() ? btn("Togli", "sub-ag-via:" + p.id, "chiaro piccolo") : ""}</span></div>`).join("")}</div><div style="height:10px"></div>` : ""}
        <form data-form="sub-proponi" data-id="${esc(id)}" data-org="${esc(s.org)}" data-comune="${esc(s.comune || "")}" novalidate class="card">
          <div class="griglia2">${campo("Ditta", `<input name="ditta" maxlength="120">`)}${campo("Mestiere", `<input name="mestiere" maxlength="60" placeholder="es. elettricista">`)}</div>
          <div class="griglia2">${campo("Mail di lavoro", `<input name="email" type="email" maxlength="120">`)}${campo("Telefono", `<input name="telefono" type="tel" maxlength="30">`)}</div>
          ${campo("Referente", `<input name="nome" maxlength="80">`)}
          <p class="sotto" style="font-size:12.5px">Solo contatti di lavoro della ditta (sito, insegna, biglietto). Ogni mail dice chi siamo e permette di non riceverne più.</p>
          <button class="btn chiaro" type="submit">Proponi il fornitore</button></form>`);
      out.h = out.h.replace("<!--sub-agente-->", blocco);
    } catch (e) { console.warn("subappalti agente", e); }
    return out;
  };
  FORM["sub-proponi"] = async (f) => {
    const email = f.email.value.trim().toLowerCase();
    if (f.ditta.value.trim().length < 2) return toast("Scrivi il nome della ditta.", "errore");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast("Mail non valida.", "errore");
    try { await SB.proponi({ org: f.dataset.org, sopralluogo: f.dataset.id, ditta: f.ditta.value.trim(), mestiere: f.mestiere.value.trim(), email, telefono: f.telefono.value.trim(), nome: f.nome.value.trim(), comune: f.dataset.comune }); toast("Fornitore proposto all'ufficio."); render(); }
    catch (e) { toast(/duplicate|unique|23505/i.test(String(e.message || e)) ? "Questo fornitore è già stato proposto." : /row-level|policy/i.test(String(e.message || e)) ? "Questo indirizzo ha chiesto di non ricevere mail." : errore(e), "errore"); }
  };
  AZIONI["sub-ag-via:"] = async (id) => { try { await SB.togliProposto(id); render(); } catch (e) { toast(errore(e), "errore"); } };
  AZIONI["sub-ag-invita:"] = async (arg) => {
    const [ric, pid] = arg.split(":");
    const p = (await core.Q.sel("app_fornitori_zona", { eq: { id: pid } }))[0];
    if (!p) return;
    const r = await mandaInviti(ric, [{ email: p.email, ditta: p.ditta, nome: p.nome, telefono: p.telefono, origine: "territorio" }]);
    mostraProva(r);
  };

  /* ====================================================================== */
  /* FORNITORE: pagina dal link nella mail (senza password)                  */
  /* ====================================================================== */
  const testa = (titolo, sotto, ditta) => `<header class="st-testa"><img src="img/logo-colore.png" alt="AncheCasa">${ditta ? `<p style="margin:10px 0 0;font-weight:700;color:var(--blu)">per ${esc(ditta)}</p>` : ""}<h1>${titolo}</h1><p>${sotto}</p></header>`;
  const piede = `<p class="st-piede">AncheCasa · Costruiamo fiducia · <a href="https://www.anchecasa.it" target="_blank" rel="noopener" style="text-decoration:underline">anchecasa.it</a></p>`;
  V.offerta = async (tok) => {
    document.title = "Richiesta di offerta · AncheCasa";
    let d = null;
    if (/^[0-9a-f-]{36}$/i.test(tok || "")) { try { d = await SB.invitoLeggi(tok); } catch (e) { console.error(e); } }
    if (!d || !d.trovato) return { pieno: true, h: `<div class="st">${testa("Link non valido", "Il link non è corretto o la richiesta non c'è più.")}${piede}</div>` };
    const o = d.offerta;
    const modificabile = d.aperta && (!o || ["in_revisione", "in_trattativa"].includes(o.stato));
    const so = o ? STATO_OFF[o.stato] : null;
    const esitoHtml = o ? `<section class="st-card"><h2>La tua offerta</h2><p style="margin:0"><b>${euro(o.importo)}</b>${o.tempi_giorni ? " · " + esc(o.tempi_giorni) + " giorni" : ""} ${stato(so[1], o.stato === "rifiutata" ? "Non scelta" : so[0])}</p>
        ${o.nota_admin ? `<p class="sotto" style="margin:8px 0 0">Nota della ditta: ${esc(o.nota_admin)}</p>` : ""}
        ${o.stato === "approvata" && Array.isArray(o.piano_pagamenti) ? `<p style="margin:10px 0 6px"><b>Pagamenti concordati</b></p>${elencoPagamenti(o.piano_pagamenti.map((x) => ({ descrizione: x.descrizione, evento: x.evento, tipo: x.tipo, valore: x.valore })), Number(o.importo))}` : ""}</section>` : "";
    return {
      pieno: true,
      h: `<div class="st">${testa(esc(d.titolo), `${d.mestiere ? esc(d.mestiere) + " · " : ""}${d.comune ? esc(d.comune) + " · " : ""}offerte entro il ${data(d.scadenza)}`, d.ditta)}
        <div class="st-corpo">
          ${d.bloccato ? `<section class="st-card">${avviso("Hai chiesto di non ricevere più mail: non ti scriveremo più. Puoi comunque rispondere a questa richiesta.", "")}</section>` : ""}
          ${esitoHtml}
          ${d.descrizione ? `<section class="st-card"><h2>Capitolato</h2><p style="margin:0;white-space:pre-line">${esc(d.descrizione)}</p></section>` : ""}
          ${(d.voci || []).length ? `<section class="st-card"><h2>Lavorazioni</h2><div class="sub-lista">${d.voci.map((v) => `<div><span>${esc(v.descrizione)}${v.stanza ? `<small>${esc(v.stanza)}</small>` : ""}</span><span>${esc(String(v.quantita ?? "").replace(".", ","))} ${esc(v.um || "")}</span></div>`).join("")}</div></section>` : ""}
          <section class="st-card"><h2>Come paga ${esc(d.ditta || "la ditta")}</h2>${elencoPagamenti(d.pagamenti)}<p class="sotto" style="margin:8px 0 0">Le quote in euro si calcolano sull'importo che offri.</p></section>
          ${modificabile ? `<section class="st-card"><h2>${o ? "Rivedi la tua offerta" : "La tua offerta"}</h2><form data-form="offerta" data-tok="${esc(tok)}" novalidate>
            <div class="griglia2">${campo("Ditta", `<input name="ditta" maxlength="120" value="${esc((o && o.ditta) || (d.invitato && d.invitato.ditta) || "")}">`)}${campo("Partita IVA", `<input name="piva" inputmode="numeric" maxlength="20">`)}</div>
            <div class="griglia2">${campo("Importo offerto (€, IVA esclusa)", `<input name="importo" type="number" inputmode="decimal" min="1" step="0.01" value="${esc(o ? o.importo : "")}">`)}${campo("Giorni di lavoro", `<input name="tempi" type="number" min="1" max="1000" value="${esc(o && o.tempi_giorni ? o.tempi_giorni : "")}">`)}</div>
            ${campo("Note", `<textarea name="note" maxlength="2000">${esc(o ? o.note : "")}</textarea>`)}
            <div class="sub-scelta"><label><input type="radio" name="accetto" value="si" ${!o || o.accetta_pagamenti ? "checked" : ""}><span>Accetto i pagamenti della ditta</span></label><label><input type="radio" name="accetto" value="no" ${o && !o.accetta_pagamenti ? "checked" : ""}><span>Propongo pagamenti diversi</span></label></div>
            <div data-contro style="margin-top:10px;${o && !o.accetta_pagamenti ? "" : "display:none"}">${editorPagamenti("contro", o && !o.accetta_pagamenti ? o.controproposta : d.pagamenti, o ? o.importo : "")}</div>
            <div style="height:12px"></div><button class="btn" type="submit">${o ? "Rimanda l'offerta" : "Manda l'offerta"}</button></form></section>`
            : !d.aperta && !o ? `<section class="st-card">${avviso("La richiesta è chiusa: non si accettano più offerte.", "")}</section>` : ""}
          <section class="st-card"><h2>Non sei ancora su AncheCasa?</h2><p class="sotto">Iscriviti gratis: ricevi lavori veri nella tua zona e prepari preventivi con il tuo logo.</p><a class="btn chiaro" href="#/registrati/fornitore">Iscriviti in 30 secondi</a></section>
        </div>${piede}</div>`,
      dopo: (el) => {
        attivaPagamenti(el);
        const f = el.querySelector('form[data-form="offerta"]');
        if (!f) return;
        const box = f.querySelector("[data-contro]"), pag = f.querySelector('[data-pag="contro"]');
        f.addEventListener("change", (e) => { if (e.target.name === "accetto") box.style.display = e.target.value === "no" ? "" : "none"; });
        f.importo.addEventListener("input", () => { pag.dataset.totale = num(f.importo.value) || ""; pag.dispatchEvent(new Event("input", { bubbles: true })); });
      },
    };
  };
  FORM.offerta = async (f) => {
    const importo = num(f.importo.value);
    if (!(importo > 0)) return toast(ERRORI.importo_non_valido, "errore");
    if (f.ditta.value.trim().length < 2) return toast(ERRORI.manca_la_ditta, "errore");
    const accetto = f.querySelector('input[name="accetto"]:checked').value === "si";
    const contro = accetto ? null : leggiPagamenti(f, "contro");
    if (!accetto) { const e = errorePagamenti(contro); if (e) return toast(ERRORI_PAG[e], "errore"); try { quote(contro, importo); } catch (er) { return toast(ERRORI_PAG[er.message] || er.message, "errore"); } }
    try { await SB.invitoOfferta(f.dataset.tok, { importo, tempi: num(f.tempi.value), note: f.note.value.trim(), ditta: f.ditta.value.trim(), piva: f.piva.value.trim(), accetto, controproposta: contro }); toast("Offerta mandata: la ditta la valuta e ti risponde per mail."); render(); }
    catch (e) { toast(errore(e), "errore"); }
  };
  V["offerta-stop"] = async (tok) => ({
    pieno: true,
    h: `<div class="st">${testa("Non vuoi più ricevere richieste?", "Confermi e non ti scriveremo più per nuovi lavori.")}<div class="st-corpo"><section class="st-card">${btn("Sì, non scrivetemi più", "offerta-stop-ok:" + tok)}</section></div>${piede}</div>`,
  });
  AZIONI["offerta-stop-ok:"] = async (tok) => {
    let ok = false; try { ok = await SB.invitoStop(tok); } catch (e) { ok = false; }
    document.getElementById("schermo").innerHTML = `<div class="st">${testa(ok ? "Fatto" : "Link non valido", ok ? "Non riceverai più mail da AncheCasa per nuove richieste." : "Il link non è corretto.")}${piede}</div>`;
  };
}
