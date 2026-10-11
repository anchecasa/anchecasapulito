/* Rubrica della ditta (app-15). L'elenco Clienti e Fornitori cerca per nome, partita IVA e telefono.
   Il salvataggio di una scheda chiama app_soggetto_in_rubrica: se il database non c'è ancora, la scheda resta com'è. */
import { esc, sez, avviso } from "./ui.js";

export function installa(core) {
  const { V, HOOK, Q } = core;
  const vecchio = V.elenco;
  V.elenco = async (p) => {
    const vista = await vecchio(p);
    const tipo = String(p || "").split("/")[0];
    if (tipo !== "cliente" && tipo !== "fornitore") return vista;
    const cerca = `<label class="campo"><span>Cerca per nome, partita IVA o telefono</span><input data-cerca-rubrica placeholder="Nome, P.IVA, telefono"></label>${avviso(tipo === "fornitore" ? "Fornitori della rubrica e albo delle aziende verificate." : "Clienti della rubrica di questa ditta.")}<div style="height:12px"></div>`;
    vista.h = String(vista.h || "").replace('<div class="pad">', '<div class="pad">' + cerca);
    const dopo = vista.dopo;
    vista.dopo = async (el) => {
      if (dopo) await dopo(el);
      const inp = el.querySelector("[data-cerca-rubrica]");
      if (!inp) return;
      inp.addEventListener("input", () => {
        const q = inp.value.toLowerCase().replace(/\s+/g, "");
        el.querySelectorAll(".lista > *").forEach((nodo) => {
          const t = nodo.textContent.toLowerCase().replace(/\s+/g, "");
          nodo.style.display = !q || t.indexOf(q) >= 0 ? "" : "none";
        });
      });
    };
    return vista;
  };

  async function schedaSoggetto(r) {
    try {
      const righe = await Q.rpc("app_soggetto_scheda", { p_record: r.id });
      if (!Array.isArray(righe) || !righe.length) return "";
      const voci = righe.map((x) => `<div class="card"><b>${esc(x.cosa || "")}</b><p>${esc(x.dettaglio || "")}</p></div>`).join("");
      return sez("Dello stesso soggetto", voci);
    } catch (e) { return ""; }
  }
  HOOK.scheda.cliente = schedaSoggetto;
  HOOK.scheda.fornitore = schedaSoggetto;

  async function dopo(salvata) {
    if (!salvata || !salvata.id) return;
    const d = salvata.dati || {};
    try {
      await Q.rpc("app_soggetto_in_rubrica", {
        p_org: salvata.org,
        p_ruolo: salvata.tipo === "fornitore" ? "fornitore" : salvata.tipo === "subappaltatore" ? "subappaltatore" : "cliente",
        p_nome: salvata.titolo || "",
        p_mail: d.email || d.mail || "",
        p_tel: d.telefono || d.tel || "",
        p_piva: d.piva || d.partita_iva || "",
        p_cf: d.cf || d.codice_fiscale || "",
        p_record: salvata.id
      });
    } catch (e) { /* app-15 non ancora sul database: la scheda resta in app_record */ }
  }
  HOOK.dopoSalva.cliente = dopo;
  HOOK.dopoSalva.fornitore = dopo;
}
