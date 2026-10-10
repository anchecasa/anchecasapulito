# -*- coding: utf-8 -*-
# AncheCasa Magazine · contenuti del sito magazine.anchecasa.it
# Per un nuovo numero: aggiungi il numero in NUMERI e i suoi articoli in ARTICOLI (campo "numero"), poi lancia genera.py.
# Regola della redazione: nessuna impresa citata o sponsorizzata; per chi lo fa, sempre anchecasa.it.

AGGIORNATO = "2026-10-10"          # data di controllo dei contenuti (formato AAAA-MM-GG)
SCADENZA_BONUS = "2026-12-31"      # per il conto alla rovescia in home

NUMERI = [
    {"n": 1, "data": "Ottobre 2026", "uscita": "2026-10-09", "copertina": "copertina-n1.jpg",
     "titolo": "Il primo numero",
     "strillo": "Gli ultimi giorni del bonus casa al 50%, la bolletta letta in due minuti, il preventivo blindato.",
     "sfoglia": "https://anchecasa.it/magazine"},
    {"n": 2, "data": "1° novembre 2026", "uscita": "2026-11-01", "copertina": None,
     "titolo": "In arrivo",
     "strillo": "Esce l’app gratuita della raccolta differenziata: cosa portare fuori stasera, nel tuo Comune.",
     "sfoglia": None},
]

RUBRICHE = [
    ("bonus", "Bonus e detrazioni", "Quanto torna indietro, entro quando, con quali documenti."),
    ("bollette", "Bollette ed energia", "Leggere la bolletta, pagare il giusto, consumare meno."),
    ("lavori", "Lavori in casa", "Preventivi, pratiche e cantiere: le regole per non sbagliare."),
    ("abitare", "Abitare", "Bagno, cucina, esterni: come si vive meglio, con le misure giuste."),
    ("cura", "Cura della casa", "Manutenzione e obblighi, stagione per stagione."),
    ("guide", "Guide rapide", "I numeri e le parole della casa, in cinque minuti."),
]

APP = [
    {"id": "check-bollette", "nome": "Check Bollette", "stato": "Disponibile",
     "cosa": "Scrivi quanto hai pagato, quanto hai consumato e di quanti mesi è la bolletta. In un minuto sai se paghi troppo luce o gas, quanto puoi risparmiare in un anno e scarichi il report in PDF.",
     "punti": ["Luce e gas", "I dati restano sul tuo telefono", "Report PDF gratuito"],
     "link": "/check-bollette", "tasto": "Apri Check Bollette", "nota": "Funziona dal telefono e dal PC, senza scaricare niente."},
    {"id": "supermastro", "nome": "SuperMastro", "stato": "Disponibile",
     "cosa": "Inquadri il problema di casa con il telefono per cinque secondi: rubinetto che gocciola, tapparella bloccata, muffa, crepa. SuperMastro ti dice cos’è, se puoi sistemarlo da solo con attrezzi e passaggi, oppure quale artigiano serve.",
     "punti": ["Dentro e fuori casa, prato compreso", "Guida passo passo con gli attrezzi", "Solo se vuoi, l’artigiano vicino"],
     "link": "https://anchecasa.it/supermastro", "tasto": "Apri SuperMastro", "nota": "Si usa dal telefono."},
    {"id": "raccolta", "nome": "App della raccolta", "stato": "Esce il 1° novembre",
     "cosa": "Scegli il tuo Comune e ogni sera sai cosa portare fuori, bidone per bidone, con giorni e orari. La sera prima ti arriva l’avviso sul telefono.",
     "punti": ["Collegata al calendario del tuo Comune", "Avviso la sera prima", "Gratuita da scaricare e da usare"],
     "link": "#iscriviti", "tasto": "Avvisami quando esce", "nota": "Lasciaci la mail: ti scriviamo il giorno dell’uscita."},
]

