import type { Metadata } from "next";
import { AccessoSocial } from "@/components/supermastro/accesso-social";

export const metadata: Metadata = { title: "Iscrizione — SuperMastro" };

export default async function IscrizioneRoute({
  searchParams,
}: {
  searchParams: Promise<{ ruolo?: string | string[] }>;
}) {
  const params = await searchParams;
  const ruolo = (Array.isArray(params.ruolo) ? params.ruolo[0] : params.ruolo) === "artigiano" ? "artigiano" : "privato";
  return (
    <AccessoSocial
      initialRole={ruolo}
      initialView="signup"
      backHref="/m"
      artisanNext="/m/profilo"
      privateNext="/m/home"
    />
  );
}
