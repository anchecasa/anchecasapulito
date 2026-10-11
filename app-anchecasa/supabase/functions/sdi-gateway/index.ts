// Funzione Supabase «sdi-gateway» — app AncheCasa, Fatture elettroniche (11.10.2026).
//
// Cosa fa:
//   azione "xml"     → costruisce il file XML FatturaPA (FPR12, tra privati) di una fattura e lo controlla. Non invia.
//   azione "invia"   → numera la fattura se serve, costruisce l'XML, scala un invio dal credito dell'azienda,
//                      lo manda al gateway e salva lo stato. Se il gateway fallisce, l'invio torna nel credito.
//   azione "stato"   → chiede al gateway a che punto è (consegnata, scartata…) e aggiorna la fattura.
//   webhook          → il gateway avvisa da solo: POST con l'intestazione x-sdi-segreto uguale al secret SDI_WEBHOOK_SEGRETO.
//
// Ogni chiamata al gateway finisce in marketplace.app_api_usage_logs con il costo vivo (tabella app_fe_costi)
// e il ricavo (dal credito usato): così il margine per azienda è sempre aggiornato.
//
// Secrets: gli stessi delle altre funzioni (AC_PUBLISHABLE_KEY, AC_SECRET_KEY se servono, DIAGNOSI_ORIGINI) più:
//   SDI_GATEWAY            simulato (predefinito) | aruba | openapi | acube
//   SDI_ID_TRASMITTENTE    codice fiscale o P.IVA del trasmittente (di solito lo dà il gateway); se manca, quella di chi emette
//   SDI_WEBHOOK_SEGRETO    testo lungo a caso, da dare al gateway per le notifiche
//   + le credenziali del gateway scelto (vedi in fondo: «Gateway veri»). Mai nelle tabelle, mai in chat.
// Pubblicazione: Edge Functions → Deploy a new function → Via Editor, nome sdi-gateway.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ---------------------------------------------------------------------------
// Utilità di collegamento (come in gare-analisi)
// ---------------------------------------------------------------------------
function cors(origin: string | null): Record<string, string> {
  const ammessi = (Deno.env.get("DIAGNOSI_ORIGINI") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = !ammessi.length || (origin && ammessi.includes(origin));
  const h: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (ok) h["Access-Control-Allow-Origin"] = origin || "*";
  return h;
}
function rispondi(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(origin) } });
}
function chiave(tipo: "pubblica" | "segreta"): string {
  const daJson = (nome: string) => {
    try { const j = JSON.parse(Deno.env.get(nome) || "{}"); return String(j.default || Object.values(j)[0] || ""); } catch { return ""; }
  };
  if (tipo === "pubblica") return Deno.env.get("AC_PUBLISHABLE_KEY") || daJson("SUPABASE_PUBLISHABLE_KEYS") || Deno.env.get("SUPABASE_ANON_KEY") || "";
  return Deno.env.get("AC_SECRET_KEY") || daJson("SUPABASE_SECRET_KEYS") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}
