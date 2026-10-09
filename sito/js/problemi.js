/* AncheCasa · Problemi di casa e fuori casa (09.10.2026).
   Dizionario usato dalla ricerca della home (suggerimenti mentre scrivi) e da SuperMastro (risposta e artigiano).
   Ogni voce: id, t (come lo dice la gente), m (mestiere), k (parole e sinonimi), l ("casa" | "fuori"),
   f (si può provare da soli), c (consiglio breve di SuperMastro).
   La ricerca capisce l'inizio delle parole ("idr"), più parole insieme ("taglio erba") e piccoli errori ("idraulco").
   Il riconoscimento dei problemi di supermastro.com (6 categorie) è collegato in ACProblemi.cerca(). */
(function () {
  var MESTIERI = {
    idraulico: { nome: "Idraulico", osm: ['["craft"="plumber"]'] },
    elettricista: { nome: "Elettricista", osm: ['["craft"="electrician"]'] },
    fabbro: { nome: "Fabbro", osm: ['["craft"="locksmith"]', '["shop"="locksmith"]', '["craft"="metal_construction"]'] },
    caldaista: { nome: "Tecnico caldaie", osm: ['["craft"="heating_engineer"]', '["craft"="hvac"]'] },
    clima: { nome: "Tecnico condizionatori", osm: ['["craft"="hvac"]'] },
    imbianchino: { nome: "Imbianchino", osm: ['["craft"="painter"]'] },
    muratore: { nome: "Muratore", osm: ['["craft"="builder"]', '["craft"="mason"]'] },
    falegname: { nome: "Falegname", osm: ['["craft"="carpenter"]', '["craft"="joiner"]'] },
    serramentista: { nome: "Serramentista", osm: ['["craft"="window_construction"]', '["craft"="glaziery"]'] },
    vetraio: { nome: "Vetraio", osm: ['["craft"="glaziery"]'] },
    piastrellista: { nome: "Piastrellista", osm: ['["craft"="tiler"]'] },
    pavimentista: { nome: "Posatore pavimenti", osm: ['["craft"="floorer"]', '["craft"="parquet_layer"]'] },
    cartongessista: { nome: "Cartongessista", osm: ['["craft"="plasterer"]', '["craft"="drywall"]'] },
    lattoniere: { nome: "Lattoniere e tetti", osm: ['["craft"="roofer"]'] },
    giardiniere: { nome: "Giardiniere", osm: ['["craft"="gardener"]', '["shop"="garden_centre"]'] },
    pulizie: { nome: "Impresa di pulizie", osm: ['["office"="cleaning"]', '["shop"="dry_cleaning"]', '["craft"="cleaning"]'] },
    traslochi: { nome: "Traslochi", osm: ['["office"="moving_company"]', '["shop"="moving_company"]'] },
    antennista: { nome: "Antennista", osm: ['["craft"="electronics_repair"]', '["shop"="electronics"]'] },
    elettrodomestici: { nome: "Tecnico elettrodomestici", osm: ['["craft"="electronics_repair"]', '["shop"="appliance"]'] },
    disinfestazione: { nome: "Disinfestazione", osm: ['["craft"="pest_control"]', '["office"="pest_control"]'] },
    spurgo: { nome: "Spurgo pozzi neri", osm: ['["craft"="sewer"]', '["office"="sewer"]'] },
    tapparelle: { nome: "Tapparellista", osm: ['["craft"="window_construction"]', '["shop"="window_blind"]'] },
    tende: { nome: "Tende da sole", osm: ['["shop"="window_blind"]', '["craft"="awning"]'] },
    automazioni: { nome: "Cancelli automatici", osm: ['["craft"="electrician"]', '["craft"="metal_construction"]'] },
    sicurezza: { nome: "Allarmi e videosorveglianza", osm: ['["shop"="security"]', '["craft"="electrician"]'] },
    fotovoltaico: { nome: "Installatore fotovoltaico", osm: ['["craft"="solar_installer"]', '["craft"="electrician"]'] },
    piscine: { nome: "Manutenzione piscine", osm: ['["craft"="swimming_pool"]', '["shop"="swimming_pool"]'] },
    spazzacamino: { nome: "Spazzacamino", osm: ['["craft"="chimney_sweeper"]'] },
    tappezziere: { nome: "Tappezziere", osm: ['["craft"="upholsterer"]'] },
    montatore: { nome: "Montatore mobili", osm: ['["craft"="carpenter"]'] },
    impresa: { nome: "Impresa edile", osm: ['["craft"="builder"]', '["office"="construction_company"]'] },
    sgombero: { nome: "Sgomberi", osm: ['["office"="moving_company"]'] },
    impermeabilizzazione: { nome: "Impermeabilizzazioni", osm: ['["craft"="roofer"]', '["craft"="builder"]'] }
  };

  // [id, titolo, mestiere, parole, luogo, faiDaTe, consiglio]
  var V = [
    ["rubinetto-gocciola", "Rubinetto che gocciola", "idraulico", "goccia perde rubinetto lavandino miscelatore guarnizione cartuccia", "casa", 1, "Chiudi l’acqua sotto il lavandino e pulisci il rompigetto dal calcare. Se gocciola ancora, va cambiata la cartuccia: chiama un idraulico."],
    ["scarico-intasato", "Scarico intasato o lento", "idraulico", "scarico intasato otturato lento lavandino lavello doccia vasca tappo sturare", "casa", 1, "Prova la ventosa e acqua molto calda. Non versare acidi. Se l’acqua risale o puzza, serve un idraulico."],
    ["wc-intasato", "WC intasato", "idraulico", "wc water gabinetto tazza intasato otturato scarico bagno", "casa", 1, "Usa lo sturalavandini a campana per WC. Se l’acqua sale o esce da altri scarichi, chiama un idraulico."],
    ["cassetta-wc", "Cassetta del WC che perde o non carica", "idraulico", "cassetta wc sciacquone galleggiante perde carica scarico continuo", "casa", 1, "Spesso è il galleggiante o la guarnizione del pulsante. Chiudi il rubinetto della cassetta; se non risolvi, chiama un idraulico."],
    ["perdita-tubo", "Perdita d’acqua da un tubo", "idraulico", "perdita acqua tubo tubatura rotto allagamento gocciola muro bagnato", "casa", 0, "Chiudi subito il rubinetto generale dell’acqua e stacca la corrente vicino alla perdita. Serve un idraulico."],
    ["macchia-soffitto", "Macchia d’acqua sul soffitto", "idraulico", "macchia soffitto infiltrazione acqua vicino sopra gocciola umido", "casa", 0, "Può essere un tubo del vicino o il tetto. Fai una foto, avvisa l’amministratore e chiama un idraulico per la ricerca perdita."],
    ["poca-pressione", "Poca pressione dell’acqua", "idraulico", "pressione acqua poca debole rubinetti doccia autoclave", "casa", 1, "Pulisci rompigetti e soffione dal calcare. Se è debole ovunque, può essere il riduttore o l’autoclave: idraulico."],
    ["acqua-calda", "Niente acqua calda", "caldaista", "acqua calda fredda scaldabagno boiler doccia fredda", "casa", 0, "Controlla se la caldaia o lo scaldabagno sono in blocco o senza corrente. Non aprirli: chiama un tecnico."],
    ["scaldabagno", "Scaldabagno elettrico guasto", "idraulico", "scaldabagno boiler elettrico resistenza non scalda perde", "casa", 0, "Stacca la corrente dello scaldabagno. Se perde o non scalda, serve un idraulico."],
    ["doccia-perde", "Box doccia o piatto doccia che perde", "idraulico", "doccia box piatto silicone perde infiltrazione fuga", "casa", 1, "Spesso basta rifare il silicone. Se l’acqua passa sotto il piatto, chiama un idraulico."],
    ["lavatrice-scarico", "Lavatrice che non scarica", "elettrodomestici", "lavatrice scarica acqua filtro pompa centrifuga blocco", "casa", 1, "Spegnila, svuota l’acqua dal filtro in basso e puliscilo. Se non riparte, chiama un tecnico elettrodomestici."],
    ["lavastoviglie", "Lavastoviglie guasta", "elettrodomestici", "lavastoviglie lava non scarica errore perde", "casa", 1, "Pulisci il filtro sul fondo e controlla il tubo di scarico. Se dà errore, tecnico elettrodomestici."],
    ["frigo", "Frigorifero che non raffredda", "elettrodomestici", "frigo frigorifero freezer congelatore non raffredda ghiaccio rumore", "casa", 1, "Controlla la manopola e che le guarnizioni chiudano. Pulisci la griglia dietro. Se non torna freddo, tecnico."],
    ["forno", "Forno o piano cottura guasto", "elettrodomestici", "forno piano cottura induzione fornelli non scalda", "casa", 0, "Stacca la corrente. Se è a gas e senti odore, apri le finestre e chiama subito. Altrimenti tecnico elettrodomestici."],
    ["odore-gas", "Odore di gas", "caldaista", "gas odore puzza fuga fornelli caldaia", "casa", 0, "Apri le finestre, non toccare interruttori, esci di casa e chiama il pronto intervento gas o il 112."],
    ["caldaia-blocco", "Caldaia in blocco", "caldaista", "caldaia blocco errore codice spenta non parte riscaldamento", "casa", 0, "Leggi il codice sul display e prova un solo riarmo. Se torna in blocco non insistere: tecnico caldaie."],
    ["caldaia-pressione", "Caldaia senza pressione", "caldaista", "caldaia pressione bassa manometro caricare acqua bar", "casa", 1, "Se il manometro è sotto 1 bar, ricarica dal rubinetto sotto la caldaia fino a 1,2-1,5 bar. Se cala di nuovo, c’è una perdita: tecnico."],
    ["termosifoni", "Termosifoni freddi", "caldaista", "termosifoni radiatori freddi sfiato aria tiepidi riscaldamento", "casa", 1, "Sfiata l’aria dalle valvoline con il riscaldamento acceso. Se restano freddi, tecnico caldaie."],
    ["controllo-fumi", "Controllo fumi e manutenzione caldaia", "caldaista", "controllo fumi revisione manutenzione caldaia libretto bollino", "casa", 0, "È obbligatorio con le cadenze della tua Regione. Prenota un tecnico abilitato."],
    ["condizionatore", "Condizionatore che non raffredda", "clima", "condizionatore climatizzatore aria condizionata non raffredda gocciola split", "casa", 1, "Pulisci i filtri e cambia le pile del telecomando. Se non raffredda o gocciola, tecnico condizionatori."],
    ["installare-clima", "Installare un condizionatore", "clima", "installare condizionatore climatizzatore nuovo split pompa calore", "casa", 0, "Serve un installatore con patentino F-gas. Chiedi due preventivi con modello e posa."],
    ["salvavita", "Salta il salvavita", "elettricista", "salvavita scatta salta corrente differenziale interruttore", "casa", 1, "Stacca tutto e rialza una volta sola. Riattacca gli apparecchi uno alla volta. Se scatta ancora, elettricista."],
    ["presa-bruciata", "Presa bruciata o che fa scintille", "elettricista", "presa bruciata scintille fumo spina scotta odore bruciato", "casa", 0, "Non toccarla e stacca la corrente di quella zona. Serve un elettricista."],
    ["luce-non-va", "La luce non si accende", "elettricista", "luce lampadina lampada interruttore non si accende plafoniera", "casa", 1, "Prova un’altra lampadina a corrente staccata. Se non va, controlla il quadro. Poi elettricista."],
    ["quadro-elettrico", "Quadro elettrico o impianto vecchio", "elettricista", "quadro elettrico impianto vecchio certificazione dichiarazione conformità", "casa", 0, "Non aprire il quadro. Un elettricista verifica e rilascia la dichiarazione di conformità."],
    ["nuove-prese", "Aggiungere prese o punti luce", "elettricista", "aggiungere prese punti luce spostare interruttore", "casa", 0, "Serve un elettricista: chiedi che rilasci la conformità."],
    ["citofono", "Citofono o videocitofono guasto", "elettricista", "citofono videocitofono campanello apriporta non suona", "casa", 0, "Controlla se va solo da te o in tutto il palazzo. Poi elettricista o avvisa l’amministratore."],
    ["antenna", "Antenna TV senza segnale", "antennista", "antenna tv televisione segnale canali digitale terrestre parabola", "casa", 1, "Rifai la ricerca canali e controlla il cavo dietro la TV. Se manca su tutti, antennista."],
    ["serratura", "Serratura bloccata o chiave rotta", "fabbro", "serratura bloccata chiave rotta incastrata non gira porta", "casa", 0, "Non forzare. Un fabbro apre senza danni e cambia il cilindro."],
    ["chiuso-fuori", "Chiuso fuori casa", "fabbro", "chiuso fuori chiavi dentro perso chiavi apertura porta", "casa", 0, "Chiama un fabbro per l’apertura. Chiedi il prezzo prima che parta."],
    ["porta-blindata", "Porta blindata o cilindro di sicurezza", "fabbro", "porta blindata cilindro europeo sicurezza cambio serratura", "casa", 0, "Un fabbro cambia il cilindro in mezz’ora. Chiedi un cilindro antibumping."],
    ["inferriate", "Inferriate o grate", "fabbro", "inferriate grate ferro cancello ringhiera saldatura", "casa", 0, "Serve un fabbro per misure e posa."],
    ["finestra-chiude", "La finestra non chiude bene", "serramentista", "finestra non chiude anta maniglia spiffero cerniera regolare", "casa", 1, "Spesso basta regolare le cerniere con una brugola. Se l’anta è storta, serramentista."],
    ["infissi-nuovi", "Cambiare gli infissi", "serramentista", "infissi finestre nuove cambiare serramenti pvc legno alluminio ecobonus", "casa", 0, "Chiedi preventivi con Uw e posa qualificata. Ci sono le detrazioni."],
    ["vetro-rotto", "Vetro rotto", "vetraio", "vetro rotto crepato finestra vetrina specchio sostituire", "casa", 0, "Metti del nastro sul vetro per non farlo cadere e chiama un vetraio."],
    ["tapparella", "Tapparella bloccata", "tapparelle", "tapparella avvolgibile bloccata cinghia rotta non sale persiana", "casa", 0, "Non forzarla. Spesso è la cinghia o il rullo: serve un tapparellista."],
    ["zanzariere", "Zanzariere", "tapparelle", "zanzariere misura installare rotta", "casa", 0, "Prendi le misure del vano e chiedi un preventivo con posa."],
    ["muffa", "Muffa sui muri", "imbianchino", "muffa macchie nere angoli umidità condensa muro", "casa", 1, "Se è negli angoli, è condensa: arieggia e usa un antimuffa. Se sale dal pavimento, serve una diagnosi."],
    ["umidita-risalita", "Umidità che sale dal pavimento", "impermeabilizzazione", "umidità risalita muro bagnato salnitro intonaco si stacca", "casa", 0, "È risalita capillare: serve una diagnosi di un’impresa di impermeabilizzazioni."],
    ["imbiancare", "Imbiancare casa", "imbianchino", "imbiancare pitturare tinteggiare pareti verniciare casa stanza", "casa", 1, "Una stanza la puoi fare tu. Per la casa intera chiedi un preventivo al metro quadro."],
    ["crepe", "Crepe nei muri", "muratore", "crepe crepa muro fessura lesione intonaco", "casa", 0, "Se la crepa è sottile nell’intonaco basta stuccare. Se è larga o si allarga, chiama un tecnico prima del muratore."],
    ["piastrelle", "Piastrelle rotte o staccate", "piastrellista", "piastrelle rotte staccate fughe pavimento rivestimento bagno", "casa", 0, "Conserva una piastrella uguale. Serve un piastrellista."],
    ["parquet", "Parquet rovinato", "pavimentista", "parquet legno graffiato levigare lamare pavimento laminato", "casa", 0, "Si può levigare e riverniciare. Chiedi a un posatore pavimenti."],
    ["cartongesso", "Parete o controsoffitto in cartongesso", "cartongessista", "cartongesso parete controsoffitto foro buco", "casa", 0, "Un cartongessista ripara il buco o crea la parete in un giorno."],
    ["porta-interna", "Porta interna che struscia o non chiude", "falegname", "porta interna struscia non chiude cerniera maniglia legno", "casa", 1, "Prova a stringere le viti delle cerniere. Se struscia, la porta va rifilata: falegname."],
    ["mobili-montaggio", "Montare mobili", "montatore", "montare mobili montaggio cucina armadio ikea", "casa", 0, "Un montatore monta e fissa al muro in sicurezza."],
    ["rifare-bagno", "Rifare il bagno", "impresa", "rifare bagno ristrutturare bagno doccia vasca sanitari", "casa", 0, "Con AncheCasa hai un solo referente e un preventivo unico."],
    ["rifare-cucina", "Rifare la cucina", "impresa", "rifare cucina ristrutturare impianti cucina", "casa", 0, "Prima la pianta e gli impianti, poi i mobili. Chiedi un sopralluogo."],
    ["ristrutturazione", "Ristrutturare casa", "impresa", "ristrutturazione ristrutturare casa appartamento lavori impresa bonus", "casa", 0, "Con AncheCasa general contractor hai un solo contratto e la fideiussione."],
    ["pulizie", "Pulizie di casa o dopo i lavori", "pulizie", "pulizie pulire casa fine cantiere sgrassare vetri", "casa", 0, "Un’impresa di pulizie lavora a ore o a forfait."],
    ["trasloco", "Trasloco", "traslochi", "trasloco traslocare scatoloni mobili camion", "casa", 0, "Chiedi un preventivo con sopralluogo o video della casa."],
    ["sgombero", "Sgombero cantina o casa", "sgombero", "sgombero cantina soffitta svuotare casa rifiuti ingombranti", "casa", 0, "Chiedi chi smaltisce e con quale formulario."],
    ["insetti", "Scarafaggi, formiche o insetti", "disinfestazione", "scarafaggi blatte formiche insetti cimici tarli disinfestazione", "casa", 0, "Serve una ditta di disinfestazione con prodotti autorizzati."],
    ["topi", "Topi o ratti", "disinfestazione", "topi ratti roditori derattizzazione", "casa", 0, "Non usare veleni dove ci sono bambini o animali: chiama una ditta di derattizzazione."],
    ["vespe", "Nido di vespe o calabroni", "disinfestazione", "vespe calabroni nido api", "fuori", 0, "Non toccarlo. Per le api chiama un apicoltore, per le vespe la disinfestazione."],
    ["camino", "Camino o stufa che fa fumo", "spazzacamino", "camino stufa canna fumaria fumo pulizia pellet", "casa", 0, "La canna fumaria va pulita ogni anno da uno spazzacamino."],
    ["divano", "Rifoderare divano o sedie", "tappezziere", "divano sedie rifoderare tappezzeria poltrona", "casa", 0, "Un tappezziere rifà imbottitura e rivestimento."],
    ["allarme", "Antifurto e videosorveglianza", "sicurezza", "allarme antifurto telecamere videosorveglianza sensori", "casa", 0, "Chiedi un sopralluogo e un impianto certificato."],
    ["fotovoltaico", "Pannelli fotovoltaici", "fotovoltaico", "fotovoltaico pannelli solari batteria accumulo impianto", "casa", 0, "Chiedi una stima della produzione e dei consumi prima del preventivo."],
    ["pompa-calore", "Pompa di calore", "clima", "pompa di calore riscaldamento sostituire caldaia ibrido", "casa", 0, "Prima isola, poi scalda: chiedi una diagnosi energetica."],
    // Fuori casa
    ["taglio-erba", "Tagliare l’erba del prato", "giardiniere", "taglio erba tagliare prato rasaerba falciare giardino", "fuori", 1, "Un prato piccolo lo puoi tagliare tu. Per manutenzione periodica chiedi un giardiniere a forfait."],
    ["siepe", "Potare la siepe", "giardiniere", "siepe potare tagliare potatura alloro lauro", "fuori", 1, "Con un tagliasiepi la sistemi da solo. Siepi alte o lunghe: giardiniere."],
    ["alberi", "Potare o abbattere alberi", "giardiniere", "alberi potare abbattere potatura tronco rami pericolosi", "fuori", 0, "Sopra i 3 metri serve una ditta con attrezzatura e assicurazione."],
    ["prato-nuovo", "Fare un prato nuovo", "giardiniere", "prato nuovo semina rotoli erba sintetica giardino", "fuori", 0, "Chiedi semina o prato a rotoli con preparazione del terreno."],
    ["irrigazione", "Impianto di irrigazione", "giardiniere", "irrigazione impianto gocciolatori irrigatori programmatore", "fuori", 0, "Un giardiniere progetta zone e programmatore."],
    ["foglie", "Pulizia del giardino e foglie", "giardiniere", "foglie pulizia giardino erbacce diserbo", "fuori", 1, "Lo puoi fare tu; per aree grandi un giardiniere."],
    ["grondaie", "Grondaie intasate o che perdono", "lattoniere", "grondaie gronda pluviali intasate perdono foglie", "fuori", 0, "Non salire sul tetto. Serve un lattoniere con attrezzatura."],
    ["tetto", "Tegole rotte o tetto che perde", "lattoniere", "tetto tegole coppi rotte perde infiltrazione copertura", "fuori", 0, "Non salire sul tetto. Serve un tecnico dei tetti."],
    ["terrazzo-perde", "Terrazzo o balcone che perde", "impermeabilizzazione", "terrazzo balcone perde infiltrazione guaina impermeabilizzare", "fuori", 0, "Serve un’impresa di impermeabilizzazioni."],
    ["facciata", "Facciata o intonaco esterno", "impresa", "facciata intonaco esterno cappotto ponteggio condominio", "fuori", 0, "Per i lavori con ponteggio serve un’impresa edile."],
    ["cancello", "Cancello automatico bloccato", "automazioni", "cancello automatico bloccato motore telecomando basculante garage", "fuori", 1, "Controlla le pile del telecomando e la fotocellula. Se non va, sblocca a mano e chiama un tecnico."],
    ["recinzione", "Recinzione o muretto", "muratore", "recinzione muretto rete paletti confine", "fuori", 0, "Chiedi un preventivo al metro lineare."],
    ["pavimento-esterno", "Pavimento esterno o vialetto", "piastrellista", "pavimento esterno vialetto autobloccanti pietra cortile", "fuori", 0, "Chiedi posa con pendenze per l’acqua."],
    ["pergola", "Pergola o gazebo", "falegname", "pergola gazebo tettoia legno bioclimatica", "fuori", 0, "Chiedi al Comune se serve un permesso prima di montarla."],
    ["tende-sole", "Tende da sole", "tende", "tende da sole tenda bracci motore balcone", "fuori", 0, "Chiedi tessuto e motore con sensore vento."],
    ["piscina", "Piscina da pulire o sistemare", "piscine", "piscina pulizia acqua verde pompa filtro", "fuori", 0, "Un tecnico piscine sistema filtro e acqua."],
    ["pozzo-nero", "Pozzo nero o fossa biologica", "spurgo", "pozzo nero fossa biologica spurgo autospurgo fogna", "fuori", 0, "Serve un autospurgo autorizzato."],
    ["fogna", "Fogna o tombino intasato", "spurgo", "fogna tombino pozzetto intasato rigurgito cortile", "fuori", 0, "Serve un autospurgo con sonda."],
    ["idropulitura", "Pulire terrazzo o facciata con idropulitrice", "pulizie", "idropulitura idropulitrice lavare terrazzo cortile muschio", "fuori", 1, "Lo puoi fare tu con l’idropulitrice; per facciate e tetti serve una ditta."],
    ["neve", "Sgombero neve", "giardiniere", "neve sgombero spalare ghiaccio", "fuori", 1, "Per vialetti grandi chiedi un servizio stagionale."]
  ];

  var LISTA = V.map(function (x) {
    return { id: x[0], t: x[1], m: x[2], k: x[3], l: x[4], f: !!x[5], c: x[6] };
  });
  // Anche i mestieri si cercano per nome ("idr" -> Idraulico).
  Object.keys(MESTIERI).forEach(function (k) {
    LISTA.push({ id: "m-" + k, t: MESTIERI[k].nome, m: k, k: MESTIERI[k].nome + " " + k, l: "mestiere", f: false, c: "" });
  });

  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, " ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function dist(a, b) { // Levenshtein con tetto 2
    if (Math.abs(a.length - b.length) > 2) return 3;
    var v0 = [], v1 = [], i, j;
    for (j = 0; j <= b.length; j++) v0[j] = j;
    for (i = 0; i < a.length; i++) {
      v1[0] = i + 1;
      for (j = 0; j < b.length; j++) v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + (a[i] === b[j] ? 0 : 1));
      v0 = v1.slice();
    }
    return v0[b.length];
  }
  var STOP = { di: 1, da: 1, il: 1, la: 1, lo: 1, le: 1, gli: 1, un: 1, una: 1, che: 1, per: 1, del: 1, della: 1, dei: 1, in: 1, e: 1, a: 1, mi: 1, si: 1, ho: 1, non: 0, con: 1, al: 1, alla: 1 };
  LISTA.forEach(function (x) {
    x._parole = norm(x.t + " " + x.k + " " + (MESTIERI[x.m] ? MESTIERI[x.m].nome : "")).split(" ");
    x._titolo = norm(x.t);
  });

  // Punteggio: ogni parola scritta deve trovare una parola della voce (inizio, dentro, o con un errore).
  function cerca(testo, max) {
    var q = norm(testo);
    if (!q) return [];
    var tok = q.split(" ").filter(function (t) { return t && !STOP[t]; });
    if (!tok.length) return [];
    var res = [];
    LISTA.forEach(function (x) {
      var tot = 0, ok = true;
      tok.forEach(function (t, i) {
        var best = 0, ultimo = i === tok.length - 1;
        x._parole.forEach(function (w) {
          var s = 0;
          if (w === t) s = 10;
          else if (w.indexOf(t) === 0) s = t.length >= 3 || ultimo ? 7 : 3;
          else if (t.length >= 5 && w.indexOf(t.slice(0, -1)) === 0) s = 6; // "tagliare" ~ "taglio"
          else if (t.length >= 5 && w.length >= 4 && dist(t, w.slice(0, Math.max(t.length, Math.min(w.length, t.length + 1)))) <= 1) s = 4;
          else if (t.length >= 4 && w.indexOf(t) > 0) s = 2;
          if (s > best) best = s;
        });
        if (!best) ok = false;
        tot += best;
      });
      if (!ok) return;
      if (x._titolo.indexOf(q) === 0) tot += 8;
      if (x.l === "mestiere") tot -= 1;
      res.push([tot, x]);
    });
    // Frase lunga ("il cane ha rotto la zanzariera"): se nessuna voce ha tutte le parole, vale chi ne ha di più.
    if (!res.length && tok.length > 1) {
      LISTA.forEach(function (x) {
        if (x.l === "mestiere") return;
        var tot = 0, prese = 0;
        tok.forEach(function (t) {
          if (t.length < 4) return;
          var best = 0;
          x._parole.forEach(function (w) {
            var s = w === t ? 10 : w.indexOf(t) === 0 ? 7 : (t.length >= 5 && w.indexOf(t.slice(0, -1)) === 0) ? 6 : (t.length >= 5 && w.length >= 4 && dist(t, w.slice(0, Math.max(t.length, Math.min(w.length, t.length + 1)))) <= 1) ? 4 : 0;
            if (s > best) best = s;
          });
          if (best >= 4) { tot += best; prese++; }
        });
        if (prese) res.push([tot + prese * 3, x]);
      });
    }
    // Riconoscimento di supermastro.com: idraulico, elettricista, fabbro, muratore, falegname, giardiniere.
    // Se la frase cade in una di queste categorie, quelle voci salgono. "idr" resta sull'idraulico.
    var SM = {
      idraulico: ["idraulico", "idr", "acqua", "rubinetto", "scarico", "tubo", "perdita", "wc", "lavandino"],
      elettricista: ["elettricista", "elettr", "corrente", "presa", "salvavita", "luce", "scintille"],
      fabbro: ["fabbro", "serratura", "chiave", "cilindro", "blindata"],
      muratore: ["muratore", "muro", "crepa", "intonaco", "piastrelle"],
      falegname: ["falegname", "legno", "mobile", "anta", "parquet"],
      giardiniere: ["giardiniere", "giardino", "erba", "siepe", "potatura", "prato"]
    };
    var sm = "";
    Object.keys(SM).forEach(function (cat) {
      if (sm) return;
      var ok = tok.every(function (t) {
        return SM[cat].some(function (w) { return w === t || (t.length >= 3 && w.indexOf(t) === 0); });
      });
      if (ok) sm = cat;
    });
    if (sm) {
      res.forEach(function (r) { if (r[1].m === sm) r[0] += 6; });
      if (!res.some(function (r) { return r[1].m === sm; })) {
        var primo = null;
        for (var s = 0; s < LISTA.length; s++) if (LISTA[s].m === sm && LISTA[s].l !== "mestiere") { primo = LISTA[s]; break; }
        if (primo) res.push([12, primo]);
      }
    }
    res.sort(function (a, b) { return b[0] - a[0] || a[1].t.length - b[1].t.length; });
    return res.slice(0, max || 7).map(function (r) { return r[1]; });
  }
  function perId(id) { for (var i = 0; i < LISTA.length; i++) if (LISTA[i].id === id) return LISTA[i]; return null; }

  window.ACProblemi = { lista: LISTA, mestieri: MESTIERI, cerca: cerca, perId: perId, norm: norm };
})();
