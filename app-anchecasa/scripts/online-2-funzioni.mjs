#!/usr/bin/env node
/**
 * Passo 2: funzioni Supabase dell'app AncheCasa (sdi-gateway, sopralluogo-flash, subappalti-mail, gare-analisi).
 * - pubblica le funzioni con «verify JWT» spento (il controllo di chi entra lo fanno le funzioni);
 * - imposta i secrets che si possono creare da soli: APP_URL e SDI_WEBHOOK_SEGRETO (casuale, mai mostrato);
 * - controlla che le funzioni rispondano e che accettino chiamate da https://entra.anchecasa.it
 *   (se DIAGNOSI_ORIGINI le blocca, la ricostruisce aggiungendo l'app, senza togliere i siti che funzionano);
 * - elenca i secrets che mancano e che servono solo per le mail (MAIL_*): senza, gli inviti restano «da inviare».
 * Uso:  node scripts/online-2-funzioni.mjs
 */
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PROJECT_REF, URL_APP, ENV, ferma, lancia, manca, scrivi, segreto } from "./_ambiente.mjs";

const FUNZIONI = ["sdi-gateway", "sopralluogo-flash", "subappalti-mail", "gare-analisi"];
const SITI_NOTI = [
  "https://anchecasa.it", "https://www.anchecasa.it", "https://entra.anchecasa.it", "https://areaprivata.anchecasa.it",
  "https://supermastro.anchecasa.it", "https://sicura.anchecasa.it", "https://magazine.anchecasa.it", "http://localhost:3000",
];
const BASE = `https://${PROJECT_REF}.supabase.co/functions/v1`;

const m = manca("supabaseToken");
if (m.length) ferma(`manca ${m.join(", ")} nel file 04-SuperMastro\\web\\.env.local`);
const env = { SUPABASE_ACCESS_TOKEN: ENV.supabaseToken };
const cli = (args) => lancia("npx", ["--yes", "supabase@latest", ...args], { env });

