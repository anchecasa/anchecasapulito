import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { buildShareAcceptedSms, buildShareCodeSms, buildShareLinkSms, sendSms } from "@/lib/sms";
import { verifyLead } from "@/lib/sos/lead-token";
import { isRateLimited } from "@/lib/sos/rate-limit";
import { distanceKm, formatArtisanDistance } from "@/lib/sos/search-artisans";
import {
  normalizePhone,
  shareMessage,
  toE164,
  type AskKind,
  type ChiediItem,
  type PublicAnswer,
  type RequestShare,
  type ShareReply,
} from "@/lib/sos/share-copy";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COOKIE = "sm_sos_session";
const STATO = ["mai", "inviato", "aperto", "risposto", "iscritto"] as const;
const ASK = ["altro_video", "foto_vicino", "misure", "marca_modello", "domanda"] as const;
const RISPOSTA = ["posso_venire", "info", "non_posso"] as const;
const VIDEO_MIME = ["video/webm", "video/mp4", "video/quicktime"];
// Solo video registrati dal vivo: in SuperMastro nessuno allega foto.
const ANSWER_MIME = [...VIDEO_MIME];
const MAX_BYTES = 8 * 1024 * 1024;
const SIGNED_SECONDS = 600;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_PER_DAY = 3;
const OTP_MAX_ATTEMPTS = 5;
const MAX_ASKS = 10;

export type { AskKind, ChiediItem, PublicAnswer, RequestShare, ShareReply } from "@/lib/sos/share-copy";

type LeadRow = {
  id: string;
  nome: string;
  mestiere: string;
  telefono: string | null;
  telefono_norm: string | null;
  stato: string;
  opt_out: boolean;
  lat: number;
  lng: number;
};

type ShareRow = {
  id: string;
  token: string;
  diagnosis_id: string | null;
  lead_id: string;
  video_path: string | null;
  zona: string;
  distanza: string;
  guasto: string;
  scade_il: string;
  risposta: ShareReply | null;
  chiedi: ChiediItem[] | null;
  otp_hash: string | null;
  otp_phone: string | null;
  otp_expires: string | null;
  otp_attempts: number;
  otp_sent_at: string | null;
  otp_day: string | null;
  otp_day_count: number;
  artigiano_telefono: string | null;
  verificato_il: string | null;
  cliente_telefono: string | null;
  accettato_il: string | null;
  created_at: string;
};

const SHARE_COLUMNS =
  "id, token, diagnosis_id, lead_id, video_path, zona, distanza, guasto, scade_il, risposta, chiedi, otp_hash, otp_phone, otp_expires, otp_attempts, otp_sent_at, otp_day, otp_day_count, artigiano_telefono, verificato_il, cliente_telefono, accettato_il, created_at";
const LEAD_COLUMNS = "id, nome, mestiere, telefono, telefono_norm, stato, opt_out, lat, lng";

function admin() {
  return createAdminClient();
}

function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

function baseMime(type: string) {
  return (type.split(";")[0] ?? "").trim().toLowerCase();
}

function extOf(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/heic") return "heic";
  if (mime === "image/heif") return "heif";
  if (mime === "video/mp4") return "mp4";
  if (mime === "video/quicktime") return "mov";
  return "webm";
}

function bump(current: string, next: (typeof STATO)[number]) {
  const from = STATO.indexOf(current as (typeof STATO)[number]);
  const to = STATO.indexOf(next);
  if (from < 0 || to < 0) return next;
  return to > from ? next : current;
}

/** Indirizzo pubblico del sito: solo NEXT_PUBLIC_SITE_URL, mai gli header della richiesta. */
export function siteUrl(): string | null {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (/^https?:\/\/[^/\s?#]+$/i.test(raw)) return raw;
  if (process.env.NODE_ENV === "development") return "http://localhost:3011";
  return null;
}

async function ownsDiagnosis(id: string) {
  if (!UUID.test(id)) return null;
  const db = admin();
  const jar = await cookies();
  const session = jar.get(COOKIE)?.value ?? "";
  let user: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user?.id ?? null;
  } catch {
    user = null;
  }
  const { data, error } = await db
    .from("sos_video_diagnoses")
    .select("id, session_id, user_id, titolo, payload")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const mine = (user && data.user_id === user) || (UUID.test(session) && data.session_id === session);
  return mine ? data : null;
}

async function coarseZone(lat: number, lng: number) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "12");
  url.searchParams.set("accept-language", "it");
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "AncheCasa-SuperMastro/1.0 (contact@anchecasa.it)",
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return "In zona";
    const data = (await res.json()) as { address?: Record<string, string> };
    const address = data.address ?? {};
    const place = address.city || address.town || address.village || address.municipality || address.suburb || "";
    return place.trim() || "In zona";
  } catch {
    return "In zona";
  }
}

