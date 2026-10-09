/* AncheSicura: i moduli mandano la richiesta nella coda dell'amministrazione AncheCasa
   (marketplace.richieste_iscrizione). Se non parte, si apre la mail con la richiesta già scritta. */
(function () {
  var MAIL = "__MAIL__";
  var SB = "https://edsvmnxojsmknjuhobqa.supabase.co", SBK = "sb_publishable_QbYv61SkMkjA9_GGb1hhOA_6v6GEw87";
  var VERO = /(^|\.)anchecasa\.it$/.test(location.hostname);
  function invia(g, modulo, oggetto, righe, dati, okTesto) {
    var es = g.querySelector(".esito"), btn = g.querySelector("button[type=submit]");
    var mail = function () {
      location.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent(oggetto) + "&body=" + encodeURIComponent(righe.join("\n"));
      if (es) { es.textContent = "Si è aperta la tua mail con la richiesta: premi Invia per mandarla ad AncheSicura."; es.hidden = false; }
      if (btn) btn.disabled = false;
    };
    var ok = function () { if (es) { es.textContent = okTesto; es.hidden = false; } g.reset(); if (btn) btn.disabled = false; };
    if (!VERO) { ok(); return; }
    if (btn) btn.disabled = true;
    dati.modulo = modulo; dati.sito = "anchesicura"; dati.at = new Date().toISOString();
    fetch(SB + "/rest/v1/richieste_iscrizione", { method: "POST",
      headers: { apikey: SBK, Authorization: "Bearer " + SBK, "Content-Type": "application/json", "Content-Profile": "marketplace", Prefer: "return=minimal" },
      body: JSON.stringify({ famiglia: "azienda", dati: dati }) })
      .then(function (r) { if (r.ok) ok(); else mail(); }).catch(mail);
  }
  var f = document.getElementById("f-offerta");
  if (f) {
    var sel = document.getElementById("f-servizio");
    var m = location.hash.match(/servizio=([a-z]+)/); if (m && sel) sel.value = m[1];
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var d = new FormData(f), s = sel.options[sel.selectedIndex].text;
      var urg = d.get("urgenza") && d.get("urgenza").indexOf("Sì") === 0;
      var oggetto = (urg ? "URGENTE · " : "") + "AncheSicura · richiesta offerta · " + s;
      var righe = ["Nome e azienda: " + d.get("nome"), "Telefono: " + d.get("telefono"), "Mail: " + d.get("mail"), "Servizio: " + s, "Città: " + (d.get("citta") || ""), "Urgente: " + d.get("urgenza"), "", d.get("messaggio") || ""];
      invia(f, "anchesicura offerta", oggetto, righe,
        { ragione: d.get("nome"), telefono: d.get("telefono"), email: d.get("mail"), servizio: s, zona: d.get("citta") || "", urgente: urg ? "sì" : "no", messaggio: (d.get("messaggio") || "").slice(0, 2000) },
        "Grazie, richiesta ricevuta. Ti risponde AncheSicura" + (urg ? " al più presto." : " a breve."));
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll("form[data-oggetto]"), function (g) {
    g.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!g.checkValidity()) { g.reportValidity(); return; }
      var righe = [], dati = {};
      Array.prototype.forEach.call(g.querySelectorAll("input[name],select[name],textarea[name]"), function (c) {
        righe.push(c.name + ": " + c.value); if (c.value) dati[c.name] = String(c.value).slice(0, 2000);
        if (c.type === "email") dati.email = c.value; if (c.type === "tel") dati.telefono = c.value;
        if (c.getAttribute("autocomplete") === "organization") dati.ragione = c.value; if (c.name === "Regione") dati.zona = c.value;
      });
      invia(g, "anchesicura rete", g.getAttribute("data-oggetto"), righe, dati,
        "Grazie, candidatura ricevuta. Manda la presentazione della società e le referenze a " + MAIL + ".");
    });
  });
})();
