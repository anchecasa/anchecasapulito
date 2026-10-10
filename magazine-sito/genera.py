# -*- coding: utf-8 -*-
"""AncheCasa Magazine · generatore del sito magazine.anchecasa.it (10.10.2026).
Uso:  python3 genera.py            → rifà tutte le pagine nella cartella del sito (questa cartella).
Contenuti in contenuti.py; stile in css/stile.css; comportamento in js/sito.js.
Le foto originali stanno in sorgenti-img/: lo script crea le versioni leggere in img/ (1600 e 800 px).
"""
import os, json, html, datetime, shutil, importlib.util
from PIL import Image

QUI = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("contenuti", os.path.join(QUI, "contenuti.py"))
C = importlib.util.module_from_spec(spec); spec.loader.exec_module(C)

SITO = "https://magazine.anchecasa.it"
MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]
def data_it(s):
    d = datetime.date.fromisoformat(s); return f"{d.day} {MESI[d.month-1]} {d.year}"
e = lambda s: html.escape(str(s), quote=True)
RUB = {r[0]: r for r in C.RUBRICHE}
RUB["editoriale"] = ("editoriale", "Editoriale", "")

# ------------------------------------------------------------------ immagini leggere
def immagini():
    src, dst = os.path.join(QUI, "sorgenti-img"), os.path.join(QUI, "img")
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if not f.lower().endswith(".jpg"): continue
        k = f[:-4]
        im = Image.open(os.path.join(src, f)).convert("RGB")
        for w, q in ((1600, 66), (800, 60)):
            out = os.path.join(dst, f"{k}-{w}.jpg")
            if os.path.exists(out) and os.path.getmtime(out) > os.path.getmtime(os.path.join(src, f)): continue
            r = im.copy(); r.thumbnail((w, w * 3), Image.LANCZOS)
            r.save(out, quality=q, optimize=True, progressive=True)

def foto(nome, alt, cls="", sizes="100vw", lazy=True, w=1600, h=1067):
    k = nome[:-4]
    try:
        im = Image.open(os.path.join(QUI, "img", f"{k}-1600.jpg")); w, h = im.size
    except Exception: pass
    return (f'<img class="{cls}" src="/img/{k}-1600.jpg" srcset="/img/{k}-800.jpg 800w, /img/{k}-1600.jpg 1600w" sizes="{sizes}" '
            f'width="{w}" height="{h}" alt="{e(alt)}"' + (' loading="lazy" decoding="async"' if lazy else ' fetchpriority="high"') + '>')

# ------------------------------------------------------------------ pezzi comuni

def testata(attiva=""):
    voci = [("/#numero", "Il numero", "numero"), ("/rubriche/bonus", "Rubriche", "rubriche"), ("/app-gratuite", "App gratuite", "app"), ("/numeri", "Archivio", "numeri"), ("/chi-siamo", "Chi siamo", "chi")]
    li = "".join(f'<li><a href="{h}"{" aria-current=\"page\"" if k == attiva else ""}>{t}</a></li>' for h, t, k in voci)
    rub = "".join(f'<li><a href="/rubriche/{r[0]}">{e(r[1])}</a></li>' for r in C.RUBRICHE)
    return f'''<a class="salta" href="#contenuto">Vai al contenuto</a>
<header class="testata">
  <div class="testata-in">
    <a class="marchio" href="/" aria-label="AncheCasa Magazine, home"><img src="/img/logo-anchecasa-560.png" srcset="/img/logo-anchecasa-560.png 1x, /img/logo-anchecasa-1120.png 2x" width="168" height="33" alt="AncheCasa, Costruiamo fiducia"><span class="m-mag">Magazine</span></a>
    <nav class="menu" aria-label="Menu principale"><ul>{li}</ul></nav>
    <a class="t-iscr" href="#iscriviti">Iscriviti gratis</a>
    <button class="t-apri" type="button" aria-expanded="false" aria-controls="cassetto"><span></span><span></span><span class="vh">Apri il menu</span></button>
  </div>
  <div class="cassetto" id="cassetto" hidden>
    <ul class="c-voci">{li}</ul>
    <p class="c-tit">Rubriche</p><ul class="c-rub">{rub}</ul>
  </div>
</header>'''

