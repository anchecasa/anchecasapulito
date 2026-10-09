/* SuperMastro: guarda i fotogrammi e risponde con problema, spiegazione e mestiere.
   La chiave resta sul server (OPENAI_API_KEY). Dal telefono non parte. */

const MESTIERI = [
  "idraulico", "elettricista", "fabbro", "muratore", "imbianchino", "falegname", "serramentista",
  "caldaista", "tecnico elettrodomestici", "tecnico condizionatori", "vetraio", "giardiniere",
  "impresa di pulizie", "antennista", "lattoniere", "piastrellista", "tapparellista", "disinfestazione",
  "spurgo", "traslochi", "spazzacamino", "impresa edile", "installatore fotovoltaico", "cancelli automatici",
  "allarmi", "altro"
];

/* Regole di supermastro.com, funzione diagnose-video (video di 5 secondi o testo):
   categorie idraulico, elettricista, fabbro, muratore, falegname, giardiniere;
   se il video non si capisce (confidenza sotto 70) non si inventa;
   faidate_consigliato solo se è sicuro, altrimenti specialista;
   impianti elettrici, gas e lavori soggetti al DM 37/08 li fa un artigiano certificato.
   La risposta resta il JSON di AncheCasa. */
const PROMPT = `Sei SuperMastro. Analizzi un guasto in una casa italiana: o i fotogrammi di un video di 5 secondi girato dal privato, o il testo che ha scritto.
Rispondi SOLO con un oggetto JSON, in italiano semplice, con questi campi:
{
 "problema": "nome breve del problema, max 60 caratteri",
 "descrizione": "cosa succede e la causa più probabile, spiegato a chi non è del mestiere, max 400 caratteri",
 "mestiere": uno tra ${MESTIERI.join(", ")},
 "urgenza": "bassa" | "media" | "alta",
 "pericolo": true | false,
 "fai_da_te": true | false,
 "attrezzi": ["attrezzi e materiali che servono per farlo da solo, con misura o tipo quando conta (es. 'Chiave a brugola da 4 mm', 'Silicone sanitario antimuffa'); massimo 10; vuoto se fai_da_te è false"],
 "passi": ["da 4 a 8 passi dettagliati e sicuri, nell'ordine giusto, ognuno con cosa fare e come capire se è fatto bene; vuoto se fai_da_te è false"],
 "tempo": "tempo indicativo per farlo da solo, es. '20-40 minuti'; vuoto se fai_da_te è false",
 "difficolta": "facile" | "media" | "impegnativa",
 "avvertenze": ["quando fermarsi e chiamare un professionista"]
}
Il primo passo è sempre la sicurezza (chiudere l'acqua, staccare la corrente, mettere guanti o occhiali) quando serve.
Regole di supermastro.com, obbligatorie:
- Prima scegli la categoria tra idraulico, elettricista, fabbro, muratore, falegname, giardiniere. Se il lavoro è un altro mestiere della lista, usa quello.
- Se il video è scuro, mosso, lontano o non si capisce il guasto, non inventare: mestiere "altro", fai_da_te false, problema "Problema da verificare", descrizione che chiede di rifare il video più vicino al guasto.
- fai_da_te true solo quando un privato può farlo in sicurezza (pulire un filtro, sfiatare un termosifone, cambiare una lampadina a corrente staccata). Impianti elettrici, gas, caldaie, quadri, tubi in pressione, tetti, altezza, crepe strutturali e tutto ciò che richiede un'impresa abilitata DM 37/08: fai_da_te false.
- Odore di gas, fiamma anomala, fumo, scintille, cavi bruciati, acqua vicino a prese o fili, amianto: pericolo true, urgenza alta, fai_da_te false. Se c'è odore di gas: aprire le finestre, non toccare interruttori, uscire e chiamare il pronto intervento gas o il 112.
- Su impianti a gas e quadri elettrici non dare mai passi di riparazione.
- Se serve anche un secondo mestiere, scrivilo in avvertenze ("Può servire anche un muratore").
- Niente marche, niente prezzi, niente nomi di persone.`;

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
    descrizione: testo(x.descrizione, 400),
    mestiere: mestiere,
    urgenza: pericolo ? "alta" : urgenza,
    pericolo: pericolo,
    fai_da_te: fai,
    passi: fai ? lista(x.passi, 8, 240) : [],
    attrezzi: fai ? lista(x.attrezzi, 10, 90) : [],
    tempo: fai ? testo(x.tempo, 40) : "",
    difficolta: fai && ["facile", "media", "impegnativa"].indexOf(String(x.difficolta)) >= 0 ? String(x.difficolta) : "",
    avvertenze: lista(x.avvertenze, 4, 200)
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
  // 09.10.2026: anche solo testo (dalla ricerca della home): "testo" = il problema scritto, "citta" facoltativa.
  const testo = body && typeof body.testo === "string" ? body.testo.replace(/\s+/g, " ").trim().slice(0, 300) : "";
  const citta = body && typeof body.citta === "string" ? body.citta.replace(/\s+/g, " ").trim().slice(0, 80) : "";
  if (!foto.length && testo.length < 3) {
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
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: PROMPT },
          foto.length
            ? {
              role: "user",
              content: [
                { type: "text", text: "Fotogrammi del video del guasto, in ordine." + (testo ? " Il privato scrive: «" + testo + "»." : "") + " Rispondi solo con il JSON." }
              ].concat(foto.map(function (f) {
                return { type: "image_url", image_url: { url: "data:image/jpeg;base64," + f, detail: "low" } };
              }))
            }
            : {
              role: "user",
              content: "Non c'è il video: il privato ha scritto il problema. «" + testo + "»" + (citta ? " (si trova a " + citta + ")" : "") +
                ". Se è un lavoro e non un guasto (es. tagliare l'erba, imbiancare, traslocare), descrivi il lavoro e il mestiere giusto. Rispondi solo con il JSON."
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
