"""Genera il nuovo sito AncheCasa (anteprima 08.10.2026). Tutte le pagine nascono da qui."""
import json, re, os

MENU = [("trova", "trova.html", "Trova artigiano"), ("ristruttura", "ristruttura.html", "Ristruttura"),
        ("bacheca", "bacheca.html", "Bacheca"), ("appalti", "appalti.html", "Appalti"), ("app", "app.html", "App aziende"),
        ("agenti", "agenti.html", "Agenti"), ("come", "come-funziona.html", "Come funziona"), ("prezzi", "prezzi.html", "Prezzi")]

# ---------------- App per categoria ----------------
MOD = {"cantiere": "Cantiere", "presenze": "Presenze", "rapportini": "Rapportini", "giornali": "Giornale dei lavori", "sal": "SAL",
       "cronoprogramma": "Cronoprogramma", "magazzino": "Magazzino", "mezzi": "Mezzi", "app": "App di cantiere", "listino": "Listino",
       "ordini": "Ordini", "consegne": "Consegne", "flotta": "Flotta", "calendario": "Calendario", "noleggi": "Noleggi",
       "manumezzi": "Manutenzione mezzi", "spedizioni": "Spedizioni", "turni": "Turni", "personale": "Personale",
       "sopralluoghi": "Sopralluoghi", "interventi": "Interventi", "sanificazioni": "Sanificazioni", "manutenzioni": "Manutenzioni",
       "archivio": "Archivio", "struttura": "Struttura", "camere": "Camere", "vetrina": "Vetrina", "tracking": "Tracking",
       "pratiche": "Pratiche", "immobili": "Immobili", "mandati": "Mandati", "visite": "Visite", "agenda": "Agenda",
       "preventivi": "Preventivi", "clienti": "Clienti", "stabili": "Stabili", "segnalazioni": "Segnalazioni", "assemblee": "Assemblee"}
APP = [
    ("imprese-edili", "Imprese edili", "az-team", ["cantiere", "presenze", "rapportini", "giornali", "sal", "cronoprogramma", "magazzino", "mezzi", "app"], "Dal cantiere all'ufficio: presenze, SAL e magazzino in un'app sola."),
    ("artigiani", "Artigiani e installatori", "contatti", ["agenda", "preventivi", "interventi", "clienti"], "Agenda, preventivi e clienti dal telefono, senza carta."),
    ("subappaltatori", "Subappaltatori", "az-subappalti", ["cantiere", "presenze", "rapportini", "sal", "app"], "Le squadre, le ore e gli stati di avanzamento per il general contractor."),
    ("impiantisti", "Impiantisti", "az-agenzia-idraulico", ["cantiere", "rapportini", "sal", "magazzino", "app"], "Impianti, materiali e rapportini di ogni intervento."),
    ("condominio", "Condominio e amministratori", "az-condominio-ditta", ["stabili", "segnalazioni", "assemblee", "manutenzioni", "archivio"], "Stabili, segnalazioni dei condomini, assemblee e lavori del palazzo."),
    ("materiali-edili", "Materiali edili", "az-serv-fornitore", ["listino", "ordini", "consegne"], "Listino, ordini dei cantieri e consegne."),
    ("noleggio-attrezzature", "Noleggio attrezzature", "az-mezzi", ["flotta", "calendario", "noleggi", "manumezzi"], "Flotta, calendario dei noleggi e manutenzione dei mezzi."),
    ("traslochi", "Traslochi", "az-forniture", ["spedizioni", "mezzi", "turni"], "Viaggi, mezzi e squadre organizzati."),
    ("facchinaggio", "Facchinaggio", "az-forniture", ["turni", "magazzino", "spedizioni", "personale"], "Turni, personale e movimentazione merci."),
    ("pulizie", "Pulizie", "az-luogo-hotel", ["sopralluoghi", "interventi", "sanificazioni", "personale", "turni"], "Sopralluoghi, interventi e sanificazioni con le squadre giuste."),
    ("manutenzione-stabili", "Manutenzione stabili", "az-condominio-ditta", ["manutenzioni", "archivio", "turni", "personale"], "Manutenzioni programmate e storico di ogni stabile."),
    ("hotel", "Hotel", "az-luogo-hotel", ["struttura", "camere", "turni"], "Struttura, camere e turni del personale."),
    ("ristoranti", "Ristoranti", "card-cucina", ["struttura", "turni", "magazzino"], "Turni di sala e cucina, magazzino e fornitori."),
    ("negozi", "Negozi", "ac-telefono-vicino", ["vetrina", "magazzino"], "Vetrina online e magazzino del negozio."),
    ("capannoni-logistica", "Capannoni e logistica", "az-forniture", ["magazzino", "spedizioni", "tracking", "personale"], "Magazzino, spedizioni e tracciamento."),
    ("studi-tecnici", "Studi tecnici", "az-ufficio", ["pratiche"], "Pratiche, progetti e documenti dei clienti."),
    ("consulenti", "Consulenti", "az-gc-documenti", ["pratiche"], "Pratiche e scadenze dei clienti in ordine."),
    ("fornitori-it", "Fornitori IT", "ac-telefono-vicino", ["vetrina"], "La tua vetrina per le aziende della rete."),
    ("agenzie-immobiliari", "Agenzie immobiliari", "card-casa", ["immobili", "mandati", "visite"], "Immobili, mandati e visite in un posto solo."),
]
MODDESC = {"cantiere": "Ogni cantiere con indirizzo, squadre, foto e documenti.", "presenze": "Chi c'è in cantiere ogni giorno, con entrata e uscita dal telefono.",
    "rapportini": "Il rapportino di fine giornata: ore, lavori fatti e materiali.", "giornali": "Il giornale dei lavori sempre aggiornato, pronto per il direttore lavori.",
    "sal": "Gli stati di avanzamento lavori con importi e percentuali.", "cronoprogramma": "Le fasi del lavoro su un calendario, con le scadenze.",
    "magazzino": "Cosa c'è, cosa entra e cosa esce, con le giacenze.", "mezzi": "Mezzi e furgoni: dove sono, chi li usa, scadenze.",
    "app": "L'app per gli operai in cantiere: vedono solo quello che serve a loro.", "listino": "Il tuo listino prodotti con prezzi e disponibilità.",
    "ordini": "Gli ordini che arrivano dai cantieri, in un elenco solo.", "consegne": "Le consegne del giorno: dove, quando e a chi.",
    "flotta": "Tutti i mezzi a noleggio con lo stato di ognuno.", "calendario": "Quando ogni mezzo è libero o già prenotato.",
    "noleggi": "Contratti di noleggio, ritiri e rientri.", "manumezzi": "Tagliandi, revisioni e guasti dei mezzi.",
    "spedizioni": "Viaggi e spedizioni con partenza, arrivo e stato.", "turni": "I turni del personale, visibili a tutti dal telefono.",
    "personale": "Le persone dell'azienda con ruoli e documenti.", "sopralluoghi": "Sopralluoghi con foto, misure e note.",
    "interventi": "Ogni intervento con data, operatore e cosa è stato fatto.", "sanificazioni": "Sanificazioni programmate con i loro certificati.",
    "manutenzioni": "Manutenzioni programmate e storico di ogni intervento.", "archivio": "Documenti e storico sempre a portata di mano.",
    "struttura": "La tua struttura: spazi, reparti e attrezzature.", "camere": "Lo stato delle camere: libere, occupate, da pulire.",
    "vetrina": "La tua vetrina nella rete AncheCasa, vista da clienti e aziende.", "tracking": "Dove si trova ogni spedizione, in tempo reale.",
    "pratiche": "Pratiche e progetti dei clienti con documenti e scadenze.", "immobili": "Gli immobili che gestisci, con foto e schede.",
    "mandati": "I mandati con durata e condizioni.", "visite": "Le visite fissate con i clienti.",
    "agenda": "Gli appuntamenti della giornata, anche dal telefono.", "preventivi": "Preventivi fatti in pochi minuti e mandati in chat.",
    "clienti": "I tuoi clienti con lavori fatti e contatti.", "stabili": "Gli stabili che amministri, con le loro schede.",
    "segnalazioni": "I condomini segnalano un guasto dall'app, tu lo assegni.", "assemblee": "Convocazioni, verbali e documenti delle assemblee."}
FORNITORI = {"materiali-edili", "noleggio-attrezzature", "fornitori-it"}
def tipo_app(id_):
    return "artigiano" if id_ == "artigiani" else ("fornitore" if id_ in FORNITORI else "impresa")
def prezzo_app(id_):
    if id_ == "artigiani": return "14,90 €", "al mese", "Prezzo per gli artigiani"
    if id_ in FORNITORI: return "99 €", "al mese", "Prezzo per i fornitori"
    return "49 €", "al mese", "Prezzo per le imprese"
AC_APP = [{"id": a[0], "nome": a[1]} for a in APP]


GRUPPI = [
    ("casa", "Per la casa", {"trova", "ristruttura", "bacheca"}, [
        ("trova.html", "Trova artigiano", "Video di 5 secondi, artigiani in zona"),
        ("supermastro.html", "SuperMastro", "Il pronto intervento per i guasti"),
        ("ristruttura.html", "Ristruttura casa", "AncheCasa general contractor, con garanzie"),
        ("bacheca.html", "Bacheca annunci", "Case, affitti, alloggi studenti, lavoro")]),
    ("aziende", "Per le aziende", {"app", "appalti", "servizi"}, [
        ("app.html", "App per la tua attività", "Un'app per ogni mestiere, con l'Ufficio"),
        ("appalti.html", "Appalti e subappalti", "General contractor, imprese e fornitori"),
        ("opportunita.html", "Opportunità", "Club riservato, solo su invito"),
        ("anchevoice.html", "AncheVoice", "Il centralino unico"),
        ("https://sicura.anchecasa.it", "AncheSicura", "La sicurezza di AncheCasa")]),
    ("lavora", "Lavora con noi", {"agenti", "partner", "citta"}, [
        ("agenti.html", "Diventa agente", "Porti persone e aziende nella rete"),
        ("partner.html", "Diventa partner", "La tua impresa col marchio AncheCasa"),
        ("citta.html", "AncheCasa nella tua città", "Le città d'Italia")]),
]
SEMPLICI = [("come", "come-funziona.html", "Come funziona"), ("prezzi", "prezzi.html", "Prezzi")]
FRECCIA = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
def menu_html(page):
    h = '<nav class="menu" id="menu" aria-label="Menu principale">'
    for gid, label, pagine, voci in GRUPPI:
        on = " on" if page in pagine else ""
        h += f'<div class="gruppo{on}"><button type="button" class="apri" aria-expanded="false" aria-controls="g-{gid}">{label}{FRECCIA}</button><div class="tendina" id="g-{gid}">'
        h += "".join(f'<a href="{u}"><b>{t}</b><small>{d}</small></a>' for u, t, d in voci) + "</div></div>"
    h += "".join(f'<a class="voce' + (' on" aria-current="page' if k == page else '') + f'" href="{u}">{l}</a>' for k, u, l in SEMPLICI)
    return h + "</nav>"

ANTEPRIMA = True   # alla pubblicazione: False (sparisce la barra arancione)
NOTA_ANTEPRIMA = '<div class="nota-anteprima">Anteprima del nuovo sito · non è online</div>' if ANTEPRIMA else ""

def head(title, desc, page):
    return f"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#16304D">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="icon" href="favicon-32x32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="css/ac.css?v=2">
</head>
<body data-page="{page}">
<a class="skip" href="#contenuto">Vai al contenuto</a>
{NOTA_ANTEPRIMA}
<header class="testata"><div class="wrap">
  <a class="marchio" href="index.html" aria-label="AncheCasa, home"><img src="assets/logo-colore.png" alt="AncheCasa · Costruiamo fiducia"></a>
  {menu_html(page)}
  <div class="azioni">
    <a class="accedi" href="https://areaprivata.anchecasa.it/">Accedi</a>
    <a class="btn" href="iscriviti.html">Iscriviti</a>
    <button class="hamburger" id="hamburger" type="button" aria-label="Apri il menu" aria-expanded="false" aria-controls="menu"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
  </div>