async function event(leadId: string, tipo: string, requestId: string | null) {
  await admin().from("lead_events").insert({ lead_id: leadId, tipo, request_id: requestId });
}

/** Un numero che ha chiesto di non ricevere più richieste resta bloccato su ogni scheda. */
async function phoneOptedOut(norm: string) {
  if (!norm) return false;
  const { data, error } = await admin()
    .from("artisan_leads")
    .select("id")
    .eq("telefono_norm", norm)
    .eq("opt_out", true)
    .limit(1);
  if (error) return true;
  return (data ?? []).length > 0;
}

async function leadBlocked(lead: Pick<LeadRow, "opt_out" | "telefono" | "telefono_norm">) {
  if (lead.opt_out) return true;
  return phoneOptedOut(lead.telefono_norm || normalizePhone(lead.telefono));
}

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function createShare(input: {
  diagnosisId: string;
  leadToken: string;
  faultLat: number | null;
  faultLng: number | null;
  file: File;
}) {
  const diagnosis = await ownsDiagnosis(input.diagnosisId);
  if (!diagnosis) return { error: "Questa diagnosi non è tua.", status: 403 as const };
  const claim = verifyLead(input.leadToken);
  if (!claim) return { error: "Questa scheda non si può contattare. Torna alla mappa.", status: 400 as const };
  if (input.file.size <= 0 || input.file.size > MAX_BYTES) {
    return { error: "Il video deve restare entro 5 secondi.", status: 400 as const };
  }
  const mime = baseMime(input.file.type) || "video/webm";
  if (!VIDEO_MIME.includes(mime)) {
    return { error: "Formato video non accettato.", status: 400 as const };
  }

  const db = admin();
  // Artigiano della rete: il telefono resta nella cassaforte contatti, lo legge solo il server.
  if (claim.fonte === "rete") {
    const workerId = claim.fonteId.slice("rete/".length);
    const { data: contact } = await db
      .from("contact_vault")
      .select("phone")
      .eq("owner_type", "worker")
      .eq("owner_id", workerId)
      .maybeSingle();
    const phone = typeof contact?.phone === "string" ? contact.phone.trim() : "";
    if (!phone) return { error: "Questo artigiano non ha ancora un numero. Scegline un altro.", status: 409 as const };
    claim.telefono = phone;
  }
  const telefonoNorm = normalizePhone(claim.telefono);
  const { data: existingLead } = await db
    .from("artisan_leads")
    .select("id, opt_out, volte_trovato, stato, telefono, telefono_norm")
    .eq("fonte", claim.fonte)
    .eq("fonte_id", claim.fonteId)
    .maybeSingle();
  if (existingLead?.opt_out || (await phoneOptedOut(telefonoNorm))) {
    return { error: "Questa attività non vuole altre richieste.", status: 409 as const };
  }

  if (existingLead?.id) {
    const { data: prior } = await db
      .from("sos_shared_requests")
      .select("id, token, zona, distanza, guasto, video_path, scade_il")
      .eq("lead_id", existingLead.id)
      .eq("diagnosis_id", input.diagnosisId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (prior?.video_path && new Date(prior.scade_il).getTime() > Date.now()) {
      return {
        token: prior.token as string,
        shareId: prior.id as string,
        zona: prior.zona as string,
        distanza: prior.distanza as string,
        guasto: prior.guasto as string,
      };
    }
  }

  // Posizione del guasto: prima quella salvata nella diagnosi, poi quella della mappa.
  const payload = (diagnosis.payload ?? {}) as { lat?: unknown; lng?: unknown; summary?: unknown };
  const faultLat = numberOrNull(payload.lat) ?? input.faultLat;
  const faultLng = numberOrNull(payload.lng) ?? input.faultLng;
  let zona = "In zona";
  let distanza = "";
  if (faultLat != null && faultLng != null) {
    zona = await coarseZone(faultLat, faultLng);
    distanza = formatArtisanDistance(distanceKm(faultLat, faultLng, claim.lat, claim.lng));
  }
  const guasto = clip(String(diagnosis.titolo || payload.summary || "Richiesta di lavoro"), 180);

  const token = randomBytes(24).toString("base64url");
  const path = `${token}.${extOf(mime)}`;
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const uploaded = await db.storage.from("sos-video").upload(path, bytes, { contentType: mime, upsert: false });
  if (uploaded.error) return { error: "Il video è rimasto sul telefono.", status: 503 as const };

  let leadId = existingLead?.id as string | undefined;
  if (!leadId) {
    const inserted = await db
      .from("artisan_leads")
      .insert({
        fonte: claim.fonte,
        fonte_id: claim.fonteId,
        nome: clip(claim.nome, 160) || "Attività in zona",
        mestiere: clip(claim.mestiere, 80),
        telefono: claim.telefono ? clip(claim.telefono, 40) : null,
        telefono_norm: telefonoNorm || null,
        indirizzo: clip(claim.indirizzo, 180),
        lat: claim.lat,
        lng: claim.lng,
        stato: "mai",
      })
      .select("id")
      .single();
    if (inserted.error || !inserted.data) {
      await db.storage.from("sos-video").remove([path]);
      return { error: "Scheda non salvata.", status: 503 as const };
    }
    leadId = inserted.data.id as string;
    await event(leadId, "trovato", null);
  } else {
    // Mai sovrascrivere nome, telefono o indirizzo di una scheda esistente.
    const update: Record<string, unknown> = { volte_trovato: Number(existingLead?.volte_trovato ?? 1) + 1 };
    if (!existingLead?.telefono_norm && existingLead?.telefono) {
      update.telefono_norm = normalizePhone(existingLead.telefono as string) || null;
    }
    await db.from("artisan_leads").update(update).eq("id", leadId);
  }

  const share = await db
    .from("sos_shared_requests")
    .insert({
      token,
      diagnosis_id: input.diagnosisId,
      lead_id: leadId,
      video_path: path,
      zona,
      distanza,
      guasto,
      scade_il: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    })
    .select("id, token, zona, distanza, guasto")
    .single();
  if (share.error || !share.data) {
    await db.storage.from("sos-video").remove([path]);
    return { error: "Richiesta non salvata.", status: 503 as const };
  }
  await db.from("artisan_leads").update({ ultima_richiesta_id: share.data.id }).eq("id", leadId);
  return {
    token: share.data.token as string,
    shareId: share.data.id as string,
    zona: share.data.zona as string,
    distanza: share.data.distanza as string,
    guasto: share.data.guasto as string,
  };
}

async function shareByToken(token: string) {
  if (!token || token.length < 20 || token.length > 80) return null;
  const { data, error } = await admin().from("sos_shared_requests").select(SHARE_COLUMNS).eq("token", token).maybeSingle();
  if (error || !data) return null;
  return data as unknown as ShareRow;
}

async function leadOf(id: string) {
  const { data } = await admin().from("artisan_leads").select(LEAD_COLUMNS).eq("id", id).maybeSingle();
  return (data as LeadRow | null) ?? null;
}

async function signedUrl(path: string) {
  if (!path) return null;
  const signed = await admin().storage.from("sos-video").createSignedUrl(path, SIGNED_SECONDS);
  return signed.data?.signedUrl ?? null;
}

export async function loadPublicShare(token: string) {
  try {
    const share = await shareByToken(token);
    if (!share) return { ok: false as const, reason: "missing" as const };
    const lead = await leadOf(share.lead_id);
    if (!lead) return { ok: false as const, reason: "missing" as const };
    if (new Date(share.scade_il).getTime() <= Date.now()) return { ok: false as const, reason: "closed" as const };

    const opened = await admin()
      .from("lead_events")
      .select("id")
      .eq("request_id", share.id)
      .eq("tipo", "link_aperto")
      .limit(1);
    if (!opened.error && (opened.data ?? []).length === 0) {
      await event(lead.id, "link_aperto", share.id);
      await admin()
        .from("artisan_leads")
        .update({ stato: bump(lead.stato, "aperto") })
        .eq("id", lead.id);
    }

    const videoUrl = share.video_path ? await signedUrl(share.video_path) : null;
    let titolo = share.guasto || "Richiesta di lavoro";
    let visto = share.guasto || "";
    if (share.diagnosis_id) {
      const diagnosis = await admin()
        .from("sos_video_diagnoses")
        .select("titolo, payload")
        .eq("id", share.diagnosis_id)
        .maybeSingle();
      const payload = diagnosis.data?.payload as { visto_sentito?: string; summary?: string } | undefined;
      titolo = diagnosis.data?.titolo || payload?.summary || titolo;
      visto = payload?.visto_sentito || payload?.summary || visto;
    }

    const items = Array.isArray(share.chiedi) ? share.chiedi : [];
    const answers: PublicAnswer[] = await Promise.all(
      items.map(async (item) => {
        const url = item.risposta_path ? await signedUrl(item.risposta_path) : null;
        const kind: "video" | "foto" = /\.(webm|mp4|mov)$/i.test(item.risposta_path) ? "video" : "foto";
        return {
          id: item.id,
          tipo: item.tipo,
          messaggio: item.messaggio,
          risposta_testo: item.risposta_testo,
          file: url ? { url, kind } : null,
        };
      }),
    );

    // Il numero del cliente si vede solo se il cliente ha accettato
    // e l'artigiano ha confermato il suo cellulare con il codice.
    const verificato = Boolean(share.verificato_il && share.artigiano_telefono);
    const accettato = Boolean(share.accettato_il && share.cliente_telefono);

    return {
      ok: true as const,
      token: share.token,
      createdAt: share.created_at,
      zona: share.zona || "In zona",
      distanza: share.distanza || "in zona",
      videoUrl,
      titolo,
      visto,
      risposta: share.risposta,
      nome: lead.nome,
      mestiere: lead.mestiere,
      telefono: lead.telefono || "",
      optOut: lead.opt_out,
      answers,
      verificato,
      accettato,
      clienteTelefono: accettato && verificato ? share.cliente_telefono : null,
    };
  } catch {
    return { ok: false as const, reason: "unavailable" as const };
  }
}

/** Invio del link all'attività. Solo chi ha fatto la diagnosi. */
export async function markSent(token: string, channel: "whatsapp" | "sms") {
  const share = await shareByToken(token);
  if (!share) return { error: "Richiesta assente.", status: 404 as const };
  if (!share.diagnosis_id || !(await ownsDiagnosis(share.diagnosis_id))) {
    return { error: "Questa richiesta non è tua.", status: 403 as const };
  }
  if (new Date(share.scade_il).getTime() <= Date.now()) return { error: "Richiesta chiusa.", status: 410 as const };
  const lead = await leadOf(share.lead_id);
  if (!lead) return { error: "Scheda assente.", status: 404 as const };
  if (await leadBlocked(lead)) return { error: "Questa attività non vuole altre richieste.", status: 409 as const };
  const site = siteUrl();
  if (!site) return { error: "Indirizzo del sito non configurato.", status: 503 as const };
  const url = `${site}/r/${share.token}`;
  const text = shareMessage({
    titolo: share.guasto || "Richiesta di lavoro",
    zona: share.zona || "In zona",
    distanza: share.distanza || "in zona",
    url,
  });
  const phone = toE164(lead.telefono || "");
  if (!phone) return { error: "Numero non pubblicato.", status: 400 as const };
  if (channel === "sms") {
    // Massimo 2 SMS al giorno allo stesso numero. Se il controllo non risponde, non si invia.
    if (await isRateLimited([{ bucket: "sms:to", who: phone, windowSeconds: 86400, max: 2 }], "closed")) {
      return { error: "Abbiamo già scritto a questo numero oggi. Usa WhatsApp o riprova domani.", status: 429 as const };
    }
    const sent = await sendSms(phone, buildShareLinkSms(url));
    if (sent.error) return { error: "SMS non partito.", status: 502 as const };
  }
  await event(lead.id, "video_inviato", share.id);
  await admin()
    .from("artisan_leads")
    .update({ stato: bump(lead.stato, "inviato"), ultima_richiesta_id: share.id })
    .eq("id", lead.id);
  return { url, text, phone };
}

export async function respondShare(token: string, risposta: ShareReply) {
  if (!RISPOSTA.includes(risposta)) return { error: "Risposta non valida.", status: 400 as const };
  const share = await shareByToken(token);
  if (!share) return { error: "Richiesta assente.", status: 404 as const };
  if (share.risposta) return { ok: true as const, risposta: share.risposta };
  const lead = await leadOf(share.lead_id);
  if (!lead || (await leadBlocked(lead))) return { error: "Richieste fermate.", status: 409 as const };
  const saved = await admin().from("sos_shared_requests").update({ risposta }).eq("id", share.id).is("risposta", null);
  if (saved.error) return { error: "Risposta non salvata.", status: 503 as const };
  await event(lead.id, "risposto", share.id);
  await admin().from("artisan_leads").update({ stato: bump(lead.stato, "risposto") }).eq("id", lead.id);
  return { ok: true as const, risposta };
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

export async function sendShareCode(token: string, phone: string) {
  const share = await shareByToken(token);
  if (!share?.risposta) return { error: "Prima scegli una risposta.", status: 400 as const };
  if (share.verificato_il && share.artigiano_telefono) return { ok: true as const, verified: true as const };
  const lead = await leadOf(share.lead_id);
  if (!lead || (await leadBlocked(lead))) return { error: "Richieste fermate.", status: 409 as const };
  const e164 = toE164(phone);
  if (!e164) return { error: "Scrivi un cellulare valido.", status: 400 as const };
  if (await phoneOptedOut(e164)) {
    return { error: "Questo numero non riceve messaggi da SuperMastro.", status: 409 as const };
  }

  const today = todayUtc();
  const sameDay = share.otp_day === today;
  const count = sameDay ? share.otp_day_count : 0;
  // I tentativi sbagliati non si azzerano chiedendo un codice nuovo: solo il giorno dopo.
  const attempts = sameDay ? share.otp_attempts : 0;
  if (share.otp_sent_at && Date.now() - new Date(share.otp_sent_at).getTime() < OTP_COOLDOWN_MS) {
    return { error: "Aspetta un minuto prima di chiedere un altro codice.", status: 429 as const };
  }
  if (count >= OTP_PER_DAY) {
    return { error: "Hai già chiesto 3 codici oggi. Riprova domani.", status: 429 as const };
  }
  if (await isRateLimited([{ bucket: "otp:to", who: e164, windowSeconds: 86400, max: OTP_PER_DAY * 2 }], "closed")) {
    return { error: "Troppi codici per questo numero. Riprova domani.", status: 429 as const };
  }

  const code = String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, "0");
  const otpHash = createHash("sha256").update(`${token}:${code}`).digest("hex");
  const base = admin()
    .from("sos_shared_requests")
    .update({
      otp_hash: otpHash,
      otp_phone: e164,
      otp_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      otp_attempts: attempts,
      otp_sent_at: new Date().toISOString(),
      otp_day: today,
      otp_day_count: count + 1,
    })
    .eq("id", share.id)
    .eq("otp_day_count", share.otp_day_count);
  // Blocco ottimistico: due richieste insieme non mandano due codici.
  const guarded = share.otp_sent_at ? base.eq("otp_sent_at", share.otp_sent_at) : base.is("otp_sent_at", null);
  const saved = await guarded.select("id");
  if (saved.error) return { error: "Codice non preparato.", status: 503 as const };
  if ((saved.data ?? []).length === 0) {
    return { error: "Aspetta un minuto prima di chiedere un altro codice.", status: 429 as const };
  }
  const sent = await sendSms(e164, buildShareCodeSms(code));
  if (sent.error) return { error: "SMS non partito.", status: 502 as const };
  const devCode = process.env.NODE_ENV === "development" && !process.env.TWILIO_ACCOUNT_SID ? code : undefined;
  return { ok: true as const, devCode };
}

export async function verifyShareCode(token: string, code: string) {
  const share = await shareByToken(token);
  if (share?.verificato_il && share.artigiano_telefono) return { ok: true as const, phone: share.artigiano_telefono };
  if (!share?.otp_hash || !share.otp_phone || !share.otp_expires) return { error: "Chiedi un codice nuovo.", status: 400 as const };
  if (share.otp_attempts >= OTP_MAX_ATTEMPTS || new Date(share.otp_expires).getTime() <= Date.now()) {
    await admin().from("sos_shared_requests").update({ otp_hash: null, otp_expires: null }).eq("id", share.id);
    return { error: "Codice scaduto. Chiedine uno nuovo.", status: 400 as const };
  }
  const given = createHash("sha256").update(`${token}:${code.trim()}`).digest("hex");
  const left = Buffer.from(given);
  const right = Buffer.from(share.otp_hash);
  const match = left.length === right.length && timingSafeEqual(left, right);
  if (!match) {
    await admin()
      .from("sos_shared_requests")
      .update({ otp_attempts: share.otp_attempts + 1 })
      .eq("id", share.id);
    return { error: "Codice non giusto.", status: 400 as const };
  }
  await admin()
    .from("sos_shared_requests")
    .update({
      otp_hash: null,
      otp_expires: null,
      artigiano_telefono: share.otp_phone,
      verificato_il: new Date().toISOString(),
    })
    .eq("id", share.id);
  return { ok: true as const, phone: share.otp_phone };
}

async function skillIdFor(mestiere: string) {
  const { data } = await admin().from("skills").select("id, slug, label");
  const wanted = mestiere.toLowerCase().trim();
  const rows = (data ?? []) as { id: string; slug: string; label: string }[];
  return (
    rows.find((row) => row.slug.toLowerCase() === wanted || row.label.toLowerCase() === wanted)?.id ??
    rows.find((row) => row.label.toLowerCase().split("/")[0]?.trim() === wanted)?.id ??
    null
  );
}

function loginHref(phone: string, state: "nuovo" | "esiste") {
  const params = new URLSearchParams({ telefono: phone, profilo: state });
  return `/artigiano/auth/login?${params.toString()}`;
}

export async function createShareProfile(token: string, nome: string, mestiere: string) {
  const share = await shareByToken(token);
  if (!share?.artigiano_telefono || !share.verificato_il) return { error: "Conferma prima il codice.", status: 400 as const };
  const lead = await leadOf(share.lead_id);
  if (!lead) return { error: "Scheda assente.", status: 404 as const };
  const phone = share.artigiano_telefono;
  const display = clip(nome || lead.nome, 80);
  const trade = clip(mestiere || lead.mestiere, 80);
  const db = admin();
  const created = await db.auth.admin.createUser({
    phone,
    phone_confirm: true,
    user_metadata: { role: "worker", display_name: display },
  });
  if (created.error || !created.data.user) {
    const message = created.error?.message?.toLowerCase() ?? "";
    if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
      return { ok: true as const, existing: true, loginHref: loginHref(phone, "esiste") };
    }
    return { error: "Profilo non creato.", status: 503 as const };
  }
  const userId = created.data.user.id;
  const worker = await db.from("workers").select("id").eq("user_id", userId).maybeSingle();
  const workerId = worker.data?.id as string | undefined;
  if (workerId) {
    const skill = await skillIdFor(trade);
    if (skill) await db.from("worker_skills").insert({ worker_id: workerId, skill_id: skill });
    await db.from("worker_locations").upsert({
      worker_id: workerId,
      location: `SRID=4326;POINT(${lead.lng} ${lead.lat})`,
      source: "manual",
    });
  }
  await db.from("artisan_leads").update({ stato: "iscritto" }).eq("id", lead.id);
  await event(lead.id, "iscritto", share.id);
  // Nessuna sessione finta: l'artigiano entra dalla pagina di accesso.
  return { ok: true as const, existing: false, loginHref: loginHref(phone, "nuovo") };
}

