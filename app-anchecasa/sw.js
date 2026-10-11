/* Service worker dell'app AncheCasa: tiene in memoria i file dell'app per aprirla subito.
   I dati (Supabase, Google) passano sempre dalla rete. Cambiare VERSIONE a ogni pubblicazione. */
const VERSIONE = "ac-app-2.7.2";
const FILE = ["./", "index.html", "css/app.css", "js/app.js", "js/main.js", "js/ui.js", "js/db.js", "js/sm.js", "js/q.js", "js/schede.js", "js/catalogo.js", "js/viste-aziende.js", "js/viste-rete.js", "js/viste-direzione.js", "js/viste-documenti.js", "js/testi-rete.js", "img/logo-negativo.png", "js/viste-comuni.js", "js/viste-admin.js", "js/viste-bacheca.js", "js/viste-fatture.js", "js/fe-api.js", "js/fe-xml.js", "js/viste-sicurezza.js", "js/sic-api.js", "js/viste-flash.js", "js/flash-api.js", "js/viste-sub.js", "js/sub-api.js", "js/viste-magazzino.js", "js/mag-api.js", "js/pacchetti.js", "js/viste-pulsanti.js", "js/rubrica.js", "js/config.js", "vendor/supabase.js", "img/logo-colore.png", "img/icona-192.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSIONE).then((c) => c.addAll(FILE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== VERSIONE).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // Prima la rete (così gli aggiornamenti arrivano subito), poi la copia se si è senza linea.
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(VERSIONE).then((x) => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match("index.html"))));
});
