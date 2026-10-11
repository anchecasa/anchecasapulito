import { artisanPlaceMapsUrl } from "@/lib/sos/artisan-maps";
import type { NearbyArtisan } from "@/lib/sos/search-artisans";
import { createAdminClient } from "@/lib/supabase/admin";

type NetworkRow = {
  id: string;
  display_name: string | null;
  lat: number | string | null;
  lng: number | string | null;
  distance_km: number | string | null;
};

/** Iscritti con stato active, nello stesso mestiere e nel raggio di servizio. */
export async function searchNetworkArtisans(
  trade: string,
  lat: number,
  lng: number,
): Promise<NearbyArtisan[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("sos_network_artisans", {
      p_skill: trade,
      p_lat: lat,
      p_lng: lng,
    });
    if (error || !Array.isArray(data)) return [];

    return (data as NetworkRow[]).flatMap((row) => {
      const placeLat = Number(row.lat);
      const placeLng = Number(row.lng);
      const distanceKm = Number(row.distance_km);
      const name = row.display_name?.trim() || "Artigiano della rete";
      if (!row.id || !Number.isFinite(placeLat) || !Number.isFinite(placeLng)) return [];
      return [
        {
          id: row.id,
          name,
          address: "Rete AncheCasa",
          lat: placeLat,
          lng: placeLng,
          distanceKm: Number.isFinite(distanceKm) ? distanceKm : 0,
          mapsUrl: artisanPlaceMapsUrl(name, placeLat, placeLng),
          network: true,
        } satisfies NearbyArtisan,
      ];
    });
  } catch {
    return [];
  }
}
