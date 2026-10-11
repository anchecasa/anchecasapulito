import type { Metadata } from "next";
import { StoricoInterventi } from "@/components/supermastro/storico-interventi";

export const metadata: Metadata = {
  title: "Storico interventi — SuperMastro",
};

export default function StoricoPage() {
  return <StoricoInterventi />;
}
