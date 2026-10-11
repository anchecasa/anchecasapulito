"use client";

export default function ErroreGare({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-[#1A2432]">Qualcosa non ha funzionato</h1>
      <p className="text-base text-[#2A3C54]">
        Non riesco a caricare le gare.
        {error.digest ? (
          <>
            {" "}
            Codice: <span className="font-mono">{error.digest}</span>
          </>
        ) : null}
      </p>
      <button type="button" onClick={reset} className="min-h-11 rounded-full bg-blue-800 px-5 text-base font-semibold text-white">
        Riprova
      </button>
    </main>
  );
}
