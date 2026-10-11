/* Ufficio: preventivi e fatture elettroniche (SdI), sopralluoghi e pratiche (parte 8 e 9, 11.10.2026).
   Filo della pratica: Sopralluogo (agente + ditta + cliente) → Preventivo → Cantiere → Fattura elettronica.
   I dati passano da fe-api.js (vero: Supabase e funzione sdi-gateway; prova: simulato nel browser). */
import { I, esc, voce, lista, sez, stato, num, btn, campo, vuoto, avviso, quando, toast, foglio, chiudiFoglio, spiegaErrore } from "./ui.js";
import { FE, totali } from "./fe-api.js";

const STATO_SDI = {
  non_inviato: ["Da inviare", "giallo"], in_invio: ["In invio", "blu"], inviato: ["Inviata, in attesa", "blu"], consegnato: ["Consegnata", "verde"],
  mancata_consegna: ["Nel cassetto fiscale", "giallo"], scartato: ["Scartata", "rosso"], accettato: ["Accettata", "verde"], rifiutato: ["Rifiutata", "rosso"],
};
const STATO_PREV = { bozza: ["Bozza", "blu"], inviato: ["Inviato al cliente", "giallo"], accettato: ["Accettato", "verde"], rifiutato: ["Rifiutato", "rosso"] };
const STATO_SO = { programmato: ["Programmato", "blu"], completato: ["Fatto", "verde"], in_ufficio: ["In ufficio", "giallo"], budget_ok: ["Ok budget dal cliente", "verde"], convertito: ["Diventato preventivo", "verde"], annullato: ["Annullato", "rosso"] };
const TIPO = { preventivo: "Preventivo", fattura: "Fattura", acconto: "Fattura d'acconto", nota_credito: "Nota di credito" };
const NATURE = [["N6.3", "N6.3 · reverse charge subappalto edile"], ["N6.7", "N6.7 · reverse charge prestazioni su edifici"], ["N2.2", "N2.2 · forfettario / non soggetta"], ["N4", "N4 · esente"], ["N1", "N1 · esclusa art. 15"]];
const PAGAMENTI = [["MP05", "Bonifico"], ["MP01", "Contanti"], ["MP02", "Assegno"], ["MP08", "Carta"], ["MP12", "RIBA"]];
const ERRORI = {
  crediti_esauriti: "Invii finiti: chiedi ad AncheCasa un nuovo pacchetto.",
  nessun_piano_attivo: "Per inviare allo SdI serve un pacchetto di invii o un abbonamento: chiedilo ad AncheCasa.",
  modulo_non_attivo: "Il modulo Ufficio non è attivo per questa azienda.",
  mancano_i_dati_fiscali: "Prima compila i dati fiscali dell'azienda.",
  fattura_incompleta: "La fattura non è completa: correggi i punti indicati.",
  gia_inviata: "Questa fattura è già stata inviata.",
  gateway_non_configurato: "Il collegamento con lo SdI non è ancora attivo: AncheCasa lo sta configurando.",
  gateway_non_raggiungibile: "Lo SdI non risponde: l'invio non è partito e il credito è stato restituito. Riprova tra poco.",
  documento_bloccato: "Documento già inviato: non si modifica più. Per correggere serve una nota di credito.",
  preventivo_non_accettato: "Prima segna il preventivo come accettato.",
  manca_il_cliente: "Nel sopralluogo manca il nome del cliente.",
  cliente_non_valido: "Il cliente scelto non è di questa azienda.",
  non_autorizzato: "Non hai i permessi per farlo.",
};
const errore = (e) => ERRORI[String((e && e.message) || e)] || spiegaErrore(e);
const euro = (n) => (n == null ? "–" : Number(n).toLocaleString("it-IT", { style: "currency", currency: "EUR" }));
const data = (d) => (d ? new Date(String(d).length === 10 ? d + "T12:00:00" : d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");
const numDoc = (d) => (d.numero ? d.numero + "/" + (d.anno || String(d.data).slice(0, 4)) : "senza numero");
const nomeCliente = (c) => (c ? c.denominazione || [c.nome, c.cognome].filter(Boolean).join(" ") : "") || "Cliente da indicare";

/* Stile del modulo: poche regole, con i colori dell'app */
function stile() {
  if (document.getElementById("stile-fe")) return;
  const s = document.createElement("style");
  s.id = "stile-fe";
  s.textContent = `
  .fe-chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}
  .fe-chip{border:1.5px solid var(--linea);background:#fff;border-radius:999px;padding:7px 12px;font-weight:700;font-size:13px;color:var(--blu);cursor:pointer}
  .fe-chip.on{background:var(--blu);border-color:var(--blu);color:#fff}
  .fe-righe{display:flex;flex-direction:column;gap:10px}
  .fe-riga{background:#fff;border:1px solid #e7ecf3;border-radius:14px;padding:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
  .fe-riga .tutta{grid-column:1/-1}
  .fe-riga input,.fe-riga select{font:inherit;border:1.5px solid var(--linea);border-radius:10px;padding:9px;min-height:44px;width:100%;background:#fff}
  .fe-riga label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:700;color:var(--grigio)}
  .fe-riga .via{grid-column:3;align-self:end}
  .fe-tot{background:#fff;border:1px solid #e7ecf3;border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:4px;font-variant-numeric:tabular-nums}
  .fe-tot div{display:flex;justify-content:space-between}
  .fe-tot .g{font:800 18px var(--titoli);color:var(--blu);border-top:1px solid var(--linea);padding-top:6px;margin-top:2px}
  .fe-carta{background:#fff;border:1px solid #e7ecf3;border-radius:14px;padding:16px;font-size:13.5px}
  .fe-carta h3{font-size:16px;color:var(--blu)}
  .fe-carta table{width:100%;border-collapse:collapse;margin-top:10px;font-variant-numeric:tabular-nums}
  .fe-carta th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--grigio);border-bottom:1px solid var(--linea);padding:6px 4px}
  .fe-carta td{border-bottom:1px solid #f0f3f7;padding:7px 4px;vertical-align:top}
  .fe-carta .r{text-align:right;white-space:nowrap}
  .fe-due{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
  .fe-due>div{background:var(--carta);border-radius:10px;padding:8px 10px}
  .fe-due small{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--grigio);font-weight:700}
  .fe-filo{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
  .fe-filo li{display:grid;grid-template-columns:28px 1fr;gap:10px;padding:0 0 14px;position:relative}
  .fe-filo li:not(:last-child)::before{content:"";position:absolute;left:13px;top:28px;bottom:0;width:2px;background:var(--linea)}
  .fe-filo .pallino{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--carta);color:var(--grigio);font-weight:800;font-size:13px}
  .fe-filo .fatto .pallino{background:var(--verde);color:#fff}
  .fe-filo .ora .pallino{background:var(--arancio);color:#fff}
  .fe-filo b{display:block;color:var(--blu)}
  .fe-filo small{color:var(--grigio)}
  .fe-frase{background:#fff;border:1px solid #e7ecf3;border-radius:14px;padding:12px 14px;font-size:14px;line-height:1.5}
  .fe-frase b{color:var(--blu)}
  .fe-xml{max-height:240px;overflow:auto;background:var(--notte);color:#dfe7f1;border-radius:12px;padding:10px;font:12px/1.4 ui-monospace,Consolas,monospace;white-space:pre-wrap;word-break:break-all}
  .fe-foto{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
  .fe-foto img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px}
  `;
  document.head.appendChild(s);
}

export function installa(core) {
  const { S, V, AZIONI, FORM, vai, render } = core;
  stile();

  const gestisco = (org) => (core.gestisco ? core.gestisco(org) : true);
  const orgMia = () => S.org;

  /* ====================================================================== */
  /* Collegamenti dalle viste che esistono già                               */
  /* ====================================================================== */
  // Modulo Ufficio: in cima i preventivi e le fatture elettroniche e i sopralluoghi.
  const modVecchio = V.mod;
  V.mod = async (id) => {
    const out = await modVecchio(id);
    if (id === "ufficio" && out && out.h) {
      const tile = (ico, t, s, go) => `<div class="tile" data-go="${esc(go)}" role="button" tabindex="0"><span class="ico arancio">${I[ico]}</span><b>${t}</b><small>${s}</small></div>`;
      out.h = out.h.replace('<div class="pad">', `<div class="pad"><div class="griglia2">${tile("euro", "Preventivi e fatture elettroniche", "Dal preventivo all'invio allo SdI", "fe")}${tile("mappa", "Sopralluoghi e pratiche", "Da dove parte ogni lavoro", "so")}</div><div style="height:12px"></div>`);
    }
    return out;
  };
  // Home dell'agente (e capoarea, sub-agente): le sue pratiche e «Nuovo sopralluogo».
  if (V["re-home"]) {
    const reVecchio = V["re-home"];
    V["re-home"] = async (...a) => {
      const out = await reVecchio(...a);
      let pr = [];
      try { pr = await FE.miePratiche(); } catch (e) { return out; }
      const blocco = sez("Le mie pratiche", `${pr.length ? lista(pr.slice(0, 4).map(rigaPratica)) : vuoto("Nessun sopralluogo ancora.")}<div style="height:10px"></div>${btn(I.piu + " Nuovo sopralluogo", "go:so-nuovo")}`, pr.length > 4 ? `<a data-go="so">Tutte</a>` : "");
      if (out && out.h) out.h = out.h.replace('<div class="pad">', `<div class="pad">${blocco}`);
      return out;
    };
  }
  // Cruscotto admin: volumi, costi e margini della fatturazione.
  if (V["ad-home"]) {
    const adVecchio = V["ad-home"];
    V["ad-home"] = async (...a) => {
      const out = await adVecchio(...a);
      if (out && out.h) out.h = out.h.replace('<div class="pad">', `<div class="pad">${lista([voce("euro", "Fatture elettroniche", "Invii, costi del gateway, ricavi e margine per azienda", "ad-fe", "arancio")])}<div style="height:12px"></div>`);
      return out;
    };
  }
  if (!AZIONI["go:"]) AZIONI["go:"] = (r) => vai(r);

  /* ====================================================================== */
  /* ELENCO DOCUMENTI                                                        */
  /* ====================================================================== */
  const FILTRI = [["tutti", "Tutti"], ["preventivi", "Preventivi"], ["dainviare", "Da inviare"], ["attesa", "In attesa"], ["consegnate", "Consegnate"], ["scartate", "Scartate"], ["daincassare", "Da incassare"]];
  const passa = (f, d) => ({
    tutti: true, preventivi: d.tipo === "preventivo", dainviare: d.tipo !== "preventivo" && d.stato_sdi === "non_inviato",
    attesa: ["in_invio", "inviato"].includes(d.stato_sdi), consegnate: ["consegnato", "mancata_consegna", "accettato"].includes(d.stato_sdi),
    scartate: d.stato_sdi === "scartato", daincassare: d.tipo !== "preventivo" && d.bloccato && !d.incassato && d.stato_sdi !== "scartato",
  })[f];
  const rigaDoc = (d) => {
    const st = d.tipo === "preventivo" ? STATO_PREV[d.stato_preventivo] : STATO_SDI[d.stato_sdi];
    return voce(d.tipo === "preventivo" ? "doc" : "euro", `${TIPO[d.tipo]} ${esc(numDoc(d))} · ${euro(d.totale)}`, `${esc(nomeCliente(d.cliente_dati))}${d.oggetto ? " · " + esc(d.oggetto) : ""}`, "fe-vedi/" + d.id, d.tipo === "preventivo" ? "blu" : "arancio", stato(st[1], st[0]));
  };

  V.fe = async (filtro) => {
    const org = orgMia();
    if (!org) return { t: "Fatture", h: `<div class="pad">${vuoto("Apri l'app con il profilo della tua azienda.")}</div>` };
    await FE.semina();
    const [docs, prof, cons] = await Promise.all([FE.documenti(org), FE.profilo(org).catch(() => null), FE.consumi(org).catch(() => null)]);
    const f = FILTRI.some((x) => x[0] === filtro) ? filtro : "tutti";
    const vis = docs.filter((d) => passa(f, d));
    const daInc = docs.filter((d) => passa("daincassare", d)).reduce((s, d) => s + Number(d.totale || 0), 0);
    const res = cons ? cons.residui : null;
    return {
      t: "Preventivi e fatture",
      h: `<div class="pad">
        ${!prof ? avviso(`Prima di inviare fatture compila i <a data-go="fe-dati"><u>dati fiscali</u></a> dell'azienda.`) + '<div style="height:12px"></div>' : ""}
        <div class="griglia2">${num(docs.filter((d) => passa("attesa", d) || passa("dainviare", d)).length, "Fatture da seguire")}${num(euro(daInc), "Da incassare", daInc ? "giallo" : "")}</div><div style="height:10px"></div>
        <div class="btns">${btn(I.piu + " Preventivo", "go:fe-doc/nuovo:preventivo", "blu")}${btn(I.piu + " Fattura", "go:fe-doc/nuovo:fattura")}</div><div style="height:14px"></div>
        <div class="fe-chips" role="group" aria-label="Filtra">${FILTRI.map(([k, t]) => `<button type="button" class="fe-chip ${k === f ? "on" : ""}" data-go="fe/${k}" aria-pressed="${k === f}">${t}</button>`).join("")}</div>
        ${vis.length ? lista(vis.map(rigaDoc)) : vuoto("Niente qui.")}
        <div style="height:16px"></div>
        ${lista([voce("ufficio", "Dati fiscali dell'azienda", prof ? esc(prof.denominazione) + " · P.IVA " + esc(prof.piva) : "Da compilare", "fe-dati", prof ? "blu" : "giallo"),
                 voce("grafico", "Invii allo SdI", res == null ? (cons && cons.crediti.length ? "A consumo" : "Nessun pacchetto attivo") : res + " invii rimasti", "fe-consumi", res === 0 || (cons && !cons.crediti.length) ? "rosso" : "verde")])}
      </div>`,
    };
  };

  /* ====================================================================== */
  /* EDITOR                                                                  */
  /* ====================================================================== */
  const opz = (lista2, v) => lista2.map(([k, t]) => `<option value="${esc(k)}" ${String(k) === String(v) ? "selected" : ""}>${esc(t)}</option>`).join("");
  const rigaHtml = (r) => `<div class="fe-riga">
    <label class="tutta">Descrizione<input name="r_desc" maxlength="1000" value="${esc(r.descrizione || "")}" placeholder="es. Rifacimento intonaco"></label>
    <label>Quantità<input name="r_q" inputmode="decimal" value="${esc(r.quantita ?? 1)}"></label>
    <label>Unità<input name="r_um" maxlength="10" value="${esc(r.um || "")}" placeholder="mq, n., ore"></label>
    <label>Prezzo €<input name="r_p" inputmode="decimal" value="${esc(r.prezzo ?? "")}"></label>
    <label>IVA<select name="r_iva">${opz([["22", "22%"], ["10", "10%"], ["4", "4%"], ["0", "0% (Natura)"]], Number(r.aliquota ?? 22))}</select></label>
    <label class="natura" ${Number(r.aliquota ?? 22) === 0 ? "" : "hidden"}>Natura<select name="r_nat">${opz(NATURE, r.natura || "N6.3")}</select></label>
    <label>Sconto %<input name="r_sc" inputmode="decimal" value="${esc(r.sconto || 0)}"></label>
    <button type="button" class="btn piccolo chiaro via" data-az="fe-riga-via" aria-label="Togli la voce">${I.no}</button>
  </div>`;
  const leggiRighe = (f) => [...f.querySelectorAll(".fe-riga")].map((el) => {
    const v = (n) => (el.querySelector(`[name="${n}"]`) || {}).value || "";
    const n = (s) => Number(String(s).replace(",", ".")) || 0;
    return { descrizione: v("r_desc"), quantita: n(v("r_q")) || 1, um: v("r_um"), prezzo: n(v("r_p")), aliquota: n(v("r_iva")), natura: n(v("r_iva")) === 0 ? v("r_nat") : null, sconto: n(v("r_sc")) };
  });
  function aggiornaTotali(f) {
    const t = totali(leggiRighe(f).filter((r) => r.descrizione.trim()), Number(String(f.sconto.value).replace(",", ".")) || 0);
    const box = f.querySelector(".fe-tot");
    if (box) box.innerHTML = `<div><span>Imponibile</span><b>${euro(t.imponibile)}</b></div>${t.gruppi.map((g) => `<div><small>${g.natura ? "Natura " + esc(g.natura) : "IVA " + g.aliquota + "%"} su ${euro(g.imponibile)}</small><small>${euro(g.imposta)}</small></div>`).join("")}<div class="g"><span>Totale</span><span>${euro(t.totale)}</span></div>`;
  }

  V["fe-doc"] = async (param) => {
    const org = orgMia();
    if (!gestisco(org)) return { t: "Documento", h: `<div class="pad">${avviso("Solo il titolare o il responsabile possono preparare preventivi e fatture.")}</div>` };
    const [prima, tipoNuovo, clientePre] = String(param || "").split(":");
    let d, righe = [];
    if (prima === "nuovo") {
      const prof = await FE.profilo(org).catch(() => null);
      d = { org, tipo: tipoNuovo === "fattura" ? "fattura" : "preventivo", data: new Date().toISOString().slice(0, 10), cliente: clientePre || null, cliente_dati: {}, oggetto: "", note: "", condizioni: tipoNuovo === "fattura" ? "" : (prof && prof.condizioni) || "", sconto: 0, pagamento: "MP05", validita_giorni: 30 };
      d.tipo_sdi = d.tipo === "fattura" ? "TD01" : null;
      d.stato_preventivo = d.tipo === "preventivo" ? "bozza" : null;
      righe = [{ quantita: 1, aliquota: prof && prof.regime === "RF19" ? 0 : 10, natura: prof && prof.regime === "RF19" ? "N2.2" : null }];
    } else {
      d = await FE.documento(prima);
      if (!d) return { t: "Documento", h: `<div class="pad">${vuoto("Documento non trovato.")}</div>` };
      if (d.bloccato) return { t: TIPO[d.tipo], h: `<div class="pad">${avviso(ERRORI.documento_bloccato)}<div style="height:12px"></div>${btn("Torna al documento", "go:fe-vedi/" + d.id, "chiaro")}</div>` };
      righe = await FE.righe(d.id);
    }
    const [clienti, cantieri] = await Promise.all([FE.clienti(org).catch(() => []), FE.cantieri(org).catch(() => [])]);
    if (d.cliente && !Object.keys(d.cliente_dati || {}).length) { const c = clienti.find((x) => x.id === d.cliente); if (c) d.cliente_dati = Object.assign({ denominazione: c.titolo }, c.dati || {}); }
    const c = d.cliente_dati || {};
    const pre = d.tipo === "preventivo";
    return {
      t: d.id ? TIPO[d.tipo] + " " + numDoc(d) : pre ? "Nuovo preventivo" : "Nuova fattura",
      h: `<div class="pad"><form data-form="fe-doc" novalidate data-id="${esc(d.id || "")}" data-tipo="${esc(d.tipo)}">
        ${sez("Cliente", `${campo("Scegli tra i tuoi clienti", `<select name="cliente"><option value="">Cliente nuovo (scrivi i dati qui sotto)</option>${clienti.map((x) => `<option value="${esc(x.id)}" ${x.id === d.cliente ? "selected" : ""}>${esc(x.titolo)}</option>`).join("")}</select>`)}
          ${campo("Ragione sociale", `<input name="c_denominazione" maxlength="80" value="${esc(c.denominazione || "")}">`, "Per i privati lascia vuoto e scrivi nome e cognome.")}
          <div class="griglia2">${campo("Nome", `<input name="c_nome" maxlength="60" value="${esc(c.nome || "")}">`)}${campo("Cognome", `<input name="c_cognome" maxlength="60" value="${esc(c.cognome || "")}">`)}</div>
          <div class="griglia2">${campo("Partita IVA", `<input name="c_piva" inputmode="numeric" maxlength="11" value="${esc(c.piva || "")}">`)}${campo("Codice fiscale", `<input name="c_cf" maxlength="16" value="${esc(c.cf || "")}" style="text-transform:uppercase">`)}</div>
          <div class="griglia2">${campo("Codice destinatario", `<input name="c_codice_destinatario" maxlength="7" value="${esc(c.codice_destinatario || "")}" placeholder="0000000" style="text-transform:uppercase">`, "7 caratteri. Privati: 0000000.")}${campo("PEC", `<input name="c_pec" type="email" maxlength="120" value="${esc(c.pec || "")}">`)}</div>
          ${campo("Indirizzo", `<input name="c_indirizzo" maxlength="60" value="${esc(c.indirizzo || "")}">`)}
          <div class="griglia2">${campo("Civico", `<input name="c_civico" maxlength="8" value="${esc(c.civico || "")}">`)}${campo("CAP", `<input name="c_cap" inputmode="numeric" maxlength="5" value="${esc(c.cap || "")}">`)}</div>
          <div class="griglia2">${campo("Comune", `<input name="c_comune" maxlength="60" value="${esc(c.comune || "")}">`)}${campo("Provincia", `<input name="c_provincia" maxlength="2" value="${esc(c.provincia || "")}" style="text-transform:uppercase" placeholder="NA">`)}</div>`)}
        ${sez("Documento", `${campo("Oggetto", `<input name="oggetto" maxlength="200" value="${esc(d.oggetto || "")}" placeholder="es. Rifacimento bagno">`)}
          ${campo("Cantiere", `<select name="cantiere"><option value="">Nessuno</option>${cantieri.map((x) => `<option value="${esc(x.id)}" ${x.id === d.cantiere ? "selected" : ""}>${esc(x.titolo)}</option>`).join("")}</select>`)}
          <div class="griglia2">${campo("Data", `<input name="data" type="date" value="${esc(d.data)}">`)}${pre ? campo("Valido (giorni)", `<input name="validita" inputmode="numeric" value="${esc(d.validita_giorni || 30)}">`) : campo("Tipo", `<select name="tipo_sdi">${opz([["TD01", "Fattura"], ["TD02", "Acconto"]], d.tipo_sdi)}</select>`)}</div>
          ${pre ? "" : `<div class="griglia2">${campo("Pagamento", `<select name="pagamento">${opz(PAGAMENTI, d.pagamento)}</select>`)}${campo("Scadenza", `<input name="scadenza" type="date" value="${esc(d.scadenza_pagamento || "")}">`)}</div>`}`)}
        ${sez("Voci", `<div class="fe-righe">${righe.map(rigaHtml).join("")}</div><div style="height:10px"></div>${btn(I.piu + " Aggiungi una voce", "fe-riga-piu", "chiaro")}
          <div style="height:12px"></div>${campo("Sconto sul totale %", `<input name="sconto" inputmode="decimal" value="${esc(d.sconto || 0)}">`)}<div class="fe-tot"></div>`)}
        ${sez("Note", `${campo("Note per il cliente", `<textarea name="note" maxlength="2000">${esc(d.note || "")}</textarea>`)}${pre ? campo("Condizioni", `<textarea name="condizioni" maxlength="1500">${esc(d.condizioni || "")}</textarea>`) : ""}`)}
        <button class="btn" type="submit">Salva ${pre ? "il preventivo" : "la fattura"}</button>
      </form></div>`,
      dopo: (el) => {
        const f = el.querySelector('form[data-form="fe-doc"]');
        aggiornaTotali(f);
        f.addEventListener("input", () => aggiornaTotali(f));
        f.addEventListener("change", (e) => {
          if (e.target.name === "r_iva") { const n = e.target.closest(".fe-riga").querySelector(".natura"); n.hidden = e.target.value !== "0"; }
          if (e.target.name === "cliente") {
            const x = clienti.find((k) => k.id === e.target.value);
            if (!x) return;
            const dd = Object.assign({ denominazione: x.titolo }, x.dati || {});
            ["denominazione", "nome", "cognome", "piva", "cf", "codice_destinatario", "pec", "indirizzo", "civico", "cap", "comune", "provincia"].forEach((k) => { if (f["c_" + k]) f["c_" + k].value = dd[k] || ""; });
          }
          aggiornaTotali(f);
        });
      },
    };
  };
  AZIONI["fe-riga-piu"] = () => {
    const box = document.querySelector(".fe-righe");
    if (!box) return;
    box.insertAdjacentHTML("beforeend", rigaHtml({ quantita: 1, aliquota: 10 }));
    box.lastElementChild.querySelector("input").focus();
  };
  AZIONI["fe-riga-via"] = () => {}; // gestita qui sotto (serve il bottone premuto)
  document.addEventListener("click", (e) => {
    const b = e.target.closest('[data-az="fe-riga-via"]');
    if (!b) return;
    const box = b.closest(".fe-righe"), f = b.closest("form");
    if (box && box.children.length > 1) { b.closest(".fe-riga").remove(); if (f) aggiornaTotali(f); } else toast("Serve almeno una voce.", "errore");
  });

  FORM["fe-doc"] = async (f) => {
    const tipo = f.dataset.tipo, id = f.dataset.id || null;
    const cd = {};
    ["denominazione", "nome", "cognome", "piva", "cf", "codice_destinatario", "pec", "indirizzo", "civico", "cap", "comune", "provincia"].forEach((k) => {
      let v = String(f["c_" + k].value || "").trim();
      if (["cf", "codice_destinatario", "provincia"].includes(k)) v = v.toUpperCase();
      if (v) cd[k] = v;
    });
    cd.nazione = "IT";
    if (!cd.denominazione && !(cd.nome && cd.cognome)) return toast("Scrivi la ragione sociale oppure nome e cognome del cliente.", "errore");
    if (cd.piva && !/^[0-9]{11}$/.test(cd.piva)) return toast("La partita IVA ha 11 cifre.", "errore");
    const righe = leggiRighe(f).filter((r) => r.descrizione.trim());
    if (!righe.length) return toast("Aggiungi almeno una voce con la descrizione.", "errore");
    const num2 = (s) => Number(String(s || "").replace(",", ".")) || 0;
    const doc = {
      id, org: orgMia(), tipo: tipo === "preventivo" ? "preventivo" : f.tipo_sdi.value === "TD02" ? "acconto" : "fattura",
      tipo_sdi: tipo === "preventivo" ? null : f.tipo_sdi.value, stato_preventivo: tipo === "preventivo" ? (id ? undefined : "bozza") : null,
      cliente: f.cliente.value || null, cantiere: f.cantiere.value || null, cliente_dati: cd, oggetto: f.oggetto.value.trim(), data: f.data.value,
      note: f.note.value.trim(), sconto: Math.min(100, Math.max(0, num2(f.sconto.value))),
    };
    if (tipo === "preventivo") { doc.validita_giorni = Math.min(365, Math.max(1, Math.round(num2(f.validita.value)) || 30)); doc.condizioni = f.condizioni.value.trim(); }
    else { doc.pagamento = f.pagamento.value; doc.scadenza_pagamento = f.scadenza.value || null; }
    try { const nid = await FE.salva(doc, righe); toast("Salvato."); vai("fe-vedi/" + nid, true); } catch (e) { toast(errore(e), "errore"); }
  };

  /* ====================================================================== */
  /* DOCUMENTO: anteprima, stato, azioni                                     */
  /* ====================================================================== */
  let timerStato = null;
  V["fe-vedi"] = async (id) => {
    clearInterval(timerStato);
    const d = await FE.documento(id);
    if (!d) return { t: "Documento", h: `<div class="pad">${vuoto("Documento non trovato.")}</div>` };
    const [righe, ev, prof] = await Promise.all([FE.righe(id), FE.eventi(id).catch(() => []), FE.profilo(d.org).catch(() => null)]);
    const t = totali(righe, d.sconto);
    const pre = d.tipo === "preventivo";
    const st = pre ? STATO_PREV[d.stato_preventivo] : STATO_SDI[d.stato_sdi];
    const c = d.cliente_dati || {};
    const gest = gestisco(d.org);
    const azioni = [];
    if (gest && pre) {
      if (d.stato_preventivo === "bozza") azioni.push(btn("Modifica", "go:fe-doc/" + d.id, "chiaro"), btn("Segna come inviato al cliente", "fe-prev:inviato:" + d.id, "blu"));
      if (["bozza", "inviato"].includes(d.stato_preventivo)) azioni.push(btn(I.ok + " Il cliente ha accettato", "fe-prev:accettato:" + d.id), btn("Il cliente ha rifiutato", "fe-prev:rifiutato:" + d.id, "chiaro"));
      if (d.stato_preventivo === "accettato") {
        if (!d.cantiere) azioni.push(btn(I.gru + " Apri il cantiere", "fe-cantiere:" + d.id, "blu"));
        azioni.push(btn(I.euro + " Crea la fattura", "fe-fattura:TD01:" + d.id), btn("Fattura d'acconto", "fe-fattura:TD02:" + d.id, "chiaro"));
      }
      if (d.stato_preventivo === "rifiutato") azioni.push(btn("Riapri come bozza", "fe-prev:bozza:" + d.id, "chiaro"));
    }
    if (gest && !pre) {
      if (!d.bloccato) azioni.push(btn("Modifica", "go:fe-doc/" + d.id, "chiaro"), btn("Controlla l'XML", "fe-xml:" + d.id, "chiaro"), btn(I.freccia + (d.stato_sdi === "scartato" ? " Rimanda allo SdI" : " Invia allo SdI"), "fe-invia:" + d.id));
      if (["inviato", "in_invio"].includes(d.stato_sdi)) azioni.push(btn("Aggiorna lo stato", "fe-stato:" + d.id, "chiaro"));
      if (d.bloccato && d.stato_sdi !== "scartato") azioni.push(btn(d.incassato ? "Segna da incassare" : I.ok + " Segna incassata", "fe-incassata:" + (d.incassato ? "0" : "1") + ":" + d.id, d.incassato ? "chiaro" : "blu"));
    }
    if (d.xml) azioni.push(btn(I.doc + " Scarica l'XML", "fe-scarica:" + d.id, "chiaro"));
    if (gest && !d.bloccato && (pre || !d.numero)) azioni.push(`<button type="button" class="link" data-az="fe-elimina:${esc(d.id)}">Elimina</button>`);

    const scarto = d.stato_sdi === "scartato" && d.esito ? avviso(`Scartata dallo SdI${d.esito.codice ? " (codice " + esc(d.esito.codice) + ")" : ""}: ${esc(d.esito.testo || "correggi e rimandala")}. Hai 5 giorni per rimandarla con lo stesso numero e la stessa data.`, "rosso") : "";
    return {
      t: TIPO[d.tipo] + " " + numDoc(d),
      h: `<div class="pad">
        <div class="riga" style="justify-content:space-between;margin-bottom:12px">${stato(st[1], st[0])}${d.incassato ? stato("verde", "Incassata") : ""}${d.sopralluogo ? `<a class="link" data-go="pratica/${esc(d.sopralluogo)}">Vedi la pratica</a>` : ""}</div>
        ${scarto}${scarto ? '<div style="height:10px"></div>' : ""}
        <article class="fe-carta" aria-label="Anteprima del documento">
          <div class="riga" style="justify-content:space-between;align-items:flex-start;gap:12px">
            <div><h3>${esc(prof ? prof.denominazione : "")}</h3><small class="sotto" style="margin:0">${prof ? esc([prof.indirizzo, prof.civico].filter(Boolean).join(" ") + " · " + [prof.cap, prof.comune, prof.provincia].filter(Boolean).join(" ")) + "<br>P.IVA " + esc(prof.piva) : "Dati fiscali da compilare"}</small></div>
            <div style="text-align:right"><b>${TIPO[d.tipo]}</b><br><small>N. ${esc(numDoc(d))}<br>del ${data(d.data)}</small></div>
          </div>
          <div class="fe-due"><div><small>Cliente</small><b>${esc(nomeCliente(c))}</b><br>${esc([c.indirizzo, c.civico].filter(Boolean).join(" "))} ${esc([c.cap, c.comune, c.provincia].filter(Boolean).join(" "))}${c.piva ? "<br>P.IVA " + esc(c.piva) : ""}${c.cf ? "<br>CF " + esc(c.cf) : ""}</div>
            <div><small>Lavoro</small><b>${esc(d.oggetto || "–")}</b>${pre && d.validita_giorni ? `<br>Valido ${esc(d.validita_giorni)} giorni` : ""}${!pre && d.scadenza_pagamento ? "<br>Scadenza " + data(d.scadenza_pagamento) : ""}</div></div>
          <table><thead><tr><th>Descrizione</th><th class="r">Q.tà</th><th class="r">Prezzo</th><th class="r">IVA</th><th class="r">Importo</th></tr></thead><tbody>
            ${righe.map((r) => `<tr><td>${esc(r.descrizione)}</td><td class="r">${esc(String(r.quantita).replace(".", ","))} ${esc(r.um || "")}</td><td class="r">${euro(r.prezzo)}</td><td class="r">${r.natura ? esc(r.natura) : esc(r.aliquota) + "%"}</td><td class="r">${euro(Number(r.quantita) * Number(r.prezzo) * (1 - Number(r.sconto || 0) / 100))}</td></tr>`).join("")}
          </tbody></table>
          <div style="height:10px"></div>
          <div class="fe-tot"><div><span>Imponibile${Number(d.sconto) ? " (sconto " + esc(d.sconto) + "%)" : ""}</span><b>${euro(t.imponibile)}</b></div>${t.gruppi.map((g) => `<div><small>${g.natura ? "Natura " + esc(g.natura) : "IVA " + g.aliquota + "%"}</small><small>${euro(g.imposta)}</small></div>`).join("")}<div class="g"><span>Totale</span><span>${euro(t.totale)}</span></div></div>
          ${d.note ? `<p class="sotto" style="margin:10px 0 0;white-space:pre-line">${esc(d.note)}</p>` : ""}
          ${pre && d.condizioni ? `<p class="sotto" style="margin:8px 0 0;white-space:pre-line"><b>Condizioni</b><br>${esc(d.condizioni)}</p>` : ""}
          <p class="sotto" style="margin:12px 0 0;font-size:12px">Fatto con AncheCasa · anchecasa.it</p>
        </article>
        <div style="height:14px"></div>
        <div class="btns" style="flex-direction:column;gap:8px">${azioni.join("")}</div>
        ${ev.length ? `<div style="height:16px"></div>${sez("Cosa è successo", lista(ev.map((e) => voce(e.tipo === "errore" ? "allarme" : e.tipo === "notifica" ? "campana" : "ok", esc(e.testo), quando(e.creato), null, e.stato_sdi === "scartato" || e.tipo === "errore" ? "rosso" : e.stato_sdi === "consegnato" ? "verde" : "blu"))))}` : ""}
      </div>`,
      dopo: () => {
        if (!["inviato", "in_invio"].includes(d.stato_sdi)) return;
        const hash = location.hash;
        timerStato = setInterval(async () => {
          if (location.hash !== hash) return clearInterval(timerStato);
          try { const r = await FE.gateway("stato", d.id); if (r && r.stato_sdi && r.stato_sdi !== d.stato_sdi) { clearInterval(timerStato); toast(STATO_SDI[r.stato_sdi] ? STATO_SDI[r.stato_sdi][0] : r.stato_sdi); render(); } } catch (e) { clearInterval(timerStato); }
        }, 8000);
      },
    };
  };

  const prova = async (fn, ok) => { try { const r = await fn(); if (ok) toast(ok); return r; } catch (e) { toast(errore(e), "errore"); return null; } };
  AZIONI["fe-prev:"] = async (arg) => { const [s, id] = arg.split(":"); if (await prova(() => FE.statoPreventivo(id, s), s === "accettato" ? "Accettato. Ora puoi aprire il cantiere e fare la fattura." : "Fatto.") !== null) render(); };
  AZIONI["fe-fattura:"] = async (arg) => { const [td, id] = arg.split(":"); const nid = await prova(() => FE.daPreventivo(id, td), "Fattura pronta: controllala e inviala."); if (nid) vai("fe-vedi/" + nid); };
  AZIONI["fe-cantiere:"] = async (id) => { const c = await prova(() => FE.apriCantiere(id), "Cantiere aperto."); if (c) render(); };
  AZIONI["fe-incassata:"] = async (arg) => { const [si, id] = arg.split(":"); if (await prova(() => FE.incassato(id, si === "1"), si === "1" ? "Segnata come incassata." : "Fatto.") !== null) render(); };
  AZIONI["fe-stato:"] = async (id) => { const r = await prova(() => FE.gateway("stato", id)); if (r) { toast(STATO_SDI[r.stato_sdi] ? STATO_SDI[r.stato_sdi][0] : "Aggiornato."); render(); } };
  AZIONI["fe-elimina:"] = async (id) => {
    foglio(`<h2>Eliminare il documento?</h2><p class="sotto">Non si può tornare indietro.</p><div class="btns">${btn("Elimina", "fe-elimina-ok:" + id)}${btn("Annulla", "fe-chiudi", "chiaro")}</div>`);
  };
  AZIONI["fe-elimina-ok:"] = async (id) => { chiudiFoglio(); if (await prova(() => FE.elimina(id), "Eliminato.") !== null) vai("fe", true); };
  AZIONI["fe-chiudi"] = () => chiudiFoglio();
  AZIONI["fe-xml:"] = async (id) => {
    const r = await prova(() => FE.gateway("xml", id));
    if (!r) return;
    foglio(`<h2>${r.ok ? "La fattura è pronta" : "Da sistemare prima dell'invio"}</h2>
      ${r.ok ? `<p class="sotto">Il file XML rispetta i controlli di AncheCasa. Lo SdI farà i suoi controlli all'invio.</p>` : lista((r.errori || []).map((e) => voce("allarme", esc(e), "", null, "rosso")))}
      <div style="height:10px"></div><div class="fe-xml">${esc(r.xml || "")}</div><div style="height:12px"></div>
      ${r.ok ? btn(I.freccia + " Invia allo SdI", "fe-invia:" + id) : btn("Correggi", "go:fe-doc/" + id)}`);
  };
  AZIONI["fe-invia:"] = async (id) => {
    const cons = await FE.consumi(orgMia()).catch(() => null);
    foglio(`<h2>Inviare allo SdI?</h2><p class="sotto">Dopo l'invio la fattura non si modifica più. Il numero diventa definitivo.${cons && cons.residui != null ? ` Ti restano <b>${cons.residui}</b> invii.` : ""}</p>
      ${FE.prova ? avviso("Modalità prova: l'invio è simulato, non parte niente.") + '<div style="height:10px"></div>' : ""}
      <div class="btns">${btn("Invia", "fe-invia-ok:" + id)}${btn("Annulla", "fe-chiudi", "chiaro")}</div>`);
  };
  AZIONI["fe-invia-ok:"] = async (id) => {
    chiudiFoglio();
    toast("Invio in corso…");
    let r;
    try { r = await FE.gateway("invia", id); } catch (e) { toast(errore(e), "errore"); return; }
    if (r && r.ok) { toast("Inviata. Ti avviso quando lo SdI la consegna."); render(); return; }
    if (r && r.dettagli && r.dettagli.length) foglio(`<h2>Non inviata</h2><p class="sotto">${esc(ERRORI[r.error] || "Correggi questi punti:")}</p>${lista(r.dettagli.map((e) => voce("allarme", esc(e), "", null, "rosso")))}<div style="height:12px"></div>${btn("Correggi", "go:fe-doc/" + id)}`);
    else toast(errore(r && r.error), "errore");
  };
  AZIONI["fe-scarica:"] = async (id) => {
    const d = await FE.documento(id);
    if (!d || !d.xml) return toast("XML non disponibile.", "errore");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([d.xml], { type: "application/xml" }));
    a.download = d.sdi_file || "fattura.xml";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  /* ====================================================================== */
  /* DATI FISCALI E CONSUMI                                                  */
  /* ====================================================================== */
  V["fe-dati"] = async () => {
    const org = orgMia();
    const p = (await FE.profilo(org).catch(() => null)) || {};
    const ro = gestisco(org) ? "" : "disabled";
    const i = (n, et, extra, aiuto) => campo(et, `<input name="${n}" value="${esc(p[n] || "")}" ${extra || ""} ${ro}>`, aiuto);
    return {
      t: "Dati fiscali",
      h: `<div class="pad"><p class="sotto">Sono i dati di chi emette: vanno in ogni fattura e nel file per lo SdI.</p>
      <form data-form="fe-dati" novalidate>
        ${i("denominazione", "Ragione sociale", 'maxlength="80" required')}
        <div class="griglia2">${i("piva", "Partita IVA", 'inputmode="numeric" maxlength="11"')}${i("cf", "Codice fiscale", 'maxlength="16" style="text-transform:uppercase"', "Se diverso dalla P.IVA")}</div>
        ${campo("Regime fiscale", `<select name="regime" ${ro}>${opz([["RF01", "Ordinario"], ["RF19", "Forfettario"], ["RF02", "Contribuenti minimi"]], p.regime || "RF01")}</select>`)}
        ${i("indirizzo", "Indirizzo della sede", 'maxlength="60"')}
        <div class="griglia2">${i("civico", "Civico", 'maxlength="8"')}${i("cap", "CAP", 'inputmode="numeric" maxlength="5"')}</div>
        <div class="griglia2">${i("comune", "Comune", 'maxlength="60"')}${i("provincia", "Provincia", 'maxlength="2" style="text-transform:uppercase"')}</div>
        <div class="griglia2">${i("rea_ufficio", "REA: provincia", 'maxlength="2" style="text-transform:uppercase"')}${i("rea_numero", "REA: numero", 'maxlength="20"')}</div>
        ${i("iban", "IBAN per i pagamenti", 'maxlength="34" style="text-transform:uppercase"')}
        <div class="griglia2">${i("telefono", "Telefono", 'maxlength="30"')}${i("email", "Mail", 'type="email" maxlength="120"')}</div>
        ${i("pec", "PEC", 'type="email" maxlength="120"')}
        ${campo("Condizioni standard dei preventivi", `<textarea name="condizioni" maxlength="1500" ${ro}>${esc(p.condizioni || "")}</textarea>`)}
        ${p.gateway ? `<p class="sotto">Collegamento SdI: <b>${esc(p.gateway)}</b> (lo imposta AncheCasa).</p>` : ""}
        ${ro ? "" : `<button class="btn" type="submit">Salva</button>`}
      </form></div>`,
    };
  };
  FORM["fe-dati"] = async (f) => {
    const v = (n) => String(f[n].value || "").trim();
    const up = (n) => v(n).toUpperCase().replace(/\s+/g, "");
    const dati = { denominazione: v("denominazione"), piva: v("piva").replace(/\D/g, ""), cf: up("cf"), regime: f.regime.value, indirizzo: v("indirizzo"), civico: v("civico"), cap: v("cap"), comune: v("comune"), provincia: up("provincia"), rea_ufficio: up("rea_ufficio"), rea_numero: v("rea_numero"), iban: up("iban"), telefono: v("telefono"), email: v("email"), pec: v("pec"), condizioni: v("condizioni") };
    if (dati.denominazione.length < 2) return toast("Scrivi la ragione sociale.", "errore");
    if (dati.piva && !/^[0-9]{11}$/.test(dati.piva)) return toast("La partita IVA ha 11 cifre.", "errore");
    if (dati.cap && !/^[0-9]{5}$/.test(dati.cap)) return toast("Il CAP ha 5 cifre.", "errore");
    if (dati.provincia && !/^[A-Z]{2}$/.test(dati.provincia)) return toast("Provincia: due lettere, es. NA.", "errore");
    try { await FE.salvaProfilo(orgMia(), dati); toast("Dati fiscali salvati."); vai("fe", true); } catch (e) { toast(errore(e), "errore"); }
  };

  V["fe-consumi"] = async () => {
    const c = await FE.consumi(orgMia());
    return {
      t: "Invii allo SdI",
      h: `<div class="pad">
        <div class="griglia2">${num(c.residui == null ? (c.crediti.length ? "∞" : "0") : c.residui, "Invii rimasti", c.residui === 0 || !c.crediti.length ? "rosso" : "verde")}${num((c.mesi[0] || {}).invii || 0, "Inviate questo mese")}</div><div style="height:14px"></div>
        ${sez("I tuoi pacchetti", c.crediti.length ? lista(c.crediti.map((x) => voce("box", esc(x.piano), x.totali == null ? "A consumo" : `${x.usati} usati su ${x.totali}${x.valido_al ? " · valido fino al " + data(x.valido_al) : ""}`, null, x.stato === "attivo" ? "verde" : "giallo"))) : vuoto("Nessun pacchetto attivo. Chiedi ad AncheCasa un pacchetto di invii o un abbonamento."))}
        ${c.mesi.length ? sez("Mese per mese", lista(c.mesi.map((m) => voce("grafico", esc(m.mese), m.invii + (m.invii === 1 ? " fattura inviata" : " fatture inviate"), null, "blu")))) : ""}
      </div>`,
    };
  };

  /* ====================================================================== */
  /* SUPER ADMIN: volumi, costi, ricavi, margine; crediti; costi del gateway */
  /* ====================================================================== */
  V["ad-fe"] = async (mese) => {
    if (!S.admin) return { t: "Fatture", h: `<div class="pad">${vuoto("Solo per l'admin.")}</div>` };
    await FE.semina();
    const m = /^\d{4}-\d{2}$/.test(mese || "") ? mese + "-01" : null;
    const [r, piani, costi, aziende] = await Promise.all([FE.riepilogoAdmin(m), FE.piani(), FE.costi(), FE.aziende()]);
    const margine = Number(r.totale.ricavo) - Number(r.totale.costo);
    const prec = new Date(r.mese + "-15"); prec.setMonth(prec.getMonth() - 1);
    const succ = new Date(r.mese + "-15"); succ.setMonth(succ.getMonth() + 1);
    const ym = (d) => d.toISOString().slice(0, 7);
    return {
      t: "Fatture elettroniche",
      h: `<div class="pad">
        <div class="riga" style="justify-content:space-between;margin-bottom:12px"><button type="button" class="btn piccolo chiaro" data-go="ad-fe/${ym(prec)}">‹</button><b>${esc(r.mese)}</b><button type="button" class="btn piccolo chiaro" data-go="ad-fe/${ym(succ)}">›</button></div>
        <div class="griglia2">${num(r.totale.invii, "Fatture inviate")}${num(euro(r.totale.costo), "Costo del gateway")}${num(euro(r.totale.ricavo), "Ricavi")}${num(euro(margine), "Margine", margine < 0 ? "rosso" : "verde")}</div><div style="height:16px"></div>
        ${sez("Per azienda", r.aziende.length ? lista(r.aziende.map((a) => voce("ufficio", esc(a.nome), `${a.invii} invii${a.scartati ? " · " + a.scartati + " scartate" : ""} · costo ${euro(a.costo)} · ricavo ${euro(a.ricavo)}`, null, "blu", `<b>${euro(Number(a.ricavo) - Number(a.costo))}</b>`))) : vuoto("Nessun invio in questo mese."))}
        ${r.in_esaurimento.length ? sez("Pacchetti quasi finiti", lista(r.in_esaurimento.map((a) => voce("allarme", esc(a.nome), a.residui + " invii rimasti", null, "giallo")))) : ""}
        ${sez("Assegna un pacchetto (dopo il pagamento)", `<form data-form="ad-fe-credito" novalidate>
          ${campo("Azienda", `<select name="org">${aziende.filter((o) => o.stato === "attiva").map((o) => `<option value="${esc(o.id)}">${esc(o.nome)}</option>`).join("")}</select>`)}
          ${campo("Piano", `<select name="piano">${piani.filter((p) => p.attivo).map((p) => `<option value="${esc(p.id)}" data-invii="${esc(p.invii ?? "")}" data-giorni="${esc(p.durata_giorni ?? "")}">${esc(p.nome)}${p.prezzo != null ? " · " + euro(p.prezzo) : ""}</option>`).join("")}</select>`)}
          <div class="griglia2">${campo("Prezzo pagato €", `<input name="prezzo" inputmode="decimal" value="">`)}${campo("A consumo: € per invio", `<input name="prezzo_invio" inputmode="decimal" value="">`)}</div>
          ${campo("Nota", `<input name="note" maxlength="300">`)}
          <button class="btn" type="submit">Assegna</button></form>`)}
        ${sez("Costo vivo del gateway per operazione", `<form data-form="ad-fe-costi" novalidate>${costi.map((c) => campo(esc({ invio_fe: "Invio fattura", ricezione: "Ricezione fattura", verifica_piva: "Verifica P.IVA", stato: "Controllo stato", genera_xml: "Controllo XML" }[c.operazione] || c.operazione), `<input name="${esc(c.operazione)}" inputmode="decimal" value="${esc(c.costo)}">`)).join("")}<button class="btn chiaro" type="submit">Salva i costi</button></form>`)}
        <p class="sotto">I prezzi dei piani li decide Nando: dove vedi «–» non c'è ancora un prezzo.</p>
      </div>`,
    };
  };
  FORM["ad-fe-credito"] = async (f) => {
    const op = f.piano.selectedOptions[0];
    const invii = op.dataset.invii ? Number(op.dataset.invii) : null;
    const giorni = op.dataset.giorni ? Number(op.dataset.giorni) : null;
    const valido = giorni ? new Date(Date.now() + giorni * 864e5).toISOString().slice(0, 10) : null;
    const n = (s) => (String(s || "").trim() === "" ? null : Number(String(s).replace(",", ".")));
    try { await FE.assegnaCredito({ org: f.org.value, piano: f.piano.value, invii_totali: invii, prezzo_pagato: n(f.prezzo.value) || 0, prezzo_invio: invii == null ? n(f.prezzo_invio.value) : null, valido_al: valido, note: f.note.value.trim() }); toast("Pacchetto assegnato."); render(); } catch (e) { toast(errore(e), "errore"); }
  };
  FORM["ad-fe-costi"] = async (f) => {
    try { for (const el of f.querySelectorAll("input")) await FE.salvaCosto(el.name, String(el.value).replace(",", ".")); toast("Costi salvati."); render(); } catch (e) { toast(errore(e), "errore"); }
  };

  /* ====================================================================== */
  /* SOPRALLUOGHI E PRATICHE                                                 */
  /* ====================================================================== */
  function frasePratica(p) {
    const pezzi = [`Sopralluogo ${p.stato === "programmato" ? "previsto" : "fatto"} il <b>${data(p.quando)}</b>${p.agente ? " da <b>" + esc(p.agente) + "</b>" : ""} per <b>${esc(p.ditta || "")}</b>`];
    if (p.preventivo) pezzi.push(`Preventivo N. <b>${esc(p.preventivo.numero || "–")}</b> ${esc((STATO_PREV[p.preventivo.stato] || ["", ""])[0].toLowerCase())}`);
    if (p.cantiere) pezzi.push(`Cantiere <b>${esc(p.cantiere.stato === "chiuso" ? "chiuso" : "attivo")}</b>`);
    const f = (p.fatture || [])[p.fatture.length - 1];
    if (f) pezzi.push(`${TIPO[f.tipo]} ${f.numero ? "N. <b>" + esc(f.numero) + "</b> " : ""}${esc((STATO_SDI[f.stato_sdi] || ["", ""])[0].toLowerCase())}`);
    return pezzi.join(" → ");
  }
  function rigaPratica(p) {
    const passo = p.fatture && p.fatture.length ? "Fattura" : p.cantiere ? "Cantiere" : p.preventivo ? "Preventivo" : "Sopralluogo";
    return voce("mappa", esc(p.cliente || "Cliente") + (p.lavori ? " · " + esc(p.lavori) : ""), `${esc(p.ditta || "")} · ${data(p.quando)}`, "pratica/" + p.id, p.stato === "annullato" ? "rosso" : "blu", stato("blu", passo));
  }

  V.so = async () => {
    const org = S.org && gestisco(S.org) ? S.org : null;
    await FE.semina();
    const pr = await FE.miePratiche(org);
    return {
      t: "Sopralluoghi",
      h: `<div class="pad"><p class="sotto">Ogni lavoro parte da un sopralluogo: da qui diventa preventivo, cantiere e fattura.</p>
        ${btn(I.piu + " Nuovo sopralluogo", "go:so-nuovo")}<div style="height:14px"></div>
        ${pr.length ? lista(pr.map(rigaPratica)) : vuoto("Nessun sopralluogo ancora.")}</div>`,
    };
  };

  V["so-nuovo"] = async (id) => {
    const s = id ? await FE.sopralluogo(id) : null;
    const [ditte, io] = await Promise.all([FE.ditte().catch(() => []), Promise.resolve(core.DB.idUtente())]);
    const mia = S.org && gestisco(S.org) ? S.org : null;
    const clienti = mia ? await FE.clienti(mia).catch(() => []) : [];
    const c = (s && s.cliente_dati) || {};
    const q = s ? new Date(s.quando) : new Date(Date.now() + 864e5);
    const locale = new Date(q.getTime() - q.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    return {
      t: s ? "Sopralluogo" : "Nuovo sopralluogo",
      h: `<div class="pad"><form data-form="so" novalidate data-id="${esc(s ? s.id : "")}">
        ${sez("Chi e per chi", `${campo("Ditta che farà il lavoro", `<select name="org" ${s ? "disabled" : ""}>${ditte.map((o) => `<option value="${esc(o.id)}" ${(s ? s.org : mia) === o.id ? "selected" : ""}>${esc(o.nome)}${o.citta ? " · " + esc(o.citta) : ""}</option>`).join("")}</select>`, ditte.length ? "" : "Nessuna ditta disponibile.")}
          ${campo("Chi fa il sopralluogo", `<input name="tecnico" maxlength="80" value="${esc(s ? s.tecnico : "")}" placeholder="Lascia vuoto se sei tu">`, "Sei registrato come agente: il sopralluogo resta collegato a te.")}`)}
        ${sez("Cliente", `${clienti.length ? campo("Tra i clienti della ditta", `<select name="cliente"><option value="">Cliente nuovo</option>${clienti.map((x) => `<option value="${esc(x.id)}" ${s && s.cliente === x.id ? "selected" : ""}>${esc(x.titolo)}</option>`).join("")}</select>`) : ""}
          ${campo("Ragione sociale (se è un'azienda o un condominio)", `<input name="c_denominazione" maxlength="80" value="${esc(c.denominazione || "")}">`)}
          <div class="griglia2">${campo("Nome", `<input name="c_nome" maxlength="60" value="${esc(c.nome || "")}">`)}${campo("Cognome", `<input name="c_cognome" maxlength="60" value="${esc(c.cognome || "")}">`)}</div>
          <div class="griglia2">${campo("Telefono", `<input name="c_telefono" type="tel" maxlength="30" value="${esc(c.telefono || "")}">`)}${campo("Mail", `<input name="c_email" type="email" maxlength="120" value="${esc(c.email || "")}">`)}</div>
          <div class="griglia2">${campo("Codice fiscale", `<input name="c_cf" maxlength="16" style="text-transform:uppercase" value="${esc(c.cf || "")}">`)}${campo("Partita IVA", `<input name="c_piva" inputmode="numeric" maxlength="11" value="${esc(c.piva || "")}">`)}</div>`)}
        ${sez("Dove e quando", `${campo("Quando", `<input name="quando" type="datetime-local" value="${esc(locale)}">`)}
          ${campo("Indirizzo del cantiere", `<input name="indirizzo" maxlength="200" value="${esc(s ? s.indirizzo : "")}" placeholder="Via, numero, comune">`)}
          <input type="hidden" name="lat" value="${esc(s && s.lat != null ? s.lat : "")}"><input type="hidden" name="lng" value="${esc(s && s.lng != null ? s.lng : "")}">
          <p class="sotto" data-pos>${s && s.lat != null ? "Posizione salvata." : ""}</p>
          ${btn(I.posizione + " Usa la mia posizione", "so-posizione", "chiaro")}`)}
        ${sez("Il lavoro", `${campo("Cosa chiede il cliente", `<input name="lavori" maxlength="300" value="${esc(s ? s.lavori : "")}" placeholder="es. Rifacimento bagno">`)}
          ${campo("Note tecniche e misure", `<textarea name="note" maxlength="4000" placeholder="es. Bagno 6 mq, piastrelle da togliere, scarico da spostare">${esc(s ? s.note : "")}</textarea>`)}
          ${campo("Foto", `<input name="foto" type="file" accept="image/*" capture="environment" multiple>`, "Fino a 30 foto. Si caricano quando salvi.")}
          ${campo("Stato", `<select name="stato">${opz([["programmato", "Da fare"], ["completato", "Fatto"]], s ? s.stato : "programmato")}</select>`)}`)}
        <button class="btn" type="submit">Salva il sopralluogo</button>
      </form></div>`,
    };
  };
  AZIONI["so-posizione"] = () => {
    const f = document.querySelector('form[data-form="so"]');
    const p = f && f.querySelector("[data-pos]");
    if (!navigator.geolocation) return toast("Il telefono non dà la posizione.", "errore");
    if (p) p.textContent = "Cerco la posizione…";
    navigator.geolocation.getCurrentPosition(
      (pos) => { f.lat.value = pos.coords.latitude.toFixed(6); f.lng.value = pos.coords.longitude.toFixed(6); if (p) p.textContent = `Posizione presa (precisione circa ${Math.round(pos.coords.accuracy)} m). Scrivi comunque l'indirizzo.`; },
      () => { if (p) p.textContent = "Posizione non disponibile: scrivi l'indirizzo."; },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  function comprimi(file) {
    return new Promise((ok, no) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1600 / Math.max(img.width, img.height));
        const cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob((b) => (b ? ok(b) : no(new Error("foto"))), "image/jpeg", 0.82);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = no;
      img.src = URL.createObjectURL(file);
    });
  }
  FORM.so = async (f) => {
    const v = (n) => String((f[n] && f[n].value) || "").trim();
    const cd = {};
    ["denominazione", "nome", "cognome", "telefono", "email", "cf", "piva"].forEach((k) => { let x = v("c_" + k); if (k === "cf") x = x.toUpperCase(); if (x) cd[k] = x; });
    if (!f.cliente || !f.cliente.value) { if (!cd.denominazione && !(cd.nome && cd.cognome)) return toast("Scrivi il cliente: ragione sociale oppure nome e cognome.", "errore"); }
    if (!f.dataset.id && !v("org")) return toast("Scegli la ditta.", "errore");
    if (!v("indirizzo") && !v("lat")) return toast("Scrivi l'indirizzo del cantiere o usa la posizione.", "errore");
    const s = {
      id: f.dataset.id || null, org: f.dataset.id ? undefined : v("org"), tecnico: v("tecnico"), cliente: (f.cliente && f.cliente.value) || null, cliente_dati: cd,
      quando: v("quando") ? new Date(v("quando")).toISOString() : new Date().toISOString(), indirizzo: v("indirizzo"),
      lat: v("lat") ? Number(v("lat")) : null, lng: v("lng") ? Number(v("lng")) : null, lavori: v("lavori"), note: v("note"), stato: f.stato.value,
    };
    let id;
    try { id = await FE.salvaSopralluogo(s); } catch (e) { return toast(errore(e), "errore"); }
    const files = [...(f.foto.files || [])].slice(0, 30);
    if (files.length) {
      const att = await FE.sopralluogo(id);
      let n = att ? att.foto || 0 : 0, fatte = 0;
      for (const file of files) {
        if (n >= 30) break;
        try { await FE.foto.carica(id, n + 1, await comprimi(file)); n++; fatte++; } catch (e) { console.error(e); }
      }
      if (fatte) await FE.salvaSopralluogo({ id, foto: n }).catch(() => {});
      if (fatte < files.length) toast(`Caricate ${fatte} foto su ${files.length}.`, "errore");
    }
    toast("Sopralluogo salvato.");
    vai("pratica/" + id, true);
  };

  V.pratica = async (id) => {
    let p;
    try { p = await FE.pratica(id); } catch (e) { return { t: "Pratica", h: `<div class="pad">${vuoto("Pratica non trovata.")}</div>` }; }
    const s = await FE.sopralluogo(id).catch(() => null);
    const urls = s && s.foto ? await Promise.all(Array.from({ length: s.foto }, (_, i) => FE.foto.url(id, i + 1).catch(() => ""))) : [];
    const io = core.DB.idUtente();
    const mioSo = s && (s.agente === io || gestisco(s.org));
    const f = p.fatture || [];
    const ultima = f[f.length - 1];
    const passi = [
      { t: "Sopralluogo", s: `${data(p.quando)}${p.agente ? " · " + esc(p.agente) : ""}${p.indirizzo ? " · " + esc(p.indirizzo) : ""}`, fatto: ["completato", "in_ufficio", "budget_ok", "convertito"].includes(p.stato) },
      { t: "Preventivo", s: p.preventivo ? `N. ${esc(p.preventivo.numero || "–")} · ${esc((STATO_PREV[p.preventivo.stato] || [""])[0])}${p.preventivo.totale != null ? " · " + euro(p.preventivo.totale) : ""}` : "Da preparare", fatto: !!p.preventivo && p.preventivo.stato === "accettato", go: p.preventivo && p.ditta_vede ? "fe-vedi/" + p.preventivo.id : null },
      { t: "Cantiere", s: p.cantiere ? esc(p.cantiere.titolo) + " · " + esc(p.cantiere.stato || "aperto") : "Si apre quando il cliente accetta", fatto: !!p.cantiere, go: p.cantiere && p.ditta_vede ? "scheda/" + p.cantiere.id : null },
      { t: "Fattura elettronica", s: ultima ? `${TIPO[ultima.tipo]} ${ultima.numero ? "N. " + esc(ultima.numero) : ""} · ${esc((STATO_SDI[ultima.stato_sdi] || [""])[0])}${ultima.incassato ? " · incassata" : ""}` : "Dopo l'accettazione", fatto: !!ultima && ["consegnato", "mancata_consegna", "accettato"].includes(ultima.stato_sdi), go: ultima && p.ditta_vede ? "fe-vedi/" + ultima.id : null },
    ];
    const ora = passi.findIndex((x) => !x.fatto);
    const azioni = [];
    if (mioSo && s && !["convertito", "annullato"].includes(s.stato)) {
      azioni.push(btn("Modifica il sopralluogo", "go:so-nuovo/" + id, "chiaro"));
      if (s.stato === "programmato") azioni.push(btn(I.ok + " Segna come fatto", "so-fatto:" + id, "blu"));
      azioni.push(btn(I.doc + " Trasforma in preventivo", "so-prev:" + id));
    }
    if (p.preventivo && p.ditta_vede && p.preventivo.stato === "accettato" && !p.cantiere) azioni.push(btn(I.gru + " Apri il cantiere", "fe-cantiere:" + p.preventivo.id, "blu"));
    return {
      t: "Pratica",
      h: `<div class="pad">
        <h2 class="saluto" style="font-size:20px">${esc(p.cliente || "Cliente")}</h2><p class="sotto">${esc(p.lavori || "")}</p>
        <div class="fe-frase">${frasePratica(p)}</div><div style="height:14px"></div>
        <ol class="fe-filo">${passi.map((x, i) => `<li class="${x.fatto ? "fatto" : i === ora ? "ora" : ""}"><span class="pallino">${x.fatto ? "✓" : i + 1}</span><div ${x.go ? `data-go="${esc(x.go)}" role="button" tabindex="0" style="cursor:pointer"` : ""}><b>${x.t}${x.go ? " ›" : ""}</b><small>${x.s}</small></div></li>`).join("")}</ol>
        ${s && s.note ? sez("Note del sopralluogo", `<div class="card" style="white-space:pre-line">${esc(s.note)}</div>`) : ""}
        ${urls.filter(Boolean).length ? sez("Foto", `<div class="fe-foto">${urls.filter(Boolean).map((u, i) => `<img src="${esc(u)}" alt="Foto ${i + 1} del sopralluogo" loading="lazy">`).join("")}</div>`) : ""}
        <div class="btns" style="flex-direction:column;gap:8px">${azioni.join("")}</div>
        ${!p.ditta_vede ? `<p class="sotto" style="margin-top:12px">Gli importi li vede la ditta.</p>` : ""}
      </div>`,
    };
  };
  V["so-vedi"] = V.pratica;
  AZIONI["so-fatto:"] = async (id) => { try { await FE.salvaSopralluogo({ id, stato: "completato" }); toast("Segnato come fatto."); render(); } catch (e) { toast(errore(e), "errore"); } };
  AZIONI["so-prev:"] = async (id) => {
    try {
      const pid = await FE.aPreventivo(id);
      toast("Preventivo creato in bozza: la ditta lo completa con le voci.");
      const s = await FE.sopralluogo(id);
      if (s && gestisco(s.org)) vai("fe-doc/" + pid); else render();
    } catch (e) { toast(errore(e), "errore"); }
  };
}
