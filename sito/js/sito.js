(function () {
  /* CONGELATO 23.09.2026. Apertura dall'alto.
     Ogni pagina di AncheCasa parte da scroll 0, anche con un hash in mezzo.
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

  const NAV = [
    { id: "home", href: "/", label: "Home" },
    { id: "come-funziona", href: "/come-funziona", label: "Come funziona" },
    { id: "privato", href: "/privato", label: "Privato" },
    { id: "azienda", href: "/azienda", label: "Azienda" },
    { id: "agente", href: "/agente", label: "Agente" },
    { id: "magazine", href: "/magazine", label: "Magazine" },
    { id: "contatti", href: "/contatti", label: "Contatti" }
  ];
  const AZIENDA_PAGES = [
    "azienda", "impresa", "professionista", "hse", "sicurezza-armata", "condominio", "agenzia", "apl",
    "industria", "logistica", "albergo", "negozio", "fornitore", "artigiano"
  ];
  const page = document.body.getAttribute("data-page") || "";
  const logo = "assets/logo/anchecasa-orizzontale-trasparente.png?v=3";
  /* Header: al posto di Iscriviti c’è l’icona profilo. Il clic apre Accedi oppure Iscriviti. */

  function headerHtml() {
    const links = NAV.map(function (n) {
      const on = n.id === page || (n.id === "azienda" && AZIENDA_PAGES.indexOf(page) >= 0);
      return '<a href="' + n.href + '" class="' + (on ? "is-on" : "") + '">' + n.label + "</a>";
    }).join("");
    return (
      '<header class="site-header"><div class="wrap header-inner">' +
      '<a class="brand" href="/" aria-label="AncheCasa, vai alla home">' +
      '<img src="' + logo + '" alt="AncheCasa"></a>' +
      '<nav class="nav" id="site-nav">' + links + "</nav>" +
      '<div class="profilo">' +
      '<button class="profilo-btn" id="profilo-btn" type="button" aria-label="Profilo" aria-expanded="false" aria-controls="profilo-menu">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">' +
      '<circle cx="12" cy="8" r="3.2" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M5.5 19.2c1.2-3.2 3.5-4.7 6.5-4.7s5.3 1.5 6.5 4.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
      "</svg></button>" +
      '<div class="profilo-menu" id="profilo-menu" hidden>' +
      '<a href="https://areaprivata.anchecasa.it/">Accedi</a>' +
      '<a href="/login">Iscriviti</a>' +
      "</div></div>" +
      '<button class="menu-btn" id="menu-btn" type="button" aria-label="Apri il menu" aria-expanded="false" aria-controls="site-nav">' +
      "<span></span><span></span><span></span></button>" +
      "</div></header>"
    );
  }

  /* CONGELATO 23.09.2026. Footer AncheCasa: una fascia, quattro colonne.
     Logo, «Una piazza sola per tutti» su una riga a 11px, Privacy, Note legali, Cookie, Gestione, copyright nella prima colonna.
     Poi Per te, Categorie azienda, AncheCasa. Niente seconda fascia.
     23.09.2026, su richiesta: tolta la voce Domande e la pagina faq.html.
     Come funziona sta nel footer e anche nel menu in alto. Tolte le voci Pubblica e Funzioni. */
  function footerHtml() {
    return (
      '<footer class="site-footer"><div class="wrap">' +
      '<div class="foot-grid">' +
      '<div class="foot-brand"><a class="brand" href="/"><img src="' + logo + '" alt="AncheCasa"></a>' +
      '<nav class="foot-legal" aria-label="Informazioni legali">' +
      '<a href="/privacy">Privacy</a>' +
      '<a href="/note-legali">Note legali</a>' +
      '<a href="/cookie">Cookie</a>' +
      '<a href="/gestione">Gestione</a>' +
      "</nav>" +
      '<p class="foot-copy">AncheCasa. Tutti i diritti riservati.</p></div>' +
      "<div><h4>Per te</h4>" +
      '<a href="/privato">Privato</a><a href="/azienda">Azienda</a>' +
      '<a href="/agente">Agente</a><a href="/iscriviti">Iscriviti</a></div>' +
      "<div><h4>Categorie azienda</h4>" +
      "<span>Impresa / GC</span><span>Professionista</span>" +
      "<span>Condominio</span><span>Agenzia immobiliare</span>" +
      "<span>Fornitore</span><span>Artigiano</span></div>" +
      "<div><h4>AncheCasa</h4>" +
      '<a href="/come-funziona">Come funziona</a>' +
      '<a href="/certificazioni">Certificazioni</a>' +
      '<a href="/contatti">Contatti</a></div></div></div></footer>'
    );
  }

  const headMount = document.getElementById("site-header");
  const footMount = document.getElementById("site-footer");
  if (headMount) {
    const chrome = document.createElement("div");
    chrome.className = "site-chrome";
    chrome.innerHTML = headerHtml();
    headMount.replaceWith(chrome);
  }
  if (footMount) footMount.outerHTML = footerHtml();

  const vaiSicura = document.getElementById("vai-sicura");
  if (vaiSicura && (location.hostname === "127.0.0.1" || location.hostname === "localhost")) {
    vaiSicura.href = "http://127.0.0.1:4791/";
  }

  const profiloBtn = document.getElementById("profilo-btn");
  const profiloMenu = document.getElementById("profilo-menu");
  if (profiloBtn && profiloMenu) {
    profiloBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      const open = profiloMenu.hidden;
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

  const menuBtn = document.getElementById("menu-btn");
  const nav = document.getElementById("site-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      const open = nav.classList.toggle("open");
      document.body.classList.toggle("nav-open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Token di un link "Genera link" mandato dall'admin (?invito=... nell'URL): se c'è, si
  // segna da sola l'apertura qui sotto, e l'iscrizione quando uno dei form viene inviato.
  const invitoToken = new URLSearchParams(location.search).get("invito");
  if (invitoToken && window.acDb) {
    window.acDb.rpc("apri_invito_admin", { p_token: invitoToken }).then(function () {});
  }

  document.querySelectorAll("form[data-store]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const key = form.getAttribute("data-store");
      const data = {};
      new FormData(form).forEach(function (v, k) {
        data[k] = v && typeof v === "object" && "name" in v ? (v.name || "") : v;
      });
      data.at = new Date().toISOString();
      if (invitoToken) data.invito = invitoToken;
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      prev.push(data);
      localStorage.setItem(key, JSON.stringify(prev));

      // Oltre al localStorage (tenuto per compatibilità), la richiesta va anche nella coda
      // che legge l'admin: marketplace.richieste_iscrizione. La famiglia è la parte finale
      // di data-store ("anchecasa-sito-privato" -> "privato"), stesso vocabolario dell'enum.
      if (window.acDb) {
        const famiglia = key.replace("anchecasa-sito-", "");
        window.acDb.from("richieste_iscrizione").insert({ famiglia: famiglia, dati: data }).then(function () {});
        if (invitoToken) {
          window.acDb.rpc("completa_invito_admin", { p_token: invitoToken }).then(function () {});
        }
      }

      form.reset();
      const hint = form.querySelector("[data-hint]");
      if (hint) hint.textContent = "";
      const ok = form.querySelector(".form-ok");
      if (ok) ok.classList.add("show");
    });
  });

  const family = {
    privato: {
      note: "Il privato non vede Opportunità. Sotto il separatore: Credit, Aste immobiliari, Impostazioni.",
      sub: ["Credit", "Aste immobiliari", "Impostazioni"],
      opp: false
    },
    azienda: {
      note: "L’azienda vede Opportunità. Sotto: Credit, Aste, Sicurezza, Impostazioni. Dal profilo approfondito si accendono Gare, Predict, BIM 5D, Condomini o tracking.",
      sub: ["Credit", "Aste immobiliari", "Sicurezza", "Impostazioni"],
      opp: true
    },
    agente: {
      note: "L’agente vede Opportunità. Sotto: Catena, Guadagno, Inviti, Impostazioni. Solo l’agente guadagna, e il guadagno scende sulla catena.",
      sub: ["Catena", "Guadagno", "Inviti", "Impostazioni"],
      opp: true
    }
  };

  document.querySelectorAll("[data-shell]").forEach(function (root) {
    const tabs = root.querySelectorAll("[data-fam]");
    const opp = root.querySelector("[data-opp]");
    const sub = root.querySelector("[data-sub]");
    const note = root.querySelector("[data-note]");
    function show(id) {
      const f = family[id];
      if (!f) return;
      tabs.forEach(function (t) {
        t.classList.toggle("is-on", t.getAttribute("data-fam") === id);
      });
      if (opp) opp.classList.toggle("off", !f.opp);
      if (sub) {
        sub.innerHTML = f.sub.map(function (s) {
          return '<span class="shell-btn">' + s + "</span>";
        }).join("");
      }
      if (note) note.textContent = f.note;
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        show(t.getAttribute("data-fam"));
      });
    });
    const first = tabs[0] && tabs[0].getAttribute("data-fam");
    if (first) show(first);
  });

  const tabsRoot = document.querySelector("[data-tabs]");
  if (tabsRoot) {
    const buttons = tabsRoot.querySelectorAll("[data-tab]");
    const panels = tabsRoot.querySelectorAll("[data-panel]");
    function openTab(id) {
      buttons.forEach(function (b) {
        b.classList.toggle("is-on", b.getAttribute("data-tab") === id);
      });
      panels.forEach(function (p) {
        p.classList.toggle("is-on", p.getAttribute("data-panel") === id);
      });
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        openTab(b.getAttribute("data-tab"));
      });
    });
    function fromHash() {
      const hash = (location.hash || "").replace("#", "");
      if (hash === "azienda" || hash === "agente" || hash === "privato") openTab(hash);
      else openTab(tabsRoot.getAttribute("data-tabs") || "privato");
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
  }

})();
