# Appunti per Francesco · 11.10.2026 sera

## URGENTE · da fare tu

1. **DNS di entra.anchecasa.it.** CNAME `entra` → `app-anchecasa.pages.dev`, nuvola grigia, solo DNS. Il nome è già aggiunto al progetto Cloudflare Pages «app-anchecasa» e aspetta il record. L'app risponde su https://app-anchecasa.pages.dev. Non ricollegare app.anchecasa.it.
2. **Chiave Gemini.** Sopralluogo Flash è online e la nota vocale si carica. Google risponde che `GEMINI_API_KEY` non è valida. Sostituiscila, nei segreti di Supabase, con una chiave vera di Google AI. Poi entra come agente, apri un sopralluogo e manda un audio: devono tornare computo e stima.

app-15 è già eseguito. Non rilanciarlo.

La stessa nota è la prima pagina dell'area privata, voce Appunti.

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

La chiave Gemini è tra i segreti di Supabase. Il valore non è in questo file. Google la rifiuta: «API key not valid». Va sostituita con una chiave vera. Il valore non va scritto qui.

La prova dell'11.10.2026 sera: un agente di prova ha creato il sopralluogo e ha caricato una nota webm. La funzione ha prenotato l'analisi e si è fermata su Gemini, in due secondi, senza trascrizione e senza computo. I sopralluoghi di prova sono stati cancellati.

## Posti liberi

100 − 6 spente + 3 nuove = 97 online. Restano 3 posti liberi.

## Database

`prezzi_visibili` è `true`.

app-15 è eseguito l'11.10.2026 sera. `app_soggetti` e `app_rubrica` esistono, entrambe a 0 righe: le tabelle da cui copiava erano vuote. Il backup fisico non c'è (PITR spento, elenco backup vuoto, Docker assente, password del database rifiutata). Lo SQL è stato lanciato lo stesso perché non cancella colonne e le tabelle toccate erano vuote.

app-16 è eseguito: il bucket `sopralluoghi` accetta anche le note vocali (webm, mp4, ogg, mpeg, fino a 15 MB) e le regole di caricamento le lasciano passare a chi è l'agente di quel sopralluogo.

L'iscrizione con password è stata provata. L'account `prova-iscrizione-1110@anchecasa.it` è nato e la riga in `richieste_iscrizione` è stata accettata.

## SuperMastro SOS

Non pubblicato. Il login nuovo è nel codice della cartella, ma il sito online è ancora quello di prima e il middleware di questo progetto ragiona su anchecasa.it. Non l'ho sostituito stasera.

## Dopo il primo invio del sito

Il primo sito pubblicato aveva `ac.js` che non partiva: un pezzo dell'iscrizione era finito dentro SuperMastro e rompeva la sintassi. Corretto e ripubblicato (`dpl_Bx9ZtUYgSsXjaPvbSEDMfv78ih3o`, `ac.js?v=8`). Il modulo «Parla con un consulente» ha scritto nel database la riga di prova `prova-pubblicazione-1110@anchecasa.it`, modulo `consulenza-prezzi`. Non ho creato un account nuovo.
