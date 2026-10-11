import type { Metadata } from "next";
import { HardLink } from "@/components/layout/hard-link";
import { daSoloHref, ricercaHref } from "@/lib/sos/artisan-maps";
import { Mascot, poseForSkill } from "@/components/supermastro/mascot";
import { diyForTrade } from "@/lib/sos/diy";
import { readFaultQuery } from "@/lib/sos/fault-query";

export const metadata: Metadata = {
  title: "Problema — SuperMastro",
};

export default async function ProblemaPage({
  searchParams,
}: {
  searchParams: Promise<{
    mestiere?: string | string[];
    lat?: string | string[];
    lng?: string | string[];
    guasto?: string | string[];
  }>;
}) {
  const fault = readFaultQuery(await searchParams);
  if (!fault) {
    return (
      <section className="mx-auto max-w-lg px-4 py-8 text-[#1A2432]">
        <h1 className="text-xl font-semibold">Problema</h1>
        <p className="mt-2 text-sm text-[#2A3C54]">Manca il guasto. Torna al video e registra di nuovo.</p>
        <HardLink href="/supermastro/video" className="mt-4 inline-flex text-sm font-semibold text-[#E56B10]">
          Torna al video
        </HardLink>
      </section>
    );
  }

  const guide = diyForTrade(fault.trade);
  const hrefInput = { label: fault.trade, lat: fault.lat, lng: fault.lng, summary: fault.summary };

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-66px)] max-w-lg flex-col bg-[#FBF8F3] px-4 py-6 text-[#1A2432]">
      <div className="mt-2">
        <Mascot
          pose={poseForSkill(fault.trade)}
          size={112}
          alt=""
          speech="Scegli: lo sistemi tu, oppure chiami chi è vicino."
        />
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E56B10]">{fault.trade}</p>
      <h1 className="mt-2 text-2xl font-semibold leading-tight">{fault.summary}</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#2A3C54]">{guide.spiegazione}</p>
      <div className="mt-8 flex flex-col gap-3">
        <HardLink
          href={daSoloHref(hrefInput)}
          className="rounded-2xl border border-[#2A3C54] bg-white px-4 py-4 text-center text-sm font-semibold"
        >
          Lo risolvo da solo
        </HardLink>
        <HardLink
          href={ricercaHref(hrefInput)}
          className="rounded-2xl bg-[#E56B10] px-4 py-4 text-center text-sm font-semibold text-white shadow-[0_0_24px_rgba(229,107,16,0.35)]"
        >
          Trova un professionista in zona
        </HardLink>
      </div>
    </section>
  );
}
