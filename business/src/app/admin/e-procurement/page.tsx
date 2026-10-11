export const dynamic = "force-dynamic";

export default function PaginaGare() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-10">
      <header>
        <p className="text-sm font-semibold text-[#E56B10]">Admin</p>
        <h1 className="mt-1 text-3xl font-semibold text-[#1A2432]">Gare e subappalti</h1>
      </header>
      <p className="rounded-2xl bg-white px-4 py-4 text-base text-[#2A3C54]">Nessun pacchetto messo a gara</p>
    </main>
  );
}
