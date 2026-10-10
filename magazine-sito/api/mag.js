/* Magazine · statistiche e iscrizioni agli avvisi (09.10.2026).
   La rivista manda qui, in forma anonima, cosa succede (apertura, pagine, Check Bollette, condivisioni).
   Qui aggiungiamo città, regione e paese che Vercel ricava dalla connessione: l'IP non viene salvato.
   Le righe vanno su Supabase (schema marketplace) con la chiave pubblica: la tabella accetta solo INSERT,
   leggere può solo un admin. Tabelle: supabase/migrations/20261009170000_magazine_statistiche.sql
   Se la tabella degli iscritti non c'è ancora, l'iscrizione va in richieste_iscrizione come prima. */

const SB_URL = "https://edsvmnxojsmknjuhobqa.supabase.co/rest/v1/";
const SB_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_QbYv61SkMkjA9_GGb1hhOA_6v6GEw87";
const EVENTI = ["apertura", "pagina", "bollette_uso", "bollette_pdf", "offerte", "condividi", "avvisi"];
const DISPOSITIVI = ["telefono", "tablet", "pc"];

function t(v, max) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
function header(req, nome) {
  const v = req.headers[nome];
  if (!v) return "";
  try { return decodeURIComponent(String(v)); } catch (e) { return String(v); }
}
function corpo(req) {
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (Buffer.isBuffer(b)) { try { b = JSON.parse(b.toString("utf8")); } catch (e) { b = null; } }
  return b && typeof b === "object" ? b : {};
}
function scrivi(tabella, righe) {
  return fetch(SB_URL + tabella, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: "Bearer " + SB_KEY,
      "Content-Type": "application/json",
      "Content-Profile": "marketplace",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(righe)
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ error: "metodo_non_ammesso" }); return; }
  const b = corpo(req);
  const geo = {
    citta: t(header(req, "x-vercel-ip-city"), 80),
    regione: t(header(req, "x-vercel-ip-country-region"), 20),
    paese: t(header(req, "x-vercel-ip-country"), 4)
  };

  try {
    /* Iscrizione agli avvisi (app raccolta + nuovi numeri) */
    if (b.iscrizione) {
      const i = b.iscrizione;
      const mail = t(i.mail, 160).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail) || i.privacy !== true) { res.status(400).json({ error: "dati_non_validi" }); return; }
      const riga = {
        mail: mail, comune: t(i.comune, 80), interesse: t(i.interesse, 120),
        numero: Math.max(1, Math.min(999, parseInt(i.numero, 10) || 1)), citta_rete: geo.citta, privacy: true
      };
      let r = await scrivi("magazine_iscritti", [riga]);
      if (r.status === 409) { res.status(200).json({ ok: true, gia: true }); return; }
      if (!r.ok) {
        // Tabella non ancora creata: si salva come prima, nelle richieste di iscrizione.
        r = await scrivi("richieste_iscrizione", [{
          famiglia: "privato",
          dati: { modulo: "magazine-avvisi", pagina: "magazine", Mail: mail, Comune: riga.comune, Interesse: riga.interesse, Numero: String(riga.numero), Privacy: "si", Citta_rete: geo.citta }
        }]);
        if (!r.ok) { res.status(502).json({ error: "salvataggio_non_riuscito" }); return; }
      }
      res.status(200).json({ ok: true });
      return;
    }

    /* Eventi di lettura, a pacchetti */
    const lista = Array.isArray(b.ev) ? b.ev.slice(0, 40) : [];
    const sessione = t(b.s, 40);
    if (!lista.length || sessione.length < 6) { res.status(204).end(); return; }
    const comune = {
      sessione: sessione,
      numero: Math.max(1, Math.min(999, parseInt(b.n, 10) || 1)),
      dispositivo: DISPOSITIVI.indexOf(b.d) >= 0 ? b.d : "",
      provenienza: t(b.da, 80),
      citta: geo.citta, regione: geo.regione, paese: geo.paese
    };
    const righe = lista
      .filter(function (e) { return e && EVENTI.indexOf(e.e) >= 0; })
      .map(function (e) {
        const p = parseInt(e.p, 10);
        return Object.assign({}, comune, { evento: e.e, pagina: p >= 0 && p <= 200 ? p : null, dettaglio: t(e.x, 60) });
      });
    if (righe.length) await scrivi("magazine_eventi", righe);
    res.status(204).end();
  } catch (err) {
    res.status(204).end();
  }
};
