import type { Metadata } from "next";
import { WelcomeScreen } from "@/components/phone/welcome-screen";

export const metadata: Metadata = { title: "SuperMastro" };

export default function WelcomePage() {
  return <WelcomeScreen />;
}
