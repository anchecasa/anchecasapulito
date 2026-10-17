COMANDO PER CURSOR — SuperMastro con il procione per chi cerca un guasto o un artigiano · 12.10.2026 sera

Apri in Cursor la cartella C:\Users\palum\Desktop\ANCHECASA-PULITO. Modalità Agent. Parla in italiano semplice.
Leggi prima CLAUDE.md (regole fisse e le due voci di Claude del 12.10.2026 17:10 e 17:25 nel Registro).
Prima di ogni passo che cambia qualcosa online mostrami cosa farai e aspetta il mio «ok».

COSA VUOLE NANDO
Chiunque cerchi un guasto o un artigiano — dal sito anchecasa.it, dall'area privata da computer o dall'app sul telefono,
con qualsiasi profilo: privato, azienda, fornitore, rete e ADMIN compreso — deve finire nell'app SuperMastro con il procione
che fa il video di 5 secondi. Niente moduli da compilare, niente foto, niente allegati.

INDIRIZZI (usali sempre questi, scritti uguali)
- Ingresso con il procione:  https://supermastro.anchecasa.it/supermastro
- Video diretto:             https://supermastro.anchecasa.it/supermastro/video
- Video con il testo scritto: https://supermastro.anchecasa.it/supermastro/video?testo=<testo>
  (testo = quello che la persona ha scritto, più la città se c'è; massimo 300 caratteri; encodeURIComponent)
- Immagine del procione: https://supermastro.anchecasa.it/images/procione-1.png

REGOLE
1. Nessuna chiave, password o token in chat, nei file o nei commit.
2. Non toccare supermastro-sos (l'app SuperMastro è già fatta) né Supabase. Niente SQL in questo comando.
3. Non cancellare file: se un file non serve più si lascia dov'è (è irraggiungibile) oppure si sposta in _to_delete/.
4. dashboard/js/app.js è CONGELATO: le uniche modifiche ammesse sono quelle scritte qui sotto, e vanno annotate
   come nuova «Eccezione 12.10.2026 sera (Nando)» nel commento in cima al file, come le altre eccezioni.
5. SuperMastro si apre SEMPRE fuori dall'iframe (target="_top" o window.top.location): dentro l'iframe dell'app
   telefono la fotocamera non parte. Mai aprirlo dentro l'iframe /dashboard/?inapp=1.
6. Nei testi di SuperMastro non deve più comparire «foto»: solo «video di 5 secondi».
7. Annota ogni passo nel Registro di CLAUDE.md (data, ora, chi, cosa, file).

PASSO 0 — Controllo che l'app nuova sia online (senza questo non si fa niente)
- Se esiste supermastro-sos/pubblica-esito.txt con «FATTO», bene. Se manca o c'è «ERRORE», fermati e dimmelo:
  prima va lanciato PUBBLICA-SUPERMASTRO.bat (lo lancia Nando con doppio clic).
- Apri https://supermastro.anchecasa.it/supermastro/video a larghezza 390: deve rispondere 200 e mostrare il procione
  con «Apri la fotocamera». Se dà 404 o la pagina vecchia, fermati e dimmelo.

PARTE A — Sito anchecasa.it (cartella sito, progetto Vercel anchecasa-pulito)
A1. Collegamenti. In tutte le pagine sito/*.html (NON le cartelle _copie-*, NON magazine):
    - href="supermastro.html", href="supermastro.html#usa", href="supermastro.html#…"  → https://supermastro.anchecasa.it/supermastro
    - href="trova.html" (menu «Trova artigiano», card e piè di pagina)                    → https://supermastro.anchecasa.it/supermastro
    - Il pulsante arancio della home «Guasto in casa? SuperMastro…» (index.html, classe .sos) e il pulsante «SuperMastro»
      del riquadro scuro → https://supermastro.anchecasa.it/supermastro/video
    Fai la sostituzione con uno script che mostra prima l'elenco file e righe, poi la applica. Controlla con grep che
    in sito/*.html non resti nessun href verso supermastro.html o trova.html.
A2. Testi. index.html card «Trova l'artigiano in zona»: «Un video o una foto del lavoro…» diventa
    «Un video di 5 secondi del guasto: SuperMastro capisce cosa serve e trova gli artigiani più vicini.»
    Cerca in sito/*.html altre frasi su SuperMastro o Trova artigiano con «foto» e correggile allo stesso modo.
A3. Ricerca della home (sito/js/cerca-casa.js, riga ~90, oggi costruisce supermastro.html?p=…&q=…&c=…):
    deve aprire https://supermastro.anchecasa.it/supermastro/video?testo=<testo>
    - voce del dizionario scelta (scelto.id): testo = il nome della voce (vedi js/problemi.js, campo del nome mostrato)
    - testo libero (scelto.libero): testo = quello che ha scritto
    - se c'è la città: aggiungi « a <città>» in fondo. Taglia a 300 caratteri.
    Aggiorna il commento in cima al file. Cambia ?v= dello script in index.html (cache).
A4. sito/vercel.json: ci sono già (Claude, 17:10) /supermastro, /supermastro.html, /supermastro/:path* verso l'app.
    Aggiungi in cima, con lo stesso formato e "permanent": false:
      /trova       → https://supermastro.anchecasa.it/supermastro
      /trova.html  → https://supermastro.anchecasa.it/supermastro
A5. supermastro.html e trova.html restano nella cartella ma non sono più raggiungibili. Non toccarli.
A6. Prova in locale: dalla cartella sito, npx serve . -l 5600, larghezza 390 e 1280:
    index.html → menu «Per la casa» → «Trova artigiano» e «SuperMastro» aprono l'app; scrivi «perdita lavandino» e città
    «Caserta» nella ricerca, Cerca → apre /supermastro/video?testo=perdita%20lavandino%20a%20Caserta.
    (In locale i redirect di vercel.json non girano: provali dopo la pubblicazione.)

PARTE B — Area privata da computer (area-privata/dashboard)
B1. dashboard/js/profili-pulsanti.js, CATALOGO:
    - guasto.href → https://supermastro.anchecasa.it/supermastro/video
    - trova.href  → https://supermastro.anchecasa.it/supermastro
    - nome di «trova» resta «Trova un artigiano o un'impresa».
B2. dashboard/js/artigiani.js, viste V["pv-guasto"] e V["pv-trova"]: il modulo «Cosa è successo» (formGuasto) e la ricerca
    per provincia NON si mostrano più. Al loro posto una card SuperMastro uguale per tutte e due:
      - immagine del procione (indirizzo sopra), larga 160, alt vuoto;
      - titolo «Guasto in casa? Fammelo vedere.»; testo «Un video di 5 secondi con la voce. SuperMastro capisce cosa serve,
        ti dice se puoi farlo da solo e trova gli artigiani più vicini.»;
      - campo «Oppure scrivi cosa ti serve» (facoltativo) + pulsante arancio grande «Apri SuperMastro»:
        apre /supermastro/video?testo=<campo> se il campo è pieno, altrimenti /supermastro/video, con window.top.location
        (regola 5). Pulsante alto almeno 48px.
    Sotto resta la card «Le mie richieste» (elencoMiei) di pv-guasto, così le richieste vecchie si seguono ancora.
    Non cancellare formGuasto, collegaGuasto e cercaArtigiani: lasciali nel file, non più chiamati (servono alla vista
    dell'artigiano e dell'admin). Aggiorna sub di pv-guasto e pv-trova con una frase sola sul video di 5 secondi.
B3. Nuova vista V.supermastro in artigiani.js = la stessa card di B2 (riusa una funzione cardSuperMastro(el)).
B4. dashboard/js/app.js (CONGELATO, eccezione da annotare, regola 4): in navItems aggiungi la voce
      { id: "supermastro", label: "Cerca un artigiano", icon: "team" }
    per OGNI famiglia che non ha già pv-trova: azienda, fornitore, agente (vociRete, per tutti i livelli) e ADMIN
    (nella prima piega del menu admin, subito dopo Home e Software). Al privato non serve: pv-guasto e pv-trova fanno già questo.
    In «Pulsanti per profilo» (js/pulsanti-profili.js) la voce deve comparire per tutti i profili, accesa di base.
B5. Prova in locale: dalla cartella area-privata, npx serve . -l 5500, larghezza 1280 e 390:
      /dashboard/?demo=privato  → «Ho un guasto» e «Trova artigiano o impresa» mostrano il procione e aprono l'app
      /dashboard/?demo=azienda, ?demo=agente, ?demo=admin → c'è «Cerca un artigiano» e apre la stessa card.

PARTE C — App sul telefono per tutti i profili (area-privata/app/app.js)
C1. Nuova azione "sm" nella funzione azione(k): window.top.location.href = "https://supermastro.anchecasa.it/supermastro/video".
C2. PIU (il + arancio): come PRIMA voce per privato, azienda, agente e admin:
      ["sm", "Guasto o artigiano? SuperMastro", "Video di 5 secondi con il procione", "flash"]
    Nel privato togli d:pv-trova dal + (lo fa già SuperMastro) per restare entro 6 voci.
    In foglioPiu il filtro oggi lascia le voci senza «d:» solo a rete verificata e admin: fai passare sempre "sm",
    per tutti i profili, anche per la rete verificata (S.nativa) che oggi vede solo le 4 azioni native.
C3. Barra in basso del privato (PRIMA.privato): la voce «Guasto» resta, e la vista pv-guasto (B2) apre già SuperMastro.
C4. Prova: /app/?demo=privato | azienda | agente | admin a larghezza 390: il + mostra per primo
    «Guasto o artigiano? SuperMastro» e il tocco apre l'app SuperMastro nella stessa scheda, fuori dall'iframe.

PASSO FINALE — Pubblicazione (solo dopo il mio «ok», e solo se il PASSO 0 era a posto)
1. Sito: PUBBLICA-SITO-VERCEL.bat. Poi da telefono: anchecasa.it/supermastro, anchecasa.it/trova.html,
   menu «Trova artigiano», ricerca della home → tutti aprono il procione.
2. Area privata: come l'ultima volta (progetto Vercel area-privata-produzione, alias entra.anchecasa.it e
   areaprivata.anchecasa.it). Poi prova con il mio account admin: «Cerca un artigiano» e il + del telefono aprono il procione.
3. Commit con messaggio in italiano; push solo se te lo dico.
4. Scrivi nel Registro di CLAUDE.md cosa hai pubblicato, i deployment e le prove fatte.

QUANDO HAI FINITO dimmi in poche righe: cosa hai cambiato (file), cosa hai provato e con che esito, cosa resta.
