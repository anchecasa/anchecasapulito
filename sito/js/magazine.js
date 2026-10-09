/* AncheCasa Magazine · sfogliabile.
   Le pagine sono disegnate a misura fissa e il libro viene scalato per lo schermo.
   Doppia pagina da 900 px in su, pagina singola sul telefono.
   Per un nuovo numero: cambia NUMERO e l'array PAGINE. */
(function () {
  "use strict";

  var NUMERO = { n: 1, data: "Ottobre 2026", prossimo: "1° novembre 2026", cartella: "magazine/numero-1/" };

  /* ---------------- statistiche anonime (09.10.2026) ----------------
     Conta aperture, pagine viste, Check Bollette, PDF, offerte, condivisioni e iscrizioni.
     Niente cookie e niente dati personali: "sessione" è un codice casuale che vive finché la scheda è aperta.
     Città e regione le aggiunge la funzione Vercel /api/mag (sito/api/mag.js). Conta solo su anchecasa.it
     (per provare altrove: ?stat=prova). Riepilogo nella dashboard admin, pagina "Magazine". */
  var STAT = (function () {
    var attivo = /(^|\.)anchecasa\.it$/.test(location.hostname) || /[?&]stat=prova/.test(location.search);
    var coda = [], visti = {}, timer = null, ses = "";
    try { ses = sessionStorage.getItem("ac-mag-s") || ""; } catch (e) { /* storage non disponibile */ }
    if (!ses) {
      ses = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      try { sessionStorage.setItem("ac-mag-s", ses); } catch (e2) { /* storage non disponibile */ }
    }
    var ua = navigator.userAgent || "";
    var disp = /iPad|Tablet/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "tablet" : /Mobi|Android|iPhone/i.test(ua) ? "telefono" : "pc";
    var da = (function () {
      var m = location.search.match(/[?&](?:da|utm_source)=([^&]+)/);
      if (m) { try { return decodeURIComponent(m[1]).slice(0, 60); } catch (e) { return m[1].slice(0, 60); } }
      if (!document.referrer) return "diretto";
      try {
        var h = new URL(document.referrer).hostname.replace(/^www\./, "");
        return /(^|\.)anchecasa\.it$/.test(h) ? "sito anchecasa" : h;
      } catch (e2) { return "altro"; }
    })();
    function invia(beacon) {
      clearTimeout(timer); timer = null;
      if (!coda.length) return;
      if (!attivo) { coda = []; return; }
      var corpo = JSON.stringify({ s: ses, n: NUMERO.n, d: disp, da: da, ev: coda.splice(0, 40) });
      try {
        if (beacon && navigator.sendBeacon && navigator.sendBeacon("/api/mag", new Blob([corpo], { type: "text/plain" }))) return;
        fetch("/api/mag", { method: "POST", headers: { "Content-Type": "application/json" }, body: corpo, keepalive: true }).catch(function () {});
      } catch (e) { /* le statistiche non devono mai bloccare la rivista */ }
    }
    function traccia(evento, pagina, dettaglio) {
      var k = evento + "|" + (pagina == null ? "" : pagina) + "|" + (dettaglio || "");
      if (visti[k]) return;
      visti[k] = 1;
      coda.push({ e: evento, p: pagina == null ? null : pagina, x: dettaglio || "" });
      if (!timer) timer = setTimeout(function () { invia(false); }, 2500);
    }
    window.addEventListener("pagehide", function () { invia(true); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") invia(true); });
    var kA = "ac-mag-ap-" + NUMERO.n, gia = false;
    try { gia = sessionStorage.getItem(kA) === "1"; sessionStorage.setItem(kA, "1"); } catch (e3) { /* storage non disponibile */ }
    if (!gia) traccia("apertura");
    traccia("pagina", 0);
    return { traccia: traccia };
  })();
  window.ACMagStat = STAT;
  /* Azienda luce e gas della rete AncheCasa per il pulsante dello strumento: nome e link alla sua pagina.
     Vuoto = «Confronta offerte» (Portale Offerte ARERA). */
  var PARTNER_ENERGIA = { nome: "", url: "" };
  var SPREAD = { w: 500, h: 700 };
  var SINGLE = { w: 400, h: 740 };
  var TURN_MS = 950;
  var NO_FLIP = "input,select,textarea,button,a,label,[data-noflip]";

  /* ---------------- riferimenti per lo strumento bolletta ---------------- */
  // Prezzo luce di riferimento: tutela vulnerabili dal 1° ottobre 2026, tasse incluse (ARERA).
  // Prezzo gas di riferimento: stima Unione Nazionale Consumatori, ottobre 2026 (1.581 € per 1.100 m³).
  var RIF = {
    luce: { prezzo: 0.4343, unita: "kWh", fonte: "ARERA, tutela vulnerabili dal 1° ottobre 2026, tasse incluse" },
    gas: { prezzo: 1.44, unita: "Smc", fonte: "stima Unione Nazionale Consumatori su dati ARERA, ottobre 2026" },
    // consumi annui di riferimento per numero di persone (luce: elaborazioni su dati ARERA)
    consumoLuce: { 1: 1400, 2: 2350, 3: 2700, 4: 3450, 5: 5200 },
    // gas: famiglia tipo ARERA con riscaldamento autonomo
    consumoGas: { 1: 900, 2: 1200, 3: 1400, 4: 1550, 5: 1700 }
  };

  /* ---------------- helper di impaginazione ---------------- */
  function img(nome, alt) {
    return '<img src="' + NUMERO.cartella + nome + '.jpg" alt="' + alt + '" draggable="false" decoding="async">';
  }
  function folio(i, onPhoto) {
    return '<div class="mg-folio' + (onPhoto ? " on-photo" : "") + '"><span><b>' + i + "</b></span><span>AncheCasa Magazine · N." + NUMERO.n + " · " + NUMERO.data + "</span></div>";
  }
  function kicker(t) { return '<div class="mg-kicker">' + t + "</div>"; }
  var ICO = {
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19 14 10"/></svg>',
    snow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/></svg>',
    flower: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="2.6"/><circle cx="12" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.2 5.2l1.8 1.8M17 17l1.8 1.8M5.2 18.8 7 17M17 7l1.8-1.8"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9 20v-5h6v5"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 2 1.3 3 2.5 3.5C12 9 11 6 12 3Z"/></svg>',
    panel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 15 6 6h15l-3 9Z"/><path d="M4.5 10.5h15M12.5 6l-2 9"/><path d="M10 15v5M7 20h6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };
  function ico(n, cls) { return '<span class="mg-ico ' + (cls || "") + '" aria-hidden="true">' + ICO[n] + "</span>"; }

  /* ---------------- le pagine del numero 1 ---------------- */
  var PAGINE = [
    /* 0 · COPERTINA */
    { cover: true, html: function () {
      return '<div class="mg-page mg-cover">' +
        '<div class="mg-bleed mg-photo">' + img("copertina", "Una famiglia, mamma, papà e bambino, nel soggiorno appena ristrutturato") + "</div>" +
        '<div class="mg-shade-t"></div><div class="mg-shade-b"></div>' +
        '<div class="mg-masthead"><div class="name">Anche<span>Casa</span></div><div class="sub">Magazine</div></div>' +
        '<div class="mg-issue"><span>N. 1</span><span>' + NUMERO.data + '</span><span>Il primo numero · gratuito</span></div>' +
        '<div class="mg-coverlines">' +
          '<div class="mg-cl-big"><div class="n">83</div><div class="t">giorni per il bonus casa al 50%. Poi si scende.</div></div>' +
          "<div>" +
            '<div class="mg-cl"><b>Energia</b><span>Prima isola, poi scalda: l’ordine giusto dei lavori</span></div>' +
            '<div class="mg-cl"><b>Cantiere</b><span>Il preventivo blindato in sette mosse</span></div>' +
            '<div class="mg-cl"><b>Tendenze</b><span>Microcemento e SPC, i materiali che corrono</span></div>' +
          "</div>" +
        "</div>" +
        '<button type="button" class="mg-sticker" data-goto="8" aria-label="Verifica la tua bolletta. Strumento gratuito a pagina 8">' +
          '<span class="k">Gratis</span>' +
          '<span class="h"><em>Verifica</em><br>la tua bolletta</span>' +
          '<span class="d">Metti i tuoi numeri e controlla se paghi troppo</span>' +
          '<span class="p">pag. 8</span>' +
        '</button>' +
        '<div class="mg-slogan">Costruiamo fiducia</div>' +
      "</div>";
    } },

    /* 1 · EDITORIALE */
    { html: function (i) {
      return '<div class="mg-page">' +
        '<div class="mg-photo mg-ph-ed" style="height:52%">' + img("editoriale", "Una lettrice sfoglia AncheCasa Magazine sul divano") +
          '<div class="mg-shade-b"></div>' +
          '<div class="mg-opener" style="bottom:22px">' + kicker("Editoriale") +
          '<h1 class="mg-h1" style="font-size:44px">La casa, <em>finalmente</em> spiegata bene.</h1></div>' +
        "</div>" +
        '<div class="mg-pad" style="padding-top:22px;flex:1;display:flex;flex-direction:column;min-height:0">' +
        '<div class="mg-body"><div class="mg-cols" style="font-size:calc(var(--mg-body) + .8px)">' +
        '<p class="mg-p mg-dropcap">Ogni giorno milioni di italiani cercano come si legge una bolletta, quanto costa rifare il bagno, se il bonus vale ancora. Trovano mille pagine uguali, scritte per i motori di ricerca.</p>' +
        '<p class="mg-p">Noi facciamo il contrario: ogni quindici giorni risposte chiare, numeri con la fonte accanto e strumenti gratuiti da usare subito. E quando serve una mano esperta, nella piazza di AncheCasa trovi chi lo fa nella tua zona.</p>' +
        '<p class="mg-sign">La redazione di AncheCasa</p>' +
        "</div></div>" +
        '<div class="mg-inside" aria-label="In questo numero"><div class="t">In questo numero</div>' +
          [[8, "Check Bollette: scopri se paghi troppo", "Gratis"], [4, "Bonus casa: gli ultimi 83 giorni al 50%", ""], [2, "L’app della raccolta, in arrivo", ""]].map(function (x) {
            return '<button type="button" data-goto="' + x[0] + '" data-noflip><span>' + x[1] + (x[2] ? ' <em>' + x[2] + "</em>" : "") + "</span><b>" + x[0] + "</b></button>";
          }).join("") +
        "</div>" +
        '<p class="mg-small" style="border-top:1px solid var(--mg-rule);padding-top:6px;margin:0">N. ' + NUMERO.n + " · " + NUMERO.data + " · Gratuito su anchecasa.it · Dal " + NUMERO.prossimo + " esce ogni 15 giorni. Contenuti divulgativi: non sostituiscono il parere di un tecnico.</p>" +
        "</div>" + folio(i) + "</div>";
    } },
    /* 2 · IN ARRIVO: APP RACCOLTA RIFIUTI (09.10.2026). Testo sulla fascia blu, volto libero, modulo a scomparsa. */
    { cover: true, html: function (i) {
      return '<div class="mg-page mg-p2app">' +
        '<div class="mg-bleed mg-photo mg-p2-bg">' + img("rifiuti-casa", "Una donna nella sua cucina moderna, accanto ai contenitori di design per la differenziata, mostra sul telefono l’app AncheCasa con cosa portare fuori stasera") + '</div>' +
        '<div class="mg-p2-app" aria-hidden="true">' +
          '<div class="hd"><span class="dot"></span>Comune di Bergamo</div>' +
          '<div class="it"><i style="background:#2f74d0"></i><span><small>Stasera</small><b>Carta e cartone</b><small>Dalle 20:00 alle 24:00</small></span></div>' +
          '<div class="it"><i style="background:#f2c230"></i><span><small>Domani</small><b>Plastica e metalli</b></span></div>' +
        '</div>' +
        '<div class="mg-p2-head">' +
          '<div class="mg-kicker">L’app gratuita · in arrivo</div>' +
          '<h2 class="mg-h1">Cosa porto fuori <em>stasera?</em></h2>' +
        '</div>' +
        '<div class="mg-p2-glass" data-noflip>' +
          '<button type="button" class="mg-p2-open" aria-expanded="false"><span class="bell" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg></span><span class="tx"><b>Avvisami gratis quando esce</b><small>Cosa esporre e a che ora, nel tuo Comune</small></span><span class="go" aria-hidden="true">›</span></button>' +
          '<form class="mg-avvisi" novalidate hidden>' +
            '<div class="r"><input type="email" name="mail" placeholder="La tua mail" autocomplete="email" required aria-label="La tua mail"><input type="text" name="comune" placeholder="Comune" autocomplete="address-level2" aria-label="Il tuo Comune"><button type="submit" class="mg-p2-send" aria-label="Invia">›</button></div>' +
            '<label class="ok"><input type="checkbox" name="privacy" required><span>Ho letto l’<a href="privacy.html" target="_blank" rel="noopener">informativa privacy</a></span></label>' +
            '<p class="esito" role="status" hidden></p>' +
          "</form>" +
        "</div>" +
        folio(i, true) + "</div>";
    } },

    /* 3 · I NUMERI */
    { cover: true, html: function (i) {
      var s = [
        ["50", "%", "detrazione sulla prima casa, per i pagamenti entro il 31 dicembre 2026", "Legge di Bilancio 2026"],
        ["+37", ",3%", "bolletta luce dei clienti vulnerabili da ottobre a dicembre", "ARERA"],
        ["47", "%", "sceglie l’impresa col passaparola, il 35% la cerca online", "ItaliaOggi"],
        ["+51", "%", "richieste per rifare l’impianto idraulico in due anni", "ProntoPro"],
        ["60", "%", "degli edifici italiani è in classe energetica F o G", "ENEA"],
        ["+206", "%", "richieste di pavimenti SPC, posati a secco sul vecchio", "ProntoPro"]
      ];
      return '<div class="mg-page mg-numeri">' +
        '<div class="mg-bleed mg-photo">' + img("tetti", "Tetti di un borgo italiano al tramonto") + '</div><div class="mg-tint"></div>' +
        '<div class="mg-pad" style="position:relative;z-index:3;height:100%;display:flex;flex-direction:column">' +
        kicker("In cifre") +
        '<h2 class="mg-h1" style="color:#fff;font-size:46px;margin-bottom:14px">I numeri<br>della <em>casa</em></h2>' +
        '<div class="mg-bignums">' + s.map(function (x) {
          return '<div><div class="v">' + x[0] + "<small>" + x[1] + '</small></div><div class="l">' + x[2] + '</div><div class="s">' + x[3] + "</div></div>";
        }).join("") + "</div></div>" +
        folio(i, true) + "</div>";
    } },
    /* 4 · APERTURA INCHIESTA BONUS */
    { cover: true, html: function (i) {
      return '<div class="mg-page">' +
        '<div class="mg-bleed mg-photo">' + img("bonus", "Chiavi, fatture e calcolatrice sul tavolo di casa") + "</div><div class=\"mg-shade-b\"></div>" +
        '<div class="mg-opener">' + kicker("Inchiesta · Bonus casa 2026") +
        '<h1 class="mg-h1">Gli ultimi <em>83 giorni</em> al 50%</h1>' +
        '<p class="mg-dek">Dal 1° gennaio 2027 le detrazioni per la casa scendono. Chi paga i lavori entro il 31 dicembre recupera di più: ecco quanto, e come non perdere nulla.</p></div>' +
        folio(i, true) + "</div>";
    } },

    /* 5 · BONUS: INFOGRAFICA */
    { html: function (i) {
      var bars = [
        ["Prima casa", "2026", 10000, true], ["Prima casa", "2027", 7200, false],
        ["Altri immobili", "2026", 7200, true], ["Altri immobili", "2027", 6000, false]
      ];
      var svg = '<svg class="mg-bars" viewBox="0 0 420 196" role="img" aria-label="Quanto recuperi su 20.000 euro di lavori: prima casa 10.000 euro nel 2026 e 7.200 nel 2027; altri immobili 7.200 euro nel 2026 e 6.000 nel 2027">';
      bars.forEach(function (b, k) {
        var y = 8 + k * 46 + (k > 1 ? 10 : 0);
        var w = Math.round(b[2] / 10000 * 270);
        svg += '<text x="0" y="' + (y + 13) + '" class="t1">' + (k % 2 === 0 ? b[0] : "") + "</text>" +
          '<text x="0" y="' + (y + 29) + '" class="t2">' + b[1] + "</text>" +
          '<rect x="100" y="' + y + '" width="' + w + '" height="30" rx="2" class="' + (b[3] ? "on" : "off") + '"/>' +
          '<text x="' + (100 + w + 6) + '" y="' + (y + 21) + '" class="tv">' + b[2].toLocaleString("it-IT") + " €</text>";
      });
      svg += "</svg>";
      var ring = '<svg class="mg-ring" viewBox="0 0 120 120" role="img" aria-label="83 giorni al 31 dicembre"><circle cx="60" cy="60" r="50" class="bg"/><circle cx="60" cy="60" r="50" class="fg" stroke-dasharray="' + (2 * Math.PI * 50 * 83 / 365).toFixed(1) + " 999" + '" transform="rotate(-90 60 60)"/><text x="60" y="64" text-anchor="middle" class="n">83</text><text x="60" y="82" text-anchor="middle" class="l">GIORNI</text></svg>';
      return '<div class="mg-page mg-pad">' + kicker("Inchiesta · Bonus casa 2026") +
        '<h2 class="mg-h2" style="font-size:32px">Su 20.000 € di lavori,<br><em style="color:var(--mg-orange-ink)">quanto torna indietro?</em></h2>' +
        '<div class="mg-body">' + svg +
        '<div class="mg-split">' +
          "<div>" + ring + "</div>" +
          '<div><p class="mg-p" style="text-align:left"><b>Conta la data del bonifico</b>, non quella di fine lavori. Paghi entro il 31 dicembre 2026 e recuperi il 50% sulla prima casa (36% sugli altri immobili), fino a 96.000 € di spesa per unità.</p>' +
          '<p class="mg-p" style="text-align:left">Il rimborso arriva in <b>10 rate annuali</b> nella dichiarazione dei redditi: 1.000 € l’anno nell’esempio. Sismabonus ed Ecobonus seguono le stesse aliquote; il Bonus Mobili resta al 50% fino a 5.000 €.</p></div>' +
        "</div>" +
        '<p class="mg-small">Dal 2025 le caldaie solo a combustibili fossili non sono più agevolate. Fonti: L. 199/2025; guida ANCE «Bonus edilizi 2026».</p>' +
        "</div>" + folio(i) + "</div>";
    } },
    /* 6 · BONIFICO E DOCUMENTI */
    { html: function (i) {
      return '<div class="mg-page mg-pad mg-orange">' + kicker("Guida pratica") +
        '<h2 class="mg-h2" style="color:#fff;font-size:31px">Il bonifico che salva<br>il tuo bonus</h2>' +
        '<div class="mg-body">' +
        '<div class="mg-receipt">' +
          '<div class="rh"><span>BONIFICO</span><span>ristrutturazione · detrazione</span></div>' +
          '<div class="rr"><span>Beneficiario</span><b>Impresa Esempio Srl</b></div>' +
          '<div class="rr hl"><i>1</i><span>P. IVA beneficiario</span><b>01234567890</b></div>' +
          '<div class="rr hl"><i>2</i><span>Causale</span><b class="cz">Lavori con detrazione art. 16-bis DPR 917/1986 · fattura n. 12 del 30/10/2026</b></div>' +
          '<div class="rr hl"><i>3</i><span>C.F. di chi detrae</span><b>XXXXXX00X00X000X</b></div>' +
          '<div class="rr"><span>Importo</span><b style="font-size:16px">€ 5.000,00</b></div>' +
        "</div>" +
        '<div class="mg-steps3">' +
          "<div><b>1 · Partita IVA</b>dell’impresa che fattura.</div>" +
          "<div><b>2 · Causale</b>con la norma del bonus e la fattura.</div>" +
          "<div><b>3 · Codice fiscale</b>di chi porterà la spesa in detrazione.</div>" +
        "</div>" +
        '<div class="mg-checks">' +
          "<div>" + ico("check") + "Prima: casa in regola e pratica giusta (CILA, SCIA)</div>" +
          "<div>" + ico("check") + "Mai contanti né bonifici ordinari</div>" +
          "<div>" + ico("check") + "L’11% trattenuto dalla banca all’impresa è normale</div>" +
          "<div>" + ico("check") + "Risparmio energetico: ENEA entro 90 giorni</div>" +
        "</div>" +
        "</div>" + folio(i) + "</div>";
    } },
    /* 7 · LEGGERE LA BOLLETTA */
    { html: function (i) {
      return '<div class="mg-page">' +
        '<div class="mg-photo mg-ph-boll" style="height:34%">' + img("bolletta", "Mani che tengono una bolletta e uno smartphone") +
          '<div class="mg-shade-b"></div><div class="mg-opener" style="bottom:16px">' + kicker("Bollette") +
          '<h2 class="mg-h1" style="font-size:36px;margin:6px 0 0">La bolletta, <em>smontata</em></h2></div></div>' +
        '<div class="mg-pad" style="padding-top:16px;flex:1;display:flex;flex-direction:column;min-height:0"><div class="mg-body">' +
        '<div class="mg-bill-wrap">' +
          '<div class="mg-bill" aria-hidden="true">' +
            '<div class="bh">Bolletta luce <span>set–ott 2026</span></div>' +
            '<div class="bl"><i>1</i>POD <b>IT001E00000000</b></div>' +
            '<div class="bl"><i>2</i>Consumo <b>420 kWh</b> <em>lettura reale</em></div>' +
            '<div class="bstack"><span style="flex:46"></span><span style="flex:18"></span><span style="flex:14"></span><span style="flex:22"></span></div>' +
            '<div class="blg"><i>4</i><span><s style="background:var(--mg-orange)"></s>Energia</span><span><s style="background:#2a3c54"></s>Rete</span><span><s style="background:#8a9bb0"></s>Oneri</span><span><s style="background:#d9c9ae"></s>Imposte</span></div>' +
            '<div class="btot"><i>3</i>Totale <b>165,00 €</b></div>' +
          "</div>" +
          '<ol class="mg-callouts">' +
            "<li><b>POD o PDR.</b> Il codice del tuo contatore: serve per cambiare fornitore.</li>" +
            "<li><b>Consumi.</b> Controlla che la lettura sia <i>reale</i>; se è stimata, manda l’autolettura.</li>" +
            "<li><b>Totale.</b> Diviso per i kWh ti dà il costo medio: 0,39 € qui.</li>" +
            "<li><b>Quattro voci.</b> Energia, trasporto e contatore, oneri di sistema, imposte.</li>" +
          "</ol>" +
        "</div>" +
        '<div class="mg-flag"><b>Da ottobre +37,3%</b> per i vulnerabili in tutela. Con ISEE fino a 9.796 € (20.000 € con 4 figli) il bonus sociale arriva in automatico dopo la DSU.<span>Verifica la tua bolletta ' + ICO.arrow + "</span></div>" +
        '<p class="mg-small" style="margin-top:6px">Le proporzioni delle voci sono illustrative. Fonte aumento: ARERA, settembre 2026.</p>' +
        "</div></div>" + folio(i) + "</div>";
    } },
    /* 8 · STRUMENTO CHECK BOLLETTE (09.10.2026 ~17:20, versione semplice): due schermate.
       1) tre domande e un pulsante "Analizza"; 2) solo la risposta: quanto paghi in più, quanto risparmi, lancetta, consumi. */
    { cover: true, html: function (i) {
      var opz = function (voci, sel) { return voci.map(function (v) { return '<option value="' + v[0] + '"' + (v[0] === sel ? " selected" : "") + ">" + v[1] + "</option>"; }).join(""); };
      return '<div class="mg-page mg-app-page mg-cb2">' +
        '<div class="mg-app-head">' +
          '<div><div class="mg-kicker">Strumento gratuito</div>' +
          '<h2 class="mg-app-title">Check <em>Bollette</em></h2>' +
          '<p class="mg-app-sub">Scopri in un minuto se paghi troppo luce o gas.</p></div>' +
          '<span class="mg-free">GRATIS</span>' +
        "</div>" +
        '<div class="mg-app" data-noflip id="mg-bolletta">' +
          '<div id="mg-b-dati">' +
            '<div class="mg-seg big" role="group" aria-label="Tipo di bolletta"><button type="button" data-tipo="luce" aria-pressed="true">' + ICO.sun.replace('<svg', '<svg width="16" height="16"') + ' Luce</button><button type="button" data-tipo="gas" aria-pressed="false">' + ICO.flame.replace('<svg', '<svg width="16" height="16"') + ' Gas</button></div>' +
            '<label class="mg-q" for="mg-b-importo"><span class="n">1</span><span class="d"><b>Quanto hai pagato?</b><small>Il totale, in prima pagina</small></span><span class="mg-inp"><input id="mg-b-importo" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00"><span>€</span></span></label>' +
            '<label class="mg-q" for="mg-b-consumo"><span class="n">2</span><span class="d"><b>Quanto hai consumato?</b><small id="mg-b-hint-c">Nel riquadro «Consumi»</small></span><span class="mg-inp"><input id="mg-b-consumo" type="text" inputmode="decimal" autocomplete="off" placeholder="0"><span id="mg-b-unit">kWh</span></span></label>' +
            '<label class="mg-q" for="mg-b-mesi"><span class="n">3</span><span class="d"><b>Di quanti mesi è?</b><small>Lo dice il periodo in alto</small></span><span class="mg-inp"><select id="mg-b-mesi">' + opz([["1", "1 mese"], ["2", "2 mesi"], ["3", "3 mesi"], ["6", "6 mesi"], ["12", "12 mesi"]], "2") + "</select></span></label>" +
            '<p class="mg-b-msg" id="mg-b-msg" role="status"></p>' +
            '<button type="button" class="mg-cta wide mg-b-go" id="mg-b-go">Analizza la mia bolletta</button>' +
            '<p class="mg-b-cosa"><b>Scoprirai</b> se il prezzo è giusto, quanto puoi risparmiare e avrai il report in PDF.</p>' +
          "</div>" +
          '<div id="mg-b-res" hidden>' +
            '<div id="mg-b-out" aria-live="polite"></div>' +
            '<div class="mg-tool-actions">' +
              '<button type="button" class="mg-cta wide" id="mg-b-pdf">' + ICO.arrow.replace('<svg', '<svg width="15" height="15" style="transform:rotate(90deg)"') + ' Scarica il PDF</button>' +
              (PARTNER_ENERGIA.url
                ? '<a class="mg-cta ghost" href="' + PARTNER_ENERGIA.url + '" target="_blank" rel="noopener">Offerta da ' + PARTNER_ENERGIA.nome + "</a>"
                : '<a class="mg-cta ghost" href="https://www.ilportaleofferte.it/" target="_blank" rel="noopener">Confronta offerte</a>') +
            "</div>" +
            '<button type="button" class="mg-b-edit" id="mg-b-edit">‹ Cambia i dati</button>' +
          "</div>" +
          '<input type="hidden" id="mg-b-persone" value="3">' +
        "</div>" +
        '<p class="mg-app-note" id="mg-b-fonte">I tuoi dati restano sul tuo dispositivo. Stima su dati ARERA, ottobre 2026.</p>' +
        '<div class="mg-folio on-photo" style="bottom:12px"><span><b>' + i + '</b></span><span></span></div>' + "</div>";
    } },
    /* 9 · APERTURA ENERGIA */
    { cover: true, html: function (i) {
      return '<div class="mg-page">' +
        '<div class="mg-bleed mg-photo">' + img("pompa-calore", "Pompa di calore sul terrazzo di una casa con cappotto termico") + '</div><div class="mg-shade-b"></div>' +
        '<div class="mg-opener">' + kicker("Energia") +
        '<h1 class="mg-h1">Prima isola, <em>poi</em> scalda</h1>' +
        '<p class="mg-dek">Cappotto, pompa di calore, fotovoltaico: l’ordine giusto degli interventi fa la differenza in bolletta.</p></div>' +
        folio(i, true) + "</div>";
    } },

    /* 10 · ENERGIA TESTO */
    { html: function (i) {
      var step = function (n, ic, t, d) {
        return '<div class="mg-stepv"><div class="num">' + n + "</div>" + ico(ic, "big") + "<div><b>" + t + "</b>" + d + "</div></div>";
      };
      return '<div class="mg-page mg-pad">' + kicker("Energia") +
        '<h2 class="mg-h2" style="font-size:32px">L’ordine giusto<br><em style="color:var(--mg-orange-ink)">fa la bolletta</em></h2>' +
        '<div class="mg-body">' +
        '<div class="mg-stepsv">' +
          step("1", "shield", "Isola", "Cappotto, sottotetto o solaio: prima fermi le dispersioni e i ponti termici dove nasce la muffa.") +
          step("2", "flame", "Scalda", "Pompa di calore (+32,7% di richieste in due anni) o sistema ibrido se la casa non è isolata.") +
          step("3", "panel", "Produci", "Fotovoltaico insieme alla pompa di calore: l’energia che produci alimenta il riscaldamento.") +
        "</div>" +
        '<div class="mg-quote" style="font-size:22px">Una pompa di calore in una casa che disperde lavora il doppio.</div>' +
        '<div class="mg-checks dark">' +
          "<div>" + ico("check") + "Diagnosi energetica prima di scegliere</div>" +
          "<div>" + ico("check") + "Potenza calcolata, non scelta dal catalogo</div>" +
          "<div>" + ico("check") + "Valvole termostatiche: risparmi senza lavori</div>" +
        "</div>" +
        "</div>" + folio(i) + "</div>";
    } },
    /* 11 · SERRAMENTI */
    { html: function (i) {
      return '<div class="mg-page">' +
        '<div class="mg-photo mg-ph-grow2" style="height:300px">' + img("finestra", "Finestra nuova affacciata sui tetti di un centro storico") + "</div>" +
        '<div class="mg-pad" style="padding-top:20px;flex:1;display:flex;flex-direction:column;min-height:0">' + kicker("Serramenti") +
        '<h2 class="mg-h2">Finestre che isolano davvero</h2>' +
        '<div class="mg-body"><div class="mg-cols">' +
        '<p class="mg-p">Si sceglie su due numeri: la trasmittanza <b>Uw</b>, che dice quanto calore passa (più è bassa, meglio isola), e l’abbattimento acustico. Per l’Ecobonus servono valori massimi diversi secondo la zona climatica del tuo Comune.</p>' +
        '<p class="mg-p">Il vetro doppio è lo standard; il triplo conviene nelle zone fredde o rumorose. Per la sicurezza, la norma EN 1627 fissa le classi antieffrazione da RC1 a RC6: al piano terra parti da RC2.</p>' +
        '<p class="mg-p">La posa conta quanto la finestra. La norma UNI 11673 definisce la posa qualificata: giunti sigillati, nastri e schiume corretti contro spifferi e condensa.</p>' +
        '<div class="mg-quote">Una finestra ottima montata male isola come una finestra vecchia.</div>' +
        "</div></div></div>" + folio(i) + "</div>";
    } },

    /* 12 · CANTIERE: PREVENTIVO */
    { html: function (i) {
      return '<div class="mg-page">' +
        '<div class="mg-photo mg-ph-grow2 mg-ph-cant" style="height:250px">' + img("cantiere", "Posa di un pavimento in un appartamento in ristrutturazione") + "</div>" +
        '<div class="mg-pad" style="padding-top:18px;flex:1;display:flex;flex-direction:column;min-height:0">' + kicker("Cantiere") +
        '<h2 class="mg-h2">Il preventivo blindato in sette mosse</h2>' +
        '<div class="mg-body"><div class="mg-cols"><ul class="mg-list">' +
        "<li><b>Capitolato:</b> cosa si fa e con quali materiali, marca e modello.</li>" +
        "<li><b>Computo metrico:</b> ogni voce con quantità e prezzo. Confronta preventivi solo sulle stesse voci.</li>" +
        "<li><b>Tempi:</b> data di inizio, fine e penali per i ritardi.</li>" +
        "<li><b>Pagamenti</b> a stati di avanzamento (SAL), mai anticipi oltre il 20–30%.</li>" +
        "<li><b>Varianti:</b> per iscritto, con prezzo, prima di farle.</li>" +
        "<li><b>Documenti dell’impresa:</b> DURC e polizza di responsabilità civile.</li>" +
        "<li><b>Extra:</b> chi paga smaltimento, ponteggi e suolo pubblico.</li>" +
        "</ul>" + '<div class="mg-quote">Due preventivi si confrontano solo se descrivono lo stesso lavoro.</div>' + "</div></div></div>" + folio(i) + "</div>";
    } },

    /* 13 · PRATICHE */
    { html: function (i) {
      var row = function (lvl, cosa, nome, chi) {
        return '<div class="mg-flow l' + lvl + '"><div class="c">' + cosa + "</div>" + '<span class="ar">' + ICO.arrow + '</span><div class="p"><b>' + nome + "</b><span>" + chi + "</span></div></div>";
      };
      return '<div class="mg-page">' +
        '<div class="mg-photo" style="height:33%">' + img("architetto", "Un’architetta spiega il progetto a due clienti") + "</div>" +
        '<div class="mg-pad" style="padding-top:16px;flex:1;display:flex;flex-direction:column;min-height:0">' + kicker("Cantiere") +
        '<h2 class="mg-h2" style="font-size:28px">Che pratica mi serve?</h2>' +
        '<div class="mg-body">' +
        row(1, "Tinteggi, cambi pavimenti o sanitari", "Edilizia libera", "nessuna pratica") +
        row(2, "Sposti tramezzi, rifai gli impianti", "CILA", "la presenta il tecnico") +
        row(3, "Intervieni su parti strutturali", "SCIA", "la presenta il tecnico") +
        row(4, "Aumenti volumi o ricostruisci", "Permesso di costruire", "serve il progetto") +
        '<div class="mg-split" style="margin-top:10px;align-items:center"><div class="mg-bigstat">+15<small>%</small></div><p class="mg-p" style="text-align:left;margin:0">Tieni da parte il <b>10–15% del budget</b> per gli imprevisti e paga a stati di avanzamento verificati. Le regole possono cambiare per Comune: verifica col tuo tecnico.</p></div>' +
        "</div></div>" + folio(i) + "</div>";
    } },
    /* 14 · BAGNO */
    { html: function (i) {
      return '<div class="mg-page" style="flex-direction:row">' +
        '<div class="mg-photo" style="width:44%;height:100%">' + img("bagno", "Bagno in microcemento con doccia a filo pavimento") + "</div>" +
        '<div class="mg-pad" style="flex:1;padding-left:22px;display:flex;flex-direction:column;min-height:0;min-width:0">' + kicker("Tendenze") +
        '<h2 class="mg-h2">Il bagno che vogliono tutti</h2>' +
        '<div class="mg-body">' +
        '<p class="mg-p">Bagno e cucina insieme sono la ristrutturazione che cresce di più: +35,3% di richieste in due anni. E cambiano i materiali.</p>' +
        '<p class="mg-p"><b>Microcemento</b> (+101%): un rivestimento continuo di pochi millimetri, senza fughe, che si stende anche sulle piastrelle esistenti.</p>' +
        '<p class="mg-p"><b>Resina</b> (+74%) e <b>SPC</b> (+206%): pavimenti che si posano a secco, con meno demolizioni e cantieri più corti.</p>' +
        '<p class="mg-p"><b>Doccia a filo pavimento</b>: più sicura con l’età e più spazio. Gli interventi contro le barriere architettoniche possono rientrare tra le spese detraibili.</p>' +
        '<p class="mg-small">Dati: Osservatorio ProntoPro, febbraio 2024 – febbraio 2026.</p>' +
        "</div></div>" + folio(i).replace('class="mg-folio"', 'class="mg-folio" style="left:calc(44% + 22px)"') + "</div>";
    } },

    /* 15 · CUCINA */
    { html: function (i) {
      return '<div class="mg-page">' +
        '<div class="mg-photo mg-ph-grow" style="height:290px">' + img("cucina", "Cucina ristrutturata con isola centrale") + "</div>" +
        '<div class="mg-pad" style="padding-top:20px;flex:1;display:flex;flex-direction:column;min-height:0">' + kicker("Abitare") +
        '<h2 class="mg-h2">Cucina, le misure che contano</h2>' +
        '<div class="mg-body"><div class="mg-cols">' +
        '<p class="mg-p">Una buona pianta vale più delle finiture. Rispetta il triangolo di lavoro tra lavello, piano cottura e frigorifero: percorsi brevi, nessun ostacolo.</p>' +
        '<p class="mg-p">Tra due blocchi contrapposti lascia almeno 90–120 cm di passaggio, di più se in cucina si lavora in due. Le prese vanno dove userai davvero gli elettrodomestici.</p>' +
        '<p class="mg-p">Se ristrutturi, il Bonus Mobili ti restituisce il 50% di cucina ed elettrodomestici fino a 5.000 euro di spesa.</p>' +
        '<div class="mg-quote">Prima la pianta, poi le ante. Non il contrario.</div>' +
        "</div></div></div>" + folio(i) + "</div>";
    } },

    /* 16 · ESTERNI */
    { html: function (i) {
      return '<div class="mg-page">' +
        '<div class="mg-photo mg-ph-grow" style="height:290px">' + img("pergola", "Terrazzo con pergola bioclimatica e piante mediterranee") + "</div>" +
        '<div class="mg-pad" style="padding-top:20px;flex:1;display:flex;flex-direction:column;min-height:0">' + kicker("Esterni") +
        '<h2 class="mg-h2">La pergola bioclimatica</h2>' +
        '<div class="mg-body"><div class="mg-cols">' +
        '<p class="mg-p">Le lamelle orientabili regolano luce e aria e, chiuse, riparano dalla pioggia: il terrazzo diventa una stanza in più per gran parte dell’anno.</p>' +
        '<p class="mg-p">Spesso si installa senza permesso di costruire, ma dipende da misure, caratteristiche e regole del tuo Comune, e in condominio dal regolamento. Chiedi all’ufficio tecnico prima di ordinarla.</p>' +
        '<p class="mg-p">Lavanda, rosmarino, mirto e ulivo in vaso chiedono poca acqua. Un impianto a goccia con sensore di pioggia fa il resto.</p>' +
        '<div class="mg-quote">Il terrazzo è una stanza. Va progettato come le altre.</div>' +
        "</div></div></div>" + folio(i) + "</div>";
    } },

    /* 17 · MANUTENZIONE */
    { html: function (i) {
      var card = function (cls, ic, t, items) {
        return '<div class="mg-season ' + cls + '"><div class="h">' + ico(ic) + t + "</div><ul>" + items.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div>";
      };
      return '<div class="mg-page mg-p17" style="flex-direction:row">' +
        '<div class="mg-photo" style="width:36%;height:100%">' + img("grondaia", "Pulizia delle grondaie su un tetto in coppi in autunno") + "</div>" +
        '<div class="mg-pad" style="flex:1;padding-left:20px;padding-right:30px;display:flex;flex-direction:column;min-height:0;min-width:0">' + kicker("Cura della casa") +
        '<h2 class="mg-h2" style="font-size:29px">La casa,<br>stagione per stagione</h2>' +
        '<div class="mg-body"><div class="mg-seasons">' +
          card("au", "leaf", "Autunno", ["Grondaie e pluviali", "Controllo caldaia", "Sfiato termosifoni"]) +
          card("wi", "snow", "Inverno", ["Tubi esterni dal gelo", "Condensa negli angoli", "Arieggia ogni giorno"]) +
          card("sp", "flower", "Primavera", ["Filtri climatizzatore", "Tetto dopo le piogge", "Irrigazione"]) +
          card("su", "sun", "Estate", ["Tende e schermature", "Sigillature balconi", "Salvavita e impianto"]) +
        "</div>" +
        '<div class="mg-box" style="margin-top:10px"><b style="font-family:var(--mg-sans);font-size:10px;letter-spacing:.12em;text-transform:uppercase">Umidità o condensa?</b><br>Aloni a fascia dal pavimento: risalita, serve una diagnosi. Macchie negli angoli e dietro gli armadi: condensa, arieggia e isola i ponti termici. Sopra il 60% di umidità arriva la muffa.</div>' +
        "</div></div>" + folio(i).replace('class="mg-folio"', 'class="mg-folio" style="left:calc(36% + 20px)"') + "</div>";
    } },
    /* 18 · CALDAIA */
    { cover: true, html: function (i) {
      return '<div class="mg-page">' +
        '<div class="mg-bleed mg-photo">' + img("caldaia", "Tecnico durante il controllo annuale della caldaia") + '</div><div class="mg-shade-b"></div>' +
        '<div class="mg-opener">' + kicker("Obblighi di legge") +
        '<h1 class="mg-h1" style="font-size:38px">Caldaia: il controllo <em>non è un optional</em></h1>' +
        '<p class="mg-dek" style="font-size:14px">Ogni impianto ha il suo libretto, dove il tecnico registra manutenzioni e controlli. Il controllo di efficienza energetica, il «controllo fumi», va fatto con la cadenza stabilita dalla tua Regione in base a tipo e potenza. Senza, rischi sanzioni e un impianto meno sicuro.</p></div>' +
        folio(i, true) + "</div>";
    } },

    /* 19 · GLOSSARIO */
    { cover: true, html: function (i) {
      var g = [
        ["APE", "Attestato energetico: serve per vendere o affittare, dura 10 anni."],
        ["CILA", "Comunicazione al Comune per i lavori senza strutture."],
        ["SCIA", "Segnalazione per i lavori su parti strutturali."],
        ["SAL", "Stato avanzamento lavori: ciò che è finito e si paga."],
        ["DURC", "Prova che l’impresa versa i contributi."],
        ["Uw", "Quanto isola una finestra: più è bassa, meglio è."],
        ["POD", "Il codice del tuo contatore della luce."],
        ["PDR", "Il codice del tuo contatore del gas."],
        ["Smc", "L’unità con cui si misura il gas in bolletta."],
        ["ENEA", "L’agenzia a cui comunichi i lavori di risparmio energetico."]
      ];
      return '<div class="mg-page mg-pad mg-gloss">' +
        '<div class="az" aria-hidden="true">A–Z</div>' +
        kicker("Glossario") +
        '<h2 class="mg-h1" style="color:#fff;font-size:42px;margin-bottom:14px">Le parole<br>della <em>casa</em></h2>' +
        '<div class="mg-body"><div class="mg-tiles">' + g.map(function (x, k) {
          return '<div class="' + (k === 0 || k === 7 ? "hot" : "") + '"><b>' + x[0] + "</b><span>" + x[1] + "</span></div>";
        }).join("") + "</div></div>" + folio(i, true) + "</div>";
    } },
    /* 20 · TROVA IMPRESA */
    { cover: true, html: function (i) {
      return '<div class="mg-page">' +
        '<div class="mg-bleed mg-photo">' + img("stretta-mano", "Un artigiano stringe la mano al cliente sulla porta di casa") + '</div><div class="mg-shade-b" style="background:linear-gradient(180deg,rgba(8,12,22,0) 25%,rgba(8,12,22,.75) 55%,rgba(8,12,22,.94) 100%)"></div>' +
        '<div class="mg-opener" style="bottom:46px">' + kicker("Servizio AncheCasa") +
        '<h1 class="mg-h1" style="font-size:44px">Hai letto, hai capito.<br><em>Ora chi lo fa?</em></h1>' +
        '<div class="mg-3steps"><div><i>1</i>Pubblichi gratis quello che ti serve</div><div><i>2</i>Rispondono imprese verificate della tua zona</div><div><i>3</i>Parlate in chat e chiudete voi</div></div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><a class="mg-cta" href="/pubblica">Pubblica la tua richiesta</a><a class="mg-cta ghost light" href="/privato">Come funziona</a></div>' +
        "</div>" + folio(i, true) + "</div>";
    } },
    /* 21 · RETRO */
    { cover: true, html: function () {
      return '<div class="mg-page mg-back-photo">' +
        '<div class="mg-bleed mg-photo">' + img("retro", "Casa di campagna ristrutturata illuminata la sera") + '</div><div class="mg-shade-b"></div>' +
        '<div style="position:absolute;top:34px;left:0;right:0;text-align:center;z-index:3"><img src="assets/logo/anchecasa-payoff-bianco.png" alt="AncheCasa, costruiamo fiducia" style="width:58%;max-width:260px"></div>' +
        '<div class="mg-opener" style="bottom:40px">' + kicker("Nel numero 2 · " + NUMERO.prossimo) +
        '<h2 class="mg-h1" style="font-size:36px">Arriva l’app<br>della <em>raccolta</em></h2>' +
        '<p class="mg-small" style="color:rgba(255,255,255,.88);font-size:12.5px;line-height:1.45;margin:6px 0 10px">Gratuita, collegata al calendario del tuo Comune. La scarichi con il prossimo numero.</p>' +
        '<div class="mg-3steps"><div><i>›</i>Cosa portare fuori stasera, bidone per bidone</div><div><i>›</i>Giorni e orari del tuo Comune, sempre aggiornati</div><div><i>›</i>L’avviso sul telefono la sera prima</div></div>' +
        '<div class="mg-back-cta"><button type="button" class="mg-share-cta is-orange" data-goto="2" data-noflip>Avvisami quando esce</button>' +
        '<button type="button" class="mg-share-cta" data-share data-noflip><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>Condividi la rivista</button></div>' +
        '<p class="mg-small" style="color:rgba(255,255,255,.62);margin-top:10px">AncheCasa Magazine · gratuito su anchecasa.it, dal 1° novembre ogni 15 giorni</p></div>' +
      "</div>";
    } }
  ];

  /* ---------------- strumento: lettura bolletta ---------------- */
  var IB = {
    gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 17 4-5"/><circle cx="12" cy="17" r="1.4" fill="currentColor"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><circle cx="12" cy="13.5" r="2"/><path d="M8.5 20c.4-2 1.8-3 3.5-3s3.1 1 3.5 3"/></svg>',
    euro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.5 6.5A7 7 0 1 0 17.5 17.5"/><path d="M4 10h9M4 14h9"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6v18h12V7Z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>'
  };
  var bolletta = { tipo: "luce", esempio: false };
  function leggiNumero(v) { var n = parseFloat(String(v == null ? "" : v).replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")); return isFinite(n) ? n : NaN; }

  function euro(n, dec) { return n.toLocaleString("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + " €"; }
  function num(n) { return Math.round(n).toLocaleString("it-IT"); }

  var ESEMPIO_B = { luce: { importo: 210, consumo: 420 }, gas: { importo: 345, consumo: 210 } };
  function calcolaBolletta() {
    var q = function (id) { return document.getElementById(id); };
    var importo = leggiNumero(q("mg-b-importo").value);
    var consumo = leggiNumero(q("mg-b-consumo").value);
    var mesi = parseInt(q("mg-b-mesi").value, 10) || 2;
    var persone = parseInt(q("mg-b-persone").value, 10) || 3;
    var r = RIF[bolletta.tipo];
    var esempio = !bolletta.analizzato || !(importo > 0) || !(consumo > 0);
    var manca = !(importo > 0) && !(consumo > 0) ? "" : !(importo > 0) ? "il totale" : !(consumo > 0) ? "il consumo" : "";
    if (esempio) { importo = ESEMPIO_B[bolletta.tipo].importo; consumo = ESEMPIO_B[bolletta.tipo].consumo; mesi = 2; persone = 3; }
    var prezzo = importo / consumo;
    var annuo = consumo * 12 / mesi;
    var spesaAnnua = importo * 12 / mesi;
    var rifConsumo = (bolletta.tipo === "luce" ? RIF.consumoLuce : RIF.consumoGas)[persone];
    var rP = prezzo / r.prezzo;
    var rC = annuo / rifConsumo;
    var vPrezzo = rP > 1.1 ? "bad" : rP < 0.95 ? "ok" : "warn";
    var vCons = rC > 1.25 ? "bad" : rC < 0.8 ? "ok" : "warn";
    var risparmio = rP > 1 ? (prezzo - r.prezzo) * annuo : 0;
    return { esempio: esempio, manca: manca, importo: importo, consumo: consumo, mesi: mesi, persone: persone, prezzo: prezzo, annuo: annuo, spesaAnnua: spesaAnnua, rifConsumo: rifConsumo, rP: rP, rC: rC, vPrezzo: vPrezzo, vCons: vCons, risparmio: risparmio, rif: r };
  }

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

  // Risultato (solo dopo "Analizza"): una frase grande, il risparmio, la lancetta e una riga sui consumi.
  function aggiornaBolletta() {
    var out = document.getElementById("mg-b-out");
    if (!out || !bolletta.analizzato) return;
    var c = calcolaBolletta();
    if (c.esempio) return;
    var r = c.rif, u = r.unita;
    var pct = Math.round((c.rP - 1) * 100);
    var titolo = { bad: "Paghi " + art(pct) + "% in più del giusto", warn: "Il tuo prezzo è nella media", ok: "Il tuo prezzo è buono" }[c.vPrezzo];
    var ratio = Math.max(0.6, Math.min(1.4, c.rP));
    var ang = (ratio - 1) / 0.4 * 90;
    var arc = function (a0, a1, cls) {
      var p = function (a) { var rad = (a - 90) * Math.PI / 180; return [100 + 80 * Math.cos(rad), 100 + 80 * Math.sin(rad)]; };
      var A = p(a0), B = p(a1);
      return '<path class="' + cls + '" d="M' + A[0].toFixed(1) + " " + A[1].toFixed(1) + " A80 80 0 0 1 " + B[0].toFixed(1) + " " + B[1].toFixed(1) + '"/>';
    };
    var gauge = '<svg class="mg-gauge" viewBox="0 0 200 112" role="img" aria-label="Il tuo prezzo rispetto al giusto">' +
      arc(-90, -11.25, "g-ok") + arc(-11.25, 22.5, "g-warn") + arc(22.5, 90, "g-bad") +
      '<g transform="rotate(' + ang.toFixed(1) + ' 100 100)"><line x1="100" y1="100" x2="100" y2="34" class="g-needle"/></g><circle cx="100" cy="100" r="6" class="g-hub"/></svg>';
    var cons = { ok: "meno di", warn: "come", bad: "più di" }[c.vCons];
    var p = c.persone;
    out.innerHTML =
      '<p class="mg-r-cosa">La tua bolletta ' + (bolletta.tipo === "luce" ? "della luce" : "del gas") + "</p>" +
      '<div class="mg-r-big ' + c.vPrezzo + '">' + titolo + "</div>" +
      (c.risparmio > 0
        ? '<div class="mg-r-save"><span>Puoi risparmiare circa</span><b>' + euro(c.risparmio, 0) + "</b><span>all’anno</span></div>"
        : '<div class="mg-r-save ok"><span>Non stai pagando più del necessario.</span></div>') +
      '<div class="mg-r-gauge">' + gauge +
        '<div class="mg-r-prezzi"><div><small>Paghi</small><b>' + euro(c.prezzo, 2) + "</b><small>al " + u + '</small></div><div class="giusto"><small>Prezzo giusto</small><b>' + euro(r.prezzo, 2) + "</b><small>al " + u + "</small></div></div>" +
      "</div>" +
      '<div class="mg-r-cons"><p>Consumi <b>' + cons + "</b> una famiglia di " + (p >= 5 ? "5 o più persone" : p + (p === 1 ? " persona" : " persone")) + " <small>(" + num(c.annuo) + " " + u + " l’anno)</small></p>" +
        '<div class="mg-r-pers" role="group" aria-label="Quante persone siete?"><span>Quante persone siete?</span>' +
        [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-pers="' + n + '" aria-pressed="' + (n === p) + '">' + (n === 5 ? "5+" : n) + "</button>"; }).join("") +
        "</div></div>";
  }

  /* Report PDF su carta intestata AncheCasa (come i contratti): logo, intestazione, numeri grandi, grafici, consigli. */
  function caricaLogo(cb) {
    var im = new Image();
    im.onload = function () {
      try { var cv = document.createElement("canvas"); cv.width = im.naturalWidth; cv.height = im.naturalHeight; cv.getContext("2d").drawImage(im, 0, 0); cb(cv.toDataURL("image/png"), im.naturalWidth / im.naturalHeight); }
      catch (e) { cb(null); }
    };
    im.onerror = function () { cb(null); };
    im.src = "assets/logo-colore.png";
  }

  function scaricaPdf() {
    var c = calcolaBolletta();
    if (c.esempio) return;
    STAT.traccia("bollette_pdf", null, bolletta.tipo);
    if (!window.jspdf || !window.jspdf.jsPDF) {
      var out = document.getElementById("mg-b-out");
      if (out) out.insertAdjacentHTML("beforeend", '<p class="mg-error">Il PDF non si è caricato. Controlla la connessione e riprova.</p>');
      return;
    }
    caricaLogo(function (logo, ratio) { creaPdf(c, logo, ratio); });
  }

  /* Report PDF (09.10.2026 ~17:40): carta AncheCasa elegante e pulita, come i documenti del marchio.
     Foglio bianco, logo centrato, niente riquadri scuri; in fondo le onde curve blu e arancio con i contatti. */
  function creaPdf(c, logo, ratio) {
    var t = testiVerdetto(c);
    var u = c.rif.unita;
    var luce = bolletta.tipo === "luce";
    var doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
    var NAVY = [22, 48, 77], ARANCIO = [229, 107, 16], GRIGIO = [107, 117, 131], INK = [33, 41, 52], LINEA = [226, 231, 238], TENUE = [246, 248, 251];
    var COL = { ok: [47, 125, 77], warn: [196, 132, 18], bad: [194, 65, 43] };
    var fill = function (k) { doc.setFillColor(k[0], k[1], k[2]); };
    var draw = function (k) { doc.setDrawColor(k[0], k[1], k[2]); };
    var ink = function (k) { doc.setTextColor(k[0], k[1], k[2]); };
    var font = function (stile, size) { doc.setFont("helvetica", stile); doc.setFontSize(size); };
    var oggi = new Date();
    var codice = "AC-CB-" + oggi.getFullYear() + String(oggi.getMonth() + 1).padStart(2, "0") + String(oggi.getDate()).padStart(2, "0") + "-" + String(oggi.getHours()).padStart(2, "0") + String(oggi.getMinutes()).padStart(2, "0");
    var L = 20, R = 190, W = R - L, MID = 105;
    var titolo = function (testo, y) { font("bold", 8); ink(ARANCIO); doc.text(testo.toUpperCase(), L, y, { charSpace: 0.6 }); draw(LINEA); doc.setLineWidth(0.25); doc.line(L, y + 2.2, R, y + 2.2); };

    // ---- intestazione: logo centrato, titolo, sottotitolo
    if (logo) { var lh = 13, lw = lh * ratio; doc.addImage(logo, "PNG", MID - lw / 2, 14, lw, lh); }
    else { font("bold", 18); ink(NAVY); doc.text("AncheCasa", MID, 24, { align: "center" }); }
    fill(ARANCIO); doc.rect(MID - 8, 31, 16, 0.8, "F");
    font("bold", 17); ink(NAVY); doc.text("Report Check Bollette", MID, 40, { align: "center" });
    font("normal", 9); ink(GRIGIO);
    doc.text("Bolletta " + (luce ? "della luce" : "del gas") + "  ·  analisi del " + oggi.toLocaleDateString("it-IT") + "  ·  report n. " + codice, MID, 46, { align: "center" });

    // ---- il risultato in una frase
    var y = 58;
    titolo("Il risultato", y);
    var pct = Math.round((c.rP - 1) * 100);
    var frase = { bad: "Paghi " + art(pct) + "% in più del giusto", warn: "Il tuo prezzo è nella media", ok: "Il tuo prezzo è buono" }[c.vPrezzo];
    font("bold", 20); ink(COL[c.vPrezzo]); doc.text(frase, L, y + 13);
    font("normal", 10); ink(INK);
    if (c.risparmio > 0) {
      doc.text("Allineandoti al prezzo giusto puoi risparmiare circa", L, y + 21);
      font("bold", 24); ink(ARANCIO); doc.text(euro(c.risparmio, 0), L, y + 32);
      var wv = doc.getTextWidth(euro(c.risparmio, 0));
      font("normal", 11); ink(GRIGIO); doc.text("all’anno", L + wv + 3, y + 32);
    } else {
      doc.text("Non stai pagando più del necessario: tieni d’occhio le prossime bollette.", L, y + 21);
    }

    // ---- lancetta + prezzi
    y = 104;
    titolo("Il prezzo che paghi", y);
    var cx = L + 30, cy = y + 33, rr = 22;
    var pt = function (a, r) { var rad = (a - 90) * Math.PI / 180; return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]; };
    doc.setLineWidth(4.2); if (doc.setLineCap) doc.setLineCap("butt");
    for (var a = -90; a < 90; a += 1.5) {
      var kk = a < -11.25 ? COL.ok : a < 22.5 ? COL.warn : COL.bad;
      draw(kk); var p1 = pt(a, rr), p2 = pt(Math.min(90, a + 1.7), rr); doc.line(p1[0], p1[1], p2[0], p2[1]);
    }
    var ratioP = Math.max(0.6, Math.min(1.4, c.rP));
    var tip = pt((ratioP - 1) / 0.4 * 90, rr - 5);
    draw(NAVY); doc.setLineWidth(0.9); doc.line(cx, cy, tip[0], tip[1]);
    fill(NAVY); doc.circle(cx, cy, 1.8, "F");
    font("normal", 7); ink(GRIGIO); doc.text("paghi meno", cx - rr - 2, cy + 5); doc.text("paghi di più", cx + rr + 2, cy + 5, { align: "right" });
    var px = L + 70;
    font("bold", 16);
    var v1 = euro(c.prezzo, 3), v2 = euro(c.rif.prezzo, 3);
    fill(COL[c.vPrezzo]); doc.rect(px, y + 12, 1.2, 13, "F");
    font("normal", 8.5); ink(GRIGIO); doc.text("Tu paghi, tutto compreso", px + 5, y + 16);
    font("bold", 16); ink(NAVY); doc.text(v1 + " / " + u, px + 5, y + 23);
    fill(COL.ok); doc.rect(px, y + 30, 1.2, 13, "F");
    font("normal", 8.5); ink(GRIGIO); doc.text("Prezzo giusto di riferimento", px + 5, y + 34);
    font("bold", 16); ink(NAVY); doc.text(v2 + " / " + u, px + 5, y + 41);
    font("normal", 8.4); ink(GRIGIO);
    doc.text(doc.splitTextToSize("Il prezzo giusto è il riferimento ARERA per una famiglia come la tua, con tasse e quote fisse comprese.", R - (px + 62)), px + 62, y + 16);

    // ---- consumi
    y = 158;
    titolo("I tuoi consumi", y);
    font("normal", 9.5); ink(INK);
    doc.text(doc.splitTextToSize(t.tCons, W), L, y + 9);
    var max = Math.max(c.annuo, c.rifConsumo) * 1.1, bw = W - 70;
    [["Tu", c.annuo, c.vCons === "bad" ? COL.bad : ARANCIO], ["Famiglia come la tua", c.rifConsumo, [176, 187, 201]]].forEach(function (r, i) {
      var by = y + 17 + i * 8;
      font("normal", 8.5); ink(GRIGIO); doc.text(r[0], L, by + 3.2);
      fill(TENUE); doc.roundedRect(L + 40, by, bw, 4, 2, 2, "F");
      fill(r[2]); doc.roundedRect(L + 40, by, Math.max(4, bw * r[1] / max), 4, 2, 2, "F");
      font("bold", 9); ink(NAVY); doc.text(num(r[1]) + " " + u, R, by + 3.3, { align: "right" });
    });

    // ---- i dati della bolletta
    y = 196;
    titolo("I dati che hai inserito", y);
    var dati = [
      ["Totale della bolletta", euro(c.importo, 2)], ["Consumo nel periodo", num(c.consumo) + " " + u],
      ["Periodo", c.mesi + (c.mesi === 1 ? " mese" : " mesi")], ["Persone in casa", c.persone === 5 ? "5 o più" : String(c.persone)],
      ["Spesa annua stimata", euro(c.spesaAnnua, 0)], ["Consumo annuo stimato", num(c.annuo) + " " + u]
    ];
    var colw = (W - 12) / 2;
    dati.forEach(function (d, i) {
      var x = L + (i % 2) * (colw + 12), yy = y + 9 + Math.floor(i / 2) * 7;
      font("normal", 9); ink(GRIGIO); doc.text(d[0], x, yy);
      font("bold", 9); ink(NAVY); doc.text(d[1], x + colw, yy, { align: "right" });
      draw(LINEA); doc.setLineWidth(0.2); doc.line(x, yy + 2.4, x + colw, yy + 2.4);
    });

    // ---- cosa fare adesso
    y = 226;
    titolo("Cosa fare adesso", y);
    var passi = [
      "Confronta le offerte con il codice POD o PDR alla mano, anche sul Portale Offerte ARERA (ilportaleofferte.it).",
      "Controlla che la lettura in bolletta sia reale e non stimata; se serve, comunica l’autolettura.",
      "Se i consumi sono alti, un controllo di impianti e isolamento vale più di un cambio di tariffa: su anchecasa.it trovi i tecnici della tua zona."
    ];
    var yy = y + 8;
    passi.forEach(function (p, i) {
      font("bold", 10); ink(ARANCIO); doc.text(String(i + 1), L + 1, yy + 0.2);
      var ll = doc.splitTextToSize(p, W - 8); font("normal", 9); ink(INK); doc.text(ll, L + 7, yy);
      yy += ll.length * 4.1 + 2.2;
    });

    // ---- nota
    font("normal", 6.6); ink(GRIGIO);
    doc.text(doc.splitTextToSize("Prezzo di riferimento: " + c.rif.fonte + ". Consumi di riferimento: stime AncheCasa su dati ARERA. Il prezzo medio include quote fisse e potenza impegnata: con consumi bassi risulta più alto. Stima indicativa a scopo informativo, non è una consulenza.", W), L, 262);

    // ---- piede: onde curve nei colori AncheCasa
    function onda(y0, y1, ampiezza, colore) {
      var passi = 48, pts = [], x0 = 0, x1 = 210;
      for (var i = 0; i <= passi; i++) {
        var x = x0 + (x1 - x0) * i / passi;
        var tt = i / passi;
        pts.push([x, y0 + (y1 - y0) * tt - ampiezza * Math.sin(Math.PI * tt)]);
      }
      pts.push([210, 297], [0, 297]);
      var seg = [];
      for (var j = 1; j < pts.length; j++) seg.push([pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]]);
      fill(colore); doc.lines(seg, pts[0][0], pts[0][1], [1, 1], "F", true);
    }
    onda(281, 272, 5, ARANCIO);
    onda(284.5, 276, 5.5, NAVY);
    font("bold", 8.5); ink([255, 255, 255]); doc.text("anchecasa.it", L, 290);
    font("normal", 7.5); ink([205, 215, 228]);
    doc.text("info@anchecasa.it  ·  © " + oggi.getFullYear() + " AncheCasa  ·  Report Check Bollette, AncheCasa Magazine N." + NUMERO.n, L + 22, 290);
    doc.text("Pagina 1 di 1", R, 290, { align: "right" });
    doc.save("AncheCasa-report-bolletta-" + (luce ? "luce" : "gas") + ".pdf");
  }

  function initBolletta() {
    var box = document.getElementById("mg-bolletta");
    if (!box) return;
    var $ = function (id) { return document.getElementById(id); };
    var campi = { importo: $("mg-b-importo"), consumo: $("mg-b-consumo"), mesi: $("mg-b-mesi"), persone: $("mg-b-persone") };
    function aggiornaTipo() {
      var luce = bolletta.tipo === "luce";
      box.querySelectorAll("[data-tipo]").forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-tipo") === bolletta.tipo ? "true" : "false"); });
      $("mg-b-unit").textContent = luce ? "kWh" : "Smc";
    }
    function salva() { bolletta.campi = { importo: campi.importo.value, consumo: campi.consumo.value, mesi: campi.mesi.value, persone: campi.persone.value }; }
    function vista(res) { $("mg-b-dati").hidden = res; $("mg-b-res").hidden = !res; }
    function msg(t) { $("mg-b-msg").textContent = t || ""; }
    function analizza() {
      var mI = !(leggiNumero(campi.importo.value) > 0), mC = !(leggiNumero(campi.consumo.value) > 0);
      ["importo", "consumo"].forEach(function (k) { campi[k].closest(".mg-q").classList.remove("manca"); });
      if (mI || mC) {
        var k = mI ? "importo" : "consumo";
        msg(mI && mC ? "Scrivi quanto hai pagato e quanto hai consumato." : mI ? "Scrivi quanto hai pagato." : "Scrivi quanto hai consumato.");
        var q = campi[k].closest(".mg-q");
        q.classList.add("manca"); void q.offsetWidth;
        campi[k].focus({ preventScroll: true });
        return;
      }
      msg("");
      bolletta.analizzato = true;
      aggiornaBolletta();
      vista(true);
      STAT.traccia("bollette_uso", null, bolletta.tipo);
      salva();
    }
    box.querySelectorAll("[data-tipo]").forEach(function (b) {
      b.addEventListener("click", function () { bolletta.tipo = b.getAttribute("data-tipo"); aggiornaTipo(); });
    });
    ["importo", "consumo"].forEach(function (k) {
      campi[k].addEventListener("input", function () { campi[k].closest(".mg-q").classList.remove("manca"); msg(""); salva(); });
      campi[k].addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        if (k === "importo") campi.consumo.focus(); else analizza();
      });
    });
    campi.mesi.addEventListener("change", salva);
    $("mg-b-go").addEventListener("click", analizza);
    $("mg-b-edit").addEventListener("click", function () { bolletta.analizzato = false; vista(false); campi.importo.focus({ preventScroll: true }); });
    $("mg-b-out").addEventListener("click", function (e) {
      var b = e.target.closest("[data-pers]");
      if (!b) return;
      campi.persone.value = b.getAttribute("data-pers");
      salva();
      aggiornaBolletta();
    });
    $("mg-b-pdf").addEventListener("click", scaricaPdf);
    box.querySelectorAll(".mg-tool-actions a").forEach(function (a) {
      a.addEventListener("click", function () { STAT.traccia("offerte", null, PARTNER_ENERGIA.nome || "portale ARERA"); });
    });
    if (bolletta.campi) {
      campi.importo.value = bolletta.campi.importo; campi.consumo.value = bolletta.campi.consumo;
      campi.mesi.value = bolletta.campi.mesi || "2"; campi.persone.value = bolletta.campi.persone || "3";
    }
    aggiornaTipo();
    if (bolletta.analizzato && !calcolaBolletta().esempio) { aggiornaBolletta(); vista(true); } else { bolletta.analizzato = false; vista(false); }
  }

  /* ---------------- iscrizione agli avvisi (app raccolta + nuovi numeri) ---------------- */
  function initAvvisi() {
    document.querySelectorAll(".mg-p2-open").forEach(function (b) {
      if (b.dataset.pronto) return;
      b.dataset.pronto = "1";
      b.addEventListener("click", function () {
        var box = b.parentNode, f = box.querySelector(".mg-avvisi");
        var aperto = f.hidden;
        f.hidden = !aperto;
        box.classList.toggle("is-open", aperto);
        b.setAttribute("aria-expanded", aperto ? "true" : "false");
        if (aperto) f.elements.mail.focus();
      });
    });
    document.querySelectorAll(".mg-avvisi").forEach(function (f) {
      if (f.dataset.pronto) return;
      f.dataset.pronto = "1";
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var esito = f.querySelector(".esito");
        var mail = f.elements.mail.value.trim();
        var scrivi = function (t, ok) { esito.hidden = false; esito.textContent = t; esito.className = "esito" + (ok ? " si" : " no"); };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { scrivi("Scrivi una mail valida.", false); f.elements.mail.focus(); return; }
        if (!f.elements.privacy.checked) { scrivi("Spunta l’informativa privacy per continuare.", false); return; }
        var btn = f.querySelector("button[type=submit]");
        btn.disabled = true;
        var fatto = function () {
          f.querySelectorAll("input,button").forEach(function (x) { x.disabled = true; });
          scrivi("Fatto! Ti scriviamo appena l’app è pronta e a ogni nuovo numero.", true);
          try { localStorage.setItem("anchecasa-avvisi", "1"); } catch (er) {}
        };
        var errore = function () { btn.disabled = false; scrivi("Non è partito. Riprova tra poco o scrivi a info@anchecasa.it.", false); };
        if (!/(^|\.)anchecasa\.it$/.test(location.hostname)) { fatto(); return; } // anteprima: non scrive nel database
        // Va alla funzione Vercel /api/mag: salva in magazine_iscritti (o, se la tabella non c'è ancora, in richieste_iscrizione).
        fetch("/api/mag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ iscrizione: { mail: mail, comune: f.elements.comune.value.trim(), interesse: "App raccolta rifiuti e nuovi numeri della rivista", numero: NUMERO.n, privacy: true } })
        }).then(function (r) { if (r.ok) { STAT.traccia("avvisi"); fatto(); } else errore(); }).catch(errore);
      });
    });
  }

  /* ---------------- sfogliabile ---------------- */
  var root = document.getElementById("mg-root");
  if (!root) return;
  var stage = root.querySelector(".mg-stage");
  var scaler = root.querySelector(".mg-scaler");
  var book = root.querySelector(".mg-book");
  var counter = root.querySelector(".mg-counter") || { textContent: "" };
  var btnPrev = root.querySelector("[data-act=prev]");
  var btnNext = root.querySelector("[data-act=next]");
  var btnFs = root.querySelector("[data-act=fs]") || document.createElement("button");
  var hint = root.querySelector(".mg-hint") || document.createElement("p");

  var total = PAGINE.length;
  var mode = null, leaves = [], leafCount = 0, maxFlipped = 0, flipped = 0, pageIndex = 0, turnTimer = null;

  try { localStorage.removeItem("anchecasa-mag-1"); } catch (e) { /* storage non disponibile */ }
  if (location.hash) {
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e2) { /* indirizzo non modificabile */ }
  }

  function currentMode() { return window.innerWidth >= 900 && window.innerHeight >= 520 ? "spread" : "single"; }
  function size() { return mode === "spread" ? SPREAD : SINGLE; }

  function face(index, side) {
    var div = document.createElement("div");
    div.className = "mg-face " + side;
    if (index == null || index >= total) { div.setAttribute("aria-hidden", "true"); return div; }
    var p = PAGINE[index];
    if (p.cover) div.classList.add("is-cover");
    div.innerHTML = p.html(index);
    var curl = document.createElement("div"); curl.className = "mg-curl"; div.appendChild(curl);
    return div;
  }

  // Telefono (09.10.2026, 2ª versione): la pagina prende l'altezza giusta per riempire lo schermo sotto la testata,
  // da 640 a 760 unità di disegno (sotto 640 i testi non ci stanno). Larghezza di disegno sempre 400.
  var SINGLE_MIN = 640, SINGLE_MAX = 760;
  function altezzaSingola() {
    var w = Math.max(1, stage.clientWidth - 4), h = stage.clientHeight;
    if (window.__mgH) return window.__mgH;
    if (h < 100) return 740;
    return Math.round(Math.max(SINGLE_MIN, Math.min(SINGLE_MAX, 400 * h / w)));
  }
  // Pagina più corta di 740 (telefono): la foto in alto si accorcia della stessa misura, così il testo resta intero.
  // Si misurano le foto con la pagina alta 740 e poi si tolgono i pixel mancanti (minimo 120).
  function adattaFoto() {
    root.classList.toggle("mg-corto", mode === "single" && SINGLE.h < 700);
    if (mode !== "single" || SINGLE.h >= 740) return;
    var taglio = 740 - SINGLE.h;
    book.style.height = "740px";
    var foto = [];
    book.querySelectorAll(".mg-face > .mg-page > .mg-photo:first-child").forEach(function (f) {
      if (f.classList.contains("mg-bleed")) return;
      var h = f.offsetHeight;
      if (h > 0 && h < 600) foto.push([f, h]);
    });
    foto.forEach(function (x) { x[0].style.setProperty("height", Math.max(120, x[1] - taglio) + "px", "important"); });
    book.style.height = SINGLE.h + "px";
  }
  function build() {
    mode = currentMode();
    // Telefono (09.10.2026): niente testata del sito, rivista a tutta altezza, capsula di pulsanti sopra la pagina.
    document.body.classList.toggle("mg-phone", window.matchMedia("(max-width: 699px), (max-height: 519px)").matches);
    if (mode === "single") SINGLE.h = altezzaSingola();
    root.classList.toggle("is-single", mode === "single");
    root.classList.toggle("is-spread", mode === "spread");
    var sz = size();
    leafCount = mode === "spread" ? Math.ceil(total / 2) : total;
    maxFlipped = mode === "spread" ? leafCount : total - 1;
    book.innerHTML = "";
    leaves = [];
    var edgeL = document.createElement("div"); edgeL.className = "mg-edge"; edgeL.style.left = "-4px"; edgeL.dataset.edge = "l";
    var edgeR = document.createElement("div"); edgeR.className = "mg-edge"; edgeR.style.right = "-4px"; edgeR.dataset.edge = "r";
    book.appendChild(edgeL); book.appendChild(edgeR);
    for (var k = 0; k < leafCount; k++) {
      var leaf = document.createElement("div");
      leaf.className = "mg-leaf";
      leaf.style.left = (mode === "spread" ? sz.w : 0) + "px";
      leaf.style.width = sz.w + "px";
      leaf.appendChild(face(mode === "spread" ? 2 * k : k, "front"));
      leaf.appendChild(face(mode === "spread" ? 2 * k + 1 : null, "back"));
      var shine = document.createElement("div"); shine.className = "mg-shine"; leaf.appendChild(shine);
      book.appendChild(leaf);
      leaves.push(leaf);
    }
    adattaFoto();
    book.querySelectorAll("[data-goto]").forEach(function (b) {
      b.addEventListener("click", function () { goToPage(+b.getAttribute("data-goto")); });
    });
    initBolletta();
    initAvvisi();
    hint.textContent = mode === "spread" ? "Clicca sulla pagina o usa le frecce ← → per sfogliare" : "Scorri col dito o tocca il bordo della pagina per sfogliare";
    btnFs.hidden = mode !== "spread";
    mosse = false;
    book.style.transition = "none";
    leaves.forEach(function (l) { l.style.transition = "none"; });
    flipped = mode === "spread" ? Math.min(Math.ceil(pageIndex / 2), maxFlipped) : Math.min(pageIndex, maxFlipped);
    render(null);
    fit();
  }

  function render(turning) {
    var sz = size();
    for (var k = 0; k < leafCount; k++) {
      var l = leaves[k];
      var isF = k < flipped;
      l.classList.toggle("is-flipped", isF);
      l.classList.toggle("is-turning", turning === k);
      l.style.zIndex = turning === k ? leafCount + 2 : isF ? k + 1 : leafCount - k;
      l.style.visibility = mode === "single" && isF && k < flipped - 1 && turning !== k ? "hidden" : "";
      var fr = l.children[0], bk = l.children[1];
      var vis = (!isF && k === flipped) || (isF && k === flipped - 1 && mode === "spread");
      fr.setAttribute("aria-hidden", !isF && k === flipped ? "false" : "true");
      bk.setAttribute("aria-hidden", isF && k === flipped - 1 && mode === "spread" ? "false" : "true");
      if (!vis) { fr.setAttribute("inert", ""); bk.setAttribute("inert", ""); }
      else { fr.toggleAttribute("inert", isF); bk.toggleAttribute("inert", !isF); }
    }
    var shift = mode === "spread" ? (flipped === 0 ? -sz.w / 2 : flipped === maxFlipped ? sz.w / 2 : 0) : 0;
    book.style.transform = "translateX(" + shift + "px)";
    book.querySelector("[data-edge=l]").hidden = !(mode === "spread" && flipped > 0);
    book.querySelector("[data-edge=r]").hidden = !(flipped < maxFlipped);
    btnPrev.disabled = flipped === 0;
    btnNext.disabled = flipped === maxFlipped;
    var label;
    if (pageIndex === 0) label = "Copertina";
    else if (pageIndex === total - 1) label = "Retro di copertina";
    else if (mode === "spread" && pageIndex % 2 === 1 && pageIndex + 1 < total - 1) label = "Pagine " + pageIndex + "–" + (pageIndex + 1) + " di " + (total - 2);
    else label = "Pagina " + pageIndex + " di " + (total - 2);
    counter.textContent = label;
    stage.setAttribute("aria-label", "AncheCasa Magazine numero " + NUMERO.n + ", " + label);
  }

  function setFlipped(n) {
    n = Math.max(0, Math.min(n, maxFlipped));
    if (n === flipped) return;
    if (!mosse) {
      mosse = true;
      book.style.transition = "";
      leaves.forEach(function (l) { l.style.transition = ""; });
      void book.offsetWidth;
    }
    var moving = n > flipped ? flipped : n;
    var salto = Math.abs(n - flipped) > 1;
    flipped = n;
    pageIndex = mode === "spread" ? (n === 0 ? 0 : Math.min(2 * n - 1, total - 1)) : n;
    STAT.traccia("pagina", pageIndex);
    if (mode === "spread" && pageIndex > 0 && pageIndex + 1 < total) STAT.traccia("pagina", pageIndex + 1);
    if (salto) leaves.forEach(function (l) { l.style.transitionDuration = ".6s"; });
    render(moving);
    clearTimeout(turnTimer);
    turnTimer = setTimeout(function () {
      leaves.forEach(function (l) { l.style.transitionDuration = ""; });
      render(null);
    }, TURN_MS);
  }
  function next() { setFlipped(flipped + 1); }
  function prev() { setFlipped(flipped - 1); }
  function goToPage(i) {
    var p = Math.max(0, Math.min(i, total - 1));
    setFlipped(mode === "spread" ? Math.ceil(p / 2) : p);
  }

  function fit() {
    var sz = size();
    var bookW = mode === "spread" ? sz.w * 2 : sz.w;
    root.style.top = "";
    root.style.height = "";
    root.style.bottom = "";
    stage.style.width = "";
    stage.style.height = "";
    var availW = Math.max(1, stage.clientWidth - (mode === "spread" ? 32 : 4));
    var availH = stage.clientHeight;
    if (availH < 40) return;
    // Telefono: la capsula dei pulsanti galleggia sopra il fondo della pagina; ne copre solo il piè di pagina.
    // (telefono: la capsula ora sta sotto la pagina, nessuna riserva)
    var scale = Math.max(0.3, Math.min(availW / bookW, availH / sz.h, mode === "spread" ? 1.8 : 4));
    var drawnH = sz.h * scale;
    scaler.style.width = bookW + "px";
    scaler.style.height = sz.h + "px";
    scaler.style.top = (document.body.classList.contains("mg-phone") ? 0 : Math.max(0, (availH - drawnH) / 2)) + "px";
    scaler.style.transform = "translateX(-50%) scale(" + scale + ")";
    book.style.width = bookW + "px";
    book.style.height = sz.h + "px";
    root.classList.add("is-ready");
  }

  // Il dito gira la pagina: verso sinistra avanti, verso destra indietro.
  var down = null, swiped = false, mosse = false;
  function fineDito(e) {
    var d = down; down = null;
    if (!d || e.pointerId !== d.id) return;
    var dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) > 12 || Math.abs(dy) > 12) swiped = true;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next(); else prev();
    }
  }
  stage.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest(NO_FLIP)) return;
    down = { x: e.clientX, y: e.clientY, id: e.pointerId };
    swiped = false;
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* cattura non disponibile */ }
  });
  stage.addEventListener("pointerup", fineDito);
  stage.addEventListener("pointercancel", fineDito);
  stage.addEventListener("click", function (e) {
    if (swiped) { swiped = false; return; }
    if (e.target.closest(NO_FLIP)) return;
    var sel = window.getSelection && window.getSelection();
    if (sel && String(sel)) return;
    var r = book.getBoundingClientRect();
    var rel = (e.clientX - r.left) / r.width;
    if (mode === "spread") {
      if (flipped === 0) return next();
      if (flipped === maxFlipped) return prev();
      return rel > 0.5 ? next() : prev();
    }
    return rel > 0.4 ? next() : prev();
  });
  document.addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest("input,select,textarea")) return;
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });
  btnPrev.addEventListener("click", prev);
  btnNext.addEventListener("click", next);
  var btnToc = root.querySelector("[data-act=toc]");
  if (btnToc) btnToc.addEventListener("click", function () { goToPage(2); });
  // Schermo intero vero: dove il browser lo permette (Android, PC). Su iPhone si ottiene da "Aggiungi a Home".
  var btnPieno = root.querySelector("[data-act=pieno]");
  var docEl = document.documentElement;
  var puoPieno = !!(docEl.requestFullscreen || docEl.webkitRequestFullscreen) && !/iPhone|iPod/.test(navigator.userAgent) && !(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
  if (btnPieno && puoPieno) {
    btnPieno.hidden = false;
    btnPieno.addEventListener("click", function () {
      var dentro = document.fullscreenElement || document.webkitFullscreenElement;
      try {
        if (dentro) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else { var r = (docEl.requestFullscreen || docEl.webkitRequestFullscreen).call(docEl, { navigationUI: "hide" }); if (r && r.catch) r.catch(function () {}); }
      } catch (e) { /* schermo intero non disponibile */ }
    });
    ["fullscreenchange", "webkitfullscreenchange"].forEach(function (ev) {
      document.addEventListener(ev, function () {
        btnPieno.classList.toggle("is-on", !!(document.fullscreenElement || document.webkitFullscreenElement));
        setTimeout(fit, 80);
      });
    });
  }
  btnFs.addEventListener("click", function () {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (root.requestFullscreen) root.requestFullscreen().catch(function () {});
    } catch (e) { /* schermo intero non disponibile */ }
  });
  document.addEventListener("fullscreenchange", fit);

  var resizeT = null;
  var lastW = window.innerWidth;
  var lastH = window.innerHeight;
  function onResize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    if (currentMode() !== mode) { lastW = w; lastH = h; build(); return; }
    if (mode === "single" && Math.abs(altezzaSingola() - SINGLE.h) > 12) { lastW = w; lastH = h; build(); return; }
    if (mode === "single" && Math.abs(w - lastW) < 30 && Math.abs(h - lastH) < 48) return;
    lastW = w;
    lastH = h;
    clearTimeout(resizeT);
    resizeT = setTimeout(fit, 120);
  }
  window.addEventListener("resize", onResize);

  build();
  if (!root.classList.contains("is-ready")) requestAnimationFrame(fit);
})();

