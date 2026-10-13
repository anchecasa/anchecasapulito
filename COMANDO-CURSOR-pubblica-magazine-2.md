# Comando per Cursor · Pubblica il Magazine numero 2 e le presentazioni (13.10.2026)

OK di Nando dato in chat il 13.10.2026: Claude ha preparato i file, Cursor pubblica. Fermati se un passo fallisce. Nessuna chiave in chat o nei file.

## File già nella cartella ANCHECASA-PULITO
- Sito: `sito/js/magazine-2.js` (nuovo), `sito/magazine.html` (apre il numero 2), `sito/magazine-1.html` (nuovo, numero 1), `sito/magazine/numero-2/` (foto).
- Magazine: `magazine-sito/` (contenuti, genera.py, pagine rigenerate, `img/` e `sorgenti-img/` con le foto n2). Non serve rilanciare genera.py.
- Area privata: `area-privata/dashboard/docs/presentazioni/` (6 presentazioni, 1 e 3 aggiornate), `dashboard/js/sala-demo.js`, `dashboard/index.html`.

## Passi
1. `git pull` su `main`; `git add` dei file sopra (non `_to_delete/`); commit «Magazine n.2, presentazioni rete (13.10.2026)»; push.
2. Pubblica `sito` (progetto Vercel `anchecasa-pulito`). Controlla: https://anchecasa.it/magazine mostra «N. 2 · Speciale ristrutturazioni» e sfoglia 10 pagine; https://anchecasa.it/magazine-1 mostra il numero 1; il pulsante «Richiedi un sopralluogo gratuito» apre https://anchecasa.it/ristruttura.html#sopralluogo.
3. Pubblica `magazine-sito` (progetto Vercel con Root Directory `magazine-sito`, dominio magazine.anchecasa.it). Controlla: la home dice «Numero 2 · Ottobre 2026», gli articoli del numero 2 rispondono 200, nelle pagine c’è «AncheCasa Studio srl» e non più «AncheStudio».
4. Pubblica l'area privata (come in `COMANDO-CURSOR-pubblica-presentazioni.md`) e controlla il menu «Presentazione».
5. Scrivi la voce nel Registro di `CLAUDE.md` con i deployment.
