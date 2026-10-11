"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { AppShell } from "@/components/supermastro/app-shell";

const APP_ROUTES = ["/supermastro/privato", "/supermastro/preventivo", "/supermastro/storico"];
const BARE_ROUTES = ["/supermastro/iscrizione"];

export function SuperMastroChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isBare = BARE_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
  const isApp = APP_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));

  if (isBare) return <div className="min-h-dvh bg-white text-[#1A2432]">{children}</div>;
  if (isApp) return <AppShell>{children}</AppShell>;

  return (
    <div className="min-h-full bg-[var(--background)] text-foreground">
      <SiteHeader product="supermastro" ctaHref="/supermastro/iscrizione" ctaLabel="Sei artigiano" />
      <main className="min-w-0 overflow-x-clip">{children}</main>
    </div>
  );
}
