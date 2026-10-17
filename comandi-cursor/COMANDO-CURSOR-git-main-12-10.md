COMANDO PER CURSOR — Commit su main del lavoro del 12.10.2026 (sopralluogo, dossier, relazione IA, app della rete, Vista chiara)

Apri in Cursor la cartella C:\Users\palum\Desktop\ANCHECASA-PULITO. Modalità Agent. Parla in italiano semplice.
Prima di ogni push mostrami cosa farai e aspetta il mio «ok». Nessuna chiave o password nei commit.

ATTENZIONE: NON aggiungere niente di supermastro-sos/, sito/vercel.json, PUBBLICA-SUPERMASTRO.bat
(è un altro lavoro in corso: resta com'è, non fare stash, non annullare niente).
Niente «git add .» e niente «git add -A»: solo i file elencati.

PASSO 0 — Controllo
git status   →  mostrami l'elenco. Controlla con git diff --stat che i file grandi (contratto-firma.js, benvenuto.js,
area-privata/vercel.json) non siano solo fine riga cambiati: se sì, dimmelo prima di fare commit.

COMMIT 1 — Sopralluogo, dossier tecnico e relazione con l'IA
git add app-anchecasa/sql/app-27-sopralluogo-invito.sql app-anchecasa/sql/app-28-dossier-tecnico.sql app-anchecasa/sql/app-29-relazione-ia.sql app-anchecasa/sql/app-30-sopralluoghi-formati.sql
git add app-anchecasa/supabase/functions/sopralluogo-invito app-anchecasa/supabase/functions/dossier-ia
git add area-privata/sopralluogo.html area-privata/js/sopralluogo.js area-privata/js/relazione.js area-privata/css/sopralluogo.css area-privata/css/relazione.css area-privata/img/sopralluogo-demo area-privata/js/benvenuto.js
git add area-privata/dashboard/js/sopralluogo-invio.js area-privata/dashboard/js/dossier-tecnico.js area-privata/dashboard/js/imprese.js area-privata/dashboard/js/contratto-firma.js area-privata/dashboard/js/app.js
git add COMANDO-CURSOR-sopralluogo-invito.md
git commit -m "Sopralluogo al cliente, dossier tecnico e relazione con l'IA (Gemini) per tutta la casa, contratto che non blocca (app-27..30)"

COMMIT 2 — App della rete sul telefono
git add area-privata/app area-privata/vercel.json app-anchecasa/sql/app-31-app-agente.sql COMANDO-CURSOR-app-agente.md
git commit -m "App della rete sul telefono (Vista A chiara): home, sopralluogo flash, clienti, rete con cartina, formazione (app-31)"

COMMIT 3 — Vista chiara della dashboard sul telefono
git add area-privata/dashboard/css/vista-chiara.css area-privata/dashboard/index.html COMANDO-CURSOR-vista-chiara-telefono.md COMANDO-CURSOR-git-main-12-10.md
git add CLAUDE.md   (solo se l'hai aggiornato con il Registro di oggi)
git commit -m "Dashboard sul telefono: Vista A chiara per tutti i profili (solo grafica)"

PASSO FINALE
git status   →  devono restare modificati SOLO i file di supermastro-sos/, sito/vercel.json e PUBBLICA-SUPERMASTRO.bat.
git log --oneline -4   →  mostrami i 3 commit.
Dopo il mio «ok»: git push origin main
Alla fine la tabella commit · file · fatto.
