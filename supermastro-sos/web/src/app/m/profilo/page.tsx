import type { Metadata } from "next";
import { ProfiloScreen } from "@/components/phone/profilo-screen";

export const metadata: Metadata = { title: "Profilo — SuperMastro" };

export default function ProfiloRoute() {
  return <ProfiloScreen />;
}
