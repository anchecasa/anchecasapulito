import { AdminProcurementNavItem } from "@/components/admin/admin-procurement-nav-item";
import Link from "next/link";

export function BarraAdmin({ canAccess }: { canAccess: boolean }) {
  return (
    <aside className="@container flex w-full shrink-0 flex-col gap-2 bg-[#2A3C54] px-4 py-5 text-white md:w-72">
      <p className="px-2 text-sm font-semibold text-[#F4C39A]">AncheCasa</p>
      <Link href="/admin" className="flex min-h-11 items-center rounded-xl px-3 text-base font-semibold">
        Cruscotto
      </Link>
      <Link href="/admin/bim" className="flex min-h-11 items-center rounded-xl px-3 text-base font-semibold">
        AncheBIM
      </Link>
      <AdminProcurementNavItem canAccess={canAccess} />
    </aside>
  );
}
