/* Admin AncheCasa: tutte le divisioni. (SuperMastro, artigiani, passaggi e segnalazioni dei privati
   sono nella parte 1; qui il resto: aziende e moduli, GC, AncheSicura, rete, economia, impostazioni.) */
import { I, esc, voce, lista, sez, stato, num, btn, campo, vuoto, avviso, virgola, quando, toast, foglio, chiudiFoglio, spiegaErrore } from "./ui.js";
import { Q } from "./q.js";
import { euro } from "./schede.js";
import { MODULI, PREZZI_PREDEFINITI, REGIONI } from "./catalogo.js";
import { RUOLI_RETE } from "./viste-rete.js";

export function installa(core) {
  const { S, V, AZIONI, FORM, PROFILI, vai, render } = core;
  V["ad-sm"] = V["ad-home"]; // il cruscotto di SuperMastro della parte 1
  PROFILI.admin = { tabs: [["ad-home", "grafico", "Cruscotto"], ["ad-aziende", "ufficio", "Aziende"], ["ad-dafare", "campana", "Da fare", true], ["ad-rete", "rete", "Rete"], ["profilo", "utente", "Profilo"]] };
  const tile = (ico, t, s, go) => `<div class="tile" data-go="${esc(go)}" role="button" tabindex="0"><span class="ico blu">${I[ico]}</span><b>${t}</b>${s ? `<small>${s}</small>` : ""}</div>`;
  const MOD_NOMI = Object.fromEntries([["base", "Abbonamento"], ...MODULI.map((m) => [m.id, m.nome]), ["pacchetto", "Tutti i moduli"]]);
  const prezzoDi = (pr, modulo, tipo) => (modulo === "base" ? pr["base_" + (tipo || "impresa")] : pr[modulo]);

  V["ad-home"] = async () => {
    const [n1, n2] = await Promise.all([core.DB.numeri().catch(() => ({})), Q.rpc("app_numeri_admin2").catch(() => null)]);
    const n = n2 || {};
    const rete = n.rete || {};
    return {
      t: "Cruscotto",
      h: `<div class="pad">${n2 ? "" : avviso("Le tabelle della parte 2 non sono ancora nel database: esegui app-02-completa.sql.", "rosso") + '<div style="height:12px"></div>'}
        <div class="griglia2">${num(euro(n.canoni_mese) || "0 €", "Canoni dei moduli al mese", "verde")}${num(n.aziende ?? "–", "Aziende iscritte")}${num(n1.analisi_30g ?? "–", "Video SuperMastro (30 gg)")}${num(euro(n.provvigioni_maturate) || "0 €", "Provvigioni da pagare", "giallo")}</div><div style="height:16px"></div>
        ${sez("Le divisioni", `<div class="griglia2">
          ${tile("gru", "AncheCasa GC", `${n.cantieri_gc ?? 0} cantieri`, "ad-gc")}
          ${tile("scudo", "AncheSicura", `${n.aziende_sicurezza ?? 0} aziende · ${n.ordini_richiesti ?? 0} ordini`, "ad-sicura")}
          ${tile("video", "SuperMastro", `${n1.artigiani_verificati ?? 0} artigiani`, "ad-sm")}
          ${tile("tel", "AncheVoice", "Centralino", "ad-voice")}
          ${tile("gara", "Gare e lotti", `${n.gare ?? 0} gare · ${n.lotti_aperti ?? 0} lotti aperti`, "ad-gare")}
          ${tile("rete", "Rete commerciale", `${Object.values(rete).reduce((a, b) => a + b, 0)} persone`, "ad-rete")}
          ${tile("stella", "Recensioni", "Report per impresa e lavoro", "report-rec")}
          ${tile("euro", "Economia", "Canoni, ordini, provvigioni", "ad-economia")}</div>`)}
        ${sez("Impostazioni", lista([voce("kit", "Prezzi e percentuali", "Moduli, provvigioni, rivendita, premio segnalatori", "ad-impostazioni", "blu")]))}</div>`,
    };
  };

  V["ad-dafare"] = async () => {
    const [n1, n2] = await Promise.all([core.DB.numeri().catch(() => ({})), Q.rpc("app_numeri_admin2").catch(() => ({}))]);
    const r = (ico, t, x, go) => voce(ico, t, x ? `${x} da fare` : "Niente da fare", go, x ? "giallo" : "verde");
    return {
      t: "Da fare",
      h: `<div class="pad">${lista([
        r("griglia", "Moduli da attivare", n2.moduli_richiesti, "ad-moduli"),
        r("corso", "Ordini AncheSicura", n2.ordini_richiesti, "ad-ordini"),
        r("euro", "Rivendite delle aziende", n2.rivendite_richieste, "ad-rivendite"),
        r("rete", "Vendite della rete da confermare", n2.vendite_proposte, "ad-vendite"),
        r("kit", "Artigiani da verificare", n1.artigiani_attesa, "ad-artigiani"),
        r("ufficio", "Passaggi da artigiano a Impresa", n1.passaggi_attesa, "ad-passaggi"),
        r("rete", "Segnalazioni dei privati", n1.segnalazioni_nuove, "ad-segnalazioni"),
        r("allarme", "Segnalazioni dei clienti nei cantieri", n2.segnalazioni_cantiere, "ad-segn-cantieri"),
        r("doc", "Richieste dai siti AncheCasa e AncheSicura", n2.contatti_nuovi, "ad-contatti"),
      ])}</div>`,
    };
  };

  /* ---------------- Richieste dai siti ---------------- */
  const TIPI_C = { iscrizione: "Iscrizione", contatto: "Contatto", sopralluogo: "Sopralluogo", opportunita: "Opportunità", rete_sicura: "Società per la rete AncheSicura", offerta_sicura: "Offerta AncheSicura", corso: "Corso", albo: "Albo general contractor", lavora: "Lavora con noi", partner: "Partner", agente: "Agente" };
  V["ad-contatti"] = async (filtro) => {
    filtro = filtro || "nuovo";
    const l = await Q.sel("app_contatti", { eq: { stato: filtro }, ord: ["creato", false], lim: 200 }).catch(() => []);
    const pill = (k, t) => `<button type="button" class="pillola ${k === filtro ? "on" : ""}" data-go="ad-contatti/${k}">${t}</button>`;
    return {
      t: "Richieste dai siti",
      h: `<div class="pad"><div class="pillole">${pill("nuovo", "Nuove")}${pill("in_corso", "In corso")}${pill("fatto", "Fatte")}${pill("scartato", "Scartate")}</div><div style="height:12px"></div>
        ${l.length ? l.map((x) => `<div class="card"><b>${esc(x.nome)}</b><p>${esc(TIPI_C[x.tipo] || x.tipo)} · sito ${esc(x.sito)} · ${quando(x.creato)}</p>
          <p>${x.telefono ? `<a href="tel:${esc(x.telefono.replace(/[^\d+]/g, ""))}">${esc(x.telefono)}</a>` : ""}${x.telefono && x.email ? " · " : ""}${x.email ? `<a href="mailto:${esc(x.email)}">${esc(x.email)}</a>` : ""}</p>
          ${Object.keys(x.dati || {}).length ? `<dl class="campi" style="margin-top:8px">${Object.entries(x.dati).slice(0, 20).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(typeof v === "string" ? v : JSON.stringify(v))}</dd>`).join("")}</dl>` : ""}
          <div class="btns">${["in_corso", "fatto", "scartato"].filter((s) => s !== x.stato).map((s) => btn({ in_corso: "Prendo in carico", fatto: "Fatto", scartato: "Scarta" }[s], "ad-contatto:" + x.id + ":" + s, "piccolo chiaro")).join("")}</div></div>`).join("") : vuoto("Niente qui.")}</div>`,
    };
  };
  AZIONI["ad-contatto:"] = async (arg) => { const [id, st] = arg.split(":"); await Q.upd("app_contatti", { id }, { stato: st }); toast("Fatto."); render(); };

  /* ---------------- Aziende e moduli ---------------- */
  V["ad-aziende"] = async (filtro) => {
    filtro = filtro || "tutte";
    const o = await Q.sel("app_org", { ord: ["creato", false], lim: 1000 });
    const l = o.filter((x) => filtro === "tutte" || x.tipo === filtro);
    const T = { impresa: "Impresa", fornitore: "Fornitore", partner: "Partner", consulente: "Consulente", gc: "AncheCasa GC" };
    const pill = (k, t) => `<button type="button" class="pillola ${k === filtro ? "on" : ""}" data-go="ad-aziende/${k}">${t}</button>`;
    return {
      t: "Aziende",
      h: `<div class="pad"><div class="pillole">${pill("tutte", "Tutte")}${pill("impresa", "Imprese")}${pill("partner", "Partner")}${pill("fornitore", "Fornitori")}</div><div style="height:12px"></div>
        ${l.length ? lista(l.map((x) => voce(x.tipo === "fornitore" ? "box" : "ufficio", esc(x.nome), `${T[x.tipo]} · ${esc(x.citta || "")}${x.regione ? " · " + esc(x.regione) : ""}`, "ad-azienda/" + x.id, x.stato === "attiva" ? "" : "rosso", x.stato === "attiva" ? "" : stato("rosso", "Sospesa")))) : vuoto("Nessuna azienda.")}</div>`,
    };
  };
  V["ad-azienda"] = async (id) => {
    const [o, mod, membri, pr] = await Promise.all([Q.uno("app_org", { id }), Q.sel("app_moduli", { eq: { org: id } }), Q.sel("app_org_membri", { eq: { org: id } }), prezzi()]);
    if (!o) return { t: "Azienda", h: vuoto("Non trovata.") };
    const stM = (m) => (mod.find((x) => x.modulo === m) || {}).stato || "";
    const R = { titolare: "Titolare", responsabile: "Responsabile", operatore: "Lavoratore", consulente: "Consulente" };
    return {
      t: o.nome,
      h: `<div class="pad"><div class="card"><dl class="campi"><dt>Tipo</dt><dd>${esc(o.tipo)}</dd><dt>P.IVA</dt><dd>${esc(o.piva || "–")}</dd><dt>Dove</dt><dd>${esc([o.citta, o.regione].filter(Boolean).join(", "))}</dd><dt>Contatti</dt><dd>${esc([o.telefono, o.email].filter(Boolean).join(" · ") || "–")}</dd></dl></div><div style="height:12px"></div>
        ${o.tipo !== "gc" ? `<div class="btns">${btn(o.tipo === "partner" ? "Togli partner" : "Rendi partner", "ad-tipo:" + id + ":" + (o.tipo === "partner" ? "impresa" : "partner"), "piccolo chiaro")}${btn(o.stato === "attiva" ? "Sospendi" : "Riattiva", "ad-stato-org:" + id + ":" + (o.stato === "attiva" ? "sospesa" : "attiva"), "piccolo chiaro")}</div><div style="height:12px"></div>` : ""}
        ${sez("Abbonamento e moduli", lista(["base", "pacchetto", ...MODULI.filter((m) => !m.compreso).map((m) => m.id)].map((m) => {
          const s = stM(m);
          const az = s === "attivo" ? btn("Sospendi", "ad-modulo:" + id + ":" + m + ":sospeso", "piccolo chiaro") : btn("Attiva", "ad-modulo:" + id + ":" + m + ":attivo", "piccolo");
          return voce("griglia", esc(MOD_NOMI[m]), (s ? s : "non attivo") + " · " + euro(prezzoDi(pr, m, o.tipo)) + "/mese", null, s === "attivo" ? "verde" : s === "richiesto" ? "giallo" : "", az);
        })))}
        ${sez("Persone", lista(membri.map((m) => voce("utente", esc(m.nome || R[m.ruolo]), R[m.ruolo], null, "blu"))))}
        ${sez("Aggiungi un consulente AncheSicura", `<form data-form="ad-consulente" data-org="${esc(id)}" novalidate>${campo("Mail del consulente (deve avere già l'account)", `<input name="email" type="email" required>`)}<button class="btn chiaro" type="submit">Aggiungi</button></form>`)}</div>`,
    };
  };
  let _prezzi = null;
  async function prezzi() { if (_prezzi) return _prezzi; const x = await Q.uno("app_impostazioni", { chiave: "prezzi_moduli" }).catch(() => null); _prezzi = Object.assign({}, PREZZI_PREDEFINITI, x ? x.valore : {}); return _prezzi; }
  AZIONI["ad-modulo:"] = async (arg) => {
    const [org, modulo, st] = arg.split(":");
    const pr = await prezzi();
    const esiste = await Q.uno("app_moduli", { org, modulo });
    const o = await Q.uno("app_org", { id: org });
    const patch = st === "attivo" ? { stato: "attivo", prezzo_mese: (esiste && esiste.prezzo_mese) ?? prezzoDi(pr, modulo, o && o.tipo) ?? null, attivo_dal: new Date().toISOString().slice(0, 10) } : { stato: st };
    if (esiste) await Q.upd("app_moduli", { org, modulo }, patch); else await Q.ins("app_moduli", Object.assign({ org, modulo }, patch));
    toast(st === "attivo" ? "Modulo attivato." : "Fatto."); render();
  };
  AZIONI["ad-tipo:"] = async (arg) => { const [id, tipo] = arg.split(":"); await Q.upd("app_org", { id }, { tipo }); toast("Fatto."); render(); };
  AZIONI["ad-stato-org:"] = async (arg) => { const [id, st] = arg.split(":"); await Q.upd("app_org", { id }, { stato: st }); toast("Fatto."); render(); };
  FORM["ad-consulente"] = async (f) => {
    const u = await Q.rpc("app_utente_da_mail", { p_email: f.email.value.trim() });
    if (!u) return toast("Nessun account con questa mail: prima deve iscriversi all'app.", "errore");
    await Q.ins("app_org_membri", { org: f.dataset.org, utente: u, ruolo: "consulente", nome: f.email.value.trim().split("@")[0] });
    toast("Consulente aggiunto."); render();
  };

  V["ad-moduli"] = async () => {
    const [m, o, pr] = await Promise.all([Q.sel("app_moduli", { eq: { stato: "richiesto" }, ord: ["richiesto", false] }), Q.sel("app_org", { lim: 1000 }), prezzi()]);
    const nome = (id) => (o.find((x) => x.id === id) || {}).nome || "Azienda";
    return { t: "Moduli da attivare", h: `<div class="pad">${avviso("Attiva dopo aver ricevuto il pagamento annuale.")}<div style="height:12px"></div>${m.length ? lista(m.map((x) => voce("griglia", esc(nome(x.org)) + " · " + esc(MOD_NOMI[x.modulo]), euro(x.prezzo_mese ?? prezzoDi(pr, x.modulo, (o.find((y) => y.id === x.org) || {}).tipo)) + "/mese · chiesto " + quando(x.richiesto), "ad-azienda/" + x.org, "giallo", btn("Attiva", "ad-modulo:" + x.org + ":" + x.modulo + ":attivo", "piccolo")))) : vuoto("Nessuna richiesta.")}</div>` };
  };

  /* ---------------- AncheCasa GC ---------------- */
  V["ad-gc"] = async () => {
    const gc = ((S.miei && S.miei.org) || []).find((o) => o.tipo === "gc");
    if (gc) { core.scegliProfilo("impresa:" + gc.id); vai("im-home", true); return { h: "" }; }
    return { t: "AncheCasa GC", h: `<div class="pad"><div class="eroe"><h3>AncheCasa general contractor</h3><p>Crea l'azienda AncheCasa GC: da lì apri i cantieri, inviti il proprietario e le imprese partner, segui SAL e segnalazioni.</p>${btn("Crea AncheCasa GC", "ad-crea-gc")}</div></div>` };
  };
  AZIONI["ad-crea-gc"] = async () => {
    const o = await Q.ins("app_org", { nome: "AncheCasa General Contractor", tipo: "gc", titolare: S.utente.id, regione: "Lazio" });
    await Q.ins("app_moduli", { org: o.id, modulo: "pacchetto", stato: "attivo", prezzo_mese: 0, attivo_dal: new Date().toISOString().slice(0, 10) });
    await core.caricaProfili(); core.scegliProfilo("impresa:" + o.id); vai("im-home", true);
  };
  V["ad-segn-cantieri"] = async () => {
    const l = await Q.sel("app_record", { eq: { tipo: "segnalazione_cliente" }, ord: ["creato", false], lim: 200 });
    return { t: "Segnalazioni dei clienti", h: `<div class="pad">${l.length ? lista(l.map((r) => core.rigaScheda(r))) : vuoto("Nessuna segnalazione.")}</div>` };
  };

  /* ---------------- AncheSicura ---------------- */
  V["ad-sicura"] = async () => {
    const [m, membri, o, ord] = await Promise.all([Q.sel("app_moduli", { eq: { stato: "attivo" } }), Q.sel("app_org_membri", { eq: { ruolo: "consulente" }, lim: 1000 }), Q.sel("app_org", { lim: 1000 }), Q.sel("app_ordini", { eq: { stato: "richiesto" } })]);
    const az = new Set(m.filter((x) => ["sicurezza", "pacchetto"].includes(x.modulo)).map((x) => x.org));
    const nome = (id) => (o.find((x) => x.id === id) || {}).nome || "";
    return {
      t: "AncheSicura",
      h: `<div class="pad"><div class="griglia2">${num(az.size, "Aziende con il modulo")}${num(new Set(membri.map((x) => x.utente)).size, "Consulenti al lavoro")}${num(ord.length, "Ordini da gestire", ord.length ? "giallo" : "")}</div><div style="height:14px"></div>
        ${lista([voce("corso", "Ordini di corsi e servizi", `${ord.length} da gestire`, "ad-ordini", ord.length ? "giallo" : "verde"), voce("euro", "Rivendite delle aziende (30%)", "", "ad-rivendite", "blu"), voce("corso", "Listino", "Prezzi di corsi e servizi", "corsi-listino", "blu")])}
        ${sez("Aziende seguite", lista([...az].map((id) => { const c = membri.filter((x) => x.org === id); return voce("ufficio", esc(nome(id)), c.length ? "Consulente: " + esc(c.map((x) => x.nome).join(", ")) : "Senza consulente", "ad-azienda/" + id, c.length ? "verde" : "giallo"); })) || vuoto("Nessuna."))}</div>`,
    };
  };
  V["ad-ordini"] = async () => {
    const [o, org] = await Promise.all([Q.sel("app_ordini", { ord: ["creato", false], lim: 300 }), Q.sel("app_org", { lim: 1000 })]);
    const nome = (id) => (org.find((x) => x.id === id) || {}).nome || "Privato";
    const ST = { richiesto: "giallo", confermato: "blu", svolto: "verde", annullato: "rosso" };
    return {
      t: "Ordini AncheSicura",
      h: `<div class="pad">${o.length ? o.map((x) => `<div class="card"><div class="riga"><div class="cresci"><b>${esc(x.voce)}</b><small>${esc(nome(x.org))} · ${x.quantita} × ${euro(x.prezzo)} = ${euro(x.prezzo * x.quantita)}${x.codice_venditore ? " · codice " + esc(x.codice_venditore) : ""} · ${quando(x.creato)}</small>${x.note ? `<small>«${esc(x.note)}»</small>` : ""}</div>${stato(ST[x.stato], x.stato)}</div>
        ${x.stato === "richiesto" ? `<div class="btns">${btn("Conferma", "ad-ordine-conf:" + x.id, "piccolo")}${btn("Annulla", "ad-ordine:" + x.id + ":annullato", "piccolo chiaro")}</div>` : x.stato === "confermato" ? `<div class="btns">${btn("Fatto", "ad-ordine:" + x.id + ":svolto", "piccolo chiaro")}</div>` : ""}</div>`).join("") : vuoto("Nessun ordine.")}
        <p class="sotto piccolo">Confermando un ordine con il codice di un venditore, nasce la vendita e maturano le provvigioni.</p></div>`,
    };
  };
  AZIONI["ad-ordine-conf:"] = async (id) => { try { await Q.rpc("app_conferma_ordine", { p_ordine: id }); toast("Confermato."); render(); } catch (e) { toast(spiegaErrore(e), "errore"); } };
  AZIONI["ad-ordine:"] = async (arg) => { const [id, st] = arg.split(":"); await Q.upd("app_ordini", { id }, { stato: st }); toast("Fatto."); render(); };
  V["ad-rivendite"] = async () => {
    const [r, org] = await Promise.all([Q.sel("app_rivendite", { ord: ["creato", false], lim: 300 }), Q.sel("app_org", { lim: 1000 })]);
    const nome = (id) => (org.find((x) => x.id === id) || {}).nome || "";
    const PROSSIMO = { richiesta: ["confermata", "Confermata"], confermata: ["pagata", "Il cliente ha pagato"], pagata: ["quota_pagata", "Quota pagata all'azienda"] };
    return {
      t: "Rivendite delle aziende",
      h: `<div class="pad">${r.length ? r.map((x) => `<div class="card"><b>${esc(nome(x.org))} → ${esc(x.cliente_nome)}</b><p>${esc(x.servizio)} · ${euro(x.importo)} · quota ${virgola(x.percentuale, 0)}% = ${euro(x.importo * x.percentuale / 100)}${x.cliente_contatto ? " · " + esc(x.cliente_contatto) : ""}</p><p>${stato(x.stato === "quota_pagata" ? "verde" : x.stato === "annullata" ? "rosso" : "giallo", x.stato.replace("_", " "))}</p>
        ${PROSSIMO[x.stato] ? `<div class="btns">${btn(PROSSIMO[x.stato][1], "ad-rivendita:" + x.id + ":" + PROSSIMO[x.stato][0], "piccolo")}${btn("Annulla", "ad-rivendita:" + x.id + ":annullata", "piccolo chiaro")}</div>` : ""}</div>`).join("") : vuoto("Nessuna rivendita.")}</div>`,
    };
  };
  AZIONI["ad-rivendita:"] = async (arg) => { const [id, st] = arg.split(":"); await Q.upd("app_rivendite", { id }, { stato: st }); toast("Fatto."); render(); };

  /* ---------------- AncheVoice, gare e lotti ---------------- */
  V["ad-voice"] = async () => {
    const m = await Q.sel("app_moduli", { in: { modulo: ["centralino", "pacchetto"] }, eq: { stato: "attivo" } });
    return { t: "AncheVoice", h: `<div class="pad"><div class="griglia2">${num(new Set(m.map((x) => x.org)).size, "Aziende con il centralino")}</div><div style="height:12px"></div>${avviso("Il collegamento dei numeri AncheVoice al centralino vero si fa a parte: qui le aziende tengono il registro delle chiamate.")}</div>` };
  };
  V["ad-gare"] = async () => {
    const n = await Q.rpc("app_numeri_admin2").catch(() => ({}));
    const lotti = await Q.sel("app_record", { eq: { tipo: "lotto", pubblico: true, stato: "aperto" } });
    return { t: "Gare e lotti", h: `<div class="pad"><div class="griglia2">${num(n.gare ?? 0, "Gare seguite")}${num(n.gare_vinte ?? 0, "Gare vinte", "verde")}${num(n.lotti_aperti ?? 0, "Lotti aperti")}</div><div style="height:14px"></div>${sez("Lotti aperti", lotti.length ? lista(lotti.map((l) => core.rigaScheda(l))) : vuoto("Nessuno."))}</div>` };
  };

  /* ---------------- Rete commerciale ---------------- */
  V["ad-rete"] = async () => {
    const [r, inv] = await Promise.all([Q.sel("app_rete", { lim: 1000 }), Q.sel("app_inviti", { eq: { cosa: "rete", stato: "inviato" } }).catch(() => [])]);
    const nome = (u) => (r.find((x) => x.utente === u) || {}).nome || "";
    const gruppo = (ruolo) => r.filter((x) => x.ruolo === ruolo);
    return {
      t: "Rete commerciale",
      h: `<div class="pad"><div class="griglia2">${["reteitalia", "sviluppo", "capoarea", "agente", "subagente"].map((k) => num(gruppo(k).length, RUOLI_RETE[k])).join("")}</div><div style="height:12px"></div>
        ${lista([voce("euro", "Vendite da confermare", "Quando il cliente paga", "ad-vendite", "giallo"), voce("euro", "Provvigioni da pagare", "", "ad-provvigioni", "blu")])}
        ${["reteitalia", "sviluppo", "capoarea", "agente", "subagente"].map((k) => gruppo(k).length ? sez(RUOLI_RETE[k], lista(gruppo(k).map((x) => voce("rete", esc(x.nome || x.codice), `${x.area || ""}${x.regione ? " · " + esc(x.regione) : ""}${x.superiore ? " · sotto " + esc(nome(x.superiore)) : ""} · codice ${esc(x.codice)}`, "ad-persona-rete/" + x.utente, x.stato === "attivo" ? "verde" : "rosso")))) : "").join("")}
        ${sez("Invita nella rete", `<form data-form="ad-invita-rete" novalidate>${campo("Ruolo", `<select name="ruolo">${Object.entries(RUOLI_RETE).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>`)}${campo("Nome", `<input name="nome" maxlength="80">`)}${campo("Mail", `<input name="email" type="email" required>`)}<button class="btn" type="submit">Crea l'invito</button></form><p class="sotto piccolo">Il Responsabile Rete Italia lo crei solo tu (anche gli sviluppo rete, se serve). Poi ognuno invita il livello sotto: Rete Italia → sviluppo rete → capoarea → agente → sub-agente.</p>`)}
        ${inv.length ? sez("Inviti in attesa", lista(inv.map((i) => voce("campana", esc(i.email), RUOLI_RETE[i.ruolo], null, "giallo", btn("Link", "link-invito:" + i.token, "piccolo chiaro"))))) : ""}</div>`,
    };
  };
  FORM["ad-invita-rete"] = async (f) => {
    const email = f.email.value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast("Controlla la mail.", "errore");
    const i = await Q.ins("app_inviti", { cosa: "rete", ruolo: f.ruolo.value, email, nome: f.nome.value.trim() });
    core.mostraInvito(i);
  };
  V["ad-persona-rete"] = async (u) => {
    const [x, tutti] = await Promise.all([Q.uno("app_rete", { utente: u }), Q.sel("app_rete", { lim: 1000 })]);
    if (!x) return { t: "Rete", h: vuoto("Non trovato.") };
    const sopra = { capoarea: "sviluppo", agente: "capoarea", subagente: "agente" }[x.ruolo];
    return {
      t: x.nome || RUOLI_RETE[x.ruolo],
      h: `<div class="pad"><form data-form="ad-rete-salva" data-u="${esc(u)}" novalidate>
        ${campo("Ruolo", `<select name="ruolo">${Object.entries(RUOLI_RETE).map(([k, v]) => `<option value="${k}" ${k === x.ruolo ? "selected" : ""}>${v}</option>`).join("")}</select>`)}
        ${campo("Area", `<select name="area">${["", "Nord", "Centro", "Sud e isole"].map((a) => `<option ${a === x.area ? "selected" : ""}>${a}</option>`).join("")}</select>`)}
        ${campo("Regione", `<select name="regione"><option value=""></option>${REGIONI.map((r) => `<option ${r === x.regione ? "selected" : ""}>${r}</option>`).join("")}</select>`)}
        ${sopra ? campo("Sotto a", `<select name="superiore"><option value="">—</option>${tutti.filter((t) => t.ruolo === sopra).map((t) => `<option value="${esc(t.utente)}" ${t.utente === x.superiore ? "selected" : ""}>${esc(t.nome || t.codice)}</option>`).join("")}</select>`) : ""}
        ${campo("Stato", `<select name="stato"><option value="attivo" ${x.stato === "attivo" ? "selected" : ""}>Attivo</option><option value="sospeso" ${x.stato === "sospeso" ? "selected" : ""}>Sospeso (revocato)</option></select>`)}
        <button class="btn" type="submit">Salva</button></form>
        <p class="sotto piccolo">Codice ${esc(x.codice)}${x.accordo_firmato ? " · accordo firmato il " + new Date(x.accordo_firmato).toLocaleDateString("it-IT") : ""}. Se lo sospendi, i clienti che ha portato restano.</p></div>`,
    };
  };
  FORM["ad-rete-salva"] = async (f) => {
    const patch = { ruolo: f.ruolo.value, area: f.area.value, regione: f.regione.value, stato: f.stato.value };
    if (f.superiore) patch.superiore = f.superiore.value || null;
    await Q.upd("app_rete", { utente: f.dataset.u }, patch); toast("Salvato."); history.back();
  };
  V["ad-vendite"] = async () => {
    const [v, r] = await Promise.all([Q.sel("app_vendite", { ord: ["creato", false], lim: 500 }), Q.sel("app_rete", { lim: 1000 })]);
    const nome = (u) => (r.find((x) => x.utente === u) || {}).nome || "";
    const l = v.filter((x) => x.stato === "proposta");
    return { t: "Vendite da confermare", h: `<div class="pad">${l.length ? l.map((x) => `<div class="card"><b>${esc(x.cliente_nome)}</b><p>${esc(x.dettaglio || x.cosa)} · ${euro(x.importo)}${x.tipo_importo === "mese" ? "/mese" : ""} · di ${esc(nome(x.venditore))} · ${quando(x.creato)}</p><div class="btns">${btn("Pagato: conferma", "ad-vendita:" + x.id + ":attiva", "piccolo")}${btn("Persa", "ad-vendita:" + x.id + ":persa", "piccolo chiaro")}</div></div>`).join("") : vuoto("Nessuna vendita da confermare.")}</div>` };
  };
  AZIONI["ad-vendita:"] = async (arg) => { const [id, st] = arg.split(":"); await Q.upd("app_vendite", { id }, { stato: st }); toast(st === "attiva" ? "Confermata: provvigioni maturate." : "Fatto."); render(); };
  V["ad-provvigioni"] = async () => {
    const [p, r] = await Promise.all([Q.sel("app_provvigioni", { eq: { stato: "maturata" }, ord: ["creato", false], lim: 1000 }), Q.sel("app_rete", { lim: 1000 })]);
    const per = {};
    p.forEach((x) => { per[x.beneficiario] = (per[x.beneficiario] || 0) + Number(x.importo); });
    const nome = (u) => (r.find((x) => x.utente === u) || {}).nome || "";
    return { t: "Provvigioni da pagare", h: `<div class="pad">${Object.keys(per).length ? lista(Object.entries(per).map(([u, t]) => voce("euro", esc(nome(u)), euro(t), null, "giallo", btn("Pagate", "ad-paga:" + u, "piccolo")))) : vuoto("Niente da pagare.")}</div>` };
  };
  AZIONI["ad-paga:"] = async (u) => { await Q.upd("app_provvigioni", { beneficiario: u, stato: "maturata" }, { stato: "pagata" }); toast("Segnate come pagate."); render(); };

  /* ---------------- Economia e impostazioni ---------------- */
  V["ad-economia"] = async () => {
    const [m, o, riv, prov, org] = await Promise.all([Q.sel("app_moduli", { eq: { stato: "attivo" }, lim: 2000 }), Q.sel("app_ordini", { lim: 2000 }), Q.sel("app_rivendite", { lim: 2000 }), Q.sel("app_provvigioni", { lim: 5000 }), Q.sel("app_org", { lim: 2000 })]);
    const canoni = m.reduce((s, x) => s + Number(x.prezzo_mese || 0), 0);
    const ordini = o.filter((x) => ["confermato", "svolto"].includes(x.stato)).reduce((s, x) => s + x.prezzo * x.quantita, 0);
    const quote = riv.filter((x) => ["pagata"].includes(x.stato)).reduce((s, x) => s + x.importo * x.percentuale / 100, 0);
    const pDa = prov.filter((x) => x.stato === "maturata").reduce((s, x) => s + Number(x.importo), 0);
    const perModulo = {};
    m.forEach((x) => { perModulo[x.modulo] = (perModulo[x.modulo] || 0) + 1; });
    return {
      t: "Economia",
      h: `<div class="pad"><div class="griglia2">${num(euro(canoni) || "0 €", "Canoni al mese", "verde")}${num(euro(canoni * 12) || "0 €", "Canoni all'anno")}${num(euro(ordini) || "0 €", "Ordini AncheSicura")}${num(euro(riv.filter((x) => x.stato !== "annullata").reduce((s, x) => s + Number(x.importo), 0)) || "0 €", "Rivendite")}${num(euro(quote) || "0 €", "Quote da pagare alle aziende", "giallo")}${num(euro(pDa) || "0 €", "Provvigioni da pagare", "giallo")}</div><div style="height:14px"></div>
        ${sez("Moduli attivi", lista(Object.entries(perModulo).map(([k, n]) => voce("griglia", esc(MOD_NOMI[k] || k), n + " aziende", null, "blu"))) || vuoto("Nessuno."))}
        <p class="sotto piccolo">${org.length} aziende in tutto. I pagamenti si registrano a mano: l'app non incassa.</p></div>`,
    };
  };
  V["ad-impostazioni"] = async () => {
    const tutte = await Q.sel("app_impostazioni");
    const v = (k) => (tutte.find((x) => x.chiave === k) || {}).valore || {};
    const pm = Object.assign({}, PREZZI_PREDEFINITI, v("prezzi_moduli")), pv = v("provvigioni"), riv = v("rivendita"), seg = v("segnalazioni"), pas = v("passaggio_impresa");
    const n = (name, val, step) => `<input name="${name}" type="number" step="${step || "0.01"}" min="0" value="${esc(val ?? "")}">`;
    return {
      t: "Prezzi e percentuali",
      h: `<div class="pad"><form data-form="ad-impostazioni" novalidate>
        ${sez("Abbonamenti (€ al mese)", `<div class="griglia2">${[["base_artigiano", "Artigiano"], ["base_impresa", "Impresa"], ["base_partner", "Impresa partner"], ["base_fornitore", "Fornitore"]].map(([k, t]) => campo(t, n("pm_" + k, pm[k]))).join("")}</div>`)}
        ${sez("Moduli in più (€ al mese)", `<div class="griglia2">${["pacchetto", ...MODULI.filter((m) => !m.compreso).map((m) => m.id)].map((k) => campo(MOD_NOMI[k], n("pm_" + k, pm[k]))).join("")}</div>`)}
        ${sez("Provvigioni della rete (%)", `<div class="griglia2">${campo("Quota della rete sul venduto", n("pv_percentuale_vendita", pv.percentuale_vendita, "0.1"))}${campo("A chi porta il cliente", n("pv_chi_porta", pv.chi_porta ?? 70, "1"))}${campo("Allo sviluppo rete", n("pv_sviluppo", pv.sviluppo, "1"))}${campo("Al capo area", n("pv_capoarea", pv.capoarea, "1"))}${campo("Al Responsabile Rete Italia", n("pv_reteitalia", pv.reteitalia ?? 5, "1"))}${campo("Sub-agente: sua parte", n("pv_subagente", pv.subagente, "1"))}${campo("Sub-agente: al suo agente", n("pv_agente", pv.agente, "1"))}</div>`)}
        ${sez("Rivendita della sicurezza", campo("Quota all'azienda che vende (%)", n("riv_percentuale", riv.percentuale, "1")))}
        ${sez("Segnalatori privati", campo("Premio (testo che vede il privato)", `<input name="seg_premio" maxlength="200" value="${esc(seg.premio || "")}" placeholder="Es. 100 € se il lavoro parte">`))}
        ${sez("Da artigiano a Impresa", `<div class="griglia2">${campo("Lavori minimi", n("pas_interventi", pas.interventi, "1"))}${campo("Media minima", n("pas_media", pas.media, "0.1"))}</div>`)}
        <button class="btn" type="submit">Salva</button></form></div>`,
    };
  };
  FORM["ad-impostazioni"] = async (f) => {
    const num = (k) => (f.elements[k].value === "" ? null : Number(f.elements[k].value));
    const pm = { ufficio: 0 }; ["base_artigiano", "base_impresa", "base_partner", "base_fornitore", "pacchetto", ...MODULI.filter((m) => !m.compreso).map((m) => m.id)].forEach((k) => { pm[k] = num("pm_" + k); });
    const righe = [
      { chiave: "prezzi_moduli", valore: pm },
      { chiave: "provvigioni", valore: { percentuale_vendita: num("pv_percentuale_vendita"), chi_porta: num("pv_chi_porta"), sviluppo: num("pv_sviluppo"), capoarea: num("pv_capoarea"), reteitalia: num("pv_reteitalia"), subagente: num("pv_subagente"), agente: num("pv_agente") } },
      { chiave: "rivendita", valore: { percentuale: num("riv_percentuale") } },
      { chiave: "segnalazioni", valore: { premio: f.seg_premio.value.trim() } },
      { chiave: "passaggio_impresa", valore: { interventi: num("pas_interventi"), media: num("pas_media") } },
    ];
    for (const r of righe) await Q.upd("app_impostazioni", { chiave: r.chiave }, { valore: r.valore, aggiornato: new Date().toISOString() });
    _prezzi = null; toast("Salvato.");
  };
}
