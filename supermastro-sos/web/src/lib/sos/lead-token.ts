import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Solo server. Gettone firmato (HMAC-SHA256) per ogni attività trovata dalla
 * ricerca sul server. Il client non può cambiare nome, telefono o posizione:
 * createShare accetta solo dati con firma valida.
 *
 * Segreto: SOS_SHARE_SECRET. Se manca, una chiave derivata dalla
 * SUPABASE_SERVICE_ROLE_KEY (mai usata in chiaro). Senza nessuno dei due: niente gettoni.
 */

export type LeadClaim = {
  fonte: "osm";
  fonteId: string;
  nome: string;
  telefono: string | null;
  indirizzo: string;
  lat: number;
  lng: number;
  mestiere: string;
};

type Packed = {
  f: "osm";
  i: string;
  n: string;
  p: string | null;
  a: string;
  la: number;
  ln: number;
  m: string;
  e: number;
};

const LIFETIME_MS = 24 * 60 * 60 * 1000;
const OSM_REF = /^(node|way|relation)\/\d{1,20}$/;

function secret(): Buffer | null {
  const own = process.env.SOS_SHARE_SECRET?.trim();
  if (own && own.length >= 16) return Buffer.from(own);
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (service) return createHmac("sha256", service).update("supermastro-sos-share-v1").digest();
  return null;
}

function sign(body: string, key: Buffer) {
  return createHmac("sha256", key).update(body).digest("base64url");
}

export function isOsmRef(value: string) {
  return OSM_REF.test(value);
}

export function signLead(claim: LeadClaim, now = Date.now()): string | null {
  const key = secret();
  if (!key || !isOsmRef(claim.fonteId)) return null;
  const packed: Packed = {
    f: "osm",
    i: claim.fonteId,
    n: claim.nome.slice(0, 160),
    p: claim.telefono ? claim.telefono.slice(0, 40) : null,
    a: claim.indirizzo.slice(0, 180),
    la: Math.round(claim.lat * 1e6) / 1e6,
    ln: Math.round(claim.lng * 1e6) / 1e6,
    m: claim.mestiere.slice(0, 80),
    e: now + LIFETIME_MS,
  };
  const body = Buffer.from(JSON.stringify(packed)).toString("base64url");
  return `${body}.${sign(body, key)}`;
}

export function verifyLead(token: string, now = Date.now()): LeadClaim | null {
  const key = secret();
  if (!key || typeof token !== "string" || token.length > 2000) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = Buffer.from(sign(body, key));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  let packed: Packed;
  try {
    packed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Packed;
  } catch {
    return null;
  }
  if (packed.f !== "osm" || typeof packed.e !== "number" || packed.e < now) return null;
  if (typeof packed.i !== "string" || !isOsmRef(packed.i) || typeof packed.n !== "string") return null;
  if (!Number.isFinite(packed.la) || !Number.isFinite(packed.ln)) return null;
  return {
    fonte: "osm",
    fonteId: packed.i,
    nome: packed.n,
    telefono: typeof packed.p === "string" && packed.p ? packed.p : null,
    indirizzo: typeof packed.a === "string" ? packed.a : "",
    lat: packed.la,
    lng: packed.ln,
    mestiere: typeof packed.m === "string" ? packed.m : "",
  };
}

/** Aggiunge il gettone firmato a ogni attività OSM (solo sul server, nelle pagine di ricerca). */
export function withLeadTokens<
  T extends { osmRef?: string | null; name: string; phone?: string | null; address: string; lat: number; lng: number },
>(list: T[], trade: string): (T & { leadToken: string | null })[] {
  return list.map((item) => ({
    ...item,
    leadToken: item.osmRef
      ? signLead({
          fonte: "osm",
          fonteId: item.osmRef,
          nome: item.name,
          telefono: item.phone ?? null,
          indirizzo: item.address,
          lat: item.lat,
          lng: item.lng,
          mestiere: trade,
        })
      : null,
  }));
}
