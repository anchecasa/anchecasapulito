"""AncheFarma · genera le pagine interne e il negozio (16.10.2026).
Si lancia dalla cartella principale: python scripts/genera-anchefarma.py
Legge testata e piede da sito/farma.html e scrive in sito/:
  farma-<persona>.html (4), farma-valore-<valore>.html (6), farma-negozio.html, js/farma-prodotti.js
"""
import io, json, os, re

QUI = os.path.dirname(os.path.abspath(__file__))
SITO = os.path.join(QUI, "..", "sito")
def r(p): return io.open(os.path.join(SITO, p), encoding="utf-8").read()
def w(p, t): io.open(os.path.join(SITO, p), "w", encoding="utf-8", newline="").write(t)

BASE = r("farma.html")
TESTA = BASE[:BASE.index("<style>")]
PIEDE = BASE[BASE.index('<footer class="piede">'):BASE.index("<script")]
V = "3"

def pagina(nome, titolo, desc, corpo, script=""):
    t = TESTA
    t = re.sub(r"<title>.*?</title>", f"<title>{titolo}</title>", t, 1)
    t = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{desc}">', t, 1)
    t = t.replace('<link rel="stylesheet" href="css/cerca-casa.css?v=3">\n', "")
    if "css/farma.css" not in t:
        t = t.replace("</head>", f'<link rel="stylesheet" href="css/farma.css?v={V}">\n</head>')
    t = t.replace('<body data-page="farma">', f'<body data-page="farma-{nome}">')
    w(nome + ".html", t + corpo + "\n" + PIEDE + '<script src="js/ac.js?v=8"></script>\n<script src="js/comuni.js?v=2"></script>\n' + script + "</body>\n</html>\n")

# ---------------- Icone e marchi dei valori ----------------
ICO = {
 "affidabilita": '<path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
 "alleanza": '<path d="M7 11l3-3 3 2 3-3 4 4-5 6-3 1-4-2-4-3z"/><path d="M10 14l2 2"/>',
 "protezione": '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><path d="M12 15v2"/>',
 "innovazione": '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
 "accessibilita": '<circle cx="12" cy="4.5" r="2"/><path d="M12 7v6M7 9h10M10 13l-2 8M14 13l2 8"/>',
 "sostenibilita": '<path d="M5 19c0-8 6-14 15-14-1 9-6 15-14 15"/><path d="M5 19l7-7"/>',
}
def badge(k, nome, chiaro=False):
    """Marchio rotondo del valore: anello con il nome, icona arancio al centro."""
    fondo, anello = ("#ffffff", "#16304D") if chiaro else ("#16304D", "#ffffff")
    testo = f"{nome.upper()} · ANCHEFARMA · "
    return (f'<svg class="af-badge" viewBox="0 0 120 120" role="img" aria-label="{nome}">'
            f'<defs><path id="giro-{k}" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0"/></defs>'
            f'<circle cx="60" cy="60" r="58" fill="{fondo}"/><circle cx="60" cy="60" r="33" fill="{anello}" opacity=".08"/>'
            f'<text fill="{anello}" font-size="11" font-weight="700" letter-spacing="1"><textPath href="#giro-{k}" textLength="270" lengthAdjust="spacingAndGlyphs">{testo}</textPath></text>'
            f'<circle cx="60" cy="60" r="31" fill="#E56B10"/>'
            f'<g transform="translate(42 42) scale(1.5)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{ICO[k]}</g></svg>')

