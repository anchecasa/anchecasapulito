import { MagicLinkForm } from "@/components/auth/magic-link-form";
import Link from "next/link";
import { sanitizeAuthNextPath } from "@/lib/constants";

export default async function SuperMastroLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = sanitizeAuthNextPath(params.next, "client");
  const adminArea = Boolean(nextPath?.startsWith("/procione") || nextPath?.startsWith("/admin"));

  return (
    <div className="mx-auto w-full min-w-0 max-w-lg space-y-6 px-4 py-8 sm:max-w-xl sm:px-6">
      <Link href="/supermastro" className="text-sm text-muted transition-colors hover:text-foreground">
        ← Torna a SuperMastro
      </Link>
      <MagicLinkForm
        role="client"
        title={
          nextPath?.startsWith("/procione")
            ? "Accedi a Procione Agenda"
            : nextPath?.startsWith("/admin")
              ? "Accedi all'area admin"
              : "Accedi a SuperMastro"
        }
        subtitle={
          adminArea
            ? "Area riservata admin. Ti mando il link via email."
            : "Genera un link sicuro. Nessuna password."
        }
        privacyLabel="Ho letto e accetto l'informativa privacy e i termini del servizio cliente SOS."
        nextPath={nextPath}
      />
    </div>
  );
}
