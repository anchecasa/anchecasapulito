/* SuperMastro impara dai pollici (09.10.2026).
   La scheda "La tua richiesta" manda qui 👍 / 👎 e, con 👎, "Cos'era invece?".
   Si salva in marketplace.supermastro_voti (chiave pubblica, solo INSERT, approvato sempre false).
   Le correzioni approvate da un admin tornano a SuperMastro come esempi (vedi api/supermastro.js).
   Tabella: supabase/migrations/20261009183000_supermastro_voti.sql */
const SB_URL = "https://edsvmnxojsmknjuhobqa.supabase.co/rest/v1/supermastro_voti";
const SB_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_QbYv61SkMkjA9_GGb1hhOA_6v6GEw87";
function t(v, max) { return String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max); }

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ error: "metodo_non_ammesso" }); return; }
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b && typeof b === "object" ? b : {};
  const voto = b.voto === 1 || b.voto === -1 ? b.voto : 0;
  if (!voto) { res.status(400).json({ error: "voto_non_valido" }); return; }
  const riga = {
    voto: voto,
    fonte: b.fonte === "video" ? "video" : "testo",
    richiesta: t(b.richiesta, 300), problema: t(b.problema, 80), mestiere: t(b.mestiere, 40),
    correzione: voto === -1 ? t(b.correzione, 200) : "", citta: t(b.citta, 80), approvato: false
  };
  try {
    const r = await fetch(SB_URL, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json", "Content-Profile": "marketplace", Prefer: "return=minimal" },
      body: JSON.stringify(riga)
    });
    res.status(r.ok ? 200 : 502).json({ ok: r.ok });
  } catch (e) {
    res.status(502).json({ ok: false });
  }
};
