# Progetto delle dashboard · AncheCasa

Documento di progetto deciso da Nando con Claude, a partire dal 12.10.2026.
Qui ci sono le decisioni: quali pulsanti vede ogni profilo, cosa fanno e con quale logica.
Si costruisce solo da qui. Supabase e la pubblicazione si toccano solo alla fine, quando la struttura convince e funziona in anteprima.

## Regole di lavoro

1. Si progetta un profilo alla volta: funzioni, cosa fanno, struttura, logica.
2. Si prova in anteprima sul computer (`?demo=`), senza pubblicare.
3. Solo con l'ok di Nando: Supabase, push su GitHub, pubblicazione.
4. Ordine: Admin, Privato, Rete, Aziende (impresa, artigiano, fornitore, luce e gas, agenzie…). L'app da telefono alla fine.
5. La dashboard del cliente Sicura (altro progetto) non si tocca.
6. **Dove vivono le dashboard** (deciso da Nando il 12.10.2026, 07:50): la dashboard ufficiale di **tutti** i profili è l'**area privata**. Si entra con il suo accesso, anche da https://entra.anchecasa.it, che apre lo stesso sito. Le funzioni che esistono solo nell'app si portano qui, profilo per profilo. Stile unico: quello dell'area privata, anche per accesso e mail.

## Uguale per tutti i profili

- Niente colonna di icone a sinistra (tolta il 12.10.2026).
- In alto a destra: **Messaggi** (fumetto, non letti) e **Avvisi** (campanella, pannello «Da fare»). Gli avvisi si decidono per profilo.
- Menu a categorie (cartelle che si aprono).
- L'admin decide in «Pulsanti per profilo» cosa vede ogni profilo: Nascosto, Gratis, A pagamento.

## Admin (fatto in anteprima il 12.10.2026)

Home in cima. Categorie: Panoramica (Oggi, Appunti), Iscritti (Iscritti registrati, Iscrizioni dal sito, Richieste agenti, Clienti da affidare, Genera link), Rete commerciale (Segnalazioni, Lavori rete, Contratti, Sala strategia), Gare e appalti (Bandi, Terranova, Gare private), Tecnico (AncheBIM), Comunicazione (Magazine), Il mio lavoro (Task, File), Impostazioni piattaforma (Software, Pulsanti per profilo). Chat dal fumetto.

Da decidere: quali avvisi riceve l'admin.

## Privato (deciso il 12.10.2026)

Il privato porta il lavoro alle aziende. Oggi non paga niente. Più avanti potrà comprare app a pagamento.

### Pulsanti

| Categoria | Pulsante | Prezzo |
|---|---|---|
| La mia casa | Ho un guasto | Gratis |
| La mia casa | Trova artigiano o impresa | Gratis |
| La mia casa | Ristruttura con AncheCasa | Gratis |
| La mia casa | Il mio cantiere (solo con un cantiere aperto) | Gratis |
| Bacheca | Bacheca annunci | Gratis |
| Bacheca | Pubblica un annuncio | Gratis |
| Le mie cose | Le mie richieste | Gratis |
| Le mie cose | I miei annunci | Gratis |
| Risparmia | Check Bollette | Gratis |
| Risparmia | Offerte luce e gas | Gratis |
| Le mie app | App del Magazine | Gratis (più avanti anche app a pagamento, segno €) |
| Passaparola | Invita e guadagna credito | Gratis |

In cima vanno le categorie che il privato ha scelto quando si è iscritto (guasto, ristrutturo, vendo, cerco casa, cerco lavoro).

### Ho un guasto / Trova artigiano

- La richiesta va a **un artigiano**: il più vicino, libero, con le recensioni migliori.
- Se non accetta entro **15 minuti** (urgente) o **2 ore** (normale), passa da sola al secondo, poi al terzo. Se nessuno dei tre accetta, arriva negli Avvisi dell'admin e AncheCasa la gestisce.
- Funziona anche di notte e nei festivi.
- Il privato vede sempre a che punto è la richiesta.
- Chi non risponde spesso scende in classifica.
- **All'inizio, finché non ci sono artigiani iscritti in zona**, SuperMastro mostra l'elenco degli artigiani da Maps e il privato li chiama lui.