export async function optOutShare(token: string) {
  const share = await shareByToken(token);
  if (!share) return { error: "Richiesta assente.", status: 404 as const };
  const lead = await leadOf(share.lead_id);
  if (!lead) return { error: "Scheda assente.", status: 404 as const };
  const norm = lead.telefono_norm || normalizePhone(lead.telefono);
  await admin()
    .from("artisan_leads")
    .update({ opt_out: true, telefono_norm: norm || null })
    .eq("id", lead.id);
  if (norm) await admin().from("artisan_leads").update({ opt_out: true }).eq("telefono_norm", norm);
  await event(lead.id, "opt_out", share.id);
  return { ok: true as const };
}

export async function askShare(token: string, tipo: AskKind, messaggio: string) {
  if (!ASK.includes(tipo)) return { error: "Richiesta non valida.", status: 400 as const };
  const share = await shareByToken(token);
  if (!share?.risposta || share.risposta === "non_posso") return { error: "Prima rispondi alla richiesta.", status: 400 as const };
  const lead = await leadOf(share.lead_id);
  if (!lead || (await leadBlocked(lead))) return { error: "Richieste fermate.", status: 409 as const };
  const current = Array.isArray(share.chiedi) ? share.chiedi : [];
  if (current.length >= MAX_ASKS) return { error: "Hai già fatto molte domande. Aspetta le risposte.", status: 429 as const };
  const item: ChiediItem = {
    id: randomBytes(8).toString("hex"),
    tipo,
    messaggio: clip(messaggio, 400),
    risposta_testo: "",
    risposta_path: "",
    created_at: new Date().toISOString(),
  };
  const saved = await admin().from("sos_shared_requests").update({ chiedi: [...current, item] }).eq("id", share.id);
  if (saved.error) return { error: "Domanda non salvata.", status: 503 as const };
  return { ok: true as const, item };
}

