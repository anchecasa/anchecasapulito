import type { Metadata } from "next";
import { ModuloPreventivo } from "@/components/supermastro/modulo-preventivo";

export const metadata: Metadata = {
  title: "Preventivo — SuperMastro",
};

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function PreventivoPage({
  searchParams,
}: {
  searchParams: Promise<{
    nome?: string | string[];
    mestiere?: string | string[];
    guasto?: string | string[];
    ruolo?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const ruolo = one(params.ruolo) === "cliente" ? "cliente" : "artigiano";
  return (
    <ModuloPreventivo
      nome={one(params.nome).trim() || "Marco B."}
      mestiere={one(params.mestiere).trim() || "Idraulico"}
      guasto={one(params.guasto).trim() || "Perdita sotto il lavandino"}
      ruolo={ruolo}
    />
  );
}
