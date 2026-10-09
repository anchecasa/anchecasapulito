/* AncheCasa · Ricerca della home (09.10.2026).
   Mentre scrivi ("idr", "taglio erba") suggerisce i problemi di casa e fuori casa con il mestiere giusto
   (dizionario in js/problemi.js). Scegli, scrivi la città, Cerca: si apre SuperMastro con la risposta
   e la ricerca dell'artigiano su cartina (supermastro.html?p=...&c=...). */
(function () {
  var P = window.ACProblemi;
  var form = document.getElementById("cerca");
  if (!P || !form) return;
  var q = document.getElementById("q"), dove = document.getElementById("dove"), sugg = document.getElementById("sugg");
  var scelto = null, voci = [], attivo = -1;
  var SERVIZI = [
    ["Subappalti e appalti", "Appalti e subappalti", "appalti.html", "subappalto appalti gara impresa fornitore materiali"],
    ["Casa in vendita o in affitto", "Bacheca annunci", "bacheca.html", "casa vendita affitto vendo cerco appartamento"],
    ["Alloggio per studenti", "Bacheca annunci", "bacheca.html#studenti", "studenti stanza posto letto alloggio"],
    ["Cerco o offro lavoro", "Bacheca annunci", "bacheca.html#lavoro", "lavoro cerco offro"],
    ["App per la tua attività", "Per le aziende", "app.html", "app gestionale azienda attività"]
  ];
  var ICO = {
    casa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/></svg>',
    fuori: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12c-4 0-6-3-6-6 3 0 6 2 6 6Zm0 0c4 0 6-3 6-6-3 0-6 2-6 6Z"/><path d="M5 22h14"/></svg>',
    mestiere: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-2.4 2.6-2.6Z"/></svg>',
    servizio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8Z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z"/></svg>'
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // Evidenzia nel titolo le parti che corrispondono a quello che si sta scrivendo.
  function evidenzia(titolo, testo) {
    var tok = P.norm(testo).split(" ").filter(function (t) { return t.length >= 2; });
    var out = esc(titolo);
    if (!tok.length) return out;
    var base = P.norm(titolo);
    var segni = new Array(titolo.length).fill(false);
    tok.forEach(function (t) {
      var re = new RegExp("(^| )" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), m;
      while ((m = re.exec(base))) { var s = m.index + m[1].length; for (var i = s; i < s + t.length && i < segni.length; i++) segni[i] = true; }
    });
    if (base.length !== titolo.length) return out; // lettere speciali: niente evidenza, meglio che sbagliata
    var html = "", dentro = false;
    for (var i = 0; i < titolo.length; i++) {
      if (segni[i] && !dentro) { html += "<mark>"; dentro = true; }
      if (!segni[i] && dentro) { html += "</mark>"; dentro = false; }
      html += esc(titolo[i]);
    }
    return html + (dentro ? "</mark>" : "");
  }
  function servizi(testo) {
    var n = P.norm(testo);
    if (n.length < 3) return [];
    return SERVIZI.filter(function (s) { return P.norm(s[0] + " " + s[3]).split(" ").some(function (w) { return w.indexOf(n.split(" ")[0]) === 0; }); }).slice(0, 2);
  }
  function mostra() {
    var testo = q.value.trim();
    scelto = null;
    form.removeAttribute("data-scelto");
    if (testo.length < 2) { sugg.hidden = true; voci = []; return; }
    var r = P.cerca(testo, 6);
    voci = r.map(function (x) {
      var dove = x.l === "fuori" ? "Fuori casa" : x.l === "casa" ? "In casa" : "Mestiere";
      return { tipo: x.l === "mestiere" ? "mestiere" : x.l, html: evidenzia(x.t, testo), tag: (P.mestieri[x.m] || {}).nome || "", sotto: dove, x: x };
    });
    servizi(testo).forEach(function (s) { voci.push({ tipo: "servizio", html: evidenzia(s[0], testo), tag: "", sotto: s[1], href: s[2] }); });
    if (testo.length >= 3) voci.push({ tipo: "ai", html: "Chiedi a SuperMastro: «" + esc(testo) + "»", tag: "", sotto: "Te lo spiega e trova chi chiamare", libero: testo });
    attivo = -1;
    sugg.innerHTML = '<div class="sugg-head">' + (r.length ? "Forse cerchi" : "Non l’ho trovato, ma SuperMastro può capirlo") + "</div>" +
      voci.map(function (v, i) {
        return '<button type="button" class="sugg-v t-' + v.tipo + '" data-i="' + i + '" role="option"><i>' + ICO[v.tipo] + '</i><span class="tx"><b>' + v.html + "</b><small>" + esc(v.sotto) + "</small></span>" + (v.tag ? '<span class="tag">' + esc(v.tag) + "</span>" : "") + "</button>";
      }).join("");
    sugg.hidden = false;
  }
  function evid(i) {
    attivo = i;
    Array.prototype.forEach.call(sugg.querySelectorAll(".sugg-v"), function (b, j) { b.classList.toggle("on", j === i); if (j === i) b.scrollIntoView({ block: "nearest" }); });
  }
  function scegli(i) {
    var v = voci[i];
    if (!v) return;
    if (v.href) { location.href = v.href; return; }
    sugg.hidden = true;
    if (v.libero) { scelto = { libero: v.libero }; q.value = v.libero; }
    else { scelto = v.x; q.value = v.x.t; }
    form.setAttribute("data-scelto", "1");
    if (!dove.value.trim()) dove.focus(); else form.requestSubmit ? form.requestSubmit() : vai();
  }
  function vai() {
    var testo = q.value.trim(), citta = dove.value.trim();
    if (!testo) { q.focus(); return; }
    if (!scelto) { var r = P.cerca(testo, 1); scelto = r.length && P.norm(r[0].t).indexOf(P.norm(testo).split(" ")[0]) >= 0 ? r[0] : { libero: testo }; }
    try { if (citta) localStorage.setItem("anchecasa-citta", citta); } catch (e) { /* storage non disponibile */ }
    var coord = citta && dove.dataset.lat ? "&lat=" + (+dove.dataset.lat).toFixed(5) + "&lng=" + (+dove.dataset.lng).toFixed(5) : "";
    var url = "supermastro.html?" + (scelto.id ? "p=" + encodeURIComponent(scelto.id) : "q=" + encodeURIComponent(scelto.libero)) + (citta ? "&c=" + encodeURIComponent(citta) : "") + coord + "#richiesta";
    location.href = url;
  }
  q.setAttribute("role", "combobox");
  q.setAttribute("aria-autocomplete", "list");
  q.setAttribute("aria-controls", "sugg");
  sugg.setAttribute("role", "listbox");
  q.placeholder = "Es. rubinetto che perde, taglio erba, idraulico";
  try { var c0 = localStorage.getItem("anchecasa-citta"); if (c0 && !dove.value) dove.value = c0; } catch (e) { /* storage non disponibile */ }
  q.addEventListener("input", mostra);
  q.addEventListener("focus", function () { if (q.value.trim().length >= 2 && !form.hasAttribute("data-scelto")) mostra(); });
  q.addEventListener("keydown", function (e) {
    if (sugg.hidden || !voci.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); evid(Math.min(voci.length - 1, attivo + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); evid(Math.max(0, attivo - 1)); }
    else if (e.key === "Enter" && attivo >= 0) { e.preventDefault(); scegli(attivo); }
    else if (e.key === "Escape") { sugg.hidden = true; }
  });
  sugg.addEventListener("mousedown", function (e) { e.preventDefault(); });
  sugg.addEventListener("click", function (e) { var b = e.target.closest(".sugg-v"); if (b) scegli(+b.getAttribute("data-i")); });
  document.addEventListener("click", function (e) { if (!form.contains(e.target)) sugg.hidden = true; });
  form.addEventListener("submit", function (e) { e.preventDefault(); sugg.hidden = true; vai(); });
})();
