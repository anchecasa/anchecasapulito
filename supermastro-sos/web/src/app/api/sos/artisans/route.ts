import { NextResponse } from "next/server";
import { searchGoogleArtisans } from "@/lib/sos/google-places";

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
    return NextResponse.json({ artisans: [], error: "Coordinate assenti" }, { status: 400 });
  }

  const mestiere = (url.searchParams.get("mestiere") || "Artigiano").trim().slice(0, 40);
  const result = await searchGoogleArtisans(mestiere, lat, lng);
  return NextResponse.json({
    status: result.status,
    artisans: result.artisans.slice(0, 5).map((artisan) => ({
      id: artisan.id,
      name: artisan.name,
      address: artisan.address,
      distanceKm: artisan.distanceKm,
      phone: artisan.phone ?? null,
    })),
  });
}
