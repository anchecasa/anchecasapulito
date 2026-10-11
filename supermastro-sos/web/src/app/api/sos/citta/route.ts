import { NextResponse } from "next/server";
import { reverseGeocodeCity } from "@/lib/sos/location";

function coord(value: string | null, min: number, max: number): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = coord(url.searchParams.get("lat"), -90, 90);
  const lng = coord(url.searchParams.get("lng"), -180, 180);
  if (lat == null || lng == null) {
    return NextResponse.json({ place: "Posizione attuale" }, { status: 400 });
  }

  try {
    const place = await reverseGeocodeCity(lat, lng);
    return NextResponse.json({ place });
  } catch {
    return NextResponse.json({ place: "Posizione attuale" });
  }
}
