// invia-invito-marketplace
// Spedisce davvero (via Resend) la mail di un invito di marketplace.inviti_admin, poi
// segna inviato_at. Solo l'admin può chiamarla (chi non è in marketplace.admins riceve 403).
// Deciso 29.09.2026 per sostituire il pulsante Email che apriva solo un mailto: — vedi
// CLAUDE.md, "RIPRESA: Inviti reali per l'Agente + login".
// ATTENZIONE: la funzione VIVE nel dashboard Supabase (Edge Functions → invia-invito-marketplace,
// "Via Editor"). 06.10.2026: tre mail d'invito, una per profilo (vedi blocco MAIL-INVITO). Questo file è la copia di riferimento: dopo ogni modifica va incollato lì e
// distribuito (Deploy), altrimenti i due restano diversi.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const RESEND_FROM = Deno.env.get("RESEND_FROM") || "AncheCasa <info@anchecasa.it>";
const LINK_ISCRIVITI = "https://areaprivata.anchecasa.it/benvenuto.html";

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json" },
  });
}

// Mail d'invito del marchio, una per profilo (privato, azienda, agente), approvate da Nando il 06.10.2026.
// Copia di viste/mail/nuove-invito/mail-invito.js: se si cambiano i testi lì, ricopiare qui il blocco
// da «MAIL-INVITO INIZIO» a «MAIL-INVITO FINE».
// MAIL-INVITO INIZIO
/* Mail d'invito AncheCasa (06.10.2026): una per profilo (privato, azienda, agente).
   Parla a chi la riceve: al privato e all'agente dà del tu, all'azienda dà del Lei.
   HTML per client di posta (tabelle, stili in linea, larghezza 600). Funziona nel browser,
   in Node (anteprime) e nella funzione Supabase invia-invito-marketplace (Deno).
   Uso: MailInvito.crea(famiglia, { link, invitante, categoria }) -> { oggetto, anteprima, html } */
