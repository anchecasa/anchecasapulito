import type { Metadata } from "next";
import Link from "next/link";
import { RichiestaVideo } from "@/components/supermastro/richiesta-video";
import { requestStatus } from "@/lib/sos/share";

export const metadata: Metadata = {
  title: "La mia richiesta — SuperMastro",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function RichiestaVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Solo chi ha fatto la diagnosi (cookie di sessione o utente) vede la richiesta.
  const status = await requestStatus(id).catch(() => null);
  if (!status) {
    return (
      <section className="mx-auto max-w-lg bg-[var(--sm-paper)] px-5 py-8 text-[var(--sm-ink)]">
        <p className="text-base">Questa richiesta non si apre da questo telefono.</p>
        <p className="mt-2 text-base">Aprila dal telefono con cui hai fatto il video.</p>
        <Link
          href="/supermastro"
          className="mt-4 inline-flex min-h-11 items-center text-base font-semibold text-[var(--sm-accent-strong)]"
        >
          Torna alla home
        </Link>
      </section>
    );
  }
  return <RichiestaVideo diagnosisId={id} titolo={status.titolo} shares={status.shares} base="/supermastro" />;
}
