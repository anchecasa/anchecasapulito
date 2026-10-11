"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mascot, type MascotPose } from "@/components/supermastro/mascot";

const TRADES: { pose: MascotPose; label: string }[] = [
  { pose: "idraulico", label: "Idraulico" },
  { pose: "elettricista", label: "Elettricista" },
  { pose: "muratore", label: "Muratore" },
  { pose: "generico", label: "Generico" },
];

const STEPS = ["Video di 5 secondi, con audio", "Ti dico cos'è", "Lo sistemi tu o chiami"] as const;

function withQuery(href: string, extra: Record<string, string>) {
  const [path, query] = href.split("?");
  const params = new URLSearchParams(query ?? "");
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }
  const next = params.toString();
  return next ? `${path}?${next}` : path;
}

export function HomeEntry({ videoHref }: { videoHref: string }) {
  const router = useRouter();
  const [text, setText] = useState("");

  /** Il mestiere scelto dal riquadro arriva all'AI come indizio, insieme a quello che hai scritto. */
  function go(trade?: string) {
    const parts = [text.trim(), trade ? `Mestiere scelto: ${trade}.` : ""].filter(Boolean);
    const testo = parts.join(" ").slice(0, 300);
    router.push(withQuery(videoHref, testo ? { testo } : {}));
  }

  return (
    <div className="mx-auto w-full max-w-lg text-[var(--sm-ink)]">
      <Mascot
        pose="saluta"
        size={200}
        priority
        alt=""
        speech="Ciao! Che si è rotto?"
      />
      <form
        className="mt-5 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          go();
        }}
      >
        <button
          type="submit"
          className="flex min-h-12 items-center justify-center rounded-full bg-[var(--sm-accent-strong)] px-5 text-lg font-semibold text-white"
        >
          Mostrami il guasto
        </button>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Oppure scrivi…"
          aria-label="Oppure scrivi…"
          className="min-h-12 rounded-2xl border border-[var(--sm-ink)]/15 bg-white px-4 text-base text-[var(--sm-ink)] outline-none"
        />
      </form>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {TRADES.map((trade) => (
          <button
            key={trade.pose}
            type="button"
            onClick={() => go(trade.pose === "generico" ? undefined : trade.label)}
            aria-label={trade.pose === "generico" ? "Altro guasto: mostrami il guasto" : `Guasto da ${trade.label.toLowerCase()}: mostrami il guasto`}
            className="flex min-h-11 flex-col items-center gap-1 rounded-2xl bg-white px-2 py-3 text-sm font-semibold text-[var(--sm-ink)]"
          >
            <Mascot pose={trade.pose} size={72} alt="" />
            {trade.label}
          </button>
        ))}
      </div>
      <ol className="mt-4 grid gap-2">
        {STEPS.map((step, index) => (
          <li key={step} className="flex min-h-11 items-center gap-3 text-sm font-semibold">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--sm-accent-strong)] text-base font-bold text-white">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