</div></header>
<main id="contenuto">
"""

PIEDE = """</main>
<footer class="piede"><div class="wrap">
  <div class="col">
    <div><img src="assets/logo-negativo.png" alt="AncheCasa · Costruiamo fiducia"><p style="margin-top:14px;max-width:260px">Artigiani, imprese, fornitori e servizi per la casa e il lavoro, in tutta Italia.</p></div>
    <div><h4>Per la casa</h4><a href="trova.html">Trova artigiano</a><a href="supermastro.html">SuperMastro · video 5 secondi</a><a href="ristruttura.html">Ristruttura casa</a><a href="bacheca.html">Bacheca annunci</a></div>
    <div><h4>Per le aziende</h4><a href="app.html">App per la tua attività</a><a href="appalti.html">Appalti e subappalti</a><a href="anchevoice.html">AncheVoice</a><a href="https://sicura.anchecasa.it">AncheSicura</a><a href="opportunita.html">Opportunità</a></div>
    <div><h4>Lavora con noi</h4><a href="agenti.html">Diventa agente</a><a href="partner.html">Diventa partner</a><a href="citta.html#roma">AncheCasa nelle città</a></div>
    <div><h4>AncheCasa</h4><a href="come-funziona.html">Come funziona</a><a href="servizi.html">Tutti i servizi</a><a href="prezzi.html">Prezzi</a><a href="faq.html">Domande frequenti</a><a href="chi-siamo.html">Chi siamo</a><a href="contatti.html">Contatti</a></div>
  </div>
  <div class="basso"><span>AncheCasa è un marchio di Palumbo Investments Srl. Tutti i diritti riservati.</span>
    <nav aria-label="Informazioni legali"><a href="privacy.html">Privacy</a><a href="cookie.html">Cookie</a><a href="note-legali.html">Note legali</a></nav></div>
</div></footer>
<script>window.AC_APP=""" + json.dumps(AC_APP, ensure_ascii=False) + """;</script>
<script src="js/ac.js?v=1"></script>
</body>
</html>
"""

def hero(img, kicker, h1, lead, extra="", basso=True, alt=""):
    return f"""<section class="hero{' basso' if basso else ''}">
  <img src="img/hero/{img}.jpg" alt="{alt}">
  <div class="wrap">
    <p class="kicker">{kicker}</p>
    <h1>{h1}</h1>
    <p class="lead">{lead}</p>
    {extra}
  </div>
</section>
"""

def scrivi(nome, page, title, desc, corpo):
    open(nome, "w", encoding="utf-8").write(head(title, desc, page) + corpo + PIEDE)

def foto(n): return f"img/foto/{n}.jpg"

def cartafoto(href, img, titolo, testo, vai, cls=""):
    return f'<a class="carta-foto {cls}" href="{href}"><img src="{foto(img)}" alt="" loading="lazy"><div class="t"><h3>{titolo}</h3><p>{testo}</p><span class="vai">{vai} →</span></div></a>'

def box(titolo, testo, href=None, stato=None, scls="", ico=""):
    tag = "a" if href else "div"
    h = f' href="{href}"' if href else ""
    s = f'<span class="stato {scls}">{stato}</span>' if stato else ""
    i = f'<span class="ico">{ico}</span>' if ico else ""
    return f'<{tag} class="box"{h}>{s}{i}<h3>{titolo}</h3><p>{testo}</p></{tag}>'

def passi(lista, vert=False):
    return f'<div class="passi{" verticali" if vert else ""}">' + "".join(f'<div class="passo"><div><h3>{t}</h3><p>{d}</p></div></div>' for t, d in lista) + "</div>"

def telefono(titolo, righe, tab="Richieste"):
    tabs = "".join(f'<span class="{"on" if t == tab else ""}">{t}</span>' for t in ["Piazza", "Pubblica", "Richieste", "Profilo"])
    return f'<div class="telefono" aria-hidden="true"><div class="schermo"><div class="barra"><img src="assets/logo-colore.png" alt=""><span>{titolo}</span></div><div class="corpo">{righe}</div><div class="tabbar">{tabs}</div></div></div>'

ICO = {
    "chat": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4z"/></svg>',
    "zona": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    "scudo": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    "video": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/></svg>',
    "rete": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M12 7.5v4M12 11.5L6.5 16M12 11.5l5.5 4.5"/></svg>',
    "euro": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 7a7 7 0 1 0 0 10M4 10h10M4 14h10"/></svg>',
    "chiave": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/></svg>',
    "doc": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7"/></svg>',
}

CITTA = ["Roma", "Milano", "Napoli", "Torino", "Palermo", "Genova", "Bologna", "Firenze", "Bari", "Catania", "Venezia", "Verona", "Padova", "Trieste", "Brescia", "Parma", "Cagliari", "Perugia", "Pescara", "Ancona", "Reggio Calabria", "Salerno", "Latina", "Bergamo"]
def citta_links(n=None):
    return '<div class="citta">' + "".join(f'<a href="citta.html#{c.lower().replace(" ", "-")}">{c}</a>' for c in (CITTA[:n] if n else CITTA)) + "</div>"


GARANZIE = [
    ("Imprese selezionate", "Non lavora chiunque. AncheCasa sceglie le imprese partner una per una: documenti, lavori fatti, referenze.", "rete"),
    ("Fideiussione", "Il lavoro che affidi ad AncheCasa è garantito da una fideiussione.", "scudo"),
    ("Conto dedicato", "I tuoi pagamenti passano da un conto dedicato al tuo lavoro, non si mescolano con altro.", "euro"),
    ("Un contratto, un referente", "Firmi solo con AncheCasa, general contractor: risponde di tutto, anche se lavorano più imprese.", "doc"),
    ("La tua app", "Segui il cantiere dal telefono: avanzamento, foto, documenti e pagamenti.", "video"),
    ("Segnali, AncheCasa interviene", "Qualcosa non va? Lo segnali dall'app e AncheCasa interviene con l'impresa.", "chat"),
]
def garanzie(titolo="Perché puoi fidarti", sotto="AncheCasa vuole una cosa sola: costruire fiducia con te."):
    return (f'<section class="sez" id="garanzie"><div class="wrap"><div class="testa"><div><p class="kicker">Costruiamo fiducia</p><h2>{titolo}</h2><p>{sotto}</p></div></div><div class="griglia tre">'
            + "".join(box(t, d, None, None, "", ICO[i]) for t, d, i in GARANZIE)
            + '</div><p style="color:var(--grigio);margin-top:18px;font-size:15px">Fideiussione e conto dedicato: tutto messo per iscritto nel contratto con AncheCasa.</p></div></section>')
APP_CLIENTE = telefono("Il mio cantiere", '<div class="riga blu"><b>Bagno e cucina</b><small style="color:rgba(255,255,255,.75)">Avanzamento 60%</small></div><div class="riga"><b>Foto di oggi</b><small>Posa delle piastrelle</small></div><div class="riga"><b>Documenti e pagamenti</b><small>Contratto, fideiussione, SAL</small></div><div class="riga"><b>Chat con il referente</b><small>Il tuo referente AncheCasa</small></div><div class="riga"><b>Prossima fase</b><small>Impianto elettrico</small></div><div class="riga arancio">Segnala un problema</div>', "Richieste")

# ======================= HOME =======================
cerca = """<form class="cerca" id="cerca" autocomplete="off" role="search">
      <label><span>Cosa ti serve?</span><input id="q" type="text" placeholder="Es. idraulico, ristrutturazione, subappalto"></label>
      <label class="dove"><span>Dove?</span><input id="dove" type="text" placeholder="Città o CAP"></label>
      <button class="btn" type="submit"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>Cerca</button>
      <div class="sugg" id="sugg" hidden></div>
    </form>
    <div class="chips"><b>Più cercati:</b><button type="button" data-q="Idraulico">Idraulico</button><button type="button" data-q="Elettricista">Elettricista</button><button type="button" data-q="Imbianchino">Imbianchino</button><button type="button" data-q="Ristrutturazione">Ristrutturazione</button><button type="button" data-q="Subappalto">Subappalto</button></div>
    <a class="sos" href="trova.html"><i>▶</i>Guasto in casa? Fai un video di 5 secondi e trovi l'artigiano in zona</a>"""
home = hero("home", "AncheCasa · Costruiamo fiducia", 'Di chi hai bisogno<br><span class="acc">oggi?</span>',
            "Artigiani, imprese e fornitori della tua zona. Scrivi cosa ti serve, ricevi i preventivi, chiudi in chat.", cerca, basso=False,
            alt="Cantiere AncheCasa in una via di città")
home += f"""<section class="sez"><div class="wrap">
  <div class="testa"><div><h2>Cosa puoi fare con AncheCasa</h2><p>Scegli da dove partire.</p></div></div>
  <div class="porte">
    <a class="carta-foto grande" href="ristruttura.html"><img src="{foto('hero')}" alt="Cantiere AncheCasa con il furgone e lo striscione" loading="lazy"><div class="t">
      <p class="kicker" style="margin:0">AncheCasa general contractor</p><h3>Ristruttura casa con AncheCasa</h3>
      <p>Un solo referente e un solo contratto. I lavori li fanno le imprese partner AncheCasa della tua città, e AncheCasa ne risponde.</p>
      <ul class="lista"><li><strong>Imprese selezionate</strong>, una per una.</li><li><strong>Fideiussione</strong> sul lavoro e <strong>conto dedicato</strong> per i pagamenti.</li><li><strong>L'app del tuo cantiere</strong>: segui tutto e segnali, AncheCasa interviene.</li><li><strong>Sopralluogo gratuito</strong> e preventivo unico.</li></ul>
      <span class="vai">Chiedi un sopralluogo →</span></div></a>
    {cartafoto("trova.html", "priv-pittore", "Trova l'artigiano in zona", "Un video o una foto del lavoro, e ti rispondono gli artigiani più vicini.", "Trova artigiano")}
    {cartafoto("bacheca.html", "studenti", "Bacheca annunci", "Case in vendita e in affitto, alloggi per studenti, lavoro. Aperta a tutti, con la chat.", "Apri la bacheca")}
    {cartafoto("appalti.html", "az-cantiere-app", "Appalti e subappalti", "I general contractor trovano imprese e fornitori di materiali e servizi.", "Vai agli appalti")}
    {cartafoto("app.html", "az-luogo-hotel", "App per la tua attività", "Impresa, artigiano, condominio, hotel, negozio: l'app del tuo mestiere.", "Scopri le app")}
    {cartafoto("partner.html", "card-villetta", "Diventa partner nella tua città", "La tua impresa col marchio AncheCasa, lavori assegnati e app incluse.", "Candida l'impresa")}
  </div>
</div></section>
<section class="sez blu"><div class="wrap">
  <div class="testa"><div><p class="kicker">Perché AncheCasa</p><h2>Cambiamo il modo di fare impresa.</h2><p style="color:rgba(255,255,255,.82)">Un'azienda sola che mette dalla stessa parte chi cerca e chi lavora.</p></div><a class="btn" href="chi-siamo.html">Chi siamo</a></div>
  <div class="griglia tre">
    <div><h3 style="color:#fff">Per i privati, tutto gratis</h3><p style="color:rgba(255,255,255,.82)">Artigiano in zona, bacheca, chat e sopralluogo senza pagare nulla. Solo vantaggi.</p></div>
    <div><h3 style="color:#fff">Per chi lavora, lavoro vero</h3><p style="color:rgba(255,255,255,.82)">Richieste del tuo mestiere nella tua zona, app per la tua attività, appalti e forniture.</p></div>
    <div><h3 style="color:#fff">Per tutti, fiducia</h3><p style="color:rgba(255,255,255,.82)">Imprese selezionate, garanzie per iscritto e un referente che risponde.</p></div>
  </div>
</div></section>
<section class="sez carta"><div class="wrap duo">
  <div><p class="kicker">Costruiamo fiducia, con te</p><h2>Ristrutturi con AncheCasa?<br>Sei garantito.</h2>
    <ul class="lista"><li><strong>Imprese selezionate</strong> da AncheCasa, una per una.</li><li><strong>Fideiussione</strong> sul lavoro e <strong>conto dedicato</strong> per i tuoi pagamenti.</li><li><strong>Un solo contratto</strong> con AncheCasa, general contractor.</li><li><strong>La tua app</strong>: segui tutto, segnali, AncheCasa interviene.</li></ul>
    <div class="btns" style="margin-top:24px"><a class="btn" href="ristruttura.html#garanzie">Le nostre garanzie</a><a class="btn linea" href="iscriviti.html#privato">Iscriviti gratis</a></div></div>
  {APP_CLIENTE}
</div></section>
<section class="sez blu"><div class="wrap duo">
  <div><p class="kicker">SuperMastro · un servizio AncheCasa</p><h2>Guasto in casa?<br>Bastano 5 secondi.</h2>
    <p style="color:rgba(255,255,255,.82)">Riprendi il guasto con il telefono. Capiamo che mestiere serve e ti mostriamo gli artigiani della tua zona: prima gli iscritti AncheCasa, poi i più vicini sulla mappa.</p>
    <div class="btns" style="margin-top:24px"><a class="btn" href="trova.html">Fai il video</a><a class="btn chiaro" href="supermastro.html">Come funziona</a></div></div>
  <img src="{foto('sm-video')}" alt="Con SuperMastro si riprende il guasto per 5 secondi" loading="lazy">
</div></section>
<section class="sez"><div class="wrap">
  <div class="testa"><div><h2>Come funziona</h2><p>Tre passi, dal telefono o dal computer.</p></div><a class="btn linea" href="come-funziona.html">Scopri tutto</a></div>
  {passi([("Dici cosa ti serve", "Poche righe, la zona e un video o una foto."), ("Ti rispondono", "Solo chi fa quel lavoro, nella tua zona."), ("Scegli e chiudi in chat", "Preventivo, accordo e documenti restano lì.")])}
</div></section>
<section class="sez carta"><div class="wrap">
  <div class="testa"><div><h2>Tutti i servizi</h2><p>Un marchio, tanti strumenti per la casa e per il lavoro.</p></div><a class="btn linea" href="servizi.html">Vedi tutti</a></div>
  <div class="griglia">
    {box("AncheVoice", "Il centralino unico per ufficio, cantiere e artigiani.", "anchevoice.html", "A breve", "breve", ICO["chat"])}
    {box("AncheSicura", "La sicurezza di AncheCasa: sicurezza sul lavoro, corsi, medicina e documenti.", "https://sicura.anchecasa.it", "Attivo", "", '<img class="ico-logo" src="assets/anchesicura-payoff-colore.png" alt="AncheSicura · La sicurezza di AncheCasa">')}
    {box("Opportunità", "Club riservato: progetti portati dagli agenti e controllati da AncheCasa, per imprese selezionate.", "opportunita.html", "Area riservata", "ris", ICO["chiave"])}
    {box("Diventa agente", "Porti persone e aziende nella rete, il guadagno resta tuo.", "agenti.html", None, "", ICO["rete"])}
  </div>
</div></section>
<section class="sez"><div class="wrap">
  <div class="banner"><img src="img/hero/citta.jpg" alt="Una città italiana"><div class="t"><p class="kicker">Tutta Italia</p><h2>AncheCasa arriva nella tua città</h2><p>Cerchiamo imprese partner città per città. Guarda la tua.</p>{citta_links(8)}</div></div>
</div></section>
"""
scrivi("index.html", "home", "AncheCasa · Costruiamo fiducia", "Artigiani, imprese e fornitori della tua zona. Ristrutturazioni, appalti e app per la tua attività.", home)

