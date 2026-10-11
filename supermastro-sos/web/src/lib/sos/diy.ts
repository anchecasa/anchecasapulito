export type DiyGuide = {
  spiegazione: string;
  attrezzi: string[];
  passi: string[];
};

const IDRAULICO: DiyGuide = {
  spiegazione:
    "L'acqua esce dalla giunzione sotto il lavandino. Di solito è la guarnizione del sifone, schiacciata o fuori sede.",
  attrezzi: ["Bacinella", "Straccio", "Guarnizione nuova", "Pinza regolabile", "Nastro di teflon"],
  passi: [
    "Chiudi il rubinetto di arresto sotto il lavandino e apri il miscelatore per svuotare il tubo.",
    "Metti la bacinella sotto il sifone.",
    "Svita a mano i due dadi del sifone. Se non girano, usa la pinza con poca forza.",
    "Togli la guarnizione vecchia, pulisci la sede e infila quella nuova.",
    "Rimonta il sifone, stringi i dadi a mano e riapri l'acqua.",
    "Controlla la giunzione per un minuto. Se resta asciutta, il guasto è chiuso.",
  ],
};

const ELETTRICISTA: DiyGuide = {
  spiegazione:
    "La presa fa scintille quando entra la spina. Il contatto interno è allentato o bruciato.",
  attrezzi: ["Cacciavite isolato", "Cercafase", "Presa nuova", "Nastro isolante"],
  passi: [
    "Stacca la corrente dall'interruttore generale e verifica con il cercafase che la presa sia spenta.",
    "Svita la placca e la presa.",
    "Controlla che i fili non siano anneriti. Se lo sono, non proseguire e chiama un elettricista.",
    "Se i fili sono puliti, allenta i morsetti, taglia il rame bruciato e reinserisci il filo nella presa nuova.",
    "Chiudi la placca, ridai corrente e prova la spina una sola volta.",
  ],
};

const FABBRO: DiyGuide = {
  spiegazione:
    "La serratura non gira. Spesso la chiave è rimasta a metà corsa e il cilindro è secco o bloccato.",
  attrezzi: ["Grafite in polvere", "Cacciavite piccolo", "Olio per serrature", "Pinzetta"],
  passi: [
    "Non forzare la chiave. Se è spezzata dentro, fermati e passa al professionista.",
    "Se la chiave è intera, muovila piano a destra e a sinistra senza spingere.",
    "Soffia grafite nel cilindro e riprova il giro.",
    "Se gira, apri la porta e metti una goccia di olio sul cilindro, non nel buco della chiave.",
    "Estrai e reinserisci la chiave tre volte. Se si blocca ancora, serve il fabbro.",
  ],
};

const GIARDINIERE: DiyGuide = {
  spiegazione:
    "Il problema è in giardino. Se c'è una perdita, chiudi l'acqua dell'irrigazione prima di smontare la testina.",
  attrezzi: ["Guanti", "Cesoie", "Rastrello"],
  passi: [
    "Guarda se la pianta è secca, gialla o coperta di insetti.",
    "Se l'irrigatore non gira, chiudi l'acqua e svita la testina per togliere la terra.",
    "Se il tubo perde, chiudi il rubinetto del giardino e segna il punto.",
    "Se il ramo è grosso o la siepe è alta, chiama il giardiniere.",
  ],
};

const LATTONIERE: DiyGuide = {
  spiegazione: "Il problema è su grondaia o tetto. Il controllo si fa da terra, senza salire.",
  attrezzi: ["Secchio"],
  passi: [
    "Resta a terra. Non salire su scala o tetto.",
    "Guarda se la grondaia è piena di foglie o staccata.",
    "Se l'acqua entra in casa, sposta ciò che si bagna e chiama il lattoniere.",
  ],
};

const DISINFESTAZIONE: DiyGuide = {
  spiegazione: "Ci sono insetti o un nido. Non avvicinarti e non spruzzare prodotti sul nido.",
  attrezzi: [],
  passi: [
    "Allontanati e tieni chiuse porte e finestre vicine.",
    "Non colpire il nido.",
    "Chiama la disinfestazione.",
  ],
};

