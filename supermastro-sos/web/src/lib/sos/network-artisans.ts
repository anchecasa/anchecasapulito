import { artisanPlaceMapsUrl } from "@/lib/sos/artisan-maps";
import type { NearbyArtisan } from "@/lib/sos/search-artisans";
import { signLead } from "@/lib/sos/lead-token";
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

    // Telefono dalla cassaforte contatti (solo service role): serve per mandargli il video.
    const ids = (data as NetworkRow[]).map((row) => row.id).filter(Boolean);
    const phones = new Map<string, string>();
    if (ids.length) {
      const { data: contacts } = await admin
        .from("contact_vault")
        .select("owner_id, phone")
        .eq("owner_type", "worker")
        .in("owner_id", ids);
      for (const contact of (contacts ?? []) as { owner_id: string; phone: string | null }[]) {
        if (contact.phone?.trim()) phones.set(contact.owner_id, contact.phone.trim());
      }
    }

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
          // Il numero non va al browser: il gettone porta solo l'id, il server lo legge all'invio.
          leadToken: phones.has(row.id)
            ? signLead({
                fonte: "rete",
                fonteId: `rete/${row.id}`,
                nome: name,
                telefono: null,
                indirizzo: "Rete AncheCasa",
                lat: placeLat,
                lng: placeLng,
                mestiere: trade,
              })
            : null,
        } satisfies NearbyArtisan,
      ];
    });
  } catch {
    return [];
  }
}
