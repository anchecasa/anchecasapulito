import type { Metadata } from "next";
import { AccessoSocial } from "@/components/supermastro/accesso-social";
import type { AccountRole } from "@/lib/sos/account";

export const metadata: Metadata = {
  title: "Iscrizione — SuperMastro",
};

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function IscrizionePage({
  searchParams,
}: {
  searchParams: Promise<{ ruolo?: string | string[] }>;
}) {
  const params = await searchParams;
  const role: AccountRole = one(params.ruolo) === "privato" ? "privato" : "artigiano";
  return <AccessoSocial initialRole={role} />;
}
