/* AncheCasa · Comuni d'Italia mentre scrivi (09.10.2026).
   Si aggancia ai campi con data-comuni (home "Dove?", SuperMastro "Città o CAP").
   Suggerimenti da Photon (photon.komoot.io, dati OpenStreetMap, pensato per l'autocompletamento): città, paesi e frazioni,
   solo in Italia, con la provincia. Scelto il Comune, il campo tiene anche le coordinate (data-lat, data-lng):
   la ricerca degli artigiani parte da lì senza altri passaggi. Se il servizio non risponde, il campo resta un testo
   normale e la città si cerca con Nominatim al momento della ricerca: funziona comunque per ogni Comune o CAP. */
(function () {
  var TIPI = { city: 1, town: 1, village: 1, hamlet: 1, municipality: 1, suburb: 1, locality: 1, isolated_dwelling: 0 };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function attacca(input) {
    if (input.dataset.comuniPronto) return;
    input.dataset.comuniPronto = "1";
    input.setAttribute("autocomplete", "off");
    var box = document.createElement("div");
    box.className = "comuni-sugg";
    box.hidden = true;
    box.setAttribute("role", "listbox");
    var padre = input.parentNode;
    if (getComputedStyle(padre).position === "static") padre.style.position = "relative";
    padre.appendChild(box);
    var timer = null, voci = [], attivo = -1, ultima = "";
    function pulisci() { delete input.dataset.lat; delete input.dataset.lng; delete input.dataset.prov; }
    function scegli(i) {
      var v = voci[i]; if (!v) return;
      input.value = v.nome;
      input.dataset.lat = v.lat; input.dataset.lng = v.lng; input.dataset.prov = v.prov || "";
      box.hidden = true;
      input.dispatchEvent(new CustomEvent("comune", { bubbles: true, detail: v }));
    }
    function disegna() {
      if (!voci.length) { box.hidden = true; return; }
      box.innerHTML = voci.map(function (v, i) {
        return '<button type="button" role="option" data-i="' + i + '"><b>' + esc(v.nome) + "</b><small>" + esc([v.prov, v.reg].filter(Boolean).join(" · ")) + (v.cap ? " · " + esc(v.cap) : "") + "</small></button>";
      }).join("");
      box.hidden = false;
      attivo = -1;
    }
    function cerca() {
      var q = input.value.trim();
      if (q.length < 2 || q === ultima) { if (q.length < 2) box.hidden = true; return; }
      ultima = q;
      var url = "https://photon.komoot.io/api/?lang=it&limit=10&bbox=6.6,35.4,18.6,47.2&q=" + encodeURIComponent(q);
      fetch(url).then(function (r) { if (!r.ok) throw new Error(); return r.json(); }).then(function (j) {
        if (input.value.trim() !== q) return;
        var visti = {};
        voci = (j.features || []).filter(function (f) {
          var p = f.properties || {};
          return p.countrycode === "IT" && ((p.osm_key === "place" && TIPI[p.osm_value]) || (p.osm_key === "boundary" && p.osm_value === "administrative" && p.type === "city"));
        }).map(function (f) {
          var p = f.properties, c = f.geometry.coordinates;
          return { nome: p.name, prov: p.county || "", reg: p.state || "", cap: p.postcode || "", lat: c[1], lng: c[0] };
        }).filter(function (v) { var k = v.nome + "|" + v.prov; if (visti[k]) return false; visti[k] = 1; return true; }).slice(0, 6);
        disegna();
      }).catch(function () { voci = []; box.hidden = true; });
    }
    input.addEventListener("input", function () { pulisci(); clearTimeout(timer); timer = setTimeout(cerca, 220); });
    input.addEventListener("keydown", function (e) {
      if (box.hidden || !voci.length) return;
      var b = box.querySelectorAll("button");
      if (e.key === "ArrowDown") { e.preventDefault(); attivo = Math.min(voci.length - 1, attivo + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); attivo = Math.max(0, attivo - 1); }
      else if (e.key === "Enter" && attivo >= 0) { e.preventDefault(); scegli(attivo); return; }
      else if (e.key === "Escape") { box.hidden = true; return; }
      else return;
      Array.prototype.forEach.call(b, function (x, j) { x.classList.toggle("on", j === attivo); });
    });
    box.addEventListener("mousedown", function (e) { e.preventDefault(); });
    box.addEventListener("click", function (e) { var b = e.target.closest("button[data-i]"); if (b) scegli(+b.getAttribute("data-i")); });
    document.addEventListener("click", function (e) { if (!padre.contains(e.target)) box.hidden = true; });
  }
  function avvia() { Array.prototype.forEach.call(document.querySelectorAll("[data-comuni]"), attacca); }
  window.ACComuni = { attacca: attacca };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia); else avvia();
})();