VALORI = [
 ("affidabilita", "Affidabilità", "Consegne puntuali, assistenza continua.",
  "Quando ordini un farmaco o un dispositivo, non vuoi sorprese. AncheFarma ti dice prima quando arriva, chi lo porta e chi risponde se qualcosa non va.",
  [("Fascia oraria garantita", "Scegli tu quando ricevere l'ordine. Se cambia qualcosa, ti avvisiamo prima, non dopo."),
   ("Ordine tracciato", "Dalla farmacia alla tua porta segui ogni passaggio dal telefono."),
   ("Assistenza che risponde", "Un referente AncheCasa in chat, prima e dopo la consegna.")]),
 ("alleanza", "Alleanza", "Onestà e trasparenza con farmacie e clienti.",
  "AncheFarma non sostituisce la farmacia di quartiere: lavora con lei. Prezzi chiari, regole scritte e nessun costo nascosto, per chi vende e per chi compra.",
  [("Prezzi della farmacia", "Paghi quello che pagheresti al banco, più la consegna, scritta prima di confermare."),
   ("Contratti chiari", "Le farmacie aderenti sanno cosa pagano e cosa ricevono, senza vincoli lunghi."),
   ("Recensioni vere", "Solo chi ha ricevuto un ordine può lasciare un giudizio.")]),
 ("protezione", "Protezione", "Farmacisti, corrieri e privacy, tutelati.",
  "La salute è un dato delicato. Per questo AncheFarma raccoglie solo quello che serve per consegnare e lascia alla farmacia il consiglio e la responsabilità del farmaco.",
  [("Niente dati sanitari", "AncheFarma non salva diagnosi né terapie: l'ordine resta tra te e la farmacia."),
   ("Corrieri tutelati", "Lavoro regolare, compensi equi e percorsi di quartiere, senza corse a cottimo."),
   ("Farmacisti al centro", "Il consiglio lo dà sempre un professionista, in farmacia o in chat.")]),
 ("innovazione", "Innovazione", "Il digitale, senza forzare un settore delicato.",
  "Un'app semplice per ordinare, una chat con il farmacista e un'area privata con ordini e documenti. Tecnologia che serve alle persone, non il contrario.",
  [("Un'app sola", "Negozio, ordini, chat e profilo nello stesso posto, anche da computer."),
   ("Strumenti per la farmacia", "Le farmacie ricevono gli ordini in un pannello, già pronti da preparare."),
   ("Passo dopo passo", "Prima i prodotti senza ricetta, poi, con il fornitore nazionale, anche quelli con ricetta.")]),
 ("accessibilita", "Accessibilità", "Comodità per tutti, necessità per molti.",
  "Per chi ha problemi di salute o di movimento, per chi assiste un genitore anziano, per chi lavora tutto il giorno: la farmacia arriva a casa.",
  [("Pensata per tutti", "Caratteri grandi, pochi passaggi, un numero da chiamare se il telefono non basta."),
   ("Ordini per un familiare", "Puoi ordinare per i tuoi genitori e far consegnare a casa loro."),
   ("In tutta Italia", "Cresciamo città per città, fino al 70% delle farmacie con il fornitore nazionale.")]),
 ("sostenibilita", "Sostenibilità", "Consegne di quartiere, valore per la città.",
  "Ordinare dalla farmacia sotto casa significa tragitti brevi, meno imballaggi e lavoro che resta nel quartiere.",
  [("Tragitti brevi", "Consegna dalla farmacia più vicina, con mezzi leggeri dove si può."),
   ("Meno imballaggi", "Sacchetti di carta e niente scatoloni inutili."),
   ("Lavoro locale", "Corrieri e farmacie della tua città: il valore resta lì.")]),
]

