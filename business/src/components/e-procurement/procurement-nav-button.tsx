import Link from "next/link";
import { Gavel } from "lucide-react";

export function ProcurementNavButton() {
  return (
    <Link
      href="/admin/e-procurement"
      className="flex min-h-11 items-center justify-between gap-4 rounded-2xl bg-[#2A3C54] px-5 py-4 text-lg font-semibold text-white"
    >
      <span className="flex items-center gap-3">
        <Gavel aria-hidden="true" size={22} />
        Gestione e-Procurement & Gare Private
      </span>
      <span className="text-sm font-medium text-[#F4C39A]">Apri</span>
    </Link>
  );
}