# ======================= TROVA ARTIGIANO =======================
mappa_svg = """<svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mappa della zona">
<rect width="600" height="300" fill="#e3eadf"/><path d="M0 210 C120 180 220 240 330 200 S520 150 600 175" stroke="#b9d0e8" stroke-width="22" fill="none"/>
<g stroke="#fff" stroke-width="9" fill="none"><path d="M40 0v300M170 0v300M310 0v300M450 0v300M0 70h600M0 140h600M0 250h600"/></g>
<circle cx="300" cy="150" r="70" fill="rgba(229,107,16,.12)" stroke="#E56B10" stroke-dasharray="6 6"/>
<circle cx="300" cy="150" r="9" fill="#16304D" stroke="#fff" stroke-width="3"/><text x="300" y="128" text-anchor="middle" font-family="DM Sans" font-size="13" font-weight="700" fill="#16304D">Tu</text></svg>"""
tr = hero("trova", "Trova artigiano", 'L\'artigiano giusto,<br><span class="acc">vicino a te.</span>',
          "Fai un video di 5 secondi o una foto del lavoro. Capiamo che mestiere serve e ti mostriamo chi lavora nella tua zona.",
          '<div class="btns"><a class="btn" href="#trova">Inizia</a><a class="btn chiaro" href="supermastro.html">Cos\'è SuperMastro</a></div>', alt="Una donna riprende un guasto con il telefono")
tr += f"""<section class="sez carta" id="trova"><div class="wrap">
  <div class="flusso">
    <div class="pannello">
      <div class="passo-num"><b>1</b>Il lavoro</div>
      <label class="carica" for="t-file">
        <span class="ico" style="width:56px;height:56px;border-radius:16px;background:var(--arancio-chiaro);color:var(--arancio);display:grid;place-items:center">{ICO['video']}</span>
        <strong style="color:var(--blu);font-size:19px">Fai un video di 5 secondi o una foto</strong>
        <span style="color:var(--grigio)">Dal telefono si apre la fotocamera. Dal computer scegli un file.</span>
        <span id="t-file-nome" style="font-weight:700;color:var(--arancio)"></span>
        <input id="t-file" type="file" accept="video/*,image/*" capture="environment">
      </label>
      <div id="t-anteprima" style="margin-top:14px"></div>
      <div class="modulo" style="margin-top:16px">
        <label>Oppure scegli il mestiere<select id="t-mestiere"><option value="">Scegli…</option></select></label>
      </div>
    </div>
    <div class="pannello">
      <div class="passo-num"><b>2</b>La diagnosi e la zona</div>
      <div class="diagnosi" id="t-diagnosi" hidden>
        <small>Diagnosi</small><strong style="font-size:22px">Serve: <span id="t-diag-mestiere">idraulico</span></strong>
        <small>La diagnosi la fa l'intelligenza artificiale sul tuo video. Se serve, puoi cambiare il mestiere.</small>
      </div>
      <div class="modulo" style="margin-top:16px">
        <label>Città o CAP<input id="t-citta" type="text" placeholder="Es. Roma o 00184" required></label>
        <button class="btn linea" type="button" id="t-geo">Usa la mia posizione</button>
        <button class="btn" type="button" id="t-cerca">Trova gli artigiani in zona</button>
      </div>
    </div>
  </div>
</div></section>
<section class="sez" id="t-risultati" hidden><div class="wrap">
  <div class="testa"><div><p class="kicker">3 · Artigiani in zona</p><h2>Cerchi un <span class="t-m">idraulico</span> a <span class="t-c">Roma</span></h2><p>Nell'app vedi prima gli iscritti AncheCasa, con cui parli in chat, poi i 5 più vicini trovati su Google Maps, con la chiamata diretta.</p></div></div>
  <div class="duo" style="align-items:start">
    <div>
      <h3 style="margin-bottom:12px">Iscritti AncheCasa a <span class="t-c">Roma</span></h3>
      <div class="vuoto">Qui compaiono gli artigiani iscritti ad AncheCasa che fanno questo lavoro nella tua città, con scheda, lavori fatti e recensioni. Gli rispondi in chat.</div>
      <h3 style="margin:24px 0 12px">I più vicini su Google Maps</h3>
      <div class="vuoto">I 5 artigiani più vicini a te, con distanza, orari e pulsante «Chiama».</div>
      <div class="btns" style="margin-top:22px"><a class="btn" href="iscriviti.html#privato">Pubblica la richiesta</a><a class="btn linea" href="bacheca.html">Metti l'annuncio in bacheca</a></div>
    </div>
    <div class="mappa">{mappa_svg}</div>
  </div>
</div></section>
<section class="sez"><div class="wrap duo">
  <img src="{foto('sm-presa')}" alt="Si riprende una presa rotta con SuperMastro" loading="lazy">
  <div><p class="kicker">Come fare il video</p><h2>Cinque secondi, fatti bene.</h2>
    <ul class="lista"><li><strong>Avvicinati</strong>: il guasto deve riempire lo schermo.</li><li><strong>Tieni fermo</strong> il telefono per 5 secondi.</li><li><strong>Fai luce</strong>: accendi la torcia se è buio.</li><li>Per l'elettricità <strong>non toccare niente</strong>: riprendi e basta.</li></ul></div>
</div></section>
<section class="sez carta"><div class="wrap">
  <div class="testa"><div><h2>Perché funziona</h2></div></div>
  <div class="griglia">{box("Solo chi fa quel lavoro", "La richiesta arriva a chi ha quel mestiere nel profilo.", None, None, "", ICO["zona"])}{box("Solo nella tua zona", "Conta dove si fa il lavoro, non dove sta l'artigiano.", None, None, "", ICO["zona"])}{box("Il tuo numero protetto", "Parli in chat finché non decidi tu.", None, None, "", ICO["scudo"])}{box("Recensioni vere", "Dopo il lavoro lasci da 1 a 5 stelle e due righe.", None, None, "", ICO["chat"])}</div>
</div></section>
"""
scrivi("trova.html", "trova", "Trova artigiano · AncheCasa", "Un video di 5 secondi o una foto: trovi gli artigiani della tua zona.", tr)

# ======================= SUPERMASTRO =======================
sm = hero("supermastro", "SuperMastro · un servizio AncheCasa", 'Scatta, invia,<br><span class="acc">risolviamo.</span>',
          "Il pronto intervento per la casa: un video di 5 secondi del guasto, SuperMastro capisce che mestiere serve e trovi l'artigiano in zona.",
          '<div class="btns"><a class="btn" href="trova.html#trova">Fai il video</a><a class="btn chiaro" href="#passi">Come funziona</a></div>', alt="SuperMastro, la mascotte di AncheCasa, con la chiave inglese")
PASSI_SM = [("sm-video", "Fai un video di 5 secondi", "Apri SuperMastro e inquadra il guasto: rubinetto, presa, serratura, caldaia."),
            ("sm-diagnosi", "SuperMastro capisce", "L'intelligenza artificiale riconosce il problema, il mestiere che serve e quanto è urgente. Tu confermi."),
            ("card-villetta", "L'artigiano in zona", "Ti mostriamo prima gli iscritti AncheCasa, poi i più vicini sulla mappa. Il tuo numero resta protetto.")]
sm += '<section class="sez" id="passi"><div class="wrap"><div class="testa"><div><h2>Tre passi, dal telefono</h2><p>Dal guasto all\'artigiano senza telefonate.</p></div><a class="btn" href="trova.html#trova">Prova adesso</a></div><div class="griglia tre">'
sm += "".join(f'<div class="carta-foto passo-foto"><img src="{foto(i)}" alt="" loading="lazy"><div class="t"><span class="num">{k+1}</span><h3>{t}</h3><p>{d}</p></div></div>' for k, (i, t, d) in enumerate(PASSI_SM))
sm += "</div></div></section>"
sm += f"""<section class="sez blu"><div class="wrap duo">
  <img src="img/foto/sm-mascotte.png" alt="SuperMastro, la mascotte" style="max-width:520px;margin-inline:auto;border-radius:0">
  <div><p class="kicker">Piacere, SuperMastro</p><h2>Il mastro di AncheCasa<br>per i guasti di casa.</h2>
    <p style="color:rgba(255,255,255,.85)">Non devi sapere come si chiama il pezzo rotto né chi chiamare. Fai vedere il problema a SuperMastro: lo spiega lui all'artigiano, con il tuo video.</p>
    <ul class="lista" style="color:#fff"><li>Gratis per chi chiede l'intervento.</li><li>Chat con l'artigiano, il numero resta tuo.</li><li>Artigiani della rete AncheCasa, vicino a te.</li></ul>
    <div class="btns" style="margin-top:24px"><a class="btn" href="trova.html#trova">Fai il video</a></div></div>
</div></section>
<section class="sez carta"><div class="wrap duo">
  <div><p class="kicker">Per gli artigiani</p><h2>Ricevi i lavori della tua zona.</h2>
    <ul class="lista"><li><strong>Solo il tuo mestiere</strong>, solo vicino a te.</li><li><strong>Sai già cosa trovi</strong>: il video e la diagnosi arrivano con la richiesta.</li><li><strong>Decidi tu</strong>: accetti o rifiuti, nessun obbligo.</li></ul>
    <div class="btns" style="margin-top:24px"><a class="btn" href="iscriviti.html#azienda-artigiano">Iscriviti come artigiano</a><a class="btn linea" href="prezzi.html">Prezzi</a></div></div>
  <img src="{foto('az-agenzia-idraulico')}" alt="Un idraulico della rete AncheCasa" loading="lazy">
</div></section>
"""
scrivi("supermastro.html", "trova", "SuperMastro · AncheCasa", "Un video di 5 secondi del guasto e trovi l'artigiano in zona.", sm)

