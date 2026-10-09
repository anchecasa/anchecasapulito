/* SuperMastro: fotocamera (5 secondi), fotogrammi, Google Maps (artigiani vicini e mappa). */
import { CONFIG } from "./config.js";
import { I, esc } from "./ui.js";

/* ------------------------------------------------------------------------ */
/* Fotocamera                                                                */
/* ------------------------------------------------------------------------ */
/** Apre la fotocamera a schermo intero. Risolve con { blob, mime, frames:[dataURL], nota } o null se chiude. */
export function filma() {
  return new Promise((risolvi) => {
    const C = { stream: null, rec: null, chunks: [], frames: [], timers: [], blob: null, mime: "" };
    const el = document.createElement("div");
    el.className = "cam";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Filma il guasto");
    document.getElementById("app").appendChild(el);

    const ferma = () => {
      C.timers.forEach(clearTimeout); C.timers = [];
      if (C.stream) C.stream.getTracks().forEach((t) => t.stop());
      C.stream = null;
    };
    const chiudi = (valore) => { ferma(); el.remove(); risolvi(valore); };

    function fase(f, msg) {
      if (f === "pronto" || f === "registra") {
        el.innerHTML = `<video playsinline muted autoplay></video>
          <div class="cam-alto"><button type="button" class="cam-x" data-c="chiudi" aria-label="Chiudi">${I.no}</button><span>${f === "registra" ? `● REC <b data-c="sec">5</b>` : "Inquadra il guasto da vicino"}</span></div>
          <div class="cam-basso">${f === "pronto" ? `<button type="button" class="cam-rec" data-c="rec" aria-label="Registra 5 secondi"></button><small>Tieni fermo il telefono: bastano 5 secondi</small>` : `<small>Muovi piano il telefono intorno al guasto</small>`}</div>`;
        const v = el.querySelector("video");
        v.srcObject = C.stream;
        v.play().catch(() => {});
      } else if (f === "rivedi") {
        const url = C.blob ? URL.createObjectURL(C.blob) : "";
        el.innerHTML = `<div class="cam-rivedi">
          <div class="cam-alto chiaro"><button type="button" class="cam-x" data-c="chiudi" aria-label="Chiudi">${I.no}</button><span>Il tuo video</span></div>
          ${url ? `<video src="${url}" playsinline controls muted loop autoplay></video>` : ""}
          <div class="fotos">${C.frames.map((f) => `<img src="${f}" alt="">`).join("")}</div>
          <label class="campo"><span>Vuoi aggiungere qualcosa? (facoltativo)</span><textarea data-c="nota" maxlength="200" placeholder="Es. perde da ieri sera, sotto il lavello della cucina"></textarea></label>
          <button type="button" class="btn" data-c="analizza">${I.video} Analizza il video</button>
          <button type="button" class="btn chiaro" data-c="rifai">Rifai il video</button></div>`;
      } else {
        el.innerHTML = `<div class="cam-rivedi">
          <div class="cam-alto chiaro"><button type="button" class="cam-x" data-c="chiudi" aria-label="Chiudi">${I.no}</button><span>Filma il guasto</span></div>
          <p class="sotto">${esc(msg || "Filma il guasto con la fotocamera del telefono (5 secondi bastano) e caricalo qui.")}</p>
          <label class="btn">${I.video} Scegli o gira un video<input type="file" accept="video/*" capture="environment" data-c="file" hidden></label></div>`;
      }
    }

    function fotogramma(v) {
      const w = v.videoWidth, h = v.videoHeight;
      if (!w || !h) return;
      const k = Math.min(1, 768 / Math.max(w, h));
      const c = document.createElement("canvas");
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
      C.frames.push(c.toDataURL("image/jpeg", 0.72));
    }

    function registra() {
      const tipi = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      const mime = tipi.find((m) => window.MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || "";
      try {
        C.rec = new MediaRecorder(C.stream, mime ? { mimeType: mime, videoBitsPerSecond: 1500000 } : { videoBitsPerSecond: 1500000 });
      } catch (e) { fase("file", "Questo browser non riesce a registrare: carica un video dalla galleria."); return; }
      C.chunks = []; C.frames = [];
      C.rec.ondataavailable = (e) => { if (e.data && e.data.size) C.chunks.push(e.data); };
      C.rec.onstop = () => {
        C.mime = (C.rec.mimeType || mime || "video/webm").split(";")[0];
        C.blob = new Blob(C.chunks, { type: C.mime });
        ferma();
        fase("rivedi");
      };
      fase("registra");
      const v = el.querySelector("video");
      C.rec.start(250);
      [700, 2500, 4300].forEach((ms) => C.timers.push(setTimeout(() => fotogramma(v), ms)));
      for (let s = 1; s <= 5; s++) C.timers.push(setTimeout(() => { const n = el.querySelector("[data-c=sec]"); if (n) n.textContent = String(5 - s); }, s * 1000));
      C.timers.push(setTimeout(() => { if (C.rec && C.rec.state !== "inactive") C.rec.stop(); }, 5000));
    }

    function daFile(file) {
      if (!file) return;
      if (file.size > 40 * 1024 * 1024) { fase("file", "Il video è troppo lungo: ne bastano 5 secondi."); return; }
      C.blob = file; C.mime = (file.type || "video/mp4").split(";")[0]; C.frames = [];
      const v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.preload = "auto";
      v.src = URL.createObjectURL(file);
      v.addEventListener("loadedmetadata", () => {
        const d = isFinite(v.duration) && v.duration > 0 ? v.duration : 5;
        const tempi = [0.15, 0.5, 0.85].map((x) => Math.min(d - 0.05, d * x));
        const prossimo = () => { if (!tempi.length) { fase("rivedi"); return; } v.currentTime = tempi.shift(); };
        v.addEventListener("seeked", () => { fotogramma(v); prossimo(); });
        prossimo();
      });
      v.addEventListener("error", () => fase("file", "Non riesco a leggere questo video. Prova a girarlo di nuovo."));
    }

    async function apri() {
      ferma(); C.blob = null; C.frames = [];
      const puo = navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder && window.isSecureContext;
      if (!puo) { fase("file"); return; }
      fase("file", "Apro la fotocamera…");
      try {
        C.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (!el.isConnected) { ferma(); return; }
        fase("pronto");
      } catch (e) {
        fase("file", e && e.name === "NotAllowedError" ? "Non ho il permesso di usare la fotocamera. Puoi filmare con l'app del telefono e caricare il video qui." : "La fotocamera non è disponibile. Filma con l'app del telefono e carica il video qui.");
      }
    }

    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-c]");
      if (!b) return;
      const c = b.getAttribute("data-c");
      if (c === "chiudi") chiudi(null);
      else if (c === "rec") registra();
      else if (c === "rifai") apri();
      else if (c === "analizza") {
        const nota = (el.querySelector("[data-c=nota]") || {}).value || "";
        chiudi({ blob: C.blob, mime: C.mime, frames: C.frames.slice(), nota });
      }
    });
    el.addEventListener("change", (e) => { if (e.target.getAttribute("data-c") === "file") daFile(e.target.files && e.target.files[0]); });
    apri();
  });
}

