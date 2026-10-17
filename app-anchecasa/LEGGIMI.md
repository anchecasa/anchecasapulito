# App AncheCasa — versione completa 2.0 (09.10.2026)

Un'app sola per tutti, con un profilo per ogni modo di usarla. Chi ha più profili passa dall'uno all'altro con l'etichetta in alto.

| Profilo | Cosa fa nell'app |
|---|---|
| **Privato** | SuperMastro: video del guasto → analisi → mappa. Prima gli iscritti AncheCasa, poi i 5 più vicini su Google con «Chiama». Richieste, recensioni, bacheca (vendita, affitto, studenti, lavoro), «Segnala ad AncheCasa» (è il segnalatore), «Ristruttura con AncheCasa», corsi AncheSicura. |
| **Artigiano** (pronto intervento) | Scheda verificata da AncheCasa; disponibile o in pausa; richieste con video, «Accetto» e telefono del cliente; recensioni; «Passa a Impresa» quando ha i requisiti. |
| **Impresa** (titolare o responsabile) | Moduli a pagamento: si chiede l'attivazione e AncheCasa li attiva dopo il pagamento. Oggi: cosa c'è da fare. Persone e inviti. Rivendita della sicurezza (30%). Recensioni ricevute. Offerte sui lotti degli altri. |
| **Lavoratore** | Patentino con il codice per gli ingressi, corsi e visite, firma dei DPI, «Sono in cantiere oggi», segnala un pericolo, avvisi. |
| **Proprietario del cantiere** | Avanzamento, fasi, foto dal giornale, SAL da approvare o contestare, pagamenti, garanzie (fideiussione e conto dedicato), segnala un problema, chat, recensione a fine lavori. |
| **Impresa partner** | Cantieri AncheCasa assegnati: giornale, presenze, ingressi, SAL da proporre. Lotti e offerte, i propri moduli, kit del marchio. |
| **Fornitore** | Richieste di fornitura e noleggio (lotti), offerte, listino prodotti. |
| **Consulente AncheSicura** | Aziende seguite con il semaforo della sicurezza, sopralluoghi, agenda, schede sicurezza delle aziende. |
| **Sviluppo rete → Capoarea → Agente → Sub-agente** | Codice personale, vendite e clienti, squadra con inviti al livello sotto, guadagni. Report recensioni (sviluppo: la sua area; capoarea: la sua regione). Accordo da firmare per lo sviluppo rete. |
| **Admin** | Cruscotto con tutte le divisioni e una lista «Da fare» con tutto quello che aspetta una decisione. Aziende e moduli (attivazione), AncheCasa GC (cantieri, inviti a proprietari e partner), AncheSicura (ordini, rivendite, consulenti), SuperMastro (artigiani, passaggi, segnalazioni), registro chiamate (non in vendita), gare e lotti, rete commerciale (inviti, ruoli, aree, conferma vendite, pagamento provvigioni), economia, report recensioni con CSV per Excel, impostazioni (prezzi e percentuali). |

**Moduli dell'impresa**
- **Ufficio**: clienti, preventivi con le voci e il PDF, fatture, documenti.
- **Sicurezza**: dipendenti con il semaforo delle scadenze, corsi e attestati, visite, DPI firmati, segnalazioni, avvisi, sopralluoghi.
- **Sicurezza Cantiere**: ingressi con il codice del patentino, verbali, checklist del preposto.
- **Cantiere e SAL**: giornale, presenze, SAL, cronoprogramma, DDT, foto, chat, proprietario e partner invitati.
- **Gare**: analisi del bando PDF con l'IA, partecipa sì o no, esito e analisi dopo la gara, gara vinta → cantiere.
- **Lotti e subappalti**: pubblicare un lotto, ricevere offerte, accettarne una.
- **Centralino**: registro delle chiamate.
- **Magazzino e mezzi**: scorta minima, scadenze, manutenzioni.

