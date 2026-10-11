import type { Metadata } from "next";
import Link from "next/link";
import { CinematicSearch } from "@/components/supermastro/cinematic-search";
import { readFaultQuery } from "@/lib/sos/fault-query";
import { searchNetworkArtisans } from "@/lib/sos/network-artisans";
import { withLeadTokens } from "@/lib/sos/lead-token";
import { searchArtisansNearby } from "@/lib/sos/search-artisans";

export const metadata: Metadata = { title: "Ricerca — SuperMastro" };

export default async function RicercaRoute({
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
      <section className="flex h-full flex-col justify-center bg-[#FBF8F3] px-5 text-[#1A2432]">
        <p className="text-sm text-[#2A3C54]">Manca la posizione del guasto.</p>
        <Link href="/m/home" className="mt-4 text-sm font-semibold text-[#E56B10]">
          Torna alla home
        </Link>
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
      flowBase="/m"
      diagnosisId={diagnosisId}
      contained
    />
  );
}
