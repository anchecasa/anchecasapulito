/* Iscrizione unica AncheCasa. Stessi campi su sito, area privata e app.
   All'ingresso: categoria, mail, password, nome oppure partita IVA e ragione sociale, codice agente, privacy.
   Google e Apple si vedono solo se l'opzione è accesa (oggi spenta). */
(function (root) {
  var OBIETTIVI = {
    privato: [
      ["vendo", "Vendo o affitto un immobile"],
      ["cerco-casa", "Cerco casa"],
      ["cerco-lavoro", "Cerco lavoro"],
      ["guasto", "Ho un guasto"],
      ["ristruttura", "Ristrutturo"]
    ],
    azienda: [
      ["pubblico-lavoro", "Pubblico un lavoro o un appalto"],
      ["cerco-fornitori", "Cerco fornitori"],
      ["cantieri", "Gestisco i cantieri"],
      ["gare", "Partecipo a gare"],
      ["ricevi-clienti", "Ricevo clienti"]
    ],
    fornitore: [
      ["vendo", "Vendo prodotti"],
      ["noleggio", "Noleggio"],
      ["servizi", "Offro servizi"],
      ["gare", "Rispondo a gare e richieste"]
    ]
  };
  var ATECO = [
    ["41.20", "Costruzione di edifici"],
    ["43.21", "Impianti elettrici"],
    ["43.22", "Impianti idraulici e di riscaldamento"],
    ["43.29", "Altri impianti"],
    ["43.31", "Intonacatura"],
    ["43.32", "Posa in opera di infissi"],
    ["43.33", "Rivestimenti e pavimenti"],
    ["43.34", "Tinteggiatura"],
    ["43.39", "Altri lavori di completamento"],
    ["43.91", "Coperture"],
    ["46.73", "Commercio di materiali edili"],
    ["77.32", "Noleggio di macchine per l'edilizia"],
    ["62.01", "Programmazione informatica"]
  ];
  var ZONE = ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"];
  var TIPI = [
    ["artigiano", "Artigiano"],
    ["impresa", "Impresa"],
    ["professionista", "Professionista"],
    ["azienda_imprese_edili", "Impresa edile"],
    ["azienda_impiantisti", "Impiantista"],
    ["azienda_subappaltatori", "Subappaltatore"],
    ["azienda_studi_tecnici", "Studio tecnico"],
    ["committente_condominio", "Condominio (pubblica appalti)"],
    ["committente_amministratore", "Amministratore di condominio"],
    ["committente_grande", "Grande azienda"],
    ["committente_fondo", "Fondo immobiliare"],
  ];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pivaOk(raw) {
    var s = String(raw || "").replace(/\D/g, "");
    if (!/^\d{11}$/.test(s)) return false;
    var somma = 0, i, n, doppio;
    for (i = 0; i < 10; i++) {
      n = Number(s[i]);
      if (i % 2 === 0) somma += n;
      else { doppio = n * 2; somma += Math.floor(doppio / 10) + (doppio % 10); }
    }
    return ((10 - (somma % 10)) % 10) === Number(s[10]);
  }
  function query() {
    var q = new URLSearchParams(location.search);
    var hash = (location.hash || "").split("?")[1] || "";
    var h = new URLSearchParams(hash);
    function uno(k) { return q.get(k) || h.get(k) || ""; }
    return {
      categoria: uno("categoria") || uno("famiglia"),
      mail: uno("mail") || uno("email"),
      nome: uno("nome"),
      ragione: uno("ragione") || uno("ditta"),
      codice: uno("codice") || uno("agente"),
      invito: uno("invito") || uno("token"),
      ritorno: uno("ritorno")
    };
  }
  function leggiBozza() {
    try { return JSON.parse(sessionStorage.getItem("ac-iscrizione") || "null"); } catch (e) { return null; }
  }
  function salvaBozza(d) {
    try { sessionStorage.setItem("ac-iscrizione", JSON.stringify(d)); } catch (e) { /* niente */ }
  }

  function htmlModulo(op) {
    var q = Object.assign(query(), op.precompila || {});
    var cat = ["privato", "azienda", "fornitore"].indexOf(q.categoria) >= 0 ? q.categoria : "privato";
    var social = "";
    if (op.google) social += '<button type="button" class="iu-btn linea" data-iu="google">Continua con Google</button>';
    if (op.apple) social += '<button type="button" class="iu-btn linea" data-iu="apple">Continua con Apple</button>';
    return '<div class="iu"><h2>Crea il tuo account</h2>' +
      '<p class="iu-lead">Sei un privato, un\'azienda o un\'azienda fornitore? Entri subito. I documenti si chiedono dopo, quando servono.</p>' +
      '<form class="iu-form" novalidate>' +
      '<div class="iu-scelte" role="radiogroup" aria-label="Chi sei">' +
      scelta("privato", "Privato", "La casa, i guasti, gli annunci. Gratis.", cat) +
      scelta("azienda", "Azienda", "Artigiano o impresa. Lei completa il profilo dopo.", cat) +
      scelta("fornitore", "Azienda fornitore", "Prodotti, noleggio o servizi. Lei risponde alle richieste.", cat) +
      "</div>" +
      '<label class="iu-campo">Mail<input name="email" type="email" autocomplete="email" required value="' + esc(q.mail) + '"></label>' +
      '<label class="iu-campo">Password<input name="password" type="password" autocomplete="new-password" minlength="8" required><small>Almeno 8 caratteri.</small></label>' +
      '<div data-iu-privato' + (cat === "privato" ? "" : " hidden") + '><label class="iu-campo">Nome e cognome<input name="nome" autocomplete="name" maxlength="80" value="' + esc(q.nome) + '"></label></div>' +
      '<div data-iu-ditta' + (cat === "privato" ? " hidden" : "") + '>' +
      '<label class="iu-campo">Ragione sociale<input name="ragione" autocomplete="organization" maxlength="120" value="' + esc(q.ragione) + '"></label>' +
      '<label class="iu-campo">Partita IVA<input name="piva" inputmode="numeric" maxlength="16" autocomplete="off"></label></div>' +
      '<label class="iu-campo">Codice agente, se ce l\'hai<input name="codice" maxlength="40" value="' + esc(q.codice) + '"></label>' +
      '<label class="iu-spunta"><input name="privacy" type="checkbox" required><span>Ho letto <a href="' + esc(op.privacy || "https://anchecasa.it/privacy.html") + '">l\'informativa privacy</a> e accetto il trattamento dei dati.</span></label>' +
      '<p class="iu-err" data-iu-err hidden></p>' +
      '<button class="iu-btn" type="submit">Iscriviti</button></form>' +
      (social ? '<div class="iu-social">' + social + "</div>" : "") +
      '<p class="iu-lead" style="margin-top:14px">L\'agente e il partner restano in «Lavora con noi».</p></div>';
  }
  function scelta(id, titolo, testo, cat) {
    return '<label class="iu-scelta"><input type="radio" name="categoria" value="' + id + '"' + (id === cat ? " checked" : "") + '><span><b>' + titolo + "</b><small>" + testo + "</small></span></label>";
  }

  function leggi(form) {
    var cat = (form.querySelector('input[name="categoria"]:checked') || {}).value || "privato";
    return {
      categoria: cat,
      email: form.email.value.trim(),
      password: form.password.value,
      nome: form.nome.value.trim(),
      ragione: form.ragione.value.trim(),
      piva: String(form.piva.value || "").replace(/\D/g, ""),
      codice: form.codice.value.trim(),
      privacy: form.privacy.checked
    };
  }
  function valida(d) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return "Controlla la mail.";
    if (d.password.length < 8) return "La password deve avere almeno 8 caratteri.";
    if (d.categoria === "privato" && d.nome.length < 2) return "Scrivi nome e cognome.";
    if (d.categoria !== "privato" && d.ragione.length < 2) return "Scrivi la ragione sociale.";
    if (d.categoria !== "privato" && !pivaOk(d.piva)) return "La partita IVA non è valida: controlla le 11 cifre.";
    if (!d.privacy) return "Spunta l'informativa privacy.";
    return "";
  }

  function anteprima() {
    var h = location.hostname;
    return h !== "anchecasa.it" && h !== "www.anchecasa.it" && h !== "areaprivata.anchecasa.it" && h !== "entra.anchecasa.it";
  }

  async function creaAccount(d, op) {
    var meta = {
      famiglia: d.categoria,
      nome: d.categoria === "privato" ? d.nome : d.ragione,
      ragione: d.ragione,
      piva: d.piva,
      codice_agente: d.codice,
      provenienza: op.da || "sito",
      invito: (op.precompila && op.precompila.invito) || query().invito || null
    };
    if (anteprima() || op.anteprima) {
      salvaBozza(Object.assign({ quando: new Date().toISOString(), da: op.da || "sito", sessione: true }, d, { password: "" }));
      return { sessione: true, anteprima: true };
    }
    var sb = op.supabase;
    if (!sb || !sb.auth) throw new Error("Manca il collegamento. Riprova tra poco.");
    var res = await sb.auth.signUp({ email: d.email, password: d.password, options: { data: meta } });
    if (res.error) throw new Error(res.error.message || "Iscrizione non partita.");
    var user = res.data && res.data.user;
    var sessione = !!(res.data && res.data.session);
    try {
      await sb.from("richieste_iscrizione").insert({
        famiglia: d.categoria,
        dati: { nome: meta.nome, email: d.email, ragione: d.ragione, piva: d.piva, codice: d.codice, modulo: "iscrizione-unica" },
        user_id: user && user.id
      });
    } catch (e) { /* la coda admin non blocca l'ingresso */ }
    if (sessione) {
      try { await sb.rpc("app_profilo_apri", { p_categoria: d.categoria, p_nome: meta.nome, p_piva: d.piva, p_da: op.da || "sito" }); } catch (e) { /* app-14 non ancora sul database */ }
      try { await sb.rpc("app_iscrizione_evento", { p_categoria: d.categoria, p_passo: "account", p_da: op.da || "sito" }); } catch (e2) { /* idem */ }
    }
    salvaBozza(Object.assign({ quando: new Date().toISOString(), da: op.da || "sito", sessione: sessione }, d, { password: "" }));
    return { sessione: sessione, anteprima: false };
  }

  function mostraEsito(host, res, op) {
    var torna = query().ritorno || (op.precompila && op.precompila.ritorno) || "";
    if (res.sessione) {
      host.innerHTML = '<div class="iu"><p class="iu-ok">Sei dentro. Adesso scegli cosa vuoi fare: si può anche saltare.</p>' +
        (torna ? '<p>Torni al punto in cui eri.</p>' : "") + "</div>";
      if (op.dopo) op.dopo(res);
      else obiettivi(host, (leggiBozza() || {}).categoria || "privato", op);
      return;
    }
    host.innerHTML = '<div class="iu"><div class="iu-avviso">Controlla la mail e conferma l\'account. Poi entri. Per pubblicare e mandare un\'offerta la conferma resta obbligatoria.</div>' +
      '<p class="iu-lead">Se l\'amministratore spegne «Confirm email», questo passaggio non compare e si entra subito.</p></div>';
  }

  function monta(host, op) {
    op = op || {};
    host.innerHTML = htmlModulo(op);
    var form = host.querySelector("form");
    form.addEventListener("change", function (e) {
      if (e.target.name !== "categoria") return;
      var priv = e.target.value === "privato";
      host.querySelector("[data-iu-privato]").hidden = !priv;
      host.querySelector("[data-iu-ditta]").hidden = priv;
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var d = leggi(form);
      var err = valida(d);
      var box = host.querySelector("[data-iu-err]");
      if (err) { box.hidden = false; box.textContent = err; return; }
      box.hidden = true;
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      creaAccount(d, op).then(function (res) { mostraEsito(host, res, op); }).catch(function (ex) {
        btn.disabled = false;
        box.hidden = false;
        box.textContent = ex.message || "Iscrizione non partita.";
      });
    });
    host.querySelectorAll("[data-iu]").forEach(function (b) {
      b.addEventListener("click", function () {
        var quale = b.getAttribute("data-iu");
        if (!op.supabase || !op.supabase.auth) return;
        op.supabase.auth.signInWithOAuth({ provider: quale, options: { redirectTo: location.href } });
      });
    });
  }

  function obiettivi(host, categoria, op) {
    op = op || {};
    var lista = OBIETTIVI[categoria] || OBIETTIVI.privato;
    var lei = categoria !== "privato";
    var extra = "";
    if (categoria === "azienda") {
      extra = '<label class="iu-campo">Tipo di attività<select name="tipo">' + TIPI.map(function (t) { return '<option value="' + t[0] + '">' + esc(t[1]) + "</option>"; }).join("") + "</select></label>";
    }
    if (categoria === "fornitore") {
      extra = '<label class="iu-campo">Cerca la categoria<input name="cerca-ateco" placeholder="es. impianti, pulizie, noleggio"></label><div class="iu-ateco" data-ateco></div>' +
        '<p class="iu-lead">Zone servite</p><div class="iu-obiettivi">' + ZONE.map(function (z) {
          return '<label><input type="checkbox" name="zona" value="' + esc(z) + '"> ' + esc(z) + "</label>";
        }).join("") + "</div>";
    }
    host.insertAdjacentHTML("beforeend", '<form class="iu" data-iu-obiettivi><h2>Cosa vuoi fare?</h2><p class="iu-lead">' +
      (lei ? "Può sceglierne più di una, oppure saltare." : "Puoi sceglierne più di una, oppure saltare.") + "</p>" +
      '<div class="iu-obiettivi">' + lista.map(function (o) {
        return '<label><input type="checkbox" name="obiettivo" value="' + o[0] + '"> ' + esc(o[1]) + "</label>";
      }).join("") + "</div>" + extra +
      '<p style="margin-top:12px"><button class="iu-btn" type="submit">Continua</button> <button class="iu-btn linea" type="button" data-salta>Salta</button></p></form>');
    var box = host.querySelector("[data-ateco]");
    var campo = host.querySelector('[name="cerca-ateco"]');
    function disegnaAteco() {
      if (!box) return;
      var q = (campo.value || "").toLowerCase();
      box.innerHTML = ATECO.filter(function (a) { return !q || (a[0] + " " + a[1]).toLowerCase().indexOf(q) >= 0; }).map(function (a) {
        return '<label><input type="checkbox" name="ateco" value="' + a[0] + '"> ' + esc(a[0] + " · " + a[1]) + "</label>";
      }).join("");
    }
    if (campo) { disegnaAteco(); campo.addEventListener("input", disegnaAteco); }
    var form = host.querySelector("[data-iu-obiettivi]");
    function chiudi(saltato) {
      var scelti = saltato ? [] : Array.prototype.map.call(form.querySelectorAll('input[name="obiettivo"]:checked'), function (x) { return x.value; });
      var bozza = leggiBozza() || {};
      bozza.obiettivi = scelti;
      bozza.passo = 3;
      bozza.categoria = categoria;
      if (!saltato && categoria === "azienda") bozza.tipo = form.tipo.value;
      if (!saltato && categoria === "fornitore") {
        bozza.ateco = Array.prototype.map.call(form.querySelectorAll('input[name="ateco"]:checked'), function (x) { return x.value; });
        bozza.zone = Array.prototype.map.call(form.querySelectorAll('input[name="zona"]:checked'), function (x) { return x.value; });
      }
      salvaBozza(bozza);
      if (op.supabase && op.supabase.rpc && !anteprima()) {
        op.supabase.rpc("app_profilo_passo", { p_passo: 3, p_obiettivi: scelti, p_telefono: null, p_ateco: bozza.ateco || null, p_zone: bozza.zone || null, p_modo: null }).catch(function () {});
        op.supabase.rpc("app_iscrizione_evento", { p_categoria: categoria, p_passo: "obiettivi", p_da: op.da || "sito" }).catch(function () {});
      }
      if (op.dopoObiettivi) op.dopoObiettivi(bozza);
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); chiudi(false); });
    form.querySelector("[data-salta]").addEventListener("click", function () { chiudi(true); });
  }

  function chiedi(op) {
    var layer = document.createElement("div");
    layer.style.cssText = "position:fixed;inset:0;background:rgba(26,36,50,.45);z-index:80;overflow:auto;padding:24px 12px";
    var box = document.createElement("div");
    box.style.cssText = "max-width:520px;margin:0 auto;background:#FBF8F3;border-radius:16px;padding:18px";
    layer.appendChild(box);
    document.body.appendChild(layer);
    var pre = Object.assign({ categoria: "privato" }, (op && op.precompila) || {});
    try { sessionStorage.setItem("ac-ritorno", JSON.stringify({ url: location.href, nota: (op && op.nota) || "" })); } catch (e) { /* niente */ }
    monta(box, Object.assign({}, op, {
      precompila: pre,
      dopo: function () {
        obiettivi(box, pre.categoria || "privato", { dopoObiettivi: function () { layer.remove(); if (op && op.tornato) op.tornato(); } });
      }
    }));
  }

  root.IscrizioneUnica = {
    pivaOk: pivaOk,
    monta: monta,
    obiettivi: obiettivi,
    chiedi: chiedi,
    leggiBozza: leggiBozza,
    obiettiviDi: OBIETTIVI,
    anteprima: anteprima
  };
})(typeof window !== "undefined" ? window : globalThis);