# ======================= COME FUNZIONA =======================
def scheda(id_, titolo, intro, steps, tel, cta):
    return f"""<div role="tabpanel" id="{id_}" hidden><div class="duo" style="align-items:start">
  <div><h2>{titolo}</h2><p>{intro}</p><div style="margin-top:26px">{passi(steps, True)}</div><div class="btns" style="margin-top:28px">{cta}</div></div>
  {tel}</div></div>"""
cf = hero("come", "Come funziona", 'Una rete sola,<br><span class="acc">ognuno il suo posto.</span>',
          "Privati, artigiani, imprese, general contractor, agenti e partner usano la stessa rete. Ognuno vede solo quello che gli serve.", alt="Persone che guardano insieme un tablet")
cf += f"""<section class="sez"><div class="wrap">
  <div class="schede" data-schede role="tablist" aria-label="Scegli il tuo profilo">
    <button type="button" role="tab" data-p="privato">Privato</button><button type="button" role="tab" data-p="artigiano">Artigiano e azienda</button>
    <button type="button" role="tab" data-p="gc">General contractor</button><button type="button" role="tab" data-p="agente">Agente</button><button type="button" role="tab" data-p="partner">Partner di città</button>
  </div>
  {scheda("privato", "Se sei un privato", "Tutto gratis: trovi l'artigiano, pubblichi in bacheca e ristrutturi casa con AncheCasa general contractor: imprese selezionate, fideiussione, conto dedicato e un'app dove segnali tutto.",
          [("Iscriviti in un minuto", "Nome, cognome e mail. Ti arriva una mail e scegli la tua password."), ("Pubblica o fai il video", "Scrivi cosa ti serve o riprendi il guasto per 5 secondi."), ("Ricevi le risposte", "Ti scrivono gli artigiani di quel mestiere nella tua zona."), ("Scegli e chiudi in chat", "Preventivo, appuntamento, lavoro fatto e recensione.")],
          telefono("Richieste", '<div class="riga"><b>Rifare il bagno · Roma</b><small>3 risposte</small></div><div class="bolla">Posso passare giovedì per il sopralluogo.</div><div class="bolla mia">Va bene, alle 10?</div><div class="riga arancio">Accetta il preventivo</div>'),
          '<a class="btn" href="iscriviti.html#privato">Iscriviti gratis</a><a class="btn linea" href="trova.html">Trova artigiano</a>')}
  {scheda("artigiano", "Se sei un artigiano o un'azienda", "Ricevi lavori del tuo mestiere e lavori con l'app fatta per la tua attività.",
          [("Iscrivi l'attività", "Ragione sociale, mail e regione. Mestieri e zona li scegli dal pannello."), ("Ricevi le richieste giuste", "Solo del tuo mestiere e della tua zona, dalla bacheca e da SuperMastro."), ("Rispondi e chiudi in chat", "Mandi il preventivo, fissi l'appuntamento, il sì arriva in chat."), ("Usa l'app del tuo mestiere", "Cantiere, presenze, agenda, magazzino: quello che serve a te.")],
          telefono("Pannello", '<div class="riga blu"><b>Nuova richiesta</b><small style="color:rgba(255,255,255,.75)">Idraulico · 2 km</small></div><div class="riga"><b>Agenda di oggi</b><small>3 interventi</small></div><div class="riga"><b>Preventivi</b><small>2 in attesa</small></div><div class="riga arancio">Rispondi</div>', "Piazza"),
          '<a class="btn" href="iscriviti.html#azienda">Iscrivi l\'attività</a><a class="btn linea" href="app.html">Le app</a>')}
  {scheda("gc", "Se sei un general contractor", "Trovi imprese e fornitori per i tuoi cantieri e gestisci gare e subappalti.",
          [("Pubblica il lotto", "Dal pannello gare pubblichi la lavorazione o la fornitura che ti manca."), ("Ricevi le offerte", "Rispondono imprese e fornitori verificati della zona del cantiere."), ("Scegli e affida", "Confronti, chiedi chiarimenti in chat e affidi."), ("Segui il cantiere", "SAL, presenze e documenti nell'app dell'impresa.")],
          telefono("Gare", '<div class="riga"><b>Lotto: impianto elettrico</b><small>Cantiere Via Roma · 4 offerte</small></div><div class="riga"><b>Fornitura laterizi</b><small>2 offerte</small></div><div class="riga arancio">Pubblica un lotto</div>', "Piazza"),
          '<a class="btn" href="appalti.html">Appalti e subappalti</a>')}
  {scheda("agente", "Se sei un agente", "Porti persone e aziende nella rete e il guadagno resta sulla tua linea.",
          [("Candidati", "Curriculum, portfolio e zona. L'amministrazione legge e decide."), ("Invita", "Dal pannello mandi l'invito per mail a privati e aziende."), ("Presenta opportunità", "Inserisci operazioni immobiliari nell'area riservata."), ("Cresci", "La rete che porti resta tua.")],
          telefono("Agente", '<div class="riga"><b>Inviti mandati</b><small>12 questo mese</small></div><div class="riga"><b>Opportunità</b><small>1 in valutazione</small></div><div class="riga arancio">Invita per mail</div>', "Profilo"),
          '<a class="btn" href="agenti.html">Diventa agente</a>')}
  {scheda("partner", "Se diventi partner di città", "La tua impresa lavora col marchio AncheCasa sulle ristrutturazioni che AncheCasa gestisce.",
          [("Candida l'impresa", "AncheCasa verifica l'impresa, i lavori fatti e i documenti."), ("Ricevi il kit", "Livrea dei furgoni, divise e striscioni di cantiere."), ("Ricevi i lavori", "AncheCasa ti assegna i cantieri della tua zona e del tuo mestiere."), ("Lavora con le app", "Cantiere, presenze e documenti sempre aggiornati.")],
          telefono("Partner", '<div class="riga blu"><b>Nuovo cantiere assegnato</b><small style="color:rgba(255,255,255,.75)">Bagno · Roma Prati</small></div><div class="riga"><b>Sopralluogo</b><small>Lunedì ore 9</small></div><div class="riga arancio">Apri il cantiere</div>', "Piazza"),
          '<a class="btn" href="partner.html">Diventa partner</a>')}
</div></section>
<section class="sez blu"><div class="wrap">
  <div class="testa"><div><h2>Le regole della rete</h2><p>Valgono per tutti.</p></div></div>
  <div class="griglia">{box("Mestiere e zona", "Ognuno riceve solo le richieste del suo mestiere, dove si fa il lavoro.", None, None, "", ICO["zona"])}{box("Verifica", "Aziende, agenti e partner passano dalla verifica dell'amministrazione.", None, None, "", ICO["scudo"])}{box("Tutto in chat", "Preventivi, accordi e documenti restano nella pratica.", None, None, "", ICO["chat"])}{box("Niente dati inventati", "Vedi solo iscritti, lavori e recensioni veri.", None, None, "", ICO["doc"])}</div>
</div></section>
"""
scrivi("come-funziona.html", "come", "Come funziona · AncheCasa", "Come funziona AncheCasa per privati, artigiani, aziende, general contractor, agenti e partner.", cf)

# ======================= AGENTI =======================
ag = hero("agenti", "Agenti AncheCasa", 'Costruisci la tua rete.<br><span class="acc">Il guadagno resta tuo.</span>',
          "L'agente porta privati e aziende nella rete AncheCasa e presenta operazioni immobiliari nell'area riservata. In tutta Italia.",
          '<div class="btns"><a class="btn" href="#candidatura">Candidati</a><a class="btn chiaro" href="#come">Come lavori</a></div>', alt="Un agente in una piazza italiana")
ag += f"""<section class="sez" id="come"><div class="wrap">
  <div class="testa"><div><h2>Cosa fa un agente</h2><p>Un lavoro nuovo, in una rete che sta crescendo città per città.</p></div></div>
  <div class="griglia">
    {box("Porta persone e aziende", "Inviti privati, artigiani e imprese della tua zona. Ognuno riceve una mail personale e entra con la sua password.", None, None, "", ICO["rete"])}
    {box("Il guadagno resta sulla tua linea", "Chi porti tu resta legato a te. L'azienda che invita un fornitore non guadagna: solo l'agente.", None, None, "", ICO["euro"])}
    {box("Presenta opportunità", "Inserisci operazioni immobiliari nell'area riservata: mandato, proprietà o investimento confermato dalla proprietà.", "opportunita.html", None, "", ICO["chiave"])}
    {box("Lavori dove vuoi", "Scegli la tua zona. Il pannello funziona dal telefono e dal computer.", None, None, "", ICO["zona"])}
  </div>
</div></section>
<section class="sez carta"><div class="wrap duo">
  <img src="{foto('ag-carriera')}" alt="Riunione di agenti AncheCasa">
  <div><p class="kicker">Il tuo pannello</p><h2>Tutto quello che ti serve</h2>
    <ul class="lista"><li><strong>Inviti per mail</strong>: generi il link personale e lo mandi, vedi chi ha aperto e chi è entrato.</li><li><strong>Opportunità</strong>: inserisci l'operazione, il report si scrive dai documenti, inoltri link nominativi e protetti.</li><li><strong>La tua rete</strong>: persone e aziende che hai portato, con il loro stato.</li><li><strong>Chat</strong> con clienti, aziende e amministrazione.</li></ul></div>
</div></section>
<section class="sez"><div class="wrap duo">
  <div><p class="kicker">Area riservata</p><h2>Opportunità per agenti</h2>
    <p>L'area Opportunità è un club riservato. I progetti li pubblica <strong>solo l'agente</strong>, AncheCasa li controlla prima di mostrarli. Le vedono le imprese che inviti tu o AncheCasa, e le imprese che chiedono l'accesso e vengono selezionate.</p>
    <ul class="lista"><li>Inserisci l'operazione: mandato, proprietà o investimento confermato dalla proprietà.</li><li>Il report si scrive dai documenti, l'amministrazione verifica.</li><li>Inoltri link nominativi e protetti alle imprese giuste.</li></ul>
    <div class="btns" style="margin-top:22px"><a class="btn linea" href="opportunita.html">Come funziona l'area riservata</a></div></div>
  <img src="{foto('ag-cv')}" alt="Agente AncheCasa con la cartellina">
</div></section>
<section class="sez blu"><div class="wrap">
  <div class="testa"><div><h2>Come entri</h2><p>Si entra per merito, non con un clic.</p></div></div>
  {passi([("Ti candidi", "Curriculum, portfolio, zona e due righe su di te."), ("L'amministrazione legge", "Se serve, ti chiamiamo per conoscerti."), ("Ricevi l'invito", "Una mail personale: scegli la password ed entri nel pannello."), ("Cresci", "I ruoli di coordinamento di area si assegnano su invito di AncheCasa.")])}
</div></section>
<section class="sez carta" id="candidatura"><div class="wrap duo" style="align-items:start">
  <div><h2>Candidati come agente</h2><p>Ti rispondiamo per mail. L'agenzia immobiliare non passa da qui: entra come azienda.</p><img src="{foto('ag-network')}" alt="Evento della rete AncheCasa" style="margin-top:24px;border-radius:18px;width:100%"></div>
  <div class="pannello"><form class="modulo" data-anteprima="Anteprima: la candidatura non è stata inviata davvero.">
    <div class="due"><label>Nome e cognome<input required type="text" autocomplete="name"></label><label>Mail<input required type="email" autocomplete="email"></label></div>
    <div class="due"><label>Zona in cui lavori<input required type="text" placeholder="Es. Roma e provincia"></label><label>Telefono<input type="tel" autocomplete="tel"></label></div>
    <label>Curriculum (PDF)<input type="file" accept=".pdf,.doc,.docx"></label>
    <label>Portfolio (facoltativo)<input type="file" accept=".pdf,image/*"></label>
    <label>Presentati in due righe<textarea></textarea></label>
    <label class="spunta"><input required type="checkbox">Ho letto l'<a href="privacy.html" style="text-decoration:underline">informativa privacy</a>.</label>
    <button class="btn" type="submit">Invia la candidatura</button></form></div>
</div></section>
"""
scrivi("agenti.html", "agenti", "Agenti · AncheCasa", "Diventa agente AncheCasa: porti persone e aziende nella rete e il guadagno resta tuo.", ag)

