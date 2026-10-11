/* Direzione della rete (10.10.2026, decisioni di Nando):
   - «Oggi»: andamento e obiettivi del mese, ogni giorno, per tutti (admin compreso);
   - Sala strategia: i dirigenti ne parlano, admin e Responsabile Rete Italia decidono, la rete vede le linee decise;
   - Lavori (cantieri) portati dalla rete: provvigioni a SAL come da contratto;
   - Il tuo mese: il report mensile per l'azienda, su carta intestata AncheCasa. */
import { I, esc, voce, lista, sez, stato, num, btn, campo, vuoto, avviso, virgola, quando, toast, spiegaErrore } from "./ui.js";
import { Q } from "./q.js";
import { euro } from "./schede.js";
import { REGIONI } from "./catalogo.js";
import { RUOLI_RETE } from "./viste-rete.js";

export const RUOLI_PROV = Object.assign({}, RUOLI_RETE, { segnala: "Chi segnala", chiude: "Chi chiude", segue: "Chi segue il cantiere", impresa: "Chi ha portato l'impresa", venditore: "Venditore", affidato: "Cliente di AncheCasa affidato (metà quota)", segnala_agente: "Chi segnala (tuo sub-agente)", chiude_agente: "Chi chiude (tuo sub-agente)", segue_agente: "Chi segue (tuo sub-agente)", impresa_agente: "Chi ha portato l'impresa (tuo sub-agente)" });

