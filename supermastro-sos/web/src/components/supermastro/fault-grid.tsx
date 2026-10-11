"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KNOWN_FAULTS } from "@/lib/sos/known-faults";

export function FaultGrid({
  base,
  lat,
  lng,
}: {
  base: "/m" | "/supermastro";
  lat: number | null;
  lng: number | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(id: string) {
    setPending(id);
    setError(null);
    try {
      const res = await fetch("/api/sos/known-fault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, lat, lng }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; id?: string; error?: string } | null;
      if (!res.ok || !data?.ok || !data.id) {
        setError(data?.error ?? "Non riesco a salvare la scelta. Riprova.");
        setPending(null);
        return;
      }
      router.push(`${base}/esito?id=${data.id}`);
    } catch {
      setError("Connessione assente. Riprova.");
      setPending(null);
    }
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold">Tocca quello che si vede</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {KNOWN_FAULTS.map((fault) => (
          <button
            key={fault.id}
            type="button"
            disabled={pending !== null}
            onClick={() => void choose(fault.id)}
            className="flex min-h-12 items-center justify-center rounded-2xl bg-white px-3 py-3 text-center text-sm font-semibold disabled:opacity-60"
          >
            {fault.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-base font-semibold text-[var(--sm-accent-strong)]">{error}</p>}
    </div>
  );
}
