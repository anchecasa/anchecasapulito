/* Sicurezza del cantiere (D.Lgs. 81/08): fascicolo elettronico, semaforo di imprese e lavoratori,
   documenti (DURC, POS, idoneità tecnico-professionale…), scadenziario comune (parte 10, 11.10.2026). */
import { I, esc, voce, lista, sez, stato, num, btn, campo, vuoto, avviso, toast, foglio, chiudiFoglio, spiegaErrore } from "./ui.js";
import { SIC, NOMI_DOC, NOMI_TIPO } from "./sic-api.js";

const COLORE = { verde: ["verde", "In regola"], giallo: ["giallo", "Da controllare"], rosso: ["rosso", "Non può entrare"] };
const VERIFICA = { da_verificare: ["giallo", "Da verificare"], valido: ["verde", "Valido"], respinto: ["rosso", "Respinto"] };
const data = (d) => (d ? new Date(String(d).slice(0, 10) + "T12:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");
const giorniA = (d) => Math.round((new Date(d + "T12:00:00") - new Date(new Date().toISOString().slice(0, 10) + "T12:00:00")) / 864e5);
const ERR = {
  non_autorizzato: "Non hai i permessi per farlo.", cantiere_non_valido: "Cantiere non trovato.", dipendente_non_valido: "Il dipendente scelto non è di questa impresa.",
  soggetto_non_valido: "Persona o impresa non trovata in questo cantiere.",
};
const errore = (e) => ERR[String((e && e.message) || e)] || spiegaErrore(e);

export function installa(core) {
  const { S, V, AZIONI, FORM, HOOK, vai, render } = core;
  const gestisco = (org) => (core.gestisco ? core.gestisco(org) : true);
  const semStato = (s) => { const c = COLORE[(s && s.colore) || "rosso"]; return stato(c[0], c[1]); };

  /* ---- collegamenti dalle viste esistenti ---- */
  const modVecchio = V.mod;
  V.mod = async (id) => {
    const out = await modVecchio(id);
    if ((id === "sicantiere" || id === "sicurezza") && out && out.h) {
      const tile = (ico, t, s, go) => `<div class="tile" data-go="${esc(go)}" role="button" tabindex="0"><span class="ico arancio">${I[ico]}</span><b>${t}</b><small>${s}</small></div>`;
      out.h = out.h.replace('<div class="pad">', `<div class="pad"><div class="griglia2">${tile("casco", "Fascicolo di cantiere", "DURC, POS, idoneità, chi può entrare", "sic")}${tile("calendario", "Scadenze", "Tutto quello che scade, in ordine", "sic-scadenze")}</div><div style="height:12px"></div>`);
    }
    return out;
  };
  const cantVecchio = HOOK.scheda.cantiere;
  HOOK.scheda.cantiere = async (c, figli) => {
    let riga = "";
    try {
      const f = await SIC.fascicolo(c.id);
      const rossi = f.soggetti.filter((s) => s.semaforo && s.semaforo.colore === "rosso").length;
      const gialli = f.soggetti.filter((s) => s.semaforo && s.semaforo.colore === "giallo").length;
      riga = `${lista([voce("casco", "Fascicolo di sicurezza", f.soggetti.length ? `${f.soggetti.length} tra imprese e lavoratori${rossi ? " · " + rossi + " non in regola" : gialli ? " · " + gialli + " da controllare" : " · tutto in regola"}` : "Aggiungi chi lavora in cantiere", "sic-cantiere/" + c.id, rossi || f.mancano_cantiere.length ? "rosso" : gialli ? "giallo" : "verde")])}<div style="height:12px"></div>`;
    } catch (e) { /* modulo non attivo o permessi: niente riga */ }
    return riga + (cantVecchio ? await cantVecchio(c, figli) : "");
  };

  /* ---- elenco cantieri con semaforo ---- */
  V.sic = async () => {
    await SIC.semina();
    const org = S.org;
    const [cant, sub] = await Promise.all([org && gestisco(org) ? SIC.cantieri(org).catch(() => []) : [], org ? SIC.doveSonoSub(org).catch(() => []) : []]);
    const rossi = cant.reduce((s, c) => s + c.rossi, 0);
    return {
      t: "Sicurezza dei cantieri",
      h: `<div class="pad">
        ${cant.length ? `<div class="griglia2">${num(cant.length, "Cantieri aperti")}${num(rossi, "Non possono entrare", rossi ? "rosso" : "verde")}</div><div style="height:14px"></div>` : ""}
        ${sez("I tuoi cantieri", cant.length ? lista(cant.map((c) => voce("gru", esc(c.titolo), `${c.soggetti} tra imprese e lavoratori`, "sic-cantiere/" + c.id, c.rossi ? "rosso" : c.gialli ? "giallo" : "verde", c.rossi ? stato("rosso", c.rossi + " non in regola") : c.gialli ? stato("giallo", c.gialli + " da controllare") : stato("verde", "In regola")))) : vuoto("Nessun cantiere aperto."))}
        ${sub.length ? sez("Dove lavori come subappaltatore", lista(sub.filter((s) => s.tipo === "subappaltatore").map((s) => voce("lotti", esc(s.nome), "Carica i tuoi documenti", "sic-soggetto/" + s.id, "blu")))) : ""}
        ${lista([voce("calendario", "Scadenze", "Documenti in scadenza e scaduti", "sic-scadenze", "giallo")])}
      </div>`,
    };
  };

  /* ---- fascicolo di un cantiere ---- */
  V["sic-cantiere"] = async (id) => {
    await SIC.semina();
    let f;
    try { f = await SIC.fascicolo(id); } catch (e) { return { t: "Fascicolo", h: `<div class="pad">${avviso(errore(e), "rosso")}</div>` }; }
    const imprese = f.soggetti.filter((s) => s.tipo !== "lavoratore" || !s.di);
    const figliDi = (sid) => f.soggetti.filter((s) => s.di === sid);
    const riga = (s, rientro) => voce(s.tipo === "lavoratore" ? "utente" : "lotti", (rientro ? "↳ " : "") + esc(s.nome), esc(NOMI_TIPO[s.tipo]) + (s.mansione ? " · " + esc(s.mansione) : "") + (s.semaforo && s.semaforo.motivi.length ? " · " + esc(s.semaforo.motivi[0]) + (s.semaforo.motivi.length > 1 ? " e altro" : "") : ""), "sic-soggetto/" + s.id, (s.semaforo || {}).colore || "rosso", semStato(s.semaforo));
    const righe = [];
    imprese.forEach((s) => { righe.push(riga(s, false)); figliDi(s.id).forEach((x) => righe.push(riga(x, true))); });
    const rossi = f.soggetti.filter((s) => (s.semaforo || {}).colore === "rosso");
    return {
      t: "Fascicolo · " + f.cantiere.titolo,
      h: `<div class="pad">
        ${rossi.length ? avviso(`<b>${rossi.length} ${rossi.length === 1 ? "persona o impresa non può" : "tra persone e imprese non possono"} entrare</b> finché non sono in regola.`, "rosso") + '<div style="height:12px"></div>' : ""}
        ${f.ditta ? sez("Documenti del cantiere", `${f.mancano_cantiere.length ? avviso("Manca: " + f.mancano_cantiere.map((d) => esc(NOMI_DOC[d] || d)).join(", ")) + '<div style="height:10px"></div>' : ""}
          ${f.documenti_cantiere.length ? lista(f.documenti_cantiere.map((d) => voce("doc", esc(NOMI_DOC[d.documento] || d.documento) + (d.titolo ? " · " + esc(d.titolo) : ""), d.scade ? "Scade il " + data(d.scade) : "Senza scadenza", "sic-doc/" + d.id, VERIFICA[d.verifica][0], stato(VERIFICA[d.verifica][0], VERIFICA[d.verifica][1])))) : ""}
          <div style="height:10px"></div>${btn(I.piu + " Carica un documento del cantiere", `go:sic-doc/nuovo:${id}:-:pos`, "chiaro")}`) : ""}
        ${sez("Chi lavora in cantiere", `${righe.length ? lista(righe) : vuoto("Nessuno ancora. Aggiungi l'impresa subappaltatrice o i lavoratori.")}
          ${f.ditta ? `<div style="height:10px"></div><div class="btns">${btn(I.piu + " Impresa o autonomo", `so-sic-nuovo:${id}:impresa`, "chiaro")}${btn(I.piu + " Lavoratore", `so-sic-nuovo:${id}:lavoratore`, "chiaro")}</div>` : ""}`)}
        <p class="sotto">Rosso: manca un documento obbligatorio, è scaduto o è stato respinto. Giallo: scade entro 15 giorni o è da verificare. All'ingresso con il codice del patentino il controllo è automatico.</p>
      </div>`,
    };
  };

  AZIONI["so-sic-nuovo:"] = async (arg) => {
    const [cantiere, cosa, di] = arg.split(":");
    const fas = await SIC.fascicolo(cantiere);
    const dip = cosa === "lavoratore" && !di ? await SIC.dipendenti(fas.cantiere.org).catch(() => []) : [];
    foglio(`<h2>${cosa === "impresa" ? "Impresa o lavoratore autonomo" : "Lavoratore"}</h2>
      <form data-form="sic-soggetto" data-cantiere="${esc(cantiere)}" data-org="${esc(fas.cantiere.org)}" data-di="${esc(di || "")}" novalidate>
      ${cosa === "impresa" ? campo("Tipo", `<select name="tipo"><option value="subappaltatore">Impresa subappaltatrice</option><option value="lavoratore_autonomo">Lavoratore autonomo</option></select>`) : `<input type="hidden" name="tipo" value="lavoratore">`}
      ${dip.length ? campo("Tra i tuoi dipendenti", `<select name="dipendente"><option value="">Un'altra persona</option>${dip.map((d) => `<option value="${esc(d.id)}">${esc(d.titolo)}</option>`).join("")}</select>`, "Corsi e visite che hai già registrato contano da soli.") : ""}
      ${campo("Nome o ragione sociale", `<input name="nome" maxlength="120">`)}
      ${cosa === "impresa" ? campo("Partita IVA", `<input name="piva" inputmode="numeric" maxlength="11">`) : ""}
      ${campo("Lavorazione o mansione", `<input name="mansione" maxlength="80" placeholder="es. Impianti elettrici">`)}
      <div class="griglia2">${campo("Dal", `<input name="dal" type="date" value="${new Date().toISOString().slice(0, 10)}">`)}${campo("Fino al", `<input name="al" type="date">`)}</div>
      <button class="btn" type="submit">Aggiungi</button></form>`);
  };
  FORM["sic-soggetto"] = async (f) => {
    const dip = f.dipendente ? f.dipendente.value : "";
    let nome = f.nome.value.trim();
    if (dip && !nome) nome = f.dipendente.selectedOptions[0].textContent;
    if (nome.length < 2) return toast("Scrivi il nome.", "errore");
    const piva = f.piva ? f.piva.value.replace(/\D/g, "") : "";
    if (piva && piva.length !== 11) return toast("La partita IVA ha 11 cifre.", "errore");
    try {
      const id = await SIC.salvaSoggetto({ org: f.dataset.org, cantiere: f.dataset.cantiere, tipo: f.tipo.value, nome, piva, dipendente: dip || null, di: f.dataset.di || null, mansione: f.mansione.value.trim(), dal: f.dal.value || null, al: f.al.value || null });
      chiudiFoglio(); toast("Aggiunto. Ora carica i documenti."); vai("sic-soggetto/" + id);
    } catch (e) { toast(errore(e), "errore"); }
  };

  /* ---- una persona o impresa ---- */
  V["sic-soggetto"] = async (id) => {
    await SIC.semina();
    const s = await SIC.soggetto(id);
    if (!s) return { t: "Fascicolo", h: `<div class="pad">${vuoto("Non trovato.")}</div>` };
    const [sem, docs, req] = await Promise.all([SIC.semaforo(id), SIC.documenti(id), SIC.requisiti(s.tipo)]);
    const ditta = gestisco(s.org);
    const c = COLORE[(sem && sem.colore) || "rosso"];
    const perReq = req.map((r) => {
      const d = docs.filter((x) => x.documento === r.documento && x.verifica !== "respinto")[0];
      const st = !d ? (s.dipendente && ["attestato", "idoneita_sanitaria"].includes(r.documento) ? ["blu", "Dai corsi e visite"] : r.obbligatorio ? ["rosso", "Manca"] : ["blu", "Se serve"])
        : d.scade && d.scade < new Date().toISOString().slice(0, 10) ? ["rosso", "Scaduto"] : VERIFICA[d.verifica];
      return voce("doc", esc(NOMI_DOC[r.documento] || r.documento) + (r.obbligatorio ? "" : " (se serve)"), esc(r.nota) + (d && d.scade ? " · scade il " + data(d.scade) : ""), d ? "sic-doc/" + d.id : `sic-doc/nuovo:${s.cantiere}:${s.id}:${r.documento}`, st[0], stato(st[0], st[1]));
    });
    const altri = docs.filter((d) => !req.some((r) => r.documento === d.documento) || d.verifica === "respinto");
    return {
      t: s.nome,
      h: `<div class="pad">
        <div class="card" style="text-align:center"><small class="sotto" style="margin:0">${esc(NOMI_TIPO[s.tipo])}${s.mansione ? " · " + esc(s.mansione) : ""}</small>
          <h2 style="margin:6px 0">${c[0] === "verde" ? "Può entrare oggi" : c[0] === "giallo" ? "Può entrare, ma controlla" : "Oggi non può entrare"}</h2>${semStato(sem)}
          ${sem && sem.motivi.length ? `<p class="sotto" style="margin:10px 0 0">${sem.motivi.map(esc).join("<br>")}</p>` : ""}</div><div style="height:14px"></div>
        ${sez("Documenti richiesti", lista(perReq))}
        ${altri.length ? sez("Altri documenti", lista(altri.map((d) => voce("doc", esc(NOMI_DOC[d.documento] || d.documento), d.scade ? "Scade il " + data(d.scade) : "", "sic-doc/" + d.id, VERIFICA[d.verifica][0], stato(VERIFICA[d.verifica][0], VERIFICA[d.verifica][1]))))) : ""}
        <div class="btns" style="flex-direction:column;gap:8px">
          ${btn(I.piu + " Carica un documento", `go:sic-doc/nuovo:${s.cantiere}:${s.id}:altro`, "chiaro")}
          ${s.tipo === "subappaltatore" ? btn(I.piu + " Aggiungi un suo lavoratore", `so-sic-nuovo:${s.cantiere}:lavoratore:${s.id}`, "chiaro") : ""}
          ${ditta ? btn(s.stato === "sospeso" ? "Riammetti in cantiere" : "Sospendi dal cantiere", `sic-sospendi:${s.stato === "sospeso" ? "attivo" : "sospeso"}:${s.id}`, "chiaro") : ""}
          ${ditta ? btn("Uscito dal cantiere", `sic-sospendi:uscito:${s.id}`, "chiaro") : ""}
        </div>
      </div>`,
    };
  };
  AZIONI["sic-sospendi:"] = async (arg) => {
    const [st, id] = arg.split(":");
    try { const s = await SIC.soggetto(id); await SIC.salvaSoggetto({ id, stato: st }); toast("Fatto."); if (st === "uscito") vai("sic-cantiere/" + s.cantiere, true); else render(); } catch (e) { toast(errore(e), "errore"); }
  };

  /* ---- un documento ---- */
  V["sic-doc"] = async (param) => {
    const [prima, cantiere, soggetto, documento] = String(param).split(":");
    let d;
    if (prima === "nuovo") d = { cantiere, soggetto: soggetto === "-" ? null : soggetto, documento: documento || "altro", verifica: "da_verificare" };
    else d = await SIC.documento(prima);
    if (!d) return { t: "Documento", h: `<div class="pad">${vuoto("Non trovato.")}</div>` };
    const s = d.soggetto ? await SIC.soggetto(d.soggetto) : null;
    const org = s ? s.org : (await SIC.fascicolo(d.cantiere)).cantiere.org;
    const ditta = gestisco(org);
    const url = d.file ? await SIC.file.url(d.file).catch(() => "") : "";
    const tipi = Object.entries(NOMI_DOC).map(([k, t]) => `<option value="${k}" ${k === d.documento ? "selected" : ""}>${esc(t)}</option>`).join("");
    const bloccato = d.id && d.verifica === "valido" && !ditta;
    return {
      t: (NOMI_DOC[d.documento] || "Documento") + (s ? " · " + s.nome : ""),
      h: `<div class="pad">
        ${d.id ? `<div class="riga" style="justify-content:space-between;margin-bottom:12px">${stato(VERIFICA[d.verifica][0], VERIFICA[d.verifica][1])}${d.scade ? `<span class="sotto" style="margin:0">${giorniA(d.scade) < 0 ? "Scaduto il " : "Scade il "}${data(d.scade)}</span>` : ""}</div>` : ""}
        ${d.verifica === "respinto" && d.nota ? avviso("Respinto: " + esc(d.nota), "rosso") + '<div style="height:10px"></div>' : ""}
        ${url ? `<a class="btn chiaro" href="${esc(url)}" target="_blank" rel="noopener">${I.doc} Apri il file</a><div style="height:12px"></div>` : ""}
        ${bloccato ? avviso("Documento già verificato dalla ditta.") : `<form data-form="sic-doc" novalidate data-id="${esc(d.id || "")}" data-cantiere="${esc(d.cantiere)}" data-soggetto="${esc(d.soggetto || "")}">
          ${campo("Documento", `<select name="documento" ${d.id ? "disabled" : ""}>${tipi}</select>`)}
          ${campo("Descrizione", `<input name="titolo" maxlength="160" value="${esc(d.titolo || "")}" placeholder="es. DURC Inps n. …">`)}
          <div class="griglia2">${campo("Rilasciato il", `<input name="rilasciato" type="date" value="${esc(d.rilasciato || "")}">`)}${campo("Scade il", `<input name="scade" type="date" value="${esc(d.scade || "")}">`, "Il DURC vale 120 giorni: se lasci vuoto la calcolo io.")}</div>
          ${campo(d.file ? "Sostituisci il file" : "File (PDF o foto)", `<input name="file" type="file" accept="application/pdf,image/jpeg,image/png">`)}
          <button class="btn" type="submit">Salva</button></form>`}
        ${ditta && d.id ? `<div style="height:14px"></div><div class="btns">${d.verifica !== "valido" ? btn(I.ok + " Valido", `sic-verifica:valido:${d.id}`, "blu") : ""}${d.verifica !== "respinto" ? btn("Respingi", `sic-respingi:${d.id}`, "chiaro") : ""}</div>
          <div style="height:10px"></div><button type="button" class="link" data-az="sic-elimina:${esc(d.id)}">Elimina il documento</button>` : ""}
      </div>`,
    };
  };
  FORM["sic-doc"] = async (f) => {
    const file = f.file.files && f.file.files[0];
    if (file && file.size > 10 * 1024 * 1024) return toast("Il file supera 10 MB.", "errore");
    if (file && !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) return toast("Carica un PDF o una foto (JPG o PNG).", "errore");
    const base = { titolo: f.titolo.value.trim(), rilasciato: f.rilasciato.value || null, scade: f.scade.value || null };
    try {
      let id = f.dataset.id;
      if (id) await SIC.salvaDocumento(Object.assign({ id }, base));
      else id = await SIC.salvaDocumento(Object.assign({ cantiere: f.dataset.cantiere, soggetto: f.dataset.soggetto || null, documento: f.documento.value }, base));
      if (file) {
        const nome = id + "." + (file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg");
        await SIC.file.carica(nome, file);
        await SIC.salvaDocumento({ id, file: nome });
      }
      toast("Documento salvato."); vai("sic-doc/" + id, true);
    } catch (e) { toast(errore(e), "errore"); }
  };
  AZIONI["sic-verifica:"] = async (arg) => { const [esito, id] = arg.split(":"); try { await SIC.verifica(id, esito); toast("Segnato come valido."); render(); } catch (e) { toast(errore(e), "errore"); } };
  AZIONI["sic-respingi:"] = (id) => foglio(`<h2>Respingi il documento</h2><form data-form="sic-respingi" data-id="${esc(id)}" novalidate>${campo("Perché", `<input name="nota" maxlength="500" placeholder="es. DURC scaduto, POS senza firma">`)}<button class="btn" type="submit">Respingi</button></form>`);
  FORM["sic-respingi"] = async (f) => { try { await SIC.verifica(f.dataset.id, "respinto", f.nota.value.trim()); chiudiFoglio(); toast("Respinto: chi l'ha caricato lo vede."); render(); } catch (e) { toast(errore(e), "errore"); } };
  AZIONI["sic-elimina:"] = (id) => foglio(`<h2>Eliminare il documento?</h2><div class="btns">${btn("Elimina", "sic-elimina-ok:" + id)}${btn("Annulla", "sic-chiudi", "chiaro")}</div>`);
  AZIONI["sic-elimina-ok:"] = async (id) => { chiudiFoglio(); try { const d = await SIC.documento(id); await SIC.eliminaDocumento(id); toast("Eliminato."); vai(d.soggetto ? "sic-soggetto/" + d.soggetto : "sic-cantiere/" + d.cantiere, true); } catch (e) { toast(errore(e), "errore"); } };
  AZIONI["sic-chiudi"] = () => chiudiFoglio();

  /* ---- scadenziario comune ---- */
  V["sic-scadenze"] = async () => {
    await SIC.semina();
    const sc = await SIC.scadenze(S.org).catch(() => []);
    const gruppi = [["Scadute", (g) => g < 0, "rosso"], ["Entro 7 giorni", (g) => g >= 0 && g <= 7, "rosso"], ["Entro 30 giorni", (g) => g > 7 && g <= 30, "giallo"], ["Più avanti", (g) => g > 30, "verde"]];
    return {
      t: "Scadenze",
      h: `<div class="pad"><p class="sotto">Ogni mattina AncheCasa avvisa a 30 e 7 giorni e il giorno stesso. Qui c'è tutto in ordine di data.</p>
        ${sc.length ? gruppi.map(([t, f, col]) => { const x = sc.filter((s) => f(giorniA(s.scade))); return x.length ? sez(t, lista(x.map((s) => voce("calendario", esc(s.titolo), data(s.scade), s.cantiere ? "sic-cantiere/" + s.cantiere : null, col)))) : ""; }).join("") : vuoto("Nessuna scadenza.")}
      </div>`,
    };
  };
}
