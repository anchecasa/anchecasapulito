# Comando per Cursor · Modello affiliati e pubblicazione (13.10.2026)

Decisione di Nando, 13.10.2026:
1. Agli artigiani (SuperMastro, Ho un guasto, Trova artigiano) vanno **solo i pronti interventi**, per ogni tipo di lavoro.
2. Tutto il resto (bagno, cucina, casa, ristrutturazioni) lo fa **solo AncheCasa**: sopralluogo con Sopralluogo Flash, preventivo, contratto con il cliente, lavoro a un'impresa **affiliata** in subappalto. L'artigiano non passa lavori: se vuole farli, si affilia.
3. Affiliato: **69 € al mese** per stare nella piattaforma, sponsorizzate per farsi i lavori da solo, **nessuna esclusiva**, documenti in regola.
4. Affiliato pagato **a SAL** (dopo il SAL incassato dal cliente).
5. L'affiliato è **subappaltatore e risponde del suo lavoro** (manleva verso AncheCasa).

## Già fatto da Claude nella cartella (solo testi e documenti)
- Sito: `partner.html` (Diventa affiliato), `ristruttura.html`, `trova.html`, `prezzi.html` (Imprese affiliate 69 €), `index.html`, menu «Diventa affiliato» in 31 pagine.
- Regole: `area-privata/dashboard/regole/aziende.html`, `listino.html`, `privato.html`, `rete.html`; nuove bozze `accordo-affiliato.html` e `contratto-cliente.html` (da far verificare a un legale).
- Sala demo: `dashboard/js/sala-demo.js?v=15` (solo le 6 presentazioni e i contratti in vista, il resto in «Altro materiale», niente card «In preparazione»; i 2 documenti nuovi).
- Presentazioni: `dashboard/docs/presentazioni/` (tutte e 6 rifatte come storie: Anna, Rosa, Giulia, Luca, Marco).
- Copie di prima in `_to_delete/copie-affiliati-1310/`.

- Fornitori: tutti **99 € al mese, il primo mese gratis** (`regole/listino.html`, `sito/prezzi.html`, presentazioni).

## Codice: già fatto da Claude il 13.10 (autorizzato da Nando, eccezione scritta nel Registro)
1. **SuperMastro** (`supermastro-sos/web/src`): `lib/sos/gemini-video.ts` (campo `tipo_lavoro`: pronto_intervento / ristrutturazione), `lib/sos/parse-diagnosis.ts`, `lib/sos/diagnosis-rules.ts` (`ristrutturazione` nel payload), `components/supermastro/esito-view.tsx` (se è ristrutturazione: card «Questo è un lavoro da ristrutturazione» con «Richiedi un sopralluogo gratuito» → `https://anchecasa.it/ristruttura.html#sopralluogo`; altrimenti resta «Trova un … vicino»). `tsc --noEmit` passa. Copie di prima in `_to_delete/copie-supermastro-1310/`.
2. **Dashboard** (`area-privata/dashboard/js/app.js`, eccezione 13.10): privato «Pronto intervento · artigiano», tolto «Piccoli lavori con le imprese»; impresa «Lavori AncheCasa (subappalto)», tolto «Piccoli lavori dei privati». Stesso titolo in `privato-progetto.js`. `index.html`: `app.js?v=33`, `privato-progetto.js?v=3`.

## Cosa resta a Cursor
1. SuperMastro: `npm test` (o i test del progetto) e `npm run build` in `supermastro-sos/web`. Prova con un video di un bagno da rifare (deve uscire il sopralluogo) e con un rubinetto che gocciola (deve uscire l'artigiano). Se i test sulle diagnosi falliscono per il campo nuovo, aggiorna solo i test.
2. Con l'OK di Nando pubblica: SuperMastro, sito, magazine-sito, area privata (vedi `COMANDO-CURSOR-pubblica-magazine-2.md` e `COMANDO-CURSOR-pubblica-presentazioni.md`).
3. Controlla online: Sala demo (6 presentazioni, si aprono), menu di privato e impresa, prezzi fornitori. Scrivi la voce nel Registro.
