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
| **Admin** | Cruscotto con tutte le divisioni e una lista «Da fare» con tutto quello che aspetta una decisione. Aziende e moduli (attivazione), AncheCasa GC (cantieri, inviti a proprietari e partner), AncheSicura (ordini, rivendite, consulenti), SuperMastro (artigiani, passaggi, segnalazioni), AncheVoice, gare e lotti, rete commerciale (inviti, ruoli, aree, conferma vendite, pagamento provvigioni), economia, report recensioni con CSV per Excel, impostazioni (prezzi e percentuali). |

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

**1. Database.** Supabase → progetto ANCHECASA → SQL Editor. Si eseguono quattro file, uno dopo l'altro:
- `sql/app-01-supermastro.sql` → Run;
- `sql/app-02-completa.sql` → Run;
- `sql/app-03-siti.sql` → Run (richieste dai siti nella schermata Admin → Contatti);
- `sql/app-04-rete-italia.sql` → Run (Responsabile Rete Italia e nuove quote della rete).

Prezzi (09.10.2026): abbonamento base + moduli. Artigiano 14,90 €; Impresa 49 € con Ufficio compreso; Fornitore 99 €; moduli in più da 9 €, tutti insieme 69 €. Si cambiano da Admin → Impostazioni.

Si possono rilanciare senza danni. Aggiungono solo tabelle `app_…`: i siti e l'area privata non vengono toccati.

**2. Due funzioni dell'intelligenza artificiale.** Supabase → Edge Functions → Deploy a new function → Via Editor:
- `supermastro-analisi`: incollare `supabase/functions/supermastro-analisi/index.ts`;
- `gare-analisi`: incollare `supabase/functions/gare-analisi/index.ts`.

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
Per spostare `app.anchecasa.it` sull'app serve «AUTORIZZO LA MODIFICA: dominio app.anchecasa.it».

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
