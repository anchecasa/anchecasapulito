// Form di iscrizione e candidatura, ospitato su areaprivata.anchecasa.it (progetto Vercel
// dell'Area riservata), separato dal Sito: un deploy di anchecasa.it non lo tocca.
// Derivato da sito/js/sito.js (versione con signUp del 22.09.2026): stessa logica di invio,
// header/footer con link assoluti verso il Sito, senza il codice delle altre pagine.
(function () {
  const SITO = "https://anchecasa.it/";
  const NAV = [
    { id: "home", href: "index.html", label: "Home" },
    { id: "come-funziona", href: "come-funziona.html", label: "Come funziona" },
    { id: "privato", href: "privato.html", label: "Privato" },
    { id: "azienda", href: "azienda.html", label: "Azienda" },
    { id: "agente", href: "agente.html", label: "Agente" },
    { id: "contatti", href: "contatti.html", label: "Contatti" }
  ];
  const page = document.body.getAttribute("data-page") || "";
  const logo = "assets/logo/anchecasa-orizzontale-trasparente.png?v=3";

  function headerHtml() {
    const links = NAV.map(function (n) {
      const on = n.id === page;
      return '<a href="' + SITO + n.href + '" class="' + (on ? "is-on" : "") + '">' + n.label + "</a>";
    }).join("");
    return (
      '<header class="site-header"><div class="wrap header-inner">' +
      '<a class="brand" href="' + SITO + '" aria-label="AncheCasa, vai alla home">' +
      '<img src="' + logo + '" alt="AncheCasa"></a>' +
      '<nav class="nav" id="site-nav">' + links + "</nav>" +
      '<a class="btn-cotto header-cta" href="iscriviti.html">Iscriviti</a>' +
      '<button class="menu-btn" id="menu-btn" type="button" aria-label="Apri il menu" aria-expanded="false" aria-controls="site-nav">' +
      "<span></span><span></span><span></span></button>" +
      "</div></header>"
    );
  }

  function footerHtml() {
    return (
      '<footer class="site-footer"><div class="wrap">' +
      '<div class="foot-bar">' +
      "<span>AncheCasa · una piazza sola</span>" +
      "</div>" +
      '<div class="foot-grid">' +
      '<div class="foot-brand"><a class="brand" href="' + SITO + '"><img src="' + logo + '" alt="AncheCasa"></a>' +
      "<p>Dal privato all’industria si trova qualsiasi cosa pubblicando un annuncio.</p></div>" +
      "<div><h4>Per te</h4>" +
      '<a href="' + SITO + 'privato.html">Privato</a><a href="' + SITO + 'azienda.html">Azienda</a>' +
      '<a href="' + SITO + 'agente.html">Agente</a><a href="iscriviti.html">Iscriviti</a></div>' +
      "<div><h4>Categorie azienda</h4>" +
      "<span>Impresa / GC</span><span>Professionista</span>" +
      "<span>Condominio</span><span>Agenzia immobiliare</span>" +
      "<span>Fornitore</span><span>Artigiano</span></div>" +
      "<div><h4>AncheCasa</h4>" +
      '<a href="' + SITO + 'come-funziona.html">Come funziona</a><a href="' + SITO + 'pubblica.html">Pubblica</a>' +
      '<a href="' + SITO + 'funzioni.html">Funzioni</a><a href="' + SITO + 'faq.html">Domande</a>' +
      '<a href="' + SITO + 'contatti.html">Contatti</a><a href="' + SITO + 'privacy.html">Privacy</a></div></div>' +
      '<div class="copy"><span>AncheCasa. Tutti i diritti riservati.</span></div></div></footer>'
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
  // 01.10.2026: gli inviti ora passano dalla pagina di benvenuto (mail + password). I link già
  // spediti con il vecchio indirizzo (iscriviti.html?invito=...) vengono portati lì.
  if (invitoToken && /iscriviti\.html$/.test(location.pathname)) {
    location.replace("benvenuto.html?invito=" + encodeURIComponent(invitoToken));
    return;
  }
  if (invitoToken && window.acDb) {
    window.acDb.rpc("apri_invito_admin", { p_token: invitoToken }).then(function () {});
  }

  function conTimeout(promessa, ms) {
    return Promise.race([
      promessa,
      new Promise(function (_, rifiuta) {
        setTimeout(function () { rifiuta(new Error("Il server non risponde. Riprova tra poco.")); }, ms);
      })
    ]);
  }

  function erroreAccount(msg) {
    const m = String(msg || "").toLowerCase();
    if (m.indexOf("already registered") >= 0) return "Questa mail ha già un account AncheCasa. Usa un’altra mail.";
    if (m.indexOf("password") >= 0) return "La password deve avere almeno 8 caratteri.";
    if (m.indexOf("rate limit") >= 0) return "Troppi tentativi. Riprova tra qualche minuto.";
    if (m.indexOf("email") >= 0) return "La mail non sembra valida.";
    return "Invio non riuscito, riprova tra poco.";
  }

  // Invio: 1) crea l'account Supabase Auth con mail e password, per accedere poi all'Area
  // riservata; 2) mette la richiesta nella coda che legge l'admin
  // (marketplace.richieste_iscrizione, collegata all'account con user_id); 3) segna l'invito.
  // La password va SOLO a auth.signUp: mai in dati, mai in localStorage.
  // Il messaggio di conferma compare solo se Supabase ha confermato; se qualcosa fallisce
  // i dati restano nel form. Se l'account è già stato creato e fallisce solo il passo 2,
  // al nuovo tentativo si riusa lo stesso account (form._utenteId) invece di ricrearlo.
  document.querySelectorAll("form[data-store]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const key = form.getAttribute("data-store");
      const famiglia = key.replace("anchecasa-sito-", "");
      const btn = form.querySelector('button[type="submit"]');
      const ok = form.querySelector(".form-ok");
      const err = form.querySelector(".form-err");
      if (ok) ok.classList.remove("show");
      if (err) err.classList.remove("show");

      function errore(msg) {
        if (btn) btn.disabled = false;
        if (err) {
          err.textContent = msg;
          err.classList.add("show");
        }
      }

      const data = {};
      const fileCv = form.elements.cv && form.elements.cv.files && form.elements.cv.files[0];
      const filePortfolio = form.elements.portfolio && form.elements.portfolio.files && form.elements.portfolio.files[0];
      new FormData(form).forEach(function (v, k) {
        if (k === "password") return;
        data[k] = v && typeof v === "object" && "name" in v ? (v.name || "") : v;
      });
      const password = form.elements.password ? form.elements.password.value : "";
      data.privacy = !!(form.elements.privacy && form.elements.privacy.checked);
      data.at = new Date().toISOString();
      if (data.privacy) data.privacy_at = data.at;
      if (invitoToken) data.invito = invitoToken;

      if (!window.acDb) {
        errore("Invio non riuscito, riprova tra poco.");
        return;
      }
      if (btn) btn.disabled = true;

      // Zona per il profilo: testo scritto (agente) o etichetta della regione scelta (azienda).
      let zonaProfilo = "";
      const zonaEl = form.elements.zona;
      if (zonaEl) {
        zonaProfilo = zonaEl.selectedOptions && zonaEl.selectedOptions[0]
          ? zonaEl.selectedOptions[0].text
          : String(zonaEl.value || "").trim();
      }

      function caricaAllegato(userId, campo, file) {
        if (!file || !file.size) return Promise.resolve({ nome: "", url: "" });
        const safe = String(file.name || "file").replace(/[^\w.\-]+/g, "_").slice(0, 80);
        const percorso = "agente/" + userId + "/" + campo + "-" + Date.now() + "-" + safe;
        return window.acDb.storage
          .from("marketplace-candidature")
          .upload(percorso, file, { contentType: file.type || "application/octet-stream", upsert: false })
          .then(function (up) {
            if (up.error) return { nome: file.name || "", url: "" };
            const pub = window.acDb.storage.from("marketplace-candidature").getPublicUrl(percorso);
            return { nome: file.name || "", url: (pub.data && pub.data.publicUrl) || "" };
          })
          .catch(function () {
            return { nome: file.name || "", url: "" };
          });
      }

      const account = form._utenteId
        ? Promise.resolve(form._utenteId)
        : conTimeout(window.acDb.auth.signUp({
            email: data.email,
            password: password,
            options: {
              emailRedirectTo: "https://areaprivata.anchecasa.it/",
              // "invito": il database lo usa per collegare l'iscritto a chi l'ha invitato e, se
              // l'invito è di un utente (non dell'admin), per verificarlo subito.
              data: { nome: data.nome || data.ragione || "", cognome: data.cognome || "", famiglia: famiglia, zona: zonaProfilo, invito: invitoToken || null }
            }
          }), 15000).then(function (res) {
            if (res.error) throw new Error(erroreAccount(res.error.message));
            const user = res.data && res.data.user;
            // Con la conferma mail attiva, una mail già registrata non dà errore ma torna
            // un utente senza identità: va trattata come "già registrata".
            if (!user || (user.identities && user.identities.length === 0)) {
              throw new Error(erroreAccount("already registered"));
            }
            form._utenteId = user.id;
            return user.id;
          });

      account
        .then(function (userId) {
          const allegati = famiglia === "agente"
            ? Promise.all([caricaAllegato(userId, "cv", fileCv), caricaAllegato(userId, "portfolio", filePortfolio)])
            : Promise.resolve([{ nome: "", url: "" }, { nome: "", url: "" }]);
          return allegati.then(function (all) {
            if (all[0].nome) {
              data.cv = all[0].nome;
              if (all[0].url) data.cv_url = all[0].url;
            }
            if (all[1].nome) {
              data.portfolio = all[1].nome;
              if (all[1].url) data.portfolio_url = all[1].url;
            }
            return conTimeout(
              window.acDb.from("richieste_iscrizione").insert({ famiglia: famiglia, dati: data, user_id: userId }),
              15000
            ).then(function (res) {
              if (res.error) throw new Error("Invio non riuscito, riprova tra poco.");
            });
          });
        })
        .then(function () {
          if (invitoToken) {
            window.acDb.rpc("completa_invito_admin", { p_token: invitoToken }).then(function () {});
          }
          try {
            const prev = JSON.parse(localStorage.getItem(key) || "[]");
            prev.push(data);
            localStorage.setItem(key, JSON.stringify(prev));
          } catch (x) { /* storage bloccato: la richiesta è già su Supabase */ }
          form._utenteId = null;
          form.reset();
          if (btn) btn.disabled = false;
          if (ok) ok.classList.add("show");
        })
        .catch(function (x) {
          errore(x && x.message ? x.message : "Invio non riuscito, riprova tra poco.");
        });
    });
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
