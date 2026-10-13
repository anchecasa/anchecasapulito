"use client";

import { useEffect, useRef, useState } from "react";
import { EsitoView } from "@/components/supermastro/esito-view";
import { Mascot, type MascotPose } from "@/components/supermastro/mascot";
import { VideoDiagnosis } from "@/components/supermastro/video-diagnosis";
import type { LoadedDiagnosis } from "@/lib/sos/save-diagnosis";

/** Gli altri pulsanti della home aprono la fotocamera qui, con questo evento. */
export const OPEN_VIDEO_EVENT = "supermastro:video";

const TRADES: { pose: MascotPose; label: string }[] = [
  { pose: "idraulico", label: "Idraulico" },
  { pose: "elettricista", label: "Elettricista" },
  { pose: "muratore", label: "Muratore" },
  { pose: "generico", label: "Generico" },
];

const STEPS = ["Video di 5 secondi, con audio", "Ti dico cos'è", "Lo sistemi tu o chiami"] as const;

/**
 * Home di SuperMastro: il video si registra e si analizza qui, senza cambiare pagina.
 * Fotocamera sopra la home, poi l'esito (le due strade) al posto del riquadro.
 * La pagina /supermastro/video resta per i link che arrivano da fuori.
 */
export function HomeEntry({ base = "/supermastro" }: { base?: "/m" | "/supermastro" }) {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [camera, setCamera] = useState(false);
  const [round, setRound] = useState(0);
  const [diagnosis, setDiagnosis] = useState<LoadedDiagnosis | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  function openCamera(testo: string) {
    setNote(testo);
    setDiagnosis(null);
    setRound((n) => n + 1);
    setCamera(true);
    try {
      if (window.location.hash !== "#video") window.history.pushState(null, "", "#video");
    } catch {
      // Senza cronologia la fotocamera si apre lo stesso.
    }
  }

  /** Il mestiere scelto dal riquadro arriva all'AI come indizio, insieme a quello che hai scritto. */
  function go(trade?: string) {
    const parts = [text.trim(), trade ? `Mestiere scelto: ${trade}.` : ""].filter(Boolean);
    openCamera(parts.join(" ").slice(0, 300));
  }

  function closeCamera() {
    setCamera(false);
    try {
      if (window.location.hash === "#video") window.history.back();
    } catch {
      // niente
    }
  }

  function showResult(result: LoadedDiagnosis) {
    setDiagnosis(result);
    setCamera(false);
    try {
      window.history.replaceState(null, "", "#esito");
    } catch {
      // niente
    }
    window.requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
  }

  // Il tasto Indietro del telefono chiude la fotocamera o torna dalla risposta alla home.
  useEffect(() => {
    function onPop() {
      const hash = window.location.hash;
      if (hash !== "#video") setCamera(false);
      if (hash !== "#esito") setDiagnosis(null);
    }
    function onOpen() {
      openCamera("");
    }
    window.addEventListener("popstate", onPop);
    window.addEventListener(OPEN_VIDEO_EVENT, onOpen);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener(OPEN_VIDEO_EVENT, onOpen);
    };
  }, []);

  // La fotocamera copre la home: niente scorrimento sotto.
  useEffect(() => {
    if (!camera) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [camera]);

  const cameraLayer = camera ? (
    <VideoDiagnosis key={round} flowBase={base} note={note} onResult={showResult} onClose={closeCamera} />
  ) : null;

  if (diagnosis) {
    return (
      <div ref={topRef} className="mx-auto w-full max-w-lg scroll-mt-4 text-[var(--sm-ink)]">
        <EsitoView base={base} diagnosis={diagnosis} onRetry={() => openCamera(note)} />
        {cameraLayer}
      </div>
    );
  }

  return (
    <div ref={topRef} className="mx-auto w-full max-w-lg scroll-mt-4 text-[var(--sm-ink)]">
      {cameraLayer}
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
