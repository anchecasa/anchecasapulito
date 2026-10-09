/* Schermate comuni a tutti i profili: notifiche, inviti, listino AncheSicura con ordini, report recensioni. */
import { I, esc, voce, lista, sez, stato, num, btn, campo, vuoto, avviso, virgola, quando, toast, foglio, chiudiFoglio, spiegaErrore } from "./ui.js";
import { Q } from "./q.js";
import { euro } from "./schede.js";
import { CORSI, SERVIZI } from "./catalogo.js";

export function installa(core) {
  const { S, V, AZIONI, FORM, PROFILO_EXTRA, vai, render } = core;

  /* ---------------- Notifiche ---------------- */
  V.notifiche = async () => {
    const n = await Q.sel("app_notifiche", { eq: { utente: S.utente.id }, ord: ["creato", false], lim: 100 }).catch(() => []);
    const non = n.filter((x) => !x.letto);
    if (non.length) { Q.upd("app_notifiche", { utente: S.utente.id, letto: false }, { letto: true }).then(() => { S.nonLette = 0; }).catch(() => {}); }
    return {
      t: "Notifiche",
      h: `<div class="pad">${n.length ? `<div class="lista">${n.map((x) => `<div class="card${x.link ? " tap" : ""}" ${x.link ? `data-az="apri-notifica:${esc(x.link)}" role="button" tabindex="0"` : ""}><div class="riga"><span class="ico ${x.letto ? "blu" : ""}">${x.letto ? I.campana : I.allarme}</span><div class="cresci"><b>${esc(x.testo)}</b><small>${quando(x.creato)}</small></div>${x.link ? `<span class="freccia">${I.freccia}</span>` : ""}</div></div>`).join("")}</div>` : vuoto("Nessuna notifica.")}</div>`,
    };
  };
  // Il link di una notifica può portare a una schermata di un altro profilo: si sceglie quello giusto.
  AZIONI["apri-notifica:"] = (link) => core.apriNotifica(link);
  const PER_PROFILO = { "ar-richiesta": "artigiano", richiesta: "privato", "ad-moduli": "admin", "ad-ordini": "admin", "rete-vendite": null, "cl-cantiere": "cliente" };
  core.apriNotifica = (link) => {
    const base = link.split("/")[0];
    const serve = PER_PROFILO[base];
    if (serve && S.base !== serve) { const k = core.S.profili.find((p) => p.k.split(":")[0] === serve); if (k) core.scegliProfilo(k.k); }
    if (base === "cl-cantiere") { core.memo.set("cantiere", link.split("/")[1]); return vai("cl-home"); }
    if (base === "moduli") return vai("im-moduli");
    vai(link);
  };

  /* ---------------- Inviti ---------------- */
  V.invito = async (token) => {
    let info;
    try { info = await Q.rpc("app_apri_invito", { p_token: token }); } catch (e) { info = { ok: false, motivo: "errore" }; }
    if (!info || !info.ok) {
      const msg = info && info.motivo === "mail_diversa" ? `Questo invito è per ${esc(info.email)}. Esci ed entra (o iscriviti) con quella mail.` : "L'invito non è più valido: chiedine uno nuovo a chi te l'ha mandato.";
      return { t: "Invito", h: `<div class="pad">${avviso(msg, "rosso")}<div style="height:12px"></div>${info && info.motivo === "mail_diversa" ? btn("Esci", "esci", "chiaro") : ""}</div>` };
    }
    const COSA = { org: "lavorare nell'azienda", cantiere: "seguire il cantiere", rete: "entrare nella rete commerciale AncheCasa" };
    const RUOLO = { responsabile: "responsabile", operatore: "lavoratore", consulente: "consulente della sicurezza", cliente: "proprietario", partner: "impresa partner", reteitalia: "Responsabile Rete Italia", sviluppo: "responsabile sviluppo rete", capoarea: "capoarea", agente: "agente", subagente: "sub-agente" };
    return {
      t: "Invito",
      h: `<div class="pad"><div class="eroe"><h3>Sei invitato</h3><p>Ti invitano a ${COSA[info.cosa]}${info.dove ? " «" + esc(info.dove) + "»" : ""} come ${RUOLO[info.ruolo] || esc(info.ruolo)}.</p>${btn("Accetto", "accetta-invito:" + token)}</div></div>`,
    };
  };
  AZIONI["accetta-invito:"] = async (token) => {
    try {
      const r = await Q.rpc("app_accetta_invito", { p_token: token });
      await core.caricaProfili();
      const k = r.cosa === "org" ? core.S.profili.find((p) => p.k.endsWith(":" + r.target)) : r.cosa === "cantiere" ? core.S.profili.find((p) => p.k === (r.ruolo === "cliente" ? "cliente" : "partner") || p.k.startsWith("partner:")) : core.S.profili.find((p) => p.k === r.ruolo);
      if (k) core.scegliProfilo(k.k);
      toast("Fatto: benvenuto!"); vai(core.casa(), true);
    } catch (e) { toast(/mail_diversa/.test(e.message) ? "L'invito è per un'altra mail." : /gia_nella_rete/.test(e.message) ? "Sei già nella rete commerciale: chiedi ad AncheCasa di cambiare il tuo ruolo." : spiegaErrore(e), "errore"); }
  };

  /* ---------------- Listino AncheSicura e ordini ---------------- */
  V["corsi-listino"] = async () => {
    const org = S.org || null;
    return {
      t: "Corsi e servizi AncheSicura",
      h: `<div class="pad"><div class="eroe"><h3>Sicurezza a prezzi sotto il mercato</h3><p>Corsi online e in aula, visite mediche e documenti. Tocca per ordinare: AncheSicura ti richiama per data e pagamento.</p></div><div style="height:14px"></div>
        ${sez("Corsi", lista(CORSI.map((c, i) => voce("corso", esc(c.nome), esc(c.modo) + (c.mercato ? ` · mercato ${c.mercato} €` : ""), "ordina:c" + i, "", `<span class="prezzo-piccolo">${c.prezzo} €</span>`))))}
        ${sez("Servizi", lista(SERVIZI.map((s, i) => voce("scudo", esc(s.nome), s.prezzo ? "Prezzo di partenza" : "Su preventivo", "ordina:s" + i, "blu", `<span class="prezzo-piccolo">${s.prezzo ? "da " + s.prezzo + " €" : "preventivo"}</span>`))))}
        ${sez("I tuoi ordini", lista([voce("box", "Vedi i tuoi ordini", "Stato delle richieste", "miei-ordini", "blu")]))}
        <p class="sotto piccolo">Prezzi a persona, IVA esclusa.</p></div>`,
      dopo: () => { core.ordineOrg = org; },
    };
  };
  V.ordina = async (cod) => {
    const v = cod[0] === "c" ? CORSI[Number(cod.slice(1))] : SERVIZI[Number(cod.slice(1))];
    if (!v) return { t: "Ordina", h: vuoto("Voce non trovata.") };
    const mieOrg = ((S.miei && S.miei.org) || []).filter((o) => o.tipo !== "gc");
    return {
      t: "Ordina",
      h: `<div class="pad"><div class="card"><h3>${esc(v.nome)}</h3><p>${v.prezzo ? (cod[0] === "s" ? "Da " : "") + v.prezzo + " € a persona, IVA esclusa" : "Su preventivo"}</p></div><div style="height:12px"></div>
        <form data-form="ordina" data-voce="${esc(v.nome)}" data-prezzo="${v.prezzo || 0}" novalidate>
          ${mieOrg.length ? campo("Per", `<select name="org"><option value="">Per me</option>${mieOrg.map((o) => `<option value="${esc(o.id)}" ${o.id === S.org ? "selected" : ""}>${esc(o.nome)}</option>`).join("")}</select>`) : ""}
          ${campo("Quante persone", `<input name="quantita" type="number" min="1" max="500" value="1" required>`)}
          ${campo("Codice dell'agente (se te l'ha dato)", `<input name="codice" maxlength="12" autocapitalize="characters">`)}
          ${campo("Note (nomi, date preferite)", `<textarea name="note" maxlength="400"></textarea>`)}
          <button class="btn" type="submit">Manda l'ordine</button></form></div>`,
    };
  };
  FORM.ordina = async (f) => {
    const q = Math.max(1, Math.min(500, Number(f.quantita.value) || 1));
    await Q.ins("app_ordini", { utente: S.utente.id, org: (f.org && f.org.value) || null, voce: f.dataset.voce.slice(0, 120), quantita: q, prezzo: Number(f.dataset.prezzo), codice_venditore: f.codice.value.trim().toUpperCase().slice(0, 12), note: f.note.value.trim() });
    toast("Ordine mandato: AncheSicura ti richiama."); vai("miei-ordini", true);
  };
  V["miei-ordini"] = async () => {
    const o = await Q.sel("app_ordini", { ord: ["creato", false], lim: 200 }).catch(() => []);
    const ST = { richiesto: ["giallo", "Richiesto"], confermato: ["blu", "Confermato"], svolto: ["verde", "Fatto"], annullato: ["rosso", "Annullato"] };
    return { t: "Ordini AncheSicura", h: `<div class="pad">${o.length ? lista(o.map((x) => voce("corso", esc(x.voce), `${x.quantita} × ${euro(x.prezzo)} · ${quando(x.creato)}`, null, "", stato(...ST[x.stato])))) : vuoto("Nessun ordine.")}</div>` };
  };
  PROFILO_EXTRA.push(() => sez("AncheSicura", lista([voce("corso", "Corsi e servizi", "Prezzi sotto il mercato", "corsi-listino", "blu"), voce("box", "I miei ordini", "", "miei-ordini", "blu")])));

  /* ---------------- Report recensioni (admin, Rete Italia, sviluppo rete, capoarea) ---------------- */
  V["report-rec"] = async (vista) => {
    vista = vista || "impresa";
    const r = await Q.rpc("app_report_recensioni");
    const zona = (S.admin && S.base === "admin") || (S.miei.rete || {}).ruolo === "reteitalia" ? "Tutta Italia" : (S.miei.rete || {}).ruolo === "sviluppo" ? "Area " + ((S.miei.rete || {}).area || "") : "Regione " + ((S.miei.rete || {}).regione || "");
    const media = r.length ? r.reduce((s, x) => s + Number(x.voto), 0) / r.length : null;
    const pill = (k, t) => `<button type="button" class="pillola ${k === vista ? "on" : ""}" data-go="report-rec/${k}">${t}</button>`;
    let corpo = "";
    if (vista === "impresa") {
      const g = {};
      r.forEach((x) => { const k = x.tipo + ":" + x.soggetto; (g[k] = g[k] || { nome: x.nome, tipo: x.tipo, regione: x.regione, v: [], lavori: new Set() }).v.push(x); g[k].lavori.add(x.lavoro); });
      const righe = Object.entries(g).map(([k, x]) => ({ k, nome: x.nome, tipo: x.tipo, regione: x.regione, media: x.v.reduce((s, y) => s + Number(y.voto), 0) / x.v.length, n: x.v.length, lavori: x.lavori.size })).sort((a, b) => a.media - b.media);
      corpo = righe.length ? lista(righe.map((x) => voce(x.tipo === "artigiano" ? "kit" : "ufficio", esc(x.nome), `${x.tipo === "artigiano" ? "Artigiano" : "Impresa"} · ${x.lavori} lavor${x.lavori === 1 ? "o" : "i"} · ${x.n} recension${x.n === 1 ? "e" : "i"}${x.regione ? " · " + esc(x.regione) : ""}`, "report-sogg/" + x.k, x.media >= 4.3 ? "verde" : x.media >= 3.5 ? "giallo" : "rosso", stato(x.media >= 4.3 ? "verde" : x.media >= 3.5 ? "giallo" : "rosso", "★ " + virgola(x.media))))) : vuoto("Nessuna recensione.");
    } else {
      corpo = r.length ? lista(r.map((x) => voce(x.tipo === "artigiano" ? "video" : "gru", esc(x.lavoro_nome || "Lavoro"), esc(x.nome) + " · " + quando(x.creato) + (x.testo ? " · «" + esc(x.testo.slice(0, 60)) + "»" : ""), null, Number(x.voto) >= 4.3 ? "verde" : Number(x.voto) >= 3.5 ? "giallo" : "rosso", stato(Number(x.voto) >= 4.3 ? "verde" : Number(x.voto) >= 3.5 ? "giallo" : "rosso", "★ " + virgola(x.voto))))) : vuoto("Nessuna recensione.");
    }
    core.reportCache = r;
    return {
      t: "Report recensioni",
      h: `<div class="pad"><p class="sotto">${esc(zona)} · solo recensioni di lavori veri</p>
        <div class="griglia2">${num(media ? virgola(media) : "–", "Media generale", "verde")}${num(r.length, "Recensioni")}</div><div style="height:12px"></div>
        <div class="pillole">${pill("impresa", "Per impresa")}${pill("lavoro", "Per lavoro")}</div><div style="height:12px"></div>${corpo}
        <div style="height:12px"></div>${btn(I.doc + " Scarica il report (CSV per Excel)", "report-csv", "chiaro")}</div>`,
    };
  };
  V["report-sogg"] = async (k) => {
    const r = core.reportCache || (await Q.rpc("app_report_recensioni"));
    const [tipo, id] = k.split(":");
    const l = r.filter((x) => x.tipo === tipo && x.soggetto === id);
    if (!l.length) return { t: "Report", h: vuoto("Nessun dato.") };
    const media = l.reduce((s, x) => s + Number(x.voto), 0) / l.length;
    const VOCI = core.VOCI;
    const perVoce = VOCI.map(([v, t]) => { const n = l.map((x) => Number((x.voti || {})[v])).filter(Boolean); return [t, n.length ? n.reduce((a, b) => a + b, 0) / n.length : null]; });
    return {
      t: l[0].nome,
      h: `<div class="pad"><div class="eroe"><h3>★ ${virgola(media)} su 5</h3><p>${l.length} recensioni · ${new Set(l.map((x) => x.lavoro)).size} lavori${l[0].regione ? " · " + esc(l[0].regione) : ""}</p></div><div style="height:12px"></div>
        ${sez("Voti per voce", lista(perVoce.filter((x) => x[1]).map(([t, v]) => voce("stella", t, "", null, v >= 4.3 ? "verde" : v >= 3.5 ? "giallo" : "rosso", stato(v >= 4.3 ? "verde" : v >= 3.5 ? "giallo" : "rosso", "★ " + virgola(v))))))}
        ${sez("Lavori", lista(l.map((x) => voce(tipo === "artigiano" ? "video" : "gru", esc(x.lavoro_nome || "Lavoro"), "★ " + virgola(x.voto) + " · " + quando(x.creato) + (x.testo ? " · «" + esc(x.testo) + "»" : ""), null, "blu"))))}</div>`,
    };
  };
  AZIONI["report-csv"] = async () => {
    const r = core.reportCache || (await Q.rpc("app_report_recensioni"));
    const cella = (v) => { let t = String(v ?? ""); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; };
    const righe = [["Tipo", "Impresa o artigiano", "Regione", "Lavoro", "Voto", "Qualità", "Puntualità", "Pulizia", "Prezzo", "Comunicazione", "Testo", "Data"]].concat(
      r.map((x) => [x.tipo, x.nome, x.regione, x.lavoro_nome, String(x.voto).replace(".", ","), ...["qualita", "puntualita", "pulizia", "prezzo", "comunicazione"].map((k) => (x.voti || {})[k] ?? ""), x.testo, new Date(x.creato).toLocaleDateString("it-IT")]));
    const csv = "﻿" + righe.map((x) => x.map(cella).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "report-recensioni-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
  };
}