PERSONE = [
 ("farmacie", "Le farmacie", "Aderenti, città per città",
  "La tua farmacia, online con AncheFarma.",
  "Porta la tua farmacia nelle case del quartiere senza costruire un e-commerce da zero. AncheFarma ti porta gli ordini, i corrieri e l'assistenza: tu resti la farmacia di fiducia.",
  [("Ordini già pronti", "Ricevi l'ordine con l'elenco dei prodotti e la fascia oraria di consegna."), ("Corriere che passa", "Un corriere AncheCasa ritira in farmacia e consegna."), ("Il tuo nome in vetrina", "Il cliente sceglie te, e lo vede in ogni passaggio.")],
  [("0 €", "per entrare: si paga solo sugli ordini consegnati"), ("70%", "delle farmacie italiane, a breve, con il fornitore nazionale"), ("1 app", "per ordini, consegne e chat con i clienti")],
  "Sei una farmacia? Candidati", "Una farmacia"),
 ("farmacisti", "I farmacisti", "Consiglio e professionalità",
  "Il consiglio resta quello del farmacista.",
  "Con AncheFarma il farmacista risponde ai clienti anche in chat: chiarisce dubbi su un prodotto da banco, consiglia un dispositivo, ricorda le avvertenze. Il negozio online non toglie nulla al banco.",
  [("Chat con i clienti", "Domande e risposte in un posto solo, collegate all'ordine."), ("Controllo dell'ordine", "Prima della consegna il farmacista verifica quantità e avvertenze."), ("Formazione", "Brevi guide su come usare il pannello AncheFarma.")],
  [("2", "confezioni al massimo per farmaco senza ricetta, come prevede la regola del negozio"), ("100%", "degli ordini controllati in farmacia"), ("0", "dati sanitari salvati da AncheFarma")],
  "Sei un farmacista? Scrivici", "Un farmacista"),
 ("corrieri", "I corrieri", "Della tua città",
  "Consegne di quartiere, lavoro vero.",
  "I corrieri AncheFarma sono della tua città. Ritirano in farmacia e consegnano nella fascia oraria scelta, con il sacchetto sigillato e la firma alla consegna.",
  [("Percorsi brevi", "Consegne vicine, organizzate per zona."), ("Compensi chiari", "Sai prima quanto guadagni per ogni consegna."), ("Mezzi leggeri", "Bici, scooter elettrico o a piedi, dove si può.")],
  [("2 ore", "la fascia oraria di consegna scelta dal cliente"), ("1", "sacchetto sigillato dalla farmacia"), ("0", "corse a cottimo")],
  "Vuoi consegnare con noi? Candidati", "Un corriere"),
 ("assistenza", "L'assistenza", "AncheCasa, che risponde",
  "Dietro ogni ordine c'è qualcuno che risponde.",
  "L'assistenza AncheCasa segue l'ordine dalla farmacia a casa tua. Se la consegna tarda, se manca un prodotto o se hai bisogno di aiuto con l'app, scrivi in chat e ti risponde una persona.",
  [("Chat e telefono", "Scrivi in chat o chiedi di essere richiamato."), ("Ordini per i familiari", "Ti aiutiamo a ordinare per un genitore anziano."), ("Resi e problemi", "Se qualcosa non va, lo risolviamo con la farmacia.")],
  [("7 giorni", "su 7, l'assistenza in chat"), ("1", "referente per ogni ordine"), ("Tutta Italia", "città per città, con AncheCasa")],
  "Hai una domanda? Scrivici", "Altro (candidatura spontanea)"),
]

def form_contatto(sei, titolo):
    opzioni = "".join(f"<option{' selected' if o == sei else ''}>{o}</option>" for o in ["Una farmacia", "Un farmacista", "Un corriere", "Un cliente", "Altro (candidatura spontanea)"])
    return f'''<section class="sez blu" id="modulo"><div class="wrap duo">
  <div><p class="kicker">AncheFarma · a breve</p><h2>{titolo}</h2><p style="color:rgba(255,255,255,.82);margin-top:14px">Lascia i tuoi dati: ti scriviamo noi, senza impegno.</p></div>
  <div class="pannello"><form class="modulo" data-invia="azienda|anchefarma-candidatura" data-ok="Grazie, abbiamo ricevuto la tua richiesta. Ti scriviamo noi.">
    <div class="due"><label>Nome e cognome<input required type="text" autocomplete="name"></label><label>Mail<input required type="email" autocomplete="email"></label></div>
    <div class="due"><label>Telefono<input type="tel" autocomplete="tel"></label><label>Città<input required type="text" data-comuni></label></div>
    <label>Sei<select>{opzioni}</select></label>
    <label>Messaggio<textarea></textarea></label>
    <label class="spunta"><input required type="checkbox">Ho letto l'<a href="privacy.html" style="text-decoration:underline">informativa privacy</a>.</label>
    <button class="btn" type="submit">Invia</button></form></div>
</div></section>'''

