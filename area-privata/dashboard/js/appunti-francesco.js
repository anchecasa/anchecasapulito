/* ADMIN · Appunti per Francesco (11.10.2026).
   Quando Francesco entra dal suo computer, la dashboard si apre su questa pagina.
   Gli altri admin la trovano nel menu, accanto a Task. */
(function () {
  const AC = window.AC;
  const { html } = AC.ui;
  const V = AC.views;

  V.appunti = {
    title: "Appunti per Francesco",
    sub: "Cosa è online oggi e cosa manca, per l'app e per SuperMastro.",
    render(el) {
      el.innerHTML = html`<div class="card">
        <h2>11 ottobre 2026, fatto da qui</h2>
        <p>L'app AncheCasa 2.7 è sul database: parti da app-03 a app-13, magazzino e mezzi compresi. Il controllo dei permessi è passato.</p>
        <p>La funzione sdi-gateway è pubblicata. Le altre tre non entrano: il progetto ha già 100 funzioni e Supabase non ne accetta altre finché non si alza il piano.</p>
        <p>L'app si apre su <strong>https://entra.anchecasa.it</strong>. L'indirizzo app.anchecasa.it non si usa più.</p>
        <p>SuperMastro: le sei migrazioni del 11 ottobre sono sul database. I permessi delle tabelle sono a posto. SOS_SHARE_SECRET e CRON_SECRET sono stati creati, senza mostrarli. La pull request è https://github.com/anchecasa/supermastro-sos/pull/1 e non è unita a main.</p>
      </div>
      <div class="card">
        <h2>Cosa manca</h2>
        <ul>
          <li>La password del database nel file non viene accettata. Gli script che si collegano come postgres si fermano. Il login della CLI invece funziona.</li>
          <li>Il token Supabase nel file risponde 401. Il token Cloudflare nel file non è valido.</li>
          <li>Mancano i dati per le mail ai fornitori: MAIL_PROVIDER, MAIL_API_KEY, MAIL_MITTENTE, e anche PRIVACY_URL e GEMINI_API_KEY.</li>
          <li>Manca il contratto del gateway delle fatture elettroniche. Senza, l'invio allo SdI resta simulato.</li>
          <li>Se la mappa non si vede su entra.anchecasa.it, la chiave di Google Maps va ristretta anche a quell'indirizzo.</li>
          <li>Il lint di SuperMastro non passa: 20 errori in agenda, voce del procione e moduli di accesso. Per questo non è stato unito a main e il sito online è ancora quello di prima. L'admin online si apre ancora senza login.</li>
          <li>La pulizia notturna non è partita: il workflow è solo sul ramo, non su main.</li>
          <li>Cancellare la cartella 04-SuperMastro\_claude-temp: sono file temporanei.</li>
        </ul>
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
          <li>I file SQL da app-03 a app-13 non sono stati eseguiti. Per le gare non servono. Servono solo se si vuole il resto dell'app.</li>
          <li>Il commit del pulsante c'è. La centrale e il portale fornitori sono sul disco e non sono ancora in un commit. Non c'è push.</li>
          <li>AncheBIM è il Python locale del cruscotto. Gli indirizzi API nel file di esempio non sono usati.</li>
          <li>Gli importi non vanno nel registro. L'acquirente li legge solo a gara chiusa o aggiudicata.</li>
          <li>Per questo lavoro non vanno toccati il sito anchecasa.it, il Magazine e AncheSicura.</li>
        </ul>
      </div>`.s;
    }
  };
})();