CURVA = ('<svg class="curva" viewBox="0 0 600 52" preserveAspectRatio="none" aria-hidden="true">'
         + "".join(
    f'<path fill="{col}" d="M0 52 ' + " ".join(
        f'L{600*i/60:.1f} {(((a*(i/60)+b)*(i/60)+c)*(i/60)+d):.2f}' for i in range(61)) + ' L600 52 Z"/>'
    for col, (a, b, c, d) in (("#F49B50", (3.1335, -42.8382, 10.2674, 33.5524)), ("#E56B10", (-1.3827, -26.5596, 1.7325, 40.8033)), ("#16304D", (0.6414, -21.6553, 2.0786, 47.9497))))
         + '</svg>')

def iscriviti():
    return '''<section class="iscr" id="iscriviti" aria-labelledby="iscr-t">
  <div class="iscr-in">
    <div class="iscr-testo">
      <h2 id="iscr-t">Il prossimo numero, nella tua mail</h2>
      <p>Ogni quindici giorni ti scriviamo quando esce la rivista. Il 1° novembre ti avvisiamo anche dell’app gratuita per la raccolta differenziata del tuo Comune.</p>
    </div>
    <form class="iscr-form" novalidate>
      <label><span>La tua mail</span><input type="email" name="mail" autocomplete="email" required placeholder="nome@esempio.it"></label>
      <label><span>Il tuo Comune</span><input type="text" name="comune" autocomplete="address-level2" placeholder="Per esempio Bergamo"></label>
      <label class="iscr-ok"><input type="checkbox" name="privacy" required> <span>Ho letto l’<a href="https://anchecasa.it/privacy">informativa privacy</a>. Niente pubblicità: solo la rivista e l’app.</span></label>
      <button type="submit">Iscriviti gratis</button>
      <p class="iscr-msg" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>'''

def piede():
    rub = "".join(f'<li><a href="/rubriche/{r[0]}">{e(r[1])}</a></li>' for r in C.RUBRICHE)
    return f'''<footer class="piede">
  {CURVA}
  <div class="piede-in">
    <div class="p-marchio">
      <img src="/img/logo-negativo.png" width="200" height="51" alt="AncheCasa, Costruiamo fiducia">
      <p>AncheCasa Magazine è la rivista gratuita di AncheCasa per chi vive e rinnova casa. Esce ogni 15 giorni. Nessuna impresa paga per comparire.</p>
    </div>
    <div><p class="p-tit">Rubriche</p><ul>{rub}</ul></div>
    <div><p class="p-tit">Il magazine</p><ul><li><a href="/numeri">Archivio dei numeri</a></li><li><a href="/app-gratuite">App gratuite</a></li><li><a href="/chi-siamo">Chi siamo</a></li><li><a href="https://anchecasa.it">anchecasa.it</a></li></ul></div>
    <div><p class="p-tit">Contatti</p><ul><li><a href="mailto:info@anchecasa.it">info@anchecasa.it</a></li><li><a href="https://anchecasa.it/privacy">Privacy</a></li></ul></div>
  </div>
  <p class="p-legale">© {datetime.date.today().year} Palumbo Investment S.r.l.</p>
</footer>'''

