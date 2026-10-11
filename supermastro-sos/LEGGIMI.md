# SuperMastro SOS · copia del lavoro dell'11.10.2026

Copia da 04-SuperMastro: cartella web, migrazioni del mattino (20261011), script e workflow. Non pubblicato. La pull request su GitHub non è stata unita. Il repository supermastro-sos resta solo come archivio.

Nessuna chiave: non sono stati copiati .env.local né .dev.vars.

Lo schema non è stato toccato. Le funzioni del mattino stanno in public (per esempio public.workers, public.profiles, public.sos_network_artisans). L'iscrizione dell'artigiano è la sua, separata da quella dell'app.

Per iscriversi una volta sola: l'artigiano usa il modulo unico dell'app (famiglia azienda, categoria artigiano) e nasce un solo utente in Supabase Auth. SuperMastro SOS dovrebbe leggere quel profilo, nello schema marketplace, al posto di creare un secondo artigiano in public.workers. Questo passaggio non è stato fatto.
