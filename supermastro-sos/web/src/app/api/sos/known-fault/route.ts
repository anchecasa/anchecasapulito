import { NextResponse } from "next/server";
import { applyRules } from "@/lib/sos/diagnosis-rules";
import { draftFromKnownFault, knownFaultById } from "@/lib/sos/known-faults";
import { saveDiagnosis } from "@/lib/sos/save-diagnosis";

export const runtime = "nodejs";

function numberField(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

export async function POST(request: Request) {
  let body: { id?: unknown; lat?: unknown; lng?: unknown };
  try {
    body = (await request.json()) as { id?: unknown; lat?: unknown; lng?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Scelta mancante." }, { status: 400 });
  }
  const fault = typeof body.id === "string" ? knownFaultById(body.id) : null;
  if (!fault) {
    return NextResponse.json({ ok: false, error: "Questo problema non è in elenco." }, { status: 400 });
  }
  try {
    const ruled = applyRules(draftFromKnownFault(fault), {
      lat: numberField(body.lat),
      lng: numberField(body.lng),
    });
    const id = await saveDiagnosis(ruled);
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Non riesco a salvare la scelta. Riprova." },
      { status: 503 },
    );
  }
}