for i, (k, nome, sotto, h1, lead, passi, numeri, cta, sei) in enumerate(PERSONE):
    altri = "".join(f'<a href="farma-{p[0]}.html"><img src="img/farma/foto/{p[0]}.jpg" alt="" loading="lazy"><b>{p[1]}</b></a>' for p in PERSONE if p[0] != k)
    corpo = f'''<main id="contenuto">
<section class="hero">
  <img src="img/farma/foto/{k}.jpg" alt="{nome} di AncheFarma">
  <div class="wrap">
    <p class="kicker"><a href="farma.html" style="text-decoration:underline">AncheFarma</a> · Le persone dietro AncheFarma</p>
    <h1>{nome}<br><span class="acc">{sotto.lower()}</span></h1>
    <p class="lead">{h1}</p>
    <div class="btns" style="margin-top:22px"><a class="btn" href="#modulo">{cta}</a><a class="btn chiaro" href="farma-negozio.html">Vai al negozio</a></div>
  </div>
</section>
<section class="sez"><div class="wrap af-intro">
  <div><p class="kicker">{nome}</p><h2>{h1}</h2><p>{lead}</p></div>
  <img src="img/farma/foto/{k}-2.jpg" alt="" loading="lazy">
</div></section>
<section class="sez carta"><div class="wrap">
  <div class="testa"><div><h2>Come funziona</h2><p>Tre cose da sapere.</p></div></div>
  <div class="passi">{"".join(f'<div class="passo"><div><h3>{a}</h3><p>{b}</p></div></div>' for a, b in passi)}</div>
</div></section>
<section class="sez"><div class="wrap">
  <div class="af-numeri">{"".join(f'<div><b>{a}</b><span>{b}</span></div>' for a, b in numeri)}</div>
</div></section>
{form_contatto(sei, cta)}
<section class="sez carta"><div class="wrap">
  <div class="testa"><div><h2>Le altre persone dietro AncheFarma</h2></div><a class="btn linea" href="farma.html">Torna ad AncheFarma</a></div>
  <div class="af-altri" style="grid-template-columns:repeat(3,1fr)">{altri}</div>
</div></section>
</main>'''
    pagina(f"farma-{k}", f"{nome} · AncheFarma · AncheCasa", f"{nome} di AncheFarma: {h1}", corpo)

SECONDA = {"affidabilita": "corrieri", "alleanza": "farmacie-2", "protezione": "farmacisti-2", "innovazione": "assistenza-2", "accessibilita": "assistenza", "sostenibilita": "farmacie"}
for k, nome, motto, intro, impegni in VALORI:
    altri = "".join(f'<a href="farma-valore-{v[0]}.html">{badge(v[0], v[1], True)}<b>{v[1]}</b></a>' for v in VALORI if v[0] != k)
    corpo = f'''<main id="contenuto">
<section class="hero">
  <img src="img/farma/foto/{k}.jpg" alt="">
  <div class="wrap">
    <div class="af-hero-badge">{badge(k, nome)}</div>
    <p class="kicker"><a href="farma.html#valori" style="text-decoration:underline">AncheFarma</a> · I valori in cui crediamo</p>
    <h1>{nome}</h1>
    <p class="lead">{motto}</p>
  </div>
</section>
<section class="sez"><div class="wrap af-intro">
  <div><p class="kicker">Cosa significa per noi</p><h2>{motto}</h2><p>{intro}</p>
    <div class="btns" style="margin-top:22px"><a class="btn" href="farma-negozio.html">Vai al negozio</a><a class="btn linea" href="farma.html#avvisami">Avvisami</a></div></div>
  <img src="img/farma/foto/{SECONDA[k]}.jpg" alt="" loading="lazy">
</div></section>
<section class="sez carta"><div class="wrap">
  <div class="testa"><div><h2>I nostri impegni</h2><p>Cose concrete, scritte.</p></div></div>
  <div class="af-impegni">{"".join(f'<div><h3>{a}</h3><p>{b}</p></div>' for a, b in impegni)}</div>
</div></section>
<section class="sez"><div class="wrap">
  <div class="testa"><div><h2>Gli altri valori</h2></div><a class="btn linea" href="farma.html#valori">Torna ad AncheFarma</a></div>
  <div class="af-altri">{altri}</div>
</div></section>
</main>'''
    pagina(f"farma-valore-{k}", f"{nome} · I valori di AncheFarma", f"{nome}: {motto}", corpo)

