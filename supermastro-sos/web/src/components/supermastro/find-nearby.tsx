"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { faultSearchParams } from "@/lib/sos/artisan-maps";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = {
  base: "/m" | "/supermastro";
  label: string;
  summary: string;
  diagnosisId: string;
  lat: number | null;
  lng: number | null;
  text: string;
  className: string;
};

/**
 * Bottone per la mappa degli artigiani. Se manca la posizione del guasto
 * (GPS negato), chiede il CAP e usa /api/sos/cap. Niente posizione inventata.
 */
export function FindNearby({ base, label, summary, diagnosisId, lat, lng, text, className }: Props) {
  const router = useRouter();
  const [cap, setCap] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function hrefFor(placeLat: number, placeLng: number) {
    const params = faultSearchParams({ label, lat: placeLat, lng: placeLng, summary });
    if (UUID.test(diagnosisId)) params.set("id", diagnosisId);
    return `${base}/ricerca?${params.toString()}`;
  }

  if (lat != null && lng != null) {
    return (
      <Link href={hrefFor(lat, lng)} className={className}>
        {text}
      </Link>
    );
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const clean = cap.replace(/\D/g, "");
    if (clean.length !== 5) {
      setError("Il CAP ha 5 cifre.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/sos/cap?cap=${clean}`);
      const data = (await res.json().catch(() => null)) as { lat?: number; lng?: number; error?: string } | null;
      if (!res.ok || typeof data?.lat !== "number" || typeof data?.lng !== "number") {
        setError(data?.error || "CAP non trovato.");
        return;
      }
      router.push(hrefFor(data.lat, data.lng));
    } catch {
      setError("Connessione assente. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-4 rounded-3xl bg-white p-4" onSubmit={(event) => void search(event)}>
      <label htmlFor={`cap-${diagnosisId}`} className="block text-base font-semibold">
        Non so dove sei. Scrivi il CAP del guasto.
      </label>
      <input
        id={`cap-${diagnosisId}`}
        value={cap}
        onChange={(event) => setCap(event.target.value)}
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={5}
        className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--sm-ink)]/15 bg-[var(--sm-paper)] px-4 text-base"
      />
      <button type="submit" disabled={busy} className={`${className} w-full disabled:opacity-60`}>
        {busy ? "Cerco…" : text}
      </button>
      {error ? <p className="mt-2 text-base font-semibold text-[#8C1D18]">{error}</p> : null}
    </form>
  );
}
