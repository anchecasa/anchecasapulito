/* Avvio dell'app AncheCasa: il cuore (main.js) più tutte le parti. */
import { core, avvia } from "./main.js";
import { installa as schede } from "./schede.js";
import { installa as aziende } from "./viste-aziende.js";
import { installa as rete } from "./viste-rete.js";
import { installa as comuni } from "./viste-comuni.js";
import { installa as admin } from "./viste-admin.js";
import { installa as bacheca } from "./viste-bacheca.js";

core.HOOK = { scheda: {}, dopoSalva: {}, primaSalva: {}, dopoScheda: {} };
schede(core);
aziende(core);
rete(core);
comuni(core);
admin(core);
bacheca(core);
avvia();

// App installabile: copia dei file per aprirla subito (solo su https, non in prova).
if ("serviceWorker" in navigator && location.protocol === "https:" && !core.DB.prova) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
