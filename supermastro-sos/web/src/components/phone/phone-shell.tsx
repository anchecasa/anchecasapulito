"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBook, IconCard, IconHome, IconUser } from "@/components/phone/icons";

const NAV = [
  { href: "/m/home", label: "Home", icon: IconHome },
  { href: "/m/interventi", label: "Interventi", icon: IconBook },
  { href: "/m/pass", label: "Pass", icon: IconCard },
  { href: "/m/profilo", label: "Profilo", icon: IconUser },
] as const;

const BLEED = ["/m/video", "/m/ricerca", "/m/chat"];

function showsNav(path: string) {
  return NAV.some((item) => path === item.href);
}

export function PhoneShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const nav = showsNav(path);
  const bleed = BLEED.some((href) => path === href || path.startsWith(`${href}/`));

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-[#FBF8F3] pt-[env(safe-area-inset-top)] min-[520px]:pt-8">
      <main className={bleed ? "relative h-full min-h-0 flex-1 overflow-hidden" : "min-h-0 flex-1 overflow-y-auto"}>
        {children}
      </main>
      {nav && (
        <nav className="grid shrink-0 grid-cols-4 border-t border-[#2A3C54]/10 bg-white pb-[max(0.35rem,env(safe-area-inset-bottom))]">
          {NAV.map((item) => {
            const active = path === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2 text-[11px] font-semibold ${
                  active ? "text-[#B4500B]" : "text-[#2A3C54]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className={`grid h-9 w-9 place-items-center rounded-full ${active ? "bg-[#B4500B] text-white" : ""}`}>
                  <Icon className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