# ======================= RISTRUTTURA =======================
ri = hero("ristruttura", "Ristruttura casa", 'Un referente.<br><span class="acc">Un contratto.</span>',
          "AncheCasa è il general contractor della tua ristrutturazione: imprese selezionate, fideiussione, conto dedicato e un'app per seguire tutto.",
          '<div class="btns"><a class="btn" href="#sopralluogo">Chiedi un sopralluogo</a><a class="btn chiaro" href="#garanzie">Le garanzie</a></div>', alt="Coppia in un soggiorno ristrutturato")
ri += garanzie("Perché puoi fidarti di AncheCasa", "Se non ci conosci ancora, è giusto chiederselo. Ecco cosa ti garantiamo, per iscritto.")
ri += f"""<section class="sez blu"><div class="wrap duo">
  <div><p class="kicker">La tua app</p><h2>Vedi tutto. Segnali tutto.</h2><p style="color:rgba(255,255,255,.85)">Con la ristrutturazione ricevi l'app del tuo cantiere. Non devi rincorrere nessuno: è tutto lì.</p>
    <ul class="lista" style="color:#fff"><li>Avanzamento dei lavori e foto del giorno.</li><li>Contratto, fideiussione, SAL e pagamenti.</li><li>Chat con il tuo referente AncheCasa.</li><li>«Segnala un problema»: AncheCasa interviene con l'impresa.</li></ul></div>
  {APP_CLIENTE}
</div></section>
<section class="sez"><div class="wrap duo">
  <div><h2>Perché con AncheCasa</h2><ul class="lista"><li>Un solo contratto con AncheCasa, anche se lavorano più imprese.</li><li>Imprese partner verificate, riconoscibili da furgoni, divise e striscioni AncheCasa.</li><li>Preventivo, avanzamento e documenti sempre nella tua app.</li><li>Un referente che risponde, dall'inizio alla consegna.</li></ul></div>
  <img src="{foto('az-team')}" alt="Squadra AncheCasa in cantiere">
</div></section>
<section class="sez carta"><div class="wrap"><div class="testa"><div><h2>Cosa ristrutturiamo</h2></div></div>
  <div class="griglia">{cartafoto("#sopralluogo", "card-cucina", "Cucina", "Impianti, pavimenti, mobili su misura.", "Chiedi un sopralluogo")}{cartafoto("#sopralluogo", "priv-pittore", "Bagno e pareti", "Bagno nuovo, tinteggiatura, cartongesso.", "Chiedi un sopralluogo")}{cartafoto("#sopralluogo", "card-casa", "Casa completa", "Dalla demolizione alla consegna chiavi in mano.", "Chiedi un sopralluogo")}{cartafoto("#sopralluogo", "az-condominio-ditta", "Condominio e facciate", "Per amministratori: lavori del palazzo con un solo referente.", "Chiedi un sopralluogo")}</div>
</div></section>
<section class="sez blu"><div class="wrap"><div class="testa"><div><h2>Come funziona</h2></div></div>
  {passi([("Sopralluogo", "Ci dici cosa vuoi fare, veniamo a vedere."), ("Preventivo unico", "Tutti i lavori, i tempi e un solo prezzo."), ("Contratto con AncheCasa", "Un solo contratto, anche con più imprese."), ("Lavori e consegna", "Segui il cantiere dall'app fino alla fine.")])}
</div></section>
<section class="sez" id="sopralluogo"><div class="wrap duo" style="align-items:start">
  <div><h2>Chiedi un sopralluogo</h2><p>Ti richiamiamo per fissare il giorno.</p><img src="{foto('hero')}" alt="Cantiere AncheCasa" style="margin-top:24px;border-radius:18px;width:100%"></div>
  <div class="pannello"><form class="modulo" data-anteprima="Anteprima: la richiesta non è stata inviata davvero.">
    <label>Che lavoro?<select><option>Ristrutturazione completa</option><option>Bagno</option><option>Cucina</option><option>Pareti e tinteggiatura</option><option>Condominio o facciata</option><option>Altro</option></select></label>
    <div class="due"><label>Città o CAP<input required type="text"></label><label>Quando?<select><option>Prima possibile</option><option>Entro 3 mesi</option><option>Sto valutando</option></select></label></div>
    <div class="due"><label>Nome<input required type="text" autocomplete="name"></label><label>Mail<input required type="email" autocomplete="email"></label></div>
    <label>Telefono<input required type="tel" autocomplete="tel"></label>
    <label>Raccontaci il lavoro (facoltativo)<textarea placeholder="Es. bagno di 6 mq da rifare, appartamento al 2° piano"></textarea></label>
    <label class="spunta"><input required type="checkbox">Ho letto l'<a href="privacy.html" style="text-decoration:underline">informativa privacy</a>.</label>
    <button class="btn" type="submit">Chiedi il sopralluogo</button></form></div>
</div></section>
"""
scrivi("ristruttura.html", "ristruttura", "Ristruttura casa · AncheCasa", "AncheCasa general contractor: un referente e un contratto per la tua ristrutturazione.", ri)

# ======================= BACHECA =======================
ba = hero("bacheca", "Bacheca annunci", 'Cerchi o offri?<br><span class="acc">Scrivilo qui.</span>',
          "Case in vendita e in affitto, alloggi per studenti, lavoro. Aperta a tutti: pubblichi l'annuncio, ti risponde chi è interessato e vi scrivete nella chat di AncheCasa.",
          '<div class="btns"><a class="btn" href="iscriviti.html#privato">Pubblica un annuncio</a><a class="btn chiaro" href="#categorie">Guarda le categorie</a></div>', alt="Un ragazzo scrive sul telefono")
CAT_B = [
    ("vendita", "Vendita", "card-casa", "Case in vendita", "Vendi casa o cerchi casa da comprare nella tua zona.",
     ["Foto, prezzo, metri quadri e zona", "Chi è interessato ti scrive in chat", "Il tuo numero resta privato finché vuoi tu"], "Pubblica una vendita"),
    ("affitto", "Affitto", "priv-hero", "Case in affitto", "Affitti un appartamento o cerchi casa in affitto, per lunghi periodi o per pochi mesi.",
     ["Appartamenti, stanze, box e locali", "Durata, canone e spese chiari dall'inizio", "Visite e domande in chat"], "Pubblica un affitto"),
    ("studenti", "Alloggi studenti", "studenti", "Alloggi per studenti", "Stanze e posti letto vicino all'università, per gli studenti fuori sede.",
     ["Stanza singola, doppia o posto letto", "Vicino a università e mezzi", "Studenti e proprietari si parlano in chat"], "Pubblica un alloggio"),
    ("lavoro", "Lavoro", "ag-cv", "Cerco e offro lavoro", "Cerchi lavoro o cerchi personale: in casa, in cantiere, in azienda.",
     ["Cerco lavoro: mestiere, zona e disponibilità", "Offro lavoro: imprese e famiglie cercano persone", "Curriculum e risposte in chat"], "Pubblica un annuncio di lavoro"),
]
ba += '<section class="sez" id="categorie"><div class="wrap"><div class="testa"><div><h2>Cosa trovi in bacheca</h2><p>Quattro categorie, una sola chat.</p></div></div><div class="griglia">'
ba += "".join(cartafoto(f"#{c[0]}", c[2], c[1], c[4], "Apri") for c in CAT_B) + "</div></div></section>"
for i, c in enumerate(CAT_B):
    img = f'<img src="{foto(c[2])}" alt="{c[3]}" loading="lazy">'
    txt = f'<div><p class="kicker">Bacheca · {c[1]}</p><h2>{c[3]}</h2><p>{c[4]}</p><ul class="lista">' + "".join(f"<li>{x}</li>" for x in c[5]) + f'</ul><div class="btns" style="margin-top:24px"><a class="btn" href="iscriviti.html#privato">{c[6]}</a></div></div>'
    ba += f'<section class="sez{" carta" if i % 2 == 0 else ""}" id="{c[0]}"><div class="wrap duo">' + (img + txt if i % 2 == 0 else txt + img) + "</div></section>"
ba += f"""<section class="sez blu"><div class="wrap duo">
  <img src="{foto('ac-telefono-vicino')}" alt="La bacheca AncheCasa sul telefono">
  <div><h2>Come funziona</h2>{passi([("Pubblica", "Scegli la categoria, metti foto, poche righe e la zona."), ("Ti scrivono", "Chi è interessato ti risponde nella chat di AncheCasa."), ("Vi accordate", "Il tuo numero resta privato finché vuoi tu.")], True)}</div>
</div></section>
<section class="sez"><div class="wrap"><div class="testa"><div><h2>Sei un artigiano?</h2><p>Sponsorizzati nella bacheca della tua città e fatti trovare per primo.</p></div></div>
  <div class="griglia">{box("In evidenza", "Il tuo profilo in cima agli annunci, per mestiere e città.", "iscriviti.html#azienda-artigiano", "Per artigiani iscritti", "prova")}{box("Primo in zona", "Pochi posti per mestiere e zona.", "iscriviti.html#azienda-artigiano", "Per artigiani iscritti", "prova")}</div>
</div></section>
"""
scrivi("bacheca.html", "bacheca", "Bacheca annunci · AncheCasa", "La bacheca di AncheCasa: casa e lavoro, aperta a tutti, con la chat interna.", ba)

# ======================= APPALTI =======================
ap = hero("appalti", "Appalti e subappalti", 'Il cantiere giusto<br><span class="acc">trova chi lo fa.</span>',
          "I general contractor pubblicano lotti e forniture. Imprese e fornitori di materiali e servizi rispondono dalla zona del cantiere.",
          '<div class="btns"><a class="btn" href="iscriviti.html#azienda">Entra come azienda</a><a class="btn chiaro" href="#albo">Albo fornitori</a></div>', alt="General contractor in un grande cantiere")
ap += f"""<section class="sez"><div class="wrap"><div class="griglia tre">
  {cartafoto("iscriviti.html#azienda-gc", "az-cantiere-app", "General contractor", "Pubblichi il lotto che ti manca, scegli tra imprese e fornitori verificati, gestisci tutto dal pannello gare.", "Pubblica un lotto")}
  {cartafoto("iscriviti.html#azienda-impresa", "az-subappalti", "Imprese subappaltatrici", "Vedi solo i lavori del tuo mestiere e della tua zona, mandi l'offerta, il sì arriva in chat.", "Ricevi i lotti")}
  {cartafoto("iscriviti.html#azienda-fornitore", "az-serv-fornitore", "Fornitori di materiali e servizi", "Ricevi le richieste di fornitura; prezzi e consegne restano nel pannello.", "Ricevi le richieste")}
</div></div></section>
<section class="sez blu"><div class="wrap"><div class="testa"><div><h2>Come funziona una gara</h2></div></div>
  {passi([("Lotto pubblicato", "Lavorazione o fornitura, con zona del cantiere e scadenza."), ("Arrivano le offerte", "Da imprese e fornitori di quel mestiere e di quella zona."), ("Confronto in chat", "Chiarimenti, documenti e varianti nella pratica."), ("Affidamento", "SAL, presenze e documenti nell'app dell'impresa.")])}
</div></section>
<section class="sez" id="albo"><div class="wrap duo">
  <div><p class="kicker">Albo fornitori</p><h2>Candidati all'albo</h2><p>Dal tuo profilo ti candidi come fornitore o subappaltatore: per le gare dei general contractor e per i grandi lavori privati, come la ristrutturazione di un condominio.</p>
  <ul class="lista"><li>Categorie e zona di lavoro</li><li>Qualifiche, DURC e SOA quando servono</li><li>Lavori fatti e referenze</li></ul>
  <div class="btns" style="margin-top:24px"><a class="btn" href="iscriviti.html#azienda-fornitore">Candidati all'albo</a></div></div>
  <img src="{foto('az-gc-documenti')}" alt="General contractor che firma documenti">
</div></section>
"""
scrivi("appalti.html", "appalti", "Appalti e subappalti · AncheCasa", "General contractor, imprese e fornitori di materiali e servizi.", ap)

