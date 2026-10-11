/* Pacchetti per tipo di attività, copiati da area-privata/dashboard/js/app.js
   (TIPO_PACK e PACKS, 11.10.2026). Lì non si cambiano.
   Qui servono solo a decidere quali moduli proporre a ogni mestiere e a ogni ATECO.
   Il fornitore è una categoria vera: il pacchetto segue l'ATECO, non un menu unico. */

function voce(id, fold) {
  return { id, fold };
}
const UFFICIO = [
  voce("amministrazione", "ufficio"), voce("sicurezza", "ufficio"), voce("vault", "ufficio"),
  voce("clienti", "ufficio"), voce("preventivi", "ufficio"), voce("fatture", "ufficio"),
  voce("recruitment", "ufficio"), voce("acquisti", "ufficio"), voce("fornitori", "ufficio"),
];
function conUfficio(resto) {
  const visti = {};
  return UFFICIO.concat(resto || []).filter((it) => (visti[it.id] ? false : (visti[it.id] = true)));
}

export const TIPO_PACK = {
  impresa: "impresa", professionista: "professionista", hse: "hse", sicurezza_armata: "sicurezza_armata",
  condominio: "condominio", agenzia: "agenzia", apl: "apl", industria: "industria", logistica: "logistica",
  albergo: "albergo", negozio: "negozio", fornitore: "fornitore", artigiano: "artigiano",
  azienda_imprese_edili: "impresa", azienda_subappaltatori: "subappaltatore", azienda_impiantisti: "impiantista",
  azienda_materiali_edili: "fornitore", azienda_noleggio_attrezzature: "fornitore", azienda_traslochi: "logistica",
  azienda_facchinaggio: "logistica", azienda_pulizie: "logistica", azienda_manutenzione_stabili: "condominio",
  azienda_hotel: "albergo", azienda_ristoranti: "albergo", azienda_negozi: "negozio", azienda_capannoni: "industria",
  azienda_studi_tecnici: "professionista", azienda_consulenti: "hse", azienda_fornitori_it: "fornitore",
  azienda_agenzie_immobiliari: "agenzia", agente_agenzie_immobiliari: "agenzia", azienda_luce_gas: "energia",
  committente_condominio: "committente", committente_amministratore: "committente",
  committente_grande: "committente", committente_fondo: "committente",
};
const TIPO_FORN_MODO = {
  azienda_materiali_edili: "vendita", azienda_noleggio_attrezzature: "noleggio", azienda_fornitori_it: "vendita",
};

/* Codice ATECO dell'iscrizione → tipo già usato da TIPO_PACK. */
export const ATECO_TIPO = {
  "41.20": "azienda_imprese_edili",
  "43.21": "azienda_impiantisti", "43.22": "azienda_impiantisti", "43.29": "azienda_impiantisti",
  "43.31": "artigiano", "43.32": "artigiano", "43.33": "artigiano", "43.34": "artigiano",
  "43.39": "artigiano", "43.91": "artigiano",
  "46.73": "azienda_materiali_edili",
  "77.32": "azienda_noleggio_attrezzature",
  "81.21": "azienda_pulizie", "81.22": "azienda_pulizie",
  "49.41": "azienda_traslochi",
  "62.01": "azienda_fornitori_it",
};

export const PACKS = {
  hse: conUfficio([]),
  sicurezza_armata: conUfficio([]),
  apl: conUfficio([]),
  impresa: conUfficio(["analizza", "partecipa", "predict", "bim", "subappalti", "cantiere", "giornali", "sal", "cronoprogramma", "presenze", "rapportini", "mezzi", "magazzino", "app", "squadre"].map((id) => voce(id, ""))),
  subappaltatore: conUfficio(["partecipa", "offerte", "sal", "rapportini", "presenze", "app", "squadre", "qualificazioni"].map((id) => voce(id, ""))),
  impiantista: conUfficio(["interventi", "rapportini", "app", "manutprog", "dico", "mezzi", "magazzino"].map((id) => voce(id, ""))),
  professionista: conUfficio(["pratiche", "analizza", "bim", "rapportini", "presenze"].map((id) => voce(id, ""))),
  condominio: conUfficio(["anagrafe", "assemblee", "manutenzioni", "contabilita", "archivio", "fornitori"].map((id) => voce(id, ""))),
  committente: conUfficio([]),
  agenzia: conUfficio(["immobili", "mandati", "visite"].map((id) => voce(id, ""))),
  industria: conUfficio(["produzione", "magazzino", "mezzi", "personale"].map((id) => voce(id, ""))),
  logistica: conUfficio(["magazzino", "mezzi", "tracking", "spedizioni"].map((id) => voce(id, ""))),
  albergo: conUfficio(["struttura", "camere", "turni"].map((id) => voce(id, ""))),
  negozio: conUfficio(["vetrina", "magazzino", "turni"].map((id) => voce(id, ""))),
  energia: conUfficio(["offerte_energia", "proposte_energia"].map((id) => voce(id, ""))),
  artigiano: conUfficio(["vetrina", "app", "rapportini", "mezzi", "magazzino"].map((id) => voce(id, ""))),
};

