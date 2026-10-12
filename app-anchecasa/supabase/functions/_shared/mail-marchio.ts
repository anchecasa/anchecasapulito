// Mail del marchio AncheCasa per le funzioni (12.10.2026). Stesso look della mail d'invito approvata da Nando
// (mail/invito/mail-invito.js, impagina): logo a sinistra e anchecasa.it, filo arancio, foto, etichetta, spunte,
// pulsante, riquadro blu con 3 passi, curva del marchio, piede blu con logo bianco. Immagini su https://anchecasa.it/assets/mail/.
// Usata da energia-avvisa e servizi-avvisa.

const SITO = "https://www.anchecasa.it";
const BASE = "https://anchecasa.it/assets/mail/";
const IMG = { logo: BASE + "logo.png", logoNegativo: BASE + "logo-negativo.png", curva: BASE + "curva.png", privato: BASE + "privato.jpg", azienda: BASE + "azienda.jpg", agente: BASE + "agente.jpg" };
const C = { navy: "#16304d", navy2: "#2c4a6e", arancio: "#E56B10", bottone: "#c45d0c", carta: "#eef2f7", testo: "#24384c", muto: "#66758a", chiaro: "#fff1e4", piede: "#d5deea", piccolo: "#9aafc4" };
const FONT = "'Manrope','Segoe UI',Arial,Helvetica,sans-serif";
const ASSISTENZA = "info@anchecasa.it";
const SOCIETA = "Palumbo Investment S.r.l. · Via Giusti 22, 81057 Teano (CE) · P.IVA 04724830619";

export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export type Avviso = {
  oggetto: string;          // testo semplice
  anteprima: string;        // testo semplice
  etichetta: string;        // già escapato
  titolo: string;           // già escapato
  intro: string;            // HTML già escapato
  punti: [string, string][];// HTML già escapato
  bottone: string;          // testo semplice
  link: string;             // URL
  chiusura: string;         // HTML già escapato
  passiTitolo: string;
  passi: [string, string, string];
  perche: string;           // HTML già escapato
  tu: boolean;              // true = tu (privato), false = Lei (azienda)
  foto: "privato" | "azienda" | "agente";
};

