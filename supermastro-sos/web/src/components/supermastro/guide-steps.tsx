"use client";

import { useRef, useState } from "react";
import Link from "next/link";

export function GuideSteps({
  passi,
  ricercaHref,
  diagnosisId = null,
}: {
  passi: string[];
  ricercaHref: string;
  /** Se c'è, «Risolto» vale come pollice su (una volta sola). Vuoto nelle anteprime. */
  diagnosisId?: string | null;
}) {
  const [done, setDone] = useState<boolean[]>(() => passi.map(() => false));
  const [solved, setSolved] = useState(false);
  const sentRef = useRef(false);

  function risolto() {
    setSolved(true);
    if (!diagnosisId || sentRef.current) return;
    sentRef.current = true;
    // Il pollice su aiuta l'AI a imparare. Se non parte, la guida resta comunque chiusa.
    void fetch("/api/sos/diagnosis-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diagnosisId, vote: "up" }),
    }).catch(() => undefined);
  }

  if (solved) {
    return <p className="mt-6 text-lg font-semibold">Grazie.</p>;
  }

  return (
    <div>
      <ol className="mt-4 space-y-3">
        {passi.map((step, index) => (
          <li key={step}>
            <label className="flex min-h-12 items-start gap-3 rounded-2xl bg-white px-3 py-3">
              <input
                type="checkbox"
                checked={done[index] ?? false}
                onChange={() =>
                  setDone((current) => current.map((value, item) => (item === index ? !value : value)))
                }
                className="mt-1 h-6 w-6 shrink-0 accent-[var(--sm-accent-strong)]"
              />
              <span className="text-base leading-relaxed">
                <span className="mr-2 font-semibold">{index + 1}.</span>
                {step}
              </span>
            </label>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={risolto}
        className="mt-6 flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--sm-accent)] px-5 text-lg font-semibold text-white"
      >
        Risolto
      </button>
      <Link
        href={ricercaHref}
        className="mt-3 flex min-h-12 items-center justify-center rounded-full border border-[var(--sm-ink)] bg-white px-5 text-center text-base font-semibold"
      >
        Non ci riesco: trova un artigiano
      </Link>
    </div>
  );
}
