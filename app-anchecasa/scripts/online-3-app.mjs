#!/usr/bin/env node
/**
 * Passo 3: pubblica l'app AncheCasa su Cloudflare Pages e la collega a https://entra.anchecasa.it.
 * - prepara dist/ (solo i file dell'app, controllo chiavi);
 * - crea il progetto Pages «app-anchecasa» se non c'è e pubblica;
 * - collega il dominio entra.anchecasa.it (e il record DNS se manca; se ne esiste uno diverso NON lo tocca);
 * - aggiunge https://entra.anchecasa.it agli indirizzi ammessi per l'accesso su Supabase (senza togliere gli altri);
 * - controlla che l'app si apra e che i file SQL NON siano online.
 * Uso:  node scripts/online-3-app.mjs
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { APP, DOMINIO_APP, ENV, PROGETTO_PAGES, PROJECT_REF, URL_APP, api, ferma, lancia, manca, scrivi } from "./_ambiente.mjs";

const m = manca("cfToken", "cfAccount", "supabaseToken");
if (m.length) ferma(`manca ${m.join(", ")} nel file 04-SuperMastro\\web\\.env.local`);
const CF = `https://api.cloudflare.com/client/v4/accounts/${ENV.cfAccount}`;
const cf = (path, o = {}) => api(path.startsWith("http") ? path : CF + path, Object.assign({ token: ENV.cfToken }, o));
const avvisi = [];

// 1. Cartella da pubblicare
let r = lancia("node", [join("scripts", "prepara-pubblicazione.mjs")]);
scrivi(r.out.trim());
if (!r.ok) ferma("preparazione di dist/ non riuscita.");

// 2. Progetto Pages
let p = await cf(`/pages/projects/${PROGETTO_PAGES}`);
if (p.status === 404 || (p.dati && p.dati.errors && p.dati.errors.some((e) => e.code === 8000007))) {
  p = await cf("/pages/projects", { method: "POST", body: { name: PROGETTO_PAGES, production_branch: "main" } });
  if (!p.ok) ferma(`creazione del progetto Pages non riuscita: ${JSON.stringify(p.dati && p.dati.errors)}`);
  scrivi(`Progetto Pages «${PROGETTO_PAGES}» creato.`);
} else if (!p.ok) {
  ferma(`non riesco a leggere i progetti Cloudflare Pages (il token ha il permesso «Pages»?): ${JSON.stringify(p.dati && p.dati.errors)}`);
}
const sottodominio = (p.dati && p.dati.result && p.dati.result.subdomain) || `${PROGETTO_PAGES}.pages.dev`;

// 3. Pubblicazione
r = lancia("npx", ["--yes", "wrangler@latest", "pages", "deploy", "dist", "--project-name", PROGETTO_PAGES, "--branch", "main", "--commit-dirty=true"],
  { env: { CLOUDFLARE_API_TOKEN: ENV.cfToken, CLOUDFLARE_ACCOUNT_ID: ENV.cfAccount } });
if (!r.ok) ferma("pubblicazione su Cloudflare Pages non riuscita:\n" + r.out.slice(-1500));
scrivi(`Pubblicata su https://${sottodominio}`);

// 4. Dominio entra.anchecasa.it
const dom = await cf(`/pages/projects/${PROGETTO_PAGES}/domains`);
const giaCollegato = dom.ok && (dom.dati.result || []).some((d) => d.name === DOMINIO_APP);
if (!giaCollegato) {
  const add = await cf(`/pages/projects/${PROGETTO_PAGES}/domains`, { method: "POST", body: { name: DOMINIO_APP } });
  if (add.ok) scrivi(`Dominio ${DOMINIO_APP} collegato al progetto.`);
  else avvisi.push(`dominio ${DOMINIO_APP} non collegato: ${JSON.stringify(add.dati && add.dati.errors)}`);
}
const zona = await cf(`https://api.cloudflare.com/client/v4/zones?name=anchecasa.it`);
const zoneId = zona.ok && zona.dati.result && zona.dati.result[0] && zona.dati.result[0].id;
if (zoneId) {
  const rec = await cf(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${DOMINIO_APP}`);
  const esistenti = (rec.ok && rec.dati.result) || [];
  if (!esistenti.length) {
    const nuovo = await cf(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, { method: "POST", body: { type: "CNAME", name: "entra", content: sottodominio, proxied: true, comment: "App AncheCasa (Cloudflare Pages)" } });
    if (nuovo.ok) scrivi(`Record DNS ${DOMINIO_APP} → ${sottodominio} creato.`);
    else avvisi.push(`record DNS non creato (permesso DNS del token?): ${JSON.stringify(nuovo.dati && nuovo.dati.errors)}`);
  } else if (!esistenti.some((x) => x.type === "CNAME" && x.content === sottodominio)) {
    avvisi.push(`esiste già un record DNS per ${DOMINIO_APP} che punta altrove (${esistenti.map((x) => x.type + " " + x.content).join(", ")}): NON l'ho toccato.`);
  } else scrivi(`Record DNS ${DOMINIO_APP} già giusto.`);
} else avvisi.push("zona anchecasa.it non trovata con questo token: il DNS di entra.anchecasa.it va controllato.");

// 5. Supabase: indirizzi ammessi per l'accesso (login, recupero password)
const SB = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const auth = await api(SB, { token: ENV.supabaseToken });
if (auth.ok) {
  const lista = String(auth.dati.uri_allow_list || "").split(",").map((s) => s.trim()).filter(Boolean);
  const voglio = [URL_APP, `${URL_APP}/**`];
  const mancanti = voglio.filter((x) => !lista.includes(x));
  if (mancanti.length) {
    const patch = await api(SB, { token: ENV.supabaseToken, method: "PATCH", body: { uri_allow_list: [...lista, ...mancanti].join(",") } });
    if (patch.ok) scrivi(`Supabase: ${URL_APP} aggiunto agli indirizzi ammessi per l'accesso.`);
    else avvisi.push(`Supabase: indirizzo dell'app non aggiunto (${patch.status}).`);
  } else scrivi("Supabase: l'app è già tra gli indirizzi ammessi.");
} else avvisi.push(`Supabase: non riesco a leggere la configurazione dell'accesso (${auth.status}).`);

// 6. Controlli online
async function apri(url, tentativi = 1) {
  for (let i = 0; i < tentativi; i++) {
    try { const x = await fetch(url, { redirect: "follow" }); return { status: x.status, testo: await x.text() }; }
    catch { await new Promise((ok) => setTimeout(ok, 10000)); }
  }
  return { status: 0, testo: "" };
}
const home = await apri(`https://${sottodominio}/`, 6);
if (home.status !== 200 || !/AncheCasa/i.test(home.testo)) ferma(`l'app su https://${sottodominio} non si apre (stato ${home.status}).`);
const sql = await apri(`https://${sottodominio}/sql/app-13-magazzino-mezzi.sql`);
if (/create table/i.test(sql.testo)) ferma("ATTENZIONE: i file SQL sono online. Controlla dist/.");
const conf = readFileSync(join(APP, "js", "config.js"), "utf8");
const versione = (conf.match(/versione:\s*"([^"]+)"/) || [])[1] || "";
const js = await apri(`https://${sottodominio}/js/config.js`);
if (versione && !js.testo.includes(versione)) avvisi.push(`la versione online non è ancora ${versione} (cache?).`);
scrivi(`Controllo: https://${sottodominio} si apre, i file SQL non sono online${versione ? ", versione " + versione : ""}.`);
const dominio = await apri(URL_APP + "/", 12);
if (dominio.status === 200 && /AncheCasa/i.test(dominio.testo)) scrivi(`${URL_APP} si apre.`);
else avvisi.push(`${URL_APP} non si apre ancora (stato ${dominio.status}): il certificato può richiedere qualche minuto. Riprova più tardi.`);

if (avvisi.length) scrivi("Da sapere:\n- " + avvisi.join("\n- "));
scrivi("Passo 3 finito.");
