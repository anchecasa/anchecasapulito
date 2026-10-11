import type { Metadata } from "next";
import { AccessoSocial } from "@/components/supermastro/accesso-social";

export const metadata: Metadata = { title: "Accedi — SuperMastro" };

export default function AccessPage() {
  return (
    <AccessoSocial
      initialRole="privato"
      initialView="login"
      backHref="/m"
      artisanNext="/m/profilo"
      privateNext="/m/home"
    />
  );
}
