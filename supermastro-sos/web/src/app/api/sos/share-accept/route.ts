import { NextResponse } from "next/server";
import { clientIp, isRateLimited, sosSession, tooManyRequests } from "@/lib/sos/rate-limit";
import { acceptShare } from "@/lib/sos/share";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    diagnosisId?: string;
    shareId?: string;
    phone?: string;
  } | null;
  if (!body?.diagnosisId || !body.shareId || !body.phone) {
    return NextResponse.json({ error: "Scrivi il tuo numero." }, { status: 400 });
  }
  // Accettare può mandare un SMS all'artigiano: se il controllo non risponde, si blocca.
  if (
    await isRateLimited(
      [
        { bucket: "accept:ip", who: clientIp(request), windowSeconds: 3600, max: 10 },
        { bucket: "accept:session", who: sosSession(request), windowSeconds: 86400, max: 10 },
      ],
      "closed",
    )
  ) {
    return tooManyRequests();
  }
  try {
    const result = await acceptShare({ diagnosisId: body.diagnosisId, shareId: body.shareId, phone: body.phone });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Scelta non salvata." }, { status: 503 });
  }
}
