(function () {
  const AC = (window.AC = window.AC || {});
  const KEY_BASE = "anchecasa-tre-viste-v1";
  // Con il login vero (29.09.2026) i dati demo sono separati per utente: usaUtente() sposta la
  // chiave su "<base>:<id utente>" e ricarica. Senza utente resta la chiave base.
  let KEY = KEY_BASE;
  let utenteNome = "";

  const oggi = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  };
  const fmt = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = String(iso).split("-");
    return d + "." + m + "." + y;
  };
  const nid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const imgOrEmpty = (v) => (typeof v === "string" && v.indexOf("data:image/") === 0 ? v : "");

  function demoBacheca() {
    return [
      {
        id: "b1",
        canale: "bacheca",
        fonte: "privato",
        dir: "cerco",
        cosa: "Pittore",
        dove: "Brescia",
        testo: "Due stanze, internamente. Chiamare 333 445566, Marta, via Croce 8.",
        stato: "aperto",
        foto: [{ nome: "pittore", src: "../sito/img/priv-pittore.jpg" }],
        inviti: "",
        modoInvito: "",
        autore: "Marta Riva"
      },
      {
        id: "b2",
        canale: "bacheca",
        fonte: "privato",
        dir: "offro",
        cosa: "Tutor",
        dove: "Bergamo",
        testo: "Matematica alle medie, pomeriggi. Mail anna.lodi@mail.it.",
        stato: "aperto",
        foto: [{ nome: "tutor", src: "../sito/img/priv-offerta.jpg" }],
        inviti: "",
        modoInvito: "",
        autore: "Anna Lodi"
      },
      {
        id: "b3",
        canale: "bacheca",
        fonte: "privato",
        dir: "cerco",
        cosa: "Affitto casa",
        dove: "Milano",
        testo: "Bilocale, zona Navigli. Civico in privato dopo la chat.",
        stato: "aperto",
        foto: [{ nome: "casa", src: "../sito/img/card-villetta.jpg" }],
        inviti: "",
        modoInvito: "",
        autore: "Paolo Galli"
      },
      {
        id: "b4",
        canale: "bacheca",
        fonte: "privato",
        dir: "offro",
        cosa: "Montatore",
        dove: "Bergamo",
        testo: "Montaggio cucine in hinterland. Cellulare in chat.",
        stato: "aperto",
        foto: [{ nome: "cucina", src: "../sito/img/card-cucina.jpg" }],
        inviti: "",
        modoInvito: "",
        autore: "Luca Riva"
      },
      {
        id: "b5",
        canale: "bacheca",
        fonte: "sponsor",
        dir: "offro",
        cosa: "Impresa ristrutturazione",
        dove: "Bergamo",
        testo: "Ristrutturazioni in città. Edil Nord, lavori in zona.",
        stato: "aperto",
        foto: [{ nome: "cantiere", src: "../sito/img/az-team.jpg" }],
        inviti: "",
        modoInvito: "",
        autore: "Edil Nord",
        azienda: "Edil Nord"
      },
      {
        id: "b6",
        canale: "bacheca",
        fonte: "sponsor",
        dir: "offro",
        cosa: "Materiali",
        dove: "Brescia",
        testo: "Forniture da cantiere. Visibili in questa città.",
        stato: "aperto",
        foto: [{ nome: "mezzi", src: "../sito/img/az-forniture.jpg" }],
        inviti: "",
        modoInvito: "",
        autore: "Brixia Materiali",
        azienda: "Brixia Materiali"
      },
      {
        id: "b7",
        canale: "bacheca",
        fonte: "privato",
        dir: "cerco",
        cosa: "Segretaria",
        dove: "Milano",
        testo: "Part-time, studio. Contatto dopo l’ingresso.",
        stato: "aperto",
        foto: [{ nome: "ufficio", src: "../sito/img/az-ufficio.jpg" }],
        inviti: "",
        modoInvito: "",
        autore: "Elena Bini"
      }
    ];
  }

  function mergeDemoAnnunci(list) {
    const have = {};
    (list || []).forEach((a) => {
      if (a && a.id) have[a.id] = true;
    });
    const extra = demoBacheca().filter((a) => !have[a.id]);
    return extra.concat(list || []);
  }

  const seed = () => ({
    famiglia: "",
    chiId: "",
    profilo: {
      nome: "",
      zona: "Bergamo",
      ruolo: "",
      mestiere: "",
      settore: "",
      tipoAzienda: "",
      fornitoreModo: "",
      livello: "base",
      verifica: "attesa",
      primoUso: true,
      copertura: "sedi",
      coperturaCitta: [],
      coperturaRegioni: [],
      foto: "",
      logo: ""
    },
    account: { mail: "", lingua: "it" },
    notifiche: { chat: true, annunci: true, scadenze: true },
    org: { utenti: [], reparti: {}, luoghi: [] },
    nucleo: [],
    collaboratori: [],
    pagamenti: { iban: "", intestatario: "" },
    annunci: demoBacheca().concat([
      {
        id: "a1",
        dir: "cerco",
        cosa: "Idraulico",
        dove: "Bergamo",
        testo: "Perdita in cucina. Intervento in zona. Mario Rossi, via Roma 12, 035 112233.",
        stato: "aperto",
        foto: [],
        inviti: "",
        modoInvito: "",
        autore: "Marta Riva",
        canale: "match"
      }
    ]),
    // Risposte ricevute sugli annunci propri (demo, per "La mia bacheca" del Privato).
    risposte: [
      { id: "r1", annuncio: "a1", da: "Edil Nord", quando: "oggi", testo: "Possiamo passare venerdì mattina a vedere la perdita.", letta: false },
      { id: "r2", annuncio: "a1", da: "Idraulica Colombo", quando: "ieri", testo: "Sono in zona, posso venire anche domani sera.", letta: false }
    ],
    creditSblocco: "chiuso",
    mail: [
      { id: "m1", titolo: "Preventivo idraulico", da: "Edil Nord", quando: "oggi", corpo: "Possiamo venerdì. Allegato il preventivo." },
      { id: "m2", titolo: "Credit, liquidità", da: "Banca AncheCasa", quando: "ieri", corpo: "Documenti ricevuti. Rispondiamo in questo filo." },
      { id: "m3", titolo: "Gara lotto B", da: "Ufficio gare", quando: "18.09", corpo: "Risposta economica. Da agganciare al modulo contabile." }
    ],
    gare: [
      { id: "g1", nome: "Gara 12 · lotto B", stato: "aperta" },
      { id: "g2", nome: "Gara 09 · viadotto", stato: "archiviata" }
    ],
    catena: [
      { id: "c1", tipo: "subagente", nome: "Paola Neri", n: 4 },
      { id: "c2", tipo: "azienda", nome: "Edil Nord", n: 1 },
      { id: "c3", tipo: "privato", nome: "Marta Riva", n: 1 }
    ],
    guadagno: { mese: 1240, sub: 310 }
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      const d = JSON.parse(raw);
      if (!d || typeof d !== "object") return seed();
      const base = seed();
      const orgIn = d.org && typeof d.org === "object" ? d.org : {};
      const pin = d.profilo && typeof d.profilo === "object" ? d.profilo : {};
      return Object.assign(base, d, {
        profilo: Object.assign({}, base.profilo, pin, {
          coperturaCitta: Array.isArray(pin.coperturaCitta) ? pin.coperturaCitta : [],
          coperturaRegioni: Array.isArray(pin.coperturaRegioni) ? pin.coperturaRegioni : [],
          foto: imgOrEmpty(pin.foto),
          logo: imgOrEmpty(pin.logo)
        }),
        account: Object.assign(base.account, d.account || {}),
        notifiche: Object.assign(base.notifiche, d.notifiche || {}),
        pagamenti: Object.assign(base.pagamenti, d.pagamenti || {}),
        org: {
          utenti: Array.isArray(orgIn.utenti) ? orgIn.utenti : [],
          reparti: Object.assign({}, orgIn.reparti || {}),
          luoghi: (Array.isArray(orgIn.luoghi) ? orgIn.luoghi : []).map((l) => ({
            id: l.id || nid("l"),
            tipo: l.tipo || "sede",
            nome: String(l.nome || ""),
            citta: String(l.citta || ""),
            regione: String(l.regione || "")
          }))
        },
        nucleo: Array.isArray(d.nucleo) ? d.nucleo : [],
        collaboratori: Array.isArray(d.collaboratori) ? d.collaboratori : [],
        annunci: mergeDemoAnnunci(Array.isArray(d.annunci) ? d.annunci : []),
        risposte: Array.isArray(d.risposte) ? d.risposte : base.risposte
      });
    } catch (e) {
      return seed();
    }
  }

  let data = load();
  const listeners = [];

  function persist(notify) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {}
    pianificaSync();
    if (notify !== false) listeners.forEach((fn) => fn());
  }

  /* Profilo reale (29.09.2026): dopo il login vero, il Profilo e i luoghi dell'azienda vivono su
     Supabase (marketplace.profiles e marketplace.luoghi, RLS: ognuno solo i propri). Il resto dello
     store resta demo in localStorage. Funziona a "scrittura in trasparenza": ogni salvataggio locale
     confronta lo stato con l'ultimo noto sul server e scrive solo le differenze (dopo 0,5 s).
     Le foto/logo restano data-URL (max 900 KB dal form) nelle colonne foto_url/logo_url. */
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let utenteId = "";
  let remoto = null; // ultimo stato noto sul server: { profilo: json, luoghi: [id] }
  let syncTimer = null;
  let syncInCorso = false;
  let syncRichiesto = false;

  function profiloDb() {
    const p = data.profilo;
    return {
      nome: p.nome || "",
      zona: p.zona || "",
      mestiere: p.mestiere || "",
      settore: p.settore || "",
      tipo_azienda: p.tipoAzienda || null,
      fornitore_modo: p.fornitoreModo || null,
      livello: p.livello === "apro" ? "completo" : "base",
      primo_uso: p.primoUso !== false,
      copertura: p.copertura || "sedi",
      copertura_citta: Array.isArray(p.coperturaCitta) ? p.coperturaCitta : [],
      copertura_regioni: Array.isArray(p.coperturaRegioni) ? p.coperturaRegioni : [],
      foto_url: p.foto || null,
      logo_url: p.logo || null
    };
  }

  /* Annunci reali (29.09.2026, fase A di Pubblica): per l'utente vero `data.annunci` non è più la
     demo ma
       - i SUOI annunci (tabella marketplace.annunci, RLS: solo l'autore), senza `canale`, così
         restano "i miei" come nella demo;
       - la bacheca degli ALTRI (RPC bacheca_annunci: aperti, canale bacheca, contatti già oscurati
         dal database), con canale "bacheca".
     Un annuncio pubblicato va SEMPRE nel canale bacheca: fonte "privato" se l'autore è un Privato,
     "sponsor" (col nome dell'autore) se è un'Azienda o un Agente (vedi fonteDi). Le foto vanno nel
     bucket Storage "marketplace-annunci", nella cartella <id utente>/. */
  const BUCKET_FOTO = "marketplace-annunci";
  let ultimoCaricamento = 0;
  let firmaAnnunci = "";
  function fonteDi(famiglia) {
    return famiglia === "privato" ? "privato" : "sponsor";
  }

  function annuncioDaDb(a, mio) {
    const foto = (Array.isArray(a.foto) ? a.foto : [])
      .filter((f) => f && typeof f.url === "string")
      .map((f) => ({ nome: f.nome || "", src: f.url }));
    const base = {
      id: a.id,
      fonte: a.fonte,
      dir: a.dir,
      cosa: a.cosa,
      dove: a.dove || "",
      testo: a.testo || "",
      stato: a.stato || "aperto",
      foto: foto,
      inviti: a.inviti || "",
      modoInvito: a.modo_invito || "",
      autore: mio ? data.profilo.nome || "" : a.autore_nome || "",
      azienda: a.fonte === "sponsor" ? a.azienda_nome || undefined : undefined
    };
    if (!mio) base.canale = "bacheca";
    return base;
  }

  // Ricarica i miei annunci e la bacheca. `forza` salta il limite di 20 secondi fra due ricariche.
  // Se qualcosa è cambiato ridisegna la vista (a meno che l'utente stia scrivendo il modulo).
  function caricaAnnunci(forza) {
    if (!utenteId || !window.acDb) return Promise.resolve();
    if (!forza && Date.now() - ultimoCaricamento < 20000) return Promise.resolve();
    ultimoCaricamento = Date.now();
    const db = window.acDb;
    return Promise.all([
      db.from("annunci").select("*").eq("autore_id", utenteId).order("created_at", { ascending: false }),
      db.rpc("bacheca_annunci")
    ])
      .then(([mine, board]) => {
        if (mine.error || board.error) throw mine.error || board.error;
        const inCorso = data.annunci.filter((a) => !UUID_RE.test(a.id)); // pubblicati ma non ancora salvati
        const lista = inCorso
          .concat((mine.data || []).map((a) => annuncioDaDb(a, true)))
          .concat((board.data || []).map((a) => annuncioDaDb(a, false)));
        const firma = JSON.stringify(lista);
        if (firma === firmaAnnunci) return;
        firmaAnnunci = firma;
        data.annunci = lista;
        persist(false);
        const ae = document.activeElement;
        if (!(ae && ae.closest && ae.closest("#f-pub"))) listeners.forEach((fn) => fn());
      })
      .catch((err) => {
        console.warn("Caricamento annunci non riuscito", err);
      });
  }

  // Salva sul server un annuncio appena pubblicato in locale: prima le foto, poi la riga.
  function salvaAnnuncioRemoto(loc) {
    const db = window.acDb;
    const fam = data.famiglia;
    const fonte = fonteDi(fam);
    const estensione = (tipo) => (tipo === "image/png" ? "png" : tipo === "image/webp" ? "webp" : tipo === "image/gif" ? "gif" : "jpg");
    const carica = (f) =>
      fetch(f.src)
        .then((r) => r.blob())
        .then((blob) => {
          const uid = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : nid("f");
          const percorso = utenteId + "/" + uid + "." + estensione(blob.type);
          return db.storage.from(BUCKET_FOTO).upload(percorso, blob, { contentType: blob.type }).then((up) => {
            if (up.error) throw up.error;
            return { nome: f.nome || "", url: db.storage.from(BUCKET_FOTO).getPublicUrl(percorso).data.publicUrl };
          });
        });
    return Promise.all((loc.foto || []).map(carica))
      .then((foto) =>
        db
          .from("annunci")
          .insert({
            autore_id: utenteId,
            dir: loc.dir,
            cosa: loc.cosa,
            dove: loc.dove || "",
            testo: loc.testo || "",
            canale: "bacheca",
            fonte: fonte,
            azienda_nome: fonte === "sponsor" ? data.profilo.nome || null : null,
            foto: foto,
            inviti: loc.inviti || "",
            modo_invito: loc.modoInvito || ""
          })
          .select("id")
          .single()
          .then((r) => {
            if (r.error) throw r.error;
            loc.id = r.data.id;
            loc.foto = foto.map((f) => ({ nome: f.nome, src: f.url }));
            loc.fonte = fonte;
            persist(true);
          })
      )
      .catch((err) => {
        console.warn("Pubblicazione annuncio non riuscita", err);
        data.annunci = data.annunci.filter((a) => a !== loc);
        if (AC.ui && AC.ui.toast) AC.ui.toast("Non riesco a pubblicare l'annuncio. Riprova tra poco.", "error");
        persist(true);
      });
  }

  function pianificaSync() {
    if (!utenteId || !remoto || !window.acDb) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(sync, 500);
  }

  function sync() {
    if (syncInCorso) {
      syncRichiesto = true;
      return;
    }
    const db = window.acDb;
    const jobs = [];
    const pd = profiloDb();
    const js = JSON.stringify(pd);
    if (js !== remoto.profilo) {
      jobs.push(
        db.from("profiles").update(pd).eq("id", utenteId).then((r) => {
          if (r.error) throw r.error;
          remoto.profilo = js;
        })
      );
    }
    if (data.famiglia === "azienda") {
      const locali = ((data.org && data.org.luoghi) || []).filter((l) => UUID_RE.test(l.id));
      const idsLocali = locali.map((l) => l.id);
      const nuovi = locali.filter((l) => remoto.luoghi.indexOf(l.id) < 0);
      const tolti = remoto.luoghi.filter((id) => idsLocali.indexOf(id) < 0);
      if (nuovi.length) {
        jobs.push(
          db.from("luoghi")
            .insert(nuovi.map((l) => ({ id: l.id, azienda_id: utenteId, tipo: l.tipo || "sede", nome: l.nome, citta: l.citta || "", regione: l.regione || "" })))
            .then((r) => {
              if (r.error) throw r.error;
              remoto.luoghi = remoto.luoghi.concat(nuovi.map((l) => l.id));
            })
        );
      }
      if (tolti.length) {
        jobs.push(
          db.from("luoghi").delete().in("id", tolti).eq("azienda_id", utenteId).then((r) => {
            if (r.error) throw r.error;
            remoto.luoghi = remoto.luoghi.filter((id) => tolti.indexOf(id) < 0);
          })
        );
      }
    }
    if (!jobs.length) return;
    syncInCorso = true;
    Promise.all(jobs)
      .catch((err) => {
        console.warn("Salvataggio profilo non riuscito", err);
        if (AC.ui && AC.ui.toast) AC.ui.toast("Non riesco a salvare sul server. Riprova tra poco.", "error");
      })
      .then(() => {
        syncInCorso = false;
        if (syncRichiesto) {
          syncRichiesto = false;
          pianificaSync();
        }
      });
  }
  function save() {
    persist(true);
  }

  function persone() {
    if (data.famiglia === "azienda") return data.org.utenti || [];
    if (data.famiglia === "privato") return data.nucleo || [];
    if (data.famiglia === "agente") {
      const io = {
        id: "self",
        nome: data.profilo.nome || "Agente",
        ruolo: "titolare",
        stato: "attivo",
        tasti: ["pubblica", "chat", "catena", "guadagno", "inviti"]
      };
      return [io].concat(data.collaboratori || []);
    }
    return [];
  }

  function utenteCorrente() {
    const list = persone();
    return list.find((u) => u.id === data.chiId) || list.find((u) => u.ruolo === "titolare") || list[0] || null;
  }

  function seedPrivato() {
    if (!data.nucleo.length) {
      data.nucleo = [
        { id: "n1", nome: data.profilo.nome || "Marta Riva", ruolo: "titolare", vincolo: "intestatario" },
        { id: "n2", nome: "Luca Riva", ruolo: "nucleo", vincolo: "convivente" }
      ];
    }
    if (!data.account.mail) data.account.mail = "marta.riva@mail.it";
    if (!data.chiId || !data.nucleo.some((n) => n.id === data.chiId)) data.chiId = data.nucleo[0].id;
  }

  function seedAgente() {
    if (!data.collaboratori.length) {
      data.collaboratori = [
        {
          id: "k1",
          nome: "Sara Conti",
          mail: "sara@rete.it",
          ruolo: "segreteria",
          stato: "attivo",
          tasti: ["pubblica", "chat", "inviti"]
        }
      ];
    }
    if (!data.pagamenti.intestatario) data.pagamenti.intestatario = data.profilo.nome || "Luca Ferri";
    if (!data.pagamenti.iban) data.pagamenti.iban = "IT60X0542811101000000123456";
    if (!data.account.mail) data.account.mail = "luca.ferri@rete.it";
    const ids = persone().map((p) => p.id);
    if (!data.chiId || ids.indexOf(data.chiId) < 0) data.chiId = "self";
  }

  function seedAzienda() {
    data.org = data.org || { utenti: [], reparti: {}, luoghi: [] };
    if (!data.org.utenti.length) {
      const nome = data.profilo.nome || "Edil Nord Srl";
      data.org.utenti = [
        { id: "u1", nome: nome, mail: "titolare@edilnord.it", ruolo: "titolare", stato: "attivo", reparti: [] },
        { id: "u2", nome: "Giulia Bianchi", mail: "giulia@edilnord.it", ruolo: "responsabile", stato: "attivo", reparti: [] },
        { id: "u3", nome: "Paolo Verdi", mail: "paolo@edilnord.it", ruolo: "operatore", stato: "attivo", reparti: [] }
      ];
    }
    if (!data.org.luoghi.length) data.org.luoghi = [];
    if (!data.account.mail) data.account.mail = "titolare@edilnord.it";
  }

  AC.date = { today: oggi, fmt };
  AC.store = {
    get data() {
      return data;
    },
    subscribe(fn) {
      listeners.push(fn);
    },
    /* CONGELATO 20.09.2026. Impostazioni: org, nucleo, collaboratori, chiId, regola A. Non cambiare ruoli titolare/responsabile/operatore né il filtro reparti senza richiesta esplicita. */
    persone,
    utenteCorrente,
    isTitolare() {
      const u = utenteCorrente();
      return !u || u.ruolo === "titolare";
    },
    // Chiamata dal controllo d'accesso, prima del primo render: da qui i dati sono di questo utente.
    usaUtente(id, nome) {
      KEY = id ? KEY_BASE + ":" + id : KEY_BASE;
      utenteNome = String(nome || "");
      data = load();
    },
    // Applica il profilo letto da Supabase (riga di marketplace.profiles, luoghi dell'azienda, mail
    // di accesso). Chiamata subito dopo usaUtente(), prima del primo render: da qui vale il server.
    applicaProfilo(row, luoghi, email) {
      if (!row || !row.id) return;
      utenteId = row.id;
      const arr = (v) => (Array.isArray(v) ? v : []);
      Object.assign(data.profilo, {
        nome: row.nome || data.profilo.nome,
        zona: row.zona || "",
        mestiere: row.mestiere || "",
        settore: row.settore || "",
        tipoAzienda: row.tipo_azienda || "",
        fornitoreModo: row.fornitore_modo || "",
        livello: row.livello === "completo" ? "apro" : "base",
        verifica: row.verifica || "attesa",
        primoUso: row.primo_uso !== false,
        copertura: row.copertura || "sedi",
        coperturaCitta: arr(row.copertura_citta),
        coperturaRegioni: arr(row.copertura_regioni),
        foto: imgOrEmpty(row.foto_url || ""),
        logo: imgOrEmpty(row.logo_url || "")
      });
      const ids = [];
      if (Array.isArray(luoghi)) {
        data.org = data.org || { utenti: [], reparti: {}, luoghi: [] };
        data.org.luoghi = luoghi.map((l) => {
          ids.push(l.id);
          return { id: l.id, tipo: l.tipo || "sede", nome: l.nome || "", citta: l.citta || "", regione: l.regione || "" };
        });
      }
      if (email) data.account.mail = email;
      // Annunci e risposte demo non servono a un utente vero: gli annunci arrivano dal server
      // (caricaAnnunci), le risposte sono della Chat, ancora da collegare.
      data.annunci = [];
      data.risposte = [];
      firmaAnnunci = "";
      remoto = { profilo: JSON.stringify(profiloDb()), luoghi: ids };
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch (e) {}
    },
    setFamiglia(id) {
      data.famiglia = id || "";
      if (id === "privato") {
        data.profilo.ruolo = "Privato";
        data.profilo.nome = "Marta Riva";
        seedPrivato();
      }
      if (id === "azienda") {
        data.profilo.ruolo = "Azienda";
        data.profilo.nome = "Edil Nord Srl";
        if (!data.profilo.settore) data.profilo.settore = "edilizia";
        if (!data.profilo.tipoAzienda) data.profilo.tipoAzienda = "azienda_imprese_edili";
        seedAzienda();
      }
      if (id === "agente") {
        data.profilo.ruolo = "Agente";
        data.profilo.nome = "Luca Ferri";
        seedAgente();
      }
      if (utenteNome && id) data.profilo.nome = utenteNome;
      save();
    },
    ensurePrivato() {
      const before = JSON.stringify(data.nucleo) + data.chiId + data.account.mail;
      seedPrivato();
      if (before !== JSON.stringify(data.nucleo) + data.chiId + data.account.mail) persist(false);
    },
    ensureAgente() {
      const before = JSON.stringify(data.collaboratori) + data.chiId + data.pagamenti.iban;
      seedAgente();
      if (before !== JSON.stringify(data.collaboratori) + data.chiId + data.pagamenti.iban) persist(false);
    },
    ensureOrg(folds) {
      if (data.famiglia !== "azienda") return;
      const list = Array.isArray(folds) && folds.length ? folds.slice() : ["ufficio"];
      seedAzienda();
      let dirty = false;
      list.forEach((f) => {
        if (data.org.reparti[f] === undefined) {
          data.org.reparti[f] = true;
          dirty = true;
        }
      });
      const mestiere = list.filter((f) => f !== "ufficio");
      const def = {
        titolare: list.slice(),
        responsabile: ["ufficio"].concat(mestiere.slice(0, 1)),
        operatore: mestiere.length ? [mestiere[mestiere.length - 1]] : ["ufficio"]
      };
      data.org.utenti.forEach((u) => {
        if (!Array.isArray(u.reparti)) {
          u.reparti = [];
          dirty = true;
        }
        if (!u.reparti.length && def[u.ruolo]) {
          u.reparti = def[u.ruolo].slice();
          dirty = true;
        }
        if (u.ruolo === "titolare") {
          const missing = list.filter((f) => u.reparti.indexOf(f) < 0);
          if (missing.length) {
            u.reparti = u.reparti.concat(missing);
            dirty = true;
          }
        }
      });
      // Sedi demo (Bergamo/Seriate) solo per la demo senza login: un utente vero parte senza luoghi.
      const packAz = window.AC && AC.packKey ? AC.packKey(data.profilo.tipoAzienda) : data.profilo.tipoAzienda;
      if (!utenteId && !data.org.luoghi.length && (packAz === "impresa" || data.profilo.tipoAzienda === "impresa" || data.profilo.tipoAzienda === "azienda_imprese_edili")) {
        data.org.luoghi = [
          { id: "l1", tipo: "sede", nome: "Sede Bergamo", citta: "Bergamo", regione: "lombardia" },
          { id: "l2", tipo: "cantiere", nome: "Cantiere Seriate", citta: "Seriate", regione: "lombardia" }
        ];
        dirty = true;
      }
      data.org.luoghi.forEach((l) => {
        if (l.citta && l.regione) return;
        if (/bergamo/i.test(l.nome || "")) {
          if (!l.citta) l.citta = "Bergamo";
          if (!l.regione) l.regione = "lombardia";
          dirty = true;
        } else if (/seriate/i.test(l.nome || "")) {
          if (!l.citta) l.citta = "Seriate";
          if (!l.regione) l.regione = "lombardia";
          dirty = true;
        }
      });
      const ids = data.org.utenti.map((u) => u.id);
      if (!data.chiId || ids.indexOf(data.chiId) < 0) {
        const tit = data.org.utenti.find((u) => u.ruolo === "titolare");
        data.chiId = (tit && tit.id) || ids[0] || "";
        dirty = true;
      }
      if (dirty) persist(false);
    },
    updateProfilo(p) {
      const prev = data.profilo.tipoAzienda;
      const next = Object.assign({}, p);
      if ("foto" in next) next.foto = imgOrEmpty(next.foto);
      if ("logo" in next) next.logo = imgOrEmpty(next.logo);
      Object.assign(data.profilo, next);
      if (p.tipoAzienda && p.tipoAzienda !== prev && data.org && Array.isArray(data.org.utenti)) {
        data.org.reparti = {};
        data.org.utenti.forEach((u) => {
          if (u.ruolo !== "titolare") u.reparti = [];
        });
      }
      save();
    },
    updateAccount(p) {
      Object.assign(data.account, p);
      save();
    },
    updateNotifiche(p) {
      Object.assign(data.notifiche, p);
      save();
    },
    updatePagamenti(p) {
      Object.assign(data.pagamenti, p);
      save();
    },
    setChi(id) {
      data.chiId = id;
      save();
    },
    setReparto(fold, on) {
      data.org.reparti[fold] = !!on;
      save();
    },
    setUtenteReparti(id, folds) {
      const u = data.org.utenti.find((x) => x.id === id);
      if (!u || u.ruolo === "titolare") return;
      u.reparti = folds.slice();
      save();
    },
    addUtente(u) {
      data.org.utenti.push(
        Object.assign(
          { id: nid("u"), stato: "attesa", ruolo: "operatore", reparti: [] },
          u
        )
      );
      save();
    },
    removeUtente(id) {
      const u = data.org.utenti.find((x) => x.id === id);
      if (!u || u.ruolo === "titolare" || u.id === data.chiId) return false;
      data.org.utenti = data.org.utenti.filter((x) => x.id !== id);
      save();
      return true;
    },
    addNucleo(n) {
      data.nucleo.push(Object.assign({ id: nid("n"), ruolo: "nucleo", vincolo: "familiare" }, n));
      save();
    },
    removeNucleo(id) {
      const n = data.nucleo.find((x) => x.id === id);
      if (!n || n.ruolo === "titolare") return false;
      data.nucleo = data.nucleo.filter((x) => x.id !== id);
      if (data.chiId === id) data.chiId = (data.nucleo[0] && data.nucleo[0].id) || "";
      save();
      return true;
    },
    addCollab(c) {
      data.collaboratori.push(
        Object.assign(
          {
            id: nid("k"),
            ruolo: "segreteria",
            stato: "attivo",
            tasti: ["pubblica", "chat", "inviti"]
          },
          c
        )
      );
      save();
    },
    removeCollab(id) {
      if (id === "self" || id === data.chiId) return false;
      data.collaboratori = data.collaboratori.filter((x) => x.id !== id);
      save();
      return true;
    },
    setCollabTasti(id, tasti) {
      const c = data.collaboratori.find((x) => x.id === id);
      if (!c) return;
      c.tasti = tasti.slice();
      save();
    },
    addLuogo(l) {
      const nome = String((l && l.nome) || "").trim();
      if (!nome) return false;
      const citta = String((l && l.citta) || "").trim();
      data.org.luoghi.push({
        // uuid: con l'utente reale il luogo finisce in marketplace.luoghi con questo id
        id: window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : nid("l"),
        tipo: (l && l.tipo) || "sede",
        nome: nome,
        citta: citta,
        regione: String((l && l.regione) || "").trim()
      });
      if (!String(data.profilo.zona || "").trim() && citta) data.profilo.zona = citta;
      save();
      return true;
    },
    copreZona(dove) {
      const raw = String(dove || "").trim();
      if (!raw) return false;
      const p = data.profilo;
      const modo = p.copertura || "sedi";
      if (modo === "italia") return true;
      const n = (s) => String(s || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/'/g, "")
        .replace(/\s+/g, " ");
      const d = n(raw);
      const same = (c) => {
        const x = n(c);
        return !!(x && (x === d || x.indexOf(d) >= 0 || d.indexOf(x) >= 0));
      };
      const luoghi = (data.org && data.org.luoghi) || [];
      if (luoghi.some((l) => same(l.citta))) return true;
      if (same(p.zona)) return true;
      if (modo === "sedi") return false;
      if (modo === "citta") {
        return (p.coperturaCitta || []).some((c) => same(c.citta));
      }
      if (modo === "regioni") {
        const geo = AC.regioneDiCitta;
        const r = (luoghi.find((l) => same(l.citta)) || {}).regione
          || (luoghi.find((l) => same(l.nome)) || {}).regione
          || (geo ? geo(raw) : "")
          || (same(p.zona) ? (luoghi[0] && luoghi[0].regione) : "");
        if (!r) return false;
        if (luoghi.some((l) => l.regione === r)) return true;
        return (p.coperturaRegioni || []).indexOf(r) >= 0;
      }
      return false;
    },
    removeLuogo(id) {
      data.org.luoghi = data.org.luoghi.filter((x) => x.id !== id);
      save();
    },
    setCopertura(modo) {
      const ok = { sedi: 1, citta: 1, regioni: 1, italia: 1 };
      data.profilo.copertura = ok[modo] ? modo : "sedi";
      save();
    },
    addCoperturaCitta(c) {
      const citta = String((c && c.citta) || "").trim();
      if (!citta) return false;
      if (!Array.isArray(data.profilo.coperturaCitta)) data.profilo.coperturaCitta = [];
      data.profilo.coperturaCitta.push({
        citta: citta,
        regione: String((c && c.regione) || "").trim()
      });
      save();
      return true;
    },
    removeCoperturaCitta(ix) {
      const arr = Array.isArray(data.profilo.coperturaCitta) ? data.profilo.coperturaCitta : [];
      data.profilo.coperturaCitta = arr.filter((_, n) => n !== Number(ix));
      save();
    },
    addCoperturaRegione(id) {
      const rid = String(id || "");
      if (!rid) return false;
      if (!Array.isArray(data.profilo.coperturaRegioni)) data.profilo.coperturaRegioni = [];
      if (data.profilo.coperturaRegioni.indexOf(rid) >= 0) return false;
      data.profilo.coperturaRegioni.push(rid);
      save();
      return true;
    },
    removeCoperturaRegione(id) {
      data.profilo.coperturaRegioni = (data.profilo.coperturaRegioni || []).filter((x) => x !== id);
      save();
    },
    /* CONGELATO 20.09.2026. Annuncio: foto, inviti, modoInvito, primoUso. L’invito di massa spegne primoUso. */
    addAnnuncio(a) {
      const foto = Array.isArray(a.foto)
        ? a.foto.filter((f) => f && typeof f.src === "string" && f.src.indexOf("data:image/") === 0).slice(0, 6)
        : [];
      const inviti = String(a.inviti || "").trim();
      const nuovo = {
        id: nid("a"),
        dir: a.dir || "cerco",
        cosa: a.cosa || "",
        dove: a.dove || "",
        testo: a.testo || "",
        stato: "aperto",
        foto: foto,
        inviti: inviti,
        modoInvito: a.modoInvito || "",
        autore: data.profilo.nome || ""
      };
      data.annunci.unshift(nuovo);
      if (data.famiglia === "azienda" && inviti) data.profilo.primoUso = false;
      save();
      // Utente vero: l'annuncio compare subito, poi viene salvato sul server (foto + riga).
      if (utenteId && window.acDb) salvaAnnuncioRemoto(nuovo);
    },
    chiudiAnnuncio(id) {
      const x = data.annunci.find((n) => n.id === id);
      if (x) x.stato = "chiuso";
      save();
      if (x && utenteId && window.acDb && UUID_RE.test(id)) {
        window.acDb.from("annunci").update({ stato: "chiuso" }).eq("id", id).eq("autore_id", utenteId).then((r) => {
          if (r.error && AC.ui && AC.ui.toast) AC.ui.toast("Non riesco a chiudere l'annuncio sul server.", "error");
        });
      }
    },
    // Ricarica miei annunci e bacheca dal server (limite: una volta ogni 20 s, salvo `forza`).
    caricaAnnunci,
    leggiRisposta(id) {
      const r = (data.risposte || []).find((x) => x.id === id);
      if (r && !r.letta) {
        r.letta = true;
        save();
      }
    },
    chiediCredit() {
      data.creditSblocco = "attesa";
      save();
    },
    exportJSON() {
      return JSON.stringify(data, null, 2);
    },
    importJSON(obj) {
      if (!obj || typeof obj !== "object") return false;
      try {
        localStorage.setItem(KEY, JSON.stringify(obj));
      } catch (e) {
        return false;
      }
      data = load();
      listeners.forEach((fn) => fn());
      return true;
    },
    resetDemo() {
      const fam = data.famiglia;
      data = seed();
      if (fam) AC.store.setFamiglia(fam);
      else save();
    }
  };
})();
