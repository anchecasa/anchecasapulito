/* Magazzino e mezzi collegati al cantiere (parte 13, 11.10.2026).
   - Scheda articolo: dove si trova (deposito e cantieri), costo medio, arrivo merce, porta in cantiere,
     riporta dal cantiere, sposta tra cantieri, inventario, ultimi movimenti.
   - Scheda mezzo: dove si trova oggi, manda in cantiere, chiudi l'uso con ore, km e carburante.
   - Scheda cantiere: costi reali (materiali, mezzi, subappalti) contro budget e fatturato.
   Le regole (giacenza che non va sotto zero, mezzo non in due cantieri, chi può fare cosa) le applica il database. */
import { I, esc, lista, sez, stato, btn, campo, vuoto, avviso, toast, foglio, chiudiFoglio, spiegaErrore } from "./ui.js";
import { MAG } from "./mag-api.js";

const ERRORI = {
  giacenza_insufficiente: "In deposito non ce n'è abbastanza: registra prima l'arrivo della merce o fai l'inventario.",
  quantita_oltre_il_cantiere: "In quel cantiere non ce n'è così tanto.",
  mezzo_gia_impegnato: "In quei giorni il mezzo è già in un altro cantiere.",
  articolo_non_valido: "Articolo non trovato.",
  mezzo_non_valido: "Mezzo non trovato.",
  cantiere_non_valido: "Scegli un cantiere della tua ditta.",
  date_non_valide: "La data di fine viene prima di quella di inizio.",
  non_autorizzato: "Non hai i permessi per farlo.",
};
const errore = (e) => {
  const m = String((e && e.message) || e);
  if (/row-level security|violates row-level/i.test(m)) return "Non hai i permessi per farlo (serve il modulo Magazzino attivo).";
  return ERRORI[m] || spiegaErrore(e);
};
const euro = (v) => (v == null ? "–" : Number(v).toLocaleString("it-IT", { style: "currency", currency: "EUR" }));
const num = (v) => (v == null || v === "" ? null : Number(String(v).replace(",", ".")));
const qta = (v) => String(Math.round(Number(v || 0) * 1000) / 1000).replace(".", ",");
const data = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");
const oggi = () => new Date().toISOString().slice(0, 10);
const NOMI_MOV = { carico: "Arrivo merce", scarico: "Portato in cantiere", reso: "Riportato in deposito", trasferimento: "Spostato tra cantieri", rettifica: "Inventario" };

