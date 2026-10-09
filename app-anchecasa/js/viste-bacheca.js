/* Bacheca: vendita e affitto di case, alloggi per studenti, lavoro. Annunci di tutti gli iscritti. */
import { I, esc, voce, lista, sez, stato, btn, campo, vuoto, avviso, quando, toast, telLink } from "./ui.js";
import { Q } from "./q.js";
import { euro } from "./schede.js";
import { REGIONI } from "./catalogo.js";

const CAT = { vendita: ["casa", "Vendita", "Case in vendita"], affitto: ["doc", "Affitto", "Case e stanze"], studenti: ["corso", "Studenti", "Alloggi vicino all'università"], lavoro: ["ufficio", "Lavoro", "Cerco e offro lavoro"] };

/** Riduce una foto a 1280 px in JPEG, per caricarla leggera. */
function comprimi(file) {
  return new Promise((ok, ko) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1280 / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => (b ? ok(b) : ko(new Error("foto"))), "image/jpeg", 0.8);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => ko(new Error("foto"));
    img.src = URL.createObjectURL(file);
  });
}

export function installa(core) {
  const { S, V, AZIONI, FORM, PROFILO_EXTRA, vai, render } = core;
  const prezzo = (a) => (a.prezzo == null ? "" : euro(a.prezzo) + (a.categoria === "affitto" || a.categoria === "studenti" ? " al mese" : ""));

  V.bacheca = async (cat) => {
    const eq = { stato: "pubblicato" }; if (CAT[cat]) eq.categoria = cat;
    const l = await Q.sel("app_annunci", { eq, ord: ["creato", false], lim: 100 }).catch(() => []);
    const pill = (k, t) => `<button type="button" class="pillola ${k === (cat || "") ? "on" : ""}" data-go="bacheca${k ? "/" + k : ""}">${t}</button>`;
    return {
      t: "Bacheca",
      h: `<div class="pad"><div class="pillole">${pill("", "Tutto")}${Object.entries(CAT).map(([k, v]) => pill(k, v[1])).join("")}</div><div style="height:12px"></div>
        ${btn(I.piu + " Pubblica un annuncio", "go:pubblica-annuncio" + (CAT[cat] ? "/" + cat : ""))}<div style="height:12px"></div>
        ${l.length ? lista(l.map((a) => voce(CAT[a.categoria][0], esc(a.titolo), [prezzo(a), esc(a.citta), quando(a.creato)].filter(Boolean).join(" · "), "annuncio/" + a.id, "blu"))) : vuoto("Nessun annuncio qui, per ora.")}
        <div style="height:12px"></div>${lista([voce("lista", "I miei annunci", "", "miei-annunci", "blu")])}</div>`,
    };
  };
  V.annuncio = async (id) => {
    const a = await Q.uno("app_annunci", { id });
    if (!a) return { t: "Annuncio", h: vuoto("Annuncio non trovato.") };
    const mio = a.autore === S.utente.id;
    return {
      t: CAT[a.categoria][1],
      h: `<div class="pad">${a.foto ? `<div class="fotos" data-foto-annuncio="${esc(a.id)}" data-n="${a.foto}"></div><div style="height:12px"></div>` : ""}
        <div class="card"><h3>${esc(a.titolo)}</h3>${prezzo(a) ? `<p class="prezzo">${prezzo(a)}</p>` : ""}<p>${esc([a.citta, a.regione].filter(Boolean).join(", "))} · ${quando(a.creato)}</p>${a.stato !== "pubblicato" ? `<div style="margin-top:6px">${stato(a.stato === "chiuso" ? "blu" : "rosso", a.stato)}</div>` : ""}</div><div style="height:12px"></div>
        ${a.testo ? `<div class="card"><p>${esc(a.testo).replace(/\n/g, "<br>")}</p></div><div style="height:12px"></div>` : ""}
        ${a.contatto && !mio ? (/@/.test(a.contatto) ? `<a class="btn" href="mailto:${esc(a.contatto)}">Scrivi a ${esc(a.contatto)}</a>` : `<a class="btn" href="${telLink(a.contatto)}">${I.tel} Chiama ${esc(a.contatto)}</a>`) : ""}
        ${mio && a.stato === "pubblicato" ? btn("Chiudi l'annuncio", "annuncio-chiudi:" + a.id, "chiaro") : ""}
        ${S.admin && S.base === "admin" && a.stato === "pubblicato" ? `<div style="height:8px"></div>${btn("Nascondi (admin)", "annuncio-nascondi:" + a.id, "chiaro")}` : ""}
        <p class="sotto piccolo">AncheCasa non verifica gli annunci dei privati: non mandare soldi prima di aver visto la casa o firmato.</p></div>`,
      dopo: async (el) => {
        const box = el.querySelector("[data-foto-annuncio]"); if (!box) return;
        const urls = await Promise.all(Array.from({ length: a.foto }, (_, i) => Q.file.url(a.id + "/" + (i + 1) + ".jpg", "annunci").catch(() => "")));
        box.innerHTML = urls.filter(Boolean).map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="Foto dell'annuncio" loading="lazy"></a>`).join("");
      },
    };
  };
  AZIONI["annuncio-chiudi:"] = async (id) => { await Q.upd("app_annunci", { id }, { stato: "chiuso" }); toast("Annuncio chiuso."); render(); };
  AZIONI["annuncio-nascondi:"] = async (id) => { await Q.upd("app_annunci", { id }, { stato: "nascosto" }); toast("Nascosto."); render(); };
  V["pubblica-annuncio"] = async (cat) => ({
    t: "Pubblica un annuncio",
    h: `<div class="pad"><form data-form="annuncio" novalidate>
      ${campo("Categoria", `<select name="categoria">${Object.entries(CAT).map(([k, v]) => `<option value="${k}" ${k === cat ? "selected" : ""}>${v[1]} · ${v[2]}</option>`).join("")}</select>`)}
      ${campo("Titolo", `<input name="titolo" required maxlength="120">`)}${campo("Descrizione", `<textarea name="testo" maxlength="2000"></textarea>`)}
      ${campo("Prezzo (facoltativo)", `<input name="prezzo" type="number" min="0" step="1">`)}${campo("Città", `<input name="citta" maxlength="80" value="${esc((S.profilo || {}).citta || "")}">`)}
      ${campo("Regione", `<select name="regione"><option value=""></option>${REGIONI.map((r) => `<option>${r}</option>`).join("")}</select>`)}
      ${campo("Come ti contattano (telefono o mail)", `<input name="contatto" maxlength="120">`, "Lo vedono tutti gli iscritti: lascialo vuoto se non vuoi.")}
      <label class="campo"><span>Foto (fino a 6)</span><input type="file" name="foto" accept="image/*" multiple></label>
      <button class="btn" type="submit">Pubblica</button></form></div>`,
  });
  FORM.annuncio = async (f) => {
    if (f.titolo.value.trim().length < 3) return toast("Scrivi un titolo.", "errore");
    const foto = Array.from(f.foto.files || []).slice(0, 6);
    const a = await Q.ins("app_annunci", { autore: S.utente.id, categoria: f.categoria.value, titolo: f.titolo.value.trim(), testo: f.testo.value.trim(), prezzo: f.prezzo.value === "" ? null : Number(f.prezzo.value), citta: f.citta.value.trim(), regione: f.regione.value, contatto: f.contatto.value.trim() });
    let n = 0;
    for (const x of foto) { try { await Q.file.carica(a.id + "/" + (n + 1) + ".jpg", await comprimi(x), "annunci"); n++; } catch (e) { console.error(e); } }
    if (n) await Q.upd("app_annunci", { id: a.id }, { foto: n });
    toast("Annuncio pubblicato."); vai("annuncio/" + a.id, true);
  };
  V["miei-annunci"] = async () => {
    const l = await Q.sel("app_annunci", { eq: { autore: S.utente.id }, ord: ["creato", false] }).catch(() => []);
    return { t: "I miei annunci", h: `<div class="pad">${l.length ? lista(l.map((a) => voce(CAT[a.categoria][0], esc(a.titolo), quando(a.creato), "annuncio/" + a.id, "", stato(a.stato === "pubblicato" ? "verde" : a.stato === "chiuso" ? "blu" : "rosso", a.stato)))) : vuoto("Non hai annunci.")}</div>` };
  };
  PROFILO_EXTRA.push(() => sez("Bacheca", lista([voce("lista", "Annunci: case, stanze, studenti, lavoro", "Guarda e pubblica", "bacheca", "blu")])));
  core.CAT_BACHECA = CAT;
}
