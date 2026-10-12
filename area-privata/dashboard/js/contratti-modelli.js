/* Testi dei contratti compilabili (11.10.2026).
   Un modello per ogni PDF di app_documenti.file. Il testo è quello del PDF in vigore, senza cambiamenti:
   cambiano solo intestazione e footer (vedi contratto-firma.js). I campi <input> sono quelli da compilare.
   Per un nuovo contratto: aggiungere qui il suo modello con la stessa chiave del campo file. */
(function () {
  const AC = (window.AC = window.AC || {});
  AC.contrattiModelli = AC.contrattiModelli || {};

  AC.contrattiModelli["docs/AncheCasa-3Contratto-Agente.pdf"] = {
    versione: "10.10.2026",
    etichetta: "Rete commerciale AncheCasa · Versione 10.10.2026",
    titolo: "Contratto di agenzia",
    sotto: "Agente · Rete commerciale AncheCasa",
    chiFirma: "L'Agente",
    nomeBreve: "Contratto Agente",
    approva: "Ai sensi e per gli effetti degli artt. 1341 e 1342 c.c. approvo specificamente le seguenti clausole: art. 2.3 (esclusione dell'esclusiva); art. 2.5 (divieto di rappresentanza); art. 3.2 (clienti affidati); art. 4.2 (maturazione all'incasso e restituzione); art. 4.6 (assenza di provvigioni sui privati); art. 7.3 (recesso per giusta causa); art. 8.4 (foro competente); Allegato C, artt. C.2–C.8 (linea, attribuzione dei clienti, iscrizioni dirette, clienti affidati, clienti privati, territorio, ruoli non presenti).",
    corpo: `
<div class="centro">TRA</div>
    <p>PALUMBO INVESTMENT S.R.L., con sede legale in Teano (CE), Via Giusti n. 22, CAP 81057, codice fiscale, partita IVA e numero di iscrizione al Registro delle Imprese di Caserta 04724830619, REA CE-349941, PEC palumboinvestment@pec.it, in persona dell'Amministratrice Unica e legale rappresentante pro tempore, sig.ra Federica Palumbo, titolare del marchio e della piattaforma “AncheCasa” (di seguito, la “Società” o “AncheCasa”);</p>

    <div class="centro">E</div>
    <div class="campi">
      <div class="campo lungo"><label for="cf-nome">Sig./Sig.ra ovvero ditta/società</label><input id="cf-nome" name="nome" autocomplete="name" required></div>
      <div class="campo"><label for="cf-luogo-n">nato/a a</label><input id="cf-luogo-n" name="luogo_nascita" required></div>
      <div class="campo"><label for="cf-data-n">il</label><input id="cf-data-n" name="data_nascita" type="date" required></div>
      <div class="campo lungo"><label for="cf-res">residenza / sede in</label><input id="cf-res" name="residenza" autocomplete="address-level2" required></div>
      <div class="campo"><label for="cf-via">via / n.</label><input id="cf-via" name="via" autocomplete="street-address" required></div>
      <div class="campo"><label for="cf-cf">codice fiscale</label><input id="cf-cf" name="cf" autocapitalize="characters" maxlength="16" required><small></small></div>
      <div class="campo"><label for="cf-piva">partita IVA</label><input id="cf-piva" name="piva" inputmode="numeric" maxlength="11" required><small></small></div>
      <div class="campo"><label for="cf-rea">iscrizione agenti di commercio, REA n.</label><input id="cf-rea" name="rea" required></div>
      <div class="campo"><label for="cf-cciaa">CCIAA di</label><input id="cf-cciaa" name="cciaa" required></div>
      <div class="campo"><label for="cf-ena">posizione Enasarco n.</label><input id="cf-ena" name="enasarco" inputmode="numeric"></div>
      <div class="campo"><label for="cf-tel">telefono</label><input id="cf-tel" name="telefono" type="tel" autocomplete="tel" required></div>
      <div class="campo"><label for="cf-pec">PEC</label><input id="cf-pec" name="pec" type="email" autocomplete="off"></div>
      <div class="campo"><label for="cf-mail">e-mail</label><input id="cf-mail" name="mail" type="email" autocomplete="email" required></div>
      <div class="campo"><label for="cf-iban">IBAN per i pagamenti</label><input id="cf-iban" name="iban" autocapitalize="characters" maxlength="34" required><small></small></div>
    </div>
    <p>agente di commercio regolarmente iscritto e titolare di partita IVA (di seguito, l'“Agente”; la Società e l'Agente, insieme, le “Parti”).</p>

    <div class="centro">PREMESSO CHE</div>
    <ol class="prem">
      <li>la Società, attraverso il marchio AncheCasa, gestisce una piattaforma dedicata ai servizi per la casa e per le imprese che mette in relazione privati, aziende, imprese e professionisti, offre, direttamente o tramite aziende partner, un catalogo di prodotti e servizi in continua espansione (software gestionali, servizi per la sicurezza e la formazione, utenze, servizi per la casa e per le imprese) e realizza, anche in qualità di general contractor, lavori di ristrutturazione tramite imprese partner selezionate;</li>
      <li>la Società ha costituito una rete commerciale articolata in un Responsabile Rete Italia, Responsabili Sviluppo Rete per le aree Nord, Centro e Sud e Isole, capi area regionali, agenti, sub-agenti e segnalatori, nella quale ogni ruolo riceve una quota fissa dei ricavi secondo regole uniformi;</li>
      <li>l'Agente esercita professionalmente l'attività di agente di commercio e intende promuovere i Servizi AncheCasa nella zona indicata all'art. 2.2, nell'ambito della rete coordinata dal capo area della regione;</li>
    </ol>
    <p>tutto ciò premesso, le Parti convengono e stipulano quanto segue.</p>

    <h2>ART. 1 – PREMESSE E ALLEGATI</h2>
    <p>1.1 Le premesse e gli allegati costituiscono parte integrante e sostanziale del presente contratto. Costituiscono allegati l'Allegato A – “Quote della rete”, l'Allegato B – “Servizi AncheCasa” e l'Allegato C – “Regole comuni della rete”.</p>

    <h2>ART. 2 – OGGETTO E ZONA</h2>
    <p>2.1 La Società conferisce all'Agente, che accetta, l'incarico di promuovere, in modo stabile, la conclusione di contratti aventi a oggetto i Servizi AncheCasa e i lavori realizzati dalla Società, ai sensi degli artt. 1742 e seguenti del codice civile.</p>
    <p>2.2 Zona. <input class="inline" id="cf-zona" name="zona" aria-label="Zona" placeholder="es. Caserta e provincia" required> (la “Zona”).</p>
    <p>2.3 Esclusiva. In deroga all'art. 1743 c.c., l'incarico non attribuisce all'Agente l'esclusiva di zona. La Società può operare nella Zona direttamente e tramite altri componenti della rete. L'Agente può operare per altri preponenti purché non concorrenti, previa comunicazione scritta alla Società. Possono essere acquisiti clienti in tutto il territorio nazionale: i clienti acquisiti fuori zona restano attribuiti secondo l'Allegato C.</p>
    <p>2.4 Servizi promuovibili. L'Agente promuove tutti i prodotti e servizi offerti da AncheCasa, propri o di aziende partner (i “Servizi AncheCasa”), elencati a titolo esemplificativo nell'Allegato B. L'incarico si estende automaticamente a ogni nuovo prodotto, servizio o software che la Società renderà disponibile in futuro, dal momento della sua pubblicazione nel listino o nella dashboard AncheCasa. La Società può modificare, sospendere o ritirare singoli Servizi senza che ciò costituisca modifica del presente contratto.</p>
    <p>2.5 L'Agente non ha potere di rappresentanza della Società, salvo procura scritta. È fatto divieto di sottoscrivere contratti, incassare somme, rilasciare quietanze, concedere sconti o assumere impegni in nome o per conto della Società. Prezzi, preventivi e condizioni contrattuali sono determinati esclusivamente dalla Società. I contratti con i clienti si intendono conclusi solo con l'accettazione scritta della Società.</p>

    <h2>ART. 3 – ATTIVITÀ DELL'AGENTE</h2>
    <p>3.1 L'Agente, in autonomia organizzativa e nel rispetto delle direttive commerciali generali della Società:</p>
    <ul class="el">
      <li data-l="a">promuove i Servizi AncheCasa, acquisisce clienti e segue le aziende e i privati a lui affidati;</li>
      <li data-l="b">per i lavori, effettua i sopralluoghi con il tecnico, raccoglie le richieste dei clienti e segue il cantiere fino al collaudo, partecipando all'approvazione degli stati di avanzamento;</li>
      <li data-l="c">registra ogni cliente e ogni attività nel sistema informatico AncheCasa prima di ogni ulteriore passaggio;</li>
      <li data-l="d">si coordina con il capo area della regione e rendiconta mensilmente i risultati.</li>
    </ul>
    <p>3.2 Clienti affidati. La Società può affidare all'Agente clienti acquisiti da altri componenti della rete, in particolare clienti della Zona seguiti fino a quel momento da altro capo area o agente. Per tali clienti all'Agente spettano le quote di chi chiude e di chi segue, mentre la quota di chi ha portato il cliente resta a quest'ultimo. Per i clienti della Società affidati all'Agente si applica l'art. C.5 dell'Allegato C.</p>
    <p>3.3 Sub-agenti. L'Agente può proporre alla Società sub-agenti e segnalatori che operano sotto di lui. Gli incarichi sono conferiti dalla Società con contratto separato. Sugli affari dei propri sub-agenti e segnalatori all'Agente spetta il 30% della quota di ruolo di questi ultimi, che trattengono il restante 70%, secondo l'Allegato A.</p>

    <h2>ART. 4 – PROVVIGIONI E COMPENSI</h2>
    <p>4.1 All'Agente spettano esclusivamente provvigioni commisurate ai risultati, determinate secondo l'Allegato A. Non sono previsti compensi fissi, rimborsi spese o anticipi, salvo diverso accordo scritto. Le percentuali dell'Allegato A restano invariate per tutta la durata del contratto.</p>
    <p>4.2 Maturazione. Il diritto alla provvigione matura esclusivamente sulle somme effettivamente incassate dalla Società per gli affari andati a buon fine. Per i cantieri la provvigione matura per tranche, in proporzione agli incassi: 30% alla firma del contratto con il cliente e all'incasso dell'acconto; 30% a metà dei lavori; 40% al collaudo. In caso di mancato pagamento, recesso, risoluzione o rimborso al cliente, la provvigione relativa non matura ovvero, se già corrisposta, è restituita o compensata con le provvigioni successive.</p>
    <p>4.3 Pagamento. Entro il giorno 10 di ciascun mese la Società trasmette l'estratto conto delle provvigioni maturate nel mese precedente, con l'indicazione degli affari e degli incassi a cui si riferiscono, e provvede al pagamento entro il giorno 20 mediante bonifico, dietro emissione di regolare fattura.</p>
    <p>4.4 Oneri. La Società versa i contributi Enasarco nella misura di legge, trattenendo la quota a carico dell'agente, e opera le ritenute previste dalla normativa fiscale. Il FIRR e le indennità di fine rapporto spettano nei casi e nei limiti previsti dalla legge e dagli Accordi Economici Collettivi, ove applicabili.</p>
    <p>4.5 Base di calcolo. Le quote sono calcolate sull'utile della Società, determinato secondo la sezione A.3 dell'Allegato A. L'estratto conto riporta, per ciascun affare, la base di calcolo e la provvigione spettante; la Società non è tenuta a comunicare i singoli costi né i prezzi delle imprese e dei fornitori.</p>
    <p>4.6 Clienti privati. Sull'iscrizione dei clienti privati e sui Servizi da essi acquistati non è prevista alcuna provvigione: le provvigioni spettano solo sui lavori, secondo la sezione A.2 dell'Allegato A e l'art. C.6 dell'Allegato C.</p>

    <h2>ART. 5 – RISERVATEZZA, DATI PERSONALI E MARCHIO</h2>
    <p>5.1 L'Agente si obbliga a mantenere strettamente riservate tutte le informazioni della Società di cui venga a conoscenza (a titolo esemplificativo: clienti, imprese partner, prezzi, margini, provvigioni, software, strategie commerciali) e a non utilizzarle per fini diversi dall'incarico. L'obbligo permane per tre (3) anni dalla cessazione del contratto.</p>
    <p>5.2 L'Agente tratta i dati personali dei clienti esclusivamente per l'esecuzione dell'incarico, quale soggetto autorizzato o responsabile del trattamento designato dalla Società ai sensi del Regolamento (UE) 2016/679 e del D.Lgs. 196/2003, attenendosi alle istruzioni ricevute. I dati sono inseriti esclusivamente nel sistema AncheCasa e non possono essere conservati in archivi personali. I clienti acquisiti restano clienti della Società.</p>
    <p>5.3 Il marchio AncheCasa, i materiali e il kit restano di proprietà esclusiva della Società. Alla cessazione del contratto sono restituiti entro sette (7) giorni e ne cessa ogni utilizzo.</p>
    <p>5.4 L'Agente presenta la Società in modo veritiero e corretto e non promette prezzi, tempi o condizioni non approvati dalla Società.</p>

    <h2>ART. 6 – CONCORRENZA</h2>
    <p>6.1 Per la durata del contratto l'Agente non promuove, direttamente o indirettamente, servizi in concorrenza con quelli della Società senza il suo consenso scritto.</p>
    <p>6.2 L'Agente non può sviare a favore proprio o di terzi i clienti, le imprese partner e i componenti della rete. Eventuali obblighi di non concorrenza successivi alla cessazione sono validi solo se pattuiti per iscritto nei limiti e con l'indennità previsti dall'art. 1751-bis c.c.</p>

    <h2>ART. 7 – DURATA E RECESSO</h2>
    <p>7.1 Il contratto è a tempo indeterminato e decorre dalla data di sottoscrizione. I primi sei (6) mesi costituiscono periodo di prova, durante il quale ciascuna Parte può recedere con preavviso di quindici (15) giorni.</p>
    <p>7.2 Superato il periodo di prova, ciascuna Parte può recedere con il preavviso previsto dall'art. 1750 c.c. e, ove applicabili, dagli Accordi Economici Collettivi, comunicato a mezzo PEC o raccomandata.</p>
    <p>7.3 Ciascuna Parte può recedere senza preavviso per giusta causa. Costituiscono in ogni caso giusta causa la violazione degli artt. 2.5, 5 e 6 e le condotte lesive dell'immagine della Società.</p>
    <p>7.4 Alla cessazione: (i) sono corrisposte le provvigioni sugli affari conclusi prima della cessazione, anche se incassati successivamente, secondo le regole dell'art. 4; (ii) i clienti restano della Società e sono affidati alla rete della Zona; (iii) i sub-agenti dell'Agente sono assegnati dalla Società ad altro agente; (iv) spettano le indennità di legge nei casi previsti.</p>

    <h2>ART. 8 – DISPOSIZIONI FINALI</h2>
    <p>8.1 Ogni modifica al presente contratto richiede la forma scritta a pena di nullità.</p>
    <p>8.2 Il contratto non può essere ceduto senza il consenso scritto della Società.</p>
    <p>8.3 L'eventuale invalidità di una clausola non comporta l'invalidità delle restanti.</p>
    <p>8.4 Per quanto non espressamente previsto si applicano le disposizioni del codice civile in materia di contratto di agenzia (artt. 1742–1753 c.c.) e, ove applicabili, gli Accordi Economici Collettivi. Per ogni controversia relativa al presente contratto è competente in via esclusiva il Foro di Santa Maria Capua Vetere, salvo i casi di competenza inderogabile previsti dalla legge.</p>

    <h2>ALLEGATO A – QUOTE DELLA RETE</h2>
    <p>Spettanze dell'Agente. Le quote sono espresse in percentuale della quota destinata alla rete.</p>
    <p>A.1 Rendite (tutti i Servizi AncheCasa delle sezioni B.1–B.6 e B.8 dell'Allegato B, propri o di aziende partner, presenti e futuri). Alla rete è destinato il 35% dell'utile della Società su ciascun servizio, in misura fissa per tutta la durata del rapporto, compresi i rinnovi degli abbonamenti, ripartito come segue. L'utile è calcolato come indicato alla sezione A.3.</p>
    <div class="tab"><table>
      <thead><tr><th>Ruolo</th><th>Quota della rete</th><th>Spettanza</th></tr></thead>
      <tbody>
        <tr><td>Chi porta il cliente</td><td>70%</td><td>Sui clienti acquisiti personalmente; sui clienti dei propri sub-agenti, il 30% della loro quota</td></tr>
        <tr><td>Sviluppo rete</td><td>17%</td><td>Non spettante (Responsabile Sviluppo Rete)</td></tr>
        <tr><td>Capo area</td><td>8%</td><td>Non spettante (capo area della regione)</td></tr>
        <tr><td>Responsabile Rete Italia</td><td>5%</td><td>Non spettante (Responsabile Rete Italia)</td></tr>
      </tbody></table></div>
    <p>Cliente segnalato da un terzo: a chi chiude il 45% e a chi segnala il 25% della quota della rete.</p>
    <p>A.2 Cantieri e subappalti. Alla rete è destinato il 40% dell'utile di ciascun cantiere ovvero, nei subappalti, della quota spettante alla Società, calcolati come indicato alla sezione A.3, ripartito come segue.</p>
    <div class="tab"><table>
      <thead><tr><th>Ruolo</th><th>Quota della rete</th><th>Spettanza</th></tr></thead>
      <tbody>
        <tr><td>Chi segnala</td><td>10%</td><td>Se ha acquisito il cliente</td></tr>
        <tr><td>Chi chiude</td><td>25%</td><td>Se chiude personalmente</td></tr>
        <tr><td>Chi segue il cantiere</td><td>30%</td><td>Se segue personalmente</td></tr>
        <tr><td>Chi ha portato l'impresa</td><td>10%</td><td>Se ha portato l'impresa</td></tr>
        <tr><td>Sviluppo rete</td><td>12%</td><td>Non spettante (Responsabile Sviluppo Rete)</td></tr>
        <tr><td>Capo area</td><td>8%</td><td>Non spettante (capo area della regione)</td></tr>
        <tr><td>Responsabile Rete Italia</td><td>5%</td><td>Non spettante (Responsabile Rete Italia)</td></tr>
      </tbody></table></div>
    <p>A.3 Come si calcola l'utile. (a) Software (abbonamenti e moduli delle app AncheCasa, commissioni per lavoro, sponsorizzazioni): importo incassato al netto dell'IVA, meno le commissioni di pagamento sostenute, meno una quota fissa per i costi del software (sviluppo, server, assistenza) pari al 25% dell'importo incassato al netto dell'IVA. (b) Tutti gli altri servizi (luce e gas, telefonia, fornitori, finanza e assicurazioni, servizi per la casa e ogni altro servizio presente o futuro): compenso incassato dalla Società al netto dell'IVA, meno una quota fissa per i costi di gestione pari al 15% del compenso incassato al netto dell'IVA. (c) Cantieri: importo incassato dal cliente al netto dell'IVA, meno i costi diretti del cantiere (imprese e subappalti, materiali e forniture, oneri della sicurezza, spese tecniche e pratiche); le spese generali della Società non si sottraggono. Nei subappalti l'utile è la quota spettante alla Società, al netto dell'IVA. Le quote del 25% e del 15% restano invariate per tutta la durata del contratto, salvo accordo scritto.</p>
    <p class="fine">Le quote si applicano nei limiti delle regole di maturazione (incasso e tranche). L'utile è determinato secondo la sezione A.3.</p>
    <p class="fine">Quote in vigore dal 9 ottobre 2026, con l'introduzione del Responsabile Rete Italia: rendite 70% chi porta il cliente, 17% sviluppo rete, 8% capo area, 5% Responsabile Rete Italia; cantieri 10% chi segnala, 25% chi chiude, 30% chi segue, 10% chi ha portato l'impresa, 12% sviluppo rete, 8% capo area, 5% Responsabile Rete Italia. Calcolo dell'utile (sezione A.3) in vigore dal 12 ottobre 2026.</p>

    <h2>ALLEGATO B – SERVIZI ANCHECASA</h2>
    <p>Sono Servizi AncheCasa tutti i prodotti e servizi offerti dalla Società, direttamente o tramite aziende partner, presenti e futuri. L'elenco che segue è esemplificativo e non esaustivo; il listino aggiornato è sempre consultabile nella dashboard AncheCasa.</p>
    <div class="tab"><table>
      <thead><tr><th>Area</th><th>Prodotti e servizi</th></tr></thead>
      <tbody>
        <tr><td>B.1 Software gestionali per aziende</td><td>Pacchetto Ufficio (amministrazione, sicurezza, documenti, clienti, preventivi, fatture, recruitment, acquisti, fornitori) e moduli per mestiere: imprese edili e general contractor (gestione cantiere, presenze, rapportini, giornali, SAL, cronoprogramma, magazzino, mezzi, app di campo, analisi e partecipazione a gare); professionisti tecnici; artigiani e installatori (incluso SuperMastro); fornitori di materiali e mezzi, per vendita e noleggio.</td></tr>
        <tr><td>B.2 Sicurezza sul lavoro e formazione</td><td>Corsi obbligatori per lavoratori, preposti, dirigenti, RLS, datori di lavoro RSPP, RSPP e ASPP; antincendio; primo soccorso e BLSD; abilitazioni per attrezzature (carrelli, PLE, ponteggi, escavatori, gru); HACCP; GDPR; documenti e adempimenti per uffici, sedi e cantieri; gestione della sicurezza in appalto, anche tramite aziende partner.</td></tr>
        <tr><td>B.3 Utenze</td><td>Energia elettrica, gas e altre utenze per privati e imprese, tramite fornitori partner.</td></tr>
        <tr><td>B.4 Piattaforma e visibilità</td><td>Iscrizioni e abbonamenti alla piattaforma, profili aziendali, vetrine, pubblicazione di annunci e richieste, opportunità e aste immobiliari, strumenti di comunicazione con i clienti.</td></tr>
        <tr><td>B.5 Servizi per la casa e per le imprese</td><td>Manutenzioni, impianti, pulizie, traslochi e ogni altro servizio offerto tramite imprese, artigiani e professionisti iscritti ad AncheCasa.</td></tr>
        <tr><td>B.6 Servizi di aziende partner</td><td>Ogni prodotto o servizio di aziende convenzionate con AncheCasa, anche se commercializzato con marchio diverso.</td></tr>
        <tr><td>B.7 Lavori e cantieri</td><td>Bagni, ristrutturazioni e lavori edili realizzati da AncheCasa come general contractor; appalti e subappalti con imprese partner. Per questa area si applica la sezione A.2 dell'Allegato A.</td></tr>
        <tr><td>B.8 Nuovi servizi</td><td>Ogni nuovo prodotto, servizio o software introdotto dalla Società dopo la firma, dalla data di pubblicazione nel listino o nella dashboard AncheCasa.</td></tr>
      </tbody></table></div>
    <p class="fine">I prezzi e le condizioni di ciascun Servizio sono stabiliti esclusivamente dalla Società e possono variare nel tempo.</p>

    <h2>ALLEGATO C – REGOLE COMUNI DELLA RETE</h2>
    <p>Regole uguali per tutti i componenti della rete AncheCasa, in vigore dal 10 ottobre 2026. In caso di contrasto con il contratto prevalgono, per le materie qui regolate, le presenti regole.</p>
    <p>C.1 Ingresso nella rete. Si entra nella rete solo con proposta approvata dalla Società e dal Responsabile Rete Italia e, ove nominato, dal Responsabile Sviluppo Rete dell'area interessata. Ogni componente della rete può proporre nuove persone; gli incarichi sono conferiti esclusivamente dalla Società.</p>
    <p>C.2 Chi porta, tiene. Ogni persona che entra nella rete fa parte della linea di chi l'ha proposta, in qualunque regione operi. Le quote di linea dell'Allegato A (chi porta il cliente e, per i ruoli presenti nella linea, sviluppo rete e capo area) seguono la linea di chi ha acquisito il cliente, indipendentemente dalla regione in cui il cliente si trova. Per ciascun affare ogni quota di ruolo è riconosciuta una sola volta.</p>
    <p>C.3 Attribuzione dei clienti. Il cliente è attribuito a chi lo registra per primo nel sistema AncheCasa; fanno fede la data e l'ora registrate dal sistema. Le aziende sono identificate dalla partita IVA, i privati dal recapito telefonico o di posta elettronica. L'attribuzione permane finché il cliente resta attivo. Se un cliente è segnalato da un componente della rete e acquisito da un altro, si applica la ripartizione dell'Allegato A (45% a chi chiude, 25% a chi segnala).</p>
    <p>C.4 Iscrizioni dirette. L'azienda o l'artigiano che si iscrive direttamente alla piattaforma è attribuito: (a) al componente della rete di cui indica il codice al momento dell'iscrizione; (b) in mancanza, al componente che ne aveva registrato la partita IVA nei novanta (90) giorni precedenti; (c) in mancanza di entrambi, è cliente della Società ai sensi dell'art. C.5.</p>
    <p>C.5 Clienti della Società affidati. I clienti acquisiti direttamente dalla Società, anche tramite i suoi amministratori o il sito internet, possono essere affidati dalla Società a un componente della rete perché li segua. All'affidatario spetta il 50% della quota “chi porta il cliente” sui Servizi acquistati dal cliente affidato; su tali clienti non spettano le quote di sviluppo rete, capo area e Responsabile Rete Italia, che restano alla Società. Sui Servizi e sui lavori ulteriori procurati personalmente dall'affidatario spettano le quote ordinarie. L'affidatario contatta il cliente entro quarantotto (48) ore dall'affidamento; in mancanza la Società può affidarlo ad altri. Gli artigiani iscritti direttamente sono affidati solo dopo la verifica della Società.</p>
    <p>C.6 Clienti privati. Sull'iscrizione dei clienti privati e sui Servizi da essi acquistati non spetta alcuna provvigione. Le provvigioni sui privati spettano solo sui lavori, secondo la sezione A.2 dell'Allegato A. Il privato registrato da un componente della rete resta a lui collegato per dodici (12) mesi, che decorrono nuovamente da ogni contatto registrato nel sistema AncheCasa: se in tale periodo il privato commissiona un lavoro, anche contattando direttamente la Società, a quel componente spetta la quota “chi segnala”. Per i privati giunti direttamente alla Società la quota “chi segnala” resta alla Società.</p>
    <p>C.7 Territorio. Aree e regioni sono assegnate in base ai risultati registrati nel sistema AncheCasa, quando la Società, sentito il Responsabile Rete Italia, ritiene che i risultati lo consentano. Il capo area di una regione è di norma nominato quando nella regione operano almeno cinque (5) agenti attivi, ed è scelto tra chi vi ha costruito di più (persone attive e clienti attivi); lo stesso criterio vale per l'assegnazione delle aree ai Responsabili Sviluppo Rete. Con la nomina, il responsabile matura la propria quota di ruolo sugli affari della regione o dell'area acquisiti da componenti che non hanno un responsabile dello stesso ruolo nella propria linea, affianca sul posto la rete che vi opera e non toglie quote di linea già esistenti.</p>
    <p>C.8 Ruoli non presenti. Quando in una linea manca un ruolo e nessun responsabile territoriale ne ha diritto ai sensi dell'art. C.7, la relativa quota resta alla Società, salvo la quota del Responsabile Rete Italia prevista dal suo contratto.</p>
    <p>C.9 Trasparenza e obiettivi. Ogni componente della rete vede nel sistema AncheCasa i propri clienti, la propria linea, le provvigioni maturate e gli obiettivi. Gli obiettivi sono indicati dalla Società e dal Responsabile Rete Italia e hanno valore indicativo. Le linee decise dalla Società, anche nella sala strategia del sistema AncheCasa, costituiscono direttive commerciali generali.</p>
    <p>C.10 Documenti e firma nell'app. Le Parti convengono che contratti, circolari, regolamenti e loro modifiche possano essere sottoscritti anche con firma elettronica nel sistema AncheCasa, che registra l'identità dell'utente, la data, l'ora e il testo firmato; la Società mette a disposizione del firmatario copia del documento firmato. Le modifiche che riducono i diritti del componente della rete richiedono sempre il suo consenso espresso.</p>
`
  };

  AC.contrattiModelli["docs/AncheCasa-1Contratto-Assistente-Sviluppo-Rete.pdf"] = {
    versione: "10.10.2026",
    etichetta: "Rete commerciale AncheCasa · Versione 10.10.2026",
    titolo: "Contratto di collaborazione autonoma occasionale",
    sotto: "Incarico di Assistente Sviluppo Rete · Rete commerciale AncheCasa",
    chiFirma: "Il Collaboratore",
    nomeBreve: "Contratto Sviluppo rete",
    approva: "Ai sensi e per gli effetti degli artt. 1341 e 1342 c.c. approvo specificamente le seguenti clausole: art. 2.5 (divieto di rappresentanza); art. 4.5 (cessazione dei diritti sui clienti di altre aree); art. 5.3 (maturazione all'incasso e restituzione); artt. 6.2, 6.3 e 6.6 (limite dei pagamenti, compensi sospesi, sospensione e recesso); art. 8 (non concorrenza e non sollecitazione); art. 9.3 (recesso immediato); art. 10.4 (foro competente); Allegato C, artt. C.2–C.8 (linea, attribuzione dei clienti, iscrizioni dirette, clienti affidati, clienti privati, territorio, ruoli non presenti).",
    corpo: `
<div class="centro">TRA</div>
    <p>PALUMBO INVESTMENT S.R.L., con sede legale in Teano (CE), Via Giusti n. 22, CAP 81057, codice fiscale, partita IVA e numero di iscrizione al Registro delle Imprese di Caserta 04724830619, REA CE-349941, PEC palumboinvestment@pec.it, in persona dell'Amministratrice Unica e legale rappresentante pro tempore, sig.ra Federica Palumbo, titolare del marchio e della piattaforma “AncheCasa” (di seguito, la “Società” o “AncheCasa”);</p>

    <div class="centro">E</div>
<div class="centro">E</div>
<div class="campi">
      <div class="campo lungo"><label for="cf-nome">Sig./Sig.ra</label><input id="cf-nome" name="nome" autocomplete="name" required></div>
      <div class="campo"><label for="cf-luogo_nascita">nato/a a</label><input id="cf-luogo_nascita" name="luogo_nascita" required></div>
      <div class="campo"><label for="cf-data_nascita">il</label><input id="cf-data_nascita" name="data_nascita" type="date" required></div>
      <div class="campo lungo"><label for="cf-residenza">residente in</label><input id="cf-residenza" name="residenza" required></div>
      <div class="campo"><label for="cf-via">via / n.</label><input id="cf-via" name="via" required></div>
      <div class="campo"><label for="cf-cf">codice fiscale</label><input id="cf-cf" name="cf" autocapitalize="characters" maxlength="16" required><small></small></div>
      <div class="campo"><label for="cf-documento">documento n.</label><input id="cf-documento" name="documento" required></div>
      <div class="campo"><label for="cf-telefono">telefono</label><input id="cf-telefono" name="telefono" type="tel" autocomplete="tel" required></div>
      <div class="campo"><label for="cf-mail">e-mail</label><input id="cf-mail" name="mail" type="email" autocomplete="email" required><small></small></div>
      <div class="campo"><label for="cf-iban">IBAN per i pagamenti</label><input id="cf-iban" name="iban" autocapitalize="characters" maxlength="34" required><small></small></div>
    </div>
<p>non titolare di partita IVA (di seguito, il “Collaboratore”; la Società e il Collaboratore, insieme, le “Parti”).</p>
<div class="centro">PREMESSO CHE</div>
<ul class="el">
  <li data-l="a">la Società, attraverso il marchio AncheCasa, gestisce una piattaforma dedicata ai servizi per la casa che mette in relazione privati, aziende, imprese e professionisti, offre, direttamente o tramite aziende partner, un catalogo di prodotti e servizi in continua espansione (software gestionali, servizi per la sicurezza e la formazione, utenze, servizi per la casa e per le imprese) e realizza, anche in qualità di general contractor, lavori di ristrutturazione tramite imprese partner selezionate;</li>
  <li data-l="b">la Società sta costituendo una rete commerciale articolata in Responsabile Rete Italia, sviluppo rete, capi area, agenti, sub-agenti e segnalatori;</li>
  <li data-l="c">la Società intende affidare lo sviluppo della rete a più collaboratori, i quali operano sull'intero territorio nazionale e assumeranno la responsabilità delle aree geografiche quando i risultati registrati lo consentiranno, secondo i criteri del presente contratto e dell'Allegato C;</li>
  <li data-l="d">il Collaboratore, privo di partita IVA, intende partecipare alla fase di avvio in piena autonomia e senza vincolo di subordinazione, ed è consapevole dell'obbligo di avviare un'attività in forma professionale o societaria al verificarsi delle condizioni di cui all'art. 6;</li>
</ul>
<p>tutto ciò premesso, le Parti convengono e stipulano quanto segue.</p>
<h2>ART. 1 – PREMESSE E ALLEGATI</h2>
<p>1.1 Le premesse e gli allegati costituiscono parte integrante e sostanziale del presente contratto. Costituiscono allegati l'Allegato A – “Quote della rete”, l'Allegato B – “Servizi AncheCasa” e l'Allegato C – “Regole comuni della rete”.</p>
<h2>ART. 2 – OGGETTO E NATURA DELL'INCARICO</h2>
<p>2.1 La Società conferisce al Collaboratore, che accetta, l'incarico di Assistente Sviluppo Rete, consistente nella promozione del marchio AncheCasa e nella segnalazione e acquisizione di nuovi clienti (aziende, imprese, professionisti e privati) sul territorio nazionale, secondo quanto previsto dall'art. 3.</p>
<p>2.2 Servizi promuovibili. Il Collaboratore può promuovere tutti i prodotti e servizi offerti da AncheCasa, propri o di aziende partner (i “Servizi AncheCasa”), elencati a titolo esemplificativo nell'Allegato B. L'incarico si estende automaticamente a ogni nuovo prodotto, servizio o software che la Società renderà disponibile in futuro, dal momento della sua pubblicazione nel listino o nella dashboard AncheCasa. La Società può modificare, sospendere o ritirare singoli Servizi senza che ciò costituisca modifica del presente contratto.</p>
<p>2.3 Il rapporto è regolato dagli artt. 2222 e seguenti del codice civile e si configura come prestazione di lavoro autonomo occasionale. Il Collaboratore esegue l'incarico con lavoro prevalentemente proprio, in piena autonomia organizzativa e operativa, determinando liberamente tempi, modalità e luoghi della prestazione, senza vincoli di orario o di presenza e con l'impiego di mezzi propri.</p>
<p>2.4 Il presente contratto non costituisce rapporto di lavoro subordinato, di collaborazione coordinata e continuativa, di agenzia o di società, né attribuisce al Collaboratore alcuna esclusiva di zona.</p>
<p>2.5 Il Collaboratore non ha potere di rappresentanza della Società. È fatto divieto al Collaboratore di sottoscrivere contratti, incassare somme, rilasciare quietanze, concedere sconti o assumere impegni di qualsiasi natura in nome o per conto della Società. Prezzi, preventivi e condizioni contrattuali sono determinati esclusivamente dalla Società.</p>
<p>2.6 La Società provvede agli adempimenti di legge connessi al conferimento dell'incarico, ivi inclusa, ove dovuta, la comunicazione preventiva all'Ispettorato Territoriale del Lavoro.</p>
<h2>ART. 3 – ATTIVITÀ DEL COLLABORATORE</h2>
<p>3.1 Nell'esecuzione dell'incarico il Collaboratore:</p>
<ul class="el">
  <li data-l="a">presenta la Società e i suoi servizi e individua potenziali clienti;</li>
  <li data-l="b">registra ciascun nuovo cliente nel sistema informatico AncheCasa, indicandone la data e l'area geografica, prima di ogni ulteriore attività;</li>
  <li data-l="c">affianca, ove richiesto, capi area, agenti e sub-agenti della rete;</li>
  <li data-l="d">può effettuare, d'intesa con la Società, verifiche su cantieri e preventivi.</li>
</ul>
<p>3.2 Gestione dei clienti. I clienti acquisiti sono gestiti dalla rete degli agenti della Società. Nelle regioni diverse dal Lazio, fino all'individuazione e alla contrattualizzazione di un agente locale, i clienti sono seguiti dal capo area Lazio, direttamente o tramite un proprio agente, unitamente allo sviluppo rete. La decisione di individuare un agente in una regione è assunta congiuntamente dal capo area Lazio e dallo sviluppo rete, con l'approvazione della Società. Dalla contrattualizzazione dell'agente locale, i clienti di quella regione passano al medesimo.</p>
<p>3.3 Rendicontazione. Il Collaboratore rendiconta i risultati conseguiti (clienti contattati, registrati e acquisiti) con cadenza giornaliera, settimanale e mensile, anche mediante la dashboard AncheCasa. La rendicontazione ha la sola funzione di misurare i risultati e non comporta alcun controllo su orari o modalità della prestazione.</p>
<p>3.4 Il Collaboratore utilizza il marchio, i materiali e il kit AncheCasa esclusivamente per l'esecuzione dell'incarico e in conformità alle indicazioni d'immagine della Società.</p>
<h2>ART. 4 – PERIODO DI AVVIO E ASSEGNAZIONE DELLE AREE</h2>
<p>4.1 Periodo di avvio. Fino all'assegnazione delle aree di cui all'art. 4.3 (il “Periodo di avvio”), i collaboratori incaricati dello sviluppo rete operano sull'intero territorio nazionale. Ogni cliente è attribuito a chi lo ha registrato per primo nel sistema AncheCasa, secondo l'Allegato C.</p>
<p>4.2 Aree geografiche. Ai fini del presente contratto il territorio nazionale è suddiviso nelle seguenti aree:</p>
<div class="tab"><table>
      <thead><tr><th>Area</th><th>Regioni</th></tr></thead>
      <tbody>
        <tr><td>Nord</td><td>Piemonte, Valle d'Aosta, Liguria, Lombardia, Trentino-Alto Adige, Veneto, Friuli-Venezia Giulia, Emilia-Romagna</td></tr>
        <tr><td>Centro</td><td>Toscana, Umbria, Marche, Lazio</td></tr>
        <tr><td>Sud e Isole</td><td>Abruzzo, Molise, Campania, Puglia, Basilicata, Calabria, Sicilia, Sardegna</td></tr>
      </tbody></table></div>
<p>4.3 Assegnazione. Le aree sono assegnate quando la Società, sentito il Responsabile Rete Italia, ritiene che i risultati registrati nel sistema AncheCasa lo consentano. In ciascuna area è nominato Responsabile Sviluppo Rete il collaboratore che vi ha costruito di più, considerando le persone attive della propria linea e i clienti attivi. La Società comunica l'assegnazione per iscritto, anche tramite il sistema AncheCasa, e può suddividere ulteriormente le aree.</p>
<p>4.4 Casi particolari. Qualora il medesimo collaboratore risulti primo in più aree, gli è assegnata l'area in cui ha acquisito il maggior numero di clienti e l'altra area è assegnata al collaboratore che segue in graduatoria per quell'area. In caso di parità prevale il collaboratore che ha generato il maggior importo incassato dalla Società nell'area; in caso di ulteriore parità decide la Società.</p>
<p>4.5 Effetti dell'assegnazione. Con l'assegnazione il Responsabile Sviluppo Rete matura la quota “sviluppo rete” anche sugli affari dell'area acquisiti da componenti della rete che non hanno un Responsabile Sviluppo Rete nella propria linea, e affianca sul posto la rete che vi opera. Ciascun collaboratore conserva le quote di linea sui clienti e sulle persone acquisiti in qualsiasi area, ai sensi dell'art. C.2 dell'Allegato C.</p>
<p>4.6 Il Responsabile Sviluppo Rete coordina i capi area, gli agenti e i sub-agenti della propria area e ne cura lo sviluppo, nel rispetto delle direttive commerciali generali della Società. Il Responsabile Sviluppo Rete risponde alla Società ed è coordinato dal Responsabile Rete Italia.</p>
<h2>ART. 5 – COMPENSI</h2>
<p>5.1 Al Collaboratore spettano esclusivamente compensi variabili commisurati ai risultati, determinati secondo l'Allegato A. Non sono previsti compensi fissi, rimborsi spese o anticipi, salvo diverso accordo scritto.</p>
<p>5.2 Il Collaboratore matura i compensi sui clienti da lui personalmente acquisiti e la quota “sviluppo rete” sugli affari della propria linea (le persone da lui proposte e le loro squadre), in qualsiasi area. Dall'assegnazione di cui all'art. 4 matura altresì quanto previsto dall'art. 4.5. Le percentuali dell'Allegato A restano invariate per tutta la durata del contratto.</p>
<p>5.3 Maturazione. Il diritto al compenso matura esclusivamente sulle somme effettivamente incassate dalla Società. Per i cantieri il compenso matura per tranche, in proporzione agli incassi: 30% alla firma del contratto con il cliente e all'incasso dell'acconto; 30% a metà dei lavori; 40% al collaudo. In caso di mancato pagamento, recesso, risoluzione o rimborso al cliente, il compenso relativo non matura ovvero, se già corrisposto, è restituito o compensato con i compensi successivi.</p>
<p>5.4 Pagamento. Entro il giorno 10 di ciascun mese la Società trasmette al Collaboratore il prospetto dei compensi maturati nel mese precedente e provvede al pagamento entro il giorno 20 mediante bonifico, dietro emissione di ricevuta per prestazione occasionale, nei limiti dell'art. 6.</p>
<p>5.5 Ritenuta. Sui compensi la Società opera, in qualità di sostituto d'imposta, la ritenuta d'acconto nella misura di legge (attualmente 20%) e ne cura il versamento.</p>
<p>5.6 Base di calcolo. Le quote sono calcolate sull'utile della Società, determinato secondo la sezione A.3 dell'Allegato A. Il prospetto riporta, per ciascun affare, la base di calcolo e il compenso spettante; la Società non è tenuta a comunicare i singoli costi né i prezzi delle imprese e dei fornitori.</p>
<p>5.7 Clienti privati. Sull'iscrizione dei clienti privati e sui Servizi da essi acquistati non è prevista alcuna provvigione: i compensi spettano solo sui lavori, secondo la sezione A.2 dell'Allegato A e l'art. C.6 dell'Allegato C.</p>
<p>5.8 Clienti della Società affidati. Per i clienti della Società affidati al Collaboratore si applica l'art. C.5 dell'Allegato C.</p>
<h2>ART. 6 – LIMITE DEI PAGAMENTI OCCASIONALI E AVVIO DELL'ATTIVITÀ PROFESSIONALE</h2>
<p>6.1 Il presente contratto disciplina la sola fase iniziale della collaborazione, in regime di lavoro autonomo occasionale.</p>
<p>6.2 Limite dei pagamenti. In regime occasionale la Società corrisponde al Collaboratore compensi fino a un massimo di € 5.000,00 (cinquemila/00) lordi complessivi.</p>
<p>6.3 Compensi sospesi. I compensi maturati oltre € 5.000,00 lordi restano regolarmente maturati e sono indicati nel prospetto mensile come “compensi sospesi”, ma non sono pagati finché il Collaboratore non abbia: (i) aperto una propria partita IVA, costituito una società ovvero ottenuto l'iscrizione richiesta per l'attività di agente o procacciatore d'affari; e (ii) sottoscritto con la Società il nuovo contratto di cui all'art. 6.5. I compensi sospesi sono corrisposti entro trenta (30) giorni dal verificarsi di entrambe le condizioni, dietro emissione di regolare fattura, e non producono interessi.</p>
<p>6.4 Obbligo di regolarizzazione. Il Collaboratore si obbliga a provvedere a quanto previsto dall'art. 6.3 (i) entro trenta (30) giorni dal raggiungimento di € 12.000,00 (dodicimila/00) lordi di compensi complessivamente maturati, ovvero entro trenta (30) giorni dalla richiesta scritta della Società, se anteriore.</p>
<p>6.5 Al verificarsi della regolarizzazione le Parti stipulano un nuovo contratto, nella forma ritenuta idonea (procacciamento d'affari, agenzia o altra), che conserva l'area assegnata e le quote dell'Allegato A.</p>
<p>6.6 Qualora il Collaboratore non adempia nel termine dell'art. 6.4, la Società può sospendere l'attribuzione di nuovi clienti e recedere dal contratto ai sensi dell'art. 9.3. Restano dovuti i compensi maturati, ma quelli sospesi sono corrisposti solo alle condizioni dell'art. 6.3.</p>
<p>6.7 Le Parti danno atto che l'eventuale futura assunzione del Collaboratore con contratto di lavoro subordinato comporterebbe l'applicazione della sola retribuzione prevista da tale contratto, in sostituzione delle quote di cui all'Allegato A.</p>
<h2>ART. 7 – RISERVATEZZA, DATI PERSONALI E MARCHIO</h2>
<p>7.1 Il Collaboratore si obbliga a mantenere strettamente riservate tutte le informazioni della Società di cui venga a conoscenza (a titolo esemplificativo: clienti, imprese partner, prezzi, margini, provvigioni, software, strategie commerciali) e a non utilizzarle per fini diversi dall'incarico. L'obbligo permane per tre (3) anni dalla cessazione del contratto.</p>
<p>7.2 Il Collaboratore tratta i dati personali dei clienti esclusivamente per l'esecuzione dell'incarico, quale soggetto autorizzato dalla Società ai sensi del Regolamento (UE) 2016/679 e del D.Lgs. 196/2003, attenendosi alle istruzioni ricevute. I dati sono inseriti esclusivamente nel sistema AncheCasa e non possono essere conservati in archivi personali. Il Collaboratore dichiara di aver ricevuto l'informativa sul trattamento dei propri dati personali.</p>
<p>7.3 Il marchio AncheCasa, i materiali e il kit restano di proprietà esclusiva della Società. Alla cessazione del contratto il Collaboratore li restituisce entro sette (7) giorni e ne cessa ogni utilizzo.</p>
<h2>ART. 8 – NON CONCORRENZA E NON SOLLECITAZIONE</h2>
<p>8.1 Per la durata del contratto il Collaboratore si impegna a non promuovere, direttamente o indirettamente, servizi in concorrenza con quelli della Società (piattaforme di servizi per la casa, lavori di ristrutturazione, software e servizi distribuiti dalla Società), salvo consenso scritto della Società.</p>
<p>8.2 Per dodici (12) mesi dalla cessazione del contratto il Collaboratore si impegna a non sviare a favore proprio o di terzi i clienti, le imprese partner, gli agenti e i collaboratori conosciuti in ragione dell'incarico.</p>
<p>8.3 Il Collaboratore presenta la Società in modo veritiero e corretto e non promette prezzi, tempi o condizioni non approvati dalla Società.</p>
<h2>ART. 9 – DURATA E RECESSO</h2>
<p>9.1 Il contratto decorre dalla data di sottoscrizione e ha durata fino alla stipula del nuovo contratto di cui all'art. 6.5 e, in ogni caso, non oltre sei (6) mesi, salvo proroga scritta.</p>
<p>9.2 Ciascuna Parte può recedere in qualsiasi momento con preavviso scritto di quindici (15) giorni, comunicato a mezzo PEC, raccomandata o e-mail con conferma di ricezione.</p>
<p>9.3 La Società può recedere con effetto immediato in caso di violazione da parte del Collaboratore degli artt. 2.5, 7 e 8, di mancato adempimento dell'art. 6.4, ovvero di condotte lesive dell'immagine della Società.</p>
<p>9.4 Alla cessazione del contratto: (i) sono corrisposti i compensi già maturati, nei limiti dell'art. 6; (ii) sulle somme incassate successivamente, il compenso spetta solo per i contratti con i clienti sottoscritti prima della cessazione; (iii) i clienti restano della Società e sono affidati dalla Società alla rete; (iv) se la cessazione interviene prima del termine del Periodo di avvio, il Collaboratore non partecipa all'assegnazione delle aree.</p>
<h2>ART. 10 – DISPOSIZIONI FINALI</h2>
<p>10.1 Ogni modifica al presente contratto richiede la forma scritta a pena di nullità.</p>
<p>10.2 Il Collaboratore non può cedere il contratto né affidare a terzi l'esecuzione dell'incarico senza il consenso scritto della Società.</p>
<p>10.3 L'eventuale invalidità di una clausola non comporta l'invalidità delle restanti.</p>
<p>10.4 Per quanto non espressamente previsto si applicano le disposizioni del codice civile. Per ogni controversia relativa al presente contratto è competente in via esclusiva il Foro di Santa Maria Capua Vetere.</p>
<h2>ALLEGATO A – QUOTE DELLA RETE</h2>
<p>A.1 Rendite (tutti i Servizi AncheCasa delle sezioni B.1–B.6 e B.8 dell'Allegato B, propri o di aziende partner, presenti e futuri). Alla rete è destinato il 35% dell'utile della Società su ciascun servizio, in misura fissa per tutta la durata del rapporto, compresi i rinnovi degli abbonamenti, ripartito come segue. L'utile è calcolato come indicato alla sezione A.3.</p>
<div class="tab"><table>
      <thead><tr><th>Ruolo</th><th>Quota della rete</th><th>Periodo di avvio</th><th>Dall'assegnazione dell'area</th></tr></thead>
      <tbody>
        <tr><td>Chi porta il cliente</td><td>70%</td><td>Sì, sui clienti acquisiti personalmente</td><td>Sì, sui clienti acquisiti personalmente</td></tr>
        <tr><td>Sviluppo rete</td><td>17%</td><td>Sì, sugli affari della propria linea</td><td>Sì, sulla propria linea e sull'area (art. 4.5)</td></tr>
        <tr><td>Capo area</td><td>8%</td><td>No</td><td>No</td></tr>
        <tr><td>Responsabile Rete Italia</td><td>5%</td><td>No</td><td>No</td></tr>
      </tbody></table></div>
<p>Cliente segnalato da un terzo: a chi chiude il 45% e a chi segnala il 25% della quota della rete.</p>
<p>A.2 Cantieri e subappalti. Alla rete è destinato il 40% dell'utile di ciascun cantiere ovvero, nei subappalti, della quota spettante alla Società, calcolati come indicato alla sezione A.3, ripartito come segue.</p>
<div class="tab"><table>
      <thead><tr><th>Ruolo</th><th>Quota della rete</th><th>Periodo di avvio</th><th>Dall'assegnazione dell'area</th></tr></thead>
      <tbody>
        <tr><td>Chi segnala</td><td>10%</td><td>Sì, se ha acquisito il cliente</td><td>Sì, se ha acquisito il cliente</td></tr>
        <tr><td>Chi chiude</td><td>25%</td><td>Solo se chiude personalmente</td><td>Solo se chiude personalmente</td></tr>
        <tr><td>Chi segue il cantiere</td><td>30%</td><td>Solo se segue personalmente</td><td>Solo se segue personalmente</td></tr>
        <tr><td>Chi ha portato l'impresa</td><td>10%</td><td>Sì, se ha portato l'impresa</td><td>Sì, se ha portato l'impresa</td></tr>
        <tr><td>Sviluppo rete</td><td>12%</td><td>Sì, sugli affari della propria linea</td><td>Sì, sulla propria linea e sull'area (art. 4.5)</td></tr>
        <tr><td>Capo area</td><td>8%</td><td>No</td><td>No</td></tr>
        <tr><td>Responsabile Rete Italia</td><td>5%</td><td>No</td><td>No</td></tr>
      </tbody></table></div>
<p>A.3 Come si calcola l'utile. (a) Software (abbonamenti e moduli delle app AncheCasa, commissioni per lavoro, sponsorizzazioni): importo incassato al netto dell'IVA, meno le commissioni di pagamento sostenute, meno una quota fissa per i costi del software (sviluppo, server, assistenza) pari al 25% dell'importo incassato al netto dell'IVA. (b) Tutti gli altri servizi (luce e gas, telefonia, fornitori, finanza e assicurazioni, servizi per la casa e ogni altro servizio presente o futuro): compenso incassato dalla Società al netto dell'IVA, meno una quota fissa per i costi di gestione pari al 15% del compenso incassato al netto dell'IVA. (c) Cantieri: importo incassato dal cliente al netto dell'IVA, meno i costi diretti del cantiere (imprese e subappalti, materiali e forniture, oneri della sicurezza, spese tecniche e pratiche); le spese generali della Società non si sottraggono. Nei subappalti l'utile è la quota spettante alla Società, al netto dell'IVA. Le quote del 25% e del 15% restano invariate per tutta la durata del contratto, salvo accordo scritto.</p>
<p class="fine">Le quote si applicano nei limiti dell'art. 5 (maturazione all'incasso e per tranche) e dell'Allegato C (attribuzione dei clienti, clienti affidati, privati). L'utile è determinato secondo la sezione A.3.</p>
<p class="fine">Quote in vigore dal 9 ottobre 2026, con l'introduzione del Responsabile Rete Italia: rendite 70% chi porta il cliente, 17% sviluppo rete, 8% capo area, 5% Responsabile Rete Italia; cantieri 10% chi segnala, 25% chi chiude, 30% chi segue, 10% chi ha portato l'impresa, 12% sviluppo rete, 8% capo area, 5% Responsabile Rete Italia. Calcolo dell'utile (sezione A.3) in vigore dal 12 ottobre 2026.</p>
<h2>ALLEGATO B – SERVIZI ANCHECASA</h2>
    <p>Sono Servizi AncheCasa tutti i prodotti e servizi offerti dalla Società, direttamente o tramite aziende partner, presenti e futuri. L'elenco che segue è esemplificativo e non esaustivo; il listino aggiornato è sempre consultabile nella dashboard AncheCasa.</p>
    <div class="tab"><table>
      <thead><tr><th>Area</th><th>Prodotti e servizi</th></tr></thead>
      <tbody>
        <tr><td>B.1 Software gestionali per aziende</td><td>Pacchetto Ufficio (amministrazione, sicurezza, documenti, clienti, preventivi, fatture, recruitment, acquisti, fornitori) e moduli per mestiere: imprese edili e general contractor (gestione cantiere, presenze, rapportini, giornali, SAL, cronoprogramma, magazzino, mezzi, app di campo, analisi e partecipazione a gare); professionisti tecnici; artigiani e installatori (incluso SuperMastro); fornitori di materiali e mezzi, per vendita e noleggio.</td></tr>
        <tr><td>B.2 Sicurezza sul lavoro e formazione</td><td>Corsi obbligatori per lavoratori, preposti, dirigenti, RLS, datori di lavoro RSPP, RSPP e ASPP; antincendio; primo soccorso e BLSD; abilitazioni per attrezzature (carrelli, PLE, ponteggi, escavatori, gru); HACCP; GDPR; documenti e adempimenti per uffici, sedi e cantieri; gestione della sicurezza in appalto, anche tramite aziende partner.</td></tr>
        <tr><td>B.3 Utenze</td><td>Energia elettrica, gas e altre utenze per privati e imprese, tramite fornitori partner.</td></tr>
        <tr><td>B.4 Piattaforma e visibilità</td><td>Iscrizioni e abbonamenti alla piattaforma, profili aziendali, vetrine, pubblicazione di annunci e richieste, opportunità e aste immobiliari, strumenti di comunicazione con i clienti.</td></tr>
        <tr><td>B.5 Servizi per la casa e per le imprese</td><td>Manutenzioni, impianti, pulizie, traslochi e ogni altro servizio offerto tramite imprese, artigiani e professionisti iscritti ad AncheCasa.</td></tr>
        <tr><td>B.6 Servizi di aziende partner</td><td>Ogni prodotto o servizio di aziende convenzionate con AncheCasa, anche se commercializzato con marchio diverso.</td></tr>
        <tr><td>B.7 Lavori e cantieri</td><td>Bagni, ristrutturazioni e lavori edili realizzati da AncheCasa come general contractor; appalti e subappalti con imprese partner. Per questa area si applica la sezione A.2 dell'Allegato A.</td></tr>
        <tr><td>B.8 Nuovi servizi</td><td>Ogni nuovo prodotto, servizio o software introdotto dalla Società dopo la firma, dalla data di pubblicazione nel listino o nella dashboard AncheCasa.</td></tr>
      </tbody></table></div>
    <p class="fine">I prezzi e le condizioni di ciascun Servizio sono stabiliti esclusivamente dalla Società e possono variare nel tempo.</p>

    <h2>ALLEGATO C – REGOLE COMUNI DELLA RETE</h2>
    <p>Regole uguali per tutti i componenti della rete AncheCasa, in vigore dal 10 ottobre 2026. In caso di contrasto con il contratto prevalgono, per le materie qui regolate, le presenti regole.</p>
    <p>C.1 Ingresso nella rete. Si entra nella rete solo con proposta approvata dalla Società e dal Responsabile Rete Italia e, ove nominato, dal Responsabile Sviluppo Rete dell'area interessata. Ogni componente della rete può proporre nuove persone; gli incarichi sono conferiti esclusivamente dalla Società.</p>
    <p>C.2 Chi porta, tiene. Ogni persona che entra nella rete fa parte della linea di chi l'ha proposta, in qualunque regione operi. Le quote di linea dell'Allegato A (chi porta il cliente e, per i ruoli presenti nella linea, sviluppo rete e capo area) seguono la linea di chi ha acquisito il cliente, indipendentemente dalla regione in cui il cliente si trova. Per ciascun affare ogni quota di ruolo è riconosciuta una sola volta.</p>
    <p>C.3 Attribuzione dei clienti. Il cliente è attribuito a chi lo registra per primo nel sistema AncheCasa; fanno fede la data e l'ora registrate dal sistema. Le aziende sono identificate dalla partita IVA, i privati dal recapito telefonico o di posta elettronica. L'attribuzione permane finché il cliente resta attivo. Se un cliente è segnalato da un componente della rete e acquisito da un altro, si applica la ripartizione dell'Allegato A (45% a chi chiude, 25% a chi segnala).</p>
    <p>C.4 Iscrizioni dirette. L'azienda o l'artigiano che si iscrive direttamente alla piattaforma è attribuito: (a) al componente della rete di cui indica il codice al momento dell'iscrizione; (b) in mancanza, al componente che ne aveva registrato la partita IVA nei novanta (90) giorni precedenti; (c) in mancanza di entrambi, è cliente della Società ai sensi dell'art. C.5.</p>
    <p>C.5 Clienti della Società affidati. I clienti acquisiti direttamente dalla Società, anche tramite i suoi amministratori o il sito internet, possono essere affidati dalla Società a un componente della rete perché li segua. All'affidatario spetta il 50% della quota “chi porta il cliente” sui Servizi acquistati dal cliente affidato; su tali clienti non spettano le quote di sviluppo rete, capo area e Responsabile Rete Italia, che restano alla Società. Sui Servizi e sui lavori ulteriori procurati personalmente dall'affidatario spettano le quote ordinarie. L'affidatario contatta il cliente entro quarantotto (48) ore dall'affidamento; in mancanza la Società può affidarlo ad altri. Gli artigiani iscritti direttamente sono affidati solo dopo la verifica della Società.</p>
    <p>C.6 Clienti privati. Sull'iscrizione dei clienti privati e sui Servizi da essi acquistati non spetta alcuna provvigione. Le provvigioni sui privati spettano solo sui lavori, secondo la sezione A.2 dell'Allegato A. Il privato registrato da un componente della rete resta a lui collegato per dodici (12) mesi, che decorrono nuovamente da ogni contatto registrato nel sistema AncheCasa: se in tale periodo il privato commissiona un lavoro, anche contattando direttamente la Società, a quel componente spetta la quota “chi segnala”. Per i privati giunti direttamente alla Società la quota “chi segnala” resta alla Società.</p>
    <p>C.7 Territorio. Aree e regioni sono assegnate in base ai risultati registrati nel sistema AncheCasa, quando la Società, sentito il Responsabile Rete Italia, ritiene che i risultati lo consentano. Il capo area di una regione è di norma nominato quando nella regione operano almeno cinque (5) agenti attivi, ed è scelto tra chi vi ha costruito di più (persone attive e clienti attivi); lo stesso criterio vale per l'assegnazione delle aree ai Responsabili Sviluppo Rete. Con la nomina, il responsabile matura la propria quota di ruolo sugli affari della regione o dell'area acquisiti da componenti che non hanno un responsabile dello stesso ruolo nella propria linea, affianca sul posto la rete che vi opera e non toglie quote di linea già esistenti.</p>
    <p>C.8 Ruoli non presenti. Quando in una linea manca un ruolo e nessun responsabile territoriale ne ha diritto ai sensi dell'art. C.7, la relativa quota resta alla Società, salvo la quota del Responsabile Rete Italia prevista dal suo contratto.</p>
    <p>C.9 Trasparenza e obiettivi. Ogni componente della rete vede nel sistema AncheCasa i propri clienti, la propria linea, le provvigioni maturate e gli obiettivi. Gli obiettivi sono indicati dalla Società e dal Responsabile Rete Italia e hanno valore indicativo. Le linee decise dalla Società, anche nella sala strategia del sistema AncheCasa, costituiscono direttive commerciali generali.</p>
    <p>C.10 Documenti e firma nell'app. Le Parti convengono che contratti, circolari, regolamenti e loro modifiche possano essere sottoscritti anche con firma elettronica nel sistema AncheCasa, che registra l'identità dell'utente, la data, l'ora e il testo firmato; la Società mette a disposizione del firmatario copia del documento firmato. Le modifiche che riducono i diritti del componente della rete richiedono sempre il suo consenso espresso.</p>
`
  };

  AC.contrattiModelli["docs/AncheCasa-2Contratto-Capo-Area.pdf"] = {
    versione: "10.10.2026",
    etichetta: "Rete commerciale AncheCasa · Versione 10.10.2026",
    titolo: "Contratto di agenzia con funzioni di Capo Area",
    sotto: "Capo Area regionale · Rete commerciale AncheCasa",
    chiFirma: "Il Capo Area",
    nomeBreve: "Contratto Capo area",
    approva: "Ai sensi e per gli effetti degli artt. 1341 e 1342 c.c. approvo specificamente le seguenti clausole: art. 2.3 (esclusione dell'esclusiva); art. 2.5 (divieto di rappresentanza); art. 3.3 (quota ridotta fuori Regione); art. 4.2 (maturazione all'incasso e restituzione); art. 4.6 (assenza di provvigioni sui privati); art. 7.2 (revoca delle funzioni di coordinamento); art. 8.3 (recesso per giusta causa); art. 9.4 (foro competente); Allegato C, artt. C.2–C.8 (linea, attribuzione dei clienti, iscrizioni dirette, clienti affidati, clienti privati, territorio, ruoli non presenti).",
    corpo: `
<div class="centro">TRA</div>
    <p>PALUMBO INVESTMENT S.R.L., con sede legale in Teano (CE), Via Giusti n. 22, CAP 81057, codice fiscale, partita IVA e numero di iscrizione al Registro delle Imprese di Caserta 04724830619, REA CE-349941, PEC palumboinvestment@pec.it, in persona dell'Amministratrice Unica e legale rappresentante pro tempore, sig.ra Federica Palumbo, titolare del marchio e della piattaforma “AncheCasa” (di seguito, la “Società” o “AncheCasa”);</p>

    <div class="centro">E</div>
<div class="centro">E</div>
<div class="campi">
      <div class="campo lungo"><label for="cf-nome">Sig./Sig.ra ovvero ditta/società</label><input id="cf-nome" name="nome" autocomplete="name" required></div>
      <div class="campo"><label for="cf-luogo_nascita">nato/a a</label><input id="cf-luogo_nascita" name="luogo_nascita" required></div>
      <div class="campo"><label for="cf-data_nascita">il</label><input id="cf-data_nascita" name="data_nascita" type="date" required></div>
      <div class="campo lungo"><label for="cf-residenza">residenza / sede in</label><input id="cf-residenza" name="residenza" required></div>
      <div class="campo"><label for="cf-via">via / n.</label><input id="cf-via" name="via" required></div>
      <div class="campo"><label for="cf-cf">codice fiscale</label><input id="cf-cf" name="cf" autocapitalize="characters" maxlength="16" required><small></small></div>
      <div class="campo"><label for="cf-piva">partita IVA</label><input id="cf-piva" name="piva" inputmode="numeric" maxlength="11" required><small></small></div>
      <div class="campo"><label for="cf-rea">iscrizione agenti di commercio, REA n.</label><input id="cf-rea" name="rea" required></div>
      <div class="campo"><label for="cf-cciaa">CCIAA di</label><input id="cf-cciaa" name="cciaa" required></div>
      <div class="campo"><label for="cf-enasarco">posizione Enasarco n.</label><input id="cf-enasarco" name="enasarco" inputmode="numeric"></div>
      <div class="campo"><label for="cf-telefono">telefono</label><input id="cf-telefono" name="telefono" type="tel" autocomplete="tel" required></div>
      <div class="campo"><label for="cf-pec">PEC</label><input id="cf-pec" name="pec" type="email"><small></small></div>
      <div class="campo"><label for="cf-mail">e-mail</label><input id="cf-mail" name="mail" type="email" autocomplete="email" required><small></small></div>
      <div class="campo"><label for="cf-iban">IBAN per i pagamenti</label><input id="cf-iban" name="iban" autocapitalize="characters" maxlength="34" required><small></small></div>
    </div>
<p>agente di commercio regolarmente iscritto e titolare di partita IVA (di seguito, il “Capo Area”; la Società e il Capo Area, insieme, le “Parti”).</p>
<div class="centro">PREMESSO CHE</div>
<ul class="el">
  <li data-l="a">la Società, attraverso il marchio AncheCasa, gestisce una piattaforma dedicata ai servizi per la casa e per le imprese che mette in relazione privati, aziende, imprese e professionisti, offre, direttamente o tramite aziende partner, un catalogo di prodotti e servizi in continua espansione (software gestionali, servizi per la sicurezza e la formazione, utenze, servizi per la casa e per le imprese) e realizza, anche in qualità di general contractor, lavori di ristrutturazione tramite imprese partner selezionate;</li>
  <li data-l="b">la Società ha costituito una rete commerciale articolata in un Responsabile Rete Italia, Responsabili Sviluppo Rete per le aree Nord, Centro e Sud e Isole, capi area regionali, agenti, sub-agenti e segnalatori, nella quale ogni ruolo riceve una quota fissa dei ricavi secondo regole uniformi;</li>
  <li data-l="c">il Capo Area esercita professionalmente l'attività di agente di commercio e intende assumere, per conto della Società, l'incarico di promuovere i Servizi AncheCasa e di coordinare la rete degli agenti nella regione indicata all'art. 2.2;</li>
  <li data-l="d">il Capo Area risponde direttamente alla Società ed è coordinato dal Responsabile Sviluppo Rete dell'area geografica di appartenenza;</li>
</ul>
<p>tutto ciò premesso, le Parti convengono e stipulano quanto segue.</p>
<h2>ART. 1 – PREMESSE E ALLEGATI</h2>
<p>1.1 Le premesse e gli allegati costituiscono parte integrante e sostanziale del presente contratto. Costituiscono allegati l'Allegato A – “Quote della rete”, l'Allegato B – “Servizi AncheCasa” e l'Allegato C – “Regole comuni della rete”.</p>
<h2>ART. 2 – OGGETTO E ZONA</h2>
<p>2.1 La Società conferisce al Capo Area, che accetta, l'incarico di agente ai sensi degli artt. 1742 e seguenti del codice civile per la promozione, in modo stabile, della conclusione di contratti aventi a oggetto i Servizi AncheCasa e i lavori realizzati dalla Società, nonché l'incarico di Capo Area della regione di cui all'art. 2.2.</p>
<p>2.2 Zona. Regione <input class="inline" id="cf-regione" name="regione" aria-label="Regione" placeholder="es. Campania" required> (la “Regione”).</p>
<p>2.3 Esclusiva. In deroga all'art. 1743 c.c., l'incarico non attribuisce al Capo Area l'esclusiva di zona. La Società può operare nella Regione direttamente e tramite altri agenti, sub-agenti e segnalatori, che fanno parte della rete coordinata dal Capo Area. Il Capo Area può operare per altri preponenti purché non concorrenti, previa comunicazione scritta alla Società. Possono essere acquisiti clienti in tutto il territorio nazionale: i clienti acquisiti fuori zona restano attribuiti secondo l'Allegato C.</p>
<p>2.4 Servizi promuovibili. Il Capo Area promuove tutti i prodotti e servizi offerti da AncheCasa, propri o di aziende partner (i “Servizi AncheCasa”), elencati a titolo esemplificativo nell'Allegato B. L'incarico si estende automaticamente a ogni nuovo prodotto, servizio o software che la Società renderà disponibile in futuro, dal momento della sua pubblicazione nel listino o nella dashboard AncheCasa. La Società può modificare, sospendere o ritirare singoli Servizi senza che ciò costituisca modifica del presente contratto.</p>
<p>2.5 Il Capo Area non ha potere di rappresentanza della Società, salvo procura scritta. È fatto divieto di sottoscrivere contratti, incassare somme, rilasciare quietanze, concedere sconti o assumere impegni in nome o per conto della Società. Prezzi, preventivi e condizioni contrattuali sono determinati esclusivamente dalla Società. I contratti con i clienti si intendono conclusi solo con l'accettazione scritta della Società.</p>
<h2>ART. 3 – FUNZIONI DI CAPO AREA</h2>
<p>3.1 Il Capo Area, in autonomia organizzativa e nel rispetto delle direttive commerciali generali della Società:</p>
<ul class="el">
  <li data-l="a">promuove i Servizi AncheCasa e acquisisce clienti nella Regione;</li>
  <li data-l="b">individua e propone alla Società nuovi agenti, sub-agenti e imprese partner; gli incarichi sono conferiti esclusivamente dalla Società;</li>
  <li data-l="c">coordina gli agenti della Regione, li affianca nelle trattative e verifica la qualità del servizio reso ai clienti;</li>
  <li data-l="d">collabora con il Responsabile Sviluppo Rete dell'area, con il quale si coordina sugli obiettivi;</li>
  <li data-l="e">registra ogni cliente e ogni attività nel sistema informatico AncheCasa e rendiconta mensilmente i risultati della Regione.</li>
</ul>
<p>3.2 Dipendenza. Il Capo Area risponde direttamente alla Società. Il Responsabile Sviluppo Rete coordina i capi area della propria area geografica, senza poteri di direzione sul rapporto contrattuale. Il Responsabile Rete Italia coordina a livello nazionale i Responsabili Sviluppo Rete e i capi area, senza poteri di direzione sul rapporto contrattuale.</p>
<p>3.3 Clienti fuori Regione. Su richiesta scritta della Società, il Capo Area può seguire temporaneamente, direttamente o tramite un proprio agente e unitamente allo sviluppo rete, clienti situati in regioni prive di agente. Per tale attività spetta una quota ridotta e temporanea, stabilita per iscritto dalla Società per ciascuna regione, che cessa del tutto quando i clienti sono affidati all'agente locale contrattualizzato. La decisione di individuare un agente locale è assunta dalla Società, sentiti il Capo Area e lo sviluppo rete.</p>
<p>3.4 Reggenza. La Società può affidare al Capo Area la reggenza temporanea di un'altra regione, con quota ridotta stabilita per iscritto, fino alla nomina del capo area di quella regione.</p>
<p>3.5 Formazione. Eventuali attività di formazione della rete svolte dal Capo Area su richiesta della Società sono regolate e compensate con separato accordo scritto e non rientrano nelle provvigioni del presente contratto.</p>
<h2>ART. 4 – PROVVIGIONI E COMPENSI</h2>
<p>4.1 Al Capo Area spettano esclusivamente provvigioni commisurate ai risultati, determinate secondo l'Allegato A. Non sono previsti compensi fissi, rimborsi spese o anticipi, salvo diverso accordo scritto. Le percentuali dell'Allegato A restano invariate per tutta la durata del contratto.</p>
<p>4.2 Maturazione. Il diritto alla provvigione matura esclusivamente sulle somme effettivamente incassate dalla Società per gli affari andati a buon fine. Per i cantieri la provvigione matura per tranche, in proporzione agli incassi: 30% alla firma del contratto con il cliente e all'incasso dell'acconto; 30% a metà dei lavori; 40% al collaudo. In caso di mancato pagamento, recesso, risoluzione o rimborso al cliente, la provvigione relativa non matura ovvero, se già corrisposta, è restituita o compensata con le provvigioni successive.</p>
<p>4.3 Pagamento. Entro il giorno 10 di ciascun mese la Società trasmette l'estratto conto delle provvigioni maturate nel mese precedente, con l'indicazione degli affari e degli incassi a cui si riferiscono, e provvede al pagamento entro il giorno 20 mediante bonifico, dietro emissione di regolare fattura.</p>
<p>4.4 Oneri. La Società versa i contributi Enasarco nella misura di legge, trattenendo la quota a carico dell'agente, e opera le ritenute previste dalla normativa fiscale. Il FIRR e le indennità di fine rapporto spettano nei casi e nei limiti previsti dalla legge e dagli Accordi Economici Collettivi, ove applicabili.</p>
<p>4.5 Base di calcolo. Le quote sono calcolate sull'utile della Società, determinato secondo la sezione A.3 dell'Allegato A. L'estratto conto riporta, per ciascun affare, la base di calcolo e la provvigione spettante; la Società non è tenuta a comunicare i singoli costi né i prezzi delle imprese e dei fornitori.</p>
<p>4.6 Clienti privati. Sull'iscrizione dei clienti privati e sui Servizi da essi acquistati non è prevista alcuna provvigione: le provvigioni spettano solo sui lavori, secondo la sezione A.2 dell'Allegato A e l'art. C.6 dell'Allegato C.</p>
<p>4.7 Quota capo area. Al Capo Area spetta la quota “capo area” dell'Allegato A sugli affari della propria linea (agenti, sub-agenti e segnalatori da lui proposti e le loro squadre), in qualsiasi regione, e sugli affari della Regione acquisiti da componenti della rete che non hanno un capo area nella propria linea, oltre alle quote di ruolo sui clienti acquisiti, chiusi o seguiti personalmente. Restano salvi gli artt. C.5 e C.8 dell'Allegato C.</p>
<h2>ART. 5 – RISERVATEZZA, DATI PERSONALI E MARCHIO</h2>
<p>5.1 Il Capo Area si obbliga a mantenere strettamente riservate tutte le informazioni della Società di cui venga a conoscenza (a titolo esemplificativo: clienti, imprese partner, prezzi, margini, provvigioni, software, strategie commerciali) e a non utilizzarle per fini diversi dall'incarico. L'obbligo permane per tre (3) anni dalla cessazione del contratto.</p>
<p>5.2 Il Capo Area tratta i dati personali dei clienti esclusivamente per l'esecuzione dell'incarico, quale soggetto autorizzato o responsabile del trattamento designato dalla Società ai sensi del Regolamento (UE) 2016/679 e del D.Lgs. 196/2003, attenendosi alle istruzioni ricevute. I dati sono inseriti esclusivamente nel sistema AncheCasa e non possono essere conservati in archivi personali. I clienti acquisiti restano clienti della Società.</p>
<p>5.3 Il marchio AncheCasa, i materiali e il kit restano di proprietà esclusiva della Società. Alla cessazione del contratto sono restituiti entro sette (7) giorni e ne cessa ogni utilizzo.</p>
<p>5.4 Il Capo Area presenta la Società in modo veritiero e corretto e non promette prezzi, tempi o condizioni non approvati dalla Società.</p>
<h2>ART. 6 – CONCORRENZA</h2>
<p>6.1 Per la durata del contratto il Capo Area non promuove, direttamente o indirettamente, servizi in concorrenza con quelli della Società senza il suo consenso scritto.</p>
<p>6.2 Il Capo Area non può sviare a favore proprio o di terzi i clienti, le imprese partner e gli agenti della rete. Eventuali obblighi di non concorrenza successivi alla cessazione del rapporto sono validi solo se pattuiti per iscritto nei limiti e con l'indennità previsti dall'art. 1751-bis c.c.</p>
<h2>ART. 7 – OBIETTIVI</h2>
<p>7.1 La Società può indicare annualmente, per iscritto, obiettivi indicativi per la Regione. Il mancato raggiungimento degli obiettivi non costituisce di per sé inadempimento, ma può essere valutato dalla Società ai fini della prosecuzione delle funzioni di coordinamento.</p>
<p>7.2 La Società può revocare le sole funzioni di capo area con preavviso scritto di sessanta (60) giorni, ferma la prosecuzione del rapporto di agenzia e delle provvigioni sui clienti propri.</p>
<h2>ART. 8 – DURATA E RECESSO</h2>
<p>8.1 Il contratto è a tempo indeterminato e decorre dalla data di sottoscrizione. I primi sei (6) mesi costituiscono periodo di prova, durante il quale ciascuna Parte può recedere con preavviso di quindici (15) giorni.</p>
<p>8.2 Superato il periodo di prova, ciascuna Parte può recedere con il preavviso previsto dall'art. 1750 c.c. e, ove applicabili, dagli Accordi Economici Collettivi, comunicato a mezzo PEC o raccomandata.</p>
<p>8.3 Ciascuna Parte può recedere senza preavviso per giusta causa. Costituiscono in ogni caso giusta causa la violazione degli artt. 2.5, 5 e 6 e le condotte lesive dell'immagine della Società.</p>
<p>8.4 Alla cessazione: (i) sono corrisposte le provvigioni sugli affari conclusi prima della cessazione, anche se incassati successivamente, secondo le regole dell'art. 4; (ii) i clienti restano della Società e sono affidati alla rete della Regione; (iii) spettano le indennità di legge nei casi previsti.</p>
<h2>ART. 9 – DISPOSIZIONI FINALI</h2>
<p>9.1 Ogni modifica al presente contratto richiede la forma scritta a pena di nullità.</p>
<p>9.2 Il contratto non può essere ceduto senza il consenso scritto della Società.</p>
<p>9.3 L'eventuale invalidità di una clausola non comporta l'invalidità delle restanti.</p>
<p>9.4 Per quanto non espressamente previsto si applicano le disposizioni del codice civile in materia di contratto di agenzia (artt. 1742–1753 c.c.) e, ove applicabili, gli Accordi Economici Collettivi. Per ogni controversia relativa al presente contratto è competente in via esclusiva il Foro di Santa Maria Capua Vetere, salvo i casi di competenza inderogabile previsti dalla legge.</p>
<h2>ALLEGATO A – QUOTE DELLA RETE</h2>
<p>Spettanze del Capo Area. Le quote sono espresse in percentuale della quota destinata alla rete.</p>
<p>A.1 Rendite (tutti i Servizi AncheCasa delle sezioni B.1–B.6 e B.8 dell'Allegato B, propri o di aziende partner, presenti e futuri). Alla rete è destinato il 35% dell'utile della Società su ciascun servizio, in misura fissa per tutta la durata del rapporto, compresi i rinnovi degli abbonamenti, ripartito come segue. L'utile è calcolato come indicato alla sezione A.3.</p>
<div class="tab"><table>
      <thead><tr><th>Ruolo</th><th>Quota della rete</th><th>Spettanza</th></tr></thead>
      <tbody>
        <tr><td>Chi porta il cliente</td><td>70%</td><td>Sui clienti acquisiti personalmente</td></tr>
        <tr><td>Sviluppo rete</td><td>17%</td><td>Non spettante (Responsabile Sviluppo Rete)</td></tr>
        <tr><td>Capo area</td><td>8%</td><td>Sugli affari della propria linea e della Regione (art. 4.7)</td></tr>
        <tr><td>Responsabile Rete Italia</td><td>5%</td><td>Non spettante (Responsabile Rete Italia)</td></tr>
      </tbody></table></div>
<p>Cliente segnalato da un terzo: a chi chiude il 45% e a chi segnala il 25% della quota della rete.</p>
<p>A.2 Cantieri e subappalti. Alla rete è destinato il 40% dell'utile di ciascun cantiere ovvero, nei subappalti, della quota spettante alla Società, calcolati come indicato alla sezione A.3, ripartito come segue.</p>
<div class="tab"><table>
      <thead><tr><th>Ruolo</th><th>Quota della rete</th><th>Spettanza</th></tr></thead>
      <tbody>
        <tr><td>Chi segnala</td><td>10%</td><td>Se ha acquisito il cliente</td></tr>
        <tr><td>Chi chiude</td><td>25%</td><td>Se chiude personalmente</td></tr>
        <tr><td>Chi segue il cantiere</td><td>30%</td><td>Se segue personalmente</td></tr>
        <tr><td>Chi ha portato l'impresa</td><td>10%</td><td>Se ha portato l'impresa</td></tr>
        <tr><td>Sviluppo rete</td><td>12%</td><td>Non spettante (Responsabile Sviluppo Rete)</td></tr>
        <tr><td>Capo area</td><td>8%</td><td>Sui cantieri della propria linea e della Regione (art. 4.7)</td></tr>
        <tr><td>Responsabile Rete Italia</td><td>5%</td><td>Non spettante (Responsabile Rete Italia)</td></tr>
      </tbody></table></div>
<p>A.3 Come si calcola l'utile. (a) Software (abbonamenti e moduli delle app AncheCasa, commissioni per lavoro, sponsorizzazioni): importo incassato al netto dell'IVA, meno le commissioni di pagamento sostenute, meno una quota fissa per i costi del software (sviluppo, server, assistenza) pari al 25% dell'importo incassato al netto dell'IVA. (b) Tutti gli altri servizi (luce e gas, telefonia, fornitori, finanza e assicurazioni, servizi per la casa e ogni altro servizio presente o futuro): compenso incassato dalla Società al netto dell'IVA, meno una quota fissa per i costi di gestione pari al 15% del compenso incassato al netto dell'IVA. (c) Cantieri: importo incassato dal cliente al netto dell'IVA, meno i costi diretti del cantiere (imprese e subappalti, materiali e forniture, oneri della sicurezza, spese tecniche e pratiche); le spese generali della Società non si sottraggono. Nei subappalti l'utile è la quota spettante alla Società, al netto dell'IVA. Le quote del 25% e del 15% restano invariate per tutta la durata del contratto, salvo accordo scritto.</p>
<p class="fine">Le quote si applicano nei limiti delle regole di maturazione (incasso e tranche). L'utile è determinato secondo la sezione A.3.</p>
<p class="fine">Quote in vigore dal 9 ottobre 2026, con l'introduzione del Responsabile Rete Italia: rendite 70% chi porta il cliente, 17% sviluppo rete, 8% capo area, 5% Responsabile Rete Italia; cantieri 10% chi segnala, 25% chi chiude, 30% chi segue, 10% chi ha portato l'impresa, 12% sviluppo rete, 8% capo area, 5% Responsabile Rete Italia. Calcolo dell'utile (sezione A.3) in vigore dal 12 ottobre 2026.</p>
<h2>ALLEGATO B – SERVIZI ANCHECASA</h2>
    <p>Sono Servizi AncheCasa tutti i prodotti e servizi offerti dalla Società, direttamente o tramite aziende partner, presenti e futuri. L'elenco che segue è esemplificativo e non esaustivo; il listino aggiornato è sempre consultabile nella dashboard AncheCasa.</p>
    <div class="tab"><table>
      <thead><tr><th>Area</th><th>Prodotti e servizi</th></tr></thead>
      <tbody>
        <tr><td>B.1 Software gestionali per aziende</td><td>Pacchetto Ufficio (amministrazione, sicurezza, documenti, clienti, preventivi, fatture, recruitment, acquisti, fornitori) e moduli per mestiere: imprese edili e general contractor (gestione cantiere, presenze, rapportini, giornali, SAL, cronoprogramma, magazzino, mezzi, app di campo, analisi e partecipazione a gare); professionisti tecnici; artigiani e installatori (incluso SuperMastro); fornitori di materiali e mezzi, per vendita e noleggio.</td></tr>
        <tr><td>B.2 Sicurezza sul lavoro e formazione</td><td>Corsi obbligatori per lavoratori, preposti, dirigenti, RLS, datori di lavoro RSPP, RSPP e ASPP; antincendio; primo soccorso e BLSD; abilitazioni per attrezzature (carrelli, PLE, ponteggi, escavatori, gru); HACCP; GDPR; documenti e adempimenti per uffici, sedi e cantieri; gestione della sicurezza in appalto, anche tramite aziende partner.</td></tr>
        <tr><td>B.3 Utenze</td><td>Energia elettrica, gas e altre utenze per privati e imprese, tramite fornitori partner.</td></tr>
        <tr><td>B.4 Piattaforma e visibilità</td><td>Iscrizioni e abbonamenti alla piattaforma, profili aziendali, vetrine, pubblicazione di annunci e richieste, opportunità e aste immobiliari, strumenti di comunicazione con i clienti.</td></tr>
        <tr><td>B.5 Servizi per la casa e per le imprese</td><td>Manutenzioni, impianti, pulizie, traslochi e ogni altro servizio offerto tramite imprese, artigiani e professionisti iscritti ad AncheCasa.</td></tr>
        <tr><td>B.6 Servizi di aziende partner</td><td>Ogni prodotto o servizio di aziende convenzionate con AncheCasa, anche se commercializzato con marchio diverso.</td></tr>
        <tr><td>B.7 Lavori e cantieri</td><td>Bagni, ristrutturazioni e lavori edili realizzati da AncheCasa come general contractor; appalti e subappalti con imprese partner. Per questa area si applica la sezione A.2 dell'Allegato A.</td></tr>
        <tr><td>B.8 Nuovi servizi</td><td>Ogni nuovo prodotto, servizio o software introdotto dalla Società dopo la firma, dalla data di pubblicazione nel listino o nella dashboard AncheCasa.</td></tr>
      </tbody></table></div>
    <p class="fine">I prezzi e le condizioni di ciascun Servizio sono stabiliti esclusivamente dalla Società e possono variare nel tempo.</p>

    <h2>ALLEGATO C – REGOLE COMUNI DELLA RETE</h2>
    <p>Regole uguali per tutti i componenti della rete AncheCasa, in vigore dal 10 ottobre 2026. In caso di contrasto con il contratto prevalgono, per le materie qui regolate, le presenti regole.</p>
    <p>C.1 Ingresso nella rete. Si entra nella rete solo con proposta approvata dalla Società e dal Responsabile Rete Italia e, ove nominato, dal Responsabile Sviluppo Rete dell'area interessata. Ogni componente della rete può proporre nuove persone; gli incarichi sono conferiti esclusivamente dalla Società.</p>
    <p>C.2 Chi porta, tiene. Ogni persona che entra nella rete fa parte della linea di chi l'ha proposta, in qualunque regione operi. Le quote di linea dell'Allegato A (chi porta il cliente e, per i ruoli presenti nella linea, sviluppo rete e capo area) seguono la linea di chi ha acquisito il cliente, indipendentemente dalla regione in cui il cliente si trova. Per ciascun affare ogni quota di ruolo è riconosciuta una sola volta.</p>
    <p>C.3 Attribuzione dei clienti. Il cliente è attribuito a chi lo registra per primo nel sistema AncheCasa; fanno fede la data e l'ora registrate dal sistema. Le aziende sono identificate dalla partita IVA, i privati dal recapito telefonico o di posta elettronica. L'attribuzione permane finché il cliente resta attivo. Se un cliente è segnalato da un componente della rete e acquisito da un altro, si applica la ripartizione dell'Allegato A (45% a chi chiude, 25% a chi segnala).</p>
    <p>C.4 Iscrizioni dirette. L'azienda o l'artigiano che si iscrive direttamente alla piattaforma è attribuito: (a) al componente della rete di cui indica il codice al momento dell'iscrizione; (b) in mancanza, al componente che ne aveva registrato la partita IVA nei novanta (90) giorni precedenti; (c) in mancanza di entrambi, è cliente della Società ai sensi dell'art. C.5.</p>
    <p>C.5 Clienti della Società affidati. I clienti acquisiti direttamente dalla Società, anche tramite i suoi amministratori o il sito internet, possono essere affidati dalla Società a un componente della rete perché li segua. All'affidatario spetta il 50% della quota “chi porta il cliente” sui Servizi acquistati dal cliente affidato; su tali clienti non spettano le quote di sviluppo rete, capo area e Responsabile Rete Italia, che restano alla Società. Sui Servizi e sui lavori ulteriori procurati personalmente dall'affidatario spettano le quote ordinarie. L'affidatario contatta il cliente entro quarantotto (48) ore dall'affidamento; in mancanza la Società può affidarlo ad altri. Gli artigiani iscritti direttamente sono affidati solo dopo la verifica della Società.</p>
    <p>C.6 Clienti privati. Sull'iscrizione dei clienti privati e sui Servizi da essi acquistati non spetta alcuna provvigione. Le provvigioni sui privati spettano solo sui lavori, secondo la sezione A.2 dell'Allegato A. Il privato registrato da un componente della rete resta a lui collegato per dodici (12) mesi, che decorrono nuovamente da ogni contatto registrato nel sistema AncheCasa: se in tale periodo il privato commissiona un lavoro, anche contattando direttamente la Società, a quel componente spetta la quota “chi segnala”. Per i privati giunti direttamente alla Società la quota “chi segnala” resta alla Società.</p>
    <p>C.7 Territorio. Aree e regioni sono assegnate in base ai risultati registrati nel sistema AncheCasa, quando la Società, sentito il Responsabile Rete Italia, ritiene che i risultati lo consentano. Il capo area di una regione è di norma nominato quando nella regione operano almeno cinque (5) agenti attivi, ed è scelto tra chi vi ha costruito di più (persone attive e clienti attivi); lo stesso criterio vale per l'assegnazione delle aree ai Responsabili Sviluppo Rete. Con la nomina, il responsabile matura la propria quota di ruolo sugli affari della regione o dell'area acquisiti da componenti che non hanno un responsabile dello stesso ruolo nella propria linea, affianca sul posto la rete che vi opera e non toglie quote di linea già esistenti.</p>
    <p>C.8 Ruoli non presenti. Quando in una linea manca un ruolo e nessun responsabile territoriale ne ha diritto ai sensi dell'art. C.7, la relativa quota resta alla Società, salvo la quota del Responsabile Rete Italia prevista dal suo contratto.</p>
    <p>C.9 Trasparenza e obiettivi. Ogni componente della rete vede nel sistema AncheCasa i propri clienti, la propria linea, le provvigioni maturate e gli obiettivi. Gli obiettivi sono indicati dalla Società e dal Responsabile Rete Italia e hanno valore indicativo. Le linee decise dalla Società, anche nella sala strategia del sistema AncheCasa, costituiscono direttive commerciali generali.</p>
    <p>C.10 Documenti e firma nell'app. Le Parti convengono che contratti, circolari, regolamenti e loro modifiche possano essere sottoscritti anche con firma elettronica nel sistema AncheCasa, che registra l'identità dell'utente, la data, l'ora e il testo firmato; la Società mette a disposizione del firmatario copia del documento firmato. Le modifiche che riducono i diritti del componente della rete richiedono sempre il suo consenso espresso.</p>
`
  };

  AC.contrattiModelli["docs/AncheCasa-4Contratto-Subagente.pdf"] = {
    versione: "10.10.2026",
    etichetta: "Rete commerciale AncheCasa · Versione 10.10.2026",
    titolo: "Contratto di sub-agenzia e segnalazione",
    sotto: "Sub-agente · Rete commerciale AncheCasa",
    chiFirma: "Il Sub-agente",
    nomeBreve: "Contratto Sub-agente",
    approva: "Ai sensi e per gli effetti degli artt. 1341 e 1342 c.c. approvo specificamente le seguenti clausole: art. 2.5 (divieto di rappresentanza); art. 4.2 (maturazione all'incasso e restituzione); art. 4.6 (assenza di provvigioni sui privati); art. 4.7 (ripartizione 70/30); artt. 6.1, 6.2, 6.3 e 6.4 (limite dei pagamenti, compensi sospesi, passaggio dei clienti all'Agente di riferimento); art. 8.3 (recesso immediato); art. 9.4 (foro competente); Allegato C, artt. C.2–C.8 (linea, attribuzione dei clienti, iscrizioni dirette, clienti affidati, clienti privati, territorio, ruoli non presenti).",
    altriFirmatari: [["L'Agente di riferimento", "per accettazione"]],
    corpo: `
<div class="centro">TRA</div>
    <p>PALUMBO INVESTMENT S.R.L., con sede legale in Teano (CE), Via Giusti n. 22, CAP 81057, codice fiscale, partita IVA e numero di iscrizione al Registro delle Imprese di Caserta 04724830619, REA CE-349941, PEC palumboinvestment@pec.it, in persona dell'Amministratrice Unica e legale rappresentante pro tempore, sig.ra Federica Palumbo, titolare del marchio e della piattaforma “AncheCasa” (di seguito, la “Società” o “AncheCasa”);</p>

    <div class="centro">E</div>
<div class="centro">E</div>
<div class="campi">
      <div class="campo lungo"><label for="cf-nome">Sig./Sig.ra</label><input id="cf-nome" name="nome" autocomplete="name" required></div>
      <div class="campo"><label for="cf-luogo_nascita">nato/a a</label><input id="cf-luogo_nascita" name="luogo_nascita" required></div>
      <div class="campo"><label for="cf-data_nascita">il</label><input id="cf-data_nascita" name="data_nascita" type="date" required></div>
      <div class="campo lungo"><label for="cf-residenza">residente in</label><input id="cf-residenza" name="residenza" required></div>
      <div class="campo"><label for="cf-via">via / n.</label><input id="cf-via" name="via" required></div>
      <div class="campo"><label for="cf-cf">codice fiscale</label><input id="cf-cf" name="cf" autocapitalize="characters" maxlength="16" required><small></small></div>
      <div class="campo"><label for="cf-documento">documento n.</label><input id="cf-documento" name="documento" required></div>
      <div class="campo"><label for="cf-piva">partita IVA (se titolare)</label><input id="cf-piva" name="piva" inputmode="numeric" maxlength="11"><small></small></div>
      <div class="campo"><label for="cf-telefono">telefono</label><input id="cf-telefono" name="telefono" type="tel" autocomplete="tel" required></div>
      <div class="campo"><label for="cf-enasarco">posizione Enasarco n. (se dovuta)</label><input id="cf-enasarco" name="enasarco" inputmode="numeric"></div>
      <div class="campo"><label for="cf-mail">e-mail</label><input id="cf-mail" name="mail" type="email" autocomplete="email" required><small></small></div>
      <div class="campo"><label for="cf-iban">IBAN per i pagamenti</label><input id="cf-iban" name="iban" autocapitalize="characters" maxlength="34" required><small></small></div>
    </div>
<p>(di seguito, il “Sub-agente”; la Società e il Sub-agente, insieme, le “Parti”),</p>
<div class="centro">CON L'INTERVENTO DI</div>
<div class="campi">
      <div class="campo"><label for="cf-rif_nome">Agente di riferimento</label><input id="cf-rif_nome" name="rif_nome" required></div>
      <div class="campo"><label for="cf-rif_piva">partita IVA</label><input id="cf-rif_piva" name="rif_piva" inputmode="numeric" maxlength="11"><small></small></div>
      <div class="campo lungo"><label for="cf-rif_zona">zona</label><input id="cf-rif_zona" name="rif_zona" required></div>
    </div>
<p>(di seguito, l'“Agente di riferimento”), che sottoscrive per accettazione delle clausole che lo riguardano.</p>
<div class="centro">PREMESSO CHE</div>
<ul class="el">
  <li data-l="a">la Società, attraverso il marchio AncheCasa, gestisce una piattaforma dedicata ai servizi per la casa e per le imprese che mette in relazione privati, aziende, imprese e professionisti, offre, direttamente o tramite aziende partner, un catalogo di prodotti e servizi in continua espansione (software gestionali, servizi per la sicurezza e la formazione, utenze, servizi per la casa e per le imprese) e realizza, anche in qualità di general contractor, lavori di ristrutturazione tramite imprese partner selezionate;</li>
  <li data-l="b">la Società ha costituito una rete commerciale articolata in un Responsabile Rete Italia, Responsabili Sviluppo Rete per le aree Nord, Centro e Sud e Isole, capi area regionali, agenti, sub-agenti e segnalatori, nella quale ogni ruolo riceve una quota fissa dei ricavi secondo regole uniformi;</li>
  <li data-l="c">il Sub-agente intende operare all'interno della rete AncheCasa sotto l'Agente di riferimento, inizialmente anche senza partita IVA, con l'impegno a regolarizzare la propria posizione alle condizioni dell'art. 6;</li>
</ul>
<p>tutto ciò premesso, le Parti convengono e stipulano quanto segue.</p>
<h2>ART. 1 – PREMESSE E ALLEGATI</h2>
<p>1.1 Le premesse e gli allegati costituiscono parte integrante e sostanziale del presente contratto. Costituiscono allegati l'Allegato A – “Quote della rete”, l'Allegato B – “Servizi AncheCasa” e l'Allegato C – “Regole comuni della rete”.</p>
<h2>ART. 2 – OGGETTO E NATURA DELL'INCARICO</h2>
<p>2.1 La Società conferisce al Sub-agente l'incarico di promuovere i Servizi AncheCasa e di segnalare e acquisire clienti nella zona dell'Agente di riferimento, operando sotto la guida di quest'ultimo.</p>
<p>2.2 Due fasi. Il rapporto si svolge in due fasi: (i) la Fase di prova, in cui il Sub-agente privo di partita IVA opera come collaboratore autonomo occasionale ai sensi degli artt. 2222 e seguenti c.c., in piena autonomia, senza vincoli di orario e con mezzi propri; (ii) la Fase professionale, dal momento in cui il Sub-agente apre partita IVA e si iscrive come agente o procacciatore, in cui il rapporto prosegue come sub-agenzia secondo le norme di legge applicabili. Se il Sub-agente è già titolare di partita IVA alla firma, si applica direttamente la Fase professionale.</p>
<p>2.3 L'incarico non attribuisce esclusiva di zona e non costituisce rapporto di lavoro subordinato. Possono essere acquisiti clienti in tutto il territorio nazionale: i clienti acquisiti fuori zona restano attribuiti secondo l'Allegato C.</p>
<p>2.4 Servizi promuovibili. Il Sub-agente promuove tutti i prodotti e servizi offerti da AncheCasa, propri o di aziende partner (i “Servizi AncheCasa”), elencati a titolo esemplificativo nell'Allegato B. L'incarico si estende automaticamente a ogni nuovo prodotto, servizio o software che la Società renderà disponibile in futuro, dal momento della sua pubblicazione nel listino o nella dashboard AncheCasa. La Società può modificare, sospendere o ritirare singoli Servizi senza che ciò costituisca modifica del presente contratto.</p>
<p>2.5 Il Sub-agente non ha potere di rappresentanza della Società, salvo procura scritta. È fatto divieto di sottoscrivere contratti, incassare somme, rilasciare quietanze, concedere sconti o assumere impegni in nome o per conto della Società. Prezzi, preventivi e condizioni contrattuali sono determinati esclusivamente dalla Società. I contratti con i clienti si intendono conclusi solo con l'accettazione scritta della Società.</p>
<p>2.6 La Società provvede agli adempimenti di legge connessi al conferimento dell'incarico, ivi inclusa, nella Fase di prova e ove dovuta, la comunicazione preventiva all'Ispettorato Territoriale del Lavoro.</p>
<h2>ART. 3 – ATTIVITÀ E RAPPORTO CON L'AGENTE DI RIFERIMENTO</h2>
<p>3.1 Il Sub-agente presenta la Società, individua e acquisisce clienti, li registra nel sistema informatico AncheCasa prima di ogni ulteriore passaggio e affianca l'Agente di riferimento nelle trattative.</p>
<p>3.2 L'Agente di riferimento affianca e forma il Sub-agente. Il Sub-agente rendiconta mensilmente i propri risultati alla Società e all'Agente di riferimento.</p>
<p>3.3 Se il rapporto con l'Agente di riferimento cessa, la Società assegna il Sub-agente a un altro agente, alle medesime condizioni.</p>
<h2>ART. 4 – PROVVIGIONI E COMPENSI</h2>
<p>4.1 Al Sub-agente spettano esclusivamente provvigioni commisurate ai risultati, determinate secondo l'Allegato A. Non sono previsti compensi fissi, rimborsi spese o anticipi, salvo diverso accordo scritto. Le percentuali dell'Allegato A restano invariate per tutta la durata del contratto.</p>
<p>4.2 Maturazione. Il diritto alla provvigione matura esclusivamente sulle somme effettivamente incassate dalla Società per gli affari andati a buon fine. Per i cantieri la provvigione matura per tranche, in proporzione agli incassi: 30% alla firma del contratto con il cliente e all'incasso dell'acconto; 30% a metà dei lavori; 40% al collaudo. In caso di mancato pagamento, recesso, risoluzione o rimborso al cliente, la provvigione relativa non matura ovvero, se già corrisposta, è restituita o compensata con le provvigioni successive.</p>
<p>4.3 Pagamento. Entro il giorno 10 di ciascun mese la Società trasmette il prospetto dei compensi maturati nel mese precedente e provvede al pagamento entro il giorno 20 mediante bonifico, dietro ricevuta per prestazione occasionale nella Fase di prova o fattura nella Fase professionale, nei limiti dell'art. 6.</p>
<p>4.4 Oneri. Nella Fase di prova la Società opera la ritenuta d'acconto nella misura di legge (attualmente 20%). Nella Fase professionale si applicano le ritenute fiscali e, ove dovuti, i contributi Enasarco nella misura di legge.</p>
<p>4.5 Base di calcolo. Le quote sono calcolate sull'utile della Società, determinato secondo la sezione A.3 dell'Allegato A. L'estratto conto riporta, per ciascun affare, la base di calcolo e la provvigione spettante; la Società non è tenuta a comunicare i singoli costi né i prezzi delle imprese e dei fornitori.</p>
<p>4.6 Clienti privati. Sull'iscrizione dei clienti privati e sui Servizi da essi acquistati non è prevista alcuna provvigione: le provvigioni spettano solo sui lavori, secondo la sezione A.2 dell'Allegato A e l'art. C.6 dell'Allegato C.</p>
<p>4.7 Ripartizione con l'Agente di riferimento. Sulle quote di ruolo maturate dal Sub-agente secondo l'Allegato A, al Sub-agente spetta il 70% e all'Agente di riferimento il 30%. La Società paga direttamente a ciascuno la parte di propria spettanza.</p>
<h2>ART. 5 – RISERVATEZZA, DATI PERSONALI E MARCHIO</h2>
<p>5.1 Il Sub-agente si obbliga a mantenere strettamente riservate tutte le informazioni della Società di cui venga a conoscenza (a titolo esemplificativo: clienti, imprese partner, prezzi, margini, provvigioni, software, strategie commerciali) e a non utilizzarle per fini diversi dall'incarico. L'obbligo permane per tre (3) anni dalla cessazione del contratto.</p>
<p>5.2 Il Sub-agente tratta i dati personali dei clienti esclusivamente per l'esecuzione dell'incarico, quale soggetto autorizzato o responsabile del trattamento designato dalla Società ai sensi del Regolamento (UE) 2016/679 e del D.Lgs. 196/2003, attenendosi alle istruzioni ricevute. I dati sono inseriti esclusivamente nel sistema AncheCasa e non possono essere conservati in archivi personali. I clienti acquisiti restano clienti della Società.</p>
<p>5.3 Il marchio AncheCasa, i materiali e il kit restano di proprietà esclusiva della Società. Alla cessazione del contratto sono restituiti entro sette (7) giorni e ne cessa ogni utilizzo.</p>
<p>5.4 Il Sub-agente presenta la Società in modo veritiero e corretto e non promette prezzi, tempi o condizioni non approvati dalla Società.</p>
<h2>ART. 6 – FASE DI PROVA, LIMITE DEI PAGAMENTI E PASSAGGIO ALLA FASE PROFESSIONALE</h2>
<p>6.1 Limite dei pagamenti. Nella Fase di prova la Società corrisponde al Sub-agente compensi fino a un massimo di € 5.000,00 (cinquemila/00) lordi complessivi.</p>
<p>6.2 Compensi sospesi. I compensi maturati oltre € 5.000,00 lordi restano regolarmente maturati e sono indicati nel prospetto mensile come “compensi sospesi”, ma non sono pagati finché il Sub-agente non abbia aperto partita IVA e ottenuto l'iscrizione richiesta per l'attività di agente o procacciatore d'affari. I compensi sospesi sono corrisposti entro trenta (30) giorni dalla regolarizzazione, dietro fattura, e non producono interessi.</p>
<p>6.3 Termine della Fase di prova. La Fase di prova termina al primo dei seguenti eventi: (i) raggiungimento di € 5.000,00 lordi di compensi maturati; (ii) decorso di dodici (12) mesi dalla firma. Entro trenta (30) giorni dal termine il Sub-agente sceglie se:</p>
<ul class="el">
  <li data-l="a">proseguire, aprendo partita IVA e ottenendo l'iscrizione richiesta; in tal caso conserva i propri clienti e il rapporto prosegue nella Fase professionale;</li>
  <li data-l="b">uscire dalla rete; in tal caso il contratto cessa, i clienti acquisiti dal Sub-agente passano all'Agente di riferimento e al Sub-agente restano dovuti i soli compensi maturati, nei limiti degli artt. 6.1 e 6.2.</li>
</ul>
<p>6.4 In mancanza di scelta entro il termine dell'art. 6.3 si applica la lettera b).</p>
<h2>ART. 7 – CONCORRENZA</h2>
<p>7.1 Per la durata del contratto il Sub-agente non promuove servizi in concorrenza con quelli della Società senza il suo consenso scritto e non svia clienti, imprese partner o componenti della rete a favore proprio o di terzi.</p>
<h2>ART. 8 – DURATA E RECESSO</h2>
<p>8.1 Il contratto decorre dalla data di sottoscrizione ed è a tempo indeterminato, fermo quanto previsto dall'art. 6.</p>
<p>8.2 Nella Fase di prova ciascuna Parte può recedere con preavviso scritto di quindici (15) giorni. Nella Fase professionale si applica il preavviso previsto dall'art. 1750 c.c.</p>
<p>8.3 La Società può recedere senza preavviso in caso di violazione degli artt. 2.5, 5 e 7 o di condotte lesive della sua immagine.</p>
<p>8.4 Alla cessazione: (i) sono corrisposti i compensi maturati, nei limiti dell'art. 6; (ii) i clienti restano della Società e sono affidati all'Agente di riferimento.</p>
<h2>ART. 9 – DISPOSIZIONI FINALI</h2>
<p>9.1 Ogni modifica al presente contratto richiede la forma scritta a pena di nullità.</p>
<p>9.2 Il contratto non può essere ceduto senza il consenso scritto della Società.</p>
<p>9.3 L'eventuale invalidità di una clausola non comporta l'invalidità delle restanti.</p>
<p>9.4 Per quanto non espressamente previsto si applicano le disposizioni del codice civile e, per la Fase professionale, le norme in materia di contratto di agenzia (artt. 1742–1753 c.c.). Per ogni controversia relativa al presente contratto è competente in via esclusiva il Foro di Santa Maria Capua Vetere, salvo i casi di competenza inderogabile previsti dalla legge.</p>
<h2>ALLEGATO A – QUOTE DELLA RETE</h2>
<p>Spettanze del Sub-agente. Le quote sono espresse in percentuale della quota destinata alla rete; sulla quota di ruolo maturata, il 70% spetta al Sub-agente e il 30% all'Agente di riferimento (art. 4.7).</p>
<p>A.1 Rendite (tutti i Servizi AncheCasa delle sezioni B.1–B.6 e B.8 dell'Allegato B, propri o di aziende partner, presenti e futuri). Alla rete è destinato il 35% dell'utile della Società su ciascun servizio, in misura fissa per tutta la durata del rapporto, compresi i rinnovi degli abbonamenti, ripartito come segue. L'utile è calcolato come indicato alla sezione A.3.</p>
<div class="tab"><table>
      <thead><tr><th>Ruolo</th><th>Quota della rete</th><th>Spettanza</th></tr></thead>
      <tbody>
        <tr><td>Chi porta il cliente</td><td>70%</td><td>Sui clienti acquisiti personalmente (70% al Sub-agente, 30% all'Agente di riferimento)</td></tr>
        <tr><td>Sviluppo rete</td><td>17%</td><td>Non spettante</td></tr>
        <tr><td>Capo area</td><td>8%</td><td>Non spettante</td></tr>
        <tr><td>Responsabile Rete Italia</td><td>5%</td><td>Non spettante</td></tr>
      </tbody></table></div>
<p>Cliente segnalato da un terzo: a chi chiude il 45% e a chi segnala il 25% della quota della rete.</p>
<p>A.2 Cantieri e subappalti. Alla rete è destinato il 40% dell'utile di ciascun cantiere ovvero, nei subappalti, della quota spettante alla Società, calcolati come indicato alla sezione A.3, ripartito come segue.</p>
<div class="tab"><table>
      <thead><tr><th>Ruolo</th><th>Quota della rete</th><th>Spettanza</th></tr></thead>
      <tbody>
        <tr><td>Chi segnala</td><td>10%</td><td>Se ha acquisito il cliente</td></tr>
        <tr><td>Chi chiude</td><td>25%</td><td>Se chiude personalmente</td></tr>
        <tr><td>Chi segue il cantiere</td><td>30%</td><td>Se segue personalmente</td></tr>
        <tr><td>Chi ha portato l'impresa</td><td>10%</td><td>Se ha portato l'impresa</td></tr>
        <tr><td>Sviluppo rete</td><td>12%</td><td>Non spettante</td></tr>
        <tr><td>Capo area</td><td>8%</td><td>Non spettante</td></tr>
        <tr><td>Responsabile Rete Italia</td><td>5%</td><td>Non spettante</td></tr>
      </tbody></table></div>
<p>A.3 Come si calcola l'utile. (a) Software (abbonamenti e moduli delle app AncheCasa, commissioni per lavoro, sponsorizzazioni): importo incassato al netto dell'IVA, meno le commissioni di pagamento sostenute, meno una quota fissa per i costi del software (sviluppo, server, assistenza) pari al 25% dell'importo incassato al netto dell'IVA. (b) Tutti gli altri servizi (luce e gas, telefonia, fornitori, finanza e assicurazioni, servizi per la casa e ogni altro servizio presente o futuro): compenso incassato dalla Società al netto dell'IVA, meno una quota fissa per i costi di gestione pari al 15% del compenso incassato al netto dell'IVA. (c) Cantieri: importo incassato dal cliente al netto dell'IVA, meno i costi diretti del cantiere (imprese e subappalti, materiali e forniture, oneri della sicurezza, spese tecniche e pratiche); le spese generali della Società non si sottraggono. Nei subappalti l'utile è la quota spettante alla Società, al netto dell'IVA. Le quote del 25% e del 15% restano invariate per tutta la durata del contratto, salvo accordo scritto.</p>
<p class="fine">Le quote si applicano nei limiti delle regole di maturazione (incasso e tranche). L'utile è determinato secondo la sezione A.3.</p>
<p class="fine">Quote in vigore dal 9 ottobre 2026, con l'introduzione del Responsabile Rete Italia: rendite 70% chi porta il cliente, 17% sviluppo rete, 8% capo area, 5% Responsabile Rete Italia; cantieri 10% chi segnala, 25% chi chiude, 30% chi segue, 10% chi ha portato l'impresa, 12% sviluppo rete, 8% capo area, 5% Responsabile Rete Italia. Calcolo dell'utile (sezione A.3) in vigore dal 12 ottobre 2026.</p>
<h2>ALLEGATO B – SERVIZI ANCHECASA</h2>
    <p>Sono Servizi AncheCasa tutti i prodotti e servizi offerti dalla Società, direttamente o tramite aziende partner, presenti e futuri. L'elenco che segue è esemplificativo e non esaustivo; il listino aggiornato è sempre consultabile nella dashboard AncheCasa.</p>
    <div class="tab"><table>
      <thead><tr><th>Area</th><th>Prodotti e servizi</th></tr></thead>
      <tbody>
        <tr><td>B.1 Software gestionali per aziende</td><td>Pacchetto Ufficio (amministrazione, sicurezza, documenti, clienti, preventivi, fatture, recruitment, acquisti, fornitori) e moduli per mestiere: imprese edili e general contractor (gestione cantiere, presenze, rapportini, giornali, SAL, cronoprogramma, magazzino, mezzi, app di campo, analisi e partecipazione a gare); professionisti tecnici; artigiani e installatori (incluso SuperMastro); fornitori di materiali e mezzi, per vendita e noleggio.</td></tr>
        <tr><td>B.2 Sicurezza sul lavoro e formazione</td><td>Corsi obbligatori per lavoratori, preposti, dirigenti, RLS, datori di lavoro RSPP, RSPP e ASPP; antincendio; primo soccorso e BLSD; abilitazioni per attrezzature (carrelli, PLE, ponteggi, escavatori, gru); HACCP; GDPR; documenti e adempimenti per uffici, sedi e cantieri; gestione della sicurezza in appalto, anche tramite aziende partner.</td></tr>
        <tr><td>B.3 Utenze</td><td>Energia elettrica, gas e altre utenze per privati e imprese, tramite fornitori partner.</td></tr>
        <tr><td>B.4 Piattaforma e visibilità</td><td>Iscrizioni e abbonamenti alla piattaforma, profili aziendali, vetrine, pubblicazione di annunci e richieste, opportunità e aste immobiliari, strumenti di comunicazione con i clienti.</td></tr>
        <tr><td>B.5 Servizi per la casa e per le imprese</td><td>Manutenzioni, impianti, pulizie, traslochi e ogni altro servizio offerto tramite imprese, artigiani e professionisti iscritti ad AncheCasa.</td></tr>
        <tr><td>B.6 Servizi di aziende partner</td><td>Ogni prodotto o servizio di aziende convenzionate con AncheCasa, anche se commercializzato con marchio diverso.</td></tr>
        <tr><td>B.7 Lavori e cantieri</td><td>Bagni, ristrutturazioni e lavori edili realizzati da AncheCasa come general contractor; appalti e subappalti con imprese partner. Per questa area si applica la sezione A.2 dell'Allegato A.</td></tr>
        <tr><td>B.8 Nuovi servizi</td><td>Ogni nuovo prodotto, servizio o software introdotto dalla Società dopo la firma, dalla data di pubblicazione nel listino o nella dashboard AncheCasa.</td></tr>
      </tbody></table></div>
    <p class="fine">I prezzi e le condizioni di ciascun Servizio sono stabiliti esclusivamente dalla Società e possono variare nel tempo.</p>

    <h2>ALLEGATO C – REGOLE COMUNI DELLA RETE</h2>
    <p>Regole uguali per tutti i componenti della rete AncheCasa, in vigore dal 10 ottobre 2026. In caso di contrasto con il contratto prevalgono, per le materie qui regolate, le presenti regole.</p>
    <p>C.1 Ingresso nella rete. Si entra nella rete solo con proposta approvata dalla Società e dal Responsabile Rete Italia e, ove nominato, dal Responsabile Sviluppo Rete dell'area interessata. Ogni componente della rete può proporre nuove persone; gli incarichi sono conferiti esclusivamente dalla Società.</p>
    <p>C.2 Chi porta, tiene. Ogni persona che entra nella rete fa parte della linea di chi l'ha proposta, in qualunque regione operi. Le quote di linea dell'Allegato A (chi porta il cliente e, per i ruoli presenti nella linea, sviluppo rete e capo area) seguono la linea di chi ha acquisito il cliente, indipendentemente dalla regione in cui il cliente si trova. Per ciascun affare ogni quota di ruolo è riconosciuta una sola volta.</p>
    <p>C.3 Attribuzione dei clienti. Il cliente è attribuito a chi lo registra per primo nel sistema AncheCasa; fanno fede la data e l'ora registrate dal sistema. Le aziende sono identificate dalla partita IVA, i privati dal recapito telefonico o di posta elettronica. L'attribuzione permane finché il cliente resta attivo. Se un cliente è segnalato da un componente della rete e acquisito da un altro, si applica la ripartizione dell'Allegato A (45% a chi chiude, 25% a chi segnala).</p>
    <p>C.4 Iscrizioni dirette. L'azienda o l'artigiano che si iscrive direttamente alla piattaforma è attribuito: (a) al componente della rete di cui indica il codice al momento dell'iscrizione; (b) in mancanza, al componente che ne aveva registrato la partita IVA nei novanta (90) giorni precedenti; (c) in mancanza di entrambi, è cliente della Società ai sensi dell'art. C.5.</p>
    <p>C.5 Clienti della Società affidati. I clienti acquisiti direttamente dalla Società, anche tramite i suoi amministratori o il sito internet, possono essere affidati dalla Società a un componente della rete perché li segua. All'affidatario spetta il 50% della quota “chi porta il cliente” sui Servizi acquistati dal cliente affidato; su tali clienti non spettano le quote di sviluppo rete, capo area e Responsabile Rete Italia, che restano alla Società. Sui Servizi e sui lavori ulteriori procurati personalmente dall'affidatario spettano le quote ordinarie. L'affidatario contatta il cliente entro quarantotto (48) ore dall'affidamento; in mancanza la Società può affidarlo ad altri. Gli artigiani iscritti direttamente sono affidati solo dopo la verifica della Società.</p>
    <p>C.6 Clienti privati. Sull'iscrizione dei clienti privati e sui Servizi da essi acquistati non spetta alcuna provvigione. Le provvigioni sui privati spettano solo sui lavori, secondo la sezione A.2 dell'Allegato A. Il privato registrato da un componente della rete resta a lui collegato per dodici (12) mesi, che decorrono nuovamente da ogni contatto registrato nel sistema AncheCasa: se in tale periodo il privato commissiona un lavoro, anche contattando direttamente la Società, a quel componente spetta la quota “chi segnala”. Per i privati giunti direttamente alla Società la quota “chi segnala” resta alla Società.</p>
    <p>C.7 Territorio. Aree e regioni sono assegnate in base ai risultati registrati nel sistema AncheCasa, quando la Società, sentito il Responsabile Rete Italia, ritiene che i risultati lo consentano. Il capo area di una regione è di norma nominato quando nella regione operano almeno cinque (5) agenti attivi, ed è scelto tra chi vi ha costruito di più (persone attive e clienti attivi); lo stesso criterio vale per l'assegnazione delle aree ai Responsabili Sviluppo Rete. Con la nomina, il responsabile matura la propria quota di ruolo sugli affari della regione o dell'area acquisiti da componenti che non hanno un responsabile dello stesso ruolo nella propria linea, affianca sul posto la rete che vi opera e non toglie quote di linea già esistenti.</p>
    <p>C.8 Ruoli non presenti. Quando in una linea manca un ruolo e nessun responsabile territoriale ne ha diritto ai sensi dell'art. C.7, la relativa quota resta alla Società, salvo la quota del Responsabile Rete Italia prevista dal suo contratto.</p>
    <p>C.9 Trasparenza e obiettivi. Ogni componente della rete vede nel sistema AncheCasa i propri clienti, la propria linea, le provvigioni maturate e gli obiettivi. Gli obiettivi sono indicati dalla Società e dal Responsabile Rete Italia e hanno valore indicativo. Le linee decise dalla Società, anche nella sala strategia del sistema AncheCasa, costituiscono direttive commerciali generali.</p>
    <p>C.10 Documenti e firma nell'app. Le Parti convengono che contratti, circolari, regolamenti e loro modifiche possano essere sottoscritti anche con firma elettronica nel sistema AncheCasa, che registra l'identità dell'utente, la data, l'ora e il testo firmato; la Società mette a disposizione del firmatario copia del documento firmato. Le modifiche che riducono i diritti del componente della rete richiedono sempre il suo consenso espresso.</p>
`
  };

  AC.contrattiModelli["docs/AncheCasa-5Contratto-Responsabile-Rete-Italia.pdf"] = {
    versione: "10.10.2026",
    etichetta: "Rete commerciale AncheCasa · Versione 10.10.2026",
    titolo: "Contratto di agenzia con funzioni di Responsabile Rete Italia",
    sotto: "Responsabile Rete Italia · Rete commerciale AncheCasa",
    chiFirma: "Il Responsabile Rete Italia",
    nomeBreve: "Contratto Responsabile Rete Italia",
    approva: "Ai sensi e per gli effetti degli artt. 1341 e 1342 c.c. approvo specificamente le seguenti clausole: art. 2.3 (esclusione dell'esclusiva); art. 2.5 (divieto di rappresentanza); art. 4.2 (maturazione all'incasso e restituzione); art. 4.6 (assenza di provvigioni sui privati); art. 7.2 (revoca delle funzioni di coordinamento); art. 8.3 (recesso per giusta causa); art. 9.4 (foro competente); Allegato C, artt. C.2–C.8 (linea, attribuzione dei clienti, iscrizioni dirette, clienti affidati, clienti privati, territorio, ruoli non presenti).",
    corpo: `
<div class="centro">TRA</div>
    <p>PALUMBO INVESTMENT S.R.L., con sede legale in Teano (CE), Via Giusti n. 22, CAP 81057, codice fiscale, partita IVA e numero di iscrizione al Registro delle Imprese di Caserta 04724830619, REA CE-349941, PEC palumboinvestment@pec.it, in persona dell'Amministratrice Unica e legale rappresentante pro tempore, sig.ra Federica Palumbo, titolare del marchio e della piattaforma “AncheCasa” (di seguito, la “Società” o “AncheCasa”);</p>

    <div class="centro">E</div>
<div class="centro">E</div>
<div class="campi">
      <div class="campo lungo"><label for="cf-nome">Sig./Sig.ra ovvero ditta/società</label><input id="cf-nome" name="nome" autocomplete="name" required></div>
      <div class="campo"><label for="cf-luogo_nascita">nato/a a</label><input id="cf-luogo_nascita" name="luogo_nascita" required></div>
      <div class="campo"><label for="cf-data_nascita">il</label><input id="cf-data_nascita" name="data_nascita" type="date" required></div>
      <div class="campo lungo"><label for="cf-residenza">residenza / sede in</label><input id="cf-residenza" name="residenza" required></div>
      <div class="campo"><label for="cf-via">via / n.</label><input id="cf-via" name="via" required></div>
      <div class="campo"><label for="cf-cf">codice fiscale</label><input id="cf-cf" name="cf" autocapitalize="characters" maxlength="16" required><small></small></div>
      <div class="campo"><label for="cf-piva">partita IVA</label><input id="cf-piva" name="piva" inputmode="numeric" maxlength="11" required><small></small></div>
      <div class="campo"><label for="cf-rea">iscrizione agenti di commercio, REA n.</label><input id="cf-rea" name="rea" required></div>
      <div class="campo"><label for="cf-cciaa">CCIAA di</label><input id="cf-cciaa" name="cciaa" required></div>
      <div class="campo"><label for="cf-enasarco">posizione Enasarco n.</label><input id="cf-enasarco" name="enasarco" inputmode="numeric"></div>
      <div class="campo"><label for="cf-telefono">telefono</label><input id="cf-telefono" name="telefono" type="tel" autocomplete="tel" required></div>
      <div class="campo"><label for="cf-pec">PEC</label><input id="cf-pec" name="pec" type="email"><small></small></div>
      <div class="campo"><label for="cf-mail">e-mail</label><input id="cf-mail" name="mail" type="email" autocomplete="email" required><small></small></div>
      <div class="campo"><label for="cf-iban">IBAN per i pagamenti</label><input id="cf-iban" name="iban" autocapitalize="characters" maxlength="34" required><small></small></div>
    </div>
<p>agente di commercio regolarmente iscritto e titolare di partita IVA (di seguito, il “Responsabile Rete Italia”; la Società e il Responsabile Rete Italia, insieme, le “Parti”).</p>
<div class="centro">PREMESSO CHE</div>
<ul class="el">
  <li data-l="a">la Società, attraverso il marchio AncheCasa, gestisce una piattaforma dedicata ai servizi per la casa e per le imprese che mette in relazione privati, aziende, imprese e professionisti, offre, direttamente o tramite aziende partner, un catalogo di prodotti e servizi in continua espansione (software gestionali, servizi per la sicurezza e la formazione, utenze, servizi per la casa e per le imprese) e realizza, anche in qualità di general contractor, lavori di ristrutturazione tramite imprese partner selezionate;</li>
  <li data-l="b">la Società ha costituito una rete commerciale articolata in un Responsabile Rete Italia, Responsabili Sviluppo Rete per le aree Nord, Centro e Sud e Isole, capi area regionali, agenti, sub-agenti e segnalatori, nella quale ogni ruolo riceve una quota fissa dei ricavi secondo regole uniformi;</li>
  <li data-l="c">il Responsabile Rete Italia esercita professionalmente l'attività di agente di commercio e intende assumere, per conto della Società, l'incarico di promuovere i Servizi AncheCasa e di coordinare a livello nazionale la rete commerciale;</li>
  <li data-l="d">il Responsabile Rete Italia risponde direttamente alla Società e coordina i Responsabili Sviluppo Rete delle aree Nord, Centro e Sud e Isole;</li>
</ul>
<p>tutto ciò premesso, le Parti convengono e stipulano quanto segue.</p>
<h2>ART. 1 – PREMESSE E ALLEGATI</h2>
<p>1.1 Le premesse e gli allegati costituiscono parte integrante e sostanziale del presente contratto. Costituiscono allegati l'Allegato A – “Quote della rete”, l'Allegato B – “Servizi AncheCasa” e l'Allegato C – “Regole comuni della rete”.</p>
<h2>ART. 2 – OGGETTO E ZONA</h2>
<p>2.1 La Società conferisce al Responsabile Rete Italia, che accetta, l'incarico di agente ai sensi degli artt. 1742 e seguenti del codice civile per la promozione, in modo stabile, della conclusione di contratti aventi a oggetto i Servizi AncheCasa e i lavori realizzati dalla Società, nonché l'incarico di Responsabile Rete Italia per l'intero territorio nazionale.</p>
<p>2.2 Territorio. L'incarico riguarda l'intero territorio nazionale (il “Territorio”), articolato nelle aree Nord, Centro e Sud e Isole.</p>
<p>2.3 Esclusiva. In deroga all'art. 1743 c.c., l'incarico non attribuisce al Responsabile Rete Italia l'esclusiva di zona. La Società può operare nel Territorio direttamente e tramite Responsabili Sviluppo Rete, capi area, agenti, sub-agenti e segnalatori, che fanno parte della rete coordinata dal Responsabile Rete Italia. Il Responsabile Rete Italia può operare per altri preponenti purché non concorrenti, previa comunicazione scritta alla Società.</p>
<p>2.4 Servizi promuovibili. Il Responsabile Rete Italia promuove tutti i prodotti e servizi offerti da AncheCasa, propri o di aziende partner (i “Servizi AncheCasa”), elencati a titolo esemplificativo nell'Allegato B. L'incarico si estende automaticamente a ogni nuovo prodotto, servizio o software che la Società renderà disponibile in futuro, dal momento della sua pubblicazione nel listino o nella dashboard AncheCasa. La Società può modificare, sospendere o ritirare singoli Servizi senza che ciò costituisca modifica del presente contratto.</p>
<p>2.5 Il Responsabile Rete Italia non ha potere di rappresentanza della Società, salvo procura scritta. È fatto divieto di sottoscrivere contratti, incassare somme, rilasciare quietanze, concedere sconti o assumere impegni in nome o per conto della Società. Prezzi, preventivi e condizioni contrattuali sono determinati esclusivamente dalla Società. I contratti con i clienti si intendono conclusi solo con l'accettazione scritta della Società.</p>
<h2>ART. 3 – FUNZIONI DI RESPONSABILE RETE ITALIA</h2>
<p>3.1 Il Responsabile Rete Italia, in autonomia organizzativa e nel rispetto delle direttive commerciali generali della Società:</p>
<ul class="el">
  <li data-l="a">promuove i Servizi AncheCasa e acquisisce clienti nel Territorio;</li>
  <li data-l="b">individua e propone alla Società Responsabili Sviluppo Rete, capi area, agenti, sub-agenti e imprese partner; gli incarichi sono conferiti esclusivamente dalla Società;</li>
  <li data-l="c">coordina i Responsabili Sviluppo Rete e, tramite loro, i capi area, ne affianca l'attività e verifica la qualità del servizio reso ai clienti in tutto il Territorio;</li>
  <li data-l="d">propone alla Società l'apertura di nuove regioni con il relativo piano di sviluppo e cura l'applicazione uniforme del metodo AncheCasa e della formazione della rete;</li>
  <li data-l="e">registra ogni cliente e ogni attività nel sistema informatico AncheCasa e rendiconta mensilmente i risultati della rete nazionale.</li>
</ul>
<p>3.2 Dipendenza. Il Responsabile Rete Italia risponde direttamente alla Società. Coordina i Responsabili Sviluppo Rete e i capi area senza poteri di direzione sul loro rapporto contrattuale, che resta in capo alla Società.</p>
<p>3.3 Accesso ai dati. La Società mette a disposizione del Responsabile Rete Italia, nel sistema AncheCasa, i dati commerciali della rete nazionale (vendite, cantieri, provvigioni, recensioni), nei limiti necessari all'incarico e nel rispetto dell'art. 5.</p>
<p>3.4 Reggenza. La Società può affidare al Responsabile Rete Italia la reggenza temporanea di un'area o di una regione priva di responsabile, con quota stabilita per iscritto, fino alla relativa nomina.</p>
<p>3.5 Formazione. Eventuali attività di formazione della rete svolte dal Responsabile Rete Italia su richiesta della Società sono regolate e compensate con separato accordo scritto e non rientrano nelle provvigioni del presente contratto.</p>
<h2>ART. 4 – PROVVIGIONI E COMPENSI</h2>
<p>4.1 Al Responsabile Rete Italia spettano esclusivamente provvigioni commisurate ai risultati, determinate secondo l'Allegato A. Non sono previsti compensi fissi, rimborsi spese o anticipi, salvo diverso accordo scritto. Le percentuali dell'Allegato A restano invariate per tutta la durata del contratto.</p>
<p>4.2 Maturazione. Il diritto alla provvigione matura esclusivamente sulle somme effettivamente incassate dalla Società per gli affari andati a buon fine. Per i cantieri la provvigione matura per tranche, in proporzione agli incassi: 30% alla firma del contratto con il cliente e all'incasso dell'acconto; 30% a metà dei lavori; 40% al collaudo. In caso di mancato pagamento, recesso, risoluzione o rimborso al cliente, la provvigione relativa non matura ovvero, se già corrisposta, è restituita o compensata con le provvigioni successive.</p>
<p>4.3 Pagamento. Entro il giorno 10 di ciascun mese la Società trasmette l'estratto conto delle provvigioni maturate nel mese precedente, con l'indicazione degli affari e degli incassi a cui si riferiscono, e provvede al pagamento entro il giorno 20 mediante bonifico, dietro emissione di regolare fattura.</p>
<p>4.4 Oneri. La Società versa i contributi Enasarco nella misura di legge, trattenendo la quota a carico dell'agente, e opera le ritenute previste dalla normativa fiscale. Il FIRR e le indennità di fine rapporto spettano nei casi e nei limiti previsti dalla legge e dagli Accordi Economici Collettivi, ove applicabili.</p>
<p>4.5 Base di calcolo. Le quote sono calcolate sull'utile della Società, determinato secondo la sezione A.3 dell'Allegato A. L'estratto conto riporta, per ciascun affare, la base di calcolo e la provvigione spettante; la Società non è tenuta a comunicare i singoli costi né i prezzi delle imprese e dei fornitori.</p>
<p>4.6 Clienti privati. Sull'iscrizione dei clienti privati e sui Servizi da essi acquistati non è prevista alcuna provvigione: le provvigioni spettano solo sui lavori, secondo la sezione A.2 dell'Allegato A e l'art. C.6 dell'Allegato C.</p>
<p>4.7 Quota Rete Italia. Al Responsabile Rete Italia spetta la quota “Responsabile Rete Italia” dell'Allegato A su tutti gli affari del Territorio, inclusi quelli acquisiti da Responsabili Sviluppo Rete, capi area, agenti, sub-agenti e segnalatori, oltre alle quote di ruolo sui clienti acquisiti, chiusi o seguiti personalmente. Sui clienti della Società affidati ai sensi dell'art. C.5 dell'Allegato C la quota non spetta.</p>
<h2>ART. 5 – RISERVATEZZA, DATI PERSONALI E MARCHIO</h2>
<p>5.1 Il Responsabile Rete Italia si obbliga a mantenere strettamente riservate tutte le informazioni della Società di cui venga a conoscenza (a titolo esemplificativo: clienti, imprese partner, prezzi, margini, provvigioni, software, strategie commerciali) e a non utilizzarle per fini diversi dall'incarico. L'obbligo permane per tre (3) anni dalla cessazione del contratto.</p>
<p>5.2 Il Responsabile Rete Italia tratta i dati personali dei clienti esclusivamente per l'esecuzione dell'incarico, quale soggetto autorizzato o responsabile del trattamento designato dalla Società ai sensi del Regolamento (UE) 2016/679 e del D.Lgs. 196/2003, attenendosi alle istruzioni ricevute. I dati sono inseriti esclusivamente nel sistema AncheCasa e non possono essere conservati in archivi personali. I clienti acquisiti restano clienti della Società.</p>
<p>5.3 Il marchio AncheCasa, i materiali e il kit restano di proprietà esclusiva della Società. Alla cessazione del contratto sono restituiti entro sette (7) giorni e ne cessa ogni utilizzo.</p>
<p>5.4 Il Responsabile Rete Italia presenta la Società in modo veritiero e corretto e non promette prezzi, tempi o condizioni non approvati dalla Società.</p>
<h2>ART. 6 – CONCORRENZA</h2>
<p>6.1 Per la durata del contratto il Responsabile Rete Italia non promuove, direttamente o indirettamente, servizi in concorrenza con quelli della Società senza il suo consenso scritto.</p>
<p>6.2 Il Responsabile Rete Italia non può sviare a favore proprio o di terzi i clienti, le imprese partner e gli agenti della rete. Eventuali obblighi di non concorrenza successivi alla cessazione del rapporto sono validi solo se pattuiti per iscritto nei limiti e con l'indennità previsti dall'art. 1751-bis c.c.</p>
<h2>ART. 7 – OBIETTIVI</h2>
<p>7.1 La Società può indicare annualmente, per iscritto, obiettivi indicativi per il Territorio. Il mancato raggiungimento degli obiettivi non costituisce di per sé inadempimento, ma può essere valutato dalla Società ai fini della prosecuzione delle funzioni di coordinamento.</p>
<p>7.2 La Società può revocare le sole funzioni di Responsabile Rete Italia con preavviso scritto di sessanta (60) giorni, ferma la prosecuzione del rapporto di agenzia e delle provvigioni sui clienti propri.</p>
<h2>ART. 8 – DURATA E RECESSO</h2>
<p>8.1 Il contratto è a tempo indeterminato e decorre dalla data di sottoscrizione. I primi sei (6) mesi costituiscono periodo di prova, durante il quale ciascuna Parte può recedere con preavviso di quindici (15) giorni.</p>
<p>8.2 Superato il periodo di prova, ciascuna Parte può recedere con il preavviso previsto dall'art. 1750 c.c. e, ove applicabili, dagli Accordi Economici Collettivi, comunicato a mezzo PEC o raccomandata.</p>
<p>8.3 Ciascuna Parte può recedere senza preavviso per giusta causa. Costituiscono in ogni caso giusta causa la violazione degli artt. 2.5, 5 e 6 e le condotte lesive dell'immagine della Società.</p>
<p>8.4 Alla cessazione: (i) sono corrisposte le provvigioni sugli affari conclusi prima della cessazione, anche se incassati successivamente, secondo le regole dell'art. 4; (ii) i clienti restano della Società e sono affidati alla rete dell'area di competenza; (iii) spettano le indennità di legge nei casi previsti.</p>
<h2>ART. 9 – DISPOSIZIONI FINALI</h2>
<p>9.1 Ogni modifica al presente contratto richiede la forma scritta a pena di nullità.</p>
<p>9.2 Il contratto non può essere ceduto senza il consenso scritto della Società.</p>
<p>9.3 L'eventuale invalidità di una clausola non comporta l'invalidità delle restanti.</p>
<p>9.4 Per quanto non espressamente previsto si applicano le disposizioni del codice civile in materia di contratto di agenzia (artt. 1742–1753 c.c.) e, ove applicabili, gli Accordi Economici Collettivi. Per ogni controversia relativa al presente contratto è competente in via esclusiva il Foro di Santa Maria Capua Vetere, salvo i casi di competenza inderogabile previsti dalla legge.</p>
<h2>ALLEGATO A – QUOTE DELLA RETE</h2>
<p>Spettanze del Responsabile Rete Italia. Le quote sono espresse in percentuale della quota destinata alla rete.</p>
<p>A.1 Rendite (tutti i Servizi AncheCasa delle sezioni B.1–B.6 e B.8 dell'Allegato B, propri o di aziende partner, presenti e futuri). Alla rete è destinato il 35% dell'utile della Società su ciascun servizio, in misura fissa per tutta la durata del rapporto, compresi i rinnovi degli abbonamenti, ripartito come segue. L'utile è calcolato come indicato alla sezione A.3.</p>
<div class="tab"><table>
      <thead><tr><th>Ruolo</th><th>Quota della rete</th><th>Spettanza</th></tr></thead>
      <tbody>
        <tr><td>Chi porta il cliente</td><td>70%</td><td>Sui clienti acquisiti personalmente</td></tr>
        <tr><td>Sviluppo rete</td><td>17%</td><td>Non spettante (Responsabile Sviluppo Rete)</td></tr>
        <tr><td>Capo area</td><td>8%</td><td>Non spettante (capo area della regione)</td></tr>
        <tr><td>Responsabile Rete Italia</td><td>5%</td><td>Su tutti gli affari del territorio nazionale</td></tr>
      </tbody></table></div>
<p>Cliente segnalato da un terzo: a chi chiude il 45% e a chi segnala il 25% della quota della rete.</p>
<p>A.2 Cantieri e subappalti. Alla rete è destinato il 40% dell'utile di ciascun cantiere ovvero, nei subappalti, della quota spettante alla Società, calcolati come indicato alla sezione A.3, ripartito come segue.</p>
<div class="tab"><table>
      <thead><tr><th>Ruolo</th><th>Quota della rete</th><th>Spettanza</th></tr></thead>
      <tbody>
        <tr><td>Chi segnala</td><td>10%</td><td>Se ha acquisito il cliente</td></tr>
        <tr><td>Chi chiude</td><td>25%</td><td>Se chiude personalmente</td></tr>
        <tr><td>Chi segue il cantiere</td><td>30%</td><td>Se segue personalmente</td></tr>
        <tr><td>Chi ha portato l'impresa</td><td>10%</td><td>Se ha portato l'impresa</td></tr>
        <tr><td>Sviluppo rete</td><td>12%</td><td>Non spettante (Responsabile Sviluppo Rete)</td></tr>
        <tr><td>Capo area</td><td>8%</td><td>Non spettante (capo area della regione)</td></tr>
        <tr><td>Responsabile Rete Italia</td><td>5%</td><td>Su tutti i cantieri del territorio nazionale</td></tr>
      </tbody></table></div>
<p>A.3 Come si calcola l'utile. (a) Software (abbonamenti e moduli delle app AncheCasa, commissioni per lavoro, sponsorizzazioni): importo incassato al netto dell'IVA, meno le commissioni di pagamento sostenute, meno una quota fissa per i costi del software (sviluppo, server, assistenza) pari al 25% dell'importo incassato al netto dell'IVA. (b) Tutti gli altri servizi (luce e gas, telefonia, fornitori, finanza e assicurazioni, servizi per la casa e ogni altro servizio presente o futuro): compenso incassato dalla Società al netto dell'IVA, meno una quota fissa per i costi di gestione pari al 15% del compenso incassato al netto dell'IVA. (c) Cantieri: importo incassato dal cliente al netto dell'IVA, meno i costi diretti del cantiere (imprese e subappalti, materiali e forniture, oneri della sicurezza, spese tecniche e pratiche); le spese generali della Società non si sottraggono. Nei subappalti l'utile è la quota spettante alla Società, al netto dell'IVA. Le quote del 25% e del 15% restano invariate per tutta la durata del contratto, salvo accordo scritto.</p>
<p class="fine">Le quote si applicano nei limiti delle regole di maturazione (incasso e tranche). L'utile è determinato secondo la sezione A.3.</p>
<p class="fine">Quote in vigore dal 9 ottobre 2026, con l'introduzione del Responsabile Rete Italia: rendite 70% chi porta il cliente, 17% sviluppo rete, 8% capo area, 5% Responsabile Rete Italia; cantieri 10% chi segnala, 25% chi chiude, 30% chi segue, 10% chi ha portato l'impresa, 12% sviluppo rete, 8% capo area, 5% Responsabile Rete Italia. Calcolo dell'utile (sezione A.3) in vigore dal 12 ottobre 2026.</p>
<h2>ALLEGATO B – SERVIZI ANCHECASA</h2>
    <p>Sono Servizi AncheCasa tutti i prodotti e servizi offerti dalla Società, direttamente o tramite aziende partner, presenti e futuri. L'elenco che segue è esemplificativo e non esaustivo; il listino aggiornato è sempre consultabile nella dashboard AncheCasa.</p>
    <div class="tab"><table>
      <thead><tr><th>Area</th><th>Prodotti e servizi</th></tr></thead>
      <tbody>
        <tr><td>B.1 Software gestionali per aziende</td><td>Pacchetto Ufficio (amministrazione, sicurezza, documenti, clienti, preventivi, fatture, recruitment, acquisti, fornitori) e moduli per mestiere: imprese edili e general contractor (gestione cantiere, presenze, rapportini, giornali, SAL, cronoprogramma, magazzino, mezzi, app di campo, analisi e partecipazione a gare); professionisti tecnici; artigiani e installatori (incluso SuperMastro); fornitori di materiali e mezzi, per vendita e noleggio.</td></tr>
        <tr><td>B.2 Sicurezza sul lavoro e formazione</td><td>Corsi obbligatori per lavoratori, preposti, dirigenti, RLS, datori di lavoro RSPP, RSPP e ASPP; antincendio; primo soccorso e BLSD; abilitazioni per attrezzature (carrelli, PLE, ponteggi, escavatori, gru); HACCP; GDPR; documenti e adempimenti per uffici, sedi e cantieri; gestione della sicurezza in appalto, anche tramite aziende partner.</td></tr>
        <tr><td>B.3 Utenze</td><td>Energia elettrica, gas e altre utenze per privati e imprese, tramite fornitori partner.</td></tr>
        <tr><td>B.4 Piattaforma e visibilità</td><td>Iscrizioni e abbonamenti alla piattaforma, profili aziendali, vetrine, pubblicazione di annunci e richieste, opportunità e aste immobiliari, strumenti di comunicazione con i clienti.</td></tr>
        <tr><td>B.5 Servizi per la casa e per le imprese</td><td>Manutenzioni, impianti, pulizie, traslochi e ogni altro servizio offerto tramite imprese, artigiani e professionisti iscritti ad AncheCasa.</td></tr>
        <tr><td>B.6 Servizi di aziende partner</td><td>Ogni prodotto o servizio di aziende convenzionate con AncheCasa, anche se commercializzato con marchio diverso.</td></tr>
        <tr><td>B.7 Lavori e cantieri</td><td>Bagni, ristrutturazioni e lavori edili realizzati da AncheCasa come general contractor; appalti e subappalti con imprese partner. Per questa area si applica la sezione A.2 dell'Allegato A.</td></tr>
        <tr><td>B.8 Nuovi servizi</td><td>Ogni nuovo prodotto, servizio o software introdotto dalla Società dopo la firma, dalla data di pubblicazione nel listino o nella dashboard AncheCasa.</td></tr>
      </tbody></table></div>
    <p class="fine">I prezzi e le condizioni di ciascun Servizio sono stabiliti esclusivamente dalla Società e possono variare nel tempo.</p>

    <h2>ALLEGATO C – REGOLE COMUNI DELLA RETE</h2>
    <p>Regole uguali per tutti i componenti della rete AncheCasa, in vigore dal 10 ottobre 2026. In caso di contrasto con il contratto prevalgono, per le materie qui regolate, le presenti regole.</p>
    <p>C.1 Ingresso nella rete. Si entra nella rete solo con proposta approvata dalla Società e dal Responsabile Rete Italia e, ove nominato, dal Responsabile Sviluppo Rete dell'area interessata. Ogni componente della rete può proporre nuove persone; gli incarichi sono conferiti esclusivamente dalla Società.</p>
    <p>C.2 Chi porta, tiene. Ogni persona che entra nella rete fa parte della linea di chi l'ha proposta, in qualunque regione operi. Le quote di linea dell'Allegato A (chi porta il cliente e, per i ruoli presenti nella linea, sviluppo rete e capo area) seguono la linea di chi ha acquisito il cliente, indipendentemente dalla regione in cui il cliente si trova. Per ciascun affare ogni quota di ruolo è riconosciuta una sola volta.</p>
    <p>C.3 Attribuzione dei clienti. Il cliente è attribuito a chi lo registra per primo nel sistema AncheCasa; fanno fede la data e l'ora registrate dal sistema. Le aziende sono identificate dalla partita IVA, i privati dal recapito telefonico o di posta elettronica. L'attribuzione permane finché il cliente resta attivo. Se un cliente è segnalato da un componente della rete e acquisito da un altro, si applica la ripartizione dell'Allegato A (45% a chi chiude, 25% a chi segnala).</p>
    <p>C.4 Iscrizioni dirette. L'azienda o l'artigiano che si iscrive direttamente alla piattaforma è attribuito: (a) al componente della rete di cui indica il codice al momento dell'iscrizione; (b) in mancanza, al componente che ne aveva registrato la partita IVA nei novanta (90) giorni precedenti; (c) in mancanza di entrambi, è cliente della Società ai sensi dell'art. C.5.</p>
    <p>C.5 Clienti della Società affidati. I clienti acquisiti direttamente dalla Società, anche tramite i suoi amministratori o il sito internet, possono essere affidati dalla Società a un componente della rete perché li segua. All'affidatario spetta il 50% della quota “chi porta il cliente” sui Servizi acquistati dal cliente affidato; su tali clienti non spettano le quote di sviluppo rete, capo area e Responsabile Rete Italia, che restano alla Società. Sui Servizi e sui lavori ulteriori procurati personalmente dall'affidatario spettano le quote ordinarie. L'affidatario contatta il cliente entro quarantotto (48) ore dall'affidamento; in mancanza la Società può affidarlo ad altri. Gli artigiani iscritti direttamente sono affidati solo dopo la verifica della Società.</p>
    <p>C.6 Clienti privati. Sull'iscrizione dei clienti privati e sui Servizi da essi acquistati non spetta alcuna provvigione. Le provvigioni sui privati spettano solo sui lavori, secondo la sezione A.2 dell'Allegato A. Il privato registrato da un componente della rete resta a lui collegato per dodici (12) mesi, che decorrono nuovamente da ogni contatto registrato nel sistema AncheCasa: se in tale periodo il privato commissiona un lavoro, anche contattando direttamente la Società, a quel componente spetta la quota “chi segnala”. Per i privati giunti direttamente alla Società la quota “chi segnala” resta alla Società.</p>
    <p>C.7 Territorio. Aree e regioni sono assegnate in base ai risultati registrati nel sistema AncheCasa, quando la Società, sentito il Responsabile Rete Italia, ritiene che i risultati lo consentano. Il capo area di una regione è di norma nominato quando nella regione operano almeno cinque (5) agenti attivi, ed è scelto tra chi vi ha costruito di più (persone attive e clienti attivi); lo stesso criterio vale per l'assegnazione delle aree ai Responsabili Sviluppo Rete. Con la nomina, il responsabile matura la propria quota di ruolo sugli affari della regione o dell'area acquisiti da componenti che non hanno un responsabile dello stesso ruolo nella propria linea, affianca sul posto la rete che vi opera e non toglie quote di linea già esistenti.</p>
    <p>C.8 Ruoli non presenti. Quando in una linea manca un ruolo e nessun responsabile territoriale ne ha diritto ai sensi dell'art. C.7, la relativa quota resta alla Società, salvo la quota del Responsabile Rete Italia prevista dal suo contratto.</p>
    <p>C.9 Trasparenza e obiettivi. Ogni componente della rete vede nel sistema AncheCasa i propri clienti, la propria linea, le provvigioni maturate e gli obiettivi. Gli obiettivi sono indicati dalla Società e dal Responsabile Rete Italia e hanno valore indicativo. Le linee decise dalla Società, anche nella sala strategia del sistema AncheCasa, costituiscono direttive commerciali generali.</p>
    <p>C.10 Documenti e firma nell'app. Le Parti convengono che contratti, circolari, regolamenti e loro modifiche possano essere sottoscritti anche con firma elettronica nel sistema AncheCasa, che registra l'identità dell'utente, la data, l'ora e il testo firmato; la Società mette a disposizione del firmatario copia del documento firmato. Le modifiche che riducono i diritti del componente della rete richiedono sempre il suo consenso espresso.</p>
`
  };

  /* 11.10.2026: l'Allegato B accorciato (senza BIM 5D e senza i mestieri nascosti) è una nuova versione.
     Non si firma finché Nando non la sblocca. Chi ha firmato il 10.10.2026 resta su quel testo. */
  const BREVE = "analisi e partecipazione a gare); professionisti tecnici; artigiani";
  const LUNGA = "analisi e partecipazione a gare, BIM 5D); professionisti tecnici; condomini e amministratori; agenzie immobiliari; industria; logistica e trasporti; alberghi e ristorazione; negozi; artigiani";
  Object.keys(AC.contrattiModelli).slice().forEach(function (k) {
    const m = AC.contrattiModelli[k];
    if (!m || m.versione !== "10.10.2026") return;
    AC.contrattiModelli["bozza-1110/" + k] = Object.assign({}, m, {
      versione: "11.10.2026",
      firmabile: false,
      etichetta: String(m.etichetta || "").replace("10.10.2026", "11.10.2026") + " · da far vedere all'avvocato, non firmabile"
    });
    if (m.corpo && m.corpo.indexOf(BREVE) >= 0) m.corpo = m.corpo.split(BREVE).join(LUNGA);
    m.firmabile = true;
  });
})();
