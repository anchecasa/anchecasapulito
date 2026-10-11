import type { Metadata, Viewport } from "next";
import { PhoneShell } from "@/components/phone/phone-shell";

export const metadata: Metadata = {
  title: "SuperMastro",
  description: "Video del guasto, artigiano in zona.",
  appleWebApp: {
    capable: true,
    title: "SuperMastro",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FBF8F3",
};

export default function PhoneLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#1A2432]">
      <div className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#FBF8F3] min-[520px]:h-[min(844px,calc(100dvh-2rem))] min-[520px]:rounded-[36px] min-[520px]:shadow-[0_28px_80px_rgba(0,0,0,0.45)] min-[520px]:ring-1 min-[520px]:ring-white/20">
        <span className="pointer-events-none absolute left-1/2 top-2 z-40 hidden h-[22px] w-28 -translate-x-1/2 rounded-full bg-black min-[520px]:block" />
        <PhoneShell>{children}</PhoneShell>
      </div>
    </div>
  );
}
