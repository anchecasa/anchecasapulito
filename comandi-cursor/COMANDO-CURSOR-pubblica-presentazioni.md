# Comando per Cursor · Pubblica le presentazioni per la rete (13.10.2026)

OK di Nando dato in chat il 13.10.2026: Claude ha preparato i file, Cursor pubblica.

## Cosa è cambiato (già nella cartella ANCHECASA-PULITO)
- `area-privata/dashboard/docs/presentazioni/`: 18 file nuovi, 6 presentazioni × (HTML con frecce, PDF, PowerPoint):
  1-AncheCasa-perche-adesso, 2-AncheCasa-SuperMastro, 3-Sopralluogo-Flash-come-funziona,
  4-AncheCasa-come-guadagni, 5-AncheCasa-gare-cantieri-computi, 6-AncheCasa-si-parte-domani.
- `area-privata/dashboard/js/sala-demo.js`: al posto della scaletta del 13.10 c'è «Le presentazioni per la rete» (Apri, PDF, PowerPoint per ognuna); tolti i 6 documenti «Da scrivere». Dashboard in vetrina, documenti pronti e contratti restano uguali.
- `area-privata/dashboard/index.html`: `sala-demo.js?v=12`.
- In `area-privata/dashboard/docs/` non ci sono più i file `Sopralluogo-Flash-come-funziona.*` (spostati in `_to_delete/docs-presentazioni-1310/` nella radice). C'è una cartella vuota `docs/_to_delete`: ignorala.

## Cosa fare, in ordine. Fermati se un passo fallisce.
1. `git pull` su `main`, poi `git add` dei file sopra (non `_to_delete/`), commit «Sala demo: sei presentazioni per la rete (13.10.2026)», push.
2. Pubblica l'area privata come al solito (progetto Vercel `area-privata-produzione`, alias entra.anchecasa.it).
3. Controlla online, admin: menu «Presentazione» → si vedono 6 righe con Apri, PDF, PowerPoint.
   - https://entra.anchecasa.it/dashboard/docs/presentazioni/1-AncheCasa-perche-adesso.html risponde 200 e le frecce funzionano.
   - I 6 PDF e i 6 PPTX rispondono 200.
4. Scrivi la voce nel Registro di `CLAUDE.md` (deployment, URL provati).
Nessuna chiave in chat o nei file.