# ---------------- Negozio ----------------
AVV_F = "È un medicinale. Leggere attentamente il foglio illustrativo. Può avere effetti indesiderati anche gravi. Se i sintomi persistono consultare il medico."
AVV_D = "Dispositivo medico CE. Leggere le istruzioni per l'uso."
AVV_I = "Gli integratori non vanno intesi come sostituti di una dieta variata ed equilibrata e di uno stile di vita sano. Non superare la dose giornaliera consigliata. Tenere fuori dalla portata dei bambini al di sotto dei tre anni."
P = [
 # id, reparto, nome, breve, prezzo, max, formato, indicazioni, uso, avvertenze
 ("paracetamolo-500", "Farmaci senza ricetta", "Paracetamolo 500 mg · 20 compresse", "Febbre e dolori lievi.", 3.9, 2, "Scatola da 20 compresse da 500 mg", "Trattamento sintomatico di febbre e dolori di lieve o moderata entità.", "Seguire dosi e intervalli del foglio illustrativo. Non assumere con altri medicinali che contengono paracetamolo.", AVV_F),
 ("ibuprofene-200", "Farmaci senza ricetta", "Ibuprofene 200 mg · 12 compresse", "Mal di testa, dolori muscolari e articolari.", 4.9, 2, "Scatola da 12 compresse rivestite", "Dolori di varia natura e stati febbrili.", "A stomaco pieno, secondo il foglio illustrativo.", AVV_F + " Non usare in caso di ulcera o in gravidanza senza parere del medico."),
 ("cetirizina-10", "Farmaci senza ricetta", "Cetirizina 10 mg · 7 compresse", "Antistaminico per riniti e allergie.", 5.9, 2, "Scatola da 7 compresse rivestite", "Sintomi di rinite allergica e orticaria.", "Di norma una compressa al giorno, secondo il foglio illustrativo.", AVV_F + " Può causare sonnolenza: prudenza alla guida."),
 ("misuratore-pressione", "Dispositivi medici", "Misuratore di pressione da braccio", "Automatico, bracciale 22–42 cm.", 39.9, 3, "Misuratore, bracciale, custodia, 4 pile AA", "Misura di pressione e battito a casa.", "Da seduti, dopo 5 minuti di riposo, bracciale all'altezza del cuore.", AVV_D),
 ("saturimetro", "Dispositivi medici", "Saturimetro da dito", "Ossigeno nel sangue e battito.", 24.9, 3, "Pulsossimetro, laccetto, 2 pile AAA", "Misura di SpO2 e frequenza del polso.", "Inserire il dito, restare fermi e leggere il valore.", AVV_D + " Valori anomali vanno riferiti al medico."),
 ("termometro", "Dispositivi medici", "Termometro digitale", "Lettura in 10 secondi, punta flessibile.", 9.9, 5, "Termometro e custodia", "Temperatura orale, ascellare o rettale.", "Accendere, posizionare, attendere il segnale acustico.", AVV_D),
 ("fisiologica", "Dispositivi medici", "Soluzione fisiologica · 20 × 5 ml", "Lavaggi nasali e aerosol.", 5.5, 5, "20 flaconcini monodose richiudibili", "Lavaggi nasali, detersione, diluizione per aerosol.", "Una volta aperto, usare entro 24 ore.", AVV_D),
 ("cerotti", "Medicazione", "Cerotti assortiti · 40 pezzi", "Traspiranti, in quattro misure.", 4.5, 10, "40 cerotti in 4 misure", "Piccole ferite, tagli e abrasioni.", "Pelle pulita e asciutta; cambiare ogni giorno.", ""),
 ("garze-sterili", "Medicazione", "Garze sterili 10 × 10 cm · 25 pezzi", "In buste singole sterili.", 4.2, 10, "25 garze, 12 strati", "Medicazione e detersione di ferite.", "Aprire la busta solo al momento dell'uso.", ""),
 ("portapillole", "Ausili per la casa", "Portapillole settimanale", "7 giorni, 4 scomparti al giorno.", 6.9, 10, "7 giorni × 4 scomparti", "Organizzare le terapie della settimana.", "Preparare le dosi una volta alla settimana.", ""),
 ("calze-riposanti", "Ausili per la casa", "Calze riposanti a compressione graduata", "Gambe stanche e viaggi lunghi.", 14.9, 5, "Un paio, taglie S–XL, 70 denari", "Gambe stanche, molte ore in piedi.", "Indossare al mattino; per la taglia misurare la caviglia.", ""),
 ("gel-mani", "Igiene e cura", "Gel igienizzante mani 500 ml", "Con dosatore, a base alcolica.", 5.9, 10, "Flacone 500 ml", "Igiene delle mani senza acqua.", "Strofinare fino ad asciugatura. Infiammabile.", ""),
 ("crema-mani", "Igiene e cura", "Crema mani riparatrice 75 ml", "Per mani secche e screpolate.", 6.5, 10, "Tubo 75 ml, senza profumo", "Mani secche e arrossate.", "Più volte al giorno, dopo il lavaggio.", ""),
 ("whey-protein", "Integratori e palestra", "Proteine whey · vaniglia 900 g", "Proteine del siero del latte, 24 g per dose.", 29.9, 5, "Barattolo 900 g, circa 30 dosi, misurino incluso", "Supporto all'apporto proteico per chi fa sport.", "30 g in 250 ml di acqua o latte, dopo l'allenamento.", AVV_I + " Contiene latte."),
 ("creatina", "Integratori e palestra", "Creatina monoidrato 300 g", "Pura, in polvere, 3 g per dose.", 19.9, 5, "Barattolo 300 g, 100 dosi", "La creatina aumenta la prestazione fisica in serie successive di esercizi brevi di alta intensità.", "3 g al giorno in acqua o succo.", AVV_I),
 ("aminoacidi", "Integratori e palestra", "Aminoacidi ramificati BCAA 2:1:1 · 200 compresse", "Leucina, isoleucina, valina.", 17.9, 5, "Flacone da 200 compresse", "Integrazione di aminoacidi per chi si allena.", "4–6 compresse al giorno, prima o dopo l'allenamento.", AVV_I),
 ("barrette-proteiche", "Integratori e palestra", "Barrette proteiche cioccolato · 12 × 50 g", "20 g di proteine a barretta.", 22.9, 5, "Confezione da 12 barrette da 50 g", "Spuntino proteico prima o dopo lo sport.", "Una barretta come spuntino.", "Contiene latte e soia. Può contenere frutta a guscio."),
 ("magnesio-potassio", "Integratori e palestra", "Magnesio e potassio · 20 compresse effervescenti", "Contro stanchezza e affaticamento.", 8.9, 5, "Tubo da 20 compresse effervescenti, gusto arancia", "Magnesio e potassio per l'equilibrio elettrolitico, utili con il caldo e lo sport.", "Una compressa al giorno in un bicchiere d'acqua.", AVV_I),
 ("omega-3", "Integratori e palestra", "Omega 3 · 90 perle", "EPA e DHA da olio di pesce.", 12.9, 5, "Flacone da 90 perle", "EPA e DHA contribuiscono alla normale funzione cardiaca (con 250 mg al giorno).", "2 perle al giorno durante i pasti.", AVV_I + " Contiene pesce."),
 ("multivitaminico", "Integratori e palestra", "Multivitaminico e minerali · 60 compresse", "Vitamine e minerali per tutti i giorni.", 9.9, 5, "Flacone da 60 compresse", "Integrazione di vitamine e minerali.", "Una compressa al giorno con la colazione.", AVV_I),
 ("shaker", "Integratori e palestra", "Shaker per proteine 700 ml", "Con pallina miscelatrice, senza BPA.", 7.9, 5, "Shaker 700 ml con tappo a vite", "Per preparare proteine e bevande sportive.", "Lavare a mano prima del primo uso.", ""),
]
REPARTI = ["Farmaci senza ricetta", "Dispositivi medici", "Medicazione", "Ausili per la casa", "Igiene e cura", "Integratori e palestra"]
dati = [dict(id=a, rep=b, nome=c, breve=d, prezzo=e, max=f, formato=g, indicazioni=h, uso=i, avv=j, img=f"img/farma/prodotti/{a}.jpg") for a, b, c, d, e, f, g, h, i, j in P]
w("js/farma-prodotti.js", "/* AncheFarma · catalogo (generato da scripts/genera-anchefarma.py) */\nwindow.AF_REPARTI = " + json.dumps(REPARTI, ensure_ascii=False) + ";\nwindow.AF_PRODOTTI = " + json.dumps(dati, ensure_ascii=False, indent=0) + ";\nwindow.AF_SPEDIZIONE = 2.9; window.AF_GRATIS_DA = 29;\n")

