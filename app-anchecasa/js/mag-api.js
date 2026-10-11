/* Magazzino e mezzi collegati al cantiere (parte 13, 11.10.2026).
   - vero: tabelle app_mag_movimenti e app_mezzi_uso, funzione app_costi_cantiere (le regole le applica il database);
   - prova: le stesse regole simulate nel browser con i dati di ESEMPIO. */
import { DB } from "./db.js";
import { Q } from "./q.js";

const PROVA = DB.prova;
const adesso = () => new Date().toISOString();
const oggi = () => new Date().toISOString().slice(0, 10);
const nuovoId = (p) => (p || "x") + "-" + Math.random().toString(36).slice(2, 10);
const n = (v) => (v === "" || v == null ? null : Number(v));
const tondo = (v, d = 2) => Math.round((Number(v) || 0) * 10 ** d) / 10 ** d;
const giorniTra = (dal, al) => Math.round((new Date(al + "T12:00:00") - new Date(dal + "T12:00:00")) / 864e5) + 1;

/* ---------- prova: stesse regole del trigger SQL ---------- */
async function provaMovimento(m) {
  const art = await Q.uno("app_record", { id: m.articolo });
  if (!art || art.tipo !== "articolo") throw new Error("articolo_non_valido");
  const giac = Number(art.dati.giacenza) || 0;
  let cm = art.dati.costo_medio != null ? Number(art.dati.costo_medio) : null;
  const q = Number(m.quantita);
  let nuova = giac;
  const inCant = async (c) => MAG.inCantiere(m.articolo, c);
  if (m.tipo === "carico") {
    if (m.costo_unitario != null) cm = cm == null || giac <= 0 ? m.costo_unitario : tondo((giac * cm + q * m.costo_unitario) / (giac + q), 4);
    nuova = giac + q;
  } else if (m.tipo === "scarico") {
    if (q > giac) throw new Error("giacenza_insufficiente");
    m.costo_unitario = cm; nuova = giac - q;
  } else if (m.tipo === "reso") {
    if (q > (await inCant(m.da_cantiere))) throw new Error("quantita_oltre_il_cantiere");
    m.costo_unitario = m.costo_unitario ?? cm; nuova = giac + q;
  } else if (m.tipo === "trasferimento") {
    if (q > (await inCant(m.da_cantiere))) throw new Error("quantita_oltre_il_cantiere");
    m.costo_unitario = m.costo_unitario ?? cm;
  } else {
    if (giac + q < 0) throw new Error("giacenza_insufficiente");
    m.costo_unitario = cm; nuova = giac + q;
  }
  await Q.upd("app_record", { id: art.id }, { dati: Object.assign({}, art.dati, { giacenza: tondo(nuova, 3) }, cm != null ? { costo_medio: cm } : {}) });
  return Q.ins("app_mag_movimenti", Object.assign({ id: nuovoId("mv"), org: art.org, creato_da: DB.idUtente(), creato: adesso(), data: oggi(), note: "" }, m));
}
async function provaUso(u, id) {
  const z = await Q.uno("app_record", { id: u.mezzo });
  if (!z || z.tipo !== "mezzo") throw new Error("mezzo_non_valido");
  if (u.al && u.al < u.dal) throw new Error("date_non_valide");
  const fine = (x) => x || "9999-12-31";
  for (const x of await Q.sel("app_mezzi_uso", { eq: { mezzo: u.mezzo } })) {
    if (x.id !== id && x.dal <= fine(u.al) && u.dal <= fine(x.al)) throw new Error("mezzo_gia_impegnato");
  }
  if (u.costo_giorno == null) u.costo_giorno = n(z.dati.costo_giorno);
  if (id) return Q.upd("app_mezzi_uso", { id }, u);
  return Q.ins("app_mezzi_uso", Object.assign({ id: nuovoId("uso"), org: z.org, creato_da: DB.idUtente(), creato: adesso(), note: "" }, u));
}