/** Stato di tutte le richieste di una diagnosi, per la pagina "La mia richiesta". */
export async function requestStatus(diagnosisId: string) {
  const diagnosis = await ownsDiagnosis(diagnosisId);
  if (!diagnosis) return null;
  const { data } = await admin()
    .from("sos_shared_requests")
    .select("id, lead_id, risposta, chiedi, accettato_il, created_at")
    .eq("diagnosis_id", diagnosisId)
    .order("created_at", { ascending: false })
    .limit(10);
  const rows = (data ?? []) as {
    id: string;
    lead_id: string;
    risposta: ShareReply | null;
    chiedi: ChiediItem[] | null;
    accettato_il: string | null;
    created_at: string;
  }[];
  const leadIds = [...new Set(rows.map((row) => row.lead_id))];
  const leads = leadIds.length
    ? await admin().from("artisan_leads").select("id, nome").in("id", leadIds)
    : { data: [] as { id: string; nome: string }[] };
  const names = new Map(((leads.data ?? []) as { id: string; nome: string }[]).map((lead) => [lead.id, lead.nome]));
  const shares: RequestShare[] = rows.map((row) => ({
    id: row.id,
    nome: names.get(row.lead_id) ?? "Attività in zona",
    createdAt: row.created_at,
    risposta: row.risposta ?? null,
    accettato: Boolean(row.accettato_il),
    chiedi: (Array.isArray(row.chiedi) ? row.chiedi : []).map((item) => ({
      id: item.id,
      tipo: item.tipo,
      messaggio: item.messaggio,
      risposto: Boolean(item.risposta_testo || item.risposta_path),
      risposta_testo: item.risposta_testo,
    })),
  }));
  return {
    titolo: String(diagnosis.titolo ?? "La tua richiesta"),
    shares,
  };
}

