/* Aziende: impresa (con i moduli), fornitore, impresa partner, lavoratore, consulente AncheSicura,
   proprietario del cantiere. Le schede vere e proprie le disegna il motore (schede.js). */
import { I, esc, voce, lista, sez, stato, num, btn, campo, vuoto, avviso, virgola, quando, toast, foglio, chiudiFoglio, spiegaErrore, telLink } from "./ui.js";
import { Q } from "./q.js";
import { TIPI, R, euro, giornoIt, semaforo, semaforoDipendente, statoScheda } from "./schede.js";
import { MODULI, PREZZI_PREDEFINITI, REGIONI, BASE } from "./catalogo.js";

export function installa(core) {
  const { S, V, AZIONI, FORM, PROFILI, PROFILO_EXTRA, vai, render, HOOK } = core;
  PROFILI.impresa = { tabs: [["im-home", "casa", "Oggi"], ["im-moduli", "griglia", "Moduli"], ["im-crea", "piu", "Crea", true], ["im-persone", "rete", "Persone"], ["profilo", "utente", "Profilo"]] };
  PROFILI.fornitore = { tabs: [["fo-home", "casa", "Oggi"], ["fo-lotti", "lotti", "Richieste"], ["fo-listino", "piu", "Listino", true], ["offerte", "box", "Offerte"], ["profilo", "utente", "Profilo"]] };
  PROFILI.partner = { tabs: [["pa-home", "casa", "Oggi"], ["pa-cantieri", "gru", "Cantieri"], ["fo-lotti", "lotti", "Lotti", true], ["offerte", "box", "Offerte"], ["profilo", "utente", "Profilo"]] };
  PROFILI.operatore = { tabs: [["op-home", "casa", "Oggi"], ["op-patentino", "scudo", "Patentino"], ["op-segnala", "allarme", "Segnala", true], ["op-corsi", "corso", "Corsi"], ["profilo", "utente", "Profilo"]] };
  PROFILI.consulente = { tabs: [["co-home", "casa", "Oggi"], ["co-aziende", "ufficio", "Aziende"], ["co-agenda", "calendario", "Agenda"], ["corsi-listino", "corso", "Listino"], ["profilo", "utente", "Profilo"]] };
  PROFILI.cliente = { tabs: [["cl-home", "casa", "Cantiere"], ["cl-pagamenti", "euro", "Pagamenti"], ["cl-segnala", "allarme", "Segnala", true], ["cl-chat", "chat", "Chat"], ["profilo", "utente", "Profilo"]] };

  const orgDi = (id) => ((S.miei && S.miei.org) || []).find((o) => o.id === id) || {};
  let prezzi = null;
  async function prezziModuli() {
    if (prezzi) return prezzi;
    try { const r = await Q.uno("app_impostazioni", { chiave: "prezzi_moduli" }); prezzi = Object.assign({}, PREZZI_PREDEFINITI, r ? r.valore : {}); } catch (e) { prezzi = PREZZI_PREDEFINITI; }
    return prezzi;
  }
  async function moduliOrg(org) {
    const m = await Q.sel("app_moduli", { eq: { org } }).catch(() => []);
    const attivo = (id) => (["ufficio", "base", "listino"].includes(id) ? m.some((x) => x.stato === "attivo" && x.modulo === "base") : m.some((x) => x.stato === "attivo" && (x.modulo === id || x.modulo === "pacchetto")));
    return { righe: m, attivo, stato: (id) => (attivo(id) ? "attivo" : (m.find((x) => x.modulo === (id === "ufficio" ? "base" : id)) || {}).stato || "") };
  }
  const tile = (ico, t, s, go, col, extra) => `<div class="tile ${extra || ""}" data-go="${esc(go)}" role="button" tabindex="0"><span class="ico ${col || "blu"}">${I[ico] || ""}</span><b>${t}</b>${s ? `<small>${s}</small>` : ""}</div>`;

  /* ====================================================================== */
  /* IMPRESA                                                                 */
  /* ====================================================================== */
  V["im-home"] = async () => {
    const org = S.org, o = orgDi(org);
    const [mod, tutte] = await Promise.all([moduliOrg(org), Q.sel("app_record", { eq: { org }, lim: 2000 })]);
    const per = (t) => tutte.filter((r) => r.tipo === t);
    const scadSic = tutte.filter((r) => ["attestato", "visita"].includes(r.tipo) && r.scadenza).map((r) => semaforo(r.scadenza));
    const rossi = scadSic.filter((x) => x[0] === "rosso").length, gialli = scadSic.filter((x) => x[0] === "giallo").length;
    const daFare = [];
    if (rossi) daFare.push(voce("allarme", `${rossi} corsi o visite scaduti`, "Risolvi con AncheSicura", "elenco/dipendente", "rosso"));
    if (gialli) daFare.push(voce("scudo", `${gialli} scadenze entro 30 giorni`, "Sicurezza", "elenco/dipendente", "giallo"));
    per("segnalazione").filter((r) => r.stato !== "chiusa").slice(0, 3).forEach((r) => daFare.push(voce("allarme", esc(r.titolo), "Segnalazione di un lavoratore", "scheda/" + r.id, "rosso")));
    per("segnalazione_cliente").filter((r) => r.stato !== "risolta").slice(0, 3).forEach((r) => daFare.push(voce("allarme", esc(r.titolo), "Segnalazione del cliente", "scheda/" + r.id, "rosso")));
    per("sal").filter((r) => r.stato === "contestato").forEach((r) => daFare.push(voce("doc", esc(r.titolo) + " contestato", "Il cliente non l'ha approvato", "scheda/" + r.id, "rosso")));
    per("chiamata").filter((r) => r.stato === "da richiamare").slice(0, 3).forEach((r) => daFare.push(voce("tel", "Richiama: " + esc(r.titolo), esc(r.dati.note || ""), "scheda/" + r.id, "giallo")));
    per("gara").filter((r) => ["da valutare", "partecipo"].includes(r.stato) && r.scadenza && semaforo(r.scadenza)[0] !== "verde").forEach((r) => daFare.push(voce("gara", esc(r.titolo), semaforo(r.scadenza)[1], "scheda/" + r.id, "giallo")));
    per("articolo").filter((r) => Number(r.dati.giacenza) < Number(r.dati.minimo)).forEach((r) => daFare.push(voce("box", esc(r.titolo), "Sotto la scorta minima", "scheda/" + r.id, "giallo")));
    per("fattura").filter((r) => r.stato !== "incassata" && r.scadenza && semaforo(r.scadenza)[0] === "rosso").forEach((r) => daFare.push(voce("euro", esc(r.titolo) + " da incassare", euro(r.importo), "scheda/" + r.id, "rosso")));
    const cantieri = per("cantiere").filter((r) => r.stato !== "finito");
    const attivi = MODULI.filter((m) => mod.attivo(m.id));
    if (!mod.attivo("base")) attivi.length = 0;
    return {
      t: "",
      h: `<div class="pad"><p class="saluto">${esc(o.nome || "La tua azienda")}</p><p class="sotto">${o.tipo === "gc" ? "AncheCasa general contractor" : o.ruolo === "titolare" ? "Titolare" : "Responsabile"}</p>
        ${mod.attivo("base") ? "" : `${avviso(mod.stato("base") === "richiesto" ? "Abbonamento richiesto: AncheCasa ti contatta per il pagamento e lo attiva." : "Per cominciare attiva l'abbonamento della tua azienda.")}<div style="height:8px"></div>${mod.stato("base") === "richiesto" ? "" : btn("Vedi l'abbonamento", "go:im-moduli")}<div style="height:12px"></div>`}
        <div class="griglia2">${num(cantieri.length, "Cantieri aperti")}${num(per("dipendente").length, "Dipendenti")}${num(rossi, "Scadenze superate", rossi ? "rosso" : "verde")}${num(per("preventivo").filter((r) => r.stato === "inviato").length, "Preventivi in attesa")}</div><div style="height:16px"></div>
        ${sez("Da fare", daFare.length ? lista(daFare.slice(0, 10)) : `<div class="card"><p>Niente di urgente. Bene così.</p></div>`)}
        ${cantieri.length ? sez("Cantieri", lista(cantieri.slice(0, 5).map((r) => core.rigaScheda(r))), `<a data-go="elenco/cantiere">Tutti</a>`) : ""}
        ${attivi.length ? sez("I tuoi moduli", `<div class="griglia2">${attivi.map((m) => tile(m.ico, m.nome, "", "mod/" + m.id)).join("")}</div>`) : ""}</div>`,
    };
  };

  V["im-moduli"] = async () => {
    const [mod, pr] = await Promise.all([moduliOrg(S.org), prezziModuli()]);
    const extra = MODULI.filter((m) => !m.compreso);
    const somma = extra.reduce((s, m) => s + Number(pr[m.id] || 0), 0);
    const pacc = mod.stato("pacchetto");
    const tipoOrg = orgDi(S.org).tipo || "impresa";
    const B = BASE[tipoOrg] || BASE.impresa;
    const sb = mod.stato("base");
    return {
      t: "Abbonamento e moduli",
      h: `<div class="pad"><p class="sotto">Prezzi al mese, pagamento annuale. Dopo la richiesta AncheCasa ti contatta per il pagamento e attiva.</p>
        <div class="card"><div class="riga"><div class="cresci"><b>${esc(B.nome)}</b><small>${euro(pr["base_" + tipoOrg] ?? pr.base_impresa)} al mese</small></div>${sb === "attivo" ? stato("verde", "Attivo") : sb === "richiesto" ? stato("giallo", "Richiesto") : tipoOrg === "gc" ? "" : btn("Chiedi", "chiedi-modulo:base", "piccolo")}</div><ul class="passi" style="margin-top:8px">${B.comprende.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div><div style="height:16px"></div>
        ${tipoOrg === "fornitore" ? "" : `<h2 class="tit-sez">Moduli in più</h2>
        <div class="eroe"><h3>Tutti i moduli · ${euro(pr.pacchetto)} al mese</h3><p>Sicurezza, cantieri, gare, lotti, centralino e magazzino insieme, invece di ${euro(somma)}.</p>${pacc === "attivo" ? stato("verde", "Attivo") : pacc === "richiesto" ? stato("giallo", "Richiesto") : btn("Chiedi tutti i moduli", "chiedi-modulo:pacchetto")}</div><div style="height:16px"></div>
        ${lista(extra.map((m) => {
          const st = mod.stato(m.id);
          const dx = st === "attivo" ? stato("verde", "Attivo") : st === "richiesto" ? stato("giallo", "Richiesto") : `<span class="prezzo-piccolo">${euro(pr[m.id])}/mese</span>`;
          return voce(m.ico, esc(m.nome) + (m.div ? ` <small class="div">${esc(m.div)}</small>` : ""), esc(m.desc), st === "attivo" ? "mod/" + m.id : "modulo-info/" + m.id, st === "attivo" ? "verde" : "", dx);
        }))}`}
        ${mod.attivo("base") && tipoOrg !== "fornitore" ? `<div style="height:12px"></div>${lista([voce("ufficio", "Ufficio", "Compreso nell'abbonamento", "mod/ufficio", "verde", stato("verde", "Attivo"))])}` : ""}
        <div style="height:16px"></div>${sez("Sempre compresi", lista([voce("stella", "Recensioni e vetrina", "Le recensioni dei tuoi clienti", "im-recensioni", "verde"), voce("scudo", "Corsi e servizi AncheSicura", "Prezzi sotto il mercato", "corsi-listino", "blu"), voce("euro", "Rivendi la sicurezza ai tuoi clienti", "Ti riconosciamo il 30%", "im-rivendi", "arancio"), voce("box", "Lotti degli altri e offerte", "Subappalti e forniture aperti", "fo-lotti", "blu")]))}</div>`,
    };
  };
  V["modulo-info"] = async (id) => {
    const m = MODULI.find((x) => x.id === id); const pr = await prezziModuli(); const mod = await moduliOrg(S.org);
    if (!m) return { t: "Modulo", h: vuoto("Modulo non trovato.") };
    const st = mod.stato(id);
    return {
      t: m.nome,
      h: `<div class="pad"><div class="eroe"><h3>${esc(m.nome)}</h3><p>${esc(m.desc)}</p><p class="prezzo" style="color:#fff">${euro(pr[id])} <small style="color:rgba(255,255,255,.8)">al mese, pagamento annuale</small></p></div><div style="height:14px"></div>
        ${lista(m.tipi.map((t) => voce(TIPI[t].ico, esc(TIPI[t].plur), "", null, "blu")))}<div style="height:14px"></div>
        ${st === "richiesto" ? avviso("Richiesta inviata: AncheCasa ti contatta per attivarlo.") : core.gestisco(S.org) ? btn("Chiedi l'attivazione", "chiedi-modulo:" + id) : avviso("Lo può attivare il titolare dell'azienda.")}</div>`,
    };
  };
  AZIONI["chiedi-modulo:"] = async (id) => {
    try {
      const pr = await prezziModuli();
      await Q.ins("app_moduli", { org: S.org, modulo: id, stato: "richiesto", prezzo_mese: pr[id] ?? null });
      toast("Richiesta inviata: AncheCasa ti contatta per il pagamento e lo attiva."); render();
    } catch (e) { toast(/duplicate|23505/.test(String(e.message || e.code)) ? "L'hai già chiesto." : spiegaErrore(e), "errore"); }
  };

  /* Pagina di un modulo attivo */
  const EXTRA_MODULO = {
    sicurezza: async (org) => {
      const dip = await R.lista(org, "dipendente");
      const figli = await Q.sel("app_record", { eq: { org }, in: { tipo: ["attestato", "visita"] }, lim: 2000 });
      const s = dip.map((d) => semaforoDipendente(figli.filter((f) => f.rif === d.id)));
      const n = (c) => s.filter((x) => x[0] === c).length;
      return `<div class="griglia3">${num(n("rosso"), "Non in regola", "rosso")}${num(n("giallo"), "In scadenza", "giallo")}${num(n("verde"), "In regola", "verde")}</div><div style="height:12px"></div>
        ${lista([voce("corso", "Risolvi con AncheSicura", "Ordina corsi e visite a prezzi sotto il mercato", "corsi-listino", "arancio"), voce("euro", "Rivendi la sicurezza ai tuoi clienti", "Ti riconosciamo il 30%", "im-rivendi", "arancio")])}<div style="height:12px"></div>`;
    },
    gare: async () => `${btn(I.gara + " Nuova gara dal bando (analisi con l'IA)", "gara-bando")}<div style="height:12px"></div>`,
    sicantiere: async () => `${avviso("Gli ingressi si registrano dentro ogni cantiere con il codice del patentino del lavoratore.")}<div style="height:12px"></div>`,
    centralino: async () => `${avviso("Il numero AncheVoice si collega a parte: per ora qui tieni il registro delle chiamate e dei richiami.")}<div style="height:12px"></div>`,
    lotti: async (org) => {
      const miei = await R.lista(org, "lotto");
      const off = miei.length ? await Q.sel("app_offerte", { in: { lotto: miei.map((l) => l.id) } }).catch(() => []) : [];
      return `${lista([voce("box", "Offerte ricevute", `${off.filter((o) => o.stato === "inviata").length} da valutare`, "elenco/lotto", "arancio"), voce("lotti", "Lotti degli altri", "Subappalti e forniture aperti: fai un'offerta", "fo-lotti", "blu")])}<div style="height:12px"></div>`;
    },
  };
  V.mod = async (id) => {
    const m = MODULI.find((x) => x.id === id);
    if (!m) return { t: "Modulo", h: vuoto("Modulo non trovato.") };
    const org = S.org;
    const conti = await Promise.all(m.tipi.map((t) => R.lista(org, t).then((l) => l.length).catch(() => 0)));
    const extra = EXTRA_MODULO[id] ? await EXTRA_MODULO[id](org) : "";
    return {
      t: m.nome,
      h: `<div class="pad">${extra}<div class="griglia2">${m.tipi.map((t, i) => tile(TIPI[t].ico, esc(TIPI[t].plur), conti[i] + (conti[i] === 1 ? " scheda" : " schede"), "elenco/" + t)).join("")}</div></div>`,
    };
  };

  V["im-crea"] = async () => {
    const mod = await moduliOrg(S.org);
    const voci = [
      ["cantieri", "cantiere", "Nuovo cantiere"], ["cantieri", "giornale", null], ["ufficio", "preventivo", "Nuovo preventivo"], ["ufficio", "cliente", "Nuovo cliente"],
      ["ufficio", "fattura", "Registra una fattura"], ["sicurezza", "dipendente", "Nuovo dipendente"], ["sicurezza", "avviso", "Avviso ai lavoratori"],
      ["gare", "gara", "Nuova gara"], ["lotti", "lotto", "Pubblica un lotto"], ["centralino", "chiamata", "Registra una chiamata"], ["magazzino", "articolo", "Nuovo articolo"], ["magazzino", "mezzo", "Nuovo mezzo"],
    ].filter((v) => v[2] && mod.attivo("base") && mod.attivo(v[0]));
    return {
      t: "Crea",
      h: `<div class="pad">${voci.length ? lista(voci.map(([, t, n]) => voce(TIPI[t].ico, n, "", "modifica/" + t + "/nuovo", "blu"))) : vuoto("Attiva un modulo per cominciare.<br><br>" + btn("Vedi i moduli", "go:im-moduli"))}
        ${mod.attivo("gare") ? `<div style="height:12px"></div>${btn(I.gara + " Gara dal bando (IA)", "gara-bando", "chiaro")}` : ""}</div>`,
    };
  };

  /* Persone e inviti */
  V["im-persone"] = async () => {
    const org = S.org;
    const [membri, inviti, dip] = await Promise.all([Q.sel("app_org_membri", { eq: { org } }), Q.sel("app_inviti", { eq: { cosa: "org", target: org }, ord: ["creato", false] }).catch(() => []), R.lista(org, "dipendente").catch(() => [])]);
    const NOMI = { titolare: "Titolare", responsabile: "Responsabile", operatore: "Lavoratore", consulente: "Consulente AncheSicura" };
    const gest = core.gestisco(org);
    return {
      t: "Persone",
      h: `<div class="pad">${sez("Chi usa l'app", lista(membri.map((m) => {
        const d = dip.find((x) => x.dati.utente === m.utente);
        const dx = gest && m.ruolo === "operatore" ? btn(d ? "Cambia" : "Collega", "collega-dip:" + m.utente, "piccolo chiaro") : "";
        return voce(m.ruolo === "consulente" ? "scudo" : "utente", esc(m.nome || NOMI[m.ruolo]), NOMI[m.ruolo] + (m.ruolo === "operatore" ? " · " + (d ? "è " + esc(d.titolo) : "non collegato a un dipendente") : ""), null, m.ruolo === "titolare" ? "verde" : "blu", dx);
      })))}
        ${gest ? sez("Invita qualcuno", `<form data-form="invita-org" novalidate>${campo("Nome", `<input name="nome" maxlength="80">`)}${campo("Mail", `<input name="email" type="email" required>`)}${campo("Ruolo", `<select name="ruolo"><option value="operatore">Lavoratore (patentino, corsi, segnalazioni)</option><option value="responsabile">Responsabile (gestisce come il titolare)</option><option value="consulente">Consulente della sicurezza</option></select>`)}<button class="btn" type="submit">Crea l'invito</button></form>`) : ""}
        ${inviti.filter((i) => i.stato === "inviato").length ? sez("Inviti in attesa", lista(inviti.filter((i) => i.stato === "inviato").map((i) => voce("campana", esc(i.email), NOMI[i.ruolo] + " · " + quando(i.creato), null, "giallo", btn("Link", "link-invito:" + i.token, "piccolo chiaro"))))) : ""}</div>`,
    };
  };
  function mostraInvito(i) {
    const link = location.origin + location.pathname + "#/invito/" + i.token;
    const oggetto = encodeURIComponent("Invito ad AncheCasa");
    const corpo = encodeURIComponent(`Ciao${i.nome ? " " + i.nome : ""},\nti invito su AncheCasa. Apri questo link dal telefono, crea l'account con questa mail (${i.email}) e accetta l'invito:\n${link}`);
    foglio(`<h2>Invito pronto</h2><p class="sotto">Mandalo a ${esc(i.email)}. Deve entrare (o iscriversi) con questa mail.</p>
      <div class="card"><p class="link-invito">${esc(link)}</p></div><div style="height:12px"></div>
      <a class="btn" href="mailto:${esc(i.email)}?subject=${oggetto}&body=${corpo}">Manda per mail</a><div style="height:8px"></div>
      ${btn("Copia il link", "copia:" + link, "chiaro")}`);
  }
  core.mostraInvito = mostraInvito;
  AZIONI["copia:"] = async (t) => { try { await navigator.clipboard.writeText(t); toast("Link copiato."); } catch (e) { toast("Tieni premuto sul link per copiarlo.", "errore"); } };
  AZIONI["link-invito:"] = async (token) => { const i = await Q.uno("app_inviti", { token }); if (i) mostraInvito(i); };
  FORM["invita-org"] = async (f) => {
    const email = f.email.value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast("Controlla la mail.", "errore");
    const i = await Q.ins("app_inviti", { cosa: "org", target: S.org, ruolo: f.ruolo.value, email, nome: f.nome.value.trim() });
    mostraInvito(i);
  };
  AZIONI["collega-dip:"] = async (utente) => {
    const dip = await R.lista(S.org, "dipendente");
    foglio(`<h2>Quale dipendente è?</h2><p class="sotto">Così vede il suo patentino, i suoi corsi e i DPI da firmare.</p>${lista(dip.map((d) => voce("utente", esc(d.titolo), esc(d.dati.mansione || ""), null, "blu", btn("È lui", "collega-ok:" + d.id + ":" + utente, "piccolo"))))}${dip.length ? "" : vuoto("Prima crea il dipendente nel modulo Sicurezza.")}`);
  };
  AZIONI["collega-ok:"] = async (arg) => {
    const [id, utente] = arg.split(":");
    const vecchi = (await R.lista(S.org, "dipendente")).filter((d) => d.dati.utente === utente && d.id !== id);
    for (const v of vecchi) await R.salva(Object.assign(v, { dati: Object.assign({}, v.dati, { utente: null }) }));
    const d = await R.get(id); d.dati = Object.assign({}, d.dati, { utente }); await R.salva(d);
    chiudiFoglio(); toast("Collegato."); render();
  };

  V["im-recensioni"] = async () => {
    const r = await Q.sel("app_recensioni_org", { eq: { org: S.org }, ord: ["creato", false] }).catch(() => []);
    const media = r.length ? r.reduce((s, x) => s + Number(x.voto), 0) / r.length : null;
    return { t: "Recensioni", h: `<div class="pad"><div class="griglia2">${num(media ? virgola(media) : "–", "Media", "verde")}${num(r.length, "Recensioni")}</div><div style="height:12px"></div>${r.length ? lista(r.map((x) => voce("stella", "★ " + virgola(x.voto), esc(x.testo || "") + " · " + quando(x.creato), null, "verde"))) : vuoto("Le recensioni arrivano dai clienti a fine cantiere.")}</div>` };
  };

  /* Rivendita della sicurezza (30%) */
  V["im-rivendi"] = async () => {
    const [l, imp] = await Promise.all([Q.sel("app_rivendite", { eq: { org: S.org }, ord: ["creato", false] }).catch(() => []), Q.uno("app_impostazioni", { chiave: "rivendita" }).catch(() => null)]);
    const perc = imp ? imp.valore.percentuale : 30;
    const ST = { richiesta: ["giallo", "Inviata ad AncheSicura"], confermata: ["blu", "Confermata"], pagata: ["verde", "Pagata dal cliente"], quota_pagata: ["verde", "Quota pagata a te"], annullata: ["rosso", "Annullata"] };
    const maturata = l.filter((x) => ["pagata"].includes(x.stato)).reduce((s, x) => s + x.importo * x.percentuale / 100, 0);
    return {
      t: "Rivendi la sicurezza",
      h: `<div class="pad"><div class="eroe"><h3>Il ${virgola(perc, 0)}% è tuo</h3><p>Vendi ai tuoi clienti corsi e servizi AncheSicura: il cliente paga AncheCasa e AncheCasa ti riconosce il ${virgola(perc, 0)}%.</p></div><div style="height:12px"></div>
        <div class="griglia2">${num(l.length, "Vendite")}${num(euro(maturata) || "0 €", "Quota da ricevere", "verde")}</div><div style="height:14px"></div>
        <form data-form="rivendi" novalidate>${campo("Cliente", `<input name="cliente" required maxlength="120">`)}${campo("Telefono o mail del cliente", `<input name="contatto" maxlength="120">`)}${campo("Cosa gli vendi", `<input name="servizio" required maxlength="200" list="sugg-serv"><datalist id="sugg-serv">${["DVR", "POS", "DUVRI", "PSC", "Visite mediche", "Corsi lavoratori", "RSPP esterno", "Modulo Sicurezza dell'app"].map((x) => `<option value="${x}">`).join("")}</datalist>`)}${campo("Importo per il cliente", `<input name="importo" type="number" step="0.01" min="0" required>`)}<button class="btn" type="submit">Manda ad AncheSicura</button></form>
        <div style="height:14px"></div>${l.length ? sez("Le tue vendite", lista(l.map((x) => voce("euro", esc(x.cliente_nome) + " · " + esc(x.servizio), euro(x.importo) + " · tua quota " + euro(x.importo * x.percentuale / 100), null, "", stato(...(ST[x.stato] || ["blu", x.stato])))))) : ""}</div>`,
    };
  };
  FORM.rivendi = async (f) => {
    if (f.cliente.value.trim().length < 2 || f.servizio.value.trim().length < 2 || !f.importo.value) return toast("Compila cliente, servizio e importo.", "errore");
    await Q.ins("app_rivendite", { org: S.org, cliente_nome: f.cliente.value.trim(), cliente_contatto: f.contatto.value.trim(), servizio: f.servizio.value.trim(), importo: Number(f.importo.value) });
    toast("Inviata ad AncheSicura: vi contattiamo noi."); render();
  };

  /* ---------------------- Gare: dal bando con l'IA ---------------------- */
  AZIONI["gara-bando"] = () => {
    foglio(`<h2>Analizza un bando</h2><p class="sotto">Carica il PDF del bando o incolla il testo: l'IA estrae importo, scadenza, categorie, requisiti e ti dice se conviene partecipare.</p>
      <form data-form="gara-bando" novalidate><label class="campo"><span>PDF del bando (massimo 10 MB)</span><input type="file" name="pdf" accept="application/pdf"></label>
      ${campo("Oppure incolla il testo", `<textarea name="testo" maxlength="60000"></textarea>`)}<button class="btn" type="submit">${I.gara} Analizza</button></form>`);
  };
  async function analizzaBando(f) {
    const file = f.pdf.files[0]; const testo = f.testo.value.trim();
    if (!file && testo.length < 200) { toast("Carica il PDF o incolla almeno qualche riga del bando.", "errore"); return null; }
    if (file && file.size > 10 * 1024 * 1024) { toast("Il PDF è troppo grande (massimo 10 MB).", "errore"); return null; }
    const pdf = file ? await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.readAsDataURL(file); }) : null;
    toast("Analizzo il bando: ci vuole un minuto…");
    const r = await Q.funzione("gare-analisi", { pdf, testo });
    return r && r.analisi;
  }
  FORM["gara-bando"] = async (f) => {
    let a;
    try { a = await analizzaBando(f); } catch (e) { return toast(/motore_non_configurato/.test(e.message) ? "L'analisi dei bandi non è ancora attiva." : spiegaErrore(e), "errore"); }
    if (!a) return;
    const g = await R.salva({ org: S.org, tipo: "gara", titolo: a.oggetto || "Gara", importo: a.importo, scadenza: a.scadenza || null, stato: "da valutare", dati: { ente: a.ente, categorie: (a.categorie || []).join(", "), analisi: a } });
    if (f.pdf.files[0]) await core.caricaFile(g.org + "/" + g.id, f.pdf.files);
    chiudiFoglio(); vai("scheda/" + g.id);
  };
  FORM["gara-rianalizza"] = async (f) => {
    let a;
    try { a = await analizzaBando(f); } catch (e) { return toast(spiegaErrore(e), "errore"); }
    if (!a) return;
    const g = await R.get(f.dataset.id); g.dati = Object.assign({}, g.dati, { analisi: a }); await R.salva(g); chiudiFoglio(); render();
  };
  HOOK.scheda.gara = async (g) => {
    const a = g.dati.analisi;
    const es = g.dati.esito || {};
    const mod = core.puoModificare(g);
    let h = "";
    if (a) {
      const c0 = String(a.consiglio || "").toLowerCase();
      const giudizio = c0.startsWith("partecipa") ? 2 : c0.startsWith("valuta") ? 1 : c0.startsWith("lascia") ? 0 : a.punteggio >= 70 ? 2 : a.punteggio >= 45 ? 1 : 0;
      const col = ["rosso", "giallo", "verde"][giudizio];
      h += `${a.esempio ? avviso("Analisi di ESEMPIO: nella prova non si usa l'IA.") + '<div style="height:10px"></div>' : ""}
        <div class="eroe"><h3>Conviene? ${Number(a.punteggio) || 0}/100</h3><p>${esc(a.consiglio)}</p>${stato(col, ["Lascia perdere", "Valuta", "Partecipa"][giudizio])}</div><div style="height:12px"></div>
        ${sez("Cosa dice il bando", `<div class="card"><dl class="campi">${[["Ente", a.ente], ["Importo", euro(a.importo)], ["Scadenza", giornoIt(a.scadenza)], ["Luogo", a.luogo], ["Categorie", (a.categorie || []).join(", ")], ["Criterio", a.criterio], ["Sopralluogo", a.sopralluogo]].filter((x) => x[1]).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div>`)}
        ${["requisiti", "documenti", "rischi"].map((k) => (a[k] || []).length ? sez(k === "requisiti" ? "Requisiti" : k === "documenti" ? "Documenti da preparare" : "Punti critici", `<div class="card"><ul class="passi">${a[k].map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`) : "").join("")}`;
    } else if (mod) h += `${btn(I.gara + " Analizza il bando con l'IA", "gara-rianalizza:" + g.id, "chiaro")}<div style="height:12px"></div>`;
    if (["vinta", "persa", "offerta inviata"].includes(g.stato) || es.ribasso) {
      h += sez("Dopo la gara", `<div class="card"><dl class="campi">${[["Ribasso offerto", es.ribasso], ["Posizione", es.posizione], ["Aggiudicataria", es.vincitore], ["Ribasso vincente", es.ribasso_vincente], ["Note", es.note]].filter((x) => x[1]).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("") || "<dd>Da compilare</dd>"}</dl></div>${mod ? `<div style="height:8px"></div>${btn("Analisi dopo la gara", "gara-esito:" + g.id, "chiaro")}` : ""}`);
    }
    if (g.stato === "vinta" && mod && !g.dati.cantiere) h += `${btn(I.gru + " Gara vinta: crea il cantiere", "gara-cantiere:" + g.id)}<div style="height:12px"></div>`;
    if (g.dati.cantiere) h += lista([voce("gru", "Cantiere della gara", "Aperto", "scheda/" + g.dati.cantiere, "verde")]) + '<div style="height:12px"></div>';
    return h;
  };
  AZIONI["gara-rianalizza:"] = (id) => {
    foglio(`<h2>Analizza il bando</h2><form data-form="gara-rianalizza" data-id="${esc(id)}" novalidate><label class="campo"><span>PDF del bando</span><input type="file" name="pdf" accept="application/pdf"></label>${campo("Oppure incolla il testo", `<textarea name="testo"></textarea>`)}<button class="btn" type="submit">Analizza</button></form>`);
  };
  AZIONI["gara-esito:"] = async (id) => {
    const g = await R.get(id); const e = g.dati.esito || {};
    foglio(`<h2>Analisi dopo la gara</h2><form data-form="gara-esito" data-id="${esc(id)}" novalidate>${campo("Il tuo ribasso", `<input name="ribasso" value="${esc(e.ribasso || "")}" placeholder="Es. 18,4%">`)}${campo("Posizione in graduatoria", `<input name="posizione" value="${esc(e.posizione || "")}">`)}${campo("Chi ha vinto", `<input name="vincitore" value="${esc(e.vincitore || "")}">`)}${campo("Ribasso vincente", `<input name="ribasso_vincente" value="${esc(e.ribasso_vincente || "")}">`)}${campo("Cosa abbiamo imparato", `<textarea name="note">${esc(e.note || "")}</textarea>`)}<button class="btn" type="submit">Salva</button></form>`);
  };
  FORM["gara-esito"] = async (f) => {
    const g = await R.get(f.dataset.id);
    g.dati = Object.assign({}, g.dati, { esito: { ribasso: f.ribasso.value.trim(), posizione: f.posizione.value.trim(), vincitore: f.vincitore.value.trim(), ribasso_vincente: f.ribasso_vincente.value.trim(), note: f.note.value.trim() } });
    await R.salva(g); chiudiFoglio(); toast("Salvato."); render();
  };
  AZIONI["gara-cantiere:"] = async (id) => {
    const g = await R.get(id);
    const c = await R.salva({ org: g.org, tipo: "cantiere", titolo: g.titolo, importo: g.importo, stato: "in preparazione", data: null, dati: { committente: g.dati.ente || "", da_gara: g.id, avanzamento: 0 } });
    g.dati = Object.assign({}, g.dati, { cantiere: c.id }); await R.salva(g);
    toast("Cantiere creato."); vai("scheda/" + c.id);
  };

  /* ---------------------- Cantiere ---------------------- */
  HOOK.scheda.cantiere = async (c) => {
    const gest = core.gestisco(c.org);
    const acc = gest ? await Q.sel("app_accessi", { eq: { record: c.id } }).catch(() => []) : [];
    const inv = gest ? await Q.sel("app_inviti", { eq: { cosa: "cantiere", target: c.id, stato: "inviato" } }).catch(() => []) : [];
    const av = Number(c.dati.avanzamento || 0);
    const mioAcc = ((S.miei && S.miei.accessi) || []).find((a) => a.record === c.id);
    return `<div class="card"><small>Avanzamento</small><div class="barra-av" style="margin-top:6px"><i style="width:${av}%"></i></div><b>${av}%</b></div><div style="height:12px"></div>
      ${lista([voce("chat", "Chat del cantiere", "Impresa, proprietario e partner", "chat/" + c.id, "blu")])}<div style="height:12px"></div>
      ${gest ? sez("Chi segue il cantiere", lista([...acc.map((a) => voce(a.ruolo === "cliente" ? "casa" : "kit", a.ruolo === "cliente" ? "Proprietario del cantiere" : "Impresa partner", "Ha accesso dall'app", null, "verde")), ...inv.map((i) => voce("campana", esc(i.email), "Invito in attesa · " + (i.ruolo === "cliente" ? "proprietario" : "partner"), null, "giallo", btn("Link", "link-invito:" + i.token, "piccolo chiaro")))]) + `<div class="btns">${btn("Invita il proprietario", "invita-cantiere:" + c.id + ":cliente", "piccolo chiaro")}${btn("Invita un partner", "invita-cantiere:" + c.id + ":partner", "piccolo chiaro")}</div>`) : ""}
      ${gest ? `${btn(I.utente + " Registra un ingresso (codice patentino)", "ingresso:" + c.id, "chiaro")}<div style="height:12px"></div>` : ""}
      ${mioAcc && mioAcc.ruolo === "partner" ? `${btn(I.utente + " Registra un ingresso (codice patentino)", "ingresso:" + c.id, "chiaro")}<div style="height:12px"></div>` : ""}`;
  };
  AZIONI["invita-cantiere:"] = (arg) => {
    const [id, ruolo] = arg.split(":");
    foglio(`<h2>${ruolo === "cliente" ? "Invita il proprietario" : "Invita l'impresa partner"}</h2><p class="sotto">${ruolo === "cliente" ? "Vedrà avanzamento, foto, SAL da approvare e potrà segnalare problemi." : "Potrà scrivere il giornale dei lavori, le presenze, gli ingressi e proporre i SAL."}</p>
      <form data-form="invita-cantiere" data-id="${esc(id)}" data-ruolo="${esc(ruolo)}" novalidate>${campo("Nome", `<input name="nome" maxlength="80">`)}${campo("Mail", `<input name="email" type="email" required>`)}<button class="btn" type="submit">Crea l'invito</button></form>`);
  };
  FORM["invita-cantiere"] = async (f) => {
    const email = f.email.value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast("Controlla la mail.", "errore");
    const i = await Q.ins("app_inviti", { cosa: "cantiere", target: f.dataset.id, ruolo: f.dataset.ruolo, email, nome: f.nome.value.trim() });
    mostraInvito(i);
  };
  AZIONI["ingresso:"] = (id) => {
    foglio(`<h2>Ingresso in cantiere</h2><p class="sotto">Scrivi il codice del patentino che il lavoratore ti mostra dall'app.</p><form data-form="ingresso" data-id="${esc(id)}" novalidate>${campo("Codice", `<input name="codice" maxlength="8" autocapitalize="characters" required>`)}<button class="btn" type="submit">Controlla e registra</button></form>`);
  };
  FORM.ingresso = async (f) => {
    let r;
    try { r = await Q.rpc("app_registra_ingresso", { p_cantiere: f.dataset.id, p_codice: f.codice.value.trim() }); }
    catch (e) { return toast(/codice_non_trovato/.test(e.message) ? "Codice non trovato tra i dipendenti." : spiegaErrore(e), "errore"); }
    chiudiFoglio();
    toast(r.in_regola ? r.nome + ": in regola. Ingresso registrato." : r.nome + ": NON in regola (corsi o visite scaduti). Ingresso registrato come non in regola.", r.in_regola ? "" : "errore");
    render();
  };
  HOOK.scheda.sal = async (s) => {
    const acc = ((S.miei && S.miei.accessi) || []).find((a) => a.record === s.rif);
    if (s.stato === "inviato" && acc && acc.ruolo === "cliente") return `${avviso("AncheCasa ti chiede di approvare questo stato di avanzamento: controlla foto e giornale prima.")}<div style="height:10px"></div><div class="btns">${btn("Approvo", "sal:" + s.id + ":si")}${btn("Non va bene", "sal:" + s.id + ":no", "chiaro")}</div><div style="height:12px"></div>`;
    if (s.dati.nota_cliente) return `${avviso("Nota del cliente: «" + esc(s.dati.nota_cliente) + "»")}<div style="height:12px"></div>`;
    if (s.stato === "bozza" && core.puoModificare(s)) return `${btn("Manda al cliente da approvare", "sal-invia:" + s.id)}<div style="height:12px"></div>`;
    return "";
  };
  AZIONI["sal-invia:"] = async (id) => { const s = await R.get(id); s.stato = "inviato"; await R.salva(s); toast("Mandato al cliente."); render(); };
  AZIONI["sal:"] = async (arg) => {
    const [id, si] = arg.split(":");
    if (si === "si") { try { await Q.rpc("app_approva_sal", { p_sal: id, p_approva: true, p_nota: "" }); toast("SAL approvato."); render(); } catch (e) { toast(spiegaErrore(e), "errore"); } return; }
    foglio(`<h2>Cosa non va?</h2><form data-form="sal-no" data-id="${esc(id)}" novalidate>${campo("Scrivi il motivo", `<textarea name="nota" required maxlength="400"></textarea>`)}<button class="btn" type="submit">Manda</button></form>`);
  };
  FORM["sal-no"] = async (f) => { await Q.rpc("app_approva_sal", { p_sal: f.dataset.id, p_approva: false, p_nota: f.nota.value.trim() }); chiudiFoglio(); toast("Mandato: l'impresa ti risponde."); render(); };
  HOOK.scheda.dpi = async (d) => (!d.dati.firma && S.base === "operatore" ? `${avviso("Firma per dire che hai ricevuto questi DPI.")}<div style="height:8px"></div>${btn("Firma adesso", "go:modifica/dpi/" + d.id)}<div style="height:12px"></div>` : "");

  /* ---------------------- Lotti e offerte ---------------------- */
  HOOK.scheda.lotto = async (l) => {
    const gest = core.gestisco(l.org);
    if (gest) {
      const off = await Q.sel("app_offerte", { eq: { lotto: l.id }, ord: ["prezzo", true] }).catch(() => []);
      const nomi = {};
      for (const o of off) { const x = await Q.uno("app_org", { id: o.org }).catch(() => null); nomi[o.org] = x ? x.nome : "Azienda"; }
      const ST = { inviata: ["giallo", "Da valutare"], accettata: ["verde", "Accettata"], rifiutata: ["rosso", "Rifiutata"], ritirata: ["blu", "Ritirata"] };
      return sez("Offerte ricevute", off.length ? off.map((o) => `<div class="card"><div class="riga"><div class="cresci"><b>${esc(nomi[o.org])} · ${euro(o.prezzo)}</b><small>${esc(o.tempi || "")}${o.note ? " · " + esc(o.note) : ""}</small></div>${stato(...ST[o.stato])}</div>${o.stato === "inviata" && l.stato === "aperto" ? `<div class="btns">${btn("Accetta", "offerta:" + o.id + ":accettata", "piccolo")}${btn("Rifiuta", "offerta:" + o.id + ":rifiutata", "piccolo chiaro")}</div>` : ""}</div>`).join("") : `<div class="card"><p>${l.stato === "aperto" ? "Ancora nessuna offerta: il lotto è visibile alle imprese e ai fornitori." : "Metti lo stato «aperto» per farlo vedere a imprese e fornitori."}</p></div>`);
    }
    const mie = ((S.miei && S.miei.org) || []).filter((o) => ["titolare", "responsabile"].includes(o.ruolo) && o.id !== l.org);
    if (!mie.length) return "";
    const gia = await Q.sel("app_offerte", { eq: { lotto: l.id }, in: { org: mie.map((o) => o.id) } }).catch(() => []);
    if (gia.length) return sez("La tua offerta", lista(gia.map((o) => voce("box", euro(o.prezzo), esc(o.tempi || ""), null, "", stato(o.stato === "accettata" ? "verde" : o.stato === "rifiutata" ? "rosso" : "giallo", o.stato)))));
    if (l.stato !== "aperto") return avviso("Il lotto non accetta più offerte.");
    return sez("Fai un'offerta", `<form data-form="offerta" data-lotto="${esc(l.id)}" novalidate>${mie.length > 1 ? campo("Con quale azienda", `<select name="org">${mie.map((o) => `<option value="${esc(o.id)}" ${o.id === S.org ? "selected" : ""}>${esc(o.nome)}</option>`).join("")}</select>`) : `<input type="hidden" name="org" value="${esc(mie[0].id)}">`}${campo("Prezzo", `<input name="prezzo" type="number" step="0.01" min="0" required>`)}${campo("Tempi", `<input name="tempi" maxlength="120" placeholder="Es. consegna in 5 giorni">`)}${campo("Note", `<textarea name="note" maxlength="600"></textarea>`)}<button class="btn" type="submit">Manda l'offerta</button></form>`);
  };
  FORM.offerta = async (f) => {
    if (!f.prezzo.value) return toast("Scrivi il prezzo.", "errore");
    await Q.ins("app_offerte", { lotto: f.dataset.lotto, org: f.org.value, prezzo: Number(f.prezzo.value), tempi: f.tempi.value.trim(), note: f.note.value.trim() });
    toast("Offerta mandata."); render();
  };
  AZIONI["offerta:"] = async (arg) => { const [id, st] = arg.split(":"); try { await Q.rpc("app_decidi_offerta", { p_offerta: id, p_stato: st }); toast(st === "accettata" ? "Offerta accettata: il lotto è assegnato." : "Fatto."); render(); } catch (e) { toast(spiegaErrore(e), "errore"); } };
  V["fo-lotti"] = async () => {
    const l = (await Q.sel("app_record", { eq: { tipo: "lotto", pubblico: true, stato: "aperto" }, ord: ["creato", false] })).filter((x) => x.org !== S.org);
    return { t: "Lotti aperti", h: `<div class="pad"><p class="sotto">Subappalti, forniture e noleggi che le imprese AncheCasa cercano adesso.</p>${l.length ? lista(l.map((x) => core.rigaScheda(x))) : vuoto("Nessun lotto aperto in questo momento.")}</div>` };
  };
  V.offerte = async () => {
    const mie = ((S.miei && S.miei.org) || []).filter((o) => ["titolare", "responsabile"].includes(o.ruolo)).map((o) => o.id);
    const off = mie.length ? await Q.sel("app_offerte", { in: { org: mie }, ord: ["creato", false] }) : [];
    const lotti = {};
    for (const o of off) lotti[o.lotto] = lotti[o.lotto] || (await R.get(o.lotto).catch(() => null));
    const col = { inviata: "giallo", accettata: "verde", rifiutata: "rosso", ritirata: "blu" };
    return { t: "Le mie offerte", h: `<div class="pad">${off.length ? lista(off.map((o) => voce("box", esc((lotti[o.lotto] || {}).titolo || "Lotto"), euro(o.prezzo) + " · " + quando(o.creato), lotti[o.lotto] ? "scheda/" + o.lotto : null, "", stato(col[o.stato], o.stato)))) : vuoto("Non hai ancora mandato offerte.<br><br>" + btn("Vedi i lotti aperti", "go:fo-lotti"))}</div>` };
  };

  /* ====================================================================== */
  /* FORNITORE                                                               */
  /* ====================================================================== */
  V["fo-home"] = async () => {
    const o = orgDi(S.org);
    const [lotti, off, prod] = await Promise.all([Q.sel("app_record", { eq: { tipo: "lotto", pubblico: true, stato: "aperto" } }), Q.sel("app_offerte", { eq: { org: S.org } }).catch(() => []), R.lista(S.org, "prodotto").catch(() => [])]);
    const nuovi = lotti.filter((l) => !off.some((x) => x.lotto === l.id) && l.org !== S.org);
    return {
      t: "",
      h: `<div class="pad"><p class="saluto">${esc(o.nome || "")}</p><p class="sotto">Fornitore · materiali e noleggi</p>
        ${(await moduliOrg(S.org)).attivo("base") ? "" : `${avviso("Per rispondere alle richieste e pubblicare il listino attiva l'abbonamento Fornitore.")}<div style="height:8px"></div>${btn("Vedi l'abbonamento", "go:im-moduli")}<div style="height:12px"></div>`}
        <div class="griglia2">${num(nuovi.length, "Richieste a cui rispondere", nuovi.length ? "giallo" : "")}${num(off.filter((x) => x.stato === "accettata").length, "Offerte accettate", "verde")}${num(off.filter((x) => x.stato === "inviata").length, "Offerte in attesa")}${num(prod.length, "Prodotti a listino")}</div><div style="height:16px"></div>
        ${sez("Richieste nuove", nuovi.length ? lista(nuovi.slice(0, 6).map((l) => core.rigaScheda(l))) : `<div class="card"><p>Nessuna richiesta nuova.</p></div>`, `<a data-go="fo-lotti">Tutte</a>`)}</div>`,
    };
  };
  V["fo-listino"] = async () => { vai("elenco/prodotto", true); return { h: "" }; };

  /* ====================================================================== */
  /* IMPRESA PARTNER                                                         */
  /* ====================================================================== */
  const cantieriPartner = () => ((S.miei && S.miei.accessi) || []).filter((a) => a.ruolo === "partner");
  V["pa-home"] = async () => {
    const acc = cantieriPartner();
    const c = (await Promise.all(acc.map((a) => R.get(a.record).catch(() => null)))).filter(Boolean);
    const o = S.org ? orgDi(S.org) : null;
    return {
      t: "",
      h: `<div class="pad"><p class="saluto">${esc(o ? o.nome : (S.profilo || {}).nome || "")}</p><p class="sotto">Impresa partner di AncheCasa</p>
        ${sez("Cantieri AncheCasa che segui", c.length ? lista(c.map((x) => core.rigaScheda(x))) : `<div class="card"><p>Quando AncheCasa ti assegna un cantiere, lo trovi qui.</p></div>`)}
        ${o ? sez("La tua impresa", lista([voce("griglia", "I tuoi moduli", "Ufficio, sicurezza, cantieri…", "im-moduli", "blu"), voce("rete", "Persone", "Lavoratori e inviti", "im-persone", "blu"), voce("kit", "Kit del marchio AncheCasa", "Cartello di cantiere, adesivi, divisa", "kit", "arancio")])) : ""}</div>`,
    };
  };
  V["pa-cantieri"] = async () => {
    const c = (await Promise.all(cantieriPartner().map((a) => R.get(a.record).catch(() => null)))).filter(Boolean);
    const propri = S.org ? await R.lista(S.org, "cantiere").catch(() => []) : [];
    return { t: "Cantieri", h: `<div class="pad">${sez("AncheCasa", c.length ? lista(c.map((x) => core.rigaScheda(x))) : `<div class="card"><p>Nessun cantiere assegnato.</p></div>`)}${propri.length ? sez("I tuoi", lista(propri.map((x) => core.rigaScheda(x)))) : ""}</div>` };
  };
  V.kit = async () => ({ t: "Kit del marchio", h: `<div class="pad">${avviso("Il kit (cartello di cantiere, adesivi, divisa) lo manda AncheCasa quando parte il primo cantiere insieme. Per averlo prima scrivi in chat al tuo referente.")}</div>` });

  /* ====================================================================== */
  /* LAVORATORE                                                              */
  /* ====================================================================== */
  async function mioDipendente() {
    const l = await Q.sel("app_record", { eq: { org: S.org, tipo: "dipendente" } });
    return l.find((d) => d.dati.utente === S.utente.id) || null;
  }
  V["op-home"] = async () => {
    const o = orgDi(S.org);
    const d = await mioDipendente();
    const [figli, avvisi, cantieri] = await Promise.all([d ? R.figli(d.id) : [], R.lista(S.org, "avviso").catch(() => []), R.lista(S.org, "cantiere").catch(() => [])]);
    const s = d ? semaforoDipendente(figli) : null;
    const daFirmare = figli.filter((f) => f.tipo === "dpi" && !f.dati.firma);
    return {
      t: "",
      h: `<div class="pad"><p class="saluto">Ciao ${esc(((S.profilo || {}).nome || "").split(" ")[0])}</p><p class="sotto">${esc(o.nome || "")}</p>
        ${d ? `<div class="card tap" data-go="op-patentino" role="button" tabindex="0"><div class="riga"><span class="ico ${s[0]}">${I.scudo}</span><div class="cresci"><b>Il tuo patentino</b><small>${esc(s[1])}</small></div><span class="freccia">${I.freccia}</span></div></div>` : avviso("Il titolare non ti ha ancora collegato alla tua scheda di dipendente: chiediglielo.")}
        <div style="height:12px"></div>
        ${daFirmare.length ? sez("Da firmare", lista(daFirmare.map((x) => voce("kit", esc(x.titolo), "DPI consegnati: firma", "scheda/" + x.id, "giallo")))) : ""}
        ${avvisi.length ? sez("Avvisi", lista(avvisi.slice(0, 5).map((a) => voce("campana", esc(a.titolo), esc(a.dati.testo || quando(a.creato)), "scheda/" + a.id, "blu")))) : ""}
        ${cantieri.filter((c) => c.stato !== "finito").length ? sez("Cantieri", lista(cantieri.filter((c) => c.stato !== "finito").map((c) => voce("gru", esc(c.titolo), esc(c.dati.indirizzo || ""), null, "blu", btn("Sono qui oggi", "presente:" + c.id, "piccolo"))))) : ""}</div>`,
    };
  };
  AZIONI["presente:"] = async (id) => {
    await R.salva({ org: S.org, tipo: "presenza", rif: id, titolo: (S.profilo || {}).nome || "Lavoratore", data: new Date().toISOString().slice(0, 10), dati: { utente: S.utente.id, ore: 8 } });
    toast("Presenza registrata.");
  };
  V["op-patentino"] = async () => {
    const d = await mioDipendente();
    if (!d) return { t: "Patentino", h: `<div class="pad">${avviso("Il titolare deve collegarti alla tua scheda di dipendente.")}</div>` };
    const figli = await R.figli(d.id);
    const s = semaforoDipendente(figli);
    return {
      t: "Patentino",
      h: `<div class="pad"><div class="card patentino grande"><small>${esc(orgDi(S.org).nome || "")}</small><h3>${esc(d.titolo)}</h3><p>${esc(d.dati.mansione || "")}</p><b>${esc(d.dati.codice || "")}</b><small>Mostra questo codice all'ingresso del cantiere</small><div style="margin-top:8px">${stato(s[0], esc(s[1]))}</div></div><div style="height:14px"></div>
        ${sez("Corsi e visite", lista(figli.filter((f) => ["attestato", "visita"].includes(f.tipo)).map((f) => core.rigaScheda(f))) || vuoto("Nessun corso registrato."))}</div>`,
    };
  };
  V["op-corsi"] = async () => {
    const d = await mioDipendente();
    const figli = d ? await R.figli(d.id) : [];
    return { t: "I miei corsi", h: `<div class="pad">${figli.length ? lista(figli.map((f) => core.rigaScheda(f))) : vuoto("Nessun corso registrato.")}<div style="height:14px"></div>${lista([voce("corso", "Corsi AncheSicura", "Online e in aula", "corsi-listino", "arancio")])}</div>` };
  };
  V["op-segnala"] = async () => ({
    t: "Segnala un pericolo",
    h: `<div class="pad"><p class="sotto">Vedi qualcosa di pericoloso? Scrivilo: arriva subito al titolare.</p><form data-form="scheda-salva" data-tipo="segnalazione" data-id="" data-rif="" data-org="${esc(S.org)}" novalidate>
      ${campo("Cosa succede", `<input name="titolo" required maxlength="160">`)}${campo("Dove", `<input name="dati.dove" maxlength="400">`)}${campo("Descrizione", `<textarea name="dati.descrizione"></textarea>`)}<input type="hidden" name="stato" value="aperta">
      <label class="campo"><span>Foto (facoltativa)</span><input type="file" name="__file" accept="image/*" capture="environment"></label><button class="btn" type="submit">Manda la segnalazione</button></form></div>`,
  });

  /* ====================================================================== */
  /* CONSULENTE ANCHESICURA                                                  */
  /* ====================================================================== */
  const aziendeConsulente = () => ((S.miei && S.miei.org) || []).filter((o) => o.ruolo === "consulente");
  async function statoSicurezza(org) {
    const [dip, figli] = await Promise.all([R.lista(org, "dipendente"), Q.sel("app_record", { eq: { org }, in: { tipo: ["attestato", "visita"] }, lim: 2000 })]);
    const s = dip.map((d) => semaforoDipendente(figli.filter((f) => f.rif === d.id)));
    return { dip: dip.length, rossi: s.filter((x) => x[0] === "rosso").length, gialli: s.filter((x) => x[0] === "giallo").length };
  }
  V["co-home"] = async () => {
    const az = aziendeConsulente();
    const st = await Promise.all(az.map((o) => statoSicurezza(o.id).catch(() => ({ dip: 0, rossi: 0, gialli: 0 }))));
    const sop = (await Promise.all(az.map((o) => R.lista(o.id, "sopralluogo").catch(() => [])))).flat();
    const prossimi = sop.filter((x) => x.scadenza).sort((a, b) => (a.scadenza > b.scadenza ? 1 : -1)).slice(0, 5);
    return {
      t: "",
      h: `<div class="pad"><p class="saluto">AncheSicura</p><p class="sotto">Consulente · ${az.length} aziende seguite</p>
        <div class="griglia2">${num(az.length, "Aziende")}${num(st.reduce((s, x) => s + x.rossi, 0), "Dipendenti non in regola", "rosso")}</div><div style="height:16px"></div>
        ${sez("Aziende", az.length ? lista(az.map((o, i) => voce("ufficio", esc(o.nome), `${st[i].dip} dipendenti · ${st[i].rossi} non in regola · ${st[i].gialli} in scadenza`, "co-azienda/" + o.id, st[i].rossi ? "rosso" : st[i].gialli ? "giallo" : "verde"))) : `<div class="card"><p>Quando un'azienda ti invita come consulente, la trovi qui.</p></div>`)}
        ${prossimi.length ? sez("Prossimi sopralluoghi", lista(prossimi.map((x) => voce("calendario", esc(x.titolo), giornoIt(x.scadenza), "scheda/" + x.id, "blu")))) : ""}</div>`,
    };
  };
  V["co-aziende"] = async () => ({ t: "Aziende seguite", h: `<div class="pad">${lista(aziendeConsulente().map((o) => voce("ufficio", esc(o.nome), "", "co-azienda/" + o.id, "blu"))) || vuoto("Nessuna azienda.")}</div>` });
  V["co-azienda"] = async (org) => {
    const o = orgDi(org);
    const st = await statoSicurezza(org);
    return {
      t: o.nome || "Azienda",
      h: `<div class="pad"><div class="griglia3">${num(st.rossi, "Non in regola", "rosso")}${num(st.gialli, "In scadenza", "giallo")}${num(st.dip, "Dipendenti")}</div><div style="height:14px"></div>
        <div class="griglia2">${[["dipendente", "Dipendenti"], ["sopralluogo", "Sopralluoghi"], ["segnalazione", "Segnalazioni"], ["avviso", "Avvisi"], ["verbale", "Verbali"], ["ingresso", "Ingressi"]].map(([t, n]) => tile(TIPI[t].ico, n, "", "elenco/" + t + "/" + org)).join("")}</div><div style="height:14px"></div>
        ${btn(I.piu + " Nuovo sopralluogo", "go:modifica/sopralluogo/nuovo//" + org)}</div>`,
    };
  };
  V["co-agenda"] = async () => {
    const az = aziendeConsulente();
    const sop = (await Promise.all(az.map((o) => R.lista(o.id, "sopralluogo").then((l) => l.map((x) => Object.assign(x, { _org: o.nome }))).catch(() => [])))).flat();
    const l = sop.filter((x) => x.scadenza).sort((a, b) => (a.scadenza > b.scadenza ? 1 : -1));
    return { t: "Agenda", h: `<div class="pad">${l.length ? lista(l.map((x) => voce("calendario", esc(x._org), "Prossimo sopralluogo " + giornoIt(x.scadenza), "scheda/" + x.id, (semaforo(x.scadenza) || ["blu"])[0]))) : vuoto("Nessun sopralluogo in agenda.")}</div>` };
  };

  /* ====================================================================== */
  /* PROPRIETARIO DEL CANTIERE                                               */
  /* ====================================================================== */
  const mieiCantieri = () => ((S.miei && S.miei.accessi) || []).filter((a) => a.ruolo === "cliente");
  const cantiereScelto = () => { const l = mieiCantieri(); return (l.find((a) => a.record === core.memo.get("cantiere")) || l[0] || {}).record; };
  V["cl-home"] = async () => {
    const l = mieiCantieri();
    if (!l.length) return { t: "Il mio cantiere", h: vuoto("Nessun cantiere collegato.") };
    const id = cantiereScelto();
    const c = await R.get(id);
    if (!c) return { t: "Il mio cantiere", h: vuoto("Cantiere non disponibile.") };
    const figli = await R.figli(id);
    const fasi = figli.filter((f) => f.tipo === "fase").sort((a, b) => ((a.data || "") > (b.data || "") ? 1 : -1));
    const giornale = figli.filter((f) => f.tipo === "giornale").slice(0, 3);
    const salDa = figli.filter((f) => f.tipo === "sal" && f.stato === "inviato");
    const av = Number(c.dati.avanzamento || 0);
    const o = await Q.uno("app_org", { id: c.org }).catch(() => null);
    const recensito = (await Q.sel("app_recensioni_org", { eq: { lavoro: id, autore: S.utente.id } }).catch(() => [])).length;
    return {
      t: "",
      h: `<div class="pad">${l.length > 1 ? `<div class="pillole">${l.map((a) => `<button type="button" class="pillola ${a.record === id ? "on" : ""}" data-az="scegli-cantiere:${esc(a.record)}">${esc(a.titolo)}</button>`).join("")}</div><div style="height:10px"></div>` : ""}
        <div class="eroe"><h3>${esc(c.titolo)}</h3><p>${esc(o ? o.nome : "")}${c.scadenza ? " · fine prevista " + giornoIt(c.scadenza) : ""}</p><div class="barra-av"><i style="width:${av}%"></i></div><p style="margin:8px 0 0">${av}% fatto</p></div><div style="height:14px"></div>
        ${salDa.length ? sez("Da approvare", lista(salDa.map((s) => voce("doc", esc(s.titolo), euro(s.importo), "scheda/" + s.id, "giallo", stato("giallo", "Approva"))))) : ""}
        ${fasi.length ? sez("Le fasi", `<div class="tl">${fasi.map((f) => `<div class="p ${Number(f.dati.avanzamento) >= 100 ? "fatto" : Number(f.dati.avanzamento) > 0 ? "ora" : ""}"><b>${esc(f.titolo)}</b><small>${Number(f.dati.avanzamento) || 0}% · ${giornoIt(f.data)}</small></div>`).join("")}</div>`) : ""}
        ${giornale.length ? sez("Dal cantiere", lista(giornale.map((g) => voce("foto", esc(g.titolo), giornoIt(g.data), "scheda/" + g.id, "blu"))), `<a data-go="scheda/${esc(id)}">Tutto</a>`) : ""}
        ${sez("Le tue garanzie", lista([voce("scudo", "Fideiussione", esc(c.dati.fideiussione || "Te la mostra l'impresa"), null, "verde"), voce("euro", "Conto dedicato", esc(c.dati.conto || "I pagamenti passano dal conto del cantiere"), null, "verde"), voce("utente", "Un referente", "Scrivi in chat quando vuoi", "cl-chat", "verde")]))}
        ${c.stato === "finito" && !recensito ? btn(I.stella + " Lavori finiti: lascia la recensione", "go:cl-recensione/" + id) : ""}</div>`,
    };
  };
  AZIONI["scegli-cantiere:"] = (id) => { core.memo.set("cantiere", id); render(); };
  V["cl-pagamenti"] = async () => {
    const id = cantiereScelto();
    const sal = id ? (await R.figli(id, "sal")).filter((s) => s.stato !== "bozza") : [];
    const pagato = sal.filter((s) => s.stato === "pagato").reduce((s, x) => s + Number(x.importo || 0), 0);
    return { t: "Pagamenti", h: `<div class="pad"><div class="griglia2">${num(euro(pagato) || "0 €", "Pagato", "verde")}${num(sal.filter((s) => s.stato === "inviato").length, "SAL da approvare", "giallo")}</div><div style="height:14px"></div>${sal.length ? lista(sal.map((s) => core.rigaScheda(s))) : vuoto("Ancora nessuno stato di avanzamento.")}</div>` };
  };
  V["cl-segnala"] = async () => {
    const id = cantiereScelto();
    if (!id) return { t: "Segnala", h: vuoto("Nessun cantiere.") };
    return {
      t: "Segnala un problema",
      h: `<div class="pad"><p class="sotto">Qualcosa non va nel cantiere? Scrivilo: arriva subito all'impresa e ad AncheCasa.</p><form data-form="scheda-salva" data-tipo="segnalazione_cliente" data-id="" data-rif="${esc(id)}" data-org="" novalidate>
        ${campo("Cosa non va", `<input name="titolo" required maxlength="160">`)}${campo("Descrizione", `<textarea name="dati.descrizione"></textarea>`)}<input type="hidden" name="stato" value="aperta">
        <label class="campo"><span>Foto (facoltativa)</span><input type="file" name="__file" accept="image/*" capture="environment"></label><button class="btn" type="submit">Manda</button></form></div>`,
    };
  };
  V["cl-chat"] = async () => { const id = cantiereScelto(); if (id) vai("chat/" + id, true); return { t: "Chat", h: vuoto("Nessun cantiere.") }; };
  V["cl-recensione"] = async (id) => ({
    t: "Recensione",
    h: `<div class="pad"><p class="sotto">Com'è andato il cantiere? La recensione va all'impresa che ha fatto i lavori.</p><form data-form="cl-recensione" data-id="${esc(id)}" novalidate>
      ${core.VOCI.map(([k, t]) => `<fieldset class="voto"><legend>${t}</legend><div class="stelline">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" id="c${k}${n}" name="${k}" value="${n}"><label for="c${k}${n}" aria-label="${n} stelle">★</label>`).join("")}</div></fieldset>`).join("")}
      ${campo("Due parole", `<textarea name="testo" maxlength="600"></textarea>`)}<button class="btn" type="submit">Pubblica</button></form></div>`,
  });
  FORM["cl-recensione"] = async (f) => {
    const voti = {};
    core.VOCI.forEach(([k]) => { const x = f.querySelector(`input[name="${k}"]:checked`); if (x) voti[k] = Number(x.value); });
    if (Object.keys(voti).length < core.VOCI.length) return toast("Dai un voto a tutte le voci.", "errore");
    await Q.rpc("app_recensisci_cantiere", { p_cantiere: f.dataset.id, p_voti: voti, p_testo: f.testo.value.trim() });
    toast("Grazie! Recensione pubblicata."); vai("cl-home", true);
  };

  /* ====================================================================== */
  /* CHAT DEL CANTIERE                                                       */
  /* ====================================================================== */
  V.chat = async (id) => {
    const [c, m] = await Promise.all([R.get(id), Q.sel("app_messaggi", { eq: { record: id }, ord: ["creato", true], lim: 300 })]);
    return {
      t: c ? c.titolo : "Chat",
      h: `<div class="pad chat">${m.length ? m.map((x) => `<div class="bolla ${x.autore === S.utente.id ? "mia" : ""}">${x.autore === S.utente.id ? "" : `<small>${esc(x.nome || "")}</small>`}${esc(x.testo)}<small class="ora">${quando(x.creato)}</small></div>`).join("") : vuoto("Scrivi il primo messaggio.")}</div>
        <form class="scrivi" data-form="chat" data-id="${esc(id)}" novalidate><input name="testo" maxlength="2000" placeholder="Scrivi un messaggio" aria-label="Messaggio" autocomplete="off"><button class="btn piccolo" type="submit">Invia</button></form>`,
      dopo: (el) => { el.scrollTop = el.scrollHeight; },
    };
  };
  FORM.chat = async (f) => {
    const t = f.testo.value.trim(); if (!t) return;
    await Q.ins("app_messaggi", { record: f.dataset.id, testo: t, nome: ((S.profilo || {}).nome || "").split(" ")[0] });
    render();
  };

  /* ====================================================================== */
  /* REGISTRARE UN'AZIENDA (dal profilo)                                     */
  /* ====================================================================== */
  PROFILO_EXTRA.push(() => sez("Lavori con un'azienda?", lista([voce("ufficio", "Registra la tua impresa o il tuo negozio di materiali", "Poi scegli i moduli che ti servono", "nuova-azienda", "blu")])));
  V["nuova-azienda"] = async () => ({
    t: "La tua azienda",
    h: `<div class="pad"><form data-form="nuova-azienda" novalidate>
      <div class="scelte" role="radiogroup"><label class="scelta"><input type="radio" name="tipo" value="impresa" checked><span>${I.ufficio}<b>Impresa</b><small>Lavori, cantieri, gare, sicurezza</small></span></label><label class="scelta"><input type="radio" name="tipo" value="fornitore"><span>${I.box}<b>Fornitore</b><small>Materiali e noleggi: rispondi alle richieste dei cantieri</small></span></label></div>
      ${campo("Ragione sociale", `<input name="nome" required maxlength="120">`)}${campo("Partita IVA", `<input name="piva" maxlength="20" inputmode="numeric">`)}${campo("Città", `<input name="citta" maxlength="80" value="${esc((S.profilo || {}).citta || "")}">`)}${campo("Regione", `<select name="regione">${REGIONI.map((r) => `<option ${r === "Lazio" ? "selected" : ""}>${r}</option>`).join("")}</select>`)}${campo("Telefono", `<input name="telefono" type="tel" maxlength="30">`)}${campo("Mail", `<input name="email" type="email" maxlength="120">`)}
      <button class="btn" type="submit">Registra</button></form></div>`,
  });
  FORM["nuova-azienda"] = async (f) => {
    if (f.nome.value.trim().length < 2) return toast("Scrivi la ragione sociale.", "errore");
    const o = await Q.ins("app_org", { nome: f.nome.value.trim(), tipo: f.tipo.value, piva: f.piva.value.trim(), citta: f.citta.value.trim(), regione: f.regione.value, telefono: f.telefono.value.trim(), email: f.email.value.trim(), titolare: S.utente.id });
    try { await Q.ins("app_moduli", { org: o.id, modulo: "base", stato: "richiesto" }); } catch (e) { console.warn(e); }
    await core.caricaProfili();
    core.scegliProfilo((o.tipo === "fornitore" ? "fornitore:" : "impresa:") + o.id);
    toast("Azienda registrata."); vai(o.tipo === "fornitore" ? "fo-home" : "im-moduli", true);
  };
}