const CLIMATIZZAZIONE: DiyGuide = {
  spiegazione: "Il climatizzatore non raffredda, gocciola o non parte.",
  attrezzi: ["Panno"],
  passi: [
    "Controlla le pile del telecomando e la modalità raffrescamento.",
    "Se il filtro si sfila senza attrezzi, puliscilo e rimettilo.",
    "Se gocciola dentro, spegnilo. Se senti odore di bruciato, stacca la corrente e chiama il tecnico.",
  ],
};

const MURATORE: DiyGuide = {
  spiegazione: "C'è una crepa, un distacco o un pezzo di muro che cede.",
  attrezzi: [],
  passi: [
    "Non picchiare la crepa e non coprirla con stucco se è larga o si muove.",
    "Allontana mobili e persone dal punto che cade.",
    "Se il pezzo è strutturale o sopra una porta, chiama il muratore.",
  ],
};

const IMBIANCHINO: DiyGuide = {
  spiegazione: "L'intonaco o la pittura si scrostano, macchiano o restano umidi.",
  attrezzi: ["Panno asciutto"],
  passi: [
    "Tocca il muro. Se è umido, cerca prima la perdita e non pitturare.",
    "Se è solo scrostato e asciutto, spazzola la parte molle.",
    "Per una parete intera o macchie che tornano, chiama l'imbianchino.",
  ],
};

const PIASTRELLE: DiyGuide = {
  spiegazione: "Una piastrella è rotta, staccata o suona vuota.",
  attrezzi: ["Nastro di carta"],
  passi: [
    "Non camminare sul pezzo rotto.",
    "Raccogli i frammenti e copri il buco con nastro, se è a pavimento.",
    "Se più piastrelle si muovono, chiama il piastrellista.",
  ],
};

const FALEGNAME: DiyGuide = {
  spiegazione: "Un'anta, un mobile o un legno di casa non chiude o è rotto.",
  attrezzi: ["Cacciavite"],
  passi: [
    "Controlla se la cerniera è solo allentata. Se le viti girano, stringile senza forzare.",
    "Se il legno è spaccato o l'anta è fuori squadra, non forzare la chiusura.",
    "Chiama il falegname se il pezzo non sta più in sede.",
  ],
};

const SERRAMENTI: DiyGuide = {
  spiegazione: "Finestra, persiana o infisso non chiudono o lasciano passare aria e acqua.",
  attrezzi: ["Panno"],
  passi: [
    "Pulisci il binario e togli terra o foglie.",
    "Prova la maniglia senza forzare. Se è dura, fermati.",
    "Se entra acqua o l'anta è storta, chiama il serramentista.",
  ],
};

const CARTONGESSO: DiyGuide = {
  spiegazione: "C'è un buco o una crepa nel cartongesso.",
  attrezzi: [],
  passi: [
    "Non allargare il buco.",
    "Se dietro vedi cavi o tubi, non infilare attrezzi.",
    "Per un buco più grande di una mano, chiama chi lavora il cartongesso.",
  ],
};

export function diyForTrade(trade: string): DiyGuide {
  const name = trade.toLowerCase();
  if (name.includes("giardin")) return GIARDINIERE;
  if (name.includes("latton") || name.includes("gronda") || name.includes("tetto")) return LATTONIERE;
  if (name.includes("disinfest")) return DISINFESTAZIONE;
  if (name.includes("climat") || name.includes("condizion")) return CLIMATIZZAZIONE;
  if (name.includes("piastrell")) return PIASTRELLE;
  if (name.includes("imbianch")) return IMBIANCHINO;
  if (name.includes("cartongess")) return CARTONGESSO;
  if (name.includes("falegn")) return FALEGNAME;
  if (name.includes("serrament")) return SERRAMENTI;
  if (name.includes("murator")) return MURATORE;
  if (name.includes("elettr")) return ELETTRICISTA;
  if (name.includes("fabbr") || name.includes("serr")) return FABBRO;
  return IDRAULICO;
}