async function ownedShare(diagnosisId: string, shareId: string) {
  if (!UUID.test(shareId)) return null;
  const diagnosis = await ownsDiagnosis(diagnosisId);
  if (!diagnosis) return null;
  const { data } = await admin()
    .from("sos_shared_requests")
    .select(SHARE_COLUMNS)
    .eq("id", shareId)
    .eq("diagnosis_id", diagnosisId)
    .maybeSingle();
  return (data as unknown as ShareRow | null) ?? null;
}

/** Il privato accetta "Posso venire": solo ora l'artigiano può vedere il suo numero. */
export async function acceptShare(input: { diagnosisId: string; shareId: string; phone: string }) {
  const share = await ownedShare(input.diagnosisId, input.shareId);
  if (!share) return { error: "Questa richiesta non è tua.", status: 403 as const };
  if (new Date(share.scade_il).getTime() <= Date.now()) return { error: "Richiesta chiusa.", status: 410 as const };
  if (share.risposta !== "posso_venire") {
    return { error: "L'artigiano non ha ancora detto che può venire.", status: 400 as const };
  }
  const phone = toE164(input.phone);
  if (!phone) return { error: "Scrivi un numero valido.", status: 400 as const };
  if (share.accettato_il) return { ok: true as const };
  const saved = await admin()
    .from("sos_shared_requests")
    .update({ cliente_telefono: phone, accettato_il: new Date().toISOString() })
    .eq("id", share.id)
    .is("accettato_il", null);
  if (saved.error) return { error: "Scelta non salvata.", status: 503 as const };

  // Avviso all'artigiano, solo se ha confermato il cellulare e non ha chiesto lo stop.
  const lead = await leadOf(share.lead_id);
  const site = siteUrl();
  if (share.artigiano_telefono && lead && site) {
    const blocked = (await leadBlocked(lead)) || (await phoneOptedOut(share.artigiano_telefono));
    const limited =
      blocked ||
      (await isRateLimited(
        [{ bucket: "sms:to", who: share.artigiano_telefono, windowSeconds: 86400, max: 5 }],
        "closed",
      ));
    if (!limited) await sendSms(share.artigiano_telefono, buildShareAcceptedSms(`${site}/r/${share.token}`));
  }
  return { ok: true as const };
}

