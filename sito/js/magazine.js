/* AncheCasa Magazine · sfogliabile.
   Le pagine sono disegnate a misura fissa e il libro viene scalato per lo schermo.
   Doppia pagina da 900 px in su, pagina singola sul telefono.
   Per un nuovo numero: cambia NUMERO e l'array PAGINE. */
(function () {
  "use strict";

  var NUMERO = { n: 1, data: "9 ottobre 2026", prossimo: "23 ottobre 2026", cartella: "magazine/numero-1/" };
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
        '<div class="mg-bleed mg-photo">' + img("copertina", "Una coppia nel soggiorno appena ristrutturato") + "</div>" +
        '<div class="mg-shade-t"></div><div class="mg-shade-b"></div>' +
        '<div class="mg-masthead"><div class="name">Anche<span>Casa</span></div><div class="sub">Magazine</div></div>' +
        '<div class="mg-issue"><span>N. 1</span><span>' + NUMERO.data + '</span><span>Quindicinale · gratuito</span></div>' +
        '<div class="mg-coverlines">' +
          '<div class="mg-cl-big"><div class="n">83</div><div class="t">giorni per il bonus casa al 50%. Poi si scende.</div></div>' +
          "<div>" +
            '<div class="mg-cl"><b>Energia</b><span>Prima isola, poi scalda: l’ordine giusto dei lavori</span></div>' +
            '<div class="mg-cl"><b>Cantiere</b><span>Il preventivo blindato in sette mosse</span></div>' +
            '<div class="mg-cl"><b>Tendenze</b><span>Microcemento e SPC, i materiali che corrono</span></div>' +
          "</div>" +
        "</div>" +
        '<button type="button" class="mg-sticker" data-goto="8" aria-label="Paghi troppo di bolletta? Strumento gratuito a pagina 8">' +
          '<span class="k">In regalo</span>' +
          '<span class="h"><em>Paghi troppo</em><br>di bolletta?</span>' +
          '<span class="d">Lo scopri in 30 secondi con il nostro strumento gratuito</span>' +
          '<span class="p">pag. 8</span>' +
        '</button>' +
        '<div class="mg-slogan">Costruiamo fiducia</div>' +
      "</div>";
    } },

    /* 1 · EDITORIALE */
    { html: function (i) {
      return '<div class="mg-page">' +
        '<div class="mg-photo" style="height:52%">' + img("editoriale", "Una lettrice sfoglia AncheCasa Magazine sul divano") +
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
        '<p class="mg-small" style="border-top:1px solid var(--mg-rule);padding-top:6px;margin:0">N. ' + NUMERO.n + " · " + NUMERO.data + " · Quindicinale gratuito su anchecasa.it · Prossimo numero " + NUMERO.prossimo + ". Contenuti divulgativi: non sostituiscono il parere di un tecnico.</p>" +
        "</div>" + folio(i) + "</div>";
    } },
    /* 2 · SOMMARIO */
    { html: function (i) {
      var voci = [
        [3, "In cifre", "I numeri della casa", null],
        [4, "Inchiesta", "Gli ultimi 83 giorni al 50%", "bonus"],
        [6, "Guida", "Bonifico parlante e documenti", null],
        [7, "Bollette", "Leggere la bolletta in 2 minuti", null],
        [8, "Strumento gratuito", "Check Bollette: paghi troppo?", null],
        [9, "Energia", "Cappotto e pompa di calore", "pompa-calore"],
        [11, "Serramenti", "Finestre che isolano davvero", "finestra"],
        [12, "Cantiere", "Il preventivo blindato", "cantiere"],
        [14, "Tendenze", "Bagno: microcemento e doccia a filo", "bagno"],
        [15, "Abitare", "Cucina, le misure che contano", "cucina"],
        [16, "Esterni", "La pergola bioclimatica", "pergola"],
        [17, "Cura della casa", "Il calendario d'autunno", "caldaia"],
        [19, "Glossario", "Le parole della casa", null],
        [20, "Servizio", "Trova chi lo fa nella tua zona", null]
      ];
      var li = voci.map(function (v) {
        return '<li><button type="button" data-goto="' + v[0] + '"><span class="pg">' + v[0] + "</span>" +
          '<span><span class="sec">' + v[1] + '</span><span class="tt">' + v[2] + "</span></span>" +
          (v[3] ? '<img src="' + NUMERO.cartella + v[3] + '.jpg" alt="" draggable="false">' : '<span class="noimg"></span>') +
          "</button></li>";
      }).join("");
      return '<div class="mg-page mg-pad">' + kicker("Sommario · N. " + NUMERO.n) +
        '<h2 class="mg-h2">In questo numero</h2>' +
        '<div class="mg-body"><ul class="mg-toc">' + li + "</ul></div>" + folio(i) + "</div>";
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
        '<div class="mg-photo" style="height:34%">' + img("bolletta", "Mani che tengono una bolletta e uno smartphone") +
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
        '<div class="mg-flag"><b>Da ottobre +37,3%</b> per i vulnerabili in tutela. Con ISEE fino a 9.796 € (20.000 € con 4 figli) il bonus sociale arriva in automatico dopo la DSU.<span>Prova Check Bollette ' + ICO.arrow + "</span></div>" +
        '<p class="mg-small" style="margin-top:6px">Le proporzioni delle voci sono illustrative. Fonte aumento: ARERA, settembre 2026.</p>' +
        "</div></div>" + folio(i) + "</div>";
    } },
    /* 8 · STRUMENTO CHECK BOLLETTE */
    { cover: true, html: function (i) {
      return '<div class="mg-page mg-app-page">' +
        '<div class="mg-app-head">' +
          '<div><div class="mg-kicker">Strumento gratuito</div>' +
          '<h2 class="mg-app-title">Check <em>Bollette</em></h2>' +
          '<p class="mg-app-sub">Inserisci i dati della tua bolletta: in 30 secondi sai se paghi troppo.</p></div>' +
          '<span class="mg-free">GRATIS</span>' +
        "</div>" +
        '<div class="mg-app" data-noflip id="mg-bolletta">' +
          '<div class="mg-app-top">' +
            '<div class="mg-seg" role="group" aria-label="Tipo di bolletta"><button type="button" data-tipo="luce" aria-pressed="true">' + ICO.sun.replace('<svg', '<svg width="14" height="14"') + ' Luce</button><button type="button" data-tipo="gas" aria-pressed="false">' + ICO.flame.replace('<svg', '<svg width="14" height="14"') + ' Gas</button></div>' +
            '<span class="mg-example" id="mg-b-esempio">Esempio · metti i tuoi dati</span>' +
          "</div>" +
          '<div class="mg-fields">' +
            '<div class="mg-field"><label for="mg-b-importo">Totale bolletta</label><div class="mg-inp"><input id="mg-b-importo" type="number" inputmode="decimal" min="0" step="0.01" value="165"><span>€</span></div></div>' +
            '<div class="mg-field"><label for="mg-b-consumo" id="mg-b-consumo-l">Consumo del periodo</label><div class="mg-inp"><input id="mg-b-consumo" type="number" inputmode="decimal" min="0" step="1" value="420"><span id="mg-b-unit">kWh</span></div></div>' +
            '<div class="mg-field"><label for="mg-b-mesi">Periodo</label><div class="mg-inp"><select id="mg-b-mesi"><option value="1">1 mese</option><option value="2" selected>2 mesi</option><option value="3">3 mesi</option><option value="4">4 mesi</option><option value="6">6 mesi</option><option value="12">12 mesi</option></select></div></div>' +
            '<div class="mg-field"><label for="mg-b-persone">Persone in casa</label><div class="mg-inp"><select id="mg-b-persone"><option value="1">1</option><option value="2">2</option><option value="3" selected>3</option><option value="4">4</option><option value="5">5 o più</option></select></div></div>' +
          "</div>" +
          '<div id="mg-b-out"></div>' +
          '<div class="mg-tool-actions">' +
            '<button type="button" class="mg-cta wide" id="mg-b-pdf">' + ICO.arrow.replace('<svg', '<svg width="16" height="16" style="transform:rotate(90deg)"') + ' Scarica il report PDF</button>' +
            '<a class="mg-cta ghost" href="https://www.ilportaleofferte.it/" target="_blank" rel="noopener">Confronta offerte</a>' +
          "</div>" +
        "</div>" +
        '<p class="mg-app-note" id="mg-b-fonte"></p>' +
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
        '<div class="mg-photo" style="height:300px">' + img("finestra", "Finestra nuova affacciata sui tetti di un centro storico") + "</div>" +
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
        '<div class="mg-photo" style="height:250px">' + img("cantiere", "Posa di un pavimento in un appartamento in ristrutturazione") + "</div>" +
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
        '<div class="mg-photo" style="height:290px">' + img("cucina", "Cucina ristrutturata con isola centrale") + "</div>" +
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
        '<div class="mg-photo" style="height:290px">' + img("pergola", "Terrazzo con pergola bioclimatica e piante mediterranee") + "</div>" +
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
        '<div class="mg-opener" style="bottom:40px">' + kicker("Prossimo numero · " + NUMERO.prossimo) +
        '<h2 class="mg-h1" style="font-size:38px">Nel numero 2</h2>' +
        '<div class="mg-3steps"><div><i>›</i>Il calcolatore gratuito del Bonus Casa, con il bonifico pronto</div><div><i>›</i>Muffa e condensa: prepararsi all’inverno</div><div><i>›</i>Fotovoltaico sul balcone: cosa si può fare</div></div>' +
        '<p class="mg-small" style="color:rgba(255,255,255,.7);margin-top:12px">AncheCasa Magazine · gratuito ogni 15 giorni su anchecasa.it</p></div>' +
      "</div>";
    } }
  ];

  /* ---------------- strumento: lettura bolletta ---------------- */
  var bolletta = { tipo: "luce", toccato: false };

  function euro(n, dec) { return n.toLocaleString("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + " €"; }
  function num(n) { return Math.round(n).toLocaleString("it-IT"); }

  function calcolaBolletta() {
    var q = function (id) { return document.getElementById(id); };
    var importo = parseFloat(q("mg-b-importo").value);
    var consumo = parseFloat(q("mg-b-consumo").value);
    var mesi = parseInt(q("mg-b-mesi").value, 10);
    var persone = parseInt(q("mg-b-persone").value, 10);
    var r = RIF[bolletta.tipo];
    if (!(importo > 0) || !(consumo > 0)) return { errore: "Inserisci il totale della bolletta e il consumo, tutti e due maggiori di zero." };
    var prezzo = importo / consumo;
    var annuo = consumo * 12 / mesi;
    var spesaAnnua = importo * 12 / mesi;
    var rifConsumo = (bolletta.tipo === "luce" ? RIF.consumoLuce : RIF.consumoGas)[persone];
    var rP = prezzo / r.prezzo;
    var rC = annuo / rifConsumo;
    var vPrezzo = rP > 1.1 ? "bad" : rP < 0.95 ? "ok" : "warn";
    var vCons = rC > 1.25 ? "bad" : rC < 0.8 ? "ok" : "warn";
    var risparmio = rP > 1 ? (prezzo - r.prezzo) * annuo : 0;
    return { importo: importo, consumo: consumo, mesi: mesi, persone: persone, prezzo: prezzo, annuo: annuo, spesaAnnua: spesaAnnua, rifConsumo: rifConsumo, rP: rP, rC: rC, vPrezzo: vPrezzo, vCons: vCons, risparmio: risparmio, rif: r };
  }

  function testiVerdetto(c) {
    var u = c.rif.unita;
    var tPrezzo = {
      ok: "Il tuo costo medio è sotto il riferimento di " + euro(c.rif.prezzo, 2) + "/" + u + ". Stai pagando bene.",
      warn: "Il tuo costo medio è in linea con il riferimento di " + euro(c.rif.prezzo, 2) + "/" + u + ".",
      bad: "Paghi il " + Math.round((c.rP - 1) * 100) + "% in più del riferimento di " + euro(c.rif.prezzo, 2) + "/" + u + ". Allineandoti risparmieresti circa " + euro(c.risparmio, 0) + " all’anno: confronta le offerte."
    }[c.vPrezzo];
    var tCons = {
      ok: "Consumi meno di una famiglia simile alla tua (circa " + num(c.rifConsumo) + " " + u + " all’anno).",
      warn: "Consumi come una famiglia simile alla tua (circa " + num(c.rifConsumo) + " " + u + " all’anno).",
      bad: "Consumi il " + Math.round((c.rC - 1) * 100) + "% in più di una famiglia simile (circa " + num(c.rifConsumo) + " " + u + " all’anno). Un check di impianti e isolamento può valere più di un cambio di tariffa."
    }[c.vCons];
    var etichetta = { ok: "Bene", warn: "In linea", bad: "Attenzione" };
    return { tPrezzo: tPrezzo, tCons: tCons, ePrezzo: etichetta[c.vPrezzo], eCons: etichetta[c.vCons] };
  }

  function aggiornaBolletta() {
    var out = document.getElementById("mg-b-out");
    if (!out) return;
    var c = calcolaBolletta();
    var r = RIF[bolletta.tipo];
    document.getElementById("mg-b-fonte").textContent =
      "Riferimento prezzo: " + r.fonte + ". Consumi di riferimento: stime AncheCasa su dati ARERA. Il costo medio include quote fisse: con consumi bassi risulta più alto. Stima indicativa.";
    if (c.errore) { out.innerHTML = '<p class="mg-error">' + c.errore + "</p>"; return; }
    var t = testiVerdetto(c);
    var u = r.unita;
    var ratio = Math.max(0.6, Math.min(1.4, c.rP));
    var ang = (ratio - 1) / 0.4 * 90; // -90..90
    var arc = function (a0, a1, cls) {
      var p = function (a) { var rad = (a - 90) * Math.PI / 180; return [100 + 80 * Math.cos(rad), 100 + 80 * Math.sin(rad)]; };
      var A = p(a0), B = p(a1);
      return '<path class="' + cls + '" d="M' + A[0].toFixed(1) + " " + A[1].toFixed(1) + " A80 80 0 0 1 " + B[0].toFixed(1) + " " + B[1].toFixed(1) + '"/>';
    };
    var gauge = '<svg class="mg-gauge" viewBox="0 0 200 118" role="img" aria-label="Il tuo prezzo rispetto al riferimento">' +
      arc(-90, -11.25, "g-ok") + arc(-11.25, 22.5, "g-warn") + arc(22.5, 90, "g-bad") +
      '<g transform="rotate(' + ang.toFixed(1) + ' 100 100)"><line x1="100" y1="100" x2="100" y2="34" class="g-needle"/></g><circle cx="100" cy="100" r="6" class="g-hub"/>' +
      '<text x="18" y="116" class="g-l">meno</text><text x="182" y="116" text-anchor="end" class="g-l">di più</text></svg>';
    out.innerHTML =
      '<div class="mg-app-res">' +
        '<div class="mg-gauge-box">' + gauge +
          '<div class="mg-gauge-v">' + euro(c.prezzo, 3) + '<small>per ' + u + " · riferimento " + euro(r.prezzo, 3) + "</small></div>" +
        "</div>" +
        '<div class="mg-tiles2">' +
          '<div><b>' + num(c.annuo) + "</b><span>" + u + " all’anno</span></div>" +
          '<div><b>' + euro(c.spesaAnnua, 0) + "</b><span>spesa annua</span></div>" +
          '<div class="' + (c.risparmio > 0 ? "save" : "") + '"><b>' + (c.risparmio > 0 ? euro(c.risparmio, 0) : "0 €") + "</b><span>risparmio possibile</span></div>" +
        "</div>" +
      "</div>" +
      '<div class="mg-verdict"><span class="mg-chip ' + c.vPrezzo + '">' + t.ePrezzo + "</span><span><b>Prezzo.</b> " + t.tPrezzo + "</span></div>" +
      '<div class="mg-verdict"><span class="mg-chip ' + c.vCons + '">' + t.eCons + "</span><span><b>Consumi.</b> " + t.tCons + "</span></div>";
  }

  function scaricaPdf() {
    var c = calcolaBolletta();
    if (c.errore) { aggiornaBolletta(); return; }
    if (!window.jspdf || !window.jspdf.jsPDF) {
      var out = document.getElementById("mg-b-out");
      if (out) out.insertAdjacentHTML("beforeend", '<p class="mg-error">Il PDF non si è caricato. Controlla la connessione e riprova.</p>');
      return;
    }
    var t = testiVerdetto(c);
    var u = c.rif.unita;
    var doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
    var y = 20;
    doc.setFillColor(26, 36, 50); doc.rect(0, 0, 210, 34, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("times", "bold"); doc.setFontSize(24);
    doc.text("AncheCasa", 18, 18);
    doc.setTextColor(229, 107, 16); doc.text("Magazine", 62, 18);
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text("Report Check Bollette · strumento gratuito · N." + NUMERO.n + " · " + NUMERO.data, 18, 27);
    y = 48;
    doc.setTextColor(26, 36, 50); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
    doc.text("La tua bolletta " + (bolletta.tipo === "luce" ? "della luce" : "del gas"), 18, y); y += 9;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
    var righe = [
      ["Totale bolletta", euro(c.importo, 2)],
      ["Consumo nel periodo", num(c.consumo) + " " + u],
      ["Periodo", c.mesi + (c.mesi === 1 ? " mese" : " mesi")],
      ["Persone in casa", c.persone === 5 ? "5 o più" : String(c.persone)],
      ["Costo medio tutto compreso", euro(c.prezzo, 3) + " / " + u],
      ["Consumo annuo stimato", num(c.annuo) + " " + u],
      ["Spesa annua stimata", euro(c.spesaAnnua, 0)],
      ["Prezzo di riferimento", euro(c.rif.prezzo, 3) + " / " + u],
      ["Consumo di riferimento", num(c.rifConsumo) + " " + u + " all'anno"]
    ];
    righe.forEach(function (r, k) {
      if (k % 2 === 0) { doc.setFillColor(243, 238, 228); doc.rect(16, y - 5, 178, 8, "F"); }
      doc.setTextColor(85, 90, 102); doc.text(r[0], 19, y);
      doc.setTextColor(26, 36, 50); doc.setFont("helvetica", "bold"); doc.text(r[1], 190, y, { align: "right" });
      doc.setFont("helvetica", "normal"); y += 8;
    });
    y += 6;
    function blocco(titolo, testo) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(195, 90, 12); doc.text(titolo, 18, y); y += 6;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(27, 29, 36);
      var linee = doc.splitTextToSize(testo, 174); doc.text(linee, 18, y); y += linee.length * 5 + 5;
    }
    blocco("Prezzo · " + t.ePrezzo, t.tPrezzo);
    blocco("Consumi · " + t.eCons, t.tCons);
    blocco("Cosa fare adesso", "1. Confronta le offerte sul Portale Offerte ARERA (www.ilportaleofferte.it) con POD o PDR alla mano.\n2. Controlla che la lettura in bolletta sia reale e non stimata; se serve, comunica l'autolettura.\n3. Se i consumi sono alti, valuta un check di impianti e isolamento: nella piazza di AncheCasa trovi tecnici della tua zona (www.anchecasa.it/pubblica).");
    doc.setFontSize(8); doc.setTextColor(120, 120, 120);
    var nota = doc.splitTextToSize("Riferimento prezzo: " + c.rif.fonte + ". Il costo medio include quote fisse e potenza impegnata: con consumi bassi risulta più alto. Stima indicativa a scopo divulgativo, non è una consulenza. Report generato il " + new Date().toLocaleDateString("it-IT") + " su anchecasa.it/magazine.", 174);
    doc.text(nota, 18, 280);
    doc.save("AncheCasa-check-bollette.pdf");
  }

  function initBolletta() {
    var box = document.getElementById("mg-bolletta");
    if (!box) return;
    box.querySelectorAll("[data-tipo]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-tipo") === bolletta.tipo ? "true" : "false");
      b.addEventListener("click", function () {
        bolletta.tipo = b.getAttribute("data-tipo");
        box.querySelectorAll("[data-tipo]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        document.getElementById("mg-b-unit").textContent = bolletta.tipo === "luce" ? "kWh" : "Smc";
        if (!bolletta.toccato) {
          document.getElementById("mg-b-importo").value = bolletta.tipo === "luce" ? "165" : "290";
          document.getElementById("mg-b-consumo").value = bolletta.tipo === "luce" ? "420" : "210";
        }
        aggiornaBolletta();
      });
    });
    ["mg-b-importo", "mg-b-consumo", "mg-b-mesi", "mg-b-persone"].forEach(function (id) {
      var el = document.getElementById(id);
      if (bolletta[id] != null) el.value = bolletta[id];
      el.addEventListener("input", function () {
        bolletta[id] = el.value;
        if (id === "mg-b-importo" || id === "mg-b-consumo") {
          bolletta.toccato = true;
          var es = document.getElementById("mg-b-esempio");
          if (es) es.hidden = true;
        }
        aggiornaBolletta();
      });
    });
    if (bolletta.toccato) document.getElementById("mg-b-esempio").hidden = true;
    document.getElementById("mg-b-unit").textContent = bolletta.tipo === "luce" ? "kWh" : "Smc";
    document.getElementById("mg-b-pdf").addEventListener("click", scaricaPdf);
    aggiornaBolletta();
  }

  /* ---------------- sfogliabile ---------------- */
  var root = document.getElementById("mg-root");
  if (!root) return;
  var stage = root.querySelector(".mg-stage");
  var scaler = root.querySelector(".mg-scaler");
  var book = root.querySelector(".mg-book");
  var counter = root.querySelector(".mg-counter");
  var btnPrev = root.querySelector("[data-act=prev]");
  var btnNext = root.querySelector("[data-act=next]");
  var btnFs = root.querySelector("[data-act=fs]");
  var hint = root.querySelector(".mg-hint");

  var total = PAGINE.length;
  var mode = null, leaves = [], leafCount = 0, maxFlipped = 0, flipped = 0, pageIndex = 0, turnTimer = null;

  try {
    var m = location.hash.match(/^#p(\d+)$/);
    if (m) pageIndex = Math.min(+m[1], total - 1);
    else {
      var s = Number(localStorage.getItem("anchecasa-mag-1"));
      if (isFinite(s)) pageIndex = Math.max(0, Math.min(s, total - 1));
    }
  } catch (e) { pageIndex = 0; }

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
    if (index === 0) div.classList.add("hint");
    return div;
  }

  function build() {
    mode = currentMode();
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
    book.querySelectorAll("[data-goto]").forEach(function (b) {
      b.addEventListener("click", function () { goToPage(+b.getAttribute("data-goto")); });
    });
    initBolletta();
    hint.textContent = mode === "spread" ? "Clicca sulla pagina o usa le frecce ← → per sfogliare" : "Scorri col dito o tocca il bordo della pagina per sfogliare";
    btnFs.hidden = mode !== "spread";
    flipped = mode === "spread" ? Math.min(Math.ceil(pageIndex / 2), maxFlipped) : Math.min(pageIndex, maxFlipped);
    // niente animazione al primo disegno
    leaves.forEach(function (l) { l.style.transition = "none"; });
    book.style.transition = "none";
    render(null);
    fit();
    void book.offsetWidth;
    leaves.forEach(function (l) { l.style.transition = ""; });
    book.style.transition = "";
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
    try {
      localStorage.setItem("anchecasa-mag-1", String(pageIndex));
      history.replaceState(null, "", "#p" + pageIndex);
    } catch (e) { /* storage non disponibile */ }
  }

  function setFlipped(n) {
    n = Math.max(0, Math.min(n, maxFlipped));
    if (n === flipped) return;
    var moving = n > flipped ? flipped : n;
    var salto = Math.abs(n - flipped) > 1;
    flipped = n;
    pageIndex = mode === "spread" ? (n === 0 ? 0 : Math.min(2 * n - 1, total - 1)) : n;
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
    var isFs = document.fullscreenElement === root;
    var headerEl = document.querySelector(".site-header");
    var header = isFs ? 0 : (headerEl ? headerEl.offsetHeight : 86);

    if (mode === "single" && !isFs) {
      var vv = window.visualViewport;
      var viewH = vv ? vv.height : window.innerHeight;
      var viewTop = vv ? vv.offsetTop : 0;
      root.style.top = (viewTop + header) + "px";
      root.style.height = Math.max(0, viewH - header) + "px";
      stage.style.width = "100%";
      stage.style.height = "";
      var availW = Math.max(1, stage.clientWidth - 8);
      var availH = stage.clientHeight;
      if (availH < 40) {
        var controls = root.querySelector(".mg-controls");
        availH = Math.max(40, viewH - header - (controls ? controls.offsetHeight : 48) - 16);
      }
      var scale = Math.max(0.3, Math.min(availW / bookW, availH / sz.h));
      var drawnH = sz.h * scale;
      scaler.style.width = bookW + "px";
      scaler.style.height = sz.h + "px";
      scaler.style.top = Math.max(0, (Math.max(availH, stage.clientHeight) - drawnH) / 2) + "px";
      scaler.style.transform = "translateX(-50%) scale(" + scale + ")";
      book.style.width = bookW + "px";
      book.style.height = sz.h + "px";
      return;
    }

    root.style.top = "";
    root.style.height = "";
    scaler.style.top = "0";
    var availW = root.clientWidth - 48;
    var availH = window.innerHeight - header - 120;
    var scale = Math.max(0.3, Math.min(availW / bookW, availH / sz.h, 1.25));
    stage.style.width = bookW * scale + "px";
    stage.style.height = sz.h * scale + "px";
    scaler.style.width = bookW + "px";
    scaler.style.height = sz.h + "px";
    scaler.style.transform = "translateX(-50%) scale(" + scale + ")";
    book.style.width = bookW + "px";
    book.style.height = sz.h + "px";
  }

  // click e swipe
  var down = null, swiped = false;
  stage.addEventListener("pointerdown", function (e) {
    if (e.target.closest(NO_FLIP)) return;
    down = { x: e.clientX, y: e.clientY };
    swiped = false;
  });
  stage.addEventListener("pointerup", function (e) {
    var d = down; down = null;
    if (!d) return;
    var dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      swiped = true;
      if (dx < 0) next(); else prev();
    }
  });
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
  root.querySelector("[data-act=toc]").addEventListener("click", function () { goToPage(2); });
  btnFs.addEventListener("click", function () {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (root.requestFullscreen) root.requestFullscreen().catch(function () {});
    } catch (e) { /* schermo intero non disponibile */ }
  });
  document.addEventListener("fullscreenchange", fit);

  var resizeT = null;
  function onResize() {
    if (currentMode() !== mode) { build(); return; }
    if (mode === "single") { fit(); return; }
    clearTimeout(resizeT);
    resizeT = setTimeout(fit, 120);
  }
  window.addEventListener("resize", onResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", onResize);
    window.visualViewport.addEventListener("scroll", onResize);
  }

  build();
  requestAnimationFrame(function () { requestAnimationFrame(fit); });
})();
