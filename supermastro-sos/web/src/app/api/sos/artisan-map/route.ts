import { NextResponse } from "next/server";

function num(value: string | null, min: number, max: number): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export async function GET(request: Request) {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim() ?? "";
  if (!key) return NextResponse.json({ error: "Chiave assente" }, { status: 503 });

  const url = new URL(request.url);
  const lat = num(url.searchParams.get("lat"), -90, 90);
  const lng = num(url.searchParams.get("lng"), -180, 180);
  const zoom = num(url.searchParams.get("z"), 10, 18) ?? 14;
  const width = num(url.searchParams.get("w"), 200, 640) ?? 390;
  const height = num(url.searchParams.get("h"), 200, 640) ?? 520;
  if (lat == null || lng == null) {
    return NextResponse.json({ error: "Coordinate assenti" }, { status: 400 });
  }

  const mapUrl = new URL("https://maps.googleapis.com/maps/api/staticmap");
  mapUrl.searchParams.set("center", `${lat},${lng}`);
  mapUrl.searchParams.set("zoom", String(Math.round(zoom)));
  mapUrl.searchParams.set("size", `${Math.round(width)}x${Math.round(height)}`);
  mapUrl.searchParams.set("scale", "2");
  mapUrl.searchParams.set("maptype", "roadmap");
  mapUrl.searchParams.set("language", "it");
  mapUrl.searchParams.set("region", "it");
  mapUrl.searchParams.set("key", key);

  const res = await fetch(mapUrl, {
    headers: { Referer: "https://www.anchecasa.it/" },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ error: "Mappa non disponibile" }, { status: 502 });

  const bytes = await res.arrayBuffer();
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/png",
      "Cache-Control": "private, max-age=300",
    },
  });
}