def pagina(nome_file, titolo, descr, corpo, attiva="", og_img="copertina-n1-1600.jpg", tipo="website", ld=None, canon=None, script=""):
    url = SITO + (canon if canon is not None else "/" + nome_file.replace("index.html", "").replace(".html", ""))
    ldj = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>' if ld else ""
    doc = f'''<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(titolo)}</title>
<meta name="description" content="{e(descr)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="{tipo}">
<meta property="og:site_name" content="AncheCasa Magazine">
<meta property="og:title" content="{e(titolo)}">
<meta property="og:description" content="{e(descr)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITO}/img/{og_img}">
<meta property="og:locale" content="it_IT">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#16304D">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;0,6..96,700;1,6..96,500;1,6..96,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/stile.css?v=2">
{ldj}
</head>
<body>
{testata(attiva)}
<main id="contenuto">
{corpo}
</main>
{iscriviti()}
{piede()}
<script src="/js/sito.js?v=2" defer></script>
{script}
</body>
</html>
'''
    p = os.path.join(QUI, nome_file); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w", encoding="utf-8").write(doc)

# ------------------------------------------------------------------ pezzi editoriali
def link_art(a): return f"/articoli/{a['slug']}"
def rub_nome(a): return RUB[a["rubrica"]][1]
def scheda(a, grande=False, sizes="(min-width: 900px) 33vw, 100vw"):
    return (f'<article class="scheda{" scheda-g" if grande else ""}"><a href="{link_art(a)}">'
            f'<div class="s-foto">{foto(a["img"], a["alt"], sizes=sizes)}</div>'
            f'<p class="rub">{e(rub_nome(a))}</p><h3>{e(a["titolo"])}</h3>'
            + (f'<p class="s-som">{e(a["sommario"])}</p>' if grande else "") +
            f'<p class="s-meta">{a["lettura"]} min di lettura</p></a></article>')

def articoli(numero=None):
    l = [a for a in C.ARTICOLI if numero is None or a["numero"] == numero]
    return sorted(l, key=lambda a: (-a["numero"], a["ordine"]))

