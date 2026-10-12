/* Il dossier del tecnico AncheCasa (12.10.2026, app-28, approvato da Nando alle 15:12).
   Tutto quello che serve per fare il preventivo senza tornare dal cliente:
   scadenza (5 giorni o 48 ore urgente), misure delle stanze con schizzo, dati della casa, pre-computo, foto e planimetria,
   note vocali, dati del comune (Terranova, o a mano), domande all'agente nell'app, «Manda il preventivo al cliente».
   Si apre dalla pagina admin «Ristrutturazioni» (pulsante «Apri il dossier») o dal link della mail: dashboard/?dossier=<id>.
   Uso: AC.dossier(el, pratica, indietro). Con ?demo= mostra un bagno di esempio e non scrive nulla. */
(function () {
  "use strict";
  const AC = (window.AC = window.AC || {});
  const DEMO = /[?&]demo=/.test(location.search);
  const db = () => window.acDb;
  const reale = () => !DEMO && !!window.acDb;
  const Q = (p) => p.then((r) => { if (r && r.error) throw r.error; return r ? r.data : null; });

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, k) => (AC.ui && AC.ui.toast ? AC.ui.toast(m, k) : alert(m));
  const num = (v) => { const n = parseFloat(String(v == null ? "" : v).replace(/\s/g, "").replace(",", ".")); return isFinite(n) ? n : 0; };
  const dec = (n, d) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d });
  const eur = (n) => dec(n) + " €";
  const quando = (d) => (d ? new Date(d).toLocaleString("it-IT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "");
  const breve = (d) => (d ? new Date(d).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
  const PACC = { base: "Essenziale", medio: "Comfort", alto: "Prestige" };
  const ERR = {
    non_autorizzato: "Non puoi lavorare su questa pratica.", non_trovata: "Pratica non trovata.", pratica_chiusa: "La pratica è chiusa.",
    manca_invio_sopralluogo: "Prima l'agente deve mandare il sopralluogo al cliente (serve la sua mail).",
    computo_senza_prezzi: "Nel computo manca il prezzo al cliente: compilalo e salvalo.", errore_invio: "La mail non è partita. Riprova tra poco.",
  };
  const errore = (e) => { const m = (e && e.message) || String(e || ""); const k = Object.keys(ERR).find((x) => m.indexOf(x) >= 0); return k ? ERR[k] : m || "Errore"; };

  // Esempio per l'anteprima (?demo=): il bagno della simulazione.
  const IMG = "../img/sopralluogo-demo/";
  // La relazione (stessa grafica del cliente) sta in ../js/relazione.js e ../css/relazione.css: si caricano qui, una volta.
  let relazionePronta = null;
  function assicuraRelazione() {
    if (window.ACRelazione) return Promise.resolve();
    if (relazionePronta) return relazionePronta;
    if (!document.getElementById("rz-css")) { const l = document.createElement("link"); l.id = "rz-css"; l.rel = "stylesheet"; l.href = "../css/relazione.css?v=1"; document.head.appendChild(l); }
    relazionePronta = new Promise((ok) => { const sc = document.createElement("script"); sc.src = "../js/relazione.js?v=1"; sc.onload = ok; sc.onerror = ok; document.head.appendChild(sc); });
    return relazionePronta;
  }

  // Esempio di casa intera (ristrutturazione completa con giardino) per l'anteprima.
  function casaEsempio(r) {
    const E = window.ACRelazione.esempio(IMG);
    const media = E.foto.map((f) => ({ id: f.id, tipo: "foto", nota: f.nota, url: f.url, fonte: "agente", creato: new Date().toISOString() }))
      .concat([{ id: "v1", tipo: "video", nota: "Giro della casa", url: "", fonte: "agente" }, { id: "au1", tipo: "audio", nota: "", url: "", fonte: "agente" }, { id: "au2", tipo: "audio", nota: "", url: "", fonte: "agente" }])
      .concat(E.render.map((x) => ({ id: x.id, tipo: "foto", nota: x.nota, url: x.url, fonte: "ia", prima_id: x.prima_id })));
    return Object.assign({}, r, {
      descrizione: r.descrizione || "Ristrutturazione completa della casa con giardino",
      riepilogo: "Casa indipendente su due piani con giardino. Il cliente vuole rifare bagno e cucina, mettere in sicurezza il balcone, fare cappotto e infissi nuovi e sistemare il giardino. Prima la facciata.",
      nota_agente: "Il cliente abita in casa durante i lavori: va organizzato per zone. Budget indicativo 60 mila.",
      pacchetto: "medio", urgente: false, preventivo_entro: new Date(Date.now() + (3 * 24 + 5) * 3600e3).toISOString(), inviato_cliente_il: new Date(Date.now() - 6 * 3600e3).toISOString(),
      cliente_ok_il: new Date(Date.now() - 2 * 3600e3).toISOString(), aperto_cliente_il: new Date(Date.now() - 5 * 3600e3).toISOString(), agente: r.agente || "Mario Rossi",
      ambienti: E.ia.ambienti.filter((a) => !a.esterno && a.larg).map((a, i) => ({ id: "a" + (i + 1), nome: a.nome, larg: a.larg, lung: a.lung, alt: a.alt, note: "" })),
      immobile: { piano: "terra e primo", ascensore: "no", condominio: "no", anno: "1974", accesso: "Cancello carrabile e cortile: camion fino alla porta", parcheggio: "Nel cortile", tempi: "Finito entro l'estate" },
      criticita: "Crepe sotto il balcone. Lastre ondulate sul ricovero attrezzi: possibile amianto.",
      computo: [], media: media, ia: E.ia, relazione_pubblicata_il: null,
      messaggi: [{ id: "x1", mio: false, autore: r.agente || "Mario Rossi", testo: "Ho caricato anche il video del giro della casa: le misure del bagno sopra le dico a voce.", creato: new Date(Date.now() - 50 * 60e3).toISOString() }],
      territorio: { comune: r.comune, provincia: r.provincia, zona_sismica: "2", zona_climatica: "C", prezzario: "Campania 2026", omi_min: 1050, omi_max: 1400, vincoli: "Nessuno noto", fonte: "esempio" },
    });
  }

  function esempio(r) {
    if (window.ACRelazione && (r.id === "r9" || /complet|casa/i.test(r.descrizione || ""))) return casaEsempio(r);
    const tra = new Date(Date.now() + (43 * 60 + 42) * 60e3).toISOString();
    return Object.assign({
      riepilogo: "Bagno di 6 mq al primo piano, anni '80. Togliere la vasca, doccia filo pavimento, nuovi rivestimenti e sanitari sospesi. Finestra da tenere.",
      nota_agente: "Vuole togliere la vasca e mettere una doccia grande, filo pavimento. Tiene la finestra. Sanitari sospesi, mobile chiaro. Il bagno deve essere usabile entro Natale. Macchia di umidità sul soffitto: il vicino di sopra ha rifatto il suo bagno.",
      pacchetto: "medio", urgente: true, preventivo_entro: tra, inviato_cliente_il: new Date(Date.now() - 4 * 3600e3).toISOString(),
      cliente_ok_il: new Date(Date.now() - 3600e3).toISOString(), agente: r.agente || "Mario Rossi", tecnico: "",
      ambienti: [{ id: "a1", nome: "Bagno", larg: 2.4, lung: 2.5, alt: 2.7, h_riv: 2.2, porta: "80×210", finestra: "70×110", note: "vasca sul lato corto, attacchi a parete" }],
      immobile: { piano: "1", ascensore: "no", condominio: "sì", anno: "1984", accesso: "Scale strette, macerie a mano", parcheggio: "In strada, niente ZTL", tempi: "Finito entro il 20 dicembre" },
      criticita: "Umidità a soffitto: infiltrazione dal piano di sopra? Chiedere all'amministratore prima di tinteggiare.",
      computo: [
        { id: "c1", servizio: "demolizioni", voce: "Rimozione vasca, sanitari, rivestimenti e pavimento", qta: 1, um: "a corpo", prezzo: 950, costo: 600 },
        { id: "c2", servizio: "demolizioni", voce: "Trasporto e smaltimento macerie", qta: 1.5, um: "mc", prezzo: 180, costo: 110 },
        { id: "c3", servizio: "imp_idraulico", voce: "Impianto idrico di adduzione e scarico", qta: 5, um: "punti", prezzo: 220, costo: 140 },
        { id: "c4", servizio: "imp_elettrico", voce: "Messa a norma elettrico bagno", qta: 1, um: "a corpo", prezzo: 850, costo: 520 },
        { id: "c5", servizio: "murature", voce: "Massetto e impermeabilizzazione zona doccia", qta: 6, um: "mq", prezzo: 48, costo: 30 },
        { id: "c6", servizio: "pavimenti", voce: "Pavimento grès effetto pietra 60×60", qta: 6, um: "mq", prezzo: 78, costo: 50 },
        { id: "c7", servizio: "pavimenti", voce: "Rivestimento pareti h 2,20", qta: 18, um: "mq", prezzo: 72, costo: 46 },
        { id: "c8", servizio: "materiali", voce: "Piatto doccia filo pavimento 80×140 e cristallo", qta: 1, um: "cad", prezzo: 1150, costo: 780 },
        { id: "c9", servizio: "materiali", voce: "Vaso e bidet sospesi con telai", qta: 2, um: "cad", prezzo: 480, costo: 320 },
        { id: "c10", servizio: "materiali", voce: "Mobile sospeso 80 cm, lavabo, specchio con luce", qta: 1, um: "cad", prezzo: 890, costo: 600 },
        { id: "c11", servizio: "tinteggiatura", voce: "Tinteggiatura soffitto antimuffa", qta: 6, um: "mq", prezzo: null, costo: 8 },
      ],
      media: [
        { id: "m0", tipo: "foto", nota: "Planimetria", url: IMG + "prima.jpg" },
        { id: "m1", tipo: "foto", nota: "Bagno, vista dalla porta", url: IMG + "prima.jpg" },
        { id: "m2", tipo: "foto", nota: "Vasca e attacchi", url: IMG + "prima.jpg" },
        { id: "m3", tipo: "foto", nota: "Macchia di umidità a soffitto", url: IMG + "prima.jpg" },
        { id: "m4", tipo: "audio", nota: "", url: "" },
      ],
      messaggi: [
        { id: "x1", mio: true, autore: "Tu", testo: "Il contatore è nel bagno o fuori?", creato: new Date(Date.now() - 50 * 60e3).toISOString() },
        { id: "x2", mio: false, autore: r.agente || "Mario Rossi", testo: "Fuori, sul pianerottolo. Ti carico la foto.", creato: new Date(Date.now() - 45 * 60e3).toISOString() },
      ],
      ia: null,
      territorio: { comune: r.comune, provincia: r.provincia, zona_sismica: "2", zona_climatica: "C", prezzario: "Campania 2026", omi_min: 950, omi_max: 1250, vincoli: "Nessuno noto", fonte: "esempio" },
    }, Object.keys(r).reduce((o, k) => { const v = r[k]; if (v != null && v !== "" && !(Array.isArray(v) && !v.length) && !(typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length)) o[k] = v; return o; }, {}));
  }

  const casaDemo = (d) => d.id === "r9" || /complet|casa/i.test(d.descrizione || "");
  // Per la pratica del solo bagno l'esempio tiene il bagno e le parti generali.
  const soloBagno = (ia) => Object.assign({}, ia, { ambienti: ia.ambienti.filter((a) => a.categoria === "bagno"), sintesi: "Bagno al primo piano in stato da rifare: rivestimenti anni '80, vasca in muratura e una macchia d'infiltrazione a soffitto da capire prima dei lavori. Si propone il rifacimento completo con doccia filo pavimento, sanitari sospesi e nuovi impianti, in circa 3 settimane.",
    impianti: ia.impianti.filter((i) => i.tipo !== "gas"), sicurezza: [], energia: {}, fasi: [{ nome: "Demolizioni e impianti", settimane: 1, descrizione: "Rimozione, nuovi scarichi e linee" }, { nome: "Massetto e impermeabilizzazione", settimane: 1, descrizione: "Zona doccia a filo" }, { nome: "Rivestimenti e sanitari", settimane: 1, descrizione: "Posa e montaggio" }],
    durata_settimane: 3, voci: ia.voci.filter((v) => /bagno/i.test(v.ambiente)), foto: [], foto_id: [], documenti: ["Dichiarazione di conformità degli impianti", "Regolamento di condominio"] });
  function stile() {
    if (document.getElementById("dt-css")) return;
    const s = document.createElement("style");
    s.id = "dt-css";
    s.textContent = `
.dt{--dn:#16304d;--dn2:#2c4a6e;--da:#E56B10;--da2:#c45d0c;--dch:#fff1e4;--df:#f3f5f9;--dm:#66758a;--dl:#e3e8ef;--dv:#1f8a5b;--dr:#c0392b;color:#24384c}
.dt *{box-sizing:border-box}
.dt-bar{display:flex;gap:10px;align-items:center;margin:0 0 14px;flex-wrap:wrap}
.dt-bar button{border:0;border-radius:10px;padding:9px 14px;font-weight:700;background:#fff;color:var(--dn);box-shadow:0 1px 3px rgba(22,48,77,.12);cursor:pointer;font-family:inherit}
.dt-card{background:#fff;border-radius:18px;box-shadow:0 1px 2px rgba(22,48,77,.06),0 8px 24px rgba(22,48,77,.08);padding:20px;min-width:0}
.dt-card h2{margin:0 0 12px;font-size:16px;color:var(--dn)}
.dt-card h1{margin:6px 0 4px;font-size:24px;line-height:1.2;color:var(--dn)}
.dt-eti{font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--da2)}
.dt-testa{display:grid;grid-template-columns:1fr;gap:16px;margin-bottom:16px}
.dt-grid{display:grid;grid-template-columns:1fr;gap:16px}
.dt-col{display:flex;flex-direction:column;gap:16px;min-width:0}
.dt{container-type:inline-size}
@container (min-width:820px){.dt-testa{grid-template-columns:1fr 300px}.dt-grid{grid-template-columns:1.2fr 1fr}}
.dt-sub{color:var(--dm);font-size:14px;line-height:1.5}
.dt-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.dt-chip{padding:5px 11px;border-radius:999px;background:var(--df);font-size:12px;font-weight:700;color:var(--dn2)}
.dt-chip.ok{background:#e7edf5;color:var(--dn)}.dt-chip.ar{background:var(--dch);color:var(--da2)}
.dt-scad{color:#fff;background:linear-gradient(135deg,var(--dn),var(--dn2))}
.dt-scad.rosso{background:linear-gradient(135deg,#7a1f12,var(--dr))}.dt-scad.verde{background:linear-gradient(135deg,#0f2440,var(--dn2))}.dt-scad.grigio{background:linear-gradient(135deg,#55606e,#7b8794)}
.dt-scad .dt-eti{color:#ffd2ad}.dt-scad b.big{display:block;font-size:30px;margin:6px 0 2px;font-variant-numeric:tabular-nums}
.dt-scad p{margin:0;color:rgba(255,255,255,.85);font-size:13px}
.dt-scad .dt-barra{height:6px;background:rgba(255,255,255,.2);border-radius:6px;margin:14px 0;overflow:hidden}.dt-scad .dt-barra i{display:block;height:100%;background:#ffd2ad}
.dt-btn{display:inline-block;border:0;border-radius:12px;padding:11px 16px;font-weight:800;font-size:13px;font-family:inherit;cursor:pointer;text-decoration:none}
.dt-btn.p{background:var(--da2);color:#fff}.dt-btn.g{background:var(--df);color:var(--dn)}.dt-btn.w{background:#fff;color:var(--dn)}.dt-btn.t{background:rgba(255,255,255,.16);color:#fff}
.dt-btn:disabled{opacity:.6}
.dt table{width:100%;border-collapse:collapse;font-size:14px}
.dt td,.dt th{padding:8px;border-top:1px solid var(--dl);text-align:left;vertical-align:top}
.dt th{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--dm);border-top:0}
.dt td.n,.dt th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.dt td.n{font-weight:700;color:var(--dn)}
.dt tr.tot td{font-weight:800;color:var(--dn);border-top:2px solid var(--dn)}
.dt-ia{font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;background:#eef3fb;color:var(--dn2);margin-left:6px;vertical-align:2px}
.dt-amb{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;padding:10px 0;border-top:1px solid var(--dl)}.dt-amb:first-of-type{border-top:0;padding-top:0}
.dt-amb svg{flex:0 0 auto}.dt-amb table{flex:1;min-width:240px}
.dt-amb h3{margin:0 0 6px;font-size:15px;color:var(--dn);width:100%}
.dt-kv{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.dt-kv div{background:var(--df);border-radius:12px;padding:10px 12px}.dt-kv small{display:block;font-size:11px;color:var(--dm);font-weight:600}.dt-kv b{font-size:15px;color:var(--dn)}
.dt-src{font-size:12px;color:var(--dm);margin-top:10px}
.dt-foto{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}
.dt-foto button{border:0;padding:0;background:none;text-align:left;cursor:zoom-in;font-family:inherit}
.dt-foto img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;display:block;background:var(--dl)}
.dt-foto span{display:block;font-size:11px;color:var(--dm);margin-top:4px}
.dt-foto .pl img{outline:3px solid var(--da);outline-offset:-3px}
.dt-voce{background:var(--df);border-radius:12px;padding:12px;font-size:14px;line-height:1.55;margin-bottom:8px}
.dt-alert{display:flex;gap:10px;padding:10px 12px;border-radius:12px;background:#fff7e8;border:1px solid #f6dcae;font-size:13px;margin-top:8px;line-height:1.45}
.dt-alert.r{background:#fdeceb;border-color:#f3c1bc}
.dt-chat{display:flex;flex-direction:column;gap:8px;max-height:320px;overflow:auto}
.dt-msg{max-width:85%;padding:9px 12px;border-radius:14px;font-size:13px;line-height:1.45;white-space:pre-line}
.dt-msg.t{background:var(--df);align-self:flex-start}.dt-msg.a{background:var(--dn2);color:#fff;align-self:flex-end}
.dt-msg small{display:block;font-size:10px;opacity:.7;margin-top:3px}
.dt-scrivi{display:flex;gap:8px;margin-top:12px}.dt-scrivi input,.dt-card textarea,.dt-terr input{flex:1;border:1px solid var(--dl);border-radius:12px;padding:10px 12px;font:inherit;width:100%}
.dt-terr{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:10px}.dt-terr label{font-size:12px;color:var(--dm);font-weight:600}
.dt-lb{position:fixed;inset:0;z-index:80;background:rgba(10,20,34,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px}
.dt-lb img{max-width:100%;max-height:80vh;border-radius:10px}.dt-lb p{color:#fff;margin:12px 0 0}
.dt-lb button{position:absolute;top:14px;right:14px;width:42px;height:42px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;font-size:24px;cursor:pointer}
.dt-vuoto{color:var(--dm);font-size:14px;margin:0}
.dt-ia-card{margin-bottom:16px;background:linear-gradient(180deg,#fff,#fbfcfe);border:1px solid #e3e8ef}
.dt-ia-testa{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.dt-ia-azioni{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.dt-btn.n{background:var(--dn);color:#fff}
.dt-spin{flex:0 0 auto;width:26px;height:26px;border-radius:50%;border:3px solid var(--dl);border-top-color:var(--da);animation:dtgira .8s linear infinite}
@keyframes dtgira{to{transform:rotate(360deg)}}
.dt-rz{margin-bottom:16px}
@media print{
  body *{visibility:hidden!important}
  .dt,.dt *{visibility:visible!important}
  .dt{position:absolute;left:0;top:0;width:100%}
  .dt-bar,.dt-noprint,.dt-scrivi,.dt-scad .dt-btn{display:none!important}
  .dt-card{box-shadow:none;border:1px solid #ddd;break-inside:avoid}
  .dt-grid,.dt-testa{grid-template-columns:1fr!important}
  body.dt-stampa-rz .dt > *:not(.dt-rz){display:none!important}
}`;
    document.head.appendChild(s);
  }

  // Schizzo della stanza in scala, dalle misure.
  function schizzo(a) {
    const L = num(a.larg), P = num(a.lung);
    if (!L || !P) return "";
    const max = 150, k = max / Math.max(L, P), w = Math.max(40, L * k), h = Math.max(40, P * k), x = 22, y = 16;
    return '<svg width="' + (w + 50) + '" height="' + (h + 40) + '" viewBox="0 0 ' + (w + 50) + " " + (h + 40) + '" role="img" aria-label="Schizzo ' + esc(a.nome) + '">' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#f8fafc" stroke="#16304d" stroke-width="4"/>' +
      (a.finestra ? '<rect x="' + (x + w / 2 - 18) + '" y="' + (y - 4) + '" width="36" height="8" fill="#9ec5e8"/>' : "") +
      (a.porta ? '<path d="M' + x + " " + (y + h - 30) + " A30 30 0 0 1 " + (x + 30) + " " + (y + h) + '" fill="none" stroke="#E56B10" stroke-width="2"/>' : "") +
      '<text x="' + (x + w / 2) + '" y="' + (y + h + 18) + '" font-size="11" text-anchor="middle" fill="#16304d" font-weight="700">' + dec(L) + " m</text>" +
      '<text x="' + (x + w + 8) + '" y="' + (y + h / 2) + '" font-size="11" fill="#16304d" font-weight="700" transform="rotate(90 ' + (x + w + 8) + " " + (y + h / 2) + ')" text-anchor="middle">' + dec(P) + " m</text></svg>";
  }

  // Superfici: pavimento = L×P; pareti = perimetro × altezza rivestimento − porta (0,80 × altezza fino a 2,10).
  function superfici(a) {
    const L = num(a.larg), P = num(a.lung), H = num(a.alt), hr = num(a.h_riv) || H;
    const pav = L * P;
    const porta = /(\d+)\s*[×x]\s*(\d+)/.exec(a.porta || "");
    const pl = porta ? num(porta[1]) / 100 : 0.8, ph = porta ? num(porta[2]) / 100 : 2.1;
    const pareti = hr ? Math.max(0, 2 * (L + P) * hr - (a.porta ? pl * Math.min(ph, hr) : 0)) : 0;
    return { pav, pareti, vol: pav * H, hr };
  }

  function carica(base) {
    if (!reale()) return assicuraRelazione().then(() => esempio(base));
    return assicuraRelazione().then(() => Q(db().rpc("ristrutturazione_dossier", { p_id: base.id })).then((d) => {
      if (!d) throw new Error("non_autorizzato");
      const media = d.media || [];
      if (!media.length) return d;
      return Q(db().storage.from("sopralluoghi").createSignedUrls(media.map((m) => m.path), 3600)).then((u) => {
        const per = {}; (u || []).forEach((x) => { if (x && x.signedUrl) per[x.path] = x.signedUrl; });
        media.forEach((m) => { m.url = per[m.path] || ""; });
        return d;
      }, () => d);
    }));
  }

  AC.dossier = function (el, base, indietro) {
    stile();
    el.innerHTML = '<div class="card"><p class="note">Apro il dossier…</p></div>';
    carica(base).then((d) => disegna(el, d, base, indietro), (e) => {
      el.innerHTML = '<div class="dt"><div class="dt-bar"><button type="button" data-dt-indietro>← Torna alle pratiche</button></div><div class="dt-card"><h2>Il dossier non si apre</h2><p class="dt-vuoto">' +
        esc(/does not exist|schema cache|PGRST20/i.test(errore(e)) ? "Manca app-28 su Supabase: appena c'è, il dossier funziona da solo." : errore(e)) + "</p></div></div>";
      const b = el.querySelector("[data-dt-indietro]"); if (b) b.onclick = () => indietro && indietro();
    });
  };

  function disegna(el, d, base, indietro) {
    const comp = Array.isArray(d.computo) ? d.computo : [];
    const media = d.media || [];
    const foto = media.filter((m) => m.tipo === "foto" && m.fonte !== "ia");
    const renders = media.filter((m) => m.tipo === "foto" && m.fonte === "ia");
    const video = media.filter((m) => m.tipo === "video");
    const pianta = foto.filter((m) => /planimetri/i.test(m.nota || ""));
    const altre = foto.filter((m) => !/planimetri/i.test(m.nota || ""));
    const audio = media.filter((m) => m.tipo === "audio");
    const amb = Array.isArray(d.ambienti) ? d.ambienti : [];
    const imm = d.immobile || {};
    const ter = d.territorio;
    const totale = comp.reduce((t, x) => t + (num(x.prezzo) || 0) * (num(x.qta) || 1), 0);
    const senzaPrezzo = comp.filter((x) => x.prezzo == null || x.prezzo === "").length;
    const reg = ((AC.preventivi && AC.preventivi.PROVINCE) || []).find((p) => p[0] === d.provincia);

    // Scadenza
    let scad;
    if (d.preventivo_mandato_il) {
      scad = '<section class="dt-card dt-scad verde"><span class="dt-eti">Preventivo mandato</span><b class="big">' + eur((d.preventivo && d.preventivo.totale) || d.importo_cliente) + "</b><p>" +
        esc(quando(d.preventivo_mandato_il)) + (d.preventivo_accettato_il ? " · <b>accettato dal cliente il " + esc(breve(d.preventivo_accettato_il)) + "</b>" : " · in attesa del cliente") + "</p>";
    } else if (d.preventivo_entro) {
      const resto = new Date(d.preventivo_entro).getTime() - Date.now();
      const tot = (d.urgente ? 48 : 120) * 3600e3;
      scad = '<section class="dt-card dt-scad' + (d.urgente || resto < 24 * 3600e3 ? " rosso" : "") + '"><span class="dt-eti">' + (resto < 0 ? "Scaduto da" : "Preventivo da mandare entro") +
        '</span><b class="big" data-dt-conto>—</b><p>' + esc(quando(d.preventivo_entro)) + (d.urgente ? " · urgente" : "") + '</p><div class="dt-barra"><i style="width:' + Math.min(100, Math.max(3, (1 - resto / tot) * 100)) + '%"></i></div>';
    } else {
      scad = '<section class="dt-card dt-scad grigio"><span class="dt-eti">Scadenza</span><b class="big">—</b><p>Parte quando l\'agente manda il sopralluogo al cliente: 5 giorni, o 48 ore se urgente.</p><div class="dt-barra"><i style="width:0"></i></div>';
    }
    scad += '<button type="button" class="dt-btn w" data-dt-comp>Compila il computo</button> <button type="button" class="dt-btn t" data-dt-pdf>Scarica PDF</button></section>';

    const chips = [];
    if (d.urgente) chips.push('<span class="dt-chip ar">⚡ Urgente 48 ore</span>');
    if (PACC[d.pacchetto]) chips.push('<span class="dt-chip">Finitura scelta: ' + PACC[d.pacchetto] + "</span>");
    if (d.budget) chips.push('<span class="dt-chip">Budget cliente: ' + esc(d.budget) + "</span>");
    if (d.cliente_ok_il) chips.push('<span class="dt-chip ok">👍 Il cliente ha detto «Mi piace»</span>');
    if (d.aperto_cliente_il) chips.push('<span class="dt-chip ok">Il cliente ha aperto il sopralluogo</span>');
    chips.push('<span class="dt-chip">' + altre.length + " foto · " + audio.length + (audio.length === 1 ? " nota vocale · " : " note vocali · ") + (pianta.length ? "planimetria ✓" : "planimetria mancante") + "</span>");
    if (d.tecnico) chips.push('<span class="dt-chip">Tecnico: ' + esc(d.tecnico) + "</span>");

    const testa = '<section class="dt-card"><span class="dt-eti">Dossier per il preventivo · pratica ' + esc(String(d.id).slice(0, 8).toUpperCase()) + "</span>" +
      "<h1>" + esc(d.descrizione ? d.descrizione.split(/[.,]/)[0].slice(0, 60) : "Ristrutturazione") + " · " + esc(d.nome) + "</h1>" +
      '<div class="dt-sub">' + esc([d.indirizzo, d.comune, d.provincia ? "(" + d.provincia + ")" : ""].filter(Boolean).join(" ")) +
      (imm.piano ? " · piano " + esc(imm.piano) : "") + (imm.ascensore ? " · ascensore " + esc(imm.ascensore) : "") +
      (d.agente ? " · sopralluogo di " + esc(d.agente) : "") + (d.inviato_cliente_il ? ", " + esc(breve(d.inviato_cliente_il)) : "") + "</div>" +
      '<div class="dt-sub" style="margin-top:4px">' + esc([d.telefono, d.mail].filter(Boolean).join(" · ")) + "</div>" +
      '<div class="dt-chips">' + chips.join("") + "</div></section>";

    // Ambienti
    let ambH = "";
    let sp = { pav: 0, pareti: 0 };
    amb.forEach((a) => {
      const s = superfici(a); sp.pav += s.pav; sp.pareti += s.pareti;
      ambH += '<div class="dt-amb"><h3>' + esc(a.nome || "Ambiente") + "</h3>" + schizzo(a) + "<table><tr><th>Misura</th><th class=\"n\"></th></tr>" +
        "<tr><td>Pianta</td><td class=\"n\">" + dec(a.larg) + " × " + dec(a.lung) + " m</td></tr>" +
        (num(a.alt) ? "<tr><td>Altezza</td><td class=\"n\">" + dec(a.alt) + " m</td></tr>" : "") +
        "<tr><td>Pavimento</td><td class=\"n\">" + dec(s.pav) + " mq</td></tr>" +
        (s.pareti ? "<tr><td>Pareti h " + dec(s.hr) + " (meno porta)</td><td class=\"n\">" + dec(s.pareti, 1) + " mq</td></tr>" : "") +
        (a.porta || a.finestra ? "<tr><td>Porta / finestra</td><td class=\"n\">" + esc(a.porta || "—") + " · " + esc(a.finestra || "—") + "</td></tr>" : "") +
        (a.note ? '<tr><td colspan="2" style="color:#66758a">' + esc(a.note) + "</td></tr>" : "") + "</table></div>";
    });
    if (amb.length > 1) ambH += '<table><tr class="tot"><td>Totale ' + amb.length + " ambienti</td><td class=\"n\">pavimenti " + dec(sp.pav) + " mq · pareti " + dec(sp.pareti, 1) + " mq</td></tr></table>";
    const immK = [["Piano", imm.piano], ["Ascensore", imm.ascensore], ["Condominio", imm.condominio], ["Anno", imm.anno], ["Accesso", imm.accesso], ["Parcheggio", imm.parcheggio], ["Tempi del cliente", imm.tempi]].filter((x) => x[1]);
    const ambienti = '<section class="dt-card"><h2>Ambienti e misure</h2>' +
      (amb.length ? ambH + '<div class="dt-src">Misure prese dall\'agente in casa' + (pianta.length ? " · planimetria fotografata (bordo arancio nelle foto)" : "") + "</div>"
        : '<p class="dt-vuoto">L\'agente non ha ancora inserito le misure. Chiedile nella chat qui accanto.</p>') +
      (immK.length ? '<h2 style="margin-top:16px">La casa</h2><div class="dt-kv">' + immK.map((x) => "<div><small>" + x[0] + "</small><b>" + esc(x[1]) + "</b></div>").join("") + "</div>" : "") + "</section>";

    // Relazione di sopralluogo con l'IA (app-29): tutta la casa, interni ed esterni.
    const ia = d.ia;
    const fatto = ia && (ia.stato === "fatto" || (!ia.stato && ia.creato));
    const inCorso = ia && ia.stato === "in_corso";
    const materiale = foto.length + " foto · " + audio.length + " note vocali · " + video.length + " video";
    let iaTop = '<section class="dt-card dt-ia-card" data-dt-ia><div class="dt-ia-testa"><div><span class="dt-eti">Relazione di sopralluogo · intelligenza artificiale</span>' +
      "<h2 style=\"margin:6px 0 2px\">" + (fatto ? "Relazione pronta" : inCorso ? "L'IA sta leggendo il sopralluogo…" : "Prepara la relazione di tutta la casa") + "</h2>" +
      '<div class="dt-sub">' + (fatto ? "Letta il " + esc(breve(ia.creato)) + " · " + ((ia.letti && ia.letti.foto) || 0) + " foto, " + ((ia.letti && ia.letti.audio) || 0) + " audio, " + ((ia.letti && ia.letti.video) || 0) + " video" +
        (d.relazione_pubblicata_il ? " · <b style=\"color:#c45d0c\">pubblicata al cliente il " + esc(breve(d.relazione_pubblicata_il)) + "</b>" : " · il cliente non la vede ancora")
        : inCorso ? "Foto, planimetria, voce e video: ci vogliono 1-3 minuti. Puoi lavorare, la pagina si aggiorna da sola."
        : "Stanze, impianti, facciata, tetto, giardino: stato, criticità, priorità, fasi, documenti e simulazioni del dopo. Materiale: " + esc(materiale) + ".") + "</div></div>" +
      (inCorso ? '<span class="dt-spin"></span>' : "") + "</div>" +
      (ia && ia.stato === "errore" ? '<div class="dt-alert r">⚠️ <span>Lettura non riuscita: ' + esc(ia.errore || "") + "</span></div>" : "") +
      '<div class="dt-noprint dt-ia-azioni">' +
      (fatto ? (
        (ia.voci && ia.voci.length ? '<button type="button" class="dt-btn p" data-dt-ia-voci>Metti le ' + ia.voci.length + " voci nel computo</button>" : "") +
        (ia.ambienti && ia.ambienti.some((a) => a.larg && a.lung) && !amb.length ? '<button type="button" class="dt-btn g" data-dt-ia-amb>Usa le misure lette</button>' : "") +
        '<button type="button" class="dt-btn ' + (d.relazione_pubblicata_il ? "g" : "n") + '" data-dt-pubblica>' + (d.relazione_pubblicata_il ? "Ritira dal cliente" : "Pubblica la relazione al cliente") + "</button>" +
        '<button type="button" class="dt-btn g" data-dt-rz-pdf>Scarica la relazione (PDF)</button>' +
        '<button type="button" class="dt-btn g" data-dt-ia-via>Rileggi</button>')
      : inCorso ? "" : '<button type="button" class="dt-btn p" data-dt-ia-via' + (foto.length + audio.length + video.length ? "" : " disabled") + ">" + (foto.length + audio.length + video.length ? "✨ Prepara la relazione con l'IA" : "Servono foto, note vocali o un video") + "</button>") +
      "</div></section>";
    const iaH = "";

    // Pre-computo
    const computo = '<section class="dt-card" data-dt-computo><h2>Lavori: computo' + (comp.length ? ' <span class="dt-ia">' + (d.preventivo_mandato_il ? "mandato" : "da confermare") + "</span>" : "") + "</h2>" +
      (comp.length ? '<div style="overflow-x:auto"><table><tr><th>#</th><th>Voce</th><th class="n">Q.tà</th><th class="n">Prezzo €</th><th class="n">Totale €</th></tr>' +
        comp.map((x, i) => "<tr><td>" + (i + 1) + "</td><td>" + esc(x.voce) + '<br><small style="color:#66758a">' + esc(x.servizio || "") + '</small></td><td class="n">' + dec(x.qta || 1, x.qta % 1 ? 1 : 0) + " " + esc(x.um || "") +
          '</td><td class="n">' + (x.prezzo != null && x.prezzo !== "" ? dec(x.prezzo) : '<span style="color:#c0392b">manca</span>') + '</td><td class="n">' + (x.prezzo != null && x.prezzo !== "" ? dec(num(x.prezzo) * (num(x.qta) || 1)) : "—") + "</td></tr>").join("") +
        '<tr class="tot"><td></td><td>Totale al cliente (IVA esclusa)</td><td></td><td></td><td class="n">' + dec(totale) + "</td></tr></table></div>" +
        '<div class="dt-src">' + (senzaPrezzo ? "⚠️ " + senzaPrezzo + (senzaPrezzo === 1 ? " voce senza prezzo: non entra" : " voci senza prezzo: non entrano") + " nel preventivo. " : "") + "I prezzi dal prezzario " + esc((ter && ter.prezzario) || (reg ? reg[2] : "regionale")) + ". I costi restano interni (Profit Guard).</div>"
        : '<p class="dt-vuoto">Il computo è vuoto. Parti dalle misure: premi «Compila il computo».</p>') +
      '<div class="dt-noprint" style="margin-top:12px"><button type="button" class="dt-btn g" data-dt-comp>Compila il computo</button></div><div data-dt-compbox></div></section>';

    // Foto
    const fotoH = '<section class="dt-card"><h2>Foto del sopralluogo (' + foto.length + ")" + (renders.length ? ' <span class="dt-ia">+ ' + renders.length + " simulazioni</span>" : "") + "</h2>" +
      (video.length ? video.map((m, i) => '<div class="dt-voce">🎥 <b>Video ' + (i + 1) + "</b> " + esc(m.nota || "") + (m.url ? '<video controls preload="none" src="' + esc(m.url) + '" style="width:100%;margin-top:6px;border-radius:10px"></video>' : "") + "</div>").join("") : "") +
      (foto.length ? '<div class="dt-foto">' + pianta.concat(altre).map((m, i) => '<button type="button" class="' + (/planimetri/i.test(m.nota || "") ? "pl" : "") + '" data-dt-f="' + i + '">' +
        (m.url ? '<img loading="lazy" src="' + esc(m.url) + '" alt="">' : '<img alt="">') + "<span>" + (i + 1) + " · " + esc(m.nota || "Foto") + "</span></button>").join("") + "</div>"
        : '<p class="dt-vuoto">Nessuna foto. L\'agente le carica dal Sopralluogo Flash.</p>') +
      (audio.length ? '<h2 style="margin-top:16px">Note vocali (' + audio.length + ")</h2>" + audio.map((m, i) => '<div class="dt-voce">🎙 <b>Nota ' + (i + 1) + "</b> " + esc(breve(m.creato)) +
        (m.url ? '<br><audio controls preload="none" src="' + esc(m.url) + '" style="width:100%;margin-top:6px"></audio>' : "") + (m.nota ? "<br>" + esc(m.nota) : "") +
        (ia && ia.trascrizioni && ia.trascrizioni[i] ? '<br><span class="dt-ia">trascritta</span> «' + esc(ia.trascrizioni[i]) + "»" : "") + "</div>").join("") +
        (ia ? "" : '<div class="dt-src">Premi «Analizza con l\'IA» per la trascrizione.</div>') : "") + "</section>";

    // Territorio
    const terrH = '<section class="dt-card"><h2>Il territorio · ' + esc(d.comune || "") + (d.provincia ? " (" + esc(d.provincia) + ")" : "") + "</h2>" +
      (ter ? '<div class="dt-kv">' + [["Zona sismica", ter.zona_sismica], ["Zona climatica", ter.zona_climatica], ["Prezzario", ter.prezzario || (reg ? reg[2] : "")],
        ["Valore OMI", ter.omi_min || ter.omi_max ? dec(ter.omi_min, 0) + "–" + dec(ter.omi_max, 0) + " €/mq" : ""], ["Vincoli", ter.vincoli]].filter((x) => x[1]).map((x) => "<div><small>" + x[0] + "</small><b>" + esc(x[1]) + "</b></div>").join("") +
        '<div><small>Titolo edilizio</small><b>da verificare</b></div></div><div class="dt-src">Fonte: ' + esc(ter.fonte === "esempio" ? "valori di esempio" : ter.fonte || "Terranova") + (ter.aggiornato ? " · " + esc(breve(ter.aggiornato)) : "") + "</div>"
        : '<p class="dt-vuoto">Terranova non ha ancora i dati di questo comune.' + (reg ? " Prezzario: <b>" + esc(reg[2]) + "</b>." : "") + "</p>") +
      '<details class="dt-noprint" style="margin-top:10px"><summary style="cursor:pointer;font-size:13px;color:#2c4a6e;font-weight:700">' + (ter ? "Correggi i dati" : "Inseriscili a mano") + "</summary>" +
      '<form data-dt-terr><div class="dt-terr">' +
      [["zs", "Zona sismica", ter && ter.zona_sismica], ["zc", "Zona climatica", ter && ter.zona_climatica], ["pr", "Prezzario", (ter && ter.prezzario) || (reg ? reg[2] + " " + new Date().getFullYear() : "")],
        ["om", "OMI min €/mq", ter && ter.omi_min], ["ox", "OMI max €/mq", ter && ter.omi_max], ["vi", "Vincoli", ter && ter.vincoli]]
        .map((f) => "<label>" + f[1] + '<input name="' + f[0] + '" value="' + esc(f[2] == null ? "" : f[2]) + '"></label>').join("") +
      '</div><button class="dt-btn g" type="submit" style="margin-top:8px">Salva i dati del comune</button></form></details></section>';

    // Cosa ha detto il cliente
    const voce = '<section class="dt-card"><h2>Cosa ha detto il cliente</h2>' +
      (d.riepilogo ? '<div class="dt-voce"><b>Il progetto in breve</b> <span class="dt-ia">lo ha letto il cliente</span><br>' + esc(d.riepilogo) + "</div>" : "") +
      (d.nota_agente ? '<div class="dt-voce"><b>Note dell\'agente</b><br>' + esc(d.nota_agente) + "</div>" : "") +
      (d.descrizione && !d.riepilogo ? '<div class="dt-voce"><b>Richiesta del cliente</b><br>' + esc(d.descrizione) + "</div>" : "") +
      (d.criticita ? '<div class="dt-alert r">⚠️ <span><b>Da controllare:</b> ' + esc(d.criticita) + "</span></div>" : "") +
      (imm.accesso || imm.parcheggio ? '<div class="dt-alert">🚚 <span><b>Cantiere:</b> ' + esc([imm.piano ? "piano " + imm.piano : "", imm.ascensore ? "ascensore " + imm.ascensore : "", imm.accesso, imm.parcheggio].filter(Boolean).join(" · ")) + "</span></div>" : "") +
      (imm.tempi ? '<div class="dt-alert">📅 <span><b>Tempi:</b> ' + esc(imm.tempi) + "</span></div>" : "") +
      (!d.riepilogo && !d.nota_agente && !d.descrizione && !d.criticita ? '<p class="dt-vuoto">Nessuna nota.</p>' : "") + "</section>";

    // Chat
    const chat = '<section class="dt-card dt-noprint"><h2>Chiedi all\'agente · in app</h2><div class="dt-chat" data-dt-chat></div>' +
      '<form class="dt-scrivi" data-dt-scrivi><input name="t" maxlength="1000" placeholder="Scrivi a ' + esc((d.agente || "l'agente").split(" ")[0]) + '…" autocomplete="off"><button class="dt-btn p" type="submit">Manda</button></form></section>';

    // Fine
    const fine = '<section class="dt-card dt-noprint"><h2>Quando hai finito</h2>' +
      '<label style="font-size:13px;color:#66758a;font-weight:600">Nota per il cliente (facoltativa)<textarea data-dt-nota maxlength="1000" rows="2" placeholder="Validità 30 giorni. Inizio lavori in 3 settimane dalla firma."></textarea></label>' +
      '<p class="dt-sub" style="margin:8px 0">Totale al cliente: <b>' + eur(totale) + "</b> (IVA esclusa) · " + (comp.length - senzaPrezzo) + " voci</p>" +
      '<button type="button" class="dt-btn p" style="width:100%" data-dt-manda>' + (d.preventivo_mandato_il ? "Manda di nuovo il preventivo aggiornato" : "Manda il preventivo al cliente") + "</button>" +
      '<div class="dt-src">Il cliente lo trova nella pagina del suo sopralluogo e riceve una mail. L\'agente vede che è partito.</div></section>';

    el.innerHTML = '<div class="dt"><div class="dt-bar"><button type="button" data-dt-indietro>← Torna alle pratiche</button>' + "" + "</div>" +
      '<div class="dt-testa">' + testa + scad + "</div>" + iaTop + (fatto ? '<div class="dt-rz" data-dt-rz></div>' : "") +
      '<div class="dt-grid"><div class="dt-col">' + iaH + ambienti + computo + fotoH + '</div><div class="dt-col">' + terrH + voce + chat + fine + "</div></div></div>";

    const ricarica = () => AC.dossier(el, base, indietro);
    el.querySelector("[data-dt-indietro]").onclick = () => { if (indietro) indietro(); };
    el.querySelector("[data-dt-pdf]").onclick = () => window.print();

    // Conto alla rovescia
    const conto = el.querySelector("[data-dt-conto]");
    if (conto) {
      const tick = () => {
        if (!document.body.contains(conto)) return clearInterval(t);
        const r = Math.abs(new Date(d.preventivo_entro).getTime() - Date.now()), s = Math.floor(r / 1000);
        conto.textContent = Math.floor(s / 86400) + " g " + Math.floor(s % 86400 / 3600) + " h " + Math.floor(s % 3600 / 60) + " m";
      };
      const t = setInterval(tick, 30000); tick();
    }

    // Computo (stesso editor della pagina Ristrutturazioni)
    el.querySelectorAll("[data-dt-comp]").forEach((b) => b.addEventListener("click", () => {
      const box = el.querySelector("[data-dt-compbox]");
      el.querySelector("[data-dt-computo]").scrollIntoView({ behavior: "smooth", block: "start" });
      if (box.innerHTML) { box.innerHTML = ""; return; }
      if (AC.imprese && AC.imprese.computoBox) AC.imprese.computoBox(box, Object.assign({}, base, d, { computo: comp }), ricarica);
      else box.innerHTML = '<p class="dt-vuoto">Apri il computo dalla pagina Ristrutturazioni.</p>';
    }));

    // Foto grandi
    const tutte = pianta.concat(altre);
    el.querySelectorAll("[data-dt-f]").forEach((b) => b.addEventListener("click", () => {
      const m = tutte[+b.getAttribute("data-dt-f")]; if (!m || !m.url) return;
      const lb = document.createElement("div"); lb.className = "dt-lb";
      lb.innerHTML = '<button type="button" aria-label="Chiudi">×</button><img src="' + esc(m.url) + '" alt=""><p>' + esc(m.nota || "") + "</p>";
      lb.addEventListener("click", (e) => { if (e.target === lb || e.target.tagName === "BUTTON") lb.remove(); });
      document.body.appendChild(lb);
    }));

    // Territorio a mano
    const ft = el.querySelector("[data-dt-terr]");
    ft.addEventListener("submit", (e) => {
      e.preventDefault();
      const riga = { comune: d.comune, provincia: (d.provincia || "").toUpperCase(), zona_sismica: ft.zs.value.trim(), zona_climatica: ft.zc.value.trim().toUpperCase(), prezzario: ft.pr.value.trim(),
        omi_min: ft.om.value.trim() ? num(ft.om.value) : null, omi_max: ft.ox.value.trim() ? num(ft.ox.value) : null, vincoli: ft.vi.value.trim(), fonte: "admin", aggiornato: new Date().toISOString() };
      if (!riga.comune) return toast("La pratica non ha il comune.", "error");
      if (!reale()) { d.territorio = riga; toast("Anteprima: dati del comune salvati."); return disegna(el, d, base, indietro); }
      Q(db().from("comuni_dati").upsert(riga)).then(() => { toast("Dati del comune salvati."); ricarica(); }, (x) => toast("Non salvato: " + errore(x), "error"));
    });

    // Chat
    const chatEl = el.querySelector("[data-dt-chat]");
    const mostraChat = (l) => {
      chatEl.innerHTML = (l || []).length ? l.map((m) => '<div class="dt-msg ' + (m.mio ? "a" : "t") + '">' + esc(m.testo) + "<small>" + esc(m.mio ? "Tu" : m.autore) + " · " + esc(breve(m.creato)) + "</small></div>").join("")
        : '<p class="dt-vuoto">Nessun messaggio. Le domande all\'agente restano qui, nella pratica.</p>';
      chatEl.scrollTop = chatEl.scrollHeight;
    };
    mostraChat(d.messaggi);
    const fs = el.querySelector("[data-dt-scrivi]");
    fs.addEventListener("submit", (e) => {
      e.preventDefault();
      const t = fs.t.value.trim(); if (!t) return;
      fs.t.value = "";
      if (!reale()) { d.messaggi = (d.messaggi || []).concat({ mio: true, testo: t, creato: new Date().toISOString() }); return mostraChat(d.messaggi); }
      Q(db().rpc("ristrutturazione_messaggio", { p_id: d.id, p_testo: t })).then(() => Q(db().rpc("ristrutturazione_messaggi", { p_id: d.id }))).then((l) => { d.messaggi = l; mostraChat(l); },
        (x) => { fs.t.value = t; toast("Non mandato: " + errore(x), "error"); });
    });

    // Relazione IA: monta, analizza (in background con aggiornamento), crea il dopo, pubblica, voci, misure.
    const chiedi = (t) => { const i = el.querySelector("[data-dt-scrivi] input"); i.value = t; i.focus(); i.scrollIntoView({ block: "center" }); };
    const rzEl = el.querySelector("[data-dt-rz]");
    if (rzEl && window.ACRelazione) {
      const perId = {}; foto.forEach((m) => { perId[m.id] = m; });
      const ordine = (ia.foto_id && ia.foto_id.length ? ia.foto_id.map((id) => perId[id]).filter(Boolean) : pianta.concat(altre));
      window.ACRelazione.monta(rzEl, {
        ia: ia, foto: ordine.map((m) => ({ id: m.id, url: m.url, nota: m.nota })), render: renders.map((m) => ({ id: m.id, url: m.url, nota: m.nota, prima_id: m.prima_id })),
        testa: { nome: (d.descrizione ? d.descrizione.split(/[.,]/)[0].slice(0, 50) + " · " : "") + d.nome, indirizzo: [d.indirizzo, d.comune, d.provincia ? "(" + d.provincia + ")" : ""].filter(Boolean).join(" "),
          agente: d.agente, data: d.inviato_cliente_il ? new Date(d.inviato_cliente_il).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "", rif: String(d.id).slice(0, 8).toUpperCase() },
      }, {
        tecnico: true, logo: "../assets/logo/anchecasa-orizzontale-trasparente.png?v=3", onChiedi: chiedi,
        onRender: (mediaId, stile, b) => {
          b.disabled = true; b.textContent = "Disegno il dopo… (30-60 s)";
          if (!reale()) return setTimeout(() => { b.disabled = false; b.textContent = "✨ Crea il dopo"; toast("Anteprima: con la chiave Gemini qui compare la simulazione di questa foto."); }, 900);
          db().functions.invoke("dossier-ia", { body: { azione: "render", id: d.id, media_id: mediaId, stile: stile } }).then((res) => {
            if (res.error) { const c = res.error.context; return (c && typeof c.json === "function" ? c.json().catch(() => ({})) : Promise.resolve({})).then((x) => { throw new Error((x && x.errore) || "errore_ia"); }); }
            toast("Simulazione pronta."); ricarica();
          }).catch((x) => {
            b.disabled = false; b.textContent = "✨ Crea il dopo";
            const m = String((x && x.message) || x);
            toast({ troppi_render: "Hai già fatto molte simulazioni per questa pratica.", nessuna_immagine: "L'IA non ha restituito un'immagine: riprova con un altro stile.", motore_non_configurato: "Manca GEMINI_API_KEY su Supabase." }[m] || "Simulazione non riuscita: " + m, "error");
          });
        },
      });
    }
    const bpdf = el.querySelector("[data-dt-rz-pdf]");
    if (bpdf) bpdf.onclick = () => { document.body.classList.add("dt-stampa-rz"); setTimeout(() => { window.print(); document.body.classList.remove("dt-stampa-rz"); }, 50); };

    // Mentre l'IA lavora: controlla ogni 6 secondi (fino a 6 minuti).
    if (inCorso && reale()) {
      let giri = 0;
      const t = setInterval(() => {
        if (!document.body.contains(el.querySelector("[data-dt-ia]")) || ++giri > 60) return clearInterval(t);
        db().functions.invoke("dossier-ia", { body: { azione: "stato", id: d.id } }).then((res) => {
          const st = res && res.data && res.data.ia && res.data.ia.stato;
          if (st && st !== "in_corso") { clearInterval(t); toast(st === "fatto" ? "Relazione pronta." : "Lettura non riuscita.", st === "fatto" ? "" : "error"); ricarica(); }
        }).catch(() => {});
      }, 6000);
    }
    el.querySelectorAll("[data-dt-ia-via]").forEach((b) => b.addEventListener("click", () => {
      b.disabled = true; b.textContent = "Avvio la lettura…";
      if (!reale()) {
        d.ia = { stato: "in_corso", iniziato: new Date().toISOString() }; disegna(el, d, base, indietro);
        return setTimeout(() => { d.ia = window.ACRelazione.esempio(IMG).ia; if (!casaDemo(d)) d.ia = soloBagno(d.ia); toast("Anteprima: relazione di esempio."); disegna(el, d, base, indietro); }, 1600);
      }
      db().functions.invoke("dossier-ia", { body: { azione: "analizza", id: d.id } }).then((res) => {
        if (res.error) {
          const c = res.error.context;
          return (c && typeof c.json === "function" ? c.json().catch(() => ({})) : Promise.resolve({})).then((x) => { throw new Error((x && x.errore) || "errore_ia"); });
        }
        toast("Lettura avviata: ci vogliono 1-3 minuti."); ricarica();
      }).catch((x) => {
        const m = String((x && x.message) || x);
        const T = { aspetta_due_minuti: "Hai appena letto: riprova tra due minuti.", motore_non_configurato: "Manca la chiave GEMINI_API_KEY su Supabase.", chiave_o_richiesta_rifiutata: "Gemini ha rifiutato la richiesta: controlla la chiave." };
        b.disabled = false; b.textContent = "✨ Prepara la relazione con l'IA"; toast(T[m] || "Lettura non riuscita: " + m, "error");
      });
    }));
    const bp = el.querySelector("[data-dt-pubblica]");
    if (bp) bp.addEventListener("click", () => {
      const si = !d.relazione_pubblicata_il;
      if (si && bp.dataset.conferma !== "1") { bp.dataset.conferma = "1"; bp.textContent = "Confermi? Il cliente la vede nella sua pagina"; return; }
      if (!reale()) { d.relazione_pubblicata_il = si ? new Date().toISOString() : null; toast(si ? "Anteprima: relazione pubblicata al cliente." : "Anteprima: relazione ritirata."); return disegna(el, d, base, indietro); }
      Q(db().rpc("ristrutturazione_pubblica_relazione", { p_id: d.id, p_si: si })).then(() => { toast(si ? "Il cliente vede la relazione nella sua pagina." : "Relazione ritirata."); ricarica(); }, (x) => toast("Non riuscito: " + errore(x), "error"));
    });
    const bv = el.querySelector("[data-dt-ia-voci]");
    if (bv) bv.addEventListener("click", () => {
      const nuove = d.ia.voci.map((v, i) => ({ id: "ia" + (i + 1), servizio: v.servizio, voce: v.voce + (v.ambiente || v.stanza ? " (" + (v.ambiente || v.stanza) + ")" : ""), qta: v.qta, um: v.um, prezzo: null, costo: null }));
      const unite = comp.concat(nuove.filter((n) => !comp.some((c) => String(c.voce).toLowerCase() === String(n.voce).toLowerCase()))).map((x, i) => Object.assign({}, x, { id: "c" + (i + 1) }));
      if (!reale()) { d.computo = unite; toast("Anteprima: " + nuove.length + " voci nel computo. Ora metti i prezzi."); return disegna(el, d, base, indietro); }
      Q(db().rpc("ristrutturazione_computo", { p_id: d.id, p_computo: unite, p_sicurezza: d.sicurezza_perc || 0, p_spese: d.spese_perc || 0 }))
        .then(() => { toast("Voci nel computo: ora metti i prezzi."); ricarica(); }, (x) => toast("Non salvato: " + errore(x), "error"));
    });
    const ba = el.querySelector("[data-dt-ia-amb]");
    if (ba) ba.addEventListener("click", () => {
      const ambienti = d.ia.ambienti.filter((a) => a.larg && a.lung).map((a, i) => ({ id: "a" + (i + 1), nome: a.nome, larg: a.larg, lung: a.lung, alt: a.alt, h_riv: null, porta: a.porta || "", finestra: a.finestra || "", note: "letto dall'IA (" + (a.fonte_misure || a.fonte || "planimetria") + ")" }));
      if (!reale()) { d.ambienti = ambienti; return disegna(el, d, base, indietro); }
      Q(db().rpc("ristrutturazione_misure", { p_id: d.id, p_ambienti: ambienti, p_immobile: d.immobile || {}, p_criticita: d.criticita || "" }))
        .then(() => { toast("Misure salvate."); ricarica(); }, (x) => toast("Non salvate: " + errore(x), "error"));
    });

    // Manda il preventivo
    const bm = el.querySelector("[data-dt-manda]");
    bm.addEventListener("click", () => {
      if (!(comp.length - senzaPrezzo)) return toast(ERR.computo_senza_prezzi, "error");
      if (bm.dataset.conferma !== "1") { bm.dataset.conferma = "1"; bm.textContent = "Confermi? Parte la mail al cliente · " + eur(totale); return; }
      bm.disabled = true; bm.textContent = "Invio…";
      const nota = el.querySelector("[data-dt-nota]").value.trim();
      if (!reale()) {
        setTimeout(() => {
          Object.assign(d, { preventivo_mandato_il: new Date().toISOString(), preventivo: { totale: totale } });
          toast("Anteprima: il preventivo di " + eur(totale) + " partirebbe a " + (d.mail || "cliente") + ".");
          disegna(el, d, base, indietro);
        }, 500);
        return;
      }
      db().functions.invoke("sopralluogo-invito", { body: { azione: "preventivo", id: d.id, nota: nota } }).then((res) => {
        if (res.error) {
          const c = res.error.context;
          return (c && typeof c.json === "function" ? c.json().catch(() => ({})) : Promise.resolve({})).then((x) => { throw new Error((x && x.errore) || "errore_invio"); });
        }
        if (res.data && res.data.errore) throw new Error(res.data.errore);
        toast("Preventivo mandato a " + res.data.mail + " · " + eur(res.data.totale));
        ricarica();
      }).catch((x) => { bm.disabled = false; bm.dataset.conferma = ""; bm.textContent = "Manda il preventivo al cliente"; toast(errore(x), "error"); });
    });
  }
})();
