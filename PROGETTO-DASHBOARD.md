# Progetto delle dashboard · AncheCasa

Documento di progetto deciso da Nando con Claude, a partire dal 12.10.2026.
Qui ci sono le decisioni: quali pulsanti vede ogni profilo, cosa fanno e con quale logica.
Si costruisce solo da qui. Supabase e la pubblicazione si toccano solo alla fine, quando la struttura convince e funziona in anteprima.

## Regole di lavoro

1. Si progetta un profilo alla volta: funzioni, cosa fanno, struttura, logica.
2. Si prova in anteprima sul computer (`?demo=`), senza pubblicare.
3. Solo con l'ok di Nando: Supabase, push su GitHub, pubblicazione.
4. Ordine: Admin, Privato, Rete, Aziende (impresa, artigiano, fornitore, luce e gas, agenzie…). L'app da telefono alla fine.
5. La dashboard del cliente Sicura (altro progetto) non si tocca.
6. **Dove vivono le dashboard** (confermato da Nando il 12.10.2026, regole fisse dell'11.10.2026): privati, aziende e fornitori usano l'**app su https://entra.anchecasa.it**, da computer, tablet e telefono. L'area privata (areaprivata.anchecasa.it) è per l'admin e la rete. Le anteprime dei profili fatte nell'area privata sono modelli: la dashboard vera di privati, aziende e fornitori si costruisce nell'app.

## Uguale per tutti i profili

- Niente colonna di icone a sinistra (tolta il 12.10.2026).
- In alto a destra: **Messaggi** (fumetto, non letti) e **Avvisi** (campanella, pannello «Da fare»). Gli avvisi si decidono per profilo.
- Menu a categorie (cartelle che si aprono).
- L'admin decide in «Pulsanti per profilo» cosa vede ogni profilo: Nascosto, Gratis, A pagamento.

## Admin (fatto in anteprima il 12.10.2026)

Home in cima. Categorie: Panoramica (Oggi, Appunti), Iscritti (Iscritti registrati, Iscrizioni dal sito, Richieste agenti, Clienti da affidare, Genera link), Rete commerciale (Segnalazioni, Lavori rete, Contratti, Sala strategia), Gare e appalti (Bandi, Terranova, Gare private), Tecnico (AncheBIM), Comunicazione (Magazine), Il mio lavoro (Task, File), Impostazioni piattaforma (Software, Pulsanti per profilo). Chat dal fumetto.

Da decidere: quali avvisi riceve l'admin.

## Privato (deciso il 12.10.2026)

Il privato porta il lavoro alle aziende. Oggi non paga niente. Più avanti potrà comprare app a pagamento.

### Pulsanti

| Categoria | Pulsante | Prezzo |
|---|---|---|
| La mia casa | Ho un guasto | Gratis |
| La mia casa | Trova artigiano o impresa | Gratis |
| La mia casa | Ristruttura con AncheCasa | Gratis |
| La mia casa | Il mio cantiere (solo con un cantiere aperto) | Gratis |
| Bacheca | Bacheca annunci | Gratis |
| Bacheca | Pubblica un annuncio | Gratis |
| Le mie cose | Le mie richieste | Gratis |
| Le mie cose | I miei annunci | Gratis |
| Risparmia | Check Bollette | Gratis |
| Risparmia | Offerte luce e gas | Gratis |
| Le mie app | App del Magazine | Gratis (più avanti anche app a pagamento, segno €) |
| Passaparola | Invita e guadagna credito | Gratis |

In cima vanno le categorie che il privato ha scelto quando si è iscritto (guasto, ristrutturo, vendo, cerco casa, cerco lavoro).

### Ho un guasto / Trova artigiano

- La richiesta va a **un artigiano**: il più vicino, libero, con le recensioni migliori.
- Se non accetta entro **15 minuti** (urgente) o **2 ore** (normale), passa da sola al secondo, poi al terzo. Se nessuno dei tre accetta, arriva negli Avvisi dell'admin e AncheCasa la gestisce.
- Funziona anche di notte e nei festivi.
- Il privato vede sempre a che punto è la richiesta.
- Chi non risponde spesso scende in classifica.
- **All'inizio, finché non ci sono artigiani iscritti in zona**, SuperMastro mostra l'elenco degli artigiani da Maps e il privato li chiama lui.

### Soldi dell'intervento

- L'artigiano paga l'abbonamento più **4,99 € a intervento**, quando lavora tramite l'app.
- Quando l'artigiano è iscritto, **anche il privato paga tramite l'app**.
- I 4,99 € scattano **a lavoro fatto**: l'artigiano preme «Lavoro fatto», il privato conferma con un tocco; senza risposta in 7 giorni vale come fatto.
- **Garanzia AncheCasa 30 giorni** solo con artigiani iscritti e lavori chiusi nell'app.

### Recensioni

Sistema interno di AncheCasa, da progettare. Regole di base: recensisce solo chi ha un lavoro confermato; l'artigiano può rispondere una volta.

### Ristruttura con AncheCasa

Richiesta del privato → sopralluogo di un agente con Sopralluogo Flash (foto e nota vocale → computo e stima) → preventivo → firma del contratto → si apre **Il mio cantiere**.

Il mio cantiere: avanzamento in percentuale con le foto di ogni settimana, SAL da pagare e pagati, documenti (contratto, permessi, certificazioni), chat con il responsabile del cantiere.

### Bacheca annunci

- Annunci di casa (vendo, affitto, cerco) e lavoro (offro, cerco).
- Bacheca pubblica: la vedono tutti; **per rispondere ci si iscrive**.
- Gli annunci **escono subito**, l'admin controlla dopo. Nessun pulsante «Segnala annuncio».
- Durata **60 giorni**, con avviso per rinnovare.
- Le agenzie immobiliari torneranno clienti: piano gratuito per pubblicare, poi a pagamento.

### Offerte luce e gas (e altre offerte)

Tutto dentro AncheCasa: il privato chiede, il fornitore iscritto risponde dalla sua dashboard. Vale per luce e gas e per le offerte di altri fornitori. Collegato a Check Bollette.

### Le mie app

Ogni 15 giorni esce il Magazine con un'app gratuita. Il privato la trova in «Le mie app» e **resta per sempre**. Check Bollette è la prima. Più avanti, app a pagamento sullo stesso scaffale.

### Invita e guadagna credito (proposta di Claude, cifre da confermare)

Credito AncheCasa nel profilo del privato.

| Il privato invita… | Il premio scatta quando… | Premio |
|---|---|---|
| un amico privato | l'amico firma una ristrutturazione con AncheCasa | 100 € di credito |
| un'impresa o un artigiano | l'azienda paga il primo mese | un mese di abbonamento in credito (14,90 € artigiano, 49 € impresa) |
| agenzia, fornitore, luce e gas | paga il primo mese | come sopra |
| un amico che si iscrive e basta | — | sblocca prima un'app del Magazine |

Si spende su Ristruttura con AncheCasa, sugli interventi pagati nell'app e sulle app a pagamento. Regole: si sblocca solo dopo l'incasso; niente premio con stesso telefono, mail o indirizzo; al massimo 500 € l'anno; scade dopo 12 mesi.

### Iscrizione e contatti

- Iscrizione con la **mail**: basta per guardare, bacheca, Check Bollette, app del Magazine.
- Si parla sempre in **chat dentro AncheCasa**; nessun numero visibile a sconosciuti.
- **Telefono verificato con WhatsApp** (niente SMS) solo per chi fa venire qualcuno a casa: Ho un guasto, Trova artigiano, Ristruttura. L'artigiano vede il numero solo dopo aver accettato.

## Rete, Aziende

Da progettare.
