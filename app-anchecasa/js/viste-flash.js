/* Sopralluogo Flash (parte 11, 11.10.2026).
   - Agente: dati della casa, foto/video/planimetrie per stanza, nota vocale, «Analizza», «Invia al cliente» (WhatsApp).
   - Ufficio tecnico (titolare/responsabile della ditta): dossier, computo modificabile e da validare, pratica edilizia,
     ufficio del comune, «Converti in cantiere attivo».
   - Cliente: pagina #/stima/<token> senza password, SOLO marchio AncheCasa; dopo la conversione diventa «il mio cantiere».
   - Admin: prezzari regionali (import CSV) e collegamento lavorazione → voce del prezzario per regione.
   Regola: niente dati inventati. Prezzi solo dai prezzari caricati; vincoli e zona sismica li verifica il tecnico. */
import { I, esc, voce, lista, sez, stato, btn, campo, vuoto, avviso, toast, foglio, chiudiFoglio, spiegaErrore } from "./ui.js";
import { CONFIG } from "./config.js";
import { FL, REGIONI, FINITURE, STILI, TITOLI, UM, tavola, leggiCsv } from "./flash-api.js";

const ERRORI = {
  manca_la_nota_vocale: "Prima registra o carica la nota vocale.",
  troppe_analisi_oggi: "Hai fatto troppe analisi oggi: riprova domani.",
  audio_troppo_lungo: "La nota è troppo lunga: massimo circa 15 minuti.",
  audio_non_trovato: "La nota vocale non si trova più: registrala di nuovo.",
  formato_audio: "Formato audio non adatto: usa la registrazione dell'app.",
  formato_file: "Formato non adatto: foto JPG/PNG, video MP4/WEBM, planimetrie PDF.",
  file_troppo_grande: "File troppo grande: massimo 50 MB.",
  motore_non_configurato: "L'analisi non è ancora attiva: AncheCasa la sta configurando.",
  analisi_non_riuscita: "L'analisi non è riuscita: riprova tra poco.",
  computo_da_validare: "Prima l'ufficio deve controllare e validare il computo.",
  computo_vuoto: "Il computo è vuoto.",
  colonne_mancanti: "Nel file mancano le colonne: servono almeno codice, descrizione e prezzo (prima riga = intestazioni).",
  non_autorizzato: "Non hai i permessi per farlo.",
  accesso_richiesto: "Entra di nuovo nell'app.",
  sopralluogo_annullato: "Il sopralluogo è annullato.",
  preventivo_blindato: "Il preventivo ufficiale è già approvato: il computo non si cambia più.",
};
const errore = (e) => ERRORI[String((e && e.message) || e)] || spiegaErrore(e);
const euro = (n) => (n == null ? "–" : Number(n).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }));
const euro2 = (n) => (n == null ? "–" : Number(n).toLocaleString("it-IT", { style: "currency", currency: "EUR" }));
const data = (d) => (d ? new Date(String(d).length === 10 ? d + "T12:00:00" : d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");
const nomeCliente = (c) => (c ? c.denominazione || [c.nome, c.cognome].filter(Boolean).join(" ") : "") || "Cliente";
const opz = (l, v) => l.map(([k, t]) => `<option value="${esc(k)}" ${String(v ?? "") === String(k) ? "selected" : ""}>${esc(t)}</option>`).join("");
const STATI = { programmato: ["Da fare", "blu"], completato: ["Fatto", "verde"], in_ufficio: ["In ufficio", "giallo"], budget_ok: ["Ok budget dal cliente", "verde"], convertito: ["Convertito", "verde"], annullato: ["Annullato", "rosso"] };

function stile() {
  if (document.getElementById("stile-flash")) return;
  const s = document.createElement("style");
  s.id = "stile-flash";
  s.textContent = `
  .fl-scelte{display:flex;gap:6px;flex-wrap:wrap}
  .fl-scelte label{flex:1;min-width:80px}
  .fl-scelte input{position:absolute;opacity:0}
  .fl-scelte span{display:block;text-align:center;border:1.5px solid var(--linea);background:#fff;border-radius:12px;padding:10px 8px;font-weight:700;color:var(--blu);cursor:pointer}
  .fl-scelte input:checked+span{background:var(--blu);border-color:var(--blu);color:#fff}
  .fl-scelte input:focus-visible+span{outline:3px solid var(--arancio);outline-offset:2px}
  .fl-rec{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e7ecf3;border-radius:14px;padding:12px}
  .fl-rec .tondo{width:56px;height:56px;border-radius:50%;border:0;background:var(--arancio);color:#fff;display:grid;place-items:center;cursor:pointer;flex:0 0 auto}
  .fl-rec .tondo.on{background:var(--rosso);animation:fl-pulsa 1.2s infinite}
  .fl-rec b{font:800 20px var(--titoli);color:var(--blu);font-variant-numeric:tabular-nums}
  .fl-rec audio{width:100%}
  @keyframes fl-pulsa{50%{box-shadow:0 0 0 10px rgba(210,57,43,.15)}}
  @media (prefers-reduced-motion:reduce){.fl-rec .tondo.on{animation:none}}
  .fl-testo{background:#fff;border:1px solid #e7ecf3;border-radius:14px;padding:12px 14px;font-size:14px;line-height:1.55;white-space:pre-line;max-height:260px;overflow:auto}
  .fl-righe{background:#fff;border:1px solid #e7ecf3;border-radius:14px;overflow:hidden}
  .fl-righe div{display:flex;justify-content:space-between;gap:10px;padding:9px 12px;border-bottom:1px solid #f0f3f7;font-size:14px}
  .fl-righe div:last-child{border-bottom:0}
  .fl-righe small{color:var(--grigio)}
  .fl-righe .zero{color:var(--rosso);font-weight:700}
  .fl-forbice{background:var(--blu);color:#fff;border-radius:18px;padding:16px}
  .fl-forbice small{display:block;opacity:.8;font-size:12px;text-transform:uppercase;letter-spacing:.06em;font-weight:700}
  .fl-forbice b{display:block;font:800 26px/1.15 var(--titoli);margin:4px 0}
  .fl-forbice p{margin:6px 0 0;font-size:13px;opacity:.9}
  .fl-media{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
  .fl-media a,.fl-media div{position:relative;display:block;aspect-ratio:1;border-radius:10px;overflow:hidden;background:var(--carta)}
  .fl-media img,.fl-media video{width:100%;height:100%;object-fit:cover}
  .fl-media span{position:absolute;left:4px;bottom:4px;background:rgba(11,26,44,.7);color:#fff;font-size:11px;font-weight:700;padding:2px 6px;border-radius:6px}
  .fl-media .pdf{display:grid;place-items:center;font-weight:800;color:var(--blu)}
  .fl-riga{background:#fff;border:1px solid #e7ecf3;border-radius:14px;padding:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
  .fl-riga .tutta{grid-column:1/-1}
  .fl-riga input,.fl-riga select{font:inherit;border:1.5px solid var(--linea);border-radius:10px;padding:9px;min-height:44px;width:100%;background:#fff}
  .fl-riga label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:700;color:var(--grigio)}
  .fl-mappa{display:grid;grid-template-columns:1fr;gap:8px}
  .fl-mappa .card small{display:block;color:var(--grigio)}
  .fl-mappa select,.fl-mappa input{font:inherit;border:1.5px solid var(--linea);border-radius:10px;padding:9px;min-height:44px;width:100%;background:#fff}
  /* Pagina del cliente */
  .st{min-height:100%;background:var(--carta);padding:0 0 30px}
  .st-testa{background:#fff;padding:22px 18px 18px;border-bottom:1px solid var(--linea)}
  .st-testa img{height:34px}
  .st-testa h1{font:800 24px/1.15 var(--titoli);color:var(--blu);margin:16px 0 4px}
  .st-testa p{color:var(--grigio);margin:0;font-size:14.5px}
  .st-corpo{padding:16px 16px 0;display:flex;flex-direction:column;gap:14px}
  .st-card{background:#fff;border-radius:18px;padding:16px;border:1px solid #e7ecf3}
  .st-card h2{font-size:15px;color:var(--blu);margin:0 0 10px}
  .st-forbice{background:var(--blu);color:#fff;border:0}
  .st-forbice small{display:block;opacity:.8;font-size:12px;text-transform:uppercase;letter-spacing:.06em;font-weight:700}
  .st-forbice b{display:block;font:800 30px/1.1 var(--titoli);margin:6px 0 8px}
  .st-forbice p{margin:0;font-size:13.5px;opacity:.92}
  .st-colori{display:flex;border-radius:12px;overflow:hidden;height:56px;margin-bottom:10px}
  .st-colori i{flex:1}
  .st-pill{display:inline-block;background:var(--carta);color:var(--blu);border-radius:999px;padding:5px 10px;font-size:13px;font-weight:700;margin:0 6px 6px 0}
  .st-barra{height:10px;border-radius:9px;background:var(--carta);overflow:hidden;margin:6px 0 2px}
  .st-barra i{display:block;height:100%;background:var(--arancio);border-radius:9px}
  .st-piede{text-align:center;color:var(--grigio);font-size:12.5px;padding:18px 16px 0}
  `;
  document.head.appendChild(s);
}

export function installa(core) {
  const { S, V, AZIONI, FORM, vai, render } = core;
  stile();
  const io = () => core.DB.idUtente();
  // Chi gestisce la ditta (titolare o responsabile) o l'admin: è «l'ufficio». Il database controlla comunque.
  const gestisco = (org) => !!S.admin || ((S.miei && S.miei.org) || []).some((o) => o.id === org && ["titolare", "responsabile"].includes(o.ruolo));
  const vedoFlash = (s) => s && (s.agente === io() || gestisco(s.org));

  /* ====================================================================== */
  /* Collegamenti dalle schermate che esistono già                          */
  /* ====================================================================== */
  if (V.pratica) {
    const praticaVecchia = V.pratica;
    V.pratica = async (id) => {
      const out = await praticaVecchia(id);
      try {
        const s = await FL.sopralluogo(id);
        if (!out || !out.h || !vedoFlash(s)) return out;
        const b = [];
        if (!["convertito", "annullato"].includes(s.stato)) b.push(btn(I.video + " Sopralluogo Flash: nota vocale e stima", "go:so-flash/" + id));
        if (gestisco(s.org)) b.push(btn(I.ufficio + " Dossier per l'ufficio tecnico", "go:so-dossier/" + id, "blu"));
        const st = STATI[s.stato];
        const riga = st && ["in_ufficio", "budget_ok"].includes(s.stato) ? `<p class="sotto">${stato(st[1], st[0])}</p>` : "";
        out.h = out.h.replace('<div class="btns" style="flex-direction:column;gap:8px">', `${riga}<div class="btns" style="flex-direction:column;gap:8px">${b.join("")}`);
      } catch (e) { console.warn("flash", e); }
      return out;
    };
    V["so-vedi"] = V.pratica;
  }
  if (V.so) {
    const soVecchio = V.so;
    V.so = async (...a) => {
      const out = await soVecchio(...a);
      try {
        if (!S.org || !gestisco(S.org) || !out || !out.h) return out;
        const tutti = await core.Q.sel("app_sopralluoghi", { eq: { org: S.org }, ord: ["quando", false], lim: 200 });
        const dossier = tutti.filter((s) => ["in_ufficio", "budget_ok"].includes(s.stato));
        if (dossier.length) {
          const righe = dossier.map((s) => voce("ufficio", esc(nomeCliente(s.cliente_dati)) + (s.lavori ? " · " + esc(s.lavori) : ""), `${esc(s.comune || s.indirizzo || "")} · ${data(s.in_ufficio_il || s.quando)}${s.stima_min != null ? " · " + euro(s.stima_min) + "–" + euro(s.stima_max) : ""}`, "so-dossier/" + s.id, s.stato === "budget_ok" ? "verde" : "arancio", stato(STATI[s.stato][1], STATI[s.stato][0])));
          out.h = out.h.replace('<div class="pad">', `<div class="pad">${sez("Dossier da lavorare", lista(righe))}`);
        }
      } catch (e) { console.warn("flash", e); }
      return out;
    };
  }
  if (V["ad-home"]) {
    const adVecchio = V["ad-home"];
    V["ad-home"] = async (...a) => {
      const out = await adVecchio(...a);
      if (out && out.h) out.h = out.h.replace('<div class="pad">', `<div class="pad">${lista([voce("doc", "Prezzari regionali per la stima", "Importa il prezzario della Regione e collega le lavorazioni", "ad-prezzari", "blu")])}<div style="height:12px"></div>`);
      return out;
    };
  }

  /* ====================================================================== */
  /* AGENTE: Sopralluogo Flash                                               */
  /* ====================================================================== */
  let rec = null; // registrazione in corso

  V["so-flash"] = async (id) => {
    await FL.semina();
    const s = await FL.sopralluogo(id);
    if (!s || !vedoFlash(s)) return { t: "Sopralluogo Flash", h: `<div class="pad">${vuoto("Sopralluogo non trovato.")}</div>` };
    const [media, audioUrl, pr] = await Promise.all([FL.media(id).catch(() => []), FL.urlAudio(s.audio).catch(() => ""), FL.pratica(id).catch(() => null)]);
    const chiuso = ["convertito", "annullato"].includes(s.stato);
    const fin = s.finitura || "medio";
    const computo = s.computo || [];
    const fatto = !!s.trascrizione;
    const st = STATI[s.stato] || ["", "blu"];
    return {
      t: "Sopralluogo Flash",
      h: `<div class="pad">
        <h2 class="saluto" style="font-size:20px">${esc(nomeCliente(s.cliente_dati))}</h2>
        <p class="sotto">${esc(s.lavori || "")}${s.indirizzo ? " · " + esc(s.indirizzo) : ""} ${stato(st[1], st[0])}</p>
        ${sez("1. La casa", `<form data-form="fl-dati" data-id="${esc(id)}" novalidate>
          <div class="griglia2">${campo("Comune", `<input name="comune" maxlength="60" value="${esc(s.comune || "")}" placeholder="es. Monterotondo" ${chiuso ? "disabled" : ""}>`)}
          ${campo("Regione", `<select name="regione" ${chiuso ? "disabled" : ""}><option value="">Scegli</option>${opz(REGIONI.map((r) => [r, r]), s.regione)}</select>`, "Serve per il prezzario.")}</div>
          ${campo("Superficie (mq)", `<input name="mq" type="number" inputmode="decimal" min="1" max="100000" step="0.5" value="${esc(s.mq ?? "")}" ${chiuso ? "disabled" : ""}>`)}
          <div class="campo"><span>Finitura</span><div class="fl-scelte" role="radiogroup" aria-label="Finitura">${FINITURE.map(([k, t]) => `<label><input type="radio" name="finitura" value="${k}" ${fin === k ? "checked" : ""} ${chiuso ? "disabled" : ""}><span>${t}</span></label>`).join("")}</div></div>
          ${campo("Stile che piace al cliente", `<select name="stile" ${chiuso ? "disabled" : ""}>${opz(STILI, s.stile)}</select>`)}
          ${chiuso ? "" : `<button class="btn chiaro" type="submit">Salva i dati della casa</button>`}
        </form>`)}
        ${sez("2. Foto, video e planimetrie", `${mediaHtml(media)}
          ${chiuso ? "" : `<div style="height:10px"></div><div class="card">
            ${campo("Stanza", `<input id="fl-stanza" maxlength="40" placeholder="es. bagno, cucina, soggiorno">`)}
            ${campo("File", `<input id="fl-file" type="file" accept="image/jpeg,image/png,video/mp4,video/webm,application/pdf" multiple>`, "Foto, video brevi o la planimetria in PDF. Massimo 50 MB ciascuno.")}
            ${btn(I.foto + " Carica nella stanza", "fl-media:" + id, "chiaro")}</div>`}`)}
        ${sez("3. Nota vocale", `${chiuso ? "" : `<div class="fl-rec"><button type="button" class="tondo" data-az="fl-rec:${esc(id)}" aria-label="Registra la nota vocale">${I.chat}</button>
            <div style="flex:1;min-width:0"><b data-tempo>${s.audio ? "Nota salvata" : "Premi e parla"}</b><div class="sotto" style="margin:0;font-size:13px" data-rec-testo>Descrivi stanza per stanza: misure, cosa togliere, cosa rifare. Max 10 minuti.</div></div></div>`}
          ${audioUrl ? `<div style="height:8px"></div><audio controls preload="none" src="${esc(audioUrl)}" style="width:100%"></audio>` : s.audio ? "" : ""}
          ${chiuso ? "" : `<div style="height:8px"></div>${campo("Oppure carica una nota già registrata", `<input id="fl-audio" type="file" accept="audio/*">`)}`}
          <p class="sotto" style="font-size:12.5px">La nota va all'AI per la trascrizione. Si tiene ${s.audio_scade ? "fino al " + data(s.audio_scade) : "90 giorni"}, poi resta solo il testo.</p>
          ${!chiuso && s.audio ? btn(I.ok + (fatto ? " Analizza di nuovo" : " Analizza la nota"), "fl-analizza:" + id, fatto ? "chiaro" : "") : ""}`)}
        ${fatto ? sez("4. Cosa ha capito l'AI", `
          <div class="fl-testo">${esc(s.trascrizione)}</div><div style="height:10px"></div>
          ${computo.length ? `<div class="fl-righe">${computo.map((r) => `<div><span>${esc(r.descrizione || r.lavorazione)}${r.stanza ? ` <small>· ${esc(r.stanza)}</small>` : ""}</span><span class="${Number(r.quantita) ? "" : "zero"}">${Number(r.quantita) ? esc(String(r.quantita).replace(".", ",")) + " " + esc(r.um || "") : "da misurare"}</span></div>`).join("")}</div>` : vuoto("Nessuna lavorazione riconosciuta.")}
          ${s.computo_validato ? `<p class="sotto" style="margin-top:8px">${stato("verde", "Computo controllato dall'ufficio")}</p>` : `<p class="sotto" style="margin-top:8px">L'ufficio tecnico controlla e corregge il computo.</p>`}
          ${pr ? `<div class="card"><b>Titolo edilizio ${pr.titolo_da === "tecnico" ? "confermato dal tecnico" : "suggerito (da confermare)"}:</b> ${esc(TITOLI[pr.titolo] || pr.titolo)}${pr.titolo_motivo ? `<br><small class="sotto">${esc(pr.titolo_motivo)}</small>` : ""}</div><div style="height:10px"></div>` : ""}
          ${stimaHtml(s)}`) : ""}
        ${sez("5. Invia all'ufficio e al cliente", `${s.link ? `<p class="sotto">Il link è già stato creato${s.link_scade ? " e vale fino al " + data(s.link_scade) : ""}.</p>` : `<p class="sotto">L'ufficio riceve il dossier. Il cliente riceve un link con la stima di massima: vede solo il marchio AncheCasa.</p>`}
          ${s.stima_min == null ? avviso("La stima non c'è ancora: il cliente vedrà «stima in preparazione».", "") + '<div style="height:10px"></div>' : ""}
          ${chiuso && !s.link ? "" : btn(I.chat + (s.link ? " Rimanda il link al cliente" : " Invia all'ufficio e al cliente"), "fl-invia:" + id)}`)}
        <!--sub-agente-->
      </div>`,
      dopo: (el) => {
        const a = el.querySelector("#fl-audio");
        if (a) a.addEventListener("change", async () => {
          const f = a.files && a.files[0];
          if (!f) return;
          if (f.size > 50 * 1024 * 1024) return toast(ERRORI.file_troppo_grande, "errore");
          try { toast("Carico la nota…"); await FL.caricaAudio(id, f); toast("Nota salvata. Ora premi «Analizza la nota»."); render(); } catch (e) { toast(errore(e), "errore"); }
        });
      },
    };
  };

  function mediaHtml(media) {
    if (!media.length) return vuoto("Nessun file ancora.");
    const perStanza = {};
    media.forEach((m) => { (perStanza[m.stanza || "Generale"] = perStanza[m.stanza || "Generale"] || []).push(m); });
    return Object.entries(perStanza).map(([st, l]) => `<p class="sotto" style="margin:8px 0 6px;font-weight:700;color:var(--blu)">${esc(st)}</p><div class="fl-media">${l.map((m) => `<div data-media="${esc(m.file)}" data-tipo="${esc(m.tipo)}">${m.tipo === "planimetria" ? `<div class="pdf">PDF</div>` : ""}<span>${m.tipo === "foto" ? "Foto" : m.tipo === "video" ? "Video" : "Planimetria"}</span></div>`).join("")}</div>`).join("");
  }
  // Le anteprime si caricano dopo (link firmati): così la schermata appare subito.
  async function anteprime(el) {
    for (const d of el.querySelectorAll("[data-media]")) {
      try {
        const u = await FL.urlMedia(d.dataset.media);
        if (!u) continue;
        const etichetta = d.querySelector("span").outerHTML;
        if (d.dataset.tipo === "foto") d.innerHTML = `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="Foto del sopralluogo" loading="lazy"></a>${etichetta}`;
        else if (d.dataset.tipo === "video") d.innerHTML = `<video src="${esc(u)}" controls preload="metadata"></video>${etichetta}`;
        else d.innerHTML = `<a class="pdf" href="${esc(u)}" target="_blank" rel="noopener">PDF</a>${etichetta}`;
      } catch (e) { /* niente */ }
    }
  }
  const soFlashVista = V["so-flash"];
  V["so-flash"] = async (id) => { const out = await soFlashVista(id); const d = out.dopo; out.dopo = async (el) => { if (d) await d(el); anteprime(el); }; return out; };

  function stimaHtml(s) {
    const note = (s.stima_note || []).filter(Boolean);
    return `${s.stima_min != null ? `<div class="fl-forbice"><small>Stima di massima · finitura ${esc((FINITURE.find((f) => f[0] === s.finitura) || [, ""])[1].toLowerCase())}</small><b>${euro(s.stima_min)} – ${euro(s.stima_max)}</b><p>Prezzi dal prezzario della Regione ${esc(s.regione || "")}. Non è un preventivo.</p></div>` : avviso("Stima non disponibile: mancano i prezzi o le quantità.", "")}
      ${note.length ? `<div style="height:8px"></div>${avviso(note.map(esc).join("<br>"), "")}` : ""}`;
  }

  FORM["fl-dati"] = async (f) => {
    const mq = f.mq.value ? Number(String(f.mq.value).replace(",", ".")) : null;
    if (mq != null && !(mq >= 1 && mq <= 100000)) return toast("Superficie non valida.", "errore");
    const fin = f.querySelector('input[name="finitura"]:checked');
    try {
      await FL.salva(f.dataset.id, { comune: f.comune.value.trim().slice(0, 60), regione: f.regione.value, mq, finitura: fin ? fin.value : "medio", stile: f.stile.value });
      const s = await FL.sopralluogo(f.dataset.id);
      if ((s.computo || []).length) await FL.stima(f.dataset.id).catch(() => {});
      toast("Dati salvati."); render();
    } catch (e) { toast(errore(e), "errore"); }
  };

  AZIONI["fl-media:"] = async (id) => {
    const inp = document.getElementById("fl-file");
    const files = [...((inp && inp.files) || [])];
    if (!files.length) return toast("Scegli prima i file.", "errore");
    const stanza = (document.getElementById("fl-stanza") || {}).value || "";
    let ok = 0;
    toast("Carico " + files.length + (files.length === 1 ? " file…" : " file…"));
    for (const f of files.slice(0, 20)) { try { await FL.caricaMedia(id, f, stanza); ok++; } catch (e) { toast(errore(e), "errore"); } }
    if (ok) toast(`Caricati ${ok} file${stanza ? " in «" + stanza + "»" : ""}.`);
    render();
  };

  AZIONI["fl-rec:"] = async (id) => {
    const b = document.querySelector(`[data-az="fl-rec:${id}"]`);
    const t = document.querySelector("[data-tempo]"), tx = document.querySelector("[data-rec-testo]");
    if (rec) { rec.ferma(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) return toast("Questo telefono non registra dall'app: usa «carica una nota già registrata».", "errore");
    let flusso;
    try { flusso = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return toast("Serve il permesso del microfono.", "errore"); }
    const tipo = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((x) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(x)) || "";
    const mr = new MediaRecorder(flusso, tipo ? { mimeType: tipo, audioBitsPerSecond: 32000 } : undefined);
    const pezzi = []; const via = Date.now();
    mr.ondataavailable = (e) => { if (e.data && e.data.size) pezzi.push(e.data); };
    const orologio = setInterval(() => {
      const sec = Math.floor((Date.now() - via) / 1000);
      if (t) t.textContent = "● " + String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
      if (sec >= 600) rec && rec.ferma();
    }, 500);
    mr.onstop = async () => {
      clearInterval(orologio); flusso.getTracks().forEach((x) => x.stop()); rec = null;
      if (b) { b.classList.remove("on"); b.setAttribute("aria-label", "Registra la nota vocale"); }
      const blob = new Blob(pezzi, { type: (mr.mimeType || tipo || "audio/webm").split(";")[0] });
      if (blob.size < 2000) { if (t) t.textContent = "Troppo corta"; return; }
      if (t) t.textContent = "Salvo…";
      try { await FL.caricaAudio(id, blob); toast("Nota salvata. Ora premi «Analizza la nota»."); render(); } catch (e) { if (t) t.textContent = "Non salvata"; toast(errore(e), "errore"); }
    };
    rec = { ferma: () => { if (mr.state !== "inactive") mr.stop(); } };
    mr.start(1000);
    if (b) { b.classList.add("on"); b.setAttribute("aria-label", "Ferma la registrazione"); }
    if (tx) tx.textContent = "Sto registrando. Premi di nuovo per fermare.";
  };

  AZIONI["fl-analizza:"] = async (id) => {
    const b = document.querySelector(`[data-az="fl-analizza:${id}"]`);
    if (b) { b.disabled = true; b.textContent = "L'AI sta ascoltando… (fino a un minuto)"; }
    try {
      const r = await FL.analizza(id);
      toast(r.computo_tenuto ? "Trascrizione aggiornata. Il computo validato dall'ufficio non è stato toccato." : "Fatto: controlla trascrizione e computo.");
      await render(); // prima ridisegna, poi apre il foglio (render chiude i fogli aperti)
      if (r.dubbi && r.dubbi.length) foglio(`<h2>Da chiarire</h2><p class="sotto">L'AI non ha capito bene questi punti: aggiungili a voce o scrivili all'ufficio.</p><div class="fl-righe">${r.dubbi.map((d) => `<div><span>${esc(d)}</span></div>`).join("")}</div><div style="height:12px"></div>${btn("Ho capito", "fl-chiudi")}`);
    } catch (e) { toast(errore(e), "errore"); if (b) { b.disabled = false; b.textContent = "Analizza la nota"; } }
  };
  AZIONI["fl-chiudi"] = () => chiudiFoglio();

  AZIONI["fl-invia:"] = async (id) => {
    let tok;
    try { tok = await FL.invia(id); } catch (e) { return toast(errore(e), "errore"); }
    const s = await FL.sopralluogo(id);
    const link = FL.linkCliente(tok);
    const nome = (s.cliente_dati || {}).nome || "";
    const testo = `Buongiorno${nome ? " " + nome : ""}, ecco la stima di massima dei lavori dopo il sopralluogo di AncheCasa: ${link}`;
    const tel = String((s.cliente_dati || {}).telefono || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
    const numero = tel ? (tel.length <= 10 ? "39" + tel : tel) : "";
    foglio(`<h2>Link pronto</h2><p class="sotto">Il dossier è arrivato all'ufficio tecnico. Manda il link al cliente: vale ${s.link_scade ? "fino al " + data(s.link_scade) : "60 giorni"}.</p>
      <div class="fl-testo" style="max-height:none;word-break:break-all">${esc(link)}</div><div style="height:12px"></div>
      <a class="btn" href="https://wa.me/${esc(numero)}?text=${encodeURIComponent(testo)}" target="_blank" rel="noopener">${I.chat} Manda su WhatsApp</a><div style="height:8px"></div>
      ${btn("Copia il link", "fl-copia:" + tok, "chiaro")}<div style="height:8px"></div>${btn("Chiudi", "fl-chiudi-r", "chiaro")}`);
  };
  AZIONI["fl-copia:"] = async (tok) => { try { await navigator.clipboard.writeText(FL.linkCliente(tok)); toast("Link copiato."); } catch (e) { toast("Non riesco a copiare: tieni premuto sul link.", "errore"); } };
  AZIONI["fl-chiudi-r"] = () => { chiudiFoglio(); render(); };

  /* ====================================================================== */
  /* UFFICIO TECNICO: dossier                                                */
  /* ====================================================================== */
  V["so-dossier"] = async (id) => {
    await FL.semina();
    const s = await FL.sopralluogo(id);
    if (!s || !gestisco(s.org)) return { t: "Dossier", h: `<div class="pad">${vuoto("Dossier non trovato o non è della tua ditta.")}</div>` };
    const [lav, media, audioUrl, pr, sue] = await Promise.all([FL.lavorazioni(), FL.media(id).catch(() => []), FL.urlAudio(s.audio).catch(() => ""), FL.pratica(id).catch(() => null), FL.sue(s.comune).catch(() => null)]);
    const chiuso = !!s.cantiere || s.stato === "annullato";
    const p = pr || { titolo: "da_verificare", titolo_motivo: "", titolo_da: "ai", vincolo_paesaggistico: "da_verificare", zona_sismica: "da_verificare", altri_vincoli: "", note: "" };
    const lavOpz = [["", "Altro (descrivi)"]].concat(lav.filter((l) => l.attiva !== false).map((l) => [l.chiave, l.nome + " (" + l.um + ")"]));
    const rigaHtml = (r) => `<div class="fl-riga" data-riga>
      <label class="tutta">Lavorazione<select name="lavorazione" ${chiuso ? "disabled" : ""}>${opz(lavOpz, r.lavorazione || "")}</select></label>
      <label class="tutta">Descrizione<input name="descrizione" maxlength="120" value="${esc(r.descrizione || "")}" ${chiuso ? "disabled" : ""}></label>
      <label>Quantità<input name="quantita" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(r.quantita ?? 0)}" ${chiuso ? "disabled" : ""}></label>
      <label>Unità<select name="um" ${chiuso ? "disabled" : ""}>${opz(UM.map((u) => [u, u]), r.um || "corpo")}</select></label>
      <label>Stanza<input name="stanza" maxlength="40" value="${esc(r.stanza || "")}" ${chiuso ? "disabled" : ""}></label>
      <label class="tutta">Prezzo unitario (vuoto = dal prezzario)<input name="prezzo" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(r.prezzo ?? "")}" placeholder="dal prezzario della regione" ${chiuso ? "disabled" : ""}></label>
      ${chiuso ? "" : `<button type="button" class="btn chiaro piccolo tutta" data-via>Togli questa voce</button>`}</div>`;
    const sa = s.stato === "convertito" ? (s.cantiere ? ["Cantiere aperto", "verde"] : ["Preventivo pronto", "verde"]) : STATI[s.stato] || ["", "blu"];
    return {
      t: "Dossier ufficio tecnico",
      h: `<div class="pad">
        <h2 class="saluto" style="font-size:20px">${esc(nomeCliente(s.cliente_dati))}</h2>
        <p class="sotto">${esc(s.lavori || "")} ${stato(sa[1], sa[0])}</p>
        <div class="card"><small class="sotto">Dove</small><div><b>${esc(s.indirizzo || "–")}</b>${s.comune ? " · " + esc(s.comune) : ""}${s.regione ? " (" + esc(s.regione) + ")" : ""}</div>
          <div style="margin-top:6px">${s.mq ? esc(String(s.mq).replace(".", ",")) + " mq · " : ""}finitura ${esc(s.finitura || "medio")}${s.stile ? " · " + esc((STILI.find((x) => x[0] === s.stile) || [, ""])[1]) : ""}</div>
          ${s.budget_ok_il ? `<div style="margin-top:6px">${stato("verde", "Il cliente ha dato l'ok al budget il " + data(s.budget_ok_il))}</div>` : ""}
          ${chiuso ? "" : `<div style="height:8px"></div>${btn("Modifica dati, foto e nota", "go:so-flash/" + id, "chiaro piccolo")}`}</div>
        <div style="height:16px"></div>
        ${sez("Nota vocale e trascrizione", `${audioUrl ? `<audio controls preload="none" src="${esc(audioUrl)}" style="width:100%"></audio><div style="height:8px"></div>` : ""}
          ${s.trascrizione ? `<div class="fl-testo">${esc(s.trascrizione)}</div>` : vuoto("Nessuna trascrizione: l'agente non ha ancora analizzato la nota.")}`)}
        ${sez("Computo", `<form data-form="fl-computo" data-id="${esc(id)}" novalidate>
          <div class="fe-righe" data-righe style="display:flex;flex-direction:column;gap:10px">${(s.computo || []).map(rigaHtml).join("") || ""}</div>
          <template data-modello>${rigaHtml({ quantita: 0, um: "mq" })}</template>
          ${chiuso ? "" : `<div style="height:10px"></div>${btn(I.piu + " Aggiungi una voce", "fl-riga-piu", "chiaro")}
          <div style="height:12px"></div><label class="riga" style="display:flex;gap:10px;align-items:center"><input type="checkbox" name="validato" ${s.computo_validato ? "checked" : ""} style="width:22px;height:22px"> <b>Computo controllato: si può convertire</b></label>
          <div style="height:12px"></div><button class="btn" type="submit">Salva e ricalcola la stima</button>`}
        </form><div style="height:12px"></div>${stimaHtml(s)}`)}
        ${sez("Foto, video e planimetrie", mediaHtml(media))}
        ${sez("Pratica edilizia", `<form data-form="fl-pratica" data-id="${esc(id)}" novalidate>
          ${p.titolo_da === "ai" && pr ? avviso("Titolo suggerito dall'AI: confermalo o correggilo. Quando salvi diventa «confermato dal tecnico».", "") + '<div style="height:10px"></div>' : ""}
          ${campo("Titolo edilizio previsto", `<select name="titolo" ${chiuso ? "disabled" : ""}>${opz(Object.entries(TITOLI), p.titolo)}</select>`)}
          ${campo("Perché", `<textarea name="titolo_motivo" maxlength="500" ${chiuso ? "disabled" : ""}>${esc(p.titolo_motivo || "")}</textarea>`)}
          <div class="griglia2">${campo("Vincolo paesaggistico", `<select name="vincolo_paesaggistico" ${chiuso ? "disabled" : ""}>${opz([["da_verificare", "Da verificare"], ["si", "Sì"], ["no", "No"]], p.vincolo_paesaggistico)}</select>`)}
          ${campo("Zona sismica", `<select name="zona_sismica" ${chiuso ? "disabled" : ""}>${opz([["da_verificare", "Da verificare"], ["1", "Zona 1"], ["2", "Zona 2"], ["3", "Zona 3"], ["4", "Zona 4"]], p.zona_sismica)}</select>`)}</div>
          ${campo("Altri vincoli", `<input name="altri_vincoli" maxlength="500" value="${esc(p.altri_vincoli || "")}" placeholder="es. centro storico, condominio" ${chiuso ? "disabled" : ""}>`)}
          ${campo("Note per la pratica", `<textarea name="note" maxlength="1000" ${chiuso ? "disabled" : ""}>${esc(p.note || "")}</textarea>`, "Verifica vincoli e zona sismica sul sito del Comune e della Regione (cartografia ufficiale).")}
          ${p.verificato_il ? `<p class="sotto">Confermato il ${data(p.verificato_il)}.</p>` : ""}
          ${chiuso ? "" : `<button class="btn chiaro" type="submit">Salva la pratica</button>`}
        </form>`)}
        ${sez("Ufficio tecnico del Comune" + (s.comune ? " di " + esc(s.comune) : ""), s.comune ? `<form data-form="fl-sue" data-comune="${esc(s.comune)}" novalidate>
          <p class="sotto">Scrivilo una volta: vale per tutti i sopralluoghi in questo comune. Prendi i dati dal sito ufficiale del Comune.</p>
          <div class="griglia2">${campo("Ufficio", `<input name="ufficio" maxlength="120" value="${esc((sue || {}).ufficio || "")}" placeholder="es. Sportello Unico Edilizia">`)}${campo("Provincia (sigla)", `<input name="provincia" maxlength="2" style="text-transform:uppercase" value="${esc((sue || {}).provincia || "")}">`)}</div>
          <div class="griglia2">${campo("PEC", `<input name="pec" type="email" maxlength="120" value="${esc((sue || {}).pec || "")}">`)}${campo("Telefono", `<input name="telefono" type="tel" maxlength="30" value="${esc((sue || {}).telefono || "")}">`)}</div>
          ${campo("Sito", `<input name="sito" type="url" maxlength="200" value="${esc((sue || {}).sito || "")}" placeholder="https://">`)}
          <button class="btn chiaro" type="submit">Salva l'ufficio del Comune</button></form>` : vuoto("Manca il comune nei dati della casa."))}
        <!--sub-ufficio-->
        ${s.cantiere ? `${avviso("Cantiere attivo" + " · il cliente vede l'avanzamento dallo stesso link.", "")}<div style="height:10px"></div>${btn(I.gru + " Apri il cantiere", "go:scheda/" + s.cantiere, "blu")}`
          : s.stato === "annullato" ? "" : `<div style="height:6px"></div>${btn(I.gru + " Converti in cantiere attivo", "fl-converti:" + id)}
          <p class="sotto" style="margin-top:8px">Crea il preventivo dal computo (se non c'è), lo segna accettato, apre il cantiere con codice e budget, e prepara il fascicolo di sicurezza.</p>`}
      </div>`,
      dopo: (el) => {
        anteprime(el);
        const box = el.querySelector("[data-righe]");
        if (!box) return;
        box.addEventListener("click", (e) => { const v = e.target.closest("[data-via]"); if (v) v.closest("[data-riga]").remove(); });
        box.addEventListener("change", (e) => {
          if (e.target.name !== "lavorazione") return;
          const l = lav.find((x) => x.chiave === e.target.value);
          const r = e.target.closest("[data-riga]");
          if (l) { r.querySelector('[name="um"]').value = l.um; const d = r.querySelector('[name="descrizione"]'); if (!d.value) d.value = l.nome; }
        });
      },
    };
  };
  AZIONI["fl-riga-piu"] = () => {
    const f = document.querySelector('form[data-form="fl-computo"]');
    if (!f) return;
    f.querySelector("[data-righe]").insertAdjacentHTML("beforeend", f.querySelector("template[data-modello]").innerHTML);
  };
  FORM["fl-computo"] = async (f) => {
    const righe = [...f.querySelectorAll("[data-righe] [data-riga]")].map((r) => {
      const v = (n) => r.querySelector(`[name="${n}"]`).value;
      const x = { lavorazione: v("lavorazione"), descrizione: v("descrizione").trim().slice(0, 120), quantita: Math.max(0, Number(String(v("quantita")).replace(",", ".")) || 0), um: v("um"), stanza: v("stanza").trim().slice(0, 40) };
      const p = String(v("prezzo")).trim();
      if (p !== "") x.prezzo = Math.max(0, Number(p.replace(",", ".")) || 0);
      return x;
    }).filter((r) => r.descrizione || r.lavorazione);
    const validato = !!(f.validato && f.validato.checked);
    if (validato && !righe.length) return toast("Il computo è vuoto.", "errore");
    if (validato && righe.some((r) => !r.quantita)) return toast("Ci sono voci con quantità 0: misurale prima di validare.", "errore");
    try {
      await FL.salva(f.dataset.id, { computo: righe, computo_validato: validato });
      const st = await FL.stima(f.dataset.id);
      toast(st && st.min != null ? "Salvato. Nuova stima: " + euro(st.min) + " – " + euro(st.max) : "Salvato. Stima non disponibile: guarda le note.");
      render();
    } catch (e) { toast(errore(e), "errore"); }
  };
  FORM["fl-pratica"] = async (f) => {
    try {
      await FL.salvaPratica(f.dataset.id, { titolo: f.titolo.value, titolo_motivo: f.titolo_motivo.value.trim(), vincolo_paesaggistico: f.vincolo_paesaggistico.value, zona_sismica: f.zona_sismica.value, altri_vincoli: f.altri_vincoli.value.trim(), note: f.note.value.trim() });
      toast("Pratica salvata: titolo confermato dal tecnico."); render();
    } catch (e) { toast(errore(e), "errore"); }
  };
  FORM["fl-sue"] = async (f) => {
    const prov = f.provincia.value.trim().toUpperCase();
    if (prov && !/^[A-Z]{2}$/.test(prov)) return toast("Provincia: due lettere, es. RM.", "errore");
    try { await FL.salvaSue({ comune: f.dataset.comune, provincia: prov, ufficio: f.ufficio.value.trim(), pec: f.pec.value.trim(), telefono: f.telefono.value.trim(), sito: f.sito.value.trim() }); toast("Ufficio del Comune salvato."); render(); }
    catch (e) { toast(errore(e), "errore"); }
  };
  AZIONI["fl-converti:"] = async (id) => {
    const s = await FL.sopralluogo(id);
    if (!s.computo_validato) return toast(ERRORI.computo_da_validare, "errore");
    foglio(`<h2>Convertire in cantiere attivo?</h2><p class="sotto">Si crea il preventivo dal computo (se non c'è già) e si segna <b>accettato</b>. Poi si apre il cantiere con un codice nuovo e il budget del preventivo. Il cliente vedrà l'avanzamento dallo stesso link.</p>
      ${s.budget_ok_il ? "" : avviso("Il cliente non ha ancora dato l'ok al budget dal link. Converti solo se l'accordo c'è già.", "rosso") + '<div style="height:10px"></div>'}
      ${btn(I.gru + " Sì, apri il cantiere", "fl-converti-ok:" + id)}<div style="height:8px"></div>${btn("Annulla", "fl-chiudi", "chiaro")}`);
  };
  AZIONI["fl-converti-ok:"] = async (id) => {
    chiudiFoglio();
    try { const c = await FL.converti(id); toast("Cantiere aperto."); vai("scheda/" + c); } catch (e) { toast(errore(e), "errore"); }
  };

  /* ====================================================================== */
  /* CLIENTE: pagina della stima e del cantiere (senza password)             */
  /* ====================================================================== */
  V.stima = async (tok) => {
    document.title = "La tua stima · AncheCasa";
    let d = null;
    if (/^[0-9a-f-]{36}$/i.test(tok || "")) { try { d = await FL.pubblica(tok); } catch (e) { console.error(e); } }
    const testa = (t, s, ditta) => `<header class="st-testa"><img src="img/logo-colore.png" alt="AncheCasa">${ditta ? `<p style="margin:10px 0 0;font-weight:700;color:var(--blu)">con ${esc(ditta)}</p>` : ""}<h1>${t}</h1><p>${s}</p></header>`;
    const piede = `<p class="st-piede">AncheCasa · Costruiamo fiducia · <a href="https://www.anchecasa.it" target="_blank" rel="noopener" style="text-decoration:underline">anchecasa.it</a>${CONFIG.privacyUrl ? ` · <a href="${esc(CONFIG.privacyUrl)}" target="_blank" rel="noopener" style="text-decoration:underline">Privacy</a>` : ""}</p>`;
    if (!d || !d.trovato) return { pieno: true, h: `<div class="st">${testa("Link non valido", "Il link è scaduto o non è corretto. Chiedi un nuovo link a chi ha fatto il sopralluogo.")}${piede}</div>` };
    const c = d.cantiere;
    const t = d.stile;
    const passi = [
      ["Sopralluogo fatto", data(d.quando), true],
      ["Ufficio tecnico e pratiche", "Computo sui prezzari ufficiali, pratica edilizia, fornitori", ["in_ufficio", "budget_ok", "convertito"].includes(d.stato)],
      ["Ok al budget", d.budget_ok ? "Fatto" : "Tocca a te, quando sei pronto", d.budget_ok],
      ["Preventivo ufficiale", d.preventivo ? (d.preventivo.stato === "accettato" ? "Accettato" : d.ufficiale ? "Pronto: te lo manda la ditta" : "In preparazione") : "Dopo l'ok al budget", !!d.preventivo && d.preventivo.stato === "accettato"],
      ["Cantiere aperto", c ? "Codice " + (c.codice || "") : "Dopo il preventivo", !!c],
    ];
    const ora = passi.findIndex((p) => !p[2]);
    const filo = `<ol class="fe-filo">${passi.map((p, i) => `<li class="${p[2] ? "fatto" : i === ora ? "ora" : ""}"><span class="pallino">${p[2] ? "✓" : i + 1}</span><div><b>${esc(p[0])}</b><small>${esc(p[1])}</small></div></li>`).join("")}</ol>`;
    const forbice = d.stima_min != null
      ? `<section class="st-card st-forbice"><small>Stima di massima</small><b>${euro(d.stima_min)} – ${euro(d.stima_max)}</b><p>Non è un preventivo: è una forbice calcolata sui prezzari ufficiali della Regione, con finitura ${esc(d.finitura || "")}. Il preventivo arriva dopo il controllo dell'ufficio tecnico.</p></section>`
      : `<section class="st-card"><h2>Stima in preparazione</h2><p class="sotto" style="margin:0">L'ufficio tecnico sta preparando la stima. Riapri questo link tra poco.</p></section>`;
    const okBtn = !c && d.stima_min != null && !d.budget_ok && ["in_ufficio", "completato", "programmato"].includes(d.stato)
      ? `<section class="st-card"><h2>Ti va bene questa cifra?</h2><p class="sotto">Con l'ok al budget l'ufficio prepara il preventivo dettagliato. Non è un contratto e non paghi nulla.</p>${btn(I.ok + " Ok al budget", "st-ok:" + tok)}</section>`
      : d.budget_ok && !c ? `<section class="st-card">${stato("verde", "Ok al budget ricevuto")}<p class="sotto" style="margin:8px 0 0">L'ufficio tecnico prepara il preventivo dettagliato.</p></section>` : "";
    const mood = t ? `<section class="st-card"><h2>Il tuo stile: ${esc(t.nome)}</h2><div class="st-colori" aria-hidden="true">${(t.colori || []).map((x) => `<i style="background:${esc(x)}"></i>`).join("")}</div>
      <div>${(t.materiali || []).map((m) => `<span class="st-pill">${esc(m)}</span>`).join("")}</div><p class="sotto" style="margin:6px 0 0">${(t.parole || []).map(esc).join(" · ")}</p></section>` : "";
    const pratica = d.pratica && d.pratica.titolo && d.pratica.titolo !== "da_verificare"
      ? `<section class="st-card"><h2>Pratica edilizia</h2><p style="margin:0"><b>${esc(TITOLI[d.pratica.titolo] || d.pratica.titolo)}</b> ${d.pratica.confermato ? stato("verde", "verificata dal tecnico") : stato("giallo", "da confermare dal tecnico")}</p></section>` : "";
    const cantiere = c ? `<section class="st-card"><h2>Il tuo cantiere ${c.codice ? "· " + esc(c.codice) : ""}</h2>
      ${c.avanzamento != null ? `<div style="display:flex;justify-content:space-between"><b>Avanzamento</b><b>${esc(c.avanzamento)}%</b></div><div class="st-barra"><i style="width:${Math.max(0, Math.min(100, Number(c.avanzamento) || 0))}%"></i></div>` : `<p class="sotto" style="margin:0">Aperto il ${data(c.inizio)}. Le fasi compaiono qui quando l'impresa le pianifica.</p>`}
      ${(c.fasi || []).map((f) => `<div style="margin-top:10px"><div style="display:flex;justify-content:space-between;font-size:14px"><span>${esc(f.titolo)}</span><span>${esc(f.avanzamento)}%</span></div><div class="st-barra"><i style="width:${Math.max(0, Math.min(100, Number(f.avanzamento) || 0))}%"></i></div></div>`).join("")}
      ${(c.giornale || []).length ? `<h2 style="margin-top:16px">Ultimi lavori</h2>${c.giornale.map((g) => `<p style="margin:0 0 6px;font-size:14px"><b>${data(g.data)}</b> · ${esc(g.testo)}</p>`).join("")}` : ""}</section>` : "";
    return {
      pieno: true,
      h: `<div class="st">${testa(c ? "Il tuo cantiere" : "La tua stima", `${esc(d.lavori || "Lavori")}${d.comune ? " · " + esc(d.comune) : ""}${d.mq ? " · " + esc(String(d.mq).replace(".", ",")) + " mq" : ""}`, d.ditta)}
        <div class="st-corpo">${c ? cantiere : forbice + okBtn}${mood}${pratica}<section class="st-card"><h2>A che punto siamo</h2>${filo}</section>${c ? forbice.replace("Stima di massima", "Stima iniziale") : ""}</div>
        ${piede}</div>`,
    };
  };
  AZIONI["st-ok:"] = async (tok) => {
    foglio(`<h2>Confermi l'ok al budget?</h2><p class="sotto">Diciamo all'ufficio tecnico che la forbice ti va bene, così prepara il preventivo dettagliato. Non firmi nulla e non paghi nulla.</p>${btn(I.ok + " Sì, confermo", "st-ok-si:" + tok)}<div style="height:8px"></div>${btn("Non ancora", "fl-chiudi", "chiaro")}`);
  };
  AZIONI["st-ok-si:"] = async (tok) => {
    chiudiFoglio();
    try { const ok = await FL.okBudget(tok); toast(ok ? "Grazie! L'ufficio tecnico è stato avvisato." : "Non è stato possibile: il link è scaduto o la stima non è pronta.", ok ? "" : "errore"); render(); }
    catch (e) { toast(errore(e), "errore"); }
  };

  /* ====================================================================== */
  /* ADMIN: prezzari regionali                                               */
  /* ====================================================================== */
  V["ad-prezzari"] = async () => {
    if (!S.admin) return { t: "Prezzari", h: `<div class="pad">${vuoto("Solo per l'admin.")}</div>` };
    await FL.semina();
    const pz = await FL.prezzari();
    const anno = new Date().getFullYear();
    const regioniConPrezzario = [...new Set(pz.map((p) => p.regione))];
    return {
      t: "Prezzari regionali",
      h: `<div class="pad">
        <p class="sotto">La stima usa solo i prezzi dei prezzari che carichi qui. Ogni Regione pubblica il suo prezzario delle opere pubbliche: scarica il file ufficiale, aprilo con Excel e salvalo come CSV.</p>
        ${sez("Prezzari caricati", pz.length ? lista(pz.map((p) => voce("doc", esc(p.fonte), `${esc(p.regione)} · ${esc(p.anno)}${p.nota ? " · " + esc(p.nota) : ""}`, "", p.attivo ? "verde" : "rosso", btn(p.attivo ? "Disattiva" : "Attiva", "fl-pz:" + (p.attivo ? "0" : "1") + ":" + p.id, "chiaro piccolo")))) : vuoto("Nessun prezzario ancora."))}
        ${sez("Collega le lavorazioni", regioniConPrezzario.length ? lista(regioniConPrezzario.map((r) => voce("mappa", esc(r), "Lavorazione della stima → voce del prezzario", "ad-prezzari-mappa/" + encodeURIComponent(r), "arancio"))) : vuoto("Prima carica un prezzario."))}
        ${sez("Importa un prezzario (CSV)", `<form data-form="fl-prezzario" novalidate>
          ${campo("Nome", `<input name="fonte" maxlength="120" placeholder="es. Prezzario Regione Lazio ${anno}">`)}
          <div class="griglia2">${campo("Regione", `<select name="regione"><option value="">Scegli</option>${opz(REGIONI.map((r) => [r, r]), "")}</select>`)}${campo("Anno", `<input name="anno" type="number" min="2000" max="2100" value="${anno}">`)}</div>
          ${campo("Nota (delibera, link, licenza)", `<input name="nota" maxlength="300">`)}
          ${campo("File CSV", `<input name="file" type="file" accept=".csv,text/csv">`, "Prima riga con le intestazioni. Servono le colonne codice, descrizione e prezzo; unità di misura facoltativa. Separatore ; oppure ,")}
          <button class="btn" type="submit">Importa</button></form>`)}
      </div>`,
    };
  };
  AZIONI["fl-pz:"] = async (arg) => { const [si, id] = arg.split(":"); try { await FL.attivaPrezzario(id, si === "1"); toast("Fatto."); render(); } catch (e) { toast(errore(e), "errore"); } };
  FORM["fl-prezzario"] = async (f) => {
    const fonte = f.fonte.value.trim(), regione = f.regione.value, anno = Number(f.anno.value), file = f.file.files && f.file.files[0];
    if (fonte.length < 3) return toast("Scrivi il nome del prezzario.", "errore");
    if (!regione) return toast("Scegli la regione.", "errore");
    if (!(anno >= 2000 && anno <= 2100)) return toast("Anno non valido.", "errore");
    if (!file) return toast("Scegli il file CSV.", "errore");
    let r;
    try { r = leggiCsv(await file.text()); } catch (e) { return toast(errore(e), "errore"); }
    if (!r.voci.length) return toast("Nel file non ho trovato voci con codice, descrizione e prezzo.", "errore");
    toast(`Importo ${r.voci.length} voci…`);
    try { await FL.importaPrezzario({ fonte, regione, anno, nota: f.nota.value.trim() }, r.voci); toast(`Importate ${r.voci.length} voci${r.scartate ? ", scartate " + r.scartate + " righe incomplete" : ""}.`); vai("ad-prezzari-mappa/" + encodeURIComponent(regione)); }
    catch (e) { toast(errore(e), "errore"); }
  };
  V["ad-prezzari-mappa"] = async (reg) => {
    const regione = decodeURIComponent(reg || "");
    if (!S.admin) return { t: "Prezzari", h: `<div class="pad">${vuoto("Solo per l'admin.")}</div>` };
    const [lav, pz, rif] = await Promise.all([FL.lavorazioni(), FL.prezzari(), FL.riferimenti(regione)]);
    const miei = pz.filter((p) => p.regione === regione);
    const descr = await Promise.all(lav.map(async (l) => { const r = rif.find((x) => x.lavorazione === l.chiave); return r ? (await FL.voce(r.prezzario, r.codice).catch(() => null)) : null; }));
    return {
      t: "Lavorazioni · " + regione,
      h: `<div class="pad"><p class="sotto">Per ogni lavorazione che l'AI riconosce, scrivi il codice della voce del prezzario. Senza codice la stima la segnala come «senza prezzo».</p>
        <form data-form="fl-mappa" data-regione="${esc(regione)}" novalidate><div class="fl-mappa">
        ${lav.map((l, i) => { const r = rif.find((x) => x.lavorazione === l.chiave) || {}; const v = descr[i]; return `<div class="card" data-lav="${esc(l.chiave)}"><b>${esc(l.nome)}</b> <small>${esc(l.um)}</small>
          <div class="griglia2" style="margin-top:8px"><select name="pz" aria-label="Prezzario">${opz([["", "–"]].concat(miei.map((p) => [p.id, p.fonte + " " + p.anno])), r.prezzario || (miei[0] || {}).id)}</select><input name="codice" maxlength="40" value="${esc(r.codice || "")}" placeholder="Codice voce" aria-label="Codice voce"></div>
          ${v ? `<small style="margin-top:6px">${esc(v.descrizione.slice(0, 160))} · ${esc(v.um)} · ${euro2(v.prezzo)}</small>` : r.codice ? `<small style="margin-top:6px;color:var(--rosso)">Codice non trovato nel prezzario.</small>` : ""}</div>`; }).join("")}
        </div><div style="height:12px"></div><button class="btn" type="submit">Salva i collegamenti</button></form></div>`,
    };
  };
  FORM["fl-mappa"] = async (f) => {
    const regione = f.dataset.regione;
    let ok = 0, no = 0;
    for (const c of f.querySelectorAll("[data-lav]")) {
      const pz = c.querySelector('[name="pz"]').value, cod = c.querySelector('[name="codice"]').value.trim();
      try {
        if (cod && !(await FL.voce(pz, cod))) { no++; continue; }
        await FL.salvaRiferimento(c.dataset.lav, regione, pz, cod); if (cod) ok++;
      } catch (e) { no++; }
    }
    toast(`Collegate ${ok} lavorazioni${no ? ", " + no + " codici non trovati" : ""}.`, no ? "errore" : "");
    render();
  };
}
