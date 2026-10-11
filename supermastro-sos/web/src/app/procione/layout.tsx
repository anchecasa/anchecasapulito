import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SuperMastro Procione — Agenda",
  description: "L'assistente vocale intelligente esclusivo per Fernando",
  manifest: "/procione/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Procione",
  },
};

export const viewport: Viewport = {
  themeColor: "#F27131",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/** FASE TEST: Procione aperto senza login. Ripristinare gate Supabase a fine test. */
export default async function ProcioneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#1a1a1a]">
      {children}
    </div>
  );
}
