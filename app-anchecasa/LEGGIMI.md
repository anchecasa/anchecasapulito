# App AncheCasa — parte 1 (09.10.2026)

L'app vera, costruita sul prototipo approvato da Nando.
È un'app sola per tutti: si entra una volta e si passa da un profilo all'altro.

In questa parte ci sono:
- **Accesso**: entra, crea l'account (privato o artigiano), password dimenticata.
- **Privato**
  - SuperMastro: video di 5 secondi → analisi → «Trova l'artigiano vicino a me» → mappa con prima gli **iscritti AncheCasa** (ricevono video e analisi) e poi i **5 più vicini su Google Maps** con «Chiama».
  - Richieste con il loro stato, recensione con 5 voti, «Segnala ad AncheCasa», «Ristruttura con AncheCasa».
- **Artigiano (pronto intervento)**
  - Scheda, verificata da AncheCasa prima di comparire ai privati.
  - Disponibile o in pausa, richieste ricevute con video e analisi.
  - «Accetto»: da lì vede il telefono del cliente.
  - Recensioni con il voto per ogni voce, «Passa a Impresa» se ha i requisiti.
- **Admin**: cruscotto, verifica degli artigiani, passaggi a Impresa, segnalazioni dei privati.
- **Altri profili** (impresa, agente, capoarea…): per ora una pagina «arriva nelle prossime versioni». Vanno costruiti uno alla volta.

## Provarla senza toccare niente

La modalità prova usa dati di ESEMPIO salvati nel browser: non tocca il database.
- Aprire `index.html?prova` da un server locale. Basta un doppio clic su `PROVA-APP.bat`.
- Oppure aprire l'anteprima su claude.ai.

## Cosa c'è nella cartella

| File | Cosa fa |
|---|---|
| `index.html`, `css/`, `js/`, `img/`, `vendor/` | L'app. È una web app installabile sul telefono. In seguito si impacchetta per gli store con Capacitor, senza riscriverla. |
| `js/config.js` | Indirizzo di Supabase, chiave pubblica di Supabase e chiave pubblica di Google Maps. Sono chiavi fatte per stare nel telefono e non sono segrete. |
| `sql/app-01-supermastro.sql` | Le tabelle nuove dell'app (tutte `app_…`) nello schema `marketplace`. **Non tocca niente dei siti.** |
| `sql/prove/` | Le prove dei permessi, fatte su un Postgres locale. Da NON eseguire su Supabase. |
| `supabase/functions/supermastro-analisi/index.ts` | La funzione che analizza il video. È nata da «diagnosi-video» delle viste, con in più il controllo dell'utente, il limite giornaliero e il salvataggio sicuro. |

## Per accenderla davvero (in quest'ordine, li fa Nando)

**1. Database.** Supabase, progetto ANCHECASA → SQL Editor:
- incollare tutto `sql/app-01-supermastro.sql` → Run;
- si può rilanciare senza danni.

**2. Funzione dell'analisi.** Supabase → Edge Functions → Deploy a new function → Via Editor:
- nome `supermastro-analisi`, incollare `supabase/functions/supermastro-analisi/index.ts` → Deploy;
- «Verify JWT» si può lasciare spento: il controllo dell'utente lo fa la funzione.
- Poi, in Edge Functions → Secrets, va messa **UNA** chiave dell'intelligenza artificiale:
  - `GEMINI_API_KEY`: guarda il video intero, consigliata;
  - `ANTHROPIC_API_KEY`: guarda i fotogrammi;
  - `OPENAI_API_KEY`: guarda i fotogrammi.
- Le chiavi si incollano solo lì, mai in chat o nei file.
- Facoltativi:
  - `DIAGNOSI_ORIGINI`, l'indirizzo dell'app, per esempio `https://app-anchecasa.vercel.app`;
  - `ANALISI_AL_GIORNO`, predefinito 15 a persona;
  - `ANALISI_TOTALI_AL_GIORNO`, predefinito 500.
- Se l'app dice «configurazione mancante», aggiungere nei Secrets `AC_PUBLISHABLE_KEY` e `AC_SECRET_KEY`, prese da Project Settings → API Keys.

**3. Accesso.** Supabase → Authentication → URL Configuration → Redirect URLs:
- aggiungere l'indirizzo dell'app con `/**` in fondo, per esempio `https://app-anchecasa.vercel.app/**`;
- serve per le mail di conferma e di nuova password.

**4. Google Maps.** console.cloud.google.com → progetto «anchecasa» → la chiave «AncheCasa area privata» → Restrizioni siti web:
- aggiungere l'indirizzo dell'app;
- senza questo, la mappa e i 5 artigiani di Google non compaiono.

**5. Pubblicazione** (progetto Vercel NUOVO, separato dai siti congelati). Da Cursor:
```
cd "C:\Users\palum\Desktop\ANCHECASA-PULITO\app-anchecasa"
npx vercel deploy --prod --yes --scope anchecasas-projects
```
- La prima volta crea il progetto `app-anchecasa`.
- Il dominio `app.anchecasa.it` oggi punta al sito: spostarlo sull'app solo con «AUTORIZZO LA MODIFICA: dominio app.anchecasa.it».

**6. Prima di aprirla al pubblico**, in `js/config.js`:
- `privacyUrl`: il link all'informativa privacy, con dentro anche i video del guasto e la posizione;
- `premioSegnalazione`: il testo del premio per chi segnala;
- `passaggio`: i requisiti da artigiano a Impresa. Oggi sono 20 lavori e una media di 4,5, ma sono solo un esempio.

## Sicurezza (controllata il 09.10.2026)
- Ogni tabella ha i suoi permessi (RLS). Le prove sono in `sql/prove/01-prove.sql`. Una revisione indipendente ha trovato 2 problemi gravi e 7 medi, tutti corretti e riprovati.
- L'analisi del video la salva solo la funzione, quindi non si può falsificare dal telefono.
- Ci sono limiti alle analisi: per persona e in totale, al giorno.
- Il telefono del privato lo vede solo l'artigiano che accetta. Prima di accettare vede solo la zona, non la posizione esatta.
- Un artigiano non può verificarsi da solo, né recensirsi.
- Nessuna chiave segreta è nei file.
