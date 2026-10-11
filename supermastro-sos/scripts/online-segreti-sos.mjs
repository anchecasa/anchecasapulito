#!/usr/bin/env node
/**
 * SuperMastro: crea da solo i secrets nuovi delle correzioni dell'11.10.2026, senza mai mostrarli.
 * - SOS_SHARE_SECRET (firma dei dati degli artigiani in «Mandagli il video»): se manca nel Worker, lo crea.
 * - CRON_SECRET (pulizia notturna): deve essere uguale nel Worker e in GitHub Actions.
 *   Se manca in uno dei due, ne crea uno nuovo e lo mette in tutti e due.
 *   (Effetto collaterale: chi era entrato nell'Agenda con il codice deve rimetterlo una volta.)
 * Usa CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID di web/.env.local e il login di «gh».
 * Uso (dalla cartella principale 04-SuperMastro):  node scripts/online-segreti-sos.mjs
 */
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile, ENV_PATH } from "./supabase-env.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WEB = resolve(ROOT, "web");
const env = loadEnvFile(ENV_PATH);
const cfEnv = { CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_API_TOKEN || "", CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || env.CLOUDFLARE_ACCOUNT_ID || "" };
if (!cfEnv.CLOUDFLARE_API_TOKEN) { console.error("FERMATO: manca CLOUDFLARE_API_TOKEN in web/.env.local"); process.exit(1); }
const nascosti = [cfEnv.CLOUDFLARE_API_TOKEN];
const pulito = (t) => nascosti.reduce((s, x) => (x ? s.split(x).join("***") : s), String(t || ""));
function lancia(cmd, args, { cwd = ROOT, input, conCf = false } = {}) {
  const r = spawnSync(cmd, args, { cwd, input, encoding: "utf8", shell: process.platform === "win32", env: Object.assign({}, process.env, conCf ? cfEnv : {}) });
  return { ok: r.status === 0, out: pulito(`${r.stdout || ""}${r.stderr || ""}`) };
}
const nuovo = () => { const v = randomBytes(32).toString("base64url"); nascosti.push(v); return v; };

// Secrets del Worker (solo nomi)
const lista = lancia("npx", ["--yes", "wrangler@latest", "secret", "list", "--format", "json"], { cwd: WEB, conCf: true });
if (!lista.ok) { console.error("FERMATO: non riesco a leggere i secrets del Worker:\n" + lista.out.slice(-800)); process.exit(1); }
let worker = new Set();
try { worker = new Set(JSON.parse(lista.out.slice(lista.out.indexOf("["))).map((x) => x.name)); } catch { /* formato diverso */ }
const putWorker = (nome, valore) => {
  const r = lancia("npx", ["--yes", "wrangler@latest", "secret", "put", nome], { cwd: WEB, input: valore, conCf: true });
  if (!r.ok) { console.error(`FERMATO: ${nome} non impostato nel Worker:\n${r.out.slice(-800)}`); process.exit(1); }
};

// Secrets di GitHub (solo nomi)
const gh = lancia("gh", ["secret", "list"]);
const github = gh.ok ? new Set([...gh.out.matchAll(/^([A-Z][A-Z0-9_]+)\s/gm)].map((x) => x[1])) : null;
if (!gh.ok) console.log("Avviso: «gh» non disponibile o non collegato: i secrets di GitHub non si possono controllare.");

if (!worker.has("SOS_SHARE_SECRET")) {
  const v = nuovo();
  putWorker("SOS_SHARE_SECRET", v);
  if (github) lancia("gh", ["secret", "set", "SOS_SHARE_SECRET"], { input: v });
  console.log("SOS_SHARE_SECRET creato (valore non mostrato).");
} else console.log("SOS_SHARE_SECRET c'è già nel Worker.");

if (!worker.has("CRON_SECRET") || (github && !github.has("CRON_SECRET"))) {
  if (!github) { console.log("CRON_SECRET: senza «gh» non posso allinearlo con GitHub. La pulizia notturna resta da attivare."); }
  else {
    const v = nuovo();
    putWorker("CRON_SECRET", v);
    const r = lancia("gh", ["secret", "set", "CRON_SECRET"], { input: v });
    if (!r.ok) { console.error("FERMATO: CRON_SECRET non impostato in GitHub:\n" + r.out.slice(-500)); process.exit(1); }
    console.log("CRON_SECRET creato e uguale in Worker e GitHub (valore non mostrato).");
  }
} else console.log("CRON_SECRET c'è già in Worker e GitHub.");
console.log("Secrets di SuperMastro a posto.");
