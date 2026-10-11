import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { DiagnosisPayload, Esito, RuledDiagnosis } from "@/lib/sos/diagnosis-rules";

const COOKIE = "sm_sos_session";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ESITI = new Set<Esito>(["fai_da_te", "professionista", "pericolo", "da_verificare", "fuori_tema"]);

export type LoadedDiagnosis = RuledDiagnosis & { id: string };

async function sessionId() {
  const jar = await cookies();
  const current = jar.get(COOKIE)?.value ?? "";
  if (UUID.test(current)) return current;
  const next = crypto.randomUUID();
  jar.set(COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return next;
}

async function userId() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function saveDiagnosis(ruled: RuledDiagnosis) {
  const admin = createAdminClient();
  const [session, user] = await Promise.all([sessionId(), userId()]);
  const { data, error } = await admin
    .from("sos_video_diagnoses")
    .insert({
      user_id: user,
      session_id: session,
      esito: ruled.esito,
      skill_slug: ruled.skillSlug,
      titolo: ruled.titolo,
      payload: ruled.payload,
      model: ruled.model,
      confidence: ruled.confidence,
    })
    .select("id")
    .single();
  if (error || !data?.id) {
    throw new Error(error?.message || "Diagnosi non salvata.");
  }
  return String(data.id);
}

function asPayload(value: unknown): DiagnosisPayload | null {
  if (!value || typeof value !== "object") return null;
  const row = value as DiagnosisPayload;
  if (typeof row.visto_sentito !== "string" || !Array.isArray(row.azioni)) return null;
  return row;
}

/** Chi legge è chi ha fatto la diagnosi? Solo lettura del cookie: qui non se ne crea uno nuovo. */
async function isOwner(ownerUser: unknown, ownerSession: unknown) {
  const jar = await cookies();
  const session = jar.get(COOKIE)?.value ?? "";
  if (session && typeof ownerSession === "string" && ownerSession === session) return true;
  if (typeof ownerUser !== "string" || !ownerUser) return false;
  return (await userId()) === ownerUser;
}

export async function loadDiagnosis(id: string): Promise<LoadedDiagnosis | null> {
  if (!UUID.test(id)) return null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("sos_video_diagnoses")
      .select("id, esito, skill_slug, titolo, payload, confidence, model, user_id, session_id")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const esito = data.esito as Esito;
    const stored = asPayload(data.payload);
    if (!ESITI.has(esito) || !stored) return null;
    // La posizione la vede solo chi ha fatto la diagnosi (stessa sessione o stesso account).
    const payload = (await isOwner(data.user_id, data.session_id)) ? stored : { ...stored, lat: null, lng: null };
    return {
      id: String(data.id),
      esito,
      titolo: String(data.titolo),
      skillSlug: String(data.skill_slug),
      skillLabel: payload.skill_label,
      confidence: Number(data.confidence),
      model: String(data.model),
      payload,
    };
  } catch {
    return null;
  }
}