# ------------------------------------------------------------------ home
def home():
    N = C.NUMERI[0]
    tutti = articoli(N["n"])
    lead = next(a for a in tutti if a["slug"].startswith("bonus-casa"))
    altri = [a for a in tutti if a is not lead and a["rubrica"] != "editoriale"]
    edit = next(a for a in tutti if a["rubrica"] == "editoriale")
    lista = [a for a in tutti if a.get("copertina") and a is not lead] + [next(a for a in tutti if a["slug"] == "la-bolletta-smontata")]
    sommario = "".join(f'<li><a href="{link_art(a)}"><span class="rub">{e(rub_nome(a))}</span><span class="t">{e(a["titolo"])}</span></a></li>' for a in lista)
    resto = [a for a in altri if a not in lista]
    app = "".join(f'''<li class="app app-{x["id"]}"><p class="app-stato">{e(x["stato"])}</p><h3>{e(x["nome"])}</h3><p>{e(x["cosa"])}</p><a class="app-tasto" href="{x["link"]}">{e(x["tasto"])}</a></li>''' for x in C.APP)
    chips = "".join(f'<li><a href="/rubriche/{r[0]}">{e(r[1])}</a></li>' for r in C.RUBRICHE)
    rubriche = f'''<section class="rubrica" aria-labelledby="r-tutti"><div class="r-testa"><h2 id="r-tutti">Da leggere</h2><ul class="rub-tab">{chips}</ul></div><div class="griglia">{"".join(scheda(a) for a in resto)}</div></section>'''
    corpo = f'''
<section class="apertura" aria-labelledby="ap-t">
  <div class="ap-testo">
    <h1 id="ap-t" class="ap-mast"><img src="/img/logo-anchecasa-1120.png" width="560" height="110" alt="AncheCasa"><em>Magazine</em></h1>
    <p class="ap-num">Numero {N["n"]} · {e(N["data"])} · gratuito</p>
    <p class="ap-lead">La casa spiegata in modo semplice: bonus, bollette, lavori e diritti, con la fonte accanto a ogni numero. Ogni quindici giorni, per chi ci abita.</p>
    <div class="ap-tasti"><a class="tasto" href="{N["sfoglia"]}">Sfoglia il numero {N["n"]}</a><a class="tasto tasto-vuoto" href="#numero">Leggi gli articoli</a></div>
  </div>
  <figure class="ap-cop">
    <a href="{N["sfoglia"]}" aria-label="Sfoglia il numero {N["n"]}">{foto(N["copertina"], "Copertina di AncheCasa Magazine numero " + str(N["n"]), cls="cop", sizes="(min-width: 900px) 34vw, 78vw", lazy=False)}</a>
    <p class="conto" data-scadenza="{C.SCADENZA_BONUS}" hidden><b class="conto-n"></b><span>giorni per il bonus casa al 50%</span></p>
  </figure>
</section>

<section class="numero" id="numero" aria-labelledby="num-t">
  <div class="num-testa"><h2 id="num-t">In questo numero</h2><p>Controllato il {data_it(C.AGGIORNATO)}</p></div>
  <div class="num-griglia">
    {scheda(lead, grande=True, sizes="(min-width: 900px) 58vw, 100vw")}
    <ol class="num-lista">{sommario}</ol>
  </div>
</section>

<section class="fascia-app" aria-labelledby="app-t">
  <div class="fa-in">
    <div class="fa-testa">
      <h2 id="app-t">App gratuite, per sempre</h2>
      <p>Dentro la rivista trovi strumenti che puoi usare subito. Si usano e si scaricano gratis, oggi e domani: niente abbonamenti, niente pubblicità. Li sviluppa <strong>AncheStudio</strong>, la società di software di AncheCasa.</p>
      <a class="fa-link" href="/app-gratuite">Come funzionano le app</a>
    </div>
    <ul class="fa-app">{app}</ul>
  </div>
</section>

{rubriche}

<section class="promessa" aria-labelledby="pr-t">
  <div class="pr-foto">{foto(edit["img"], edit["alt"], sizes="(min-width: 900px) 45vw, 100vw")}</div>
  <div class="pr-testo">
    <h2 id="pr-t">Perché esiste questa rivista</h2>
    <p>Ogni giorno milioni di persone cercano come si legge una bolletta, quanto costa rifare il bagno, se il bonus vale ancora. Trovano mille pagine uguali. Noi facciamo il contrario: una cosa alla volta, spiegata bene, con la data dell’ultimo controllo.</p>
    <p>Qui nessuna impresa paga per comparire. Quando ti serve qualcuno che faccia il lavoro, ti indichiamo un solo posto: <a href="https://anchecasa.it">anchecasa.it</a>, dove scegli tu.</p>
    <a class="tasto tasto-vuoto" href="{link_art(edit)}">Leggi l’editoriale</a>
  </div>
</section>
'''
    ld = {"@context": "https://schema.org", "@type": "Periodical", "name": "AncheCasa Magazine", "url": SITO, "inLanguage": "it", "isAccessibleForFree": True, "publisher": {"@type": "Organization", "name": "AncheCasa", "url": "https://anchecasa.it"}}
    pagina("index.html", "AncheCasa Magazine · la casa spiegata bene, gratis",
           "La rivista gratuita di AncheCasa per chi vive e rinnova casa: bonus, bollette, lavori e diritti spiegati in modo semplice, con fonti aggiornate. App gratuite per sempre.",
           corpo, attiva="numero", ld=ld, canon="/")

