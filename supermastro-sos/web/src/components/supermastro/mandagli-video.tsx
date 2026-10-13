"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mascot } from "@/components/supermastro/mascot";
import { shareMessage } from "@/lib/sos/share-copy";
import { readHeldVideo } from "@/lib/sos/video-hold";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = {
  /** Gettone firmato dal server. Vuoto se la scheda non si può contattare. */
  leadToken: string;
  nome: string;
  telefono: string;
  /** Artigiano della rete AncheCasa: il numero resta sul server, si invia lo stesso. */
  rete?: boolean;
  distanza: string;
  guasto: string;
  faultLat: number | null;
  faultLng: number | null;
  diagnosisId: string;
  backHref: string;
  flowBase: "/m" | "/supermastro";
};

type Shared = { token: string; zona: string; distanza: string };

export function MandagliVideo(props: Props) {
  const blocked: "nolead" | "missing" | null = !props.leadToken
    ? "nolead"
    : !UUID.test(props.diagnosisId)
      ? "missing"
      : null;
  const [asyncPhase, setAsyncPhase] = useState<"check" | "missing" | "ready">("check");
  const phase = blocked ?? asyncPhase;
  const [sending, setSending] = useState<"whatsapp" | "sms" | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [zona, setZona] = useState("");
  // Il video si carica una sola volta, al primo tocco su "Invia".
  const sharedRef = useRef<Shared | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (blocked) return;
    let dead = false;
    // Qui si controlla solo che il video sia sul telefono: nessun caricamento.
    readHeldVideo(props.diagnosisId)
      .then((blob) => {
        if (!dead) setAsyncPhase(blob ? "ready" : "missing");
      })
      .catch(() => {
        if (!dead) setAsyncPhase("missing");
      });
    return () => {
      dead = true;
    };
  }, [blocked, props.diagnosisId]);

  async function upload(): Promise<Shared | null> {
    if (sharedRef.current) return sharedRef.current;
    const blob = await readHeldVideo(props.diagnosisId).catch(() => null);
    if (!blob) {
      setAsyncPhase("missing");
      return null;
    }
    const body = new FormData();
    body.set("video", blob, blob.type.includes("mp4") ? "guasto.mp4" : "guasto.webm");
    body.set("diagnosisId", props.diagnosisId);
    body.set("leadToken", props.leadToken);
    if (props.faultLat != null && props.faultLng != null) {
      body.set("flat", String(props.faultLat));
      body.set("flng", String(props.faultLng));
    }
    const res = await fetch("/api/sos/share", { method: "POST", body });
    const data = (await res.json().catch(() => null)) as (Shared & { error?: string }) | null;
    if (!res.ok || !data?.token) {
      setNote(data?.error || "Il video è rimasto sul telefono.");
      return null;
    }
    sharedRef.current = { token: data.token, zona: data.zona || "In zona", distanza: data.distanza || props.distanza };
    setZona(sharedRef.current.zona);
    return sharedRef.current;
  }

  async function send(channel: "whatsapp" | "sms") {
    if (busyRef.current) return;
    busyRef.current = true;
    setSending(channel);
    setNote("");
    // La finestra si apre subito, durante il tocco: dopo un'attesa il telefono la bloccherebbe.
    const popup = channel === "whatsapp" ? window.open("", "_blank") : null;
    try {
      const shared = await upload();
      if (!shared) {
        popup?.close();
        return;
      }
      const res = await fetch("/api/sos/share-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: shared.token, channel }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; href?: string } | null;
      if (!res.ok) {
        popup?.close();
        setNote(data?.error || "Invio non riuscito.");
        return;
      }
      if (channel === "whatsapp" && data?.href) {
        if (popup) {
          popup.opener = null;
          popup.location.href = data.href;
        } else {
          window.location.href = data.href;
        }
        setNote("WhatsApp è aperto con il messaggio. Premi invia.");
      } else {
        setNote("SMS inviato.");
      }
      setSent(true);
    } catch {
      popup?.close();
      setNote("Connessione assente. Riprova.");
    } finally {
      busyRef.current = false;
      setSending(null);
    }
  }

  const preview = shareMessage({
    titolo: props.guasto || "Richiesta di lavoro",
    zona: zona || "la tua città",
    distanza: props.distanza || "in zona",
    url: "(link alla richiesta)",
  });
  const followHref = `${props.flowBase}/richiesta-video/${props.diagnosisId}`;

  return (
    <section className="mx-auto flex min-h-full max-w-lg flex-col bg-[#FBF8F3] px-5 py-6 text-[#1A2432]">
      <Mascot
        pose="viso"
        size={88}
        alt=""
        speech={
          phase === "missing"
            ? "Il video non è su questo telefono. Rifallo, poi torna qui."
            : phase === "nolead"
              ? "Questa attività non si può contattare da qui."
              : sent
                ? "Fatto. Ti avviso qui quando risponde."
                : "Lui vede il video con audio, la diagnosi e la zona. Non il tuo nome."
        }
      />
      <h1 className="mt-4 text-2xl font-semibold">Mandagli il video</h1>
      <p className="mt-1 text-base font-semibold">{props.nome}</p>

      {phase === "missing" && (
        <Link
          href={`${props.flowBase}/video`}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#1A2432] px-5 text-base font-semibold text-[#FBF8F3]"
        >
          Rifai il video
        </Link>
      )}

      {phase === "ready" && (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-white px-4 py-3">
            <p className="text-sm font-semibold text-[#2A3C54]">Cosa vede lui</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-base">
              <li>Video di 5 secondi, con audio</li>
              <li>Diagnosi</li>
              <li>Zona e distanza</li>
            </ul>
            <p className="mt-2 text-base">
              Non vede il tuo nome, il telefono e l&apos;indirizzo. Il tuo numero lo vede solo se accetti tu.
            </p>
          </div>
          <pre className="whitespace-pre-wrap rounded-2xl bg-white px-4 py-3 text-base leading-snug">{preview}</pre>
          <p className="text-base leading-snug">
            AncheCasa conserva la richiesta per seguirla e per avvisare l&apos;artigiano se non risponde.
          </p>
          <p className="text-base leading-snug">Il video parte solo quando tocchi Invia.</p>
          {props.telefono || props.rete ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#B4500B] px-4 text-base font-semibold text-white disabled:opacity-60"
                onClick={() => void send("whatsapp")}
                disabled={sending !== null}
              >
                {sending === "whatsapp" ? "Carico il video…" : "Invia con WhatsApp"}
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#1A2432] px-4 text-base font-semibold disabled:opacity-60"
                onClick={() => void send("sms")}
                disabled={sending !== null}
              >
                {sending === "sms" ? "Carico il video…" : "Invia con SMS"}
              </button>
              {props.telefono ? <p className="select-all text-sm text-[#2A3C54]">{props.telefono}</p> : null}
            </div>
          ) : (
            <p className="text-base">Numero non pubblicato. Non posso mandare WhatsApp o SMS.</p>
          )}
          {note ? (
            <p className="text-base font-semibold" role="status">
              {note}
            </p>
          ) : null}
          {sent && UUID.test(props.diagnosisId) ? (
            <Link
              href={followHref}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1A2432] px-4 text-base font-semibold text-[#FBF8F3]"
            >
              Segui la tua richiesta
            </Link>
          ) : null}
        </div>
      )}

      <Link href={props.backHref} className="mt-6 inline-flex min-h-11 items-center text-base font-semibold text-[#B4500B] underline">
        Torna alla mappa
      </Link>
    </section>
  );
}
