import type { Metadata } from "next";
import { MandagliVideo } from "@/components/supermastro/mandagli-video";
import { verifyLead } from "@/lib/sos/lead-token";
import { distanceKm, formatArtisanDistance } from "@/lib/sos/search-artisans";
import { toE164 } from "@/lib/sos/share-copy";

export const metadata: Metadata = { title: "Mandagli il video — SuperMastro" };

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function coord(value: string, min: number, max: number) {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

export default async function MandagliPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const back = new URLSearchParams();
  for (const key of ["mestiere", "lat", "lng", "guasto", "id"]) {
    const value = one(params[key]);
    if (value) back.set(key, value);
  }

  // Nome e telefono arrivano solo dal gettone firmato dalla ricerca sul server.
  const token = one(params.t);
  const lead = verifyLead(token);
  const faultLat = coord(one(params.lat), -90, 90);
  const faultLng = coord(one(params.lng), -180, 180);
  const distanza =
    lead && faultLat != null && faultLng != null
      ? formatArtisanDistance(distanceKm(faultLat, faultLng, lead.lat, lead.lng))
      : "";

  return (
    <MandagliVideo
      leadToken={lead ? token : ""}
      nome={lead?.nome || "Attività in zona"}
      telefono={lead?.telefono && toE164(lead.telefono) ? lead.telefono : ""}
      distanza={distanza}
      guasto={one(params.guasto)}
      faultLat={faultLat}
      faultLng={faultLng}
      diagnosisId={one(params.id)}
      backHref={`/supermastro/ricerca?${back}`}
      flowBase="/supermastro"
    />
  );
}