export function mailMarchio(t: Avviso): string {
  const link = esc(t.link);
  const punti = t.punti.map((p) =>
    '<tr><td width="44" valign="top" style="padding:10px 0"><div style="width:28px;height:28px;line-height:28px;border-radius:14px;background:' + C.chiaro + ";color:" + C.arancio + ";text-align:center;font-family:" + FONT + ';font-size:15px;font-weight:800">&#10003;</div></td>' +
    '<td valign="top" style="padding:10px 0;font-family:' + FONT + ";font-size:15px;line-height:22px;color:" + C.testo + '"><strong style="color:' + C.navy + '">' + p[0] + '</strong><br><span style="color:' + C.muto + '">' + p[1] + "</span></td></tr>").join("");
  const passi = t.passi.map((p, i) =>
    '<td width="33%" valign="top" style="padding:0 6px;font-family:' + FONT + ';text-align:center">' +
    '<div style="width:34px;height:34px;line-height:34px;margin:0 auto 8px;border-radius:17px;background:' + C.arancio + ';color:#ffffff;font-size:15px;font-weight:800">' + (i + 1) + "</div>" +
    '<div style="font-size:13px;line-height:18px;color:#ffffff">' + esc(p) + "</div></td>").join("");
  return '<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>' + esc(t.oggetto) + "</title></head>" +
    '<body style="margin:0;padding:0;background:' + C.carta + '">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">' + esc(t.anteprima) + "</div>" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + C.carta + '"><tr><td align="center" style="padding:28px 12px">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">' +
    '<tr><td style="padding:22px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:2px solid ' + C.arancio + '"><tr>' +
    '<td align="left" valign="middle" style="padding:0 0 16px"><a href="' + SITO + '" target="_blank"><img src="' + IMG.logo + '" width="190" height="49" alt="AncheCasa, Costruiamo fiducia" style="display:block;width:190px;height:auto;border:0;font-family:' + FONT + ';font-size:20px;font-weight:800;color:' + C.navy + '"></a></td>' +
    '<td align="right" valign="middle" style="padding:0 0 16px;font-family:' + FONT + ';font-size:14px;line-height:20px;font-weight:800"><a href="' + SITO + '" target="_blank" style="color:' + C.navy + ';text-decoration:none">anchecasa.it</a></td>' +
    "</tr></table></td></tr>" +
    '<tr><td style="padding:22px 0 0;font-size:0;line-height:0"><img src="' + IMG[t.foto] + '" width="600" height="300" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;background:' + C.navy2 + '"></td></tr>' +
    '<tr><td style="padding:30px 32px 6px;font-family:' + FONT + '">' +
    '<span style="display:inline-block;padding:5px 12px;border-radius:12px;background:' + C.chiaro + ";color:" + C.bottone + ';font-size:12px;font-weight:800;letter-spacing:.5px;text-transform:uppercase">' + t.etichetta + "</span>" +
    '<h1 style="margin:16px 0 12px;font-size:26px;line-height:33px;font-weight:800;color:' + C.navy + '">' + t.titolo + "</h1>" +
    '<p style="margin:0 0 10px;font-size:16px;line-height:25px;color:' + C.testo + '">' + t.intro + "</p>" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px">' + punti + "</table>" +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:4px auto 6px"><tr><td align="center" bgcolor="' + C.bottone + '" style="border-radius:26px">' +
    '<a href="' + link + '" target="_blank" style="display:inline-block;padding:15px 36px;font-family:' + FONT + ';font-size:17px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:26px">' + esc(t.bottone) + "</a></td></tr></table>" +
    '<p style="margin:10px 0 0;text-align:center;font-size:13px;line-height:20px;color:' + C.muto + '">' + t.chiusura + "</p>" +
    "</td></tr>" +
    '<tr><td style="padding:22px 26px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + C.navy2 + '" style="border-radius:14px"><tr><td style="padding:18px 10px 20px">' +
    '<div style="font-family:' + FONT + ';text-align:center;font-size:13px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:#ffd2ad;margin-bottom:14px">' + esc(t.passiTitolo) + "</div>" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' + passi + "</tr></table></td></tr></table></td></tr>" +
    '<tr><td style="padding:22px 32px 26px;font-family:' + FONT + '">' +
    '<p style="margin:0 0 16px;font-size:12px;line-height:18px;color:' + C.muto + '">' + (t.tu ? "Se il pulsante non funziona, clicca sul link qui sotto:" : "Se il pulsante non funziona, clicchi sul link qui sotto:") + '<br><a href="' + link + '" style="color:' + C.navy2 + ';word-break:break-all">' + link + "</a></p>" +
    '<p style="margin:0;font-size:15px;line-height:22px;color:' + C.testo + '">' + (t.tu ? "A presto," : "Cordiali saluti,") + '<br><strong style="color:' + C.navy + '">Il team AncheCasa</strong></p></td></tr>' +
    '<tr><td style="padding:0;font-size:0;line-height:0;background:#ffffff"><img src="' + IMG.curva + '" width="600" height="52" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>' +
    '<tr><td style="padding:6px 32px 24px;background:' + C.navy + ";font-family:" + FONT + ";font-size:13px;line-height:20px;color:" + C.piede + '">' +
    '<a href="' + SITO + '" target="_blank"><img src="' + IMG.logoNegativo + '" width="170" height="44" alt="AncheCasa, Costruiamo fiducia" style="display:block;width:170px;height:auto;border:0;margin:0 0 14px;font-family:' + FONT + ';font-size:18px;font-weight:800;color:#ffffff"></a>' +
    '<p style="margin:0 0 8px;color:#ffffff;font-weight:800">AncheCasa · Costruiamo fiducia · <a href="' + SITO + '" style="color:#ffffff;text-decoration:none">anchecasa.it</a></p>' +
    '<p style="margin:0 0 8px">' + (t.tu ? "Domande? Scrivi a " : "Domande? Scriva a ") + '<a href="mailto:' + ASSISTENZA + '" style="color:#ffffff">' + ASSISTENZA + "</a>" +
    ' · <a href="' + SITO + '/privacy" style="color:#ffffff">Privacy</a></p>' +
    '<p style="margin:0 0 12px;font-size:12px;line-height:18px">' + t.perche + "</p>" +
    '<p style="margin:0;font-size:11px;line-height:16px;color:' + C.piccolo + '">' + SOCIETA + "</p>" +
    "</td></tr></table></td></tr></table></body></html>";
}

