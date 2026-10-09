/* SuperMastro: guarda i fotogrammi e risponde con problema, spiegazione e mestiere.
   La chiave resta sul server (OPENAI_API_KEY). Dal telefono non parte. */

const MESTIERI = [
  "idraulico", "elettricista", "fabbro", "muratore", "imbianchino", "falegname", "serramentista",
  "caldaista", "tecnico elettrodomestici", "tecnico condizionatori", "vetraio", "giardiniere",
  "impresa di pulizie", "antennista", "altro"
];

const PROMPT = `Sei il tecnico di AncheCasa. Guardi alcune foto di un problema in una casa italiana, girato da un privato con il telefono.
Rispondi SOLO con un oggetto JSON, in italiano semplice, con questi campi:
{
 "problema": "nome breve del problema, max 60 caratteri",
 "descrizione": "cosa si vede e la causa più probabile, max 240 caratteri",
 "mestiere": uno tra ${MESTIERI.join(", ")},
 "urgenza": "bassa" | "media" | "alta",
 "pericolo": true | false,
 "fai_da_te": true | false,
 "passi": ["massimo 6 passi brevi e sicuri per risolvere da solo; vuoto se fai_da_te è false"],
 "avvertenze": ["quando fermarsi e chiamare un professionista"]
}
Regole di sicurezza, obbligatorie:
- Odore di gas, caldaia o fornelli con fiamma anomala, fumo, scintille, cavi bruciati, quadro elettrico, acqua vicino a prese o fili, crepe nei muri portanti o nei soffitti, lavori sul tetto o in altezza, amianto: pericolo=true e fai_da_te=false. Se c'è odore di gas scrivi di aprire le finestre, non toccare interruttori, uscire e chiamare il pronto intervento gas o il 112.
- Su impianti a gas e quadri elettrici non dare mai passi di riparazione.
- Se non riconosci il problema: mestiere "altro", fai_da_te false. Non inventare.
- Niente marche, niente prezzi.`;

function testo(v, max) {
  return String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);
}
function lista(v, n, max) {
  return (Array.isArray(v) ? v : []).map(function (s) { return testo(s, max); }).filter(Boolean).slice(0, n);
}
function normalizza(x) {
  const mestiere = MESTIERI.indexOf(String(x.mestiere)) >= 0 ? String(x.mestiere) : "altro";
  const urgenza = ["bassa", "media", "alta"].indexOf(String(x.urgenza)) >= 0 ? String(x.urgenza) : "media";
  const pericolo = x.pericolo === true;
  const fai = !pericolo && x.fai_da_te === true;
  return {
    problema: testo(x.problema, 60) || "Problema da verificare",
    descrizione: testo(x.descrizione, 240),
    mestiere: mestiere,
    urgenza: pericolo ? "alta" : urgenza,
    pericolo: pericolo,
    fai_da_te: fai,
    passi: fai ? lista(x.passi, 6, 160) : [],
    avvertenze: lista(x.avvertenze, 4, 160)
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "metodo_non_ammesso" });
    return;
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    res.status(503).json({ error: "motore_non_configurato" });
    return;
  }
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const frames = body && Array.isArray(body.fotogrammi) ? body.fotogrammi : [];
  const foto = frames.map(String).filter(function (f) {
    return f.length > 20 && f.length < 1500000 && /^[A-Za-z0-9+/=]+$/.test(f);
  }).slice(0, 3);
  if (!foto.length) {
    res.status(400).json({ error: "manca_il_video" });
    return;
  }
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Fotogrammi del video del guasto, in ordine. Rispondi solo con il JSON." }
            ].concat(foto.map(function (f) {
              return { type: "image_url", image_url: { url: "data:image/jpeg;base64," + f, detail: "low" } };
            }))
          }
        ]
      })
    });
    if (!r.ok) {
      res.status(502).json({ error: "analisi_non_riuscita" });
      return;
    }
    const j = await r.json();
    const raw = JSON.parse((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "{}");
    res.status(200).json(normalizza(raw));
  } catch (e) {
    res.status(502).json({ error: "analisi_non_riuscita" });
  }
};
