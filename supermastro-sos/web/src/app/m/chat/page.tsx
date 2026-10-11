import type { Metadata } from "next";
import { ArtisanChat } from "@/components/supermastro/artisan-chat";

export const metadata: Metadata = { title: "Chat — SuperMastro" };

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function ChatRoute({
  searchParams,
}: {
  searchParams: Promise<{
    nome?: string | string[];
    distanza?: string | string[];
    guasto?: string | string[];
    mestiere?: string | string[];
  }>;
}) {
  const params = await searchParams;
  return (
    <ArtisanChat
      nome={one(params.nome).trim() || "Professionista"}
      distanza={one(params.distanza).trim() || "in zona"}
      guasto={one(params.guasto).trim() || "Guasto in casa"}
      mestiere={one(params.mestiere).trim() || "Artigiano"}
      contained
      preventivoBase="/m/preventivo"
    />
  );
}
