import type { Metadata } from "next";
import Link from "next/link";
import { EsitoView } from "@/components/supermastro/esito-view";
import { applyRules, SAMPLE_CASES } from "@/lib/sos/diagnosis-rules";
import { loadDiagnosis, type LoadedDiagnosis } from "@/lib/sos/save-diagnosis";

export const metadata: Metadata = { title: "Esito — SuperMastro" };

function one(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function preview(key: string): LoadedDiagnosis | null {
  const draft = SAMPLE_CASES[key];
  if (!draft) return null;
  return { id: key, ...applyRules(draft, { lat: 41.897806, lng: 12.494616 }) };
}

export default async function EsitoRoute({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[]; prova?: string | string[] }>;
}) {
  const params = await searchParams;
  const prova = one(params.prova);
  if (process.env.NODE_ENV === "development" && prova) {
    const diagnosis = preview(prova);
    if (diagnosis) return <EsitoView base="/m" diagnosis={diagnosis} preview={prova} />;
  }
  const diagnosis = await loadDiagnosis(one(params.id));
  if (!diagnosis) {
    return (
      <section className="bg-[var(--sm-paper)] px-5 py-8 text-[var(--sm-ink)]">
        <p className="text-base">Manca la diagnosi. Torna al video e registra di nuovo.</p>
        <Link href="/m/video" className="mt-4 inline-flex min-h-11 items-center text-base font-semibold text-[var(--sm-accent-strong)]">
          Torna al video
        </Link>
      </section>
    );
  }
  return <EsitoView base="/m" diagnosis={diagnosis} />;
}