export function installa(core) {
  const { S, HOOK, AZIONI, FORM, render } = core;
  const ruolo = (org) => (((S.miei && S.miei.org) || []).find((o) => o.id === org) || {}).ruolo;
  const gestisco = (org) => !!S.admin || ["titolare", "responsabile"].includes(ruolo(org));
  const nomeCantiere = (lista, id) => (lista.find((c) => c.id === id) || {}).titolo || "Cantiere";
  const sceltaCantiere = (cant, nome, val) => `<select name="${nome}"><option value="">Scegli il cantiere</option>${cant.filter((c) => c.stato !== "chiuso").map((c) => `<option value="${esc(c.id)}" ${c.id === val ? "selected" : ""}>${esc(c.titolo)}${c.dati && c.dati.codice ? " · " + esc(c.dati.codice) : ""}</option>`).join("")}</select>`;

  /* ====================================================================== */
  /* Scheda articolo                                                         */
  /* ====================================================================== */
  const artVecchio = HOOK.scheda.articolo;
  HOOK.scheda.articolo = async (r, figli) => {
    let h = "";
    try {
      const [pos, mov, cant] = await Promise.all([MAG.posizioni(r.id), MAG.movimenti(r.id), MAG.cantieri(r.org).catch(() => [])]);
      const u = esc(r.dati.unita || "");
      const sotto = Number(r.dati.giacenza) < Number(r.dati.minimo);
      h += sez("Dove si trova", `<div class="card"><dl class="campi">
          <dt>In deposito</dt><dd><b>${qta(r.dati.giacenza)} ${u}</b> ${sotto ? stato("rosso", "sotto la scorta minima") : ""}</dd>
          ${pos.map((p) => `<dt>${esc(nomeCantiere(cant, p.cantiere))}</dt><dd>${qta(p.quantita)} ${u}</dd>`).join("")}
          <dt>Costo medio</dt><dd>${r.dati.costo_medio != null ? euro(r.dati.costo_medio) + (u ? " per " + u.replace(/i$/, "o") : "") : "Non ancora: registra un arrivo con il prezzo"}</dd>
        </dl></div>
        ${gestisco(r.org) ? `<div style="height:10px"></div><div class="griglia2">${btn(I.piu + " Arrivo merce", "mag-mov:carico:" + r.id, "chiaro")}${btn(I.gru + " Porta in cantiere", "mag-mov:scarico:" + r.id, "chiaro")}${btn("Riporta in deposito", "mag-mov:reso:" + r.id, "chiaro")}${btn("Sposta tra cantieri", "mag-mov:trasferimento:" + r.id, "chiaro")}</div><div style="height:8px"></div>${btn("Inventario: ho contato", "mag-mov:rettifica:" + r.id, "chiaro")}` : ""}`);
      h += sez("Ultimi movimenti", mov.length ? `<div class="card"><dl class="campi">${mov.slice(0, 10).map((m) => `<dt>${data(m.data)}</dt><dd>${esc(NOMI_MOV[m.tipo])}: ${m.tipo === "rettifica" && m.quantita > 0 ? "+" : ""}${qta(m.quantita)} ${u}${m.a_cantiere ? " → " + esc(nomeCantiere(cant, m.a_cantiere)) : ""}${m.da_cantiere ? " (da " + esc(nomeCantiere(cant, m.da_cantiere)) + ")" : ""}${m.costo_unitario != null && m.tipo === "carico" ? " · " + euro(m.costo_unitario) : ""}${m.note ? " · " + esc(m.note) : ""}</dd>`).join("")}</dl></div>` : vuoto("Nessun movimento ancora."));
    } catch (e) { console.warn("magazzino", e); }
    return h + (artVecchio ? await artVecchio(r, figli) : "");
  };

  AZIONI["mag-mov:"] = async (arg) => {
    const [tipo, id] = arg.split(":");
    const r = await core.Q.uno("app_record", { id });
    if (!r) return;
    const cant = await MAG.cantieri(r.org).catch(() => []);
    const pos = await MAG.posizioni(id);
    const conMerce = cant.filter((c) => pos.some((p) => p.cantiere === c.id));
    const u = esc(r.dati.unita || "");
    const titoli = { carico: "Arrivo merce", scarico: "Porta in cantiere", reso: "Riporta in deposito", trasferimento: "Sposta tra cantieri", rettifica: "Inventario" };
    let corpo = "";
    if (tipo === "carico") corpo = `${campo("Quantità arrivata" + (u ? " (" + u + ")" : ""), `<input name="quantita" type="number" inputmode="decimal" min="0" step="0.001">`)}
      ${campo("Prezzo per unità (€, IVA esclusa)", `<input name="costo" type="number" inputmode="decimal" min="0" step="0.0001">`, "Serve per il costo dei cantieri. Se non lo sai, lascia vuoto.")}`;
    else if (tipo === "scarico") corpo = `${campo("Cantiere", sceltaCantiere(cant, "a"))}${campo("Quantità" + (u ? " (" + u + ")" : ""), `<input name="quantita" type="number" inputmode="decimal" min="0" step="0.001">`, `In deposito: ${qta(r.dati.giacenza)} ${u}`)}`;
    else if (tipo === "reso") corpo = conMerce.length ? `${campo("Da quale cantiere", sceltaCantiere(conMerce, "da"))}${campo("Quantità" + (u ? " (" + u + ")" : ""), `<input name="quantita" type="number" inputmode="decimal" min="0" step="0.001">`)}` : "";
    else if (tipo === "trasferimento") corpo = conMerce.length ? `${campo("Da", sceltaCantiere(conMerce, "da"))}${campo("A", sceltaCantiere(cant, "a"))}${campo("Quantità" + (u ? " (" + u + ")" : ""), `<input name="quantita" type="number" inputmode="decimal" min="0" step="0.001">`)}` : "";
    else corpo = `${campo("Quanti ne hai contati in deposito" + (u ? " (" + u + ")" : ""), `<input name="contati" type="number" inputmode="decimal" min="0" step="0.001">`, `Oggi risultano ${qta(r.dati.giacenza)} ${u}: registro la differenza.`)}`;
    if (!corpo) return toast("Questo articolo non è in nessun cantiere.", "errore");
    foglio(`<h2>${titoli[tipo]}</h2><p class="sotto">${esc(r.titolo)}</p><form data-form="mag-mov" data-tipo="${tipo}" data-id="${esc(id)}" data-giac="${esc(r.dati.giacenza ?? 0)}" novalidate>
      ${corpo}${campo("Data", `<input name="data" type="date" value="${oggi()}" max="${oggi()}">`)}${campo("Nota", `<input name="note" maxlength="300" placeholder="es. DDT 123, sacchi rotti">`)}
      <button class="btn" type="submit">Salva</button></form><div style="height:8px"></div>${btn("Annulla", "mag-chiudi", "chiaro")}`);
  };
  AZIONI["mag-chiudi"] = () => chiudiFoglio();
  FORM["mag-mov"] = async (f) => {
    const tipo = f.dataset.tipo;
    const m = { articolo: f.dataset.id, tipo, data: f.data.value || oggi(), note: f.note.value.trim() };
    if (tipo === "rettifica") {
      const contati = num(f.contati.value);
      if (contati == null || contati < 0) return toast("Scrivi quanti ne hai contati.", "errore");
      m.quantita = Math.round((contati - Number(f.dataset.giac || 0)) * 1000) / 1000;
      if (!m.quantita) { chiudiFoglio(); return toast("Il conteggio torna: niente da correggere."); }
      if (!m.note) m.note = "Inventario";
    } else {
      m.quantita = num(f.quantita.value);
      if (!(m.quantita > 0)) return toast("Scrivi una quantità.", "errore");
      if (f.a) { m.a_cantiere = f.a.value; if (!m.a_cantiere) return toast("Scegli il cantiere.", "errore"); }
      if (f.da) { m.da_cantiere = f.da.value; if (!m.da_cantiere) return toast("Scegli da quale cantiere.", "errore"); }
      if (m.a_cantiere && m.a_cantiere === m.da_cantiere) return toast("Scegli due cantieri diversi.", "errore");
      if (f.costo && f.costo.value !== "") m.costo_unitario = num(f.costo.value);
    }
    try { await MAG.muovi(m); chiudiFoglio(); toast("Salvato."); render(); } catch (e) { toast(errore(e), "errore"); }
  };

  /* ====================================================================== */
  /* Scheda mezzo                                                            */
  /* ====================================================================== */
  const mezzoVecchio = HOOK.scheda.mezzo;
  HOOK.scheda.mezzo = async (r, figli) => {
    let h = "";
    try {
      const [usi, cant] = await Promise.all([MAG.usi(r.id), MAG.cantieri(r.org).catch(() => [])]);
      const ora = usi.find((u) => u.dal <= oggi() && (!u.al || u.al >= oggi()));
      const prossimi = usi.filter((u) => u.dal > oggi());
      h += sez("Dove si trova", `<div class="card">${ora ? `<b>In cantiere: ${esc(nomeCantiere(cant, ora.cantiere))}</b><br><small class="sotto">dal ${data(ora.dal)}${ora.al ? " al " + data(ora.al) : ""}</small>` : "<b>In deposito</b>"}
          ${prossimi.length ? `<p class="sotto" style="margin:8px 0 0">Prenotato: ${prossimi.map((u) => esc(nomeCantiere(cant, u.cantiere)) + " dal " + data(u.dal)).join(", ")}</p>` : ""}
          ${r.dati.costo_giorno ? `<p class="sotto" style="margin:8px 0 0">Costo al giorno: ${euro(r.dati.costo_giorno)}</p>` : `<p class="sotto" style="margin:8px 0 0">Scrivi il costo al giorno (Modifica) per avere i costi dei cantieri.</p>`}</div>
        ${gestisco(r.org) ? `<div style="height:10px"></div>${btn(I.gru + " Manda in un cantiere", "mag-uso:" + r.id, "chiaro")}` : ""}`);
      h += sez("Cantieri dove è stato", usi.length ? `<div class="card"><dl class="campi">${usi.slice(0, 10).map((u) => `<dt>${data(u.dal)}${u.al ? " → " + data(u.al) : ""}</dt><dd>${esc(nomeCantiere(cant, u.cantiere))}${u.ore != null ? " · " + qta(u.ore) + " ore" : ""}${u.km != null ? " · " + qta(u.km) + " km" : ""}${u.carburante_euro != null ? " · carburante " + euro(u.carburante_euro) : ""}${gestisco(r.org) && (!u.al || u.ore == null) ? ` <button type="button" class="link" data-az="mag-chiudi-uso:${esc(u.id)}">${u.al ? "Completa" : "Chiudi"}</button>` : ""}</dd>`).join("")}</dl></div>` : vuoto("Non è ancora stato in un cantiere."));
    } catch (e) { console.warn("mezzi", e); }
    return h + (mezzoVecchio ? await mezzoVecchio(r, figli) : "");
  };
  AZIONI["mag-uso:"] = async (id) => {
    const r = await core.Q.uno("app_record", { id });
    const cant = await MAG.cantieri(r.org).catch(() => []);
    foglio(`<h2>Manda in un cantiere</h2><p class="sotto">${esc(r.titolo)}</p><form data-form="mag-uso" data-id="${esc(id)}" novalidate>
      ${campo("Cantiere", sceltaCantiere(cant, "cantiere"))}
      <div class="griglia2">${campo("Dal", `<input name="dal" type="date" value="${oggi()}">`)}${campo("Al (se lo sai)", `<input name="al" type="date">`)}</div>
      ${campo("Costo al giorno (€)", `<input name="costo_giorno" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(r.dati.costo_giorno ?? "")}">`, "Se vuoto, vale quello della scheda del mezzo.")}
      <button class="btn" type="submit">Salva</button></form><div style="height:8px"></div>${btn("Annulla", "mag-chiudi", "chiaro")}`);
  };
  FORM["mag-uso"] = async (f) => {
    if (!f.cantiere.value) return toast("Scegli il cantiere.", "errore");
    if (!f.dal.value) return toast("Scegli la data di inizio.", "errore");
    try { await MAG.assegna({ mezzo: f.dataset.id, cantiere: f.cantiere.value, dal: f.dal.value, al: f.al.value || null, costo_giorno: f.costo_giorno.value === "" ? null : num(f.costo_giorno.value) }); chiudiFoglio(); toast("Mezzo assegnato al cantiere."); render(); }
    catch (e) { toast(errore(e), "errore"); }
  };
  AZIONI["mag-chiudi-uso:"] = async (id) => {
    const u = await core.Q.uno("app_mezzi_uso", { id });
    if (!u) return;
    foglio(`<h2>Fine uso in cantiere</h2><form data-form="mag-chiudi-uso" data-id="${esc(id)}" novalidate>
      ${campo("Ultimo giorno in cantiere", `<input name="al" type="date" value="${esc(u.al || oggi())}" min="${esc(u.dal)}">`)}
      <div class="griglia2">${campo("Ore di lavoro", `<input name="ore" type="number" inputmode="decimal" min="0" step="0.5" value="${esc(u.ore ?? "")}">`)}${campo("Km fatti", `<input name="km" type="number" inputmode="decimal" min="0" step="1" value="${esc(u.km ?? "")}">`)}</div>
      <div class="griglia2">${campo("Litri di carburante", `<input name="litri" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(u.litri ?? "")}">`)}${campo("Spesa carburante (€)", `<input name="carburante_euro" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(u.carburante_euro ?? "")}">`)}</div>
      <button class="btn" type="submit">Salva</button></form><div style="height:8px"></div>${btn("Annulla", "mag-chiudi", "chiaro")}`);
  };
  FORM["mag-chiudi-uso"] = async (f) => {
    try { await MAG.chiudiUso(f.dataset.id, { al: f.al.value, ore: num(f.ore.value), km: num(f.km.value), litri: num(f.litri.value), carburante_euro: num(f.carburante_euro.value) }); chiudiFoglio(); toast("Salvato."); render(); }
    catch (e) { toast(errore(e), "errore"); }
  };

  /* ====================================================================== */
  /* Scheda cantiere: costi reali                                            */
  /* ====================================================================== */
  const cantVecchio = HOOK.scheda.cantiere;
  HOOK.scheda.cantiere = async (c, figli) => {
    let h = "";
    if (gestisco(c.org)) {
      try {
        const k = await MAG.costi(c.id);
        const perc = k.uso_budget_perc;
        const colore = perc == null ? "blu" : perc > 100 ? "rosso" : perc > 85 ? "giallo" : "verde";
        h = sez("Costi reali del cantiere", `<div class="card"><dl class="campi">
            <dt>Budget</dt><dd><b>${euro(k.budget)}</b></dd>
            <dt>Materiali</dt><dd>${euro(k.costi.materiali)}</dd>
            <dt>Mezzi</dt><dd>${euro(k.costi.mezzi)}</dd>
            <dt>Subappalti approvati</dt><dd>${euro(k.costi.subappalti)}</dd>
            <dt>Costi finora</dt><dd><b>${euro(k.costi.totale)}</b> ${perc != null ? stato(colore, String(perc).replace(".", ",") + "% del budget") : ""}</dd>
            ${k.resta_del_budget != null ? `<dt>Resta del budget</dt><dd>${euro(k.resta_del_budget)}</dd>` : ""}
            <dt>Fatturato</dt><dd>${euro(k.fatturato)}</dd></dl></div>
          ${(k.materiali || []).length ? `<div style="height:8px"></div><div class="card"><b>Materiali in cantiere</b><dl class="campi">${k.materiali.map((m) => `<dt>${esc(m.articolo)}</dt><dd>${qta(m.quantita)} ${esc(m.unita)} · ${euro(m.costo)}</dd>`).join("")}</dl></div>` : ""}
          ${(k.mezzi || []).length ? `<div style="height:8px"></div><div class="card"><b>Mezzi</b><dl class="campi">${k.mezzi.map((m) => `<dt>${esc(m.mezzo)}</dt><dd>${data(m.dal)}${m.al ? " → " + data(m.al) : " → oggi"} · ${euro(m.costo)}</dd>`).join("")}</dl></div>` : ""}
          ${(k.avvisi || []).length ? `<div style="height:8px"></div>${avviso(k.avvisi.map(esc).join("<br>"), "")}` : ""}`) + '<div style="height:4px"></div>';
      } catch (e) { /* modulo non attivo o permessi: niente blocco */ }
    }
    return (cantVecchio ? await cantVecchio(c, figli) : "") + h;
  };
}
