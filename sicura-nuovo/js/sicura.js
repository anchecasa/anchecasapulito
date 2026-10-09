/* AncheSicura: i moduli aprono la mail con la richiesta già scritta */
(function () {
  var MAIL = "rete@anchecasa.it";
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
      var testo = ["Nome e azienda: " + d.get("nome"), "Telefono: " + d.get("telefono"), "Mail: " + d.get("mail"), "Servizio: " + s, "Città: " + (d.get("citta") || ""), "Urgente: " + d.get("urgenza"), "", d.get("messaggio") || ""].join("\n");
      location.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent(oggetto) + "&body=" + encodeURIComponent(testo);
      document.getElementById("f-esito").hidden = false;
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll("form[data-oggetto]"), function (g) {
    g.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!g.checkValidity()) { g.reportValidity(); return; }
      var righe = [];
      Array.prototype.forEach.call(g.querySelectorAll("input[name],select[name],textarea[name]"), function (c) { righe.push(c.name + ": " + c.value); });
      location.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent(g.getAttribute("data-oggetto")) + "&body=" + encodeURIComponent(righe.join("\n"));
      var es = g.querySelector(".esito"); if (es) es.hidden = false;
    });
  });
})();