### Soldi dell'intervento

- L'artigiano paga l'abbonamento più **4,99 € a intervento**, quando lavora tramite l'app.
- Quando l'artigiano è iscritto, **anche il privato paga tramite l'app**.
- I 4,99 € scattano **a lavoro fatto**: l'artigiano preme «Lavoro fatto», il privato conferma con un tocco; senza risposta in 7 giorni vale come fatto.
- **Garanzia AncheCasa 30 giorni** solo con artigiani iscritti e lavori chiusi nell'app.

### Recensioni

Sistema interno di AncheCasa, da progettare. Regole di base: recensisce solo chi ha un lavoro confermato; l'artigiano può rispondere una volta.

### Ristruttura con AncheCasa

Richiesta del privato → sopralluogo di un agente con Sopralluogo Flash (foto e nota vocale → computo e stima) → preventivo → firma del contratto → si apre **Il mio cantiere**.

Il mio cantiere: avanzamento in percentuale con le foto di ogni settimana, SAL da pagare e pagati, documenti (contratto, permessi, certificazioni), chat con il responsabile del cantiere.

### Bacheca annunci

- Annunci di casa (vendo, affitto, cerco) e lavoro (offro, cerco).
- Bacheca pubblica: la vedono tutti; **per rispondere ci si iscrive**.
- Gli annunci **escono subito**, l'admin controlla dopo. Nessun pulsante «Segnala annuncio».
- Durata **60 giorni**, con avviso per rinnovare.
- Le agenzie immobiliari torneranno clienti: piano gratuito per pubblicare, poi a pagamento.

### Offerte luce e gas (e altre offerte)

Tutto dentro AncheCasa: il privato chiede, il fornitore iscritto risponde dalla sua dashboard. Vale per luce e gas e per le offerte di altri fornitori. Collegato a Check Bollette.

### Le mie app

Ogni 15 giorni esce il Magazine con un'app gratuita. Il privato la trova in «Le mie app» e **resta per sempre**. Check Bollette è la prima. Più avanti, app a pagamento sullo stesso scaffale.

### Invita e guadagna credito (proposta di Claude, cifre da confermare)

Credito AncheCasa nel profilo del privato.

| Il privato invita… | Il premio scatta quando… | Premio |
|---|---|---|
| un amico privato | l'amico firma una ristrutturazione con AncheCasa | 100 € di credito |
| un'impresa o un artigiano | l'azienda paga il primo mese | un mese di abbonamento in credito (14,90 € artigiano, 49 € impresa) |
| agenzia, fornitore, luce e gas | paga il primo mese | come sopra |
| un amico che si iscrive e basta | — | sblocca prima un'app del Magazine |

Si spende su Ristruttura con AncheCasa, sugli interventi pagati nell'app e sulle app a pagamento. Regole: si sblocca solo dopo l'incasso; niente premio con stesso telefono, mail o indirizzo; al massimo 500 € l'anno; scade dopo 12 mesi.

### Iscrizione e contatti

- Iscrizione con la **mail**: basta per guardare, bacheca, Check Bollette, app del Magazine.
- Si parla sempre in **chat dentro AncheCasa**; nessun numero visibile a sconosciuti.
- **Telefono verificato con WhatsApp** (niente SMS) solo per chi fa venire qualcuno a casa: Ho un guasto, Trova artigiano, Ristruttura. L'artigiano vede il numero solo dopo aver accettato.

## Da fare alla fine (deciso da Nando il 12.10.2026)

Quando tutte le dashboard sono finite, si scrivono i documenti per la rete (Sala demo), con la carta intestata delle regole. Per i primi quattro servono i dati di Nando:

