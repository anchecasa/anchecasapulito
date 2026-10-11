# Appunti per Francesco · 11.10.2026 sera

Nando ha dato l'ok scritto per pubblicare. Il DNS di entra.anchecasa.it non è stato toccato: lo scrive Francesco. app.anchecasa.it non è stato ricollegato.

## Funzioni spente

Il piano Supabase è a 100 funzioni. Ne servivano tre nuove e qualche posto libero. Spente solo funzioni che non compaiono nel sito, nell'app, nell'area privata, in SuperMastro SOS, nel cruscotto, nel Magazine, nello SQL e nei cron. Login, iscrizione, mail, pagamenti e `sdi-gateway` non sono state toccate. Il codice è in `app-anchecasa/supabase/functions-archivio/`.

| Funzione | Ultimo aggiornamento online | Perché è spenta |
|---|---|---|
| parse-cv | 11.07.2026 | Nessuno la chiama. Il curriculum resta un file nel bucket. |
| scrape-company-site | 04.08.2026 | Nessuno la chiama. |
| installation-bids | 13.08.2026 | Nessuno la chiama. |
| omi-lookup | 13.08.2026 | Nessuno la chiama. |
| ordine-tracking | 13.08.2026 | Nessuno la chiama. Il tracking non è più in vendita. |
| presentazione-mappa-search | 13.08.2026 | Nessuno la chiama. |

Restano accese, perché un cron le chiama ogni minuto o ogni giorno: `risponditore-cron`, `chat-annunci-cron`, `ingest-bacheca-annunci`.

## Funzioni pubblicate stasera

- `sopralluogo-flash`
- `subappalti-mail`
- `gare-analisi`

Senza accesso rispondono `accesso_richiesto`. `sdi-gateway` era già online e non è stata spenta.

La chiave Gemini è stata copiata dal file locale già presente sul PC e messa tra i segreti di Supabase. Il valore non è in questo file.

La prova completa (nota vocale vera, computo e stima) da qui non si può fare: serve un agente entrato nell'app, con un sopralluogo e un audio nel bucket. La funzione c'è e chiede l'accesso.

## Posti liberi

100 − 6 spente + 3 nuove = 97 online. Restano 3 posti liberi.

## Database

`prezzi_visibili` è `true`.

app-15 non è stato eseguito. Il backup fisico non c'è (niente PITR, elenco backup vuoto). `supabase db dump` chiede Docker, che su questo PC non c'è. La password del database nel file risponde «password authentication failed». Senza una copia da cui tornare indietro, lo SQL nuovo non è stato lanciato. Francesco può fare il backup dal pannello e poi eseguire `app-anchecasa/sql/app-15-anagrafica-unica.sql`.

## SuperMastro SOS

Non pubblicato. Il login nuovo è nel codice della cartella, ma il sito online è ancora quello di prima e il middleware di questo progetto ragiona su anchecasa.it. Non l'ho sostituito stasera.

## Dopo il primo invio del sito

Il primo sito pubblicato aveva `ac.js` che non partiva: un pezzo dell'iscrizione era finito dentro SuperMastro e rompeva la sintassi. Corretto e ripubblicato (`dpl_Bx9ZtUYgSsXjaPvbSEDMfv78ih3o`, `ac.js?v=8`). Il modulo «Parla con un consulente» ha scritto nel database la riga di prova `prova-pubblicazione-1110@anchecasa.it`, modulo `consulenza-prezzi`. Non ho creato un account nuovo.
