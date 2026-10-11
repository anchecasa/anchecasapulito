import { NextResponse } from "next/server";
import { requestStatus } from "@/lib/sos/share";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("diagnosisId") ?? "";
  try {
    const status = await requestStatus(id);
    if (!status) return NextResponse.json({ error: "Questa richiesta non è tua." }, { status: 403 });
    return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Stato non letto. Riprova." }, { status: 503 });
  }
}
