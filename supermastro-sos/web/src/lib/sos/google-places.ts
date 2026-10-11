import { artisanPlaceMapsUrl, artisanTradeLabel } from "@/lib/sos/artisan-maps";
import { distanceKm, type NearbyArtisan } from "@/lib/sos/search-artisans";

export type GoogleArtisanSearch = {
  artisans: NearbyArtisan[];
  status: "ready" | "missing-key" | "google-error";
};

type PlaceRow = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  googleMapsUri?: string;
};

function phoneHref(international?: string, national?: string): string | null {
  const raw = (international || national || "").trim();
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (!digits.startsWith("+") && digits.startsWith("0")) digits = `+39${digits.slice(1)}`;
  if (!digits.startsWith("+")) digits = `+39${digits}`;
  return `tel:${digits}`;
}

export async function searchGoogleArtisans(
  label: string,
  lat: number,
  lng: number
): Promise<GoogleArtisanSearch> {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim() ?? "";
  if (!key) return { artisans: [], status: "missing-key" };

  const trade = artisanTradeLabel(label);
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        Referer: "https://www.anchecasa.it/",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.internationalPhoneNumber,places.googleMapsUri",
      },
      body: JSON.stringify({
        textQuery: trade,
        languageCode: "it",
        regionCode: "IT",
        rankPreference: "DISTANCE",
        pageSize: 8,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 8000,
          },
        },
      }),
    });

    if (!res.ok) return { artisans: [], status: "google-error" };

    const data = (await res.json()) as { places?: PlaceRow[] };
    const artisans = (data.places ?? [])
      .map((place): NearbyArtisan | null => {
        const placeLat = place.location?.latitude;
        const placeLng = place.location?.longitude;
        if (placeLat == null || placeLng == null) return null;
        const name = place.displayName?.text?.trim() || trade;
        const phone = place.internationalPhoneNumber || place.nationalPhoneNumber || null;
        return {
          id: place.id || `${name}@${placeLat.toFixed(5)}`,
          name,
          address: place.formattedAddress || "",
          lat: placeLat,
          lng: placeLng,
          distanceKm: distanceKm(lat, lng, placeLat, placeLng),
          mapsUrl: place.googleMapsUri || artisanPlaceMapsUrl(name, placeLat, placeLng),
          phone,
          phoneHref: phoneHref(place.internationalPhoneNumber, place.nationalPhoneNumber),
        };
      })
      .filter((place): place is NearbyArtisan => place !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return { artisans, status: "ready" };
  } catch {
    return { artisans: [], status: "google-error" };
  }
}
