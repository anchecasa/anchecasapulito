"use client";

import { useState } from "react";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function sendVote(diagnosisId: string, vote: "up" | "down", correzione = "") {
  const res = await fetch("/api/sos/diagnosis-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ diagnosisId, vote, correzione }),
  });
  const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "Voto non salvato. Riprova.");
  }
}

export function DiagnosisThumb({ diagnosisId }: { diagnosisId: string }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function voteUp() {
    setError(null);
    if (!UUID.test(diagnosisId)) {
      setError("Su questa anteprima il pollice non si salva.");
      return;
    }
    setPending(true);
    try {
      await sendVote(diagnosisId, "up");
      setVote("up");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voto non salvato. Riprova.");
    } finally {
      setPending(false);
    }
  }

  async function voteDown(event: React.FormEvent) {
    event.preventDefault();
    const text = note.trim();
    if (!text) return;
    setError(null);
    if (!UUID.test(diagnosisId)) {
      setError("Su questa anteprima il pollice non si salva.");
      return;
    }
    setPending(true);
    try {
      await sendVote(diagnosisId, "down", text);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voto non salvato. Riprova.");
    } finally {
      setPending(false);
    }
  }

  if (vote === "up" || sent) {
    return <p className="mt-6 text-base font-semibold text-[var(--sm-ink)]">Grazie.</p>;
  }

  return (
    <div className="mt-6">
      <p className="text-base font-semibold">Questa lettura ti torna?</p>
      <div className="mt-3 flex flex-col gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => void voteUp()}
          className="flex min-h-12 items-center justify-center rounded-full bg-[var(--sm-accent)] px-5 text-lg font-semibold text-white disabled:opacity-60"
        >
          Sì, è giusto
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setVote("down")}
          className="flex min-h-12 items-center justify-center rounded-full border border-[var(--sm-ink)] bg-white px-5 text-base font-semibold disabled:opacity-60"
        >
          No, era altro
        </button>
      </div>
      {vote === "down" && (
        <form className="mt-3 grid gap-3" onSubmit={(event) => void voteDown(event)}>
          <label className="grid gap-2 text-base font-semibold">
            Era invece…
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-12 rounded-2xl border border-[var(--sm-ink)]/15 bg-white px-4 text-base font-normal"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="flex min-h-12 items-center justify-center rounded-full bg-[var(--sm-accent-strong)] px-5 text-base font-semibold text-white disabled:opacity-60"
          >
            Invia
          </button>
        </form>
      )}
      {error && <p className="mt-3 text-base font-semibold text-[var(--sm-accent-strong)]">{error}</p>}
    </div>
  );
}
