/**
 * scrape-company-site
 * Fetch HOME (+ footer/header), estrai anagrafica e presentazione SOLO da testo reale.
 * Non inventa. Logo: URL reale (byte base64 solo se piccoli).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const url = typeof body?.url === "string" ? body.url : "";
    if (!url.trim()) {
      return json({ error: "URL è obbligatorio" }, 400);
    }

    let siteUrl = url.trim();
    if (!/^https?:\/\//i.test(siteUrl)) siteUrl = `https://${siteUrl}`;

    const fetched = await fetchHtmlRobust(siteUrl);
    const html = fetched.html;
    const textExtra = fetched.textExtra || "";
    const finalUrl = fetched.finalUrl || siteUrl;

    if (!html && !textExtra) {
      return json({
        success: true,
        data: {
          sito: finalUrl,
          nome_azienda: nomeFromHostname(finalUrl),
          logo_url: faviconFallback(finalUrl),
          _warning:
            fetched.warning ||
            "Sito non raggiungibile. Controlla l'URL o completa i campi a mano.",
        },
      });
    }

    const headerHtml = html ? sliceRegion(html, "header") : "";
    const footerHtml = html ? sliceRegion(html, "footer") : "";
    const homeMainHtml = html ? sliceHomeMain(html) : "";

    // Testo HOME dedicato (cosa fa l'azienda) — HTML main + reader
    const homeTextForPitch = [
      stripToText(homeMainHtml),
      stripToText(html || "").slice(0, 12000),
      textExtra,
    ]
      .filter((t) => t.length > 20)
      .join("\n\n")
      .slice(0, 40000);

    const fullText = [
      stripToText(footerHtml),
      stripToText(headerHtml),
      homeTextForPitch,
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 80000);

    let extracted: Record<string, unknown> = {};
    // Anagrafica: priorità footer → testo pieno → header → HTML
    extracted = mergeExtracted(extracted, extractContactsFromText(fullText));
    if (footerHtml) extracted = mergeExtracted(extracted, extractBasicsFromHtml(footerHtml, finalUrl));
    if (html) extracted = mergeExtracted(extracted, extractBasicsFromHtml(html, finalUrl));
    if (headerHtml) extracted = mergeExtracted(extracted, extractBasicsFromHtml(headerHtml, finalUrl));

    if (!extracted.nome_azienda) {
      extracted.nome_azienda =
        extractNomeFromHtml(html || "") || nomeFromHostname(finalUrl);
    }

    // ——— PRESENTAZIONE: legge la HOME e crea testo su cosa fa l'azienda ———
    let homePitch =
      extractHomePitch(html || "", homeMainHtml) ||
      extractPitchFromPlainText(homeTextForPitch) ||
      null;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (OPENAI_API_KEY && homeTextForPitch.length > 80) {
      try {
        const aiPresentazione = await Promise.race([
          runAiPresentazione(OPENAI_API_KEY, finalUrl, homeTextForPitch.slice(0, 18000)),
          new Promise<null>((r) => setTimeout(() => r(null), 14000)),
        ]);
        if (aiPresentazione && aiPresentazione.length >= 30) {
          homePitch = aiPresentazione.slice(0, 280);
        }
      } catch (e) {
        console.warn("AI presentazione skip", e);
      }
    }

    if (homePitch) {
      extracted.presentazione = homePitch;
      extracted.descrizione = homePitch;
    }

    let logoUrl =
      (typeof extracted._jsonld_logo === "string" ? extracted._jsonld_logo : null) ||
      (headerHtml ? extractLogo(headerHtml, finalUrl) : null) ||
      (html ? extractLogo(html, finalUrl) : null) ||
      (footerHtml ? extractLogo(footerHtml, finalUrl) : null) ||
      faviconFallback(finalUrl);
    delete extracted._jsonld_logo;

    // AI anagrafica (opzionale, non sovrascrive presentazione già buona)
    if (OPENAI_API_KEY && fullText.length > 120) {
      try {
        const aiPayload = await Promise.race([
          runAiExtract(OPENAI_API_KEY, finalUrl, fullText.slice(0, 18000)),
          new Promise<null>((r) => setTimeout(() => r(null), 10000)),
        ]);
        if (aiPayload) {
          const { presentazione: _p, descrizione: _d, ...rest } = aiPayload;
          extracted = mergeExtracted(extracted, rest);
          // Se manca ancora presentazione, usa quella AI
          if (!extracted.presentazione) {
            const aiP = str(aiPayload.presentazione) || str(aiPayload.descrizione);
            if (aiP) {
              extracted.presentazione = aiP.slice(0, 280);
              extracted.descrizione = aiP.slice(0, 280);
            }
          }
        }
      } catch (e) {
        console.warn("AI anagrafica skip", e);
      }
    }

    // Normalizza P.IVA / telefono
    if (typeof extracted.piva === "string") {
      const digits = extracted.piva.replace(/\D/g, "");
      extracted.piva = digits.length === 11 ? digits : null;
    }
    if (typeof extracted.telefono === "string") {
      extracted.telefono = extracted.telefono.replace(/\s+/g, " ").trim().slice(0, 40);
    }

    extracted.logo_url = logoUrl;
    extracted.sito = finalUrl;
    if (fetched.warning) extracted._warning = fetched.warning;

    // Base64 solo logo piccoli (evita timeout / body enorme)
    if (logoUrl && !/favicons\?domain=/i.test(logoUrl)) {
      const bytes = await fetchLogoOriginal(logoUrl, 120_000);
      if (bytes) {
        extracted.logo_base64 = bytes.base64;
        extracted.logo_mime = bytes.mime;
        extracted.logo_filename = bytes.filename;
      }
    }

    console.log(
      "scrape ok",
      JSON.stringify({
        sito: extracted.sito,
        nome: extracted.nome_azienda,
        email: extracted.email,
        tel: extracted.telefono,
        piva: extracted.piva,
        indirizzo: extracted.indirizzo,
        presentazione: String(extracted.presentazione || "").slice(0, 80),
        logo: extracted.logo_url,
        has_b64: Boolean(extracted.logo_base64),
        warning: extracted._warning || null,
      }),
    );

    return json({ success: true, data: extracted });
  } catch (e) {
    console.error("scrape-company-site error:", e);
    return json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Errore sconosciuto",
        data: null,
      },
      200,
    );
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function mergeExtracted(
  prefer: Record<string, unknown>,
  fill: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...fill };
  for (const [k, v] of Object.entries(prefer)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && !v.trim()) continue;
    if (Array.isArray(v) && !v.length) continue;
    out[k] = v;
  }
  return out;
}

async function fetchHtmlRobust(
  siteUrl: string,
): Promise<{ html: string | null; finalUrl: string; textExtra?: string; warning?: string }> {
  // Sempre in parallelo: HTML diretto + reader della HOME (per capire cosa fa l'azienda)
  const [direct, jinaHome] = await Promise.all([
    fetchHtml(siteUrl, 14000),
    fetchTextViaJina(siteUrl),
  ]);

  const textExtra = jinaHome && jinaHome.length > 80 ? jinaHome : undefined;

  if (direct.html && direct.html.length > 200) {
    return {
      html: direct.html,
      finalUrl: direct.finalUrl || siteUrl,
      textExtra,
      warning: direct.warning,
    };
  }

  if (textExtra) {
    return {
      html: direct.html,
      finalUrl: direct.finalUrl || siteUrl,
      textExtra,
      warning: direct.warning
        ? `${direct.warning} — testo HOME recuperato via reader.`
        : undefined,
    };
  }

  return {
    html: direct.html,
    finalUrl: direct.finalUrl || siteUrl,
    warning: direct.warning || "Nessun contenuto utile dal sito.",
  };
}

async function fetchHtml(
  siteUrl: string,
  timeoutMs = 12000,
): Promise<{ html: string | null; finalUrl: string; warning?: string }> {
  const candidates = uniqueUrls([
    siteUrl,
    (() => {
      try {
        const u = new URL(siteUrl);
        if (!u.hostname.startsWith("www.")) {
          u.hostname = `www.${u.hostname}`;
          return u.href;
        }
        u.hostname = u.hostname.replace(/^www\./i, "");
        return u.href;
      } catch {
        return "";
      }
    })(),
  ]);

  let lastErr = "unreachable";
  for (const candidate of candidates) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const resp = await fetch(candidate, {
        headers: {
          "User-Agent": BROWSER_UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!resp.ok) {
        lastErr = `HTTP ${resp.status}`;
        continue;
      }
      const html = await resp.text();
      if (!html || html.length < 80) {
        lastErr = "empty html";
        continue;
      }
      // Challenge / soft-block pages
      if (
        html.length < 1500 &&
        /just a moment|cf-browser-verification|attention required|access denied/i.test(html)
      ) {
        lastErr = "blocked";
        continue;
      }
      return { html, finalUrl: resp.url || candidate };
    } catch (e) {
      lastErr = e instanceof Error ? e.message : "fetch failed";
    }
  }
  return {
    html: null,
    finalUrl: siteUrl,
    warning: `Sito non raggiungibile dal server (${lastErr}).`,
  };
}

async function fetchTextViaJina(siteUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const resp = await fetch(`https://r.jina.ai/${siteUrl}`, {
      headers: {
        Accept: "text/plain",
        "User-Agent": BROWSER_UA,
        "X-Return-Format": "text",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const text = (await resp.text()).trim();
    return text.length > 80 ? text.slice(0, 50000) : null;
  } catch {
    return null;
  }
}

function uniqueUrls(list: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const u of list) {
    const t = (u || "").trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function originOf(siteUrl: string): string | null {
  try {
    return new URL(siteUrl).origin;
  } catch {
    return null;
  }
}
void originOf;

function nomeFromHostname(siteUrl: string): string {
  try {
    const host = new URL(siteUrl).hostname.replace(/^www\./i, "");
    const base = host.split(".")[0] || host;
    return base.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
  } catch {
    return "";
  }
}

function faviconFallback(siteUrl: string): string | null {
  try {
    const u = new URL(siteUrl);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=128`;
  } catch {
    return null;
  }
}

function sliceRegion(html: string, kind: "header" | "footer"): string {
  if (kind === "header") {
    return (
      html.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)?.[0] ||
      html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/i)?.[0] ||
      html.slice(0, Math.min(html.length, 25000))
    );
  }
  return (
    html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0] ||
    html.match(
      /<(?:div|section)\b[^>]*(?:id|class)=["'][^"']*footer[^"']*["'][^>]*>[\s\S]{0,20000}/i,
    )?.[0] ||
    html.slice(Math.max(0, html.length - 25000))
  );
}

function sliceHomeMain(html: string): string {
  const main = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0];
  if (main && main.length > 200) return main;
  const hero = html.match(
    /<(?:section|div)\b[^>]*(?:hero|jumbotron|intro|chi-siamo|about)[^>]*>[\s\S]{0,20000}/i,
  )?.[0];
  if (hero && hero.length > 120) return hero;
  return html
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .slice(0, 35000);
}

function stripToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

/** Contatti da testo grezzo (footer / reader). */
function extractContactsFromText(text: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const t = text;

  const emails = [
    ...t.matchAll(
      /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.(?:it|com|eu|net|org|biz))\b/gi,
    ),
  ]
    .map((m) => m[1])
    .filter((e) => !/example|sentry|wixpress|cloudflare|schema|wordpress|noreply|cookie/i.test(e));
  if (emails[0]) out.email = emails[0];

  const tel =
    t.match(/tel:\s*([+\d][\d\s./()-]{6,})/i)?.[1] ||
    t.match(/(?:Tel\.?|Telefono|Phone|Cell\.?|Mobile)[:\s]+([+\d][\d\s./()-]{7,})/i)?.[1] ||
    t.match(/(\+39[\s.]?\d{2,4}[\s./-]?\d{5,8})/)?.[1];
  if (tel) out.telefono = tel.replace(/\s+/g, " ").trim();

  const piva =
    t.match(/P\.?\s*IVA[:\s]*([0-9\s]{11,17})/i)?.[1] ||
    t.match(/Partita\s+IVA[:\s]*([0-9\s]{11,17})/i)?.[1] ||
    t.match(/\bIT\s*([0-9]{11})\b/i)?.[1];
  if (piva) {
    const d = piva.replace(/\D/g, "");
    if (d.length === 11) out.piva = d;
  }

  const cf = t.match(/C\.?\s*F\.?[:\s]*([A-Z0-9]{11,16})/i)?.[1];
  if (cf) out.codice_fiscale = cf;

  const addr =
    t.match(
      /(?:Sede\s+legale|Indirizzo)[:\s]+((?:Via|Viale|Piazza|Corso|Vicolo|Largo)[^.\n]{6,100})/i,
    )?.[1] ||
    t.match(/((?:Via|Viale|Piazza|Corso)\s+[A-Za-zÀ-ù0-9'’.\s]{4,60},?\s*\d{1,5}[^.\n]{0,40})/i)?.[1];
  if (addr) out.indirizzo = addr.replace(/\s+/g, " ").trim().slice(0, 160);

  return out;
}

function extractNomeFromHtml(html: string): string | null {
  const ogSite =
    html.match(/property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i)?.[1];
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  const h1 = html
    .match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    ?.replace(/<[^>]+>/g, " ");
  const clean = (raw: string) =>
    decodeEntities(raw)
      .replace(/\s*[|\-–—·•].*$/, "")
      .replace(/\s+Home\s*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
  for (const c of [ogSite, h1, title]) {
    if (!c) continue;
    const n = clean(c);
    if (n.length >= 2 && n.length <= 120 && !/cookie|privacy|login/i.test(n)) return n;
  }
  return null;
}

function extractBasicsFromHtml(html: string, siteUrl: string): Record<string, unknown> {
  const out: Record<string, unknown> = extractContactsFromText(stripToText(html));
  const nome = extractNomeFromHtml(html);
  if (nome) out.nome_azienda = nome;

  const desc =
    html.match(/name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1] ||
    html.match(/property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (desc?.trim()) out.descrizione = decodeEntities(desc).trim().slice(0, 500);

  // JSON-LD
  const ldBlocks = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  if (ldBlocks) {
    for (const block of ldBlocks) {
      const raw = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
      try {
        const data = JSON.parse(raw);
        const nodes = Array.isArray(data) ? data : data["@graph"] ? data["@graph"] : [data];
        for (const node of nodes) {
          if (!node || typeof node !== "object") continue;
          const typ = String(node["@type"] || "");
          if (!/organization|localbusiness|corporation|store/i.test(typ)) continue;
          if (!out.nome_azienda && node.name) out.nome_azienda = String(node.name).trim();
          if (!out.email && node.email) {
            out.email = String(node.email).replace(/^mailto:/i, "");
          }
          if (!out.telefono && node.telephone) out.telefono = String(node.telephone);
          const addrObj = node.address;
          if (addrObj && typeof addrObj === "object") {
            if (!out.indirizzo && addrObj.streetAddress) {
              out.indirizzo = String(addrObj.streetAddress);
            }
            if (!out.citta && addrObj.addressLocality) {
              out.citta = String(addrObj.addressLocality);
            }
            if (!out.regione && addrObj.addressRegion) {
              out.regione = String(addrObj.addressRegion);
            }
          }
          if (node.logo) {
            const logo =
              typeof node.logo === "string"
                ? node.logo
                : node.logo?.url || node.logo?.contentUrl;
            if (logo) out._jsonld_logo = resolveUrl(String(logo), siteUrl);
          }
          if (node.vatID || node.taxID) {
            const vat = String(node.vatID || node.taxID).replace(/\D/g, "");
            if (vat.length === 11) out.piva = vat;
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  try {
    out.sito = new URL(siteUrl).href;
  } catch {
    out.sito = siteUrl;
  }
  return out;
}

function extractHomePitch(fullHtml: string, homeHtml: string): string | null {
  const src = homeHtml || fullHtml;
  if (!src) return null;
  const clean = (raw: string) =>
    decodeEntities(raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();

  const meta =
    fullHtml.match(/name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    fullHtml.match(/content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1] ||
    fullHtml.match(/property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1];

  const h1 = clean(src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  const h2s = [...src.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map((m) => clean(m[1] || ""))
    .filter((t) => t.length >= 15 && t.length <= 140 && !/cookie|menu|login/i.test(t))
    .slice(0, 2);
  const paras = [...src.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => clean(m[1] || ""))
    .filter(
      (p) =>
        p.length >= 35 &&
        p.length <= 320 &&
        !/cookie|privacy|newsletter|copyright|all rights|iscriviti/i.test(p),
    )
    .slice(0, 3);

  const parts: string[] = [];
  const metaClean = meta ? clean(meta) : "";
  if (metaClean.length >= 35) parts.push(metaClean);
  if (h1.length >= 12 && !parts.some((p) => p.includes(h1))) parts.push(h1);
  if (h2s[0] && parts.join(" ").length < 180) parts.push(h2s[0]);
  for (const p of paras) {
    if (parts.join(" ").length >= 220) break;
    if (!parts.some((x) => x.includes(p.slice(0, 40)))) parts.push(p);
  }

  return finalizePitch(parts.join(". "));
}

function extractPitchFromPlainText(text: string): string | null {
  if (!text || text.length < 35) return null;
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^#+\s*/, "").trim())
    .filter(
      (l) =>
        l.length >= 35 &&
        l.length <= 300 &&
        !/^(Title|URL|Published|Warning|Markdown Image):/i.test(l) &&
        !/cookie|privacy|copyright|\[.*\]\(http/i.test(l),
    );
  // Preferisci 1-2 frasi consecutive utili
  const chunk = lines.slice(0, 3).join(" ");
  return finalizePitch(chunk || text.slice(0, 280));
}

function finalizePitch(raw: string): string | null {
  let text = raw.replace(/\s+/g, " ").replace(/\.\s*\./g, ".").trim();
  if (text.length < 30) return null;
  if (text.length > 280) {
    text = text.slice(0, 279).replace(/\s+\S*$/, "").trimEnd();
    if (!/[.!?…]$/.test(text)) text += "…";
  } else if (!/[.!?…]$/.test(text)) {
    text += ".";
  }
  return text;
}

function extractLogo(html: string, baseUrl: string): string | null {
  const ldLogo =
    html.match(/"logo"\s*:\s*"([^"]+)"/i)?.[1] ||
    html.match(/"logo"\s*:\s*\{\s*"url"\s*:\s*"([^"]+)"/i)?.[1];
  if (ldLogo && !/sprite|placeholder|data:image\/gif/i.test(ldLogo)) {
    return resolveUrl(ldLogo, baseUrl);
  }

  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  const scored: Array<{ url: string; score: number }> = [];
  for (const tag of imgTags) {
    const src = pickImgSrc(tag);
    if (!src || /sprite|icon-set|flags?|pixel|tracking|1x1|spacer/i.test(src)) continue;
    if (/^data:image\/gif/i.test(src)) continue;
    let score = 0;
    const meta = tag.toLowerCase();
    if (/logo|brand|site-logo|navbar-brand/i.test(meta)) score += 8;
    if (/logo|brand/i.test(src)) score += 6;
    if (/\.(svg|png|webp)(\?|$)/i.test(src)) score += 3;
    if (/favicon|icon-/i.test(src)) score -= 5;
    if (/banner|hero|cover|og-/i.test(src)) score -= 2;
    if (score > 0) scored.push({ url: resolveUrl(src, baseUrl), score });
  }
  scored.sort((a, b) => b.score - a.score);
  if (scored[0]?.score >= 5) return scored[0].url;

  const apple =
    html.match(/rel=["']apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i)?.[1] ||
    html.match(/href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon/i)?.[1];
  if (apple) return resolveUrl(apple, baseUrl);

  return null;
}

function pickImgSrc(tag: string): string | null {
  const srcset = tag.match(/\bsrcset=["']([^"']+)["']/i)?.[1];
  if (srcset) {
    const parts = srcset
      .split(",")
      .map((p) => p.trim().split(/\s+/)[0])
      .filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return (
    tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ||
    tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1] ||
    tag.match(/\bdata-lazy-src=["']([^"']+)["']/i)?.[1] ||
    null
  );
}

function resolveUrl(path: string, base: string): string {
  try {
    return new URL(path, base).href;
  } catch {
    return path;
  }
}

async function fetchLogoOriginal(
  logoUrl: string,
  maxBytes: number,
): Promise<{ base64: string; mime: string; filename: string } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(logoUrl, {
      headers: { "User-Agent": BROWSER_UA, Accept: "image/*,*/*;q=0.8" },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    let mime = (resp.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const buf = new Uint8Array(await resp.arrayBuffer());
    if (buf.length < 80 || buf.length > maxBytes) return null;
    if (!mime || mime === "application/octet-stream") {
      if (/\.svg(\?|$)/i.test(logoUrl) || looksLikeSvg(buf)) mime = "image/svg+xml";
      else if (buf[0] === 0x89 && buf[1] === 0x50) mime = "image/png";
      else if (buf[0] === 0xff && buf[1] === 0xd8) mime = "image/jpeg";
      else mime = "image/png";
    }
    if (!/^image\//i.test(mime)) return null;
    const ext = mime.includes("svg")
      ? "svg"
      : mime.includes("jpeg")
        ? "jpg"
        : mime.includes("webp")
          ? "webp"
          : "png";
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    return { base64: btoa(binary), mime, filename: `logo-sito.${ext}` };
  } catch {
    return null;
  }
}

function looksLikeSvg(buf: Uint8Array): boolean {
  const head = new TextDecoder().decode(buf.subarray(0, Math.min(buf.length, 200))).toLowerCase();
  return head.includes("<svg") || head.includes("<?xml");
}

async function runAiPresentazione(
  apiKey: string,
  siteUrl: string,
  homeText: string,
): Promise<string | null> {
  const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Leggi il testo della HOME PAGE di un'azienda. Scrivi una presentazione in italiano " +
            "di 1-2 frasi (max 280 caratteri) che spiega di cosa si occupa l'azienda. " +
            "Usa SOLO informazioni presenti nel testo. Non inventare servizi, città, anni o claim. " +
            "Tono chiaro e professionale. Se il testo non basta, rispondi esattamente NULL.",
        },
        {
          role: "user",
          content: `HOME del sito ${siteUrl}:\n\n${homeText}\n\nRispondi solo con il testo della presentazione, oppure NULL.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 160,
    }),
  });
  if (!aiResponse.ok) {
    console.warn("AI presentazione http", aiResponse.status, await aiResponse.text());
    return null;
  }
  const aiData = await aiResponse.json();
  const content = String(aiData.choices?.[0]?.message?.content || "").trim();
  if (!content || /^null$/i.test(content) || content.length < 30) return null;
  return content.replace(/^["«]|["»]$/g, "").trim().slice(0, 280);
}

async function runAiExtract(
  apiKey: string,
  siteUrl: string,
  text: string,
): Promise<Record<string, unknown> | null> {
  const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Estrai SOLO dati espliciti dal testo di un sito aziendale. Non inventare. " +
            "presentazione = 1-2 frasi su di cosa si occupa (max 280), solo da testo HOME. " +
            "Se un campo non è nel testo → null. Rispondi solo con function call.",
        },
        { role: "user", content: `Sito ${siteUrl}\n\n${text}` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_company_data",
            parameters: {
              type: "object",
              properties: {
                nome_azienda: { type: ["string", "null"] },
                piva: { type: ["string", "null"] },
                codice_fiscale: { type: ["string", "null"] },
                email: { type: ["string", "null"] },
                telefono: { type: ["string", "null"] },
                indirizzo: { type: ["string", "null"] },
                citta: { type: ["string", "null"] },
                regione: { type: ["string", "null"] },
                settore: { type: ["string", "null"] },
                presentazione: { type: ["string", "null"] },
                descrizione: { type: ["string", "null"] },
              },
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_company_data" } },
    }),
  });
  if (!aiResponse.ok) {
    console.warn("AI http", aiResponse.status, await aiResponse.text());
    return null;
  }
  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return null;
  return JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
}
