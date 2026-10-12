/* Rete commerciale: Responsabile Rete Italia → responsabile sviluppo rete → capoarea → agente → sub-agente.
   Il segnalatore è un privato (parte 1, «Segnala ad AncheCasa»). */
import { I, esc, voce, lista, sez, stato, num, btn, campo, vuoto, avviso, virgola, quando, toast, foglio, chiudiFoglio, spiegaErrore } from "./ui.js";
import { Q } from "./q.js";
import { euro } from "./schede.js";
import { MODULI, PREZZI_PREDEFINITI, CORSI, SERVIZI, REGIONI, AREE } from "./catalogo.js";

export const RUOLI_RETE = { reteitalia: "Responsabile Rete Italia", sviluppo: "Responsabile sviluppo rete", capoarea: "Capoarea", agente: "Agente", subagente: "Sub-agente" };
const SOTTO = { reteitalia: "sviluppo", sviluppo: "capoarea", capoarea: "agente", agente: "subagente" };
const COSA = { modulo: "Modulo dell'app", pacchetto: "Pacchetto Impresa completa", corso: "Corso AncheSicura", servizio: "Servizio AncheSicura", ristrutturazione: "Lavoro o cantiere (provvigioni a SAL)", supermastro: "SuperMastro per artigiani", altro: "Altro" };
const RUOLI_P = { segnala: "Chi segnala", chiude: "Chi chiude", segue: "Chi segue il cantiere", impresa: "Chi ha portato l'impresa", venditore: "Venditore", affidato: "Cliente di AncheCasa affidato (metà quota)", segnala_agente: "Chi segnala (tuo sub-agente)", chiude_agente: "Chi chiude (tuo sub-agente)", segue_agente: "Chi segue (tuo sub-agente)", impresa_agente: "Chi ha portato l'impresa (tuo sub-agente)" };
const nomeRuoloP = (r) => RUOLI_RETE[r] || RUOLI_P[r] || r;

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
    const daF = core.daFirmare ? await core.daFirmare().catch(() => 0) : 0;
    return {
      t: "",
      h: `<div class="pad"><p class="saluto">Ciao ${esc(((S.profilo || {}).nome || "").split(" ")[0])}</p><p class="sotto">${esc(RUOLI_RETE[me.ruolo] || "")}${me.regione ? " · " + esc(me.regione) : me.area ? " · " + esc(me.area) : ""}</p>
        ${core.cartaOggi ? await core.cartaOggi("io") : ""}${core.cartaLinea ? await core.cartaLinea() : ""}
        ${["sviluppo", "reteitalia"].includes(me.ruolo) && !me.accordo ? `${avviso("Prima di cominciare firma l'accordo di collaborazione.")}<div style="height:8px"></div>${btn("Leggi e firma l'accordo", "go:re-accordo")}<div style="height:14px"></div>` : ""}
        <div class="card patentino"><small>Il tuo codice: i clienti lo scrivono quando ordinano</small><b>${esc(me.codice || "")}</b></div><div style="height:12px"></div>
        <div class="griglia2">${num(euro(delMese) || "0 €", "Provvigioni del mese", "verde")}${num(euro(daPagare) || "0 €", "Da ricevere")}${num(mie.filter((v) => v.stato === "attiva").length, "Clienti attivi")}${num(me.ruolo === "subagente" ? mie.filter((v) => v.stato === "proposta").length : sq.length, me.ruolo === "subagente" ? "Proposte aperte" : "Nella tua squadra")}</div><div style="height:16px"></div>
        ${sez("Da seguire", lista(mie.filter((v) => v.stato === "proposta").slice(0, 5).map((v) => voce("utente", esc(v.cliente_nome), esc(COSA[v.cosa] + (v.dettaglio ? " · " + v.dettaglio : "")), "re-vendita/" + v.id, "giallo"))) || `<div class="card"><p>Nessuna proposta aperta. ${btn("Vendi", "go:re-vendi", "piccolo")}</p></div>`)}
        ${sez("Strumenti", lista([
          ...(me.ruolo === "sviluppo" ? [voce("rete", "Proposte da decidere", "Chi entra nella tua area", "rete-proposte", "giallo")] : []),
          ...(["sviluppo", "capoarea"].includes(me.ruolo) ? [voce("chat", "Sala strategia", "Parla con gli altri dirigenti, poi si decide", "strategia", "arancio")] : []),
          voce("rete", "Il mio ruolo", "Cosa fai e come guadagni, con esempi", "mio-ruolo", "blu"),
          voce("doc", "Documenti", daF ? daF + " da firmare: contratto, regolamento, circolari" : "Contratto, regolamento e circolari", "documenti", daF ? "arancio" : "blu"),
          voce("ok", "Linee decise", "Cosa ha deciso AncheCasa per la rete", "linee", "blu"),
          voce("grafico", "Andamento e obiettivi", "Il mese, giorno per giorno", "obiettivi", "verde"),
          voce("gru", "Lavori", "Cantieri portati: provvigioni a SAL", "re-lavori", "blu"),
          voce("grafico", "La catena", "Chi c'è sotto di te e cosa fa", "catena", "blu"),
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

  V["re-vendi"] = async (cosa) => {
    let pr = PREZZI_PREDEFINITI;
    try { const x = await Q.uno("app_impostazioni", { chiave: "prezzi_moduli" }); if (x) pr = Object.assign({}, pr, x.valore); } catch (e) { /* predefiniti */ }
    return {
      t: "Vendi",
      h: `<div class="pad"><p class="sotto">Registra il cliente e cosa gli proponi. Quando paga, AncheCasa conferma la vendita e maturano le provvigioni. Per un lavoro (ristrutturazione, cantiere) scegli «Lavoro o cantiere»: le provvigioni maturano a SAL.</p>
        <form data-form="re-vendi" novalidate>
          ${campo("Cliente (azienda o persona)", `<input name="cliente" required maxlength="120">`)}${campo("Telefono o mail", `<input name="contatto" maxlength="120">`)}
          ${campo("Regione del cliente", `<select name="regione"><option value="">—</option>${REGIONI.map((r) => `<option ${r === io().regione ? "selected" : ""}>${r}</option>`).join("")}</select>`)}
          ${campo("Il cliente è", `<select name="tipo_cliente"><option value="azienda">Un'azienda</option><option value="privato">Un privato</option><option value="condominio">Un condominio</option></select>`, "Sui privati le provvigioni ci sono solo se fanno un lavoro.")}
          ${campo("Partita IVA (per le aziende)", `<input name="piva" maxlength="20" inputmode="numeric" placeholder="Il cliente è di chi lo registra per primo">`)}
          ${campo("Cosa proponi", `<select name="cosa">${Object.entries(COSA).map(([k, v]) => `<option value="${k}" ${(cosa === "lavoro" && k === "ristrutturazione") ? "selected" : ""}>${v}</option>`).join("")}</select>`)}
          ${campo("Dettaglio", `<input name="dettaglio" maxlength="200" list="sugg-vendi" placeholder="Es. modulo Sicurezza, corso preposto per 2 persone">`)}<datalist id="sugg-vendi">${MODULI.map((m) => `<option value="${esc(m.nome)} · ${pr[m.id]} € al mese">`).join("")}<option value="Impresa completa · ${pr.pacchetto} € al mese">${CORSI.map((c) => `<option value="${esc(c.nome)} · ${c.prezzo} €">`).join("")}${SERVIZI.filter((x) => x.prezzo).map((x) => `<option value="${esc(x.nome)} · da ${x.prezzo} €">`).join("")}</datalist>
          <div class="griglia2">${campo("Importo (per un lavoro: valore previsto)", `<input name="importo" type="number" step="0.01" min="0" required>`)}${campo("È", `<select name="tipo"><option value="mese">al mese</option><option value="una_tantum">una volta</option></select>`)}</div>
          <button class="btn" type="submit">Registra la proposta</button></form>
        <div style="height:14px"></div>${lista([voce("corso", "Listino AncheSicura", "Prezzi di corsi e servizi", "corsi-listino", "blu")])}</div>`,
    };
  };
  FORM["re-vendi"] = async (f) => {
    if (f.cliente.value.trim().length < 2) return toast("Scrivi il nome del cliente.", "errore");
    if (f.importo.value === "") return toast("Scrivi l'importo.", "errore");
    const tc = f.tipo_cliente.value;
    const piva = (f.piva.value || "").replace(/\D/g, "");
    if (tc === "azienda" && piva && piva.length !== 11) return toast("La partita IVA ha 11 cifre.", "errore");
    try { if (!(await Q.rpc("app_cliente_libero", { p_tipo: tc, p_piva: piva, p_contatto: f.contatto.value.trim() }))) return toast("Questo cliente è già registrato da un collega: è suo.", "errore"); } catch (e) { /* controllo non disponibile: decide il database */ }
    if (f.cosa.value === "ristrutturazione") {
      let a;
      try { a = await Q.ins("app_affari", { segnalato_da: S.utente.id, cliente_piva: piva, cliente_nome: f.cliente.value.trim(), cliente_tipo: tc, cliente_contatto: f.contatto.value.trim(), cliente_regione: f.regione.value, descrizione: f.dettaglio.value.trim(), valore: Number(f.importo.value) }); }
      catch (e) { return toast(String(e.message || e).includes("cliente_di_un_collega") ? "Questo cliente è già registrato da un collega: è suo." : spiegaErrore(e), "errore"); }
      toast("Lavoro registrato: AncheCasa fa il sopralluogo e il preventivo."); return vai("re-lavoro/" + a.id);
    }
    try { await Q.ins("app_vendite", { venditore: S.utente.id, cliente_piva: piva, cliente_nome: f.cliente.value.trim(), cliente_tipo: tc === "privato" ? "privato" : "azienda", cliente_contatto: f.contatto.value.trim(), cliente_regione: f.regione.value, cosa: f.cosa.value, dettaglio: f.dettaglio.value.trim(), importo: Number(f.importo.value), tipo_importo: f.tipo.value }); }
    catch (e) { return toast(String(e.message || e).includes("cliente_di_un_collega") ? "Questo cliente è già registrato da un collega: è suo." : spiegaErrore(e), "errore"); }
    toast(tc === "privato" ? "Registrata. Sui privati non maturano provvigioni: solo sui lavori." : "Proposta registrata."); vai("re-clienti");
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
      h: `<div class="pad">${lista([voce("gru", "Lavori e cantieri", "Provvigioni a SAL", "re-lavori", "blu")])}<div style="height:12px"></div>${conSquadra ? `<div class="pillole"><button type="button" class="pillola ${filtro === "miei" ? "on" : ""}" data-go="re-clienti/miei">I miei</button><button type="button" class="pillola ${filtro === "squadra" ? "on" : ""}" data-go="re-clienti/squadra">Della squadra</button></div><div style="height:12px"></div>` : ""}
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
      h: `<div class="pad">${v.affidato ? avviso("Cliente di AncheCasa affidato a te: chiamalo entro 48 ore. Prendi metà della quota di chi porta; quello che gli vendi in più è tuo con la quota piena.") + '<div style="height:10px"></div>' : ""}<div class="card"><dl class="campi">${v.cliente_piva ? `<dt>Partita IVA</dt><dd>${esc(v.cliente_piva)}</dd>` : ""}<dt>Cosa</dt><dd>${esc(COSA[v.cosa] || v.cosa)}${v.dettaglio ? " · " + esc(v.dettaglio) : ""}</dd><dt>Importo</dt><dd>${euro(v.importo)}${v.tipo_importo === "mese" ? " al mese" : ""}</dd>${v.cliente_contatto ? `<dt>Contatto</dt><dd>${esc(v.cliente_contatto)}</dd>` : ""}<dt>Stato</dt><dd>${stato(...ST[v.stato])}</dd><dt>Registrato</dt><dd>${quando(v.creato)}</dd></dl></div><div style="height:12px"></div>
        ${prov.length ? sez("Provvigioni", lista(prov.map((p) => voce("euro", euro(p.importo), esc(nomeRuoloP(p.ruolo)) + " · " + (p.stato === "pagata" ? "pagata" : "maturata"), null, "verde")))) : v.stato === "proposta" ? avviso("Le provvigioni maturano quando AncheCasa conferma il pagamento del cliente.") : ""}
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
        ${sez("Proponi una persona", formProponi(prossimo || "agente"))}
        ${lista([voce("rete", "Le proposte", "Chi hai proposto e cosa hanno deciso", "rete-proposte/mie", "blu"), voce("grafico", "La catena", "Chi c'è sotto di te e cosa fa", "catena", "blu")])}</div>`,
    };
  };
  /* Segnalazioni: i commerciali segnalano sviluppo rete, agente o sub-agente. Decide solo l'admin. */
  const PROPONIBILI = ["sviluppo", "agente", "subagente"];
  function formProponi(predef) {
    return `<form data-form="re-proponi" novalidate>
      ${campo("Ruolo", `<select name="ruolo">${PROPONIBILI.map((k) => `<option value="${k}" ${k === predef ? "selected" : ""}>${RUOLI_RETE[k]}</option>`).join("")}</select>`)}
      ${campo("Nome e cognome", `<input name="nome" maxlength="80" required>`)}${campo("Mail", `<input name="email" type="email" required>`)}${campo("Telefono", `<input name="telefono" type="tel" maxlength="40">`)}
      ${campo("Regione", `<select name="regione"><option value="">—</option>${REGIONI.map((r) => `<option ${r === io().regione ? "selected" : ""}>${r}</option>`).join("")}</select>`)}
      ${campo("Perché lo proponi", `<textarea name="note" maxlength="600" rows="3" placeholder="Chi è, cosa ha fatto, perché è adatto"></textarea>`)}
      <button class="btn" type="submit">Manda la segnalazione</button></form>
      <p class="sotto piccolo">Segnali uno sviluppo rete, un agente o un sub-agente. Decide l'admin. Se dice sì, ricevi il link da mandare.</p>`;
  }
  core.formProponi = formProponi;
  FORM["re-proponi"] = async (f) => {
    const email = f.email.value.trim().toLowerCase();
    if (f.nome.value.trim().length < 2) return toast("Scrivi nome e cognome.", "errore");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast("Controlla la mail.", "errore");
    try { await Q.rpc("app_proponi_rete", { p_ruolo: f.ruolo.value, p_nome: f.nome.value.trim(), p_email: email, p_telefono: f.telefono.value.trim(), p_regione: f.regione.value, p_note: f.note.value.trim() }); }
    catch (e) { return toast(String(e.message || e).includes("gia_proposto") ? "Questa persona è già stata proposta." : spiegaErrore(e), "errore"); }
    toast("Segnalazione mandata. Decide l'admin."); vai("rete-proposte/mie");
  };

  const VOTO = { si: ["verde", "sì"], no: ["rosso", "no"] };
  const chiVota = () => (S.admin && S.base === "admin") ? "admin" : null;
  const mioVoto = (p, chi) => chi === "admin" ? p.voto_admin : "x";
  const chipVoti = (p) => [["Admin", p.voto_admin, true]]
    .filter((x) => x[2]).map(([t, vv]) => stato(vv ? VOTO[vv][0] : "giallo", t + " " + (vv ? VOTO[vv][1] : "…"))).join(" ");
  const STP = { proposta: ["giallo", "Da decidere"], approvata: ["verde", "Approvata"], respinta: ["rosso", "Respinta"] };

  V["rete-proposte"] = async (filtro) => {
    const [tutte, rete] = await Promise.all([Q.sel("app_proposte_rete", { ord: ["creato", false], lim: 500 }).catch(() => []), Q.sel("app_rete", { lim: 2000 }).catch(() => [])]);
    const nome = (u) => (rete.find((x) => x.utente === u) || {}).nome || (u === S.utente.id ? "te" : "AncheCasa");
    const daDecidere = tutte.filter((p) => p.stato === "proposta" && chiVota(p) && !mioVoto(p, chiVota(p)));
    filtro = filtro || (daDecidere.length ? "decidere" : "mie");
    const l = filtro === "decidere" ? daDecidere : filtro === "mie" ? tutte.filter((p) => p.proposto_da === S.utente.id) : tutte;
    const puoTutte = S.admin && S.base === "admin";
    const pill = (k, t) => `<button type="button" class="pillola ${k === filtro ? "on" : ""}" data-go="rete-proposte/${k}">${t}</button>`;
    return {
      t: "Segnalazioni nella rete",
      h: `<div class="pad"><div class="pillole">${pill("decidere", "Da decidere" + (daDecidere.length ? " " + daDecidere.length : ""))}${pill("mie", "Le mie")}${puoTutte ? pill("tutte", "Tutte") : ""}</div><div style="height:12px"></div>
        ${l.length ? l.map((p) => {
          const chi = chiVota(p), mio = mioVoto(p, chi);
          const azioni = p.stato === "proposta" && chi && !mio ? `<div class="griglia2" style="margin-top:10px">${btn("Sì, entra", "vota-proposta:" + p.id + ":si")}${btn("No", "vota-proposta:" + p.id + ":no", "chiaro")}</div>`
            : p.stato === "approvata" && p.invito && (p.proposto_da === S.utente.id || (S.admin && S.base === "admin")) ? `<div style="margin-top:10px">${btn("Link d'invito da mandare", "link-proposta:" + p.invito, "piccolo")}</div>` : "";
          const note = (p.commenti || []).filter((c) => c.nota).map((c) => `<p class="sotto piccolo">${esc({ admin: "Admin", reteitalia: "Rete Italia", sviluppo: "Sviluppo" }[c.chi] || c.chi)}: ${esc(c.nota)}</p>`).join("");
          return `<div class="card" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:start"><div><h3 style="margin:0">${esc(p.nome)}</h3><p class="sotto">${esc(RUOLI_RETE[p.ruolo])}${p.regione ? " · " + esc(p.regione) : ""} · proposto da ${esc(nome(p.proposto_da))} · ${quando(p.creato)}</p></div>${stato(...STP[p.stato])}</div>
            ${p.note ? `<p style="margin:8px 0 0">${esc(p.note)}</p>` : ""}<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">${chipVoti(p)}</div>${note}${azioni}</div>`;
        }).join("") : vuoto(filtro === "decidere" ? "Niente da decidere." : "Nessuna proposta.")}
        ${filtro === "mie" ? sez("Proponi una persona", formProponi(SOTTO[io().ruolo] || "agente")) : ""}</div>`,
    };
  };
  AZIONI["vota-proposta:"] = async (arg) => {
    const [id, vv] = arg.split(":");
    try { const esito = await Q.rpc("app_vota_proposta", { p_id: id, p_si: vv === "si", p_nota: "" }); toast(esito === "approvata" ? "Approvata: l'invito è pronto." : esito === "respinta" ? "Segnalazione respinta." : "Registrato."); }
    catch (e) { toast(spiegaErrore(e), "errore"); }
    render();
  };
  AZIONI["link-proposta:"] = async (id) => { const i = await Q.uno("app_inviti", { id }); if (i) core.mostraInvito(i); else toast("Invito non trovato.", "errore"); };

  /* La catena: chi c'è sotto, e cosa fa. Admin e Rete Italia la vedono tutta. */
  V["catena"] = async () => {
    const [rete, vend, prov, prop] = await Promise.all([Q.sel("app_rete", { lim: 2000 }).catch(() => []), Q.sel("app_vendite", { lim: 5000 }).catch(() => []), Q.sel("app_provvigioni", { lim: 5000 }).catch(() => []), Q.sel("app_proposte_rete", { lim: 1000 }).catch(() => [])]);
    const tutta = (S.admin && S.base === "admin") || io().ruolo === "reteitalia";
    const figli = (u) => rete.filter((r) => r.superiore === u);
    const livello = { reteitalia: 0, sviluppo: 1, capoarea: 2, agente: 3, subagente: 4 };
    const radici = tutta ? rete.filter((r) => !r.superiore || !rete.some((x) => x.utente === r.superiore)).sort((a, b) => livello[a.ruolo] - livello[b.ruolo]) : rete.filter((r) => r.utente === S.utente.id);
    const mese = new Date().toISOString().slice(0, 7);
    const giorni = (d) => Math.floor((Date.now() - new Date(d)) / 86400000);
    const riga = (r, prof) => {
      const v = vend.filter((x) => x.venditore === r.utente);
      const attivi = v.filter((x) => x.stato === "attiva").length;
      const delMese = v.filter((x) => x.stato === "attiva" && String(x.attivata || "").slice(0, 7) === mese).reduce((a, x) => a + Number(x.importo), 0);
      const pr = prov.filter((x) => x.beneficiario === r.utente).reduce((a, x) => a + Number(x.importo), 0);
      const ultima = v.map((x) => x.creato).sort().pop();
      const fermo = !ultima ? "nessuna vendita" : giorni(ultima) > 30 ? "ferma da " + giorni(ultima) + " giorni" : "ultima vendita " + (giorni(ultima) ? giorni(ultima) + " giorni fa" : "oggi");
      const np = prop.filter((x) => x.proposto_da === r.utente).length;
      const col = r.stato !== "attivo" ? "rosso" : !ultima || giorni(ultima) > 30 ? "giallo" : "verde";
      const dett = `${esc(RUOLI_RETE[r.ruolo])}${r.regione ? " · " + esc(r.regione) : r.area ? " · " + esc(r.area) : ""} · ${pl(attivi, "cliente attivo", "clienti attivi")} · ${euro(delMese) || "0 €"} nel mese · ${euro(pr) || "0 €"} di provvigioni · ${pl(np, "proposta", "proposte")} · ${fermo}${r.stato !== "attivo" ? " · sospeso" : ""}`;
      return `<div style="margin-left:${Math.min(prof, 4) * 14}px">${lista([voce("rete", esc(r.nome || r.codice), dett, S.admin && S.base === "admin" ? "ad-persona-rete/" + r.utente : null, col)])}</div>` + figli(r.utente).map((x) => riga(x, prof + 1)).join("");
    };
    return {
      t: "La catena",
      h: `<div class="pad"><p class="sotto">${tutta ? "Tutta la rete, livello per livello." : "Tu e chi c'è sotto di te."} Verde: vende. Giallo: ferma da più di 30 giorni o mai venduto. Rosso: sospeso.</p><div style="height:10px"></div>
        <div style="display:grid;gap:6px">${radici.length ? radici.map((r) => riga(r, 0)).join("") : vuoto("La rete è ancora vuota.")}</div></div>`,
    };
  };

  V["re-guadagni"] = async () => {
    const p = await Q.sel("app_provvigioni", { eq: { beneficiario: S.utente.id }, ord: ["creato", false], lim: 1000 }).catch(() => []);
    const tot = (f) => p.filter(f).reduce((s, x) => s + Number(x.importo), 0);
    return {
      t: "Guadagni",
      h: `<div class="pad"><div class="griglia2">${num(euro(tot((x) => x.stato === "maturata")) || "0 €", "Da ricevere", "verde")}${num(euro(tot((x) => x.stato === "pagata")) || "0 €", "Già pagate")}</div><div style="height:12px"></div>
        ${io().ruolo === "subagente" ? avviso("Sulle tue vendite: il 70% della provvigione è tuo, il 30% va al tuo agente (percentuali decise da AncheCasa).") + '<div style="height:12px"></div>' : ""}
        ${io().ruolo === "reteitalia" ? avviso("Quote della rete: servizi 70% chi porta il cliente, 17% sviluppo rete, 8% capo area, 5% a te su tutta Italia. Lavori: 5% a te, a SAL sull'incassato.") + '<div style="height:12px"></div>' : ""}
        ${p.length ? lista(p.map((x) => voce("euro", euro(x.importo), esc(nomeRuoloP(x.ruolo)) + (x.affare ? " · lavoro, tranche " + x.tranche : "") + " · " + quando(x.creato), x.affare ? "re-lavoro/" + x.affare : "re-vendita/" + x.vendita, x.stato === "pagata" ? "verde" : "giallo", stato(x.stato === "pagata" ? "verde" : "giallo", x.stato)))) : vuoto("Ancora nessuna provvigione.")}</div>`,
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
    const daF = core.daFirmare ? await core.daFirmare().catch(() => 0) : 0;
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
        ${core.cartaOggi ? await core.cartaOggi("italia") : ""}${core.cartaLinea ? await core.cartaLinea() : ""}
        <div class="griglia2">${num(attivi(d.rete).length, "Persone attive nella rete", "verde")}${num(coperte + " su 20", "Regioni con capo area")}${num(euro(d.mensile(d.vend)) || "0 €", "Canoni attivi al mese", "verde")}${num(proposte, "Proposte da chiudere", proposte ? "giallo" : "")}</div><div style="height:12px"></div>
        <div class="griglia2">${num(euro(delMese) || "0 €", "Le tue provvigioni del mese", "verde")}${num(euro(maturate) || "0 €", "Provvigioni della rete da pagare")}</div><div style="height:16px"></div>
        ${sez("Le tre aree", lista(NOMI_AREA.map(cartaArea)))}
        ${sez("Strumenti", lista([
          voce("chat", "Sala strategia", "I dirigenti propongono, tu e l'admin decidete", "strategia", "arancio"),
          voce("doc", "Documenti", daF ? daF + " da firmare: contratto, regolamento, circolari" : "Contratto, regolamento e circolari", "documenti", daF ? "arancio" : "blu"),
          voce("rete", "Il mio ruolo", "Cosa fai e come guadagni", "mio-ruolo", "blu"),
          voce("grafico", "Andamento e obiettivi", "Fissa gli obiettivi del mese", "obiettivi", "verde"),
          voce("rete", "Proposte da decidere", "Decidi con admin e sviluppo rete chi entra", "rete-proposte", "giallo"),
          voce("gru", "Lavori della rete", "Cantieri portati dalla rete, a SAL", "re-lavori", "blu"),
          voce("grafico", "La catena", "Tutta la rete, chi vende e chi è fermo", "catena", "blu"),
          voce("rete", "La tua squadra", "Responsabili sviluppo rete e proposte", "re-squadra", "blu"),
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
