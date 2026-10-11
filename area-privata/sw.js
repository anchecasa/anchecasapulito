/* App installabile AncheCasa (11.10.2026). Service worker minimo: serve solo perché il telefono offra «Installa app».
   Non conserva copie delle pagine: si vede sempre la versione online, i dati restano su Supabase. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