corpo = f'''<main id="contenuto">
<section class="af-shop-hero"><div class="wrap">
  <div><p class="kicker" style="color:var(--arancio)">Il negozio AncheFarma · a breve</p><h1>Farmacia e palestra,<br>a casa tua.</h1>
    <p>Farmaci senza ricetta, dispositivi medici, parafarmacia e integratori per lo sport, ai prezzi della farmacia della tua zona.</p></div>
  <form class="af-cerca" role="search" onsubmit="return false"><input id="af-q" type="search" placeholder="Cerca un prodotto, es. proteine, termometro" aria-label="Cerca un prodotto"><button class="btn" type="button" id="af-q-btn">Cerca</button></form>
  <div class="af-garanzie" style="width:100%"><div><b>Consegna in giornata</b>2,90 €, gratis da 29 €</div><div><b>Il farmacista in chat</b>Ti consiglia prima di ordinare</div><div><b>Prezzi della farmacia</b>Nessun ricarico nascosto</div><div><b>Ritiro in farmacia</b>Se preferisci, passi tu</div></div>
</div></section>
<section class="sez"><div class="wrap">
  <div class="af-avviso"><strong>Il negozio apre a breve.</strong> Oggi puoi riempire il carrello e prenotare l'ordine: non paghi nulla, ti scriviamo quando AncheFarma consegna nella tua città. Per ora solo prodotti senza ricetta; presto anche i farmaci con ricetta, con il fornitore nazionale, nel 70% delle farmacie.</div>
  <div class="af-reparti" id="af-reparti" role="group" aria-label="Reparti"></div>
  <div class="af-barra"><span id="af-conta"></span><label>Ordina per <select id="af-ordina"><option value="">In evidenza</option><option value="su">Prezzo crescente</option><option value="giu">Prezzo decrescente</option><option value="nome">Nome</option></select></label></div>
  <div class="af-prodotti" id="af-prodotti"></div>
  <p class="af-nota" style="font-size:14px;color:var(--grigio);margin-top:26px">Immagini illustrative. I medicinali senza ricetta li vende e li consegna la farmacia aderente. Prima dell'apertura del negozio ogni farmacia aderente dovrà essere autorizzata alla vendita online dal Ministero della Salute e il logo ministeriale comparirà in questa pagina. Massimo 2 confezioni per medicinale. Per i medicinali fa fede il foglio illustrativo.</p>
</div></section>
</main>
<button class="af-carrello-btn" id="af-apri-carrello" type="button" aria-label="Apri il carrello"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h15l-2 8H8z"/><path d="M6 6L5 3H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>Carrello <span id="af-num">0</span></button>
<div id="af-velo" class="af-velo" hidden></div>
<aside id="af-carrello" class="af-pannello" hidden aria-label="Carrello"><header><h2 id="af-titolo-c">Il tuo carrello</h2><button class="af-chiudi" type="button" data-chiudi aria-label="Chiudi">×</button></header><div class="corpo-p" id="af-corpo-c"></div><footer id="af-piede-c"></footer></aside>
<div id="af-scheda" class="af-scheda" hidden></div>'''
pagina("farma-negozio", "Negozio AncheFarma · Farmacia e palestra a casa", "Il negozio AncheFarma, a breve: farmaci senza ricetta, dispositivi medici, parafarmacia e integratori per la palestra, consegnati dalla farmacia della tua zona.", corpo,
       f'<script src="js/farma-prodotti.js?v={V}"></script>\n<script src="js/farma-negozio.js?v={V}"></script>\n')

