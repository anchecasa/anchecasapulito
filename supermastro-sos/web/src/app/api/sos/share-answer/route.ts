import { NextResponse } from "next/server";
import { clientIp, isRateLimited, sosSession, tooManyRequests } from "@/lib/sos/rate-limit";
import { answerAsk } from "@/lib/sos/share";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (
    await isRateLimited(
      [
        { bucket: "answer:ip", who: clientIp(request), windowSeconds: 3600, max: 30 },
        { bucket: "answer:session", who: sosSession(request), windowSeconds: 3600, max: 30 },
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
    return NextResponse.json({ error: "Risposta vuota." }, { status: 400 });
  }
  const file = form.get("file");
  try {
    const result = await answerAsk({
      diagnosisId: String(form.get("diagnosisId") ?? ""),
      shareId: String(form.get("shareId") ?? ""),
      askId: String(form.get("askId") ?? ""),
      text: String(form.get("text") ?? ""),
      file: file instanceof File && file.size > 0 ? file : null,
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Risposta non salvata." }, { status: 503 });
  }
}
