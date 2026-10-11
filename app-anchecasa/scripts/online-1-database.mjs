#!/usr/bin/env node
/**
 * Passo 1: database Supabase dell'app AncheCasa.
 * - controlla quali parti (app-01 … app-13) ci sono già;
 * - se manca una delle prime sette, si ferma (vanno fatte prima);
 * - prova ad attivare pg_cron (avvisi delle scadenze); se Supabase non lo permette, va avanti;
 * - esegue SOLO i file mancanti da app-08 ad app-13, ognuno tutto o niente;
 * - verifica il risultato (tabelle, permessi, cartelle dei file).
 * Uso:  node scripts/online-1-database.mjs   (aggiungi --solo-controllo per non cambiare niente)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { APP, database, ferma, manca, scrivi } from "./_ambiente.mjs";

const SOLO = process.argv.includes("--solo-controllo");
const PARTI = [
  ["app-01-supermastro.sql", "select to_regclass('marketplace.app_richieste') is not null"],
  ["app-02-completa.sql", "select to_regclass('marketplace.app_org') is not null"],
  ["app-03-siti.sql", "select to_regclass('marketplace.app_contatti') is not null"],
  ["app-04-rete-italia.sql", "select exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'marketplace' and p.proname = 'app_puo_invitare')"],
  ["app-05-proposte-rete.sql", "select to_regclass('marketplace.app_proposte_rete') is not null"],
  ["app-06-strategia-cantieri-obiettivi.sql", "select to_regclass('marketplace.app_strategie') is not null"],
  ["app-07-regole-clienti-documenti.sql", "select to_regclass('marketplace.app_documenti') is not null"],
  ["app-08-fatture-elettroniche.sql", "select to_regclass('marketplace.app_fe_documenti') is not null"],
  ["app-09-sopralluoghi-pratiche.sql", "select to_regclass('marketplace.app_sopralluoghi') is not null"],
  ["app-10-sicurezza-cantiere.sql", "select to_regclass('marketplace.app_scadenze') is not null"],
  ["app-11-sopralluogo-flash.sql", "select to_regclass('marketplace.app_prezzari') is not null"],
  ["app-12-subappalti-profit-guard.sql", "select to_regclass('marketplace.app_sub_richieste') is not null"],
  ["app-13-magazzino-mezzi.sql", "select to_regclass('marketplace.app_mag_movimenti') is not null"],
];

const m = manca("dbPassword");
if (m.length) ferma(`manca ${m.join(", ")} nel file 04-SuperMastro\\web\\.env.local`);
const db = await database();
const vero = async (sql) => Object.values((await db.query(sql)).rows[0])[0] === true;

try {
  scrivi("Collegato al database.");
  const stato = [];
  for (const [file, sql] of PARTI) stato.push([file, await vero(sql)]);
  stato.forEach(([f, ok]) => scrivi(`  ${ok ? "c'è già " : "MANCA   "} ${f}`));
  const primaMancante = stato.findIndex(([, ok]) => !ok);
  if (primaMancante >= 0 && primaMancante < 7) ferma(`manca ${stato[primaMancante][0]}: le parti da app-01 ad app-07 vanno eseguite prima.`);
  const daFare = stato.filter(([, ok]) => !ok).map(([f]) => f);
  if (SOLO) { scrivi(`Solo controllo: da eseguire ${daFare.length ? daFare.join(", ") : "niente"}.`); process.exit(0); }

  // pg_cron per gli avvisi delle scadenze (app-10). Se non si può, app-10 funziona lo stesso senza avvisi automatici.
  if (!(await vero("select exists (select 1 from pg_extension where extname = 'pg_cron')"))) {
    try { await db.query("create extension if not exists pg_cron"); scrivi("pg_cron attivato."); }
    catch (e) { scrivi(`pg_cron non attivabile da qui (${e.message}): gli avvisi automatici delle scadenze restano spenti.`); }
  }

  for (const file of daFare) {
    const sql = readFileSync(join(APP, "sql", file), "utf8");
    scrivi(`Eseguo ${file} …`);
    try {
      await db.query("begin");
      await db.query(sql);
      await db.query("commit");
      scrivi(`  ${file} fatto.`);
    } catch (e) {
      await db.query("rollback").catch(() => {});
      ferma(`${file}: ${e.message}${e.position ? " (posizione " + e.position + ")" : ""}. Nessuna modifica di questo file è rimasta.`);
    }
  }
  // app-10 programma gli avvisi solo se pg_cron c'è: se è appena stato attivato, si riesegue la sola parte di programmazione.
  if (await vero("select exists (select 1 from pg_extension where extname = 'pg_cron')") && !daFare.includes("app-10-sicurezza-cantiere.sql")) {
    try {
      const giri = (await db.query("select count(*)::int n from cron.job where jobname = 'app-scadenze-avvisa'")).rows[0].n;
      if (!giri) {
        // stessa programmazione di app-10: ogni mattina alle 7 di Roma (5 UTC)
        await db.query("select cron.schedule('app-scadenze-avvisa', '0 5 * * *', 'select marketplace.app_scadenze_avvisa()')");
        scrivi("Avvisi automatici delle scadenze programmati.");
      }
    } catch (e) { scrivi(`Programmazione avvisi non riuscita (${e.message}): l'app funziona lo stesso.`); }
  }

  // Verifica
  const r = (await db.query(`select
     (select count(*) from marketplace.app_stima_lavorazioni)::int as lavorazioni,
     (select count(*) from marketplace.app_fe_piani)::int as piani,
     (select count(*) from marketplace.app_fascicolo_requisiti)::int as requisiti,
     exists (select 1 from marketplace.app_impostazioni where chiave = 'stima_flash') as imp_stima,
     exists (select 1 from marketplace.app_impostazioni where chiave = 'profit_guard') as imp_pg,
     (select string_agg(id || case when public then '(pubblico)' else '' end, ',' order by id) from storage.buckets where id in ('sopralluoghi','fascicolo','loghi')) as bucket,
     has_function_privilege('anon', 'marketplace.app_stima_pubblica(uuid)', 'execute') as link_cliente,
     has_function_privilege('anon', 'marketplace.app_invito_leggi(uuid)', 'execute') as link_fornitore,
     has_table_privilege('anon', 'marketplace.app_sopralluoghi', 'select') as anon_sopralluoghi,
     has_table_privilege('anon', 'marketplace.app_sub_offerte', 'select') as anon_offerte,
     has_table_privilege('anon', 'marketplace.app_mag_movimenti', 'select') as anon_magazzino`)).rows[0];
  const errori = [];
  if (r.lavorazioni !== 18) errori.push("lavorazioni della stima ≠ 18");
  if (!(r.piani > 0)) errori.push("piani delle fatture assenti");
  if (!(r.requisiti > 0)) errori.push("requisiti del fascicolo assenti");
  if (!r.imp_stima || !r.imp_pg) errori.push("impostazioni mancanti");
  if (r.bucket !== "fascicolo,loghi(pubblico),sopralluoghi") errori.push("cartelle dei file: " + r.bucket);
  if (!r.link_cliente || !r.link_fornitore) errori.push("le pagine senza accesso (cliente o fornitore) non sono aperte");
  if (r.anon_sopralluoghi || r.anon_offerte || r.anon_magazzino) errori.push("ATTENZIONE: chi non ha l'account legge tabelle private");
  if (errori.length) ferma("verifica non superata: " + errori.join("; "));
  scrivi(`Verifica superata: ${daFare.length ? "eseguiti " + daFare.join(", ") : "niente da eseguire"}; permessi e cartelle a posto.`);
} finally {
  await db.end().catch(() => {});
}
