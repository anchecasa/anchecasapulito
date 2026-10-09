/* Rete commerciale: Responsabile Rete Italia → responsabile sviluppo rete → capoarea → agente → sub-agente.
   Il segnalatore è un privato (parte 1, «Segnala ad AncheCasa»). */
import { I, esc, voce, lista, sez, stato, num, btn, campo, vuoto, avviso, virgola, quando, toast, foglio, chiudiFoglio, spiegaErrore } from "./ui.js";
import { Q } from "./q.js";
import { euro } from "./schede.js";
import { MODULI, PREZZI_PREDEFINITI, CORSI, SERVIZI, REGIONI, AREE } from "./catalogo.js";

export const RUOLI_RETE = { reteitalia: "Responsabile Rete Italia", sviluppo: "Responsabile sviluppo rete", capoarea: "Capoarea", agente: "Agente", subagente: "Sub-agente" };
const SOTTO = { reteitalia: "sviluppo", sviluppo: "capoarea", capoarea: "agente", agente: "subagente" };
const COSA = { modulo: "Modulo dell'app", pacchetto: "Pacchetto Impresa completa", corso: "Corso AncheSicura", servizio: "Servizio AncheSicura", ristrutturazione: "Ristrutturazione AncheCasa", supermastro: "SuperMastro per artigiani", altro: "Altro" };

