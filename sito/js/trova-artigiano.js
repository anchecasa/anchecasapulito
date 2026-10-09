/* AncheCasa · SuperMastro: la tua richiesta + Cerca artigiano su cartina (09.10.2026).
   Arriva dalla ricerca della home: supermastro.html?p=<id problema>&c=<città>  oppure  ?q=<testo libero>&c=<città>.
   1. "La tua richiesta": subito il consiglio dal dizionario (js/problemi.js), poi la risposta di SuperMastro
      (POST /api/supermastro con { testo, citta }: stessa risposta JSON del video).
   2. "Cerca artigiano": cartina a metà schermo (Leaflet, mappa CARTO/OpenStreetMap) e sotto l'elenco degli artigiani vicini
      con Chiama; ogni segno sulla cartina, se lo tocchi, dice chi è.
      Dati: OpenStreetMap (Overpass, mestieri per tag craft=…; se pochi, Nominatim per nome). Posizione: città scritta o GPS.
   Gli artigiani certificati DM 37/08 di supermastro.com arrivano da /api/rete-artigiani
   e stanno in cima, con il segno blu. Poi OpenStreetMap. Il più vicino è il primo. */
(function () {
  var P = window.ACProblemi;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var qs = new URLSearchParams(location.search);
  var stato = { voce: null, testo: "", citta: qs.get("c") || "", mestiere: "", centro: null, mappa: null, livello: null, segni: [] };
  // Comune scelto dai suggerimenti della home: arrivano anche le coordinate (nessuna ricerca in più).
  var latQ = parseFloat(qs.get("lat")), lngQ = parseFloat(qs.get("lng"));
  if (stato.citta && isFinite(latQ) && isFinite(lngQ)) stato.coord = { lat: latQ, lng: lngQ, nome: stato.citta };
  try { if (!stato.citta) stato.citta = localStorage.getItem("anchecasa-citta") || ""; } catch (e) { /* storage non disponibile */ }

  /* ---------- mestieri: dal nome (anche quello scelto da SuperMastro) alla chiave del dizionario ---------- */
  var ALIAS = { "tecnico elettrodomestici": "elettrodomestici", "tecnico condizionatori": "clima", "tecnico caldaie": "caldaista", "caldaista": "caldaista",
    "impresa di pulizie": "pulizie", "tapparellista": "tapparelle", "impresa edile": "impresa", "installatore fotovoltaico": "fotovoltaico",
    "cancelli automatici": "automazioni", "allarmi": "sicurezza", "lattoniere": "lattoniere" };
  function chiaveMestiere(nome) {
    if (!P || !nome) return "";
    var n = P.norm(nome);
    if (ALIAS[n]) return ALIAS[n];
    if (P.mestieri[n]) return n;
    var k = Object.keys(P.mestieri).filter(function (x) { return P.norm(P.mestieri[x].nome) === n || P.norm(P.mestieri[x].nome).indexOf(n) === 0 || n.indexOf(x) === 0; })[0];
    return k || "";
  }
  function nomeMestiere(k) { return k && P && P.mestieri[k] ? P.mestieri[k].nome : (k || "artigiano"); }
  function plurale(nome) {
    var n = String(nome);
    return /^(Impresa|Tecnico|Installatore|Manutenzione|Posatore|Allarmi|Cancelli|Tende|Traslochi|Sgomberi|Disinfestazione|Spurgo|Lattoniere)/.test(n) ? n : n.replace(/a$/, "i").replace(/o$/, "i").replace(/e$/, "i");
  }

  /* ---------- 1. la tua richiesta ---------- */
  function richiesta() {
    var id = qs.get("p"), libero = (qs.get("q") || "").trim();
    if (!P || (!id && !libero)) return;
    stato.voce = id ? P.perId(id) : null;
    stato.testo = stato.voce ? stato.voce.t : libero;
    if (!stato.voce && libero) { var r = P.cerca(libero, 1); if (r.length && r[0].l !== "mestiere") stato.ipotesi = r[0]; }
    var base = stato.voce || stato.ipotesi || null;
    stato.mestiere = base ? base.m : "";
    $("richiesta").hidden = false;
    $("r-titolo").textContent = stato.testo.charAt(0).toUpperCase() + stato.testo.slice(1);
    $("r-dove").textContent = stato.citta ? "A " + stato.citta : "Scrivi la città quando cerchi l’artigiano";
    stato.guida = base && base.g ? base.g : null;
    if (base && base.l !== "mestiere") mostraRisposta({ fai: base.f, mestiere: base.m, descrizione: base.c, passi: stato.guida ? stato.guida.p : [], attrezzi: stato.guida ? stato.guida.a : [], tempo: stato.guida ? stato.guida.tm : "", difficolta: stato.guida ? stato.guida.d : "", avvertenze: [], provvisoria: true });
    else if (base) mostraRisposta({ fai: false, mestiere: base.m, descrizione: "Ti mostro chi fa questo lavoro vicino a te. Se mi fai vedere il problema con un video di 5 secondi, te lo spiego prima.", passi: [], avvertenze: [], provvisoria: true });
    else { $("r-verdetto").textContent = "Sto pensando…"; $("r-desc").textContent = "SuperMastro sta leggendo la tua richiesta."; }
    $("r-cerca").addEventListener("click", function () { apri({ mestiere: stato.mestiere, titolo: stato.testo }); });
    if (base && base.l === "mestiere") return; // ha cercato un mestiere: niente diagnosi, si va dritti all'elenco
    chiediASuperMastro();
    setTimeout(function () { var el = $("richiesta"); if (el && location.hash === "#richiesta") el.scrollIntoView({ block: "start" }); }, 60);
  }
  function chiediASuperMastro() {
    $("r-pensa").hidden = false;
    fetch("/api/supermastro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ testo: stato.testo, citta: stato.citta }) })
      .then(function (r) { if (!r.ok) throw new Error("analisi"); return r.json(); })
      .then(function (d) {
        if (!d || !d.problema) throw new Error("analisi");
        var k = chiaveMestiere(d.mestiere) || stato.mestiere;
        if (k) stato.mestiere = k;
        mostraRisposta(daRispostaAI(d));
      })
      .catch(function () {
        if (!stato.mestiere) mostraRisposta({ fai: false, mestiere: "", descrizione: "Non ho capito bene. Fammi vedere il problema con un video di 5 secondi, oppure cerca direttamente l’artigiano.", passi: [], avvertenze: [] });
      })
      .then(function () { $("r-pensa").hidden = true; });
  }
  // Risposta di SuperMastro (testo o video) -> dati della scheda. Se l'AI non dà passi o attrezzi, si usano quelli della guida.
  function daRispostaAI(d) {
    if (d.fuori_tema === true) return { fuoriTema: true, problema: d.problema, descrizione: d.descrizione, mestiere: "", fai: false, passi: [], attrezzi: [], avvertenze: [] };
    var g = stato.guida, fai = d.fai_da_te === true && d.pericolo !== true;
    var passi = (d.passi || []).filter(Boolean), attrezzi = (d.attrezzi || []).filter(Boolean);
    return { fai: fai, pericolo: d.pericolo === true, urgenza: d.urgenza, mestiere: stato.mestiere, problema: d.problema, descrizione: d.descrizione,
      passi: fai ? (passi.length >= 3 || !g ? passi : g.p) : [], attrezzi: fai ? (attrezzi.length || !g ? attrezzi : g.a) : [],
      tempo: fai ? (d.tempo || (g && g.tm) || "") : "", difficolta: fai ? (d.difficolta || (g && g.d) || "") : "", avvertenze: d.avvertenze || [] };
  }
  // Arriva dal video di 5 secondi (js/ac.js): stessa scheda, in cima alla pagina.
  function risposta(d) {
    var k = chiaveMestiere(d.mestiere);
    if (k) stato.mestiere = k;
    var r = P ? P.cerca(d.problema || "", 1) : [];
    stato.guida = r.length && r[0].g ? r[0].g : null;
    stato.testo = d.problema || "Il tuo video";
    stato.fonte = "video";
    $("richiesta").hidden = false;
    $("r-titolo").textContent = stato.testo;
    $("r-dove").textContent = "Dal tuo video";
    $("r-pensa").hidden = true;
    mostraRisposta(daRispostaAI(d));
    if (!$("r-cerca").dataset.pronto) { $("r-cerca").dataset.pronto = "1"; $("r-cerca").addEventListener("click", function () { apri({ mestiere: stato.mestiere, titolo: stato.testo }); }); }
    $("richiesta").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function mostraRisposta(x) {
    stato.ultima = { problema: x.problema || stato.testo, mestiere: nomeMestiere(x.mestiere), fuori: !!x.fuoriTema };
    votoPronto();
    var nome = nomeMestiere(x.mestiere);
    var v = x.fuoriTema ? "Questo non è un problema di casa" : x.pericolo ? "Attenzione: non farlo da solo" : x.fai ? "Puoi provarci tu" : x.mestiere ? "Serve un " + nome.toLowerCase() : "Vediamolo insieme";
    $("r-verdetto").textContent = v;
    $("r-risposta").className = "pannello sm-r-risposta " + (x.fuoriTema ? "is-fuori" : x.pericolo ? "is-pericolo" : x.fai ? "is-fai" : "is-chiama");
    $("r-problema").textContent = x.problema || "";
    $("r-problema").hidden = !x.problema;
    $("r-desc").textContent = x.descrizione || "";
    var passi = x.fai ? (x.passi || []).filter(Boolean) : [];
    var attrezzi = x.fai ? (x.attrezzi || []).filter(Boolean) : [];
    $("r-passi").innerHTML = passi.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("");
    $("r-attrezzi").innerHTML = attrezzi.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("");
    $("r-guida").hidden = !(passi.length || attrezzi.length);
    $("r-box-attrezzi").hidden = !attrezzi.length;
    $("r-box-passi").hidden = !passi.length;
    $("r-tempo").textContent = x.tempo ? "Tempo: " + x.tempo : "";
    $("r-tempo").hidden = !x.tempo;
    $("r-diff").textContent = x.difficolta ? "Difficoltà: " + x.difficolta : "";
    $("r-diff").className = "sm-r-chip diff-" + (x.difficolta || "");
    $("r-diff").hidden = !x.difficolta;
    var avv = (x.avvertenze || []).filter(Boolean);
    $("r-avvisi").innerHTML = avv.length ? "<b>Quando fermarti:</b> " + avv.map(esc).join(" ") : "";
    $("r-avvisi").hidden = !avv.length;
    $("r-urgenza").textContent = x.urgenza ? "Urgenza " + x.urgenza : "";
    $("r-urgenza").hidden = !x.urgenza;
    // Fuori tema: niente ricerca di artigiani, solo l'invito a mostrare un problema di casa.
    $("r-cerca").hidden = !!x.fuoriTema;
    $("r-pro-titolo").textContent = x.fuoriTema ? "Hai un problema in casa, in giardino, al prato o al recinto? Fammelo vedere." : x.fai ? "Preferisci che lo faccia un professionista?" : "Ti serve un professionista";
    $("r-cerca").textContent = x.mestiere ? "Cerca un " + nome.toLowerCase() + " vicino a te" : "Cerca un professionista";
  }

  /* ---------- 2. cerca artigiano: cartina + elenco ---------- */
  function apri(o) {
    var k = chiaveMestiere(o.mestiere) || o.mestiere || stato.mestiere;
    stato.mestiere = k;
    var sez = $("artigiani");
    sez.hidden = false;
    $("a-titolo").textContent = plurale(nomeMestiere(k)) + " vicino a te";
    $("a-citta").value = stato.citta;
    preparaMappa();
    sez.scrollIntoView({ behavior: "smooth", block: "start" });
    if (stato.citta) daCitta(stato.citta);
    else if (navigator.geolocation) {
      scrivi("Cerco dove sei…");
      navigator.geolocation.getCurrentPosition(function (g) {
        stato.centro = { lat: g.coords.latitude, lng: g.coords.longitude, nome: "la tua posizione" };
        cercaArtigiani();
      }, function () { scrivi("Scrivi la città qui sopra e premi Cerca."); $("a-citta").focus(); }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 });
    } else { scrivi("Scrivi la città qui sopra e premi Cerca."); $("a-citta").focus(); }
  }
  function scrivi(t) { $("a-stato").textContent = t; }
  function preparaMappa() {
    if (stato.mappa || !window.L) return;
    stato.mappa = L.map("a-mappa", { scrollWheelZoom: false, zoomControl: true }).setView([42.5, 12.5], 6);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19, subdomains: "abcd",
      attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> &copy; <a href=\"https://carto.com/attributions\">CARTO</a>"
    }).addTo(stato.mappa);
    stato.livello = L.layerGroup().addTo(stato.mappa);
  }
  function daCitta(citta) {
    stato.citta = citta;
    if (stato.coord && stato.coord.nome === citta) { stato.centro = stato.coord; cercaArtigiani(); return; }
    try { localStorage.setItem("anchecasa-citta", citta); } catch (e) { /* storage non disponibile */ }
    scrivi("Cerco a " + citta + "…");
    fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=it&q=" + encodeURIComponent(citta))
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (a) {
        if (!a || !a[0]) throw new Error();
        stato.centro = { lat: parseFloat(a[0].lat), lng: parseFloat(a[0].lon), nome: citta };
        cercaArtigiani();
      })
      .catch(function () { scrivi("Non trovo «" + citta + "». Prova con il nome del Comune o il CAP."); disegna([]); });
  }
  function km(a, b, c, d) {
    var R = 6371, p = Math.PI / 180, x = (c - a) * p, y = (d - b) * p;
    var h = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a * p) * Math.cos(c * p) * Math.sin(y / 2) * Math.sin(y / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function cercaArtigiani() {
    var c = stato.centro, m = P && P.mestieri[stato.mestiere];
    var nome = nomeMestiere(stato.mestiere);
    scrivi("Cerco " + plurale(nome).toLowerCase() + " vicino a " + c.nome + "…");
    if (stato.mappa) stato.mappa.setView([c.lat, c.lng], 13);
    // RETE ANCHECASA: prima di OpenStreetMap, gli artigiani certificati della rete
    // (supermastro.com, DM 37/08, il più vicino per primo).
    // Stessi campi { nome, lat, lng, tel, indirizzo, sito, rete: true }.
    var rete = fetch("/api/rete-artigiani", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mestiere: stato.mestiere, lat: c.lat, lng: c.lng })
    }).then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (j) { return (j && j.artigiani) || []; })
      .catch(function () { return []; });
    var tags = (m && m.osm) || [];
    var giri = [12000, 30000, 50000]; // nei paesi piccoli il raggio si allarga da solo
    function overpass(r) {
      if (!tags.length) return Promise.resolve([]);
      var q = "[out:json][timeout:20];(" + tags.map(function (t) { return "nwr" + t + "(around:" + r + "," + c.lat + "," + c.lng + ");"; }).join("") + ");out center tags 60;";
      return fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" } })
        .then(function (x) { if (!x.ok) throw new Error(); return x.json(); })
        .then(function (j) {
          return (j.elements || []).map(function (e) {
            var t = e.tags || {}, lat = e.lat || (e.center && e.center.lat), lng = e.lon || (e.center && e.center.lon);
            if (!t.name || lat == null) return null;
            return { nome: t.name, lat: lat, lng: lng, tel: (t.phone || t["contact:phone"] || t["contact:mobile"] || "").split(";")[0].trim(),
              indirizzo: [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ") + (t["addr:city"] ? ", " + t["addr:city"] : ""),
              sito: t.website || t["contact:website"] || "" };
          }).filter(Boolean);
        }).catch(function () { return []; });
    }
    function nominatim() {
      var d = 0.12, view = (c.lng - d) + "," + (c.lat + d) + "," + (c.lng + d) + "," + (c.lat - d);
      return fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=15&extratags=1&addressdetails=1&bounded=1&viewbox=" + view + "&q=" + encodeURIComponent(nome))
        .then(function (x) { if (!x.ok) throw new Error(); return x.json(); })
        .then(function (a) {
          var salta = { residential: 1, bus_stop: 1, street: 1, road: 1, highway: 1, suburb: 1, city: 1, administrative: 1, neighbourhood: 1, postcode: 1 };
          return (a || []).filter(function (e) { return !salta[e.type] && !salta[e.class]; }).map(function (e) {
            var x = e.extratags || {}, ad = e.address || {};
            return { nome: e.name || (e.display_name || "").split(",")[0], lat: parseFloat(e.lat), lng: parseFloat(e.lon), tel: (x.phone || x["contact:phone"] || "").split(";")[0].trim(),
              indirizzo: [ad.road, ad.house_number].filter(Boolean).join(" ") + (ad.city || ad.town || ad.village ? ", " + (ad.city || ad.town || ad.village) : ""), sito: x.website || "" };
          });
        }).catch(function () { return []; });
    }
    Promise.all([
      rete,
      overpass(giri[0])
        .then(function (l) { return l.length >= 4 ? l : overpass(giri[1]).then(function (l2) { return l2.length > l.length ? l2 : l; }); })
        .then(function (l) { return l.length >= 3 ? l : overpass(giri[2]).then(function (l3) { return l3.length > l.length ? l3 : l; }); })
        .then(function (l) { return l.length >= 3 ? l : nominatim().then(function (n) { return l.concat(n); }); })
    ]).then(function (parti) {
      var certificati = parti[0].slice().sort(function (a, b) { return a.dist - b.dist; });
      var l = parti[1];
      var visti = {};
      certificati.forEach(function (x) { visti[P.norm(x.nome)] = 1; });
      l = l.filter(function (x) { var k = P.norm(x.nome); if (!k || visti[k]) return false; visti[k] = 1; return true; });
      l.forEach(function (x) { x.dist = km(c.lat, c.lng, x.lat, x.lng); });
      l.sort(function (a, b) { return a.dist - b.dist; });
      disegna(certificati.concat(l).slice(0, 20));
    });
  }
  function distanza(d) { return d < 1 ? Math.round(d * 1000) + " m" : d.toFixed(1).replace(".", ",") + " km"; }
  function mapsUrl(x) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(x.nome + " " + x.lat + "," + x.lng); }
  function popup(x) {
    return '<div class="sm-pop"><strong>' + esc(x.nome) + "</strong><small>" + esc(nomeMestiere(stato.mestiere)) + " · " + distanza(x.dist) + (x.rete ? " · Certificato DM 37/08" : "") + "</small>" +
      (x.indirizzo ? "<span>" + esc(x.indirizzo) + "</span>" : "") +
      '<div class="b">' + (x.tel ? '<a class="chiama" href="tel:' + esc(x.tel.replace(/\s/g, "")) + '">Chiama ' + esc(x.tel) + "</a>" : "") +
      '<a href="' + esc(mapsUrl(x)) + '" target="_blank" rel="noopener">Indicazioni</a>' + (x.sito ? '<a href="' + esc(x.sito) + '" target="_blank" rel="noopener">Sito</a>' : "") + "</div></div>";
  }
  function disegna(lista) {
    var el = $("a-lista");
    stato.segni = [];
    if (stato.livello) stato.livello.clearLayers();
    var nome = nomeMestiere(stato.mestiere);
    if (!lista.length) {
      scrivi("Qui vicino non trovo " + plurale(nome).toLowerCase() + " con i dati pubblicati.");
      el.innerHTML = '<div class="sm-a-vuoto"><p>Prova un’altra città, oppure apri la ricerca su Google Maps.</p><a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/' + encodeURIComponent(nome + " " + (stato.citta || "")) + '">Cerca su Google Maps</a></div>';
      return;
    }
    scrivi(lista.length + " " + (lista.length === 1 ? nome.toLowerCase() : plurale(nome).toLowerCase()) + " vicino a " + stato.centro.nome + ". Tocca un segno sulla cartina per sapere chi è.");
    if (stato.mappa && window.L) {
      var punti = [];
      L.marker([stato.centro.lat, stato.centro.lng], { icon: L.divIcon({ className: "sm-io", html: "<i></i>", iconSize: [18, 18] }), title: "Tu sei qui" }).addTo(stato.livello);
      lista.forEach(function (x, i) {
        var mk = L.marker([x.lat, x.lng], { icon: L.divIcon({ className: "sm-pin" + (x.rete ? " is-rete" : ""), html: "<b><span>" + (i + 1) + "</span></b>", iconSize: [30, 38], iconAnchor: [15, 36], popupAnchor: [0, -32] }), title: x.nome })
          .bindPopup(popup(x), { maxWidth: 260 }).addTo(stato.livello);
        mk.on("click", function () { evidenzia(i); });
        stato.segni.push(mk);
        punti.push([x.lat, x.lng]);
      });
      punti.push([stato.centro.lat, stato.centro.lng]);
      stato.mappa.fitBounds(punti, { padding: [36, 36], maxZoom: 15 });
    }
    el.innerHTML = lista.map(function (x, i) {
      return '<article class="sm-a-riga' + (x.rete ? " is-rete" : "") + '" data-i="' + i + '"><button type="button" class="n" data-mappa="' + i + '" aria-label="Mostra sulla cartina">' + (i + 1) + '</button>' +
        '<div class="tx"><strong>' + esc(x.nome) + "</strong><small>" + distanza(x.dist) + (x.rete ? " · Certificato DM 37/08" : "") + (x.indirizzo ? " · " + esc(x.indirizzo) : "") + "</small></div>" +
        '<div class="az">' + (x.tel ? '<a class="btn" href="tel:' + esc(x.tel.replace(/\s/g, "")) + '">Chiama</a>' : '<a class="btn linea" target="_blank" rel="noopener" href="' + esc(mapsUrl(x)) + '">Apri e chiama</a>') +
        '<button type="button" class="btn linea" data-mappa="' + i + '">Cartina</button></div></article>';
    }).join("");
  }
  function evidenzia(i) {
    Array.prototype.forEach.call(document.querySelectorAll(".sm-a-riga"), function (r) { r.classList.toggle("on", +r.getAttribute("data-i") === i); });
    var riga = document.querySelector('.sm-a-riga[data-i="' + i + '"]');
    if (riga && window.matchMedia("(min-width: 900px)").matches) riga.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-mappa]");
    if (!b) return;
    var i = +b.getAttribute("data-mappa"), mk = stato.segni[i];
    evidenzia(i);
    if (mk && stato.mappa) {
      $("a-mappa").scrollIntoView({ behavior: "smooth", block: "center" });
      stato.mappa.flyTo(mk.getLatLng(), 15, { duration: .6 });
      setTimeout(function () { mk.openPopup(); }, 650);
    }
  });
  var ac = $("a-citta");
  if (ac) ac.addEventListener("comune", function (e) {
    var v = e.detail; if (!v) return;
    stato.citta = v.nome; stato.coord = { lat: v.lat, lng: v.lng, nome: v.nome };
    try { localStorage.setItem("anchecasa-citta", v.nome); } catch (er) { /* storage non disponibile */ }
    if (!$("artigiani").hidden) { stato.centro = stato.coord; cercaArtigiani(); }
  });
  var f = $("a-citta-form");
  if (f) f.addEventListener("submit", function (e) { e.preventDefault(); var c = $("a-citta").value.trim(); if (!c) { $("a-citta").focus(); return; } daCitta(c); });

  /* ---------- pollice: SuperMastro ha capito? (api/supermastro-voto.js) ---------- */
  function votoPronto() {
    var box = $("r-voto"); if (!box) return;
    box.classList.remove("fatto");
    Array.prototype.forEach.call(box.querySelectorAll("[data-voto]"), function (b) { b.disabled = false; b.classList.remove("on"); });
    $("r-corr").hidden = true; $("r-grazie").hidden = true; $("r-corr-t").value = "";
  }
  function inviaVoto(voto, correzione) {
    var u = stato.ultima || {};
    var corpo = { voto: voto, fonte: stato.fonte || "testo", richiesta: stato.testo || "", problema: u.problema || "", mestiere: u.mestiere || "", correzione: correzione || "", citta: stato.citta || "" };
    if (window.ACMagStat) { /* niente: le statistiche della rivista sono un'altra cosa */ }
    return fetch("/api/supermastro-voto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo), keepalive: true }).catch(function () {});
  }
  (function () {
    var box = $("r-voto"); if (!box) return;
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-voto]"); if (!b || b.disabled) return;
      var v = +b.getAttribute("data-voto");
      Array.prototype.forEach.call(box.querySelectorAll("[data-voto]"), function (x) { x.disabled = true; x.classList.toggle("on", x === b); });
      if (v === 1) { inviaVoto(1); box.classList.add("fatto"); $("r-grazie").textContent = "Grazie! Così SuperMastro diventa più bravo."; $("r-grazie").hidden = false; }
      else { $("r-corr").hidden = false; $("r-corr-t").focus(); }
    });
    $("r-corr").addEventListener("submit", function (e) {
      e.preventDefault();
      var t = $("r-corr-t").value.trim();
      inviaVoto(-1, t);
      $("r-corr").hidden = true; box.classList.add("fatto");
      $("r-grazie").textContent = t ? "Grazie! Lo controlliamo e SuperMastro impara: la prossima volta lo riconosce." : "Grazie, ne teniamo conto.";
      $("r-grazie").hidden = false;
    });
  })();

  window.ACTrova = { apri: apri, risposta: risposta };
  richiesta();
})();
/* PC: il video si fa dal telefono. "Copia il link" della pagina SuperMastro. */
(function () {
  var b = document.getElementById("sm-copia-link");
  if (!b) return;
  b.addEventListener("click", function () {
    var link = "https://anchecasa.it/supermastro";
    var ok = function () { b.textContent = "Link copiato"; setTimeout(function () { b.textContent = "Copia il link"; }, 2200); };
    try { if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(link).then(ok, function () {}); return; } } catch (e) { /* metodo vecchio */ }
    var t = document.createElement("textarea"); t.value = link; document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); ok(); } catch (e2) { /* niente */ }
    t.remove();
  });
})();
