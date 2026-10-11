import { NextResponse } from "next/server";
import { applyRules } from "@/lib/sos/diagnosis-rules";
import { VideoDiagnosisError, diagnoseHomeVideo } from "@/lib/sos/gemini-video";
import { clientIp, isRateLimited, sosSession, tooManyRequests } from "@/lib/sos/rate-limit";
import { saveDiagnosis } from "@/lib/sos/save-diagnosis";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;
const MIN_BYTES = 1024;

const MIME_TYPES = new Set(["video/webm", "video/mp4", "video/quicktime", "video/3gpp"]);

function declaredMime(value: string): string {
  return value.split(";")[0]?.trim().toLowerCase() ?? "";
}

function numberField(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function sniffMime(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return "video/webm";
  }
  if (bytes.length >= 12) {
    const box = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (box === "ftyp") return "video/mp4";
  }
  return null;
}

export async function POST(request: Request) {
  // Ogni analisi chiama Gemini e costa: limiti per IP e per sessione.
  const ip = clientIp(request);
  if (
    await isRateLimited(
      [
        { bucket: "vd:ip", who: ip, windowSeconds: 600, max: 20 },
        { bucket: "vd:ipday", who: ip, windowSeconds: 86400, max: 150 },
        { bucket: "vd:session", who: sosSession(request), windowSeconds: 3600, max: 12 },
      ],
      "open",
    )
  ) {
    return tooManyRequests("Hai fatto molti video di seguito. Aspetta qualche minuto e riprova.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Video mancante." }, { status: 400 });
  }

  const file = form.get("video");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Video mancante." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Il video è troppo pesante. Tieni la registrazione entro 5 secondi." },
      { status: 413 },
    );
  }
  if (file.size < MIN_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Il video è vuoto. Inquadra il guasto e riprova." },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = MIME_TYPES.has(declaredMime(file.type)) ? declaredMime(file.type) : sniffMime(bytes);
  if (!mime) {
    return NextResponse.json(
      { ok: false, error: "Formato video non letto. Usa la fotocamera del telefono." },
      { status: 415 },
    );
  }

  const rawNote = form.get("nota");
  const note = typeof rawNote === "string" ? rawNote : "";
  const lat = numberField(form.get("lat"));
  const lng = numberField(form.get("lng"));

  try {
    const draft = await diagnoseHomeVideo(bytes, mime, note);
    const ruled = applyRules(draft, { lat, lng });
    const id = await saveDiagnosis(ruled);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    if (err instanceof VideoDiagnosisError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    if (err instanceof Error && /supabase|sos_video_diagnoses|Diagnosi non salvata/i.test(err.message)) {
      return NextResponse.json({ ok: false, error: "Diagnosi non salvata. Riprova tra poco." }, { status: 503 });
    }
    return NextResponse.json(
      { ok: false, error: "Analisi non riuscita. Riprova tra poco." },
      { status: 502 },
    );
  }
}