export function installa(core) {
  const { S, V, AZIONI, FORM, PROFILI, vai, render } = core;
  const tabs = (ultimo) => [["re-home", "casa", "Oggi"], ["re-clienti", "lista", "Clienti"], ["re-vendi", "piu", "Vendi", true], ultimo, ["profilo", "utente", "Profilo"]];
  PROFILI.reteitalia = { tabs: [["ri-home", "grafico", "Italia"], ["ri-aree", "rete", "Aree"], ["re-vendi", "piu", "Vendi", true], ["re-clienti", "lista", "Clienti"], ["profilo", "utente", "Profilo"]] };
  PROFILI.sviluppo = { tabs: tabs(["re-squadra", "rete", "Squadra"]) };
  PROFILI.capoarea = { tabs: tabs(["re-squadra", "rete", "Squadra"]) };
  PROFILI.agente = { tabs: tabs(["re-squadra", "rete", "Squadra"]) };
  PROFILI.subagente = { tabs: tabs(["re-guadagni", "euro", "Guadagni"]) };

  const io = () => (S.miei && S.miei.rete) || {};
  async function squadra() {
    const tutti = await Q.sel("app_rete", { lim: 1000 }).catch(() => []);
    return tutti.filter((r) => r.utente !== S.utente.id);
  }
  const meseCorrente = () => new Date().toISOString().slice(0, 7);

  V["re-home"] = async () => {
    const me = io();
    const [vend, prov, sq] = await Promise.all([Q.sel("app_vendite", { ord: ["creato", false], lim: 1000 }).catch(() => []), Q.sel("app_provvigioni", { eq: { beneficiario: S.utente.id }, lim: 1000 }).catch(() => []), squadra()]);
    const mie = vend.filter((v) => v.venditore === S.utente.id);
    const delMese = prov.filter((p) => String(p.mese || p.creato).slice(0, 7) === meseCorrente()).reduce((s, p) => s + Number(p.importo), 0);
    const daPagare = prov.filter((p) => p.stato === "maturata").reduce((s, p) => s + Number(p.importo), 0);
    const report = ["sviluppo", "capoarea"].includes(me.ruolo);
    return {
      t: "",
      h: `<div class="pad"><p class="saluto">Ciao ${esc(((S.profilo || {}).nome || "").split(" ")[0])}</p><p class="sotto">${esc(RUOLI_RETE[me.ruolo] || "")}${me.regione ? " · " + esc(me.regione) : me.area ? " · " + esc(me.area) : ""}</p>
        ${["sviluppo", "reteitalia"].includes(me.ruolo) && !me.accordo ? `${avviso("Prima di cominciare firma l'accordo di collaborazione.")}<div style="height:8px"></div>${btn("Leggi e firma l'accordo", "go:re-accordo")}<div style="height:14px"></div>` : ""}
        <div class="card patentino"><small>Il tuo codice: i clienti lo scrivono quando ordinano</small><b>${esc(me.codice || "")}</b></div><div style="height:12px"></div>
        <div class="griglia2">${num(euro(delMese) || "0 €", "Provvigioni del mese", "verde")}${num(euro(daPagare) || "0 €", "Da ricevere")}${num(mie.filter((v) => v.stato === "attiva").length, "Clienti attivi")}${num(me.ruolo === "subagente" ? mie.filter((v) => v.stato === "proposta").length : sq.length, me.ruolo === "subagente" ? "Proposte aperte" : "Nella tua squadra")}</div><div style="height:16px"></div>
        ${sez("Da seguire", lista(mie.filter((v) => v.stato === "proposta").slice(0, 5).map((v) => voce("utente", esc(v.cliente_nome), esc(COSA[v.cosa] + (v.dettaglio ? " · " + v.dettaglio : "")), "re-vendita/" + v.id, "giallo"))) || `<div class="card"><p>Nessuna proposta aperta. ${btn("Vendi", "go:re-vendi", "piccolo")}</p></div>`)}
        ${sez("Strumenti", lista([
          ...(report ? [voce("stella", "Report recensioni", me.ruolo === "sviluppo" ? "Imprese e lavori della tua area" : "Imprese e lavori della tua regione", "report-rec", "verde")] : []),
          voce("corso", "Listino AncheSicura", "Corsi e servizi da proporre", "corsi-listino", "blu"),
          voce("euro", "Guadagni", "Provvigioni maturate e pagate", "re-guadagni", "blu"),
        ]))}</div>`,
    };
  };

  V["re-accordo"] = async () => ({
    t: "Accordo di collaborazione",
    h: `<div class="pad"><div class="card">${io().ruolo === "reteitalia" ? `<h3>Responsabile Rete Italia AncheCasa</h3><p>Guidi tutta la rete commerciale: coordini i tre responsabili sviluppo rete (Nord, Centro, Sud e isole) e, tramite loro, i capi area.</p><p>Proponi ad AncheCasa le regioni da aprire e tieni lo stesso metodo in tutta Italia.</p><p>Quota: il 5% della quota della rete su tutti gli affari d'Italia, più la quota di chi porta il cliente sui clienti tuoi.</p>` : `<h3>Responsabile sviluppo rete AncheCasa</h3><p>Fase 1, primi 90 giorni: inserisci aziende in tutta Italia; ogni azienda passa dalla verifica di AncheCasa.</p><p>Fase 2: AncheCasa ti assegna un'area (Nord, Centro o Sud e isole): segui clienti, privati e la squadra di capiarea e agenti dell'area.</p><p>Compensi e obiettivi: come da accordo firmato con AncheCasa.</p>`}</div><div style="height:12px"></div>
      ${avviso("Il testo completo dell'accordo te lo manda AncheCasa. Firmando qui confermi di averlo letto e accettato.")}<div style="height:12px"></div>
      ${io().accordo ? stato("verde", "Firmato il " + new Date(io().accordo).toLocaleDateString("it-IT")) : btn("Firmo l'accordo", "firma-accordo")}</div>`,
  });
  AZIONI["firma-accordo"] = async () => { await Q.rpc("app_firma_accordo"); await core.caricaProfili(); toast("Accordo firmato."); vai("re-home", true); };

  V["re-vendi"] = async () => {
    let pr = PREZZI_PREDEFINITI;
    try { const x = await Q.uno("app_impostazioni", { chiave: "prezzi_moduli" }); if (x) pr = Object.assign({}, pr, x.valore); } catch (e) { /* predefiniti */ }
    return {
      t: "Vendi",
      h: `<div class="pad"><p class="sotto">Registra il cliente e cosa gli proponi. Quando paga, AncheCasa conferma la vendita e maturano le provvigioni.</p>
        <form data-form="re-vendi" novalidate>
          ${campo("Cliente (azienda o persona)", `<input name="cliente" required maxlength="120">`)}${campo("Telefono o mail", `<input name="contatto" maxlength="120">`)}
          ${campo("Regione del cliente", `<select name="regione"><option value="">—</option>${REGIONI.map((r) => `<option ${r === io().regione ? "selected" : ""}>${r}</option>`).join("")}</select>`)}
          ${campo("Cosa proponi", `<select name="cosa">${Object.entries(COSA).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>`)}
          ${campo("Dettaglio", `<input name="dettaglio" maxlength="200" list="sugg-vendi" placeholder="Es. modulo Sicurezza, corso preposto per 2 persone">`)}<datalist id="sugg-vendi">${MODULI.map((m) => `<option value="${esc(m.nome)} · ${pr[m.id]} € al mese">`).join("")}<option value="Impresa completa · ${pr.pacchetto} € al mese">${CORSI.map((c) => `<option value="${esc(c.nome)} · ${c.prezzo} €">`).join("")}${SERVIZI.filter((x) => x.prezzo).map((x) => `<option value="${esc(x.nome)} · da ${x.prezzo} €">`).join("")}</datalist>
          <div class="griglia2">${campo("Importo", `<input name="importo" type="number" step="0.01" min="0" required>`)}${campo("È", `<select name="tipo"><option value="mese">al mese</option><option value="una_tantum">una volta</option></select>`)}</div>
          <button class="btn" type="submit">Registra la proposta</button></form>
        <div style="height:14px"></div>${lista([voce("corso", "Listino AncheSicura", "Prezzi di corsi e servizi", "corsi-listino", "blu")])}</div>`,
    };
  };
  FORM["re-vendi"] = async (f) => {
    if (f.cliente.value.trim().length < 2) return toast("Scrivi il nome del cliente.", "errore");
    if (f.importo.value === "") return toast("Scrivi l'importo.", "errore");
    await Q.ins("app_vendite", { venditore: S.utente.id, cliente_nome: f.cliente.value.trim(), cliente_contatto: f.contatto.value.trim(), cliente_regione: f.regione.value, cosa: f.cosa.value, dettaglio: f.dettaglio.value.trim(), importo: Number(f.importo.value), tipo_importo: f.tipo.value });
    toast("Proposta registrata."); vai("re-clienti");
  };

  const ST = { proposta: ["giallo", "Proposta"], attiva: ["verde", "Attiva"], persa: ["rosso", "Persa"] };
  V["re-clienti"] = async (filtro) => {
    filtro = filtro || "miei";
    const [vend, sq] = await Promise.all([Q.sel("app_vendite", { ord: ["creato", false], lim: 1000 }).catch(() => []), squadra()]);
    const nome = (u) => (sq.find((x) => x.utente === u) || {}).nome || "";
    const l = filtro === "miei" ? vend.filter((v) => v.venditore === S.utente.id) : vend.filter((v) => v.venditore !== S.utente.id);
    const conSquadra = io().ruolo !== "subagente";
    return {
      t: "Clienti",
      h: `<div class="pad">${conSquadra ? `<div class="pillole"><button type="button" class="pillola ${filtro === "miei" ? "on" : ""}" data-go="re-clienti/miei">I miei</button><button type="button" class="pillola ${filtro === "squadra" ? "on" : ""}" data-go="re-clienti/squadra">Della squadra</button></div><div style="height:12px"></div>` : ""}
        ${l.length ? lista(l.map((v) => voce("utente", esc(v.cliente_nome), esc(COSA[v.cosa] || v.cosa) + " · " + euro(v.importo) + (v.tipo_importo === "mese" ? "/mese" : "") + (filtro === "squadra" ? " · " + esc(nome(v.venditore)) : ""), "re-vendita/" + v.id, "", stato(...ST[v.stato])))) : vuoto(filtro === "miei" ? "Nessun cliente ancora.<br><br>" + btn("Vendi", "go:re-vendi") : "La tua squadra non ha ancora clienti.")}</div>`,
    };
  };
  V["rete-vendite"] = V["re-clienti"];
  V["re-vendita"] = async (id) => {
    const v = await Q.uno("app_vendite", { id });
    if (!v) return { t: "Cliente", h: vuoto("Non trovato.") };
    const prov = await Q.sel("app_provvigioni", { eq: { vendita: id } }).catch(() => []);
    return {
      t: v.cliente_nome,
      h: `<div class="pad"><div class="card"><dl class="campi"><dt>Cosa</dt><dd>${esc(COSA[v.cosa] || v.cosa)}${v.dettaglio ? " · " + esc(v.dettaglio) : ""}</dd><dt>Importo</dt><dd>${euro(v.importo)}${v.tipo_importo === "mese" ? " al mese" : ""}</dd>${v.cliente_contatto ? `<dt>Contatto</dt><dd>${esc(v.cliente_contatto)}</dd>` : ""}<dt>Stato</dt><dd>${stato(...ST[v.stato])}</dd><dt>Registrato</dt><dd>${quando(v.creato)}</dd></dl></div><div style="height:12px"></div>
        ${prov.length ? sez("Provvigioni", lista(prov.map((p) => voce("euro", euro(p.importo), esc(RUOLI_RETE[p.ruolo] || p.ruolo) + " · " + (p.stato === "pagata" ? "pagata" : "maturata"), null, "verde")))) : v.stato === "proposta" ? avviso("Le provvigioni maturano quando AncheCasa conferma il pagamento del cliente.") : ""}
        ${v.stato === "proposta" && v.venditore === S.utente.id ? `<div style="height:12px"></div>${btn("Il cliente non è interessato", "vendita-persa:" + v.id, "chiaro")}` : ""}</div>`,
    };
  };
  AZIONI["vendita-persa:"] = async (id) => { await Q.upd("app_vendite", { id }, { stato: "persa" }); toast("Segnata come persa."); render(); };

  V["re-squadra"] = async () => {
    const me = io();
    const [sq, inv] = await Promise.all([squadra(), Q.sel("app_inviti", { eq: { cosa: "rete", creato_da: S.utente.id }, ord: ["creato", false] }).catch(() => [])]);
    const diretti = sq.filter((x) => x.superiore === S.utente.id);
    const altri = sq.filter((x) => x.superiore !== S.utente.id);
    const prossimo = SOTTO[me.ruolo];
    return {
      t: "La mia squadra",
      h: `<div class="pad">${sez("Diretti", diretti.length ? lista(diretti.map((x) => voce("rete", esc(x.nome || RUOLI_RETE[x.ruolo]), esc(RUOLI_RETE[x.ruolo]) + (x.regione ? " · " + esc(x.regione) : "") + (x.stato !== "attivo" ? " · sospeso" : ""), null, x.stato === "attivo" ? "verde" : "rosso"))) : `<div class="card"><p>Nessuno ancora.</p></div>`)}
        ${altri.length ? sez("Più sotto", lista(altri.map((x) => voce("rete", esc(x.nome || RUOLI_RETE[x.ruolo]), esc(RUOLI_RETE[x.ruolo]), null, "blu")))) : ""}
        ${prossimo ? sez("Invita un " + RUOLI_RETE[prossimo].toLowerCase(), `<form data-form="re-invita" data-ruolo="${prossimo}" novalidate>${campo("Nome", `<input name="nome" maxlength="80">`)}${campo("Mail", `<input name="email" type="email" required>`)}<button class="btn" type="submit">Crea l'invito</button></form>${prossimo === "sviluppo" ? `<p class="sotto piccolo">L'area (Nord, Centro o Sud e isole) la assegna AncheCasa dopo l'ingresso.</p>` : ""}`) : ""}
        ${inv.filter((i) => i.stato === "inviato").length ? sez("Inviti in attesa", lista(inv.filter((i) => i.stato === "inviato").map((i) => voce("campana", esc(i.email), esc(RUOLI_RETE[i.ruolo]), null, "giallo", btn("Link", "link-invito:" + i.token, "piccolo chiaro"))))) : ""}</div>`,
    };
  };
  FORM["re-invita"] = async (f) => {
    const email = f.email.value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast("Controlla la mail.", "errore");
    const i = await Q.ins("app_inviti", { cosa: "rete", ruolo: f.dataset.ruolo, email, nome: f.nome.value.trim() });
    core.mostraInvito(i);
  };

  V["re-guadagni"] = async () => {
    const p = await Q.sel("app_provvigioni", { eq: { beneficiario: S.utente.id }, ord: ["creato", false], lim: 1000 }).catch(() => []);
    const tot = (f) => p.filter(f).reduce((s, x) => s + Number(x.importo), 0);
    return {
      t: "Guadagni",
      h: `<div class="pad"><div class="griglia2">${num(euro(tot((x) => x.stato === "maturata")) || "0 €", "Da ricevere", "verde")}${num(euro(tot((x) => x.stato === "pagata")) || "0 €", "Già pagate")}</div><div style="height:12px"></div>
        ${io().ruolo === "subagente" ? avviso("Sulle tue vendite: il 70% della provvigione è tuo, il 30% va al tuo agente (percentuali decise da AncheCasa).") + '<div style="height:12px"></div>' : ""}
        ${io().ruolo === "reteitalia" ? avviso("Quote della rete: 70% chi porta il cliente, 17% sviluppo rete, 8% capo area, 5% a te su tutti gli affari d'Italia.") + '<div style="height:12px"></div>' : ""}
        ${p.length ? lista(p.map((x) => voce("euro", euro(x.importo), esc(RUOLI_RETE[x.ruolo] || x.ruolo) + " · " + quando(x.creato), "re-vendita/" + x.vendita, x.stato === "pagata" ? "verde" : "giallo", stato(x.stato === "pagata" ? "verde" : "giallo", x.stato)))) : vuoto("Ancora nessuna provvigione.")}</div>`,
    };
  };

  /* ---------------- Responsabile Rete Italia: tutta la rete, area per area, regione per regione ---------------- */
  const NOMI_AREA = Object.keys(AREE); // Nord, Centro, Sud e isole
  const areaDi = (reg) => NOMI_AREA.find((a) => AREE[a].includes(reg)) || "";
  const normArea = (a) => NOMI_AREA.find((x) => x.toLowerCase() === String(a || "").toLowerCase()) || "";
  async function datiItalia() {
    const [rete, vend, prov] = await Promise.all([Q.sel("app_rete", { lim: 2000 }).catch(() => []), Q.sel("app_vendite", { ord: ["creato", false], lim: 3000 }).catch(() => []), Q.sel("app_provvigioni", { lim: 5000 }).catch(() => [])]);
    const per = {}; rete.forEach((r) => { per[r.utente] = r; });
    // regione e area di una persona: la sua, oppure quella di chi sta sopra
    const regioneDi = (u) => { let r = per[u], k = 0; while (r && !r.regione && r.superiore && k++ < 6) r = per[r.superiore]; return (r && r.regione) || ""; };
    const areaPers = (u) => { const r = per[u] || {}; return normArea(r.area) || areaDi(regioneDi(u)); };
    const vendA = vend.map((v) => Object.assign({}, v, { _reg: v.cliente_regione || regioneDi(v.venditore), _area: areaDi(v.cliente_regione) || areaPers(v.venditore) }));
    const mensile = (l) => l.filter((v) => v.stato === "attiva" && v.tipo_importo === "mese").reduce((s, v) => s + Number(v.importo), 0);
    return { rete, per, vend: vendA, prov, regioneDi, areaPers, mensile };
  }
  const attivi = (l) => l.filter((r) => r.stato === "attivo");
  const contaRuolo = (l, ruolo) => attivi(l).filter((r) => r.ruolo === ruolo).length;
  const pl = (n, uno, piu) => n + " " + (n === 1 ? uno : piu);

  V["ri-home"] = async () => {
    const me = io(); const d = await datiItalia();
    const mieProv = d.prov.filter((p) => p.beneficiario === S.utente.id);
    const delMese = mieProv.filter((p) => String(p.mese || p.creato).slice(0, 7) === meseCorrente()).reduce((s, p) => s + Number(p.importo), 0);
    const coperte = REGIONI.filter((reg) => attivi(d.rete).some((r) => r.ruolo === "capoarea" && r.regione === reg)).length;
    const proposte = d.vend.filter((v) => v.stato === "proposta").length;
    const maturate = d.prov.filter((p) => p.stato === "maturata").reduce((s, p) => s + Number(p.importo), 0);
    const cartaArea = (a) => {
      const pers = d.rete.filter((r) => d.areaPers(r.utente) === a && r.ruolo !== "reteitalia");
      const sv = attivi(pers).filter((r) => r.ruolo === "sviluppo");
      const va = d.vend.filter((v) => v._area === a);
      return voce("rete", "Area " + a, `${sv.length ? "Sviluppo: " + esc(sv.map((x) => x.nome || x.codice).join(", ")) : "Sviluppo rete da nominare"} · ${pl(contaRuolo(pers, "capoarea"), "capo area", "capi area")} · ${pl(contaRuolo(pers, "agente") + contaRuolo(pers, "subagente"), "agente", "agenti")} · ${euro(d.mensile(va)) || "0 €"}/mese`, "ri-area/" + encodeURIComponent(a), sv.length ? "verde" : "rosso");
    };
    return {
      t: "",
      h: `<div class="pad"><p class="saluto">Ciao ${esc(((S.profilo || {}).nome || "").split(" ")[0])}</p><p class="sotto">Responsabile Rete Italia · tutta Italia</p>
        ${!me.accordo ? `${avviso("Prima di cominciare firma l'accordo di collaborazione.")}<div style="height:8px"></div>${btn("Leggi e firma l'accordo", "go:re-accordo")}<div style="height:14px"></div>` : ""}
        <div class="griglia2">${num(attivi(d.rete).length, "Persone attive nella rete", "verde")}${num(coperte + " su 20", "Regioni con capo area")}${num(euro(d.mensile(d.vend)) || "0 €", "Canoni attivi al mese", "verde")}${num(proposte, "Proposte da chiudere", proposte ? "giallo" : "")}</div><div style="height:12px"></div>
        <div class="griglia2">${num(euro(delMese) || "0 €", "Le tue provvigioni del mese", "verde")}${num(euro(maturate) || "0 €", "Provvigioni della rete da pagare")}</div><div style="height:16px"></div>
        ${sez("Le tre aree", lista(NOMI_AREA.map(cartaArea)))}
        ${sez("Strumenti", lista([
          voce("rete", "La tua squadra", "Responsabili sviluppo rete e inviti", "re-squadra", "blu"),
          voce("stella", "Report recensioni", "Imprese e lavori di tutta Italia", "report-rec", "verde"),
          voce("lista", "Clienti della rete", "Tutte le vendite, con chi le ha fatte", "re-clienti/squadra", "blu"),
          voce("euro", "Guadagni", "Le tue provvigioni", "re-guadagni", "blu"),
          voce("corso", "Listino AncheSicura", "Corsi e servizi da proporre", "corsi-listino", "blu"),
        ]))}</div>`,
    };
  };

  V["ri-aree"] = async () => {
    const d = await datiItalia();
    return {
      t: "Aree e regioni",
      h: `<div class="pad">${NOMI_AREA.map((a) => {
        const righe = AREE[a].map((reg) => {
          const pers = d.rete.filter((r) => d.regioneDi(r.utente) === reg);
          const ca = attivi(pers).filter((r) => r.ruolo === "capoarea");
          const ag = contaRuolo(pers, "agente") + contaRuolo(pers, "subagente");
          const va = d.vend.filter((v) => v._reg === reg);
          return voce("mappa", esc(reg), ca.length ? `Capo area: ${esc(ca.map((x) => x.nome || x.codice).join(", "))} · ${pl(ag, "agente", "agenti")} · ${pl(va.filter((v) => v.stato === "attiva").length, "cliente attivo", "clienti attivi")}` : ag || va.length ? `Senza capo area · ${pl(ag, "agente", "agenti")} · ${pl(va.length, "vendita", "vendite")}` : "Da aprire", "ri-regione/" + encodeURIComponent(reg), ca.length ? "verde" : ag || va.length ? "giallo" : "rosso");
        });
        return sez("Area " + a, lista([voce("rete", "Riepilogo dell'area " + a, "Sviluppo rete, persone e vendite", "ri-area/" + encodeURIComponent(a), "blu"), ...righe]));
      }).join("")}</div>`,
    };
  };

  V["ri-area"] = async (a) => {
    a = normArea(decodeURIComponent(a || "")); const d = await datiItalia();
    const pers = d.rete.filter((r) => d.areaPers(r.utente) === a && r.ruolo !== "reteitalia");
    const va = d.vend.filter((v) => v._area === a);
    const sv = pers.filter((r) => r.ruolo === "sviluppo");
    const prov = d.prov.filter((p) => va.some((v) => v.id === p.vendita)).reduce((s, p) => s + Number(p.importo), 0);
    return {
      t: "Area " + a,
      h: `<div class="pad"><div class="griglia2">${num(contaRuolo(pers, "capoarea"), "Capi area")}${num(contaRuolo(pers, "agente") + contaRuolo(pers, "subagente"), "Agenti e sub-agenti")}${num(va.filter((v) => v.stato === "attiva").length, "Clienti attivi", "verde")}${num(euro(d.mensile(va)) || "0 €", "Canoni al mese", "verde")}</div><div style="height:8px"></div>
        <div class="griglia2">${num(va.filter((v) => v.stato === "proposta").length, "Proposte aperte", "giallo")}${num(euro(prov) || "0 €", "Provvigioni generate")}</div><div style="height:16px"></div>
        ${sez("Sviluppo rete", sv.length ? lista(sv.map((x) => voce("rete", esc(x.nome || x.codice), "Codice " + esc(x.codice) + (x.stato !== "attivo" ? " · sospeso" : "") + (x.accordo_firmato ? " · accordo firmato" : " · accordo da firmare"), null, x.stato === "attivo" ? "verde" : "rosso"))) : `<div class="card"><p>Nessun responsabile sviluppo rete in quest'area.</p>${btn("Invitalo", "go:re-squadra", "piccolo")}</div>`)}
        ${sez("Regioni", lista(AREE[a].map((reg) => { const ca = attivi(d.rete).filter((r) => r.ruolo === "capoarea" && d.regioneDi(r.utente) === reg); return voce("mappa", esc(reg), ca.length ? "Capo area: " + esc(ca.map((x) => x.nome || x.codice).join(", ")) : "Senza capo area", "ri-regione/" + encodeURIComponent(reg), ca.length ? "verde" : "rosso"); })))}</div>`,
    };
  };

  V["ri-regione"] = async (reg) => {
    reg = decodeURIComponent(reg || ""); const d = await datiItalia();
    const pers = d.rete.filter((r) => d.regioneDi(r.utente) === reg && !["reteitalia", "sviluppo"].includes(r.ruolo));
    const va = d.vend.filter((v) => v._reg === reg);
    const ordine = { capoarea: 0, agente: 1, subagente: 2 };
    const nome = (u) => (d.per[u] || {}).nome || "";
    return {
      t: reg,
      h: `<div class="pad"><p class="sotto">Area ${esc(areaDi(reg))}</p><div class="griglia2">${num(va.filter((v) => v.stato === "attiva").length, "Clienti attivi", "verde")}${num(euro(d.mensile(va)) || "0 €", "Canoni al mese", "verde")}</div><div style="height:16px"></div>
        ${sez("Persone", pers.length ? lista(pers.sort((x, y) => (ordine[x.ruolo] ?? 9) - (ordine[y.ruolo] ?? 9)).map((x) => voce("rete", esc(x.nome || x.codice), esc(RUOLI_RETE[x.ruolo]) + (x.superiore && d.per[x.superiore] ? " · sotto " + esc(nome(x.superiore)) : "") + (x.stato !== "attivo" ? " · sospeso" : ""), null, x.stato === "attivo" ? "verde" : "rosso"))) : `<div class="card"><p>Nessuno ancora in questa regione.</p></div>`)}
        ${sez("Ultime vendite", va.length ? lista(va.slice(0, 30).map((v) => voce("utente", esc(v.cliente_nome), esc(COSA[v.cosa] || v.cosa) + " · " + euro(v.importo) + (v.tipo_importo === "mese" ? "/mese" : "") + " · " + esc(nome(v.venditore)), "re-vendita/" + v.id, "", stato(...ST[v.stato])))) : vuoto("Nessuna vendita in questa regione."))}</div>`,
    };
  };
}
