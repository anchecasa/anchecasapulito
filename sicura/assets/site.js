(function () {
  /* CONGELATO 23.09.2026. Apertura dall'alto.
     Ogni pagina di AncheSicura parte da scroll 0, anche con un hash in mezzo.
     Il clic, il tasto o la rotella sulla pagina già aperta sbloccano lo scorrimento.
     Non togliere arrivo, inCima, libera. */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  var aperto = true;
  function inCima() {
    if (aperto && window.scrollY !== 0) window.scrollTo(0, 0);
  }
  function libera() { aperto = false; }
  window.addEventListener("scroll", inCima, { passive: true });
  window.addEventListener("pointerdown", libera, { capture: true });
  window.addEventListener("keydown", libera);
  window.addEventListener("wheel", libera, { passive: true });
  function arrivo() {
    aperto = true;
    inCima();
  }
  arrivo();
  window.addEventListener("pageshow", arrivo);

  var pagina = (location.pathname.split("/").pop() || "index.html").split("?")[0];
  if (!pagina) pagina = "index.html";
  if (pagina === "servizi.html") pagina = "corsi.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var href = (a.getAttribute("href") || "").split("?")[0];
    a.classList.toggle("active", href === pagina);
  });

  var locale = location.hostname === "127.0.0.1" || location.hostname === "localhost";

  var navBar = document.querySelector(".site-header .nav");
  var burger = document.getElementById("burger");
  if (navBar && burger && !document.getElementById("profilo-btn")) {
    var profilo = document.createElement("div");
    profilo.className = "profilo";
    profilo.innerHTML =
      '<button class="profilo-btn" id="profilo-btn" type="button" aria-label="Profilo" aria-expanded="false" aria-controls="profilo-menu">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">' +
      '<circle cx="12" cy="8" r="3.2" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M5.5 19.2c1.2-3.2 3.5-4.7 6.5-4.7s5.3 1.5 6.5 4.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
      "</svg></button>" +
      '<div class="profilo-menu" id="profilo-menu" hidden>' +
      '<a href="https://anchecasa.it/login">Accedi</a>' +
      '<a href="https://anchecasa.it/login">Iscriviti</a>' +
      "</div>";
    var tools = document.createElement("div");
    tools.className = "nav-tools";
    navBar.insertBefore(tools, burger);
    tools.appendChild(profilo);
    tools.appendChild(burger);
    var profiloBtn = document.getElementById("profilo-btn");
    var profiloMenu = document.getElementById("profilo-menu");
    profiloBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = profiloMenu.hidden;
      profiloMenu.hidden = !open;
      profiloBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function () {
      profiloMenu.hidden = true;
      profiloBtn.setAttribute("aria-expanded", "false");
    });
    profiloMenu.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  var menu = document.getElementById("menu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      menu.classList.toggle("open");
    });
  }

  function wireForm(id, noteId, mailAddress, subjectText) {
    var form = document.getElementById(id);
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var lines = [];
      data.forEach(function (value, key) {
        lines.push(key + ": " + value);
      });
      var body = encodeURIComponent(lines.join("\n"));
      var subject = encodeURIComponent(subjectText || "AncheSicura — richiesta");
      if (mailAddress) {
        window.location.href = "mailto:" + mailAddress + "?subject=" + subject + "&body=" + body;
      }
      var note = document.getElementById(noteId);
      if (note) note.style.display = "block";
    });
  }

  wireForm(
    "quote-form",
    "quote-ok",
    "rete@anchecasa.it",
    "Anche Casa — richiesta offerta rapida / urgenza"
  );
  wireForm(
    "contact-form",
    "contact-ok",
    "rete@anchecasa.it",
    "AncheSicura — richiesta offerta"
  );

  var topBtn = document.createElement("button");
  topBtn.type = "button";
  topBtn.className = "back-top";
  topBtn.setAttribute("aria-label", "Torna su");
  topBtn.innerHTML = '<span aria-hidden="true">↑</span>';
  document.body.appendChild(topBtn);

  function syncTopBtn() {
    topBtn.classList.toggle("show", window.scrollY > 420);
  }
  window.addEventListener("scroll", syncTopBtn, { passive: true });
  syncTopBtn();

  topBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* Footer come AncheCasa: logo, note legali, copyright, poi le pagine di AncheSicura. */
  var footMount = document.getElementById("ac-footer");
  if (footMount) {
    var root = "https://anchecasa.it/";
    function voce(href, label) {
      return '<a href="' + root + href + '">' + label + "</a>";
    }
    footMount.outerHTML =
      '<footer class="ac-foot"><div class="wrap"><div class="ac-foot-grid">' +
      '<div class="ac-foot-brand"><a class="brand" href="https://www.anchecasa.it/" aria-label="AncheCasa, vai alla home">' +
      '<img src="assets/anchecasa-orizzontale.png?v=2" alt="AncheCasa"></a>' +
      '<nav class="ac-foot-legal" aria-label="Informazioni legali">' +
      voce("privacy", "Privacy") +
      voce("note-legali", "Note legali") +
      voce("cookie", "Cookie") +
      voce("gestione", "Gestione") +
      "</nav>" +
      '<p class="ac-foot-copy">AncheCasa. Tutti i diritti riservati.</p></div>' +
      "<div><h4>Pagine</h4>" +
      '<a href="index.html">Home</a>' +
      '<a href="chi-siamo.html">Chi siamo</a>' +
      '<a href="corsi.html">Corsi</a>' +
      '<a href="progetti.html">Settori</a></div>' +
      "<div><h4>Settori</h4>" +
      '<a href="progetti.html#cantieri">Cantieri</a>' +
      '<a href="progetti.html#industrie">Industrie</a>' +
      '<a href="progetti.html#aziende">Aziende</a>' +
      '<a href="progetti.html#alberghi">Alberghi</a>' +
      '<a href="progetti.html#ristorazione">Ristorazione</a>' +
      '<a href="progetti.html#pubbliche">Strutture pubbliche</a></div>' +
      "<div><h4>Contatti</h4>" +
      '<a href="contatti.html">Contatti</a>' +
      "</div></div></div></footer>";
  }
})();
