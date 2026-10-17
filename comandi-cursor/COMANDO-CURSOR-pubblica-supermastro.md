COMANDO PER CURSOR — Metti online SuperMastro nuovo (app + anchecasa.it/supermastro) · 12.10.2026 sera, versione 2

Apri in Cursor la cartella C:\Users\palum\Desktop\ANCHECASA-PULITO. Modalità Agent. Parla in italiano semplice.
Leggi prima CLAUDE.md: le voci di Claude del 12.10.2026 (17:10, 17:25, 20:05, 20:10, 20:35) nel Registro.
Nando ha già dato l'ok scritto (17:14) per migrazione, app e sito. Esegui senza chiedere di nuovo il permesso,
ma fermati e dimmi l'errore esatto se un passo fallisce.

DOVE SIAMO (fatto da Claude)
- Migrazione Supabase 20261012160000_sos_rete_video.sql: GIÀ ESEGUITA. Supabase non si tocca.
- supermastro-sos\web\.env.local copiato da 04-SuperMastro; npm ci già fatto (node_modules c'è).
- La build OpenNext riesce. La pubblicazione FALLISCE: Cloudflare risponde «Authentication error [code: 10000]»
  con la CLOUDFLARE_API_TOKEN di .env.local. Claude l'ha disattivata (riga commentata in .env.local) per usare
  l'accesso Cloudflare di Nando dal browser (wrangler login). Il secondo tentativo si è fermato a wrangler login:
  il messaggio non è stato letto.
- Il sito anchecasa.it NON è stato pubblicato (giusto: si pubblica solo dopo l'app).
- Ultimo log: supermastro-sos\pubblica-log.txt. Esito: supermastro-sos\pubblica-esito.txt.

REGOLE
1. Nessuna chiave, password o token in chat, nei file o nei commit. Non stampare .env.local.
2. Non cambiare il codice dell'app. Se qualcosa non compila, fermati e mostrami l'errore.
3. Non riattivare la vecchia CLOUDFLARE_API_TOKEN: Cloudflare la rifiuta.
4. Annota tutto nel Registro di CLAUDE.md.

PASSO 1 — Accesso a Cloudflare (nel terminale di Cursor)
  cd supermastro-sos\web
  npx wrangler logout
  npx wrangler login
  -> si apre il browser: dimmi «premi Allow» e aspetta che io lo faccia.
  npx wrangler whoami
Controlla che nell'elenco ci sia l'account ce7125d817d6c6ecd8c765b60ac4e0d0 e che i permessi comprendano workers (write).
- Se la variabile di Windows CLOUDFLARE_API_TOKEN è impostata (echo %CLOUDFLARE_API_TOKEN% non vuoto), wrangler usa
  quella invece del login: in questo terminale fai  set CLOUDFLARE_API_TOKEN=  e ripeti whoami. Non mostrarne il valore.
- Se l'account non c'è o mancano i permessi: FERMATI e dimmelo. Servirà una chiave nuova da dash.cloudflare.com
  (My Profile → API Tokens → modello «Edit Cloudflare Workers», account ce7125d817d6c6ecd8c765b60ac4e0d0):
  la crea Nando o Francesco e la mette in .env.local, non tu.

PASSO 2 — Pubblica l'app (Worker supermastro-sos)
  cd ..
  node scripts\redeploy-worker.mjs
(build OpenNext, pubblicazione, poi carica le chiavi del Worker da .env.local: GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY…).
Se fallisce, mostrami le ultime 30 righe senza chiavi e fermati.

PASSO 3 — Controllo dell'app online (larghezza 390)
- https://supermastro.anchecasa.it/supermastro → procione «Ciao! Che si è rotto?» e «Mostrami il guasto», senza login.
- https://supermastro.anchecasa.it/supermastro/video → risponde 200, avviso con «Apri la fotocamera».
- https://supermastro.anchecasa.it/supermastro/nuova → porta a /supermastro/video.
- Diagnosi vera: dimmelo, la faccio io dal telefono. Se compare «Analisi video non configurata» o «Analisi non riuscita»,
  la chiave Gemini non va (negli appunti per Francesco Google la rifiutava): scrivilo e fermati.
Se una prova fallisce, NON fare il passo 4.

PASSO 4 — Pubblica il sito (i reindirizzamenti sono già in sito\vercel.json)
  cd ..\sito
  npx --yes vercel@latest deploy --prod --yes
  (oppure PUBBLICA-SITO-VERCEL.bat dalla cartella principale)
Controllo da telefono: anchecasa.it/supermastro e anchecasa.it/supermastro.html aprono https://supermastro.anchecasa.it/supermastro.

PASSO 5 — Fine
- Scrivi FATTO in supermastro-sos\pubblica-esito.txt.
- Registro di CLAUDE.md: account Cloudflare usato (solo il nome), deployment del Worker, deployment Vercel, esito delle prove.
- Niente commit e niente push in questo comando.
- Poi passa a COMANDO-CURSOR-supermastro-procione.md, dal suo PASSO 0.

NOTA: PUBBLICA-SUPERMASTRO.bat fa gli stessi passi (con wrangler login) e si può usare al posto dei passi 1-4,
ma da Cursor vedi gli errori, quindi qui fai i passi a mano.

QUANDO HAI FINITO dimmi in poche righe: cosa è online, le prove con esito, cosa resta.
