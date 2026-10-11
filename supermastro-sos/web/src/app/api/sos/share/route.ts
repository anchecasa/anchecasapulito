import { NextResponse } from "next/server";
import { clientIp, isRateLimited, sosSession, tooManyRequests } from "@/lib/sos/rate-limit";
import { createShare } from "@/lib/sos/share";

export const runtime = "nodejs";

function num(value: FormDataEntryValue | null, min: number, max: number) {
  if (typeof value !== "string" || !value.trim()) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (
    await isRateLimited(
      [
        { bucket: "share:ip", who: ip, windowSeconds: 3600, max: 20 },
        { bucket: "share:session", who: sosSession(request), windowSeconds: 86400, max: 30 },
      ],
      "open",
    )
  ) {
    return tooManyRequests();
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Manca il video." }, { status: 400 });
  }
  const file = form.get("video");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Manca il video." }, { status: 400 });
  }
  try {
    // Nome, telefono e posizione dell'attività arrivano solo dal gettone firmato.
    const result = await createShare({
      diagnosisId: String(form.get("diagnosisId") ?? ""),
      leadToken: String(form.get("leadToken") ?? ""),
      faultLat: num(form.get("flat"), -90, 90),
      faultLng: num(form.get("flng"), -180, 180),
      file,
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    return NextResponse.json(
      { error: message.includes("SERVICE_ROLE") ? "Salvataggio non configurato." : "Il video è rimasto sul telefono." },
      { status: 503 },
    );
  }
}
