import { NextResponse } from "next/server";

const HEADERS = {
  "User-Agent": "AncheCasa-SuperMastro/1.0 (contact@anchecasa.it)",
  Accept: "application/json",
};

export async function GET(request: Request) {
  const cap = (new URL(request.url).searchParams.get("cap") || "").replace(/\D/g, "");
  if (cap.length !== 5) {
    return NextResponse.json({ error: "Il CAP italiano ha 5 cifre." }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("postalcode", cap);
  url.searchParams.set("country", "Italy");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url, { headers: HEADERS, cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "CAP non raggiungibile." }, { status: 502 });

  const rows = (await res.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
  const hit = rows[0];
  const lat = Number(hit?.lat);
  const lng = Number(hit?.lon);
  if (!hit || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "CAP non trovato." }, { status: 404 });
  }

  const place = hit.display_name?.split(",")[0]?.trim() || `CAP ${cap}`;
  return NextResponse.json({ lat, lng, place });
}
