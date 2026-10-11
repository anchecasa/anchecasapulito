// Funzione Supabase «subappalti-mail» — app AncheCasa (11.10.2026).
// Manda per mail:
//   - «invita»: l'invito a fare un'offerta per una richiesta di subappalto (fornitori della rete o della zona);
//   - «reinvia»: di nuovo lo stesso invito (es. dopo un errore);
//   - «esito»: al fornitore, l'esito della sua offerta (approvata, non scelta, da rivedere).
// Chi può: l'ufficio della ditta (titolare/responsabile) o l'agente che ha fatto il sopralluogo (solo «invita»);
// «esito» solo chi decide le offerte (titolare o admin). I permessi li controlla il database con il token della persona.
// Non scrive mai a chi ha chiesto di non ricevere più mail (tabella app_mail_stop): ogni mail ha il link per smettere.
//
// Variabili (Supabase → Edge Functions → Secrets):
//   MAIL_PROVIDER = brevo | resend          MAIL_API_KEY = chiave del servizio di invio
//   MAIL_MITTENTE = es. «AncheCasa <ufficio@anchecasa.it>» (indirizzo verificato nel servizio)
//   APP_URL = indirizzo dell'app, es. https://entra.anchecasa.it (serve per i link nella mail)
//   PRIVACY_URL (consigliata) = informativa privacy per i fornitori
//   MAIL_AL_GIORNO (facoltativa, predefinita 100 inviti al giorno per ditta)
//   DIAGNOSI_ORIGINI (consigliata), AC_PUBLISHABLE_KEY / AC_SECRET_KEY solo con le chiavi nuove (come le altre funzioni)
// Senza MAIL_PROVIDER/MAIL_API_KEY gli inviti si salvano «da inviare» e la funzione risponde «mail_non_configurata».

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TITOLARE = "Palumbo Investments Srl (AncheCasa)";

function cors(origin: string | null): Record<string, string> {
  // Se DIAGNOSI_ORIGINI è vuota tutti i siti sono ammessi; se c'è, si aggiunge sempre l'app (entra.anchecasa.it o APP_URL).
  const base = (Deno.env.get("DIAGNOSI_ORIGINI") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const app = (Deno.env.get("APP_URL") || "https://entra.anchecasa.it").replace(/\/+$/, "");
  const ammessi = base.length ? [...base, app, "https://entra.anchecasa.it"] : [];
  const ok = !ammessi.length || (origin && ammessi.includes(origin));
  const h: Record<string, string> = { "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", Vary: "Origin" };
  if (ok) h["Access-Control-Allow-Origin"] = origin || "*";
  return h;
}
const rispondi = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(origin) } });

function chiave(tipo: "pubblica" | "segreta"): string {
  const daJson = (nome: string) => { try { const j = JSON.parse(Deno.env.get(nome) || "{}"); return String(j.default || Object.values(j)[0] || ""); } catch { return ""; } };
  if (tipo === "pubblica") return Deno.env.get("AC_PUBLISHABLE_KEY") || daJson("SUPABASE_PUBLISHABLE_KEYS") || Deno.env.get("SUPABASE_ANON_KEY") || "";
  return Deno.env.get("AC_SECRET_KEY") || daJson("SUPABASE_SECRET_KEYS") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}
