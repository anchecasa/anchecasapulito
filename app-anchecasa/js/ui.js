/* Pezzi dell'interfaccia: icone, componenti, avvisi. */
const P = (d) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const I = {
  casa: P('<path d="M3 11l9-7 9 7"/><path d="M6 10v10h12V10"/>'),
  cerca: P('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  piu: P('<path d="M12 5v14M5 12h14"/>'),
  lista: P('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  utente: P('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'),
  video: P('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>'),
  foto: P('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5-5-8 8"/>'),
  doc: P('<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7"/>'),
  scudo: P('<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>'),
  tel: P('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  box: P('<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>'),
  stella: P('<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>'),
  ufficio: P('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>'),
  campana: P('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  indietro: P('<path d="M15 18l-6-6 6-6"/>'),
  freccia: P('<path d="M9 18l6-6-6-6"/>'),
  allarme: P('<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 18h.01"/>'),
  rete: P('<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M12 7.5v4M12 11.5L6.5 16M12 11.5l5.5 4.5"/>'),
  grafico: P('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  ok: P('<path d="M5 12l5 5 9-10"/>'),
  no: P('<path d="M6 6l12 12M18 6L6 18"/>'),
  mappa: P('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  kit: P('<path d="M8 3l-5 4 3 3 2-1v12h8V9l2 1 3-3-5-4a4 4 0 0 1-8 0z"/>'),
  posizione: P('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/>'),
  esci: P('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>'),
};

/** Toglie i caratteri pericolosi: tutto ciò che arriva da persone o dal database passa di qui. */
export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const voce = (ico, t, s, go, col, dx) =>
  `<div class="card${go ? " tap" : ""}" ${go ? `data-go="${esc(go)}" role="button" tabindex="0"` : ""}><div class="riga"><span class="ico ${col || ""}">${I[ico] || ""}</span><div class="cresci"><b>${t}</b>${s ? `<small>${s}</small>` : ""}</div>${dx || (go ? `<span class="freccia">${I.freccia}</span>` : "")}</div></div>`;
export const lista = (righe) => (righe.length ? `<div class="lista">${righe.join("")}</div>` : "");
export const sez = (titolo, corpo, link) => `<section class="sez"><h2>${titolo}${link || ""}</h2>${corpo}</section>`;
export const stato = (c, t) => `<span class="stato ${c}">${t}</span>`;
export const num = (n, t, c) => `<div class="num ${c || ""}"><b>${n}</b><small>${t}</small></div>`;
export const btn = (t, az, cls, extra) => `<button type="button" class="btn ${cls || ""}" data-az="${esc(az)}" ${extra || ""}>${t}</button>`;
export const campo = (etichetta, input, aiuto) => `<label class="campo"><span>${etichetta}</span>${input}${aiuto ? `<small class="aiuto">${aiuto}</small>` : ""}</label>`;
export const vuoto = (t) => `<div class="vuoto">${t}</div>`;
export const avviso = (t, cls) => `<div class="avviso ${cls || ""}">${t}</div>`;
export const stelle = (v) => {
  const n = Math.round(Number(v) || 0);
  return `<span class="stelle" aria-label="${n} stelle su 5">${"★".repeat(n)}${"☆".repeat(5 - n)}</span>`;
};
export const virgola = (n, d = 1) => (n == null || n === "" ? "–" : Number(n).toFixed(d).replace(".", ","));
export const km = (d) => (d == null ? "" : d < 1 ? Math.round(d * 1000) + " m" : virgola(d) + " km");
export const telLink = (t) => "tel:" + String(t || "").replace(/[^\d+]/g, "");
export const quando = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const oggi = new Date();
  const ore = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === oggi.toDateString()) return "oggi " + ore;
  const ieri = new Date(oggi); ieri.setDate(oggi.getDate() - 1);
  if (d.toDateString() === ieri.toDateString()) return "ieri " + ore;
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
};

export const MESTIERI = [
  ["idraulico", "Idraulico"], ["elettricista", "Elettricista"], ["fabbro", "Fabbro"], ["muratore", "Muratore"],
  ["imbianchino", "Imbianchino"], ["falegname", "Falegname"], ["serramentista", "Serramentista"], ["caldaista", "Caldaista"],
  ["tecnico elettrodomestici", "Tecnico elettrodomestici"], ["tecnico condizionatori", "Tecnico condizionatori"],
  ["vetraio", "Vetraio"], ["giardiniere", "Giardiniere"], ["impresa di pulizie", "Impresa di pulizie"], ["antennista", "Antennista"],
];
/** Nome leggibile del mestiere. Solo valori dell'elenco: un testo sconosciuto diventa "Artigiano" (mai HTML dal database). */
export const nomeMestiere = (m) => (MESTIERI.find((x) => x[0] === m) || [m, "Artigiano"])[1];

let timerToast;
export function toast(testo, tipo) {
  const vecchio = document.querySelector(".toast");
  if (vecchio) vecchio.remove();
  const d = document.createElement("div");
  d.className = "toast" + (tipo === "errore" ? " errore" : "");
  d.setAttribute("role", "status");
  d.textContent = testo;
  document.getElementById("app").appendChild(d);
  clearTimeout(timerToast);
  timerToast = setTimeout(() => d.remove(), 3200);
}

/** Foglio che sale dal basso. Restituisce l'elemento; si chiude con chiudiFoglio(). */
export function foglio(html) {
  chiudiFoglio();
  const v = document.createElement("div");
  v.className = "velo";
  v.innerHTML = `<div class="foglio" role="dialog" aria-modal="true"><div class="maniglia"></div>${html}</div>`;
  v.addEventListener("click", (e) => { if (e.target === v) chiudiFoglio(); });
  document.getElementById("app").appendChild(v);
  return v.querySelector(".foglio");
}
export function chiudiFoglio() {
  document.querySelectorAll(".velo").forEach((v) => v.remove());
}

/** Messaggi d'errore leggibili. */
export function spiegaErrore(e) {
  const m = String((e && (e.message || e.error_description || e.error)) || e || "");
  const mappa = [
    [/Invalid login credentials/i, "Mail o password non corrette."],
    [/Email not confirmed/i, "Prima conferma la mail: ti abbiamo mandato un link."],
    [/User already registered/i, "Con questa mail c'è già un account: entra con la tua password."],
    [/Password should be at least/i, "La password deve avere almeno 8 caratteri."],
    [/rate limit|too many/i, "Troppi tentativi: riprova tra qualche minuto."],
    [/troppe_analisi_oggi/i, "Hai fatto molte analisi oggi: riprova domani."],
    [/Failed to fetch|NetworkError|network/i, "Connessione assente: controlla internet e riprova."],
    [/gia_presa/i, "Un altro artigiano ha già preso questa richiesta."],
    [/richiesta_chiusa/i, "La richiesta è già chiusa."],
    [/da_1_a_5_artigiani/i, "Scegli da 1 a 5 artigiani."],
  ];
  const t = mappa.find((x) => x[0].test(m));
  return t ? t[1] : "Qualcosa non ha funzionato. Riprova.";
}