const VENDITA = ["listino", "magazzino", "ordini", "consegne"].map((id) => voce(id, "vendita"));
const NOLEGGIO = ["flotta", "calendario", "noleggi", "tracking", "manumezzi"].map((id) => voce(id, "noleggio"));
export function packFornitore(modo) {
  if (modo === "vendita") return conUfficio(VENDITA);
  if (modo === "noleggio") return conUfficio(NOLEGGIO);
  return conUfficio(VENDITA.concat(NOLEGGIO));
}

/* Voce del pacchetto → modulo che si propone (prezzi in catalogo.js). */
const MODULO_VOCE = {
  amministrazione: "ufficio", vault: "ufficio", clienti: "ufficio", preventivi: "ufficio", fatture: "ufficio",
  recruitment: "ufficio", acquisti: "ufficio", fornitori: "ufficio", pratiche: "ufficio", archivio: "ufficio",
  contabilita: "ufficio", mandati: "ufficio",
  sicurezza: "sicurezza", qualificazioni: "sicurezza", dico: "sicurezza",
  analizza: "gare", partecipa: "gare", predict: "gare", bim: "gare",
  subappalti: "lotti", offerte: "lotti",
  cantiere: "cantieri", giornali: "cantieri", sal: "cantieri", cronoprogramma: "cantieri",
  presenze: "cantieri", rapportini: "cantieri", app: "cantieri", squadre: "cantieri",
  interventi: "cantieri", manutprog: "cantieri",
  mezzi: "magazzino", magazzino: "magazzino", listino: "magazzino", flotta: "magazzino",
  ordini: "magazzino", consegne: "magazzino", noleggi: "magazzino", calendario: "magazzino",
  tracking: "magazzino", manumezzi: "magazzino", spedizioni: "magazzino", produzione: "magazzino",
};

const VOCE_NASCOSTA = { predict: true, bim: true, tracking: true, recruitment: true };
export const PACK_NASCOSTO = {
  hse: true, sicurezza_armata: true, apl: true, condominio: true, agenzia: true,
  industria: true, logistica: true, albergo: true, negozio: true
};

function vociPack(pack, modo) {
  let list = pack === "fornitore" ? packFornitore(modo) : (PACKS[pack] || conUfficio([]));
  list = list.filter((it) => !VOCE_NASCOSTA[it.id]);
  if (PACK_NASCOSTO[pack]) list = list.filter((it) => it.fold === "ufficio");
  return list;
}

/* ateco: codici. tipo: tipo azienda o «fornitore»/«impresa». modo: vendita | noleggio | entrambi. */
export function moduliDelMestiere(ateco, tipo, modo) {
  const codici = Array.isArray(ateco) ? ateco.filter(Boolean) : [];
  const tipi = codici.length ? codici.map((c) => ATECO_TIPO[c] || tipo || "impresa") : [tipo || "impresa"];
  const modi = new Set();
  const packs = new Set();
  tipi.forEach((t) => {
    packs.add(TIPO_PACK[t] || t || "impresa");
    if (TIPO_FORN_MODO[t]) modi.add(TIPO_FORN_MODO[t]);
  });
  let modoScelto = modo || "entrambi";
  if (modi.size === 1) modoScelto = [...modi][0];
  const moduli = new Set();
  packs.forEach((p) => {
    vociPack(p, modoScelto).forEach((it) => {
      const m = MODULO_VOCE[it.id];
      if (m) moduli.add(m);
    });
  });
  return { packs: [...packs], modo: modoScelto, moduli };
}
