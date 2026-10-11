"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ASK_LABEL, REPLY_LABEL, type RequestShare } from "@/lib/sos/share-copy";

const POLL_MS = 10_000;

type Props = {
  diagnosisId: string;
  titolo: string;
  shares: RequestShare[];
  base: "/m" | "/supermastro";
};

/** "La mia richiesta": stato letto dal server, senza bisogno del video sul telefono. */
export function RichiestaVideo({ diagnosisId, titolo, shares: initial, base }: Props) {
  const [shares, setShares] = useState<RequestShare[]>(initial);
  const [problem, setProblem] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/sos/share-status?diagnosisId=${encodeURIComponent(diagnosisId)}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as { shares?: RequestShare[]; error?: string } | null;
      if (!res.ok || !data?.shares) {
        setProblem(data?.error || "Non riesco ad aggiornare. Riprovo tra poco.");
        return;
      }
      setProblem("");
      setShares(data.shares);
    } catch {
      setProblem("Connessione assente. Riprovo tra poco.");
    }
  }, [diagnosisId]);

  // Aggiorna ogni 10 secondi, solo quando la pagina è visibile.
  useEffect(() => {
    let timer: number | null = null;
    const start = () => {
      if (timer != null) return;
      timer = window.setInterval(() => void refresh(), POLL_MS);
    };
    const stop = () => {
      if (timer != null) window.clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
        start();
      } else {
        stop();
      }
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  return (
    <section className="mx-auto flex min-h-full w-full max-w-lg flex-col bg-[var(--sm-paper)] px-5 py-6 text-[var(--sm-ink)]">
      <Link href={base === "/m" ? "/m/home" : "/supermastro"} className="inline-flex min-h-11 items-center text-base font-semibold">
        Home
      </Link>
      <h1 className="mt-2 text-2xl font-semibold leading-tight">La mia richiesta</h1>
      <p className="mt-1 text-base">{titolo}</p>
      <p className="mt-1 text-sm text-[#2A3C54]">Si aggiorna da sola ogni 10 secondi.</p>
      {problem ? (
        <p className="mt-3 text-base font-semibold" role="status">
          {problem}
        </p>
      ) : null}

      {shares.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white px-4 py-3 text-base">Non hai ancora mandato il video a nessuno.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {shares.map((share) => (
            <li key={share.id}>
              <ShareCard share={share} diagnosisId={diagnosisId} onChange={refresh} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ShareCard({
  share,
  diagnosisId,
  onChange,
}: {
  share: RequestShare;
  diagnosisId: string;
  onChange: () => Promise<void>;
}) {
  const open = share.chiedi.filter((item) => !item.risposto);
  const done = share.chiedi.filter((item) => item.risposto);

  return (
    <article className="rounded-3xl bg-white p-4">
      <p className="text-lg font-semibold">{share.nome}</p>
      <p className="mt-1 text-base">
        {share.risposta ? `Risposta: ${REPLY_LABEL[share.risposta]}` : "Non ha ancora risposto."}
      </p>

      {share.risposta === "posso_venire" &&
        (share.accettato ? (
          <p className="mt-3 rounded-2xl bg-[var(--sm-paper)] px-3 py-3 text-base font-semibold">
            Hai accettato. Lui vede il tuo numero e ti chiama.
          </p>
        ) : (
          <AcceptForm diagnosisId={diagnosisId} shareId={share.id} onDone={onChange} />
        ))}

      {open.map((item) => (
        <AnswerForm
          key={item.id}
          diagnosisId={diagnosisId}
          shareId={share.id}
          askId={item.id}
          label={ASK_LABEL[item.tipo]}
          messaggio={item.messaggio}
          onDone={onChange}
        />
      ))}

      {done.length > 0 && (
        <ul className="mt-3 space-y-2">
          {done.map((item) => (
            <li key={item.id} className="rounded-2xl bg-[var(--sm-paper)] px-3 py-2 text-base">
              <span className="font-semibold">{ASK_LABEL[item.tipo]}</span>: hai risposto
              {item.risposta_testo ? ` «${item.risposta_testo}»` : "."}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function AcceptForm({
  diagnosisId,
  shareId,
  onDone,
}: {
  diagnosisId: string;
  shareId: string;
  onDone: () => Promise<void>;
}) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function accept(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/sos/share-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosisId, shareId, phone }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error || "Scelta non salvata.");
        return;
      }
      await onDone();
    } catch {
      setError("Connessione assente. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-3 rounded-2xl border-2 border-[var(--sm-ink)] px-3 py-3" onSubmit={(event) => void accept(event)}>
      <p className="text-base font-semibold">Può venire. Vuoi che ti chiami?</p>
      <p className="mt-1 text-base">Il tuo numero lo vede solo lui, e solo se accetti.</p>
      <label className="mt-3 block text-base font-semibold" htmlFor={`tel-${shareId}`}>
        Il tuo numero
      </label>
      <input
        id={`tel-${shareId}`}
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        inputMode="tel"
        autoComplete="tel"
        className="mt-1 min-h-11 w-full rounded-2xl border border-[var(--sm-ink)]/20 bg-[var(--sm-paper)] px-3 text-base"
      />
      <button
        type="submit"
        disabled={busy || phone.trim().length < 6}
        className="mt-3 flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--sm-accent-strong)] px-5 text-base font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Salvo…" : "Accetto: dagli il mio numero"}
      </button>
      {error ? (
        <p className="mt-2 text-base font-semibold text-[#8C1D18]" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function AnswerForm({
  diagnosisId,
  shareId,
  askId,
  label,
  messaggio,
  onDone,
}: {
  diagnosisId: string;
  shareId: string;
  askId: string;
  label: string;
  messaggio: string;
  onDone: () => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const file = fileRef.current?.files?.[0] ?? null;
    if (!text.trim() && !file) {
      setError("Scrivi una risposta o allega un video o una foto.");
      return;
    }
    setBusy(true);
    setError("");
    const body = new FormData();
    body.set("diagnosisId", diagnosisId);
    body.set("shareId", shareId);
    body.set("askId", askId);
    body.set("text", text);
    if (file) body.set("file", file);
    try {
      const res = await fetch("/api/sos/share-answer", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error || "Risposta non salvata.");
        return;
      }
      setText("");
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      await onDone();
    } catch {
      setError("Connessione assente. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-3 rounded-2xl bg-[var(--sm-paper)] px-3 py-3" onSubmit={(event) => void send(event)}>
      <p className="text-base font-semibold">Ti chiede: {label}</p>
      {messaggio ? <p className="mt-1 text-base">{messaggio}</p> : null}
      <label className="mt-3 block text-base font-semibold" htmlFor={`risposta-${askId}`}>
        La tua risposta
      </label>
      <textarea
        id={`risposta-${askId}`}
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="mt-1 min-h-24 w-full rounded-2xl border border-[var(--sm-ink)]/20 bg-white px-3 py-2 text-base"
      />
      <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center text-base font-semibold text-[var(--sm-accent-strong)] underline">
        {fileName ? `Allegato: ${fileName}` : "Allega video o foto"}
        <input
          ref={fileRef}
          type="file"
          accept="video/*,image/*"
          className="sr-only"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--sm-ink)] px-4 text-base font-semibold text-[var(--sm-paper)] disabled:opacity-60"
      >
        {busy ? "Invio…" : "Invia la risposta"}
      </button>
      {error ? (
        <p className="mt-2 text-base font-semibold text-[#8C1D18]" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
