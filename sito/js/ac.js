/* AncheCasa · comportamenti del nuovo sito (anteprima 08.10.2026) */
(function () {
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function slug(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function titolo(s) { return String(s).replace(/-/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }

  /* Menu telefono */
  var ham = $("#hamburger"), menu = $("#menu");
  if (ham && menu) ham.addEventListener("click", function () { var a = menu.classList.toggle("aperto"); ham.setAttribute("aria-expanded", a); });
  /* Tendine del menu: clic per aprire (telefono e tastiera), una sola aperta */
  $$(".menu .gruppo").forEach(function (g) {
    var b = $(".apri", g);
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      var aperto = !g.classList.contains("aperto");
      $$(".menu .gruppo.aperto").forEach(function (x) { x.classList.remove("aperto"); $(".apri", x).setAttribute("aria-expanded", "false"); });
      if (aperto) { g.classList.add("aperto"); b.setAttribute("aria-expanded", "true"); }
      if (!aperto) b.blur();
    });
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".menu")) $$(".menu .gruppo.aperto").forEach(function (x) { x.classList.remove("aperto"); $(".apri", x).setAttribute("aria-expanded", "false"); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") $$(".menu .gruppo.aperto").forEach(function (x) { x.classList.remove("aperto"); }); });

  /* Voci della ricerca: [testo, gruppo, pagina] */
  var MESTIERI = ["Idraulico", "Elettricista", "Imbianchino", "Muratore", "Fabbro", "Falegname", "Serramenti e infissi", "Climatizzazione", "Caldaia", "Antennista", "Giardiniere", "Pulizie", "Traslochi", "Vetraio", "Piastrellista", "Cartongessista"];
  var VOCI = [];
  MESTIERI.forEach(function (m) { VOCI.push([m, "Artigiano in zona", "trova.html#m=" + slug(m)]); });
  ["Perdita d'acqua", "Guasto elettrico", "Serratura bloccata", "Scarico intasato", "Caldaia in blocco"].forEach(function (m) { VOCI.push([m, "Urgente · video di 5 secondi", "trova.html#m=" + slug(m)]); });
  ["Ristrutturazione completa", "Rifare il bagno", "Rifare la cucina", "Facciata del condominio", "Tetto e coperture"].forEach(function (m) { VOCI.push([m, "Ristruttura con AncheCasa", "ristruttura.html"]); });
  ["Subappalto", "Fornitura materiali edili", "Noleggio mezzi", "Gara d'appalto", "Impresa edile", "Albo fornitori"].forEach(function (m) { VOCI.push([m, "Appalti e subappalti", "appalti.html"]); });
  (window.AC_APP || []).forEach(function (a) { VOCI.push(["App " + a.nome, "App per la tua attività", "app-" + a.id + ".html"]); });
  [["Casa in vendita", "vendita"], ["Vendo casa", "vendita"], ["Cerco casa", "vendita"], ["Casa in affitto", "affitto"], ["Affitto appartamento", "affitto"], ["Alloggio studenti", "studenti"], ["Stanza per studenti", "studenti"], ["Posto letto", "studenti"], ["Cerco lavoro", "lavoro"], ["Offro lavoro", "lavoro"]].forEach(function (m) { VOCI.push([m[0], "Bacheca annunci", "bacheca.html#" + m[1]]); });
  VOCI.push(["Centralino AncheVoice", "Servizi", "anchevoice.html"], ["Opportunità immobiliari", "Area riservata", "opportunita.html"], ["Diventare agente", "Lavora con noi", "agenti.html"], ["Diventare partner", "Lavora con noi", "partner.html"]);

  function trova(v) {
    v = slug(v); if (!v) return [];
    return VOCI.filter(function (x) { return slug(x[0]).indexOf(v) >= 0 || slug(x[1]).indexOf(v) >= 0; }).slice(0, 7);
  }
  var form = $("#cerca");
  if (form) {
    var q = $("#q", form), dove = $("#dove", form), sugg = $("#sugg", form);
    function conCitta(href) { var c = slug(dove.value); return c && href.indexOf("trova.html") === 0 ? href + "&c=" + c : href; }
    function mostra() {
      var r = trova(q.value);
      sugg.innerHTML = r.map(function (x) { return '<a href="' + conCitta(x[2]) + '"><span>' + esc(x[0]) + "</span><small>" + esc(x[1]) + "</small></a>"; }).join("");
      sugg.hidden = !r.length;
    }
    q.addEventListener("input", mostra); dove.addEventListener("input", function () { if (!sugg.hidden) mostra(); });
    document.addEventListener("click", function (e) { if (!form.contains(e.target)) sugg.hidden = true; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var r = trova(q.value), c = slug(dove.value);
      if (r.length) location.href = conCitta(r[0][2]);
      else if (q.value.trim()) location.href = "trova.html#m=" + slug(q.value) + (c ? "&c=" + c : "");
      else location.href = c ? "citta.html#" + c : "trova.html";
    });
    $$("[data-q]").forEach(function (b) { b.addEventListener("click", function () { q.value = b.getAttribute("data-q"); mostra(); q.focus(); }); });
  }

  /* Schede */
  $$("[data-schede]").forEach(function (box) {
    var btns = $$("[role=tab]", box), pann = $$("[role=tabpanel]", box.parentNode);
    function apri(id) {
      btns.forEach(function (b) { b.setAttribute("aria-selected", b.dataset.p === id); });
      pann.forEach(function (p) { p.hidden = p.id !== id; });
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { apri(b.dataset.p); history.replaceState(null, "", "#" + b.dataset.p); }); });
    var h = location.hash.slice(1).split("-")[0];
    apri(btns.some(function (b) { return b.dataset.p === h; }) ? h : btns[0].dataset.p);
  });

  /* Iscrizione azienda: tipo e piano precompilati dai prezzi (#azienda-impresa ecc.) */
  var tipo = $("#tipo-azienda");
  if (tipo) {
    var PIANI = { artigiano: ["Artigiano", "14,90 € al mese", "Iscriviti come artigiano"], impresa: ["Imprese", "49 € al mese, Ufficio compreso", "Iscrivi l'impresa"],
      fornitore: ["Fornitori", "99 € al mese", "Iscriviti come fornitore"], gc: ["General contractor", "Richiesta di iscrizione all'albo appalti", "Richiedi l'iscrizione"] };
    var mostraPiano = function () {
      var p = PIANI[tipo.value];
      $("#piano-nome").textContent = p ? p[0] : "Scegli chi sei";
      $("#piano-prezzo").textContent = p ? p[1] : "";
      $("#invia-azienda").textContent = p ? p[2] : "Iscrivi l'attività";
    };
    var pre = location.hash.slice(1).split("-")[1];
    if (pre && PIANI[pre]) tipo.value = pre;
    tipo.addEventListener("change", mostraPiano); mostraPiano();
  }

  /* Moduli: la richiesta va nella coda dell'amministrazione (marketplace.richieste_iscrizione),
     la stessa che usava il sito di prima. Se non parte, si apre la mail a info@anchecasa.it. */
  var SB = "https://edsvmnxojsmknjuhobqa.supabase.co", SBK = "sb_publishable_QbYv61SkMkjA9_GGb1hhOA_6v6GEw87";
  var ANTEPRIMA = !/(^|\.)anchecasa\.it$/.test(location.hostname);
  $$("form[data-invia]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var parti = f.getAttribute("data-invia").split("|"), dati = { modulo: parti[1], pagina: location.pathname };
      $$("input,select,textarea", f).forEach(function (c) {
        if (c.type === "checkbox" || c.type === "submit" || c.type === "hidden") return;
        var l = c.closest("label"), k = (l ? l.childNodes[0].textContent : c.name || c.id || "campo").trim();
        var v = c.type === "file" ? (c.files && c.files[0] ? c.files[0].name : "") : c.value;
        if (c.tagName === "SELECT" && c.selectedIndex >= 0) v = c.options[c.selectedIndex].text;
        if (v) dati[k] = String(v).slice(0, 2000);
        var std = c.type === "email" ? "email" : c.type === "tel" ? "telefono" : { name: "nome", "given-name": "nome", "family-name": "cognome", organization: "ragione" }[c.getAttribute("autocomplete")] || (/^(Regione|Zona|Città)/.test(k) ? "zona" : "");
        if (v && std && !dati[std]) dati[std] = String(v).slice(0, 300);
      });
      dati.at = new Date().toISOString();
      var btn = $("button[type=submit],button:not([type])", f); if (btn) btn.disabled = true;
      var fatto = function () { f.innerHTML = '<p class="esito">' + esc(f.getAttribute("data-ok")) + "</p>"; };
      var errore = function () {
        if (btn) btn.disabled = false;
        var testo = Object.keys(dati).map(function (k) { return k + ": " + dati[k]; }).join("\n");
        var a = "mailto:info@anchecasa.it?subject=" + encodeURIComponent("Richiesta dal sito: " + parti[1]) + "&body=" + encodeURIComponent(testo);
        var p = $(".esito-err", f) || f.appendChild(document.createElement("p")); p.className = "esito esito-err";
        p.innerHTML = 'La richiesta non è partita. <a href="' + a + '" style="text-decoration:underline">Mandala per mail</a> a info@anchecasa.it.';
      };
      if (ANTEPRIMA) { fatto(); return; }
      fetch(SB + "/rest/v1/richieste_iscrizione", { method: "POST",
        headers: { apikey: SBK, Authorization: "Bearer " + SBK, "Content-Type": "application/json", "Content-Profile": "marketplace", Prefer: "return=minimal" },
        body: JSON.stringify({ famiglia: parti[0], dati: dati }) })
        .then(function (r) { if (r.ok) fatto(); else errore(); }).catch(errore);
    });
  });

  /* Pagina città */
  var nc = $$(".nome-citta");
  if (nc.length) {
    var aggiorna = function () {
      var n = titolo(decodeURIComponent((location.hash || "#roma").slice(1)) || "roma");
      nc.forEach(function (e) { e.textContent = n; });
      document.title = "AncheCasa a " + n;
    };
    aggiorna(); window.addEventListener("hashchange", function () { aggiorna(); window.scrollTo(0, 0); });
  }

  /* SuperMastro: video di 5 secondi, problema, poi chi chiamare */
  var sm = $("#sm-rec");
  if (sm) {
    var PROBLEMI = [
      { id: "goccia", voce: "Rubinetto che gocciola", problema: "Il rubinetto perde a gocce. Di solito è la guarnizione o il rompigetto.", fai: true, consiglio: "Chiudi l'acqua sotto il lavandino, svita il rompigetto e puliscilo dal calcare. Se continua a gocciolare, chiama un idraulico.", mestiere: "idraulico", q: "idraulico", osm: ['["craft"="plumber"]'], nome: "idraulic" },
      { id: "scarico", voce: "Scarico lento", problema: "Lo scarico è intasato.", fai: true, consiglio: "Prova la ventosa e un po' di acqua calda. Non versare acidi. Se l'acqua torna su, chiama un idraulico.", mestiere: "idraulico", q: "idraulico", osm: ['["craft"="plumber"]'], nome: "idraulic" },
      { id: "tubo", voce: "Perdita da tubo o soffitto", problema: "C'è una perdita da un tubo o dal soffitto.", fai: false, consiglio: "Chiudi il rubinetto generale dell'acqua. Non usare prese vicine all'acqua. Serve un idraulico.", mestiere: "idraulico", q: "idraulico", osm: ['["craft"="plumber"]'], nome: "idraulic" },
      { id: "lampadina", voce: "Lampadina spenta", problema: "Non si accende la luce. Può essere solo la lampadina.", fai: true, consiglio: "Stacca la corrente di quella stanza, aspetta che sia fredda e cambiala con una uguale. Se la nuova non parte, chiama un elettricista.", mestiere: "elettricista", q: "elettricista", osm: ['["craft"="electrician"]'], nome: "elettricist" },
      { id: "salvavita", voce: "Salvavita scattato", problema: "È saltata la corrente dal salvavita.", fai: true, consiglio: "Stacca gli apparecchi e rialza l'interruttore una volta sola. Se scatta di nuovo, non aprirlo e chiama un elettricista.", mestiere: "elettricista", q: "elettricista", osm: ['["craft"="electrician"]'], nome: "elettricist" },
      { id: "presa", voce: "Presa bruciata o scintille", problema: "La presa è bruciata o fa scintille. Non toccarla.", fai: false, consiglio: "Non inserire spine e non aprire la presa. Serve un elettricista.", mestiere: "elettricista", q: "elettricista", osm: ['["craft"="electrician"]'], nome: "elettricist" },
      { id: "serratura", voce: "Serratura bloccata", problema: "La serratura non gira o la chiave non entra.", fai: false, consiglio: "Non forzare la serratura. Serve un fabbro.", mestiere: "fabbro", q: "fabbro", osm: ['["craft"="locksmith"]', '["shop"="locksmith"]'], nome: "fabbr" },
      { id: "caldaia", voce: "Caldaia in blocco", problema: "La caldaia è in blocco e non scalda.", fai: false, consiglio: "Non aprire la caldaia e non toccare il gas. Leggi il codice sul display e chiama un tecnico caldaie.", mestiere: "tecnico caldaie", q: "tecnico caldaie", osm: ['["craft"="heating_engineer"]', '["craft"="hvac"]'], nome: "caldai" },
      { id: "clima", voce: "Condizionatore fermo", problema: "Il condizionatore non parte o non raffredda.", fai: true, consiglio: "Controlla le pile del telecomando e se i filtri sono tappati. Se non riparte, chiama un tecnico dei condizionatori.", mestiere: "tecnico condizionatori", q: "tecnico condizionatori", osm: ['["craft"="hvac"]'], nome: "condizion" },
      { id: "infisso", voce: "Finestra o infisso", problema: "La finestra non chiude o l'infisso è rotto.", fai: false, consiglio: "Se il vetro è incrinato o l'anta non chiude, serve un serramentista.", mestiere: "serramentista", q: "serramentista", osm: ['["craft"="window_construction"]', '["craft"="glazier"]'], nome: "serrament" },
      { id: "muffa", voce: "Muffa o umidità", problema: "Ci sono macchie di muffa o il muro è umido.", fai: true, consiglio: "Se la macchia è piccola in un angolo, arieggia e asciuga. Se sale dal pavimento o il muro è bagnato, chiama un idraulico.", mestiere: "idraulico", q: "idraulico perdita", osm: ['["craft"="plumber"]'], nome: "idraulic" }
    ];
    var live = $("#sm-live"), clip = $("#sm-clip"), foto = $("#sm-foto"), conto = $("#sm-conto"), nota = $("#sm-nota"), file = $("#t-file");
    var stream = null, recorder = null, pezzi = [], orologio = null, scelto = null;
    function fermaCamera() {
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
    }
    function mostraClip(url, video) {
      live.hidden = true;
      if (video) { foto.hidden = true; clip.hidden = false; clip.src = url; clip.play && clip.play().catch(function () {}); }
      else { clip.hidden = true; foto.hidden = false; foto.src = url; }
      $("#sm-problema").hidden = false;
      $("#sm-problema").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function prontoVideo() {
      var mime = "";
      ["video/mp4", "video/webm;codecs=vp8", "video/webm"].forEach(function (t) {
        if (!mime && window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) mime = t;
      });
      var blob = new Blob(pezzi, { type: mime || (pezzi[0] && pezzi[0].type) || "video/webm" });
      mostraClip(URL.createObjectURL(blob), true);
      sm.disabled = false;
      sm.textContent = "Rifai il video";
      guarda(blob, true);
    }
    function attendi() {
      $("#sm-stato").hidden = false;
      $("#sm-stato").textContent = "SuperMastro sta guardando il video.";
      $("#sm-chiedi").hidden = true;
      $("#sm-scelte").hidden = true;
      $("#sm-detto").hidden = true;
      $("#sm-fai").hidden = true;
      $("#sm-chiama").hidden = true;
      $("#sm-lista-box").hidden = true;
    }
    function chiediATe() {
      $("#sm-stato").hidden = true;
      $("#sm-chiedi").hidden = false;
      $("#sm-scelte").hidden = false;
      nota.textContent = "Video pronto. Tocca quello che si vede.";
    }
    function quadri(video, tempi) {
      return new Promise(function (ok) {
        var frames = [], i = 0, c = document.createElement("canvas");
        function prossimo() {
          if (i >= tempi.length) { ok(frames); return; }
          video.currentTime = tempi[i];
        }
        video.onseeked = function () {
          var w = 480, h = Math.max(1, Math.round((video.videoHeight || 360) * (w / Math.max(video.videoWidth || 480, 1))));
          c.width = w; c.height = h;
          c.getContext("2d").drawImage(video, 0, 0, w, h);
          var data = c.toDataURL("image/jpeg", 0.62).split(",")[1];
          if (data) frames.push(data);
          i += 1;
          prossimo();
        };
        video.onerror = function () { ok(frames); };
        prossimo();
      });
    }
    function fotogrammiDaVideo(blob) {
      return new Promise(function (ok) {
        var v = document.createElement("video");
        var url = URL.createObjectURL(blob);
        v.muted = true;
        v.playsInline = true;
        v.preload = "auto";
        v.onloadeddata = function () {
          var dur = v.duration && isFinite(v.duration) && v.duration > 0 ? v.duration : 5;
          quadri(v, [dur * 0.25, dur * 0.55, dur * 0.8]).then(function (frames) {
            URL.revokeObjectURL(url);
            ok(frames);
          });
        };
        v.onerror = function () { URL.revokeObjectURL(url); ok([]); };
        v.src = url;
      });
    }
    function fotogrammiDaFoto(blob) {
      return new Promise(function (ok) {
        var img = new Image();
        var url = URL.createObjectURL(blob);
        img.onload = function () {
          var c = document.createElement("canvas"), w = 480, h = Math.max(1, Math.round(img.height * (w / Math.max(img.width, 1))));
          c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);
          ok([c.toDataURL("image/jpeg", 0.62).split(",")[1]]);
        };
        img.onerror = function () { URL.revokeObjectURL(url); ok([]); };
        img.src = url;
      });
    }
    function guarda(blob, eVideo) {
      attendi();
      nota.textContent = "SuperMastro sta guardando il video.";
      (eVideo ? fotogrammiDaVideo(blob) : fotogrammiDaFoto(blob)).then(function (frames) {
        if (!frames.length) { chiediATe(); return; }
        return fetch("/api/supermastro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fotogrammi: frames })
        }).then(function (r) {
          if (!r.ok) throw new Error("analisi");
          return r.json();
        }).then(function (d) {
          if (!d || !d.problema || !d.mestiere) throw new Error("analisi");
          var passi = (d.passi || []).filter(Boolean).join(" ");
          var avvisi = (d.avvertenze || []).filter(Boolean).join(" ");
          $("#sm-stato").hidden = true;
          detto({
            problema: d.problema,
            descrizione: d.descrizione || "",
            urgenza: d.urgenza || "",
            fai: d.fai_da_te === true,
            consiglio: d.fai_da_te === true ? (passi || d.descrizione || "") : (avvisi || ("Serve un " + d.mestiere + ".")),
            mestiere: d.mestiere,
            q: d.mestiere
          });
          nota.textContent = "SuperMastro ha visto il video.";
        });
      }).catch(function () { chiediATe(); });
    }
    function registra() {
      if (!navigator.mediaDevices || !window.MediaRecorder) { nota.textContent = "Su questo telefono usa «Carica un video»: si apre la fotocamera."; return; }
      sm.disabled = true;
      nota.textContent = "Consenti la fotocamera, poi tieni fermo il guasto.";
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false }).then(function (s) {
        stream = s;
        live.hidden = false;
        live.srcObject = s;
        live.play();
        pezzi = [];
        var mime = "";
        ["video/mp4", "video/webm;codecs=vp8", "video/webm"].forEach(function (t) {
          if (!mime && MediaRecorder.isTypeSupported(t)) mime = t;
        });
        recorder = mime ? new MediaRecorder(s, { mimeType: mime }) : new MediaRecorder(s);
        recorder.ondataavailable = function (e) { if (e.data && e.data.size) pezzi.push(e.data); };
        recorder.onstop = function () { fermaCamera(); prontoVideo(); };
        recorder.start();
        var n = 5;
        conto.hidden = false;
        conto.textContent = String(n);
        clearInterval(orologio);
        orologio = setInterval(function () {
          n -= 1;
          conto.textContent = String(Math.max(n, 0));
          if (n <= 0) { clearInterval(orologio); conto.hidden = true; if (recorder && recorder.state === "recording") recorder.stop(); }
        }, 1000);
      }).catch(function () {
        sm.disabled = false;
        nota.textContent = "Fotocamera non disponibile. Usa «Carica un video».";
      });
    }
    sm.addEventListener("click", registra);
    file.addEventListener("change", function () {
      var f = file.files && file.files[0]; if (!f) return;
      fermaCamera();
      conto.hidden = true;
      var eVideo = f.type.indexOf("video") === 0;
      mostraClip(URL.createObjectURL(f), eVideo);
      sm.textContent = "Rifai il video";
      guarda(f, eVideo);
    });
    var scelte = $("#sm-scelte");
    PROBLEMI.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = p.voce;
      b.addEventListener("click", function () { detto(p); });
      scelte.appendChild(b);
    });
    function detto(p) {
      scelto = p;
      if ($("#sm-stato")) $("#sm-stato").hidden = true;
      $$("#sm-scelte button").forEach(function (b) { b.classList.toggle("on", b.textContent === p.voce); });
      var box = $("#sm-detto");
      box.hidden = false;
      box.innerHTML = "<small>SuperMastro</small><strong>" + esc(p.problema) + "</strong>"
        + (p.descrizione ? "<small>" + esc(p.descrizione) + "</small>" : "")
        + "<small>" + (p.fai ? "Puoi provarci tu." : "Non farlo tu. Serve un " + esc(p.mestiere) + ".") + "</small>"
        + (p.urgenza ? "<small>Urgenza " + esc(p.urgenza) + ".</small>" : "");
      var fai = $("#sm-fai");
      fai.hidden = false;
      fai.textContent = p.consiglio;
      var az = $("#sm-chiama");
      az.hidden = false;
      az.innerHTML = "";
      var vai = document.createElement("button");
      vai.type = "button";
      vai.className = "btn";
      vai.textContent = p.fai ? "Chiama comunque un " + p.mestiere : "Cerca un " + p.mestiere + " vicino a me";
      vai.addEventListener("click", function () { cerca(p); });
      az.appendChild(vai);
      if (!p.fai) cerca(p);
    }
    function mapsUrl(q, pos) {
      if (pos) return "https://www.google.com/maps/search/" + encodeURIComponent(q) + "/@" + pos.lat + "," + pos.lng + ",14z";
      return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
    }
    function schedaMaps(nome, lat, lng) {
      return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(nome + " " + lat + "," + lng);
    }
    function km(a, b, c, d) {
      var R = 6371, p = Math.PI / 180, x = (c - a) * p, y = (d - b) * p;
      var h = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a * p) * Math.cos(c * p) * Math.sin(y / 2) * Math.sin(y / 2);
      return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
    }
    function telefono(tags) {
      var t = tags.phone || tags["contact:phone"] || tags["contact:mobile"] || "";
      return String(t).split(";")[0].trim();
    }
    function disegna(p, pos, lista) {
      var box = $("#sm-lista-box"), dove = $("#sm-dove"), el = $("#sm-lista"), link = $("#sm-maps");
      box.hidden = false;
      link.href = mapsUrl(p.q, pos);
      if (!lista.length) {
        dove.textContent = "Non ho numeri pubblicati qui vicino. Apri Google Maps: lì chiami " + p.mestiere + ".";
        el.innerHTML = "";
      } else {
        dove.textContent = "I più vicini. Chiama da qui, oppure apri la scheda su Google Maps.";
        el.innerHTML = lista.map(function (x) {
          var chiama = x.tel ? '<a class="btn" href="tel:' + esc(x.tel.replace(/\s/g, "")) + '">Chiama</a>' : "";
          var maps = '<a class="btn linea" target="_blank" rel="noopener" href="' + esc(x.maps) + '">' + (x.tel ? "Google Maps" : "Apri e chiama") + "</a>";
          return '<article class="sm-riga"><div><strong>' + esc(x.nome) + '</strong><small>' + esc(x.km) + '</small></div><div class="btns">' + chiama + maps + "</div></article>";
        }).join("");
      }
      box.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function daPunto(p, pos) {
      var d = 0.09;
      var view = (pos.lng - d) + "," + (pos.lat + d) + "," + (pos.lng + d) + "," + (pos.lat - d);
      var url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=12&extratags=1&bounded=1&viewbox=" + view + "&q=" + encodeURIComponent(p.q);
      var salta = { residential: 1, bus_stop: 1, platform: 1, street: 1, road: 1, highway: 1, suburb: 1, city: 1, administrative: 1, neighbourhood: 1, postcode: 1, house: 1 };
      $("#sm-dove").textContent = "Cerco un " + p.mestiere + " vicino a te.";
      fetch(url)
        .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function (arr) {
          var visti = {}, lista = [];
          (arr || []).forEach(function (e) {
            if (salta[e.type] || salta[e.class]) return;
            var nome = e.name || (e.display_name || "").split(",")[0];
            var lat = parseFloat(e.lat), lng = parseFloat(e.lon);
            if (!nome || isNaN(lat)) return;
            if (visti[nome]) return;
            visti[nome] = 1;
            var extra = e.extratags || {};
            var dist = km(pos.lat, pos.lng, lat, lng);
            lista.push({ nome: nome, tel: telefono(extra), km: dist < 1 ? Math.round(dist * 1000) + " m" : dist.toFixed(1).replace(".", ",") + " km", dist: dist, maps: schedaMaps(nome, lat, lng) });
          });
          lista.sort(function (a, b) { return a.dist - b.dist; });
          disegna(p, pos, lista.slice(0, 8));
        })
        .catch(function () { disegna(p, pos, []); });
    }
    function cerca(p) {
      var box = $("#sm-lista-box");
      box.hidden = false;
      $("#sm-maps").href = mapsUrl(p.q, null);
      $("#sm-dove").textContent = "Cerco dove sei, così l'elenco è vicino a te.";
      $("#sm-lista").innerHTML = "";
      if (!navigator.geolocation) { senzaPosizione(p); return; }
      navigator.geolocation.getCurrentPosition(function (g) {
        $("#sm-citta-box").hidden = true;
        daPunto(p, { lat: g.coords.latitude, lng: g.coords.longitude });
      }, function () { senzaPosizione(p); }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 });
    }
    function senzaPosizione(p) {
      $("#sm-citta-box").hidden = false;
      $("#sm-dove").textContent = "La posizione non è arrivata. Scrivi la città, oppure apri Google Maps.";
      $("#sm-maps").href = mapsUrl(p.q + " vicino a me", null);
      $("#sm-lista").innerHTML = "";
    }
    $("#sm-citta-cerca").addEventListener("click", function () {
      if (!scelto) return;
      var citta = $("#sm-citta").value.trim();
      if (!citta) { $("#sm-citta").focus(); return; }
      $("#sm-dove").textContent = "Cerco a " + citta + ".";
      $("#sm-maps").href = mapsUrl(scelto.q + " " + citta, null);
      fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=it&q=" + encodeURIComponent(citta))
        .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function (arr) {
          if (!arr || !arr[0]) throw new Error();
          daPunto(scelto, { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) });
        })
        .catch(function () {
          $("#sm-dove").textContent = "Non ho fissato il punto sulla mappa. Apri Google Maps e cerca un " + scelto.mestiere + " a " + citta + ".";
          $("#sm-lista").innerHTML = "";
        });
    });
  }
})();
