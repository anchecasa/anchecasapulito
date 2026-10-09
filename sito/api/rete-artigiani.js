/* Artigiani certificati DM 37/08 di supermastro.com (09.10.2026).
   Legge la tabella pubblica "artigiani": approvati, non sospesi, online, con certificazione e coordinate.
   Li mette nel formato della cartina di AncheCasa: { nome, lat, lng, tel, indirizzo, sito, rete: true }.
   Il più vicino è il primo. La chiave è quella pubblica già usata da supermastro.com: può solo leggere. */

const SM_URL = "https://jecbzlcynldmsnhjgjmu.supabase.co/rest/v1/artigiani";
const SM_KEY = process.env.SUPERMASTRO_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplY2J6bGN5bmxkbXNuaGpnam11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1OTA5MDAsImV4cCI6MjA5MzE2NjkwMH0.WgkKGhAa6qqxnRZh14wjMY42pLyiKMT9_Aq-vrNGfTk";
const RAGGIO_KM = 40;
const NOMI = {
  idraulico: "Idraulico", elettricista: "Elettricista", fabbro: "Fabbro",
  muratore: "Muratore", falegname: "Falegname", giardiniere: "Giardiniere"
};

function testo(v, max) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
function km(a, b, c, d) {
  var R = 6371, p = Math.PI / 180, x = (c - a) * p, y = (d - b) * p;
  var h = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a * p) * Math.cos(c * p) * Math.sin(y / 2) * Math.sin(y / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
function corpo(req) {
  var b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = null; } }
  return b && typeof b === "object" ? b : {};
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ error: "metodo_non_ammesso" }); return; }
  var b = corpo(req);
  var lat = Number(b.lat), lng = Number(b.lng);
  var mestiere = testo(b.mestiere, 40).toLowerCase();
  if (!isFinite(lat) || !isFinite(lng)) { res.status(400).json({ error: "manca_la_posizione" }); return; }
  var q = SM_URL + "?select=categoria,citta_operativita,latitudine,longitudine,ragione_sociale,indirizzo_sede" +
    "&status_approvazione=eq.approvato&sospeso=eq.false&online=eq.true" +
    "&certificazione_dm37=not.is.null&latitudine=not.is.null&longitudine=not.is.null";
  if (NOMI[mestiere]) q += "&categoria=eq." + encodeURIComponent(mestiere);
  else if (mestiere) { res.status(200).json({ artigiani: [] }); return; }
  try {
    var r = await fetch(q, { headers: { apikey: SM_KEY, Authorization: "Bearer " + SM_KEY } });
    if (!r.ok) { res.status(200).json({ artigiani: [] }); return; }
    var righe = await r.json();
    var lista = (Array.isArray(righe) ? righe : []).map(function (x) {
      var la = Number(x.latitudine), ln = Number(x.longitudine);
      if (!isFinite(la) || !isFinite(ln)) return null;
      var dist = km(lat, lng, la, ln);
      if (dist > RAGGIO_KM) return null;
      var cat = NOMI[x.categoria] || "Artigiano";
      var citta = testo(x.citta_operativita, 80);
      var nome = testo(x.ragione_sociale, 80) || (cat + " certificato" + (citta ? " · " + citta : ""));
      return {
        nome: nome,
        lat: la,
        lng: ln,
        tel: "",
        indirizzo: testo(x.indirizzo_sede, 120) || citta,
        sito: "",
        rete: true,
        dist: dist
      };
    }).filter(Boolean).sort(function (a, c) { return a.dist - c.dist; }).slice(0, 8);
    res.status(200).json({ artigiani: lista });
  } catch (e) {
    res.status(200).json({ artigiani: [] });
  }
};
