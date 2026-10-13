/* Sopralluogo → cliente, SOLO per mail (12.10.2026, app-27). Decisioni di Nando:
   · l'invito parte in automatico per mail, mai WhatsApp; ogni comunicazione poi passa dall'area privata;
   · il cliente riceve la mail del marchio con la foto e «Guarda il tuo sopralluogo» → sceglie la password → vede la sua pagina;
   · preventivo dettagliato entro 5 giorni, 48 ore se l'agente segna «urgente». Lo prepara l'admin.
   Usata da imprese.js (pagina Sopralluoghi della rete): AC.sopralluogoInvio(box, pratica, ricarica).
   Con ?demo= non chiama nulla: mostra solo cosa succederebbe. */
(function () {
  "use strict";
  const AC = (window.AC = window.AC || {});
  const DEMO = /[?&]demo=/.test(location.search);
  const ERRORI = {
    serve_accesso: "Entra di nuovo nell'area privata.",
    non_trovata: "Pratica non trovata.",
    non_autorizzato: "Questa pratica non è tua.",
    pratica_chiusa: "La pratica è chiusa.",
    mail_non_valida: "Controlla la mail del cliente.",
    pacchetto_non_valido: "Scegli un livello di finitura.",
    errore_invio: "La mail non è partita. Riprova tra poco.",
  };
  const mailOk = (m) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m);
  const quando = (d) => new Date(d).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  AC.sopralluogoInvio = function (box, r, ricarica) {
    if (!box || !r) return;
    const esc = AC.ui.esc, toast = AC.ui.toast;
    const chiusa = r.stato === "chiusa" || r.stato === "persa";
    const stato = [];
    if (r.inviato_cliente_il) stato.push("✓ Mandato il " + quando(r.inviato_cliente_il));
    if (r.aperto_cliente_il) stato.push("👀 Aperto dal cliente il " + quando(r.aperto_cliente_il));
    if (r.cliente_ok_il) stato.push("👍 Il cliente ha detto «Mi piace» il " + quando(r.cliente_ok_il));
    if (r.preventivo_entro && !r.preventivo_mandato_il) stato.push((r.urgente ? "⚡ Urgente: " : "") + "preventivo entro il " + quando(r.preventivo_entro));
    if (r.preventivo_mandato_il) stato.push("📄 Preventivo mandato al cliente il " + quando(r.preventivo_mandato_il));
    if (r.preventivo_accettato_il) stato.push("✅ Preventivo accettato il " + quando(r.preventivo_accettato_il));

    box.innerHTML =
      '<div data-mis></div><div data-chat-tec></div>' +
      '<h3>Manda il sopralluogo al cliente</h3>' +
      '<p class="note">Parte una mail di AncheCasa con la prima foto e il pulsante «Guarda il tuo sopralluogo». Se il cliente non ha l\'account, sceglie la password e resta tuo cliente. Niente WhatsApp: da lì tutto passa dall\'area privata.</p>' +
      (stato.length ? '<p class="note"><b>' + stato.map(esc).join("<br>") + "</b></p>" : "") +
      (chiusa ? "" :
        '<form class="prefs wide en-grid" data-inv-form>' +
        '<label>Mail del cliente<input name="mail" type="email" inputmode="email" autocomplete="off" maxlength="160" required value="' + esc(r.mail || "") + '" placeholder="nome@mail.it"></label>' +
        '<label>Livello di finitura<select name="pacchetto">' +
        [["", "Da decidere"], ["base", "Essenziale"], ["medio", "Comfort"], ["alto", "Prestige"]].map((p) => '<option value="' + p[0] + '"' + ((r.pacchetto || "") === p[0] ? " selected" : "") + ">" + p[1] + "</option>").join("") +
        "</select></label>" +
        '<label class="span2">Il progetto in breve (lo legge il cliente)<textarea name="riepilogo" maxlength="1500" placeholder="Cosa abbiamo visto, cosa vuole cambiare, misure principali">' + esc(r.riepilogo || r.nota_agente || "") + "</textarea></label>" +
        '<label class="span2" style="display:flex;gap:10px;align-items:center"><input type="checkbox" name="urgente"' + (r.urgente ? " checked" : "") + ' style="width:auto"> Urgente: preventivo in 48 ore (altrimenti entro 5 giorni)</label>' +
        '<div class="row-actions span2"><button class="btn-in" type="submit">' + (r.inviato_cliente_il ? "Manda di nuovo per mail" : "Invia al cliente per mail") + "</button></div>" +
        "</form>");

    AC.sopralluogoMisure(box.querySelector("[data-mis]"), r, ricarica);
    AC.sopralluogoChat(box.querySelector("[data-chat-tec]"), r);
    const f = box.querySelector("[data-inv-form]");
    if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      const mail = f.mail.value.trim().toLowerCase();
      if (!mailOk(mail)) return toast("Scrivi la mail del cliente: l'invito parte solo per mail.", "error");
      const b = f.querySelector("button[type=submit]");
      const corpo = { azione: "invia", id: r.id, mail: mail, urgente: f.urgente.checked, riepilogo: f.riepilogo.value.trim(), pacchetto: f.pacchetto.value };
      b.disabled = true; b.textContent = "Invio…";

      if (DEMO || !window.acDb) {
        setTimeout(function () {
          Object.assign(r, { mail: mail, urgente: corpo.urgente, riepilogo: corpo.riepilogo, pacchetto: corpo.pacchetto,
            inviato_cliente_il: new Date().toISOString(), preventivo_entro: new Date(Date.now() + (corpo.urgente ? 48 : 120) * 3600e3).toISOString(),
            stato: ["nuova", "sopralluogo"].includes(r.stato) ? "preventivo" : r.stato });
          toast("Anteprima: la mail partirebbe a " + mail + ". Pagina cliente: sopralluogo.html?demo=1");
          AC.sopralluogoInvio(box, r, ricarica);
        }, 500);
        return;
      }

      window.acDb.functions.invoke("sopralluogo-invito", { body: corpo }).then(function (res) {
        let codice = res.error ? "errore_invio" : res.data && res.data.errore;
        if (res.error && res.error.context && typeof res.error.context.json === "function") {
          return res.error.context.json().then((d) => { throw new Error(ERRORI[d && d.errore] || ERRORI.errore_invio); }, () => { throw new Error(ERRORI.errore_invio); });
        }
        if (codice) throw new Error(ERRORI[codice] || ERRORI.errore_invio);
        toast("Mail mandata a " + res.data.mail + (res.data.urgente ? " · preventivo urgente in 48 ore." : " · preventivo entro 5 giorni."));
        if (typeof ricarica === "function") ricarica();
      }).catch(function (x) {
        b.disabled = false; b.textContent = "Invia al cliente per mail";
        toast((x && x.message) || ERRORI.errore_invio, "error");
      });
    });
  };

  /* app-28 · Misure e casa per il tecnico. L'agente scrive le misure di ogni stanza (metro laser o rotella),
     i dati della casa e le cose da controllare, e fotografa la planimetria. Tutto finisce nel dossier del tecnico. */
  const num = (v) => { const n = parseFloat(String(v == null ? "" : v).replace(/\s/g, "").replace(",", ".")); return isFinite(n) ? n : 0; };
  const dec = (n) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const reale = () => !DEMO && !!window.acDb;
  // Limite del bucket «sopralluoghi» su Supabase (12.10.2026: 50 MB). Se l'admin lo alza, basta cambiare questo numero.
  const MAX_MB = 50;
  const troppoGrande = (x) => /maximum allowed size|too large|413|Payload/i.test(String((x && (x.message || x.error || x.statusCode)) || x));
  const Q = (p) => p.then((x) => { if (x && x.error) throw x.error; return x ? x.data : null; });

  AC.sopralluogoMisure = function (box, r, ricarica) {
    if (!box || !r) return;
    const esc = AC.ui.esc, toast = AC.ui.toast;
    const amb = (Array.isArray(r.ambienti) && r.ambienti.length) ? r.ambienti.slice() : [{ nome: "" }];
    const imm = r.immobile || {};
    const pianta = (r.media || []).filter((m) => m.tipo === "foto" && /planimetri/i.test(m.nota || "")).length;
    const campo = (n, l, v, ph, w) => '<label style="min-width:' + (w || 90) + 'px;flex:1">' + l + '<input name="' + n + '" value="' + esc(v == null ? "" : String(v).replace(".", ",")) + '"' + (ph ? ' placeholder="' + ph + '"' : "") + (/^(larg|lung|alt|h_riv)$/.test(n) ? ' inputmode="decimal"' : "") + "></label>";
    const riga = (a, i) => '<div class="card" data-amb style="padding:12px;margin:8px 0;box-shadow:none;border:1px solid #e3e8ef">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">' + campo("nome", "Stanza", a.nome, "es. Bagno", 140) +
      campo("larg", "Larghezza m", a.larg, "2,40") + campo("lung", "Lunghezza m", a.lung, "2,50") + campo("alt", "Altezza m", a.alt, "2,70") + campo("h_riv", "Rivestimento h m", a.h_riv, "2,20") +
      campo("porta", "Porta cm", a.porta, "80×210") + campo("finestra", "Finestra cm", a.finestra, "70×110") +
      '<button type="button" class="btn-ghost" data-via title="Togli la stanza">✕</button></div>' +
      '<label style="display:block;margin-top:6px">Note<input name="note" value="' + esc(a.note || "") + '" placeholder="es. vasca sul lato corto, attacchi a parete"></label>' +
      '<small class="note" data-calc></small></div>';
    box.innerHTML = '<h3>Misure e casa · per il tecnico</h3>' +
      '<p class="note">Il tecnico fa il preventivo da qui, senza tornare dal cliente. Misura ogni stanza con il metro laser e fotografa la planimetria.</p>' +
      '<form data-mis-f class="prefs wide"><div data-amb-lista>' + amb.map(riga).join("") + "</div>" +
      '<div class="row-actions"><button type="button" class="btn-ghost" data-amb-piu>+ Aggiungi una stanza</button>' +
      '<label class="btn-ghost imp-file">📐 ' + (pianta ? "Planimetria ✓ (rifai)" : "Fotografa la planimetria") + '<input type="file" accept="image/*" capture="environment" data-pianta hidden></label>' +
      '<button type="button" class="btn-ghost" data-ia-leggi>🤖 Leggi tutto con l\'IA</button></div>' +
      '<p class="note">Dal telefono, un ambiente alla volta. Cinque foto è il massimo, non l\'obbligo: dalla porta tutta la stanza, la parete che non si vede, e il primo piano di ciò che non va. Se con tre si capisce, l\'agente registra l\'audio con le misure e chiude. Alla fine, «Finito sopralluogo» e un ultimo audio su gusti, stili e problemi. La planimetria si può fotografare anche da qui.</p>' +
      '<p class="note" data-ia-esito>' + (r.ia && r.ia.dubbi && r.ia.dubbi.length ? "L'IA chiede: " + r.ia.dubbi.map(esc).join(" · ") : "") + "</p>" +
      '<div class="en-grid">' +
      '<label>Piano<input name="piano" value="' + esc(imm.piano || "") + '" placeholder="es. 1"></label>' +
      '<label>Ascensore<select name="ascensore">' + ["", "sì", "no"].map((x) => '<option value="' + x + '"' + ((imm.ascensore || "") === x ? " selected" : "") + ">" + (x || "—") + "</option>").join("") + "</select></label>" +
      '<label>Condominio<select name="condominio">' + ["", "sì", "no"].map((x) => '<option value="' + x + '"' + ((imm.condominio || "") === x ? " selected" : "") + ">" + (x || "—") + "</option>").join("") + "</select></label>" +
      '<label>Anno della casa<input name="anno" inputmode="numeric" maxlength="4" value="' + esc(imm.anno || "") + '"></label>' +
      '<label class="span2">Accesso al cantiere<input name="accesso" maxlength="200" value="' + esc(imm.accesso || "") + '" placeholder="es. scale strette, macerie a mano"></label>' +
      '<label>Parcheggio<input name="parcheggio" maxlength="120" value="' + esc(imm.parcheggio || "") + '" placeholder="es. in strada, ZTL no"></label>' +
      '<label>Tempi del cliente<input name="tempi" maxlength="120" value="' + esc(imm.tempi || "") + '" placeholder="es. finito entro Natale"></label>' +
      '<label class="span2">Da controllare (umidità, crepe, impianti vecchi, amianto…)<textarea name="criticita" maxlength="1500">' + esc(r.criticita || "") + "</textarea></label></div>" +
      '<div class="row-actions"><button class="btn-in" type="submit">Salva misure e casa</button></div></form>';

    const f = box.querySelector("[data-mis-f]"), lista = f.querySelector("[data-amb-lista]");
    const calcola = () => lista.querySelectorAll("[data-amb]").forEach((d) => {
      const L = num(d.querySelector("[name=larg]").value), P = num(d.querySelector("[name=lung]").value), H = num(d.querySelector("[name=h_riv]").value) || num(d.querySelector("[name=alt]").value);
      d.querySelector("[data-calc]").textContent = L && P ? "Pavimento " + dec(L * P) + " mq" + (H ? " · pareti circa " + dec(Math.max(0, 2 * (L + P) * H - 0.8 * Math.min(2.1, H))) + " mq" : "") : "";
    });
    calcola();
    f.addEventListener("input", calcola);
    f.addEventListener("click", (e) => {
      if (e.target.matches("[data-amb-piu]")) { lista.insertAdjacentHTML("beforeend", riga({}, 0)); }
      if (e.target.matches("[data-via]") && lista.children.length > 1) { e.target.closest("[data-amb]").remove(); calcola(); }
    });
    const leggi = () => [...lista.querySelectorAll("[data-amb]")].map((d, i) => {
      const v = (n) => d.querySelector("[name=" + n + "]").value.trim();
      return { id: "a" + (i + 1), nome: v("nome"), larg: num(v("larg")) || null, lung: num(v("lung")) || null, alt: num(v("alt")) || null, h_riv: num(v("h_riv")) || null, porta: v("porta"), finestra: v("finestra"), note: v("note") };
    }).filter((a) => a.nome || a.larg || a.lung);
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const ambienti = leggi();
      const immobile = {}; ["piano", "ascensore", "condominio", "anno", "accesso", "parcheggio", "tempi"].forEach((k) => { const v = f[k].value.trim(); if (v) immobile[k] = v; });
      const criticita = f.criticita.value.trim();
      if (ambienti.some((a) => !a.nome)) return toast("Dai un nome a ogni stanza.", "error");
      if (!reale()) { Object.assign(r, { ambienti, immobile, criticita }); toast("Anteprima: misure salvate (" + ambienti.length + (ambienti.length === 1 ? " stanza)." : " stanze).")); return; }
      Q(window.acDb.rpc("ristrutturazione_misure", { p_id: r.id, p_ambienti: ambienti, p_immobile: immobile, p_criticita: criticita }))
        .then(() => { Object.assign(r, { ambienti, immobile, criticita }); toast("Misure salvate: il tecnico le vede nel dossier."); }, (x) => toast("Non salvate: " + ((x && x.message) || x), "error"));
    });
    // IA: legge solo le foto e la planimetria (e le note vocali). Il video resta allegato al dossier del tecnico.
    // Lavora in background: qui si aspetta (max 6 minuti) e poi si riempiono le stanze con le misure trovate.
    f.querySelector("[data-ia-leggi]").addEventListener("click", (e) => {
      const b = e.target; b.disabled = true; b.textContent = "L'IA sta leggendo… (1-3 minuti)";
      const rimetti = () => { b.disabled = false; b.textContent = "🤖 Leggi tutto con l'IA"; };
      const usa = (ia) => {
        r.ia = ia;
        const lette = (ia.ambienti || []).filter((a) => a.nome && !a.esterno && a.larg && a.lung);
        if (lette.length && !leggi().some((a) => a.larg)) {
          r.ambienti = lette.map((a, i) => ({ id: "a" + (i + 1), nome: a.nome, larg: a.larg, lung: a.lung, alt: a.alt, porta: a.porta || "", finestra: a.finestra || "", note: "letto dall'IA (" + (a.fonte_misure || "planimetria") + "): controlla" }));
          AC.sopralluogoMisure(box, r, ricarica);
          return toast(lette.length + " stanze con misure: controllale e premi «Salva». La relazione completa è nel dossier del tecnico.");
        }
        rimetti();
        const esito = box.querySelector("[data-ia-esito]");
        if (esito) esito.textContent = (ia.ambienti || []).length + " ambienti analizzati." + ((ia.dubbi || []).length ? " L'IA chiede: " + ia.dubbi.join(" · ") : "");
        toast("Lettura fatta: la relazione è nel dossier del tecnico.");
      };
      if (!reale()) return setTimeout(() => usa({ ambienti: [{ nome: "Bagno", larg: 2.4, lung: 2.5, alt: 2.7, porta: "80×210", finestra: "70×110", fonte_misure: "nota vocale" }], dubbi: ["Altezza del rivestimento?"] }), 900);
      const errore = (m) => { rimetti(); toast({ niente_da_leggere: "L'IA legge le foto. Serve almeno una foto di un ambiente.", motore_non_configurato: "Manca la chiave dell'IA: avvisa l'admin." }[m] || "Lettura non riuscita: " + m, "error"); };
      const aspetta = (giri) => setTimeout(() => {
        window.acDb.functions.invoke("dossier-ia", { body: { azione: "stato", id: r.id } }).then((res) => {
          const ia = res && res.data && res.data.ia;
          if (ia && ia.stato === "fatto") return usa(ia);
          if (ia && ia.stato === "errore") return errore(ia.errore || "errore");
          if (giri < 60) aspetta(giri + 1); else errore("ci mette troppo, riprova più tardi");
        }).catch(() => (giri < 60 ? aspetta(giri + 1) : errore("rete")));
      }, 6000);
      window.acDb.functions.invoke("dossier-ia", { body: { azione: "analizza", id: r.id } }).then((res) => {
        if (res.error) {
          const c = res.error.context;
          return (c && typeof c.json === "function" ? c.json().catch(() => ({})) : Promise.resolve({})).then((x) => { if (x && x.ia && x.ia.stato === "fatto") return usa(x.ia); throw new Error((x && x.errore) || "errore_lettura"); });
        }
        if (res.data && res.data.ia && res.data.ia.stato === "fatto") return usa(res.data.ia);
        aspetta(0);
      }).catch((x) => errore(String((x && x.message) || x)));
    });
    // Planimetria: è una foto della pratica con nota «Planimetria».
    f.querySelector("[data-pianta]").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0]; if (!file) return;
      if (file.size > MAX_MB * 1024 * 1024) return toast("Foto troppo grande (massimo " + MAX_MB + " MB).", "error");
      if (!reale()) { toast("Anteprima: planimetria caricata."); return; }
      const ext = ((file.name || "").split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
      const path = r.id + "/" + Date.now() + "-planimetria." + ext;
      toast("Carico la planimetria…");
      Q(window.acDb.storage.from("sopralluoghi").upload(path, file, { upsert: false, contentType: file.type || undefined }))
        .then(() => Q(window.acDb.rpc("ristrutturazione_media_aggiungi", { p_id: r.id, p_path: path, p_tipo: "foto", p_nota: "Planimetria" })))
        .then(() => { toast("Planimetria salvata."); if (typeof ricarica === "function") ricarica(); }, (x) => toast("Non caricata: " + ((x && x.message) || x), "error"));
    });
  };

  /* app-28 · Le domande del tecnico all'agente, nell'app (niente telefono, niente WhatsApp). */
  AC.sopralluogoChat = function (box, r) {
    if (!box || !r) return;
    const esc = AC.ui.esc, toast = AC.ui.toast;
    const mostra = (l) => {
      box.innerHTML = '<h3>Domande del tecnico</h3>' +
        ((l || []).length ? '<div class="en-lista">' + l.map((m) => '<div class="en-rrow"><div class="en-rinfo"><small>' + esc(m.mio ? "Tu" : m.autore) + " · " + esc(quando(m.creato)) + "</small><span>" + esc(m.testo) + "</span></div></div>").join("") + "</div>"
          : '<p class="note">Nessuna domanda. Se il tecnico ha bisogno di qualcosa, te lo scrive qui: rispondi da questa pagina.</p>') +
        '<form class="prefs wide" data-chat-f style="display:flex;gap:8px;align-items:flex-end"><label style="flex:1">Scrivi al tecnico<input name="t" maxlength="1000" autocomplete="off"></label><button class="btn-ghost" type="submit">Manda</button></form>';
      const f = box.querySelector("[data-chat-f]");
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const t = f.t.value.trim(); if (!t) return;
        if (!reale()) return mostra((l || []).concat({ mio: true, testo: t, creato: new Date().toISOString() }));
        Q(window.acDb.rpc("ristrutturazione_messaggio", { p_id: r.id, p_testo: t })).then(() => carica(), (x) => toast("Non mandato: " + ((x && x.message) || x), "error"));
      });
    };
    const carica = () => (reale() ? Q(window.acDb.rpc("ristrutturazione_messaggi", { p_id: r.id })).then(mostra, () => { box.innerHTML = ""; }) : mostra(r.messaggi || []));
    carica();
  };
})();