# ------------------------------------------------------------------ articolo
def articolo(a):
    N = next(n for n in C.NUMERI if n["n"] == a["numero"])
    stessa = [x for x in articoli() if x is not a and x["rubrica"] == a["rubrica"]]
    altri = (stessa + [x for x in articoli(a["numero"]) if x is not a and x not in stessa and x["rubrica"] != "editoriale"])[:3]
    fonti = ""
    if a.get("fonti"):
        fonti = '<section class="fonti"><h2>Fonti</h2><ul>' + "".join(
            f'<li>{f"<a href={chr(34)}{e(u)}{chr(34)} rel=\"noopener\">{e(t)}</a>" if u else e(t)}</li>' for t, u in a["fonti"]) + "</ul></section>"
    strumento = ""
    if a.get("strumento"):
        x = next(x for x in C.APP if x["id"] == a["strumento"])
        strumento = f'<aside class="box-app"><p class="ba-tit">Strumento gratuito</p><h2>{e(x["nome"])}</h2><p>{e(x["cosa"])}</p><a class="tasto" href="{x["link"]}">{e(x["tasto"])}</a><p class="ba-nota">{e(x["nota"])}</p></aside>'
    novita = ""
    if a.get("novita"):
        novita = '<aside class="novita" aria-label="Cosa è cambiato"><p class="nv-tit">Cosa è cambiato</p><ul>' + "".join(f'<li><time datetime="{d}">{data_it(d)}</time> {e(x)}</li>' for d, x in a["novita"]) + "</ul></aside>"
    url = f"{SITO}/articoli/{a['slug']}"
    import urllib.parse
    wa = "https://wa.me/?text=" + urllib.parse.quote(a["titolo"] + " · AncheCasa Magazine\n\n" + url + "?da=whatsapp")
    condividi = f'<div class="condividi"><a class="cd-wa" href="{wa}" target="_blank" rel="noopener" data-canale="whatsapp"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8c.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.3Z"/></svg>Condividi su WhatsApp</a><button type="button" class="cd-copia" data-url="{url}">Copia il link</button><span class="cd-ok" role="status" aria-live="polite"></span></div>'
    rubrica_link = f'<a class="rub" href="/rubriche/{a["rubrica"]}">{e(rub_nome(a))}</a>' if a["rubrica"] in dict((r[0], 1) for r in C.RUBRICHE) else f'<span class="rub">{e(rub_nome(a))}</span>'
    corpo = f'''
<article class="art">
  <header class="art-testa">
    {rubrica_link}
    <h1>{e(a["titolo"])}</h1>
    <p class="art-som">{e(a["sommario"])}</p>
    <p class="art-meta">Numero {N["n"]} · Controllato il <time datetime="{C.AGGIORNATO}">{data_it(C.AGGIORNATO)}</time> · {a["lettura"]} min di lettura</p>
    {condividi}
  </header>
  <figure class="art-foto">{foto(a["img"], a["alt"], lazy=False, sizes="(min-width: 1100px) 1040px, 100vw")}</figure>
  <div class="art-corpo">
    {novita}
    <div class="testo">{a["corpo"]}</div>
    {strumento}
    <aside class="box-ac">
      <p class="bac-tit">Ti serve qualcuno che lo faccia?</p>
      <p>Su anchecasa.it pubblichi gratis la tua richiesta, rispondono le imprese verificate della tua zona e scegli tu, parlando in chat.</p>
      <a class="tasto" href="https://anchecasa.it">Vai su anchecasa.it</a>
    </aside>
    {fonti}
    {condividi.replace('class="condividi"', 'class="condividi cd-fondo"')}
    <p class="art-avviso">Contenuto divulgativo: non sostituisce il parere di un tecnico o di un commercialista. Hai trovato un dato da aggiornare? Scrivici a <a href="mailto:info@anchecasa.it">info@anchecasa.it</a>.</p>
  </div>
</article>
<section class="leggi-anche" aria-labelledby="la-t"><h2 id="la-t">Leggi anche</h2><div class="griglia">{"".join(scheda(x) for x in altri)}</div></section>
'''
    ld = {"@context": "https://schema.org", "@type": "Article", "headline": a["titolo"], "description": a["sommario"], "image": f"{SITO}/img/{a['img'][:-4]}-1600.jpg",
          "datePublished": N["uscita"], "dateModified": C.AGGIORNATO, "inLanguage": "it", "isAccessibleForFree": True,
          "author": {"@type": "Organization", "name": "Redazione AncheCasa"}, "publisher": {"@type": "Organization", "name": "AncheCasa", "url": "https://anchecasa.it"},
          "mainEntityOfPage": f"{SITO}/articoli/{a['slug']}"}
    pagina(f"articoli/{a['slug']}.html", f"{a['titolo']} · AncheCasa Magazine", a["sommario"], corpo, og_img=f"{a['img'][:-4]}-1600.jpg", tipo="article", ld=ld)

