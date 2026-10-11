import { PackageSearch } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getContestoFornitore } from "@/lib/e-procurement/fornitore";

export const dynamic = "force-dynamic";

/** Portale fornitori: solo chi fa parte di un fornitore attivo dell'Albo. */
export default async function LayoutFornitore({ children }: { children: React.ReactNode }) {
  const ctx = await getContestoFornitore();
  if (!ctx.configured) {
    return <main className="mx-auto max-w-xl px-6 py-16 text-base text-[#2A3C54]">Manca il collegamento a Supabase.</main>;
  }
  if (!ctx.userId) redirect("/login?next=/fornitore/gare");

  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-[#2A3C54] text-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/fornitore/gare" className="flex min-h-11 items-center gap-2 text-base font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-800">
              <PackageSearch size={18} aria-hidden="true" />
            </span>
            AncheCasa · Gare
          </Link>
          <span className="truncate text-sm text-[#F4C39A]">{ctx.fornitori.map((f) => f.nome).join(", ") || "Nessun fornitore"}</span>
        </div>
      </header>
      {ctx.fornitori.length === 0 ? (
        <main className="mx-auto w-full max-w-xl px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold text-[#1A2432]">Area riservata ai fornitori</h1>
          <p className="mt-2 text-base text-[#2A3C54]">Il tuo account non fa parte di un fornitore attivo dell&apos;Albo AncheCasa.</p>
        </main>
      ) : (
        children
      )}
    </div>
  );
}