export function installa(core) {
  const { S, V, AZIONI, FORM, vai, render } = core;
  const io = () => (S.miei && S.miei.rete) || {};
  const sonoAdmin = () => !!(S.admin && S.base === "admin");
  const decide = () => sonoAdmin() || (io().ruolo === "reteitalia" && io().stato === "attivo");
  const dirigente = () => sonoAdmin() || (["reteitalia", "sviluppo", "capoarea"].includes(io().ruolo) && io().stato === "attivo");
  const oggiISO = () => new Date().toISOString().slice(0, 10);
  const meseISO = () => new Date().toISOString().slice(0, 7);
  const primoMese = () => meseISO() + "-01";
  const pl = (n, uno, piu) => n + " " + (n === 1 ? uno : piu);
  const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  const GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  const nomeMese = (ym) => { const [a, m] = String(ym).split("-"); return MESI[Number(m) - 1] + " " + a; };

  /* ======================================================================
     ANDAMENTO E OBIETTIVI
     ====================================================================== */
  function giorniLavorativiRimasti() {
    const d = new Date(); const m = d.getMonth(); let n = 0;
    for (const x = new Date(d); x.getMonth() === m; x.setDate(x.getDate() + 1)) if (x.getDay() !== 0 && x.getDay() !== 6) n++;
    return n;
  }
  async function datiAndamento() {
    const [vend, aff, rete, ob] = await Promise.all([
      Q.sel("app_vendite", { lim: 5000 }).catch(() => []),
      Q.sel("app_affari", { lim: 3000 }).catch(() => []),
      Q.sel("app_rete", { lim: 2000 }).catch(() => []),
      Q.sel("app_obiettivi", { eq: { mese: primoMese() }, lim: 2000 }).catch(() => []),
    ]);
    return { vend, aff, rete, ob };
  }
  const sottoDi = (rete, u) => { const out = []; const giu = (x, l) => { if (l > 6) return; rete.filter((r) => r.superiore === x).forEach((r) => { out.push(r.utente); giu(r.utente, l + 1); }); }; giu(u, 1); return out; };
  // numeri di un gruppo di persone (null = tutta Italia) in un periodo (prefisso di data: "2026-10" o "2026-10-10")
  function misura(d, chi, periodo) {
    const dentro = (u) => !chi || chi.includes(u);
    const v = d.vend.filter((x) => x.stato === "attiva" && (x.cliente_tipo || "azienda") !== "privato" && dentro(x.venditore) && String(x.attivata || "").startsWith(periodo));
    const a = d.aff.filter((x) => ["firmato", "chiuso"].includes(x.stato) && dentro(x.segnalato_da) && String(x.firmato || "").startsWith(periodo));
    return {
      aziende: new Set(v.map((x) => String(x.cliente_nome).trim().toLowerCase())).size,
      canoni: v.filter((x) => x.tipo_importo === "mese").reduce((s, x) => s + Number(x.importo), 0),
      lavori: a.length,
      valore: a.reduce((s, x) => s + Number(x.valore), 0),
    };
  }
  const METRICHE = [["aziende", "Nuove aziende clienti", (n) => String(n)], ["canoni", "Nuovi canoni al mese", (n) => euro(n) || "0 €"], ["lavori", "Lavori firmati", (n) => String(n)], ["valore", "Valore dei lavori", (n) => euro(n) || "0 €"]];

  function ritmo(manca, giorni, k) {
    if (manca <= 0) return "obiettivo raggiunto";
    if (!giorni) return "mese finito";
    if (k === "canoni" || k === "valore") return "mancano " + (euro(manca) || "0 €") + ", circa " + (euro(Math.ceil(manca / giorni)) || "0 €") + " al giorno";
    const al = manca / giorni;
    return "mancano " + manca + (al >= 1 ? ", circa " + Math.ceil(al) + " al giorno" : ", una ogni " + Math.max(1, Math.floor(giorni / manca)) + " giorni lavorativi");
  }
  function barre(mese, oggi, ob) {
    const giorni = giorniLavorativiRimasti();
    return METRICHE.map(([k, t, f]) => {
      const fatto = mese[k], meta = ob ? Number(ob[k]) || 0 : 0;
      const pc = meta ? Math.min(100, Math.round((fatto / meta) * 100)) : 0;
      return `<div style="margin:10px 0 0"><div style="display:flex;justify-content:space-between;gap:8px;font-size:14px"><span>${t}</span><b>${f(fatto)}${meta ? " / " + f(meta) : ""}</b></div>
        ${meta ? `<div class="barra-av" style="margin-top:5px"><i style="width:${pc}%"></i></div>` : ""}
        <small style="opacity:.8">${oggi[k] ? "oggi +" + f(oggi[k]) + " · " : ""}${meta ? ritmo(meta - fatto, giorni, k) : "obiettivo non ancora fissato"}</small></div>`;
    }).join("");
  }
  // ambito: "italia" o "io" (io + chi ho sotto)
  async function cartaOggi(ambito) {
    const d = await datiAndamento();
    const chi = ambito === "italia" ? null : [S.utente.id, ...sottoDi(d.rete, S.utente.id)];
    const mese = misura(d, chi, meseISO()), oggi = misura(d, chi, oggiISO());
    const ob = ambito === "italia" ? d.ob.find((x) => !x.utente) : d.ob.find((x) => x.utente === S.utente.id);
    const ora = new Date();
    let fermi = 0;
    if (ambito === "italia" || (chi && chi.length > 1)) {
      const persone = d.rete.filter((r) => r.stato === "attivo" && r.utente !== S.utente.id && (!chi || chi.includes(r.utente)));
      const ultimo = (u) => [...d.vend.filter((x) => x.venditore === u).map((x) => x.creato), ...d.aff.filter((x) => x.segnalato_da === u).map((x) => x.creato)].sort().pop();
      fermi = persone.filter((r) => { const l = ultimo(r.utente); return !l || Date.now() - new Date(l) > 30 * 864e5; }).length;
    }
    return `<div class="eroe" data-go="obiettivi" role="button" tabindex="0" style="cursor:pointer"><h3>Oggi, ${GIORNI[ora.getDay()]} ${ora.getDate()} ${MESI[ora.getMonth()]}</h3>
      <p>${ambito === "italia" ? "Tutta Italia" : chi.length > 1 ? "Tu e la tua squadra" : "Il tuo mese"} · obiettivi di ${MESI[ora.getMonth()]} · ${pl(giorniLavorativiRimasti(), "giorno lavorativo", "giorni lavorativi")} alla fine${ob && ob.nota ? " · " + esc(ob.nota) : ""}</p>
      ${barre(mese, oggi, ob)}
      ${fermi ? `<p style="margin:12px 0 0">${pl(fermi, "persona ferma", "persone ferme")} da più di 30 giorni: guarda La catena.</p>` : ""}</div><div style="height:12px"></div>`;
  }
  async function cartaLinea() {
    const l = await Q.rpc("app_linee_decise").catch(() => []);
    if (!l || !l.length) return "";
    const x = l[0];
    return `<div class="card" data-go="linee" role="button" tabindex="0" style="cursor:pointer;border-left:4px solid var(--arancio)"><small>Linea decisa · ${quando(x.deciso)}</small><b style="display:block;margin-top:4px">${esc(x.titolo)}</b><p style="margin:4px 0 0">${esc(x.linea)}</p></div><div style="height:12px"></div>`;
  }
  core.cartaOggi = cartaOggi;
  core.cartaLinea = cartaLinea;

  V.obiettivi = async () => {
    const d = await datiAndamento();
    const italia = sonoAdmin() || io().ruolo === "reteitalia";
    const diretti = sonoAdmin() ? d.rete.filter((r) => ["reteitalia", "sviluppo"].includes(r.ruolo)) : io().ruolo === "reteitalia" ? d.rete.filter((r) => r.ruolo === "sviluppo") : d.rete.filter((r) => r.superiore === S.utente.id);
    const riga = (r) => {
      const chi = [r.utente, ...sottoDi(d.rete, r.utente)];
      const m = misura(d, chi, meseISO()); const ob = d.ob.find((x) => x.utente === r.utente);
      const pc = ob && Number(ob.aziende) ? Math.round((m.aziende / ob.aziende) * 100) : null;
      const col = pc == null ? "" : pc >= 100 ? "verde" : pc >= 50 ? "giallo" : "rosso";
      return voce("rete", esc(r.nome || r.codice), `${esc(RUOLI_RETE[r.ruolo])} · ${m.aziende}${ob ? "/" + ob.aziende : ""} aziende · ${m.lavori}${ob ? "/" + ob.lavori : ""} lavori · ${euro(m.canoni) || "0 €"}/mese${ob ? "" : " · senza obiettivo"}`, null, col || "blu", pc != null ? stato(col, pc + "%") : "");
    };
    const tutti = italia ? d.rete.filter((r) => r.stato === "attivo") : [];
    return {
      t: "Andamento e obiettivi",
      h: `<div class="pad">${await cartaOggi(italia ? "italia" : "io")}
        ${diretti.length ? sez(italia ? "I responsabili" : "Chi hai sotto", lista(diretti.map(riga))) : ""}
        ${italia ? sez("Fissa gli obiettivi del mese", `<form data-form="obiettivo" novalidate>
          ${campo("Per chi", `<select name="utente"><option value="">Tutta Italia</option>${tutti.map((r) => `<option value="${esc(r.utente)}">${esc(r.nome || r.codice)} · ${esc(RUOLI_RETE[r.ruolo])}</option>`).join("")}</select>`, "La persona risponde per sé e per chi ha sotto.")}
          ${campo("Mese", `<select name="mese"><option value="${primoMese()}">${nomeMese(meseISO())}</option><option value="${(() => { const x = new Date(); x.setDate(1); x.setMonth(x.getMonth() + 1); return x.toISOString().slice(0, 7) + "-01"; })()}">il mese prossimo</option></select>`)}
          <div class="griglia2">${campo("Nuove aziende", `<input name="aziende" type="number" min="0" step="1">`)}${campo("Nuovi canoni (€/mese)", `<input name="canoni" type="number" min="0" step="1">`)}${campo("Lavori firmati", `<input name="lavori" type="number" min="0" step="1">`)}${campo("Valore lavori (€)", `<input name="valore" type="number" min="0" step="100">`)}</div>
          ${campo("Nota", `<input name="nota" maxlength="300" placeholder="Es. spingere il modulo Sicurezza">`)}
          <button class="btn" type="submit">Salva gli obiettivi</button></form><p class="sotto piccolo">Li fissate tu e ${sonoAdmin() ? "il Responsabile Rete Italia" : "l'admin"}. La persona li vede subito nella sua home.</p>`) : `<p class="sotto piccolo">Gli obiettivi li fissano l'admin e il Responsabile Rete Italia.</p>`}</div>`,
    };
  };
  FORM.obiettivo = async (f) => {
    const n = (k) => (f[k].value === "" ? 0 : Number(f[k].value));
    try { await Q.rpc("app_fissa_obiettivo", { p_utente: f.utente.value || null, p_mese: f.mese.value, p_aziende: n("aziende"), p_canoni: n("canoni"), p_lavori: n("lavori"), p_valore: n("valore"), p_nota: f.nota.value.trim() }); }
    catch (e) { return toast(spiegaErrore(e), "errore"); }
    toast("Obiettivi salvati."); render();
  };

  /* ======================================================================
     SALA STRATEGIA
     ====================================================================== */
  const TEMI = { vendite: "Vendite", zone: "Zone e regioni", prodotti: "Prodotti e servizi", persone: "Persone della rete", prezzi: "Prezzi e offerte", altro: "Altro" };
  const STS = { aperta: ["giallo", "In discussione"], decisa: ["verde", "Decisa"], scartata: ["rosso", "Non passa"] };
  const NOMECHI = { admin: "Admin", reteitalia: "Rete Italia", sviluppo: "Sviluppo rete", capoarea: "Capo area" };
  const chip = (t, v, serve) => serve === false ? "" : stato(v === "si" ? "verde" : v === "no" ? "rosso" : "giallo", t + " " + (v === "si" ? "sì" : v === "no" ? "no" : "…"));

  V.strategia = async (id) => {
    if (!dirigente()) return { t: "Sala strategia", h: `<div class="pad">${avviso("La sala strategia è dei dirigenti. Le decisioni le trovi in «Linee decise».")}<div style="height:12px"></div>${btn("Linee decise", "go:linee")}</div>` };
    if (id && !["aperte", "decise", "scartate"].includes(id)) return strategiaUna(id);
    const filtro = id || "aperte";
    const tutte = await Q.sel("app_strategie", { ord: ["aggiornato", false], lim: 300 }).catch(() => []);
    const st = { aperte: "aperta", decise: "decisa", scartate: "scartata" }[filtro];
    const l = tutte.filter((s) => s.stato === st);
    const daMe = decide() ? tutte.filter((s) => s.stato === "aperta" && (sonoAdmin() ? !s.voto_admin : !s.voto_reteitalia)).length : 0;
    const pill = (k, t) => `<button type="button" class="pillola ${k === filtro ? "on" : ""}" data-go="strategia/${k}">${t}</button>`;
    return {
      t: "Sala strategia",
      h: `<div class="pad"><p class="sotto">Qui parlano i dirigenti: sviluppo rete, capi area, Responsabile Rete Italia e admin. Decidono admin e Responsabile Rete Italia; quello che decidono lo vede tutta la rete.</p><div style="height:10px"></div>
        ${daMe ? avviso(pl(daMe, "argomento aspetta", "argomenti aspettano") + " la tua decisione.") + '<div style="height:10px"></div>' : ""}
        <div class="pillole">${pill("aperte", "In discussione" + (tutte.filter((s) => s.stato === "aperta").length ? " " + tutte.filter((s) => s.stato === "aperta").length : ""))}${pill("decise", "Decise")}${pill("scartate", "Non passate")}</div><div style="height:12px"></div>
        ${l.length ? lista(l.map((s) => voce("chat", esc(s.titolo), `${esc(TEMI[s.tema] || s.tema)} · ${pl((s.commenti || []).filter((c) => !c.voto).length, "commento", "commenti")} · ${quando(s.aggiornato)}`, "strategia/" + s.id, STS[s.stato][0], stato(...STS[s.stato])))) : vuoto(filtro === "aperte" ? "Nessun argomento aperto." : "Niente qui.")}
        ${filtro === "aperte" ? sez("Apri un argomento", `<form data-form="strategia-apri" novalidate>
          ${campo("Di cosa vuoi parlare", `<input name="titolo" maxlength="140" required placeholder="Es. Puntare sugli impiantisti in Campania">`)}
          ${campo("Tema", `<select name="tema">${Object.entries(TEMI).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>`)}
          ${campo("Spiega", `<textarea name="testo" rows="4" maxlength="2000" placeholder="Cosa hai visto, cosa proponi, con quali numeri"></textarea>`)}
          <button class="btn" type="submit">Apri la discussione</button></form>`) : ""}</div>`,
    };
  };
  async function strategiaUna(id) {
    const s = await Q.uno("app_strategie", { id });
    if (!s) return { t: "Sala strategia", h: vuoto("Argomento non trovato.") };
    const mioVoto = sonoAdmin() ? s.voto_admin : io().ruolo === "reteitalia" ? s.voto_reteitalia : "x";
    const msg = (s.commenti || []).map((c) => c.voto
      ? `<div class="card" style="margin-bottom:8px;border-left:4px solid ${c.voto === "si" ? "var(--verde, #1e9e5a)" : "#d64545"}"><small>${esc(c.nome || "")} · ${esc(NOMECHI[c.ruolo] || c.ruolo || "")} · ${quando(c.quando)}</small><p style="margin:4px 0 0"><b>${c.voto === "si" ? "Sì" : "No"}</b>${c.linea ? " · linea: «" + esc(c.linea) + "»" : ""}${c.testo ? " · " + esc(c.testo) : ""}</p></div>`
      : `<div class="card" style="margin-bottom:8px"><small>${esc(c.nome || "")} · ${esc(NOMECHI[c.ruolo] || c.ruolo || "")} · ${quando(c.quando)}</small><p style="margin:4px 0 0">${esc(c.testo)}</p></div>`).join("");
    return {
      t: "Sala strategia",
      h: `<div class="pad"><div class="card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:start"><div><h3 style="margin:0">${esc(s.titolo)}</h3><p class="sotto">${esc(TEMI[s.tema] || s.tema)} · aperto ${quando(s.creato)}</p></div>${stato(...STS[s.stato])}</div>
        ${s.testo ? `<p style="margin:8px 0 0;white-space:pre-line">${esc(s.testo)}</p>` : ""}
        <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">${chip("Admin", s.voto_admin)}${chip("Rete Italia", s.voto_reteitalia, s.serve_reteitalia)}</div>
        ${s.linea ? `<div class="avviso" style="margin-top:10px"><b>${s.stato === "decisa" ? "Linea decisa" : "Linea proposta"}:</b> ${esc(s.linea)}</div>` : ""}</div><div style="height:14px"></div>
        ${sez("La discussione", msg || `<div class="card"><p>Nessun commento ancora.</p></div>`)}
        ${s.stato === "aperta" ? `<form data-form="strategia-commenta" data-id="${esc(s.id)}" novalidate>${campo("Il tuo commento", `<textarea name="testo" rows="3" maxlength="1000" required></textarea>`)}<button class="btn chiaro" type="submit">Commenta</button></form>` : ""}
        ${s.stato === "aperta" && decide() && mioVoto !== "x" ? sez(mioVoto === "si" ? "Hai detto sì: puoi ancora cambiare la linea" : "Decidi", `<div class="card">
          ${campo("La linea: cosa fa la rete da domani", `<textarea id="linea-${esc(s.id)}" rows="3" maxlength="1000" placeholder="Scrivi la decisione in modo chiaro, con numeri e date">${esc(s.linea || "")}</textarea>`, "Se cambi il testo, anche l'altro deve ridire sì.")}
          ${campo("Nota (facoltativa)", `<input id="nota-${esc(s.id)}" maxlength="300">`)}
          <div class="griglia2">${btn("Sì, si fa", "strategia-decidi:" + s.id + ":si")}${btn("No", "strategia-decidi:" + s.id + ":no", "chiaro")}</div></div>`) : ""}</div>`,
    };
  }
  FORM["strategia-apri"] = async (f) => {
    if (f.titolo.value.trim().length < 3) return toast("Scrivi di cosa vuoi parlare.", "errore");
    let id;
    try { id = await Q.rpc("app_strategia_apri", { p_titolo: f.titolo.value.trim(), p_testo: f.testo.value.trim(), p_tema: f.tema.value }); }
    catch (e) { return toast(spiegaErrore(e), "errore"); }
    toast("Discussione aperta: gli altri dirigenti ricevono l'avviso."); vai("strategia/" + id);
  };
  FORM["strategia-commenta"] = async (f) => {
    if (f.testo.value.trim().length < 2) return toast("Scrivi il commento.", "errore");
    try { await Q.rpc("app_strategia_commenta", { p_id: f.dataset.id, p_testo: f.testo.value.trim() }); }
    catch (e) { return toast(spiegaErrore(e), "errore"); }
    render();
  };
  AZIONI["strategia-decidi:"] = async (arg) => {
    const [id, vv] = arg.split(":");
    const linea = (document.getElementById("linea-" + id) || {}).value || "";
    const nota = (document.getElementById("nota-" + id) || {}).value || "";
    try {
      const e = await Q.rpc("app_strategia_decidi", { p_id: id, p_si: vv === "si", p_linea: linea.trim(), p_nota: nota.trim() });
      toast(e === "decisa" ? "Decisa: tutta la rete la vede." : e === "scartata" ? "Non passa." : "Sì registrato: manca l'altro sì.");
    } catch (e) { toast(spiegaErrore(e), "errore"); }
    render();
  };

  V.linee = async () => {
    const l = await Q.rpc("app_linee_decise").catch(() => []);
    return {
      t: "Linee decise",
      h: `<div class="pad"><p class="sotto">Le decisioni di AncheCasa per la rete: le prendono l'admin e il Responsabile Rete Italia dopo averne parlato con i dirigenti.</p><div style="height:10px"></div>
        ${l && l.length ? l.map((x) => `<div class="card" style="margin-bottom:10px;border-left:4px solid var(--arancio)"><small>${esc(TEMI[x.tema] || "")} · decisa ${quando(x.deciso)}</small><b style="display:block;margin-top:4px">${esc(x.titolo)}</b><p style="margin:6px 0 0;white-space:pre-line">${esc(x.linea)}</p></div>`).join("") : vuoto("Nessuna linea decisa ancora.")}
        ${dirigente() ? `<div style="height:6px"></div>${btn("Vai alla sala strategia", "go:strategia")}` : ""}</div>`,
    };
  };

  /* ======================================================================
     LAVORI (cantieri) portati dalla rete: provvigioni a SAL
     ====================================================================== */
  const STL = { proposta: ["giallo", "Da firmare"], firmato: ["blu", "In corso"], chiuso: ["verde", "Collaudato"], perso: ["rosso", "Perso"] };
  const TIPO_CL = { privato: "Privato", azienda: "Azienda", condominio: "Condominio" };
  V["re-lavori"] = async () => {
    const [aff, tr, rete] = await Promise.all([Q.sel("app_affari", { ord: ["creato", false], lim: 1000 }).catch(() => []), Q.sel("app_affari_tranche", { lim: 3000 }).catch(() => []), Q.sel("app_rete", { lim: 2000 }).catch(() => [])]);
    const nome = (u) => (rete.find((x) => x.utente === u) || {}).nome || "";
    const fatte = (a) => tr.filter((t) => t.affare === a.id && t.stato === "incassata").length;
    return {
      t: "Lavori",
      h: `<div class="pad"><p class="sotto">Ristrutturazioni e cantieri che hai portato tu o la tua squadra. Le provvigioni maturano a tranche, quando AncheCasa incassa: 30% firma e acconto, 30% metà lavori, 40% collaudo.</p><div style="height:10px"></div>
        ${aff.length ? lista(aff.map((a) => voce("gru", esc(a.cliente_nome), `${esc(TIPO_CL[a.cliente_tipo] || "")} · ${euro(a.valore) || "valore da definire"}${a.segnalato_da !== S.utente.id ? " · " + esc(nome(a.segnalato_da)) : ""}${a.stato === "firmato" ? " · " + fatte(a) + " tranche su 3" : ""}`, "re-lavoro/" + a.id, "", stato(...STL[a.stato])))) : vuoto("Nessun lavoro ancora. Da «Vendi» scegli «Lavoro o cantiere».")}
        <div style="height:12px"></div>${btn("Registra un lavoro", "go:re-vendi/lavoro")}</div>`,
    };
  };
  V["re-lavoro"] = async (id) => {
    const a = await Q.uno("app_affari", { id });
    if (!a) return { t: "Lavoro", h: vuoto("Non trovato.") };
    const [tr, prov, rete, marg, imp] = await Promise.all([
      Q.sel("app_affari_tranche", { eq: { affare: id } }).catch(() => []),
      Q.sel("app_provvigioni", { eq: { affare: id }, lim: 500 }).catch(() => []),
      Q.sel("app_rete", { lim: 2000 }).catch(() => []),
      sonoAdmin() ? Q.uno("app_affari_margine", { affare: id }).catch(() => null) : null,
      Q.uno("app_impostazioni", { chiave: "cantieri" }).catch(() => null),
    ]);
    const nome = (u) => (u ? (rete.find((x) => x.utente === u) || {}).nome || "—" : "—");
    const quote = (imp && imp.valore) || { rete: 40, segnala: 10, chiude: 25, segue: 30, impresa: 10, sviluppo: 12, capoarea: 8, reteitalia: 5 };
    const mie = prov.filter((p) => p.beneficiario === S.utente.id);
    const opz = (sel) => `<option value="">—</option>` + rete.filter((r) => r.stato === "attivo").map((r) => `<option value="${esc(r.utente)}" ${r.utente === sel ? "selected" : ""}>${esc(r.nome || r.codice)} · ${esc(RUOLI_RETE[r.ruolo])}</option>`).join("");
    const trancheH = tr.sort((x, y) => x.n - y.n).map((t) => {
      const atteso = Number(a.valore) * Number(t.quota) / 100;
      const az = sonoAdmin() && a.stato === "firmato" && t.stato === "attesa" && tr.filter((x) => x.n < t.n).every((x) => x.stato === "incassata")
        ? `<div style="display:flex;gap:8px;margin-top:8px"><input id="inc-${t.n}" type="number" min="0" step="0.01" value="${atteso.toFixed(2)}" style="flex:1">${btn("Incassato", "tranche:" + id + ":" + t.n, "piccolo")}</div>` : "";
      return `<div class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:8px"><b>${t.n}. ${esc(t.nome)} · ${virgola(t.quota, 0)}%</b>${stato(t.stato === "incassata" ? "verde" : "giallo", t.stato === "incassata" ? "incassata" : "in attesa")}</div>
        <small>${t.stato === "incassata" ? "Incassati " + euro(t.incassato) + " il " + new Date(t.incassato_il).toLocaleDateString("it-IT") : "Previsti " + (euro(atteso) || "0 €")}</small>${az}</div>`;
    }).join("");
    return {
      t: a.cliente_nome,
      h: `<div class="pad"><div class="card"><dl class="campi"><dt>Cliente</dt><dd>${esc(TIPO_CL[a.cliente_tipo] || "")}${a.cliente_regione ? " · " + esc(a.cliente_regione) : ""}${a.cliente_contatto ? " · " + esc(a.cliente_contatto) : ""}</dd>
        ${a.descrizione ? `<dt>Lavoro</dt><dd>${esc(a.descrizione)}</dd>` : ""}<dt>Valore</dt><dd>${euro(a.valore) || "da definire"}</dd><dt>Stato</dt><dd>${stato(...STL[a.stato])}</dd>
        <dt>Chi segnala</dt><dd>${esc(nome(a.segnalato_da))}</dd><dt>Chi chiude</dt><dd>${esc(nome(a.chiude))}</dd><dt>Chi segue il cantiere</dt><dd>${esc(nome(a.segue))}</dd><dt>Chi ha portato l'impresa</dt><dd>${esc(nome(a.impresa_da))}</dd>
        ${marg ? `<dt>Margine (solo admin)</dt><dd>${euro(marg.margine)}</dd>` : ""}</dl></div><div style="height:12px"></div>
        ${tr.length ? sez("Le tranche", trancheH) : avviso(a.stato === "proposta" ? "Quando AncheCasa firma il contratto con il cliente, qui compaiono le tre tranche: 30% firma e acconto, 30% metà lavori, 40% collaudo." : "")}
        ${mie.length ? sez("Le tue provvigioni su questo lavoro", lista(mie.map((p) => voce("euro", euro(p.importo), esc(RUOLI_PROV[p.ruolo] || p.ruolo) + " · tranche " + p.tranche + " · " + (p.stato === "pagata" ? "pagata" : "maturata"), null, p.stato === "pagata" ? "verde" : "giallo")))) : ""}
        ${sonoAdmin() && prov.length ? sez("Provvigioni della rete", lista(prov.map((p) => voce("euro", euro(p.importo), esc(nome(p.beneficiario)) + " · " + esc(RUOLI_PROV[p.ruolo] || p.ruolo) + " · tranche " + p.tranche, null, "blu")))) : ""}
        <p class="sotto piccolo">Alla rete va il ${virgola(quote.rete, 0)}% del margine: chi segnala ${quote.segnala}%, chi chiude ${quote.chiude}%, chi segue il cantiere ${quote.segue}%, chi ha portato l'impresa ${quote.impresa}%, sviluppo rete ${quote.sviluppo}%, capo area ${quote.capoarea}%, Rete Italia ${quote.reteitalia}%. Maturano solo sull'incassato.</p>
        ${sonoAdmin() && ["proposta", "firmato"].includes(a.stato) ? sez(a.stato === "proposta" ? "Firma il lavoro" : "Correggi ruoli e margine", `<form data-form="lavoro-firma" data-id="${esc(id)}" novalidate>
          <div class="griglia2">${campo("Valore del contratto (€)", `<input name="valore" type="number" min="0" step="0.01" value="${esc(a.valore)}">`)}${campo("Margine lordo (€)", `<input name="margine" type="number" min="0" step="0.01" value="${esc(marg ? marg.margine : "")}">`, "Lo vedi solo tu.")}</div>
          ${campo("Chi chiude", `<select name="chiude">${opz(a.chiude)}</select>`)}${campo("Chi segue il cantiere", `<select name="segue">${opz(a.segue)}</select>`)}${campo("Chi ha portato l'impresa", `<select name="impresa">${opz(a.impresa_da)}</select>`)}
          <button class="btn" type="submit">${a.stato === "proposta" ? "Contratto firmato" : "Salva"}</button></form>${a.stato === "proposta" ? `<div style="height:8px"></div>${btn("Lavoro perso", "lavoro-perso:" + id, "chiaro")}` : ""}`) : ""}
        ${!sonoAdmin() && a.stato === "proposta" && a.segnalato_da === S.utente.id ? btn("Il cliente non è interessato", "lavoro-perso:" + id, "chiaro") : ""}</div>`,
    };
  };
  FORM["lavoro-firma"] = async (f) => {
    if (f.margine.value === "") return toast("Scrivi il margine lordo.", "errore");
    try { await Q.rpc("app_affare_firma", { p_affare: f.dataset.id, p_valore: Number(f.valore.value || 0), p_margine: Number(f.margine.value), p_chiude: f.chiude.value || null, p_segue: f.segue.value || null, p_impresa_da: f.impresa.value || null }); }
    catch (e) { return toast(spiegaErrore(e), "errore"); }
    toast("Salvato."); render();
  };
  AZIONI["tranche:"] = async (arg) => {
    const [id, n] = arg.split(":");
    const v = (document.getElementById("inc-" + n) || {}).value;
    if (v === "" || v == null) return toast("Scrivi quanto è stato incassato.", "errore");
    try { const m = await Q.rpc("app_tranche_incassata", { p_affare: id, p_n: Number(n), p_incasso: Number(v) }); toast("Incasso registrato: " + (euro(m) || "0 €") + " di provvigioni alla rete."); }
    catch (e) { toast(spiegaErrore(e), "errore"); }
    render();
  };
  AZIONI["lavoro-perso:"] = async (id) => { await Q.upd("app_affari", { id }, { stato: "perso" }); toast("Segnato come perso."); render(); };

  V["ad-lavori"] = async () => {
    const [aff, rete] = await Promise.all([Q.sel("app_affari", { ord: ["creato", false], lim: 2000 }).catch(() => []), Q.sel("app_rete", { lim: 2000 }).catch(() => [])]);
    const nome = (u) => (rete.find((x) => x.utente === u) || {}).nome || "";
    const gr = (st) => aff.filter((a) => a.stato === st);
    const r = (a) => voce("gru", esc(a.cliente_nome), `${euro(a.valore) || "—"} · di ${esc(nome(a.segnalato_da))} · ${quando(a.creato)}`, "re-lavoro/" + a.id, STL[a.stato][0]);
    return {
      t: "Lavori della rete",
      h: `<div class="pad">${sez("Da firmare", gr("proposta").length ? lista(gr("proposta").map(r)) : `<div class="card"><p>Nessuno.</p></div>`)}
        ${sez("In corso: registra gli incassi delle tranche", gr("firmato").length ? lista(gr("firmato").map(r)) : `<div class="card"><p>Nessuno.</p></div>`)}
        ${gr("chiuso").length ? sez("Collaudati", lista(gr("chiuso").map(r))) : ""}</div>`,
    };
  };

  /* ======================================================================
     IL TUO MESE: report mensile dell'azienda, su carta intestata
     ====================================================================== */
  async function numeriMese(org, ym) {
    const [rec, off, lotti, mod, ordini] = await Promise.all([
      Q.sel("app_record", { eq: { org }, lim: 3000 }).catch(() => []),
      Q.sel("app_offerte", { eq: { org }, lim: 1000 }).catch(() => []),
      Q.sel("app_record", { eq: { tipo: "lotto", pubblico: true }, lim: 2000 }).catch(() => []),
      Q.sel("app_moduli", { eq: { org }, lim: 50 }).catch(() => []),
      Q.sel("app_ordini", { eq: { org }, lim: 500 }).catch(() => []),
    ]);
    const nel = (d) => String(d || "").startsWith(ym);
    const tipo = (t) => rec.filter((r) => r.tipo === t);
    const offM = off.filter((o) => nel(o.creato));
    const valoreOff = (l) => l.reduce((s, o) => s + Number(o.prezzo || 0), 0);
    const mieiLotti = tipo("lotto").filter((l) => nel(l.creato));
    const prev = tipo("preventivo").filter((r) => nel(r.data || r.creato));
    const fatt = tipo("fattura").filter((r) => nel(r.data || r.creato));
    const scad = rec.filter((r) => ["attestato", "visita"].includes(r.tipo) && r.scadenza);
    const oggi = new Date().toISOString().slice(0, 10);
    return {
      richieste: lotti.filter((l) => l.org !== org && nel(l.creato)).length,
      offerte: offM.length, offerte_vinte: offM.filter((o) => o.stato === "accettata").length, valore_offerte: valoreOff(offM), valore_vinte: valoreOff(offM.filter((o) => o.stato === "accettata")),
      lotti: mieiLotti.length,
      preventivi: prev.length, valore_preventivi: prev.reduce((s, r) => s + Number(r.importo || 0), 0), preventivi_accettati: prev.filter((r) => r.stato === "accettato").length,
      fatture: fatt.length, valore_fatture: fatt.reduce((s, r) => s + Number(r.importo || 0), 0),
      cantieri: tipo("cantiere").filter((r) => r.stato !== "finito").length, giornale: tipo("giornale").filter((r) => nel(r.data || r.creato)).length,
      in_regola: scad.length ? Math.round((scad.filter((r) => r.scadenza >= oggi).length / scad.length) * 100) : null,
      chiamate: tipo("chiamata").filter((r) => nel(r.data || r.creato)).length,
      corsi: ordini.filter((o) => nel(o.creato)).length,
      moduli: mod.filter((m) => m.stato === "attivo").map((m) => m.modulo),
    };
  }
  const VOCI_REPORT = (n) => [
    ["Richieste nuove su AncheCasa", n.richieste, "lotti, forniture e noleggi pubblicati dalle imprese"],
    ["Offerte che hai fatto", n.offerte, n.valore_offerte ? "per " + euro(n.valore_offerte) : ""],
    ["Offerte vinte", n.offerte_vinte, n.valore_vinte ? "per " + euro(n.valore_vinte) : ""],
    ["Richieste che hai pubblicato", n.lotti, ""],
    ["Preventivi fatti", n.preventivi, n.valore_preventivi ? "per " + euro(n.valore_preventivi) : ""],
    ["Fatture emesse", n.fatture, n.valore_fatture ? "per " + euro(n.valore_fatture) : ""],
    ["Cantieri aperti", n.cantieri, n.giornale ? n.giornale + " giornate nel giornale" : ""],
    ["Squadra in regola", n.in_regola == null ? "–" : n.in_regola + "%", "corsi e visite non scaduti"],
  ];
  V["im-report"] = async (ym) => {
    ym = ym || meseISO();
    const org = S.org;
    const o = ((S.miei && S.miei.org) || []).find((x) => x.id === org) || {};
    const n = await numeriMese(org, ym);
    const prima = (() => { const d = new Date(ym + "-01"); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })();
    return {
      t: "Il tuo mese",
      h: `<div class="pad"><div class="eroe"><h3>${esc(o.nome || "La tua azienda")}</h3><p>Il tuo mese con AncheCasa · ${nomeMese(ym)}</p></div><div style="height:12px"></div>
        <div class="griglia2">${VOCI_REPORT(n).map(([t, v, s]) => `<div class="num"><b>${v}</b><small>${t}${s ? "<br>" + esc(s) : ""}</small></div>`).join("")}</div><div style="height:14px"></div>
        ${n.offerte === 0 && n.richieste > 0 ? avviso("Ci sono state " + n.richieste + " richieste nuove e non hai fatto offerte: guardale in «Richieste».") + '<div style="height:12px"></div>' : ""}
        ${btn("Scarica il report su carta intestata", "report-stampa:" + ym)}<div style="height:8px"></div>
        <div class="griglia2">${btn("Mese prima", "go:im-report/" + prima, "chiaro")}${ym !== meseISO() ? btn("Questo mese", "go:im-report", "chiaro") : ""}</div>
        <p class="sotto piccolo">Ogni mese AncheCasa ti manda questo report. I numeri sono quelli che registri nell'app.</p></div>`,
    };
  };
  AZIONI["report-stampa:"] = async (ym) => {
    const o = ((S.miei && S.miei.org) || []).find((x) => x.id === S.org) || {};
    const n = await numeriMese(S.org, ym);
    const w = window.open("", "_blank");
    if (!w) return toast("Il telefono ha bloccato la finestra: consenti i popup e riprova.", "errore");
    const max = Math.max(1, n.richieste, n.offerte, n.offerte_vinte, n.preventivi);
    const barra = (t, v, c) => `<div class="b"><span>${t}</span><div><i style="width:${Math.round((v / max) * 100)}%;background:${c}"></i></div><b>${v}</b></div>`;
    w.document.write(`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AncheCasa · Il tuo mese · ${esc(o.nome || "")} · ${nomeMese(ym)}</title>
      <style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:"DM Sans",Arial,sans-serif;color:#1b2a41;background:#fff}
      .pag{width:210mm;min-height:297mm;margin:0 auto;display:flex;flex-direction:column}
      header{background:#0f2a4a;color:#fff;padding:14mm 16mm 10mm;display:flex;justify-content:space-between;align-items:center}header img{height:13mm}header div{text-align:right;font-size:10pt;opacity:.85}
      .fascia{height:3mm;background:#f28c28}main{padding:12mm 16mm;flex:1}h1{font-family:Montserrat,Arial,sans-serif;font-size:21pt;margin:0 0 2mm;color:#0f2a4a}h2{font-family:Montserrat,Arial,sans-serif;font-size:12pt;color:#0f2a4a;margin:9mm 0 3mm;text-transform:uppercase;letter-spacing:.04em}
      .sub{color:#5b6b80;margin:0 0 7mm}.kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm}.k{border:1px solid #dfe6ef;border-radius:3mm;padding:4mm}.k b{display:block;font-size:19pt;font-family:Montserrat,Arial,sans-serif;color:#0f2a4a}.k span{font-size:8.5pt;color:#5b6b80}
      .b{display:grid;grid-template-columns:52mm 1fr 14mm;align-items:center;gap:4mm;margin:2.5mm 0;font-size:10pt}.b div{height:5mm;background:#eef2f7;border-radius:3mm;overflow:hidden}.b i{display:block;height:100%;border-radius:3mm}.b b{text-align:right}
      .nota{background:#fff6ec;border-left:2mm solid #f28c28;padding:4mm 5mm;font-size:10pt;margin-top:8mm}
      footer{border-top:1px solid #dfe6ef;padding:5mm 16mm 9mm;font-size:8pt;color:#5b6b80;display:flex;justify-content:space-between}
      .stampa{position:fixed;right:12px;bottom:12px;background:#f28c28;color:#fff;border:0;border-radius:999px;padding:12px 18px;font-size:15px}@media print{.stampa{display:none}}</style></head><body>
      <div class="pag"><header><img src="${location.origin + location.pathname.replace(/[^/]*$/, "")}img/logo-negativo.png" alt="AncheCasa"><div>Report mensile<br>${nomeMese(ym)}</div></header><div class="fascia"></div>
      <main><h1>Il tuo mese con AncheCasa</h1><p class="sub">${esc(o.nome || "")} · ${nomeMese(ym)}</p>
      <div class="kpi">${VOCI_REPORT(n).map(([t, v, s]) => `<div class="k"><b>${v}</b><span>${t}${s ? "<br>" + esc(s) : ""}</span></div>`).join("")}</div>
      <h2>Lavoro dalla piattaforma</h2>${barra("Richieste nuove", n.richieste, "#9fb3c8")}${barra("Offerte fatte", n.offerte, "#0f2a4a")}${barra("Offerte vinte", n.offerte_vinte, "#f28c28")}${barra("Preventivi fatti", n.preventivi, "#3d6a9a")}
      <div class="nota">${n.offerte_vinte ? "Questo mese hai vinto " + pl(n.offerte_vinte, "offerta", "offerte") + (n.valore_vinte ? " per " + euro(n.valore_vinte) : "") + "." : n.richieste ? "Ci sono state " + pl(n.richieste, "richiesta nuova", "richieste nuove") + ": rispondi entro 48 ore, chi risponde prima vince più spesso." : "Completa il profilo e il listino: le imprese ti trovano quando cercano nella tua zona."} Per qualsiasi dubbio scrivi al tuo referente AncheCasa.</div></main>
      <footer><span>AncheCasa · Palumbo Investment S.r.l.</span><span>anchecasa.it</span></footer></div>
      <button class="stampa" onclick="print()">Salva in PDF</button></body></html>`);
    w.document.close();
  };
}
