/* Relazione di sopralluogo AncheCasa (12.10.2026, app-29).
   Disegna la relazione preparata dall'IA (colonna «ia» della pratica) per il tecnico (dossier) e per il cliente (sopralluogo.html).
   Uso: ACRelazione.monta(el, dati, opzioni)
     dati = { ia, foto: [{ id, url, nota }] (nello stesso ordine di ia.foto_id), render: [{ id, url, nota, prima_id }],
              testa: { nome, indirizzo, agente, data, rif } }
     opzioni = { tecnico: true|false, logo: "percorso del logo", onRender(mediaId, stile, bottone), onChiedi(testo) }
   Il cliente vede tutto tranne la parte «solo per il tecnico» (voci, dubbi, trascrizioni, titolo edilizio). */
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const dec = (n, d) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d });
  const STATO = ["", "Da rifare", "Scarso", "Discreto", "Buono", "Ottimo"];
  const PRI = { necessario: "Necessari", consigliato: "Consigliati", migliorativo: "Migliorativi" };
  const PRI_SUB = { necessario: "Da fare per forza: sicurezza, norme, danni.", consigliato: "Da fare insieme: costa meno e dura di più.", migliorativo: "Per vivere meglio la casa." };
  const TIT = { edilizia_libera: "Edilizia libera", cila: "CILA", scia: "SCIA", pdc: "Permesso di costruire", da_verificare: "Da verificare" };
  const GR = { urgente: 0, alta: 1, media: 2, bassa: 3 };
  const STILI = [["medio", "Contemporaneo"], ["base", "Essenziale"], ["alto", "Di pregio"], ["mediterraneo", "Mediterraneo"], ["moderno", "Minimal"]];

  const stato = (v) => (v ? '<span class="rz-stato s' + v + '" title="' + v + '/5"><i></i><i></i><i></i><i></i><i></i></span><span class="rz-stato-t">' + STATO[v] + "</span>" : "");

  function html(d, o) {
    const ia = d.ia || {};
    const foto = d.foto || [];
    const ren = d.render || [];
    const T = d.testa || {};
    const tecnico = !!o.tecnico;
    const fotoN = (n) => foto[n - 1];
    const didascalia = (n) => ((ia.foto || []).find((f) => f.n === n) || {}).didascalia || (fotoN(n) || {}).nota || "";
    const amb = ia.ambienti || [];
    const crit = amb.reduce((t, a) => t + (a.criticita || []).length, 0) + (ia.sicurezza || []).length;
    const urg = amb.reduce((t, a) => t + (a.criticita || []).filter((c) => c.gravita === "urgente" || c.gravita === "alta").length, 0) + (ia.sicurezza || []).filter((c) => c.gravita === "urgente" || c.gravita === "alta").length;
    let h = "";
    let n = 0;
    const sez = (titolo, sub, corpo, cls) => '<section class="rz-sez ' + (cls || "") + '"><h2><span class="n">' + String(++n).padStart(2, "0") + "</span>" + titolo + "</h2>" + (sub ? '<p class="rz-sub">' + sub + "</p>" : "") + corpo + "</section>";

    // Copertina
    h += '<header class="rz-cop"><div class="eti">Relazione di sopralluogo' + (T.rif ? " · " + esc(T.rif) : "") + "</div>" +
      "<h1>" + esc(T.nome || "La tua casa") + "</h1><p>" + esc([T.indirizzo, T.data ? "sopralluogo del " + T.data : "", T.agente ? "consulente " + T.agente : ""].filter(Boolean).join(" · ")) + "</p>" +
      '<div class="rz-kpi">' +
      "<div><b>" + (ia.immobile && ia.immobile.stato_generale ? ia.immobile.stato_generale + "/5" : "—") + "</b><small>Stato generale</small></div>" +
      "<div><b>" + amb.length + "</b><small>Ambienti analizzati</small></div>" +
      '<div class="' + (urg ? "ar" : "") + '"><b>' + crit + "</b><small>Criticità" + (urg ? " · " + urg + " importanti" : "") + "</small></div>" +
      "<div><b>" + (ia.durata_settimane ? dec(ia.durata_settimane, 0) + " sett." : "—") + "</b><small>Durata indicativa</small></div>" +
      "<div><b>" + foto.length + (ren.length ? " + " + ren.length : "") + "</b><small>Foto" + (ren.length ? " + simulazioni" : "") + "</small></div></div></header>";

    // 1. Sintesi
    if (ia.sintesi) h += sez("In sintesi", "", '<p class="rz-sintesi">' + esc(ia.sintesi) + "</p>");

    // 2. Immobile
    const im = ia.immobile || {};
    const kv = [["Tipologia", im.tipologia], ["Epoca", im.epoca], ["Piani", im.piani], ["Superficie", im.superficie_planimetria ? dec(im.superficie_planimetria, 0) + " mq (da planimetria)" : ""], ["Stato generale", im.stato_generale ? im.stato_generale + "/5 · " + STATO[im.stato_generale] : ""]].filter((x) => x[1]);
    if (kv.length) h += sez("L'immobile", im.note ? esc(im.note) : "", '<div class="rz-kv">' + kv.map((x) => "<div><small>" + x[0] + "</small><b>" + esc(x[1]) + "</b></div>").join("") + "</div>");

    // 3. Ambienti, interni ed esterni
    const blocco = (a) => {
      const nn = (a.foto || []).filter((k) => fotoN(k));
      const conRender = nn.map((k) => ({ k, r: ren.filter((x) => x.prima_id === fotoN(k).id).slice(-1)[0] })).find((x) => x.r);
      let media = "";
      if (conRender) {
        const p = fotoN(conRender.k);
        media += '<div class="rz-pd" data-rz-pd><img src="' + esc(p.url) + '" alt="Prima"><img class="dopo" src="' + esc(conRender.r.url) + '" alt="Dopo (simulazione)"><span class="linea"></span>' +
          '<span class="et p">Oggi</span><span class="et d">Simulazione</span><input type="range" min="0" max="100" value="50" aria-label="Confronta prima e dopo"></div>' +
          '<div class="rz-sim">Trascina per confrontare. La simulazione è indicativa: colori e materiali si scelgono con il tecnico.</div>';
      }
      const resto = nn.filter((k) => !conRender || k !== conRender.k);
      if (resto.length || (!conRender && nn.length)) {
        media += '<div class="rz-foto ' + (!conRender && nn.length === 1 ? "uno" : "") + '" style="margin-top:' + (conRender ? "8px" : "0") + '">' + (conRender ? resto : nn).slice(0, conRender ? 3 : 6).map((k) =>
          '<figure><img src="' + esc(fotoN(k).url) + '" alt="" data-rz-zoom="' + k + '" loading="lazy"><span class="rz-num">' + k + "</span><figcaption>" + esc(didascalia(k)) + "</figcaption></figure>").join("") + "</div>";
      }
      if (tecnico && nn.length && o.onRender) {
        media += '<div class="rz-render rz-noprint"><select data-rz-foto>' + nn.map((k) => '<option value="' + esc(fotoN(k).id) + '">Foto ' + k + "</option>").join("") + "</select>" +
          '<select data-rz-stile>' + STILI.map((s) => '<option value="' + s[0] + '">' + s[1] + "</option>").join("") + '</select><button type="button" class="rz-btn p" data-rz-render>✨ Crea il dopo</button></div>';
      }
      const mis = a.larg && a.lung ? dec(a.larg) + " × " + dec(a.lung) + " m" + (a.alt ? " · h " + dec(a.alt) : "") : a.superficie ? dec(a.superficie, 0) + " mq" : "";
      const critL = (a.criticita || []).slice().sort((x, y) => GR[x.gravita] - GR[y.gravita]);
      return '<div class="rz-amb' + (media ? "" : " solo") + '">' + (media ? "<div>" + media + "</div>" : "") + "<div>" +
        '<div class="rz-amb-testa"><h3>' + esc(a.nome) + "</h3><span>" + stato(a.stato) + "</span></div>" +
        (mis ? '<div class="rz-amb-mis">📐 ' + esc(mis) + (a.fonte_misure && a.fonte_misure !== "nessuna" ? " · da " + esc(a.fonte_misure) : "") + "</div>" : "") +
        (a.descrizione ? '<p style="margin:8px 0 0">' + esc(a.descrizione) + "</p>" : "") +
        ((a.materiali || []).length ? '<div class="rz-chips">' + a.materiali.map((m) => '<span class="rz-chip">' + esc(m) + "</span>").join("") + "</div>" : "") +
        (critL.length ? '<ul class="rz-lista">' + critL.map((c) => '<li><span class="rz-g ' + c.gravita + '"></span><span>' + esc(c.testo) +
          ((c.foto || []).length ? ' <span class="rz-nfoto">foto ' + c.foto.join(", ") + "</span>" : "") + '</span><span class="rz-gt ' + c.gravita + '">' + c.gravita + "</span></li>").join("") + "</ul>" : "") +
        ((a.interventi || []).length ? '<ul class="rz-lista">' + a.interventi.map((x) => '<li><span class="rz-p ' + x.priorita + '">' + x.priorita + "</span><span>" + esc(x.testo) + "</span></li>").join("") + "</ul>" : "") +
        "</div></div>";
    };
    const interni = amb.filter((a) => !a.esterno), esterni = amb.filter((a) => a.esterno);
    if (amb.length) h += sez("Ambiente per ambiente", "Com'è oggi, cosa abbiamo trovato e cosa proponiamo. Gravità: <b style=\"color:#b42318\">urgente</b>, <b style=\"color:#c45d0c\">alta</b>, media, bassa.",
      (interni.length ? '<div class="rz-gruppo">Interni · ' + interni.length + "</div>" + interni.map(blocco).join("") : "") +
      (esterni.length ? '<div class="rz-gruppo">Esterni · ' + esterni.length + "</div>" + esterni.map(blocco).join("") : ""));

    // 4. Impianti
    if ((ia.impianti || []).length) h += sez("Impianti", "Valutazione visiva: la conformità la verifica un installatore abilitato (DM 37/08).",
      "<table><tr><th>Impianto</th><th>Stato</th><th>Osservazioni</th></tr>" + ia.impianti.map((i) => '<tr><td style="font-weight:700;color:#16304d;text-transform:capitalize">' + esc(i.tipo) + "</td><td style=\"white-space:nowrap\">" + stato(i.stato) +
        "</td><td>" + esc(i.osservazioni) + (i.da_verificare ? ' <span class="rz-p consigliato">da verificare</span>' : "") + "</td></tr>").join("") + "</table>");

    // 5. Sicurezza
    if ((ia.sicurezza || []).length) h += sez("Sicurezza e rischi", "Cose che sembrano un rischio: vanno verificate prima dei lavori.",
      ia.sicurezza.slice().sort((x, y) => GR[x.gravita] - GR[y.gravita]).map((s) => '<div class="rz-avv ' + (s.gravita === "urgente" || s.gravita === "alta" ? "r" : "") + '"><span>' + (s.gravita === "urgente" ? "⛔" : "⚠️") + "</span><span><b style=\"text-transform:capitalize\">" + esc(s.gravita) + ":</b> " + esc(s.testo) + "</span></div>").join(""));

    // 6. Energia
    const en = ia.energia || {};
    if (en.osservazioni || (en.interventi || []).length) h += sez("Efficienza energetica", esc(en.osservazioni || ""),
      ((en.interventi || []).length ? "<table><tr><th>Intervento</th><th>Beneficio</th><th>Incentivi</th></tr>" + en.interventi.map((i) => '<tr><td style="font-weight:700;color:#16304d">' + esc(i.testo) + "</td><td>" + esc(i.beneficio) + "</td><td>" + esc(i.incentivi) + "</td></tr>").join("") + "</table>" : "") +
      '<div class="rz-sim" style="margin-top:8px">Detrazioni e bonus cambiano spesso: le verifica il tecnico sulla tua situazione.</div>');

    // 7. Priorità
    const tutti = [];
    amb.forEach((a) => (a.interventi || []).forEach((x) => tutti.push({ t: x.testo, p: x.priorita, a: a.nome })));
    if (tutti.length) h += sez("Cosa fare, in ordine di priorità", "", '<div class="rz-pri">' + ["necessario", "consigliato", "migliorativo"].map((p) => {
      const l = tutti.filter((x) => x.p === p);
      return '<div class="' + p + '"><h3>' + PRI[p] + " · " + l.length + '</h3><div class="rz-sim" style="margin:0 0 6px">' + PRI_SUB[p] + "</div>" + (l.length ? "<ul>" + l.map((x) => "<li>" + esc(x.t) + " <small>· " + esc(x.a) + "</small></li>").join("") + "</ul>" : '<div class="rz-sim">Nessuno.</div>') + "</div>";
    }).join("") + "</div>");

    // 8. Fasi e tempi
    const fasi = ia.fasi || [];
    if (fasi.length) {
      const tot = fasi.reduce((t, f) => t + (Number(f.settimane) || 1), 0);
      let ini = 0;
      h += sez("Fasi e tempi indicativi", "Circa " + dec(ia.durata_settimane || tot, 0) + " settimane di lavoro, da confermare con l'impresa scelta.", '<div class="rz-gantt">' + fasi.map((f, i) => {
        const w = (Number(f.settimane) || 1) / tot * 100, l = ini / tot * 100; ini += Number(f.settimane) || 1;
        return '<div class="rz-fase"><b>' + esc(f.nome) + "<small>" + esc(f.descrizione) + '</small></b><div class="rz-bar"><i class="' + (i % 2 ? "ar" : "") + '" style="left:' + l.toFixed(2) + "%;width:" + w.toFixed(2) + '%">' + dec(f.settimane, 0) + " sett.</i></div></div>";
      }).join("") + "</div>");
    }

    // 9. Documenti
    if ((ia.documenti || []).length) h += sez("Documenti da preparare", "Servono al tecnico per il preventivo definitivo e per la pratica.", '<ul class="rz-doc">' + ia.documenti.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>");

    // 10. Solo per il tecnico
    if (tecnico) {
      let int = "";
      if (ia.titolo) int += '<p style="margin:0 0 8px"><b>Titolo edilizio suggerito:</b> ' + esc(TIT[ia.titolo] || ia.titolo) + (ia.titolo_motivo ? " · " + esc(ia.titolo_motivo) : "") + "</p>";
      if ((ia.dubbi || []).length) int += "<h3 style=\"margin:12px 0 4px\">Da chiedere all'agente</h3>" + ia.dubbi.map((x) => '<div class="rz-avv"><span>❓</span><span>' + esc(x) + (o.onChiedi ? ' <a href="#" data-rz-chiedi="' + esc(x) + '">Chiedi nella chat</a>' : "") + "</span></div>").join("");
      if ((ia.voci || []).length) int += '<h3 style="margin:14px 0 4px">Voci proposte per il computo · ' + ia.voci.length + '</h3><div style="overflow-x:auto"><table><tr><th>Voce</th><th>Ambiente</th><th>Priorità</th><th style="text-align:right">Q.tà</th></tr>' +
        ia.voci.map((v) => "<tr><td>" + esc(v.voce) + "</td><td>" + esc(v.ambiente) + '</td><td><span class="rz-p ' + v.priorita + '">' + v.priorita + '</span></td><td class="n">' + (v.qta ? dec(v.qta, v.qta % 1 ? 1 : 0) + " " + esc(v.um) : "—") + "</td></tr>").join("") + "</table></div>";
      if ((ia.trascrizioni || []).filter(Boolean).length) int += '<h3 style="margin:14px 0 4px">Note vocali trascritte</h3>' + ia.trascrizioni.filter(Boolean).map((t, i) => '<p style="margin:6px 0;background:#f3f5f9;padding:10px 12px;border-radius:10px">🎙 <b>' + (i + 1) + ".</b> «" + esc(t) + "»</p>").join("");
      if ((ia.video || []).length) int += '<h3 style="margin:14px 0 4px">Video del giro della casa</h3>' + ia.video.map((v) => '<p style="margin:6px 0;background:#f3f5f9;padding:10px 12px;border-radius:10px">🎥 ' + esc(v.sintesi) + "</p>").join("");
      if (int) h += sez("Note tecniche", "Lettura automatica di foto, voce e video: il cliente non vede questa parte.", int, "rz-int");
    }

    h += '<div class="rz-firma">' + (o.logo ? '<img src="' + esc(o.logo) + '" alt="AncheCasa">' : "<b>AncheCasa</b>") +
      "<span>Relazione preparata da AncheCasa con l'aiuto dell'intelligenza artificiale e controllata dal tecnico. Misure e tempi sono indicativi; le simulazioni non sono progetti.</span></div>";
    return '<div class="rz">' + h + "</div>";
  }

  function monta(el, d, o) {
    o = o || {};
    el.innerHTML = html(d, o);
    // prima/dopo
    el.querySelectorAll("[data-rz-pd]").forEach((pd) => {
      const r = pd.querySelector("input"), dopo = pd.querySelector(".dopo"), linea = pd.querySelector(".linea");
      const muovi = () => { dopo.style.clipPath = "inset(0 0 0 " + r.value + "%)"; linea.style.left = r.value + "%"; };
      r.addEventListener("input", muovi); muovi();
    });
    // foto grandi
    const foto = d.foto || [];
    el.querySelectorAll("[data-rz-zoom]").forEach((img) => img.addEventListener("click", () => {
      const lb = document.createElement("div"); lb.className = "rz-lb";
      lb.innerHTML = '<button type="button" aria-label="Chiudi">×</button><img src="' + esc(img.src) + '" alt=""><p>' + esc((img.closest("figure").querySelector("figcaption") || {}).textContent || "") + "</p>";
      lb.addEventListener("click", (e) => { if (e.target === lb || e.target.tagName === "BUTTON") lb.remove(); });
      document.body.appendChild(lb);
    }));
    // render
    el.querySelectorAll("[data-rz-render]").forEach((b) => b.addEventListener("click", () => {
      const box = b.closest(".rz-render");
      if (o.onRender) o.onRender(box.querySelector("[data-rz-foto]").value, box.querySelector("[data-rz-stile]").value, b);
    }));
    el.querySelectorAll("[data-rz-chiedi]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); if (o.onChiedi) o.onChiedi(a.getAttribute("data-rz-chiedi")); }));
    return foto.length;
  }


  // Esempio per le anteprime (?demo=): casa indipendente anni '70 con giardino. base = cartella delle immagini demo.
  function esempio(base) {
    const f = (id, file, nota) => ({ id: id, url: base + file, nota: nota });
    const foto = [f("f1", "soggiorno.jpg", "Soggiorno"), f("f2", "cucina.jpg", "Cucina"), f("f3", "prima.jpg", "Bagno primo piano"), f("f4", "giardino.jpg", "Giardino"), f("f5", "facciata.jpg", "Facciata principale")];
    const render = [{ id: "r1", url: base + "medio.jpg", nota: "Simulazione · medio", prima_id: "f3" }, { id: "r2", url: base + "giardino-dopo.jpg", nota: "Simulazione · mediterraneo", prima_id: "f4" }, { id: "r3", url: base + "facciata-dopo.jpg", nota: "Simulazione · moderno", prima_id: "f5" }];
    const ia = {
      stato: "fatto", creato: new Date().toISOString(), modello: "gemini-3.8-flash", letti: { foto: 5, audio: 2, video: 1 }, foto_id: foto.map((x) => x.id),
      sintesi: "Casa indipendente su due piani degli anni '70 con giardino privato, abitata e in stato complessivo scarso. Le criticità principali sono l'umidità di risalita al piano terra, le crepe sotto il balcone della facciata e impianti elettrico e idraulico d'epoca, senza certificazioni. Gli interni richiedono il rifacimento di bagno e cucina e la sostituzione di pavimenti e infissi. Conviene programmare insieme facciata, cappotto termico e nuovi infissi: un unico ponteggio, meno dispersioni e accesso alle detrazioni da verificare. Il giardino è recuperabile con un nuovo camminamento, recinzione e verde a bassa manutenzione.",
      immobile: { tipologia: "casa indipendente", epoca: "anni '70 (stima)", piani: "2 fuori terra", stato_generale: 2, superficie_planimetria: 132, note: "Struttura in cemento armato e tamponature in laterizio; copertura a falde in coppi." },
      ambienti: [
        { nome: "Soggiorno", categoria: "soggiorno", esterno: false, larg: 4.6, lung: 5.2, alt: 2.8, superficie: 23.9, fonte_misure: "planimetria", stato: 2,
          descrizione: "Ambiente luminoso con finestra a sud. Pavimento originale in gres anni '70, pareti con macchie di umidità nell'angolo nord e intonaco che si stacca vicino al soffitto.",
          materiali: ["pavimento in gres anni '70", "infissi in legno con avvolgibile", "radiatori in ghisa"],
          criticita: [{ testo: "Umidità e intonaco che si stacca nell'angolo nord-est", gravita: "alta", foto: [1] }, { testo: "Infissi in legno senza vetrocamera, dispersioni", gravita: "media", foto: [1] }],
          interventi: [{ testo: "Risanamento della muratura e intonaco deumidificante", priorita: "necessario" }, { testo: "Nuovo pavimento in gres effetto legno", priorita: "consigliato" }, { testo: "Infissi in PVC con vetro basso-emissivo", priorita: "consigliato" }], foto: [1] },
        { nome: "Cucina", categoria: "cucina", esterno: false, larg: 3.2, lung: 3.6, alt: 2.8, superficie: 11.5, fonte_misure: "planimetria", stato: 2,
          descrizione: "Cucina in legno originale con piano in laminato consumato e rivestimento in ceramica decorata. Fornelli a gas senza valvola di sicurezza visibile.",
          materiali: ["mobili in legno", "rivestimento ceramico anni '80", "luce al neon"],
          criticita: [{ testo: "Attacco gas da verificare: tubo in gomma visibile", gravita: "urgente", foto: [2] }],
          interventi: [{ testo: "Verifica e rifacimento della linea gas", priorita: "necessario" }, { testo: "Nuova cucina con piano in quarzo e rivestimento in gres", priorita: "consigliato" }, { testo: "Illuminazione a LED sotto i pensili", priorita: "migliorativo" }], foto: [2] },
        { nome: "Bagno primo piano", categoria: "bagno", esterno: false, larg: 2.4, lung: 2.5, alt: 2.7, superficie: 6, fonte_misure: "nota vocale", stato: 1,
          descrizione: "Bagno con vasca in muratura, sanitari a pavimento e rivestimento anni '80 fino a 2,20 m. Macchia d'infiltrazione a soffitto vicino alla finestra.",
          materiali: ["rivestimento ceramico decorato", "vasca in muratura", "sanitari a pavimento"],
          criticita: [{ testo: "Infiltrazione a soffitto: possibile perdita dal piano superiore o dal tetto", gravita: "alta", foto: [3] }],
          interventi: [{ testo: "Rifacimento completo con doccia filo pavimento", priorita: "necessario" }, { testo: "Sanitari sospesi e mobile con lavabo integrato", priorita: "consigliato" }], foto: [3] },
        { nome: "Camera matrimoniale", categoria: "camera", esterno: false, larg: 3.8, lung: 4.2, alt: 2.8, superficie: 16, fonte_misure: "planimetria", stato: 3,
          descrizione: "Camera in buono stato, pavimento in gres coerente con il resto della casa. Solo tinteggiatura e nuove prese.", materiali: ["pavimento in gres", "porta in legno tamburata"],
          criticita: [{ testo: "Prese senza messa a terra visibile", gravita: "media", foto: [] }], interventi: [{ testo: "Tinteggiatura e nuove prese", priorita: "consigliato" }], foto: [] },
        { nome: "Giardino", categoria: "giardino", esterno: true, larg: null, lung: null, alt: null, superficie: 180, fonte_misure: "planimetria", stato: 2,
          descrizione: "Giardino privato sul lato della casa con prato disomogeneo, camminamento in cemento crepato e recinzione in ferro arrugginita.",
          materiali: ["camminamento in cemento", "recinzione in ferro", "agrumi"],
          criticita: [{ testo: "Camminamento crepato e con dislivelli: rischio di inciampo", gravita: "media", foto: [4] }, { testo: "Recinzione arrugginita e instabile in più punti", gravita: "media", foto: [4] }],
          interventi: [{ testo: "Nuovo camminamento in pietra grande formato", priorita: "consigliato" }, { testo: "Recinzione in metallo verniciato a polvere", priorita: "consigliato" }, { testo: "Prato, aiuole a bassa manutenzione e irrigazione automatica", priorita: "migliorativo" }], foto: [4] },
        { nome: "Facciata e balcone", categoria: "facciata", esterno: true, larg: null, lung: null, alt: null, superficie: 210, fonte_misure: "nota vocale", stato: 2,
          descrizione: "Intonaco sbiadito e distaccato in più punti, crepe sotto la soletta del balcone e macchie di risalita alla base. Ringhiera arrugginita.",
          materiali: ["intonaco tradizionale", "infissi in alluminio senza taglio termico", "ringhiera in ferro"],
          criticita: [{ testo: "Crepe sotto la soletta del balcone: possibile ferro d'armatura ossidato", gravita: "urgente", foto: [5] }, { testo: "Umidità di risalita alla base dei muri", gravita: "alta", foto: [5] }],
          interventi: [{ testo: "Ripristino dei frontalini e della soletta del balcone", priorita: "necessario" }, { testo: "Cappotto termico 10 cm e finitura ai silicati", priorita: "consigliato" }, { testo: "Ringhiera in vetro e acciaio", priorita: "migliorativo" }], foto: [5] },
      ],
      impianti: [
        { tipo: "elettrico", stato: 2, osservazioni: "Quadro con fusibili, poche prese per stanza, nessun differenziale visibile.", da_verificare: true },
        { tipo: "idraulico", stato: 2, osservazioni: "Tubazioni in ferro zincato, pressione bassa al primo piano.", da_verificare: true },
        { tipo: "riscaldamento", stato: 3, osservazioni: "Caldaia a gas di circa 15 anni con radiatori in ghisa.", da_verificare: true },
        { tipo: "gas", stato: 1, osservazioni: "Tubo in gomma a vista in cucina, da mettere a norma subito.", da_verificare: true },
      ],
      sicurezza: [{ testo: "Crepe sotto il balcone: serve una verifica strutturale prima di caricare il balcone", gravita: "urgente" }, { testo: "Lastre ondulate sul ricovero attrezzi in giardino: possibile fibrocemento con amianto, serve un'analisi", gravita: "alta" }],
      energia: { osservazioni: "Muri senza isolamento, infissi in alluminio senza taglio termico e caldaia datata: dispersioni alte d'inverno e caldo d'estate.",
        interventi: [{ testo: "Cappotto termico 10 cm", beneficio: "Meno dispersioni e più comfort estivo", incentivi: "Detrazione possibile, da verificare" }, { testo: "Infissi in PVC basso-emissivi", beneficio: "Niente spifferi e condensa", incentivi: "Detrazione possibile, da verificare" }, { testo: "Pompa di calore e fotovoltaico 4,5 kW", beneficio: "Bollette più basse", incentivi: "Da verificare con il tecnico" }] },
      voci: [
        { servizio: "demolizioni", voce: "Rimozione rivestimenti, sanitari e vasca bagno", qta: 1, um: "a corpo", ambiente: "Bagno primo piano", priorita: "necessario" },
        { servizio: "imp_gas", voce: "Rifacimento linea gas cucina con certificazione", qta: 1, um: "a corpo", ambiente: "Cucina", priorita: "necessario" },
        { servizio: "intonaci", voce: "Intonaco deumidificante pareti soggiorno", qta: 14, um: "mq", ambiente: "Soggiorno", priorita: "necessario" },
        { servizio: "pavimenti", voce: "Pavimento gres effetto legno soggiorno e camera", qta: 39.9, um: "mq", ambiente: "Soggiorno", priorita: "consigliato" },
        { servizio: "infissi", voce: "Infissi in PVC basso-emissivi", qta: 9, um: "cad", ambiente: "Tutta la casa", priorita: "consigliato" },
        { servizio: "cappotto", voce: "Cappotto termico EPS 10 cm con rasatura", qta: 210, um: "mq", ambiente: "Facciata e balcone", priorita: "consigliato" },
        { servizio: "ponteggi", voce: "Ponteggio facciate", qta: 260, um: "mq", ambiente: "Facciata e balcone", priorita: "necessario" },
        { servizio: "esterni", voce: "Camminamento in pietra grande formato", qta: 0, um: "mq", ambiente: "Giardino", priorita: "consigliato" },
      ],
      fasi: [{ nome: "Verifiche e pratiche", settimane: 2, descrizione: "Verifica strutturale del balcone, analisi lastre, CILA" }, { nome: "Demolizioni e impianti", settimane: 3, descrizione: "Bagno, cucina, linee elettrica, idrica e gas" },
        { nome: "Facciata e cappotto", settimane: 4, descrizione: "Ponteggio, balcone, cappotto, infissi" }, { nome: "Finiture interne", settimane: 3, descrizione: "Pavimenti, rivestimenti, tinteggiature" }, { nome: "Giardino", settimane: 2, descrizione: "Camminamento, recinzione, verde e irrigazione" }],
      durata_settimane: 14,
      foto: [{ n: 1, ambiente: "Soggiorno", didascalia: "Angolo nord-est: umidità e intonaco che si stacca vicino al soffitto" }, { n: 2, ambiente: "Cucina", didascalia: "Fornelli a gas con tubo in gomma a vista" },
        { n: 3, ambiente: "Bagno", didascalia: "Vasca in muratura e macchia d'infiltrazione a soffitto" }, { n: 4, ambiente: "Giardino", didascalia: "Camminamento crepato e recinzione arrugginita" }, { n: 5, ambiente: "Facciata", didascalia: "Crepe sotto il balcone e risalita alla base" }],
      trascrizioni: ["Casa indipendente, piano terra soggiorno, cucina e bagno di servizio, sopra due camere e il bagno principale. Il bagno sopra è due e quaranta per due e cinquanta. Il cliente vuole rifare tutto, prima la facciata perché dal balcone cadono pezzi.", "In giardino vogliono un vialetto nuovo e la recinzione. C'è una casetta per gli attrezzi con il tetto ondulato, vecchio."],
      video: [{ n: 1, sintesi: "Giro completo di 3 minuti: ingresso, soggiorno, cucina, scala, camere, bagno, balcone e giardino. Si sentono le misure del bagno; mancano quelle della cucina al piano terra." }],
      documenti: ["Planimetria catastale aggiornata", "Titoli edilizi precedenti (licenza o condono)", "Dichiarazioni di conformità degli impianti", "Libretto della caldaia", "APE se disponibile"],
      dubbi: ["Altezza del rivestimento del bagno al piano terra?", "Il ricovero attrezzi è stato costruito con permesso?", "Il cliente vuole spostare la cucina?"],
      titolo: "cila", titolo_motivo: "Opere interne con rifacimento impianti; facciata e cappotto senza modifica dei prospetti. Da confermare dopo la verifica strutturale.",
    };
    return { ia, foto, render };
  }
  window.ACRelazione = { html, monta, esempio };
})();
