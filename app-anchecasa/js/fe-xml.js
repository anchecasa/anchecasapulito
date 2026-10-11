/* Generatore del file XML FatturaPA (FPR12) — stessa logica della funzione Supabase «sdi-gateway».
   Nell'app serve solo alla MODALITÀ PROVA (controllo e anteprima dell'XML senza server).
   Se cambi qualcosa qui, cambialo anche in supabase/functions/sdi-gateway/index.ts (e viceversa). */
const x = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const tag = (n, v) => (v === null || v === undefined || v === "" ? "" : `<${n}>${x(v)}</${n}>`);
const d2 = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
const dN = (n, max = 8) => { let s = (Number(n) || 0).toFixed(max); s = s.replace(/0+$/, ""); const [i, f = ""] = s.split("."); return `${i}.${(f + "00").slice(0, Math.max(2, f.length))}`; };
const tondo = (n) => Math.round(n * 100) / 100;

export function pivaValida(p) {
  if (!/^[0-9]{11}$/.test(p)) return false;
  let s = 0;
  for (let i = 0; i < 10; i++) { let c = Number(p[i]); if (i % 2) { c *= 2; if (c > 9) c -= 9; } s += c; }
  return (10 - (s % 10)) % 10 === Number(p[10]);
}
const cfValido = (c) => /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(c) || /^[0-9]{11}$/.test(c);

const RIF_NORMATIVO = {
  "N2.2": "Operazione in franchigia da IVA ai sensi dell'art. 1, commi 54-89, L. 190/2014",
  "N6.3": "Inversione contabile art. 17, c. 6, lett. a), DPR 633/72 (subappalto nel settore edile)",
  "N6.7": "Inversione contabile art. 17, c. 6, lett. a-ter), DPR 633/72 (prestazioni sugli edifici)",
};

export function generaXml(p, d, righe, opt) {
  const errori = [];
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
  const gruppi = new Map();
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
  const sede = (o) => `<Sede>${tag("Indirizzo", String(o.indirizzo || "").slice(0, 60))}${tag("NumeroCivico", String(o.civico || "").slice(0, 8))}${tag("CAP", o.cap || "00000")}${tag("Comune", String(o.comune || "").slice(0, 60))}${(o.nazione || "IT") === "IT" ? tag("Provincia", String(o.provincia || "").toUpperCase()) : ""}${tag("Nazione", o.nazione || "IT")}</Sede>`;
  const causale = [d.oggetto, d.note].filter(Boolean).join(" · ").slice(0, 400);
  const causali = causale ? causale.match(/.{1,200}/g).map((t) => tag("Causale", t)).join("") : "";
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

