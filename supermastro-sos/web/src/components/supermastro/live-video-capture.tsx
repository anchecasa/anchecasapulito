"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Video di 5 secondi registrato dal vivo, dentro la pagina.
 * In SuperMastro nessuno allega file: niente galleria, niente foto, solo fotocamera.
 */

const RECORD_MS = 5000;

type State = "idle" | "opening" | "recording" | "done" | "error";

function pickMime(withAudio: boolean) {
  if (typeof MediaRecorder === "undefined") return "";
  const types = withAudio
    ? ["video/mp4", "video/webm;codecs=vp8,opus", "video/webm"]
    : ["video/mp4", "video/webm;codecs=vp8", "video/webm"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

async function openStream() {
  const video = { facingMode: { ideal: "environment" as const }, width: { ideal: 1280 }, height: { ideal: 720 } };
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true, video });
  } catch {
    return navigator.mediaDevices.getUserMedia({ audio: false, video });
  }
}

export function LiveVideoCapture({
  onChange,
  label = "Registra un video di 5 secondi",
}: {
  onChange: (video: File | null) => void;
  label?: string;
}) {
  const liveRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<State>("idle");
  const [left, setLeft] = useState(5);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function stop() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function record() {
    setError("");
    onChange(null);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("error");
      setError("Fotocamera non disponibile. Apri SuperMastro con Chrome o Safari.");
      return;
    }
    setState("opening");
    let stream: MediaStream;
    try {
      stream = await openStream();
    } catch {
      setState("error");
      setError("Permesso fotocamera negato. Abilitalo e riprova.");
      return;
    }
    streamRef.current = stream;
    const live = liveRef.current;
    if (live) {
      live.srcObject = stream;
      await live.play().catch(() => undefined);
    }
    const mime = pickMime(stream.getAudioTracks().length > 0);
    let recorder: MediaRecorder;
    try {
      recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_200_000 })
        : new MediaRecorder(stream, { videoBitsPerSecond: 1_200_000 });
    } catch {
      stop();
      setState("error");
      setError("Registrazione non disponibile su questo browser.");
      return;
    }
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      stop();
      const type = recorder.mimeType || mime || "video/webm";
      const blob = new Blob(chunks, { type });
      if (blob.size < 1024) {
        setState("error");
        setError("Il video è vuoto. Riprova.");
        return;
      }
      const file = new File([blob], `video.${type.includes("mp4") ? "mp4" : "webm"}`, { type });
      setPreviewUrl(URL.createObjectURL(blob));
      setState("done");
      onChange(file);
    };
    recorder.start();
    setState("recording");
    setLeft(5);
    const started = Date.now();
    const tick = window.setInterval(() => {
      setLeft(Math.max(1, Math.ceil((RECORD_MS - (Date.now() - started)) / 1000)));
    }, 200);
    window.setTimeout(() => {
      window.clearInterval(tick);
      if (recorder.state === "recording") recorder.stop();
    }, RECORD_MS);
  }

  return (
    <div className="mt-3">
      {(state === "opening" || state === "recording") && (
        <div className="relative overflow-hidden rounded-2xl bg-[#1A2432]">
          <video ref={liveRef} className="aspect-video w-full object-cover" playsInline muted autoPlay />
          {state === "recording" && (
            <span
              className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-[#E56B10] text-lg font-bold text-white"
              aria-live="polite"
            >
              {left}
            </span>
          )}
        </div>
      )}
      {state === "done" && previewUrl && (
        <video src={previewUrl} className="aspect-video w-full rounded-2xl bg-[#1A2432] object-cover" playsInline controls />
      )}
      {state !== "opening" && state !== "recording" && (
        <button
          type="button"
          onClick={() => void record()}
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[#B4500B] px-4 text-base font-semibold text-[#B4500B]"
        >
          <span aria-hidden className="h-3 w-3 rounded-full bg-[#E56B10]" />
          {state === "done" ? "Rifai il video" : label}
        </button>
      )}
      {state === "done" && <p className="mt-1 text-sm font-semibold text-[#1A2432]">Video pronto ✓</p>}
      {error && (
        <p className="mt-2 text-base font-semibold text-[#8C1D18]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
