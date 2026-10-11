"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mascot } from "@/components/supermastro/mascot";
import { demoDiagnosisForSkill } from "@/lib/sos/demo";
import { acquireDevicePosition } from "@/lib/sos/location";
import { holdVideo } from "@/lib/sos/video-hold";
import { SOS_SKILL_OPTIONS } from "@/lib/sos/constants";

const ANALYSIS_STEPS = [
  "Guardo le immagini",
  "Ascolto il rumore",
  "Controllo se è pericoloso",
  "Preparo la soluzione",
] as const;

const RECORD_MS = 5000;
const NOTICE_KEY = "supermastro-avviso-video";
const VIDEO = {
  facingMode: { ideal: "environment" as const },
  width: { ideal: 1280 },
  height: { ideal: 720 },
};

type Phase = "opening" | "ready" | "recording" | "analyzing" | "found" | "error";

type Vista = "pronta" | "registra" | "analisi" | "guasto";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickMime(withAudio: boolean) {
  if (typeof MediaRecorder === "undefined") return "";
  const types = withAudio
    ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/mp4", "video/webm"]
    : ["video/webm;codecs=vp9", "video/webm", "video/mp4"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function canRetryWithoutMic(err: unknown) {
  const name = err instanceof DOMException ? err.name : "";
  return (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    name === "NotFoundError" ||
    name === "OverconstrainedError"
  );
}

function streamHasAudio(stream: MediaStream) {
  return stream.getAudioTracks().some((track) => track.readyState === "live");
}

function cameraErrorMessage(err: unknown) {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Permesso fotocamera negato. Abilitalo e riprova.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Fotocamera in uso da un'altra app. Chiudila e riprova.";
  }
  return "Fotocamera non disponibile. Carica un video dal telefono.";
}

function initialPhase(vista?: Vista): Phase {
  if (vista === "registra") return "recording";
  if (vista === "analisi") return "analyzing";
  if (vista === "guasto") return "found";
  return "opening";
}

export function VideoDiagnosis({
  vista,
  flowBase,
  contained = false,
  homeHref = "/supermastro",
  note = "",
}: {
  vista?: Vista;
  flowBase?: string;
  contained?: boolean;
  homeHref?: string;
  note?: string;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Nessuna posizione inventata: se il GPS non risponde resta vuota e la mappa chiede il CAP.
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const aliveRef = useRef(true);
  const recordingRef = useRef(false);
  const demo = demoDiagnosisForSkill(SOS_SKILL_OPTIONS[0].slug, SOS_SKILL_OPTIONS[0].label);
  const [phase, setPhase] = useState<Phase>(initialPhase(vista));
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(5);
  const [summary, setSummary] = useState<string | null>(vista === "guasto" ? demo.summary : null);
  const [hasCamera, setHasCamera] = useState(false);
  const [silent, setSilent] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisMark, setAnalysisMark] = useState(phase);
  const [gate, setGate] = useState<"checking" | "show" | "go">(
    vista === "analisi" || vista === "guasto" || vista === "registra" ? "go" : "checking",
  );
  if (analysisMark !== phase) {
    setAnalysisMark(phase);
    if (phase === "analyzing") setAnalysisStep(0);
  }

  useEffect(() => {
    let cancelled = false;
    acquireDevicePosition()
      .then((position) => {
        if (!cancelled) coordsRef.current = position;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (vista === "analisi" || vista === "guasto" || vista === "registra") return;
    let next: "go" | "show" = "show";
    try {
      next = window.localStorage.getItem(NOTICE_KEY) === "1" ? "go" : "show";
    } catch {
      next = "show";
    }
    let dead = false;
    queueMicrotask(() => {
      if (!dead) setGate(next);
    });
    return () => {
      dead = true;
    };
  }, [vista]);

  useEffect(() => {
    if (phase !== "analyzing") return;
    const timer = window.setInterval(() => {
      setAnalysisStep((current) => Math.min(current + 1, ANALYSIS_STEPS.length));
    }, 700);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    let dead = false;
    let local: MediaStream | null = null;
    aliveRef.current = true;
    if (vista === "analisi" || vista === "guasto" || gate !== "go") return;

    if (!window.isSecureContext) {
      queueMicrotask(() => {
        if (dead) return;
        setHasCamera(false);
        setPhase("error");
        setError("Su questo collegamento la fotocamera live è bloccata. Apri la fotocamera e carica un video di pochi secondi.");
      });
      return () => {
        dead = true;
      };
    }

    const timeout = window.setTimeout(() => {
      if (dead || vista === "registra") return;
      setPhase((current) => {
        if (current !== "opening") return current;
        setError("Fotocamera non disponibile. Carica un video dal telefono.");
        return "error";
      });
    }, 8000);

    async function openCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (vista === "registra") return;
        setPhase("error");
        setError("Fotocamera non disponibile. Carica un video dal telefono.");
        return;
      }
      try {
        let withoutMic = false;
        try {
          local = await navigator.mediaDevices.getUserMedia({ audio: true, video: VIDEO });
        } catch (err) {
          if (!canRetryWithoutMic(err)) throw err;
          withoutMic = true;
          local = await navigator.mediaDevices.getUserMedia({ audio: false, video: VIDEO });
        }
        if (dead) {
          local.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = local;
        setHasCamera(true);
        setSilent(withoutMic || !streamHasAudio(local));
        const video = videoRef.current;
        if (video) {
          video.srcObject = local;
          await video.play();
        }
        window.clearTimeout(timeout);
        if (vista !== "registra") setPhase("ready");
      } catch (err) {
        window.clearTimeout(timeout);
        if (dead || vista === "registra") return;
        setPhase("error");
        setError(cameraErrorMessage(err));
      }
    }

    void openCamera();
    return () => {
      dead = true;
      aliveRef.current = false;
      window.clearTimeout(timeout);
      local?.getTracks().forEach((track) => track.stop());
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [vista, gate]);

  async function analyzeBlob(blob: Blob) {
    if (!aliveRef.current) return;
    setPhase("analyzing");
    setError(null);
    const started = Date.now();
    try {
      if (blob.size > 8 * 1024 * 1024) {
        setPhase("error");
        setError("Il video è troppo pesante. Tieni la registrazione entro 5 secondi.");
        return;
      }
      const body = new FormData();
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      body.append("video", blob, `guasto.${ext}`);
      if (note.trim()) body.append("nota", note.trim().slice(0, 300));
      const position = coordsRef.current;
      if (position) {
        body.append("lat", String(position.lat));
        body.append("lng", String(position.lng));
      }
      const res = await fetch("/api/sos/video-diagnosis", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        id?: string;
        error?: string;
      } | null;
      if (!aliveRef.current) return;
      if (!res.ok || !data?.ok || !data.id) {
        setPhase("error");
        setError(data?.error ?? "Analisi non riuscita. Riprova inquadrando il guasto.");
        return;
      }
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce) {
        const left = 2800 - (Date.now() - started);
        if (left > 0) await sleep(left);
      }
      if (!aliveRef.current) return;
      await holdVideo(data.id, blob).catch(() => undefined);
      const base = flowBase || "/supermastro";
      router.push(`${base}/esito?id=${data.id}`);
    } catch {
      if (!aliveRef.current) return;
      setPhase("error");
      setError("Connessione assente. Riprova.");
    } finally {
      recordingRef.current = false;
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream || phase !== "ready" || recordingRef.current) return;
    recordingRef.current = true;
    const withAudio = streamHasAudio(stream);
    const mime = pickMime(withAudio);
    let recorder: MediaRecorder;
    try {
      recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_200_000 })
        : new MediaRecorder(stream, { videoBitsPerSecond: 1_200_000 });
    } catch {
      setPhase("error");
      setError("Registrazione non disponibile su questo browser. Carica un video dal telefono.");
      return;
    }
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || mime || "video/webm" });
      void analyzeBlob(blob);
    };
    recorder.start();
    setPhase("recording");
    setLeft(5);
    const started = Date.now();
    const tick = window.setInterval(() => {
      const remain = Math.max(1, Math.ceil((RECORD_MS - (Date.now() - started)) / 1000));
      setLeft(remain);
    }, 200);
    window.setTimeout(() => {
      window.clearInterval(tick);
      if (recorder.state === "recording") recorder.stop();
    }, RECORD_MS);
  }

  function acceptNotice() {
    try {
      window.localStorage.setItem(NOTICE_KEY, "1");
    } catch {
      // La fotocamera si apre lo stesso, in questa sessione.
    }
    setGate("go");
  }

  return (
    <section
      className={`${contained ? "absolute inset-0" : "fixed inset-0 z-[70]"} flex flex-col bg-[#1A2432] text-[#FBF8F3]`}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted
        autoPlay
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/70 to-transparent" />
      <header className="relative z-10 flex items-center gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <a href={homeHref} className="text-sm font-semibold text-[#FBF8F3]">
          Indietro
        </a>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Registra il problema</p>
          <p className="truncate text-[11px] text-[#FBF8F3]/80">Fino a 5 secondi, con audio</p>
        </div>
      </header>

      {phase === "analyzing" && (
        <div className="absolute inset-0 z-20 flex flex-col justify-end bg-[var(--sm-paper)] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-16 text-[var(--sm-ink)]">
          <div className="flex w-full items-center gap-3">
            <div className="relative grid h-28 w-28 shrink-0 place-items-center">
              <span
                aria-hidden
                className="absolute inset-0 animate-spin rounded-full border-4 border-[var(--sm-ink)]/15 border-t-[var(--sm-accent)] motion-reduce:animate-none"
              />
              <Mascot pose="viso" size={72} alt="" />
            </div>
            <p className="min-w-0 flex-1 rounded-2xl border border-[var(--sm-ink)]/15 bg-white px-4 py-3 text-base font-semibold leading-snug">
              Se non vedo bene te lo dico. Non tiro a indovinare.
            </p>
          </div>
          <ol className="mt-6 grid gap-2" aria-live="polite">
            {ANALYSIS_STEPS.map((step, index) => {
              const done = analysisStep > index;
              return (
                <li key={step} className="flex min-h-11 items-center gap-3 text-base font-semibold">
                  <span
                    aria-hidden
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg font-bold ${
                      done
                        ? "bg-[var(--sm-accent-strong)] text-white"
                        : "border border-[var(--sm-ink)]/20 text-[var(--sm-ink)]"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  {step}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="relative z-10 mt-auto flex flex-col items-center gap-4 px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        {gate === "show" ? (
          <div className="w-full max-w-md rounded-3xl bg-white p-4 text-[var(--sm-ink)]">
            <Mascot
              pose="viso"
              size={72}
              alt=""
              speech="Il video registra immagini e audio per 5 secondi. Lo uso solo per capire il guasto. Evita di riprendere persone o documenti."
            />
            <a
              href="/supermastro/privacy"
              className="mt-3 inline-flex min-h-11 items-center text-base font-semibold text-[var(--sm-accent-strong)] underline"
            >
              Privacy
            </a>
            <button
              type="button"
              onClick={acceptNotice}
              className="mt-2 flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--sm-accent)] px-5 text-lg font-semibold text-white"
            >
              Apri la fotocamera
            </button>
          </div>
        ) : gate === "go" ? (
          <>
            {(phase === "opening" || phase === "ready" || phase === "recording") && (
              <Mascot pose="viso" size={72} alt="" speech="Mostrami il guasto da vicino. Bastano 5 secondi." />
            )}
            {silent && (phase === "ready" || phase === "recording") && (
              <p className="max-w-xs text-center text-base font-semibold leading-snug">
                {"Registro senza audio: se c'è un rumore, descrivilo dopo."}
              </p>
            )}
            {phase === "recording" && !silent && (
              <p className="flex items-center gap-2 text-base font-semibold" aria-live="polite">
                <span aria-hidden className="h-3 w-3 rounded-full bg-[var(--sm-accent)] motion-safe:animate-pulse" />
                Audio acceso
              </p>
            )}
            {phase === "error" && error && <Mascot pose="viso" size={72} alt="" speech={error} />}
            {phase === "found" && summary && (
              <Mascot pose="viso" size={72} alt="" speech={`Guasto trovato. ${summary}`} />
            )}

            {phase === "error" ? (
              <div className="flex w-full max-w-md flex-col items-center gap-3">
                {hasCamera && (
                  <button
                    type="button"
                    onClick={() => {
                      recordingRef.current = false;
                      setError(null);
                      setPhase("ready");
                    }}
                    className="flex min-h-12 items-center justify-center rounded-full bg-[var(--sm-accent)] px-5 text-lg font-semibold text-white"
                  >
                    Registra di nuovo
                  </button>
                )}
                <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-[#FBF8F3] px-5 text-base font-semibold text-[#FBF8F3]">
                  Carica un video dal telefono
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    capture="environment"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void analyzeBlob(file);
                    }}
                  />
                </label>
              </div>
            ) : (
              <button
                type="button"
                aria-label="Registra video e audio di 5 secondi del problema"
                disabled={phase !== "ready"}
                onClick={startRecording}
                className="relative grid h-20 w-20 place-items-center rounded-full border-4 border-[#FBF8F3] bg-transparent disabled:opacity-60"
              >
                <span
                  className={`block rounded-full bg-[#E56B10] shadow-[0_0_18px_rgba(229,107,16,0.8)] ${
                    phase === "recording" ? "h-8 w-8" : "h-14 w-14"
                  }`}
                />
                {phase === "recording" && (
                  <span className="absolute text-lg font-bold text-white" aria-live="polite">
                    {left}
                  </span>
                )}
              </button>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
