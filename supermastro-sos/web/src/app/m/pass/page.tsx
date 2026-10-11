import type { Metadata } from "next";
import { PassScreen } from "@/components/phone/pass-screen";

export const metadata: Metadata = { title: "Pass — SuperMastro" };

export default function PassRoute() {
  return <PassScreen />;
}