/* ===== Condividi la rivista (2026-10-09) =====
   Telefono: menu di condivisione del sistema (WhatsApp, Telegram, messaggi…).
   PC: pannello in vetro con WhatsApp, Facebook, Telegram, Email, Copia link. */
(function () {
  var URL_RIVISTA = "https://anchecasa.it/magazine.html";
  var TITOLO = "AncheCasa Magazine";
  var TESTO = "Ti consiglio AncheCasa Magazine: la rivista gratuita sulla casa, si sfoglia come una vera rivista. Dentro c’è anche il Check Bollette gratis.";
  var ICO = {
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3Z"/></svg>',
    fb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.7V4.4a22 22 0 0 0-2.5-.1c-2.4 0-4.1 1.5-4.1 4.2v2.3H7.5V14h2.7v8h3.3Z"/></svg>',
    tg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.5 4.2 18.4 19c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.7 8.5-7.7c.4-.3-.1-.5-.6-.2L6.7 12.9 2.2 11.5c-1-.3-1-1 .2-1.4L20.2 3.2c.8-.3 1.5.2 1.3 1Z"/></svg>',
    ml: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    ln: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>'
  };
  var pannello = null, aperto = false, ultimoBtn = null;

  // Il link porta "?da=canale": nelle statistiche si vede da quale condivisione arrivano i nuovi lettori.
  function link(da) {
    var base = /(^|\.)anchecasa\.it$/.test(location.hostname) ? location.origin + location.pathname : URL_RIVISTA;
    return da ? base + "?da=" + da : base;
  }
  function conta(canale) { if (window.ACMagStat) window.ACMagStat.traccia("condividi", null, canale); }
  function voci() {
    var u = function (da) { return encodeURIComponent(link(da)); }, t = encodeURIComponent(TESTO);
    return [
      ["wa", "WhatsApp", "https://wa.me/?text=" + t + "%20" + u("whatsapp")],
      ["fb", "Facebook", "https://www.facebook.com/sharer/sharer.php?u=" + u("facebook")],
      ["tg", "Telegram", "https://t.me/share/url?url=" + u("telegram") + "&text=" + t],
      ["ml", "Email", "mailto:?subject=" + encodeURIComponent(TITOLO + ": la rivista gratuita sulla casa") + "&body=" + t + "%0A%0A" + u("email")]
    ];
  }
  function crea() {
    pannello = document.createElement("div");
    pannello.className = "mg-share";
    pannello.setAttribute("role", "dialog");
    pannello.setAttribute("aria-label", "Condividi la rivista");
    pannello.hidden = true;
    pannello.innerHTML = '<p class="t">Condividi la rivista</p><div class="g">' +
      voci().map(function (v) {
        return '<a class="s s-' + v[0] + '" data-canale="' + v[1].toLowerCase() + '" href="' + v[2] + '" target="_blank" rel="noopener">' + ICO[v[0]] + "<span>" + v[1] + "</span></a>";
      }).join("") +
      '<button type="button" class="s s-ln" data-copia>' + ICO.ln + "<span>Copia link</span></button></div>" +
      '<p class="ok" role="status" aria-live="polite"></p>';
    document.body.appendChild(pannello);
    pannello.addEventListener("click", function (e) {
      if (e.target.closest("[data-copia]")) { conta("link copiato"); copia(); return; }
      var a = e.target.closest("a");
      if (a) { conta(a.getAttribute("data-canale") || "altro"); setTimeout(chiudi, 150); }
    });
  }
  function copia() {
    var ok = pannello.querySelector(".ok");
    var fatto = function () { ok.textContent = "Link copiato: incollalo dove vuoi."; setTimeout(function () { ok.textContent = ""; }, 2500); };
    try {
      if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(link("link")).then(fatto, vecchio); return; }
    } catch (e) { /* uso il metodo vecchio */ }
    vecchio();
    function vecchio() {
      var ta = document.createElement("textarea");
      ta.value = link("link"); ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); fatto(); } catch (e2) { ok.textContent = link("link"); }
      document.body.removeChild(ta);
    }
  }
  function posiziona(btn) {
    var r = btn.getBoundingClientRect();
    var w = pannello.offsetWidth, h = pannello.offsetHeight;
    var x = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2));
    var y = r.top - h - 12;
    if (y < 12) y = r.bottom + 12;
    pannello.style.left = x + "px";
    pannello.style.top = y + "px";
  }
  function apri(btn) {
    if (!pannello) crea();
    ultimoBtn = btn;
    pannello.hidden = false;
    posiziona(btn);
    requestAnimationFrame(function () { pannello.classList.add("is-on"); });
    aperto = true;
    btn.setAttribute("aria-expanded", "true");
    var primo = pannello.querySelector(".s");
    if (primo) primo.focus({ preventScroll: true });
  }
  function chiudi() {
    if (!pannello || !aperto) return;
    pannello.classList.remove("is-on");
    pannello.hidden = true;
    aperto = false;
    if (ultimoBtn) ultimoBtn.setAttribute("aria-expanded", "false");
  }
  function condividi(btn) {
    var tocco = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if (navigator.share && tocco) {
      navigator.share({ title: TITOLO, text: TESTO, url: link("condiviso") }).then(function () { conta("menu telefono"); }).catch(function () { /* annullato */ });
      return;
    }
    if (aperto) chiudi(); else apri(btn);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest('[data-act="share"], [data-share]');
    if (btn) { e.preventDefault(); e.stopPropagation(); condividi(btn); return; }
    if (aperto && !e.target.closest(".mg-share")) chiudi();
  }, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") chiudi(); });
  window.addEventListener("resize", chiudi);
  window.addEventListener("scroll", chiudi, { passive: true });
})();
