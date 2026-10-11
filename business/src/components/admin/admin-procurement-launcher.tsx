import { PackageSearch } from "lucide-react";
import Link from "next/link";

export function AdminProcurementLauncher() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-blue-200 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-800 text-white">
          <PackageSearch aria-hidden="true" size={22} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-[#1A2432]">Gestione e-Procurement & Subappalti</h2>
          <p className="mt-1 text-base text-[#2A3C54]">
            Metti a gara i pacchetti di lavoro, invita i subappaltatori dall&apos;Albo e confronta le offerte
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/admin/e-procurement"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-blue-800 px-4 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
        >
          Apri la centrale
        </Link>
        <Link
          href="/admin/e-procurement?nuovo=1"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-blue-900 ring-1 ring-blue-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
        >
          Nuovo pacchetto
        </Link>
      </div>
    </section>
  );
}
