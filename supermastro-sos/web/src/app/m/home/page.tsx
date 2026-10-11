import type { Metadata } from "next";
import { HomeScreen } from "@/components/phone/home-screen";

export const metadata: Metadata = { title: "Home — SuperMastro" };

export default function HomeRoute() {
  return <HomeScreen />;
}