## Provarla senza toccare niente
Modalità prova: `index.html?prova`, oppure un doppio clic su `PROVA-APP.bat`, oppure l'anteprima su claude.ai. Si entra con uno qualunque dei 13 profili di esempio. I dati sono finti e stanno solo nel browser.

## Per accenderla (lo fa Nando, in quest'ordine)

**1. Database.** Supabase → progetto ANCHECASA → SQL Editor. Si eseguono sette file, uno dopo l'altro:
- `sql/app-01-supermastro.sql` → Run;
- `sql/app-02-completa.sql` → Run;
- `sql/app-03-siti.sql` → Run (richieste dai siti nella schermata Admin → Contatti);
- `sql/app-04-rete-italia.sql` → Run (Responsabile Rete Italia e nuove quote della rete);
- `sql/app-05-proposte-rete.sql` → Run (chi entra nella rete lo decidete insieme);
- `sql/app-06-strategia-cantieri-obiettivi.sql` → Run (sala strategia, lavori a SAL, obiettivi);
- `sql/app-07-regole-clienti-documenti.sql` → Run (regole dei clienti, documenti da firmare);
- `sql/app-08-fatture-elettroniche.sql` → Run (preventivi e fatture elettroniche, invii allo SdI, pacchetti e margini);
- `sql/app-09-sopralluoghi-pratiche.sql` → Run (sopralluogo → preventivo → cantiere → fattura, foto del sopralluogo);
- `sql/app-10-sicurezza-cantiere.sql` → Run (fascicolo di cantiere D.Lgs. 81/08, semaforo, scadenziario comune, controllo del fascicolo all'ingresso). Per gli avvisi automatici di ogni mattina: Database → Extensions → attivare **pg_cron**, poi rieseguire questo file.
- `sql/app-11-sopralluogo-flash.sql` → Run (Sopralluogo Flash: nota vocale → computo → stima dai prezzari regionali, link del cliente senza password, pratica edilizia, ufficio del Comune, «Converti in cantiere attivo» con codice AC-AAAA-NNNN). Dopo: Admin → Cruscotto → «Prezzari regionali per la stima» → importare il CSV della Regione e collegare le lavorazioni. Senza prezzario la stima resta «non disponibile» (nessun prezzo inventato).
- `sql/app-12-subappalti-profit-guard.sql` → Run (sicurezza, logistica e smaltimento CER nel computo; Profit Guard con il margine; subappalti con pagamenti su misura; offerte dei fornitori dal link nella mail; approvazione del titolare; preventivo ufficiale bloccato; nome della ditta nella pagina del cliente). Dopo: Admin → Cruscotto → «Offerte dei fornitori e Profit Guard» → impostare la soglia minima di margine.
- `sql/app-13-magazzino-mezzi.sql` → Run (movimenti di magazzino con costo medio, mezzi nei cantieri, scadenze dei mezzi nello scadenziario, costi reali del cantiere; cartella pubblica `loghi` per il logo della ditta nella pagina del cliente).

Prezzi (09.10.2026): abbonamento base + moduli. Artigiano 14,90 €; Impresa 49 € con Ufficio compreso; Fornitore 99 €; moduli in più da 9 €, tutti insieme 69 €. Si cambiano da Admin → Impostazioni.

Si possono rilanciare senza danni. Aggiungono solo tabelle `app_…`: i siti e l'area privata non vengono toccati.

**2. Due funzioni dell'intelligenza artificiale.** Supabase → Edge Functions → Deploy a new function → Via Editor:
- `supermastro-analisi`: incollare `supabase/functions/supermastro-analisi/index.ts`;
- `gare-analisi`: incollare `supabase/functions/gare-analisi/index.ts`;
- `sopralluogo-flash`: incollare `supabase/functions/sopralluogo-flash/index.ts` (nota vocale dell'agente → trascrizione e computo con Gemini; usa la stessa `GEMINI_API_KEY`). Facoltativa `FLASH_AL_GIORNO` (predefinita 20 analisi a persona). Cancella da sola le note vocali dopo 90 giorni.
- `subappalti-mail`: incollare `supabase/functions/subappalti-mail/index.ts` (inviti ai fornitori ed esiti delle offerte per mail). Secrets: `MAIL_PROVIDER` (`brevo` oppure `resend`), `MAIL_API_KEY`, `MAIL_MITTENTE` (es. `AncheCasa <ufficio@anchecasa.it>`, indirizzo verificato nel servizio), `APP_URL` (indirizzo dell'app), consigliata `PRIVACY_URL`. Senza questi gli inviti restano «da inviare».
- `sdi-gateway`: incollare `supabase/functions/sdi-gateway/index.ts` (fatture elettroniche). Finché non c'è il contratto con un gateway resta «simulato»: non manda niente all'Agenzia delle Entrate. Secrets in più: `SDI_WEBHOOK_SEGRETO` (testo lungo a caso) e, quando c'è il gateway, `SDI_GATEWAY` e le sue credenziali.

Poi, in Edge Functions → Secrets, va messa **UNA** chiave dell'intelligenza artificiale. La stessa vale per tutte e due le funzioni:
- `GEMINI_API_KEY`: consigliata, legge video e PDF;
- `ANTHROPIC_API_KEY`: legge foto e PDF.

Le chiavi si incollano solo lì, mai in chat o nei file.

Facoltativi:
- `DIAGNOSI_ORIGINI`: l'indirizzo dell'app;
- `ANALISI_AL_GIORNO`: limite per persona, predefinito 15;
- `ANALISI_TOTALI_AL_GIORNO`: limite per tutti, predefinito 500.

Se l'app dice «configurazione mancante», aggiungere nei Secrets `AC_PUBLISHABLE_KEY` e `AC_SECRET_KEY` (Project Settings → API Keys).

**3. Accesso.** Authentication:
- URL Configuration → Redirect URLs: aggiungere l'indirizzo dell'app con `/**` in fondo;
- lasciare attiva «Confirm email». Serve agli inviti: la mail deve essere davvero di chi la usa.

**4. Admin.** L'admin dell'app è chi è già nella tabella `marketplace.admins`, cioè Nando. Dall'app:
- crea «AncheCasa GC» (Cruscotto → AncheCasa GC);
- invita il primo «Responsabile sviluppo rete» (Rete → Invita).

**5. Google Maps.** Nella chiave «AncheCasa area privata» aggiungere il dominio dell'app tra i siti ammessi.

**6. Pubblicazione** su un progetto Vercel NUOVO, separato dai siti congelati. Da Cursor:
```
cd "C:\Users\palum\Desktop\ANCHECASA-PULITO\app-anchecasa"
npx vercel deploy --prod --yes --scope anchecasas-projects
```
L'app è su `https://entra.anchecasa.it`. `app.anchecasa.it` non si usa più e non si ricollega.

**7. Decisioni di Nando**, da mettere nell'app (Admin → Impostazioni) o in `js/config.js`:
- prezzi dei moduli e listino AncheSicura. Oggi c'è la proposta del 09.10; il listino dei corsi è in `app_impostazioni` (`listino_anchesicura`);
- percentuali delle provvigioni. Oggi: 20% sul venduto; sub-agente 70%, agente 30%; capoarea e sviluppo 0%. Sono di esempio;
- premio per chi segnala;
- requisiti del passaggio da artigiano a Impresa;
- link all'informativa privacy (`privacyUrl` in `js/config.js`): deve parlare di video, posizione e documenti.

## Cosa NON fa ancora (va collegato a parte)
- **Pagamenti**: l'app non incassa. L'admin attiva i moduli e conferma vendite, ordini e rivendite dopo il pagamento.
- **Fattura elettronica allo SDI**: le fatture sono un registro.
- **Centralino AncheVoice**: c'è il registro delle chiamate, non il collegamento telefonico.
- **Mail automatiche degli inviti**: l'app crea il link e apre la mail già scritta. Il collegamento alla funzione mail esistente si fa dopo.
- **Notifiche sul telefono (push)**: ci sono solo quelle dentro l'app (la campanella).
- **App negli store**: si impacchetta questa stessa app con Capacitor (Android e iPhone).

## Sicurezza
- Ogni tabella ha i suoi permessi. Le prove sono in `sql/prove/`: 01 (SuperMastro), 02 (tutta l'app), 03 (attacchi).
- Due revisioni indipendenti hanno trovato in tutto 6 problemi gravi e 16 medi, tutti corretti e riprovati. Tra questi:
  - inviti modificati per darsi un ruolo;
  - provvigioni doppie;
  - SAL approvati a nome del cliente;
  - recensioni false;
  - prezzi decisi dal telefono;
  - codice dannoso nelle pagine.
- Prezzi di moduli e ordini, date, firme dei DPI, approvazioni dei SAL e provvigioni li decide il database, non il telefono.
- Nessuna chiave segreta nei file.


## Responsabile Rete Italia (09.10.2026)
- Rete: Responsabile Rete Italia → sviluppo rete (Nord, Centro, Sud e isole) → capoarea → agente → sub-agente.
- Lo crea l'admin: Admin → Rete → «Invita nella rete», ruolo «Responsabile Rete Italia». Lui invita gli sviluppo rete; l'area la assegna l'admin.
- Nell'app ha la sua vista: Italia (numeri di tutta la rete, le tre aree), Aree (regione per regione: capo area, agenti, clienti, «da aprire»), Clienti di tutta la rete, Report recensioni di tutta Italia, Guadagni, Squadra, accordo da firmare.
- Vede tutte le persone, le vendite e le provvigioni della rete.
- Quote (Admin → Impostazioni → Provvigioni): chi porta il cliente 70, sviluppo rete 17, capo area 8, Rete Italia 5. Il sub-agente tiene il 70% della quota di chi porta il cliente, il 30% va al suo agente. La «quota della rete sul venduto» (20%) è di esempio: va messa quella vera.
- Prove SQL: `sql/prove/04-prove.sql` (dopo 02-prove).

## Chi entra nella rete (10.10.2026)
- Tutti nella rete (e l'admin) possono **proporre** una persona: sviluppo rete, capoarea, agente, sub-agente (Squadra → «Proponi una persona»).
- Decidono **insieme**: admin, Responsabile Rete Italia e sviluppo rete dell'area della persona (schermata «Proposte»). Entra solo con il sì dell'admin e del Responsabile Rete Italia, e dello sviluppo rete se l'area ce l'ha. Basta un no per respingere.
- Quando passa, l'invito nasce da solo: chi ha proposto (e l'admin) vede «Link d'invito da mandare». La persona entra sotto chi l'ha proposta, se è il livello giusto; altrimenti la sistema l'admin.
- L'admin crea direttamente solo l'invito del Responsabile Rete Italia.
- «La catena»: l'admin e il Responsabile Rete Italia vedono tutta la rete, livello per livello, con clienti attivi, vendite del mese, provvigioni, proposte e da quanto tempo uno è fermo. Gli altri vedono sé stessi e chi hanno sotto.
- Prove SQL: `sql/prove/05-prove.sql` (dopo 04-prove).

## Sala strategia, lavori a SAL, obiettivi, report del mese (10.10.2026 · versione 2.2)
- **Sala strategia** (menu «Sala strategia»): la aprono sviluppo rete, capi area, Responsabile Rete Italia e admin. Si apre un argomento, gli altri commentano. Decidono admin e Responsabile Rete Italia: con due sì diventa una «Linea decisa» che vede tutta la rete (in home e in «Linee decise»). Se uno cambia il testo della linea, l'altro deve ridire sì. Basta un no e non passa. Agenti e sub-agenti non vedono la discussione, solo le linee decise.
- **Privati**: sulle vendite ai privati non maturano provvigioni (contratti, art. 4.6). Le provvigioni ci sono solo se il privato fa un lavoro.
- **Lavori a SAL** (Vendi → «Lavoro o cantiere»): l'agente registra il lavoro; l'admin lo firma (valore, margine, chi chiude, chi segue il cantiere, chi ha portato l'impresa) e registra gli incassi delle 3 tranche: 30% firma e acconto, 30% metà lavori, 40% collaudo. A ogni incasso maturano le provvigioni: alla rete il 40% del margine, diviso 10 chi segnala, 25 chi chiude, 30 chi segue, 10 chi ha portato l'impresa, 12 sviluppo rete, 8 capo area, 5 Rete Italia (Allegato A.2 dei contratti). Se l'incasso è parziale, la provvigione è in proporzione. Il margine lo vede solo l'admin.
- **Oggi e obiettivi**: in home ognuno (admin compreso) vede il mese: nuove aziende clienti, nuovi canoni, lavori firmati, valore dei lavori, contro l'obiettivo, con quanto manca al giorno e chi è fermo da più di 30 giorni. Gli obiettivi li fissano admin e Responsabile Rete Italia («Andamento e obiettivi»): per tutta Italia o per persona (la persona risponde per sé e per chi ha sotto).
- **Il tuo mese** (aziende): risultati del mese e report da scaricare su carta intestata AncheCasa (si salva in PDF dal telefono).
- Prove SQL: `sql/prove/06-prove.sql`.

## Regole dei clienti, «Il mio ruolo», documenti da firmare (10.10.2026 · versione 2.3)
- **Il cliente è di chi lo registra per primo**: aziende per partita IVA (finché il cliente è attivo, e 90 giorni dalla registrazione), privati per telefono o mail (12 mesi che ripartono a ogni registrazione). Se un collega prova a registrare lo stesso cliente, l'app lo ferma («è già registrato da un collega»), senza dire di chi è.
- **Clienti di AncheCasa affidati** (Admin → «Clienti da affidare»): portati da te o arrivati dal sito senza codice. Chi li segue prende metà della quota di chi porta; niente quote di sviluppo, capo area e Rete Italia. Riceve l'avviso: deve chiamare entro 48 ore; dopo 48 ore il cliente compare in «Da fare» e lo puoi riassegnare.
- **Sub-agente sui lavori**: le sue quote si dividono 70% a lui e 30% al suo agente, come nel contratto.
- **Il mio ruolo**: ogni figura (Rete Italia, sviluppo rete, capo area, agente, sub-agente) vede cosa fa, a chi risponde, come guadagna con esempi, un conto da provare, come si sale e le regole comuni (Allegato C).
- **Documenti**: ognuno trova il suo contratto, il regolamento e le circolari (PDF nella cartella `docs`), firma col dito sul telefono e la firma arriva all'admin con data, ora e impronta del documento. L'admin («Contratti e documenti») vede tutti i contratti, chi ha firmato e chi no, le firme e le ricevute, e pubblica nuove circolari per tutta la rete o per ruolo (chi deve firmare riceve l'avviso).
- Prove SQL: `sql/prove/07-prove.sql`.
- Nota legale: la firma nell'app è una firma elettronica semplice. Per i contratti di agenzia fai verificare all'avvocato se basta o se serve una firma elettronica avanzata (per esempio con codice via SMS).


## Pubblicare l'app su Cloudflare Pages (entra.anchecasa.it)

1. Dalla cartella `app-anchecasa`: `node scripts/prepara-pubblicazione.mjs` → crea `dist/` con SOLO i file dell'app (niente `sql/`, `supabase/`, documenti) e le intestazioni di sicurezza; si ferma se trova una chiave segreta.
2. `npx wrangler pages deploy dist --project-name app-anchecasa --branch main` (la prima volta: `npx wrangler pages project create app-anchecasa --production-branch main`).
3. Cloudflare → Workers & Pages → `app-anchecasa` → Custom domains → `entra.anchecasa.it`.
4. Supabase → Authentication → URL Configuration: aggiungere `https://entra.anchecasa.it` (Site URL e Redirect URLs).
5. Google Cloud → chiave di Maps → restrizioni HTTP: aggiungere `https://entra.anchecasa.it/*`.
6. Secrets delle funzioni: `DIAGNOSI_ORIGINI` deve contenere `https://entra.anchecasa.it`; `APP_URL` = `https://entra.anchecasa.it`.

## «Quanto costa ristrutturare?» — pagina pubblica senza account (16.10.2026 · versione 2.9.1)
Per chi arriva dal web e vuole ristrutturare: **una stima in un minuto, senza registrarsi**, poi il telefono per il sopralluogo gratuito.
- Indirizzo: `https://entra.anchecasa.it/quanto-costa.html` (prova: `quanto-costa.html?prova`, prezzi di ESEMPIO e niente inviato).
- Parametri utili nei link: `?lavoro=bagno` (cucina, pareti, completa, facciata, altro) apre già il lavoro; `?codice=XXX` registra chi ha portato il cliente (agente, sub-agente).
- Il giro: il cliente sceglie il lavoro, i mq, la regione e la finitura → vede la forbice di prezzo → lascia nome e telefono → la richiesta arriva in **Admin → Richieste dai siti** (tipo «Simulazione», con la stima allegata e la campanella) → l'admin la affida alla ditta convenzionata, che chiama entro 48 ore e fa il **Sopralluogo Flash** → preventivo → contratto con AncheCasa.
- Pulsanti già messi: nella prima schermata dell'app («Vuoi ristrutturare? Calcola quanto costa, senza registrarti») e nel profilo Privato → Ristruttura. Per il sito anchecasa.it: vedi `PULSANTE-SITO-quanto-costa.txt`.

**Per accenderla**
1. Supabase → SQL Editor: `sql/app-32-simulatore-pubblico.sql` → Run (dopo app-03 e app-11). Si può rilanciare.
2. I prezzi arrivano dagli stessi prezzari regionali del Sopralluogo Flash (Admin → Cruscotto → «Prezzari regionali per la stima»): importare il CSV della Regione e collegare le lavorazioni. **Senza prezzario di quella regione la pagina non dà numeri** e chiede solo il sopralluogo.
3. Le quantità di partenza (es. bagno: rivestimento = 3,5 volte i mq del pavimento) sono in `marketplace.app_simulatore_ricette`: **le deve controllare l'ufficio tecnico** prima di andare online. Si cambiano dal Table Editor di Supabase, senza toccare l'app.
4. Impostazioni in `app_impostazioni`, chiave `simulatore`: `forbice` (0.25 = ±25%), `copertura` (0.8 = servono i prezzi di almeno l'80% delle lavorazioni, altrimenti niente stima), `attivo` (false = la pagina chiede solo il sopralluogo). I coefficienti di finitura sono quelli del Flash (`stima_flash`).
5. Ripubblicare: `node scripts/prepara-pubblicazione.mjs` e poi il deploy (la pagina è già nell'elenco dei file da copiare).
- Se il punto 1 non è ancora fatto, la pagina funziona lo stesso: niente stima, la richiesta arriva come «Sopralluogo» nelle richieste dai siti. Nessun cliente si perde.
- Prove SQL: `sql/prove/32-prove.sql`.

**Attenzione: entra.anchecasa.it oggi NON mostra questa app.** Al 16.10.2026 l'indirizzo apre ancora la vecchia pagina «Area riservata» (solo mail e password), mentre l'app vera è su `app-anchecasa.pages.dev`. Va fatto il punto 3 di «Pubblicare l'app su Cloudflare Pages»: Cloudflare → Workers & Pages → `app-anchecasa` → Custom domains → `entra.anchecasa.it` (e togliere il dominio dal vecchio progetto).