# ---------------------------------------------------------------- articoli
# corpo: HTML semplice (p, h2, ul, ol, blockquote, figure). Niente nomi di imprese.
ARTICOLI = [
{
 "slug": "la-casa-finalmente-spiegata-bene", "numero": 1, "rubrica": "editoriale", "ordine": 0,
 "titolo": "La casa, finalmente spiegata bene",
 "sommario": "Perché nasce AncheCasa Magazine: risposte chiare, numeri con la fonte e strumenti gratuiti, ogni quindici giorni.",
 "img": "editoriale.jpg", "alt": "Una lettrice sfoglia AncheCasa Magazine sul divano", "lettura": 3,
 "corpo": """
<p>Ogni giorno milioni di italiani cercano come si legge una bolletta, quanto costa rifare il bagno, se il bonus vale ancora. Trovano mille pagine uguali, scritte per piacere ai motori di ricerca più che alle persone. Spesso vecchie di anni, quasi sempre piene di pubblicità.</p>
<p>AncheCasa Magazine fa il contrario. Ogni quindici giorni spieghiamo una cosa alla volta, con parole semplici, e mettiamo la fonte accanto a ogni numero. In cima a ogni articolo trovi la data dell’ultimo controllo: quando una regola cambia, cambiamo l’articolo.</p>
<h2>Tre promesse</h2>
<ol>
<li><strong>Solo per chi abita una casa.</strong> Scriviamo per i cittadini: proprietari, inquilini, famiglie. Non per gli addetti ai lavori.</li>
<li><strong>Nessuna impresa in vetrina.</strong> Qui nessuno paga per comparire: non trovi pubblicità, marchi sponsorizzati o articoli «consigliati». Quando ti serve qualcuno che faccia il lavoro, ti indichiamo un solo posto: <a href="https://anchecasa.it">anchecasa.it</a>, dove scegli tu tra chi lavora nella tua zona.</li>
<li><strong>Strumenti gratuiti, per sempre.</strong> Dentro la rivista ci sono app che puoi usare subito: per controllare la bolletta, per capire un guasto, presto per la raccolta differenziata. Si usano e si scaricano gratis, sempre.</li>
</ol>
<h2>Chi lo fa</h2>
<p>Il magazine è di AncheCasa, la piazza che mette in contatto chi ha bisogno di un lavoro in casa con chi lo fa. Le app che trovi qui le ha sviluppate AncheStudio, la società di software di AncheCasa, la stessa che ha costruito tutta la piattaforma.</p>
<p>Lo diciamo chiaro perché la fiducia comincia da qui: sai sempre chi ti sta parlando.</p>
<blockquote>Una cosa alla volta, spiegata bene. Se non è chiara, è colpa nostra.</blockquote>
<p>Buona lettura. E se c’è un argomento che vorresti capire meglio, scrivici: il prossimo numero lo facciamo anche con le tue domande.</p>
<p><em>La redazione di AncheCasa</em></p>
""",
 "fonti": []
},
{
 "slug": "bonus-casa-2026-gli-ultimi-giorni-al-50", "numero": 1, "rubrica": "bonus", "ordine": 1, "copertina": True,
 "novita": [["2026-10-10", "Confermato: il 50% sulla casa dove abiti vale per i pagamenti fino al 31 dicembre 2026. Dal 2027 si scende al 36%, salvo proroghe nella Legge di Bilancio 2027."]],
 "titolo": "Bonus casa: gli ultimi giorni al 50%",
 "sommario": "Dal 1° gennaio 2027 le detrazioni per la casa scendono. Chi paga i lavori entro il 31 dicembre recupera di più: ecco quanto, e come non perdere nulla.",
 "img": "bonus.jpg", "alt": "Chiavi, fatture e calcolatrice sul tavolo di casa", "lettura": 5,
 "corpo": """
<p>Il 2026 è l’ultimo anno, salvo proroghe, in cui i lavori sulla casa dove abiti danno indietro la metà di quello che spendi. Dal 2027 la percentuale scende, e scende ancora nel 2028. Se hai in mente di ristrutturare, i prossimi giorni contano.</p>
<h2>Quanto torna indietro</h2>
<div class="tabella">
<table>
<thead><tr><th>Pagamento</th><th>Casa dove abiti</th><th>Altri immobili</th></tr></thead>
<tbody>
<tr><td>Entro il 31 dicembre 2026</td><td><strong>50%</strong></td><td>36%</td></tr>
<tr><td>Nel 2027</td><td>36%</td><td>30%</td></tr>
<tr><td>Dal 2028</td><td>30%</td><td>30%</td></tr>
</tbody>
</table>
</div>
<p>Il tetto di spesa è di 96.000 euro per unità immobiliare. La detrazione si recupera in <strong>dieci rate annuali</strong>, nella dichiarazione dei redditi: non è uno sconto immediato, è meno Irpef da pagare per dieci anni.</p>
<h2>Un esempio con 20.000 euro di lavori</h2>
<ul class="numeri">
<li><span>10.000 €</span> recuperati sulla prima casa pagando entro il 31 dicembre 2026, cioè 1.000 euro l’anno per dieci anni.</li>
<li><span>7.200 €</span> recuperati sulla stessa casa pagando nel 2027.</li>
<li><span>7.200 €</span> su una seconda casa nel 2026, che diventano 6.000 € nel 2027.</li>
</ul>
<h2>Conta la data del bonifico</h2>
<p>Per le persone fisiche vale il <strong>principio di cassa</strong>: conta il giorno in cui paghi, non quello in cui finiscono i lavori. Un acconto pagato a dicembre con il bonifico giusto si porta dietro il 50%, anche se il cantiere chiude in primavera. Il saldo pagato a gennaio, invece, avrà l’aliquota del 2027.</p>
<p>Attenzione: per avere il 50% la casa deve essere la tua abitazione principale e devi esserne proprietario o titolare di un diritto reale (per esempio usufrutto).</p>
<h2>Gli altri bonus</h2>
<ul>
<li><strong>Ecobonus e Sismabonus</strong> seguono le stesse percentuali: 50% sulla prima casa e 36% sulle altre nel 2026.</li>
<li><strong>Bonus Mobili</strong>: se ristrutturi, recuperi il 50% di mobili ed elettrodomestici nuovi, fino a 5.000 euro di spesa.</li>
<li><strong>Caldaie</strong>: quelle alimentate solo a combustibili fossili non sono più agevolate.</li>
</ul>
<h2>Cosa fare adesso</h2>
<ol>
<li>Chiedi i preventivi subito: a dicembre le imprese sono piene.</li>
<li>Verifica che la casa sia in regola e quale pratica serve (leggi <a href="/articoli/che-pratica-mi-serve">Che pratica mi serve?</a>).</li>
<li>Paga con il bonifico parlante, mai in contanti (leggi <a href="/articoli/il-bonifico-che-salva-il-tuo-bonus">Il bonifico che salva il tuo bonus</a>).</li>
</ol>
<p class="nota">La Legge di Bilancio 2027 potrebbe prorogare le percentuali attuali: se succede, aggiorniamo questo articolo il giorno stesso.</p>
""",
 "fonti": [["Legge di Bilancio 2026 (L. 199/2025)", ""], ["Cose di Casa, «Bonus ristrutturazioni: ultima chiamata per il 50%»", "https://www.cosedicasa.com/news/notizie/bonus-ristrutturazioni-ultima-chiamata-per-il-50-cosa-cambia-dal-2027"], ["Ediltecnico, «Bonus edilizi 2026»", "https://ediltecnico.it/bonus-edilizi-2026-legge-di-bilancio/"]]
},
{
 "slug": "il-bonifico-che-salva-il-tuo-bonus", "numero": 1, "rubrica": "bonus", "ordine": 2,
 "titolo": "Il bonifico che salva il tuo bonus",
 "sommario": "Un bonifico sbagliato può costarti tutta la detrazione. Ecco i tre dati che non devono mancare.",
 "img": "bonifico.jpg", "alt": "Un bonifico parlante compilato per una ristrutturazione", "lettura": 4,
 "corpo": """
<p>Per i bonus casa non basta pagare: bisogna pagare nel modo giusto. Il bonifico «parlante» è un bonifico speciale che la banca riconosce come spesa detraibile. In home banking lo trovi di solito come «bonifico per ristrutturazione» o «bonifico per detrazioni fiscali».</p>
<h2>I tre dati obbligatori</h2>
<ol>
<li><strong>La partita IVA dell’impresa</strong> (o il codice fiscale del professionista) che emette la fattura.</li>
<li><strong>La causale</strong> con la norma del bonus. Per la ristrutturazione: «Lavori con detrazione art. 16-bis DPR 917/1986», con il numero e la data della fattura.</li>
<li><strong>Il codice fiscale di chi detrae</strong>: la persona che porterà la spesa nella dichiarazione dei redditi. Se siete in due, indicateli entrambi.</li>
</ol>
<h2>Gli errori che costano cari</h2>
<ul>
<li><strong>Contanti, assegni o bonifico ordinario</strong>: la detrazione è persa.</li>
<li><strong>Dati sbagliati</strong>: se la causale o il codice fiscale non tornano, chiedi subito all’impresa e alla banca come rimediare.</li>
<li><strong>Chi paga non è chi detrae</strong>: la spesa la detrae chi è indicato nel bonifico e ha sostenuto la spesa.</li>
</ul>
<h2>Prima di pagare</h2>
<ul>
<li>La casa deve essere in regola e la pratica giusta presentata: CILA o SCIA, quando servono.</li>
<li>Sui bonifici parlanti la banca trattiene all’impresa una ritenuta d’acconto dell’11%: è normale, non riguarda te.</li>
<li>Per i lavori di risparmio energetico c’è la comunicazione all’ENEA entro 90 giorni dalla fine dei lavori. Di solito la prepara il tecnico.</li>
</ul>
<h2>Cosa conservare</h2>
<p>Tieni per almeno dieci anni, cioè per tutta la durata della detrazione: fatture, ricevute dei bonifici, pratiche edilizie, eventuale ricevuta ENEA. In caso di controllo te li chiederanno.</p>
<blockquote>Prima di premere «invia», rileggi i tre dati. È il controllo più economico di tutta la ristrutturazione.</blockquote>
""",
 "fonti": [["Agenzia delle Entrate, guida «Ristrutturazioni edilizie: le agevolazioni fiscali»", "https://www.agenziaentrate.gov.it/portale/web/guest/agevolazioni/detrristredil36"], ["DPR 917/1986, art. 16-bis", ""]]
},
{
 "slug": "la-bolletta-smontata", "numero": 1, "rubrica": "bollette", "ordine": 3, "strumento": "check-bollette",
 "novita": [["2026-10-01", "Da ottobre la bolletta della luce dei clienti vulnerabili aumenta del 37,3% (ARERA)."], ["2026-01-01", "La soglia ISEE per il bonus sociale su luce, gas e acqua sale a 9.796 euro."]],
 "titolo": "La bolletta, smontata",
 "sommario": "Quattro voci, due codici, un numero da controllare. Come leggere la bolletta della luce in due minuti e capire se paghi troppo.",
 "img": "bolletta.jpg", "alt": "Mani che tengono una bolletta e uno smartphone", "lettura": 5,
 "corpo": """
<p>Una bolletta sembra scritta per non essere letta. In realtà le cose che contano sono poche, e stanno quasi tutte nella prima pagina.</p>
<h2>Le quattro cose da guardare</h2>
<ol>
<li><strong>Il codice POD (luce) o PDR (gas).</strong> È il codice del tuo contatore: ti serve per cambiare fornitore o per confrontare le offerte.</li>
<li><strong>I consumi.</strong> Controlla se la lettura è <em>reale</em> o <em>stimata</em>. Se è stimata, comunica l’autolettura: paghi quello che consumi davvero.</li>
<li><strong>Il totale.</strong> Dividilo per i kWh consumati e ottieni il costo medio. Con 165 euro per 420 kWh, per esempio, paghi circa 0,39 euro al kWh, tutto compreso.</li>
<li><strong>Le quattro voci di spesa.</strong> Materia energia, trasporto e gestione del contatore, oneri di sistema, imposte. Solo la prima dipende davvero dall’offerta che hai scelto.</li>
</ol>
<h2>Cosa succede da ottobre</h2>
<p>Per i clienti vulnerabili ancora serviti alle condizioni stabilite da ARERA, la bolletta della luce aumenta del 37,3% nel quarto trimestre 2026. Se sei in questa situazione, confrontare le offerte vale più che mai.</p>
<h2>Il bonus sociale</h2>
<p>Con un ISEE fino a 9.796 euro, oppure fino a 20.000 euro con almeno quattro figli a carico, hai diritto al bonus sociale su luce, gas e acqua. Non serve chiederlo: arriva in automatico in bolletta dopo che hai presentato la DSU per l’ISEE.</p>
<h2>Verifica la tua</h2>
<p>Con <strong>Check Bollette</strong> metti i tre numeri della tua bolletta (totale, consumi, mesi) e in un minuto sai se il prezzo è giusto rispetto al riferimento ARERA, quanto puoi risparmiare in un anno e scarichi il report in PDF. È gratuito e i tuoi dati restano sul tuo telefono.</p>
""",
 "fonti": [["ARERA, aggiornamento condizioni clienti vulnerabili IV trimestre 2026", "https://www.arera.it"], ["ARERA, comunicato «Bonus sociali: soglia ISEE a 9.796 euro»", "https://www.arera.it/comunicati-stampa/dettaglio/bonus-sociali-arera-alza-a-9796-euro-la-soglia-isee-per-laccesso-alle-agevolazioni-per-acqua-luce-gas-e-rifiuti"]]
},
{
 "slug": "prima-isola-poi-scalda", "numero": 1, "rubrica": "bollette", "ordine": 4, "copertina": True,
 "titolo": "Prima isola, poi scalda",
 "sommario": "Cappotto, pompa di calore, fotovoltaico: l’ordine giusto degli interventi fa la differenza in bolletta.",
 "img": "pompa-calore.jpg", "alt": "Pompa di calore sul terrazzo di una casa con cappotto termico", "lettura": 4,
 "corpo": """
<p>Chi vuole spendere meno per scaldare casa di solito parte dalla caldaia. È l’errore più comune: una macchina nuova in una casa che disperde lavora il doppio e non mantiene le promesse.</p>
<h2>L’ordine giusto</h2>
<ol>
<li><strong>Isola.</strong> Cappotto, sottotetto o solaio: prima fermi le dispersioni e i ponti termici, che sono anche i punti dove nasce la muffa.</li>
<li><strong>Scalda.</strong> Con la casa isolata, una pompa di calore lavora a basse temperature e consuma poco. Se la casa non si può isolare, valuta un sistema ibrido.</li>
<li><strong>Produci.</strong> Il fotovoltaico insieme alla pompa di calore è la coppia che rende di più: l’energia che produci alimenta il riscaldamento.</li>
</ol>
<blockquote>Una pompa di calore in una casa che disperde lavora il doppio.</blockquote>
<h2>Prima di scegliere</h2>
<ul>
<li><strong>Diagnosi energetica.</strong> Un tecnico misura dove scappa il calore e ti dice cosa conviene fare per primo.</li>
<li><strong>Potenza calcolata, non scelta dal catalogo.</strong> Una macchina troppo grande costa di più e si consuma prima.</li>
<li><strong>Valvole termostatiche.</strong> Costano poco, si montano senza lavori e fanno risparmiare subito.</li>
</ul>
<h2>E i bonus?</h2>
<p>Gli interventi di risparmio energetico rientrano nell’Ecobonus: nel 2026 il 50% sulla casa dove abiti e il 36% sulle altre. Ricorda che le caldaie solo a combustibili fossili non sono più agevolate.</p>
""",
 "fonti": [["ENEA, portale detrazioni fiscali", "https://www.efficienzaenergetica.enea.it"], ["Osservatorio ProntoPro, richieste di installazione pompe di calore 2024–2026", ""]]
},
{
 "slug": "finestre-che-isolano-davvero", "numero": 1, "rubrica": "lavori", "ordine": 5,
 "titolo": "Finestre che isolano davvero",
 "sommario": "Trasmittanza, vetri, sicurezza e posa: i quattro numeri per scegliere i serramenti senza farsi confondere.",
 "img": "finestra.jpg", "alt": "Finestra nuova affacciata sui tetti di un centro storico", "lettura": 4,
 "corpo": """
<p>Cambiare le finestre è uno dei lavori che si sentono di più: meno spifferi, meno rumore, bollette più basse. Ma i cataloghi parlano una lingua tecnica. Ecco come tradurla.</p>
<h2>Il numero che conta: Uw</h2>
<p>La <strong>trasmittanza Uw</strong> dice quanto calore passa attraverso tutta la finestra, telaio compreso. Più è bassa, meglio isola. Per avere l’Ecobonus servono valori massimi diversi a seconda della zona climatica del tuo Comune: chiedi sempre che sia scritto nel preventivo.</p>
<h2>Vetro doppio o triplo</h2>
<p>Il vetro doppio è ormai lo standard. Il triplo conviene nelle zone fredde, sulle facciate esposte a nord o dove c’è molto rumore. Nelle zone calde, guarda anche il fattore solare: quanto calore del sole lascia entrare d’estate.</p>
<h2>Rumore</h2>
<p>L’abbattimento acustico si misura in decibel: se abiti su una strada trafficata, è un dato da confrontare quanto la Uw.</p>
<h2>Sicurezza</h2>
<p>La norma EN 1627 fissa le classi antieffrazione da RC1 a RC6. Al piano terra o con balconi facili da raggiungere, parti almeno da RC2.</p>
<h2>La posa conta quanto la finestra</h2>
<p>La norma UNI 11673 definisce la <strong>posa qualificata</strong>: giunti sigillati, nastri e schiume corretti contro spifferi e condensa. Chiedi che la posa sia descritta nel preventivo, con i materiali usati.</p>
<blockquote>Una finestra ottima montata male isola come una finestra vecchia.</blockquote>
""",
 "fonti": [["UNI EN 1627, resistenza all’effrazione", ""], ["UNI 11673, posa in opera dei serramenti", ""], ["ENEA, requisiti tecnici per i serramenti", "https://www.efficienzaenergetica.enea.it"]]
},
{
 "slug": "il-preventivo-blindato-in-sette-mosse", "numero": 1, "rubrica": "lavori", "ordine": 6, "copertina": True,
 "titolo": "Il preventivo blindato in sette mosse",
 "sommario": "Due preventivi si confrontano solo se descrivono lo stesso lavoro. Le sette cose da pretendere prima di firmare.",
 "img": "cantiere.jpg", "alt": "Posa di un pavimento in un appartamento in ristrutturazione", "lettura": 5,
 "corpo": """
<p>La maggior parte delle liti in cantiere nasce da un preventivo scritto male: troppo corto, troppo vago, senza date. Un buon preventivo protegge te e anche chi fa il lavoro.</p>
<h2>Le sette mosse</h2>
<ol>
<li><strong>Capitolato.</strong> Cosa si fa e con quali materiali, con marca e modello. «Piastrelle di buona qualità» non vuol dire niente.</li>
<li><strong>Computo metrico.</strong> Ogni voce con quantità e prezzo unitario. Solo così puoi confrontare due preventivi sulle stesse voci.</li>
<li><strong>Tempi.</strong> Data di inizio, data di fine e penali per i ritardi.</li>
<li><strong>Pagamenti a stati di avanzamento (SAL).</strong> Paghi ciò che è finito. Mai anticipi oltre il 20–30%.</li>
<li><strong>Varianti per iscritto.</strong> Ogni cambiamento va scritto, con il prezzo, prima di farlo.</li>
<li><strong>Documenti dell’impresa.</strong> DURC regolare, cioè contributi in ordine, e polizza di responsabilità civile.</li>
<li><strong>Gli extra.</strong> Chi paga smaltimento dei materiali, ponteggi, occupazione del suolo pubblico.</li>
</ol>
<blockquote>Due preventivi si confrontano solo se descrivono lo stesso lavoro.</blockquote>
<h2>Il prezzo più basso</h2>
<p>Se un preventivo costa molto meno degli altri, di solito manca qualcosa: una voce, un materiale, lo smaltimento. Mettili uno accanto all’altro voce per voce e chiedi spiegazioni su ogni differenza.</p>
<h2>Prima di firmare</h2>
<p>Tieni da parte il 10–15% del budget per gli imprevisti. E ricorda che per i bonus il pagamento deve avvenire con bonifico parlante.</p>
""",
 "fonti": []
},
{
 "slug": "che-pratica-mi-serve", "numero": 1, "rubrica": "lavori", "ordine": 7,
 "titolo": "Che pratica mi serve?",
 "sommario": "Edilizia libera, CILA, SCIA, permesso di costruire: la pratica giusta in base al lavoro che vuoi fare.",
 "img": "architetto.jpg", "alt": "Un’architetta spiega il progetto a due clienti", "lettura": 3,
 "corpo": """
<p>Prima di aprire un cantiere bisogna sapere se serve una pratica in Comune, e quale. Sbagliare può costare una sanzione e anche il bonus.</p>
<div class="tabella">
<table>
<thead><tr><th>Lavoro</th><th>Pratica</th><th>Chi la presenta</th></tr></thead>
<tbody>
<tr><td>Tinteggi, cambi pavimenti o sanitari</td><td>Edilizia libera</td><td>Nessuna pratica</td></tr>
<tr><td>Sposti tramezzi, rifai gli impianti</td><td>CILA</td><td>Il tecnico</td></tr>
<tr><td>Intervieni su parti strutturali</td><td>SCIA</td><td>Il tecnico</td></tr>
<tr><td>Aumenti volumi o ricostruisci</td><td>Permesso di costruire</td><td>Serve il progetto</td></tr>
</tbody>
</table>
</div>
<h2>Due consigli</h2>
<ul>
<li><strong>Verifica prima che la casa sia in regola.</strong> Se ci sono difformità, vanno sanate prima dei lavori.</li>
<li><strong>Tieni il 10–15% del budget per gli imprevisti</strong> e paga a stati di avanzamento verificati.</li>
</ul>
<p class="nota">Le regole possono cambiare da Comune a Comune e in presenza di vincoli: verifica sempre con il tuo tecnico o con l’ufficio tecnico comunale.</p>
""",
 "fonti": [["DPR 380/2001, Testo unico dell’edilizia", ""], ["Glossario dell’edilizia libera (DM 2 marzo 2018)", ""]]
},
{
 "slug": "il-bagno-che-vogliono-tutti", "numero": 1, "rubrica": "abitare", "ordine": 8, "copertina": True,
 "titolo": "Il bagno che vogliono tutti",
 "sommario": "Microcemento, resina, pavimenti SPC e doccia a filo: come cambia il bagno, e perché si rifà con meno demolizioni.",
 "img": "bagno.jpg", "alt": "Bagno in microcemento con doccia a filo pavimento", "lettura": 4,
 "corpo": """
<p>Bagno e cucina insieme sono la ristrutturazione che cresce di più: +35,3% di richieste in due anni. E cambiano i materiali, sempre più spesso scelti per fare cantieri corti e puliti.</p>
<h2>I materiali che corrono</h2>
<ul class="numeri">
<li><span>+101%</span> <strong>Microcemento.</strong> Un rivestimento continuo di pochi millimetri, senza fughe, che si può stendere anche sulle piastrelle esistenti.</li>
<li><span>+74%</span> <strong>Resina.</strong> Superficie unica, facile da pulire, adatta anche a pavimenti e docce.</li>
<li><span>+206%</span> <strong>SPC.</strong> Pavimenti in lastre rigide che si posano a secco sul vecchio, con meno demolizioni.</li>
</ul>
<h2>La doccia a filo pavimento</h2>
<p>Niente gradino, più spazio, più sicurezza con l’età. Va progettata bene: pendenze, scarico e impermeabilizzazione sono la parte che non si vede ma che decide se fra cinque anni avrai infiltrazioni.</p>
<h2>Bonus</h2>
<p>Il rifacimento del bagno rientra nella ristrutturazione se c’è una pratica edilizia (per esempio quando rifai gli impianti). Gli interventi che eliminano le barriere architettoniche possono rientrare tra le spese detraibili.</p>
""",
 "fonti": [["Osservatorio ProntoPro, febbraio 2024 – febbraio 2026", ""]]
},
{
 "slug": "cucina-le-misure-che-contano", "numero": 1, "rubrica": "abitare", "ordine": 9,
 "titolo": "Cucina, le misure che contano",
 "sommario": "Triangolo di lavoro, passaggi, prese: una buona pianta vale più delle finiture.",
 "img": "cucina.jpg", "alt": "Cucina ristrutturata con isola centrale", "lettura": 3,
 "corpo": """
<p>Una cucina bella ma scomoda si usa male per vent’anni. Prima di scegliere ante e colori, sistema la pianta.</p>
<h2>Il triangolo di lavoro</h2>
<p>Lavello, piano cottura e frigorifero sono i tre punti che usi di più. Tienili vicini, con percorsi brevi e senza ostacoli in mezzo.</p>
<h2>Le misure</h2>
<ul>
<li>Tra due blocchi contrapposti lascia almeno <strong>90–120 cm</strong> di passaggio, di più se in cucina si lavora in due.</li>
<li>Le <strong>prese</strong> vanno dove userai davvero gli elettrodomestici, non dove capita.</li>
<li>Prevedi un <strong>piano libero</strong> accanto al piano cottura: è lì che si prepara.</li>
</ul>
<h2>Il bonus</h2>
<p>Se fai lavori di ristrutturazione, il Bonus Mobili ti restituisce il 50% della cucina e degli elettrodomestici nuovi, fino a 5.000 euro di spesa.</p>
<blockquote>Prima la pianta, poi le ante. Non il contrario.</blockquote>
""",
 "fonti": [["Agenzia delle Entrate, guida al Bonus Mobili", "https://www.agenziaentrate.gov.it"]]
},
{
 "slug": "la-pergola-bioclimatica", "numero": 1, "rubrica": "abitare", "ordine": 10,
 "titolo": "La pergola bioclimatica",
 "sommario": "Lamelle orientabili, regole del Comune e piante che chiedono poca acqua: il terrazzo diventa una stanza in più.",
 "img": "pergola.jpg", "alt": "Terrazzo con pergola bioclimatica e piante mediterranee", "lettura": 3,
 "corpo": """
<p>Le lamelle orientabili regolano luce e aria e, chiuse, riparano dalla pioggia: il terrazzo diventa una stanza in più per gran parte dell’anno.</p>
<h2>Serve un permesso?</h2>
<p>Spesso la pergola bioclimatica si installa senza permesso di costruire, ma dipende da misure, caratteristiche e regole del tuo Comune. In condominio conta anche il regolamento. Chiedi all’ufficio tecnico <strong>prima</strong> di ordinarla.</p>
<h2>Il verde che resiste</h2>
<p>Lavanda, rosmarino, mirto e ulivo in vaso chiedono poca acqua. Un impianto a goccia con sensore di pioggia fa il resto, anche quando sei in vacanza.</p>
<blockquote>Il terrazzo è una stanza. Va progettato come le altre.</blockquote>
""",
 "fonti": []
},
{
 "slug": "la-casa-stagione-per-stagione", "numero": 1, "rubrica": "cura", "ordine": 11,
 "titolo": "La casa, stagione per stagione",
 "sommario": "I controlli da fare nell’anno e come capire se la macchia sul muro è umidità o condensa.",
 "img": "grondaia.jpg", "alt": "Pulizia delle grondaie su un tetto in coppi in autunno", "lettura": 4,
 "corpo": """
<p>La manutenzione costa poco se la fai al momento giusto, e tanto se aspetti il guasto. Ecco il calendario.</p>
<div class="stagioni">
<div><h3>Autunno</h3><ul><li>Grondaie e pluviali</li><li>Controllo caldaia</li><li>Sfiato dei termosifoni</li></ul></div>
<div><h3>Inverno</h3><ul><li>Tubi esterni protetti dal gelo</li><li>Condensa negli angoli</li><li>Arieggiare ogni giorno</li></ul></div>
<div><h3>Primavera</h3><ul><li>Filtri del climatizzatore</li><li>Tetto dopo le piogge</li><li>Impianto di irrigazione</li></ul></div>
<div><h3>Estate</h3><ul><li>Tende e schermature</li><li>Sigillature dei balconi</li><li>Salvavita e impianto elettrico</li></ul></div>
</div>
<h2>Umidità o condensa?</h2>
<ul>
<li><strong>Aloni a fascia che salgono dal pavimento</strong>: è umidità di risalita. Serve una diagnosi da un tecnico.</li>
<li><strong>Macchie negli angoli e dietro gli armadi</strong>: è condensa. Arieggia, allontana i mobili dal muro e isola i ponti termici.</li>
</ul>
<p>Sopra il 60% di umidità in casa arriva la muffa. Un igrometro costa pochi euro e ti dice quando aprire le finestre.</p>
""",
 "fonti": []
},
{
 "slug": "caldaia-il-controllo-non-e-un-optional", "numero": 1, "rubrica": "cura", "ordine": 12,
 "titolo": "Caldaia: il controllo non è un optional",
 "sommario": "Libretto, manutenzione e controllo fumi: cosa dice la legge e cosa rischi se salti un appuntamento.",
 "img": "caldaia.jpg", "alt": "Tecnico durante il controllo annuale della caldaia", "lettura": 3,
 "corpo": """
<p>Ogni impianto di riscaldamento ha il suo <strong>libretto di impianto</strong>, dove il tecnico registra manutenzioni e controlli. Tenerlo aggiornato è un obbligo di chi abita la casa, anche se sei in affitto.</p>
<h2>Due cose diverse</h2>
<ul>
<li><strong>La manutenzione</strong>: con la frequenza indicata dal costruttore o dall’installatore.</li>
<li><strong>Il controllo di efficienza energetica</strong>, il «controllo fumi»: con la cadenza stabilita dalla tua Regione, in base al tipo di impianto e alla potenza.</li>
</ul>
<h2>Perché farlo</h2>
<p>Un impianto controllato è più sicuro, consuma meno e dura di più. Senza controlli rischi sanzioni e, in caso di problemi, contestazioni con l’assicurazione.</p>
<p class="nota">Le scadenze cambiano da Regione a Regione: chiedi al tuo tecnico o controlla il catasto impianti termici della tua Regione.</p>
""",
 "fonti": [["DPR 74/2013, esercizio e manutenzione degli impianti termici", ""]]
},
{
 "slug": "i-numeri-della-casa", "numero": 1, "rubrica": "guide", "ordine": 13,
 "titolo": "I numeri della casa",
 "sommario": "Sei numeri per capire dove va la casa in Italia, ognuno con la sua fonte.",
 "img": "tetti.jpg", "alt": "Tetti di un borgo italiano al tramonto", "lettura": 2,
 "corpo": """
<ul class="cifre">
<li><b>50%</b><span>la detrazione sulla prima casa per i pagamenti entro il 31 dicembre 2026.</span><small>Legge di Bilancio 2026</small></li>
<li><b>+37,3%</b><span>la bolletta della luce dei clienti vulnerabili da ottobre a dicembre 2026.</span><small>ARERA</small></li>
<li><b>47%</b><span>sceglie l’impresa con il passaparola; il 35% la cerca online.</span><small>ItaliaOggi</small></li>
<li><b>+51%</b><span>le richieste per rifare l’impianto idraulico in due anni.</span><small>ProntoPro</small></li>
<li><b>60%</b><span>degli edifici italiani è in classe energetica F o G.</span><small>ENEA</small></li>
<li><b>+206%</b><span>le richieste di pavimenti SPC, posati a secco sul vecchio.</span><small>ProntoPro</small></li>
</ul>
""",
 "fonti": [["Legge di Bilancio 2026", ""], ["ARERA", "https://www.arera.it"], ["ENEA", "https://www.enea.it"], ["Osservatorio ProntoPro 2024–2026", ""], ["ItaliaOggi", ""]]
},
{
 "slug": "le-parole-della-casa", "numero": 1, "rubrica": "guide", "ordine": 14,
 "titolo": "Le parole della casa",
 "sommario": "Dieci sigle che trovi in bollette, preventivi e pratiche, spiegate in una riga.",
 "img": "glossario.jpg", "alt": "Planimetria e campioni di materiali sul tavolo", "lettura": 2,
 "corpo": """
<dl class="glossario">
<dt>APE</dt><dd>Attestato di prestazione energetica: serve per vendere o affittare e dura dieci anni.</dd>
<dt>CILA</dt><dd>Comunicazione al Comune per i lavori che non toccano le strutture.</dd>
<dt>SCIA</dt><dd>Segnalazione al Comune per i lavori su parti strutturali.</dd>
<dt>SAL</dt><dd>Stato di avanzamento lavori: la parte finita, che si paga.</dd>
<dt>DURC</dt><dd>Il documento che prova che l’impresa versa i contributi.</dd>
<dt>Uw</dt><dd>Quanto isola una finestra: più è bassa, meglio è.</dd>
<dt>POD</dt><dd>Il codice del tuo contatore della luce.</dd>
<dt>PDR</dt><dd>Il codice del tuo contatore del gas.</dd>
<dt>Smc</dt><dd>Standard metro cubo: l’unità con cui si misura il gas in bolletta.</dd>
<dt>ENEA</dt><dd>L’agenzia a cui comunichi i lavori di risparmio energetico.</dd>
</dl>
""",
 "fonti": []
},
]
