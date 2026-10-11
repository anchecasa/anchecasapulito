/* ADMIN · Bandi (11.10.2026, su richiesta esplicita).
   AncheBandi è un software di AncheCasa e sta in questa dashboard, non su un sito a parte.
   Legge public.anchebandi_feed_items (schema AncheBandi, stesso progetto Supabase).
   Anteprima locale: ?demo=admin mostra gare di esempio, con la scritta Esempio. */
(function () {
  const AC = window.AC;
  const { html } = AC.ui;
  const V = AC.views;
  const DEMO = /[?&]demo=admin/.test(location.search);
  const ui = { q: "", aperto: "" };

  const KIND = {
    bando: "Bando",
    avviso: "Avviso",
    elenco_operatori: "Elenco operatori",
    sistema_qualificazione: "Sistema di qualificazione",
    preinformazione: "Preinformazione",
    esito: "Esito"
  };
  const LIFE = {
    pubblicato: "Pubblicato",
    rettificato: "Rettificato",
    sospeso: "Sospeso",
    annullato: "Annullato",
    aggiudicato: "Aggiudicato"
  };

  const euro = (cents) => {
    if (cents == null || cents === "") return "Importo non indicato";
    const n = Number(cents) / 100;
    return n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
  };
  const dataIt = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleString("it-IT", { timeZone: "Europe/Rome", day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const timeout = (pr, ms) => Promise.race([
    pr,
    new Promise((r) => setTimeout(() => r({ error: { message: "il server non risponde" } }), ms))
  ]);
  const manca = (err) => err && /does not exist|schema cache|anchebandi_|PGRST20[0-9]/i.test(err.message || "");

  function esempi() {
    return [
      {
        id: "esempio-1",
        kind: "bando",
        title: "Lavori di manutenzione della scuola comunale",
        contracting_authority: "Comune di Teano",
        municipality: "Teano",
        province: "CE",
        region: "Campania",
        amount_cents: 18000000,
        submission_deadline: "2026-11-20T12:00:00Z",
        published_at: "2026-10-02T08:00:00Z",
        cig_code: "Esempio",
        lifecycle_status: "pubblicato"
      },
      {
        id: "esempio-2",
        kind: "avviso",
        title: "Indagine di mercato per il servizio di pulizia",
        contracting_authority: "Azienda sanitaria locale di Caserta",
        municipality: "Caserta",
        province: "CE",
        region: "Campania",
        amount_cents: 9500000,
        submission_deadline: "2026-10-28T16:00:00Z",
        published_at: "2026-10-08T09:30:00Z",
        cig_code: "Esempio",
        lifecycle_status: "pubblicato"
      },
      {
        id: "esempio-3",
        kind: "esito",
        title: "Aggiudicazione lavori stradali",
        contracting_authority: "Provincia di Caserta",
        municipality: "Caserta",
        province: "CE",
        region: "Campania",
        amount_cents: 42000000,
        submission_deadline: null,
        published_at: "2026-09-18T10:00:00Z",
        cig_code: "Esempio",
        lifecycle_status: "aggiudicato"
      }
    ];
  }

  function luogo(r) {
    return [r.municipality, r.province, r.region].filter(Boolean).join(", ");
  }

  function testoCerca(r) {
    return [r.title, r.contracting_authority, r.cig_code, r.municipality, r.province, r.region, KIND[r.kind] || r.kind]
      .filter(Boolean).join(" ").toLowerCase();
  }

  function filtra(righe) {
    const q = ui.q.trim().toLowerCase();
    if (!q) return righe;
    return righe.filter((r) => testoCerca(r).indexOf(q) >= 0);
  }

  async function carica() {
    if (DEMO || !window.acDb) return { righe: esempi(), esempio: true };
    const res = await timeout(
      window.acDb.schema("public").from("anchebandi_feed_items")
        .select("id,kind,title,contracting_authority,municipality,province,region,amount_cents,submission_deadline,published_at,cig_code,lifecycle_status,summary,sector,procedure_type")
        .order("published_at", { ascending: false })
        .limit(80),
      20000
    );
    if (res.error) {
      if (manca(res.error)) return { manca: true, righe: [] };
      throw new Error(res.error.message || "lettura non riuscita");
    }
    return { righe: res.data || [], esempio: false };
  }

  function scheda(r) {
    const pezzi = [
      ["Ente", r.contracting_authority],
      ["Luogo", luogo(r)],
      ["Importo", euro(r.amount_cents)],
      ["Tipo", KIND[r.kind] || r.kind],
      ["Stato", LIFE[r.lifecycle_status] || r.lifecycle_status],
      ["Pubblicata", dataIt(r.published_at)],
      ["Termine", dataIt(r.submission_deadline) || "Non indicato"],
      ["CIG", r.cig_code],
      ["Settore", r.sector],
      ["Procedura", r.procedure_type]
    ].filter((x) => x[1]);
    return html`<dl class="tk-dett">${pezzi.map((x) => html`<div><dt class="tk-meta">${x[0]}</dt><dd>${x[1]}</dd></div>`)}</dl>
      ${r.summary ? html`<p class="tk-desc">${r.summary}</p>` : ""}`;
  }

  function riga(r) {
    const aperta = ui.aperto === r.id;
    return html`<article class="tk">
      <div class="tk-testa">
        <button type="button" class="tk-titolo" data-bd="${r.id}">${r.title}</button>
        <span class="tk-n">${KIND[r.kind] || r.kind}</span>
        <span class="tk-meta">${euro(r.amount_cents)}</span>
        <span class="tk-scad">${dataIt(r.submission_deadline) || dataIt(r.published_at)}</span>
      </div>
      <p class="tk-meta">${r.contracting_authority}${luogo(r) ? " · " + luogo(r) : ""}</p>
      ${aperta ? scheda(r) : ""}
    </article>`;
  }

  function disegna(el, d) {
    const viste = filtra(d.righe || []);
    const avviso = d.manca
      ? html`<div class="card empty"><strong>Le gare non sono ancora nel database</strong><span>Manca lo schema AncheBandi su Supabase. Il software resta in questa pagina admin.</span></div>`
      : d.esempio
        ? html`<p class="note">Esempio. I dati veri compaiono dopo le migrazioni AncheBandi su Supabase.</p>`
        : "";
    const lista = !d.manca && viste.length === 0
      ? html`<div class="card empty"><strong>Nessuna gara da mostrare</strong><span>${ui.q ? "Nessun risultato per questa ricerca." : "Il feed è vuoto, oppure questo accesso non legge ancora le gare."}</span></div>`
      : html`<div class="tk-lista">${viste.map(riga)}</div>`;
    el.innerHTML = html`<div class="card">
        <label>Cerca una gara
          <input id="bd-q" type="search" value="${ui.q}" placeholder="Titolo, ente, CIG, comune" autocomplete="off">
        </label>
      </div>
      ${avviso}
      ${d.manca ? "" : lista}`.s;
    const campo = el.querySelector("#bd-q");
    if (campo) {
      campo.addEventListener("input", () => {
        ui.q = campo.value;
        disegna(el, d);
        const diNuovo = el.querySelector("#bd-q");
        if (diNuovo) {
          diNuovo.focus();
          const n = diNuovo.value.length;
          diNuovo.setSelectionRange(n, n);
        }
      });
    }
    el.querySelectorAll("[data-bd]").forEach((b) => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-bd");
        ui.aperto = ui.aperto === id ? "" : id;
        disegna(el, d);
      });
    });
  }

  V.bandi = {
    title: "Bandi",
    sub: "Gare d'appalto, nel pannello admin di AncheCasa.",
    render(el) {
      el.innerHTML = html`<div class="card"><p class="note">Caricamento…</p></div>`.s;
      carica().then((d) => disegna(el, d)).catch((err) => {
        el.innerHTML = html`<div class="card empty"><strong>Non riesco a leggere le gare</strong><span>${err.message || String(err)}</span></div>
          <div class="row-actions"><button type="button" class="tab" id="bd-riprova">Riprova</button></div>`.s;
        const b = el.querySelector("#bd-riprova");
        if (b) b.addEventListener("click", () => V.bandi.render(el));
      });
    }
  };
})();
