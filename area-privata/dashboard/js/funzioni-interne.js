/* ADMIN · funzioni interne (11.10.2026, su richiesta esplicita).
   Terranova, Gare private e AncheBIM sono tasti di AncheCasa, non siti a parte.
   Stesso progetto Supabase dell'area privata. Anteprima: ?demo=admin mostra esempi. */
(function () {
  const AC = window.AC;
  const { html } = AC.ui;
  const V = AC.views;
  const DEMO = /[?&]demo=admin/.test(location.search);

  const dataIt = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleString("it-IT", { timeZone: "Europe/Rome", day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const euro = (n) => {
    if (n == null || n === "") return "Importo non indicato";
    const x = Number(n);
    if (!isFinite(x)) return "Importo non indicato";
    return x.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
  };
  const manca = (err) => err && /does not exist|schema cache|PGRST20[0-9]|Invalid schema/i.test(err.message || "");

  const STATO_TN = {
    analyzing: "In analisi",
    ready_for_offer: "Pronta per l'offerta",
    submitted: "Presentata",
    won: "Vinta",
    lost: "Persa"
  };
  const STATO_GARA = {
    bozza: "Bozza",
    pubblicata: "Aperta",
    chiusa: "Chiusa",
    aggiudicata: "Aggiudicata",
    annullata: "Annullata"
  };

  function corpo(righe, riga) {
    if (!righe.length) {
      return html`<div class="card empty"><strong>Niente da mostrare</strong><span>L'elenco è vuoto, oppure questo accesso non legge ancora i dati.</span></div>`;
    }
    return html`<div class="tk-lista">${righe.map(riga)}</div>`;
  }

  function pagina(el, view, carica, disegnaRiga, vuotoSchema) {
    el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
    carica().then((d) => {
      const avviso = d.manca
        ? html`<div class="card empty"><strong>${vuotoSchema}</strong><span>Il tasto resta in AncheCasa. I dati compaiono quando lo schema è sullo stesso Supabase.</span></div>`
        : d.esempio
          ? html`<p class="note">Esempio. Con l'accesso vero si leggono i dati dello stesso Supabase di AncheCasa.</p>`
          : "";
      const sotto = d.manca ? "" : corpo(d.righe, disegnaRiga);
      el.innerHTML = html`${avviso}${sotto}`.s;
    }).catch((err) => {
      el.innerHTML = html`<div class="card empty"><strong>Non riesco a leggere</strong><span>${err.message || String(err)}</span></div>
        <div class="row-actions"><button type="button" class="tab" id="fn-riprova">Riprova</button></div>`.s;
      const b = el.querySelector("#fn-riprova");
      if (b) b.addEventListener("click", () => view.render(el));
    });
  }

  function caricaTerranova() {
    if (DEMO || !window.acDb || typeof window.acDb.schema !== "function") {
      return Promise.resolve({
        esempio: true,
        righe: [
          { id: "e1", tender_title: "Lavori di manutenzione scuola", contracting_authority: "Comune di Teano", municipality: "Teano", status: "analyzing", submission_deadline: "2026-11-20", budget_amount: 480000 },
          { id: "e2", tender_title: "Efficientamento palestra", contracting_authority: "Comune di Teano", municipality: "Teano", status: "ready_for_offer", submission_deadline: "2026-12-02", budget_amount: 210000 }
        ]
      });
    }
    return window.acDb.schema("terranova").from("tenders")
      .select("id, tender_title, contracting_authority, municipality, status, submission_deadline, budget_amount")
      .order("submission_deadline", { ascending: true })
      .limit(40)
      .then((res) => {
        if (res.error) {
          if (manca(res.error)) return { manca: true, righe: [] };
          throw new Error(res.error.message || "lettura non riuscita");
        }
        return { righe: res.data || [], esempio: false };
      });
  }

  function rigaTerranova(r) {
    return html`<article class="tk">
      <div class="tk-testa">
        <span class="tk-titolo">${r.tender_title}</span>
        <span class="tk-n">${STATO_TN[r.status] || r.status}</span>
        <span class="tk-meta">${euro(r.budget_amount)}</span>
        <span class="tk-scad">${dataIt(r.submission_deadline) || "Termine non indicato"}</span>
      </div>
      <p class="tk-meta">${r.contracting_authority || ""}${r.municipality ? " · " + r.municipality : ""}</p>
    </article>`;
  }

  function caricaGare() {
    if (DEMO || !window.acDb) {
      return Promise.resolve({
        esempio: true,
        righe: [
          { id: "g1", titolo: "Impianto elettrico palazzo", stato: "pubblicata", scadenza: "2026-11-15", budget: 90000 },
          { id: "g2", titolo: "Infissi piano terra", stato: "bozza", scadenza: null, budget: 24000 }
        ]
      });
    }
    return window.acDb.from("app_ep_gare")
      .select("id, titolo, stato, scadenza, budget")
      .order("creato", { ascending: false })
      .limit(40)
      .then((res) => {
        if (res.error) {
          if (manca(res.error)) return { manca: true, righe: [] };
          throw new Error(res.error.message || "lettura non riuscita");
        }
        return { righe: res.data || [], esempio: false };
      });
  }

  function rigaGara(r) {
    return html`<article class="tk">
      <div class="tk-testa">
        <span class="tk-titolo">${r.titolo}</span>
        <span class="tk-n">${STATO_GARA[r.stato] || r.stato}</span>
        <span class="tk-meta">${euro(r.budget)}</span>
        <span class="tk-scad">${dataIt(r.scadenza) || "Scadenza non indicata"}</span>
      </div>
    </article>`;
  }

  V.terranova = {
    title: "Terranova",
    sub: "Analisi delle gare d'appalto, dentro AncheCasa.",
    render(el) {
      pagina(el, V.terranova, caricaTerranova, rigaTerranova, "Terranova non è ancora leggibile da questa pagina");
    }
  };

  V["gare-private"] = {
    title: "Gare private",
    sub: "Gare e subappalti tra aziende della rete, dentro AncheCasa.",
    render(el) {
      pagina(el, V["gare-private"], caricaGare, rigaGara, "Le gare private non sono ancora nel database");
    }
  };

  V.anchebim = {
    title: "AncheBIM",
    sub: "Controllo dei disegni, dentro AncheCasa.",
    render(el) {
      const esempio = DEMO
        ? html`<p class="note">Esempio. Il controllo vero confronta X, Y e Z in millimetri, al millesimo.</p>
          <div class="tk-lista">
            <article class="tk"><div class="tk-testa"><span class="tk-titolo">Planimetria piano terra</span><span class="tk-n">Coerente</span></div><p class="tk-meta">X, Y e Z entro il millesimo.</p></article>
            <article class="tk"><div class="tk-testa"><span class="tk-titolo">Sezione A-A</span><span class="tk-n">Da rivedere</span></div><p class="tk-meta">La quota Z del secondo piano non coincide.</p></article>
          </div>`
        : html`<div class="card"><p>AncheBIM è il tasto che controlla un disegno: assi X, Y e Z in millimetri, al millesimo. Sta in questa area, sullo stesso Supabase di AncheCasa.</p></div>`;
      el.innerHTML = esempio.s;
    }
  };
})();
