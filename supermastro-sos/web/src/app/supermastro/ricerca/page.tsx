import type { Metadata } from "next";
import { CinematicSearch } from "@/components/supermastro/cinematic-search";
import { HardLink } from "@/components/layout/hard-link";
import { readFaultQuery } from "@/lib/sos/fault-query";
import { searchNetworkArtisans } from "@/lib/sos/network-artisans";
import { withLeadTokens } from "@/lib/sos/lead-token";
import { searchArtisansNearby } from "@/lib/sos/search-artisans";

export const metadata: Metadata = {
  title: "Professionista in zona — SuperMastro",
};

export default async function RicercaPage({
  searchParams,
}: {
  searchParams: Promise<{
    mestiere?: string | string[];
    lat?: string | string[];
    lng?: string | string[];
    guasto?: string | string[];
    id?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const fault = readFaultQuery(params);
  const diagnosisId = (Array.isArray(params.id) ? params.id[0] : params.id)?.trim() ?? "";
  if (!fault) {
    return (
      <section className="mx-auto max-w-lg px-4 py-8 text-[#1A2432]">
        <p className="text-sm text-[#2A3C54]">Manca la posizione del guasto.</p>
        <HardLink href="/supermastro/video" className="mt-4 inline-flex text-sm font-semibold text-[#E56B10]">
          Torna al video
        </HardLink>
      </section>
    );
  }

  const [network, found] = await Promise.all([
    searchNetworkArtisans(fault.trade, fault.lat, fault.lng),
    searchArtisansNearby(fault.trade, fault.lat, fault.lng),
  ]);
  // Ogni attività riceve un gettone firmato: il telefono non si può cambiare dal browser.
  const artisans = withLeadTokens(found, fault.trade);

  return (
    <CinematicSearch
      trade={fault.trade}
      summary={fault.summary}
      lat={fault.lat}
      lng={fault.lng}
      network={network}
      artisans={artisans}
      diagnosisId={diagnosisId}
    />
  );
}