export async function answerAsk(input: {
  diagnosisId: string;
  shareId: string;
  askId: string;
  text: string;
  file: File | null;
}) {
  const share = await ownedShare(input.diagnosisId, input.shareId);
  if (!share) return { error: "Questa richiesta non è tua.", status: 403 as const };
  if (new Date(share.scade_il).getTime() <= Date.now()) return { error: "Richiesta chiusa.", status: 410 as const };
  const items = Array.isArray(share.chiedi) ? [...share.chiedi] : [];
  const index = items.findIndex((item) => item.id === input.askId);
  if (index < 0) return { error: "Domanda assente.", status: 404 as const };
  let path = items[index]?.risposta_path ?? "";
  if (input.file && input.file.size > 0) {
    if (input.file.size > MAX_BYTES) return { error: "File troppo pesante.", status: 400 as const };
    const mime = baseMime(input.file.type);
    if (!ANSWER_MIME.includes(mime)) return { error: "Formato non accettato.", status: 400 as const };
    path = `risposte/${share.id}-${input.askId}.${extOf(mime)}`;
    const uploaded = await admin()
      .storage.from("sos-video")
      .upload(path, Buffer.from(await input.file.arrayBuffer()), { contentType: mime, upsert: true });
    if (uploaded.error) return { error: "File non salvato.", status: 503 as const };
  }
  const text = clip(input.text, 800);
  if (!text && !path) return { error: "Scrivi una risposta o allega un file.", status: 400 as const };
  items[index] = { ...items[index], risposta_testo: text, risposta_path: path };
  const saved = await admin().from("sos_shared_requests").update({ chiedi: items }).eq("id", share.id);
  if (saved.error) return { error: "Risposta non salvata.", status: 503 as const };
  return { ok: true as const };
}

export async function purgeExpiredShareVideos() {
  const db = admin();
  const { data, error } = await db
    .from("sos_shared_requests")
    .select("id, video_path, chiedi")
    .lt("scade_il", new Date().toISOString())
    .not("video_path", "is", null)
    .limit(100);
  if (error) return 0;
  let count = 0;
  for (const row of data ?? []) {
    const paths = [row.video_path as string];
    const asks = (Array.isArray(row.chiedi) ? row.chiedi : []) as ChiediItem[];
    for (const ask of asks) if (ask.risposta_path) paths.push(ask.risposta_path);
    await db.storage.from("sos-video").remove(paths.filter(Boolean));
    await db
      .from("sos_shared_requests")
      .update({
        video_path: null,
        chiedi: asks.map((ask) => ({ ...ask, risposta_path: "" })),
        cliente_telefono: null,
      })
      .eq("id", row.id);
    count += 1;
  }
  return count;
}