# ------------------------------------------------------------------ rubriche
def rubrica(rid, rnome, rdesc):
    l = [a for a in articoli() if a["rubrica"] == rid]
    altre = "".join(f'<li><a href="/rubriche/{r[0]}"{" aria-current=\"page\"" if r[0] == rid else ""}>{e(r[1])}</a></li>' for r in C.RUBRICHE)
    corpo = f'''<section class="pag-testa"><p class="pt-sopra">Rubrica</p><h1>{e(rnome)}</h1><p>{e(rdesc)}</p><ul class="rub-tab">{altre}</ul></section>
<section class="elenco"><div class="griglia">{"".join(scheda(a) for a in l)}</div></section>'''
    pagina(f"rubriche/{rid}.html", f"{rnome} · AncheCasa Magazine", rdesc, corpo, attiva="rubriche")

# ------------------------------------------------------------------ app gratuite
def app_gratuite():
    blocchi = "".join(f'''<section class="app-scheda" id="{x["id"]}">
  <div class="as-testo"><p class="app-stato">{e(x["stato"])}</p><h2>{e(x["nome"])}</h2><p>{e(x["cosa"])}</p>
  <ul>{"".join(f"<li>{e(p)}</li>" for p in x["punti"])}</ul>
  <a class="tasto" href="{x["link"]}">{e(x["tasto"])}</a><p class="as-nota">{e(x["nota"])}</p></div>
  <div class="as-foto">{foto({"check-bollette": "bolletta.jpg", "supermastro": "stretta-mano.jpg", "raccolta": "rifiuti-casa.jpg"}[x["id"]], x["nome"], sizes="(min-width: 900px) 40vw, 100vw")}</div>
</section>''' for x in C.APP)
    corpo = f'''<section class="pag-testa"><h1>App gratuite, per sempre</h1>
<p>Le app di AncheCasa Magazine si usano e si scaricano gratis, oggi e domani. Non chiedono abbonamenti e non mostrano pubblicità. Servono a una cosa sola: risolvere un problema di casa in pochi minuti.</p></section>
{blocchi}
<section class="studio" aria-labelledby="st-t"><div class="studio-in">
<h2 id="st-t">Fatte da AncheStudio</h2>
<p>AncheStudio è la società di sviluppo software di AncheCasa. Ha realizzato tutti i programmi della piattaforma: la piazza di anchecasa.it, l’area privata di cittadini e imprese, gli strumenti della rivista. Per questo le app sono gratuite: fanno parte del servizio, non sono un prodotto da vendere.</p>
<ul class="studio-p"><li><b>Gratis per sempre.</b> Niente versioni a pagamento, niente funzioni bloccate.</li><li><b>I tuoi dati restano tuoi.</b> Check Bollette fa i conti sul tuo telefono: i numeri della bolletta non vengono inviati.</li><li><b>Sempre aggiornate.</b> Prezzi di riferimento e regole si aggiornano quando cambiano.</li></ul>
</div></section>'''
    pagina("app-gratuite.html", "App gratuite per la casa · AncheCasa Magazine",
           "Check Bollette, SuperMastro e l’app della raccolta differenziata: strumenti gratuiti per sempre, sviluppati da AncheStudio per AncheCasa.", corpo, attiva="app")

