"""Genera il nuovo sito AncheSicura (anteprima 08.10.2026). Stesso sistema grafico del nuovo sito AncheCasa."""
import os
ANTEPRIMA = os.environ.get("AC_PROD") != "1"
MAIL = "rete@anchecasa.it"

MENU = [("servizi", "servizi.html", "Servizi"), ("corsi", "corsi.html", "Corsi online"), ("app", "app.html", "App"), ("settori", "progetti.html", "Settori"),
        ("italia", "italia.html", "Tutta Italia"), ("chi", "chi-siamo.html", "Chi siamo"), ("contatti", "contatti.html", "Contatti")]

ICO = {
    "scudo": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    "persone": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5c2.3 0 4 1.5 4.5 4"/></svg>',
    "doc": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7"/></svg>',
    "casco": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17h18M5 17v-3a7 7 0 0 1 14 0v3"/><path d="M10 7V5h4v2"/></svg>',
    "zona": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    "orologio": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    "online": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    "aula": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18v10H3z"/><path d="M8 21l4-6 4 6"/></svg>',
}

NOTA = '<div class="nota-anteprima">Anteprima del nuovo sito AncheSicura · non è online</div>' if ANTEPRIMA else ""


import re as _re, os as _os
_AC = open(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", "sito-nuovo", "index.html"), encoding="utf-8").read()
def _assoluti(h):
    h = _re.sub(r'href="index\.html"', 'href="https://www.anchecasa.it/"', h)
    h = _re.sub(r'href="(?!https?:|#|mailto:)([^"]+)"', lambda m: 'href="https://www.anchecasa.it/' + m.group(1) + '"', h)
    h = h.replace('href="https://sicura.anchecasa.it"', 'href="index.html"')
    return h.replace('src="assets/logo-colore.png"', 'src="assets/anchecasa-colore.png"').replace('src="assets/logo-negativo.png"', 'src="assets/anchecasa-negativo.png"')
TESTATA_AC = _assoluti(_AC[_AC.index('<header class="testata">'):_AC.index('</header>') + 9])
PIEDE_AC = _assoluti(_AC[_AC.index('<footer class="piede">'):_AC.index('</footer>') + 9])


def head(title, desc, page):
    menu = "".join(f'<a class="voce' + (' on" aria-current="page' if k == page else '') + f'" href="{h}">{l}</a>' for k, h, l in MENU)
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
<link rel="stylesheet" href="css/ac.css?v=4">
<link rel="stylesheet" href="css/sicura.css?v=3">
</head>
<body data-page="{page}">
<a class="skip" href="#contenuto">Vai al contenuto</a>
{NOTA}
{TESTATA_AC}
<div class="sottobarra"><div class="wrap">
  <a class="div-marchio" href="index.html" aria-label="AncheSicura, home della divisione"><img src="assets/anchesicura-colore.png" alt="AncheSicura · La sicurezza di AncheCasa" width="1200" height="231"></a>
  <nav class="div-menu" aria-label="Menu AncheSicura">{menu}<a class="voce" href="rete.html">Entra nella rete</a></nav>
  <a class="btn div-btn" href="contatti.html">Chiedi un'offerta</a>
</div></div>
<main id="contenuto">
"""


PIEDE = "</main>\n" + PIEDE_AC + """
<script src="js/ac.js?v=2"></script>
<script src="js/sicura.js?v=2"></script>
</body>
</html>
"""


def scrivi(nome, page, title, desc, corpo):
    open(nome, "w", encoding="utf-8").write(head(title, desc, page) + corpo + PIEDE)


def img(n): return f"img/{n}.jpg"


def hero(foto, kicker, h1, lead, extra="", basso=True, alt=""):
    return f"""<section class="hero{' basso' if basso else ''}">
  <img src="img/pannelli/{foto}.jpg" alt="{alt}">
  <div class="wrap"><p class="kicker">{kicker}</p><h1>{h1}</h1><p class="lead">{lead}</p>{extra}</div>
</section>
"""


def box(titolo, testo, href=None, ico=""):
    tag = "a" if href else "div"
    h = f' href="{href}"' if href else ""
    i = f'<span class="ico">{ico}</span>' if ico else ""
    return f'<{tag} class="box"{h}>{i}<h3>{titolo}</h3><p>{testo}</p></{tag}>'


def carta(href, foto, titolo, testo, vai=None, etichetta=None):
    e = f'<span class="etichetta">{etichetta}</span>' if etichetta else ""
    v = f'<span class="vai">{vai} →</span>' if vai else ""
    tag = "a" if href else "div"
    h = f' href="{href}"' if href else ""
    return f'<{tag} class="carta-foto"{h}><div class="foto">{e}<img src="{img(foto)}" alt="" loading="lazy"></div><div class="t"><h3>{titolo}</h3><p>{testo}</p>{v}</div></{tag}>'


def passi(lista, vert=False):
    return f'<div class="passi{" verticali" if vert else ""}">' + "".join(f'<div class="passo"><div><h3>{t}</h3><p>{d}</p></div></div>' for t, d in lista) + "</div>"


def lista(voci):
    return '<ul class="lista">' + "".join(f"<li>{v}</li>" for v in voci) + "</ul>"


BOTTONI = '<div class="btns"><a class="btn" href="contatti.html">Chiedi un\'offerta</a><a class="btn chiaro" href="servizi.html">I servizi</a></div>'

SERVIZI = [
    ("rspp", "Sicurezza sul lavoro", "svc-sicurezza", "RSPP esterno, documento di valutazione dei rischi e rapporti con gli organi di vigilanza.",
     ["Incarico di RSPP esterno", "DVR scritto sulla tua azienda e aggiornato", "Rapporti con ASL e Ispettorato"]),
    ("cantieri", "Sicurezza nei cantieri", "svc-cantieri", "Coordinamento in fase di progetto e di esecuzione, piani di sicurezza, fino alla chiusura del cantiere.",
     ["CSP e CSE", "PSC e verifica dei POS", "Sopralluoghi con verbale"]),
    ("formazione", "Formazione", "svc-formazione", "Corsi obbligatori online e in aula: lavoratori, preposti, dirigenti, macchine, antincendio, primo soccorso e HACCP.",
     ["Corsi online e in presenza", "Abilitazioni per le attrezzature", "Attestati e scadenze tenuti per te"]),
    ("medicina", "Medicina del lavoro", "svc-medicina", "Sorveglianza sanitaria con il medico competente e protocolli scritti per ogni mansione.",
     ["Medico competente", "Visite e protocollo sanitario", "Giudizi di idoneità e scadenze"]),
    ("certificazioni", "Certificazioni", "svc-certificazioni", "Ti prepariamo alla certificazione e restiamo con te dopo, quando il sistema è già in piedi.",
     ["Percorso verso la certificazione", "Verifiche interne", "Mantenimento negli anni"]),
    ("hr", "Risorse umane", "svc-hr", "Carichi di lavoro, benessere e supporto alle persone che tengono in piedi il lavoro.",
     ["Valutazione dello stress lavoro correlato", "Coaching per i responsabili", "Supporto al personale"]),
    ("organizzazione", "Organizzazione", "svc-organizzazione", "Processi, ruoli e procedure scritti in modo che si usino davvero, sul posto.",
     ["Mansionari e deleghe", "Procedure operative", "Organigramma della sicurezza"]),
    ("privacy", "Privacy", "svc-privacy", "Adeguamento dei documenti e formazione privacy, nello stesso fascicolo del lavoro.",
     ["Documenti GDPR", "Nomine e registri", "Formazione privacy"]),
]

SETTORI_OPERE = [
    ("cat-cantieri", "Cantieri", "Più imprese nello stesso posto: piani, coordinamento e controlli dentro il cantiere aperto."),
    ("cat-industrie", "Industrie", "Reparti, macchine e turni: il DVR segue lo stabilimento, reparto per reparto."),
    ("cat-navali", "Navale", "Bacino, banchina e bordo: spazi stretti e lavori a fuoco controllati prima di entrare."),
    ("cat-dighe", "Dighe e infrastrutture", "Cantieri lunghi, lavori in quota e gallerie, con squadre che si danno il cambio."),
    ("cat-facchinaggio", "Logistica e facchinaggio", "Magazzini, carichi e carrelli: corsie e percorsi da tenere distinti."),
    ("cat-aziende", "Uffici e aziende", "Meno rumore del cantiere, le stesse scadenze su persone e documenti."),
]
SETTORI_PUBBLICO = [
    ("cat-alberghi", "Alberghi", "Ospiti e personale nello stesso edificio, a orari diversi."),
    ("cat-ristorazione", "Ristorazione", "Cucine e sale: igiene, HACCP e turni nello stesso locale."),
    ("cat-bar", "Bar", "Banco e retro: spazio corto, personale che ruota, alimenti in regola."),
    ("cat-pubbliche", "Strutture pubbliche", "Scuole, uffici e presidi dove il pubblico entra e chi lavora resta."),
]

# ======================= HOME =======================
h = hero("hero-anchesicura", "AncheSicura · Gruppo AncheCasa", 'La sicurezza sul lavoro,<br><span class="acc">in tutta Italia.</span>',
         "AncheSicura è la divisione sicurezza del gruppo AncheCasa. Con società della sicurezza selezionate in ogni regione segue il tuo lavoro dall'apertura del cantiere alla certificazione. E con i corsi online formi il personale da dove vuoi.",
         '<div class="btns"><a class="btn" href="contatti.html">Chiedi un\'offerta</a><a class="btn chiaro" href="corsi.html">Corsi online</a></div>', basso=False, alt="Stretta di mano nella sede AncheSicura")
h += f"""<section class="sez"><div class="wrap"><div class="griglia">
  {box("Tutta Italia", "Società della sicurezza selezionate in ogni regione, con lo stesso metodo.", "italia.html", ICO["zona"])}
  {box("Corsi online", "La formazione obbligatoria dal computer o dal telefono, quando vuoi.", "corsi.html", ICO["online"])}
  {box("Un solo riferimento", "Affidi l'incarico ad AncheSicura: al resto pensiamo noi.", "chi-siamo.html", ICO["scudo"])}
  {box("Tutto in ordine", "Scadenze, visite, attestati e verbali in un posto solo.", "servizi.html", ICO["doc"])}
</div></div></section>
<section class="sez carta"><div class="wrap">
  <div class="testa"><div><h2>Cosa fa AncheSicura</h2><p>Otto servizi, un solo riferimento.</p></div><a class="btn linea" href="servizi.html">Tutti i servizi</a></div>
  <div class="griglia">{''.join(carta(f"servizi.html#{s[0]}", s[2], s[1], s[3], "Scopri") for s in SERVIZI)}</div>
</div></section>
<section class="sez"><div class="wrap duo">
  <img src="{img('aula')}" alt="Corso AncheSicura in aula" loading="lazy">
  <div><p class="kicker">Corsi online</p><h2>La formazione obbligatoria,<br>quando vuoi tu.</h2>
    <p>La teoria si segue online, dal computer o dal telefono. La pratica si fa in aula con i nostri istruttori. Attestati e scadenze li teniamo noi.</p>
    {lista(["Lavoratori, preposti e dirigenti", "Aggiornamenti periodici", "HACCP", "Antincendio, primo soccorso e attrezzature in aula"])}
    <p style="margin-top:14px;font-weight:700;color:#16304D">Corsi da 29 € a persona, sotto la media di mercato.</p>
    <div class="btns" style="margin-top:24px"><a class="btn" href="corsi.html#listino">Listino corsi</a><a class="btn linea" href="corsi.html">Vedi i corsi</a></div></div>
</div></section>
<section class="sez carta"><div class="wrap duo">
  <div><p class="kicker">App AncheSicura</p><h2>La sicurezza della tua azienda,<br>nel telefono.</h2>
    <p>Dipendenti, corsi, visite, scadenze e DPI firmati in un posto solo. Ogni lavoratore ha il suo patentino sul telefono.</p>
    {lista(["Modulo Sicurezza: 9 € al mese", "Modulo Sicurezza Cantiere: 19 € al mese", "Avvisi prima che qualcosa scada"])}
    <div class="btns" style="margin-top:24px"><a class="btn" href="app.html">Scopri l'app</a></div></div>
  <div class="telefoni due-tel"><figure class="tel-app"><div class="cornice"><img src="img/app/as-sicurezza.jpg" alt="Il quadro della sicurezza nell'app" loading="lazy"></div></figure><figure class="tel-app"><div class="cornice"><img src="img/app/as-patentino.jpg" alt="Il patentino del lavoratore nell'app" loading="lazy"></div></figure></div>
</div></section>
<section class="sez blu"><div class="wrap">
  <div class="testa"><div><h2>Come funziona</h2><p style="color:rgba(255,255,255,.82)">Tu hai un riferimento solo. Al resto pensa AncheSicura.</p></div></div>
  {passi([("Ci scrivi", "Ci dici di cosa hai bisogno, dove lavori e se è urgente."), ("Ti diamo il riferimento", "Ti segue la società della rete AncheSicura più vicina al tuo lavoro."), ("Tutto in un posto", "Documenti, scadenze e verbali nella piattaforma AncheCasa."), ("Fino alla certificazione", "Restiamo con te finché il lavoro è chiuso e in regola.")])}
</div></section>
<section class="sez"><div class="wrap">
  <div class="testa"><div><h2>Dove lavoriamo</h2><p>Cantieri, industrie, porti, uffici, alberghi e cucine. Il luogo è il tuo, il metodo resta.</p></div><a class="btn linea" href="progetti.html">Tutti i settori</a></div>
  <div class="griglia">{''.join(carta("progetti.html", f, t, d) for f, t, d in SETTORI_OPERE[:2] + SETTORI_PUBBLICO[:2])}</div>
</div></section>
<section class="sez carta"><div class="wrap duo">
  <div><p class="kicker">Per le società della sicurezza</p><h2>Cerchiamo società referenziate<br>in tutta Italia.</h2>
    <p>Sei una società della sicurezza con esperienza e referenze? Entra nella rete AncheSicura: incarichi dal gruppo AncheCasa nella tua zona, con il nostro marchio e la nostra piattaforma.</p>
    <div class="btns" style="margin-top:24px"><a class="btn" href="rete.html">Entra nella rete</a><a class="btn linea" href="rete.html#requisiti">Chi cerchiamo</a></div></div>
  <img src="{img('squadra')}" alt="Squadra AncheSicura in cantiere" loading="lazy">
</div></section>
<section class="sez"><div class="wrap">
  <div class="banner"><img src="img/pannelli/hero-anchesicura.jpg" alt=""><div class="t"><p class="kicker">Gruppo AncheCasa</p><h2>Entri in AncheCasa.<br>La sicurezza è già in mano ad AncheSicura.</h2><p>Dall'apertura alla certificazione, in ogni regione.</p><div class="btns"><a class="btn" href="contatti.html">Chiedi un'offerta</a></div></div></div>
</div></section>
"""
scrivi("index.html", "index", "AncheSicura · La sicurezza di AncheCasa", "AncheSicura, la divisione sicurezza del gruppo AncheCasa: sicurezza sul lavoro in tutta Italia, corsi online, cantieri, medicina del lavoro e certificazioni.", h)

# ======================= SERVIZI =======================
s = hero("svc-sicurezza", "Servizi", 'Otto servizi.<br><span class="acc">Un solo riferimento.</span>',
         "AncheSicura affianca le aziende su sicurezza, cantieri, formazione, medicina del lavoro e su tutti gli adempimenti che durano nel tempo.",
         '<div class="btns"><a class="btn" href="contatti.html">Chiedi un\'offerta</a></div>', alt="Responsabile della sicurezza in cantiere")
s += '<section class="sez"><div class="wrap"><div class="indice">' + "".join(f'<a href="#{x[0]}">{x[1]}</a>' for x in SERVIZI) + "</div></div></section>"
for i, (sid, tit, foto, testo, voci) in enumerate(SERVIZI):
    foto_html = f'<img src="{img(foto)}" alt="{tit}" loading="lazy">'
    testo_html = f'<div><p class="kicker">{i + 1:02d}</p><h2>{tit}</h2><p>{testo}</p>{lista(voci)}<div class="btns" style="margin-top:22px"><a class="btn" href="contatti.html#servizio={sid}">Chiedi un\'offerta</a>' + ('<a class="btn linea" href="corsi.html">Vedi i corsi</a>' if sid == "formazione" else "") + "</div></div>"
    s += f'<section class="sez{" carta" if i % 2 == 0 else ""}" id="{sid}"><div class="wrap duo">' + (foto_html + testo_html if i % 2 == 0 else testo_html + foto_html) + "</div></section>"
scrivi("servizi.html", "servizi", "Servizi · AncheSicura", "RSPP, sicurezza nei cantieri, formazione, medicina del lavoro, certificazioni, risorse umane, organizzazione e privacy.", s)

# ======================= SETTORI =======================
p = hero("cat-dighe", "Settori", 'Il luogo è il tuo.<br><span class="acc">Il metodo resta.</span>',
         "Cantieri, stabilimenti, porti, dighe, uffici, cucine, alberghi e magazzini. AncheSicura entra nel posto in cui lavori.",
         '<div class="btns"><a class="btn" href="contatti.html">Chiedi un\'offerta</a></div>', alt="Tecnici davanti a una diga")
p += f"""<section class="sez"><div class="wrap">
  <div class="testa"><div><h2>Opere e impianti</h2><p>Dove il lavoro è fisico e il cantiere, o la macchina, sta al centro.</p></div></div>
  <div class="griglia tre">{''.join(carta(None, f, t, d) for f, t, d in SETTORI_OPERE)}</div>
</div></section>
<section class="sez carta"><div class="wrap">
  <div class="testa"><div><h2>Dove entra anche il pubblico</h2><p>Qui il rischio non è solo di chi lavora: entra chi alloggia, mangia o chiede un servizio.</p></div></div>
  <div class="griglia">{''.join(carta(None, f, t, d) for f, t, d in SETTORI_PUBBLICO)}</div>
</div></section>
<section class="sez"><div class="wrap">
  <div class="banner"><img src="img/pannelli/cat-cantieri.jpg" alt=""><div class="t"><h2>Non trovi il tuo settore?</h2><p>Raccontaci dove lavori: ti diciamo come entra AncheSicura, con lo stesso metodo.</p><div class="btns"><a class="btn" href="contatti.html">Scrivici</a></div></div></div>
</div></section>
"""
scrivi("progetti.html", "settori", "Settori · AncheSicura", "I settori in cui lavora AncheSicura: cantieri, industrie, navale, dighe, logistica, uffici, alberghi, ristorazione e strutture pubbliche.", p)

CORSI_PREZZI = [
  ("Lavoratori, parte generale (4 ore)", "Online", 29, 40), ("Generale + specifica rischio basso (8 ore)", "Online", 49, 70),
  ("Lavoratori rischio medio (12 ore)", "Online + aula", 129, 180), ("Lavoratori rischio alto (16 ore)", "Online + aula", 159, 210),
  ("Aggiornamento lavoratori (6 ore)", "Online", 45, 65), ("Dirigenti (12 ore)", "Online", 99, 143), ("Datore di lavoro RSPP (16 ore)", "Online", 129, 176),
  ("Preposto (12 ore)", "Aula", 159, 220), ("Antincendio livello 1", "Aula", 139, 200), ("Antincendio livello 2", "Aula", 179, 250),
  ("Primo soccorso gruppo B e C", "Aula", 179, 250), ("Primo soccorso gruppo A", "Aula", 239, 330), ("HACCP", "Online", 29, None),
]
SERVIZI_PREZZI = [("Visita medica", "da 29 €"), ("POS (piano operativo di sicurezza)", "da 59 €"), ("DUVRI", "da 69 €"), ("DVR", "da 199 €"), ("PSC", "da 199 €"), ("RSPP esterno", "su preventivo")]
def euro(x): return ("%d €" % x) if x == int(x) else ("%.2f €" % x).replace(".", ",")
def tab_corsi():
    r = "".join(f'<tr><td>{n}</td><td>{m}</td><td class="num forte">{euro(p)}</td><td class="num barrato">{euro(q) if q else "—"}</td></tr>' for n, m, p, q in CORSI_PREZZI)
    return f'<div class="tabella-box"><table class="listino"><thead><tr><th>Corso</th><th>Come</th><th class="num">AncheSicura</th><th class="num">Media di mercato</th></tr></thead><tbody>{r}</tbody></table></div>'
def tab_servizi():
    r = "".join(f'<tr><td>{n}</td><td class="num forte">{p}</td></tr>' for n, p in SERVIZI_PREZZI)
    return f'<div class="tabella-box"><table class="listino"><thead><tr><th>Servizio</th><th class="num">Prezzo</th></tr></thead><tbody>{r}</tbody></table></div>'

# ======================= CORSI =======================
CORSI_ONLINE = [
    ("svc-formazione", "Lavoratori, parte generale", "Le ore uguali per ogni azienda: rischio, prevenzione e organizzazione della sicurezza."),
    ("cat-aziende", "Aggiornamento lavoratori", "Il richiamo periodico per chi ha già fatto il corso, senza tornare in aula."),
    ("svc-organizzazione", "Dirigenti", "Obblighi, organizzazione e scelte che incidono sulla sicurezza."),
    ("cat-cantieri", "Preposti, parte teorica", "Compiti di chi controlla il lavoro degli altri. La parte pratica si chiude in aula."),
    ("cat-ristorazione", "HACCP", "Igiene degli alimenti per chi lavora in cucina, al banco o in sala."),
    ("svc-privacy", "Privacy", "Le regole sui dati per chi in azienda tratta dati di clienti e dipendenti."),
]
CORSI_AULA = [
    ("cat-industrie", "Lavoratori, parte specifica", "I rischi del tuo mestiere e del tuo luogo di lavoro: basso, medio o alto."),
    ("cat-facchinaggio", "Macchine e attrezzature", "Abilitazione all'uso delle attrezzature, con la prova pratica sulle macchine."),
    ("aula", "Antincendio", "Teoria e prova con gli estintori, secondo il livello di rischio dell'attività."),
    ("svc-medicina", "Primo soccorso", "Addetti al primo soccorso: le manovre si provano in aula."),
]
c = hero("svc-formazione", "Corsi online · AncheSicura", 'La formazione obbligatoria,<br><span class="acc">online e in aula.</span>',
         "La teoria si segue online, quando vuoi, dal computer o dal telefono. La pratica si fa in aula con i nostri istruttori, in tutta Italia.",
         '<div class="btns"><a class="btn" href="#online">I corsi online</a><a class="btn chiaro" href="contatti.html#servizio=formazione">Chiedi un corso</a></div>', alt="Corso AncheSicura in aula")
c += f"""<section class="sez"><div class="wrap">
  <div class="testa"><div><h2>Come funziona il corso online</h2></div></div>
  {passi([("Scegli il corso", "Ci dici quali corsi servono e per quante persone."), ("Ricevi l'accesso", "Ogni partecipante riceve per mail l'accesso personale."), ("Segui quando vuoi", "Dal computer o dal telefono, anche a più riprese."), ("Attestato e scadenza", "L'attestato resta nel fascicolo e ti avvisiamo prima che scada.")])}
</div></section>
<section class="sez carta" id="online"><div class="wrap">
  <div class="testa"><div><h2>Corsi online</h2><p>Si seguono a distanza, quando vuoi.</p></div></div>
  <div class="griglia tre">{''.join(carta("contatti.html#servizio=formazione", f, t, d, "Chiedi informazioni", etichetta="Online") for f, t, d in CORSI_ONLINE)}</div>
</div></section>
<section class="sez"><div class="wrap">
  <div class="testa"><div><h2>Corsi in aula</h2><p>In aula o sul posto di lavoro, quando servono la prova pratica e le attrezzature.</p></div></div>
  <div class="griglia">{''.join(carta("contatti.html#servizio=formazione", f, t, d, "Chiedi informazioni", etichetta="In aula") for f, t, d in CORSI_AULA)}</div>
</div></section>
<section class="sez carta" id="listino"><div class="wrap">
  <div class="testa"><div><h2>Listino corsi</h2><p>Prezzi a persona, IVA esclusa. A fianco la media di mercato, indicativa, dei corsi equivalenti.</p></div></div>
  {tab_corsi()}
  <div class="btns" style="margin-top:22px"><a class="btn" href="contatti.html#servizio=formazione">Chiedi un corso</a><a class="btn linea" href="app.html">Ordina dall'app</a></div>
</div></section>
<section class="sez"><div class="wrap duo" style="align-items:start">
  <div><h2>Documenti e visite</h2><p>Per i documenti il prezzo finale dipende dall'azienda e dal cantiere: ti mandiamo il preventivo prima di partire.</p></div>
  {tab_servizi()}
</div></section>
<section class="sez blu"><div class="wrap duo">
  <div><h2>Per le aziende<br>e per i loro dipendenti.</h2><p style="color:rgba(255,255,255,.82)">Iscrivi tutto il personale con una richiesta sola. Tu vedi chi ha finito e quando scade ogni attestato.</p>
  <div class="btns" style="margin-top:22px"><a class="btn" href="contatti.html#servizio=formazione">Chiedi un'offerta per la tua azienda</a></div></div>
  <div class="griglia">{box("Online", "La teoria da casa, dall'ufficio o dal cantiere.", None, ICO['online'])}{box("In aula", "La pratica con istruttore e attrezzature.", None, ICO['aula'])}</div>
</div></section>
"""
scrivi("corsi.html", "corsi", "Corsi online · AncheSicura", "Corsi di sicurezza sul lavoro online e in aula: lavoratori, preposti, dirigenti, HACCP, antincendio, primo soccorso e attrezzature.", c)

# ======================= CHI SIAMO =======================
q = hero("squadra", "Chi siamo", 'La divisione sicurezza<br><span class="acc">del gruppo AncheCasa.</span>',
         "AncheSicura nasce dentro AncheCasa per occuparsi di una cosa sola: la sicurezza sul lavoro, in tutta Italia, per le aziende del gruppo e per chi ci affida un incarico.",
         BOTTONI, alt="Squadra AncheSicura in cantiere")
q += f"""<section class="sez"><div class="wrap duo">
  <div><p class="kicker">La nostra idea</p><h2>Un solo riferimento,<br>in ogni città.</h2>
    <p>Affidi l'incarico ad AncheSicura e trovi la sicurezza già organizzata. Il lavoro lo segue la società della rete più vicina a te, con il metodo AncheSicura.</p>
    {lista(["<strong>La rete</strong>: società della sicurezza referenziate, selezionate e contrattualizzate in ogni regione.", "<strong>Il metodo</strong>: lo stesso in tutta Italia, con documenti e scadenze in un posto solo.", "<strong>Le persone</strong>: tecnici, consulenti, medici e formatori vicino a dove lavori."])}</div>
  <img src="{img('chi-incontro')}" alt="Riunione di lavoro con i tecnici" loading="lazy">
</div></section>
<section class="sez blu"><div class="wrap">
  <div class="testa"><div><h2>Come funziona la rete</h2></div></div>
  {passi([("AncheSicura seleziona", "Sceglie società della sicurezza referenziate in ogni regione e le mette sotto contratto."), ("Tu affidi l'incarico", "L'incarico lo dai ad AncheSicura, non devi cercare nessuno."), ("Lavora la rete", "Se ne occupa la società più vicina, con lo stesso metodo di tutte."), ("Tutto tracciato", "Verbali, checklist e scadenze nella piattaforma AncheCasa.")])}
</div></section>
<section class="sez"><div class="wrap">
  <div class="testa"><div><h2>Cosa seguono le società della rete</h2></div></div>
  <div class="griglia">
    {box("Coordinamento e direzione lavori", "Coordinamento in progetto e in esecuzione, piani di sicurezza e direzione lavori.", None, ICO['casco'])}
    {box("RSPP esterno", "Incarico di RSPP, valutazione dei rischi e rapporti con gli organi di vigilanza.", None, ICO['scudo'])}
    {box("Ispezioni e verifiche", "Controlli in cantiere e negli stabilimenti, con checklist e verbale per ogni visita.", None, ICO['doc'])}
    {box("Formazione e medicina", "Corsi online e in aula, abilitazioni e sorveglianza sanitaria per ogni mansione.", None, ICO['persone'])}
  </div>
</div></section>
<section class="sez carta"><div class="wrap duo">
  <div><h2>Sei una società della sicurezza?</h2><p>Cerchiamo società referenziate in tutta Italia per crescere insieme.</p><div class="btns" style="margin-top:22px"><a class="btn" href="rete.html">Entra nella rete</a></div></div>
  <div class="citta">{''.join(f'<a href="progetti.html">{x}</a>' for x in ["Cantieri edili", "Infrastrutture e gallerie", "Industrie e stabilimenti", "Navale", "Dighe", "Logistica e facchinaggio", "Uffici e aziende", "Alberghi", "Ristorazione e bar", "Strutture pubbliche"])}</div>
</div></section>
"""
scrivi("chi-siamo.html", "chi", "Chi siamo · AncheSicura", "AncheSicura è la divisione sicurezza del gruppo AncheCasa, con società della sicurezza selezionate in tutta Italia.", q)

# ======================= TUTTA ITALIA =======================
REGIONI = ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"]
it = hero("cat-cantieri", "Tutta Italia", 'La stessa sicurezza,<br><span class="acc">in ogni regione.</span>',
          "AncheSicura lavora in tutta Italia con società della sicurezza selezionate. Ovunque sia il tuo cantiere o la tua sede, hai lo stesso riferimento e lo stesso metodo.",
          '<div class="btns"><a class="btn" href="contatti.html">Chiedi un\'offerta</a><a class="btn chiaro" href="rete.html">Entra nella rete</a></div>', alt="Cantiere con casco di sicurezza")
it += f"""<section class="sez"><div class="wrap"><div class="griglia tre">
  {box("Un riferimento solo", "Che il lavoro sia a Milano, a Roma o a Palermo, l'incarico lo affidi ad AncheSicura.", None, ICO['scudo'])}
  {box("La società più vicina", "Il lavoro lo segue la società della rete più vicina al tuo cantiere o alla tua sede.", None, ICO['zona'])}
  {box("Lo stesso metodo", "Checklist, verbali e scadenze uguali in ogni regione, nella piattaforma AncheCasa.", None, ICO['doc'])}
</div></div></section>
<section class="sez carta"><div class="wrap">
  <div class="testa"><div><h2>Le regioni</h2><p>Scrivici dove lavori: ti diciamo chi ti segue. In ogni regione cerchiamo nuove società referenziate.</p></div></div>
  <div class="citta">{''.join(f'<a href="contatti.html">{r}</a>' for r in REGIONI)}</div>
</div></section>
<section class="sez"><div class="wrap duo">
  <img src="{img('squadra')}" alt="Squadra AncheSicura in cantiere" loading="lazy">
  <div><p class="kicker">Cantieri in più regioni</p><h2>Un'azienda, tanti cantieri.<br>Un solo fascicolo.</h2>
    <p>Se lavori in più città, AncheSicura coordina le società della rete di ogni zona e ti dà un fascicolo unico con tutte le scadenze.</p>
    <div class="btns" style="margin-top:22px"><a class="btn" href="contatti.html">Parlane con noi</a></div></div>
</div></section>
"""
scrivi("italia.html", "italia", "Tutta Italia · AncheSicura", "AncheSicura lavora in tutta Italia con società della sicurezza selezionate in ogni regione.", it)

# ======================= APP =======================
def tel(n, didascalia):
    return f'<figure class="tel-app"><div class="cornice"><img src="img/app/{n}.jpg" alt="{didascalia}" loading="lazy"></div><figcaption>{didascalia}</figcaption></figure>'
ap = hero("svc-sicurezza", "App AncheSicura", 'La sicurezza della tua azienda,<br><span class="acc">nel telefono.</span>',
          "Dipendenti, corsi, visite, scadenze e DPI in un posto solo. Ogni lavoratore ha il suo patentino sul telefono. Il consulente vede le aziende che segue.",
          '<div class="btns"><a class="btn" href="#prezzi">Prezzi</a><a class="btn chiaro" href="contatti.html#servizio=rspp">Chiedi una prova</a></div>', alt="")
ap += f"""<section class="sez"><div class="wrap">
  <div class="testa"><div><h2>Come si vede</h2><p>Schermate vere dell'app, con dati di esempio.</p></div></div>
  <div class="telefoni">{tel("as-sicurezza", "Il quadro della sicurezza")}{tel("as-dipendenti", "Dipendenti e scadenze")}{tel("as-corsi", "Corsi a prezzi sotto il mercato")}</div>
</div></section>
<section class="sez carta"><div class="wrap duo">
  <div><p class="kicker">Per il lavoratore</p><h2>Il patentino<br>sempre in tasca.</h2>
    {lista(["Corsi, visite e idoneità sempre aggiornati", "Il QR da mostrare all'ingresso del cantiere", "I DPI ricevuti si firmano col dito", "Le segnalazioni partono dal telefono"])}</div>
  <div class="telefoni due-tel">{tel("as-patentino", "Il patentino del lavoratore")}{tel("as-lavoratore", "La home del lavoratore")}</div>
</div></section>
<section class="sez"><div class="wrap duo">
  <div class="telefoni uno-tel">{tel("as-consulente", "Le aziende del consulente")}</div>
  <div><p class="kicker">Per il consulente</p><h2>Tutte le aziende<br>che segui.</h2>
    {lista(["L'azienda ti dà accesso e tu vedi le sue scadenze", "Verbali e sopralluoghi nello stesso fascicolo", "Avvisi prima che qualcosa scada"])}</div>
</div></section>
<section class="sez blu" id="prezzi"><div class="wrap">
  <div class="testa"><div><h2>Prezzi</h2><p style="color:rgba(255,255,255,.82)">I moduli AncheSicura si aggiungono all'abbonamento Impresa AncheCasa (49 € al mese, Ufficio compreso). Prezzi al mese, IVA esclusa.</p></div></div>
  <div class="griglia">
    {box("Sicurezza · 9 € al mese", "Dipendenti, corsi, visite, scadenze, DPI firmati, segnalazioni. Patentino per ogni lavoratore.", None, ICO['scudo'])}
    {box("Sicurezza Cantiere · 19 € al mese", "Ingressi con codice, verbali del coordinatore, checklist del preposto.", None, ICO['casco'])}
    {box("Corsi", "Si ordinano dall'app ai prezzi del listino AncheSicura.", "corsi.html#listino", ICO['online'])}
  </div>
  <div class="btns" style="margin-top:26px"><a class="btn" href="https://www.anchecasa.it/iscriviti.html#azienda-impresa">Iscrivi l'azienda</a><a class="btn chiaro" href="contatti.html#servizio=rspp">Chiedi informazioni</a></div>
</div></section>
"""
scrivi("app.html", "app", "App AncheSicura · Sicurezza nel telefono", "L'app AncheSicura: dipendenti, corsi, visite, scadenze, DPI firmati e patentino del lavoratore. Moduli da 9 € al mese.", ap)

# ======================= ENTRA NELLA RETE =======================
re_ = hero("chi-incontro", "Per le società della sicurezza", 'Cerchiamo società referenziate<br><span class="acc">in tutta Italia.</span>',
          "AncheSicura è la divisione sicurezza del gruppo AncheCasa. In ogni regione cerchiamo società della sicurezza serie, con esperienza e referenze, per affidare loro gli incarichi del gruppo e dei nostri clienti.",
          '<div class="btns"><a class="btn" href="#candidatura">Candida la tua società</a><a class="btn chiaro" href="#requisiti">Chi cerchiamo</a></div>', alt="Squadra AncheSicura in cantiere")
re_ += f"""<section class="sez" id="requisiti"><div class="wrap duo" style="align-items:start">
  <div><p class="kicker">Chi cerchiamo</p><h2>Società della sicurezza<br>con esperienza documentata.</h2>
    {lista(["Esperienza documentata in sicurezza sul lavoro e nei cantieri", "Referenze di clienti che possiamo contattare", "Figure qualificate: RSPP, CSP e CSE, formatori, medici competenti", "Assicurazione di responsabilità civile professionale", "Una sede operativa nella regione in cui lavori"])}</div>
  <div><p class="kicker">Cosa trovi</p><h2>Una rete che porta lavoro.</h2>
    {lista(["Incarichi dalle aziende del gruppo AncheCasa e dai clienti AncheSicura della tua zona", "Il marchio AncheSicura, riconoscibile in tutta Italia", "La piattaforma AncheCasa per documenti, verbali e scadenze", "I corsi online AncheSicura da offrire ai tuoi clienti"])}</div>
</div></section>
<section class="sez blu"><div class="wrap">
  <div class="testa"><div><h2>Come si entra</h2><p style="color:rgba(255,255,255,.82)">Si entra per merito: AncheSicura legge ogni candidatura.</p></div></div>
  {passi([("Candidatura", "Ci mandi i dati della società, i servizi e le referenze."), ("Verifica", "Controlliamo documenti, figure e referenze."), ("Incontro", "Ci conosciamo e parliamo della tua zona."), ("Contratto", "Entri nella rete e ricevi i primi incarichi.")])}
</div></section>
<section class="sez carta" id="candidatura"><div class="wrap duo" style="align-items:start">
  <div><h2>Candida la tua società</h2><p>Compila il modulo: la candidatura arriva subito ad AncheSicura. Poi ci mandi per mail la presentazione della società e le referenze.</p>
    <img src="{img('squadra')}" alt="Squadra AncheSicura in cantiere" loading="lazy" style="margin-top:24px;border-radius:18px;width:100%"></div>
  <div class="pannello"><form class="modulo" id="f-rete" data-oggetto="AncheSicura · candidatura società della sicurezza">
    <label>Ragione sociale<input name="Ragione sociale" required type="text" autocomplete="organization"></label>
    <div class="due"><label>Partita IVA<input name="Partita IVA" required type="text"></label><label>Regione<select name="Regione" required><option value="">Scegli…</option>{''.join(f'<option>{r}</option>' for r in REGIONI)}</select></label></div>
    <div class="due"><label>Referente<input name="Referente" required type="text" autocomplete="name"></label><label>Telefono<input name="Telefono" required type="tel" autocomplete="tel"></label></div>
    <label>Mail<input name="Mail" required type="email" autocomplete="email"></label>
    <label>Servizi che offrite<textarea name="Servizi" required placeholder="Es. RSPP esterno, CSE, formazione, medicina del lavoro"></textarea></label>
    <label>Referenze principali<textarea name="Referenze" placeholder="Clienti e lavori che possiamo verificare"></textarea></label>
    <label class="spunta"><input required type="checkbox">Ho letto l'<a href="https://www.anchecasa.it/privacy.html" style="text-decoration:underline">informativa privacy</a>.</label>
    <button class="btn" type="submit">Invia la candidatura</button>
    <p class="esito" hidden>Si è aperta la tua mail con la candidatura: allega i documenti e premi Invia.</p>
  </form></div>
</div></section>
"""
scrivi("rete.html", "rete", "Entra nella rete · AncheSicura", "AncheSicura cerca società della sicurezza referenziate in tutta Italia.", re_)

# ======================= CONTATTI =======================
opz = "".join(f'<option value="{x[0]}">{x[1]}</option>' for x in SERVIZI)
k = hero("hero-anchesicura", "Contatti", 'Scrivici.<br><span class="acc">Se è urgente, dillo subito.</span>',
         "Ti risponde AncheSicura, con l'azienda della rete più vicina al tuo lavoro.", "", alt="")
k += f"""<section class="sez"><div class="wrap duo" style="align-items:start">
  <div><h2>Chiedi un'offerta</h2><p>Compila il modulo: la richiesta arriva subito ad AncheSicura.</p>
    <div class="griglia" style="margin-top:24px">
      {box("Tutta Italia", "La stessa cura in ogni regione della rete AncheCasa.", None, ICO['zona'])}
      {box("Urgenze", "Se segni l'urgenza, la richiesta passa davanti.", None, ICO['orologio'])}
    </div>
    <p style="margin-top:22px">Mail: <a href="mailto:{MAIL}" style="color:var(--arancio);font-weight:700">{MAIL}</a></p></div>
  <div class="pannello"><form class="modulo" id="f-offerta">
    <label>Nome e azienda<input name="nome" required type="text" autocomplete="organization"></label>
    <div class="due"><label>Telefono<input name="telefono" required type="tel" autocomplete="tel"></label><label>Mail<input name="mail" required type="email" autocomplete="email"></label></div>
    <div class="due"><label>Servizio<select name="servizio" id="f-servizio">{opz}<option value="altro">Altro</option></select></label><label>Città<input name="citta" type="text"></label></div>
    <label>È urgente?<select name="urgenza"><option>No</option><option>Sì, è urgente</option></select></label>
    <label>Messaggio<textarea name="messaggio" placeholder="Es. cantiere di 3 mesi a Roma, servono CSE e corso preposti"></textarea></label>
    <label class="spunta"><input required type="checkbox">Ho letto l'<a href="https://www.anchecasa.it/privacy.html" style="text-decoration:underline">informativa privacy</a>.</label>
    <button class="btn" type="submit">Invia la richiesta</button>
    <p class="esito" id="f-esito" hidden>Si è aperta la tua mail con la richiesta: premi Invia per mandarla ad AncheSicura.</p>
  </form></div>
</div></section>
"""
scrivi("contatti.html", "contatti", "Contatti · AncheSicura", "Chiedi un'offerta ad AncheSicura.", k)

open("js/sicura.js", "w", encoding="utf-8").write(open("js/sicura.src.js", encoding="utf-8").read().replace("__MAIL__", MAIL))

open("css/sicura.css", "w", encoding="utf-8").write("""/* AncheSicura: solo le differenze rispetto al sistema AncheCasa */
.sottobarra { background: #fff; border-bottom: 1px solid #e3e7ee; }
.sottobarra .wrap { display: flex; align-items: center; gap: 22px; min-height: 64px; }
.div-marchio { flex: 0 0 auto; display: block; line-height: 0; }
.div-marchio img { height: 34px; width: auto; max-width: none; display: block; }
.div-menu { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; flex: 1 1 auto; min-width: 0; }
.div-menu::-webkit-scrollbar { display: none; }
.div-menu .voce { white-space: nowrap; padding: 8px 12px; border-radius: 999px; font-weight: 600; font-size: 15px; color: #16304D; text-decoration: none; }
.div-menu .voce:hover { background: #f1f4f8; }
.div-menu .voce.on { background: #fdeee2; color: #c45d0c; }
.div-btn { flex: 0 0 auto; }
@media (max-width: 860px) { .sottobarra .wrap { flex-wrap: wrap; gap: 8px 14px; padding-block: 10px; } .div-btn { display: none; } .div-menu { flex-basis: 100%; order: 3; flex-wrap: wrap; overflow: visible; } .div-menu .voce { padding: 6px 10px; font-size: 14px; } .div-marchio img { height: 30px; } }
.tabella-box { overflow-x: auto; background: #fff; border-radius: 18px; border: 1px solid #e3e7ee; }
table.listino { width: 100%; border-collapse: collapse; font-size: 16px; min-width: 520px; }
.listino th, .listino td { padding: 13px 18px; text-align: left; border-bottom: 1px solid #edf0f4; }
.listino th { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #5b6676; background: #f6f8fb; }
.listino .num { text-align: right; white-space: nowrap; }
.listino .forte { font-weight: 700; color: #16304D; }
.listino .barrato { color: #8a94a3; text-decoration: line-through; }
.listino tr:last-child td { border-bottom: 0; }
.telefoni { display: flex; gap: 28px; justify-content: center; flex-wrap: wrap; }
.tel-app { margin: 0; width: 250px; text-align: center; }
.tel-app .cornice { background: #0e1726; border-radius: 38px; padding: 10px; box-shadow: 0 18px 40px rgba(14,23,38,.22); }
.tel-app img { display: block; width: 100%; border-radius: 30px; aspect-ratio: 390/844; object-fit: cover; object-position: top; }
.due-tel .tel-app { width: 220px; }
.tel-app figcaption { margin-top: 12px; font-weight: 600; color: #3a4556; }
.sez.blu .tel-app figcaption { color: #fff; }
@media (max-width: 600px) { .tel-app { width: 78%; } }

.menu .solo-tel { display: none; }
.testata .accedi { white-space: nowrap; }
@media (max-width: 1180px) { .testata .accedi { display: none; } }
@media (max-width: 960px) { .menu.aperto .solo-tel { display: block; } }
.piede .logo-ac img { height: 40px; width: auto; margin-top: 6px; }
.piede .col > div:first-child img { height: 46px; width: auto; }
.carta-foto .foto { position: relative; }
.carta-foto .etichetta { position: absolute; top: 12px; left: 12px; background: var(--blu); color: #fff; font-weight: 700; font-size: 13px; padding: 5px 11px; border-radius: 999px; }
.indice { display: flex; flex-wrap: wrap; gap: 8px; }
.indice a { padding: 9px 16px; border-radius: 999px; border: 1.5px solid var(--linea); color: var(--blu); font-weight: 700; }
.indice a:hover { border-color: var(--arancio); color: var(--arancio); }
.kicker svg { vertical-align: middle; color: var(--arancio); }
""")
print("pagine scritte")