// Le cinque mail del giro fornitori (luce e gas, telefono e internet, finanza e assicurazioni). Testi in chiaro, escapati qui.
export function mailGiro(evento: "richiesta-cliente" | "richiesta-fornitore" | "proposta" | "scelta" | "accordo", d: {
  categoria: string; link: string; nome?: string; regione?: string; cosa?: string; chi?: string; numero?: string; quanto?: string; su?: string; daRete?: boolean;
}): { oggetto: string; html: string } {
  const cat = esc(d.categoria), catMin = esc(d.categoria.toLowerCase());
  const nome = esc(String(d.nome || "").split(" ")[0]);
  const T: Record<string, Avviso> = {
    "richiesta-cliente": {
      oggetto: "AncheCasa · La tua richiesta: " + d.categoria.toLowerCase(), anteprima: "I fornitori AncheCasa stanno preparando le loro proposte.",
      etichetta: cat, titolo: "Abbiamo ricevuto la tua richiesta.",
      intro: (nome ? "Ciao " + nome + ", " : "") + (d.daRete ? "il tuo consulente AncheCasa ha chiesto per te le proposte dei fornitori di " : "i fornitori di ") + catMin + (d.daRete ? "." : " iscritti ad AncheCasa stanno preparando le loro proposte."),
      punti: [["Le confronti una accanto all'altra", "Prezzo, durata e condizioni di ogni fornitore, nella stessa pagina."], ["I tuoi contatti restano tuoi", "Solo il fornitore che scegli riceve nome, mail e telefono."]],
      bottone: "Vedi le proposte", link: d.link, chiusura: "Ti scriviamo di nuovo appena arriva una proposta.",
      passiTitolo: "Come funziona", passi: ["Arrivano le proposte", "Le confronti", "Scegli tu"],
      perche: "Ricevi questa mail perché hai chiesto proposte di " + catMin + " su AncheCasa.", tu: true, foto: "privato" },
    "richiesta-fornitore": {
      oggetto: "AncheCasa · Nuova richiesta: " + d.categoria.toLowerCase(), anteprima: "Un cliente chiede una proposta.",
      etichetta: "Nuova richiesta", titolo: "Un cliente chiede una proposta.",
      intro: "Un cliente" + (d.regione ? " in " + esc(d.regione) : "") + " chiede una proposta" + (d.cosa ? " (" + esc(d.cosa) + ")" : "") + ". Nella sua dashboard trova cosa gli serve e la zona.",
      punti: [["Il cliente resta anonimo", "Nome e contatti li riceve solo se sceglie la sua proposta."], ["Arriva a tutti i fornitori della categoria", "Conta la proposta migliore e la rapidità."]],
      bottone: "Apra le richieste", link: d.link, chiusura: "Per mandare proposte serve l'accordo con AncheCasa confermato.",
      passiTitolo: "Come funziona", passi: ["Apra la richiesta", "Mandi la proposta", "Il cliente sceglie"],
      perche: "Riceve questa mail perché è un fornitore AncheCasa di " + catMin + ".", tu: false, foto: "azienda" },
    proposta: {
      oggetto: "AncheCasa · Nuova proposta: " + d.categoria.toLowerCase(), anteprima: "Hai una nuova proposta da confrontare.",
      etichetta: cat, titolo: "Hai una nuova proposta.",
      intro: (nome ? "Ciao " + nome + ", " : "") + "<strong>" + esc(d.chi || "un fornitore AncheCasa") + "</strong> ti ha mandato la sua proposta.",
      punti: [["Confrontala con le altre", "Le trovi tutte nella stessa pagina, con prezzo e condizioni."]],
      bottone: "Confronta le proposte", link: d.link, chiusura: "Scegliere una proposta non è un contratto: il contratto te lo manda il fornitore.",
      passiTitolo: "Come funziona", passi: ["Apri le proposte", "Scegli", "Il fornitore ti contatta"],
      perche: "Ricevi questa mail perché hai chiesto proposte di " + catMin + " su AncheCasa.", tu: true, foto: "privato" },
    scelta: {
      oggetto: "AncheCasa · Il cliente ha scelto la sua proposta", anteprima: "Nella sua dashboard trova nome, mail e telefono del cliente.",
      etichetta: "Proposta scelta", titolo: "Il cliente ha scelto lei.",
      intro: "Il cliente ha accettato la proposta <strong>" + esc(d.numero || "") + "</strong>. Nella sua dashboard trova nome, mail e telefono.",
      punti: [["Lo contatti presto", "Gli mandi il contratto e, quando è attivo, segni «Contratto attivato»."]],
      bottone: "Apra i miei clienti", link: d.link, chiusura: "Il contratto attivato fa nascere la provvigione concordata con AncheCasa.",
      passiTitolo: "Da qui", passi: ["Contatti il cliente", "Mandi il contratto", "Segni attivato"],
      perche: "Riceve questa mail perché un cliente AncheCasa ha scelto la sua proposta.", tu: false, foto: "azienda" },
    accordo: {
      oggetto: "AncheCasa · Il suo accordo da confermare", anteprima: "La provvigione concordata con AncheCasa, da confermare.",
      etichetta: "Il suo accordo", titolo: "Il suo accordo con AncheCasa.",
      intro: "La provvigione concordata è <strong>" + esc(d.quanto || "") + "</strong> " + esc(d.su || "") + ".",
      punti: [["La confermi dalla dashboard", "Da quel momento può mandare le sue proposte ai clienti AncheCasa."], ["Se cambia, si conferma di nuovo", "Ogni modifica dell'accordo torna da lei per la conferma."]],
      bottone: "Legga e confermi", link: d.link, chiusura: "Per domande sull'accordo scriva a info@anchecasa.it.",
      passiTitolo: "Come fare", passi: ["Apra l'accordo", "Lo confermi", "Mandi le proposte"],
      perche: "Riceve questa mail perché è un fornitore AncheCasa.", tu: false, foto: "azienda" }
  };
  const t = T[evento];
  return { oggetto: t.oggetto, html: mailMarchio(t) };
}

