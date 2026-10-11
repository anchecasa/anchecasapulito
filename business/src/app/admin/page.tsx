import Link from "next/link";
import { AdminProcurementLauncher } from "@/components/admin/admin-procurement-launcher";
import { canAccessProcurement } from "@/lib/eprocurement/auth";

export const dynamic = "force-dynamic";

export default async function CruscottoAdmin() {
  const canAccess = await canAccessProcurement();
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <header>
        <p className="text-sm font-semibold text-[#B4500B]">Cruscotto</p>
        <h1 className="mt-1 text-3xl font-semibold text-[#1A2432]">Admin</h1>
        <p className="mt-2 max-w-xl text-base text-[#2A3C54]">
          Da qui controlli i documenti di gara e di cantiere.
        </p>
      </header>
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/bim"
          className="flex min-h-11 items-center justify-between rounded-2xl bg-[#2A3C54] px-5 py-4 text-lg font-semibold text-white"
        >
          AncheBIM
          <span className="text-sm font-medium text-[#F4C39A]">Analizza un file</span>
        </Link>
        {canAccess ? <AdminProcurementLauncher /> : null}
      </div>
    </main>
  );
}
