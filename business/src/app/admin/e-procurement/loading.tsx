export default function Caricamento() {
  return (
    <main className="mx-auto flex w-full max-w-6xl animate-pulse flex-col gap-6 px-4 py-10 sm:px-6" aria-busy="true" aria-label="Caricamento">
      <div className="h-10 w-72 rounded-xl bg-[#EFE3D8]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-[#EFE3D8]" />
        ))}
      </div>
      <div className="h-96 rounded-2xl bg-[#EFE3D8]" />
    </main>
  );
}