1. **AncheCasa in 10 minuti**: chi siamo, cosa facciamo, per chi, come guadagna AncheCasa. Serve la frase o il numero che Nando vuole sempre dentro.
2. **Il listino**: da confermare artigiano 14,90 €, impresa 49 €, fornitore 99 € al mese; moduli 9 / 19 / 29 €; tutti i moduli 69 €; prova gratis 14 giorni; prezzi per agenzie immobiliari e luce e gas.
3. **Come guadagna la rete**: provvigioni vere per ruolo (oggi nelle impostazioni ci sono cifre di esempio: 20% sulla vendita, 70% sub-agente, 30% agente) e su cosa si calcolano (abbonamenti, moduli, ristrutturazioni, 4,99 €).
4. **Si parte: i primi 90 giorni**: quando arrivano le funzioni e gli obiettivi del primo trimestre.

Poi anche: Il percorso del cliente, Regole della rete, Il primo giorno.

Restano aperti anche: cifre del credito del passaparola, sistema di recensioni, avvisi della campanella per ogni profilo.

## Rete (in corso, 12.10.2026)

Livelli: Responsabile Rete Italia → Sviluppo rete (Nord, Centro, Sud e isole) → Capo area → Agente → Sub-agente. Il segnalatore (privato che segnala) è fuori dalla rete.

### Decisioni di Nando

- **Regola d'oro:** ognuno vede sé stesso e chi ha sotto, mai chi sta sopra o accanto. L'admin vede tutto.
- **Chi entra nella rete:** per ora decide solo l'admin. Gli altri segnalano.
- **Soldi dei sotto:** ognuno vede le vendite di chi ha sotto e la propria parte, non quanto guadagnano gli altri.
- **Clienti dei sotto:** il superiore vede nome e stato dei clienti di chi ha sotto; telefono e mail solo chi l'ha registrato.
- **Cosa si vende:** tutti vendono tutto. Le **ristrutturazioni** si segnalano al proprio responsabile, che decide, e mette sempre a conoscenza sviluppo rete e Responsabile Rete Italia, che possono intervenire.
- **Sopralluogo Flash:** lo usano tutti, admin compreso.
- **Admin:** oltre alla catena, una **cartina dell'Italia** con la posizione della rete e dei clienti, con le percentuali.

### Decisioni di Nando · seconda parte (12.10.2026, 08:31)

- **Ristrutturazioni:** il responsabile è quello diretto (sub-agente → agente → capo area → sviluppo rete → Rete Italia). Il responsabile decide se si prende il lavoro e chi fa il sopralluogo, poi passa all'admin per preventivo e firma. **L'admin può delegare** quel lavoro a qualcuno.
- **Provvigioni:** da rivedere (oggi nell'app: 70% chi porta, 17% sviluppo rete, 8% capo area, 5% Rete Italia; sub-agente 70/30 con il suo agente). Si decidono alla fine, con il listino.
- **Cartina dell'Italia:** più percentuali insieme. Serve a capire cosa succede e chi gestisce bene. La vedono tutti, ognuno per la sua parte (capo area la regione, sviluppo rete l'area, Rete Italia e admin tutta Italia).
- **Zona:** si assegna nell'invito per i ruoli di rete. **Chi sta sotto chi lo decide la zona.**
- **I commerciali invitano privati e aziende** direttamente; il cliente diventa loro.
- **Il cliente è per sempre di chi lo registra**, azienda e privato. L'admin può intervenire e chiedere perché un'azienda non fa niente.
- **Fermo:** nessuna vendita da 30 giorni.
- **Contratto:** finché non è firmato, la dashboard del commerciale è in sola lettura.

### Decisioni di Nando · terza parte (12.10.2026, 08:35)

- **Zone:** in una regione possono esserci anche due capi area; per ora la zona di ognuno la decide Nando.
- **Zona senza capo area:** l'agente va sotto lo sviluppo rete dell'area; quando arriva il capo area passa sotto di lui.
- **Chi lascia AncheCasa:** i suoi clienti passano al suo responsabile diretto. Le provvigioni finiscono con il contratto.
- **Cliente fermo:** avviso all'admin e a chi l'ha portato quando un'azienda iscritta non attiva niente da 30 giorni, o disdice. L'admin chiede spiegazioni o riassegna.
- **Chi gestisce bene** (cartina e classifica), per persona e per zona: crescita (nuovi clienti sul mese prima), clienti attivi, obiettivo del mese, squadra ferma.
- **Delega di un lavoro:** solo a qualcuno della rete. Se serve un'altra persona, l'admin la invita ed entra nella rete (anche come impresa, professionista o altro).

