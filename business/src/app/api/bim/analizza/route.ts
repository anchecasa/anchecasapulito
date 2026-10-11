import { analizzaByte } from "@/lib/anchebim/analizza";

export const runtime = "nodejs";
export const maxDuration = 120;

const MASSIMO = 999 * 1024 * 1024;

export async function POST(richiesta: Request) {
  const form = await richiesta.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ ok: false, errore: "Scegli un file." }, { status: 400 });
  }
  if (file.size > MASSIMO) {
    return Response.json({ ok: false, errore: "Il file supera 999 MB." }, { status: 400 });
  }
  const dati = await analizzaByte(file.name, Buffer.from(await file.arrayBuffer()));
  const stato = dati.ok ? 200 : dati.errore === "Analisi non riuscita." ? 500 : 422;
  return Response.json(dati, { status: stato });
}