const b64 = (dataUrl) => String(dataUrl).split(",")[1] || "";
const blobB64 = (blob) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(b64(r.result)); r.onerror = () => ok(""); r.readAsDataURL(blob); });
export function dataUrlBlob(u) {
  const [t, d] = String(u).split(",");
  const bin = atob(d);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return new Blob([a], { type: (t.match(/data:([^;]+)/) || [])[1] || "image/jpeg" });
}
/** Il corpo da mandare alla funzione di analisi: video (se non troppo grande) e fotogrammi. */
export async function corpoAnalisi(clip) {
  const body = { fotogrammi: clip.frames.map(b64).filter(Boolean), nota: clip.nota || "" };
  if (clip.blob && clip.blob.size < 11 * 1024 * 1024) {
    body.video = await blobB64(clip.blob);
    body.video_mime = clip.mime;
  }
  return body;
}

/* ------------------------------------------------------------------------ */
/* Posizione                                                                 */
/* ------------------------------------------------------------------------ */
export const kmTra = (a, b) => {
  const r = (x) => (x * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};
export function miaPosizione() {
  return new Promise((ok, ko) => {
    if (!navigator.geolocation) return ko(new Error("geo"));
    navigator.geolocation.getCurrentPosition((p) => ok({ lat: p.coords.latitude, lng: p.coords.longitude, preciso: true }), ko, { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 });
  });
}

/* ------------------------------------------------------------------------ */
/* Google Maps                                                               */
/* ------------------------------------------------------------------------ */
let gmaps = null;
export function googlePronto() { return !!CONFIG.googleMapsKey; }
function caricaGoogle() {
  if (gmaps) return gmaps;
  gmaps = new Promise((ok, ko) => {
    if (window.google && window.google.maps && window.google.maps.importLibrary) return ok();
    window.__acGoogle = () => ok();
    const s = document.createElement("script");
    s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(CONFIG.googleMapsKey) + "&v=weekly&language=it&region=IT&loading=async&callback=__acGoogle";
    s.async = true;
    s.onerror = () => { gmaps = null; ko(new Error("google")); };
    document.head.appendChild(s);
    setTimeout(() => ko(new Error("google")), 15000);
  });
  return gmaps;
}
/** Coordinate di una città (centro). */
export async function coordinateDi(citta) {
  await caricaGoogle();
  const { Geocoder } = await google.maps.importLibrary("geocoding");
  const r = await new Geocoder().geocode({ address: citta + ", Italia", region: "it" });
  const loc = r.results && r.results[0] && r.results[0].geometry.location;
  if (!loc) throw new Error("citta");
  return { lat: loc.lat(), lng: loc.lng(), preciso: false };
}
/** I 5 artigiani più vicini trovati su Google (non iscritti). */
export async function cercaGoogle(cosa, centro) {
  await caricaGoogle();
  const { Place } = await google.maps.importLibrary("places");
  const { places } = await Place.searchByText({
    textQuery: cosa,
    fields: ["id", "displayName", "formattedAddress", "location", "nationalPhoneNumber", "rating", "userRatingCount", "googleMapsURI", "businessStatus", "regularOpeningHours"],
    locationBias: { center: { lat: centro.lat, lng: centro.lng }, radius: 15000 },
    language: "it", region: "it", maxResultCount: 20,
  });
  return (places || [])
    .filter((p) => p.location && p.businessStatus !== "CLOSED_PERMANENTLY")
    .map((p) => ({
      id: "g:" + p.id, nome: p.displayName || "Artigiano", indirizzo: p.formattedAddress || "", telefono: p.nationalPhoneNumber || "",
      voto: p.rating || 0, recensioni: p.userRatingCount || 0, mappa: p.googleMapsURI || "", lat: p.location.lat(), lng: p.location.lng(),
    }))
    .map((a) => Object.assign(a, { km: kmTra(centro, a) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 5);
}
/** Disegna la mappa: tu (blu), iscritti AncheCasa (verde), artigiani Google (arancio, numerati). */
export async function disegnaMappa(box, centro, iscritti, google5) {
  await caricaGoogle();
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
  const m = new Map(box, { center: { lat: centro.lat, lng: centro.lng }, zoom: 13, mapId: CONFIG.googleMapId, disableDefaultUI: true, zoomControl: true, gestureHandling: "cooperative" });
  const b = new google.maps.LatLngBounds();
  const pin = (pos, colore, bordo, glyph, titolo) => {
    new AdvancedMarkerElement({ map: m, position: pos, title: titolo, content: new PinElement({ background: colore, borderColor: bordo, glyphColor: "#fff", glyph }).element });
    b.extend(pos);
  };
  pin({ lat: centro.lat, lng: centro.lng }, "#16304D", "#0B1A2C", "", "Tu");
  iscritti.forEach((a) => pin({ lat: a.lat, lng: a.lng }, "#1F8A5B", "#146140", "★", a.nome_attivita));
  google5.forEach((a, i) => pin({ lat: a.lat, lng: a.lng }, "#E56B10", "#B5520A", String(i + 1), a.nome));
  if (iscritti.length + google5.length) m.fitBounds(b, 40);
}

/* Per la modalità prova: artigiani "Google" di ESEMPIO intorno al centro e una mappa disegnata. */
export function googleDiProva(cosa, centro) {
  const nomi = ["Esempio Pronto Intervento", "Esempio Impianti", "Esempio Servizi Casa", "Esempio Riparazioni", "Esempio Assistenza"];
  return nomi.map((n, i) => {
    const a = { id: "g:es" + i, nome: n, indirizzo: "Indirizzo di esempio", telefono: "000 000 00" + (10 + i), voto: 0, recensioni: 0, mappa: "", lat: centro.lat + (i % 2 ? 1 : -1) * 0.004 * (i + 1), lng: centro.lng + (i % 3 ? 1 : -1) * 0.005 * (i + 1) };
    return Object.assign(a, { km: kmTra(centro, a) });
  }).sort((a, b) => a.km - b.km);
}
export function mappaDiProva(box, centro, iscritti, google5) {
  const tutti = [centro, ...iscritti, ...google5];
  const lats = tutti.map((p) => p.lat), lngs = tutti.map((p) => p.lng);
  const minLa = Math.min(...lats) - 0.003, maxLa = Math.max(...lats) + 0.003, minLn = Math.min(...lngs) - 0.004, maxLn = Math.max(...lngs) + 0.004;
  const xy = (p) => [((p.lng - minLn) / (maxLn - minLn)) * 100, (1 - (p.lat - minLa) / (maxLa - minLa)) * 100];
  const punto = (p, col, t) => { const [x, y] = xy(p); return `<span class="pm" style="left:${x}%;top:${y}%;background:${col}">${t}</span>`; };
  box.innerHTML = `<div class="mappa-prova"><small>Mappa di esempio</small>${punto(centro, "#16304D", "")}${iscritti.map((a) => punto(a, "#1F8A5B", "★")).join("")}${google5.map((a, i) => punto(a, "#E56B10", i + 1)).join("")}</div>`;
}