function secretsAttuali() {
  const r = cli(["secrets", "list", "--project-ref", PROJECT_REF, "-o", "json"]);
  if (!r.ok) ferma("non riesco a leggere l'elenco dei secrets:\n" + r.out.slice(-800));
  try {
    const j = JSON.parse(r.out.slice(r.out.indexOf("[")));
    return new Set(j.map((x) => x.name));
  } catch {
    return new Set([...r.out.matchAll(/^\s*([A-Z][A-Z0-9_]+)\s*\|/gm)].map((x) => x[1]));
  }
}
function impostaSecrets(coppie) {
  const dir = mkdtempSync(join(tmpdir(), "ac-"));
  const file = join(dir, "s.env");
  try {
    writeFileSync(file, Object.entries(coppie).map(([k, v]) => `${k}=${v}`).join("\n") + "\n", { mode: 0o600 });
    const r = cli(["secrets", "set", "--env-file", file, "--project-ref", PROJECT_REF]);
    if (!r.ok) ferma("impostazione dei secrets non riuscita:\n" + r.out.slice(-800));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
async function ammette(funzione, origine) {
  try {
    const r = await fetch(`${BASE}/${funzione}`, { method: "OPTIONS", headers: { Origin: origine, "Access-Control-Request-Method": "POST" } });
    const a = r.headers.get("access-control-allow-origin");
    return a === "*" || a === origine;
  } catch { return null; }
}

// 1. Secrets che si possono creare da soli
let nomi = secretsAttuali();
scrivi(`Secrets presenti: ${[...nomi].sort().join(", ") || "nessuno"}.`);
const nuovi = { APP_URL: URL_APP };
if (!nomi.has("SDI_WEBHOOK_SEGRETO")) nuovi.SDI_WEBHOOK_SEGRETO = segreto(randomBytes(32).toString("base64url"));
// La chiave di Gemini c'è già nel file di SuperMastro: se su Supabase manca, si usa quella (serve alla nota vocale).
if (!nomi.has("GEMINI_API_KEY") && ENV.gemini) nuovi.GEMINI_API_KEY = ENV.gemini;
impostaSecrets(nuovi);
scrivi(`Impostati: ${Object.keys(nuovi).join(", ")} (valori non mostrati).`);

// 2. Pubblicazione delle funzioni
for (const f of FUNZIONI) {
  scrivi(`Pubblico ${f} …`);
  let r = cli(["functions", "deploy", f, "--project-ref", PROJECT_REF, "--no-verify-jwt", "--use-api"]);
  if (!r.ok && /unknown flag.*use-api/i.test(r.out)) r = cli(["functions", "deploy", f, "--project-ref", PROJECT_REF, "--no-verify-jwt"]);
  if (!r.ok) ferma(`${f} non pubblicata:\n${r.out.slice(-1200)}`);
  scrivi(`  ${f} pubblicata.`);
}

// 3. Prova: senza accesso devono rispondere «accesso_richiesto» (non scrive niente)
for (const f of ["sdi-gateway", "sopralluogo-flash", "subappalti-mail"]) {
  let testo = "";
  for (let i = 0; i < 6; i++) {
    const r = await fetch(`${BASE}/${f}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => null);
    testo = r ? await r.text() : "";
    if (/accesso_richiesto/.test(testo)) break;
    await new Promise((ok) => setTimeout(ok, 5000));
  }
  if (!/accesso_richiesto/.test(testo)) ferma(`${f} non risponde come previsto: ${testo.slice(0, 200)}`);
  scrivi(`  ${f} risponde e blocca chi non è entrato.`);
}

// 4. Le funzioni usate dall'app accettano chiamate da https://entra.anchecasa.it?
const daControllare = [...FUNZIONI, "supermastro-analisi"];
const bloccate = [];
for (const f of daControllare) if ((await ammette(f, URL_APP)) === false) bloccate.push(f);
if (bloccate.length && nomi.has("DIAGNOSI_ORIGINI")) {
  scrivi(`Queste funzioni non accettano ancora l'app: ${bloccate.join(", ")}. Aggiungo l'app a DIAGNOSI_ORIGINI senza togliere i siti già ammessi.`);
  const tenere = [];
  for (const s of SITI_NOTI) if ((await ammette("supermastro-analisi", s)) || (await ammette("gare-analisi", s))) tenere.push(s);
  if (!tenere.filter((s) => s !== URL_APP).length) {
    scrivi("ATTENZIONE: non riesco a capire quali siti sono ammessi oggi, quindi NON cambio DIAGNOSI_ORIGINI (per non bloccare siti che funzionano). " +
      `Le funzioni ${bloccate.join(", ")} potrebbero non rispondere dall'app finché non si aggiunge ${URL_APP}.`);
    scrivi("Passo 2 finito (con l'avviso sopra).");
    process.exit(0);
  }
  impostaSecrets({ DIAGNOSI_ORIGINI: [...new Set([...tenere, URL_APP])].join(",") });
  await new Promise((ok) => setTimeout(ok, 15000));
  const ancora = [];
  for (const f of bloccate) if ((await ammette(f, URL_APP)) === false) ancora.push(f);
  if (ancora.length) scrivi(`ATTENZIONE: ${ancora.join(", ")} non accetta ancora l'app (probabilmente la funzione è pubblicata con verify JWT acceso).`);
  else scrivi(`DIAGNOSI_ORIGINI aggiornata: ${[...new Set([...tenere, URL_APP])].join(", ")}.`);
} else {
  scrivi("Le funzioni accettano le chiamate dall'app.");
}

// 5. Cosa manca (non blocca l'app)
nomi = secretsAttuali();
const mancanti = ["GEMINI_API_KEY", "MAIL_PROVIDER", "MAIL_API_KEY", "MAIL_MITTENTE", "PRIVACY_URL"].filter((k) => !nomi.has(k));
if (mancanti.length) scrivi(`Secrets ancora assenti (non bloccano l'app): ${mancanti.join(", ")}.` +
  (mancanti.some((k) => k.startsWith("MAIL_")) ? " Senza MAIL_* le mail ai fornitori restano «da inviare» e si possono rimandare dopo." : "") +
  (mancanti.includes("GEMINI_API_KEY") ? " Senza GEMINI_API_KEY la nota vocale del Sopralluogo Flash non viene analizzata." : ""));
scrivi("Passo 2 finito.");