# ======================= APP (indice + 19 pagine) =======================
apx = hero("app", "App per la tua attività", 'L\'app fatta<br><span class="acc">per il tuo mestiere.</span>',
           "Tutte le aziende hanno l'Ufficio. Poi si accende l'app del tuo tipo di attività: impresa, artigiano, condominio, hotel, negozio e altre.",
           '<div class="btns"><a class="btn" href="iscriviti.html#azienda">Iscrivi l\'attività</a><a class="btn chiaro" href="prezzi.html">Prezzi</a></div>', alt="Titolare d'impresa con un tablet")
apx += '<section class="sez"><div class="wrap"><div class="testa"><div><h2>Scegli la tua attività</h2><p>' + str(len(APP)) + ' app, una per ogni tipo di lavoro.</p></div></div><div class="griglia">'
apx += "".join(cartafoto(f"app-{a[0]}.html", a[2], a[1], a[4], "Cosa fa e come averla") for a in APP) + "</div></div></section>"
apx += f"""<section class="sez carta"><div class="wrap duo">
  <div><h2>In ogni app trovi</h2><ul class="lista"><li><strong>Ufficio</strong>: clienti, documenti, preventivi e scadenze.</li><li><strong>Chat e mail interna</strong> con clienti, fornitori e squadre.</li><li><strong>Richieste dalla rete</strong>: bacheca, SuperMastro, appalti.</li><li><strong>Titolare e operatori</strong>: il titolare vede tutto, l'operatore solo i reparti che gli dai.</li><li><strong>AncheVoice</strong>: il centralino unico, quando arriva.</li></ul></div>
  {telefono("Ufficio", '<div class="riga"><b>Clienti</b><small>48 attivi</small></div><div class="riga"><b>Preventivi</b><small>5 in attesa</small></div><div class="riga"><b>Scadenze</b><small>DURC tra 12 giorni</small></div><div class="riga blu"><b>Cantiere Via Po</b><small style="color:rgba(255,255,255,.75)">SAL 60%</small></div>', "Piazza")}
</div></section>
"""
scrivi("app.html", "app", "App per la tua attività · AncheCasa", "Le app AncheCasa per imprese, artigiani, condomini, hotel, negozi e altre attività.", apx)
for a in APP:
    mods = "".join(box(MOD[m], MODDESC[m]) for m in a[3])
    cifra, per, chi = prezzo_app(a[0])
    p = f"""<section class="hero basso"><img src="img/hero/app.jpg" alt=""><div class="wrap"><p class="kicker"><a href="app.html" style="color:inherit">App per la tua attività</a> · {a[1]}</p><h1>App {a[1]}</h1><p class="lead">{a[4]}</p>
<div class="btns"><a class="btn" href="#ottieni">Come ottenerla</a><a class="btn chiaro" href="#cosa-fa">Cosa fa</a></div></div></section>
<section class="sez" id="cosa-fa"><div class="wrap"><div class="testa"><div><h2>Cosa fa l'app {a[1]}</h2><p>{a[4]} Funziona dal telefono e dal computer. L'Ufficio è sempre incluso.</p></div></div>
<div class="griglia">{box("Ufficio", "Clienti, documenti, preventivi e scadenze dell'azienda.")}{mods}{box("Chat e rete AncheCasa", "Parli con clienti e fornitori e ricevi le richieste di lavoro della tua zona.")}</div></div></section>
<section class="sez carta"><div class="wrap duo"><div><h2>Chi la usa</h2><ul class="lista"><li><strong>Il titolare</strong> vede tutto: lavori, persone, numeri.</li><li><strong>Gli operatori</strong> vedono solo i reparti che gli dai.</li><li><strong>I clienti</strong> ti scrivono in chat, senza numeri da passare.</li></ul></div>
<img src="{foto(a[2])}" alt=""></div></section>
<section class="sez blu" id="ottieni"><div class="wrap"><div class="testa"><div><h2>Come ottenerla</h2><p style="color:rgba(255,255,255,.82)">Niente da installare: si usa dal browser del telefono o del computer.</p></div></div>
{passi([("Iscrivi l'attività", "Ragione sociale, mail e regione. Ci vuole un minuto."), ("Scegli «" + a[1] + "»", "Indichi il tipo di attività: si accende questa app insieme all'Ufficio."), ("Ricevi la mail", "AncheCasa verifica i dati e ti manda la mail per scegliere la password."), ("Entri e lavori", "Aggiungi gli operatori e inizi dal telefono o dal computer.")])}
<div class="app-prezzo"><div><span>{chi}</span><br><b>{cifra}</b> <span>{per}</span></div><a class="btn" href="iscriviti.html#azienda-{tipo_app(a[0])}">Iscrivi l'attività</a><a class="btn chiaro" href="prezzi.html">Tutti i prezzi</a></div>
</div></section>
<section class="sez"><div class="wrap"><div class="testa"><div><h2>Altre app</h2></div></div><div class="citta">{''.join(f'<a href="app-{b[0]}.html">{b[1]}</a>' for b in APP if b[0] != a[0])}</div></div></section>
"""
    scrivi(f"app-{a[0]}.html", "app", f"App {a[1]} · AncheCasa", a[4], p)

# ======================= ANCHEVOICE =======================
av = hero("voice", "AncheVoice · il centralino AncheCasa", 'Un numero.<br><span class="acc">Tutte le chiamate al posto giusto.</span>',
          "Un numero di città al posto di cinque cellulari. Ufficio, cantiere e artigiani rispondono dalla stessa linea, e ogni chiamata resta nella pratica.",
          '<div class="btns"><a class="btn" href="contatti.html">Voglio saperne di più</a></div>', alt="Una receptionist con le cuffie")
av += f"""<section class="sez"><div class="wrap"><p class="avviso" style="margin-bottom:28px">AncheVoice arriva a breve. Scrivici e ti avvisiamo per primo.</p>
  <div class="griglia">{box("Una linea", "Un numero di città per tutta l'azienda.", None, None, "", ICO["chat"])}{box("Smistamento", "Ufficio, ruolo di cantiere o artigiano, con orari e segreteria.", None, None, "", ICO["rete"])}{box("Assistente vocale", "Se il banco è vuoto, la linea risponde, capisce e inoltra.", None, None, "", ICO["video"])}{box("Memoria", "Preventivi, segnalazioni e diario restano agganciati alla pratica.", None, None, "", ICO["doc"])}</div>
</div></section>
<section class="sez carta"><div class="wrap duo">
  <img src="{foto('hero')}" alt="Striscione di cantiere AncheCasa">
  <div><h2>Lo striscione è il tuo numero</h2><p>Sul ponteggio stanno il nome della ditta e il numero AncheVoice. Chi passa davanti al cantiere e vuole un lavoro chiama quella riga, e la chiamata arriva a chi deve rispondere.</p></div>
</div></section>
"""
scrivi("anchevoice.html", "servizi", "AncheVoice · AncheCasa", "AncheVoice, il centralino unico AncheCasa per ufficio, cantiere e artigiani.", av)

# ======================= OPPORTUNITA =======================
op = hero("contatti", "Opportunità · area riservata", 'Poche persone.<br><span class="acc">Progetti veri.</span>',
          "Un'area chiusa, per chi fa davvero business. Qui non si pubblica per farsi vedere: ogni progetto arriva da un agente AncheCasa, e AncheCasa ha già i documenti e li ha controllati.",
          '<div class="btns"><a class="btn" href="#accesso">Chiedi di entrare</a><a class="btn chiaro" href="agenti.html">Sei un agente?</a></div>', alt="Una stretta di mano riservata")
FATTI = [
    ("Non esiste una pagina pubblica", "Le opportunità non sono su Google, non sono sul sito e non sono in bacheca. Questa pagina spiega l'area, non la mostra."),
    ("Entra solo chi è invitato o selezionato", "Imprese invitate da un agente o da AncheCasa, oppure imprese che hanno chiesto di entrare e sono state scelte. Nessuna iscrizione libera."),
    ("Pubblica solo l'agente AncheCasa", "Nessun annuncio, nessun intermediario sconosciuto. Chi porta un progetto ha un nome, un mandato e risponde ad AncheCasa."),
    ("Ogni link ha un nome", "Il link al progetto è personale. Se lo apri da un altro dispositivo, serve il codice che arriva alla tua mail."),
    ("I dati sensibili restano chiusi", "Proprietà, documenti e nomi degli interessati non girano. Si aprono solo quando c'è un interesse serio e un incontro."),
    ("Si parla di persona", "Chi è interessato viene ricontattato e incontra le parti in modo riservato. Niente trattative in pubblico."),
]
op += '<section class="sez"><div class="wrap"><div class="testa"><div><p class="kicker">La riservatezza si vede da come lavoriamo</p><h2>Non lo diciamo. Lo facciamo.</h2><p>Sei regole che valgono per ogni progetto, senza eccezioni.</p></div></div><div class="griglia tre">'
op += "".join(f'<div class="box fatto"><span class="num">{i+1:02d}</span><h3>{t}</h3><p>{d}</p></div>' for i, (t, d) in enumerate(FATTI))
op += '</div></div></section>'
op += f"""<section class="sez blu"><div class="wrap"><div class="testa"><div><p class="kicker">Se lo trovi qui</p><h2>è già stato controllato.</h2><p style="color:rgba(255,255,255,.82)">Quando un progetto entra nell'area, il lavoro di verifica è già fatto. Tu valuti l'affare, non la carta.</p></div></div>
  {passi([("L'agente lo porta", "Con mandato, come proprietario o con la conferma scritta della proprietà."), ("AncheCasa raccoglie tutto", "Documenti, situazione dell'immobile, numeri del progetto."), ("AncheCasa controlla", "L'amministrazione verifica i documenti e scrive il report. Se qualcosa non torna, il progetto non entra."), ("Solo allora lo vedi", "Il progetto arriva alle imprese giuste, con link personale.")])}
</div></section>
<section class="sez"><div class="wrap duo">
  <div><p class="kicker">Per chi è</p><h2>Per chi realizza,<br>non per chi guarda.</h2>
    <p>L'area è pensata per chi ha la struttura per portare a termine un'operazione: imprese di costruzione e di sviluppo, general contractor, società che investono e realizzano.</p>
    <ul class="lista"><li>Ogni accesso è personale e non si cede.</li><li>Quello che vedi qui resta qui.</li><li>Se un progetto ti interessa, lo dici e ti ricontattiamo: niente trattative a distanza.</li></ul>
    <p style="margin-top:18px;font-weight:700;color:var(--blu)">Se cerchi annunci, questa non è la pagina giusta. Se fai business, sì.</p></div>
  <img src="{foto('az-imprenditore')}" alt="Due imprenditori si stringono la mano" loading="lazy">
</div></section>
<section class="sez carta" id="accesso"><div class="wrap duo" style="align-items:start">
  <div><h2>Chiedi di entrare</h2><p>Le richieste le legge AncheCasa, una per una. Se l'impresa viene selezionata, riceve un invito personale per mail. Non tutte le richieste vengono accolte, e non serve insistere: se c'è spazio, ti scriviamo noi.</p>
  <p style="color:var(--grigio);margin-top:18px;font-size:15px">Non è un'offerta di investimento né una sollecitazione al pubblico risparmio. AncheCasa non riceve compensi legati all'affare.</p></div>
  <div class="pannello"><form class="modulo" data-anteprima="Anteprima: la richiesta non è stata inviata davvero.">
    <label>Ragione sociale<input required type="text" autocomplete="organization"></label>
    <div class="due"><label>Nome e ruolo di chi scrive<input required type="text"></label><label>Mail aziendale<input required type="email" autocomplete="email"></label></div>
    <div class="due"><label>Città<input required type="text"></label><label>Sito web dell'impresa<input type="url" placeholder="https://"></label></div>
    <label>Che operazioni avete realizzato?<textarea required placeholder="Es. tre recuperi di palazzi a Roma negli ultimi cinque anni"></textarea></label>
    <label>Che progetti cercate?<textarea placeholder="Zona, tipo di immobile, dimensione dell'operazione"></textarea></label>
    <label class="spunta"><input required type="checkbox">Ho letto l'<a href="privacy.html" style="text-decoration:underline">informativa privacy</a>.</label>
    <button class="btn" type="submit">Invia la richiesta</button></form></div>
</div></section>
"""
scrivi("opportunita.html", "servizi", "Opportunità · AncheCasa", "L'area riservata delle opportunità immobiliari AncheCasa.", op)