// Le mail dei preventivi con la zona (materiali, noleggio, servizi per la casa, app-21). tu = cliente privato, altrimenti Lei.
export function mailPreventivi(evento: "richiesta-cliente" | "richiesta-fornitore" | "proposta" | "scelta", d: {
  categoria: string; link: string; tu?: boolean; nome?: string; dove?: string; cosa?: string; chi?: string; numero?: string; vicino?: string; daRete?: boolean;
}): { oggetto: string; html: string } {
  const cat = esc(d.categoria), catMin = esc(d.categoria.toLowerCase());
  const nome = esc(String(d.nome || "").split(" ")[0]);
  const tu = !!d.tu;
  const T: Record<string, Avviso> = {
    "richiesta-cliente": {
      oggetto: "AncheCasa · Richiesta di preventivo: " + d.categoria.toLowerCase(), anteprima: "I fornitori della zona stanno preparando i preventivi.",
      etichetta: cat, titolo: tu ? "Abbiamo ricevuto la tua richiesta." : "Abbiamo ricevuto la sua richiesta.",
      intro: (nome ? (tu ? "Ciao " : "Buongiorno ") + nome + ", " : "") + (d.daRete ? (tu ? "il tuo consulente AncheCasa ha chiesto per te" : "il suo consulente AncheCasa ha chiesto per lei") + " i preventivi dei fornitori della zona." : "i fornitori AncheCasa che coprono la zona" + (d.dove ? " di " + esc(d.dove) : "") + " stanno preparando i preventivi, partendo dal più vicino."),
      punti: [[tu ? "Li confronti nella stessa pagina" : "Li confronta nella stessa pagina", "Prezzo riga per riga, consegna, validità e distanza del fornitore."], [tu ? "I tuoi dati restano tuoi" : "I suoi dati restano suoi", "Nome, contatti e indirizzo li riceve solo il fornitore " + (tu ? "che scegli." : "che sceglie.")]],
      bottone: "Vedi i preventivi", link: d.link, chiusura: tu ? "Ti scriviamo di nuovo appena arriva un preventivo." : "Le scriviamo di nuovo appena arriva un preventivo.",
      passiTitolo: "Come funziona", passi: ["Arrivano i preventivi", tu ? "Li confronti" : "Li confronta", tu ? "Scegli tu" : "Sceglie lei"],
      perche: (tu ? "Ricevi" : "Riceve") + " questa mail per una richiesta di preventivo su AncheCasa (" + catMin + ").", tu, foto: tu ? "privato" : "azienda" },
    "richiesta-fornitore": {
      oggetto: "AncheCasa · Richiesta di preventivo nella sua zona", anteprima: "Un cliente della sua zona chiede un preventivo.",
      etichetta: d.vicino ? esc(d.vicino) : "Nella sua zona", titolo: "Un cliente chiede un preventivo.",
      intro: "Richiesta" + (d.dove ? " a <strong>" + esc(d.dove) + "</strong>" : "") + (d.cosa ? ": " + esc(d.cosa) : "") + ". Nella sua dashboard trova tutte le righe.",
      punti: [["Il cliente resta anonimo", "Nome, contatti e indirizzo li riceve solo se sceglie il suo preventivo."], ["Arriva ai fornitori che coprono la zona", "Il cliente vede anche quanto è vicino ogni fornitore."]],
      bottone: "Apra la richiesta", link: d.link, chiusura: "Ordine e pagamento li fate direttamente, fuori da AncheCasa.",
      passiTitolo: "Come funziona", passi: ["Apra la richiesta", "Mandi il preventivo", "Il cliente sceglie"],
      perche: "Riceve questa mail perché è un fornitore AncheCasa di " + catMin + " e copre questa zona.", tu: false, foto: "azienda" },
    proposta: {
      oggetto: "AncheCasa · Nuovo preventivo: " + d.categoria.toLowerCase(), anteprima: "È arrivato un nuovo preventivo da confrontare.",
      etichetta: cat, titolo: tu ? "Hai un nuovo preventivo." : "Ha un nuovo preventivo.",
      intro: (nome ? (tu ? "Ciao " : "Buongiorno ") + nome + ", " : "") + "<strong>" + esc(d.chi || "un fornitore AncheCasa") + "</strong> " + (tu ? "ti" : "le") + " ha mandato il suo preventivo.",
      punti: [[tu ? "Confrontalo con gli altri" : "Lo confronti con gli altri", "Li trova tutti nella stessa pagina, dal fornitore più vicino."]],
      bottone: "Confronta i preventivi", link: d.link, chiusura: "Scegliere un preventivo non è un ordine: l'ordine si fa direttamente con il fornitore.",
      passiTitolo: "Come funziona", passi: [tu ? "Apri i preventivi" : "Apra i preventivi", tu ? "Scegli" : "Scelga", "Il fornitore " + (tu ? "ti" : "la") + " contatta"],
      perche: (tu ? "Ricevi" : "Riceve") + " questa mail per una richiesta di preventivo su AncheCasa (" + catMin + ").", tu, foto: tu ? "privato" : "azienda" },
    scelta: {
      oggetto: "AncheCasa · Il cliente ha scelto il suo preventivo", anteprima: "Nella sua dashboard trova nome, contatti e indirizzo.",
      etichetta: "Preventivo scelto", titolo: "Il cliente ha scelto lei.",
      intro: "Il cliente ha accettato il preventivo <strong>" + esc(d.numero || "") + "</strong>. Nella sua dashboard trova nome, contatti e indirizzo.",
      punti: [["Lo contatti presto", "Confermate l'ordine e la consegna direttamente. A lavoro fatto lo segni chiuso."]],
      bottone: "Apra la dashboard", link: d.link, chiusura: "Ordine e pagamento sono tra lei e il cliente.",
      passiTitolo: "Da qui", passi: ["Contatti il cliente", "Confermate l'ordine", "Lo segni chiuso"],
      perche: "Riceve questa mail perché un cliente AncheCasa ha scelto il suo preventivo.", tu: false, foto: "azienda" }
  };
  const t = T[evento];
  return { oggetto: t.oggetto, html: mailMarchio(t) };
}

