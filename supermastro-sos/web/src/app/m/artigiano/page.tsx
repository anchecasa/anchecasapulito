import type { Metadata } from "next";
import { AccessoSocial } from "@/components/supermastro/accesso-social";

export const metadata: Metadata = { title: "Artigiano — SuperMastro" };

export default function ArtigianoRoute() {
  return (
    <AccessoSocial
      initialRole="artigiano"
      initialView="signup"
      backHref="/m"
      artisanNext="/m/profilo"
      privateNext="/m/home"
    />
  );
}