const URL_SB = () => Deno.env.get("SUPABASE_URL") || "";
function servizio(extra: Record<string, string> = {}) {
  const k = chiave("segreta");
  const h: Record<string, string> = { apikey: k, "Content-Type": "application/json", "Accept-Profile": "marketplace", "Content-Profile": "marketplace", ...extra };
  if (!k.startsWith("sb_")) h.Authorization = `Bearer ${k}`;
  return h;
}
async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(`${URL_SB()}/rest/v1/${path}`, { ...init, headers: { ...servizio(), ...((init.headers as Record<string, string>) || {}) } });
  if (!r.ok) throw new Error(`${path.split("?")[0]} ${r.status} ${(await r.text()).slice(0, 200)}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
async function rpcPersona(token: string, nome: string, args: unknown) {
  const r = await fetch(`${URL_SB()}/rest/v1/rpc/${nome}`, {
    method: "POST", body: JSON.stringify(args),
    headers: { apikey: chiave("pubblica"), Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Accept-Profile": "marketplace", "Content-Profile": "marketplace" },
  });
  return r.ok ? r.json() : null;
}
async function chiEUtente(token: string): Promise<string | null> {
  if (!token || !URL_SB() || !chiave("pubblica")) return null;
  const u = await fetch(`${URL_SB()}/auth/v1/user`, { headers: { apikey: chiave("pubblica"), Authorization: `Bearer ${token}` } });
  if (!u.ok) return null;
  const j = await u.json().catch(() => ({}));
  return typeof j?.id === "string" ? j.id : null;
}

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const euro = (n: number) => Number(n).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
const data = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("it-IT");
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Pagamento = { descrizione: string; evento?: string; tipo: "perc" | "importo" | "saldo"; valore?: number | null };
const rigaPag = (p: Pagamento) => `${p.descrizione}${p.evento ? " – " + p.evento : ""}: ${p.tipo === "perc" ? p.valore + "% dell'importo" : p.tipo === "importo" ? euro(Number(p.valore)) + " (importo fisso)" : "saldo (il resto)"}`;

function mittente() {
  const m = (Deno.env.get("MAIL_MITTENTE") || "").trim();
  const x = m.match(/^(.*)<([^>]+)>$/);
  return x ? { nome: x[1].trim().replace(/^"|"$/g, ""), email: x[2].trim() } : { nome: "AncheCasa", email: m };
}
async function mandaMail(a: { email: string; nome: string; oggetto: string; html: string; testo: string; stop: string }): Promise<string | null> {
  const prov = (Deno.env.get("MAIL_PROVIDER") || "").toLowerCase(), key = Deno.env.get("MAIL_API_KEY") || "", da = mittente();
  if (!key || !da.email || !["brevo", "resend"].includes(prov)) return "mail_non_configurata";
  const intestazioni = { "List-Unsubscribe": `<${a.stop}>` };
  const r = prov === "brevo"
    ? await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST", headers: { "api-key": key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sender: { name: da.nome, email: da.email }, to: [{ email: a.email, name: a.nome || undefined }], subject: a.oggetto, htmlContent: a.html, textContent: a.testo, headers: intestazioni }),
      signal: AbortSignal.timeout(15000),
    })
    : await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `${da.nome} <${da.email}>`, to: [a.email], subject: a.oggetto, html: a.html, text: a.testo, headers: intestazioni }),
      signal: AbortSignal.timeout(15000),
    });
  if (r.ok) return null;
  return `invio ${r.status}: ${(await r.text()).slice(0, 200)}`;
}

function pagina(titolo: string, corpo: string, piede: string) {
  return `<!doctype html><html lang="it"><body style="margin:0;background:#eef2f7;font-family:'Segoe UI',Arial,sans-serif;color:#24384c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" style="width:100%;max-width:600px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="padding:22px 32px 0"><table width="100%" style="border-bottom:2px solid #E56B10"><tr>
<td><a href="https://www.anchecasa.it"><img src="https://anchecasa.it/assets/mail/logo.png" width="190" height="49" alt="AncheCasa"></a></td>
<td align="right" style="font-weight:800;color:#16304d">anchecasa.it</td></tr></table></td></tr>
<tr><td style="padding:0"><img src="https://anchecasa.it/assets/mail/azienda.jpg" width="600" height="300" alt="" style="display:block;width:100%;height:auto"></td></tr>
<tr><td style="padding:28px 32px"><h1 style="margin:0 0 12px;font-size:26px;color:#16304d">${titolo}</h1>${corpo}</td></tr>
<tr><td style="padding:0;font-size:0"><img src="https://anchecasa.it/assets/mail/curva.png" width="600" height="52" alt="" style="display:block;width:100%;height:auto"></td></tr>
<tr><td style="padding:16px 32px 24px;background:#16304d;color:#d5deea;font-size:13px;line-height:1.5">
<img src="https://anchecasa.it/assets/mail/logo-negativo.png" width="170" height="44" alt="AncheCasa"><br>
AncheCasa · Costruiamo fiducia · anchecasa.it<br>Palumbo Investment S.r.l. · Via Giusti 22, 81057 Teano (CE) · P.IVA 04724830619<br>${piede}</td></tr>
</table></td></tr></table></body></html>`;
}
const bottone = (url: string, t: string) => `<p style="margin:20px 0"><a href="${esc(url)}" style="display:inline-block;background:#E36A12;color:#fff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:12px">${esc(t)}</a></p>`;

function piedeMail(stop: string, motivo: string) {
  const priv = Deno.env.get("PRIVACY_URL") || "";
  return `${esc(motivo)} Titolare del trattamento: ${esc(TITOLARE)}.${priv ? ` <a href="${esc(priv)}" style="color:#66758A">Informativa privacy</a>.` : ""}<br>
Non vuoi più ricevere richieste? <a href="${esc(stop)}" style="color:#66758A">Clicca qui</a> e non ti scriveremo più.`;
}

async function invita(utente: string, token: string, body: Record<string, unknown>, origin: string | null) {
  const richiesta = String(body.richiesta || "");
  if (!/^[0-9a-f-]{36}$/.test(richiesta)) return rispondi({ error: "richiesta_mancante" }, 400, origin);
  if ((await rpcPersona(token, "app_sub_posso_invitare", { p_richiesta: richiesta })) !== true) return rispondi({ error: "non_autorizzato" }, 403, origin);
  const [r] = await rest(`app_sub_richieste?select=id,org,titolo,descrizione,voci,mestiere,comune,scadenza&id=eq.${richiesta}`);
  const [org] = await rest(`app_org?select=nome&id=eq.${r.org}`);

  const lista = (Array.isArray(body.destinatari) ? body.destinatari : []).slice(0, 30).map((d: Record<string, unknown>) => ({
    email: String(d.email || "").trim().toLowerCase().slice(0, 120), nome: String(d.nome || "").trim().slice(0, 80), ditta: String(d.ditta || "").trim().slice(0, 120),
    telefono: String(d.telefono || "").trim().slice(0, 30), origine: d.origine === "rete" ? "rete" : "territorio",
    rete_org: /^[0-9a-f-]{36}$/.test(String(d.rete_org || "")) ? String(d.rete_org) : null,
  })).filter((d) => EMAIL.test(d.email));
  if (!lista.length) return rispondi({ error: "nessun_destinatario" }, 400, origin);

  // Limite al giorno per ditta
  const ieri = new Date(Date.now() - 864e5).toISOString();
  const fatte = await rest(`app_sub_inviti?select=id,app_sub_richieste!inner(org)&app_sub_richieste.org=eq.${r.org}&inviata_il=gte.${encodeURIComponent(ieri)}&limit=1000`);
  const max = Math.max(1, Number(Deno.env.get("MAIL_AL_GIORNO")) || 100);
  if ((fatte || []).length + lista.length > max) return rispondi({ error: "troppe_mail_oggi" }, 429, origin);

  const stop: { email: string }[] = await rest(`app_mail_stop?select=email&email=in.(${lista.map((d) => `"${d.email}"`).join(",")})`);
  const bloccate = new Set((stop || []).map((s) => s.email));
  const nuovi = await rest("app_sub_inviti?on_conflict=richiesta,email", {
    method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify(lista.map((d) => ({ richiesta, ...d, invitato_da: utente, stato_mail: bloccate.has(d.email) ? "bloccata" : "da_inviare" }))),
  });
  const pagamenti: Pagamento[] = (await rest(`app_milestone?select=descrizione,evento,tipo,valore&richiesta=eq.${richiesta}&order=n`)) || [];
  const esito = { inviate: 0, gia_invitati: lista.length - (nuovi || []).length, bloccate: 0, errori: 0, non_configurata: false };
  for (const i of nuovi || []) {
    if (i.stato_mail === "bloccata") { esito.bloccate++; continue; }
    const e = await mandaInvito(i, r, org?.nome || "", pagamenti);
    if (e === "mail_non_configurata") esito.non_configurata = true; else if (e) esito.errori++; else esito.inviate++;
  }
  if (esito.non_configurata) return rispondi({ error: "mail_non_configurata", ...esito }, 503, origin);
  return rispondi({ ok: true, ...esito }, 200, origin);
}

async function mandaInvito(i: Record<string, string>, r: Record<string, unknown>, ditta: string, pagamenti: Pagamento[]): Promise<string | null> {
  const app = (Deno.env.get("APP_URL") || "").replace(/\/+$/, "");
  if (!app) return "mail_non_configurata";
  const link = `${app}/#/offerta/${i.token}`, stop = `${app}/#/offerta-stop/${i.token}`;
  const voci = (Array.isArray(r.voci) ? r.voci : []) as { descrizione: string; quantita: number; um: string }[];
  const motivo = i.origine === "rete"
    ? "Ricevi questa mail perché la tua azienda è iscritta alla rete AncheCasa."
    : "Ricevi questa mail perché un agente AncheCasa della tua zona ha indicato il tuo contatto professionale per questo lavoro.";
  const oggetto = `Richiesta di offerta: ${r.titolo}${r.comune ? " a " + r.comune : ""}`;
  const html = pagina(esc(oggetto), `
    <p>Buongiorno${i.nome ? " " + esc(i.nome) : ""},<br><b>${esc(ditta)}</b> cerca ${r.mestiere ? "un " + esc(r.mestiere) : "un'impresa"} per un lavoro vero, con AncheCasa.</p>
    <p style="background:#F4F6F9;border-radius:12px;padding:12px 14px;margin:14px 0"><b>${esc(r.titolo)}</b>${r.comune ? "<br>Comune: " + esc(r.comune) : ""}<br>Offerte entro il <b>${esc(data(String(r.scadenza)))}</b>
    ${r.descrizione ? "<br><br>" + esc(r.descrizione).replace(/\n/g, "<br>") : ""}</p>
    ${voci.length ? `<p style="margin:0 0 6px"><b>Lavorazioni</b></p><ul style="margin:0 0 14px;padding-left:18px">${voci.map((v) => `<li>${esc(v.descrizione)}${v.quantita ? ` · ${esc(v.quantita)} ${esc(v.um || "")}` : ""}</li>`).join("")}</ul>` : ""}
    ${pagamenti.length ? `<p style="margin:0 0 6px"><b>Come paga ${esc(ditta)}</b></p><ul style="margin:0 0 14px;padding-left:18px">${pagamenti.map((p) => `<li>${esc(rigaPag(p))}</li>`).join("")}</ul><p style="font-size:13px;color:#66758A">Puoi accettare questi pagamenti o proporne altri nell'offerta.</p>` : ""}
    ${bottone(link, "Vedi il lavoro e fai l'offerta")}
    <p style="font-size:13px;color:#66758A">Non serve registrarsi per rispondere. Se il link non si apre: ${esc(link)}</p>`, piedeMail(stop, motivo));
  const testo = `${oggetto}\n\n${ditta} cerca ${r.mestiere ? "un " + r.mestiere : "un'impresa"} per un lavoro con AncheCasa.\n${r.titolo}${r.comune ? " – " + r.comune : ""}\nOfferte entro il ${data(String(r.scadenza))}\n\n` +
    (pagamenti.length ? "Pagamenti:\n" + pagamenti.map((p) => "- " + rigaPag(p)).join("\n") + "\n\n" : "") +
    `Vedi il lavoro e fai l'offerta: ${link}\n\n${motivo} Titolare del trattamento: ${TITOLARE}.\nNon vuoi più ricevere richieste? ${stop}`;
  const e = await mandaMail({ email: i.email, nome: i.nome, oggetto, html, testo, stop });
  await rest(`app_sub_inviti?id=eq.${i.id}`, {
    method: "PATCH",
    body: JSON.stringify(e === "mail_non_configurata" ? { stato_mail: "da_inviare" } : e ? { stato_mail: "errore", mail_errore: e.slice(0, 300) } : { stato_mail: "inviata", inviata_il: new Date().toISOString(), mail_errore: "" }),
  });
  return e;
}

async function reinvia(token: string, body: Record<string, unknown>, origin: string | null) {
  const id = String(body.invito || "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return rispondi({ error: "invito_mancante" }, 400, origin);
  const [i] = await rest(`app_sub_inviti?select=*&id=eq.${id}`);
  if (!i) return rispondi({ error: "invito_non_trovato" }, 404, origin);
  if ((await rpcPersona(token, "app_sub_posso_invitare", { p_richiesta: i.richiesta })) !== true) return rispondi({ error: "non_autorizzato" }, 403, origin);
  const [stop] = await rest(`app_mail_stop?select=email&email=eq.${encodeURIComponent(i.email)}`);
  if (stop) return rispondi({ error: "ha_chiesto_di_non_ricevere" }, 409, origin);
  const [r] = await rest(`app_sub_richieste?select=id,org,titolo,descrizione,voci,mestiere,comune,scadenza&id=eq.${i.richiesta}`);
  const [org] = await rest(`app_org?select=nome&id=eq.${r.org}`);
  const pagamenti = (await rest(`app_milestone?select=descrizione,evento,tipo,valore&richiesta=eq.${r.id}&order=n`)) || [];
  const e = await mandaInvito(i, r, org?.nome || "", pagamenti);
  return e ? rispondi({ error: e === "mail_non_configurata" ? e : "invio_non_riuscito" }, e === "mail_non_configurata" ? 503 : 502, origin) : rispondi({ ok: true }, 200, origin);
}

async function esitoOfferta(token: string, body: Record<string, unknown>, origin: string | null) {
  const id = String(body.offerta || "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return rispondi({ error: "offerta_mancante" }, 400, origin);
  const [o] = await rest(`app_sub_offerte?select=*&id=eq.${id}`);
  if (!o || !["approvata", "rifiutata", "in_trattativa"].includes(o.stato)) return rispondi({ error: "offerta_non_decisa" }, 400, origin);
  const [r] = await rest(`app_sub_richieste?select=id,org,titolo,comune&id=eq.${o.richiesta}`);
  if ((await rpcPersona(token, "app_amministro", { p_org: r.org })) !== true) return rispondi({ error: "non_autorizzato" }, 403, origin);
  const [i] = await rest(`app_sub_inviti?select=*&id=eq.${o.invito}`);
  const [stop] = await rest(`app_mail_stop?select=email&email=eq.${encodeURIComponent(i.email)}`);
  if (stop) return rispondi({ ok: true, saltata: "ha_chiesto_di_non_ricevere" }, 200, origin);
  const [org] = await rest(`app_org?select=nome&id=eq.${r.org}`);
  const app = (Deno.env.get("APP_URL") || "").replace(/\/+$/, "");
  const link = `${app}/#/offerta/${i.token}`, stopUrl = `${app}/#/offerta-stop/${i.token}`;
  const titoli: Record<string, string> = { approvata: "La tua offerta è stata scelta", rifiutata: "Esito della tua offerta", in_trattativa: "La tua offerta: ti chiediamo una modifica" };
  const testi: Record<string, string> = {
    approvata: `${org?.nome || "La ditta"} ha scelto la tua offerta di ${euro(o.importo)} per «${r.titolo}». Ti contatterà per i prossimi passi.`,
    rifiutata: `Per «${r.titolo}» è stata scelta un'altra offerta. Grazie per aver risposto: ti scriveremo per i prossimi lavori nella tua zona.`,
    in_trattativa: `${org?.nome || "La ditta"} ha letto la tua offerta per «${r.titolo}» e ti chiede di rivederla.`,
  };
  const piano = Array.isArray(o.piano_pagamenti) ? o.piano_pagamenti : [];
  const corpo = `<p>${esc(testi[o.stato])}</p>${o.nota_admin && o.stato !== "rifiutata" ? `<p style="background:#F4F6F9;border-radius:12px;padding:12px 14px">${esc(o.nota_admin)}</p>` : ""}
    ${o.stato === "approvata" && piano.length ? `<p style="margin:0 0 6px"><b>Pagamenti concordati</b></p><ul style="padding-left:18px">${piano.map((p: Record<string, unknown>) => `<li>${esc(p.descrizione)}${p.evento ? " – " + esc(p.evento) : ""}: ${esc(euro(Number(p.importo)))}</li>`).join("")}</ul>` : ""}
    ${o.stato === "in_trattativa" ? bottone(link, "Rivedi l'offerta") : ""}`;
  const e = await mandaMail({
    email: i.email, nome: i.nome, oggetto: `${titoli[o.stato]}: ${r.titolo}`, html: pagina(esc(titoli[o.stato]), corpo, piedeMail(stopUrl, "Ricevi questa mail perché hai mandato un'offerta tramite AncheCasa.")),
    testo: `${testi[o.stato]}\n${o.nota_admin && o.stato !== "rifiutata" ? "\n" + o.nota_admin + "\n" : ""}${o.stato === "in_trattativa" ? "\nRivedi l'offerta: " + link + "\n" : ""}\nNon vuoi più ricevere mail? ${stopUrl}`, stop: stopUrl,
  });
  return e ? rispondi({ error: e === "mail_non_configurata" ? e : "invio_non_riuscito" }, e === "mail_non_configurata" ? 503 : 502, origin) : rispondi({ ok: true }, 200, origin);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return rispondi({ error: "metodo_non_ammesso" }, 405, origin);
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  let utente: string | null = null;
  try { utente = await chiEUtente(token); } catch { utente = null; }
  if (!utente) return rispondi({ error: "accesso_richiesto" }, 401, origin);
  if (!chiave("segreta")) return rispondi({ error: "configurazione_mancante" }, 503, origin);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return rispondi({ error: "json_non_valido" }, 400, origin); }
  try {
    if (body.azione === "invita") return await invita(utente, token, body, origin);
    if (body.azione === "reinvia") return await reinvia(token, body, origin);
    if (body.azione === "esito") return await esitoOfferta(token, body, origin);
    return rispondi({ error: "azione_sconosciuta" }, 400, origin);
  } catch (e) {
    console.error("subappalti-mail", e instanceof Error ? e.message : e);
    return rispondi({ error: "non_riuscita" }, 502, origin);
  }
});
