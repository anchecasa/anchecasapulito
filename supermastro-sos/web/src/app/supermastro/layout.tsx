import type { Metadata } from "next";
import { SuperMastroChrome } from "@/components/supermastro/supermastro-chrome";

export const metadata: Metadata = {
  title: "SuperMastro — AncheCasa",
  description: "Scatta, invia, risolviamo.",
};

export default function SuperMastroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperMastroChrome>{children}</SuperMastroChrome>;
}