# ------------------------------------------------------------------ archivio
def numeri():
    li = ""
    for N in C.NUMERI:
        if N["copertina"]:
            li += f'<li class="nu"><a href="{N["sfoglia"]}">{foto(N["copertina"], "Copertina del numero " + str(N["n"]), cls="cop", sizes="(min-width: 900px) 25vw, 60vw")}</a><p class="nu-n">Numero {N["n"]} · {e(N["data"])}</p><p>{e(N["strillo"])}</p><a class="tasto" href="{N["sfoglia"]}">Sfoglia</a></li>'
        else:
            li += f'<li class="nu nu-arrivo"><div class="nu-vuota"><span>N.{N["n"]}</span></div><p class="nu-n">Numero {N["n"]} · {e(N["data"])}</p><p>{e(N["strillo"])}</p><a class="tasto tasto-vuoto" href="#iscriviti">Avvisami</a></li>'
    corpo = f'''<section class="pag-testa"><h1>Archivio dei numeri</h1><p>Un numero ogni quindici giorni, dal 1° novembre 2026. Tutti gratuiti e sfogliabili come una rivista vera.</p></section>
<section class="elenco"><ul class="numeri-l">{li}</ul></section>'''
    pagina("numeri.html", "Archivio dei numeri · AncheCasa Magazine", "Tutti i numeri di AncheCasa Magazine, gratuiti e sfogliabili.", corpo, attiva="numeri")

# ------------------------------------------------------------------ chi siamo
def chi_siamo():
    corpo = '''<section class="pag-testa"><h1>Chi siamo</h1><p>AncheCasa Magazine è la rivista gratuita di AncheCasa per chi vive e rinnova casa.</p></section>
<div class="art-corpo chi">
<h2>Cosa facciamo</h2>
<p>Spieghiamo la casa in modo semplice: bonus e detrazioni, bollette, lavori, pratiche, manutenzione. Ogni articolo porta la data dell’ultimo controllo e le fonti accanto ai numeri. Quando una regola cambia, aggiorniamo l’articolo.</p>
<h2>Per chi scriviamo</h2>
<p>Per i cittadini: proprietari, inquilini, famiglie. Non scriviamo per le imprese e non le promuoviamo.</p>
<h2>Indipendenza</h2>
<p>Nella rivista nessuna impresa paga per comparire: non ci sono pubblicità, marchi sponsorizzati o articoli a pagamento. AncheCasa è anche la piazza dove privati e imprese si incontrano: per questo, quando ti serve qualcuno che faccia il lavoro, ti rimandiamo lì, dove scegli tu tra più imprese della tua zona. Lo diciamo apertamente, perché la fiducia comincia sapendo chi ti parla.</p>
<h2>Le app</h2>
<p>Gli strumenti della rivista sono sviluppati da AncheStudio, la società di software di AncheCasa, che ha realizzato anche tutti i programmi della piattaforma. Sono gratuiti per sempre.</p>
<h2>Editore e contatti</h2>
<p>Palumbo Investment S.r.l.<br>Per segnalazioni e domande alla redazione: <a href="mailto:info@anchecasa.it">info@anchecasa.it</a>.</p>
</div>'''
    pagina("chi-siamo.html", "Chi siamo · AncheCasa Magazine", "Chi fa AncheCasa Magazine, per chi scrive e perché nessuna impresa paga per comparire.", corpo, attiva="chi")