# ---------------- Pagina principale: blocchi aggiornati ----------------
VALORI_HTML = "\n".join(f'    <a class="af-valore" href="farma-valore-{k}.html"><span class="foto-v"><img src="img/farma/foto/{k}.jpg" alt="" loading="lazy">{badge(k, n)}</span><span class="t"><h3>{n}</h3><p>{m}</p><span class="vai">Scopri →</span></span></a>' for k, n, m, _, _ in VALORI)
PERSONE_HTML = "\n".join(f'    <a class="af-persona" href="farma-{k}.html"><span class="foto"><img src="img/farma/foto/{k}.jpg" alt="" loading="lazy"></span><b>{n}</b><small>{s}</small><span class="vai">Scopri →</span></a>' for k, n, s, *_ in PERSONE)
VETRINA = [d for d in dati if d["id"] in ("paracetamolo-500", "misuratore-pressione", "whey-protein", "omega-3")]
def euro(x): return f"{x:.2f}".replace(".", ",") + " €"
VETRINA_HTML = "\n".join(f'    <a class="af-prod" href="farma-negozio.html#{d["id"]}"><img src="{d["img"]}" alt="{d["nome"]}" loading="lazy"><span class="t"><span class="rep">{d["rep"]}</span><h3>{d["nome"]}</h3><span class="piede-p"><span class="af-prezzo">{euro(d["prezzo"])}</span><span class="af-agg">Vedi</span></span></span></a>' for d in VETRINA)
io.open(os.path.join(QUI, "anchefarma-blocchi.json"), "w", encoding="utf-8").write(json.dumps({"valori": VALORI_HTML, "persone": PERSONE_HTML, "vetrina": VETRINA_HTML}, ensure_ascii=False))
print("Pagine AncheFarma generate:", 4 + 6 + 1)