const URL_SB = () => Deno.env.get("SUPABASE_URL") || "";
function hServizio(extra: Record<string, string> = {}) {
  const k = chiave("segreta");
  const h: Record<string, string> = { apikey: k, "Content-Type": "application/json", "Accept-Profile": "marketplace", "Content-Profile": "marketplace", ...extra };
  if (!k.startsWith("sb_")) h.Authorization = `Bearer ${k}`;
  return h;
}
function hUtente(token: string, extra: Record<string, string> = {}) {
  return { apikey: chiave("pubblica"), Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Accept-Profile": "marketplace", "Content-Profile": "marketplace", ...extra };
}
async function chiEUtente(token: string): Promise<string | null> {
  if (!token || !URL_SB() || !chiave("pubblica")) return null;
  const u = await fetch(`${URL_SB()}/auth/v1/user`, { headers: { apikey: chiave("pubblica"), Authorization: `Bearer ${token}` } });
  if (!u.ok) return null;
  const j = await u.json().catch(() => ({}));
  return typeof j?.id === "string" ? j.id : null;
}

class Errore extends Error { constructor(public codice: string, public status = 400, public dettagli: unknown = null) { super(codice); } }

async function rest(metodo: string, percorso: string, h: Record<string, string>, body?: unknown) {
  const r = await fetch(`${URL_SB()}/rest/v1/${percorso}`, { method: metodo, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  const testo = await r.text();
  let dati: any = null;
  try { dati = testo ? JSON.parse(testo) : null; } catch { dati = testo; }
  if (!r.ok) {
    const msg = typeof dati === "object" && dati ? String(dati.message || dati.hint || "") : String(dati || "");
    const codice = (msg.match(/[a-z_]{6,}/) || ["errore_database"])[0];
    throw new Error(codice);
  }
  return dati;
}
const S = {
  get: (p: string) => rest("GET", p, hServizio()),
  patch: (p: string, b: unknown) => rest("PATCH", p, hServizio({ Prefer: "return=representation" }), b),
  post: (p: string, b: unknown) => rest("POST", p, hServizio({ Prefer: "return=representation" }), b),
  rpc: (n: string, b: unknown) => rest("POST", `rpc/${n}`, hServizio(), b),
};

async function sha256(t: string): Promise<string> {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// XML FatturaPA 1.2.2 · formato FPR12 (fatture tra privati: B2B e B2C)
// L'ordine degli elementi segue lo schema dell'Agenzia delle Entrate.
// ---------------------------------------------------------------------------
const x = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const tag = (n: string, v: unknown) => (v === null || v === undefined || v === "" ? "" : `<${n}>${x(v)}</${n}>`);
const d2 = (n: number) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
const dN = (n: number, max = 8) => { let s = (Number(n) || 0).toFixed(max); s = s.replace(/0+$/, ""); const [i, f = ""] = s.split("."); return `${i}.${(f + "00").slice(0, Math.max(2, f.length))}`; };
const tondo = (n: number) => Math.round(n * 100) / 100;

export function pivaValida(p: string): boolean {
  if (!/^[0-9]{11}$/.test(p)) return false;
  let s = 0;
  for (let i = 0; i < 10; i++) { let c = Number(p[i]); if (i % 2) { c *= 2; if (c > 9) c -= 9; } s += c; }
  return (10 - (s % 10)) % 10 === Number(p[10]);
}
const cfValido = (c: string) => /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(c) || /^[0-9]{11}$/.test(c);

const RIF_NORMATIVO: Record<string, string> = {
  "N2.2": "Operazione in franchigia da IVA ai sensi dell'art. 1, commi 54-89, L. 190/2014",
  "N6.3": "Inversione contabile art. 17, c. 6, lett. a), DPR 633/72 (subappalto nel settore edile)",
  "N6.7": "Inversione contabile art. 17, c. 6, lett. a-ter), DPR 633/72 (prestazioni sugli edifici)",
};

export function generaXml(p: any, d: any, righe: any[], opt: { trasmittente?: string; progressivo: string }) {
  const errori: string[] = [];
  const c = d.cliente_dati || {};
  const it = (p.nazione || "IT") === "IT";
  const forf = p.regime === "RF19";

  // Controlli su chi emette
  if (!p.denominazione) errori.push("Manca la denominazione di chi emette (Dati fiscali).");
  if (!pivaValida(p.piva || "")) errori.push("La partita IVA di chi emette non è valida.");
  if (!p.indirizzo || !p.comune || (it && (!/^[0-9]{5}$/.test(p.cap || "") || !/^[A-Z]{2}$/.test(p.provincia || "")))) errori.push("Indirizzo di chi emette incompleto (via, CAP, comune, provincia).");
  // Controlli sul cliente
  const privato = !c.piva;
  const codDest = String(c.codice_destinatario || "").toUpperCase() || "0000000";
  if (!c.denominazione && !(c.nome && c.cognome)) errori.push("Manca il nome del cliente (ragione sociale, oppure nome e cognome).");
  if (c.piva && !pivaValida(c.piva) && (c.nazione || "IT") === "IT") errori.push("La partita IVA del cliente non è valida.");
  if (privato && !cfValido(String(c.cf || "").toUpperCase())) errori.push("Cliente privato: serve il codice fiscale.");
  if (!/^[A-Z0-9]{7}$/.test(codDest)) errori.push("Il codice destinatario del cliente deve avere 7 caratteri (oppure 0000000).");
  if (!c.indirizzo || !c.comune || ((c.nazione || "IT") === "IT" && (!/^[0-9]{5}$/.test(c.cap || "") || !/^[A-Z]{2}$/.test(String(c.provincia || "").toUpperCase())))) errori.push("Indirizzo del cliente incompleto (via, CAP, comune, provincia).");
  // Controlli sul documento
  if (!d.numero) errori.push("Il documento non ha ancora un numero.");
  if (!righe.length) errori.push("Aggiungi almeno una voce.");
  righe.forEach((r, i) => {
    if (Number(r.aliquota) === 0 && !r.natura) errori.push(`Voce ${i + 1}: con IVA 0 serve la Natura (es. N6.3 reverse charge edilizia).`);
    if (forf && (Number(r.aliquota) !== 0 || r.natura !== "N2.2")) errori.push(`Voce ${i + 1}: in regime forfettario l'IVA è 0 con Natura N2.2.`);
  });

  // Righe e riepilogo (gli importi dell'XML sono quelli che valgono)
  const scDoc = Number(d.sconto) || 0;
  const gruppi = new Map<string, { aliquota: number; natura: string | null; imponibile: number }>();
  const linee = righe.map((r, i) => {
    const q = Number(r.quantita) || 0, pr = Number(r.prezzo) || 0, s1 = Number(r.sconto) || 0;
    const tot = tondo(q * pr * (1 - s1 / 100) * (1 - scDoc / 100));
    const k = `${Number(r.aliquota)}|${r.natura || ""}`;
    const g = gruppi.get(k) || { aliquota: Number(r.aliquota), natura: r.natura || null, imponibile: 0 };
    g.imponibile = tondo(g.imponibile + tot); gruppi.set(k, g);
    const sconti = [s1, scDoc].filter((s) => s > 0).map((s) => `<ScontoMaggiorazione><Tipo>SC</Tipo><Percentuale>${d2(s)}</Percentuale></ScontoMaggiorazione>`).join("");
    return `<DettaglioLinee>${tag("NumeroLinea", i + 1)}${tag("Descrizione", String(r.descrizione || "").slice(0, 1000))}<Quantita>${dN(q)}</Quantita>${tag("UnitaMisura", String(r.um || "").slice(0, 10))}<PrezzoUnitario>${dN(pr)}</PrezzoUnitario>${sconti}<PrezzoTotale>${d2(tot)}</PrezzoTotale><AliquotaIVA>${d2(Number(r.aliquota))}</AliquotaIVA>${tag("Natura", r.natura)}</DettaglioLinee>`;
  }).join("");
  let imponibile = 0, iva = 0;
  const riepilogo = [...gruppi.values()].map((g) => {
    const imposta = tondo(g.imponibile * g.aliquota / 100);
    imponibile = tondo(imponibile + g.imponibile); iva = tondo(iva + imposta);
    const rif = g.natura ? (RIF_NORMATIVO[g.natura] || `Operazione con Natura ${g.natura}`) : "";
    return `<DatiRiepilogo><AliquotaIVA>${d2(g.aliquota)}</AliquotaIVA>${tag("Natura", g.natura)}<ImponibileImporto>${d2(g.imponibile)}</ImponibileImporto><Imposta>${d2(imposta)}</Imposta>${g.natura ? "" : "<EsigibilitaIVA>I</EsigibilitaIVA>"}${tag("RiferimentoNormativo", rif.slice(0, 100))}</DatiRiepilogo>`;
  }).join("");
  const totale = tondo(imponibile + iva);

  const idTrasm = (opt.trasmittente || p.piva || p.cf || "").toUpperCase();
  const anagCliente = c.denominazione ? tag("Denominazione", String(c.denominazione).slice(0, 80)) : `${tag("Nome", String(c.nome || "").slice(0, 60))}${tag("Cognome", String(c.cognome || "").slice(0, 60))}`;
  const sede = (o: any) => `<Sede>${tag("Indirizzo", String(o.indirizzo || "").slice(0, 60))}${tag("NumeroCivico", String(o.civico || "").slice(0, 8))}${tag("CAP", o.cap || "00000")}${tag("Comune", String(o.comune || "").slice(0, 60))}${(o.nazione || "IT") === "IT" ? tag("Provincia", String(o.provincia || "").toUpperCase()) : ""}${tag("Nazione", o.nazione || "IT")}</Sede>`;
  const causale = [d.oggetto, d.note].filter(Boolean).join(" · ").slice(0, 400);
  const causali = causale ? causale.match(/.{1,200}/g)!.map((t: string) => tag("Causale", t)).join("") : "";
  const tipoDoc = d.tipo_sdi || "TD01";
  const pagamento = p.iban || d.scadenza_pagamento
    ? `<DatiPagamento><CondizioniPagamento>TP02</CondizioniPagamento><DettaglioPagamento>${tag("ModalitaPagamento", d.pagamento || "MP05")}${tag("DataScadenzaPagamento", d.scadenza_pagamento)}<ImportoPagamento>${d2(totale)}</ImportoPagamento>${tag("IBAN", p.iban)}</DettaglioPagamento></DatiPagamento>`
    : "";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2 http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2/Schema_del_file_xml_FatturaPA_versione_1.2.xsd">
<FatturaElettronicaHeader>
<DatiTrasmissione><IdTrasmittente><IdPaese>IT</IdPaese>${tag("IdCodice", idTrasm)}</IdTrasmittente>${tag("ProgressivoInvio", opt.progressivo)}<FormatoTrasmissione>FPR12</FormatoTrasmissione>${tag("CodiceDestinatario", codDest)}${codDest === "0000000" && c.pec ? tag("PECDestinatario", c.pec) : ""}</DatiTrasmissione>
<CedentePrestatore><DatiAnagrafici><IdFiscaleIVA><IdPaese>${x(p.nazione || "IT")}</IdPaese>${tag("IdCodice", p.piva)}</IdFiscaleIVA>${tag("CodiceFiscale", p.cf)}<Anagrafica>${tag("Denominazione", String(p.denominazione || "").slice(0, 80))}</Anagrafica>${tag("RegimeFiscale", p.regime || "RF01")}</DatiAnagrafici>${sede(p)}${p.rea_ufficio && p.rea_numero ? `<IscrizioneREA>${tag("Ufficio", p.rea_ufficio)}${tag("NumeroREA", p.rea_numero)}<StatoLiquidazione>LN</StatoLiquidazione></IscrizioneREA>` : ""}${p.telefono || p.email ? `<Contatti>${tag("Telefono", String(p.telefono || "").replace(/[^0-9+]/g, "").slice(0, 12))}${tag("Email", p.email)}</Contatti>` : ""}</CedentePrestatore>
<CessionarioCommittente><DatiAnagrafici>${c.piva ? `<IdFiscaleIVA><IdPaese>${x(c.nazione || "IT")}</IdPaese>${tag("IdCodice", c.piva)}</IdFiscaleIVA>` : ""}${tag("CodiceFiscale", String(c.cf || "").toUpperCase())}<Anagrafica>${anagCliente}</Anagrafica></DatiAnagrafici>${sede({ ...c, provincia: String(c.provincia || "").toUpperCase() })}</CessionarioCommittente>
</FatturaElettronicaHeader>
<FatturaElettronicaBody>
<DatiGenerali><DatiGeneraliDocumento>${tag("TipoDocumento", tipoDoc)}<Divisa>EUR</Divisa>${tag("Data", d.data)}${tag("Numero", d.numero)}${d.bollo ? "<DatiBollo><BolloVirtuale>SI</BolloVirtuale><ImportoBollo>2.00</ImportoBollo></DatiBollo>" : ""}<ImportoTotaleDocumento>${d2(totale)}</ImportoTotaleDocumento>${causali}</DatiGeneraliDocumento></DatiGenerali>
<DatiBeniServizi>${linee}${riepilogo}</DatiBeniServizi>
${pagamento}
</FatturaElettronicaBody>
</p:FatturaElettronica>`;
  const nomeFile = `IT${p.piva || p.cf}_${opt.progressivo.slice(-5).toUpperCase()}.xml`;
  return { xml, errori, nomeFile, imponibile, iva, totale };
}

// ---------------------------------------------------------------------------
// Gateway: uno simulato (oggi) e lo spazio per quelli veri
// ---------------------------------------------------------------------------
type EsitoStato = { stato: string; esito?: Record<string, unknown> };
interface Gateway {
  nome: string;
  invia(xml: string, nomeFile: string, profilo: any): Promise<{ id: string }>;
  stato(doc: any): Promise<EsitoStato>;
}

/** Simulato: risponde come un gateway vero, senza mandare niente all'Agenzia delle Entrate.
 *  Dopo 20 secondi la fattura risulta «consegnata». Per provare uno scarto: codice destinatario «XXXXXXX». */
const simulato: Gateway = {
  nome: "simulato",
  async invia(_xml, _nome) { return { id: "SIM-" + crypto.randomUUID().slice(0, 12).toUpperCase() }; },
  async stato(doc) {
    const passati = (Date.now() - new Date(doc.inviato).getTime()) / 1000;
    if (passati < 20) return { stato: "inviato" };
    if (String(doc.cliente_dati?.codice_destinatario || "").toUpperCase() === "XXXXXXX") {
      return { stato: "scartato", esito: { codice: "00311", testo: "Codice destinatario non valido (simulazione)." } };
    }
    return { stato: "consegnato" };
  },
};

/* Gateway veri: si collegano qui quando Nando firma il contratto.
   Ognuno deve fare due cose: inviare il file XML (risposta: un id) e dire a che punto è (o mandare il webhook).
   Le credenziali si leggono SOLO da Deno.env (Secrets della funzione), con il nome scritto in app_fe_profili.gateway_segreto.
   Non scrivere qui indirizzi o campi inventati: vanno presi dalla documentazione del gateway scelto. */
function gatewayDaConfigurare(nome: string): Gateway {
  const no = () => { throw new Errore("gateway_non_configurato", 501); };
  return { nome, invia: no, stato: no };
}
function gatewayPer(profilo: any): Gateway {
  const scelto = (profilo?.gateway && profilo.gateway !== "simulato" ? profilo.gateway : Deno.env.get("SDI_GATEWAY")) || "simulato";
  if (scelto === "simulato") return simulato;
  return gatewayDaConfigurare(scelto);
}

// ---------------------------------------------------------------------------
// Azioni
// ---------------------------------------------------------------------------
async function costo(operazione: string): Promise<number> {
  const r = await S.get(`app_fe_costi?operazione=eq.${operazione}&select=costo`).catch(() => []);
  return Number(r?.[0]?.costo) || 0;
}
async function registra(riga: Record<string, unknown>) {
  await S.post("app_api_usage_logs", riga).catch((e) => console.error("log", e));
}
async function evento(documento: string, tipo: string, testo: string, stato_sdi: string | null = null, dati: unknown = {}) {
  await S.post("app_fe_eventi", { documento, tipo, testo: testo.slice(0, 500), stato_sdi, dati }).catch((e) => console.error("evento", e));
}

/** Legge il documento COME L'UTENTE (vale la sicurezza del database) e controlla che possa scrivere. */
async function documentoPerUtente(token: string, id: string, scrivere: boolean) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Errore("documento_non_valido");
  const righe = await rest("GET", `app_fe_documenti?id=eq.${id}&select=*`, hUtente(token));
  const d = righe?.[0];
  if (!d) throw new Errore("documento_non_trovato", 404);
  if (scrivere) {
    const ok = await rest("POST", "rpc/app_fe_scrive", hUtente(token), { p_org: d.org });
    if (ok !== true) throw new Errore("non_autorizzato", 403);
  }
  return d;
}

async function preparaXml(d: any) {
  if (d.tipo === "preventivo") throw new Errore("i_preventivi_non_vanno_allo_sdi");
  const [prof, righe] = await Promise.all([
    S.get(`app_fe_profili?org=eq.${d.org}&select=*`),
    S.get(`app_fe_righe?documento=eq.${d.id}&select=*&order=n.asc`),
  ]);
  const p = prof?.[0];
  if (!p) throw new Errore("mancano_i_dati_fiscali", 422, ["Compila i dati fiscali dell'azienda (Ufficio → Fatture → Dati fiscali)."]);
  const progressivo = (Date.now().toString(36) + crypto.randomUUID().replace(/-/g, "").slice(0, 4)).slice(-10).toUpperCase();
  return { p, righe, ...generaXml(p, d, righe, { trasmittente: Deno.env.get("SDI_ID_TRASMITTENTE") || "", progressivo }) };
}

async function azioneXml(token: string, utente: string, id: string) {
  let d = await documentoPerUtente(token, id, true);
  const prova = await preparaXml({ ...d, numero: d.numero || "0" });
  const errori = d.numero ? prova.errori : prova.errori.filter((e) => !e.startsWith("Il documento non ha"));
  await registra({ org: d.org, utente, operazione: "genera_xml", documento: d.id, gateway: "", costo_api: 0, ricavo: 0, esito: errori.length ? "errore" : "ok", dettaglio: errori.join(" | ").slice(0, 300) });
  return { ok: !errori.length, errori, xml: prova.xml, nome_file: prova.nomeFile, totale: prova.totale };
}

async function azioneInvia(token: string, utente: string, id: string) {
  let d = await documentoPerUtente(token, id, true);
  if (d.bloccato && d.stato_sdi !== "scartato") throw new Errore("gia_inviata", 409);
  if (!["non_inviato", "scartato"].includes(d.stato_sdi)) throw new Errore("invio_in_corso", 409);

  // 1. Controllo prima di consumare il credito (con un numero provvisorio se ancora non c'è)
  const anteprima = await preparaXml({ ...d, numero: d.numero || "0" });
  if (anteprima.errori.filter((e) => !e.startsWith("Il documento non ha")).length) throw new Errore("fattura_incompleta", 422, anteprima.errori);

  // 2. Credito
  let credito: string, ricavo: number;
  try {
    const pren = await S.rpc("app_fe_prenota_invio", { p_org: d.org });
    credito = pren?.[0]?.credito; ricavo = Number(pren?.[0]?.ricavo) || 0;
    if (!credito) throw new Error("nessun_piano_attivo");
  } catch (e) {
    const c = String((e as Error).message);
    throw new Errore(["crediti_esauriti", "nessun_piano_attivo", "modulo_non_attivo"].includes(c) ? c : "credito_non_disponibile", 402);
  }

  // 3. Numero definitivo e XML vero
  try {
    if (!d.numero) await S.rpc("app_fe_numera", { p_documento: d.id });
    d = (await S.get(`app_fe_documenti?id=eq.${d.id}&select=*`))[0];
    const pronto = await preparaXml(d);
    if (pronto.errori.length) throw new Errore("fattura_incompleta", 422, pronto.errori);
    await S.patch(`app_fe_documenti?id=eq.${d.id}`, { stato_sdi: "in_invio" });

    // 4. Gateway
    const gw = gatewayPer(pronto.p);
    const costoInvio = await costo("invio_fe");
    let risposta: { id: string };
    try {
      risposta = await gw.invia(pronto.xml, pronto.nomeFile, pronto.p);
    } catch (e) {
      await S.rpc("app_fe_rimborsa_invio", { p_credito: credito });
      await S.patch(`app_fe_documenti?id=eq.${d.id}`, { stato_sdi: d.stato_sdi === "scartato" ? "scartato" : "non_inviato", esito: { errore: String((e as Error).message) } });
      await registra({ org: d.org, utente, operazione: "invio_fe", documento: d.id, credito, gateway: gw.nome, costo_api: 0, ricavo: 0, esito: "rimborsato", dettaglio: String((e as Error).message).slice(0, 300) });
      await evento(d.id, "errore", "Il gateway non ha accettato l'invio: credito restituito.", null, { errore: String((e as Error).message) });
      throw e instanceof Errore ? e : new Errore("gateway_non_raggiungibile", 502);
    }

    const impronta = await sha256(pronto.xml);
    await S.patch(`app_fe_documenti?id=eq.${d.id}`, {
      stato_sdi: "inviato", bloccato: true, sdi_id: risposta.id, sdi_file: pronto.nomeFile, xml: pronto.xml, xml_sha256: impronta,
      inviato: new Date().toISOString(), esito: {}, imponibile: pronto.imponibile, iva: pronto.iva, totale: pronto.totale,
    });
    await registra({ org: d.org, utente, operazione: "invio_fe", documento: d.id, credito, gateway: gw.nome, costo_api: costoInvio, ricavo, esito: "ok", dettaglio: risposta.id });
    await evento(d.id, "inviato", `Inviata allo SdI tramite ${gw.nome} (${pronto.nomeFile}).`, "inviato", { sdi_id: risposta.id });
    return { ok: true, stato_sdi: "inviato", sdi_id: risposta.id, numero: d.numero };
  } catch (e) {
    if (e instanceof Errore && e.codice === "gateway_non_raggiungibile") throw e;
    if (e instanceof Errore && e.codice === "gateway_non_configurato") throw e;
    // Errore prima del gateway: il credito torna indietro
    await S.rpc("app_fe_rimborsa_invio", { p_credito: credito }).catch(() => {});
    throw e;
  }
}

async function aggiornaStato(d: any, nuovo: EsitoStato, gateway: string, utente: string | null) {
  if (nuovo.stato === d.stato_sdi) return d.stato_sdi;
  const patch: Record<string, unknown> = { stato_sdi: nuovo.stato, esito: nuovo.esito || {} };
  if (nuovo.stato === "consegnato" || nuovo.stato === "mancata_consegna") patch.consegnato = new Date().toISOString();
  if (nuovo.stato === "scartato") patch.bloccato = false;   // si corregge e si rimanda entro 5 giorni con lo stesso numero
  await S.patch(`app_fe_documenti?id=eq.${d.id}`, patch);
  const testi: Record<string, string> = {
    consegnato: "Consegnata al cliente.",
    mancata_consegna: "Lo SdI non è riuscito a consegnarla: è nel cassetto fiscale del cliente. Avvisalo.",
    scartato: "Scartata dallo SdI: correggi e rimandala entro 5 giorni con lo stesso numero.",
  };
  await evento(d.id, "notifica", testi[nuovo.stato] || `Stato: ${nuovo.stato}`, nuovo.stato, nuovo.esito || {});
  const c = await costo("stato");
  if (c > 0 || utente) await registra({ org: d.org, utente, operazione: "stato", documento: d.id, gateway, costo_api: c, ricavo: 0, esito: "ok", dettaglio: nuovo.stato });
  return nuovo.stato;
}

async function azioneStato(token: string, utente: string, id: string) {
  const d = await documentoPerUtente(token, id, false);
  if (!d.sdi_id || !["inviato", "in_invio"].includes(d.stato_sdi)) return { ok: true, stato_sdi: d.stato_sdi };
  const p = (await S.get(`app_fe_profili?org=eq.${d.org}&select=*`))?.[0];
  const gw = gatewayPer(p);
  const stato = await aggiornaStato(d, await gw.stato(d), gw.nome, utente);
  return { ok: true, stato_sdi: stato };
}

async function webhook(req: Request) {
  const atteso = Deno.env.get("SDI_WEBHOOK_SEGRETO") || "";
  const dato = req.headers.get("x-sdi-segreto") || "";
  if (!atteso || atteso.length < 24 || dato !== atteso) return new Response("no", { status: 401 });
  const b = await req.json().catch(() => ({}));
  const sdi = String(b.sdi_id || "").slice(0, 80);
  const stato = String(b.stato || "");
  if (!sdi || !["consegnato", "mancata_consegna", "scartato", "accettato", "rifiutato"].includes(stato)) return new Response("dati", { status: 400 });
  const d = (await S.get(`app_fe_documenti?sdi_id=eq.${encodeURIComponent(sdi)}&select=*`))?.[0];
  if (!d) return new Response("ok", { status: 200 });   // non diciamo se esiste
  await aggiornaStato(d, { stato, esito: typeof b.esito === "object" && b.esito ? b.esito : {} }, "webhook", null);
  return new Response("ok", { status: 200 });
}

// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return rispondi({ ok: false, error: "metodo" }, 405, origin);
  if (req.headers.get("x-sdi-segreto") !== null) return webhook(req);

  try {
    if (!URL_SB() || !chiave("segreta")) throw new Errore("funzione_non_configurata", 500);
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const utente = await chiEUtente(token);
    if (!utente) throw new Errore("accesso_richiesto", 401);
    const b = await req.json().catch(() => ({}));
    const id = String(b.documento || "");
    if (b.azione === "xml") return rispondi(await azioneXml(token, utente, id), 200, origin);
    if (b.azione === "invia") return rispondi(await azioneInvia(token, utente, id), 200, origin);
    if (b.azione === "stato") return rispondi(await azioneStato(token, utente, id), 200, origin);
    throw new Errore("azione_sconosciuta");
  } catch (e) {
    if (e instanceof Errore) return rispondi({ ok: false, error: e.codice, dettagli: e.dettagli }, e.status, origin);
    console.error(e);
    return rispondi({ ok: false, error: String((e as Error).message || "errore").slice(0, 60) }, 500, origin);
  }
});
