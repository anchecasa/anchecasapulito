COMANDO PER CURSOR — Vista A chiara sul telefono per tutti i profili · 12.10.2026

Apri in Cursor la cartella C:\Users\palum\Desktop\ANCHECASA-PULITO. Modalità Agent. Parla in italiano semplice.
Leggi prima CLAUDE.md. Prima di ogni passo che cambia qualcosa online mostrami cosa farai e aspetta il mio «ok».
Fallo DOPO aver finito COMANDO-CURSOR-app-agente.md (stesso deploy, si può anche fare in un colpo solo).

REGOLE
1. Nessuna chiave, password o token in chat, nei file o nei commit.
2. È SOLO grafica: non toccare dashboard/js/app.js (parti CONGELATE), nessun menu aggiunto, tolto o rinominato.
3. Non riscrivere il file nuovo: si corregge solo se una prova fallisce, e mi dici cosa hai cambiato.
4. Annota ogni passo nel Registro di CLAUDE.md.

COSA FA (deciso da Nando alle 19:34)
Sul telefono (sotto i 980px) la dashboard di privato, azienda/fornitori, rete e admin prende la «Vista A chiara» dell'app della rete:
testata chiara col logo senza riquadro, saluto in pillola bianca, carattere Manrope, card con angoli 20 e ombra morbida,
bottoni arancio scuro, barra in basso bianca con la sezione attiva in arancio, scheda «Altro» a foglio, niente orologio
e «dati al» sul telefono. Da computer non cambia nulla.

FILE NUOVO
- area-privata/dashboard/css/vista-chiara.css
MODIFICATO
- area-privata/dashboard/index.html (una riga: <link rel="stylesheet" href="css/vista-chiara.css?v=1"> subito dopo testata.css)

PASSO 1 — Prova in locale
Dalla cartella area-privata: npx serve . -l 5500
A larghezza 390 apri:
  http://localhost:5500/dashboard/?demo=privato
  http://localhost:5500/dashboard/?demo=azienda
  http://localhost:5500/dashboard/?demo=agente
  http://localhost:5500/dashboard/?demo=admin
In ognuno: Home, una sezione della barra in basso, «Altro», il menu «Ciao, …», una pagina con un modulo (Profilo).
Nessuna pagina deve scorrere di lato. Poi a larghezza 1400: deve essere IDENTICA a prima.
Mostrami cosa vedi e aspetta il mio «ok».

PASSO 2 — Pubblicazione
Confronto dei file online con quelli locali come oggi (se online c'è qualcosa che manca in locale, fermati).
Da area-privata: npx vercel deploy --prod
Controlla 200 su /dashboard/css/vista-chiara.css e che /dashboard/ carichi vista-chiara.css?v=1.

PASSO 3 — Prova vera
Nando apre https://entra.anchecasa.it/dashboard/ dal telefono con il suo account (la password la scrive lui).
Se il telefono mostra ancora la grafica vecchia: chiudi e riapri la pagina (cache).

PASSO 4 — GitHub
Commit SOLO dei due file sopra + CLAUDE.md + questo file. Messaggio:
«Dashboard sul telefono: Vista A chiara per tutti i profili (solo grafica)»
Push su origin dopo il mio «ok». Alla fine la tabella passo · fatto · cosa hai visto.
