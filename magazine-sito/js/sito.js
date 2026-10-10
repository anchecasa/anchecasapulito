/* AncheCasa Magazine · magazine.anchecasa.it (10.10.2026): menu del telefono, conto alla rovescia del bonus, iscrizione. */
(function () {
  "use strict";
  // menu del telefono
  var apri = document.querySelector(".t-apri"), cassetto = document.getElementById("cassetto");
  if (apri && cassetto) {
    apri.addEventListener("click", function () {
      var on = apri.getAttribute("aria-expanded") !== "true";
      apri.setAttribute("aria-expanded", String(on));
      cassetto.hidden = !on;
    });
    cassetto.addEventListener("click", function (e) { if (e.target.closest("a")) { apri.setAttribute("aria-expanded", "false"); cassetto.hidden = true; } });
  }

  // giorni che mancano alla scadenza del bonus al 50% (si aggiorna da solo ogni giorno)
  var conto = document.querySelector(".conto[data-scadenza]");
  if (conto) {
    var p = conto.getAttribute("data-scadenza").split("-");
    var n = new Date();
    var g = Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())) / 86400000);
    if (g > 0) { conto.querySelector(".conto-n").textContent = g; if (g === 1) conto.querySelector("span").textContent = "giorno per il bonus casa al 50%"; conto.hidden = false; }
  }

  // iscrizione: stessa funzione della rivista sfogliabile (api/mag.js → Supabase)
  var f = document.querySelector(".iscr-form");
  if (f) {
    var msg = f.querySelector(".iscr-msg"), btn = f.querySelector("button");
    var dici = function (t, ok) { msg.textContent = t; msg.className = "iscr-msg " + (ok ? "ok" : "no"); };
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var mail = f.mail.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { dici("Scrivi una mail valida, per esempio nome@esempio.it.", false); f.mail.focus(); return; }
      if (!f.privacy.checked) { dici("Per iscriverti spunta la casella dell’informativa privacy.", false); return; }
      btn.disabled = true; dici("Un attimo…", true);
      fetch("/api/mag", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iscrizione: { mail: mail, comune: f.comune.value.trim(), interesse: "Magazine e app raccolta (magazine.anchecasa.it)", numero: 1, privacy: true } })
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        dici("Fatto: ti scriviamo quando esce il prossimo numero.", true); f.reset();
      }).catch(function () {
        dici("Iscrizione non riuscita. Riprova tra poco o scrivi a info@anchecasa.it.", false);
      }).then(function () { btn.disabled = false; });
    });
  }
})();
