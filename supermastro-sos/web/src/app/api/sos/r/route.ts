import { NextResponse } from "next/server";
import { clientIp, isRateLimited, tooManyRequests } from "@/lib/sos/rate-limit";
import {
  askShare,
  createShareProfile,
  optOutShare,
  respondShare,
  sendShareCode,
  verifyShareCode,
  type AskKind,
  type ShareReply,
} from "@/lib/sos/share";

const REPLIES = new Set<ShareReply>(["posso_venire", "info", "non_posso"]);
const ASKS = new Set<AskKind>(["altro_video", "foto_vicino", "misure", "marca_modello", "domanda"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    token?: string;
    action?: string;
    risposta?: string;
    phone?: string;
    code?: string;
    nome?: string;
    mestiere?: string;
    tipo?: string;
    messaggio?: string;
  } | null;
  const token = body?.token?.trim() ?? "";
  if (!token) return NextResponse.json({ error: "Link non valido." }, { status: 400 });
  const ip = clientIp(request);
  if (
    await isRateLimited(
      [
        { bucket: "r:ip", who: ip, windowSeconds: 600, max: 60 },
        { bucket: "r:token", who: token, windowSeconds: 600, max: 40 },
      ],
      "open",
    )
  ) {
    return tooManyRequests();
  }
  // Il codice parte con un SMS: limite stretto e, se il controllo non risponde, niente invio.
  if (
    body?.action === "otp" &&
    (await isRateLimited(
      [
        { bucket: "otp:ip", who: ip, windowSeconds: 3600, max: 5 },
        { bucket: "otp:ipday", who: ip, windowSeconds: 86400, max: 10 },
      ],
      "closed",
    ))
  ) {
    return tooManyRequests("Troppi codici richiesti. Riprova più tardi.");
  }
  if (
    body?.action === "verify" &&
    (await isRateLimited([{ bucket: "verify:ip", who: ip, windowSeconds: 3600, max: 20 }], "open"))
  ) {
    return tooManyRequests();
  }
  try {
    if (body?.action === "respond" && body.risposta && REPLIES.has(body.risposta as ShareReply)) {
      const result = await respondShare(token, body.risposta as ShareReply);
      return "error" in result
        ? NextResponse.json({ error: result.error }, { status: result.status })
        : NextResponse.json(result);
    }
    if (body?.action === "otp") {
      const result = await sendShareCode(token, body.phone ?? "");
      return "error" in result
        ? NextResponse.json({ error: result.error }, { status: result.status })
        : NextResponse.json(result);
    }
    if (body?.action === "verify") {
      const result = await verifyShareCode(token, body.code ?? "");
      return "error" in result
        ? NextResponse.json({ error: result.error }, { status: result.status })
        : NextResponse.json(result);
    }
    if (body?.action === "profile") {
      const result = await createShareProfile(token, body.nome ?? "", body.mestiere ?? "");
      return "error" in result
        ? NextResponse.json({ error: result.error }, { status: result.status })
        : NextResponse.json(result);
    }
    if (body?.action === "optout") {
      const result = await optOutShare(token);
      return "error" in result
        ? NextResponse.json({ error: result.error }, { status: result.status })
        : NextResponse.json(result);
    }
    if (body?.action === "ask" && body.tipo && ASKS.has(body.tipo as AskKind)) {
      const result = await askShare(token, body.tipo as AskKind, body.messaggio ?? "");
      return "error" in result
        ? NextResponse.json({ error: result.error }, { status: result.status })
        : NextResponse.json(result);
    }
    return NextResponse.json({ error: "Azione non valida." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Operazione non riuscita." }, { status: 503 });
  }
}