### Decisioni di Nando · quarta parte (12.10.2026, 08:44)

- **Vendere fuori zona:** sì. Il cliente resta di chi lo porta; la zona decide solo chi sta sopra.
- **Ruolo e zona dei commerciali:** si salvano nel profilo quando si invitano, anche su Supabase.
- **Pagina Rete dell'admin: niente soldi** (quelli Nando li vede altrove). Serve l'**andamento**, per sapere chi **richiamare** e chi **premiare**: catena, cartina, da decidere, andamento per persona e per zona, obiettivi.

### Decisioni di Nando · quinta parte (12.10.2026, 08:47)

- **Premiare:** un riconoscimento visibile («Migliore di ottobre») che vede tutta la rete.
- **Classifica:** completa solo all'admin; ognuno nella rete vede la sua posizione e i primi 3.
- **Richiamare:** su ogni persona Scrivi (chat), Chiama, Nota (la vede anche il suo responsabile).
- **Obiettivi:** li decidono l'admin e il Responsabile Rete Italia e li pubblicano; per zona o per persona (nuovi clienti, clienti attivi, canoni, lavori).
- **Chi resta nella rete:** lo decide l'admin caso per caso, niente limite automatico.

### Proposta di Claude (accolta come base)

| Funzione | Sub-agente | Agente | Capo area | Sviluppo rete | Rete Italia |
|---|:-:|:-:|:-:|:-:|:-:|
| Oggi: obiettivo del mese, cosa fare | sì | sì | sì | sì | sì |
| I miei clienti, Registra un cliente | sì | sì | sì | sì | sì |
| Vendi (abbonamenti, moduli; ristrutturazioni = segnalazione) | sì | sì | sì | sì | sì |
| Sopralluogo Flash | sì | sì | sì | sì | sì |
| I miei guadagni | sì | sì | sì | sì | sì |
| Il mio ruolo, contratto, documenti | sì | sì | sì | sì | sì |
| Formazione (regole, Sala demo) | sì | sì | sì | sì | sì |
| Segnala una persona | sì | sì | sì | sì | sì |
| La mia squadra | — | sub-agenti | regione | area | Italia |
| Chi è fermo | — | sì | sì | sì | sì |
| Recensioni della zona | — | — | regione | area | Italia |
| Regioni da aprire | — | — | — | sì | sì |
| Sala strategia | — | — | sì | sì | sì |
| Linee decise (lettura) | sì | sì | sì | sì | sì |

Admin, pagina Rete: catena, cartina dell'Italia, da decidere (segnalazioni, richieste, contratti, lavori a SAL), soldi (provvigioni da pagare, incassi), obiettivi, strumenti (Inviti, Contratti, Sala strategia, Clienti da affidare).

## Come si divide chi lavora su AncheCasa (deciso il 12.10.2026)

Regola: **se va a casa del cliente a fare un lavoro è un'azienda di servizi o un artigiano; se vende un prodotto o un contratto è un fornitore.**

1. **Imprese e artigiani**: imprese edili, subappaltatori, impiantisti, artigiani.
2. **Servizi per la casa**: traslochi, facchinaggio, giardinaggio, pulizie, sgomberi, disinfestazione, manutenzione stabili. Lavorano come l'artigiano (richiesta → preventivo → intervento), senza cantiere.
3. **Fornitori**: le sei famiglie qui sotto.
4. **Professionisti**: studi tecnici, consulenti.

## Fornitori (12.10.2026)

Sei famiglie: **Energia** (luce e gas; fotovoltaico e pompe di calore come offerta), **Telefonia e internet**, **Finanza e assicurazioni**, **Materiali edili**, **Noleggio**, **Informatica e promozione**. Energia, telefonia e finanza funzionano allo stesso modo.

