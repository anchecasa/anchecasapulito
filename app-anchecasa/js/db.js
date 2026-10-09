/* Accesso ai dati. Due motori con le stesse funzioni:
   - "vero": Supabase (progetto AncheCasa, schema marketplace, tabelle app_);
   - "prova": dati di ESEMPIO nel browser, per vedere l'app senza toccare il database.
   La modalità prova si attiva con ?prova nell'indirizzo (o window.AC_PROVA = true). */
import { CONFIG } from "./config.js";

const PROVA = (() => {
  try { return new URLSearchParams(location.search).has("prova") || window.AC_PROVA === true; } catch (e) { return window.AC_PROVA === true; }
})();

/* ======================================================================== */
/* MOTORE VERO (Supabase)                                                    */
/* ======================================================================== */
function motoreVero() {
  const sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
    db: { schema: "marketplace" },
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  let uid = null;
  const ok = (r) => { if (r.error) throw r.error; return r.data; };
  const ritorno = () => location.origin + location.pathname;

  return {
    prova: false,
    async sessione() {
      const { data } = await sb.auth.getSession();
      const u = data.session && data.session.user;
      uid = u ? u.id : null;
      return u ? { id: u.id, email: u.email, meta: u.user_metadata || {} } : null;
    },
    suCambio(cb) { sb.auth.onAuthStateChange((evento) => cb(evento)); },
    async entra(email, password) { ok(await sb.auth.signInWithPassword({ email, password })); },
    async registrati({ email, password, nome, citta, ruolo }) {
      const d = ok(await sb.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: ritorno(),
          data: { famiglia: ruolo === "artigiano" ? "azienda" : "privato", nome, zona: citta, ruolo_app: ruolo },
        },
      }));
      if (d.session) { uid = d.user.id; await this.aggiungiRuolo(ruolo); }
      return { daConfermare: !d.session };
    },
    async recupera(email) { ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: ritorno() })); },
    async nuovaPassword(password) { ok(await sb.auth.updateUser({ password })); },
    async esci() { await sb.auth.signOut(); uid = null; },

    async profilo(meta) {
      const r = await sb.from("profiles").select("nome, zona, famiglia").eq("id", uid).maybeSingle();
      const p = r.data || {};
      return { nome: p.nome || meta.nome || "", citta: p.zona || meta.zona || "", telefono: meta.telefono || "", famiglia: p.famiglia || meta.famiglia || "" };
    },
    async salvaProfilo({ nome, citta, telefono }) {
      ok(await sb.from("profiles").update({ nome, zona: citta }).eq("id", uid));
      ok(await sb.auth.updateUser({ data: { telefono, nome, zona: citta } }));
    },
    async ruoli(meta, famiglia) {
      const r = ok(await sb.from("app_ruoli").select("ruolo"));
      let lista = r.map((x) => x.ruolo);
      if (!lista.length) {
        // Primo ingresso nell'app: il ruolo scelto all'iscrizione, oppure quello del sito.
        const iniziale = meta.ruolo_app === "artigiano" ? "artigiano" : famiglia === "privato" || !famiglia ? "privato" : null;
        if (iniziale) { await this.aggiungiRuolo(iniziale); lista = [iniziale]; }
      }
      const adm = await sb.rpc("is_admin");
      return { ruoli: lista, admin: adm.data === true, famiglia };
    },
    async aggiungiRuolo(ruolo) {
      const r = await sb.from("app_ruoli").insert({ utente: uid, ruolo });
      if (r.error && r.error.code !== "23505") throw r.error;
    },

    async analizza(body) {
      const r = await sb.functions.invoke(CONFIG.funzioneAnalisi, { body });
      if (r.error) {
        let msg = "analisi_non_riuscita";
        try { const j = await r.error.context.json(); msg = j.error || msg; } catch (e) { /* niente */ }
        throw new Error(msg);
      }
      if (!r.data || !r.data.ok) throw new Error("analisi_non_riuscita");
      return { diagnosi: r.data.diagnosi, motore: r.data.motore, id: r.data.id };
    },
    async aggiornaRichiesta(id, campi) { ok(await sb.from("app_richieste").update(campi).eq("id", id)); },
    async caricaFoto(id, n, blob) {
      ok(await sb.storage.from("supermastro").upload(`${id}/${n}.jpg`, blob, { contentType: "image/jpeg", upsert: false }));
    },
    async urlFoto(id, n) {
      const r = await sb.storage.from("supermastro").createSignedUrl(`${id}/${n}.jpg`, 3600);
      return r.data ? r.data.signedUrl : "";
    },
    async mieRichieste() { return ok(await sb.from("app_richieste").select("*").eq("privato", uid).order("creato", { ascending: false }).limit(50)); },
    async richiesta(id) { return ok(await sb.from("app_richieste").select("*").eq("id", id).maybeSingle()); },
    async inviiRichiesta(id) { return ok(await sb.rpc("app_invii_mia_richiesta", { p_richiesta: id })); },
    async vicini(lat, lng, mestiere) { return ok(await sb.rpc("app_artigiani_vicini", { p_lat: lat, p_lng: lng, p_mestiere: mestiere || "" })); },
    async invia(id, artigiani) { return ok(await sb.rpc("app_invia", { p_richiesta: id, p_artigiani: artigiani })); },
    async annulla(id) { ok(await sb.from("app_richieste").update({ stato: "annullata" }).eq("id", id)); },
    async recensisci(id, voti, testo) { return ok(await sb.rpc("app_recensisci", { p_richiesta: id, p_voti: voti, p_testo: testo })); },

    async mioArtigiano() { return ok(await sb.from("app_artigiani").select("*").eq("utente", uid).maybeSingle()); },
    async salvaArtigiano(dati) {
      const c = await this.mioArtigiano();
      if (c) ok(await sb.from("app_artigiani").update(dati).eq("utente", uid));
      else ok(await sb.from("app_artigiani").insert(Object.assign({ utente: uid }, dati)));
    },
    async ricevute() { return ok(await sb.rpc("app_richieste_ricevute")); },
    async rispondi(id, accetta) { return ok(await sb.rpc("app_rispondi", { p_richiesta: id, p_accetta: accetta })); },
    async mieRecensioni() { return ok(await sb.from("app_recensioni").select("*").eq("artigiano", uid).order("creato", { ascending: false })); },
    async chiediPassaggio(nota) { ok(await sb.from("app_passaggi_impresa").insert({ artigiano: uid, nota })); },
    async mieiPassaggi() { return ok(await sb.from("app_passaggi_impresa").select("*").eq("artigiano", uid).order("creato", { ascending: false })); },

    async segnala(dati) { ok(await sb.from("app_segnalazioni").insert(Object.assign({ segnalatore: uid }, dati))); },
    async mieSegnalazioni() { return ok(await sb.from("app_segnalazioni").select("*").eq("segnalatore", uid).order("creato", { ascending: false })); },

    async numeri() { return ok(await sb.rpc("app_numeri_admin")); },
    async artigiani() { return ok(await sb.from("app_artigiani").select("*").order("creato", { ascending: false }).limit(200)); },
    async statoArtigiano(id, stato) { ok(await sb.from("app_artigiani").update({ stato }).eq("utente", id)); },
    async passaggi() { return ok(await sb.from("app_passaggi_impresa").select("*").order("creato", { ascending: false }).limit(100)); },
    async decidiPassaggio(p, approva) {
      ok(await sb.from("app_passaggi_impresa").update({ stato: approva ? "approvata" : "rifiutata", deciso: new Date().toISOString() }).eq("id", p.id));
      if (approva) {
        const r = await sb.from("app_ruoli").insert({ utente: p.artigiano, ruolo: "impresa" });
        if (r.error && r.error.code !== "23505") throw r.error;
      }
    },
    async segnalazioni() { return ok(await sb.from("app_segnalazioni").select("*").order("creato", { ascending: false }).limit(200)); },
    async statoSegnalazione(id, stato) { ok(await sb.from("app_segnalazioni").update({ stato }).eq("id", id)); },
    async nomi(ids) {
      if (!ids.length) return {};
      const r = ok(await sb.from("profiles").select("id, nome").in("id", ids));
      return Object.fromEntries(r.map((x) => [x.id, x.nome]));
    },
  };
}

