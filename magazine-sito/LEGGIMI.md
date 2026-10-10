# magazine.anchecasa.it — AncheCasa Magazine (sito ufficiale)

Sito statico della rivista. La rivista sfogliabile resta su https://anchecasa.it/magazine (cartella `sito/`).

## Come si aggiorna (ogni numero, ogni 15 giorni)
1. Testi in `contenuti.py`: aggiungi il numero in `NUMERI` e i suoi articoli in `ARTICOLI`; aggiorna `AGGIORNATO` (data di controllo) e, se cambia, `SCADENZA_BONUS`.
2. Foto originali in `sorgenti-img/` (jpg): lo script crea da solo le versioni leggere in `img/`.
3. `python3 genera.py` (Python 3.12 o più, con Pillow) rifà tutte le pagine, `sitemap.xml` e `robots.txt`.

## Regole della redazione
- Solo per i cittadini. Nessuna impresa citata, sponsorizzata o in pubblicità.
- Per chi fa i lavori: sempre e solo https://anchecasa.it.
- Ogni numero con la fonte accanto; ogni articolo con la data dell'ultimo controllo.
- Le app (Check Bollette, SuperMastro, app della raccolta) sono gratuite per sempre e sviluppate da AncheStudio.
- Marchio: in fondo la curva AncheCasa identica a mail e report (numeri in CLAUDE.md).

## Pubblicazione
Progetto Vercel a parte, Root Directory `magazine-sito`, dominio `magazine.anchecasa.it`.
`api/mag.js` è la stessa funzione di `sito/api/mag.js` (iscrizioni su Supabase).