// Promemoria al cliente (3 giorni) e verifica del contratto (30 giorni), app-22. Funzione fornitori-promemoria.
export function mailPromemoria(d: { categoria: string; link: string; tu: boolean; nome?: string; quante: number; preventivi?: boolean }): { oggetto: string; html: string } {
  const tu = d.tu, nome = esc(String(d.nome || "").split(" ")[0]);
  const cosa = d.preventivi ? (d.quante === 1 ? "un preventivo" : d.quante + " preventivi") : (d.quante === 1 ? "una proposta" : d.quante + " proposte");
  return { oggetto: "AncheCasa · " + (tu ? "Hai " : "Ha ") + cosa.replace(/<[^>]+>/g, "") + " da guardare", html: mailMarchio({
    oggetto: "AncheCasa · " + (tu ? "Hai " : "Ha ") + cosa + " da guardare", anteprima: "La richiesta resta aperta 15 giorni.",
    etichetta: esc(d.categoria), titolo: (tu ? "Hai " : "Ha ") + esc(cosa) + " da guardare.",
    intro: (nome ? (tu ? "Ciao " : "Buongiorno ") + nome + ", per " : "Per ") + (tu ? "la tua richiesta" : "la sua richiesta") + " su AncheCasa: <strong>" + esc(cosa) + "</strong>. " + (tu ? "Confronta e scegli quella che ti convince di più." : "Confronti e scelga quella che la convince di più."),
    punti: [["La richiesta resta aperta 15 giorni", "Poi si chiude da sola e i fornitori non aspettano più una risposta."], [tu ? "Scegliere non ti impegna" : "Scegliere non la impegna", "Solo il fornitore scelto riceve i contatti e manda il contratto o l'ordine."]],
    bottone: d.preventivi ? "Confronta i preventivi" : "Confronta le proposte", link: d.link,
    chiusura: tu ? "Se non ti interessano più, puoi ignorare questa mail." : "Se non le interessano più, può ignorare questa mail.",
    passiTitolo: "Come funziona", passi: [tu ? "Apri la pagina" : "Apra la pagina", tu ? "Confronta" : "Confronti", tu ? "Scegli" : "Scelga"],
    perche: (tu ? "Ricevi" : "Riceve") + " questa mail per una richiesta fatta su AncheCasa.", tu, foto: tu ? "privato" : "azienda" }) };
}

export function mailVerifica(d: { categoria: string; link: string; nome?: string; azienda: string }): { oggetto: string; html: string } {
  const nome = esc(String(d.nome || "").split(" ")[0]);
  return { oggetto: "AncheCasa · Hai firmato con " + d.azienda + "?", html: mailMarchio({
    oggetto: "AncheCasa · Hai firmato con " + d.azienda + "?", anteprima: "Una domanda veloce, un clic.",
    etichetta: esc(d.categoria), titolo: "Hai firmato il contratto?",
    intro: (nome ? "Ciao " + nome + ", " : "") + "un mese fa hai scelto la proposta di <strong>" + esc(d.azienda) + "</strong> su AncheCasa. Ci dici se hai firmato il contratto?",
    punti: [["Un clic", "Il pulsante apre una pagina con Sì e No."], ["Ci aiuta a tenere bravi i fornitori", "Sapere com'è andata ci serve per controllare che ogni fornitore AncheCasa faccia quello che promette."]],
    bottone: "Rispondi", link: d.link, chiusura: "Grazie: ci vogliono 5 secondi.",
    passiTitolo: "Come funziona", passi: ["Apri il pulsante", "Sì o No", "Fatto"],
    perche: "Ricevi questa mail perché hai scelto una proposta su AncheCasa.", tu: true, foto: "privato" }) };
}

