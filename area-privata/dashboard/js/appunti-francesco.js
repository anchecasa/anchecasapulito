/* ADMIN · Appunti per Francesco (11.10.2026).
   Quando Francesco entra dal suo computer, la dashboard si apre su questa pagina.
   Gli altri admin la trovano nel menu, accanto a Task. */
(function () {
  const AC = window.AC;
  const { html } = AC.ui;
  const V = AC.views;

  V.appunti = {
    title: "Appunti per Francesco",
    sub: "Urgente di stasera, 11 ottobre 2026.",
    render(el) {
      el.innerHTML = html`<div class="card">
        <h2>Urgente · da fare tu, stasera</h2>
        <p>Nando ha pubblicato. Due cose le puoi fare solo tu.</p>
        <ol>
          <li><strong>DNS di entra.anchecasa.it.</strong> Record CNAME <strong>entra</strong> verso <strong>app-anchecasa.pages.dev</strong>, nuvola grigia, solo DNS. Il dominio è già aggiunto al progetto Cloudflare Pages «app-anchecasa», in attesa del record. L'app risponde già su https://app-anchecasa.pages.dev. Non ricollegare app.anchecasa.it.</li>
          <li><strong>Chiave Gemini.</strong> Sopralluogo Flash è online, la nota vocale si carica, e Google risponde che la chiave non è valida. In Supabase, segreti, sostituisci <strong>GEMINI_API_KEY</strong> con una chiave vera di Google AI. Poi entra come agente, apri un sopralluogo e manda un audio: devono tornare computo e stima.</li>
        </ol>
      </div>
      <div class="card">
        <h2>Già fatto · non rifarlo</h2>
        <ul>
          <li>Sito https://anchecasa.it con i prezzi visibili e la prova di 14 giorni. Area privata online. App su https://app-anchecasa.pages.dev, service worker ac-app-2.9.0.</li>
          <li>Funzioni nuove online: sopralluogo-flash, subappalti-mail, gare-analisi. Senza accesso rispondono accesso_richiesto. sdi-gateway resta accesa.</li>
          <li>Spente, codice in app-anchecasa/supabase/functions-archivio: parse-cv, scrape-company-site, installation-bids, omi-lookup, ordine-tracking, presentazione-mappa-search. Restano 3 posti liberi su 100.</li>
          <li>prezzi_visibili è true. Il modulo consulente ha scritto una riga di prova: prova-pubblicazione-1110@anchecasa.it. L'iscrizione con password è stata provata: l'account prova-iscrizione-1110@anchecasa.it è nato e la richiesta è nel database.</li>
          <li>app-15 è già eseguito. Tabelle app_soggetti e app_rubrica presenti, entrambe vuote perché le tabelle di partenza erano vuote. Non rilanciarlo.</li>
          <li>Le note vocali del sopralluogo ora si possono caricare (app-16). Manca solo la chiave Gemini, punto 2 qui sopra.</li>
          <li>SuperMastro SOS non è stato pubblicato: il sito online è ancora quello di prima, l'admin si apre senza il login nuovo.</li>
          <li>Magazine, AncheSicura e gli store non sono stati toccati. Il contratto firmabile è solo la versione del 10.10.2026.</li>
        </ul>
        <p>Il dettaglio è nel file APPUNTI-FRANCESCO.md, nella cartella principale.</p>
      </div>
      <div class="card">
        <h2>Gare private, già scritte prima</h2>
        <p>Le gare private stanno nel cruscotto Next, non in questa area privata e non sul sito.</p>
        <p>Il programma è nella cartella <strong>BIM-SICUR\\ecosistema-anchecasa</strong>, ramo <strong>feature/admin-eprocurement-button</strong>.</p>
        <p>Quel cruscotto non è online. Non ha un repository git remoto e non è collegato a Vercel. La voce Bandi di questa dashboard è AncheBandi, un elenco pubblico. Non è questo modulo.</p>
      </div>
      <div class="card">
        <h2>A cosa serve</h2>
        <p>Un'impresa mette a gara un pacchetto di lavoro. Invita i fornitori dall'Albo, oppure lascia la gara aperta. I fornitori mandano l'offerta a busta chiusa. L'impresa vede gli importi solo dopo la chiusura e poi aggiudica.</p>
        <p>Pagine del cruscotto, quando sarà acceso: lista e nuovo pacchetto, dettaglio con documenti e inviti, portale del fornitore.</p>
        <p>Il menu «Gestione e-Procurement &amp; Subappalti» lo vede solo chi è admin di piattaforma oppure ha il ruolo <strong>general_contractor_buyer</strong>.</p>
        <p>L'Albo non è una tabella nuova. Un fornitore è un'<strong>app_org</strong> con tipo fornitore e stato attiva.</p>
      </div>
      <div class="card">
        <h2>Già su Supabase</h2>
        <p>Progetto ANCHECASA, schema marketplace. Eseguiti l'11 ottobre 2026, in ordine: app-01, app-02 e la migrazione delle gare.</p>
        <ul>
          <li>Tabelle app_org, app_ep_gare, app_ep_documenti, app_ep_inviti, app_ep_offerte, app_ep_eventi.</li>
          <li>Bucket privato e-procurement, file fino a 30 MB.</li>
          <li>Ruolo general_contractor_buyer ammesso, insieme a titolare, responsabile, operatore e consulente.</li>
          <li>Chiusura delle gare scadute ogni 5 minuti. Le pagine la chiamano anche all'apertura.</li>
          <li>Admin di piattaforma già presenti: 2. Organizzazioni: 0. Fornitori in Albo: 0.</li>
        </ul>
        <p>Lo schema marketplace resta esposto alla Data API.</p>
      </div>
      <div class="card">
        <h2>Cosa manca</h2>
        <ul>
          <li>Non pubblicare il cruscotto Next finché Nando non lo dice. Per un'anteprima servono git, Vercel e le variabili NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY. I valori non vanno nel git.</li>
          <li>Manca la chiave service role, solo sul server, mai con il prefisso NEXT_PUBLIC. Senza quella i documenti restano in verifica.</li>
          <li>Serve almeno un'organizzazione attiva. I due admin vedono il menu. Un collega che non è admin va in app_org_membri con ruolo general_contractor_buyer.</li>
          <li>L'Albo è vuoto. Per invitare qualcuno servono fornitori attivi. Il portale fornitori si apre solo ai loro membri. A firmare l'offerta sono titolare e responsabile.</li>
          <li>app-03 fino a app-16 sono già sul database. app-15 non va rilanciato.</li>
          <li>Il commit del pulsante c'è. La centrale e il portale fornitori sono sul disco e non sono ancora in un commit. Non c'è push.</li>
          <li>AncheBIM è il Python locale del cruscotto. Gli indirizzi API nel file di esempio non sono usati.</li>
          <li>Gli importi non vanno nel registro. L'acquirente li legge solo a gara chiusa o aggiudicata.</li>
          <li>Per questo lavoro non vanno toccati il sito anchecasa.it, il Magazine e AncheSicura.</li>
        </ul>
      </div>`.s;
    }
  };
})();
