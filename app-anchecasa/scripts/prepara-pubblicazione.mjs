#!/usr/bin/env node
/**
 * Prepara la cartella dist/ dell'app AncheCasa per Cloudflare Pages (entra.anchecasa.it).
 * Copia SOLO i file che servono all'app: niente sql/, supabase/, docs, LEGGIMI, script.
 * Aggiunge le intestazioni di sicurezza (_headers) e controlla che non ci siano chiavi segrete.
 *
 * Uso (dalla cartella app-anchecasa):  node scripts/prepara-pubblicazione.mjs
 * Poi:  npx wrangler pages deploy dist --project-name app-anchecasa --branch main
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(APP, "dist");
const DA_COPIARE = ["index.html", "quanto-costa.html", "ditta.html", "sw.js", "manifest.webmanifest", "css", "js", "img", "vendor"];
const ESTENSIONI_OK = new Set([".html", ".js", ".css", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".webmanifest", ".json", ".woff", ".woff2", ".txt"]);
const SEGRETI = [
  /sb_secret_[A-Za-z0-9_-]{10,}/,              // chiave segreta nuova di Supabase
  /service_role/i,                              // chiave di servizio (vecchia)
  /SUPABASE_SERVICE_ROLE_KEY|SDI_WEBHOOK_SEGRETO|MAIL_API_KEY|GEMINI_API_KEY\s*[:=]/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /sk-[A-Za-z0-9]{20,}/,                        // chiavi stile OpenAI
  /AIza[0-9A-Za-z_-]{35}/,                     // chiave Google: ammessa solo in config.js (Maps, limitata ai domini)
];

const HEADERS = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(self), microphone=(self), geolocation=(self), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/
  Cache-Control: no-cache

/index.html
  Cache-Control: no-cache

/quanto-costa.html
  Cache-Control: no-cache

/ditta.html
  Cache-Control: no-cache
  X-Robots-Tag: noindex

/sw.js
  Cache-Control: no-cache
  Service-Worker-Allowed: /

/js/*
  Cache-Control: no-cache

/css/*
  Cache-Control: no-cache
`;

function tutti(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? tutti(p) : [p];
  });
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST);
for (const x of DA_COPIARE) {
  const da = join(APP, x);
  if (!existsSync(da)) {
    if (x === "manifest.webmanifest") continue;
    console.error(`ERRORE: manca ${x}`);
    process.exit(1);
  }
  cpSync(da, join(DIST, x), { recursive: true });
}
writeFileSync(join(DIST, "_headers"), HEADERS);

let problemi = 0;
for (const f of tutti(DIST)) {
  const nome = relative(DIST, f);
  if (nome === "_headers") continue;
  const est = extname(f).toLowerCase();
  if (!ESTENSIONI_OK.has(est)) {
    console.error(`ERRORE: file non previsto in dist: ${nome}`);
    problemi++;
    continue;
  }
  if ([".js", ".html", ".json", ".webmanifest", ".css", ".txt"].includes(est)) {
    const testo = readFileSync(f, "utf8");
    for (const r of SEGRETI) {
      // config.js contiene SOLO chiavi pubbliche (publishable di Supabase, Maps limitata ai domini)
      if (nome.replace(/\\/g, "/") === "js/config.js" && /AIza/.test(r.source)) continue;
      if (r.test(testo)) {
        console.error(`ERRORE: possibile chiave segreta in ${nome} (${r.source.slice(0, 30)}…)`);
        problemi++;
      }
    }
  }
}
if (problemi) {
  console.error(`Fermato: ${problemi} problemi. Niente da pubblicare finché non sono risolti.`);
  process.exit(1);
}
const n = tutti(DIST).length;
console.log(`OK: dist/ pronta con ${n} file (solo app, nessuna chiave segreta trovata).`);
