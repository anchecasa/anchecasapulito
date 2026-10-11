#!/usr/bin/env node
/**
 * Mette online l'app AncheCasa in un colpo solo: database → funzioni → app su Cloudflare Pages.
 * Si ferma al primo errore e dice dove. Non mostra mai chiavi o password.
 * Uso (dalla cartella app-anchecasa):  node scripts/online-tutto.mjs
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { APP } from "./_ambiente.mjs";

const PASSI = [
  ["1 · Database", "online-1-database.mjs"],
  ["2 · Funzioni e secrets", "online-2-funzioni.mjs"],
  ["3 · App su Cloudflare Pages", "online-3-app.mjs"],
];
for (const [nome, file] of PASSI) {
  console.log(`\n=== ${nome} ===`);
  const r = spawnSync(process.execPath, [join(APP, "scripts", file)], { cwd: APP, stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`\nFERMATO al passo «${nome}». Gli altri passi non sono partiti.`);
    process.exit(r.status || 1);
  }
}
console.log("\nTUTTO FATTO: database aggiornato, funzioni pubblicate, app online.");
