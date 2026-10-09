(function () {
  const AC = window.AC;
  const { html, icon, toast, raw, esc } = AC.ui;
  const S = AC.store;

  function bindTabs(root) {
    root.addEventListener("click", (e) => {
      const tab = e.target.closest("[data-tab]");
      if (!tab || !root.contains(tab)) return;
      const name = tab.getAttribute("data-tab");
      root.querySelectorAll("[data-tab]").forEach((b) => {
        b.setAttribute("aria-selected", b === tab ? "true" : "false");
        b.classList.toggle("on", b === tab);
      });
      root.querySelectorAll("[data-pane]").forEach((p) => {
        p.hidden = p.getAttribute("data-pane") !== name;
      });
    });
  }

  function formVal(form) {
    const o = {};
    Array.from(form.elements).forEach((el) => {
      if (!el.name) return;
      o[el.name] = el.value;
    });
    return o;
  }

  const V = {};
  let portaProva = "pin";
  let portaSelId = "";

  V.scegli = {
    title: "Tre viste",
    sub: "Stesso guscio. Sotto, tre prove di bacheca. Scegli una.",
    render(el) {
      const ads = adsBacheca();
      if (!portaSelId || !ads.some((x) => x.id === portaSelId)) portaSelId = ads[0] ? ads[0].id : "";
      const sel = ads.find((x) => x.id === portaSelId);
      el.innerHTML = html`
        <p class="note">Scegli la famiglia. Poi i tasti fissi: Profilo, Pubblica, Chat. Opportunità sta in header, per tutti, con due scelte.</p>
        <div class="kpis kpis-3">
          <a class="kpi" href="#/privato/bacheca">
            <span class="ico navy">${icon("user", 18)}</span>
            <span><strong>Privato</strong><small>Web o invito. Opportunità e aste in header.</small></span>
          </a>
          <a class="kpi" href="#/azienda/bacheca">
            <span class="ico orange">${icon("building", 18)}</span>
            <span><strong>Azienda</strong><small>Albo fornitori. Condominio e agenzia qui.</small></span>
          </a>
          <a class="kpi" href="#/agente/bacheca">
            <span class="ico blue">${icon("team", 18)}</span>
            <span><strong>Agente</strong><small>Catena, inviti, guadagno.</small></span>
          </a>
        </div>
        <div class="card">
          <h2>Tre prove di bacheca</h2>
          <p class="note">Altre tre rispetto all’elenco attuale. Pin da Pinterest. Quadri da Wallapop e Leboncoin. Per città da Kleinanzeigen. Non entra in Pubblica finché non scegli.</p>
          <div class="tabs">
            <button type="button" class="tab ${portaProva === "pin" ? "on" : ""}" data-prova="pin">1 · Pin</button>
            <button type="button" class="tab ${portaProva === "quadri" ? "on" : ""}" data-prova="quadri">2 · Quadri</button>
            <button type="button" class="tab ${portaProva === "citta" ? "on" : ""}" data-prova="citta">3 · Per città</button>
          </div>
          <p class="note" id="prova-lab">${labProva(portaProva)}</p>
          <div id="porta-prova">${markupProva(ads, portaSelId)}</div>
        </div>
        ${sel ? html`<div class="ad-duo">${schedaAnonima(sel)}${schedaPiena(sel, S.data.famiglia || "privato")}</div>` : ""}`.s;
      el.addEventListener("click", (e) => {
        const prova = e.target.closest("[data-prova]");
        if (prova && el.contains(prova)) {
          portaProva = prova.getAttribute("data-prova");
          const next = document.createElement("div");
          el.replaceWith(next);
          V.scegli.render(next);
          return;
        }
        const iscr = e.target.closest("[data-iscriviti]");
        if (iscr) {
          toast("Per rispondere serve l’iscrizione con profilo approfondito.");
          return;
        }
        const card = e.target.closest("[data-bac]");
        if (!card || !el.contains(card)) return;
        portaSelId = card.getAttribute("data-bac");
        const next = document.createElement("div");
        el.replaceWith(next);
        V.scegli.render(next);
      });
    }
  };

  /* CONGELATO 20.09.2026. Tasto Profilo. Vista A: foglio a sinistra, cartina Italia 1 a destra. Luoghi e copertura sotto, solo azienda. Non riaprire tre viste. Logo azienda, foto privato. Agente: foto profilo e logo rete. Immagini nel foglio, accanto a Nome. */
  /* 01.10.2026: elenco categorie del profilo = fonte. Admin · Genera link lo riusa uguale. */
  const CATEGORIE_LINK = [
    { famiglia: "azienda", area: "Aziende - Edilizia, impianti e forniture edili", voci: [
      ["azienda_imprese_edili", "Imprese edili generali e appalto generale"],
      ["azienda_subappaltatori", "Subappaltatori e maestranze"],
      ["azienda_impiantisti", "Impiantisti e termoidraulici"],
      ["azienda_materiali_edili", "Fornitori di materiali edili, ferramenta e esposizione"],
      ["azienda_noleggio_attrezzature", "Noleggio attrezzature, ponteggi e macchinari di cantiere"]
    ] },
    { famiglia: "azienda", area: "Aziende - Logistica, trasporti e gestione servizi", voci: [
      ["azienda_traslochi", "Imprese di traslochi e autotrasporti"],
      ["azienda_facchinaggio", "Facchinaggio, magazzinaggio e movimentazione merci"],
      ["azienda_pulizie", "Pulizie civili, industriali e sanificazione"],
      ["azienda_manutenzione_stabili", "Manutenzione stabili, giardinaggio e sicurezza"]
    ] },
    { famiglia: "azienda", area: "Aziende - Alberghi, ristorazione e commercio", voci: [
      ["azienda_hotel", "Hotel, affittacamere e strutture ricettive"],
      ["azienda_ristoranti", "Ristoranti, bar, pizzerie e laboratori alimentari"],
      ["azienda_negozi", "Negozi, farmacie e centri commerciali"],
      ["azienda_capannoni", "Capannoni industriali, depositi e logistica aziendale"]
    ] },
    { famiglia: "azienda", area: "Aziende - Fornitori di servizi tra imprese e consulenze", voci: [
      ["azienda_studi_tecnici", "Studi tecnici, ingegneri, architetti e geometri"],
      ["azienda_consulenti", "Consulenti legali, fiscali e sicurezza (D.Lgs. 81/08)"],
      ["azienda_fornitori_it", "Fornitori di servizi informatici, programmi e promozione"]
    ] },
    { famiglia: "azienda", area: "Aziende - Energia e utenze", voci: [
      ["azienda_luce_gas", "Fornitori di luce, gas e servizi energetici"]
    ] },
    { famiglia: "azienda", area: "Aziende - Intermediazione immobiliare", voci: [
      ["azienda_agenzie_immobiliari", "Agenzie immobiliari e mediatori"]
    ] },
    { famiglia: "agente", area: "Agenti - Intermediazione e promozione", voci: [
      ["agente_agenti_commercio", "Agenti di commercio e procacciatori di affari"],
      ["agente_eventi", "Eventi, accompagnamento e promozione"]
    ] }
  ];
  // Vecchi id profilo → nuova voce link (chi ha già salvato resta leggibile nel select).
  const TIPO_AZ_LEGACY = {
    impresa: "azienda_imprese_edili",
    professionista: "azienda_studi_tecnici",
    hse: "azienda_consulenti",
    sicurezza_armata: "azienda_manutenzione_stabili",
    condominio: "azienda_manutenzione_stabili",
    agenzia: "azienda_agenzie_immobiliari",
    agente_agenzie_immobiliari: "azienda_agenzie_immobiliari",
    apl: "azienda_consulenti",
    industria: "azienda_capannoni",
    logistica: "azienda_traslochi",
    albergo: "azienda_hotel",
    negozio: "azienda_negozi",
    fornitore: "azienda_materiali_edili",
    artigiano: "azienda_impiantisti"
  };
  function tipoAziendaNorm(id) {
    return TIPO_AZ_LEGACY[id] || id || "";
  }
  function isTipoFornitore(id) {
    const pack = window.AC && AC.packKey ? AC.packKey(id) : id;
    return pack === "fornitore";
  }
  function modoFornVisibile(id) {
    // Materiali / noleggio / IT: il modo è già nella categoria; niente secondo select.
    if (window.AC && AC.fornitoreModoDi && AC.fornitoreModoDi(id)) return false;
    return isTipoFornitore(id);
  }
  const CATEGORIA_PRIVATO = ["privato", "Privato"];
  const LAB_FAMIGLIA_CAT = { privato: "Privato", azienda: "Azienda", agente: "Agente" };
  function sottoAreaLabel(area, famiglia) {
    const rawArea = String(area || "");
    if (famiglia === "azienda") return rawArea.replace(/^Aziende\s*[·\-]\s*/i, "") || rawArea;
    if (famiglia === "agente") return rawArea.replace(/^Agenti\s*[·\-]\s*/i, "") || rawArea;
    return rawArea;
  }
  function buildOpzioniCategorie(opts) {
    const selected = opts && opts.selected != null ? String(opts.selected) : "";
    const soloFamiglie = opts && opts.soloFamiglie ? opts.soloFamiglie : null;
    // Sempre le 3 categorie in evidenza; sotto le sottocategorie (aree + voci).
    const ordine = ["privato", "azienda", "agente"];
    let out = "";
    ordine.forEach((fam) => {
      if (soloFamiglie && soloFamiglie.indexOf(fam) < 0) return;
      out += '<optgroup label="' + esc(LAB_FAMIGLIA_CAT[fam]) + '">';
      if (fam === "privato") {
        out += '<option value="' + CATEGORIA_PRIVATO[0] + '"' + (selected === CATEGORIA_PRIVATO[0] ? " selected" : "") + ">" + esc(CATEGORIA_PRIVATO[1]) + "</option>";
      } else {
        CATEGORIE_LINK.forEach((g) => {
          if (g.famiglia !== fam) return;
          out += '<option disabled value="">— ' + esc(sottoAreaLabel(g.area, fam)) + " —</option>";
          g.voci.forEach((v) => {
            out += '<option value="' + v[0] + '"' + (selected === v[0] ? " selected" : "") + ">" + esc(v[1]) + "</option>";
          });
        });
      }
      out += "</optgroup>";
    });
    return raw(out);
  }
  // Un solo elenco per profilo e Admin · Genera link (stesse option, stesso ordine).
  function opzioniTipoAzienda(selected) {
    return buildOpzioniCategorie({ selected: tipoAziendaNorm(selected) });
  }
  function opzioniCategoriaLink() {
    return buildOpzioniCategorie({ selected: "" });
  }
  const LUOGO_TIPI = [
    ["sede", "Sede"],
    ["ufficio", "Ufficio"],
    ["succursale", "Succursale"],
    ["magazzino", "Magazzino"],
    ["produzione", "Sito di produzione"],
    ["cantiere", "Cantiere"],
    ["condominio", "Condominio / stabile"],
    ["albergo", "Albergo / struttura"],
    ["negozio", "Punto vendita"],
    ["deposito", "Deposito"],
    ["laboratorio", "Laboratorio"],
    ["studio", "Studio"],
    ["piazzale", "Piazzale"]
  ];
  const LUOGO_LAB = Object.fromEntries(LUOGO_TIPI);
  const REGIONI = [
    ["piemonte", "Piemonte"],
    ["valle-daosta", "Valle d’Aosta"],
    ["lombardia", "Lombardia"],
    ["trentino-alto-adige", "Trentino-Alto Adige"],
    ["veneto", "Veneto"],
    ["friuli-venezia-giulia", "Friuli-Venezia Giulia"],
    ["liguria", "Liguria"],
    ["emilia-romagna", "Emilia-Romagna"],
    ["toscana", "Toscana"],
    ["umbria", "Umbria"],
    ["marche", "Marche"],
    ["lazio", "Lazio"],
    ["abruzzo", "Abruzzo"],
    ["molise", "Molise"],
    ["campania", "Campania"],
    ["puglia", "Puglia"],
    ["basilicata", "Basilicata"],
    ["calabria", "Calabria"],
    ["sicilia", "Sicilia"],
    ["sardegna", "Sardegna"]
  ];
  const REGIONE_LAB = Object.fromEntries(REGIONI);
  const CITTA_TO_REG = {
    agrigento: "sicilia", alessandria: "piemonte", ancona: "marche", aosta: "valle-daosta",
    arezzo: "toscana", ascoli: "marche", asti: "piemonte", avellino: "campania",
    bari: "puglia", barletta: "puglia", belluno: "veneto", benevento: "campania",
    bergamo: "lombardia", biella: "piemonte", bologna: "emilia-romagna", bolzano: "trentino-alto-adige",
    brescia: "lombardia", brindisi: "puglia", cagliari: "sardegna", caltanissetta: "sicilia",
    campobasso: "molise", caserta: "campania", catania: "sicilia", catanzaro: "calabria",
    chieti: "abruzzo", como: "lombardia", cosenza: "calabria", cremona: "lombardia",
    crotone: "calabria", cuneo: "piemonte", enna: "sicilia", fermo: "marche",
    ferrara: "emilia-romagna", firenze: "toscana", foggia: "puglia", forli: "emilia-romagna",
    frosinone: "lazio", genova: "liguria", gorizia: "friuli-venezia-giulia", grosseto: "toscana",
    imperia: "liguria", isernia: "molise", "la spezia": "liguria", laquila: "abruzzo",
    latina: "lazio", lecce: "puglia", lecco: "lombardia", livorno: "toscana",
    lodi: "lombardia", lucca: "toscana", macerata: "marche", mantova: "lombardia",
    massa: "toscana", matera: "basilicata", messina: "sicilia", milano: "lombardia",
    modena: "emilia-romagna", monza: "lombardia", napoli: "campania", novara: "piemonte",
    nuoro: "sardegna", olbia: "sardegna", oristano: "sardegna", padova: "veneto",
    palermo: "sicilia", parma: "emilia-romagna", pavia: "lombardia", perugia: "umbria",
    pesaro: "marche", pescara: "abruzzo", piacenza: "emilia-romagna", pisa: "toscana",
    pistoia: "toscana", pordenone: "friuli-venezia-giulia", potenza: "basilicata", prato: "toscana",
    ragusa: "sicilia", ravenna: "emilia-romagna", "reggio calabria": "calabria",
    "reggio emilia": "emilia-romagna", rieti: "lazio", rimini: "emilia-romagna", roma: "lazio",
    rovigo: "veneto", salerno: "campania", sassari: "sardegna", savona: "liguria",
    seriate: "lombardia", siena: "toscana", siracusa: "sicilia", sondrio: "lombardia",
    taranto: "puglia", teramo: "abruzzo", terni: "umbria", torino: "piemonte",
    trapani: "sicilia", trento: "trentino-alto-adige", treviso: "veneto", trieste: "friuli-venezia-giulia",
    udine: "friuli-venezia-giulia", varese: "lombardia", venezia: "veneto", vercelli: "piemonte",
    verona: "veneto", vibo: "calabria", vicenza: "veneto", viterbo: "lazio"
  };
  function normCitta(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/'/g, "")
      .replace(/\s+/g, " ");
  }
  function regioneDiCitta(citta) {
    const k = normCitta(citta);
    if (CITTA_TO_REG[k]) return CITTA_TO_REG[k];
    if (k.indexOf("reggio") === 0 && k.indexOf("calab") >= 0) return "calabria";
    if (k.indexOf("reggio") === 0) return "emilia-romagna";
    if (k.indexOf("l aquila") === 0 || k === "aquila") return "abruzzo";
    return "";
  }
  AC.regioneDiCitta = regioneDiCitta;

  // Foto salvate nell'archivio Supabase degli annunci (bucket pubblico marketplace-annunci).
  const URL_FOTO_ANNUNCI = /^https:\/\/edsvmnxojsmknjuhobqa\.supabase\.co\/storage\/v1\/object\/public\/marketplace-annunci\/[A-Za-z0-9._\/-]+$/;

  function imgData(src, alt) {
    if (typeof src !== "string" || (src.indexOf("data:image/") !== 0 && !URL_FOTO_ANNUNCI.test(src))) return "";
    const safe = src.replace(/"/g, "");
    return raw('<img src="' + safe + '" alt="' + String(alt || "").replace(/[&<>"']/g, "") + '">');
  }

  function slotImg(kind, src, lab) {
    const has = typeof src === "string" && src.indexOf("data:image/") === 0;
    return html`<div class="pro-ava ${kind === "foto" ? "is-foto" : "is-logo"}" data-slot="${kind}">
      <span class="pro-ava-frame">${has ? imgData(src, lab) : html`<span class="pro-ava-empty">Vuoto</span>`}</span>
      <span class="pro-ava-lab">${lab}</span>
      <span class="pro-ava-act">
        <label class="btn-ghost file-lab"><span data-img-lab>${has ? "Cambia" : "Carica"}</span>
          <input type="file" accept="image/*" hidden data-img="${kind}">
        </label>
        <button type="button" class="btn-mini" data-togli-img="${kind}"${has ? "" : " hidden"}>Togli</button>
      </span>
    </div>`;
  }

  function rowImmagini(p, famiglia) {
    if (famiglia === "azienda") return html`<div class="pro-ava-row">${slotImg("logo", p.logo, "Logo")}</div>`;
    if (famiglia === "agente") return html`<div class="pro-ava-row">
      ${slotImg("foto", p.foto, "Foto profilo")}
      ${slotImg("logo", p.logo, "Logo rete")}
    </div>`;
    return html`<div class="pro-ava-row">${slotImg("foto", p.foto, "Foto profilo")}</div>`;
  }

  function tipoFields(p, famiglia) {
    if (famiglia !== "azienda") return "";
    const tipo = tipoAziendaNorm(p.tipoAzienda);
    const forn = modoFornVisibile(tipo);
    return html`<label>Categoria
      <select name="tipo">${opzioniTipoAzienda(tipo)}</select>
    </label>
    <label data-modo-forn${forn ? "" : " hidden"}>Vendita o noleggio
      <select name="fornitoreModo">
        <option value="vendita"${p.fornitoreModo === "vendita" ? " selected" : ""}>Solo vendita</option>
        <option value="noleggio"${p.fornitoreModo === "noleggio" ? " selected" : ""}>Solo noleggio</option>
        <option value="entrambi"${p.fornitoreModo === "entrambi" || !p.fornitoreModo ? " selected" : ""}>Vendita e noleggio</option>
      </select>
    </label>`;
  }

  function bindProfiloForm(root, p) {
    const form = root.querySelector("#f-pro");
    if (!form) return;
    const tipoSel = form.elements.tipo;
    const wrapModo = form.querySelector("[data-modo-forn]");
    if (tipoSel && wrapModo) {
      tipoSel.addEventListener("change", () => {
        wrapModo.hidden = !modoFornVisibile(tipoSel.value);
      });
    }
    let fotoHold = typeof p.foto === "string" && p.foto.indexOf("data:image/") === 0 ? p.foto : "";
    let logoHold = typeof p.logo === "string" && p.logo.indexOf("data:image/") === 0 ? p.logo : "";
    function paintSlot(kind) {
      const slot = form.querySelector('[data-slot="' + kind + '"]');
      if (!slot) return;
      const src = kind === "logo" ? logoHold : fotoHold;
      const has = src.indexOf("data:image/") === 0;
      const labEl = slot.querySelector(".pro-ava-lab");
      const lab = labEl ? labEl.textContent : "";
      const frame = slot.querySelector(".pro-ava-frame");
      const labBtn = slot.querySelector("[data-img-lab]");
      const togli = slot.querySelector("[data-togli-img]");
      if (frame) frame.innerHTML = (has ? imgData(src, lab) : html`<span class="pro-ava-empty">Vuoto</span>`).s;
      if (labBtn) labBtn.textContent = has ? "Cambia" : "Carica";
      if (togli) togli.hidden = !has;
    }
    function leggiFile(file, kind) {
      if (!file || String(file.type || "").indexOf("image/") !== 0) return;
      if (file.size > 900000) {
        toast("Immagine troppo grande. Resta sotto 900 KB.", "error");
        return;
      }
      const r = new FileReader();
      r.onload = () => {
        const src = String(r.result || "");
        if (src.indexOf("data:image/") !== 0) return;
        if (kind === "logo") logoHold = src;
        else fotoHold = src;
        paintSlot(kind);
      };
      r.readAsDataURL(file);
    }
    form.addEventListener("change", (e) => {
      const inp = e.target.closest("[data-img]");
      if (!inp || !form.contains(inp)) return;
      const kind = inp.getAttribute("data-img");
      const file = inp.files && inp.files[0];
      inp.value = "";
      leggiFile(file, kind);
    });
    form.addEventListener("click", (e) => {
      const b = e.target.closest("[data-togli-img]");
      if (!b || !form.contains(b)) return;
      const kind = b.getAttribute("data-togli-img");
      if (kind === "logo") logoHold = "";
      else fotoHold = "";
      paintSlot(kind);
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = formVal(e.target);
      const map = window.AC.tipoSettore || {};
      const tipo = tipoAziendaNorm(v.tipo || p.tipoAzienda);
      const pack = window.AC.packKey ? AC.packKey(tipo) : tipo;
      const fam = S.data.famiglia;
      const completo = !!(v.mestiere && (fam !== "azienda" || tipo));
      const modoDef = window.AC.fornitoreModoDi ? AC.fornitoreModoDi(tipo) : "";
      const patch = {
        nome: v.nome,
        zona: v.zona,
        mestiere: v.mestiere,
        livello: completo ? "apro" : "base",
        tipoAzienda: tipo,
        settore: pack ? map[pack] || map[tipo] || "" : p.settore,
        fornitoreModo: pack === "fornitore"
          ? (modoDef || v.fornitoreModo || "entrambi")
          : p.fornitoreModo || ""
      };
      if (fam === "privato" || fam === "agente") patch.foto = fotoHold;
      if (fam === "azienda" || fam === "agente") patch.logo = logoHold;
      S.updateProfilo(patch);
      toast(completo
        ? "Profilo completo salvato. Si aprono le famiglie del mestiere. In verifica da Nando."
        : "Profilo base salvato.");
    });
  }

  const REGIONI_ID = [
    "piemonte", "valle-daosta", "lombardia", "trentino-alto-adige", "veneto",
    "friuli-venezia-giulia", "liguria", "emilia-romagna", "toscana", "umbria",
    "marche", "lazio", "abruzzo", "molise", "campania", "puglia", "basilicata",
    "calabria", "sicilia", "sardegna"
  ];
  const CITTA_REG = {
    piemonte: "torino alessandria asti biella cuneo novara verbania verbano cusio ossola vercelli",
    "valle-daosta": "aosta valle d aosta",
    lombardia: "milano bergamo brescia como cremona lecco lodi mantova monza pavia sondrio varese seriate busto arsizio",
    "trentino-alto-adige": "trento bolzano trentino alto adige",
    veneto: "venezia verona padova vicenza treviso rovigo belluno mestre",
    "friuli-venezia-giulia": "trieste udine pordenone gorizia friuli",
    liguria: "genova savona la spezia imperia",
    "emilia-romagna": "bologna parma modena reggio emilia ravenna ferrara forli cesena rimini piacenza",
    toscana: "firenze pisa livorno siena prato lucca arezzo grosseto pistoia massa carrara",
    umbria: "perugia terni",
    marche: "ancona pesaro urbino macerata ascoli fermi",
    lazio: "roma latina frosinone viterbo rieti",
    abruzzo: "laquila pescara chieti teramo",
    molise: "campobasso isernia",
    campania: "napoli salerno caserta avellino benevento",
    puglia: "bari lecce taranto brindisi foggia barletta andria trani",
    basilicata: "potenza matera",
    calabria: "catanzaro cosenza reggio calabria croton vibo",
    sicilia: "palermo catania messina siracusa trapani ragusa agrigento caltanissetta enna",
    sardegna: "cagliari sassari nuoro olbia oristano"
  };
  const KIND_FILL = {
    sede: "#2A3C54",
    ufficio: "#1A2432",
    vendita: "#E56B10",
    cantiere: "#c45a0d",
    condominio: "#6d7c90",
    cop: "#8fa0b3"
  };
  const KIND_LAB = {
    sede: "Sede",
    ufficio: "Ufficio",
    vendita: "Punto vendita",
    cantiere: "Cantiere",
    condominio: "Condominio",
    cop: "Copertura"
  };
  const KIND_PRIO = ["sede", "ufficio", "vendita", "cantiere", "condominio", "cop"];

  function normIt(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['’]/g, " ");
  }

  function regioneDi(testo) {
    const t = " " + normIt(testo).replace(/-/g, " ") + " ";
    for (let i = 0; i < REGIONI_ID.length; i++) {
      const id = REGIONI_ID[i];
      const lab = id.replace(/-/g, " ");
      if (t.indexOf(" " + lab + " ") >= 0) return id;
    }
    const keys = Object.keys(CITTA_REG);
    for (let k = 0; k < keys.length; k++) {
      const id = keys[k];
      const cities = CITTA_REG[id].split(" ");
      for (let c = 0; c < cities.length; c++) {
        if (cities[c].length > 2 && t.indexOf(" " + cities[c] + " ") >= 0) return id;
      }
    }
    return "";
  }

  function kindDi(luogo) {
    const t = String(luogo.tipo || "");
    if (t === "cop") return "cop";
    if (t === "negozio") return "vendita";
    if (t === "ufficio" || t === "succursale" || t === "studio") return "ufficio";
    if (t === "cantiere") return "cantiere";
    if (t === "condominio" || t === "stabile" || t === "albergo") return "condominio";
    if (t === "sede" || t === "magazzino" || t === "deposito" || t === "piazzale" || t === "produzione" || t === "laboratorio") return "sede";
    const n = normIt(luogo.nome);
    if (n.indexOf("punto vendita") >= 0 || n.indexOf("negozio") >= 0) return "vendita";
    if (n.indexOf("ufficio") >= 0) return "ufficio";
    if (n.indexOf("cantiere") >= 0) return "cantiere";
    if (n.indexOf("condomin") >= 0 || n.indexOf("albergo") >= 0) return "condominio";
    return "sede";
  }

  function copInfo(p) {
    const modo = (p && p.copertura) || "sedi";
    const regs = [];
    function push(r) {
      if (r && regs.indexOf(r) < 0) regs.push(r);
    }
    if (modo === "citta") {
      (p.coperturaCitta || []).forEach((c) => push(c.regione || regioneDiCitta(c.citta)));
    }
    if (modo === "regioni") {
      (p.coperturaRegioni || []).forEach(push);
    }
    return { modo: modo, regs: regs };
  }

  function luoghiPerMappa(p, zonaLive) {
    const out = [];
    const visti = {};
    function add(item) {
      const citta = String(item.citta || item.zona || "").trim();
      const reg = (item.regione && REGIONI_ID.indexOf(item.regione) >= 0)
        ? item.regione
        : (regioneDiCitta(citta) || regioneDi(item.citta) || regioneDi(item.nome) || regioneDi(item.zona));
      if (!reg) return;
      const kind = kindDi(item);
      const key = reg + "|" + kind + "|" + (item.nome || citta);
      if (visti[key]) return;
      visti[key] = true;
      out.push({ reg: reg, kind: kind, nome: item.nome || citta || KIND_LAB[kind], citta: citta });
    }
    (S.data.org && S.data.org.luoghi ? S.data.org.luoghi : []).forEach(add);
    const zona = zonaLive != null ? zonaLive : (p && p.zona);
    if (zona && !(S.data.org && S.data.org.luoghi && S.data.org.luoghi.length)) {
      add({ tipo: "sede", nome: "Sede " + zona, citta: zona, zona: zona });
    }
    if (p && p.copertura === "citta") {
      (p.coperturaCitta || []).forEach((c) => add({ tipo: "cop", nome: c.citta, citta: c.citta, regione: c.regione }));
    }
    return out;
  }

  function pinCitta(svg, punti) {
    const old = svg.querySelector(".pro-pins");
    if (old) old.parentNode.removeChild(old);
    const byReg = {};
    const visti = {};
    punti.forEach((pt) => {
      const citta = String(pt.citta || "").trim();
      if (!citta || !pt.reg) return;
      const k = pt.reg + "|" + normCitta(citta);
      if (visti[k]) return;
      visti[k] = true;
      (byReg[pt.reg] = byReg[pt.reg] || []).push(pt);
    });
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "pro-pins");
    Object.keys(byReg).forEach((reg) => {
      const path = svg.querySelector('[data-id="' + reg + '"]');
      if (!path || !path.getBBox) return;
      let box;
      try { box = path.getBBox(); } catch (e) { return; }
      const list = byReg[reg];
      const n = list.length;
      list.forEach((pt, i) => {
        const ang = n === 1 ? -0.4 : (i / n) * Math.PI * 2;
        const rad = n === 1 ? Math.min(box.width, box.height) * 0.08 : Math.min(box.width, box.height) * 0.22;
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", String(box.x + box.width / 2 + Math.cos(ang) * rad));
        c.setAttribute("cy", String(box.y + box.height / 2 + Math.sin(ang) * rad));
        c.setAttribute("r", "6");
        c.setAttribute("fill", pt.kind === "cop" ? "#2A3C54" : "#E56B10");
        c.setAttribute("stroke", "#fff");
        c.setAttribute("stroke-width", "1.4");
        c.setAttribute("title", pt.citta);
        g.appendChild(c);
      });
    });
    svg.appendChild(g);
  }

  function coloraCartina(root, punti, cop) {
    const svg = root.querySelector(".pro-map-svg svg");
    if (!svg) return;
    const byReg = {};
    punti.forEach((pt) => {
      (byReg[pt.reg] = byReg[pt.reg] || []).push(pt);
    });
    cop = cop || { modo: "sedi", regs: [] };
    const paths = svg.querySelectorAll("[data-id]");
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const id = path.getAttribute("data-id");
      const list = (byReg[id] || []).filter((pt) => pt.kind !== "cop");
      path.removeAttribute("class");
      path.style.fill = "";
      path.style.stroke = "";
      path.style.strokeWidth = "";
      path.removeAttribute("title");
      if (!list.length) {
        if (cop.modo === "italia" || cop.regs.indexOf(id) >= 0) {
          path.style.fill = "#8fa0b3";
          path.setAttribute("class", "is-on is-cop");
          path.setAttribute("title", "Copertura");
        }
        continue;
      }
      const kinds = [];
      list.forEach((pt) => {
        if (kinds.indexOf(pt.kind) < 0) kinds.push(pt.kind);
      });
      kinds.sort((a, b) => KIND_PRIO.indexOf(a) - KIND_PRIO.indexOf(b));
      const main = kinds[0];
      path.style.fill = KIND_FILL[main] || KIND_FILL.sede;
      path.setAttribute("class", "is-on is-" + main);
      if (kinds.length > 1) {
        path.style.stroke = KIND_FILL[kinds[1]] || "#E56B10";
        path.style.strokeWidth = "1.8";
      }
      const nomi = list.map((pt) => pt.nome).join(", ");
      path.setAttribute("title", (KIND_LAB[main] || main) + ": " + nomi);
    }
    pinCitta(svg, punti);
  }

  function labMatch(p) {
    const modo = (p && p.copertura) || "sedi";
    if (modo === "italia") return "Match: tutta Italia.";
    const luoghi = (S.data.org && S.data.org.luoghi) || [];
    const citta = [];
    luoghi.forEach((l) => {
      if (l.citta && citta.indexOf(l.citta) < 0) citta.push(l.citta);
    });
    if (modo === "sedi") {
      return citta.length
        ? "Match: solo " + citta.slice(0, 8).join(", ") + (citta.length > 8 ? " e altre città delle sedi." : ".")
        : "Match: solo le sedi. Aggiungine una.";
    }
    if (modo === "citta") {
      (p.coperturaCitta || []).forEach((c) => {
        if (c.citta && citta.indexOf(c.citta) < 0) citta.push(c.citta);
      });
      return citta.length ? "Match: " + citta.slice(0, 10).join(", ") + (citta.length > 10 ? " e altre." : ".") : "Match: sedi e città extra, ancora vuote.";
    }
    const regs = [];
    luoghi.forEach((l) => {
      if (l.regione && regs.indexOf(l.regione) < 0) regs.push(l.regione);
    });
    (p.coperturaRegioni || []).forEach((r) => {
      if (r && regs.indexOf(r) < 0) regs.push(r);
    });
    return regs.length
      ? "Match: " + regs.map((r) => REGIONE_LAB[r] || r).join(", ") + "."
      : "Match: regioni delle sedi, ancora vuote.";
  }

  function cardProfiloA(p, famiglia) {
    const leg = KIND_PRIO.filter((k) => k !== "cop").map((k) => html`<li><i class="is-${k}"></i>${KIND_LAB[k]}</li>`);
    leg.push(html`<li><i class="is-cop"></i>Copertura</li>`);
    return html`<div class="pro-a">
      <form id="f-pro" class="pro-form">
        <h2>Compila il profilo</h2>
        <p class="note">Base e completo nello stesso foglio. Il base fa entrare. Il completo apre la piazza e le famiglie.</p>
        <div class="pro-id">
          ${rowImmagini(p, famiglia)}
          <div class="pro-fields">
            <label>Nome<input name="nome" value="${p.nome}"></label>
            <label>Zona<input name="zona" value="${p.zona}"></label>
            ${tipoFields(p, famiglia)}
            <label class="full">Sa fare / cerca<textarea name="mestiere">${p.mestiere}</textarea></label>
          </div>
        </div>
        <div class="row-actions"><button type="submit" class="btn-in">Salva profilo</button></div>
      </form>
      <aside class="pro-map">
        <h2>Presenza in Italia</h2>
        <p class="note">Ogni luogo accende città e regione. La copertura del match sta in navy chiaro.</p>
        <div class="pro-map-svg">${raw(AC.ITALIA_SVG || "")}</div>
        <ul class="pro-map-leg">${leg}</ul>
        ${famiglia === "azienda" ? html`<p class="note pro-match-lab">${labMatch(p)}</p>` : ""}
      </aside>
    </div>`;
  }

  function markupDove() {
    const p = S.data.profilo;
    const cop = p.copertura || "sedi";
    const luoghi = S.data.org.luoghi || [];
    const extraC = p.coperturaCitta || [];
    const extraR = p.coperturaRegioni || [];
    const isForn = isTipoFornitore(p.tipoAzienda);
    const defTipo = isForn ? "negozio" : "sede";
    const noteSei = isForn
      ? "Punti vendita, magazzini, depositi, piazzali. Anche mille. Uno per uno. La cartina accende città e regione."
      : "Sede, ufficio, magazzini, cantieri, condomini, alberghi, succursali. Anche mille. Uno per uno. La cartina accende città e regione.";
    const labSedi = isForn ? "Solo i miei punti" : "Solo le mie sedi";
    const optsTipo = LUOGO_TIPI.map(([v, lab]) => html`<option value="${v}"${v === defTipo ? " selected" : ""}>${lab}</option>`);
    const optsReg = html`<option value="">Regione</option>${REGIONI.map(([v, lab]) => html`<option value="${v}">${lab}</option>`)}`;
    const cittaOpt = Object.keys(CITTA_TO_REG).map((k) => html`<option value="${k.replace(/\b\w/g, (c) => c.toUpperCase())}"></option>`);
    const rows = luoghi.map((l) => html`<tr data-luogo-row data-q="${(l.nome + " " + l.citta + " " + (LUOGO_LAB[l.tipo] || l.tipo) + " " + (REGIONE_LAB[l.regione] || "")).toLowerCase()}">
      <td>${LUOGO_LAB[l.tipo] || l.tipo}</td>
      <td>${l.nome}</td>
      <td>${l.citta || "—"}</td>
      <td>${REGIONE_LAB[l.regione] || "—"}</td>
      <td><button type="button" class="btn-mini" data-del-luogo="${l.id}">Togli</button></td>
    </tr>`);
    const chipsC = extraC.map((c, i) => html`<span class="tag wait">${c.citta}${c.regione ? " · " + (REGIONE_LAB[c.regione] || "") : ""} <button type="button" class="chip-x" data-del-cop-citta="${i}" aria-label="Togli città">×</button></span>`);
    const chipsR = extraR.map((r) => html`<span class="tag wait">${REGIONE_LAB[r] || r} <button type="button" class="chip-x" data-del-cop-reg="${r}" aria-label="Togli regione">×</button></span>`);
    return html`<div class="pro-dove-main">
      <h2>Dove sei</h2>
      <p class="note">${noteSei}</p>
      <label class="pro-cerca">Cerca nei luoghi<input type="search" data-luogo-q placeholder="Nome, città, tipo"></label>
      <div class="perm-grid pro-luoghi-list">
        <table class="mini-table">
          <thead><tr><th>Tipo</th><th>Nome</th><th>Città</th><th>Regione</th><th></th></tr></thead>
          <tbody>${rows.length ? rows : html`<tr><td colspan="5">Nessun luogo. Aggiungine uno.</td></tr>`}</tbody>
        </table>
      </div>
      <form id="f-luogo" class="prefs wide pro-add-luogo">
        <label>Tipo<select name="tipo">${optsTipo}</select></label>
        <label>Nome<input name="nome" required placeholder="Punto vendita Milano"></label>
        <label>Città<input name="citta" required list="citta-it" placeholder="Milano"></label>
        <label>Regione<select name="regione" required>${optsReg}</select></label>
        <div class="row-actions"><button class="btn-in" type="submit">Aggiungi luogo</button></div>
      </form>
      <datalist id="citta-it">${cittaOpt}</datalist>
      <h2>Dove servi</h2>
      <p class="note">Questa copertura alimenta il match. Solo le sedi, altre città, altre regioni, o tutta Italia.</p>
      <div class="pro-cop" role="radiogroup" aria-label="Copertura dei servizi">
        <label class="chk"><input type="radio" name="copertura" value="sedi"${cop === "sedi" ? " checked" : ""}> ${labSedi}</label>
        <label class="chk"><input type="radio" name="copertura" value="citta"${cop === "citta" ? " checked" : ""}> Anche altre città</label>
        <label class="chk"><input type="radio" name="copertura" value="regioni"${cop === "regioni" ? " checked" : ""}> Anche altre regioni</label>
        <label class="chk"><input type="radio" name="copertura" value="italia"${cop === "italia" ? " checked" : ""}> Tutta Italia</label>
      </div>
      <div class="pro-cop-extra" ${cop === "citta" ? "" : "hidden"} data-extra="citta">
        <div class="chips">${chipsC.length ? chipsC : html`<span class="note">Nessuna città extra.</span>`}</div>
        <form id="f-cop-citta" class="prefs wide pro-add-luogo">
          <label>Città<input name="citta" required list="citta-it"></label>
          <label>Regione<select name="regione">${optsReg}</select></label>
          <div class="row-actions"><button class="btn-in" type="submit">Aggiungi città</button></div>
        </form>
      </div>
      <div class="pro-cop-extra" ${cop === "regioni" ? "" : "hidden"} data-extra="regioni">
        <div class="chips">${chipsR.length ? chipsR : html`<span class="note">Nessuna regione extra.</span>`}</div>
        <form id="f-cop-reg" class="prefs wide pro-add-luogo">
          <label>Regione<select name="regione" required>${optsReg}</select></label>
          <div class="row-actions"><button class="btn-in" type="submit">Aggiungi regione</button></div>
        </form>
      </div>
    </div>`;
  }

  function cardDove() {
    return html`<div class="card pro-dove is-solo">${markupDove()}</div>`;
  }

  function bindCittaRegione(form) {
    const citta = form.elements.citta;
    const reg = form.elements.regione;
    if (!citta || !reg) return;
    const fill = () => {
      const found = regioneDiCitta(citta.value);
      if (found) reg.value = found;
    };
    citta.addEventListener("change", fill);
    citta.addEventListener("blur", fill);
  }

  function bindDove(root) {
    const q = root.querySelector("[data-luogo-q]");
    if (q) {
      q.addEventListener("input", () => {
        const s = q.value.toLowerCase().trim();
        root.querySelectorAll("[data-luogo-row]").forEach((tr) => {
          const hay = tr.getAttribute("data-q") || "";
          tr.hidden = !!(s && hay.indexOf(s) < 0);
        });
      });
    }
    const fLuogo = root.querySelector("#f-luogo");
    if (fLuogo) {
      bindCittaRegione(fLuogo);
      fLuogo.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = formVal(e.target);
        const regione = v.regione || regioneDiCitta(v.citta);
        if (!v.nome || !v.citta || !regione) {
          toast("Nome, città e regione servono", "error");
          return;
        }
        S.addLuogo({ tipo: v.tipo, nome: v.nome, citta: v.citta, regione: regione });
        toast("Luogo aggiunto");
      });
    }
    root.querySelectorAll("[data-del-luogo]").forEach((b) => {
      b.addEventListener("click", () => {
        S.removeLuogo(b.getAttribute("data-del-luogo"));
        toast("Luogo tolto");
      });
    });
    root.querySelectorAll('input[name="copertura"]').forEach((r) => {
      r.addEventListener("change", () => {
        if (r.checked) S.setCopertura(r.value);
      });
    });
    const fCitta = root.querySelector("#f-cop-citta");
    if (fCitta) {
      bindCittaRegione(fCitta);
      fCitta.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = formVal(e.target);
        const regione = v.regione || regioneDiCitta(v.citta);
        if (!S.addCoperturaCitta({ citta: v.citta, regione: regione })) toast("Scrivi la città", "error");
        else toast("Città di copertura aggiunta");
      });
    }
    root.querySelectorAll("[data-del-cop-citta]").forEach((b) => {
      b.addEventListener("click", () => {
        S.removeCoperturaCitta(b.getAttribute("data-del-cop-citta"));
        toast("Città tolta");
      });
    });
    const fReg = root.querySelector("#f-cop-reg");
    if (fReg) {
      fReg.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = formVal(e.target);
        if (!v.regione) {
          toast("Scegli la regione", "error");
          return;
        }
        if (!S.addCoperturaRegione(v.regione)) toast("Regione già in elenco", "error");
        else toast("Regione di copertura aggiunta");
      });
    }
    root.querySelectorAll("[data-del-cop-reg]").forEach((b) => {
      b.addEventListener("click", () => {
        S.removeCoperturaRegione(b.getAttribute("data-del-cop-reg"));
        toast("Regione tolta");
      });
    });
  }

  V.profilo = {
    title: "Profilo",
    get sub() {
      if (S.data.famiglia === "azienda") return "Sedi, copertura e match. Base e completo nello stesso foglio.";
      return "Base e completo nello stesso foglio. Chiunque compila entrambi.";
    },
    render(el) {
      const p = S.data.profilo;
      const famiglia = S.data.famiglia;
      try { sessionStorage.removeItem("anchecasa-profilo-porta"); } catch (e) {}
      el.innerHTML = html`
        <div class="pro-shell${famiglia === "azienda" ? " has-dove" : ""}">
          <div class="card pro-card">${cardProfiloA(p, famiglia)}</div>
          ${famiglia === "azienda" ? cardDove() : ""}
        </div>`.s;
      bindProfiloForm(el, p);
      if (famiglia === "azienda") bindDove(el);
      const cop = copInfo(p);
      const punti = luoghiPerMappa(p);
      const mapRoot = el.querySelector(".pro-a");
      if (mapRoot) coloraCartina(mapRoot, punti, cop);
      const zonaIn = el.querySelector("#f-pro") && el.querySelector("#f-pro").elements.zona;
      if (zonaIn && mapRoot) {
        zonaIn.addEventListener("input", () => {
          coloraCartina(mapRoot, luoghiPerMappa(p, zonaIn.value), cop);
        });
      }
    }
  };

  /* CONGELATO 20.09.2026. Tasto Pubblica. Foto, match mestiere e zona, scheda anonima per chi non è iscritto anche dal link. Invito di massa solo azienda alla prima volta: link annuncio o iscrizione per ricevere, senza guadagno. Non cambiare queste regole senza richiesta esplicita. */
  let pubSelId = "";
  let pubTab = "bacheca";
  let bacQ = "";
  let bacZona = "";
  let bacFonte = "";

  function adsBacheca() {
    return (S.data.annunci || []).filter((a) => a.canale === "bacheca");
  }

  function bacThumb(a) {
    const f = Array.isArray(a.foto) && a.foto[0] ? a.foto[0].src : "";
    return html`<span class="bac-ph">${f ? imgFoto(f, a.cosa) : ""}</span>`;
  }

  function filtraBacheca() {
    return adsBacheca().filter((a) => {
      const q = bacQ.trim().toLowerCase();
      const z = bacZona.trim().toLowerCase();
      if (q && String(a.cosa || "").toLowerCase().indexOf(q) < 0 && String(a.testo || "").toLowerCase().indexOf(q) < 0) return false;
      if (z && String(a.dove || "").toLowerCase().indexOf(z) < 0) return false;
      if (bacFonte && a.fonte !== bacFonte) return false;
      return true;
    });
  }

  function bacItem(a, selId) {
    return html`<button type="button" class="bac-item ${a.id === selId ? "on" : ""}" data-bac="${a.id}">
      ${bacThumb(a)}
      <span class="bac-body">
        <span class="bac-tags">
          <span class="tag ${a.fonte === "sponsor" ? "ok" : "paused"}">${a.fonte === "sponsor" ? "Sponsor" : "Privato"}</span>
          <span class="tag new">${a.dir === "offro" ? "Offro" : "Cerco"}</span>
        </span>
        <strong>${a.cosa}</strong>
        <span class="bac-meta">${a.dove}${a.fonte === "sponsor" && a.azienda ? " · " + a.azienda : ""}</span>
      </span>
    </button>`;
  }

  function labProva(id) {
    if (id === "quadri") return "Quadri. Foto uguali, tre colonne. Come Wallapop e Leboncoin.";
    if (id === "citta") return "Per città. Ogni colonna è una bacheca locale. Come Kleinanzeigen sul posto.";
    return "Pin. Foto di altezza diversa, si scorre a colonna. Come Pinterest.";
  }

  function provaFoto(a, h) {
    const f = Array.isArray(a.foto) && a.foto[0] ? a.foto[0].src : "";
    const st = h ? ' style="height:' + Number(h) + 'px"' : "";
    return raw('<span class="prova-ph"' + st + ">" + (f ? imgFoto(f, a.cosa).s : "") + "</span>");
  }

  function capProva(a) {
    return html`<span class="prova-cap">
      <span class="prova-tags">
        <span class="tag ${a.fonte === "sponsor" ? "ok" : "paused"}">${a.fonte === "sponsor" ? "Sponsor" : "Privato"}</span>
        <span class="tag new">${a.dir === "offro" ? "Offro" : "Cerco"}</span>
      </span>
      <strong>${a.cosa}</strong>
      <span>${a.dove}${a.fonte === "sponsor" && a.azienda ? " · " + a.azienda : ""}</span>
    </span>`;
  }

  function markupProva(ads, selId) {
    if (!ads.length) return html`<p class="note">Nessun annuncio demo.</p>`;
    if (portaProva === "quadri") {
      return html`<div class="bac-quadri">${ads.map((a) => html`<button type="button" class="quad-card ${a.id === selId ? "on" : ""}" data-bac="${a.id}">
        ${provaFoto(a)}
        ${capProva(a)}
      </button>`)}</div>`;
    }
    if (portaProva === "citta") {
      const gruppi = [];
      const seen = {};
      ads.forEach((a) => {
        const k = a.dove || "Altro";
        if (!seen[k]) {
          seen[k] = true;
          gruppi.push(k);
        }
      });
      return html`<div class="bac-citta">${gruppi.map((citta) => html`<section class="citta-col">
        <h3>${citta}</h3>
        ${ads.filter((a) => (a.dove || "Altro") === citta).map((a) => html`<button type="button" class="citta-mini ${a.id === selId ? "on" : ""}" data-bac="${a.id}">
          ${provaFoto(a)}
          ${capProva(a)}
        </button>`)}
      </section>`)}</div>`;
    }
    const altezze = [168, 228, 148, 200, 176, 248, 156];
    return html`<div class="bac-pin">${ads.map((a, i) => html`<button type="button" class="pin-card ${a.id === selId ? "on" : ""}" data-bac="${a.id}">
      ${provaFoto(a, altezze[i % altezze.length])}
      ${capProva(a)}
    </button>`)}</div>`;
  }

  function testoAnonimo(s) {
    return String(s || "")
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[mail]")
      .replace(/\+?\d[\d\s./-]{7,}\d/g, "[tel]");
  }

  function imgFoto(src, alt) {
    const dataImg = imgData(src, alt);
    if (dataImg) return dataImg;
    if (typeof src === "string" && /^(\.\.\/sito\/img\/)[a-z0-9._-]+\.(jpe?g|png|webp)$/i.test(src)) {
      return raw('<img src="' + src.replace(/"/g, "") + '" alt="' + String(alt || "").replace(/[&<>"']/g, "") + '">');
    }
    return html``;
  }

  function thumbsFoto(list) {
    if (!list.length) return html``;
    return html`<div class="foto-row">${list.map((f, i) => html`<button type="button" class="foto-th" data-togli="${i}">
      ${imgFoto(f.src, f.nome || "Foto")}
    </button>`)}</div>`;
  }

  function schedaAnonima(a) {
    const foto = Array.isArray(a.foto) ? a.foto : [];
    const sponsor = a.fonte === "sponsor";
    const chiPub = sponsor ? (a.azienda || a.autore || "Azienda") : "";
    return html`<article class="ad-scheda anon">
      <p class="ad-kicker">Vista pubblica</p>
      <p><span class="tag new">${a.dir === "offro" ? "Offro" : "Cerco"}</span>
        ${sponsor ? html`<span class="tag ok">Sponsor</span>` : html`<span class="tag paused">Privato</span>`}</p>
      <h3>${a.cosa}</h3>
      <p class="ad-zona">Zona ${a.dove || "non indicata"}${chiPub ? " · " + chiPub : ""}</p>
      ${foto.length ? html`<div class="foto-row">${foto.map((f) => html`<span class="foto-th">${imgFoto(f.src, a.cosa)}</span>`)}</div>` : html`<p class="note">Senza foto.</p>`}
      <p class="ad-testo">${testoAnonimo(a.testo)}</p>
      <p class="note">${sponsor
        ? "Azienda in bacheca, in questa città. Mail, telefono e civico restano fuori."
        : "Annuncio privato. Nome, mail, telefono e civico restano fuori."}</p>
      <div class="row-actions"><button type="button" class="btn-in" data-iscriviti>Iscriviti per rispondere</button></div>
    </article>`;
  }

  function schedaPiena(a, famiglia) {
    const foto = Array.isArray(a.foto) ? a.foto : [];
    const chi = a.azienda || a.autore || S.data.profilo.nome || "Chi ha pubblicato";
    return html`<article class="ad-scheda piena">
      <p class="ad-kicker">Annuncio pubblicato</p>
      <p><span class="tag ${a.stato === "aperto" ? "new" : "closed"}">${a.stato}</span>
        <span class="tag ok">${a.dir === "offro" ? "Offro" : "Cerco"}</span>
        ${a.fonte === "sponsor" ? html`<span class="tag">Sponsor</span>` : ""}</p>
      <h3>${a.cosa}</h3>
      <p class="ad-zona">${a.dove || "Zona"} · ${chi}</p>
      ${foto.length ? html`<div class="foto-row">${foto.map((f) => html`<span class="foto-th">${imgFoto(f.src, a.cosa)}</span>`)}</div>` : ""}
      <p class="ad-testo">${a.testo}</p>
      <p class="note">Dentro: chi ha pubblicato e i match di mestiere e zona. Si risponde in chat.</p>
      <div class="row-actions"><a class="btn-ghost" href="#/${famiglia}/chat">Apri in chat</a></div>
    </article>`;
  }

  /* La mia bacheca (23.09.2026, su richiesta dell'utente): pagina di arrivo del Privato.
     I suoi annunci sono quelli non della bacheca pubblica (canale diverso da "bacheca");
     le risposte sono demo in S.data.risposte, da collegare quando gli annunci passano su Supabase.
     Ultimi 3: annunci di altri nella zona del profilo, completati con le altre zone se non bastano.
     Azienda e Agente: pagina vuota con la sola scritta, contenuti da decidere con l'utente. */
  // Riquadro «Completa il profilo» (01.10.2026): in cima alla Bacheca finché il profilo non è completo
  // (livello "apro" = mestiere compilato e, per l'azienda, la categoria). Vale per le tre famiglie.
  function riquadroProfilo(fam) {
    if (!fam || fam === "admin" || S.data.profilo.livello === "apro") return html``;
    const testo = fam === "azienda"
      ? "Scegli la tua categoria e compila il profilo: il pannello mostra i pulsanti giusti per il tuo lavoro."
      : fam === "agente"
        ? "Compila il tuo profilo: zona, attività e logo, così ti trovano e puoi iniziare."
        : "Compila il tuo profilo: ci vogliono pochi minuti e vedi gli annunci giusti per te.";
    return html`<div class="card profilo-da-completare">
      <h2>Completa il profilo</h2>
      <p class="note">${testo}</p>
      <div class="row-actions"><a class="btn-in" href="#/${fam}/profilo">Completa il profilo</a></div>
    </div>`;
  }

  V.bacheca = {
    title: "La mia bacheca",
    get sub() {
      return S.data.famiglia === "privato" ? "I tuoi annunci, chi ti ha risposto e gli ultimi annunci nella tua zona." : "";
    },
    render(el) {
      const fam = S.data.famiglia || "privato";
      if (fam !== "privato") {
        el.innerHTML = html`${riquadroProfilo(fam)}<div class="card empty bacheca-vuota"><strong>La Bacheca</strong></div>`.s;
        return;
      }
      const miei = (S.data.annunci || []).filter((a) => a.canale !== "bacheca");
      const risposte = (S.data.risposte || []).filter((r) => miei.some((a) => a.id === r.annuncio));
      const daLeggere = risposte.filter((r) => !r.letta).length;
      const aperti = miei.filter((a) => a.stato === "aperto").length;
      const zona = String(S.data.profilo.zona || "").trim();
      const io = S.data.profilo.nome || "";
      const altri = adsBacheca().filter((a) => !io || a.autore !== io);
      const inZona = zona ? altri.filter((a) => String(a.dove || "").toLowerCase() === zona.toLowerCase()) : [];
      const ultimi = inZona.concat(altri.filter((a) => inZona.indexOf(a) < 0)).slice(0, 3);
      const nRisp = (id) => risposte.filter((r) => r.annuncio === id).length;
      const cosaDi = (id) => (miei.find((a) => a.id === id) || {}).cosa || "annuncio";

      el.innerHTML = html`
        ${riquadroProfilo(fam)}
        <div class="kpis kpis-3">
          <div class="kpi">
            <span class="ico navy">${icon("send", 18)}</span>
            <span><strong>${aperti}</strong><small>${aperti === 1 ? "Annuncio aperto" : "Annunci aperti"}</small></span>
          </div>
          <div class="kpi">
            <span class="ico orange">${icon("chat", 18)}</span>
            <span><strong>${daLeggere}</strong><small>${daLeggere === 1 ? "Risposta da leggere" : "Risposte da leggere"}</small></span>
          </div>
          <div class="kpi">
            <span class="ico blue">${icon("home", 18)}</span>
            <span><strong>${inZona.length}</strong><small>${zona ? "Annunci a " + zona : "Annunci in bacheca"}</small></span>
          </div>
        </div>
        <div class="grid-eq">
          <div class="card">
            <h2>I tuoi annunci</h2>
            ${miei.length
              ? html`<table class="mini-table">
                  <thead><tr><th></th><th>Cosa</th><th>Zona</th><th>Stato</th><th class="num">Risposte</th></tr></thead>
                  <tbody>${miei.map((a) => html`<tr>
                    <td><span class="tag ok">${a.dir === "offro" ? "Offro" : "Cerco"}</span></td>
                    <td><a href="#/${fam}/pubblica" data-apri="${a.id}">${a.cosa}</a></td>
                    <td>${a.dove}</td>
                    <td><span class="tag ${a.stato === "aperto" ? "new" : "closed"}">${a.stato}</span></td>
                    <td class="num">${nRisp(a.id) || "nessuna"}</td>
                  </tr>`)}</tbody>
                </table>`
              : html`<p class="note">Non hai ancora pubblicato annunci.</p>`}
            <div class="row-actions"><a class="btn-in" href="#/${fam}/pubblica" data-nuovo>Pubblica un annuncio</a></div>
          </div>
          <div class="card">
            <h2>Hanno risposto</h2>
            ${risposte.length
              ? risposte.map((r) => html`<button type="button" class="mail-item risposta ${r.letta ? "" : "on"}" data-risposta="${r.id}">
                  <strong>${r.da}${r.letta ? "" : html` <span class="tag new">nuova</span>`}</strong>
                  <span>su «${cosaDi(r.annuncio)}» · ${r.quando}</span>
                  <span class="risposta-testo">${r.testo}</span>
                </button>`)
              : html`<p class="note">Nessuna risposta per ora. Quando qualcuno risponde a un tuo annuncio, lo vedi qui.</p>`}
          </div>
        </div>
        <div class="card bacheca-ultimi">
          <h2>${zona && inZona.length ? "Ultimi annunci a " + zona : "Ultimi annunci"}</h2>
          ${ultimi.length
            ? html`<div class="bac-quadri">${ultimi.map((a) => html`<button type="button" class="quad-card" data-bac="${a.id}">
                ${provaFoto(a)}
                ${capProva(a)}
              </button>`)}</div>`
            : html`<p class="note">Nessun annuncio in bacheca per ora.</p>`}
          <div class="row-actions"><a class="btn-ghost" href="#/${fam}/pubblica" data-tutti>Vedi tutta la bacheca</a></div>
        </div>`.s;

      el.addEventListener("click", (e) => {
        const apri = e.target.closest("[data-apri]");
        const nuovo = e.target.closest("[data-nuovo]");
        const tutti = e.target.closest("[data-tutti]");
        const bac = e.target.closest("[data-bac]");
        const risp = e.target.closest("[data-risposta]");
        if (apri) {
          pubTab = "scrivi";
          pubSelId = apri.getAttribute("data-apri");
        } else if (nuovo) {
          pubTab = "scrivi";
        } else if (tutti) {
          pubTab = "bacheca";
        } else if (bac) {
          // filtri azzerati, altrimenti l'annuncio scelto potrebbe restare nascosto in Pubblica
          bacQ = "";
          bacZona = "";
          bacFonte = "";
          pubTab = "bacheca";
          pubSelId = bac.getAttribute("data-bac");
          location.hash = "#/" + fam + "/pubblica";
        } else if (risp) {
          S.leggiRisposta(risp.getAttribute("data-risposta"));
          location.hash = "#/" + fam + "/chat";
        }
      });
    }
  };

  V.pubblica = {
    title: "Pubblica",
    sub: "Bacheca pubblica: privati, o azienda in sponsor sulla città. Accanto: annuncio pubblicato.",
    render(el) {
      const az = S.data.famiglia === "azienda";
      const fam = S.data.famiglia;
      const primo = az && S.data.profilo.primoUso !== false;
      const ads = S.data.annunci;
      // «I miei annunci» sono solo i propri (canale diverso da bacheca): con dati veri la bacheca
      // contiene gli annunci degli altri, che non vanno mai nell'elenco dei miei.
      const miei = ads.filter((a) => a.canale !== "bacheca");
      const board = filtraBacheca();
      const pool = pubTab === "bacheca" ? board : miei;
      if (!pubSelId || !pool.some((x) => x.id === pubSelId)) {
        pubSelId = (pool[0] || miei[0] || {}).id || "";
      }
      const sel = ads.find((x) => x.id === pubSelId);
      const list = miei.map(
        (a) => html`<tr data-id="${a.id}" class="${a.id === pubSelId ? "on" : ""}">
          <td>${a.dir}</td><td>${a.cosa}</td><td>${a.dove}</td>
          <td><span class="tag ${a.stato === "aperto" ? "new" : "closed"}">${a.stato}</span></td>
        </tr>`
      );
      const bacRows = board.map((a) => bacItem(a, pubSelId));
      el.innerHTML = html`
        <div class="tabs">
          <button type="button" class="tab ${pubTab === "bacheca" ? "on" : ""}" data-tab="bacheca" aria-selected="${pubTab === "bacheca" ? "true" : "false"}">Bacheca pubblica</button>
          <button type="button" class="tab ${pubTab === "scrivi" ? "on" : ""}" data-tab="scrivi" aria-selected="${pubTab === "scrivi" ? "true" : "false"}">Pubblica</button>
        </div>
        <div data-pane="bacheca" ${pubTab === "bacheca" ? "" : "hidden"}>
          <div class="bac-wrap">
          <div class="card bac-card">
            <h2>Bacheca</h2>
            <p class="note">Solo annunci di privati, o aziende in sponsor per lavori in quella città. Non è la piazza intera.</p>
            <div class="toolbar">
              <input type="search" id="bac-q" value="${bacQ}" placeholder="Cosa">
              <input type="search" id="bac-zona" value="${bacZona}" placeholder="Città">
              <select id="bac-fonte">
                <option value="" ${bacFonte === "" ? "selected" : ""}>Tutti</option>
                <option value="privato" ${bacFonte === "privato" ? "selected" : ""}>Privati</option>
                <option value="sponsor" ${bacFonte === "sponsor" ? "selected" : ""}>Sponsor in città</option>
              </select>
            </div>
            <p class="note" id="bac-n">${board.length} in bacheca</p>
            <div class="bac-list">${bacRows.length ? bacRows : html`<p class="note">Nessun annuncio in bacheca per questi filtri.</p>`}</div>
          </div>
          <div id="bac-detail">${sel && sel.canale === "bacheca" ? html`<div class="ad-duo">
            ${schedaAnonima(sel)}
            ${schedaPiena(sel, fam)}
          </div>` : html`<p class="note">Scegli un annuncio. A destra: vista pubblica e annuncio pubblicato.</p>`}</div>
          </div>
        </div>
        <div data-pane="scrivi" ${pubTab === "scrivi" ? "" : "hidden"}>
        <div class="card">
          <h2>Nuovo annuncio</h2>
          <p class="note">Il match è mestiere e copertura. In dove scrivi la città, non il civico. La copertura sta in Profilo.</p>
          <form id="f-pub">
            <div class="fields">
              <div class="field"><label for="dir">Direzione</label>
                <select id="dir" name="dir"><option value="cerco">Cerco</option><option value="offro">Offro</option></select>
              </div>
              <div class="field"><label for="cosa">Cosa</label>
                <select id="cosa" name="cosa">
                  <option>Artigiano</option><option>Impresa ristrutturazione</option>
                  <option>Vendo casa</option><option>Affitto casa</option>
                  <option>Lavoro</option><option>Tutor</option><option>Segretaria</option>
                  <option>Personale cantiere</option><option>Personale ufficio</option>
                  <option>Materiali</option><option>Mezzi</option><option>Sicurezza</option>
                </select>
              </div>
              <div class="field"><label for="dove">Dove</label><input id="dove" name="dove" value="${S.data.profilo.zona}"></div>
              <div class="field full"><label for="testo">Testo</label><textarea id="testo" name="testo" rows="3"></textarea></div>
              <div class="field full"><label for="foto">Foto</label>
                <label class="btn-ghost file-lab">Aggiungi foto
                  <input id="foto" name="foto" type="file" accept="image/*" multiple hidden>
                </label>
                <div id="foto-hold" class="foto-hold"></div>
              </div>
              ${primo ? html`<div class="field full primo-box">
                <strong>Fornitori, solo la prima volta</strong>
                <p class="note">Usi i software per la prima volta. Per farti fare i preventivi dai tuoi fornitori. Non guadagni.</p>
                <label for="mailforn">Mail dei fornitori</label>
                <textarea id="mailforn" name="mailforn" rows="2" placeholder="mario@ditta.it, anna@cantiere.it"></textarea>
                <label class="check"><input type="radio" name="modoInvito" value="annuncio" checked> Invia il link di questo annuncio</label>
                <label class="check"><input type="radio" name="modoInvito" value="iscrizione"> Consiglia di iscriversi per ricevere</label>
              </div>` : az ? html`<p class="note">Dalla seconda volta il match arriva da solo a chi è in piazza.</p>` : ""}
            </div>
            <div class="row-actions" style="margin-top:12px"><button class="btn-in" type="submit">Pubblica</button></div>
          </form>
        </div>
        <div class="card">
          <h2>I miei annunci</h2>
          <table class="mini-table">
            <thead><tr><th>Dir</th><th>Cosa</th><th>Dove</th><th>Stato</th></tr></thead>
            <tbody>${list.length ? list : html`<tr><td colspan="4">Nessun annuncio.</td></tr>`}</tbody>
          </table>
        </div>
        <div id="scrivi-detail">${sel ? html`<div class="ad-duo">
          ${schedaAnonima(sel)}
          ${schedaPiena(sel, fam)}
        </div>` : ""}</div>
        </div>`.s;

      const hold = [];
      let fotoBusy = 0;
      const holdEl = el.querySelector("#foto-hold");
      function paintHold() {
        if (!holdEl) return;
        holdEl.innerHTML = thumbsFoto(hold).s;
      }
      paintHold();
      const inputFoto = el.querySelector("#foto");
      if (inputFoto) {
        inputFoto.addEventListener("change", () => {
          const files = Array.from(inputFoto.files || []).filter((f) => f.type.indexOf("image/") === 0);
          inputFoto.value = "";
          files.forEach((f) => {
            if (hold.length + fotoBusy >= 6) return;
            if (f.size > 900000) {
              toast("Foto troppo grande. Resta sotto 900 KB.", "error");
              return;
            }
            fotoBusy += 1;
            const r = new FileReader();
            r.onload = () => {
              fotoBusy = Math.max(0, fotoBusy - 1);
              const src = String(r.result || "");
              if (src.indexOf("data:image/") !== 0) return;
              if (hold.length >= 6) return;
              hold.push({ nome: f.name, src: src });
              paintHold();
            };
            r.onerror = () => {
              fotoBusy = Math.max(0, fotoBusy - 1);
            };
            r.readAsDataURL(f);
          });
        });
      }
      if (holdEl) {
        holdEl.addEventListener("click", (e) => {
          const b = e.target.closest("[data-togli]");
          if (!b) return;
          hold.splice(Number(b.getAttribute("data-togli")), 1);
          paintHold();
        });
      }
      el.querySelector("#f-pub").addEventListener("submit", (e) => {
        e.preventDefault();
        const form = e.target;
        const v = formVal(form);
        if (fotoBusy) {
          toast("Attendi il caricamento delle foto.", "error");
          return;
        }
        if (!v.testo) {
          toast("Scrivi il testo dell’annuncio", "error");
          return;
        }
        const mailEl = form.elements.mailforn;
        const inviti = mailEl ? String(mailEl.value || "").trim() : "";
        const modoEl = form.elements.modoInvito;
        const modoInvito = modoEl ? modoEl.value : "";
        pubSelId = "";
        S.addAnnuncio({
          dir: v.dir,
          cosa: v.cosa,
          dove: v.dove,
          testo: v.testo,
          foto: hold.slice(),
          inviti: inviti,
          modoInvito: inviti ? modoInvito : ""
        });
        if (inviti && modoInvito === "iscrizione") toast("Annuncio pubblicato. Ai fornitori il consiglio di iscriversi per ricevere.");
        else if (inviti) toast("Annuncio pubblicato. Ai fornitori il link della scheda anonima.");
        else toast("Annuncio pubblicato. Match mestiere e zona.");
      });
      function duoMarkup(a) {
        if (!a) return "";
        return html`<div class="ad-duo">${schedaAnonima(a)}${schedaPiena(a, fam)}</div>`.s;
      }
      function paintDuo() {
        const a = S.data.annunci.find((x) => x.id === pubSelId);
        const bac = el.querySelector("#bac-detail");
        const scr = el.querySelector("#scrivi-detail");
        if (bac) {
          bac.innerHTML = a && a.canale === "bacheca"
            ? duoMarkup(a)
            : html`<p class="note">Scegli un annuncio. A destra: vista pubblica e annuncio pubblicato.</p>`.s;
        }
        if (scr) scr.innerHTML = a ? duoMarkup(a) : "";
        el.querySelectorAll("tr[data-id]").forEach((r) => r.classList.toggle("on", r.getAttribute("data-id") === pubSelId));
        el.querySelectorAll("[data-bac]").forEach((r) => r.classList.toggle("on", r.getAttribute("data-bac") === pubSelId));
      }
      function paintBacList() {
        const board = filtraBacheca();
        const nEl = el.querySelector("#bac-n");
        const listEl = el.querySelector(".bac-list");
        if (nEl) nEl.textContent = board.length + " in bacheca";
        if (listEl) {
          listEl.innerHTML = html`${board.length ? board.map((a) => bacItem(a, pubSelId)) : html`<p class="note">Nessun annuncio in bacheca per questi filtri.</p>`}`.s;
        }
        if (pubTab === "bacheca" && (!pubSelId || !board.some((x) => x.id === pubSelId))) {
          pubSelId = board[0] ? board[0].id : "";
        }
        paintDuo();
      }
      bindTabs(el);
      el.addEventListener("click", (e) => {
        const tab = e.target.closest("[data-tab]");
        if (tab && el.contains(tab)) pubTab = tab.getAttribute("data-tab");
        const iscr = e.target.closest("[data-iscriviti]");
        if (iscr) {
          toast("Per rispondere serve l’iscrizione con profilo approfondito.");
          return;
        }
        const bacBtn = e.target.closest("[data-bac]");
        if (bacBtn && el.contains(bacBtn)) {
          pubSelId = bacBtn.getAttribute("data-bac");
          paintDuo();
          return;
        }
        const row = e.target.closest("tr[data-id]");
        if (!row || !el.contains(row)) return;
        pubSelId = row.getAttribute("data-id");
        paintDuo();
      });
      const qEl = el.querySelector("#bac-q");
      const zEl = el.querySelector("#bac-zona");
      const fEl = el.querySelector("#bac-fonte");
      function leggiFiltri() {
        if (qEl) bacQ = qEl.value;
        if (zEl) bacZona = zEl.value;
        if (fEl) bacFonte = fEl.value;
        paintBacList();
      }
      if (qEl) qEl.addEventListener("input", leggiFiltri);
      if (zEl) zEl.addEventListener("input", leggiFiltri);
      if (fEl) fEl.addEventListener("change", leggiFiltri);
    }
  };

  V.chat = {
    title: "Chat",
    sub: "Casella AncheCasa. Credit sta qui, con sblocco admin.",
    render(el) {
      const mails = S.data.mail.filter((m) => m.id !== "m2");
      const sblocco = S.data.creditSblocco || "chiuso";
      const creditLab = sblocco === "ok" ? "sbloccato da admin" : sblocco === "attesa" ? "in attesa di sblocco admin" : "chiedi sblocco ad admin";
      el.innerHTML = html`
        <div class="mail-grid">
          <div class="card">
            <h2>Posta</h2>
            <button type="button" class="mail-item on" data-mail="credit">
              <strong>Credit</strong><span>${creditLab}</span>
            </button>
            ${mails.map((m) => html`<button type="button" class="mail-item" data-mail="${m.id}">
              <strong>${m.titolo}</strong><span>${m.da} · ${m.quando}</span>
            </button>`)}
          </div>
          <div class="card" id="thread"></div>
        </div>`.s;

      function paintThread(id) {
        const thread = el.querySelector("#thread");
        if (id === "credit") {
          if (sblocco === "chiuso") {
            thread.innerHTML = html`
              <h2>Credit</h2>
              <p class="note">Finanziamento o liquidità, anche per i privati. Non è un tasto a parte. Si chiede qui. Admin sblocca, poi il filo arriva a banca o broker.</p>
              <form id="f-credit" class="prefs">
                <label>Tipo<select name="tipo"><option>Liquidità</option><option>Finanziamento</option><option>Mutuo</option></select></label>
                <label>Importo<input name="imp" type="number" value="50000"></label>
                <div class="row-actions"><button type="submit" class="btn-in">Chiedi sblocco ad admin</button></div>
              </form>`.s;
            thread.querySelector("#f-credit").addEventListener("submit", (e) => {
              e.preventDefault();
              S.chiediCredit();
              toast("Richiesta Credit inviata. In attesa di sblocco admin.");
            });
            return;
          }
          if (sblocco === "attesa") {
            thread.innerHTML = html`
              <h2>Credit</h2>
              <p class="note">Richiesta inviata. Admin Nando deve sbloccare. Finché non sblocca, banca e broker non entrano in questo filo.</p>
              <p>Stato: in attesa di sblocco admin.</p>`.s;
            return;
          }
          thread.innerHTML = html`
            <h2>Credit</h2>
            <p class="note">Sbloccato da admin. Mail interna verso banca o broker AncheCasa.</p>
            <p>Documenti ricevuti. Si risponde in questo filo.</p>
            <form id="f-chat" class="prefs">
              <label>Rispondi<textarea name="corpo" rows="3"></textarea></label>
              <div class="row-actions"><button type="submit" class="btn-in">Invia</button></div>
            </form>`.s;
          thread.querySelector("#f-chat").addEventListener("submit", (e) => {
            e.preventDefault();
            toast("Messaggio sul filo Credit");
            e.target.elements.corpo.value = "";
          });
          return;
        }
        const m = mails.find((x) => x.id === id);
        if (!m) return;
        thread.innerHTML = html`
          <h2>${m.titolo}</h2>
          <p class="note">Mail interna AncheCasa. Preventivi e file sullo stesso filo. Se è una gara, l’allegato va al modulo contabile.</p>
          <p>${m.corpo}</p>
          <form id="f-chat" class="prefs">
            <label>Rispondi<textarea name="corpo" rows="3"></textarea></label>
            <div class="row-actions">
              <button type="submit" class="btn-in">Invia</button>
              <button type="button" class="btn-ghost" data-chiudi>Chiudi annuncio in chat</button>
          </div>
          </form>`.s;
        thread.querySelector("#f-chat").addEventListener("submit", (e) => {
          e.preventDefault();
          toast("Messaggio sul filo AncheCasa");
          e.target.elements.corpo.value = "";
        });
        const chiudi = thread.querySelector("[data-chiudi]");
        if (chiudi) {
          chiudi.addEventListener("click", () => {
            const aperto = S.data.annunci.find((a) => a.stato === "aperto" && a.canale !== "bacheca");
            if (aperto) S.chiudiAnnuncio(aperto.id);
            toast("Annuncio chiuso in chat");
          });
        }
      }

      paintThread("credit");
      el.addEventListener("click", (e) => {
        const b = e.target.closest("[data-mail]");
        if (!b) return;
        el.querySelectorAll("[data-mail]").forEach((x) => x.classList.toggle("on", x === b));
        paintThread(b.getAttribute("data-mail"));
      });
    }
  };

  V.opportunita = {
    title: "Opportunità",
    sub: "Due vie. Aste immobiliari, o un’opportunità con mandato.",
    render(el) {
      const f = S.data.famiglia;
      el.innerHTML = html`
        <div class="kpis scelte-opp">
          <a class="kpi" href="#/${f}/aste">
            <span class="ico navy">${icon("home", 18)}</span>
            <span><strong>Aste immobiliari</strong><small>Ricerca e contatto. La richiesta arriva ad admin.</small></span>
          </a>
          <a class="kpi" href="#/${f}/nuovaopportunita">
            <span class="ico orange">${icon("star", 18)}</span>
            <span><strong>Opportunità</strong><small>Mandato o documento di proprietà. Admin verifica.</small></span>
          </a>
          </div>`.s;
    }
  };

  V.nuovaopportunita = {
    title: "Opportunità",
    sub: "Immobiliari. Mandato o documento di proprietà. Admin verifica.",
    render(el) {
      el.innerHTML = html`
        <div class="card">
          <h2>Nuova opportunità</h2>
          <p class="note"><a href="#/${S.data.famiglia}/opportunita">Torna alle scelte</a>. Mandato o documento di proprietà. Se si vende, va negli annunci privati.</p>
          <form id="f-opp">
            <div class="fields">
              <div class="field full"><label for="tit">Titolo</label><input id="tit" name="tit" value="Terreno edificabile, cerco cordata"></div>
              <div class="field"><label for="doc">Documento</label>
                <select id="doc" name="doc"><option>Mandato</option><option>Documento di proprietà</option></select>
              </div>
              <div class="field"><label for="file">File</label><input id="file" name="file" type="file"></div>
            </div>
            <div class="row-actions" style="margin-top:12px"><button class="btn-in" type="submit">Invia ad admin</button></div>
          </form>
        </div>`.s;
      el.querySelector("#f-opp").addEventListener("submit", (e) => {
        e.preventDefault();
        toast("In verifica da Nando");
      });
    }
  };

  V.credit = {
    title: "Credit",
    sub: "Finanziamento o liquidità. Anche per i privati. Chat verso banca o broker.",
    render(el) {
      el.innerHTML = html`
        <div class="card">
          <form id="f-cr">
            <div class="fields">
              <div class="field"><label for="tipo">Tipo</label>
                <select id="tipo" name="tipo"><option>Liquidità</option><option>Finanziamento</option><option>Mutuo</option></select>
              </div>
              <div class="field"><label for="imp">Importo</label><input id="imp" name="imp" type="number" value="50000"></div>
            </div>
            <div class="row-actions" style="margin-top:12px"><button class="btn-in" type="submit">Apri chat Credit</button></div>
          </form>
        </div>`.s;
      el.querySelector("#f-cr").addEventListener("submit", (e) => {
        e.preventDefault();
        location.hash = "#/" + S.data.famiglia + "/chat";
        toast("Filo aperto con banca o broker");
      });
    }
  };

  V.aste = {
    title: "Aste immobiliari",
    sub: "Ricerca e contatto. La richiesta arriva ad admin, poi admin chiama.",
    render(el) {
      el.innerHTML = html`
        <div class="card">
          <p class="note"><a href="#/${S.data.famiglia}/opportunita">Torna alle scelte</a>.</p>
          <form id="f-as">
            <div class="fields">
              <div class="field"><label for="citta">Città</label><input id="citta" name="citta" value="Milano"></div>
              <div class="field"><label for="tipo">Tipo</label><input id="tipo" name="tipo" value="Abitazione in asta"></div>
              <div class="field full"><label for="msg">Messaggio</label><textarea id="msg" name="msg" rows="3">Vorrei essere richiamato.</textarea></div>
            </div>
            <div class="row-actions" style="margin-top:12px"><button class="btn-in" type="submit">Invia ad admin</button></div>
          </form>
        </div>`.s;
      el.querySelector("#f-as").addEventListener("submit", (e) => {
        e.preventDefault();
        toast("Richiesta in amministrazione. Admin contatta chi ha chiesto.");
      });
    }
  };

  V.sicurezza = {
    title: "Sicurezza",
    sub: "Uffici, sedi e cantieri. Gestire, far gestire, o vedere con contratto Sicura AncheCasa.",
    render(el) {
      const luoghi = {
        uffici: {
          lab: "Uffici",
          note: "Uffici. DVR, formazione, antincendio, visite mediche.",
          rows: [
            ["DVR uffici", "wait", "in scadenza"],
            ["Formazione antincendio", "ok", "ok"],
            ["Visite mediche", "ok", "ok"]
          ]
        },
        sedi: {
          lab: "Sedi",
          note: "Sedi operative e unità locali. RSPP, impianti, scadenze della sede.",
          rows: [
            ["DVR sede Bergamo", "ok", "ok"],
            ["RSPP", "ok", "ok"],
            ["Impianto elettrico", "wait", "in scadenza"]
          ]
        },
        cantieri: {
          lab: "Cantieri",
          note: "Cantieri. POS, PSC, CSE, verbali, app di campo.",
          rows: [
            ["POS", "wait", "in scadenza"],
            ["Verbale sopralluogo", "ok", "ok"],
            ["Notifica preliminare", "ok", "ok"]
          ]
        }
      };
      let luogo = "uffici";
      let modo = "gest";
      const paint = () => {
        const L = luoghi[luogo];
        const rows = L.rows.map(
          (r) => html`<tr><td>${r[0]}</td><td><span class="tag ${r[1]}">${r[2]}</span></td></tr>`
        );
        el.innerHTML = html`
          <div class="tabs">
            <button type="button" class="tab ${luogo === "uffici" ? "on" : ""}" data-luogo="uffici" aria-selected="${luogo === "uffici" ? "true" : "false"}">Uffici</button>
            <button type="button" class="tab ${luogo === "sedi" ? "on" : ""}" data-luogo="sedi" aria-selected="${luogo === "sedi" ? "true" : "false"}">Sedi</button>
            <button type="button" class="tab ${luogo === "cantieri" ? "on" : ""}" data-luogo="cantieri" aria-selected="${luogo === "cantieri" ? "true" : "false"}">Cantieri</button>
          </div>
          <div class="tabs">
            <button type="button" class="tab ${modo === "gest" ? "on" : ""}" data-modo="gest" aria-selected="${modo === "gest" ? "true" : "false"}">Gestisco io</button>
            <button type="button" class="tab ${modo === "cerco" ? "on" : ""}" data-modo="cerco" aria-selected="${modo === "cerco" ? "true" : "false"}">Cerco chi se ne occupa</button>
            <button type="button" class="tab ${modo === "vedo" ? "on" : ""}" data-modo="vedo" aria-selected="${modo === "vedo" ? "true" : "false"}">Contratto Sicura</button>
          </div>
          ${modo === "gest" ? html`<div class="card">
            <h2>${L.lab} · gestione propria</h2>
            <p class="note">${L.note} Scadenziario, HSE, app mobile di campo. Modulo da agganciare.</p>
            <table class="mini-table"><tbody>${rows}</tbody></table>
          </div>` : ""}
          ${modo === "cerco" ? html`<div class="card">
            <h2>${L.lab} · trovare chi se ne occupa</h2>
            <p class="note">Si pubblica la necessità per ${L.lab.toLowerCase()}. Il professionista verificato risponde in chat.</p>
            <a class="btn-in" href="#/${S.data.famiglia}/pubblica">Pubblica necessità sicurezza</a>
          </div>` : ""}
          ${modo === "vedo" ? html`<div class="card">
            <h2>${L.lab} · contratto Sicura AncheCasa</h2>
            <p class="note">L’azienda vede documenti e scadenze di ${L.lab.toLowerCase()}. Non gestisce. Gestisce Sicura.</p>
            <table class="mini-table"><tbody>${rows}</tbody></table>
          </div>` : ""}`.s;
      };
      el.addEventListener("click", (e) => {
        const lu = e.target.closest("[data-luogo]");
        const mo = e.target.closest("[data-modo]");
        if (lu && el.contains(lu)) {
          luogo = lu.getAttribute("data-luogo");
          paint();
        }
        if (mo && el.contains(mo)) {
          modo = mo.getAttribute("data-modo");
          paint();
        }
      });
      paint();
    }
  };

  V.analizza = {
    title: "Analizza gare",
    sub: "Si legge il bando, si estrae il fabbisogno, poi si pubblica ciò che manca.",
    render(el) {
      el.innerHTML = html`
        <div class="card">
          <h2>Analisi fabbisogno</h2>
          <p class="note">Modulo da agganciare. Personale, mezzi, materiali, subappalti.</p>
          <table class="mini-table">
            <thead><tr><th>Voce</th><th>Stato</th></tr></thead>
            <tbody>
              <tr><td>Lettura bando</td><td><span class="tag wait">da agganciare</span></td></tr>
              <tr><td>Elenco fabbisogni</td><td><span class="tag wait">da agganciare</span></td></tr>
              <tr><td>Collegamento a Predict e BIM 5D</td><td><span class="tag wait">da agganciare</span></td></tr>
            </tbody>
          </table>
          <div class="row-actions">
            <button type="button" class="btn-ghost" id="analizza">Analizza fabbisogno</button>
            <a class="btn-in" href="#/${S.data.famiglia}/pubblica">Pubblica la necessità</a>
          </div>
          <p class="note" id="esito" hidden>Analisi: personale, mezzi, materiali. Si può pubblicare.</p>
        </div>`.s;
      el.querySelector("#analizza").addEventListener("click", () => {
        el.querySelector("#esito").hidden = false;
        toast("Analisi pronta. Poi pubblica.");
      });
    }
  };

  V.partecipa = {
    title: "Partecipa a gare",
    sub: "Elenco, offerte, archivio. Una risposta economica si aggancia al modulo contabile.",
    render(el) {
      el.innerHTML = html`
        <div class="card">
          <h2>Elenco gare</h2>
          <table class="mini-table">
            <thead><tr><th>Gara</th><th>Stato</th></tr></thead>
            <tbody>${S.data.gare.map((g) => html`<tr><td>${g.nome}</td><td><span class="tag ${g.stato === "aperta" ? "new" : "closed"}">${g.stato}</span></td></tr>`)}</tbody>
          </table>
          <p class="note">Modulo da agganciare. Offerta, documenti, scadenze, esito.</p>
        </div>`.s;
    }
  };

  V.predict = {
    title: "Predict",
    sub: "Lettura e previsione sulla gara. Famiglia Gare e BIM. Modulo da agganciare.",
    render(el) {
      el.innerHTML = html`
        <div class="card">
          <p class="note">Previsione su costi, tempi, rischi. Poi si archivia e si può pubblicare la necessità.</p>
          <table class="mini-table">
            <tbody>
              <tr><td>Scenari</td><td><span class="tag wait">da agganciare</span></td></tr>
              <tr><td>Scostamenti</td><td><span class="tag wait">da agganciare</span></td></tr>
            </tbody>
          </table>
          <a class="btn-in" href="#/${S.data.famiglia}/analizza">Apri analisi gare</a>
        </div>`.s;
    }
  };

  V.bim = {
    title: "BIM 5D",
    sub: "Modello, costi, commessa. Poi si pubblica ciò che manca. Modulo da agganciare.",
    render(el) {
      el.innerHTML = html`
        <div class="card">
          <p class="note">Dal modello si capisce il fabbisogno. Poi Pubblica.</p>
          <table class="mini-table">
            <tbody>
              <tr><td>Modello 5D</td><td><span class="tag wait">da agganciare</span></td></tr>
              <tr><td>Computo e costi</td><td><span class="tag wait">da agganciare</span></td></tr>
            </tbody>
          </table>
          <a class="btn-in" href="#/${S.data.famiglia}/pubblica">Pubblica dal modello</a>
        </div>`.s;
    }
  };

  function packPage(title, sub, note, rows) {
    const voci = rows || ["Scheda", "Elenco", "Collegamento al modulo"];
    return {
      title: title,
      sub: sub,
      render(el) {
        el.innerHTML = html`
          <div class="card">
            <p class="note">${note}</p>
            <table class="mini-table">
              <thead><tr><th>Voce</th><th>Stato</th></tr></thead>
              <tbody>${voci.map((r) => html`<tr><td>${r}</td><td><span class="tag wait">da agganciare</span></td></tr>`)}</tbody>
            </table>
            <div class="row-actions">
              <a class="btn-in" href="#/${S.data.famiglia}/pubblica">Pubblica una necessità</a>
        </div>
          </div>`.s;
      }
    };
  }

  V.amministrazione = packPage(
    "Amministrazione",
    "Software di ufficio. Unico da agganciare. Si può vendere a parte.",
    "Prima nota, contratti, commesse. Poi si pubblica ciò che manca in piazza.",
    ["Prima nota", "Contratti", "Unico da agganciare"]
  );
  V.recruitment = packPage(
    "Recruitment",
    "Software di ufficio. InJobs da agganciare. Si può vendere a parte.",
    "Si pubblica il posto scoperto. Il match è mestiere e zona.",
    ["Anagrafe personale", "Selezione", "InJobs da agganciare"]
  );
  V.acquisti = packPage(
    "Acquisti",
    "Software di ufficio. Ordini e scorte. Si può vendere a parte.",
    "Si ordina. Se manca un materiale o un mezzo, si pubblica.",
    ["Ordini", "Richieste", "Arrivi"]
  );
  V.vault = packPage(
    "Documenti",
    "Software di ufficio. Vault da agganciare. Si può vendere a parte.",
    "Fascicolo aziendale. I file di chat e gara restano sulla pratica.",
    ["Contratti", "Certificati", "Conservazione"]
  );
  V.cantiere = packPage(
    "Gestione cantiere",
    "Cabina di regia del cantiere. Modulo da agganciare.",
    "Presenze, rapportini, giornali, SAL, cronoprogramma. Da qui si entra in ogni voce.",
    ["Anagrafe cantieri", "Stato commessa", "Collegamento a SAL e giornale"]
  );
  V.presenze = packPage(
    "Presenze",
    "Chi è in cantiere. Badge, ore, squadre. Modulo da agganciare.",
    "Si vede chi c’è. Se manca una figura, si pubblica.",
    ["Badge e ore", "Squadre", "Straordinari"]
  );
  V.rapportini = packPage(
    "Rapportini",
    "Lavoro fatto, firma, foto. Modulo da agganciare.",
    "Il rapportino chiude la giornata. Poi può diventare SAL.",
    ["Rapportini aperti", "Firme", "Foto e allegati"]
  );
  V.giornali = packPage(
    "Giornali di cantiere",
    "Diario ufficiale della giornata. Modulo da agganciare.",
    "Meteo, squadre, mezzi, fatti. Resta in archivio di commessa.",
    ["Giornale odierno", "Archivio", "Allegati"]
  );
  V.sal = packPage(
    "SAL",
    "Stato avanzamento lavori. Modulo da agganciare.",
    "Avanzamento, misura, certificato. Si aggancia al modulo contabile.",
    ["SAL in bozza", "SAL emessi", "Collegamento amministrazione"]
  );
  V.cronoprogramma = packPage(
    "Cronoprogramma",
    "Tempi, fasi, scostamenti. Modulo da agganciare.",
    "Dal Gantt si vede il ritardo. Poi si pubblica chi o cosa serve.",
    ["Fasi", "Scostamenti", "Collegamento a Predict"]
  );
  V.magazzino = packPage(
    "Magazzino",
    "Scorte, materiali, movimenti. Modulo da agganciare.",
    "Scorte, materiali, movimenti. Poi si pubblica ciò che manca.",
    ["Scorte", "Movimenti", "Sottoscorta"]
  );
  V.mezzi = packPage(
    "Mezzi",
    "Flotta, noleggio, disponibilità. Modulo da agganciare.",
    "Si pubblica un mezzo o se ne cerca uno.",
    ["Flotta", "Noleggi", "Manutenzione mezzi"]
  );
  V.app = {
    title: "App di campo",
    sub: "Tracking, recensione del cliente, rating dell’installatore. Modulo da agganciare.",
    render(el) {
      el.innerHTML = html`
        <div class="card">
          <table class="mini-table">
            <tbody>
              <tr><td>Montaggio</td><td>in corso</td><td>tracking</td></tr>
              <tr><td>Imbiancatura</td><td>chiuso</td><td>rating 4.8</td></tr>
            </tbody>
          </table>
          <p class="note">Il cliente recensione. L’azienda vede il rating del proprio installatore.</p>
        </div>`.s;
    }
  };
  // Macro-area Edilizia (01.10.2026): pagine segnaposto dei pulsanti nuovi, da agganciare ai moduli.
  V.subappalti = packPage(
    "Subappalti",
    "Offerte date e ricevute sui subappalti. Modulo da agganciare.",
    "Il GC chiede offerte ai subappaltatori e confronta. Se manca una ditta, si pubblica.",
    ["Richieste inviate", "Offerte ricevute", "Affidati"]
  );
  V.squadre = packPage(
    "Squadre",
    "Squadre e maestranze per commessa. Modulo da agganciare.",
    "Chi lavora dove. Se manca una figura, si pubblica.",
    ["Squadre attive", "Maestranze", "Assegnazioni"]
  );
  V.offerte = packPage(
    "Offerte ai GC",
    "Offerte del subappaltatore alle imprese generali. Modulo da agganciare.",
    "Dalla gara o dalla richiesta del GC nasce l’offerta. Qui si segue fino all’affidamento.",
    ["Da inviare", "Inviate", "Affidate"]
  );
  V.qualificazioni = packPage(
    "Qualificazioni",
    "DURC, SOA, corsi e attestati. Modulo da agganciare.",
    "Scadenze e documenti che il GC chiede prima di affidare. Si collega a Sicurezza e Documenti.",
    ["DURC", "SOA e albi", "Corsi e attestati"]
  );
  V.interventi = packPage(
    "Interventi",
    "Chiamate e lavori degli impiantisti. Modulo da agganciare.",
    "Dalla richiesta al rapportino. Se serve una mano, si pubblica.",
    ["Da fare", "In corso", "Chiusi"]
  );
  V.manutprog = packPage(
    "Manutenzioni programmate",
    "Contratti e scadenze di manutenzione. Modulo da agganciare.",
    "Caldaie, impianti, controlli periodici: ogni scadenza diventa un intervento.",
    ["In scadenza", "Programmate", "Eseguite"]
  );
  V.dico = packPage(
    "Certificazioni / DiCo",
    "Dichiarazioni di conformità e certificati. Modulo da agganciare.",
    "A fine lavoro si emette la dichiarazione. Resta nel fascicolo del cliente.",
    ["Da emettere", "Emesse", "Archivio"]
  );
  V.personale = packPage("Personale", "Produzione. Cantiere e ufficio. Modulo da agganciare.", "Si cerca personale pubblicando. Il match è mestiere e zona.", ["Organico", "Turni", "Cerca in piazza"]);
  V.tracking = packPage("Tracking", "Spedizioni e stato. Modulo da agganciare.", "Il cliente vede il percorso in app.", ["Spedizioni attive", "Storico", "Avvisi"]);
  V.spedizioni = packPage("Spedizioni", "Partenze, arrivi, bolle. Modulo da agganciare.", "Se manca un viaggio o un mezzo, si pubblica.", ["Da partire", "In viaggio", "Consegnate"]);
  V.produzione = packPage("Produzione", "Cicli, lotti, avanzamento. Modulo da agganciare.", "Dalla linea si vede cosa manca. Poi Pubblica.", ["Lotti", "Fermate", "Fabbisogno"]);
  V.struttura = packPage("Struttura", "Alberghi e ristorazione. Modulo da agganciare.", "Camere, spazi, manutenzione. Si pubblica chi serve allo stabile.", ["Piani", "Impianti", "Manutenzione"]);
  V.camere = packPage("Camere e sale", "Occupazione e pronto. Modulo da agganciare.", "Camera o sala non pronta. Si pubblica chi interviene.", ["Occupazione", "Fuori servizio", "Pulizie"]);
  V.turni = packPage("Turni", "Personale di sala, piano, cantiere. Modulo da agganciare.", "Si pubblica un turno scoperto.", ["Settimana", "Coperture", "Straordinari"]);
  V.fornitori = packPage("Fornitori", "Software di ufficio. Rubrica. Si può vendere a parte.", "Per un preventivo si invita da Pubblica, solo la prima volta. Chi è nuovo vede la scheda anonima.", ["Rubrica", "Inviti", "Valutazioni"]);
  V.vetrina = packPage("Vetrina", "Il mestiere si mostra. Modulo da agganciare.", "Poi pubblica montatore, pittore, chi gli serve.", ["Scheda pubblica", "Lavori fatti", "Zone"]);
  V.pratiche = packPage("Pratiche", "Studio tecnico. CSE, RSPP, geometra. Modulo da agganciare.", "Pratica aperta. Si pubblica un incarico o si risponde a uno.", ["Aperte", "In scadenza", "Chiuse"]);
  V.anagrafe = packPage("Anagrafe", "Unità, proprietari, millesimi. Modulo da agganciare.", "Il condominio è un’azienda di questo mestiere.", ["Unità", "Tabelle", "Contatti"]);
  V.assemblee = packPage("Assemblee", "Convocazioni e verbali. Modulo da agganciare.", "Dopo l’assemblea si pubblicano i lavori deliberati.", ["Prossime", "Verbali", "Delibere"]);
  V.manutenzioni = packPage("Manutenzioni", "Ordinaria e straordinaria. Modulo da agganciare.", "Si pubblica l’intervento. L’impresa risponde in chat.", ["Aperte", "Programmate", "Chiuse"]);
  V.contabilita = packPage("Contabilità", "Quote, fornitori, bilancio. Modulo da agganciare.", "Poi si pubblica un preventivo o un lavoro.", ["Quote", "Fatture", "Riparti"]);
  V.archivio = packPage("Documenti stabile", "Archivio dello stabile. Modulo da agganciare.", "Contratti, certificati, verbali del condominio.", ["Contratti", "Certificati", "Polizze"]);
  V.immobili = packPage("Immobili", "Portafoglio agenzia. Modulo da agganciare.", "Da qui si pubblica vendita o affitto.", ["In vetrina", "In trattativa", "Chiusi"]);
  V.mandati = packPage("Mandati", "Incarichi e scadenze. Modulo da agganciare.", "Mandato in scadenza. Si rinnova o si pubblica.", ["Attivi", "In scadenza", "Chiusi"]);
  V.clienti = packPage("Clienti", "Software di ufficio. Anagrafe. Si può vendere a parte.", "La richiesta può diventare preventivo, ordine o annuncio in piazza.", ["Attivi", "Nuovi", "Inattivi"]);
  V.visite = packPage("Visite", "Agenda sopralluoghi. Modulo da agganciare.", "Si pubblica chi accompagna o chi valuta.", ["Oggi", "Settimana", "Storico"]);
  V.preventivi = packPage("Preventivi", "Software di ufficio. Offerte. Si può vendere a parte.", "Si invia in chat. Accettato diventa commessa o ordine.", ["Bozze", "Inviati", "Accettati"]);
  V.fatture = packPage("Fatture", "Software di ufficio. Ciclo attivo. Si può vendere a parte.", "Si agganciano a commessa, SAL, ordine o noleggio.", ["Da emettere", "Emesse", "Scadute"]);
  V.listino = packPage("Listino", "Prezzi di vendita. Ferro, cemento, ponteggi, finiture. Modulo da agganciare.", "Dal listino si risponde a un cerco in piazza.", ["Materiali", "Prezzi", "Sottoscorta"]);
  V.ordini = packPage("Ordini", "Ordini in entrata dalle ditte. Modulo da agganciare.", "L’ordine si aggancia alla commessa di chi ha pubblicato.", ["Nuovi", "In preparazione", "Evasi"]);
  V.consegne = packPage("Consegne", "Bolle e arrivi in cantiere. Modulo da agganciare.", "Se manca un viaggio si pubblica o si usa la flotta.", ["Oggi", "Settimana", "Storico"]);
  V.flotta = packPage("Flotta", "Gru, camion, piattaforme, ponteggi. Modulo da agganciare.", "Si pubblica un mezzo libero o se ne cerca uno.", ["Disponibili", "In cantiere", "Fermi"]);
  V.calendario = packPage("Calendario disponibilità", "Quando il mezzo è libero. Modulo da agganciare.", "Dal calendario nasce il contratto di noleggio.", ["Settimana", "Mese", "Conflitti"]);
  V.noleggi = packPage("Contratti di noleggio", "Canone, reso, danni. Modulo da agganciare.", "Il contratto è la commessa del noleggiatore.", ["Attivi", "In scadenza", "Chiusi"]);
  V.manumezzi = packPage("Manutenzione mezzi", "Tagliandi e fermi macchina. Modulo da agganciare.", "Mezzo fermo. Si pubblica chi lo ripara, o si toglie dal calendario.", ["In corso", "Programmate", "Storico"]);

  V.catena = {
    title: "Catena",
    sub: "Chi hai portato. Il guadagno segue questa linea.",
    render(el) {
      el.innerHTML = html`
        <div class="card">
          <table class="mini-table">
            <thead><tr><th>Tipo</th><th>Nome</th><th>Portati</th></tr></thead>
            <tbody>${S.data.catena.map((c) => html`<tr><td>${c.tipo}</td><td>${c.nome}</td><td class="num">${c.n}</td></tr>`)}</tbody>
          </table>
        </div>`.s;
    }
  };

  V.guadagno = {
    title: "Guadagno",
    sub: "Solo l’agente guadagna sugli inviti. Si distribuisce sulla catena.",
    render(el) {
      const g = S.data.guadagno;
      el.innerHTML = html`
        <div class="kpis">
          <div class="kpi"><span class="ico orange">${icon("wallet", 18)}</span><span><strong>${AC.ui.fmt.euro(g.mese)}</strong><small>questo mese</small></span></div>
          <div class="kpi"><span class="ico navy">${icon("team", 18)}</span><span><strong>${AC.ui.fmt.euro(g.sub)}</strong><small>ai subagenti</small></span></div>
        </div>`.s;
    }
  };

  /* Inviti di tutti (29.09.2026, su richiesta esplicita): Privato, Azienda e Agente generano link
     d'invito veri, salvati in marketplace.inviti_admin con creato_da = chi li produce (default
     auth.uid() lato database). Chi si iscrive da uno di questi link entra subito verificato,
     l'admin non li approva (regola nel trigger, schema.sql sezione 17). La catena/guadagno
     dell'Agente NON è considerata qui: si vede dopo. Parla direttamente con Supabase (acDb). */
  V.inviti = {
    title: "Inviti",
    sub: "Invita privati, aziende e agenti. Ogni link è tuo e resta tracciato.",
    render(el) {
      const CHI = { privato: "Privato", azienda: "Azienda", agente: "Agente" };
      let righe = [];

      function disegna(esito) {
        el.innerHTML = html`
          <div class="card">
            <p class="note">Scegli chi inviti e inserisci almeno la mail o il telefono. Chi si iscrive dal tuo link entra subito, senza attendere l'approvazione. Con Email il messaggio parte da AncheCasa; con WhatsApp si apre la chat con il testo già scritto.</p>
            <form id="f-inv">
              <div class="fields tre">
                <div class="field"><label for="inv-chi">Chi inviti</label>
                  <select id="inv-chi" name="chi">${Object.keys(CHI).map((k) => html`<option value="${k}">${CHI[k]}</option>`)}</select>
                </div>
                <div class="field"><label for="inv-mail">Mail</label><input id="inv-mail" name="mail" type="email"></div>
                <div class="field"><label for="inv-tel">Telefono (WhatsApp)</label><input id="inv-tel" name="telefono" type="tel" placeholder="es. 333 1234567" autocomplete="off"></div>
              </div>
              <div class="row-actions" style="margin-top:12px"><button class="btn-in" type="submit">Genera link</button></div>
            </form>
            ${esito
              ? html`<div class="row-actions" style="margin-top:16px;align-items:center;">
                  <input type="text" readonly value="${esito.url}" style="flex:1;min-width:220px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;">
                  <span id="tasti-esito" style="display:flex;gap:6px;flex-wrap:wrap;">${tastiInvito(esito)}</span>
                </div>`
              : ""}
          </div>
          <div class="card" id="tabella-inviti" style="margin-top:12px;"><p class="note">Caricamento inviti…</p></div>`.s;

        el.querySelector("#f-inv").addEventListener("submit", (e) => {
          e.preventDefault();
          const form = e.target;
          const famiglia = form.elements.chi.value;
          const mail = form.elements.mail.value.trim();
          const telefono = form.elements.telefono.value.trim();
          if (!CHI[famiglia]) return;
          if (!mail && !telefono) {
            toast("Inserisci almeno la mail o il telefono.", "error");
            return;
          }
          if (mail && !form.elements.mail.checkValidity()) {
            toast("La mail non sembra valida.", "error");
            return;
          }
          if (telefono && numeroWhatsApp(telefono).length < 8) {
            toast("Il telefono non sembra valido.", "error");
            return;
          }
          window.acDb.from("inviti_admin")
            .insert({ famiglia: famiglia, categoria: CHI[famiglia], mail: mail || null, telefono: telefono || null })
            .select("token")
            .single()
            .then((res) => {
              if (res.error) {
                toast("Non riesco a salvare l'invito: " + res.error.message, "error");
                return;
              }
              disegna({ url: linkInvito(res.data.token, famiglia), mail: mail, telefono: telefono, token: res.data.token, famiglia: famiglia });
              carica();
            });
        });

        const tasti = el.querySelector("#tasti-esito");
        if (tasti && esito) {
          tasti.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-azione]");
            if (btn) condividiInvito(btn.getAttribute("data-azione"), esito, carica);
          });
        }
      }

      function carica() {
        conTimeoutAdmin(
          window.acDb.from("inviti_admin")
            .select("token, mail, telefono, famiglia, categoria, stato, created_at, inviato_at")
            .order("created_at", { ascending: false })
            .limit(50),
          25000
        ).then((res) => {
          if (!el.isConnected) return;
          const mount = el.querySelector("#tabella-inviti");
          if (!mount) return;
          if (res.error) {
            mount.innerHTML = html`<p class="note">Non riesco a leggere i tuoi inviti (${res.error.message}).</p>`.s;
            return;
          }
          righe = res.data || [];
          mount.innerHTML = !righe.length
            ? html`<p class="note">Non hai ancora creato inviti.</p>`.s
            : html`<table class="mini-table">
                <thead><tr><th>Contatto</th><th>Chi</th><th>Stato</th><th>Creato il</th><th>Link</th></tr></thead>
                <tbody>
                  ${righe.map(
                    (r, i) => html`<tr>
                      <td>${r.mail || ""}${r.mail && r.telefono ? html`<br>` : ""}${r.telefono || ""}</td>
                      <td>${CHI[r.famiglia] || r.famiglia}</td>
                      <td>${TAG_STATO_INVITO[r.stato] ? html`<span class="tag ${TAG_STATO_INVITO[r.stato][0]}">${TAG_STATO_INVITO[r.stato][1]}</span>` : r.stato}${r.inviato_at ? html`<br><small>Mail inviata il ${dataAdmin(r.inviato_at)}</small>` : ""}</td>
                      <td>${dataAdmin(r.created_at)}</td>
                      <td><span data-riga="${i}" style="display:flex;gap:6px;flex-wrap:wrap;">${tastiInvito(r)}</span></td>
                    </tr>`
                  )}
                </tbody>
              </table>`.s;
          // onclick (non addEventListener): la tabella si ricarica dopo ogni invio.
          mount.onclick = (e) => {
            const btn = e.target.closest("[data-azione]");
            const riga = btn && btn.closest("[data-riga]");
            if (!riga) return;
            const r = righe[Number(riga.getAttribute("data-riga"))];
            if (r) condividiInvito(btn.getAttribute("data-azione"), { mail: r.mail, telefono: r.telefono, token: r.token, url: linkInvito(r.token, r.famiglia), famiglia: r.famiglia }, carica);
          };
        });
      }

      disegna(null);
      carica();
    }
  };

  const RUOLO_LAB = {
    titolare: "Titolare",
    responsabile: "Responsabile",
    operatore: "Operatore",
    segreteria: "Segreteria",
    nucleo: "Nucleo"
  };
  const STATO_TAG = { attivo: "ok", attesa: "wait", sospeso: "paused" };

  function foldLab(id) {
    return (AC.FOLD_LAB && AC.FOLD_LAB[id]) || id;
  }
  function foldList() {
    const p = S.data.profilo;
    return AC.foldsOfTipo ? AC.foldsOfTipo(p.tipoAzienda, p.fornitoreModo) : ["ufficio"];
  }
  function packTastiDel(fold) {
    const p = S.data.profilo;
    const items = AC.packItems ? AC.packItems(p.tipoAzienda, p.fornitoreModo) : [];
    return items.filter((it) => it.fold === fold).map((it) => it.label);
  }

  let impTab = "";
  let impFam = "";

  function paneOf(id, folds, me) {
    let out = "";
    if (id === "utenti") out = paneUtenti(folds);
    else if (id === "reparti") out = paneReparti(folds);
    else if (id === "permessi") out = panePermessi(folds);
    else if (id === "nucleo") out = paneNucleo();
    else if (id === "collab") out = paneCollab();
    else if (id === "pagamenti") out = panePagamenti();
    else if (id === "account") out = paneAccount(me);
    else if (id === "notifiche") out = paneNotifiche();
    else if (id === "dati") out = paneDati();
    else if (id === "famiglia") {
      out = html`<div class="card prefs">
        <p class="note">Vista attuale: ${S.data.famiglia}. Per cambiare famiglia si esce e si sceglie di nuovo.</p>
        <div class="row-actions"><a class="btn-ghost" href="#/">Cambia famiglia</a></div>
      </div>`.s;
    }
    return raw(out);
  }

  /* CONGELATO 20.09.2026. Tasto Impostazioni. Utenti e reparti per profilo. Regola A: titolare vede tutto il pack, operatore solo reparti assegnati e accesi. Nucleo sul privato. Collaboratori e pagamenti sull’agente. Non cambiare queste regole senza richiesta esplicita. */
  V.impostazioni = {
    title: "Impostazioni",
    get sub() {
      const f = S.data.famiglia;
      if (f === "azienda") return "Utenti, reparti e permessi. Il titolare vede tutto il pack.";
      if (f === "agente") return "Collaboratori e pagamenti del guadagno.";
      return "Account e nucleo di casa.";
    },
    render(el) {
      const fam = S.data.famiglia;
      const me = S.utenteCorrente();
      const titolare = S.isTitolare();
      const folds = fam === "azienda" ? foldList() : [];
      const tabs = [];
      if (fam === "azienda") {
        if (titolare) {
          tabs.push(["utenti", "Utenti"], ["reparti", "Reparti"], ["permessi", "Permessi"]);
        }
      } else if (fam === "privato") {
        tabs.push(["nucleo", "Nucleo"]);
      } else if (fam === "agente") {
        if (titolare) tabs.push(["collab", "Collaboratori"], ["pagamenti", "Pagamenti"]);
      }
      tabs.push(["account", "Account"], ["notifiche", "Notifiche"], ["dati", "Dati"], ["famiglia", "Famiglia"]);
      if (impFam !== fam) {
        impFam = fam;
        impTab = tabs[0][0];
      } else if (!tabs.some((t) => t[0] === impTab)) impTab = tabs[0][0];

      el.innerHTML = html`
        <div class="tabs">
          ${tabs.map((t) => html`<button type="button" class="tab ${impTab === t[0] ? "on" : ""}" data-tab="${t[0]}" aria-selected="${impTab === t[0] ? "true" : "false"}">${t[1]}</button>`)}
        </div>
        ${tabs.map((t) => html`<div data-pane="${t[0]}" ${impTab === t[0] ? "" : "hidden"}>${paneOf(t[0], folds, me)}</div>`)}`.s;

      bindTabs(el);
      el.addEventListener("click", (e) => {
        const tab = e.target.closest("[data-tab]");
        if (tab && el.contains(tab)) impTab = tab.getAttribute("data-tab");
      });
      bindImpostazioni(el, folds, me, titolare);
    }
  };

  function paneUtenti(folds) {
    const rows = (S.data.org.utenti || []).map((u) => html`<tr>
      <td>${u.nome}</td>
      <td>${u.mail || "—"}</td>
      <td><span class="tag ${(u.ruolo === "titolare" ? "closed" : "paused")}">${RUOLO_LAB[u.ruolo] || u.ruolo}</span></td>
      <td><span class="tag ${STATO_TAG[u.stato] || "paused"}">${u.stato}</span></td>
      <td>${(u.reparti || []).map((f) => foldLab(f)).join(", ") || "—"}</td>
      <td>${u.ruolo === "titolare" ? "" : html`<button type="button" class="btn-mini" data-del-user="${u.id}">Togli</button>`}</td>
    </tr>`);
    const checks = folds.map((f) => html`<label><input type="checkbox" name="reparto" value="${f}"> ${foldLab(f)}</label>`);
    return html`
      <div class="card">
        <h2>Chi entra nel software</h2>
        <p class="note">Non è l’organico di cantiere. Recruitment e Presenze restano nei tasti di mestiere. Il titolare vede sempre tutto il pack. L’operatore vede solo i reparti assegnati e accesi.</p>
        <div class="perm-grid">
        <table class="mini-table">
          <thead><tr><th>Nome</th><th>Mail</th><th>Ruolo</th><th>Stato</th><th>Reparti</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        </div>
      </div>
      <div class="card">
        <h2>Invita utente</h2>
        <form id="f-user" class="prefs wide">
          <label>Nome<input name="nome" required></label>
          <label>Mail<input name="mail" type="email" required></label>
          <label>Ruolo
            <select name="ruolo">
              <option value="operatore">Operatore</option>
              <option value="responsabile">Responsabile</option>
            </select>
          </label>
          <div class="checks">${checks}</div>
          <div class="row-actions"><button class="btn-in" type="submit">Invita</button></div>
        </form>
      </div>`.s;
  }

  function paneReparti(folds) {
    const on = (S.data.org && S.data.org.reparti) || {};
    const rows = folds.map((f) => {
      const tasti = packTastiDel(f);
      const accesa = on[f] !== false;
      return html`<div class="switch-row">
        <div class="switch-head">
          <strong>${foldLab(f)}</strong>
          <label class="switch">
            <input type="checkbox" data-fold="${f}" ${accesa ? "checked" : ""}>
            <span>${accesa ? "In uso" : "Spento"}</span>
          </label>
        </div>
        <small>${tasti.length ? tasti.join(" · ") : "Nessun tasto in questa piega."} ${f === "ufficio" ? "Comune a ogni azienda." : ""}</small>
      </div>`;
    });
    return html`
      <div class="card">
        <h2>Reparti del mestiere</h2>
        <p class="note">Uno per ogni piega già prevista dal tipo. Spento: sparisce per gli operatori, non per il titolare. Il catalogo dei tasti non si tocca.</p>
        <div class="switch-list">${rows}</div>
      </div>`.s;
  }

  function panePermessi(folds) {
    const utenti = S.data.org.utenti || [];
    const head = html`<tr><th>Utente</th>${folds.map((f) => html`<th>${foldLab(f)}</th>`)}</tr>`;
    const body = utenti.map((u) => {
      const tit = u.ruolo === "titolare";
      const cells = folds.map((f) => {
        const ok = tit || (u.reparti || []).indexOf(f) >= 0;
        return html`<td><input type="checkbox" data-perm-user="${u.id}" data-perm-fold="${f}" ${ok ? "checked" : ""}${tit ? " disabled" : ""}></td>`;
      });
      return html`<tr><td>${u.nome}<br><small>${RUOLO_LAB[u.ruolo] || u.ruolo}</small></td>${cells}</tr>`;
    });
    return html`
      <div class="card">
        <h2>Permessi</h2>
        <p class="note">Una spunta è un reparto. Il titolare ha tutte le pieghe, sempre. L’operatore entra solo dove è spuntato, e solo se il reparto è in uso.</p>
        <div class="perm-grid">
          <table class="mini-table">
            <thead>${head}</thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      </div>`.s;
  }

  function paneNucleo() {
    const rows = (S.data.nucleo || []).map((n) => html`<tr>
      <td>${n.nome}</td>
      <td>${n.vincolo || RUOLO_LAB[n.ruolo] || n.ruolo}</td>
      <td>${n.ruolo === "titolare" ? "" : html`<button type="button" class="btn-mini" data-del-nucleo="${n.id}">Togli</button>`}</td>
    </tr>`);
    return html`
      <div class="card">
        <h2>Nucleo di casa</h2>
        <p class="note">Persone sullo stesso account. Niente reparti. Pubblica e Chat restano per tutti.</p>
        <div class="perm-grid">
        <table class="mini-table">
          <thead><tr><th>Nome</th><th>Vincolo</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        </div>
      </div>
      <div class="card">
        <h2>Aggiungi persona</h2>
        <form id="f-nucleo" class="prefs">
          <label>Nome<input name="nome" required></label>
          <label>Vincolo
            <select name="vincolo">
              <option value="convivente">Convivente</option>
              <option value="familiare">Familiare</option>
              <option value="inquilino">Inquilino</option>
            </select>
          </label>
          <div class="row-actions"><button class="btn-in" type="submit">Aggiungi</button></div>
        </form>
      </div>`.s;
  }

  function paneCollab() {
    const rows = (S.data.collaboratori || []).map((c) => html`<tr>
      <td>${c.nome}</td>
      <td>${c.mail || "—"}</td>
      <td>${RUOLO_LAB[c.ruolo] || c.ruolo}</td>
      <td>${(c.tasti || []).join(", ")}</td>
      <td><button type="button" class="btn-mini" data-del-collab="${c.id}">Togli</button></td>
    </tr>`);
    return html`
      <div class="card">
        <h2>Collaboratori</h2>
        <p class="note">Segreteria o vice. Non vedono Guadagno. Catena resta dell’agente. Inviti si possono lasciare.</p>
        <div class="perm-grid">
        <table class="mini-table">
          <thead><tr><th>Nome</th><th>Mail</th><th>Ruolo</th><th>Tasti</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        </div>
      </div>
      <div class="card">
        <h2>Aggiungi collaboratore</h2>
        <form id="f-collab" class="prefs wide">
          <label>Nome<input name="nome" required></label>
          <label>Mail<input name="mail" type="email" required></label>
          <div class="checks">
            <label><input type="checkbox" name="tasti" value="pubblica" checked> Pubblica</label>
            <label><input type="checkbox" name="tasti" value="chat" checked> Chat</label>
            <label><input type="checkbox" name="tasti" value="inviti" checked> Inviti</label>
          </div>
          <div class="row-actions"><button class="btn-in" type="submit">Aggiungi</button></div>
        </form>
      </div>`.s;
  }

  function panePagamenti() {
    const p = S.data.pagamenti || {};
    return html`
      <div class="card">
        <h2>Pagamenti del guadagno</h2>
        <p class="note">Solo l’agente guadagna. Il collaboratore non vede questa scheda se entra come segreteria.</p>
        <form id="f-pag" class="prefs">
          <label>Intestatario<input name="intestatario" value="${p.intestatario}"></label>
          <label>IBAN<input name="iban" value="${p.iban}"></label>
          <div class="row-actions"><button class="btn-in" type="submit">Salva</button></div>
        </form>
      </div>`.s;
  }

  function paneAccount(me) {
    const a = S.data.account || {};
    const persone = S.persone();
    const opts = persone.map((p) => html`<option value="${p.id}"${p.id === (me && me.id) ? " selected" : ""}>${p.nome} · ${RUOLO_LAB[p.ruolo] || p.ruolo}</option>`);
    return html`
      <div class="card">
        <h2>Account</h2>
        <form id="f-acc" class="prefs">
          <label>Mail<input name="mail" type="email" value="${a.mail}"></label>
          <label>Lingua
            <select name="lingua">
              <option value="it"${a.lingua === "it" ? " selected" : ""}>Italiano</option>
              <option value="en"${a.lingua === "en" ? " selected" : ""}>English</option>
            </select>
          </label>
          <div class="row-actions"><button class="btn-in" type="submit">Salva account</button></div>
        </form>
      </div>
      <div class="card">
        <h2>Entra come</h2>
        <p class="note">Solo in questa prova, per vedere il menu del titolare e quello dell’operatore. Poi l’ingresso è con la mail.</p>
        <form id="f-chi" class="prefs">
          <label>Persona<select name="chi">${opts}</select></label>
          <div class="row-actions"><button class="btn-in" type="submit">Entra</button></div>
        </form>
      </div>`.s;
  }

  function paneNotifiche() {
    const n = S.data.notifiche || {};
    return html`
      <div class="card">
        <h2>Notifiche</h2>
        <form id="f-noti" class="prefs">
          <label class="check-line"><input type="checkbox" name="chat"${n.chat ? " checked" : ""}> Chat e mail AncheCasa</label>
          <label class="check-line"><input type="checkbox" name="annunci"${n.annunci ? " checked" : ""}> Annunci e risposte</label>
          <label class="check-line"><input type="checkbox" name="scadenze"${n.scadenze ? " checked" : ""}> Scadenze di mestiere</label>
          <div class="row-actions"><button class="btn-in" type="submit">Salva notifiche</button></div>
        </form>
      </div>`.s;
  }

  function paneDati() {
    return html`
      <div class="card">
        <h2>Dati in questo browser</h2>
        <p class="note">Nessun server. Export, import o ripristino della prova.</p>
        <div class="row-actions">
          <button type="button" class="btn-ghost" id="btn-export">Esporta JSON</button>
          <label class="btn-ghost file-lab">Importa JSON<input type="file" id="f-import" accept="application/json" hidden></label>
          <button type="button" class="btn-danger" id="btn-reset">Ripristina prova</button>
        </div>
      </div>`.s;
  }

  function bindImpostazioni(el, folds, me, titolare) {
    void me;
    const fUser = el.querySelector("#f-user");
    if (fUser) {
      fUser.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = formVal(e.target);
        if (!v.nome || !v.mail) {
          toast("Nome e mail servono", "error");
          return;
        }
        const rep = Array.from(e.target.querySelectorAll('[name="reparto"]:checked')).map((x) => x.value);
        S.addUtente({ nome: v.nome, mail: v.mail, ruolo: v.ruolo, reparti: rep });
        toast("Utente invitato. In attesa.");
      });
    }
    el.querySelectorAll("[data-del-user]").forEach((b) => {
      b.addEventListener("click", () => {
        if (!S.removeUtente(b.getAttribute("data-del-user"))) toast("Il titolare resta", "error");
        else toast("Utente tolto");
      });
    });
    el.querySelectorAll("[data-fold]").forEach((box) => {
      box.addEventListener("change", () => {
        S.setReparto(box.getAttribute("data-fold"), box.checked);
        toast(box.checked ? "Reparto in uso" : "Reparto spento per gli operatori");
      });
    });
    el.querySelectorAll("[data-perm-user]").forEach((box) => {
      box.addEventListener("change", () => {
        const id = box.getAttribute("data-perm-user");
        const chosen = Array.from(el.querySelectorAll("[data-perm-user]"))
          .filter((x) => x.getAttribute("data-perm-user") === id && x.checked)
          .map((x) => x.getAttribute("data-perm-fold"));
        S.setUtenteReparti(id, chosen);
        toast("Permessi aggiornati");
      });
    });
    const fNuc = el.querySelector("#f-nucleo");
    if (fNuc) {
      fNuc.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = formVal(e.target);
        if (!v.nome) {
          toast("Scrivi il nome", "error");
          return;
        }
        S.addNucleo({ nome: v.nome, vincolo: v.vincolo });
        toast("Persona aggiunta al nucleo");
      });
    }
    el.querySelectorAll("[data-del-nucleo]").forEach((b) => {
      b.addEventListener("click", () => {
        if (!S.removeNucleo(b.getAttribute("data-del-nucleo"))) toast("L’intestatario resta", "error");
        else toast("Persona tolta dal nucleo");
      });
    });
    const fCol = el.querySelector("#f-collab");
    if (fCol) {
      fCol.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = formVal(e.target);
        if (!v.nome || !v.mail) {
          toast("Nome e mail servono", "error");
          return;
        }
        const tasti = Array.from(e.target.querySelectorAll('[name="tasti"]:checked')).map((x) => x.value);
        S.addCollab({ nome: v.nome, mail: v.mail, tasti: tasti.length ? tasti : ["pubblica", "chat"] });
        toast("Collaboratore aggiunto");
      });
    }
    el.querySelectorAll("[data-del-collab]").forEach((b) => {
      b.addEventListener("click", () => {
        if (!S.removeCollab(b.getAttribute("data-del-collab"))) toast("Non si toglie chi è dentro ora", "error");
        else toast("Collaboratore tolto");
      });
    });
    const fPag = el.querySelector("#f-pag");
    if (fPag) {
      fPag.addEventListener("submit", (e) => {
        e.preventDefault();
        S.updatePagamenti(formVal(e.target));
        toast("Pagamenti salvati");
      });
    }
    const fAcc = el.querySelector("#f-acc");
    if (fAcc) {
      fAcc.addEventListener("submit", (e) => {
        e.preventDefault();
        S.updateAccount(formVal(e.target));
        toast("Account salvato");
      });
    }
    const fChi = el.querySelector("#f-chi");
    if (fChi) {
      fChi.addEventListener("submit", (e) => {
        e.preventDefault();
        S.setChi(formVal(e.target).chi);
        toast("Sei dentro come " + ((S.utenteCorrente() && S.utenteCorrente().nome) || "questa persona"));
      });
    }
    const fNoti = el.querySelector("#f-noti");
    if (fNoti) {
      fNoti.addEventListener("submit", (e) => {
        e.preventDefault();
        const form = e.target;
        S.updateNotifiche({
          chat: form.elements.chat.checked,
          annunci: form.elements.annunci.checked,
          scadenze: form.elements.scadenze.checked
        });
        toast("Notifiche salvate");
      });
    }
    const btnEx = el.querySelector("#btn-export");
    if (btnEx) {
      btnEx.addEventListener("click", () => {
        const blob = new Blob([S.exportJSON()], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "anchecasa-dati.json";
        a.click();
        URL.revokeObjectURL(a.href);
        toast("File scaricato");
      });
    }
    const fImp = el.querySelector("#f-import");
    if (fImp) {
      fImp.addEventListener("change", () => {
        const file = fImp.files && fImp.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const obj = JSON.parse(String(reader.result || ""));
            if (!S.importJSON(obj)) toast("File non valido", "error");
            else toast("Dati importati");
          } catch (err) {
            toast("File non valido", "error");
          }
        };
        reader.readAsText(file);
      });
    }
    const btnReset = el.querySelector("#btn-reset");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        S.resetDemo();
        toast("Prova ripristinata");
      });
    }
    void titolare;
    void folds;
  }

  /* ============================================================================
   * ADMIN — quarta famiglia (deciso 22.09.2026, su richiesta esplicita: prima era
   * una pagina admin.html a sé, ora dentro la stessa dashboard). Legge Supabase
   * direttamente (window.acDb, vedi js/supabase-client.js): store.js resta la demo
   * a localStorage per privato/azienda/agente, l'admin non passa da lì.
   * ============================================================================ */

  function dataAdmin(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d)) return "-";
    const p = (n) => String(n).padStart(2, "0");
    return p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear();
  }

  const LAB_FAMIGLIA_ADMIN = { privato: "Privato", azienda: "Azienda", agente: "Agente" };
  const TAG_VERIFICA = { attesa: ["wait", "In attesa"], verificato: ["ok", "Verificato"], rifiutato: ["new", "Rifiutato"] };
  const TAG_STATO_ISCRIZIONE = {
    bozza: ["wait", "Bozza"],
    attesa: ["wait", "In attesa"],
    accettata: ["ok", "Approvato"],
    rifiutata: ["new", "Rifiutata"],
    integrazione: ["wait", "Integrazione"],
    revoca: ["paused", "Revoca momentanea"]
  };
  // "inviato" è solo il valore iniziale nel database: nessuna mail parte, il link lo manda l'admin a mano.
  const TAG_STATO_INVITO = { inviato: ["wait", "Creato"], aperto: ["new", "Aperto"], iscritto: ["ok", "Iscritto"] };
  // 01.10.2026: l'invito porta alla pagina di benvenuto (mail + password), non più ai form di iscrizione.
  const LINK_ISCRIVITI = "https://areaprivata.anchecasa.it/benvenuto.html";

  function linkInvito(token, famiglia) {
    return LINK_ISCRIVITI + "?invito=" + token;
  }

  // Email e WhatsApp non inviano nulla da soli: aprono il programma di posta / WhatsApp
  // con il messaggio già scritto, l'invio lo fa l'admin. WhatsApp va dritto sulla chat
  // se l'invito ha un telefono, altrimenti fa scegliere il contatto.
  function testoInvito(url, famiglia) {
    const chi = famiglia === "privato"
      ? "come privato"
      : famiglia === "agente"
        ? "come agente"
        : famiglia === "azienda"
          ? "come azienda"
          : "";
    return "La invitiamo a iscriversi ad AncheCasa " + (chi ? chi + " " : "") + "da questo link: " + url;
  }

  // wa.me vuole solo cifre con prefisso internazionale, senza + né 00.
  // Un numero italiano scritto senza prefisso (3xx… cellulare, 0x… fisso) prende il 39.
  function numeroWhatsApp(tel) {
    let n = String(tel || "").replace(/[^\d+]/g, "");
    if (n.startsWith("+")) n = n.slice(1);
    else if (n.startsWith("00")) n = n.slice(2);
    else if (/^[03]\d{5,10}$/.test(n)) n = "39" + n;
    return n.replace(/\D/g, "");
  }

  /* CONGELATO 01.10.2026 — invio mail invito: non cambiare nome function né body { token }
     senza richiesta esplicita. La function sceglie il template dalla famiglia dell’invito. */
  function condividiInvito(azione, inv, dopoInvio) {
    if (azione === "copia") {
      navigator.clipboard.writeText(inv.url).then(() => toast("Link copiato"), () => toast("Non riesco a copiare il link", "error"));
    } else if (azione === "email") {
      if (!inv.mail || !inv.token) return;
      toast("Invio in corso…");
      conTimeoutAdmin(window.acDb.functions.invoke("invia-invito-marketplace", { body: { token: inv.token } }), 25000).then((res) => {
        const errore = res.error || (res.data && res.data.error);
        if (errore) {
          toast("Mail non inviata: " + (errore.message || errore), "error");
          return;
        }
        toast("Mail inviata a " + inv.mail);
        if (dopoInvio) dopoInvio();
      });
    } else if (azione === "whatsapp") {
      const numero = numeroWhatsApp(inv.telefono);
      const fam = inv.famiglia || "";
      window.open("https://wa.me/" + numero + "?text=" + encodeURIComponent(testoInvito(inv.url, fam)), "_blank", "noopener");
    }
  }

  // Admin · Genera link: un solo tasto. Da inviare = cotto; già inviata = OK.
  function tastoInviaMail(inv) {
    if (inv.inviato_at) {
      return html`<span class="btn-mail is-ok" aria-label="Mail già inviata">OK</span>`;
    }
    if (!inv.mail) {
      return html`<button type="button" class="btn-mail is-off" disabled title="Nessuna mail per questo invito">Invia mail</button>`;
    }
    return html`<button type="button" class="btn-mail" data-azione="email">Invia mail</button>`;
  }

  // Usato dagli Inviti di privato/azienda/agente (non admin Genera link).
  function tastiInvito(inv) {
    return html`<button type="button" class="tab" data-azione="copia">Copia link</button>
      <button type="button" class="tab" data-azione="email"${inv.mail ? "" : html` disabled title="Nessuna mail per questo invito"`}>Email</button>
      <button type="button" class="tab" data-azione="whatsapp" title="${inv.telefono ? "Apre la chat con " + inv.telefono : "Nessun telefono: scegli tu il contatto"}">WhatsApp</button>`;
  }

  function conTimeoutAdmin(promessa, ms) {
    return Promise.race([
      promessa,
      new Promise((resolve) => setTimeout(() => resolve({ error: { message: "il server non risponde" } }), ms))
    ]);
  }

  function erroreAdmin(el, msg, riprova) {
    el.innerHTML = html`<div class="card empty"><strong>Non riesco a leggere i dati</strong><span>${msg}</span></div>
      <div class="row-actions"><button type="button" class="tab" id="admin-riprova">Riprova</button></div>`.s;
    const btn = el.querySelector("#admin-riprova");
    if (btn) btn.addEventListener("click", riprova);
  }

  /* ADMIN · Task (02.10.2026, su richiesta): elenco condiviso fra gli admin di cose da fare,
     funzioni e problemi, con scadenza indicativa, assegnatario, spunta «fatto» e commenti.
     Tabelle admin_task / admin_task_commenti (SQL sezione 22); chi è admin lo dà admin_team().
     Stile in css/admin-task.css. File e Chat del team arrivano dopo, come voci a parte. */
  const TIPO_TASK = { da_fare: "Da fare", funzione: "Funzione", problema: "Problema", nota: "Nota" };
  const TAG_TIPO_TASK = { da_fare: "closed", funzione: "ok", problema: "new", nota: "paused" };
  const STATO_TASK = { da_fare: "Da fare", in_corso: "In corso", fatto: "Fatto" };
  const taskUi = { filtro: "aperti", aperto: "", vista: "lista", modifica: "" };

  function oggiISO() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  V.task = {
    title: "Task",
    sub: "Cose da fare, funzioni e problemi, per Nando e Francesco. Spunta quando è fatto.",
    render(el) {
      if (!window.acDb) {
        erroreAdmin(el, "Supabase non è disponibile in questa pagina.", () => V.task.render(el));
        return;
      }
      const dati = { io: "", team: [], task: [], commenti: [] };
      taskUi.vista = "lista"; // la voce Task nel menu apre sempre l'elenco
      taskUi.modifica = "";

      function nomeDi(id) {
        const m = dati.team.find((t) => t.id === id);
        return m ? m.nome : "—";
      }

      function opzioniTeam(selezionato, conNessuno) {
        return html`${conNessuno ? html`<option value="">Nessuno</option>` : ""}${dati.team.map(
          (m) => html`<option value="${m.id}"${m.id === selezionato ? html` selected` : ""}>${m.nome}</option>`
        )}`;
      }

      function visibili() {
        let l = dati.task.slice();
        if (taskUi.filtro === "aperti") l = l.filter((t) => t.stato !== "fatto");
        else if (taskUi.filtro === "miei") l = l.filter((t) => t.stato !== "fatto" && t.assegnato_a === dati.io);
        else if (taskUi.filtro === "fatti") l = l.filter((t) => t.stato === "fatto");
        if (taskUi.filtro === "fatti") {
          l.sort((a, b) => String(b.fatto_at || "").localeCompare(String(a.fatto_at || "")));
        } else {
          // scadenza più vicina in alto (scaduti per primi), senza scadenza in fondo
          l.sort((a, b) => {
            const sa = a.scadenza || "9999-99-99";
            const sb = b.scadenza || "9999-99-99";
            return sa === sb ? String(b.created_at).localeCompare(String(a.created_at)) : sa.localeCompare(sb);
          });
        }
        return l;
      }

      function conta(f) {
        if (f === "aperti") return dati.task.filter((t) => t.stato !== "fatto").length;
        if (f === "miei") return dati.task.filter((t) => t.stato !== "fatto" && t.assegnato_a === dati.io).length;
        if (f === "fatti") return dati.task.filter((t) => t.stato === "fatto").length;
        return dati.task.length;
      }

      function sceltaCampi(t) {
        return html`<div class="fields tre">
          <div class="field"><label>Stato</label>
            <select data-campo="stato">${Object.keys(STATO_TASK).map((k) => html`<option value="${k}"${k === t.stato ? html` selected` : ""}>${STATO_TASK[k]}</option>`)}</select>
          </div>
          <div class="field"><label>Assegnato a</label>
            <select data-campo="assegnato_a">${opzioniTeam(t.assegnato_a, true)}</select>
          </div>
          <div class="field"><label>Scadenza indicativa</label>
            <input type="date" data-campo="scadenza" value="${t.scadenza || ""}">
          </div>
        </div>`;
      }

      function blocco(t) {
        const com = dati.commenti.filter((c) => c.task_id === t.id);
        const scaduto = t.scadenza && t.stato !== "fatto" && t.scadenza < oggiISO();
        const aperto = taskUi.aperto === t.id;
        return html`<div class="tk${t.stato === "fatto" ? " is-fatto" : ""}${scaduto ? " is-scaduto" : ""}" data-id="${t.id}">
          <div class="tk-testa">
            <input type="checkbox" class="tk-spunta" aria-label="Segna come fatto"${t.stato === "fatto" ? html` checked` : ""}>
            <button type="button" class="tk-titolo" data-apri aria-expanded="${aperto ? "true" : "false"}">${t.titolo}</button>
            <span class="tag ${TAG_TIPO_TASK[t.tipo] || "paused"}">${TIPO_TASK[t.tipo] || t.tipo}</span>
            ${t.stato === "in_corso" ? html`<span class="tag wait">In corso</span>` : ""}
            <span class="tk-meta">${t.assegnato_a ? nomeDi(t.assegnato_a) : "Nessuno"}</span>
            <span class="tk-scad">${t.scadenza ? (scaduto ? "Scaduto il " : "Entro il ") + dataAdmin(t.scadenza) : ""}</span>
            ${com.length ? html`<span class="tk-n">${com.length} ${com.length === 1 ? "commento" : "commenti"}</span>` : ""}
          </div>
          ${aperto ? html`<div class="tk-dett">
            ${t.descrizione ? html`<p class="tk-desc">${t.descrizione}</p>` : ""}
            ${sceltaCampi(t)}
            <p class="note" style="margin-top:10px">Creato da ${nomeDi(t.creato_da)} il ${dataAdmin(t.created_at)}${t.stato === "fatto" && t.fatto_at ? html` · Fatto da ${nomeDi(t.fatto_da)} il ${dataAdmin(t.fatto_at)}` : ""}</p>
            <div class="tk-commenti">
              ${com.map((c) => html`<div class="tk-com">
                <div><strong>${nomeDi(c.autore)}</strong> <small>${dataAdmin(c.created_at)}</small>${c.autore === dati.io ? html` <button type="button" class="tk-link" data-del-com="${c.id}">Elimina</button>` : ""}</div>
                <p>${c.testo}</p>
              </div>`)}
              <form class="tk-fcom">
                <input name="testo" placeholder="Aggiornamento, problema trovato, nota…" autocomplete="off" maxlength="1000">
                <button class="btn-in" type="submit">Aggiungi</button>
              </form>
            </div>
            <div class="row-actions">
              <button type="button" class="btn-ghost" data-modifica>Modifica</button>
              <button type="button" class="btn-danger" data-elimina>Elimina task</button>
            </div>
          </div>` : ""}
        </div>`;
      }

      // Due schermate: l'elenco (si apre con la voce Task) e il form (pulsante «Aggiungi task»).
      function disegnaForm() {
        // Con taskUi.modifica la stessa pagina si apre già compilata e salva sul task esistente.
        const t = taskUi.modifica ? dati.task.find((x) => x.id === taskUi.modifica) : null;
        el.innerHTML = html`
          <div class="row-actions tk-barra"><button type="button" class="tab" data-vista="lista">← Torna all'elenco</button></div>
          <div class="card">
            <form id="f-task" novalidate>
              <div class="field"><label for="t-titolo">Cosa c'è da fare</label>
                <input id="t-titolo" name="titolo" maxlength="200" autocomplete="off" value="${t ? t.titolo : ""}" placeholder="es. Collegare il pulsante Chat alla bacheca">
              </div>
              <div class="fields tre">
                <div class="field"><label for="t-tipo">Tipo</label>
                  <select id="t-tipo" name="tipo">${Object.keys(TIPO_TASK).map((k) => html`<option value="${k}"${t && t.tipo === k ? html` selected` : ""}>${TIPO_TASK[k]}</option>`)}</select>
                </div>
                <div class="field"><label for="t-ass">Assegnato a</label>
                  <select id="t-ass" name="assegnato_a">${opzioniTeam(t ? t.assegnato_a : dati.io, true)}</select>
                </div>
                <div class="field"><label for="t-scad">Scadenza indicativa</label>
                  <input id="t-scad" name="scadenza" type="date" value="${t && t.scadenza ? t.scadenza : ""}">
                </div>
              </div>
              <div class="field" style="margin-top:12px"><label for="t-desc">Dettagli (facoltativo)</label>
                <textarea id="t-desc" name="descrizione" rows="4" maxlength="4000">${t ? t.descrizione || "" : ""}</textarea>
              </div>
              <div class="row-actions" style="margin-top:12px">
                <button class="btn-in" type="submit">${t ? "Salva modifiche" : "Salva task"}</button>
                <button type="button" class="btn-ghost" data-vista="lista">Annulla</button>
              </div>
            </form>
          </div>`.s;
        if (el.closest(".main")) el.closest(".main").scrollTop = 0;
        const campoTitolo = el.querySelector("#t-titolo");
        if (campoTitolo) campoTitolo.focus();
      }

      function disegna() {
        if (taskUi.vista === "nuovo") {
          disegnaForm();
          return;
        }
        const lista = visibili();
        const filtri = [["aperti", "Aperti"], ["miei", "Miei"], ["fatti", "Fatti"], ["tutti", "Tutti"]];
        // Non si ridisegna mentre si scrive: si salva il testo dei campi di commento e il fuoco.
        const scritto = el.querySelector(".tk-fcom input[name=testo]");
        const bozza = scritto ? scritto.value : "";
        const haFuoco = scritto && document.activeElement === scritto;
        const scrollTop = el.closest(".main") ? el.closest(".main").scrollTop : 0;
        el.innerHTML = html`
          <div class="row-actions tk-barra">
            <button type="button" class="btn-new" data-vista="nuovo">+ Aggiungi task</button>
          </div>
          <div class="row-actions tk-filtri">${filtri.map(
            (f) => html`<button type="button" class="tab${taskUi.filtro === f[0] ? " on" : ""}" data-filtro="${f[0]}">${f[1]} (${conta(f[0])})</button>`
          )}</div>
          <div class="tk-lista">${lista.length
            ? lista.map(blocco)
            : html`<div class="card"><p class="note" style="margin:0">${
                taskUi.filtro === "fatti" ? "Nessun task fatto per ora." : taskUi.filtro === "miei" ? "Nessun task aperto assegnato a te." : "Nessun task: usa «Aggiungi task»."
              }</p></div>`}</div>`.s;
        const nuovoCom = el.querySelector(".tk-fcom input[name=testo]");
        if (nuovoCom && bozza) nuovoCom.value = bozza;
        if (nuovoCom && haFuoco) nuovoCom.focus();
        if (el.closest(".main")) el.closest(".main").scrollTop = scrollTop;
      }

      function esito(res, messaggio) {
        if (res && res.error) {
          toast(messaggio + ": " + (res.error.message || res.error), "error");
          return false;
        }
        return true;
      }

      function aggiorna(id, patch, dopo) {
        conTimeoutAdmin(window.acDb.from("admin_task").update(patch).eq("id", id).select("*").single(), 25000).then((res) => {
          if (!esito(res, "Non riesco a salvare")) {
            disegna();
            return;
          }
          const i = dati.task.findIndex((t) => t.id === id);
          if (i >= 0) dati.task[i] = res.data;
          disegna();
          if (dopo) dopo();
        });
      }

      el.onsubmit = (e) => {
        e.preventDefault();
        const form = e.target;
        if (form.id === "f-task") {
          const titolo = form.elements.titolo.value.trim();
          if (!titolo) {
            toast("Scrivi cosa c'è da fare.", "error");
            return;
          }
          const btn = form.querySelector('button[type="submit"]');
          if (taskUi.modifica) {
            const id = taskUi.modifica;
            if (btn) btn.disabled = true;
            taskUi.vista = "lista";
            taskUi.modifica = "";
            taskUi.aperto = id;
            aggiorna(id, {
              titolo: titolo,
              descrizione: form.elements.descrizione.value.trim() || null,
              tipo: form.elements.tipo.value,
              assegnato_a: form.elements.assegnato_a.value || null,
              scadenza: form.elements.scadenza.value || null
            }, () => toast("Modifiche salvate"));
            return;
          }
          if (btn) btn.disabled = true;
          conTimeoutAdmin(
            window.acDb.from("admin_task").insert({
              titolo: titolo,
              descrizione: form.elements.descrizione.value.trim() || null,
              tipo: form.elements.tipo.value,
              assegnato_a: form.elements.assegnato_a.value || null,
              scadenza: form.elements.scadenza.value || null
            }).select("*").single(),
            25000
          ).then((res) => {
            if (btn) btn.disabled = false;
            if (!esito(res, "Non riesco ad aggiungere il task")) return;
            dati.task.unshift(res.data);
            if (taskUi.filtro === "fatti") taskUi.filtro = "aperti";
            taskUi.vista = "lista";
            taskUi.aperto = res.data.id;
            disegna();
            toast("Task aggiunto");
          });
        } else if (form.classList.contains("tk-fcom")) {
          const testo = form.elements.testo.value.trim();
          const id = form.closest(".tk").getAttribute("data-id");
          if (!testo) return;
          const btn = form.querySelector('button[type="submit"]');
          if (btn) btn.disabled = true;
          conTimeoutAdmin(
            window.acDb.from("admin_task_commenti").insert({ task_id: id, testo: testo }).select("id, task_id, autore, testo, created_at").single(),
            25000
          ).then((res) => {
            if (btn) btn.disabled = false;
            if (!esito(res, "Non riesco a salvare il commento")) return;
            dati.commenti.push(res.data);
            form.elements.testo.value = "";
            disegna();
          });
        }
      };

      el.onclick = (e) => {
        const vista = e.target.closest("[data-vista]");
        if (vista) {
          taskUi.vista = vista.getAttribute("data-vista");
          taskUi.modifica = "";
          disegna();
          return;
        }
        const filtro = e.target.closest("[data-filtro]");
        if (filtro) {
          taskUi.filtro = filtro.getAttribute("data-filtro");
          disegna();
          return;
        }
        const blocchi = e.target.closest(".tk");
        if (!blocchi) return;
        const id = blocchi.getAttribute("data-id");
        if (e.target.closest("[data-modifica]")) {
          taskUi.modifica = id;
          taskUi.vista = "nuovo";
          disegna();
          return;
        }
        if (e.target.closest("[data-apri]")) {
          taskUi.aperto = taskUi.aperto === id ? "" : id;
          disegna();
          return;
        }
        const delCom = e.target.closest("[data-del-com]");
        if (delCom) {
          const cid = delCom.getAttribute("data-del-com");
          conTimeoutAdmin(window.acDb.from("admin_task_commenti").delete().eq("id", cid), 25000).then((res) => {
            if (!esito(res, "Non riesco a eliminare il commento")) return;
            dati.commenti = dati.commenti.filter((c) => c.id !== cid);
            disegna();
          });
          return;
        }
        if (e.target.closest("[data-elimina]")) {
          const t = dati.task.find((x) => x.id === id);
          AC.ui.confirm({
            title: "Eliminare il task?",
            message: "«" + (t ? t.titolo : "") + "» e i suoi commenti verranno cancellati per tutti e due.",
            okLabel: "Elimina",
            danger: true
          }).then((ok) => {
            if (!ok) return;
            conTimeoutAdmin(window.acDb.from("admin_task").delete().eq("id", id), 25000).then((res) => {
              if (!esito(res, "Non riesco a eliminare il task")) return;
              dati.task = dati.task.filter((x) => x.id !== id);
              dati.commenti = dati.commenti.filter((c) => c.task_id !== id);
              taskUi.aperto = "";
              disegna();
              toast("Task eliminato");
            });
          });
        }
      };

      el.onchange = (e) => {
        const blocchi = e.target.closest(".tk");
        if (!blocchi) return;
        const id = blocchi.getAttribute("data-id");
        if (e.target.classList.contains("tk-spunta")) {
          aggiorna(id, { stato: e.target.checked ? "fatto" : "da_fare" });
          return;
        }
        const campo = e.target.getAttribute("data-campo");
        if (campo) aggiorna(id, { [campo]: e.target.value || null });
      };

      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      conTimeoutAdmin(
        Promise.all([
          window.acDb.auth.getSession(),
          window.acDb.rpc("admin_team"),
          window.acDb.from("admin_task").select("*").order("created_at", { ascending: false }),
          window.acDb.from("admin_task_commenti").select("id, task_id, autore, testo, created_at").order("created_at", { ascending: true })
        ]),
        25000
      ).then((res) => {
        if (!el.isConnected) return;
        if (!Array.isArray(res)) {
          erroreAdmin(el, res.error.message, () => V.task.render(el));
          return;
        }
        const errore = res[1].error || res[2].error || res[3].error;
        if (errore) {
          const manca = /does not exist|schema cache|admin_task|admin_team/i.test(errore.message || "");
          erroreAdmin(el, manca ? "Le tabelle dei task non ci sono ancora: va eseguita la sezione 22 dell'SQL." : errore.message, () => V.task.render(el));
          return;
        }
        dati.io = res[0].data && res[0].data.session ? res[0].data.session.user.id : "";
        dati.team = res[1].data || [];
        dati.task = res[2].data || [];
        dati.commenti = res[3].data || [];
        disegna();
      });
    }
  };

  /* ADMIN · File (02.10.2026, su richiesta): cartella condivisa e privata fra gli admin.
     Tabella admin_file + bucket privato marketplace-admin-file (SQL sezione 23). Si scarica con
     un link firmato di 60 secondi; chi ha caricato può eliminare, il collegamento a un task lo
     cambiano entrambi. Limite 20 MB a file (lo impone anche il bucket). */
  const BUCKET_FILE_ADMIN = "marketplace-admin-file";
  const MAX_FILE_ADMIN = 20 * 1024 * 1024;
  const fileUi = { cerca: "", filtro: "tutti" };

  function pesoFile(n) {
    if (n >= 1048576) return (n / 1048576).toFixed(1).replace(".", ",") + " MB";
    if (n >= 1024) return Math.round(n / 1024) + " KB";
    return n + " B";
  }

  // Nome sicuro per il percorso nell'archivio (solo lettere, cifre, punto, trattino, underscore).
  function nomeSicuroFile(nome) {
    const base = String(nome || "file").normalize("NFD").replace(/[̀-ͯ]/g, "");
    return base.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "").slice(-120) || "file";
  }

  V.file = {
    title: "File",
    sub: "Cartella condivisa fra gli admin: carica, scarica, collega a un task. Massimo 20 MB a file.",
    render(el) {
      if (!window.acDb) {
        erroreAdmin(el, "Supabase non è disponibile in questa pagina.", () => V.file.render(el));
        return;
      }
      const dati = { io: "", team: [], task: [], file: [] };
      let inCorso = false;

      function nomeDi(id) {
        const m = dati.team.find((t) => t.id === id);
        return m ? m.nome : "—";
      }

      function visibili() {
        const q = fileUi.cerca.trim().toLowerCase();
        return dati.file.filter((f) => {
          if (fileUi.filtro === "miei" && f.caricato_da !== dati.io) return false;
          if (fileUi.filtro === "task" && !f.task_id) return false;
          if (q) {
            const t = dati.task.find((x) => x.id === f.task_id);
            const testo = (f.nome + " " + nomeDi(f.caricato_da) + " " + (t ? t.titolo : "")).toLowerCase();
            if (testo.indexOf(q) < 0) return false;
          }
          return true;
        });
      }

      function opzioniTask(selezionato) {
        return html`<option value="">Nessun task</option>${dati.task.map(
          (t) => html`<option value="${t.id}"${t.id === selezionato ? html` selected` : ""}>${t.titolo.length > 40 ? t.titolo.slice(0, 40) + "…" : t.titolo}${t.stato === "fatto" ? " (fatto)" : ""}</option>`
        )}`;
      }

      function disegna() {
        const lista = visibili();
        const filtri = [["tutti", "Tutti"], ["miei", "Miei"], ["task", "Collegati a un task"]];
        const cerca = el.querySelector("#fl-cerca");
        const haFuoco = cerca && document.activeElement === cerca;
        const scrollTop = el.closest(".main") ? el.closest(".main").scrollTop : 0;
        el.innerHTML = html`
          <label class="fl-drop" id="fl-drop">
            <input type="file" id="fl-input" multiple hidden>
            <strong>${inCorso ? "Caricamento in corso…" : "+ Carica file"}</strong>
            <span>${inCorso ? "Attendi, non chiudere la pagina." : "Clicca qui o trascina i file dentro questo riquadro. Massimo 20 MB a file."}</span>
          </label>
          <div class="row-actions tk-filtri">${filtri.map(
            (f) => html`<button type="button" class="tab${fileUi.filtro === f[0] ? " on" : ""}" data-filtro="${f[0]}">${f[1]}</button>`
          )}
            <input id="fl-cerca" class="fl-cerca" type="search" placeholder="Cerca per nome, chi o task…" value="${fileUi.cerca}" autocomplete="off">
          </div>
          <div class="card">${lista.length
            ? html`<table class="mini-table fl-tab">
                <thead><tr><th>File</th><th>Task</th><th>Caricato da</th><th>Data</th><th class="num">Peso</th><th></th></tr></thead>
                <tbody>${lista.map((f) => html`<tr data-id="${f.id}">
                  <td><strong class="fl-nome">${f.nome}</strong></td>
                  <td><select class="fl-task" data-collega aria-label="Task collegato">${opzioniTask(f.task_id)}</select></td>
                  <td>${nomeDi(f.caricato_da)}</td>
                  <td>${dataAdmin(f.created_at)}</td>
                  <td class="num">${pesoFile(f.dimensione)}</td>
                  <td class="fl-az">
                    <button type="button" class="btn-new" data-scarica>Scarica</button>
                    ${f.caricato_da === dati.io ? html`<button type="button" class="btn-ghost" data-elimina>Elimina</button>` : ""}
                  </td>
                </tr>`)}</tbody>
              </table>`
            : html`<p class="note" style="margin:0">${dati.file.length ? "Nessun file corrisponde." : "Nessun file ancora: caricane uno qui sopra."}</p>`}</div>`.s;
        if (cerca || fileUi.cerca) {
          const nuovo = el.querySelector("#fl-cerca");
          if (nuovo && haFuoco) {
            nuovo.focus();
            nuovo.setSelectionRange(nuovo.value.length, nuovo.value.length);
          }
        }
        if (el.closest(".main")) el.closest(".main").scrollTop = scrollTop;
      }

      function esito(res, messaggio) {
        if (res && res.error) {
          toast(messaggio + ": " + (res.error.message || res.error), "error");
          return false;
        }
        return true;
      }

      // Un file alla volta: archivio → riga nell'elenco (se la riga fallisce, si toglie il file dall'archivio).
      async function carica(files) {
        if (inCorso || !files.length) return;
        inCorso = true;
        disegna();
        let ok = 0;
        for (const f of files) {
          if (f.size > MAX_FILE_ADMIN) {
            toast("«" + f.name + "» supera i 20 MB: non caricato.", "error");
            continue;
          }
          if (!f.size) {
            toast("«" + f.name + "» è vuoto: non caricato.", "error");
            continue;
          }
          const percorso = dati.io + "/" + (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2)) + "-" + nomeSicuroFile(f.name);
          const su = await conTimeoutAdmin(
            window.acDb.storage.from(BUCKET_FILE_ADMIN).upload(percorso, f, { contentType: f.type || "application/octet-stream", upsert: false }),
            120000
          );
          if (!esito(su, "Non riesco a caricare «" + f.name + "»")) continue;
          const riga = await conTimeoutAdmin(
            window.acDb.from("admin_file")
              .insert({ nome: f.name, path: percorso, mime: f.type || null, dimensione: f.size })
              .select("*").single(),
            25000
          );
          if (!esito(riga, "Non riesco a salvare «" + f.name + "» nell'elenco")) {
            window.acDb.storage.from(BUCKET_FILE_ADMIN).remove([percorso]);
            continue;
          }
          dati.file.unshift(riga.data);
          ok++;
        }
        inCorso = false;
        disegna();
        if (ok) toast(ok === 1 ? "File caricato" : ok + " file caricati");
      }

      el.onclick = (e) => {
        const filtro = e.target.closest("[data-filtro]");
        if (filtro) {
          fileUi.filtro = filtro.getAttribute("data-filtro");
          disegna();
          return;
        }
        if (e.target.closest("#fl-drop") && inCorso) {
          e.preventDefault();
          return;
        }
        const riga = e.target.closest("tr[data-id]");
        if (!riga) return;
        const f = dati.file.find((x) => x.id === riga.getAttribute("data-id"));
        if (!f) return;
        if (e.target.closest("[data-scarica]")) {
          conTimeoutAdmin(window.acDb.storage.from(BUCKET_FILE_ADMIN).createSignedUrl(f.path, 60, { download: f.nome }), 25000).then((res) => {
            if (!esito(res, "Non riesco a scaricare il file")) return;
            const a = document.createElement("a");
            a.href = res.data.signedUrl;
            a.download = f.nome;
            document.body.appendChild(a);
            a.click();
            a.remove();
          });
        } else if (e.target.closest("[data-elimina]")) {
          AC.ui.confirm({
            title: "Eliminare il file?",
            message: "«" + f.nome + "» verrà cancellato per tutti e due.",
            okLabel: "Elimina",
            danger: true
          }).then((conferma) => {
            if (!conferma) return;
            // Prima la riga (la regola ammette solo chi ha caricato), poi il file nell'archivio.
            conTimeoutAdmin(window.acDb.from("admin_file").delete().eq("id", f.id).select("id"), 25000).then((res) => {
              if (!esito(res, "Non riesco a eliminare il file")) return;
              if (!res.data || !res.data.length) {
                toast("Non puoi eliminare un file caricato da un altro admin.", "error");
                return;
              }
              window.acDb.storage.from(BUCKET_FILE_ADMIN).remove([f.path]);
              dati.file = dati.file.filter((x) => x.id !== f.id);
              disegna();
              toast("File eliminato");
            });
          });
        }
      };

      el.onchange = (e) => {
        if (e.target.id === "fl-input") {
          const scelti = Array.prototype.slice.call(e.target.files || []);
          e.target.value = "";
          carica(scelti);
          return;
        }
        const riga = e.target.closest("tr[data-id]");
        if (riga && e.target.hasAttribute("data-collega")) {
          const id = riga.getAttribute("data-id");
          conTimeoutAdmin(window.acDb.from("admin_file").update({ task_id: e.target.value || null }).eq("id", id).select("*").single(), 25000).then((res) => {
            if (!esito(res, "Non riesco a collegare il task")) {
              disegna();
              return;
            }
            const i = dati.file.findIndex((x) => x.id === id);
            if (i >= 0) dati.file[i] = res.data;
            disegna();
            toast(res.data.task_id ? "File collegato al task" : "Collegamento tolto");
          });
        }
      };

      el.oninput = (e) => {
        if (e.target.id === "fl-cerca") {
          fileUi.cerca = e.target.value;
          disegna();
        }
      };

      el.ondragover = (e) => {
        if (e.target.closest("#fl-drop")) {
          e.preventDefault();
          e.target.closest("#fl-drop").classList.add("is-sopra");
        }
      };
      el.ondragleave = (e) => {
        const z = e.target.closest("#fl-drop");
        if (z) z.classList.remove("is-sopra");
      };
      el.ondrop = (e) => {
        const z = e.target.closest("#fl-drop");
        if (!z) return;
        e.preventDefault();
        z.classList.remove("is-sopra");
        carica(Array.prototype.slice.call((e.dataTransfer && e.dataTransfer.files) || []));
      };

      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      conTimeoutAdmin(
        Promise.all([
          window.acDb.auth.getSession(),
          window.acDb.rpc("admin_team"),
          window.acDb.from("admin_task").select("id, titolo, stato").order("created_at", { ascending: false }),
          window.acDb.from("admin_file").select("*").order("created_at", { ascending: false })
        ]),
        25000
      ).then((res) => {
        if (!el.isConnected) return;
        if (!Array.isArray(res)) {
          erroreAdmin(el, res.error.message, () => V.file.render(el));
          return;
        }
        const errore = res[1].error || res[2].error || res[3].error;
        if (errore) {
          const manca = /does not exist|schema cache|admin_file|admin_task|admin_team/i.test(errore.message || "");
          erroreAdmin(el, manca ? "Le tabelle dei file non ci sono ancora: vanno eseguite le sezioni 22 e 23 dell'SQL." : errore.message, () => V.file.render(el));
          return;
        }
        dati.io = res[0].data && res[0].data.session ? res[0].data.session.user.id : "";
        dati.team = res[1].data || [];
        dati.task = res[2].data || [];
        dati.file = res[3].data || [];
        disegna();
      });
    }
  };

  /* ADMIN · Chat (02.10.2026, su richiesta): una sola conversazione fra gli admin, in tempo reale
     (Supabase Realtime sulla tabella admin_chat, con un controllo ogni 20 s come riserva).
     Un messaggio ha testo e/o un file (dai File) e/o un task citato. Il pallino dei non letti
     sul menu sta in app.js (AC.chatPallino); qui si segna tutto come letto aprendo la pagina.
     SQL sezione 24. Invio con Invio, a capo con Maiusc+Invio. */
  function oraChat(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const p = (n) => String(n).padStart(2, "0");
    const ora = p(d.getHours()) + ":" + p(d.getMinutes());
    const oggi = new Date();
    return d.toDateString() === oggi.toDateString() ? ora : p(d.getDate()) + "." + p(d.getMonth() + 1) + " " + ora;
  }

  V["chat-team"] = {
    title: "Chat",
    sub: "Conversazione fra Nando e Francesco. Puoi allegare un file o citare un task.",
    render(el) {
      if (!window.acDb) {
        erroreAdmin(el, "Supabase non è disponibile in questa pagina.", () => V["chat-team"].render(el));
        return;
      }
      const dati = { io: "", team: [], msg: [], file: [], task: [] };
      let canale = null;
      let timer = null;

      function nomeDi(id) {
        const m = dati.team.find((t) => t.id === id);
        return m ? m.nome : "—";
      }

      function fermaTutto() {
        if (timer) clearInterval(timer);
        timer = null;
        if (canale) {
          try { window.acDb.removeChannel(canale); } catch (e) {}
          canale = null;
        }
      }

      function segnaLetto() {
        conTimeoutAdmin(window.acDb.rpc("chat_segna_letto"), 25000).then(() => {
          if (AC.chatPallino) AC.chatPallino.aggiorna();
        });
      }

      function bolla(m) {
        const mio = m.autore === dati.io;
        const f = m.file_id ? dati.file.find((x) => x.id === m.file_id) : null;
        const t = m.task_id ? dati.task.find((x) => x.id === m.task_id) : null;
        return html`<div class="ch-msg${mio ? " mio" : ""}" data-id="${m.id}">
          <div class="ch-nome">${mio ? "Tu" : nomeDi(m.autore)} · ${oraChat(m.created_at)}${mio ? html` · <button type="button" class="tk-link" data-del-msg>Elimina</button>` : ""}</div>
          <div class="ch-bolla">
            ${m.testo ? html`<p>${m.testo}</p>` : ""}
            ${m.file_id ? (f
              ? html`<button type="button" class="ch-chip" data-scarica="${f.id}">File: ${f.nome} · Scarica</button>`
              : html`<span class="ch-chip is-off">File non più disponibile</span>`) : ""}
            ${m.task_id ? (t
              ? html`<a class="ch-chip" href="#/admin/task">Task: ${t.titolo}${t.stato === "fatto" ? " (fatto)" : ""}</a>`
              : html`<span class="ch-chip is-off">Task non più disponibile</span>`) : ""}
          </div>
        </div>`;
      }

      function disegnaLista(scorriInFondo) {
        const lista = el.querySelector("#ch-lista");
        if (!lista) return;
        const vicinoAlFondo = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 80;
        lista.innerHTML = dati.msg.length
          ? dati.msg.map(bolla).map((h) => h.s).join("")
          : html`<p class="note" style="margin:0;text-align:center">Nessun messaggio ancora: scrivi il primo.</p>`.s;
        if (scorriInFondo || vicinoAlFondo) lista.scrollTop = lista.scrollHeight;
      }

      function aggiungi(m) {
        if (!m || dati.msg.some((x) => x.id === m.id)) return;
        dati.msg.push(m);
        dati.msg.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
        disegnaLista(m.autore === dati.io);
        if (m.autore !== dati.io) segnaLetto();
      }

      function monta() {
        el.innerHTML = html`
          <div class="card ch-card">
            <div class="ch-lista" id="ch-lista" aria-live="polite"></div>
            <form class="ch-form" id="ch-form" novalidate>
              <textarea id="ch-testo" name="testo" rows="2" maxlength="4000" placeholder="Scrivi un messaggio… (Invio per inviare, Maiusc+Invio per andare a capo)"></textarea>
              <div class="ch-sotto">
                <select name="file_id" aria-label="Allega un file">
                  <option value="">Allega un file…</option>
                  ${dati.file.map((f) => html`<option value="${f.id}">${f.nome.length > 40 ? f.nome.slice(0, 40) + "…" : f.nome}</option>`)}
                </select>
                <select name="task_id" aria-label="Cita un task">
                  <option value="">Cita un task…</option>
                  ${dati.task.map((t) => html`<option value="${t.id}">${t.titolo.length > 40 ? t.titolo.slice(0, 40) + "…" : t.titolo}${t.stato === "fatto" ? " (fatto)" : ""}</option>`)}
                </select>
                <button class="btn-in" type="submit">Invia</button>
              </div>
            </form>
          </div>`.s;
        disegnaLista(true);
      }

      el.onsubmit = (e) => {
        e.preventDefault();
        const form = e.target;
        const testo = form.elements.testo.value.trim();
        const fileId = form.elements.file_id.value || null;
        const taskId = form.elements.task_id.value || null;
        if (!testo && !fileId && !taskId) return;
        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        conTimeoutAdmin(
          window.acDb.from("admin_chat").insert({ testo: testo || null, file_id: fileId, task_id: taskId }).select("*").single(),
          25000
        ).then((res) => {
          if (btn) btn.disabled = false;
          if (res.error) {
            toast("Messaggio non inviato: " + (res.error.message || res.error), "error");
            return;
          }
          form.elements.testo.value = "";
          form.elements.file_id.value = "";
          form.elements.task_id.value = "";
          aggiungi(res.data);
          form.elements.testo.focus();
        });
      };

      el.onkeydown = (e) => {
        if (e.target.id === "ch-testo" && e.key === "Enter" && !e.shiftKey && !e.isComposing) {
          e.preventDefault();
          const f = el.querySelector("#ch-form");
          if (f && f.requestSubmit) f.requestSubmit();
        }
      };

      el.onclick = (e) => {
        const scarica = e.target.closest("[data-scarica]");
        if (scarica) {
          const f = dati.file.find((x) => x.id === scarica.getAttribute("data-scarica"));
          if (!f) return;
          conTimeoutAdmin(window.acDb.storage.from(BUCKET_FILE_ADMIN).createSignedUrl(f.path, 60, { download: f.nome }), 25000).then((res) => {
            if (res.error) {
              toast("Non riesco a scaricare il file: " + (res.error.message || res.error), "error");
              return;
            }
            const a = document.createElement("a");
            a.href = res.data.signedUrl;
            a.download = f.nome;
            document.body.appendChild(a);
            a.click();
            a.remove();
          });
          return;
        }
        const del = e.target.closest("[data-del-msg]");
        if (del) {
          const id = del.closest(".ch-msg").getAttribute("data-id");
          conTimeoutAdmin(window.acDb.from("admin_chat").delete().eq("id", id), 25000).then((res) => {
            if (res.error) {
              toast("Non riesco a eliminare il messaggio: " + (res.error.message || res.error), "error");
              return;
            }
            dati.msg = dati.msg.filter((m) => m.id !== id);
            disegnaLista(false);
          });
        }
      };

      // Riserva al tempo reale: ogni 20 s prende i messaggi più recenti dell'ultimo che ha.
      function controlla() {
        if (!el.isConnected) {
          fermaTutto();
          return;
        }
        const ultimo = dati.msg.length ? dati.msg[dati.msg.length - 1].created_at : null;
        let q = window.acDb.from("admin_chat").select("*").order("created_at", { ascending: true }).limit(100);
        if (ultimo) q = q.gt("created_at", ultimo);
        conTimeoutAdmin(q, 25000).then((res) => {
          if (res && !res.error && res.data) res.data.forEach(aggiungi);
        });
      }

      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      conTimeoutAdmin(
        Promise.all([
          window.acDb.auth.getSession(),
          window.acDb.rpc("admin_team"),
          window.acDb.from("admin_chat").select("*").order("created_at", { ascending: false }).limit(200),
          window.acDb.from("admin_file").select("id, nome, path").order("created_at", { ascending: false }),
          window.acDb.from("admin_task").select("id, titolo, stato").order("created_at", { ascending: false })
        ]),
        25000
      ).then((res) => {
        if (!el.isConnected) return;
        if (!Array.isArray(res)) {
          erroreAdmin(el, res.error.message, () => V["chat-team"].render(el));
          return;
        }
        const errore = res[1].error || res[2].error || res[3].error || res[4].error;
        if (errore) {
          const manca = /does not exist|schema cache|admin_chat|admin_file|admin_task|admin_team/i.test(errore.message || "");
          erroreAdmin(el, manca ? "La chat non c'è ancora: vanno eseguite le sezioni 22, 23 e 24 dell'SQL." : errore.message, () => V["chat-team"].render(el));
          return;
        }
        dati.io = res[0].data && res[0].data.session ? res[0].data.session.user.id : "";
        dati.team = res[1].data || [];
        dati.msg = (res[2].data || []).slice().reverse();
        dati.file = res[3].data || [];
        dati.task = res[4].data || [];
        monta();
        segnaLetto();
        try {
          canale = window.acDb
            .channel("admin-chat-" + Math.random().toString(36).slice(2))
            .on("postgres_changes", { event: "INSERT", schema: "marketplace", table: "admin_chat" }, (p) => {
              if (!el.isConnected) {
                fermaTutto();
                return;
              }
              aggiungi(p.new);
            })
            .on("postgres_changes", { event: "DELETE", schema: "marketplace", table: "admin_chat" }, (p) => {
              if (!el.isConnected || !p.old || !p.old.id) return;
              dati.msg = dati.msg.filter((m) => m.id !== p.old.id);
              disegnaLista(false);
            })
            .subscribe();
        } catch (e) {
          canale = null;
        }
        timer = setInterval(controlla, 20000);
      });
    }
  };

  V.iscritti = {
    title: "Iscritti registrati",
    sub: "Privati e aziende: da link invito e dal modulo web. Gli agenti stanno in Richieste agenti.",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      if (!window.acDb) {
        erroreAdmin(el, "Supabase non è disponibile in questa pagina.", () => V.iscritti.render(el));
        return;
      }

      function mailKey(s) {
        return String(s || "").trim().toLowerCase();
      }

      function arricchisci(profili, inviti, richieste) {
        const nomeDaId = {};
        profili.forEach((p) => {
          if (p.id) nomeDaId[p.id] = p.nome || p.email || p.id.slice(0, 8);
        });
        const invitoPerMail = {};
        (inviti || []).forEach((inv) => {
          const k = mailKey(inv.mail);
          if (!k) return;
          const prev = invitoPerMail[k];
          // Preferisci invito già usato (iscritto); altrimenti il più recente resta se arriva dopo in lista.
          if (!prev || inv.stato === "iscritto" || (prev.stato !== "iscritto" && inv.created_at > prev.created_at)) {
            invitoPerMail[k] = inv;
          }
        });
        const webPerUser = {};
        (richieste || []).forEach((r) => {
          if (r.user_id) webPerUser[r.user_id] = r;
          const k = mailKey(r.dati && r.dati.email);
          if (k) webPerUser["mail:" + k] = r;
        });

        return profili
          .filter((p) => p.famiglia === "privato" || p.famiglia === "azienda")
          .map((p) => {
            const inv = invitoPerMail[mailKey(p.email)];
            const web = webPerUser[p.id] || webPerUser["mail:" + mailKey(p.email)];
            let provenienza = "—";
            let invitatoDa = "—";
            if (inv) {
              provenienza = "Link invito";
              if (inv.creato_da) {
                invitatoDa = nomeDaId[inv.creato_da] || "Utente rete";
              } else {
                invitatoDa = "Admin";
              }
              if (inv.categoria) provenienza = "Link invito · " + inv.categoria;
            } else if (web) {
              provenienza = "Modulo web";
              invitatoDa = "—";
            }
            return Object.assign({}, p, {
              provenienza: provenienza,
              invitato_da: invitatoDa,
              da_invito: !!inv,
              da_web: !!web && !inv
            });
          });
      }

      function disegna(righe, filtro) {
        const filtrate = filtro ? righe.filter((r) => r.famiglia === filtro) : righe;
        el.innerHTML = html`
          <div class="card">
            <p class="note">Elenco totale privati e aziende: iscrizioni da link inviati (con chi ha mandato il link) e dal modulo web. Gli agenti non compaiono qui: usa Richieste agenti.</p>
            <div class="tabs">
              ${["", "privato", "azienda"].map(
                (f) => html`<button type="button" class="tab ${filtro === f ? "on" : ""}" data-f="${f}" aria-selected="${filtro === f ? "true" : "false"}">${f ? LAB_FAMIGLIA_ADMIN[f] : "Tutti"}</button>`
              )}
            </div>
            ${!filtrate.length
              ? html`<p class="note">Nessun profilo privato o azienda registrato.</p>`
              : html`<table class="mini-table">
                  <thead><tr><th>Nome</th><th>Email</th><th>Famiglia</th><th>Tipo</th><th>Zona</th><th>Provenienza</th><th>Invitato da</th><th>Verifica</th><th>Iscritto</th><th>Azioni</th></tr></thead>
                  <tbody>
                    ${filtrate.map(
                      (p) => html`<tr data-id="${p.id}">
                        <td>${p.nome || "-"}</td>
                        <td>${p.email || "-"}</td>
                        <td>${LAB_FAMIGLIA_ADMIN[p.famiglia] || p.famiglia}</td>
                        <td>${p.tipo_azienda || "-"}</td>
                        <td>${p.zona || "-"}</td>
                        <td>${p.provenienza || "—"}</td>
                        <td>${p.invitato_da || "—"}</td>
                        <td>${TAG_VERIFICA[p.verifica] ? html`<span class="tag ${TAG_VERIFICA[p.verifica][0]}">${TAG_VERIFICA[p.verifica][1]}</span>` : "-"}</td>
                        <td>${dataAdmin(p.created_at)}</td>
                        <td>
                          ${p.verifica !== "verificato" ? html`<button type="button" class="tab" data-verifica="verificato">Approva</button>` : ""}
                          ${p.verifica !== "rifiutato" ? html`<button type="button" class="tab" data-verifica="rifiutato">Rifiuta</button>` : ""}
                        </td>
                      </tr>`
                    )}
                  </tbody>
                </table>`}
          </div>`.s;
        el.querySelectorAll("[data-f]").forEach((btn) => {
          btn.addEventListener("click", () => disegna(righe, btn.getAttribute("data-f")));
        });
        el.querySelectorAll("[data-verifica]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const riga = righe.find((r) => r.id === btn.closest("tr").getAttribute("data-id"));
            if (riga) cambiaVerifica(riga, btn.getAttribute("data-verifica"), () => disegna(righe, filtro));
          });
        });
      }

      function cambiaVerifica(riga, stato, ridisegna) {
        const approva = stato === "verificato";
        const nome = riga.nome || "questo profilo";
        AC.ui.confirm({
          title: approva ? "Approva iscrizione" : "Rifiuta iscrizione",
          message: approva
            ? nome + " potrà entrare in AncheCasa con la sua mail e password."
            : nome + " non potrà entrare: al login vedrà che l'iscrizione non è stata approvata.",
          okLabel: approva ? "Approva" : "Rifiuta",
          danger: !approva
        }).then((ok) => {
          if (!ok) return;
          conTimeoutAdmin(window.acDb.rpc("imposta_verifica", { p_id: riga.id, p_stato: stato }), 25000).then((res) => {
            if (res.error) {
              toast("Non riesco a salvare: " + res.error.message, "error");
              return;
            }
            riga.verifica = stato;
            toast(approva ? "Iscrizione approvata" : "Iscrizione rifiutata");
            ridisegna();
          });
        });
      }

      Promise.all([
        conTimeoutAdmin(window.acDb.rpc("iscritti_admin"), 25000),
        conTimeoutAdmin(
          window.acDb.from("inviti_admin")
            .select("token, mail, famiglia, categoria, stato, creato_da, created_at")
            .in("famiglia", ["privato", "azienda"])
            .order("created_at", { ascending: false })
            .limit(500),
          25000
        ),
        conTimeoutAdmin(
          window.acDb.from("richieste_iscrizione")
            .select("id, famiglia, dati, user_id, stato, created_at")
            .in("famiglia", ["privato", "azienda"])
            .order("created_at", { ascending: false })
            .limit(500),
          25000
        )
      ]).then(([resProf, resInv, resRic]) => {
        if (resProf.error) {
          erroreAdmin(el, resProf.error.message, () => V.iscritti.render(el));
          return;
        }
        if (resInv.error) toast("Inviti non letti: " + resInv.error.message, "error");
        if (resRic.error) toast("Modulo web non letto: " + resRic.error.message, "error");
        const righe = arricchisci(resProf.data || [], resInv.data || [], resRic.data || []);
        disegna(righe, "");
      });
    }
  };

  function riassuntoDatiIscrizione(dati) {
    if (!dati) return "-";
    const pezzi = [];
    if (dati.nome) pezzi.push(dati.nome);
    if (dati.cognome) pezzi.push(dati.cognome);
    if (dati.ragione) pezzi.push(dati.ragione);
    if (dati.email) pezzi.push(dati.email);
    if (dati.zona) pezzi.push(dati.zona);
    return pezzi.length ? pezzi.join(" · ") : JSON.stringify(dati).slice(0, 80);
  }

  function nomeDaDati(dati) {
    if (!dati) return "Agente";
    const n = [dati.nome, dati.cognome].filter(Boolean).join(" ").trim();
    return n || dati.email || "Agente";
  }

  function rigaAllegato(lab, nome, url) {
    if (!nome && !url) return html`<li><strong>${lab}:</strong> non allegato</li>`;
    if (url) {
      return html`<li><strong>${lab}:</strong> <a href="${url}" target="_blank" rel="noopener">${nome || "Apri file"}</a></li>`;
    }
    return html`<li><strong>${lab}:</strong> ${nome} <span class="note">(solo nome file in candidatura)</span></li>`;
  }

  V["richieste-agenti"] = {
    title: "Richieste agenti",
    sub: "Candidature dal modulo Agente su anchecasa.it (curriculum e portfolio).",
    render(el) {
      if (!window.acDb) {
        erroreAdmin(el, "Supabase non è disponibile in questa pagina.", () => V["richieste-agenti"].render(el));
        return;
      }

      function carica() {
        el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
        conTimeoutAdmin(
          window.acDb.from("richieste_iscrizione")
            .select("id, famiglia, dati, stato, created_at, user_id")
            .eq("famiglia", "agente")
            .order("created_at", { ascending: false }),
          25000
        ).then((res) => {
          if (res.error) {
            erroreAdmin(el, res.error.message, carica);
            return;
          }
          disegnaElenco(res.data || []);
        });
      }

      function aggiornaStatoRichiesta(id, stato, patchDati, dopo) {
        const body = { stato: stato };
        if (patchDati) body.dati = patchDati;
        conTimeoutAdmin(
          window.acDb.from("richieste_iscrizione").update(body).eq("id", id),
          25000
        ).then((res) => {
          if (res.error) {
            toast("Non riesco a aggiornare: " + res.error.message, "error");
            return;
          }
          if (dopo) dopo();
        });
      }

      function vediAgente(r) {
        const d = r.dati || {};
        el.innerHTML = html`
          <div class="card">
            <div class="row-actions" style="margin-bottom:12px">
              <button type="button" class="tab" id="ra-indietro">Torna all’elenco</button>
            </div>
            <h2 style="margin:0 0 8px">${nomeDaDati(d)}</h2>
            <p class="note">Ricevuta il ${dataAdmin(r.created_at)}. Stato: ${TAG_STATO_ISCRIZIONE[r.stato] ? TAG_STATO_ISCRIZIONE[r.stato][1] : (r.stato || "-")}.</p>
            <dl class="ra-dl">
              <div><dt>Mail</dt><dd>${d.email || "-"}</dd></div>
              <div><dt>Telefono</dt><dd>${d.telefono || "-"}</dd></div>
              <div><dt>Città</dt><dd>${d.citta || "-"}</dd></div>
              <div><dt>Zona</dt><dd>${d.zona || "-"}</dd></div>
              <div class="full"><dt>Presentazione</dt><dd>${d.presentati || "-"}</dd></div>
            </dl>
            <h3 style="margin:18px 0 8px;font-size:15px">Allegati</h3>
            <ul class="ra-all">
              ${rigaAllegato("Curriculum", d.cv, d.cv_url)}
              ${rigaAllegato("Portfolio", d.portfolio, d.portfolio_url)}
            </ul>
            ${d.info_domande
              ? html`<p class="note" style="margin-top:16px">Ultima richiesta info (${dataAdmin(d.info_richiesta_at)}): ${d.info_domande}</p>`
              : ""}
            <div class="row-actions" style="margin-top:18px;gap:8px;flex-wrap:wrap">
              <button type="button" class="btn-mail" id="ra-info" ${d.email ? "" : "disabled"}>Richiedi altre info</button>
              <button type="button" class="btn-in" id="ra-approva" ${r.stato === "accettata" ? "disabled" : ""}>${r.stato === "accettata" ? "Già approvato" : "Approva agente"}</button>
            </div>
          </div>`.s;
        el.querySelector("#ra-indietro").addEventListener("click", carica);
        el.querySelector("#ra-info").addEventListener("click", () => richiediInfo(r, () => vediAgente(Object.assign({}, r, { dati: r.dati }))));
        el.querySelector("#ra-approva").addEventListener("click", () => approvaAgente(r, carica));
      }

      function richiediInfo(r, dopo) {
        const d = r.dati || {};
        if (!d.email) {
          toast("Questa candidatura non ha una mail.", "error");
          return;
        }
        AC.ui.form({
          title: "Richiedi altre info",
          intro: "Scrivi le domande. Si apre la mail verso " + d.email + " con il testo già pronto.",
          submitLabel: "Apri mail",
          fields: [
            {
              name: "domande",
              label: "Domande per l’agente",
              type: "textarea",
              rows: 6,
              required: true,
              full: true,
              placeholder: "Es. Può inviare un curriculum aggiornato e indicare le zone coperte nel 2025."
            }
          ],
          onSubmit(vals) {
            const domande = String(vals.domande || "").trim();
            if (!domande) return { error: "Scrivi almeno una domanda." };
            const nome = nomeDaDati(d);
            const oggetto = "AncheCasa — richieste informazioni candidatura agente";
            const corpo =
              "Gentile " + nome + ",\n\n" +
              "in merito alla Sua candidatura come agente su AncheCasa Le chiediamo quanto segue:\n\n" +
              domande + "\n\n" +
              "Può rispondere a questa mail con le informazioni e gli eventuali allegati.\n\n" +
              "Cordiali saluti,\nAncheCasa";
            const mailto =
              "mailto:" + encodeURIComponent(d.email) +
              "?subject=" + encodeURIComponent(oggetto) +
              "&body=" + encodeURIComponent(corpo);
            const nuovi = Object.assign({}, d, {
              info_domande: domande,
              info_richiesta_at: new Date().toISOString()
            });
            r.dati = nuovi;
            aggiornaStatoRichiesta(r.id, r.stato || "attesa", nuovi, () => {
              window.location.href = mailto;
              toast("Mail aperta verso " + d.email);
              if (dopo) dopo();
            });
            return {};
          }
        });
      }

      function approvaAgente(r, dopo) {
        const d = r.dati || {};
        const nome = nomeDaDati(d);
        if (!r.user_id) {
          toast("Manca l’account collegato: non posso abilitare l’agente.", "error");
          return;
        }
        AC.ui.confirm({
          title: "Approva agente",
          message: nome + " potrà entrare in AncheCasa come agente con la sua mail e password.",
          okLabel: "Approva agente"
        }).then((ok) => {
          if (!ok) return;
          conTimeoutAdmin(
            window.acDb.rpc("imposta_verifica", { p_id: r.user_id, p_stato: "verificato" }),
            25000
          ).then((res) => {
            if (res.error) {
              toast("Non riesco ad approvare: " + res.error.message, "error");
              return;
            }
            aggiornaStatoRichiesta(r.id, "accettata", null, () => {
              toast(nome + " abilitato come agente");
              if (dopo) dopo();
            });
          });
        });
      }

      function disegnaElenco(righe) {
        el.innerHTML = html`
          <div class="card">
            <p class="note">Elenco dalle candidature del modulo Agente (anchecasa.it → candidatura). Vedi i dati e gli allegati, chiedi altre info via mail, oppure approva e abilita l’agente.</p>
            ${!righe.length
              ? html`<p class="note">Nessuna richiesta agente per ora.</p>`
              : html`<table class="mini-table">
                  <thead><tr><th>Agente</th><th>Contatti</th><th>Zona</th><th>Stato</th><th>Ricevuta</th><th>Azioni</th></tr></thead>
                  <tbody>
                    ${righe.map(
                      (r, i) => {
                        const d = r.dati || {};
                        return html`<tr data-i="${i}">
                          <td>${nomeDaDati(d)}</td>
                          <td>${d.email || "-"}${d.telefono ? html`<br>${d.telefono}` : ""}</td>
                          <td>${d.zona || d.citta || "-"}</td>
                          <td>${TAG_STATO_ISCRIZIONE[r.stato] ? html`<span class="tag ${TAG_STATO_ISCRIZIONE[r.stato][0]}">${TAG_STATO_ISCRIZIONE[r.stato][1]}</span>` : (r.stato || "-")}${d.info_domande ? html`<br><small>Info richieste</small>` : ""}</td>
                          <td>${dataAdmin(r.created_at)}</td>
                          <td>
                            <span class="ra-azioni">
                              <button type="button" class="tab" data-act="vedi">Vedi agente</button>
                              <button type="button" class="btn-mail" data-act="info" ${d.email ? "" : "disabled"}>Richiedi altre info</button>
                              <button type="button" class="btn-in" data-act="approva" ${r.stato === "accettata" ? "disabled" : ""}>${r.stato === "accettata" ? "OK" : "Approva agente"}</button>
                            </span>
                          </td>
                        </tr>`;
                      }
                    )}
                  </tbody>
                </table>`}
          </div>`.s;

        el.onclick = (e) => {
          const btn = e.target.closest("[data-act]");
          const tr = btn && btn.closest("tr[data-i]");
          if (!tr) return;
          const r = righe[Number(tr.getAttribute("data-i"))];
          if (!r) return;
          const act = btn.getAttribute("data-act");
          if (act === "vedi") vediAgente(r);
          else if (act === "info") richiediInfo(r, carica);
          else if (act === "approva") approvaAgente(r, carica);
        };
      }

      carica();
    }
  };

  V.iscrizioni = {
    title: "Iscrizioni dal sito",
    sub: "Privati e aziende da iscriviti.html. Approvati in automatico. Agenti: vai su Richieste agenti.",
    render(el) {
      if (!window.acDb) {
        erroreAdmin(el, "Supabase non è disponibile in questa pagina.", () => V.iscrizioni.render(el));
        return;
      }

      function statoVisivo(r) {
        const d = r.dati || {};
        if (d.revoca_momentanea) return "revoca";
        if (d.integrazione_domande && r.stato !== "rifiutata") return "integrazione";
        if (r.stato === "accettata") return "accettata";
        return r.stato || "attesa";
      }

      function nomeIscritto(r) {
        const d = r.dati || {};
        if (r.famiglia === "azienda") return d.ragione || d.email || "Azienda";
        return nomeDaDati(d);
      }

      function aggiornaRichiesta(id, patch, dopo) {
        conTimeoutAdmin(
          window.acDb.from("richieste_iscrizione").update(patch).eq("id", id),
          25000
        ).then((res) => {
          if (res.error) {
            toast("Non riesco a aggiornare: " + res.error.message, "error");
            return;
          }
          if (dopo) dopo();
        });
      }

      function setVerifica(userId, stato) {
        if (!userId) return Promise.resolve({ error: { message: "manca l’account collegato" } });
        return conTimeoutAdmin(
          window.acDb.rpc("imposta_verifica", { p_id: userId, p_stato: stato }),
          25000
        );
      }

      // Privato e azienda: profilo approvato in automatico alla prima lettura in admin.
      function autoApprova(righe) {
        const daFare = righe.filter((r) => {
          const d = r.dati || {};
          return r.user_id && r.stato !== "accettata" && r.stato !== "rifiutata" && !d.revoca_momentanea && !d.auto_approvato;
        });
        if (!daFare.length) return Promise.resolve(righe);
        let catena = Promise.resolve();
        daFare.forEach((r) => {
          catena = catena.then(() =>
            setVerifica(r.user_id, "verificato").then((res) => {
              if (res.error) return;
              const nuovi = Object.assign({}, r.dati || {}, { auto_approvato: true, auto_approvato_at: new Date().toISOString() });
              r.dati = nuovi;
              r.stato = "accettata";
              return window.acDb.from("richieste_iscrizione").update({ stato: "accettata", dati: nuovi }).eq("id", r.id);
            })
          );
        });
        return catena.then(() => righe);
      }

      function carica() {
        el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
        conTimeoutAdmin(
          window.acDb.from("richieste_iscrizione")
            .select("id, famiglia, dati, stato, created_at, user_id")
            .in("famiglia", ["privato", "azienda"])
            .order("created_at", { ascending: false }),
          25000
        ).then((res) => {
          if (res.error) {
            erroreAdmin(el, res.error.message, carica);
            return;
          }
          autoApprova(res.data || []).then((righe) => disegnaElenco(righe));
        });
      }

      function vediProfilo(r) {
        const d = r.dati || {};
        const sv = statoVisivo(r);
        el.innerHTML = html`
          <div class="card">
            <div class="row-actions" style="margin-bottom:12px">
              <button type="button" class="tab" id="is-indietro">Torna all’elenco</button>
            </div>
            <h2 style="margin:0 0 8px">${nomeIscritto(r)}</h2>
            <p class="note">${LAB_FAMIGLIA_ADMIN[r.famiglia] || r.famiglia} · ricevuto il ${dataAdmin(r.created_at)} · ${TAG_STATO_ISCRIZIONE[sv] ? TAG_STATO_ISCRIZIONE[sv][1] : sv}</p>
            <dl class="ra-dl">
              ${r.famiglia === "azienda"
                ? html`<div><dt>Ragione sociale</dt><dd>${d.ragione || "-"}</dd></div>`
                : html`<div><dt>Nome</dt><dd>${d.nome || "-"}</dd></div><div><dt>Cognome</dt><dd>${d.cognome || "-"}</dd></div>`}
              <div><dt>Mail</dt><dd>${d.email || "-"}</dd></div>
              <div><dt>Zona / regione</dt><dd>${d.zona || "-"}</dd></div>
              <div><dt>Telefono</dt><dd>${d.telefono || "-"}</dd></div>
              <div><dt>Privacy</dt><dd>${d.privacy ? "Accettata" : "-"} ${d.privacy_at ? "(" + dataAdmin(d.privacy_at) + ")" : ""}</dd></div>
            </dl>
            ${d.integrazione_domande
              ? html`<p class="note" style="margin-top:16px">Ultima integrazione richiesta (${dataAdmin(d.integrazione_at)}): ${d.integrazione_domande}</p>`
              : ""}
            ${d.revoca_momentanea
              ? html`<p class="note" style="margin-top:8px">Accesso in revoca momentanea dal ${dataAdmin(d.revoca_momentanea_at)} (documenti in attesa).</p>`
              : ""}
            <div class="row-actions" style="margin-top:18px;gap:8px;flex-wrap:wrap">
              <button type="button" class="btn-mail" id="is-integra" ${d.email ? "" : "disabled"}>Chiedi integrazione</button>
              ${d.revoca_momentanea
                ? html`<button type="button" class="btn-in" id="is-ripristina">Ripristina accesso</button>`
                : html`<button type="button" class="tab" id="is-revoca">Revoca momentanea</button>`}
            </div>
          </div>`.s;
        el.querySelector("#is-indietro").addEventListener("click", carica);
        el.querySelector("#is-integra").addEventListener("click", () => chiediIntegrazione(r, () => vediProfilo(Object.assign({}, r, { dati: r.dati }))));
        const rev = el.querySelector("#is-revoca");
        if (rev) rev.addEventListener("click", () => revocaMomentanea(r, () => vediProfilo(Object.assign({}, r, { dati: r.dati }))));
        const rip = el.querySelector("#is-ripristina");
        if (rip) rip.addEventListener("click", () => ripristinaAccesso(r, () => vediProfilo(Object.assign({}, r, { dati: r.dati }))));
      }

      function chiediIntegrazione(r, dopo) {
        const d = r.dati || {};
        if (!d.email) {
          toast("Questa iscrizione non ha una mail.", "error");
          return;
        }
        AC.ui.form({
          title: "Chiedi integrazione",
          intro: "Scrivi cosa manca (documenti, dati). Si apre la mail verso " + d.email + ".",
          submitLabel: "Apri mail",
          fields: [
            {
              name: "domande",
              label: "Cosa chiedere",
              type: "textarea",
              rows: 6,
              required: true,
              full: true,
              placeholder: "Es. Serve copia del documento di identità e visura camerale aggiornata."
            }
          ],
          onSubmit(vals) {
            const domande = String(vals.domande || "").trim();
            if (!domande) return { error: "Scrivi almeno una richiesta." };
            const nome = nomeIscritto(r);
            const oggetto = "AncheCasa — richiesta integrazione documenti";
            const corpo =
              "Gentile " + nome + ",\n\n" +
              "per completare la Sua iscrizione ad AncheCasa Le chiediamo quanto segue:\n\n" +
              domande + "\n\n" +
              "Può rispondere a questa mail con i documenti e le informazioni richieste.\n\n" +
              "Cordiali saluti,\nAncheCasa";
            const mailto =
              "mailto:" + encodeURIComponent(d.email) +
              "?subject=" + encodeURIComponent(oggetto) +
              "&body=" + encodeURIComponent(corpo);
            const nuovi = Object.assign({}, d, {
              integrazione_domande: domande,
              integrazione_at: new Date().toISOString()
            });
            r.dati = nuovi;
            aggiornaRichiesta(r.id, { dati: nuovi }, () => {
              window.location.href = mailto;
              toast("Mail aperta verso " + d.email);
              if (dopo) dopo();
            });
            return {};
          }
        });
      }

      function revocaMomentanea(r, dopo) {
        const d = r.dati || {};
        AC.ui.confirm({
          title: "Revoca momentanea",
          message: "Sospende l’accesso di " + nomeIscritto(r) + " finché non arrivano i documenti. Potrà essere ripristinato subito dopo.",
          okLabel: "Revoca momentanea",
          danger: true
        }).then((ok) => {
          if (!ok) return;
          setVerifica(r.user_id, "attesa").then((res) => {
            if (res.error) {
              toast("Non riesco a sospendere: " + res.error.message, "error");
              return;
            }
            const nuovi = Object.assign({}, d, {
              revoca_momentanea: true,
              revoca_momentanea_at: new Date().toISOString()
            });
            r.dati = nuovi;
            aggiornaRichiesta(r.id, { dati: nuovi }, () => {
              toast("Accesso in revoca momentanea");
              if (dopo) dopo();
            });
          });
        });
      }

      function ripristinaAccesso(r, dopo) {
        const d = r.dati || {};
        AC.ui.confirm({
          title: "Ripristina accesso",
          message: "Riabilita " + nomeIscritto(r) + " come profilo approvato.",
          okLabel: "Ripristina"
        }).then((ok) => {
          if (!ok) return;
          setVerifica(r.user_id, "verificato").then((res) => {
            if (res.error) {
              toast("Non riesco a ripristinare: " + res.error.message, "error");
              return;
            }
            const nuovi = Object.assign({}, d);
            delete nuovi.revoca_momentanea;
            delete nuovi.revoca_momentanea_at;
            nuovi.ripristinato_at = new Date().toISOString();
            r.dati = nuovi;
            aggiornaRichiesta(r.id, { stato: "accettata", dati: nuovi }, () => {
              toast("Accesso ripristinato");
              if (dopo) dopo();
            });
          });
        });
      }

      function disegnaElenco(righe) {
        el.innerHTML = html`
          <div class="card">
            <p class="note">Solo privati e aziende. Il profilo è approvato in automatico. Da qui vedi i dati, chiedi integrazione documenti o fai una revoca momentanea. Le candidature agente stanno in Richieste agenti.</p>
            ${!righe.length
              ? html`<p class="note">Nessuna iscrizione privato o azienda per ora.</p>`
              : html`<table class="mini-table">
                  <thead><tr><th>Tipo</th><th>Profilo</th><th>Mail</th><th>Stato</th><th>Ricevuta</th><th>Azioni</th></tr></thead>
                  <tbody>
                    ${righe.map((r, i) => {
                      const d = r.dati || {};
                      const sv = statoVisivo(r);
                      return html`<tr data-i="${i}">
                        <td>${LAB_FAMIGLIA_ADMIN[r.famiglia] || r.famiglia}</td>
                        <td>${nomeIscritto(r)}</td>
                        <td>${d.email || "-"}</td>
                        <td>${TAG_STATO_ISCRIZIONE[sv] ? html`<span class="tag ${TAG_STATO_ISCRIZIONE[sv][0]}">${TAG_STATO_ISCRIZIONE[sv][1]}</span>` : sv}</td>
                        <td>${dataAdmin(r.created_at)}</td>
                        <td>
                          <span class="ra-azioni">
                            <button type="button" class="tab" data-act="vedi">Vedi profilo</button>
                            <button type="button" class="btn-mail" data-act="integra" ${d.email ? "" : "disabled"}>Chiedi integrazione</button>
                            ${d.revoca_momentanea
                              ? html`<button type="button" class="btn-in" data-act="ripristina">Ripristina</button>`
                              : html`<button type="button" class="tab" data-act="revoca">Revoca momentanea</button>`}
                          </span>
                        </td>
                      </tr>`;
                    })}
                  </tbody>
                </table>`}
          </div>`.s;

        el.onclick = (e) => {
          const btn = e.target.closest("[data-act]");
          const tr = btn && btn.closest("tr[data-i]");
          if (!tr) return;
          const r = righe[Number(tr.getAttribute("data-i"))];
          if (!r) return;
          const act = btn.getAttribute("data-act");
          if (act === "vedi") vediProfilo(r);
          else if (act === "integra") chiediIntegrazione(r, carica);
          else if (act === "revoca") revocaMomentanea(r, carica);
          else if (act === "ripristina") ripristinaAccesso(r, carica);
        };
      }

      carica();
    }
  };

  // Genera link: stesso HTML option del profilo (opzioniCategoriaLink = buildOpzioniCategorie).
  const CATEGORIE_LINK_MAP = { privato: { famiglia: "privato", area: "", label: CATEGORIA_PRIVATO[1] } };
  CATEGORIE_LINK.forEach((g) => {
    g.voci.forEach((v) => {
      CATEGORIE_LINK_MAP[v[0]] = { famiglia: g.famiglia, area: g.area, label: v[1] };
    });
  });

  V["genera-link"] = {
    title: "Genera link",
    sub: "Invito mirato: privato, agente o azienda con il tipo giusto. Traccia apertura e iscrizione.",
    render(el) {
      if (!window.acDb) {
        erroreAdmin(el, "Supabase non è disponibile in questa pagina.", () => V["genera-link"].render(el));
        return;
      }

      function disegnaForm() {
        el.innerHTML = html`
          <div class="card">
            <p class="note">Il link apre una pagina di benvenuto con la mail dell’invito: la persona sceglie solo la password ed entra, poi compila il profilo dal pannello. Si segna da solo quando viene aperto e quando la persona si iscrive. Dopo Genera link la riga compare in cima all’elenco: da lì parti la mail AncheCasa con Invio mail.</p>
            <form id="f-gen">
              <div class="fields tre">
                <div class="field"><label for="categoria">Categoria</label>
                  <select id="categoria" name="categoria">${opzioniCategoriaLink()}</select>
                </div>
                <div class="field"><label for="mail-invito">Mail</label><input id="mail-invito" name="mail" type="email" required></div>
                <div class="field"><label for="tel-invito">Telefono</label><input id="tel-invito" name="telefono" type="tel" placeholder="es. 333 1234567" autocomplete="off"></div>
              </div>
              <div class="row-actions" style="margin-top:12px"><button class="btn-in" type="submit">Genera link</button></div>
            </form>
          </div>
          <div class="card" id="tabella-inviti" style="margin-top:12px;"><p class="note">Caricamento invii precedenti…</p></div>`.s;

        el.querySelector("#f-gen").addEventListener("submit", (e) => {
          e.preventDefault();
          const form = e.target;
          const id = form.elements.categoria.value;
          const mail = form.elements.mail.value.trim();
          const telefono = form.elements.telefono.value.trim();
          const info = CATEGORIE_LINK_MAP[id];
          if (!info) return;
          if (!mail) {
            toast("Inserisci la mail.", "error");
            return;
          }
          if (!form.elements.mail.checkValidity()) {
            toast("La mail non sembra valida.", "error");
            return;
          }
          if (telefono && numeroWhatsApp(telefono).length < 8) {
            toast("Il telefono non sembra valido.", "error");
            return;
          }
          const famiglia = info.famiglia;
          const categoriaTesto = info.area ? info.area + " - " + info.label : info.label;
          const btn = form.querySelector('button[type="submit"]');
          if (btn) btn.disabled = true;
          window.acDb.from("inviti_admin")
            // categoria_id = il codice (azienda_...): è quello che il Profilo riconosce; categoria resta il testo leggibile.
            .insert({ famiglia: famiglia, categoria: categoriaTesto, categoria_id: famiglia === "azienda" ? id : null, mail: mail || null, telefono: telefono || null })
            .select("token")
            .single()
            .then((res) => {
              if (btn) btn.disabled = false;
              if (res.error) {
                toast("Non riesco a salvare l'invito: " + res.error.message, "error");
                return;
              }
              toast("Link creato: compare in cima all’elenco");
              form.reset();
              caricaInviti();
            });
        });
      }

      function caricaInviti() {
        const mount = el.querySelector("#tabella-inviti");
        if (!mount) return;
        // L'admin vede qui solo i propri inviti (quelli fatti da lui o precedenti a creato_da):
        // gli inviti degli utenti li approvano loro stessi, l'admin non li gestisce.
        conTimeoutAdmin(
          window.acDb.auth.getSession().then((s) => {
            const uid = s.data && s.data.session ? s.data.session.user.id : "";
            return window.acDb.from("inviti_admin")
              .select("token, mail, telefono, famiglia, categoria, stato, created_at, inviato_at")
              .or("creato_da.is.null,creato_da.eq." + uid)
              .order("created_at", { ascending: false })
              .limit(30);
          }),
          25000
        ).then((res) => {
          if (!el.isConnected) return;
          const mountNow = el.querySelector("#tabella-inviti");
          if (!mountNow) return;
          if (res.error) {
            mountNow.innerHTML = html`<p class="note">Non riesco a leggere gli inviti precedenti (${res.error.message}).</p>`.s;
            return;
          }
          const righe = res.data || [];
          mountNow.innerHTML = !righe.length
            ? html`<p class="note">Nessun invito ancora creato.</p>`.s
            : html`<table class="mini-table">
                <thead><tr><th>Contatto</th><th>Categoria</th><th>Stato</th><th>Creato il</th><th>Mail</th></tr></thead>
                <tbody>
                  ${righe.map(
                    (r, i) => html`<tr class="${i === 0 && !r.inviato_at ? "inv-nuovo" : ""}">
                      <td>${r.mail || ""}${r.mail && r.telefono ? html`<br>` : ""}${r.telefono || ""}</td>
                      <td>${r.categoria || LAB_FAMIGLIA_ADMIN[r.famiglia] || r.famiglia}</td>
                      <td>${TAG_STATO_INVITO[r.stato] ? html`<span class="tag ${TAG_STATO_INVITO[r.stato][0]}">${TAG_STATO_INVITO[r.stato][1]}</span>` : r.stato}${r.inviato_at ? html`<br><small>Mail inviata il ${dataAdmin(r.inviato_at)}</small>` : ""}</td>
                      <td>${dataAdmin(r.created_at)}</td>
                      <td><span data-riga="${i}">${tastoInviaMail(r)}</span></td>
                    </tr>`
                  )}
                </tbody>
              </table>`.s;
          // onclick e non addEventListener: la tabella si ricarica dopo ogni invio e i gestori
          // si accumulerebbero (un clic su Invia mail spedirebbe più mail).
          mountNow.onclick = (e) => {
            const btn = e.target.closest("[data-azione]");
            const wrap = btn && btn.closest("[data-riga]");
            if (!wrap) return;
            const r = righe[Number(wrap.getAttribute("data-riga"))];
            if (r) {
              condividiInvito(btn.getAttribute("data-azione"), {
                mail: r.mail,
                telefono: r.telefono,
                token: r.token,
                url: linkInvito(r.token, r.famiglia),
                famiglia: r.famiglia
              }, caricaInviti);
            }
          };
        });
      }

      disegnaForm();
      caricaInviti();
    }
  };

  AC.views = V;
})();
