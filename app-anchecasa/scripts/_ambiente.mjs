/**
 * Accessi per gli script «online-*» dell'app AncheCasa.
 * Usa gli stessi accessi che SuperMastro usa già sul PC (file 04-SuperMastro\web\.env.local e
 * .env.secrets.local): password del database, token di Supabase, token e account di Cloudflare.
 * I valori non vengono MAI stampati: ogni testo mostrato passa da `nascondi()`.
 * Percorso diverso: variabile d'ambiente ANCHECASA_ENV (percorso completo del file .env).
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const PROJECT_REF = "edsvmnxojsmknjuhobqa";
export const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const DOMINIO_APP = "entra.anchecasa.it";
export const URL_APP = `https://${DOMINIO_APP}`;
export const PROGETTO_PAGES = "app-anchecasa";
const SUPERMASTRO = resolve(APP, "..", "..", "04-SuperMastro");

function leggi(path) {
  if (!path || !existsSync(path)) return {};
  let raw = readFileSync(path, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const out = {};
  for (const riga of raw.split(/\r?\n/)) {
    const m = riga.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || m[2].trim().startsWith("#")) continue;
    out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const file = Object.assign(
  {},
  leggi(resolve(SUPERMASTRO, "web", ".env.local")),
  leggi(resolve(SUPERMASTRO, "web", ".env.secrets.local")),
  leggi(process.env.ANCHECASA_ENV),
);
const v = (k) => process.env[k] || file[k] || "";

export const ENV = {
  dbPassword: v("SUPABASE_DB_PASSWORD"),
  dbUrl: v("SUPABASE_DB_URL"),
  supabaseToken: v("SUPABASE_ACCESS_TOKEN"),
  cfToken: v("CLOUDFLARE_API_TOKEN"),
  cfAccount: v("CLOUDFLARE_ACCOUNT_ID"),
  gemini: v("GEMINI_API_KEY"),
};

const SEGRETI = [ENV.dbPassword, ENV.dbUrl, ENV.supabaseToken, ENV.cfToken, ENV.gemini].filter((x) => x && x.length >= 6);
const extra = [];
export function segreto(valore) { if (valore && valore.length >= 6) extra.push(valore); return valore; }
/** Toglie da un testo ogni valore segreto conosciuto. */
export function nascondi(testo) {
  let t = String(testo ?? "");
  for (const s of [...SEGRETI, ...extra]) t = t.split(s).join("***");
  if (ENV.dbPassword) t = t.split(encodeURIComponent(ENV.dbPassword)).join("***");
  return t;
}
export const scrivi = (...a) => console.log(nascondi(a.join(" ")));
export function ferma(msg) { console.error(nascondi("FERMATO: " + msg)); process.exit(1); }

export function manca(...chiavi) {
  const nomi = { dbPassword: "SUPABASE_DB_PASSWORD", supabaseToken: "SUPABASE_ACCESS_TOKEN", cfToken: "CLOUDFLARE_API_TOKEN", cfAccount: "CLOUDFLARE_ACCOUNT_ID" };
  return chiavi.filter((k) => !ENV[k] && !(k === "dbPassword" && ENV.dbUrl)).map((k) => nomi[k] || k);
}

/** Collegamento al database: prova diretta e pooler (come gli script di SuperMastro). */
export async function database() {
  let pg;
  try { pg = createRequire(resolve(SUPERMASTRO, "package.json"))("pg"); }
  catch { ferma("manca il pacchetto «pg»: in 04-SuperMastro esegui «npm install»."); }
  const enc = encodeURIComponent(ENV.dbPassword);
  const urls = [ENV.dbUrl].filter(Boolean);
  if (ENV.dbPassword) {
    urls.push(`postgresql://postgres:${enc}@db.${PROJECT_REF}.supabase.co:5432/postgres`);
    for (const reg of ["eu-west-1", "eu-central-1", "eu-west-2", "eu-west-3", "eu-south-1"]) {
      urls.push(`postgresql://postgres.${PROJECT_REF}:${enc}@aws-0-${reg}.pooler.supabase.com:5432/postgres`);
    }
  }
  let ultimo;
  for (const url of urls) {
    const c = new pg.Client({ connectionString: url, ssl: /sslmode=disable/.test(url) ? false : { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    try { await c.connect(); return c; } catch (e) { ultimo = e; try { await c.end(); } catch { /* niente */ } }
  }
  ferma("collegamento al database non riuscito: " + (ultimo && ultimo.message));
}

/** Comando esterno (npx …) con i token nell'ambiente, mai nella riga di comando. Restituisce {ok, out}. */
export function lancia(cmd, args, { env = {}, input, cwd = APP } = {}) {
  const r = spawnSync(cmd, args, {
    cwd, input, encoding: "utf8", shell: process.platform === "win32", maxBuffer: 64 * 1024 * 1024,
    env: Object.assign({}, process.env, env),
  });
  const out = nascondi(`${r.stdout || ""}${r.stderr || ""}`);
  return { ok: r.status === 0, out };
}

/** Chiamata alle API (Supabase Management o Cloudflare) con il token, senza mai mostrarlo. */
export async function api(url, { token, method = "GET", body } = {}) {
  const r = await fetch(url, {
    method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let dati = null;
  try { dati = await r.json(); } catch { dati = null; }
  return { ok: r.ok, status: r.status, dati };
}