(function (root) {
  const SITO = "https://www.anchecasa.it";
  const IMG = {
    logo: "https://anchecasa.it/assets/logo/anchecasa-payoff-mail.png",
    logoBianco: "https://anchecasa.it/assets/logo/anchecasa-payoff-bianco.png",
    privato: "https://areaprivata.anchecasa.it/sito/img/priv-offerta.jpg",
    azienda: "https://areaprivata.anchecasa.it/sito/img/az-team.jpg",
    agente: "https://areaprivata.anchecasa.it/img/ag-network.jpg"
  };
  const C = { navy: "#16304d", navy2: "#2c4a6e", arancio: "#E56B10", bottone: "#c45d0c", carta: "#eef2f7", testo: "#24384c", muto: "#66758a", linea: "#e4ebf3", chiaro: "#fff1e4" };
  const FONT = "'Manrope','Segoe UI',Arial,Helvetica,sans-serif";
  const ASSISTENZA = "info@anchecasa.it";
  const SCADENZA = "30 giorni";

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* Testi per profilo. inv = nome di chi invita (già escapato) o "", cat = categoria (già escapata) o "". */
  const TESTI = {
    privato: (inv) => ({
      tu: true,
      oggetto: inv ? inv + " ti invita su AncheCasa" : "Sei invitato su AncheCasa",
      anteprima: "Trova artigiani e imprese vicino a casa tua e parla con loro in chat. Iscriversi è gratis.",
      etichetta: "Invito per privati",
      titolo: "La tua casa, con le persone giuste.",
      intro: (inv ? "<strong>" + inv + "</strong> ti ha invitato su AncheCasa. " : "Sei stato invitato su AncheCasa. ") +
        "Qui trovi artigiani e imprese della tua zona, chiedi un preventivo e ne parli in chat, senza dare subito il tuo numero.",
      punti: [
        ["Trovi l'artigiano giusto, vicino a te", "Scrivi cosa ti serve: vedi prima i professionisti iscritti della tua città e gli scrivi in chat. A lavoro finito lasci la tua recensione."],
        ["Mostri il guasto con un video", "Lo filmi con il telefono: ti aiutiamo a capire cosa serve e a chi chiederlo."],
        ["Pubblichi gratis", "Una richiesta di lavoro o l'annuncio della tua casa: risposte e appuntamenti li trovi in «Richieste»."],
        ["Aste immobiliari con assistenza", "Vedi le case all'asta nella tua zona e, se una ti interessa, AncheCasa ti accompagna."]
      ],
      bottone: "Iscriviti gratis",
      passiTitolo: "Come si inizia",
      passi: ["Clicca il pulsante arancione", "Scegli la tua password", "Scrivi la tua città e cerca"],
      chiusura: "Il link è personale e vale " + SCADENZA + "."
    }),
    azienda: (inv, cat) => ({
      tu: false,
      oggetto: "La sua azienda è invitata su AncheCasa",
      anteprima: "Le richieste dei clienti della sua zona, per il suo mestiere, in un'unica piazza.",
      etichetta: "Invito per aziende",
      titolo: "Nuovi clienti nella sua zona.",
      intro: (inv ? "<strong>" + inv + "</strong> ha segnalato la sua azienda" : "La sua azienda è stata invitata") +
        (cat ? " come <strong>" + cat + "</strong>" : "") +
        " su AncheCasa, la piazza dove privati e aziende della casa e dell'edilizia si incontrano.",
      punti: [
        ["Richieste dei clienti nella sua zona", "Riceve le richieste dei privati per il suo mestiere, nella sua città e nelle regioni in cui lavora, e risponde in chat."],
        ["Prima nella ricerca", "Quando un cliente della zona cerca il suo mestiere, le aziende iscritte compaiono per prime; le recensioni dei lavori fatti fanno il resto."],
        ["Albo fornitori, gare e grandi lavori", "Dal suo profilo si candida all'albo fornitori, come fornitore o subappaltatore, nelle gare dei general contractor e nei grandi lavori privati, come la ristrutturazione di un condominio."],
        ["Profilo verificato, ufficio in ordine", "AncheCasa controlla i dati dell'azienda; preventivi, cantieri e documenti stanno in un solo posto."]
      ],
      bottone: "Iscriva la sua azienda",
      passiTitolo: "Come si inizia",
      passi: ["Clicchi il pulsante arancione", "Scelga la password", "Completi il profilo: partita IVA, mestiere e zone"],
      chiusura: "Il link è riservato alla sua azienda e vale " + SCADENZA + "."
    }),
    agente: (inv) => ({
      tu: true,
      oggetto: inv ? inv + " ti invita a diventare agente AncheCasa" : "Diventa agente AncheCasa",
      anteprima: "Porta privati e aziende su AncheCasa e segui la tua rete da un unico pannello.",
      etichetta: "Invito per agenti",
      titolo: "Costruisci la tua rete con AncheCasa.",
      intro: (inv ? "<strong>" + inv + "</strong> ti ha invitato a diventare agente AncheCasa. " : "Sei stato invitato a diventare agente AncheCasa. ") +
        "Porti privati e aziende nella piazza e segui la tua rete da un unico pannello.",
      punti: [
        ["Inviti con un link personale", "Lo mandi per mail a privati e aziende e vedi chi lo apre e chi si iscrive."],
        ["La tua rete in chiaro", "Vedi le persone che hai portato e chi hanno portato loro, livello per livello."],
        ["Guadagno tracciato", "Ogni iscrizione e ogni movimento della tua rete sono registrati, con report da scaricare."],
        ["Contratto e bacheca online", "Firmi il contratto online e segui i tuoi numeri da un'unica bacheca."]
      ],
      bottone: "Candidati come agente",
      passiTitolo: "Come funziona",
      passi: ["Clicca il pulsante arancione", "Invia la tua candidatura", "L'amministrazione la valuta e ti contatta"],
      chiusura: "Le candidature vengono valutate dall'amministrazione. Il link vale " + SCADENZA + "."
    })
  };

  function crea(famiglia, d) {
    d = d || {};
    const fam = TESTI[famiglia] ? famiglia : "privato";
    const t = TESTI[fam](esc(d.invitante || ""), esc(d.categoria || ""));
    const link = esc(d.link || SITO);
    const img = (d.immagini && d.immagini[fam]) || IMG[fam];
    const logo = (d.immagini && d.immagini.logo) || IMG.logo;
    const logoBianco = (d.immagini && d.immagini.logoBianco) || IMG.logoBianco;

    const punti = t.punti.map((p) =>
      '<tr><td width="44" valign="top" style="padding:10px 0"><div style="width:28px;height:28px;line-height:28px;border-radius:14px;background:' + C.arancio + ";color:#ffffff;text-align:center;font-family:" + FONT + ';font-size:15px;font-weight:800">&#10003;</div></td>' +
      '<td valign="top" style="padding:10px 0;font-family:' + FONT + ";font-size:15px;line-height:22px;color:" + C.testo + '"><strong style="color:' + C.navy + '">' + p[0] + '</strong><br><span style="color:' + C.muto + '">' + p[1] + "</span></td></tr>").join("");

    const passi = t.passi.map((p, i) =>
      '<td width="33%" valign="top" style="padding:0 6px;font-family:' + FONT + ';text-align:center">' +
      '<div style="width:34px;height:34px;line-height:34px;margin:0 auto 8px;border-radius:17px;background:' + C.arancio + ';color:#ffffff;font-size:15px;font-weight:800">' + (i + 1) + "</div>" +
      '<div style="font-size:13px;line-height:18px;color:#ffffff">' + p + "</div></td>").join("");

    const html =
      '<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>' + t.oggetto + "</title></head>" +
      '<body style="margin:0;padding:0;background:' + C.carta + '">' +
      '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">' + t.anteprima + "</div>" +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + C.carta + '"><tr><td align="center" style="padding:28px 12px">' +
      '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">' +
      '<tr><td style="padding:22px 28px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td align="left" valign="middle"><a href="' + SITO + '" target="_blank"><img src="' + logo + '" width="190" alt="AncheCasa, Costruiamo fiducia" style="display:block;width:190px;max-width:190px;height:auto;border:0"></a></td>' +
      '<td align="right" valign="middle" style="font-family:' + FONT + ';font-size:14px;line-height:20px"><a href="' + SITO + '" target="_blank" style="color:' + C.muto + ';text-decoration:none">anchecasa.it</a></td>' +
      "</tr></table></td></tr>" +
      // foto del profilo
      '<tr><td style="padding:0;font-size:0;line-height:0"><img src="' + img + '" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>' +
      // corpo
      '<tr><td style="padding:30px 32px 6px;font-family:' + FONT + '">' +
      '<span style="display:inline-block;padding:5px 12px;border-radius:12px;background:' + C.chiaro + ";color:" + C.bottone + ';font-size:12px;font-weight:800;letter-spacing:.5px;text-transform:uppercase">' + t.etichetta + "</span>" +
      '<h1 style="margin:16px 0 12px;font-size:26px;line-height:33px;font-weight:800;color:' + C.navy + '">' + t.titolo + "</h1>" +
      '<p style="margin:0 0 10px;font-size:16px;line-height:25px;color:' + C.testo + '">' + t.intro + "</p>" +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px">' + punti + "</table>" +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:4px auto 6px"><tr><td align="center" bgcolor="' + C.bottone + '" style="border-radius:26px">' +
      '<a href="' + link + '" target="_blank" style="display:inline-block;padding:15px 36px;font-family:' + FONT + ';font-size:17px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:26px">' + t.bottone + "</a></td></tr></table>" +
      '<p style="margin:10px 0 0;text-align:center;font-size:13px;line-height:20px;color:' + C.muto + '">' + t.chiusura + "</p>" +
      "</td></tr>" +
      // passi
      '<tr><td style="padding:22px 26px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + C.navy2 + '" style="border-radius:14px"><tr><td style="padding:18px 10px 20px">' +
      '<div style="font-family:' + FONT + ';text-align:center;font-size:13px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:#ffd2ad;margin-bottom:14px">' + t.passiTitolo + "</div>" +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' + passi + "</tr></table></td></tr></table></td></tr>" +
      // link di riserva e firma
      '<tr><td style="padding:22px 32px 26px;font-family:' + FONT + '">' +
      '<p style="margin:0 0 16px;font-size:12px;line-height:18px;color:' + C.muto + '">' + (t.tu ? "Se il pulsante non funziona, clicca sul link qui sotto:" : "Se il pulsante non funziona, clicchi sul link qui sotto:") + '<br><a href="' + link + '" style="color:' + C.navy2 + ';word-break:break-all">' + link + "</a></p>" +
      '<p style="margin:0;font-size:15px;line-height:22px;color:' + C.testo + '">' + (t.tu ? "A presto," : "Cordiali saluti,") + '<br><strong style="color:' + C.navy + '">Il team AncheCasa</strong></p></td></tr>' +
      '<tr><td style="padding:22px 28px 16px;background:' + C.navy + ";font-family:" + FONT + ';font-size:13px;line-height:20px;color:#d5deea">' +
      '<a href="' + SITO + '" target="_blank"><img src="' + logoBianco + '" width="170" alt="AncheCasa, Costruiamo fiducia" style="display:block;width:170px;max-width:70%;height:auto;border:0;margin:0 0 14px"></a>' +
      '<p style="margin:0 0 8px;color:#ffffff"><strong>AncheCasa</strong> · Costruiamo fiducia · <a href="' + SITO + '" style="color:#ffffff;text-decoration:none">anchecasa.it</a></p>' +
      "<p style=\"margin:0 0 8px\">" + (t.tu ? "Domande? Scrivi a " : "Domande? Scriva a ") + '<a href="mailto:' + ASSISTENZA + '" style="color:#ffffff;text-decoration:none">' + ASSISTENZA + "</a>" +
      ' · <a href="' + SITO + '/privacy" style="color:#ffffff;text-decoration:none">Privacy</a></p>' +
      '<p style="margin:0 0 12px">' + (fam === "azienda" ? "Riceve questa mail perché la sua azienda è stata invitata su AncheCasa. Se non le interessa, può ignorarla." : "Ricevi questa mail perché qualcuno ti ha invitato su AncheCasa. Se non ti interessa, puoi ignorarla.") + "</p>" +
      '<p style="margin:0;font-size:11px;line-height:16px;color:#9aafc4">Palumbo Investments S.r.l. · Via Giusti 22, 87057 Teano (CE) · P.IVA 04724810619</p>' +
      '</td></tr>' +
      '<tr><td style="height:6px;line-height:6px;font-size:0;background:' + C.arancio + '">&nbsp;</td></tr>' +
      "</table></td></tr></table></body></html>";

    return { oggetto: t.oggetto.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">"), anteprima: t.anteprima, html };
  }

  const API = { crea, famiglie: Object.keys(TESTI), IMG };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.MailInvito = API;
})(typeof window !== "undefined" ? window : globalThis);
// MAIL-INVITO FINE
// deno-lint-ignore no-explicit-any
const MailInvito = (globalThis as any).MailInvito;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Metodo non permesso." }, 405, origin);

  let token: string;
  try {
    const body = await req.json();
    token = String(body.token || "");
  } catch {
    return json({ error: "Corpo della richiesta non valido." }, 400, origin);
  }
  if (!token) return json({ error: "Manca il token dell'invito." }, 400, origin);

  const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  if (!jwt) return json({ error: "Manca il token di accesso." }, 401, origin);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "Sessione non valida." }, 401, origin);
  const uid = userData.user.id;

  const { data: invito, error: invitoErr } = await admin
    .schema("marketplace")
    .from("inviti_admin")
    .select("token, mail, famiglia, categoria, creato_da")
    .eq("token", token)
    .maybeSingle();
  if (invitoErr || !invito) return json({ error: "Invito non trovato." }, 404, origin);

  // Può spedire l'admin oppure chi ha creato l'invito (Privato, Azienda, Agente): mai gli inviti di altri.
  const { data: adminRow } = await admin
    .schema("marketplace")
    .from("admins")
    .select("id")
    .eq("id", uid)
    .maybeSingle();
  if (!adminRow && invito.creato_da !== uid) {
    return json({ error: "Puoi inviare solo i tuoi inviti." }, 403, origin);
  }
  if (!invito.mail) return json({ error: "Questo invito non ha una mail." }, 400, origin);

  // Se l'invito è di un utente (non dell'admin) la mail dice chi ti ha invitato.
  let invitante: string | null = null;
  if (invito.creato_da) {
    const { data: creatore } = await admin
      .schema("marketplace")
      .from("admins")
      .select("id")
      .eq("id", invito.creato_da)
      .maybeSingle();
    if (!creatore) {
      const { data: prof } = await admin
        .schema("marketplace")
        .from("profiles")
        .select("nome")
        .eq("id", invito.creato_da)
        .maybeSingle();
      invitante = prof?.nome || null;
    }
  }

  const url = `${LINK_ISCRIVITI}?invito=${invito.token}`;
  // La mail cambia secondo il profilo invitato: privato, azienda o agente.
  const mail = MailInvito.crea(invito.famiglia, { link: url, invitante: invitante || "", categoria: invito.categoria || "" });

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [invito.mail],
      subject: mail.oggetto,
      html: mail.html,
    }),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    return json({ error: "Resend ha rifiutato l'invio: " + errText }, 502, origin);
  }

  const now = new Date().toISOString();
  await admin
    .schema("marketplace")
    .from("inviti_admin")
    .update({ inviato_at: now })
    .eq("token", token);

  return json({ ok: true, inviato_at: now }, 200, origin);
});
