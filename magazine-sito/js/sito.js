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

  /* statistiche anonime, come la rivista (api/mag.js → Supabase, pagina «Magazine» dell'area admin):
     niente cookie, sessione casuale della scheda. Contano solo su magazine.anchecasa.it (per provare: ?stat=prova).
     La provenienza comincia con «sito», così nel riepilogo si distinguono i lettori del sito da quelli della rivista sfogliabile. */
  var STAT = (function () {
    var attivo = /(^|\.)magazine\.anchecasa\.it$/.test(location.hostname) || /[?&]stat=prova/.test(location.search);
    var coda = [], visti = {}, timer = null, ses = "";
    try { ses = sessionStorage.getItem("ac-sito-s") || ""; } catch (e) {}
    if (!ses) { ses = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); try { sessionStorage.setItem("ac-sito-s", ses); } catch (e) {} }
    var ua = navigator.userAgent || "";
    var disp = /iPad|Tablet/i.test(ua) ? "tablet" : /Mobi|Android|iPhone/i.test(ua) ? "telefono" : "pc";
    var da = (function () {
      var m = location.search.match(/[?&](?:da|utm_source)=([^&]+)/);
      if (m) { try { return "sito · " + decodeURIComponent(m[1]).slice(0, 50); } catch (e) { return "sito · " + m[1].slice(0, 50); } }
      if (!document.referrer) return "sito · diretto";
      try { var h = new URL(document.referrer).hostname.replace(/^www\./, ""); return h === location.hostname ? "sito · interno" : "sito · " + h; } catch (e) { return "sito · altro"; }
    })();
    function invia(beacon) {
      clearTimeout(timer); timer = null;
      if (!coda.length || !attivo) { coda = []; return; }
      var corpo = JSON.stringify({ s: ses, n: 1, d: disp, da: da, ev: coda.splice(0, 40) });
      try {
        if (beacon && navigator.sendBeacon && navigator.sendBeacon("/api/mag", new Blob([corpo], { type: "text/plain" }))) return;
        fetch("/api/mag", { method: "POST", headers: { "Content-Type": "application/json" }, body: corpo, keepalive: true }).catch(function () {});
      } catch (e) {}
    }
    function traccia(evento, pagina, dettaglio) {
      var k = evento + "|" + (dettaglio || "");
      if (visti[k]) return; visti[k] = 1;
      coda.push({ e: evento, p: pagina == null ? null : pagina, x: dettaglio || "" });
      if (!timer) timer = setTimeout(function () { invia(false); }, 2500);
    }
    window.addEventListener("pagehide", function () { invia(true); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") invia(true); });
    var gia = false;
    try { gia = sessionStorage.getItem("ac-sito-ap") === "1"; sessionStorage.setItem("ac-sito-ap", "1"); } catch (e) {}
    if (!gia) traccia("apertura", null, "sito");
    traccia("pagina", null, (location.pathname.replace(/^\/articoli\//, "") || "/").slice(0, 60));
    return { traccia: traccia };
  })();
  window.ACStat = STAT;

  // condividi: WhatsApp e copia del link (con ?da= per sapere da dove arrivano i lettori)
  document.addEventListener("click", function (e) {
    var wa = e.target.closest(".cd-wa");
    if (wa) { STAT.traccia("condividi", null, "whatsapp"); return; }
    var cp = e.target.closest(".cd-copia");
    if (!cp) return;
    var url = cp.getAttribute("data-url") + "?da=link", ok = cp.parentNode.querySelector(".cd-ok");
    var fatto = function () { ok.textContent = "Link copiato"; setTimeout(function () { ok.textContent = ""; }, 2500); STAT.traccia("condividi", null, "link copiato"); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(fatto, function () { ok.textContent = url; });
    else { ok.textContent = url; }
  });

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
        dici("Fatto: ti scriviamo quando esce il prossimo numero.", true); f.reset(); STAT.traccia("avvisi", null, "sito");
      }).catch(function () {
        dici("Iscrizione non riuscita. Riprova tra poco o scrivi a info@anchecasa.it.", false);
      }).then(function () { btn.disabled = false; });
    });
  }
})();
