/* Service worker dell'app AncheCasa: tiene in memoria i file dell'app per aprirla subito.
   I dati (Supabase, Google) passano sempre dalla rete. Cambiare VERSIONE a ogni pubblicazione. */
const VERSIONE = "ac-app-1.0.0";
const FILE = ["./", "index.html", "css/app.css", "js/main.js", "js/ui.js", "js/db.js", "js/sm.js", "js/config.js", "vendor/supabase.js", "img/logo-colore.png", "img/icona-192.png"];
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