export const MAG = {
  prova: PROVA,
  cantieri: (org) => Q.sel("app_record", { eq: { org, tipo: "cantiere" }, ord: ["creato", false], lim: 200 }),

  /* --- magazzino --- */
  movimenti: (articolo) => Q.sel("app_mag_movimenti", { eq: { articolo }, ord: ["creato", false], lim: 30 }),
  async inCantiere(articolo, cantiere) {
    if (!PROVA) return Number(await Q.rpc("app_mag_in_cantiere", { p_articolo: articolo, p_cantiere: cantiere })) || 0;
    const tutti = await Q.sel("app_mag_movimenti", { eq: { articolo }, lim: 5000 });
    return tondo(tutti.reduce((s, m) => s + (m.a_cantiere === cantiere ? Number(m.quantita) : 0) - (m.da_cantiere === cantiere ? Number(m.quantita) : 0), 0), 3);
  },
  /** Dove si trova la merce: deposito (dalla scheda) e ogni cantiere con quantità > 0. */
  async posizioni(articolo) {
    const tutti = await Q.sel("app_mag_movimenti", { eq: { articolo }, lim: 5000 });
    const per = {};
    tutti.forEach((m) => {
      if (m.a_cantiere) per[m.a_cantiere] = (per[m.a_cantiere] || 0) + Number(m.quantita);
      if (m.da_cantiere) per[m.da_cantiere] = (per[m.da_cantiere] || 0) - Number(m.quantita);
    });
    return Object.entries(per).filter(([, q]) => q > 0.0005).map(([cantiere, q]) => ({ cantiere, quantita: tondo(q, 3) }));
  },
  async muovi(m) {
    const riga = { articolo: m.articolo, tipo: m.tipo, quantita: Number(m.quantita), da_cantiere: m.da_cantiere || null, a_cantiere: m.a_cantiere || null,
      costo_unitario: m.costo_unitario == null || m.costo_unitario === "" ? null : Number(m.costo_unitario), ddt: m.ddt || null, data: m.data || oggi(), note: m.note || "" };
    return PROVA ? provaMovimento(riga) : Q.ins("app_mag_movimenti", riga);
  },

  /* --- mezzi --- */
  usi: (mezzo) => Q.sel("app_mezzi_uso", { eq: { mezzo }, ord: ["dal", false], lim: 50 }),
  usiCantiere: (cantiere) => Q.sel("app_mezzi_uso", { eq: { cantiere }, ord: ["dal", false], lim: 50 }),
  async assegna(u) {
    const riga = { mezzo: u.mezzo, cantiere: u.cantiere, dal: u.dal, al: u.al || null, costo_giorno: n(u.costo_giorno), note: u.note || "" };
    return PROVA ? provaUso(riga) : Q.ins("app_mezzi_uso", riga);
  },
  async chiudiUso(id, d) {
    const patch = { al: d.al || null, ore: n(d.ore), km: n(d.km), litri: n(d.litri), carburante_euro: n(d.carburante_euro) };
    if (!PROVA) return Q.upd("app_mezzi_uso", { id }, patch);
    const u = await Q.uno("app_mezzi_uso", { id });
    return provaUso(Object.assign({}, u, patch), id);
  },

  /* --- costi reali del cantiere --- */
  async costi(cantiere) {
    if (!PROVA) return Q.rpc("app_costi_cantiere", { p_cantiere: cantiere });
    const c = await Q.uno("app_record", { id: cantiere });
    const mov = (await Q.sel("app_mag_movimenti", { lim: 5000 })).filter((m) => m.a_cantiere === cantiere || m.da_cantiere === cantiere);
    const arts = {};
    let mat = 0, senzaCosto = 0;
    for (const m of mov) {
      const segno = m.a_cantiere === cantiere ? 1 : -1;
      if (m.costo_unitario == null) senzaCosto++;
      mat += segno * Number(m.quantita) * (Number(m.costo_unitario) || 0);
      const a = arts[m.articolo] = arts[m.articolo] || { quantita: 0, costo: 0 };
      a.quantita += segno * Number(m.quantita); a.costo += segno * Number(m.quantita) * (Number(m.costo_unitario) || 0);
    }
    const materiali = [];
    for (const [id, v] of Object.entries(arts)) { const a = await Q.uno("app_record", { id }); materiali.push({ articolo: a ? a.titolo : "", unita: a ? a.dati.unita || "" : "", quantita: tondo(v.quantita, 3), costo: tondo(v.costo) }); }
    const usi = await Q.sel("app_mezzi_uso", { eq: { cantiere } });
    let mezziTot = 0, senzaGiorno = 0; const mezzi = [];
    for (const u of usi) {
      if (u.dal > oggi()) continue;
      const fine = u.al && u.al < oggi() ? u.al : oggi();
      const costo = tondo(Math.max(giorniTra(u.dal, fine), 0) * (Number(u.costo_giorno) || 0) + (Number(u.carburante_euro) || 0));
      if (u.costo_giorno == null) senzaGiorno++;
      mezziTot += costo;
      const z = await Q.uno("app_record", { id: u.mezzo });
      mezzi.push({ mezzo: z ? z.titolo : "", dal: u.dal, al: u.al, ore: u.ore, km: u.km, costo });
    }
    let sub = 0;
    for (const s of await Q.sel("app_sopralluoghi", { eq: { cantiere } })) for (const r of await Q.sel("app_sub_richieste", { eq: { sopralluogo: s.id } })) for (const o of await Q.sel("app_sub_offerte", { eq: { richiesta: r.id, stato: "approvata" } })) sub += Number(o.importo);
    const fatt = (await Q.sel("app_fe_documenti", { eq: { cantiere } })).filter((d) => ["fattura", "acconto", "nota_credito"].includes(d.tipo) && d.bloccato).reduce((s, d) => s + (d.tipo === "nota_credito" ? -1 : 1) * Number(d.imponibile || 0), 0);
    const budget = c && c.dati && c.dati.budget != null ? Number(c.dati.budget) : c && c.importo != null ? Number(c.importo) : null;
    const tot = tondo(mat + mezziTot + sub);
    const avvisi = [];
    if (senzaCosto) avvisi.push("Alcuni materiali non hanno un costo: carica gli arrivi con il prezzo.");
    if (senzaGiorno) avvisi.push("Alcuni mezzi non hanno il costo al giorno: scrivilo nella scheda del mezzo.");
    if (budget == null) avvisi.push("Il cantiere non ha un budget.");
    avvisi.push("La manodopera interna non è ancora conteggiata.");
    return { budget, costi: { materiali: tondo(mat), mezzi: tondo(mezziTot), subappalti: sub, totale: tot }, fatturato: tondo(fatt),
      resta_del_budget: budget != null ? tondo(budget - tot) : null, uso_budget_perc: budget > 0 ? Math.round(tot / budget * 1000) / 10 : null, materiali, mezzi, avvisi };
  },
};
