import type { Metadata } from "next";
import { IscrizionePrivato } from "@/components/supermastro/iscrizione-privato";

export const metadata: Metadata = {
  title: "Iscrizione privato — SuperMastro",
};

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function safeNext(value: string): string {
  if (value.startsWith("/supermastro/") && !value.startsWith("//")) return value;
  return "/supermastro/storico";
}

export default async function PrivatoPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  return <IscrizionePrivato nextPath={safeNext(one(params.next))} />;
}
