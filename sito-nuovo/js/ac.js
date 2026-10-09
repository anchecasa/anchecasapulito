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

  /* Trova artigiano: video o foto → diagnosi → artigiani in zona */
  var tr = $("#trova");
  if (tr) {
    var stato = { m: "", c: "", file: null };
    location.hash.slice(1).split("&").forEach(function (kv) { var p = kv.split("="); if (p[0] === "m") stato.m = p[1]; if (p[0] === "c") stato.c = p[1]; });
    var inCitta = $("#t-citta"), mest = $("#t-mestiere"), file = $("#t-file"), prev = $("#t-anteprima");
    MESTIERI.forEach(function (m) { var o = document.createElement("option"); o.value = slug(m); o.textContent = m; mest.appendChild(o); });
    if (stato.m) {
      var trovato = MESTIERI.filter(function (m) { return slug(m) === stato.m; })[0];
      if (!trovato) { var o = document.createElement("option"); o.value = stato.m; o.textContent = titolo(stato.m); mest.appendChild(o); }
      mest.value = stato.m;
    }
    if (stato.c) inCitta.value = titolo(stato.c);
    file.addEventListener("change", function () {
      var f = file.files && file.files[0]; if (!f) return;
      var url = URL.createObjectURL(f);
      prev.innerHTML = f.type.indexOf("video") === 0 ? '<video class="anteprima-media" src="' + url + '" controls muted playsinline></video>' : '<img class="anteprima-media" src="' + url + '" alt="Il guasto">';
      $("#t-file-nome").textContent = f.name;
      if (!mest.value) mest.value = "idraulico";
      mostraDiagnosi();
    });
    function mostraDiagnosi() {
      $("#t-diagnosi").hidden = false;
      $("#t-diag-mestiere").textContent = mest.options[mest.selectedIndex] ? mest.options[mest.selectedIndex].text : "Da scegliere";
    }
    mest.addEventListener("change", mostraDiagnosi);
    if (stato.m) mostraDiagnosi();
    $("#t-geo").addEventListener("click", function () {
      var b = this;
      if (!navigator.geolocation) { b.textContent = "Posizione non disponibile: scrivi la città"; return; }
      navigator.geolocation.getCurrentPosition(function () { inCitta.value = "La mia posizione"; }, function () { b.textContent = "Posizione non concessa: scrivi la città"; });
    });
    $("#t-cerca").addEventListener("click", function () {
      if (!inCitta.value.trim()) { inCitta.focus(); inCitta.reportValidity && inCitta.setCustomValidity("Scrivi la città o il CAP"); inCitta.reportValidity(); inCitta.setCustomValidity(""); return; }
      var m = mest.options[mest.selectedIndex] ? mest.options[mest.selectedIndex].text : "Artigiano";
      $$(".t-m").forEach(function (e) { e.textContent = m.toLowerCase(); });
      $$(".t-c").forEach(function (e) { e.textContent = inCitta.value.trim(); });
      $("#t-risultati").hidden = false;
      $("#t-risultati").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
})();
