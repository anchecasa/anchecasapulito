/* Avvio dell'app AncheCasa: il cuore (main.js) più tutte le parti. */
import { core, avvia } from "./main.js";
import { installa as schede } from "./schede.js";
import { installa as rubrica } from "./rubrica.js";
import { installa as aziende } from "./viste-aziende.js";
import { installa as rete } from "./viste-rete.js";
import { installa as direzione } from "./viste-direzione.js";
import { installa as documenti } from "./viste-documenti.js";
import { installa as comuni } from "./viste-comuni.js";
import { installa as admin } from "./viste-admin.js";
import { installa as bacheca } from "./viste-bacheca.js";
import { installa as fatture } from "./viste-fatture.js";
import { installa as sicurezza } from "./viste-sicurezza.js";
import { installa as flash } from "./viste-flash.js";
import { installa as subappalti } from "./viste-sub.js";
import { installa as magazzino } from "./viste-magazzino.js";
import { installa as pulsanti } from "./viste-pulsanti.js";

core.HOOK = { scheda: {}, dopoSalva: {}, primaSalva: {}, dopoScheda: {} };
schede(core);
rubrica(core);
aziende(core);
rete(core);
direzione(core);
documenti(core);
comuni(core);
admin(core);
bacheca(core);
fatture(core); // dopo le altre: aggiunge i collegamenti a Ufficio, home dell'agente e cruscotto admin
sicurezza(core); // fascicolo di cantiere e scadenze: collegamenti a Sicurezza, Sicurezza Cantiere e scheda del cantiere
flash(core); // Sopralluogo Flash: nota vocale, stima, link del cliente (#/stima/…), dossier dell'ufficio, prezzari
subappalti(core); // dopo flash: subappalti, pagamenti su misura, Profit Guard, offerte (#/offerta/…), preventivo ufficiale
magazzino(core); // movimenti di magazzino, mezzi nei cantieri, costi reali del cantiere
pulsanti(core); // dashboard a pulsanti: privato, azienda, fornitore, iscrizioni admin
avvia();

// App installabile: copia dei file per aprirla subito (solo su https, non in prova).
if ("serviceWorker" in navigator && location.protocol === "https:" && !core.DB.prova) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
