"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { HardLink } from "@/components/layout/hard-link";
import { SuperMastroWordmark } from "@/components/layout/supermastro-wordmark";

const NAV = [
  { href: "/supermastro/storico", label: "Storico" },
  { href: "/supermastro/preventivo", label: "Preventivo" },
  { href: "/supermastro/privato", label: "Iscrizione" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="min-h-dvh bg-[#FBF8F3] text-[#1A2432] md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[#2A3C54]/10 bg-white md:flex md:flex-col">
        <HardLink href="/supermastro" className="flex items-center gap-2.5 px-5 py-5">
          <Image src="/images/supermastro-icona.png" alt="" width={36} height={36} className="h-9 w-9" />
          <span>
            <SuperMastroWordmark size="sm" />
            <span className="mt-0.5 block text-[11px] font-medium tracking-wide text-[#2A3C54]">AncheCasa</span>
          </span>
        </HardLink>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          <p className="px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2A3C54]/70">
            Area privata
          </p>
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} active={path.startsWith(item.href)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[#2A3C54]/10 p-4">
          <HardLink
            href="/supermastro/iscrizione"
            className="block rounded-xl px-3 py-2 text-sm font-medium text-[#2A3C54] hover:bg-[#FBF8F3]"
          >
            Area artigiano
          </HardLink>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#2A3C54]/10 bg-white px-4 py-3 md:hidden">
          <HardLink href="/supermastro" className="flex items-center gap-2">
            <Image src="/images/supermastro-icona.png" alt="" width={32} height={32} className="h-8 w-8" />
            <SuperMastroWordmark size="sm" />
          </HardLink>
          <span className="text-[11px] font-medium tracking-wide text-[#2A3C54]">AncheCasa</span>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-8 sm:py-8 md:pb-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-[#2A3C54]/10 bg-white md:hidden">
          {NAV.map((item) => (
            <HardLink
              key={item.href}
              href={item.href}
              className={`px-2 py-3 text-center text-xs font-semibold ${
                path.startsWith(item.href) ? "text-[#E56B10]" : "text-[#2A3C54]"
              }`}
            >
              {item.label}
            </HardLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string;
}) {
  return (
    <HardLink
      href={href}
      className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${
        active ? "bg-[#FBF8F3] text-[#E56B10]" : "text-[#1A2432] hover:bg-[#FBF8F3]"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </HardLink>
  );
}