/* ======================================================================== */
/* MOTORE PROVA (dati di esempio nel browser)                                 */
/* ======================================================================== */
function motoreProva() {
  const CHIAVE = "anchecasa-app-prova-v1";
  const adesso = () => new Date().toISOString();
  const fa = (ore) => new Date(Date.now() - ore * 3600e3).toISOString();
  const nuovoId = () => "p-" + Math.random().toString(36).slice(2, 10);
  const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
  const seme = () => ({
    utente: null,
    utenti: {
      privato: { id: "u-privato", email: "privato@esempio.it", nome: "Giulia (esempio)", citta: "Roma", telefono: "", ruoli: ["privato"], admin: false },
      artigiano: { id: "u-artigiano", email: "artigiano@esempio.it", nome: "Marco (esempio)", citta: "Roma", telefono: "", ruoli: ["artigiano"], admin: false },
      admin: { id: "u-admin", email: "admin@esempio.it", nome: "Admin (esempio)", citta: "Roma", telefono: "", ruoli: [], admin: true },
    },
    artigiani: [
      { utente: "u-artigiano", nome_attivita: "Idraulica Esempio", mestieri: ["idraulico", "caldaista"], telefono: "000 000 0001", citta: "Roma", lat: 41.876, lng: 12.462, raggio_km: 10, disponibile: true, orari: "Lun-Sab 8-19", piva: "00000000001", descrizione: "Artigiano di esempio per la prova dell'app.", stato: "verificato", creato: fa(400) },
      { utente: "u-es2", nome_attivita: "Termoidraulica Esempio", mestieri: ["idraulico"], telefono: "000 000 0002", citta: "Roma", lat: 41.866, lng: 12.452, raggio_km: 10, disponibile: true, orari: "Lun-Ven 8-18", piva: "", descrizione: "", stato: "verificato", creato: fa(300) },
      { utente: "u-es3", nome_attivita: "Elettricista in attesa (esempio)", mestieri: ["elettricista"], telefono: "000 000 0003", citta: "Roma", lat: 41.89, lng: 12.49, raggio_km: 10, disponibile: true, orari: "", piva: "", descrizione: "", stato: "attesa", creato: fa(5) },
    ],
    richieste: [
      { id: "r-es1", privato: "u-altro", analisi: { problema: "Scarico della doccia lento", descrizione: "L'acqua scende piano: probabile tappo di capelli e calcare nel sifone.", mestiere: "idraulico", urgenza: "bassa", pericolo: false, fai_da_te: true, passi: [], attrezzi: [], avvertenze: [], esempio: true }, problema: "Scarico della doccia lento", mestiere: "idraulico", urgenza: "bassa", pericolo: false, citta: "Roma", lat: 41.87, lng: 12.47, telefono: "000 000 0009", nota: "", foto: 0, stato: "inviata", artigiano: null, creato: fa(2) },
    ],
    invii: [{ richiesta: "r-es1", artigiano: "u-artigiano", stato: "inviata", creato: fa(2), risposto: null }],
    recensioni: [
      { id: "v-es1", richiesta: "r-old1", artigiano: "u-artigiano", autore: "u-altro", voto: 4.8, voti: { qualita: 5, puntualita: 5, pulizia: 5, prezzo: 5, comunicazione: 4 }, testo: "Recensione di esempio.", creato: fa(200) },
    ],
    passaggi: [],
    segnalazioni: [],
    analisi: [],
    profili: { "u-altro": "Laura (esempio)" },
  });
  let db;
  try { db = JSON.parse(localStorage.getItem(CHIAVE) || "null"); } catch (e) { db = null; }
  if (!db || !db.utenti) db = seme();
  const salva = () => { try { localStorage.setItem(CHIAVE, JSON.stringify(db)); } catch (e) { /* niente */ } };
  const me = () => db.utente && db.utenti[db.utente];
  const uid = () => (me() ? me().id : null);
  const kmTra = (a, b) => {
    const r = (x) => (x * Math.PI) / 180;
    const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  };
  const media = (v) => (v.length ? Math.round((v.reduce((s, x) => s + Number(x.voto), 0) / v.length) * 10) / 10 : null);
  const ascolta = [];

  return {
    prova: true,
    accessiProva: ["privato", "artigiano", "admin"],
    async sessione() { const u = me(); return u ? { id: u.id, email: u.email, meta: {} } : null; },
    suCambio(cb) { ascolta.push(cb); },
    async entraProva(chi) { db.utente = chi; salva(); },
    async entra() { throw new Error("Nella prova si entra con i pulsanti qui sotto."); },
    async registrati() { throw new Error("Nella prova non si creano account."); },
    async recupera() {},
    async nuovaPassword() {},
    async esci() { db.utente = null; salva(); },
    async azzeraProva() { db = seme(); salva(); },

    async profilo() { const u = me(); return { nome: u.nome, citta: u.citta, telefono: u.telefono, famiglia: "" }; },
    async salvaProfilo({ nome, citta, telefono }) { Object.assign(me(), { nome, citta, telefono }); salva(); },
    async ruoli() { return { ruoli: me().ruoli.slice(), admin: me().admin, famiglia: "" }; },
    async aggiungiRuolo(r) { if (!me().ruoli.includes(r)) me().ruoli.push(r); salva(); },

    async analizza(body) {
      await pausa(1600);
      db.analisi.push({ utente: uid(), creato: adesso() }); salva();
      const nota = String(body.nota || "").toLowerCase();
      const elettrico = /presa|luce|corrente|interruttore|quadro/.test(nota);
      const d = elettrico
        ? { problema: "Presa che non dà corrente", descrizione: "ESEMPIO: la presa non funziona, può essere un collegamento allentato dietro il frutto.", mestiere: "elettricista", urgenza: "media", pericolo: true, motivo_pericolo: "Si lavora vicino alla corrente: meglio un elettricista.", fai_da_te: false, passi: [], attrezzi: [], avvertenze: ["Non smontare la presa con la corrente inserita."], titolo_richiesta: "Presa senza corrente", testo_richiesta: "La presa del soggiorno non dà corrente.", confidenza: 0.6, chiarimento: "" }
        : { problema: "Perdita dal sifone del lavello", descrizione: "ESEMPIO: il raccordo sotto il lavello gocciola, guarnizione usurata o dado allentato. Fondo del mobile bagnato.", mestiere: "idraulico", urgenza: "media", pericolo: false, motivo_pericolo: "", fai_da_te: true, passi: ["Chiudi il rubinetto sotto il lavello.", "Metti una bacinella sotto il sifone.", "Stringi a mano la ghiera del sifone.", "Se gocciola ancora, svita il sifone e cambia la guarnizione."], attrezzi: ["Bacinella", "Guarnizione del sifone"], avvertenze: ["Se l'acqua esce dal muro, fermati e chiama un idraulico."], titolo_richiesta: "Perdita dal sifone del lavello", testo_richiesta: "Il sifone sotto il lavello gocciola.", confidenza: 0.8, chiarimento: "" };
      Object.assign(d, { esempio: true });
      const id = nuovoId();
      db.richieste.unshift({ id, privato: uid(), stato: "nuova", artigiano: null, creato: adesso(), citta: String(body.citta || ""), lat: null, lng: null, telefono: "", nota: String(body.nota || ""), foto: 0, analisi: d, problema: d.problema, mestiere: d.mestiere, urgenza: d.urgenza, pericolo: d.pericolo });
      salva();
      return { diagnosi: d, motore: "prova", id };
    },
    async aggiornaRichiesta(id, campi) { Object.assign(db.richieste.find((r) => r.id === id), campi); salva(); },
    async caricaFoto(id, n, blob) {
      const url = await new Promise((ok) => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(blob); });
      try { sessionStorage.setItem("foto-" + id + "-" + n, url); } catch (e) { /* niente */ }
    },
    async urlFoto(id, n) { try { return sessionStorage.getItem("foto-" + id + "-" + n) || ""; } catch (e) { return ""; } },
    async mieRichieste() { return db.richieste.filter((r) => r.privato === uid()); },
    async richiesta(id) { return db.richieste.find((r) => r.id === id) || null; },
    async inviiRichiesta(id) {
      return db.invii.filter((i) => i.richiesta === id).map((i) => {
        const a = db.artigiani.find((x) => x.utente === i.artigiano) || {};
        return { artigiano: i.artigiano, nome_attivita: a.nome_attivita, telefono: a.telefono, stato: i.stato, risposto: i.risposto };
      });
    },
    async vicini(lat, lng, mestiere) {
      return db.artigiani
        .filter((a) => a.stato === "verificato" && a.disponibile && (!mestiere || mestiere === "altro" || a.mestieri.includes(mestiere)))
        .map((a) => { const v = db.recensioni.filter((x) => x.artigiano === a.utente); return Object.assign({}, a, { km: kmTra({ lat, lng }, a), voto: media(v), recensioni: v.length }); })
        .filter((a) => a.km <= Math.max(a.raggio_km, 5) + 30)
        .sort((x, y) => x.km - y.km).slice(0, 10);
    },
    async invia(id, artigiani) {
      const r = db.richieste.find((x) => x.id === id);
      let n = 0;
      artigiani.forEach((a) => { if (!db.invii.some((i) => i.richiesta === id && i.artigiano === a)) { db.invii.push({ richiesta: id, artigiano: a, stato: "inviata", creato: adesso(), risposto: null }); n++; } });
      if (n && r.stato === "nuova") r.stato = "inviata";
      salva();
      // Nella prova l'artigiano di esempio "Termoidraulica" accetta da solo dopo poco.
      if (artigiani.includes("u-es2")) setTimeout(() => { const i = db.invii.find((x) => x.richiesta === id && x.artigiano === "u-es2"); if (i && r.stato === "inviata") { i.stato = "accettata"; i.risposto = adesso(); r.stato = "accettata"; r.artigiano = "u-es2"; salva(); } }, 4000);
      return n;
    },
    async annulla(id) { db.richieste.find((r) => r.id === id).stato = "annullata"; salva(); },
    async recensisci(id, voti, testo) {
      const r = db.richieste.find((x) => x.id === id);
      const vs = Object.values(voti).map(Number);
      db.recensioni.push({ id: nuovoId(), richiesta: id, artigiano: r.artigiano, autore: uid(), voto: Math.round((vs.reduce((a, b) => a + b, 0) / vs.length) * 10) / 10, voti, testo, creato: adesso() });
      r.stato = "fatta"; salva();
    },

    async mioArtigiano() { return db.artigiani.find((a) => a.utente === uid()) || null; },
    async salvaArtigiano(dati) {
      const c = db.artigiani.find((a) => a.utente === uid());
      if (c) Object.assign(c, dati); else db.artigiani.push(Object.assign({ utente: uid(), stato: "attesa", creato: adesso() }, dati));
      salva();
    },
    async ricevute() {
      return db.invii.filter((i) => i.artigiano === uid()).map((i) => {
        const r = db.richieste.find((x) => x.id === i.richiesta);
        return { id: r.id, stato_invio: i.stato, stato: r.stato, problema: r.problema, mestiere: r.mestiere, urgenza: r.urgenza, pericolo: r.pericolo, analisi: r.analisi, citta: r.citta, lat: r.lat, lng: r.lng, foto: r.foto, nota: r.nota, nome_privato: (db.profili[r.privato] || "Cliente").split(" ")[0], telefono: i.stato === "accettata" ? r.telefono : "", creato: i.creato };
      });
    },
    async rispondi(id, accetta) {
      const i = db.invii.find((x) => x.richiesta === id && x.artigiano === uid());
      const r = db.richieste.find((x) => x.id === id);
      i.risposto = adesso();
      if (!accetta) { i.stato = "rifiutata"; salva(); return ""; }
      if (r.artigiano) throw new Error("gia_presa");
      i.stato = "accettata"; r.stato = "accettata"; r.artigiano = uid(); salva();
      return r.telefono;
    },
    async mieRecensioni() { return db.recensioni.filter((v) => v.artigiano === uid()); },
    async chiediPassaggio(nota) { db.passaggi.unshift({ id: nuovoId(), artigiano: uid(), stato: "richiesta", nota, creato: adesso() }); salva(); },
    async mieiPassaggi() { return db.passaggi.filter((p) => p.artigiano === uid()); },

    async segnala(dati) { db.segnalazioni.unshift(Object.assign({ id: nuovoId(), segnalatore: uid(), stato: "inviata", creato: adesso() }, dati)); salva(); },
    async mieSegnalazioni() { return db.segnalazioni.filter((s) => s.segnalatore === uid()); },

    async numeri() {
      const r30 = db.richieste;
      return { analisi_30g: db.analisi.length, richieste_30g: r30.length, inviate_30g: r30.filter((r) => r.stato !== "nuova").length, accettate_30g: r30.filter((r) => r.artigiano).length, artigiani_attesa: db.artigiani.filter((a) => a.stato === "attesa").length, artigiani_verificati: db.artigiani.filter((a) => a.stato === "verificato").length, passaggi_attesa: db.passaggi.filter((p) => p.stato === "richiesta").length, segnalazioni_nuove: db.segnalazioni.filter((s) => s.stato === "inviata").length, media_voti: media(db.recensioni), recensioni: db.recensioni.length };
    },
    async artigiani() { return db.artigiani.slice(); },
    async statoArtigiano(id, stato) { db.artigiani.find((a) => a.utente === id).stato = stato; salva(); },
    async passaggi() { return db.passaggi.slice(); },
    async decidiPassaggio(p, approva) {
      const x = db.passaggi.find((y) => y.id === p.id); x.stato = approva ? "approvata" : "rifiutata"; x.deciso = adesso();
      if (approva) { const u = Object.values(db.utenti).find((y) => y.id === p.artigiano); if (u && !u.ruoli.includes("impresa")) u.ruoli.push("impresa"); }
      salva();
    },
    async segnalazioni() { return db.segnalazioni.slice(); },
    async statoSegnalazione(id, stato) { db.segnalazioni.find((s) => s.id === id).stato = stato; salva(); },
    async nomi(ids) { const out = {}; ids.forEach((i) => { const u = Object.values(db.utenti).find((y) => y.id === i); out[i] = u ? u.nome : db.profili[i] || ""; }); return out; },
  };
}

export const DB = PROVA || !window.supabase ? motoreProva() : motoreVero();