// Le mail dei guasti (Ho un guasto / Trova artigiano, app-23).
export function mailGuasti(evento: "offerta" | "ricevuta" | "accettato" | "fatto" | "admin" | "garanzia", d: {
  link: string; nome?: string; mestiere?: string; comune?: string; urgente?: boolean; artigiano?: string; importo?: number | null; descrizione?: string; nota?: string;
}): { oggetto: string; html: string } {
  const nome = esc(String(d.nome || "").split(" ")[0]);
  const mest = esc(d.mestiere || ""), dove = esc(d.comune || "");
  const eur = (n: number | null | undefined) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const T: Record<string, Avviso> = {
    offerta: {
      oggetto: (d.urgente ? "URGENTE · " : "") + "AncheCasa · Nuova richiesta: " + (d.mestiere || "") + " a " + (d.comune || ""), anteprima: d.urgente ? "Hai 15 minuti per accettare." : "Hai 2 ore per accettare.",
      etichetta: d.urgente ? "Urgente" : "Nuova richiesta", titolo: d.urgente ? "Hai 15 minuti per accettare." : "Hai 2 ore per accettare.",
      intro: "Un cliente a <strong>" + dove + "</strong> cerca un artigiano (" + mest + ")" + (d.descrizione ? ": «" + esc(d.descrizione).slice(0, 160) + "»" : "") + ". La richiesta è arrivata solo a lei.",
      punti: [["Se non risponde in tempo passa al prossimo", "Chi non risponde spesso scende in classifica."], ["Contatti dopo «Accetto»", "Nome, telefono e indirizzo del cliente li trova subito dopo."]],
      bottone: "Apra la richiesta", link: d.link, chiusura: "Se non può, prema «Non posso»: la richiesta passa subito al prossimo.",
      passiTitolo: "Come funziona", passi: ["Apra la richiesta", "Accetti", "Chiami il cliente"],
      perche: "Riceve questa mail perché è un artigiano AncheCasa libero in questa zona.", tu: false, foto: "azienda" },
    ricevuta: {
      oggetto: "AncheCasa · Cerchiamo il tuo artigiano", anteprima: "Ti scriviamo appena un artigiano accetta.",
      etichetta: "Ho un guasto", titolo: "Cerchiamo il tuo artigiano.",
      intro: (nome ? "Ciao " + nome + ", " : "") + "abbiamo ricevuto la tua richiesta (" + mest + ", " + dove + "). La mandiamo all'artigiano più vicino e libero: " + (d.urgente ? "ha 15 minuti per accettare" : "ha 2 ore per accettare") + ", poi passa al prossimo.",
      punti: [["Il tuo numero è protetto", "Lo vede solo l'artigiano che accetta."], ["Garanzia AncheCasa 30 giorni", "Sui lavori confermati nell'app."]],
      bottone: "Segui la richiesta", link: d.link, chiusura: "Se nessuno può, ti contatta AncheCasa.",
      passiTitolo: "Come funziona", passi: ["Un artigiano accetta", "Ti chiama", "Conferma il lavoro fatto"],
      perche: "Ricevi questa mail perché hai chiesto un intervento su AncheCasa.", tu: true, foto: "privato" },
    accettato: {
      oggetto: "AncheCasa · " + (d.artigiano || "Un artigiano") + " ha accettato", anteprima: "Ti chiama a breve.",
      etichetta: "Ho un guasto", titolo: "Un artigiano ha accettato.",
      intro: (nome ? "Ciao " + nome + ", " : "") + "<strong>" + esc(d.artigiano || "un artigiano AncheCasa") + "</strong> ha accettato la tua richiesta (" + mest + ") e ti chiama a breve.",
      punti: [["Quando ha finito", "Ti arriva una mail per confermare il lavoro con un tocco."], ["Garanzia AncheCasa 30 giorni", "Parte quando confermi il lavoro."]],
      bottone: "Segui la richiesta", link: d.link, chiusura: "Se non ti chiama entro poco, scrivi a info@anchecasa.it.",
      passiTitolo: "Da qui", passi: ["Ti chiama", "Fa il lavoro", "Confermi"],
      perche: "Ricevi questa mail perché hai chiesto un intervento su AncheCasa.", tu: true, foto: "privato" },
    fatto: {
      oggetto: "AncheCasa · Confermi il lavoro?", anteprima: "Un tocco per confermare, e parte la garanzia.",
      etichetta: "Lavoro fatto", titolo: "Il lavoro è finito?",
      intro: (nome ? "Ciao " + nome + ", " : "") + "<strong>" + esc(d.artigiano || "l'artigiano") + "</strong> ha segnato il lavoro come fatto" + (d.importo ? " (" + eur(d.importo) + ")" : "") + ". Confermalo con un tocco: parte la garanzia AncheCasa di 30 giorni e puoi lasciare la recensione.",
      punti: [["Se qualcosa non va", "Scrivi a info@anchecasa.it prima di confermare."], ["Dopo 7 giorni", "Il lavoro vale come confermato."]],
      bottone: "Conferma il lavoro", link: d.link, chiusura: "La recensione aiuta gli altri a scegliere.",
      passiTitolo: "Da qui", passi: ["Conferma", "Lascia la recensione", "Garanzia 30 giorni"],
      perche: "Ricevi questa mail perché hai chiesto un intervento su AncheCasa.", tu: true, foto: "privato" },
    admin: {
      oggetto: (d.urgente ? "URGENTE · " : "") + "AncheCasa · Nessun artigiano ha accettato", anteprima: "Il guasto va gestito a mano.",
      etichetta: "Da gestire", titolo: "Nessun artigiano ha accettato.",
      intro: "Richiesta " + mest + " a <strong>" + dove + "</strong>" + (d.descrizione ? ": «" + esc(d.descrizione).slice(0, 160) + "»" : "") + ". Nessun artigiano disponibile ha accettato. Il cliente aspetta.",
      punti: [["Chiama il cliente", "I contatti sono nella pagina Aziende."]],
      bottone: "Apri Aziende", link: d.link, chiusura: "",
      passiTitolo: "Da fare", passi: ["Apri Aziende", "Chiama il cliente", "Trova un artigiano"],
      perche: "Mail di servizio di AncheCasa.", tu: true, foto: "azienda" },
    garanzia: {
      oggetto: "AncheCasa · Richiesta di garanzia", anteprima: "Il cliente chiede la garanzia sul lavoro.",
      etichetta: "Garanzia", titolo: "Il cliente chiede la garanzia.",
      intro: "Per il lavoro (" + mest + ", " + dove + ") il cliente scrive: «" + esc(d.nota || "") + "». Lo contatti per sistemare: è coperto dalla garanzia AncheCasa di 30 giorni.",
      punti: [["Contatti del cliente", "Li trova nella pagina Garanzia della sua dashboard."]],
      bottone: "Apra Garanzia", link: d.link, chiusura: "AncheCasa segue la richiesta.",
      passiTitolo: "Da fare", passi: ["Apra Garanzia", "Chiami il cliente", "Sistemi il lavoro"],
      perche: "Riceve questa mail perché un lavoro fatto con AncheCasa è in garanzia.", tu: false, foto: "azienda" }
  };
  const t = T[evento];
  return { oggetto: t.oggetto, html: mailMarchio(t) };
}

