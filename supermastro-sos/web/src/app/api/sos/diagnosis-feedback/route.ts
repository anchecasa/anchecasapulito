import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clientIp, isRateLimited, tooManyRequests } from "@/lib/sos/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (
    await isRateLimited([{ bucket: "fb:ip", who: clientIp(request), windowSeconds: 600, max: 30 }], "open")
  ) {
    return tooManyRequests();
  }
  let body: { diagnosisId?: unknown; vote?: unknown; correzione?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Manca il voto." }, { status: 400 });
  }
  const diagnosisId = typeof body.diagnosisId === "string" ? body.diagnosisId : "";
  const vote = body.vote === "up" || body.vote === "down" ? body.vote : null;
  const correzione =
    typeof body.correzione === "string" ? body.correzione.replace(/\s+/g, " ").trim().slice(0, 300) : "";
  if (!UUID.test(diagnosisId) || !vote) {
    return NextResponse.json({ ok: false, error: "Su questa anteprima il pollice non si salva." }, { status: 400 });
  }
  if (vote === "down" && !correzione) {
    return NextResponse.json({ ok: false, error: "Scrivi com'era, poi invia." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: diagnosis, error } = await admin
      .from("sos_video_diagnoses")
      .select("id, user_id, session_id")
      .eq("id", diagnosisId)
      .maybeSingle();
    if (error || !diagnosis) {
      return NextResponse.json({ ok: false, error: "Diagnosi non trovata." }, { status: 404 });
    }

    const jar = await cookies();
    const session = jar.get("sm_sos_session")?.value ?? "";
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    } catch {
      userId = null;
    }
    const owns =
      (userId !== null && diagnosis.user_id === userId) || (session !== "" && diagnosis.session_id === session);
    if (!owns) {
      return NextResponse.json({ ok: false, error: "Questo voto non è il tuo." }, { status: 403 });
    }

    // Un solo voto per diagnosi: si può cambiare finché l'admin non l'ha rivisto.
    const { data: existing } = await admin
      .from("sos_diagnosis_feedback")
      .select("id, stato")
      .eq("diagnosis_id", diagnosisId)
      .maybeSingle();
    const row = { vote, correzione: vote === "down" ? correzione : "" };
    if (existing) {
      if (existing.stato !== "in_attesa") return NextResponse.json({ ok: true });
      const { error: updateError } = await admin
        .from("sos_diagnosis_feedback")
        .update(row)
        .eq("id", existing.id)
        .eq("stato", "in_attesa");
      if (updateError) {
        return NextResponse.json({ ok: false, error: "Voto non salvato. Riprova." }, { status: 503 });
      }
      return NextResponse.json({ ok: true });
    }
    const { error: insertError } = await admin.from("sos_diagnosis_feedback").insert({
      diagnosis_id: diagnosisId,
      ...row,
      stato: "in_attesa",
    });
    // 23505 = voto già presente (due tocchi insieme): va bene così.
    if (insertError && insertError.code !== "23505") {
      return NextResponse.json({ ok: false, error: "Voto non salvato. Riprova." }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Voto non salvato. Riprova." }, { status: 503 });
  }
}