### Energia · luce e gas (decisioni di Nando)

- La richiesta del cliente (da Check Bollette sul Magazine o dalla dashboard del privato) arriva **a tutti** i fornitori di energia; poi Nando decide se cambiare.
- Il fornitore vede consumi, zona e spesa; **nome, mail e telefono solo dopo che il cliente sceglie la sua proposta**.
- Il cliente riceve una mail con il link alle proposte, le confronta e preme «Accetto, contattatemi»; poi il fornitore gli manda il suo contratto.
- **Provvigione:** la decide Nando dalla sua dashboard (Fornitori) e la invia; il fornitore la conferma, **e solo da lì può mandare proposte**. Se cambia, va confermata di nuovo.
- Dashboard del fornitore: Home, Richieste, Proposte (PDF su carta AncheCasa con il suo logo), Le mie offerte (e carta intestata), I miei clienti (contratto attivato), Il mio accordo.
- A pagamento, da decidere: in evidenza, la rete vende per te, report.

### Telefonia e internet · Finanza e assicurazioni (decisioni di Nando, 12.10.2026 09:44)

- **Stessa logica di luce e gas**: richiesta a tutti i fornitori della categoria, contatti solo dopo la scelta del cliente, provvigione decisa da Nando e confermata dal fornitore prima delle proposte. Un motore solo per le due categorie (`js/servizi.js`, app-20); luce e gas resta com'è.
- **Da dove arrivano le richieste**: dashboard del privato, dashboard delle imprese, commerciali della rete. Se sul Magazine c'è un pulsante (oggi solo Check Bollette per luce e gas) si collega; se no il cliente vede le offerte pubblicate dai fornitori e chiede le proposte.
- **Telefonia**: casa, cellulare, casa e cellulare, ufficio con più linee. Anche per le aziende (partita IVA, più linee).
- **Finanza**: tutti i prodotti. Privato: mutuo casa, prestito per ristrutturare, assicurazione casa. Impresa: polizza cantiere (CAR), decennale postuma, fideiussioni per le gare, RC professionale, prestiti. Le imprese chiedono dalla loro dashboard (Polizze e finanziamenti).
- **Finanza, regola**: il fornitore scrive la sua iscrizione OAM o IVASS nella carta intestata; senza, non manda proposte. AncheCasa segnala e non fa intermediazione né consulenza (scritto sulle proposte e sulla pagina del cliente). Le provvigioni su mutui e polizze vanno controllate con il commercialista o un legale prima di firmare gli accordi.
- **Rete**: il commerciale chiede proposte per un suo cliente (luce e gas, telefono, finanza) da «Offerte per i clienti». Il cliente riceve le proposte per mail e sceglie. Quando il fornitore attiva il contratto, la vendita va al commerciale (app_vendite, anche per luce e gas).
- Dashboard del fornitore: come luce e gas (Home, Richieste, Proposte, Le mie offerte, I miei clienti, Il mio accordo).

### Materiali edili · Noleggio · Servizi per la casa (decisioni di Nando, 12.10.2026 10:47)

- **Chi chiede**: materiali e noleggio solo le aziende (imprese, artigiani...), il privato no. Servizi per la casa (traslochi, facchinaggio, sgombero, pulizie, giardinaggio): anche il privato. Anche la rete per un suo cliente.
- **Zona**: la richiesta arriva a chi copre la zona del cantiere, partendo dal più vicino (stesso comune, stessa provincia, poi le province coperte). Ogni fornitore scrive sede e province in «La mia zona».
- **Prezzi solo nel preventivo**: il listino del fornitore non è pubblico. Il preventivo è riga per riga, con totale, consegna e validità.
- **Ordine e pagamento fuori** da AncheCasa. Il fornitore segna «consegnato», «noleggio finito» o «lavoro fatto».
- **Contatti dopo la scelta**: nome, contatti e indirizzo del cliente solo al fornitore scelto.
- **Niente provvigione**: questi fornitori pagheranno per stare su AncheCasa (quanto e come: da decidere). Nessun accordo da confermare.
- **Noleggio**: il noleggiatore tiene i suoi mezzi e il calendario; l'impresa vede subito cosa è libero nella zona e nelle date (senza prezzi) e chiede il preventivo.
- **Servizi per la casa sono fornitori** (non aziende con profilo da artigiano): traslochi, facchinaggio, pulizie, manutenzione e giardinaggio.
- **Rete**: il commerciale chiede per un cliente; a lavoro chiuso la vendita va a lui.
- Informatica e promozione: da progettare.

