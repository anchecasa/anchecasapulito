/* Testi copiati da app-anchecasa/js/testi-rete.js. Non riscritti. */
(function () {
  const AC = window.AC = window.AC || {};
/* Testi della rete (10.10.2026): le figure e le regole comuni. Generato dagli stessi testi del Regolamento e dell'Allegato C dei contratti. */
const VERSIONE_REGOLE = "10.10.2026";
const RUOLI_TESTI = {
 "reteitalia": {
  "nome": "Responsabile Rete Italia (capo rete)",
  "breve": "Guidi tutta la rete commerciale d'Italia insieme all'admin.",
  "risponde": "All'admin di AncheCasa.",
  "sotto": "I responsabili sviluppo rete e, tramite loro, capi area, agenti e sub-agenti.",
  "fai": [
   "Coordini gli sviluppo rete e tieni lo stesso metodo in tutta Italia.",
   "Decidi con l'admin chi entra nella rete (proposte) e le linee della sala strategia.",
   "Fissi con l'admin gli obiettivi del mese, per tutta Italia e per persona.",
   "Proponi quando nominare capi area e assegnare le aree, guardando i numeri."
  ],
  "guadagni": [
   [
    "Quota Rete Italia sui servizi",
    "5% della quota della rete su tutti gli affari d'Italia",
    "1,75 € ogni 100 € di utile"
   ],
   [
    "Quota Rete Italia sui lavori",
    "5% della quota della rete su tutti i cantieri",
    "200 € ogni 10.000 € di margine"
   ],
   [
    "Clienti tuoi",
    "Come chi porta il cliente: 70% della quota della rete",
    "24,50 € ogni 100 € di utile"
   ]
  ],
  "attenzione": [
   "Sui clienti di AncheCasa affidati alla rete (portati dall'admin o arrivati dal sito senza codice) la quota Rete Italia non spetta.",
   "Sui lavori le provvigioni maturano a tranche, solo quando AncheCasa incassa: 30% firma, 30% metà lavori, 40% collaudo."
  ],
  "sali": "È il ruolo più alto della rete: risponde direttamente all'admin.",
  "contratto": "AncheCasa-5Contratto-Responsabile-Rete-Italia.pdf"
 },
 "sviluppo": {
  "nome": "Responsabile sviluppo rete",
  "breve": "Costruisci la rete: trovi capi area e agenti in tutta Italia, e li fai crescere.",
  "risponde": "Al Responsabile Rete Italia e all'admin.",
  "sotto": "Le persone che hai proposto (capi area, agenti, sub-agenti) e le loro squadre: la tua linea, in qualunque regione.",
  "fai": [
   "Porti persone valide: chi entra resta nella tua linea, ovunque lavori.",
   "Il primo obiettivo: trovare i capi area delle regioni (2-3 a testa entro fine anno).",
   "Voti le proposte della tua area quando l'area ti è assegnata.",
   "Proponi argomenti nella sala strategia."
  ],
  "guadagni": [
   [
    "Clienti tuoi",
    "70% della quota della rete (chi porta il cliente)",
    "24,50 € ogni 100 € di utile"
   ],
   [
    "Quota sviluppo sui servizi",
    "17% della quota della rete sugli affari della tua linea",
    "5,95 € ogni 100 € di utile"
   ],
   [
    "Quota sviluppo sui lavori",
    "12% della quota della rete sui cantieri della tua linea",
    "480 € ogni 10.000 € di margine"
   ],
   [
    "Quando ti assegnano un'area",
    "La quota sviluppo anche sugli affari dell'area di chi non ha uno sviluppo nella sua linea",
    ""
   ]
  ],
  "attenzione": [
   "Le aree non sono ancora assegnate: si assegnano quando i numeri lo permettono, a chi in quell'area ha costruito di più.",
   "Le persone e i clienti che hai portato fuori dalla tua futura area restano tuoi."
  ],
  "sali": "Il passo dopo è Responsabile Rete Italia o responsabile di un settore (per esempio Edilizia e imprese).",
  "contratto": "AncheCasa-1Contratto-Assistente-Sviluppo-Rete.pdf"
 },
 "capoarea": {
  "nome": "Capo area",
  "breve": "Guidi gli agenti della tua regione e porti i tuoi clienti.",
  "risponde": "Al tuo sviluppo rete e al Responsabile Rete Italia.",
  "sotto": "Gli agenti e i sub-agenti che hai proposto, e quelli della tua regione senza capo area nella loro linea.",
  "fai": [
   "Trovi e formi agenti nella tua regione, fai il punto ogni settimana.",
   "Affianchi gli agenti nelle trattative e nei sopralluoghi.",
   "Aiuti sul posto anche gli agenti di altre linee che lavorano nella tua regione.",
   "Proponi nuove persone: entrano nella tua linea."
  ],
  "guadagni": [
   [
    "Clienti tuoi",
    "70% della quota della rete (chi porta il cliente)",
    "24,50 € ogni 100 € di utile"
   ],
   [
    "Quota capo area sui servizi",
    "8% della quota della rete sulla tua linea e sulla tua regione",
    "2,80 € ogni 100 € di utile"
   ],
   [
    "Quota capo area sui lavori",
    "8% della quota della rete sui cantieri",
    "320 € ogni 10.000 € di margine"
   ],
   [
    "Lavori che chiudi o segui tu",
    "Chi chiude 25%, chi segue il cantiere 30% della quota della rete",
    "1.000 € + 1.200 € ogni 10.000 € di margine"
   ]
  ],
  "attenzione": [
   "Un capo area si nomina di norma quando nella regione ci sono almeno 5 agenti attivi.",
   "Ogni quota di ruolo si paga una sola volta per affare: se l'agente ha già un capo area nella sua linea, la quota va a quello."
  ],
  "sali": "Il passo dopo è sviluppo rete, quando un'area si divide o serve un nuovo responsabile.",
  "contratto": "AncheCasa-2Contratto-Capo-Area.pdf"
 },
 "agente": {
  "nome": "Agente",
  "breve": "Porti aziende, artigiani e lavori, e segui i tuoi clienti.",
  "risponde": "Al tuo capo area.",
  "sotto": "I sub-agenti e i segnalatori che hai proposto.",
  "fai": [
   "Registri ogni cliente nell'app prima di tutto: il cliente è di chi lo registra per primo.",
   "Aiuti l'azienda a completare il profilo e a fare la prima offerta o richiesta entro 30 giorni.",
   "Per i lavori fai il sopralluogo con il tecnico e segui il cantiere fino al collaudo.",
   "Se AncheCasa ti affida un cliente, lo chiami entro 48 ore."
  ],
  "guadagni": [
   [
    "Aziende e servizi che porti",
    "70% della quota della rete, ogni mese finché il cliente paga",
    "24,50 € ogni 100 € di utile"
   ],
   [
    "Clienti dei tuoi sub-agenti",
    "30% della loro quota",
    "7,35 € ogni 100 € di utile"
   ],
   [
    "Clienti di AncheCasa affidati a te",
    "Metà della quota di chi porta",
    "12,25 € ogni 100 € di utile"
   ],
   [
    "Lavori",
    "Segnali 10%, chiudi 25%, segui 30%, porti l'impresa 10% della quota della rete",
    "fino a 3.000 € ogni 10.000 € di margine"
   ]
  ],
  "attenzione": [
   "Sui privati niente provvigioni, solo sui lavori: il privato che registri resta tuo per 12 mesi, che ripartono a ogni contatto registrato.",
   "Puoi lavorare in tutta Italia: i clienti che porti fuori zona restano tuoi."
  ],
  "sali": "Il passo dopo è capo area, quando nella regione serve o il gruppo si divide.",
  "contratto": "AncheCasa-3Contratto-Agente.pdf"
 },
 "subagente": {
  "nome": "Sub-agente",
  "breve": "Cominci nella rete accanto al tuo agente: segnali e porti clienti.",
  "risponde": "Al tuo agente di riferimento.",
  "sotto": "Nessuno, per ora.",
  "fai": [
   "Presenti AncheCasa e registri i clienti nell'app prima di tutto.",
   "Ti fai affiancare dal tuo agente nelle trattative.",
   "Segnali lavori: ristrutturazioni, bagni, tetti, impianti."
  ],
  "guadagni": [
   [
    "Clienti che porti",
    "70% della quota di chi porta (il 30% va al tuo agente)",
    "17,15 € ogni 100 € di utile"
   ],
   [
    "Lavori",
    "Le quote di ruolo dei lavori, divise 70% a te e 30% al tuo agente",
    "per esempio 280 € se segnali un lavoro con 10.000 € di margine"
   ]
  ],
  "attenzione": [
   "Senza partita IVA puoi ricevere fino a 5.000 € lordi; oltre, restano maturati e si pagano quando apri la partita IVA.",
   "Sui privati niente provvigioni, solo sui lavori."
  ],
  "sali": "Il passo dopo è agente: apri la partita IVA e firmi il contratto da agente.",
  "contratto": "AncheCasa-4Contratto-Subagente.pdf"
 }
};
const REGOLE = [
 [
  "C.1 Ingresso nella rete",
  "Si entra nella rete solo con proposta approvata dalla Società e dal Responsabile Rete Italia e, ove nominato, dal Responsabile Sviluppo Rete dell'area interessata. Ogni componente della rete può proporre nuove persone; gli incarichi sono conferiti esclusivamente dalla Società."
 ],
 [
  "C.2 Chi porta, tiene",
  "Ogni persona che entra nella rete fa parte della linea di chi l'ha proposta, in qualunque regione operi. Le quote di linea dell'Allegato A (chi porta il cliente e, per i ruoli presenti nella linea, sviluppo rete e capo area) seguono la linea di chi ha acquisito il cliente, indipendentemente dalla regione in cui il cliente si trova. Per ciascun affare ogni quota di ruolo è riconosciuta una sola volta."
 ],
 [
  "C.3 Attribuzione dei clienti",
  "Il cliente è attribuito a chi lo registra per primo nel sistema AncheCasa; fanno fede la data e l'ora registrate dal sistema. Le aziende sono identificate dalla partita IVA, i privati dal recapito telefonico o di posta elettronica. L'attribuzione permane finché il cliente resta attivo. Se un cliente è segnalato da un componente della rete e acquisito da un altro, si applica la ripartizione dell'Allegato A (45% a chi chiude, 25% a chi segnala)."
 ],
 [
  "C.4 Iscrizioni dirette",
  "L'azienda o l'artigiano che si iscrive direttamente alla piattaforma è attribuito: (a) al componente della rete di cui indica il codice al momento dell'iscrizione; (b) in mancanza, al componente che ne aveva registrato la partita IVA nei novanta (90) giorni precedenti; (c) in mancanza di entrambi, è cliente della Società ai sensi dell'art. C.5."
 ],
 [
  "C.5 Clienti della Società affidati",
  "I clienti acquisiti direttamente dalla Società, anche tramite i suoi amministratori o il sito internet, possono essere affidati dalla Società a un componente della rete perché li segua. All'affidatario spetta il 50% della quota “chi porta il cliente” sui Servizi acquistati dal cliente affidato; su tali clienti non spettano le quote di sviluppo rete, capo area e Responsabile Rete Italia, che restano alla Società. Sui Servizi e sui lavori ulteriori procurati personalmente dall'affidatario spettano le quote ordinarie. L'affidatario contatta il cliente entro quarantotto (48) ore dall'affidamento; in mancanza la Società può affidarlo ad altri. Gli artigiani iscritti direttamente sono affidati solo dopo la verifica della Società."
 ],
 [
  "C.6 Clienti privati",
  "Sull'iscrizione dei clienti privati e sui Servizi da essi acquistati non spetta alcuna provvigione. Le provvigioni sui privati spettano solo sui lavori, secondo la sezione A.2 dell'Allegato A. Il privato registrato da un componente della rete resta a lui collegato per dodici (12) mesi, che decorrono nuovamente da ogni contatto registrato nel sistema AncheCasa: se in tale periodo il privato commissiona un lavoro, anche contattando direttamente la Società, a quel componente spetta la quota “chi segnala”. Per i privati giunti direttamente alla Società la quota “chi segnala” resta alla Società."
 ],
 [
  "C.7 Territorio",
  "Aree e regioni sono assegnate in base ai risultati registrati nel sistema AncheCasa, quando la Società, sentito il Responsabile Rete Italia, ritiene che i risultati lo consentano. Il capo area di una regione è di norma nominato quando nella regione operano almeno cinque (5) agenti attivi, ed è scelto tra chi vi ha costruito di più (persone attive e clienti attivi); lo stesso criterio vale per l'assegnazione delle aree ai Responsabili Sviluppo Rete. Con la nomina, il responsabile matura la propria quota di ruolo sugli affari della regione o dell'area acquisiti da componenti che non hanno un responsabile dello stesso ruolo nella propria linea, affianca sul posto la rete che vi opera e non toglie quote di linea già esistenti."
 ],
 [
  "C.8 Ruoli non presenti",
  "Quando in una linea manca un ruolo e nessun responsabile territoriale ne ha diritto ai sensi dell'art. C.7, la relativa quota resta alla Società, salvo la quota del Responsabile Rete Italia prevista dal suo contratto."
 ],
 [
  "C.9 Trasparenza e obiettivi",
  "Ogni componente della rete vede nel sistema AncheCasa i propri clienti, la propria linea, le provvigioni maturate e gli obiettivi. Gli obiettivi sono indicati dalla Società e dal Responsabile Rete Italia e hanno valore indicativo. Le linee decise dalla Società, anche nella sala strategia del sistema AncheCasa, costituiscono direttive commerciali generali."
 ],
 [
  "C.10 Documenti e firma nell'app",
  "Le Parti convengono che contratti, circolari, regolamenti e loro modifiche possano essere sottoscritti anche con firma elettronica nel sistema AncheCasa, che registra l'identità dell'utente, la data, l'ora e il testo firmato; la Società mette a disposizione del firmatario copia del documento firmato. Le modifiche che riducono i diritti del componente della rete richiedono sempre il suo consenso espresso."
 ]
];

  AC.testiRete = { VERSIONE_REGOLE, RUOLI_TESTI, REGOLE };
})();
