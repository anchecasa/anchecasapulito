/* Il tuo sopralluogo · pagina del cliente (12.10.2026, app-27).
   Si apre dal pulsante della mail «Guarda il tuo sopralluogo»: sopralluogo.html?t=<link segreto>.
   I dati arrivano dalla funzione Supabase «sopralluogo-invito» (azione "vedi"): foto firmate 1 ora, lavori senza prezzi.
   Anteprima senza database: sopralluogo.html?demo=1 */
(function () {
  "use strict";
  var FUNZIONE = "https://edsvmnxojsmknjuhobqa.supabase.co/functions/v1/sopralluogo-invito";
  var CHIAVE = "sb_publishable_QbYv61SkMkjA9_GGb1hhOA_6v6GEw87";
  var q = new URLSearchParams(location.search);
  var DEMO = q.has("demo");
  var T = q.get("t") || "";
  var main = document.getElementById("so");
  var PACC = {
    base: ["Essenziale", "Materiali solidi e puliti, tempi rapidi."],
    medio: ["Comfort", "Grès effetto pietra, doccia filo pavimento, mobile sospeso."],
    alto: ["Prestige", "Lastre grande formato, rubinetteria incasso, luce su misura."]
  };

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  };

  function chiama(azione) {
    return fetch(FUNZIONE, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: CHIAVE },
      body: JSON.stringify({ azione: azione, t: T })
    }).then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.errore || "errore"); return d; }); });
  }

  // Anteprima della relazione di tutta la casa: sopralluogo.html?demo=1&relazione=1
  function demoCasa() {
    var E = window.ACRelazione.esempio("img/sopralluogo-demo/");
    return Promise.resolve({
      nome: "Giovanni Esposito", comune: "Aversa", provincia: "CE", indirizzo: "Via Roma 1",
      riepilogo: "Casa indipendente su due piani con giardino: bagno e cucina da rifare, balcone da mettere in sicurezza, cappotto e infissi nuovi, giardino da sistemare.",
      pacchetto: "medio", urgente: false, preventivo_entro: new Date(Date.now() + (3 * 24 + 5) * 3600e3).toISOString(), inviato: new Date().toISOString(), stato: "preventivo", cliente_ok: false,
      foto: E.foto.map(function (f) { return { id: f.id, url: f.url, nota: f.nota, fonte: "agente" }; }).concat(E.render.map(function (x) { return { id: x.id, url: x.url, nota: x.nota, fonte: "ia", prima_id: x.prima_id }; })),
      voci: [], agente: { nome: "Mario Rossi", iniziali: "MR" }, relazione: Object.assign({}, E.ia, { pubblicata: new Date().toISOString() }), preventivo: null
    });
  }

  function demo() {
    if (q.has("relazione") && window.ACRelazione) return demoCasa();
    var tra = new Date(Date.now() + (3 * 24 + 7) * 3600e3 + 42 * 60e3);
    return Promise.resolve({
      nome: "Anna Bianchi", comune: "Teano", provincia: "CE", indirizzo: "Via Roma 12",
      riepilogo: "Bagno di 6 mq al primo piano, anni '80. Vuoi togliere la vasca e mettere una doccia filo pavimento, rifare rivestimenti e sanitari, tenere la finestra.\nImpianto idraulico da rifare, elettrico da mettere a norma nel bagno.",
      pacchetto: "medio", urgente: false, preventivo_entro: tra.toISOString(), inviato: new Date().toISOString(),
      stato: "preventivo", cliente_ok: false,
      foto: [
        { url: "img/sopralluogo-demo/prima.jpg", nota: "Il bagno oggi" },
        { url: "img/sopralluogo-demo/medio.jpg", nota: "Come potrebbe venire · Comfort" },
        { url: "img/sopralluogo-demo/base.jpg", nota: "Variante Essenziale" },
        { url: "img/sopralluogo-demo/alto.jpg", nota: "Variante Prestige" }
      ],
      voci: [
        { servizio: "Demolizioni", voce: "Rimozione vasca, sanitari e rivestimenti", qta: 1, um: "a corpo" },
        { servizio: "Impianti", voce: "Nuovo impianto idraulico di scarico e adduzione", qta: 1, um: "a corpo" },
        { servizio: "Impianti", voce: "Messa a norma impianto elettrico bagno", qta: 1, um: "a corpo" },
        { servizio: "Finiture", voce: "Pavimento in grès effetto pietra", qta: 6, um: "mq" },
        { servizio: "Finiture", voce: "Rivestimento pareti h 2,20", qta: 18, um: "mq" },
        { servizio: "Sanitari", voce: "Doccia filo pavimento con cristallo", qta: 1, um: "cad" },
        { servizio: "Sanitari", voce: "Mobile sospeso, lavabo e specchio", qta: 1, um: "cad" }
      ],
      agente: { nome: "Marco Rossi", iniziali: "MR" },
      preventivo: q.has("preventivo") ? { totale: 8222, nota: "Validità 30 giorni. Inizio lavori 3 settimane dopo la firma.", voci: [
        { voce: "Rimozione vasca, sanitari, rivestimenti e pavimento", qta: 1, um: "a corpo", prezzo: 950, totale: 950 },
        { voce: "Trasporto e smaltimento macerie", qta: 1.5, um: "mc", prezzo: 180, totale: 270 },
        { voce: "Impianto idrico di adduzione e scarico", qta: 5, um: "punti", prezzo: 220, totale: 1100 },
        { voce: "Messa a norma elettrico bagno", qta: 1, um: "a corpo", prezzo: 850, totale: 850 },
        { voce: "Massetto e impermeabilizzazione zona doccia", qta: 6, um: "mq", prezzo: 48, totale: 288 },
        { voce: "Pavimento grès effetto pietra 60×60", qta: 6, um: "mq", prezzo: 78, totale: 468 },
        { voce: "Rivestimento pareti h 2,20", qta: 18, um: "mq", prezzo: 72, totale: 1296 },
        { voce: "Piatto doccia filo pavimento 80×140 e cristallo", qta: 1, um: "cad", prezzo: 1150, totale: 1150 },
        { voce: "Vaso e bidet sospesi con telai", qta: 2, um: "cad", prezzo: 480, totale: 960 },
        { voce: "Mobile sospeso 80 cm, lavabo, specchio con luce", qta: 1, um: "cad", prezzo: 890, totale: 890 }] } : null,
      preventivo_il: new Date().toISOString(), preventivo_accettato: false
    });
  }

  function dueCifre(n) { return (n < 10 ? "0" : "") + n; }

  function disegna(d) {
    var nome = String(d.nome || "").split(" ")[0];
    var tutte = d.foto || [];
    var foto = tutte.filter(function (f) { return f.fonte !== "ia"; });
    var simulazioni = tutte.filter(function (f) { return f.fonte === "ia"; });
    var rel = d.relazione && window.ACRelazione ? d.relazione : null;
    var copertina = foto.length ? foto[0].url : "img/sopralluogo-demo/prima.jpg";
    var testo = d.riepilogo || d.descrizione || "";
    var p = PACC[d.pacchetto];
    var entro = new Date(d.preventivo_entro || Date.now());
    var oreTot = d.urgente ? 48 : 120;
    var h = "";

    h += '<section class="so-hero"><img src="' + esc(copertina) + '" alt="La tua casa">' +
      '<div class="so-hero-txt"><span class="so-tag"><i></i>Il tuo sopralluogo' + (d.comune ? " · " + esc(d.comune) : "") + "</span>" +
      "<h1>" + (nome ? esc(nome) + ", ecco" : "Ecco") + " la tua casa, come la stiamo pensando</h1>" +
      "<p>Foto, lavori e prossimi passi. Tutto quello che ci siamo detti, in un posto solo.</p>" +
      '<div class="so-agente"><div class="so-av">' + esc(d.agente.iniziali) + "</div><div><b>" + esc(d.agente.nome) + "</b><span>Il tuo consulente AncheCasa</span></div></div></div></section>";

    h += '<div class="so-corpo">';

    var pv = d.preventivo;
    var soldi = function (n) { return (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; };
    if (pv) {
      // app-28: il preventivo è arrivato. Al posto del conto alla rovescia, il totale e tutte le voci.
      h += '<section class="so-card so-conto so-appari" style="background:linear-gradient(135deg,#0f2440,#16304d 60%,#2c4a6e)"><p class="so-eti" style="color:#ffc9a0">Il tuo preventivo è pronto</p>' +
        '<h2 style="font-size:32px;margin:4px 0">' + soldi(pv.totale) + '</h2><p class="sub">IVA esclusa · ' + pv.voci.length + " voci · " + esc(new Date(d.preventivo_il).toLocaleDateString("it-IT", { day: "numeric", month: "long" })) + "</p></section>";
      h += '<section class="so-card so-appari"><p class="so-eti">Il preventivo</p><h2>Voce per voce</h2><p class="sub">Quantità prese in casa, prezzi del prezzario della tua regione.</p><ul class="so-voci">' +
        pv.voci.map(function (v, i) {
          return '<li><span class="so-n">' + (i + 1) + "</span><div><b>" + esc(v.voce) + "</b><small>" + esc(String(v.qta).replace(".", ",") + " " + (v.um || "") + " × " + soldi(v.prezzo)) + '</small></div><span class="so-q">' + soldi(v.totale) + "</span></li>";
        }).join("") +
        '<li style="border-top:2px solid #16304d"><span class="so-n" style="background:#16304d;color:#fff">€</span><div><b>Totale lavori</b><small>IVA esclusa</small></div><span class="so-q" style="font-size:16px">' + soldi(pv.totale) + "</span></li></ul>" +
        (pv.nota ? '<p class="so-riep" style="margin-top:12px;font-size:14px;color:#66758a">' + esc(pv.nota) + "</p>" : "") + "</section>";
    } else
    h += '<section class="so-card so-conto so-appari"><p class="so-eti" style="color:#ffd2ad">Preventivo dettagliato</p>' +
      "<h2>Arriva " + (d.urgente ? "entro 48 ore" : "entro 5 giorni") + (d.urgente ? '<span class="so-urg">Urgente</span>' : "") + "</h2>" +
      '<p class="sub">Con computo, impresa scelta e tempi. Pronto per ' + esc(entro.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })) + ".</p>" +
      '<div class="so-cifre"><div><b id="c-g">0</b><span>giorni</span></div><div><b id="c-h">00</b><span>ore</span></div><div><b id="c-m">00</b><span>minuti</span></div><div><b id="c-s">00</b><span>secondi</span></div></div>' +
      '<div class="so-barra"><i id="c-b" style="width:0"></i></div></section>';

    if (testo) {
      h += '<section class="so-card so-appari" style="animation-delay:.05s"><p class="so-eti">Cosa abbiamo visto</p><h2>Il tuo progetto in breve</h2>' +
        '<p class="so-riep">' + esc(testo) + "</p>" +
        (d.indirizzo || d.comune ? '<div class="so-luogo">📍 ' + esc([d.indirizzo, d.comune, d.provincia].filter(Boolean).join(", ")) + "</div>" : "") + "</section>";
    }

    if (rel) {
      // app-29: la relazione di sopralluogo (pubblicata dal tecnico) prende il posto di foto e lavori.
      h += '<section class="so-card so-appari" style="animation-delay:.05s"><p class="so-eti">La relazione del tuo sopralluogo</p><h2>Tutta la casa, ambiente per ambiente</h2>' +
        '<p class="sub">Stato, criticità, priorità, tempi e simulazioni del dopo. Preparata da AncheCasa e controllata dal tecnico.</p>' +
        '<button type="button" class="so-btn2" style="width:100%;border:0;cursor:pointer;font-family:inherit" data-rz-pdf>Scarica la relazione (PDF)</button></section>' +
        '<div id="so-rz"></div>';
    }
    if (!rel && foto.length) {
      h += '<section class="so-card so-appari" style="animation-delay:.1s"><p class="so-eti">Le foto</p><h2>' + foto.length + " foto" + ' del sopralluogo</h2><p class="sub">Tocca una foto per vederla grande.</p><div class="so-foto">' +
        foto.map(function (f, i) { return '<button type="button" data-f="' + i + '"><img loading="lazy" src="' + esc(f.url) + '" alt=""><span>' + esc(f.nota || "Foto " + (i + 1)) + "</span></button>"; }).join("") +
        "</div></section>";
    }

    if (!rel && !pv && d.voci && d.voci.length) {
      h += '<section class="so-card so-appari" style="animation-delay:.15s"><p class="so-eti">I lavori</p><h2>Cosa faremo</h2><p class="sub">Le quantità prese in casa. I prezzi arrivano nel preventivo dettagliato.</p><ul class="so-voci">' +
        d.voci.map(function (v, i) {
          var qta = v.qta != null && v.qta !== "" ? String(v.qta).replace(".", ",") + " " + (v.um || "") : "";
          return '<li><span class="so-n">' + (i + 1) + "</span><div><b>" + esc(v.voce) + "</b><small>" + esc(v.servizio) + "</small></div>" + (qta ? '<span class="so-q">' + esc(qta) + "</span>" : "") + "</li>";
        }).join("") + "</ul></section>";
    }

    if (p) {
      var img = DEMO ? { base: "img/sopralluogo-demo/base.jpg", medio: "img/sopralluogo-demo/medio.jpg", alto: "img/sopralluogo-demo/alto.jpg" } : {};
      h += '<section class="so-card so-appari" style="animation-delay:.2s"><p class="so-eti">Finiture</p><h2>Il livello che hai scelto</h2><p class="sub">Lo puoi cambiare quando vedi il preventivo.</p><div class="so-pacc">' +
        ["base", "medio", "alto"].map(function (k) {
          return '<div class="so-p' + (k === d.pacchetto ? " si" : "") + '">' + (img[k] ? '<img src="' + img[k] + '" alt="">' : "") +
            "<div><b>" + PACC[k][0] + "</b><small>" + PACC[k][1] + "</small></div>" + (k === d.pacchetto ? '<span class="ok">Scelto</span>' : "") + "</div>";
        }).join("") + "</div></section>";
    }

    h += '<section class="so-card so-appari" style="animation-delay:.25s"><p class="so-eti">Cosa succede adesso</p><h2>I prossimi passi</h2><ol class="so-passi">' +
      '<li class="fatto"><span class="so-pt">✓</span><div><b>Sopralluogo fatto</b><small>' + esc(d.agente.nome) + " è stato da te " + esc(new Date(d.inviato).toLocaleDateString("it-IT", { day: "numeric", month: "long" })) + ".</small></div></li>" +
      (pv ? '<li class="fatto"><span class="so-pt">✓</span><div><b>Preventivo pronto</b><small>Lo trovi qui sopra, voce per voce.</small></div></li>' +
        '<li class="' + (d.preventivo_accettato ? "fatto" : "ora") + '"><span class="so-pt">' + (d.preventivo_accettato ? "✓" : "3") + '</span><div><b>' + (d.preventivo_accettato ? "Preventivo accettato" : "Lo accetti e firmi") + '</b><small>Il contratto lo firmi dal telefono.</small></div></li>'
      : '<li class="ora"><span class="so-pt">2</span><div><b>Il tecnico prepara il preventivo</b><small>Computo metrico, prezzi del territorio, impresa abilitata.</small></div></li>' +
        '<li><span class="so-pt">3</span><div><b>Scegli e firmi</b><small>Lo vedi qui, con tutte le voci. Nessun impegno prima.</small></div></li>') +
      '<li><span class="so-pt">4</span><div><b>Si parte</b><small>Segui il cantiere dalla tua area privata.</small></div></li></ol></section>';

    h += '<section class="so-card so-appari" style="animation-delay:.3s"><div class="so-cons"><div class="so-av">' + esc(d.agente.iniziali) + "</div><div><b>" + esc(d.agente.nome) + "</b><small>Il tuo consulente. Scrivigli dalla tua area privata: tutto resta lì, in ordine.</small></div></div>" +
      '<a class="so-btn2" href="dashboard/#/privato/bacheca">Scrivi a ' + esc(d.agente.nome.split(" ")[0]) + "</a></section>";

    h += '<p class="so-piede">AncheCasa · Costruiamo fiducia<br>Domande? <a href="mailto:info@anchecasa.it">info@anchecasa.it</a></p></div>';
    var fatto = pv ? !!d.preventivo_accettato : !!d.cliente_ok;
    var testoFatto = pv ? "✓ Accettato: il tuo consulente ti scrive per il contratto" : "✓ Fatto: aspettiamo il preventivo";
    var testoBtn = pv ? "Accetto il preventivo" : "Mi piace, preparate il preventivo";
    h += '<div class="so-cta"><button type="button" id="so-ok"' + (fatto ? ' class="fatto" disabled' : "") + ">" + (fatto ? testoFatto : testoBtn) + "</button></div>";

    main.innerHTML = h;
    if (rel) {
      var perId = {}; foto.forEach(function (f) { perId[f.id] = f; });
      var ordine = rel.foto_id && rel.foto_id.length ? rel.foto_id.map(function (id) { return perId[id]; }).filter(Boolean) : foto;
      window.ACRelazione.monta(document.getElementById("so-rz"), {
        ia: rel, foto: ordine, render: simulazioni,
        testa: { nome: (nome ? nome + ", la tua casa" : "La tua casa") + (d.comune ? " · " + d.comune : ""), indirizzo: [d.indirizzo, d.comune].filter(Boolean).join(", "), agente: d.agente.nome,
          data: new Date(d.inviato).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) }
      }, { tecnico: false, logo: "assets/logo/anchecasa-orizzontale-trasparente.png?v=3" });
      main.querySelector("[data-rz-pdf]").addEventListener("click", function () { window.print(); });
    }

    // Conto alla rovescia
    var tot = oreTot * 3600e3;
    function tick() {
      var resto = Math.max(0, entro.getTime() - Date.now());
      var s = Math.floor(resto / 1000);
      document.getElementById("c-g").textContent = Math.floor(s / 86400);
      document.getElementById("c-h").textContent = dueCifre(Math.floor(s % 86400 / 3600));
      document.getElementById("c-m").textContent = dueCifre(Math.floor(s % 3600 / 60));
      document.getElementById("c-s").textContent = dueCifre(s % 60);
      document.getElementById("c-b").style.width = Math.min(100, Math.max(4, (1 - resto / tot) * 100)) + "%";
    }
    if (!pv) { tick(); setInterval(tick, 1000); }

    // Foto grandi
    var lb = document.getElementById("so-lb");
    main.querySelectorAll("[data-f]").forEach(function (b) {
      b.addEventListener("click", function () {
        var f = foto[+b.getAttribute("data-f")];
        document.getElementById("so-lb-img").src = f.url;
        document.getElementById("so-lb-nota").textContent = f.nota || "";
        lb.hidden = false;
      });
    });
    document.getElementById("so-lb-x").onclick = function () { lb.hidden = true; };
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.hidden = true; });

    // «Mi piace»
    var ok = document.getElementById("so-ok");
    ok.addEventListener("click", function () {
      if (ok.disabled) return;
      if (pv && ok.dataset.conferma !== "1") { ok.dataset.conferma = "1"; ok.textContent = "Confermi? Accetto il preventivo di " + soldi(pv.totale); return; }
      ok.disabled = true; ok.textContent = "Un attimo…";
      (DEMO ? Promise.resolve() : chiama(pv ? "accetta" : "ok")).then(function () {
        ok.className = "fatto"; ok.textContent = testoFatto;
      }).catch(function () {
        ok.disabled = false; ok.dataset.conferma = ""; ok.textContent = "Riprova: " + testoBtn;
      });
    });
  }

  function errore() {
    main.innerHTML = '<div class="so-errore"><h1>Link non valido</h1><p>Questo link non funziona più o è stato copiato male.<br>Entra nella tua <a href="index.html">area privata</a> oppure scrivi a <a href="mailto:info@anchecasa.it">info@anchecasa.it</a>.</p></div>';
  }

  if (!DEMO && !/^[0-9a-f-]{36}$/i.test(T)) return errore();
  (DEMO ? demo() : chiama("vedi")).then(function (d) {
    document.title = (d.nome ? String(d.nome).split(" ")[0] + ", il tuo sopralluogo" : "Il tuo sopralluogo") + " · AncheCasa";
    disegna(d);
  }).catch(errore);
})();
