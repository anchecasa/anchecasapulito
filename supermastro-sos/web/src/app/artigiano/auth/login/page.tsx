import { MagicLinkForm } from "@/components/auth/magic-link-form";
import Link from "next/link";
import { ContentPage } from "@/components/layout/content-page";
import { sanitizeAuthNextPath } from "@/lib/constants";

export default async function ArtigianoLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; telefono?: string; profilo?: string }>;
}) {
  const params = await searchParams;
  const nextPath = sanitizeAuthNextPath(params.next, "worker");
  // Arrivo dalla richiesta /r/[token]: profilo creato con il cellulare confermato via SMS.
  const telefono = /^\+\d{8,15}$/.test(params.telefono ?? "") ? params.telefono : "";
  const profilo = params.profilo === "nuovo" || params.profilo === "esiste" ? params.profilo : "";

  return (
    <ContentPage size="sm">
      <Link href="/artigiano" className="text-sm text-muted transition-colors hover:text-foreground">
        ← Torna all&apos;area mastri
      </Link>
      {telefono && profilo ? (
        <div className="mx-auto w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--worker-soft)] px-4 py-3 text-sm leading-relaxed text-foreground" role="status">
          <p className="font-semibold">
            {profilo === "nuovo" ? "Profilo creato con il numero:" : "Questo numero ha già un profilo:"}
          </p>
          <p className="mt-1 select-all text-base font-semibold">{telefono}</p>
          <p className="mt-2">
            L&apos;accesso con il solo numero non è ancora attivo. Scrivi qui la tua email: ti mandiamo un link
            sicuro. Le risposte dei clienti restano nel link della richiesta.
          </p>
        </div>
      ) : null}
      <MagicLinkForm
        role="worker"
        title="Accedi come mastro"
        subtitle="Registrazione dedicata agli artigiani verificati SuperMastro."
        privacyLabel="Ho letto e accetto l'informativa privacy e i termini per artigiani."
        nextPath={nextPath}
      />
    </ContentPage>
  );
}
