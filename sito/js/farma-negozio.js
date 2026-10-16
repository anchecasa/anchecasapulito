/* AncheFarma · negozio (16.10.2026). Carrello nel browser, prenotazione senza pagamento. */
(function () {
  var P = window.AF_PRODOTTI || [], REP = window.AF_REPARTI || [];
  var SPED = window.AF_SPEDIZIONE || 2.9, GRATIS = window.AF_GRATIS_DA || 29;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var euro = function (x) { return x.toFixed(2).replace(".", ",") + " €"; };
  var byId = {}; P.forEach(function (p) { byId[p.id] = p; });
  var stato = { rep: "", q: "", ord: "" }, carrello = {};
  try { carrello = JSON.parse(localStorage.getItem("af-carrello") || "{}") || {}; } catch (e) { carrello = {}; }
  Object.keys(carrello).forEach(function (k) { if (!byId[k]) delete carrello[k]; });
  function salva() { try { localStorage.setItem("af-carrello", JSON.stringify(carrello)); } catch (e) {} }

  // reparti
  var bar = $("#af-reparti");
  ["Tutti"].concat(REP).forEach(function (r) {
    var b = document.createElement("button"); b.type = "button"; b.textContent = r;
    b.setAttribute("aria-pressed", r === "Tutti" ? "true" : "false");
    b.onclick = function () { stato.rep = r === "Tutti" ? "" : r; [].forEach.call(bar.children, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); disegna(); };
    bar.appendChild(b);
  });
  $("#af-ordina").onchange = function () { stato.ord = this.value; disegna(); };
  var q = $("#af-q"); q.oninput = function () { stato.q = q.value.trim().toLowerCase(); disegna(); };
  $("#af-q-btn").onclick = function () { stato.q = q.value.trim().toLowerCase(); disegna(); $("#af-prodotti").scrollIntoView({ behavior: "smooth" }); };

  function disegna() {
    var l = P.filter(function (p) { return (!stato.rep || p.rep === stato.rep) && (!stato.q || (p.nome + " " + p.breve + " " + p.rep).toLowerCase().indexOf(stato.q) >= 0); });
    if (stato.ord === "su") l.sort(function (a, b) { return a.prezzo - b.prezzo; });
    if (stato.ord === "giu") l.sort(function (a, b) { return b.prezzo - a.prezzo; });
    if (stato.ord === "nome") l.sort(function (a, b) { return a.nome.localeCompare(b.nome); });
    $("#af-conta").textContent = l.length + (l.length === 1 ? " prodotto" : " prodotti");
    $("#af-prodotti").innerHTML = l.length ? l.map(function (p) {
      return '<article class="af-prod"><button class="apri-p" type="button" data-scheda="' + p.id + '" aria-label="Apri la scheda di ' + esc(p.nome) + '"><img src="' + p.img + '" alt="' + esc(p.nome) + '" loading="lazy"></button>' +
        '<div class="t"><span class="rep">' + esc(p.rep) + '</span><h3>' + esc(p.nome) + '</h3><p>' + esc(p.breve) + '</p>' +
        '<div class="piede-p"><span class="af-prezzo">' + euro(p.prezzo) + '</span><button class="af-agg" type="button" data-agg="' + p.id + '">Aggiungi</button></div></div></article>';
    }).join("") : '<p class="vuoto">Nessun prodotto trovato. Prova un\'altra parola.</p>';
  }

  // carrello
  function aggiungi(id, n) {
    var p = byId[id]; if (!p) return;
    var v = (carrello[id] || 0) + (n || 1);
    if (v > p.max) { v = p.max; avvisa("Massimo " + p.max + " confezioni per questo prodotto."); }
    if (v <= 0) delete carrello[id]; else carrello[id] = v;
    salva(); conta();
  }
  function righe() { return Object.keys(carrello).map(function (k) { return { p: byId[k], n: carrello[k] }; }); }
  function totali() { var s = 0; righe().forEach(function (r) { s += r.p.prezzo * r.n; }); var sp = s === 0 || s >= GRATIS ? 0 : SPED; return { sub: s, sped: sp, tot: s + sp }; }
  function conta() { var n = 0; righe().forEach(function (r) { n += r.n; }); $("#af-num").textContent = n; if (!$("#af-carrello").hidden) passo(passoOra); }
  var toast;
  function avvisa(t) { if (!toast) { toast = document.createElement("div"); toast.style.cssText = "position:fixed;left:50%;bottom:86px;transform:translateX(-50%);background:#16304D;color:#fff;padding:12px 18px;border-radius:12px;z-index:60;font-weight:600;max-width:90vw;text-align:center"; document.body.appendChild(toast); } toast.textContent = t; toast.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { toast.hidden = true; }, 2200); }

  var passoOra = 1;
  function apri() { $("#af-velo").hidden = false; $("#af-carrello").hidden = false; passo(1); }
  function chiudi() { $("#af-velo").hidden = true; $("#af-carrello").hidden = true; $("#af-scheda").hidden = true; }
  function passi(n) { return '<div class="af-passi-c">' + ["Carrello", "Consegna", "Conferma"].map(function (t, i) { return '<span class="' + (i + 1 <= n ? "on" : "") + '">' + (i + 1) + ". " + t + "</span>"; }).join("") + "</div>"; }
  function passo(n) {
    passoOra = n; var c = $("#af-corpo-c"), f = $("#af-piede-c"), t = totali(), rr = righe();
    if (!rr.length && n < 4) { $("#af-titolo-c").textContent = "Il tuo carrello"; c.innerHTML = '<p class="vuoto">Il carrello è vuoto. Aggiungi un prodotto dal negozio.</p>'; f.innerHTML = '<button class="btn" type="button" data-chiudi style="width:100%">Continua gli acquisti</button>'; return; }
    var manca = Math.max(0, GRATIS - t.sub);
    var sped = '<div class="af-sped">' + (manca > 0 ? "Ti mancano <strong>" + euro(manca) + "</strong> per la consegna gratuita." : "<strong>Consegna gratuita</strong> raggiunta.") + '<i><b style="width:' + Math.min(100, t.sub / GRATIS * 100) + '%"></b></i></div>';
    var tot = '<div class="af-tot"><span>Prodotti</span><span>' + euro(t.sub) + '</span></div><div class="af-tot"><span>Consegna</span><span>' + (t.sped ? euro(t.sped) : "Gratis") + '</span></div><div class="af-tot grande"><span>Totale</span><span>' + euro(t.tot) + "</span></div>";
    if (n === 1) {
      $("#af-titolo-c").textContent = "Il tuo carrello";
      c.innerHTML = passi(1) + sped + rr.map(function (r) { return '<div class="af-riga"><img src="' + r.p.img + '" alt=""><div><b>' + esc(r.p.nome) + '</b><span class="af-qta"><button type="button" data-meno="' + r.p.id + '" aria-label="Togli uno">−</button>' + r.n + '<button type="button" data-piu="' + r.p.id + '" aria-label="Aggiungi uno">+</button></span></div><strong>' + euro(r.p.prezzo * r.n) + "</strong></div>"; }).join("");
      f.innerHTML = tot + '<button class="btn" type="button" data-passo="2" style="width:100%;margin-top:10px">Procedi</button>';
    } else if (n === 2) {
      $("#af-titolo-c").textContent = "Consegna";
      c.innerHTML = passi(2) + '<form class="modulo" id="af-dati" onsubmit="return false">' +
        '<div class="due"><label>Nome e cognome<input required type="text" autocomplete="name" id="af-nome"></label><label>Telefono<input required type="tel" autocomplete="tel" id="af-tel"></label></div>' +
        '<label>Mail<input required type="email" autocomplete="email" id="af-mail"></label>' +
        '<label>Indirizzo di consegna<input required type="text" autocomplete="street-address" id="af-ind"></label>' +
        '<div class="due"><label>Città<input required type="text" data-comuni id="af-citta"></label><label>Fascia oraria<select id="af-fascia"><option>9–11</option><option>11–13</option><option>15–17</option><option selected>18–20</option></select></label></div>' +
        '<label>Come vuoi ricevere<select id="af-modo"><option>Consegna a casa</option><option>Ritiro in farmacia</option></select></label></form>';
      f.innerHTML = tot + '<div class="btns" style="margin-top:10px"><button class="btn linea" type="button" data-passo="1">Indietro</button><button class="btn" type="button" data-passo="3" style="flex:1">Continua</button></div>';
    } else if (n === 3) {
      var form = $("#af-dati");
      if (form && !form.checkValidity()) { form.reportValidity(); passoOra = 2; return; }
      if (form) { stato.dati = { nome: $("#af-nome").value, tel: $("#af-tel").value, mail: $("#af-mail").value, ind: $("#af-ind").value, citta: $("#af-citta").value, fascia: $("#af-fascia").value, modo: $("#af-modo").value }; }
      var d = stato.dati || {};
      var testo = rr.map(function (r) { return r.n + " × " + r.p.nome + " (" + euro(r.p.prezzo * r.n) + ")"; }).join("\n") + "\nTotale: " + euro(t.tot) + "\n" + d.modo + ", " + d.ind + ", " + d.citta + ", fascia " + d.fascia;
      $("#af-titolo-c").textContent = "Conferma la prenotazione";
      c.innerHTML = passi(3) + '<div class="af-avviso" style="margin-bottom:14px"><strong>Non paghi nulla adesso.</strong> AncheFarma apre a breve: prenoti l\'ordine e ti contattiamo quando consegniamo nella tua città, per confermarlo con la farmacia.</div>' +
        rr.map(function (r) { return '<div class="af-riga"><img src="' + r.p.img + '" alt=""><div><b>' + esc(r.p.nome) + "</b><small>" + r.n + " × " + euro(r.p.prezzo) + "</small></div><strong>" + euro(r.p.prezzo * r.n) + "</strong></div>"; }).join("") +
        '<p style="margin:12px 0;color:var(--grigio);font-size:14px">' + esc(d.nome) + " · " + esc(d.modo) + "<br>" + esc(d.ind) + ", " + esc(d.citta) + " · fascia " + esc(d.fascia) + "</p>" +
        '<form class="modulo" data-invia="privato|anchefarma-prenotazione" data-ok="Prenotazione ricevuta. Ti scriviamo appena AncheFarma consegna nella tua città." id="af-invio">' +
        '<label style="display:none">Nome<input type="text" autocomplete="name" value="' + esc(d.nome) + '"></label><label style="display:none">Mail<input type="email" value="' + esc(d.mail) + '"></label><label style="display:none">Telefono<input type="tel" value="' + esc(d.tel) + '"></label><label style="display:none">Città<input type="text" value="' + esc(d.citta) + '"></label>' +
        '<label style="display:none">Ordine<textarea>' + esc(testo) + '</textarea></label>' +
        '<label class="spunta"><input required type="checkbox">Ho letto l\'<a href="privacy.html" style="text-decoration:underline">informativa privacy</a>.</label>' +
        '<button class="btn" type="submit" style="width:100%">Prenota l\'ordine · ' + euro(t.tot) + "</button></form>";
      f.innerHTML = '<button class="btn linea" type="button" data-passo="2" style="width:100%">Indietro</button>';
      collegaInvio();
    }
  }
  // il modulo di prenotazione usa lo stesso invio degli altri moduli del sito (js/ac.js), qui ricollegato perché nasce dopo
  function collegaInvio() {
    var f = $("#af-invio"); if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault(); if (!f.checkValidity()) { f.reportValidity(); return; }
      var dati = { modulo: "anchefarma-prenotazione", pagina: location.pathname, at: new Date().toISOString() };
      [].forEach.call(f.querySelectorAll("label"), function (l) { var c = l.querySelector("input:not([type=checkbox]),textarea"); if (c && c.value) dati[l.childNodes[0].textContent.trim()] = c.value.slice(0, 2000); });
      dati.nome = dati.Nome; dati.email = dati.Mail; dati.telefono = dati.Telefono; dati.zona = dati["Città"];
      var fatto = function () { carrello = {}; salva(); conta(); $("#af-titolo-c").textContent = "Prenotazione ricevuta"; $("#af-corpo-c").innerHTML = '<p class="esito">' + esc(f.getAttribute("data-ok")) + "</p>"; $("#af-piede-c").innerHTML = '<button class="btn" type="button" data-chiudi style="width:100%">Chiudi</button>'; };
      if (!/(^|\.)anchecasa\.it$/.test(location.hostname)) { fatto(); return; }
      var SB = "https://edsvmnxojsmknjuhobqa.supabase.co", K = "sb_publishable_QbYv61SkMkjA9_GGb1hhOA_6v6GEw87";
      fetch(SB + "/rest/v1/richieste_iscrizione", { method: "POST", headers: { apikey: K, Authorization: "Bearer " + K, "Content-Type": "application/json", "Content-Profile": "marketplace", Prefer: "return=minimal" }, body: JSON.stringify({ famiglia: "privato", dati: dati }) })
        .then(function (r) { if (r.ok) fatto(); else throw 0; })
        .catch(function () { location.href = "mailto:info@anchecasa.it?subject=" + encodeURIComponent("Prenotazione AncheFarma") + "&body=" + encodeURIComponent(dati.Ordine || ""); });
    });
  }

  // scheda prodotto
  function scheda(id) {
    var p = byId[id]; if (!p) return;
    var s = $("#af-scheda");
    s.innerHTML = '<div role="dialog" aria-modal="true" aria-label="' + esc(p.nome) + '"><button class="af-chiudi" type="button" data-chiudi aria-label="Chiudi">×</button><img src="' + p.img + '" alt="' + esc(p.nome) + '">' +
      '<div class="info"><span class="rep" style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--arancio)">' + esc(p.rep) + "</span><h2 style=\"font-size:28px\">" + esc(p.nome) + '</h2><p style="color:var(--grigio)">' + esc(p.breve) + '</p><span class="af-prezzo" style="font-size:30px">' + euro(p.prezzo) + "</span>" +
      '<dl><div><dt>Formato</dt><dd>' + esc(p.formato) + "</dd></div><div><dt>A cosa serve</dt><dd>" + esc(p.indicazioni) + "</dd></div><div><dt>Come si usa</dt><dd>" + esc(p.uso) + "</dd></div></dl>" +
      (p.avv ? '<div class="avv">' + esc(p.avv) + "</div>" : "") +
      '<p style="font-size:14px;color:var(--grigio)">Massimo ' + p.max + ' confezioni per ordine. Hai un dubbio? Chiedi al farmacista in chat.</p>' +
      '<button class="btn" type="button" data-agg="' + p.id + '" data-poi-carrello>Aggiungi al carrello</button></div></div>';
    s.hidden = false; $("#af-velo").hidden = false;
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-agg],[data-scheda],[data-chiudi],[data-passo],[data-piu],[data-meno],#af-apri-carrello,#af-velo");
    if (!t) return;
    if (t.id === "af-apri-carrello") return apri();
    if (t.id === "af-velo" || t.hasAttribute("data-chiudi")) return chiudi();
    if (t.hasAttribute("data-agg")) { aggiungi(t.getAttribute("data-agg"), 1); avvisa("Aggiunto al carrello"); if (t.hasAttribute("data-poi-carrello")) { $("#af-scheda").hidden = true; apri(); } return; }
    if (t.hasAttribute("data-scheda")) return scheda(t.getAttribute("data-scheda"));
    if (t.hasAttribute("data-piu")) return aggiungi(t.getAttribute("data-piu"), 1);
    if (t.hasAttribute("data-meno")) return aggiungi(t.getAttribute("data-meno"), -1);
    if (t.hasAttribute("data-passo")) return passo(+t.getAttribute("data-passo"));
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") chiudi(); });

  disegna(); conta();
  var h = location.hash.slice(1); if (byId[h]) scheda(h);
})();
