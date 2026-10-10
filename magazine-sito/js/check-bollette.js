/* Check Bollette su magazine.anchecasa.it (10.10.2026): lo stesso strumento della rivista (sito/js/magazine.js, pagina 8),
   su una pagina sua. I conti si fanno sul telefono: i numeri della bolletta non vengono inviati. Report PDF con jsPDF.
   Le funzioni di calcolo, testi e PDF sono copiate dalla rivista: se cambiano i prezzi di riferimento, aggiornarli in tutti e due. */
(function () {
  "use strict";
  var NUMERO = { n: 1 };
  var bolletta = { tipo: "luce" };
  var RIF = {
    luce: { prezzo: 0.4343, unita: "kWh", fonte: "ARERA, tutela vulnerabili dal 1° ottobre 2026, tasse incluse" },
    gas: { prezzo: 1.44, unita: "Smc", fonte: "stima Unione Nazionale Consumatori su dati ARERA, ottobre 2026" },
    consumoLuce: { 1: 1400, 2: 2350, 3: 2700, 4: 3450, 5: 5200 },
    consumoGas: { 1: 900, 2: 1200, 3: 1400, 4: 1550, 5: 1700 }
  };
  var STAT = window.ACStat || { traccia: function () {} };
  var $ = function (id) { return document.getElementById(id); };
  if (!$("cb")) return;
  function leggiNumero(v) { var n = parseFloat(String(v == null ? "" : v).replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")); return isFinite(n) ? n : NaN; }

  function euro(n, dec) { return n.toLocaleString("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + " €"; }
  function num(n) { return Math.round(n).toLocaleString("it-IT"); }


  // «l’11%», «l’8%», «l’80%», ma «il 25%»
  function art(n) { var t = String(n); return (/^(8|11|18)/.test(t) && !/^(1[02-79]|8\d\d\d)/.test(t) ? "l’" : "il ") + t; }
  function testiVerdetto(c) {
    var u = c.rif.unita;
    var tPrezzo = {
      ok: "Il tuo costo medio è sotto il riferimento di " + euro(c.rif.prezzo, 2) + "/" + u + ". Stai pagando bene.",
      warn: "Il tuo costo medio è in linea con il riferimento di " + euro(c.rif.prezzo, 2) + "/" + u + ".",
      bad: "Paghi " + art(Math.round((c.rP - 1) * 100)) + "% in più del riferimento di " + euro(c.rif.prezzo, 2) + "/" + u + ". Allineandoti risparmieresti circa " + euro(c.risparmio, 0) + " all’anno: confronta le offerte."
    }[c.vPrezzo];
    var tCons = {
      ok: "Consumi meno di una famiglia simile alla tua (circa " + num(c.rifConsumo) + " " + u + " all’anno).",
      warn: "Consumi come una famiglia simile alla tua (circa " + num(c.rifConsumo) + " " + u + " all’anno).",
      bad: "Consumi " + art(Math.round((c.rC - 1) * 100)) + "% in più di una famiglia simile (circa " + num(c.rifConsumo) + " " + u + " all’anno). Un check di impianti e isolamento può valere più di un cambio di tariffa."
    }[c.vCons];
    var etichetta = { ok: "Bene", warn: "In linea", bad: "Attenzione" };
    return { tPrezzo: tPrezzo, tCons: tCons, ePrezzo: etichetta[c.vPrezzo], eCons: etichetta[c.vCons] };
  }


  function caricaImg(src, cb) {
    var im = new Image();
    im.onload = function () {
      try { var cv = document.createElement("canvas"); cv.width = im.naturalWidth; cv.height = im.naturalHeight; cv.getContext("2d").drawImage(im, 0, 0); cb({ data: cv.toDataURL("image/png"), r: im.naturalWidth / im.naturalHeight }); }
      catch (e) { cb(null); }
    };
    im.onerror = function () { cb(null); };
    im.src = src;
  }
  function caricaLoghi(cb) {
    caricaImg("/img/logo-colore.png", function (colore) {
      caricaImg("/img/anchecasa-payoff-negativo.png", function (bianco) { cb({ colore: colore, bianco: bianco }); });
    });
  }

  function creaPdf(c, loghi) {
    var t = testiVerdetto(c);
    var u = c.rif.unita;
    var luce = bolletta.tipo === "luce";
    var doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
    // colori delle mail AncheCasa
    var NAVY = [22, 48, 77], NAVY2 = [44, 74, 110], ARANCIO = [229, 107, 16], BOTTONE = [196, 93, 12], CHIARO = [255, 241, 228], PESCA = [255, 210, 173],
      ARANCIO_CHIARO = [244, 155, 80], TESTO = [36, 56, 76], MUTO = [102, 117, 138], LINEA = [228, 235, 243], TENUE = [243, 246, 250], PIEDE = [213, 222, 234];
    var COL = { ok: [47, 125, 77], warn: [196, 132, 18], bad: [194, 65, 43] };
    var fill = function (k) { doc.setFillColor(k[0], k[1], k[2]); };
    var draw = function (k) { doc.setDrawColor(k[0], k[1], k[2]); };
    var ink = function (k) { doc.setTextColor(k[0], k[1], k[2]); };
    var font = function (stile, size) { doc.setFont("helvetica", stile); doc.setFontSize(size); };
    var oggi = new Date();
    var codice = "AC-CB-" + oggi.getFullYear() + String(oggi.getMonth() + 1).padStart(2, "0") + String(oggi.getDate()).padStart(2, "0") + "-" + String(oggi.getHours()).padStart(2, "0") + String(oggi.getMinutes()).padStart(2, "0");
    var L = 20, R = 190, W = R - L;
    var sezione = function (testo, y) { font("bold", 8); ink(ARANCIO); doc.text(testo.toUpperCase(), L, y, { charSpace: 0.6 }); draw(LINEA); doc.setLineWidth(0.25); doc.line(L, y + 2.2, R, y + 2.2); };

    // ---- testata come la mail: logo a sinistra, anchecasa.it a destra, filo arancio
    var lg = loghi && loghi.colore;
    if (lg) { var lh = 11; doc.addImage(lg.data, "PNG", L, 13, lh * lg.r, lh); }
    else { font("bold", 18); ink(NAVY); doc.text("AncheCasa", L, 22); }
    font("bold", 9.5); ink(NAVY); doc.text("anchecasa.it", R, 20.5, { align: "right" });
    fill(ARANCIO); doc.rect(L, 28.5, W, 0.7, "F");

    // ---- etichetta e titolo
    var et = "REPORT CHECK BOLLETTE · " + (luce ? "LUCE" : "GAS");
    font("bold", 7.5); var ew = doc.getTextWidth(et) + et.length * 0.35 + 8;
    fill(CHIARO); doc.roundedRect(L, 35, ew, 6, 3, 3, "F");
    ink(BOTTONE); doc.text(et, L + 4, 39.1, { charSpace: 0.35 });
    font("bold", 18); ink(NAVY); doc.text("La tua bolletta " + (luce ? "della luce" : "del gas") + ", letta.", L, 51);
    font("normal", 9); ink(MUTO); doc.text("Analisi del " + oggi.toLocaleDateString("it-IT") + "  ·  report n. " + codice, L, 57);

    // ---- il risultato
    var y = 66;
    sezione("Il risultato", y);
    var pct = Math.round((c.rP - 1) * 100);
    var frase = { bad: "Paghi " + art(pct) + "% in più del giusto", warn: "Il tuo prezzo è nella media", ok: "Il tuo prezzo è buono" }[c.vPrezzo];
    font("bold", 19); ink(COL[c.vPrezzo]); doc.text(frase, L, y + 12);
    if (c.risparmio > 0) {
      font("normal", 10); ink(TESTO); doc.text("Allineandoti al prezzo giusto puoi risparmiare circa", L, y + 19.5);
      font("bold", 24); ink(ARANCIO); doc.text(euro(c.risparmio, 0), L, y + 30);
      var wv = doc.getTextWidth(euro(c.risparmio, 0));
      font("normal", 11); ink(MUTO); doc.text("all’anno", L + wv + 3, y + 30);
    } else {
      font("normal", 10); ink(TESTO); doc.text("Non stai pagando più del necessario: tieni d’occhio le prossime bollette.", L, y + 19.5);
    }

    // ---- lancetta e prezzi
    y = 107;
    sezione("Il prezzo che paghi", y);
    var cx = L + 30, cy = y + 31, rr = 21;
    var pt = function (a, r) { var rad = (a - 90) * Math.PI / 180; return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]; };
    doc.setLineWidth(4); if (doc.setLineCap) doc.setLineCap("butt");
    for (var a = -90; a < 90; a += 1.5) {
      var kk = a < -11.25 ? COL.ok : a < 22.5 ? COL.warn : COL.bad;
      draw(kk); var p1 = pt(a, rr), p2 = pt(Math.min(90, a + 1.7), rr); doc.line(p1[0], p1[1], p2[0], p2[1]);
    }
    var ratioP = Math.max(0.6, Math.min(1.4, c.rP));
    var tip = pt((ratioP - 1) / 0.4 * 90, rr - 5);
    draw(NAVY); doc.setLineWidth(0.9); doc.line(cx, cy, tip[0], tip[1]);
    fill(NAVY); doc.circle(cx, cy, 1.8, "F");
    font("normal", 7); ink(MUTO); doc.text("paghi meno", cx - rr - 2, cy + 5); doc.text("paghi di più", cx + rr + 2, cy + 5, { align: "right" });
    var px = L + 70;
    fill(COL[c.vPrezzo]); doc.rect(px, y + 10, 1.2, 13, "F");
    font("normal", 8.5); ink(MUTO); doc.text("Tu paghi, tutto compreso", px + 5, y + 14);
    font("bold", 16); ink(NAVY); doc.text(euro(c.prezzo, 3) + " / " + u, px + 5, y + 21);
    fill(COL.ok); doc.rect(px, y + 28, 1.2, 13, "F");
    font("normal", 8.5); ink(MUTO); doc.text("Prezzo giusto di riferimento", px + 5, y + 32);
    font("bold", 16); ink(NAVY); doc.text(euro(c.rif.prezzo, 3) + " / " + u, px + 5, y + 39);
    font("normal", 8.2); ink(MUTO);
    doc.text(doc.splitTextToSize("Il prezzo giusto è il riferimento ARERA per una famiglia come la tua, con tasse e quote fisse comprese.", R - (px + 62)), px + 62, y + 14);

    // ---- consumi
    y = 152;
    sezione("I tuoi consumi", y);
    font("normal", 9.5); ink(TESTO);
    doc.text(doc.splitTextToSize(t.tCons, W), L, y + 8.5);
    var max = Math.max(c.annuo, c.rifConsumo) * 1.1, bw = W - 70;
    [["Tu", c.annuo, c.vCons === "bad" ? COL.bad : ARANCIO], ["Famiglia come la tua", c.rifConsumo, [176, 187, 201]]].forEach(function (r, i) {
      var by = y + 13.5 + i * 7.5;
      font("normal", 8.5); ink(MUTO); doc.text(r[0], L, by + 3.2);
      fill(TENUE); doc.roundedRect(L + 40, by, bw, 4, 2, 2, "F");
      fill(r[2]); doc.roundedRect(L + 40, by, Math.max(4, bw * r[1] / max), 4, 2, 2, "F");
      font("bold", 9); ink(NAVY); doc.text(num(r[1]) + " " + u, R, by + 3.3, { align: "right" });
    });

    // ---- i dati inseriti
    y = 186;
    sezione("I dati che hai inserito", y);
    var dati = [
      ["Totale della bolletta", euro(c.importo, 2)], ["Consumo nel periodo", num(c.consumo) + " " + u],
      ["Periodo", c.mesi + (c.mesi === 1 ? " mese" : " mesi")], ["Persone in casa", c.persone === 5 ? "5 o più" : String(c.persone)],
      ["Spesa annua stimata", euro(c.spesaAnnua, 0)], ["Consumo annuo stimato", num(c.annuo) + " " + u]
    ];
    var colw = (W - 12) / 2;
    dati.forEach(function (d, i) {
      var x = L + (i % 2) * (colw + 12), yy = y + 8.5 + Math.floor(i / 2) * 6.6;
      font("normal", 9); ink(MUTO); doc.text(d[0], x, yy);
      font("bold", 9); ink(NAVY); doc.text(d[1], x + colw, yy, { align: "right" });
      draw(LINEA); doc.setLineWidth(0.2); doc.line(x, yy + 2.3, x + colw, yy + 2.3);
    });

    // ---- cosa fare adesso: riquadro blu come «Come funziona» della mail
    y = 213;
    fill(NAVY2); doc.roundedRect(L, y, W, 36, 3.5, 3.5, "F");
    font("bold", 8); ink(PESCA); doc.text("COSA FARE ADESSO", 105, y + 7, { align: "center", charSpace: 0.5 });
    var passi = [
      "Confronta le offerte con il codice POD o PDR alla mano, anche su ilportaleofferte.it (ARERA).",
      "Controlla che la lettura sia reale e non stimata; se serve, comunica l’autolettura.",
      "Consumi alti? Un controllo di impianti e isolamento vale più di un cambio di tariffa: su anchecasa.it trovi i tecnici della tua zona."
    ];
    var cw = W / 3;
    passi.forEach(function (p, i) {
      var xc = L + cw * i + cw / 2;
      fill(ARANCIO); doc.circle(xc, y + 14, 3.3, "F");
      font("bold", 9); ink([255, 255, 255]); doc.text(String(i + 1), xc, y + 15.3, { align: "center" });
      font("normal", 7.6); doc.text(doc.splitTextToSize(p, cw - 9), xc, y + 22, { align: "center", lineHeightFactor: 1.3 });
    });

    // ---- nota sulle fonti
    font("normal", 6.4); ink(MUTO);
    doc.text(doc.splitTextToSize("Prezzo di riferimento: " + c.rif.fonte + ". Consumi di riferimento: stime AncheCasa su dati ARERA. Il prezzo medio include quote fisse e potenza impegnata: con consumi bassi risulta più alto. Stima indicativa a scopo informativo, non è una consulenza.", W), L, 252.5);

    // ---- piede: la curva del marchio AncheCasa, identica a quella delle mail (assets/logo/footer-curva.png).
    // Misurata sulla mail approvata: tre bordi (arancio chiaro, arancio, blu) quasi piatti a sinistra che salgono a destra.
    // y = ((a·t + b)·t + c)·t + d in pixel su 600 di larghezza; t = 0 a sinistra, 1 a destra. 600 px = 210 mm.
    var CURVA = { chiaro: [3.1335, -42.8382, 10.2674, 33.5524], arancio: [-1.3827, -26.5596, 1.7325, 40.8033], blu: [0.6414, -21.6553, 2.0786, 47.9497] };
    var CY = 255, K = 210 / 600;
    function curva(cf, colore) {
      var n = 80, pts = [];
      for (var i = 0; i <= n; i++) { var tt = i / n; pts.push([210 * tt, CY + (((cf[0] * tt + cf[1]) * tt + cf[2]) * tt + cf[3]) * K]); }
      pts.push([210, 297], [0, 297]);
      var seg = [];
      for (var j = 1; j < pts.length; j++) seg.push([pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]]);
      fill(colore); doc.lines(seg, pts[0][0], pts[0][1], [1, 1], "F", true);
    }
    curva(CURVA.chiaro, ARANCIO_CHIARO);
    curva(CURVA.arancio, ARANCIO);
    curva(CURVA.blu, NAVY);
    var lb = loghi && loghi.bianco;
    if (lb) { var bh = 7; doc.addImage(lb.data, "PNG", L, 275.5, bh * lb.r, bh); }
    else { font("bold", 12); ink([255, 255, 255]); doc.text("AncheCasa", L, 281); }
    font("bold", 8.5); ink([255, 255, 255]); doc.text("AncheCasa · Costruiamo fiducia · anchecasa.it", L, 287.5);
    font("normal", 7.6); ink(PIEDE);
    doc.text("Domande? Scrivi a info@anchecasa.it  ·  © " + oggi.getFullYear() + " AncheCasa  ·  Report Check Bollette, AncheCasa Magazine N." + NUMERO.n, L, 292.5);
    doc.text("Pagina 1 di 1", R, 292.5, { align: "right" });
    doc.save("AncheCasa-report-bolletta-" + (luce ? "luce" : "gas") + ".pdf");
  }

  function calcolaBolletta() {
    var importo = leggiNumero($("cb-importo").value), consumo = leggiNumero($("cb-consumo").value);
    var mesi = parseInt($("cb-mesi").value, 10) || 2, persone = parseInt($("cb").getAttribute("data-persone"), 10) || 3;
    var r = RIF[bolletta.tipo];
    var prezzo = importo / consumo, annuo = consumo * 12 / mesi, spesaAnnua = importo * 12 / mesi;
    var rifConsumo = (bolletta.tipo === "luce" ? RIF.consumoLuce : RIF.consumoGas)[persone];
    var rP = prezzo / r.prezzo, rC = annuo / rifConsumo;
    return { esempio: false, importo: importo, consumo: consumo, mesi: mesi, persone: persone, prezzo: prezzo, annuo: annuo, spesaAnnua: spesaAnnua, rifConsumo: rifConsumo, rP: rP, rC: rC,
      vPrezzo: rP > 1.1 ? "bad" : rP < 0.95 ? "ok" : "warn", vCons: rC > 1.25 ? "bad" : rC < 0.8 ? "ok" : "warn", risparmio: rP > 1 ? (prezzo - r.prezzo) * annuo : 0, rif: r };
  }
  function risultato() {
    var c = calcolaBolletta(), r = c.rif, u = r.unita, p = c.persone;
    var titolo = { bad: "Paghi " + art(Math.round((c.rP - 1) * 100)) + "% in più del giusto", warn: "Il tuo prezzo è nella media", ok: "Il tuo prezzo è buono" }[c.vPrezzo];
    var ang = (Math.max(0.6, Math.min(1.4, c.rP)) - 1) / 0.4 * 90;
    var arc = function (a0, a1, cls) {
      var q = function (a) { var rad = (a - 90) * Math.PI / 180; return [100 + 80 * Math.cos(rad), 100 + 80 * Math.sin(rad)]; };
      var A = q(a0), B = q(a1);
      return '<path class="' + cls + '" d="M' + A[0].toFixed(1) + " " + A[1].toFixed(1) + " A80 80 0 0 1 " + B[0].toFixed(1) + " " + B[1].toFixed(1) + '"/>';
    };
    var cons = { ok: "meno di", warn: "come", bad: "più di" }[c.vCons];
    $("cb-out").innerHTML =
      '<p class="cb-cosa">La tua bolletta ' + (bolletta.tipo === "luce" ? "della luce" : "del gas") + "</p>" +
      '<p class="cb-big ' + c.vPrezzo + '">' + titolo + "</p>" +
      (c.risparmio > 0 ? '<p class="cb-save"><span>Puoi risparmiare circa</span> <b>' + euro(c.risparmio, 0) + "</b> <span>all’anno</span></p>" : '<p class="cb-save ok">Non stai pagando più del necessario.</p>') +
      '<div class="cb-gauge"><svg viewBox="0 0 200 112" role="img" aria-label="Il tuo prezzo rispetto al giusto">' + arc(-90, -11.25, "g-ok") + arc(-11.25, 22.5, "g-warn") + arc(22.5, 90, "g-bad") +
      '<g transform="rotate(' + ang.toFixed(1) + ' 100 100)"><line x1="100" y1="100" x2="100" y2="34" class="g-ago"/></g><circle cx="100" cy="100" r="6" class="g-perno"/></svg>' +
      '<div class="cb-prezzi"><p><small>Paghi</small><b>' + euro(c.prezzo, 2) + "</b><small>al " + u + '</small></p><p class="giusto"><small>Prezzo giusto</small><b>' + euro(r.prezzo, 2) + "</b><small>al " + u + "</small></p></div></div>" +
      '<p class="cb-cons">Consumi <b>' + cons + "</b> una famiglia di " + (p >= 5 ? "5 o più persone" : p + (p === 1 ? " persona" : " persone")) + " (" + num(c.annuo) + " " + u + " l’anno).</p>" +
      '<div class="cb-pers" role="group" aria-label="Quante persone siete?"><span>Quante persone siete?</span>' +
      [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-pers="' + n + '" aria-pressed="' + (n === p) + '">' + (n === 5 ? "5+" : n) + "</button>"; }).join("") + "</div>";
  }

  function scaricaPdf() {
    STAT.traccia("bollette_pdf", null, bolletta.tipo);
    if (!window.jspdf || !window.jspdf.jsPDF) { $("cb-msg").textContent = "Il PDF non si è caricato. Controlla la connessione e riprova."; return; }
    var c = calcolaBolletta();
    caricaLoghi(function (loghi) { creaPdf(c, loghi); });
  }
  var cb = $("cb");
  function tipo(t) {
    bolletta.tipo = t;
    cb.querySelectorAll("[data-tipo]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-tipo") === t)); });
    $("cb-unit").textContent = t === "luce" ? "kWh" : "Smc";
  }
  function vista(res) { $("cb-dati").hidden = res; $("cb-res").hidden = !res; if (res) $("cb-res").scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  function analizza() {
    var mI = !(leggiNumero($("cb-importo").value) > 0), mC = !(leggiNumero($("cb-consumo").value) > 0);
    if (mI || mC) {
      $("cb-msg").textContent = mI && mC ? "Scrivi quanto hai pagato e quanto hai consumato." : mI ? "Scrivi quanto hai pagato." : "Scrivi quanto hai consumato.";
      $(mI ? "cb-importo" : "cb-consumo").focus(); return;
    }
    $("cb-msg").textContent = "";
    risultato(); vista(true);
    STAT.traccia("bollette_uso", null, bolletta.tipo);
  }
  cb.querySelectorAll("[data-tipo]").forEach(function (b) { b.addEventListener("click", function () { tipo(b.getAttribute("data-tipo")); }); });
  ["cb-importo", "cb-consumo"].forEach(function (id) {
    $(id).addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); if (id === "cb-importo") $("cb-consumo").focus(); else analizza(); } });
    $(id).addEventListener("input", function () { $("cb-msg").textContent = ""; });
  });
  $("cb-go").addEventListener("click", analizza);
  $("cb-edit").addEventListener("click", function () { vista(false); $("cb-importo").focus(); });
  $("cb-pdf").addEventListener("click", scaricaPdf);
  $("cb-out").addEventListener("click", function (e) { var b = e.target.closest("[data-pers]"); if (!b) return; cb.setAttribute("data-persone", b.getAttribute("data-pers")); risultato(); });
})();
