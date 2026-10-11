"use client";

import { PackageSearch } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminProcurementNavItem({
  canAccess,
  compatta = false,
}: {
  canAccess: boolean;
  compatta?: boolean;
}) {
  const percorso = usePathname() || "";
  if (!canAccess) return null;
  const attiva = percorso.startsWith("/admin/e-procurement");
  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="border-t border-white/40" role="separator" />
      <Link
        href="/admin/e-procurement"
        aria-current={attiva ? "page" : undefined}
        aria-label="Gestione e-Procurement e Subappalti"
        className={`flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 ${
          attiva ? "bg-blue-800 text-white" : "bg-white ring-1 ring-blue-200 text-blue-900"
        }`}
      >
        <PackageSearch aria-hidden="true" size={20} className="shrink-0" />
        <span className={`min-w-0 flex-col leading-tight ${compatta ? "sr-only" : "hidden @min-[14rem]:flex"}`}>
          <span className="truncate">Gestione e-Procurement</span>
          <span className={`truncate text-xs font-medium ${attiva ? "text-white/80" : "text-blue-800"}`}>
            & Subappalti
          </span>
        </span>
      </Link>
      <div className="border-t border-white/40" role="separator" />
    </div>
  );
}
