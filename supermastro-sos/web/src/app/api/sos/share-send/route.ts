import { NextResponse } from "next/server";
import { clientIp, isRateLimited, sosSession, tooManyRequests } from "@/lib/sos/rate-limit";
import { markSent } from "@/lib/sos/share";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: string; channel?: string } | null;
  const channel = body?.channel === "sms" ? "sms" : body?.channel === "whatsapp" ? "whatsapp" : null;
  if (!body?.token || !channel) return NextResponse.json({ error: "Canale mancante." }, { status: 400 });

  const ip = clientIp(request);
  const rules = [
    { bucket: "send:ip", who: ip, windowSeconds: 3600, max: 30 },
    { bucket: "send:session", who: sosSession(request), windowSeconds: 86400, max: 40 },
  ];
  // Gli SMS costano: limite più stretto e, se il controllo non risponde, non si invia.
  const limited =
    channel === "sms"
      ? await isRateLimited(
          [...rules, { bucket: "sms:ip", who: ip, windowSeconds: 86400, max: 10 }],
          "closed",
        )
      : await isRateLimited(rules, "open");
  if (limited) return tooManyRequests();

  try {
    const result = await markSent(body.token, channel);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    const digits = result.phone.replace(/\D/g, "");
    const href = channel === "whatsapp" ? `https://wa.me/${digits}?text=${encodeURIComponent(result.text)}` : "";
    return NextResponse.json({ ok: true, href, text: result.text });
  } catch {
    return NextResponse.json({ error: "Invio non riuscito." }, { status: 503 });
  }
}
