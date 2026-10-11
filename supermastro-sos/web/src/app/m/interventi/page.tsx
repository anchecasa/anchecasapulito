import type { Metadata } from "next";
import { InterventiScreen } from "@/components/phone/interventi-screen";

export const metadata: Metadata = { title: "Interventi — SuperMastro" };

export default function InterventiRoute() {
  return <InterventiScreen />;
}