// Imprese e ristrutturazioni (app-24): AncheCasa general contractor. Funzione preventivi-avvisa, eventi «imprese» e «guasti».
export function mailImprese(evento: "ristrutturazione" | "sopralluogo" | "commessa" | "risposta" | "subappalto" | "subappalto-risposta" | "lavori-admin", d: {
  link: string; nome?: string; comune?: string; descrizione?: string; titolo?: string; importo?: number | null; accetta?: boolean; chi?: string; lavorazione?: string; nota?: string;
}): { oggetto: string; html: string } {
  const dove = esc(d.comune || ""), desc = d.descrizione ? "«" + esc(d.descrizione).slice(0, 180) + "»" : "";
  const eur = (n: number | null | undefined) => (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const T: Record<string, Avviso> = {
    ristrutturazione: {
      oggetto: "AncheCasa · Nuova richiesta di ristrutturazione" + (d.comune ? " a " + d.comune : ""), anteprima: "Manda un agente per il sopralluogo.",
      etichetta: "Ristrutturazione", titolo: "Nuova richiesta di ristrutturazione.",
      intro: "<strong>" + esc(d.nome || "Un cliente") + "</strong>" + (dove ? " a <strong>" + dove + "</strong>" : "") + " chiede una ristrutturazione" + (desc ? ": " + desc : "") + ".",
      punti: [["Contatti nella pagina Ristrutturazioni", "Assegna un agente per il sopralluogo, poi il preventivo."]],
      bottone: "Apri Ristrutturazioni", link: d.link, chiusura: "",
      passiTitolo: "Da fare", passi: ["Assegna l'agente", "Preventivo e firma", "Scegli l'impresa"],
      perche: "Mail di servizio di AncheCasa.", tu: true, foto: "privato" },
    sopralluogo: {
      oggetto: "AncheCasa · Sopralluogo da fare" + (d.comune ? " a " + d.comune : ""), anteprima: "Ti è stato assegnato un sopralluogo.",
      etichetta: "Sopralluogo", titolo: "Ti è stato assegnato un sopralluogo.",
      intro: "Cliente <strong>" + esc(d.nome || "") + "</strong>" + (dove ? " a <strong>" + dove + "</strong>" : "") + (desc ? ": " + desc : "") + ". Contatti e indirizzo nella tua dashboard.",
      punti: [["Dopo il sopralluogo", "Scrivi com'è andata e premi «Fatto»: AncheCasa prepara il preventivo."]],
      bottone: "Apri i sopralluoghi", link: d.link, chiusura: "",
      passiTitolo: "Da fare", passi: ["Chiama il cliente", "Fai il sopralluogo", "Scrivi la nota"],
      perche: "Ricevi questa mail perché sei nella rete AncheCasa.", tu: true, foto: "agente" },
    commessa: {
      oggetto: "AncheCasa · Un lavoro per la sua impresa" + (d.comune ? " a " + d.comune : ""), anteprima: "AncheCasa le propone un lavoro.",
      etichetta: "Lavoro AncheCasa", titolo: "AncheCasa le propone un lavoro.",
      intro: "<strong>" + esc(d.titolo || "Lavoro") + "</strong>" + (dove ? " a " + dove : "") + (d.importo ? ", importo per la sua impresa <strong>" + eur(d.importo) + "</strong>" : "") + ". Il cliente è di AncheCasa: lei lavora per AncheCasa.",
      punti: [["Risponda dalla dashboard", "«Accetto» o «Non posso», con una nota."], ["SAL e pagamenti", "Li segue AncheCasa, li trova nella pagina del cantiere."]],
      bottone: "Apra Lavori AncheCasa", link: d.link, chiusura: "",
      passiTitolo: "Come funziona", passi: ["Accetti", "Apra il cantiere", "Aggiorni giornale e foto"],
      perche: "Riceve questa mail perché è un'impresa verificata AncheCasa.", tu: false, foto: "azienda" },
    risposta: {
      oggetto: "AncheCasa · " + (d.chi || "L'impresa") + (d.accetta ? " ha accettato" : " non può") + ": " + (d.titolo || ""), anteprima: d.accetta ? "Il cantiere può partire." : "Scegli un'altra impresa.",
      etichetta: d.accetta ? "Accettato" : "Rifiutato", titolo: d.accetta ? "L'impresa ha accettato." : "L'impresa non può.",
      intro: "<strong>" + esc(d.chi || "") + "</strong> " + (d.accetta ? "ha accettato" : "non può fare") + " il lavoro <strong>" + esc(d.titolo || "") + "</strong>" + (d.nota ? ": «" + esc(d.nota) + "»" : "") + ".",
      punti: [[d.accetta ? "Prepara i SAL" : "Scegli un'altra impresa", "Dalla pagina Ristrutturazioni."]],
      bottone: "Apri Ristrutturazioni", link: d.link, chiusura: "",
      passiTitolo: "Da fare", passi: d.accetta ? ["SAL del cliente", "SAL dell'impresa", "Inizio lavori"] : ["Apri la pratica", "Scegli l'impresa", "Manda il lavoro"],
      perche: "Mail di servizio di AncheCasa.", tu: true, foto: "azienda" },
    subappalto: {
      oggetto: "AncheCasa · Richiesta di subappalto: " + (d.lavorazione || ""), anteprima: (d.chi || "Un'impresa") + " chiede la sua disponibilità.",
      etichetta: "Subappalto", titolo: "Un'impresa chiede la sua disponibilità.",
      intro: "<strong>" + esc(d.chi || "Un'impresa AncheCasa") + "</strong> cerca " + esc(d.lavorazione || "") + (dove ? " a <strong>" + dove + "</strong>" : "") + (desc ? ": " + desc : "") + ".",
      punti: [["Contatti dopo «Accetto»", "Mail e dati dell'impresa li vedete entrambi solo se accetta."]],
      bottone: "Apra Subappalti", link: d.link, chiusura: "Accordi e pagamenti sono tra voi.",
      passiTitolo: "Come funziona", passi: ["Apra la richiesta", "Accetti o no", "Vi sentite"],
      perche: "Riceve questa mail perché è un'azienda verificata AncheCasa in questa zona.", tu: false, foto: "azienda" },
    "subappalto-risposta": {
      oggetto: "AncheCasa · " + (d.chi || "") + (d.accetta ? " è disponibile" : " non è disponibile"), anteprima: d.accetta ? "Trova i contatti nella dashboard." : "Provi con un'altra azienda.",
      etichetta: "Subappalto", titolo: d.accetta ? "È disponibile." : "Non è disponibile.",
      intro: "<strong>" + esc(d.chi || "") + "</strong> " + (d.accetta ? "ha accettato" : "non può accettare") + " la richiesta (" + esc(d.lavorazione || "") + ")" + (d.nota ? ": «" + esc(d.nota) + "»" : "") + ".",
      punti: [[d.accetta ? "Contatti in Subappalti" : "Altre aziende della zona", d.accetta ? "Mail dell'azienda nella richiesta." : "Le trova in Subappalti, dal più vicino."]],
      bottone: "Apra Subappalti", link: d.link, chiusura: "",
      passiTitolo: "Da qui", passi: d.accetta ? ["Apra Subappalti", "Contatti l'azienda", "Fissate il lavoro"] : ["Apra Subappalti", "Cerchi", "Chieda a un'altra"],
      perche: "Riceve questa mail per una sua richiesta di subappalto su AncheCasa.", tu: false, foto: "azienda" },
    "lavori-admin": {
      oggetto: "AncheCasa · Piccoli lavori" + (d.comune ? " a " + d.comune : ""), anteprima: "Lasciala alle imprese o passala a un agente.",
      etichetta: "Piccoli lavori", titolo: "Nuova richiesta di lavori.",
      intro: "<strong>" + esc(d.nome || "Un cliente") + "</strong>" + (dove ? " a <strong>" + dove + "</strong>" : "") + (desc ? ": " + desc : "") + ". È andata alle imprese della zona (massimo 5).",
      punti: [["Se è una ristrutturazione", "Premi «Passa ad AncheCasa»: diventa una pratica e la affidi a un agente."]],
      bottone: "Apri Ristrutturazioni", link: d.link, chiusura: "",
      passiTitolo: "Da fare", passi: ["Leggi la richiesta", "Lasciala o passala", "Segui il cliente"],
      perche: "Mail di servizio di AncheCasa.", tu: true, foto: "azienda" }
  };
  const t = T[evento];
  return { oggetto: t.oggetto, html: mailMarchio(t) };
}