# ======================= PARTNER =======================
pa = hero("partner", "Partner di città", 'La tua impresa<br><span class="acc">col marchio AncheCasa.</span>',
          "In ogni città cerchiamo imprese partner. Ricevono le ristrutturazioni che AncheCasa gestisce come general contractor e lavorano con le app AncheCasa.",
          '<div class="btns"><a class="btn" href="#candidati">Candida l\'impresa</a></div>', alt="Titolare d'impresa davanti ai furgoni AncheCasa")
pa += f"""<section class="sez"><div class="wrap duo">
  <img src="{foto('az-condominio-ditta')}" alt="Impresa partner con il furgone AncheCasa">
  <div><h2>Cosa ricevi</h2><ul class="lista"><li>Lavori assegnati da AncheCasa nella tua zona e nel tuo mestiere.</li><li>Il kit del marchio: livrea dei furgoni, divise, striscioni di cantiere.</li><li>Le app AncheCasa incluse: cantiere, presenze, preventivi, agenda.</li><li>Una zona e un mestiere: non sei uno dei tanti.</li></ul></div>
</div></section>
<section class="sez carta"><div class="wrap"><div class="testa"><div><h2>Riconoscibili ovunque</h2><p>Furgoni, divise e cantieri con lo stesso marchio, in ogni città.</p></div></div>
  <div class="griglia">{cartafoto("#candidati", "az-forniture", "Furgoni", "La livrea AncheCasa blu e arancio.", "Candidati")}{cartafoto("#candidati", "hero", "Cantieri", "Striscione AncheCasa sul ponteggio.", "Candidati")}{cartafoto("#candidati", "az-team", "Squadre", "Le tue squadre, con le app AncheCasa.", "Candidati")}</div>
</div></section>
<section class="sez blu"><div class="wrap"><div class="testa"><div><h2>Come si diventa partner</h2></div></div>
  {passi([("Candidatura", "Ragione sociale, città, mestiere."), ("Verifica", "Lavori fatti, documenti, referenze."), ("Accordo", "Canone, percentuale sui lavori assegnati, zona."), ("Kit e primi lavori", "Livrea, divise e i primi cantieri.")])}
</div></section>
<section class="sez" id="candidati"><div class="wrap duo" style="align-items:start">
  <div><h2>Candida la tua impresa</h2><p>Le condizioni le definiamo insieme, in un incontro: zona, mestiere, lavori assegnati e kit del marchio. Entrano solo le imprese che superano la verifica.</p></div>
  <div class="pannello"><form class="modulo" data-anteprima="Anteprima: la candidatura non è stata inviata davvero.">
    <label>Ragione sociale<input required type="text" autocomplete="organization"></label>
    <div class="due"><label>Città<input required type="text"></label><label>Mestiere<select><option>Impresa edile</option><option>Impiantista</option><option>Imbianchino</option><option>Serramenti</option><option>Idraulico</option><option>Elettricista</option><option>Altro</option></select></label></div>
    <div class="due"><label>Mail<input required type="email" autocomplete="email"></label><label>Telefono<input type="tel" autocomplete="tel"></label></div>
    <label class="spunta"><input required type="checkbox">Ho letto l'<a href="privacy.html" style="text-decoration:underline">informativa privacy</a>.</label>
    <button class="btn" type="submit">Invia la candidatura</button></form></div>
</div></section>
"""
scrivi("partner.html", "partner", "Diventa partner · AncheCasa", "Imprese partner AncheCasa in ogni città.", pa)

# ======================= CITTA =======================
ci = hero("citta", "AncheCasa in città", 'AncheCasa a<br><span class="acc nome-citta">Roma</span>',
          "Ristrutturazioni, artigiani in zona, bacheca, appalti e app per le aziende.", '<div class="btns"><a class="btn" href="ristruttura.html#sopralluogo">Chiedi un sopralluogo</a><a class="btn chiaro" href="trova.html">Trova artigiano</a></div>', alt="Una città italiana al tramonto")
ci += f"""<section class="sez"><div class="wrap duo">
  <div><h2>Partner a <span class="nome-citta">Roma</span></h2><p>Stiamo cercando le imprese partner a <span class="nome-citta">Roma</span>. Quando ci saranno, le trovi qui con i loro cantieri.</p><div class="btns" style="margin-top:22px"><a class="btn" href="partner.html">Diventa partner</a></div></div>
  <img src="{foto('card-villetta')}" alt="Furgone di un partner AncheCasa">
</div></section>
<section class="sez carta"><div class="wrap"><div class="griglia">
  {box("Trova artigiano", "Gli iscritti di questa città e i più vicini sulla mappa.", "trova.html")}{box("Bacheca", "Gli annunci di casa e lavoro della città.", "bacheca.html")}{box("Appalti", "Lotti e forniture dei cantieri in zona.", "appalti.html")}{box("Agenti", "Diventa l'agente AncheCasa della tua zona.", "agenti.html")}
</div></div></section>
<section class="sez"><div class="wrap"><div class="testa"><div><h2>Altre città</h2></div></div>{citta_links()}</div></section>
"""
scrivi("citta.html", "citta", "AncheCasa in città", "AncheCasa nella tua città.", ci)

# ======================= SERVIZI =======================
se = hero("come", "Servizi", 'Tutto AncheCasa<br><span class="acc">in una pagina.</span>', "Ogni servizio con lo stato di oggi.", alt="")
se += '<section class="sez"><div class="wrap"><div class="griglia">' + "".join([
    box("Trova artigiano e SuperMastro", "Video di 5 secondi, artigiani in zona.", "trova.html", "Nuovo", "", ICO["video"]),
    box("Ristruttura casa", "AncheCasa general contractor con i partner di città.", "ristruttura.html", "Attivo", "", ICO["doc"]),
    box("Bacheca annunci", "Casa e lavoro, aperta a tutti, con la chat.", "bacheca.html", "Attivo", "", ICO["chat"]),
    box("Appalti e subappalti", "Gare, lotti, forniture e albo fornitori.", "appalti.html", "Attivo", "", ICO["rete"]),
    box("App per la tua attività", f"{len(APP)} app, una per ogni tipo di lavoro.", "app.html", "Attivo", "", ICO["doc"]),
    box("AncheVoice", "Il centralino unico.", "anchevoice.html", "A breve", "breve", ICO["chat"]),
    box("AncheSicura", "La sicurezza di AncheCasa: corsi, medicina, certificazioni.", "https://sicura.anchecasa.it", "Attivo", "", '<img class="ico-logo" src="assets/anchesicura-payoff-colore.png" alt="AncheSicura · La sicurezza di AncheCasa">'),
    box("Opportunità", "Pubblica solo l'agente, vedono le imprese selezionate.", "opportunita.html", "Area riservata", "ris", ICO["chiave"]),
    box("Aste immobiliari", "Le aste in un posto solo.", "faq.html", "A breve", "breve", ICO["doc"]),
    box("Finanziamenti", "Chiedi in chat a banche e broker.", "faq.html", "Attivo", "", ICO["euro"]),
    box("Agenti", "Porti persone e aziende nella rete.", "agenti.html", "Attivo", "", ICO["rete"]),
    box("Partner di città", "La tua impresa col marchio AncheCasa.", "partner.html", "Attivo", "", ICO["zona"]),
]) + '</div></div></section>'
scrivi("servizi.html", "servizi", "Servizi · AncheCasa", "Tutti i servizi AncheCasa.", se)

# ======================= PREZZI =======================
pr = hero("app", "Prezzi", 'Prezzi chiari,<br><span class="acc">per ogni profilo.</span>', "Il privato non paga. Chi lavora sceglie quello che gli serve.", alt="")
pr += f"""<section class="sez"><div class="wrap">
  <div class="griglia prezzi5">
    <div class="prezzo"><h3>Privato</h3><div class="cifra">Gratis</div><ul><li>Trova artigiano e SuperMastro</li><li>Bacheca annunci e chat</li><li>Sopralluogo per la ristrutturazione</li></ul><a class="btn linea" href="iscriviti.html#privato">Iscriviti gratis</a></div>
    <div class="prezzo"><h3>Artigiano</h3><div class="cifra">14,90 € <small>al mese</small></div><ul><li>Richieste di lavoro nella tua zona</li><li>Agenda, preventivi e clienti</li><li>Chat con i clienti</li></ul><a class="btn linea" href="iscriviti.html#azienda-artigiano">Iscriviti come artigiano</a></div>
    <div class="prezzo top"><h3>Imprese</h3><div class="cifra">49 € <small>al mese</small></div><ul><li>Ufficio e app della tua attività</li><li>Richieste dalla rete e lotti in subappalto</li><li>Titolare e operatori</li></ul><a class="btn" href="iscriviti.html#azienda-impresa">Iscrivi l'impresa</a></div>
    <div class="prezzo"><h3>Fornitori</h3><div class="cifra">99 € <small>al mese</small></div><ul><li>Materiali e servizi per i cantieri</li><li>Richieste di fornitura dei general contractor</li><li>Listino, ordini e consegne</li></ul><a class="btn linea" href="iscriviti.html#azienda-fornitore">Iscriviti come fornitore</a></div>
    <div class="prezzo"><h3>General contractor</h3><div class="cifra" style="font-size:24px">Iscrizione all'albo</div><ul><li>Per appalti e subappalti</li><li>Pubblichi lotti e forniture</li><li>Scegli imprese e fornitori verificati</li></ul><a class="btn linea" href="iscriviti.html#azienda-gc">Richiedi l'iscrizione</a></div>
  </div>
</div></section>
"""
scrivi("prezzi.html", "prezzi", "Prezzi · AncheCasa", "Prezzi AncheCasa per privati, artigiani, aziende e partner.", pr)

