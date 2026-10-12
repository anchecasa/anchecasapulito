/* PULSANTI PER PROFILO (12.10.2026, su richiesta esplicita di Nando).
   Ogni dashboard parte vuota. L'admin decide, profilo per profilo e pulsante per pulsante,
   cosa si vede: Nascosto, Gratis o A pagamento. Prima si fissano i gratuiti, poi quelli a pagamento.
   Le scelte stanno in marketplace.app_impostazioni, chiave «pulsanti_profili»
   (tutti gli iscritti leggono, solo l'admin scrive: regole già sul database, app-02).
   Forma: { profili: { "<profilo>": { voci: { "<id pulsante>": "gratis" | "pagamento" }, salvato, da } } }
   Un pulsante che non c'è nell'elenco è nascosto. Un profilo mai salvato non vede nessun pulsante.
   Restano sempre: Bacheca (dal logo), Profilo, Impostazioni, Esci. L'admin non è toccato.
   Anteprima locale (?demo=…): le scelte stanno nel browser, non sul database. */
(function () {
  const AC = window.AC;
  const { html, icon } = AC.ui;
  const V = AC.views;
  const CHIAVE = "pulsanti_profili";
  const DEMO = /[?&]demo=/.test(location.search);
  const LOCALE = "ac-demo-pulsanti-profili";

  let config = { profili: {} };
  let caricato = false;

  function pulisci(v) {
    const out = { profili: {} };
    const p = v && v.profili;
    if (p && typeof p === "object") {
      Object.keys(p).forEach((k) => {
        const voci = (p[k] && p[k].voci) || {};
        const pulite = {};
        Object.keys(voci).forEach((id) => {
          if (voci[id] === "gratis" || voci[id] === "pagamento") pulite[id] = voci[id];
        });
        out.profili[k] = { voci: pulite, salvato: p[k].salvato || "", da: p[k].da || "" };
      });
    }
    return out;
  }

  function locale() {
    try { config = pulisci(JSON.parse(localStorage.getItem(LOCALE) || "{}")); } catch (e) { config = { profili: {} }; }
    caricato = true;
    return config;
  }
  function daDb() {
    return window.acDb.from("app_impostazioni").select("valore").eq("chiave", CHIAVE).maybeSingle();
  }

  function carica() {
    if (DEMO) {
      // 12.10.2026 «Guarda come»: se nel browser c'è l'accesso dell'admin, l'anteprima usa le scelte vere
      // salvate su Supabase (solo lettura). Senza accesso, quelle di prova del browser.
      if (!window.acDb || !window.acDb.auth) return Promise.resolve(locale());
      return window.acDb.auth.getSession().then((r) => {
        if (!(r && r.data && r.data.session)) return locale();
        return daDb().then((res) => {
          if (res && !res.error && res.data) { config = pulisci(res.data.valore); caricato = true; return config; }
          return locale();
        }, () => locale());
      }, () => locale());
    }
    if (!window.acDb) { caricato = true; return Promise.resolve(config); }
    return daDb()
      .then((res) => {
        // Se la lettura non riesce, nessun pulsante: meglio vuoto che tutto aperto.
        config = res && !res.error && res.data ? pulisci(res.data.valore) : { profili: {} };
        caricato = true;
        return config;
      }, () => { config = { profili: {} }; caricato = true; return config; });
  }

  function salvaTutto(nuova) {
    const valore = pulisci(nuova);
    if (DEMO) {
      try { localStorage.setItem(LOCALE, JSON.stringify(valore)); } catch (e) {}
      config = valore;
      return Promise.resolve(valore);
    }
    return window.acDb.from("app_impostazioni")
      .upsert({ chiave: CHIAVE, valore: valore, aggiornato: new Date().toISOString() }, { onConflict: "chiave" })
      .then((res) => {
        if (res.error) throw new Error(res.error.message || "salvataggio non riuscito");
        config = valore;
        return valore;
      });
  }

  /** "gratis" | "pagamento" | "" (nascosto) per il pulsante id del profilo. */
  function stato(profilo, id) {
    const p = config.profili[profilo];
    return (p && p.voci[id]) || "";
  }

  AC.pulsanti = { carica, stato, caricato: () => caricato };

  /* ---------- pagina admin ---------- */
  const SCELTE = [
    ["", "Nascosto"],
    ["gratis", "Gratis"],
    ["pagamento", "A pagamento"]
  ];
  let scelto = "";        // profilo aperto nella pagina
  let bozza = null;       // copia delle voci del profilo aperto, finché non si salva
  let filtro = "tutti";   // tutti | gratis | pagamento | nascosti

  const dataOra = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleString("it-IT", { timeZone: "Europe/Rome", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  function conta(voci, lista) {
    let g = 0, a = 0;
    lista.forEach((it) => { if (voci[it.id] === "gratis") g++; else if (voci[it.id] === "pagamento") a++; });
    return { g, a, n: lista.length - g - a };
  }

  V.pulsanti = {
    title: "Pulsanti per profilo",
    sub: "Decidi tu cosa vede ogni profilo: prima i gratuiti, poi quelli a pagamento.",
    render(el) {
      const profili = (AC.profiliPulsanti && AC.profiliPulsanti()) || [];
      if (!profili.length) {
        el.innerHTML = html`<div class="card empty"><strong>Elenco dei profili non disponibile</strong><span>Ricarica la pagina.</span></div>`.s;
        return;
      }
      if (!profili.some((p) => p.k === scelto)) { scelto = profili[0].k; bozza = null; }
      const prof = profili.find((p) => p.k === scelto);
      const lista = AC.catalogoPulsanti(prof);
      const salvato = config.profili[scelto];
      if (!bozza) bozza = Object.assign({}, (salvato && salvato.voci) || {});
      const modificato = JSON.stringify(bozza) !== JSON.stringify((salvato && salvato.voci) || {});
      const c = conta(bozza, lista);

      const gruppi = [];
      lista.forEach((it) => {
        let g = gruppi.find((x) => x.lab === it.gruppoLab);
        if (!g) { g = { lab: it.gruppoLab, voci: [] }; gruppi.push(g); }
        g.voci.push(it);
      });
      const passa = (it) => {
        const s = bozza[it.id] || "";
        return filtro === "tutti" || (filtro === "nascosti" ? s === "" : s === filtro);
      };

      el.innerHTML = html`
        ${DEMO ? html`<p class="note">Anteprima: le scelte restano in questo browser, non vanno sul database.</p>` : ""}
        <div class="pp">
          <aside class="pp-profili" aria-label="Profili">
            ${profili.map((p) => {
              const sv = config.profili[p.k];
              const n = sv ? Object.keys(sv.voci).length : 0;
              return html`<button type="button" class="pp-prof${p.k === scelto ? " on" : ""}" data-prof="${p.k}">
                <b>${p.nome}</b><small>${sv ? n + " pulsanti visibili" : "Mai salvato: vede solo la bacheca"}</small>
              </button>`;
            })}
          </aside>
          <section class="pp-corpo">
            <div class="pp-testa">
              <div>
                <h2>${prof.nome}</h2>
                <p class="note">${salvato ? "Salvato il " + dataOra(salvato.salvato) + (salvato.da ? " da " + salvato.da : "") : "Non ancora salvato: oggi questo profilo non vede nessun pulsante."}</p>
              </div>
              <div class="pp-conti">
                ${prof.famiglia === "privato" || prof.famiglia === "agente" || prof.k === "azienda:impresa"
                  ? html`<a class="pp-guarda" href="index.html?demo=${prof.famiglia}#/${prof.famiglia}/bacheca" target="_blank" rel="noopener" title="Si apre in una scheda nuova, senza password, con dati di esempio e i pulsanti salvati">Guarda come ${prof.nome}</a>`
                  : ""}
                <span class="pp-c sw-ok">${c.g} gratis</span>
                <span class="pp-c sw-off">${c.a} a pagamento</span>
                <span class="pp-c pp-grigio">${c.n} nascosti</span>
              </div>
            </div>
            <div class="pp-barra">
              <div class="pp-filtri" role="group" aria-label="Mostra">
                ${[["tutti", "Tutti"], ["gratis", "Gratis"], ["pagamento", "A pagamento"], ["nascosti", "Nascosti"]].map(([k, l]) =>
                  html`<button type="button" class="pp-f${filtro === k ? " on" : ""}" data-filtro="${k}">${l}</button>`)}
              </div>
              <div class="pp-azioni">
                <button type="button" class="tab" data-tutti="">Nascondi tutti</button>
                <button type="button" class="tab" data-tutti="gratis">Tutti gratis</button>
              </div>
            </div>
            ${gruppi.map((g) => {
              const voci = g.voci.filter(passa);
              if (!voci.length) return "";
              return html`<div class="pp-gruppo">
                <h3>${g.lab}</h3>
                ${voci.map((it) => {
                  const s = bozza[it.id] || "";
                  return html`<div class="pp-riga">
                    <span class="pp-nome">${icon(it.icon)}${it.label}${it.nota ? html`<small>${it.nota}</small>` : ""}</span>
                    <span class="pp-scelte" role="radiogroup" aria-label="${it.label}">
                      ${SCELTE.map(([v, l]) => html`<button type="button" role="radio" aria-checked="${s === v ? "true" : "false"}" class="pp-s pp-s-${v || "no"}${s === v ? " on" : ""}" data-id="${it.id}" data-v="${v}">${l}</button>`)}
                    </span>
                  </div>`;
                })}
              </div>`;
            })}
            <div class="pp-piede">
              <span class="note" id="pp-msg">${modificato ? "Ci sono modifiche non salvate." : ""}</span>
              <button type="button" class="btn-ghost" id="pp-annulla"${modificato ? "" : " disabled"}>Annulla</button>
              <button type="button" class="btn-in pp-salva" id="pp-salva"${modificato || !salvato ? "" : " disabled"}>Salva ${prof.nome}</button>
            </div>
          </section>
        </div>`.s;

      const ridisegna = () => V.pulsanti.render(el);
      el.querySelectorAll("[data-prof]").forEach((b) => b.addEventListener("click", () => {
        if (modificato && !confirmaCambio()) return;
        scelto = b.getAttribute("data-prof"); bozza = null; ridisegna();
      }));
      el.querySelectorAll("[data-filtro]").forEach((b) => b.addEventListener("click", () => { filtro = b.getAttribute("data-filtro"); ridisegna(); }));
      el.querySelectorAll("[data-tutti]").forEach((b) => b.addEventListener("click", () => {
        const v = b.getAttribute("data-tutti");
        lista.forEach((it) => { if (v) bozza[it.id] = v; else delete bozza[it.id]; });
        ridisegna();
      }));
      el.querySelectorAll(".pp-s").forEach((b) => b.addEventListener("click", () => {
        const id = b.getAttribute("data-id"); const v = b.getAttribute("data-v");
        if (v) bozza[id] = v; else delete bozza[id];
        ridisegna();
      }));
      const ann = el.querySelector("#pp-annulla");
      if (ann) ann.addEventListener("click", () => { bozza = null; ridisegna(); });
      const sal = el.querySelector("#pp-salva");
      if (sal) sal.addEventListener("click", () => {
        sal.disabled = true;
        const msg = el.querySelector("#pp-msg");
        if (msg) msg.textContent = "Salvataggio…";
        const nuova = JSON.parse(JSON.stringify(config));
        // Solo i pulsanti che esistono per questo profilo.
        const voci = {};
        lista.forEach((it) => { if (bozza[it.id]) voci[it.id] = bozza[it.id]; });
        nuova.profili[scelto] = { voci, salvato: new Date().toISOString(), da: (AC.adminNome && AC.adminNome()) || "" };
        // Prima si rilegge dal database, così non si cancellano le scelte salvate da un altro admin nel frattempo.
        carica().then(() => {
          const fresca = JSON.parse(JSON.stringify(config));
          fresca.profili[scelto] = nuova.profili[scelto];
          return salvaTutto(fresca);
        }).then(() => {
          bozza = null;
          if (AC.ui.toast) AC.ui.toast("Salvato: " + prof.nome);
          ridisegna();
        }).catch((err) => {
          sal.disabled = false;
          if (msg) msg.textContent = "Non salvato: " + (err.message || String(err));
        });
      });
    }
  };

  function confirmaCambio() {
    // Niente finestre del browser: la bozza non salvata si perde, e lo si dice prima nel messaggio.
    const m = document.getElementById("pp-msg");
    if (m && m.getAttribute("data-avvisato") !== "1") {
      m.textContent = "Hai modifiche non salvate. Salva, Annulla, oppure clicca di nuovo sul profilo per lasciarle.";
      m.setAttribute("data-avvisato", "1");
      return false;
    }
    return true;
  }
})();
