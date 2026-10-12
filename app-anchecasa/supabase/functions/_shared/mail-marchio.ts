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