def check_bollette():
    corpo = '''<section class="pag-testa"><p class="pt-sopra">Strumento gratuito, per sempre</p><h1>Check Bollette</h1>
<p>Scopri in un minuto se paghi troppo luce o gas. Ti servono tre numeri della bolletta. I conti si fanno sul tuo telefono: i tuoi dati non vengono inviati a nessuno.</p></section>
<section class="cb" id="cb" data-persone="3" aria-label="Check Bollette">
  <div id="cb-dati" class="cb-carta">
    <div class="cb-tipo" role="group" aria-label="Tipo di bolletta"><button type="button" data-tipo="luce" aria-pressed="true">Luce</button><button type="button" data-tipo="gas" aria-pressed="false">Gas</button></div>
    <label class="cb-q" for="cb-importo"><span class="cb-n">1</span><span class="cb-d"><b>Quanto hai pagato?</b><small>Il totale, in prima pagina</small></span><span class="cb-in"><input id="cb-importo" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00"><span>€</span></span></label>
    <label class="cb-q" for="cb-consumo"><span class="cb-n">2</span><span class="cb-d"><b>Quanto hai consumato?</b><small>Nel riquadro «Consumi»</small></span><span class="cb-in"><input id="cb-consumo" type="text" inputmode="decimal" autocomplete="off" placeholder="0"><span id="cb-unit">kWh</span></span></label>
    <label class="cb-q" for="cb-mesi"><span class="cb-n">3</span><span class="cb-d"><b>Di quanti mesi è?</b><small>Lo dice il periodo in alto</small></span><span class="cb-in"><select id="cb-mesi"><option value="1">1 mese</option><option value="2" selected>2 mesi</option><option value="3">3 mesi</option><option value="6">6 mesi</option><option value="12">12 mesi</option></select></span></label>
    <p class="cb-msg" id="cb-msg" role="status" aria-live="polite"></p>
    <button type="button" class="tasto cb-go" id="cb-go">Analizza la mia bolletta</button>
  </div>
  <div id="cb-res" class="cb-carta" hidden>
    <div id="cb-out" aria-live="polite"></div>
    <div class="cb-azioni"><button type="button" class="tasto" id="cb-pdf">Scarica il report PDF</button><a class="tasto tasto-vuoto" href="https://www.ilportaleofferte.it/" rel="noopener">Confronta le offerte</a></div>
    <button type="button" class="cb-edit" id="cb-edit">Cambia i dati</button>
  </div>
  <p class="cb-fonte">Prezzi di riferimento: luce, ARERA, tutela vulnerabili dal 1° ottobre 2026, tasse incluse; gas, stima Unione Nazionale Consumatori su dati ARERA, ottobre 2026. Stima indicativa, non è una consulenza. Per capire ogni voce leggi <a href="/articoli/la-bolletta-smontata">La bolletta, smontata</a>.</p>
</section>'''
    pagina("check-bollette.html", "Check Bollette: paghi troppo luce o gas? · AncheCasa Magazine",
           "Scopri gratis in un minuto se paghi troppo luce o gas, quanto puoi risparmiare e scarica il report PDF. I tuoi dati restano sul tuo telefono.",
           corpo, attiva="app", script='<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>\n<script src="/js/check-bollette.js?v=1" defer></script>')

def non_trovata():
    corpo = '<section class="pag-testa"><h1>Questa pagina non c’è</h1><p>Forse l’articolo ha cambiato indirizzo. Torna alla <a href="/">copertina</a> o sfoglia le <a href="/rubriche/bonus">rubriche</a>.</p></section>'
    pagina("404.html", "Pagina non trovata · AncheCasa Magazine", "Pagina non trovata.", corpo)

def mappa():
    urls = ["/", "/check-bollette", "/app-gratuite", "/numeri", "/chi-siamo"] + [f"/rubriche/{r[0]}" for r in C.RUBRICHE] + [link_art(a) for a in articoli()]
    x = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
        f"  <url><loc>{SITO}{u}</loc><lastmod>{C.AGGIORNATO}</lastmod></url>\n" for u in urls) + "</urlset>\n"
    open(os.path.join(QUI, "sitemap.xml"), "w", encoding="utf-8").write(x)
    open(os.path.join(QUI, "robots.txt"), "w", encoding="utf-8").write(f"User-agent: *\nAllow: /\nSitemap: {SITO}/sitemap.xml\n")

if __name__ == "__main__":
    immagini()
    home()
    for a in C.ARTICOLI: articolo(a)
    for r in C.RUBRICHE: rubrica(*r)
    app_gratuite(); check_bollette(); numeri(); chi_siamo(); non_trovata(); mappa()
    print("Fatto:", len(C.ARTICOLI), "articoli,", len(C.RUBRICHE), "rubriche.")