## Aziende (decise da Nando il 12.10.2026, 12:11 e 12:20)

Regole per tutte le aziende:
- Prova gratis 14 giorni, poi abbonamento. Il bonifico lo segna l'admin in «Aziende» («attiva fino al»).
- Visura e DURC obbligatori, verificati dall'admin. Senza documenti verificati e senza prova o abbonamento attivi non si ricevono lavori.
- Impresa, subappaltatore e impiantista pagano lo stesso prezzo (49 € al mese). I moduli (cantiere, gare, mezzi, squadre) sono a parte, a pagamento.
- «Documenti e abbonamento» in «La mia azienda» per tutti.

Artigiano (app-23, online):
- «Ho un guasto» e «Trova artigiano» del privato. La richiesta va a un artigiano alla volta: prima quello scelto dal privato, poi il più vicino, poi quello con il voto migliore.
- Tempo per accettare: 15 minuti se urgente, 2 ore se normale. Dopo tre giri, o se non c'è nessuno, la richiesta passa all'admin.
- Lavoro fatto con l'importo. Commissione di 4,99 €, per ora solo registrata: il pagamento dentro l'app arriva dopo, e solo con l'artigiano iscritto.
- Il privato conferma il lavoro (dopo 7 giorni vale come confermato) e lascia la recensione. Garanzia AncheCasa di 30 giorni.

Impresa, subappaltatore, impiantista (app-24):
- Lavori AncheCasa. AncheCasa fa da general contractor.
  1. Il privato chiede «Ristruttura con AncheCasa», oppure la rete segnala il cliente.
  2. L'admin manda un agente per il sopralluogo; l'agente scrive la nota e preme «Fatto».
  3. L'admin fa preventivo e firma con il cliente.
  4. Nando sceglie l'impresa e le manda il lavoro.
  L'impresa vede solo il suo importo, mai il prezzo al cliente; risponde «Accetto» o «Non posso».
- I miei cantieri: giornale dei lavori con foto, avanzamento e SAL dell'impresa (li segna l'admin).
- Il mio cantiere (privato): avanzamento, diario con le foto e SAL da pagare ad AncheCasa. Il privato vede solo AncheCasa, mai il nome dell'impresa.
- Piccoli lavori della zona: il privato descrive il lavoro e la richiesta va a massimo cinque imprese verificate della zona, dalla più vicina. Funziona come i preventivi dei fornitori: il cliente sceglie, i contatti vanno solo a chi è scelto. L'admin è sempre avvisato per mail e può lasciarla alle imprese o passarla ad AncheCasa: in quel caso diventa una pratica di ristrutturazione e la affida a un agente.
- Subappalti in zona: l'impresa cerca subappaltatori, impiantisti e imprese verificati che coprono la provincia e chiede la disponibilità. Mail e contatti si vedono solo dopo «Accetto».
- Admin, tasto «Ristrutturazioni»:
  - pratiche: stato, agente, prezzo al cliente, «Affida a un'impresa»;
  - lavori affidati, con i SAL del cliente e quelli dell'impresa;
  - piccoli lavori da smistare.
- Mail (preventivi-avvisa, evento «imprese», anche nel giro ogni 5 minuti): nuova ristrutturazione all'admin, sopralluogo all'agente, lavoro all'impresa, risposta dell'impresa all'admin, subappalto all'azienda e risposta a chi l'ha chiesto, piccoli lavori all'admin.

Da progettare: studio tecnico, agenzia, committente.