# ======================= FAQ =======================
def d(q, a): return f"<details><summary>{q}</summary><p>{a}</p></details>"
fq = hero("contatti", "Domande frequenti", 'Le risposte<br><span class="acc">in breve.</span>', "Se manca la tua domanda, scrivi a info@anchecasa.it.", alt="")
gruppi = [
    ("privato", "Privato", [("Quanto costa?", "Niente. Trovare l'artigiano, pubblicare in bacheca, usare la chat e chiedere un sopralluogo è gratis."),
                            ("Come mi iscrivo?", "Nome, cognome e mail. Ti arriva una mail, scegli la tua password ed entri."),
                            ("Come funziona il video di 5 secondi?", "Riprendi il guasto, l'intelligenza artificiale capisce che mestiere serve e ti mostriamo gli artigiani in zona: prima gli iscritti AncheCasa, poi i più vicini su Google Maps."),
                            ("Chi mi risponde?", "Solo chi fa quel lavoro e lavora nella zona dove si fa il lavoro."),
                            ("Il mio numero è visibile?", "No. Parli in chat finché non decidi tu."),
                            ("Cosa vuol dire che AncheCasa è general contractor?", "Nelle ristrutturazioni firmi un solo contratto con AncheCasa, che coordina le imprese partner della tua città."),
                            ("Perché dovrei fidarmi?", "Le imprese sono selezionate da AncheCasa, il lavoro è garantito da fideiussione e i tuoi pagamenti passano da un conto dedicato. Le condizioni sono scritte nel contratto."),
                            ("E se qualcosa non va durante i lavori?", "Lo segnali dall'app del tuo cantiere e AncheCasa interviene con l'impresa.")]),
    ("azienda", "Artigiano e azienda", [("Come mi iscrivo?", "Ragione sociale, mail e regione. Mestieri e categorie li scegli dopo, nel pannello."),
                                         ("Quanto costa?", "Artigiano 14,90 € al mese, imprese 49 € al mese, fornitori 99 € al mese. Per i general contractor c'è la richiesta di iscrizione all'albo appalti. Trovi tutto nella pagina Prezzi."),
                                         ("Che app trovo?", "Tutte le aziende hanno l'Ufficio. Poi si accende l'app del tuo tipo di attività."),
                                         ("Titolare e operatori vedono le stesse cose?", "No. Il titolare vede tutto; l'operatore solo i reparti che gli assegni."),
                                         ("Posso farmi vedere di più in bacheca?", "Sì, l'artigiano può sponsorizzarsi con «In evidenza» o «Primo in zona»."),
                                         ("Come entro nell'albo fornitori?", "Dal tuo profilo ti candidi come fornitore o subappaltatore.")]),
    ("agente", "Agente", [("Cosa fa l'agente?", "Porta persone e aziende nella rete e presenta opportunità immobiliari."),
                          ("Chi guadagna sugli inviti?", "Solo l'agente. L'azienda che invita un fornitore per un preventivo non guadagna."),
                          ("Come entro?", "Mandi curriculum, portfolio e zona dalla pagina Agenti. L'amministrazione legge e decide."),
                          ("L'agenzia immobiliare entra come agente?", "No: l'agenzia entra come azienda.")]),
    ("opportunita", "Opportunità, aste e finanziamenti", [("Chi pubblica le opportunità?", "Solo l'agente AncheCasa."),
                                                          ("Chi vede le opportunità?", "Le imprese invitate dall'agente o da AncheCasa, e le imprese che chiedono l'accesso e vengono selezionate. Il privato non le vede."),
                                                          ("Le aste?", "Arrivano a breve: potrai chiedere di essere avvisato."),
                                                          ("I finanziamenti?", "Li chiedi in chat a una banca o a un broker della rete.")]),
]
fq += '<section class="sez"><div class="wrap"><div class="schede">' + "".join(f'<a class="btn linea" href="#{g}">{t}</a>' for g, t, _ in gruppi) + "</div>"
for g, t, qs in gruppi:
    fq += f'<h2 id="{g}" style="margin:44px 0 8px">{t}</h2>' + "".join(d(a, b) for a, b in qs)
fq += "</div></section>"
scrivi("faq.html", "faq", "Domande frequenti · AncheCasa", "Domande frequenti su AncheCasa.", fq)

# ======================= CHI SIAMO / CONTATTI =======================
cs = hero("contatti", "Chi siamo", 'Un nuovo modo<br><span class="acc">di fare impresa.</span>', "AncheCasa mette in rete privati, artigiani, imprese, fornitori e agenti, città per città. Con una regola: costruire fiducia.", alt="")
cs += f"""<section class="sez"><div class="wrap duo"><div><p class="kicker">La nostra idea</p><h2>La casa e il lavoro,<br>finalmente dalla stessa parte.</h2><p>Chi ha bisogno trova chi sa fare, nella sua zona. Chi lavora riceve le richieste giuste e lavora con app fatte per il suo mestiere. Dove serve, AncheCasa prende il lavoro come general contractor e ne risponde, con imprese partner selezionate e riconoscibili dal marchio.</p></div><img src="{foto('ag-network')}" alt="La rete AncheCasa"></div></section>
<section class="sez blu"><div class="wrap"><div class="testa"><div><h2>Cosa ci guida</h2></div></div><div class="griglia tre">
  <div><h3 style="color:#fff">Il privato non paga</h3><p style="color:rgba(255,255,255,.82)">Trovare l'artigiano, la bacheca, la chat, il sopralluogo: tutto gratis. Per il privato AncheCasa è solo vantaggi.</p></div>
  <div><h3 style="color:#fff">Chi lavora, lavora meglio</h3><p style="color:rgba(255,255,255,.82)">Richieste vere della sua zona, strumenti per il suo mestiere e una rete che porta lavoro.</p></div>
  <div><h3 style="color:#fff">La fiducia si costruisce</h3><p style="color:rgba(255,255,255,.82)">Imprese selezionate, garanzie scritte, un referente che risponde. Ogni giorno, città per città.</p></div>
</div></div></section>
<section class="sez carta"><div class="wrap"><div class="griglia">{box("Mestiere e zona", "Ognuno riceve solo quello che gli serve.", None, None, "", ICO["zona"])}{box("Selezione", "Aziende, agenti e partner verificati uno per uno.", None, None, "", ICO["scudo"])}{box("Trasparenza", "Prezzi chiari, condizioni scritte.", None, None, "", ICO["doc"])}{box("In tutta Italia", "Una città alla volta.", "citta.html#roma", None, "", ICO["rete"])}</div></div></section>
<section class="sez"><div class="wrap"><p style="color:var(--grigio)">AncheCasa è un marchio di Palumbo Investments Srl.</p></div></section>
"""
scrivi("chi-siamo.html", "", "Chi siamo · AncheCasa", "Chi siamo: AncheCasa, la rete per la casa e il lavoro.", cs)
co = hero("contatti", "Contatti", 'Scrivici,<br><span class="acc">ti rispondiamo.</span>', "Per domande sul sito, sulle app o per una collaborazione.", alt="")
co += """<section class="sez"><div class="wrap duo" style="align-items:start">
  <div><h2>Dove trovarci</h2><ul class="lista"><li>Mail: <strong>info@anchecasa.it</strong></li><li>Privacy: <strong>ufficio.privacy@anchecasa.it</strong></li><li>Area privata: <a href="https://areaprivata.anchecasa.it/" style="text-decoration:underline">areaprivata.anchecasa.it</a></li></ul></div>
  <div class="pannello"><form class="modulo" data-anteprima="Anteprima: il messaggio non è stato inviato davvero.">
    <div class="due"><label>Nome<input required type="text" autocomplete="name"></label><label>Mail<input required type="email" autocomplete="email"></label></div>
    <label>Sei<select><option>Privato</option><option>Artigiano o azienda</option><option>General contractor</option><option>Agente</option><option>Altro</option></select></label>
    <label>Messaggio<textarea required></textarea></label>
    <label class="spunta"><input required type="checkbox">Ho letto l'<a href="privacy.html" style="text-decoration:underline">informativa privacy</a>.</label>
    <button class="btn" type="submit">Invia</button></form></div>
</div></section>
"""
scrivi("contatti.html", "", "Contatti · AncheCasa", "Contatta AncheCasa.", co)

# ======================= ISCRIVITI =======================
isc = hero("come", "Iscriviti", 'Entra in<br><span class="acc">AncheCasa.</span>', "Per il privato è gratis. Scegli chi sei: ti arriva una mail e scegli la tua password.", alt="")
isc += """<section class="sez carta"><div class="wrap" style="max-width:760px">
  <div class="schede" data-schede role="tablist" aria-label="Chi sei"><button type="button" role="tab" data-p="privato">Privato</button><button type="button" role="tab" data-p="azienda">Artigiano o azienda</button><button type="button" role="tab" data-p="agente">Agente</button></div>
  <div role="tabpanel" id="privato" hidden>
  <div class="vantaggi"><h2>Da privato è tutto gratis. E sei tutelato.</h2>
    <ul class="lista"><li><strong>Trovi l'artigiano in zona</strong> con un video di 5 secondi o una foto.</li><li><strong>Ristrutturi con AncheCasa</strong> general contractor: imprese selezionate, fideiussione, conto dedicato, un solo contratto.</li><li><strong>La tua app</strong>: segui i lavori, vedi foto e documenti, segnali un problema e AncheCasa interviene.</li><li><strong>Bacheca annunci</strong>: vendi, affitti, cerchi casa, alloggi per studenti, lavoro.</li><li><strong>Chat</strong> con artigiani e imprese: il tuo numero resta privato finché vuoi tu.</li></ul>
    <p style="margin-top:14px"><a href="ristruttura.html#garanzie" style="color:var(--arancio);font-weight:700">Leggi le nostre garanzie →</a></p></div>
  <div class="pannello"><form class="modulo" data-anteprima="Anteprima: nella versione vera ti arriva la mail per scegliere la password.">
    <div class="piano"><small>Il tuo piano</small><b>Privato</b><span>Gratis, per sempre</span></div>
    <div class="due"><label>Nome<input required type="text" autocomplete="given-name"></label><label>Cognome<input required type="text" autocomplete="family-name"></label></div>
    <label>Mail<input required type="email" autocomplete="email"></label>
    <label class="spunta"><input required type="checkbox">Ho letto l'<a href="privacy.html" style="text-decoration:underline">informativa privacy</a>.</label>
    <button class="btn" type="submit">Iscriviti gratis</button></form></div></div>
  <div role="tabpanel" id="azienda" hidden><div class="pannello"><form class="modulo" id="f-azienda" data-anteprima="Anteprima: nella versione vera AncheCasa verifica i dati e ti arriva la mail per scegliere la password.">
    <div class="piano" id="piano-azienda"><small>Il tuo piano</small><b id="piano-nome">Scegli chi sei</b><span id="piano-prezzo"></span></div>
    <label>Sei<select id="tipo-azienda" required><option value="">Scegli…</option><option value="artigiano">Artigiano</option><option value="impresa">Impresa</option><option value="fornitore">Fornitore di materiali o servizi</option><option value="gc">General contractor (albo appalti)</option></select></label>
    <label>Ragione sociale<input required type="text" autocomplete="organization"></label>
    <div class="due"><label>Mail<input required type="email" autocomplete="email"></label><label>Regione<select required><option value="">Scegli…</option><option>Abruzzo</option><option>Basilicata</option><option>Calabria</option><option>Campania</option><option>Emilia-Romagna</option><option>Friuli-Venezia Giulia</option><option>Lazio</option><option>Liguria</option><option>Lombardia</option><option>Marche</option><option>Molise</option><option>Piemonte</option><option>Puglia</option><option>Sardegna</option><option>Sicilia</option><option>Toscana</option><option>Trentino-Alto Adige</option><option>Umbria</option><option>Valle d'Aosta</option><option>Veneto</option></select></label></div>
    <p style="color:var(--grigio);font-size:15px">Mestieri e categorie li scegli dopo, nel pannello.</p>
    <label class="spunta"><input required type="checkbox">Ho letto l'<a href="privacy.html" style="text-decoration:underline">informativa privacy</a>.</label>
    <button class="btn" type="submit" id="invia-azienda">Iscrivi l'attività</button></form></div></div>
  <div role="tabpanel" id="agente" hidden><div class="pannello"><p style="color:var(--grigio)">Gli agenti si candidano con curriculum e portfolio.</p><div class="btns" style="margin-top:16px"><a class="btn" href="agenti.html#candidatura">Vai alla candidatura</a></div></div></div>
  <p style="margin-top:22px;color:var(--grigio)">Hai già un account? <a href="https://areaprivata.anchecasa.it/" style="color:var(--arancio);font-weight:700">Accedi</a></p>
</div></section>
"""
scrivi("iscriviti.html", "", "Iscriviti · AncheCasa", "Iscriviti ad AncheCasa come privato, azienda o agente.", isc)

# ======================= LEGALI (testi attuali, impaginazione nuova) =======================
VECCHIO = "/home/claude/anteprima-sito/"
for nome, tit in [("privacy", "Informativa privacy"), ("cookie", "Cookie"), ("note-legali", "Note legali"), ("gestione", "Gestione")]:
    t = open(VECCHIO + nome + ".html", encoding="utf-8").read()
    m = re.search(r"<main[^>]*>([\s\S]*?)</main>", t).group(1)
    m = re.sub(r'<section class="page-hero[\s\S]*?</section>', "", m, count=1)
    m = re.sub(r'<nav[\s\S]*?</nav>', "", m)
    m = re.sub(r'\s(class|id|style)="[^"]*"', "", m)
    m = re.sub(r"<(/?)(section|div|article)>", "", m)
    m = re.sub(r'href="(/?)(privacy|cookie|note-legali|gestione)(\.html)?"', r'href="\2.html"', m)
    corpo = f'<section class="hero basso"><img src="img/hero/contatti.jpg" alt=""><div class="wrap"><p class="kicker">Informazioni legali</p><h1>{tit}</h1></div></section><section class="sez"><div class="wrap legale">{m}</div></section>'
    scrivi(nome + ".html", "", f"{tit} · AncheCasa", tit, corpo)

print("pagine:", len([f for f in os.listdir(".") if f.endswith(".html")]))
