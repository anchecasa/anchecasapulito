"use client";

import { useState } from "react";
import Link from "next/link";
import { Mascot } from "@/components/supermastro/mascot";
import { ASK_LABEL, type AskKind, type PublicAnswer, type ShareReply } from "@/lib/sos/share-copy";

type Props = {
  token: string;
  minutesLabel: string;
  zona: string;
  distanza: string;
  videoUrl: string | null;
  titolo: string;
  visto: string;
  risposta: ShareReply | null;
  nome: string;
  mestiere: string;
  telefono: string;
  optOut: boolean;
  answers: PublicAnswer[];
  verificato: boolean;
  accettato: boolean;
  clienteTelefono: string | null;
  preview?: boolean;
};

type Step = "reply" | "phone" | "code" | "profile" | "done" | "out";

const ASKS: AskKind[] = ["altro_video", "foto_vicino", "misure", "marca_modello", "domanda"];

function firstStep(props: Props): Step {
  if (props.optOut) return "out";
  if (!props.risposta) return "reply";
  if (props.verificato) return "profile";
  return "phone";
}

export function ArtisanRequest(props: Props) {
  const [risposta, setRisposta] = useState<ShareReply | null>(props.risposta);
  const [phone, setPhone] = useState(props.telefono);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState(props.preview ? "000000" : "");
  const [nome, setNome] = useState(props.nome);
  const [mestiere, setMestiere] = useState(props.mestiere);
  const [step, setStep] = useState<Step>(firstStep(props));
  const [verified, setVerified] = useState(props.verificato);
  const [loginHref, setLoginHref] = useState("");
  const [existing, setExisting] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState<PublicAnswer[]>(props.answers);
  const [note, setNote] = useState("");

  async function call(body: Record<string, string>) {
    if (props.preview) return { ok: true as const, devCode: "000000" };
    const res = await fetch("/api/sos/r", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: props.token, ...body }),
    });
    const data = (await res.json().catch(() => null)) as {
      error?: string;
      ok?: boolean;
      devCode?: string;
      verified?: boolean;
      loginHref?: string;
      existing?: boolean;
      item?: { id: string; tipo: AskKind; messaggio: string };
    } | null;
    if (!res.ok) throw new Error(data?.error || "Operazione non riuscita.");
    return data ?? {};
  }

  async function run(action: () => Promise<void>, fallback: string) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  function choose(value: ShareReply) {
    void run(async () => {
      await call({ action: "respond", risposta: value });
      setRisposta(value);
      setStep(verified ? "profile" : "phone");
    }, "Risposta non salvata.");
  }

  function sendCode() {
    void run(async () => {
      const data = await call({ action: "otp", phone });
      if (data.verified) {
        setVerified(true);
        setStep("profile");
        return;
      }
      if (data.devCode) setDevCode(data.devCode);
      setStep("code");
    }, "SMS non partito.");
  }

  function confirmCode() {
    void run(async () => {
      if (props.preview && code.trim() !== "000000") throw new Error("Codice non giusto.");
      await call({ action: "verify", code });
      setVerified(true);
      setStep("profile");
    }, "Codice non giusto.");
  }

  function createProfile() {
    void run(async () => {
      const data = await call({ action: "profile", nome, mestiere });
      setLoginHref(data.loginHref || "/artigiano/auth/login");
      setExisting(Boolean(data.existing));
      setStep("done");
    }, "Profilo non creato.");
  }

  function optOut() {
    void run(async () => {
      await call({ action: "optout" });
      setStep("out");
    }, "Scelta non salvata.");
  }

  function ask(tipo: AskKind) {
    void run(async () => {
      const data = await call({ action: "ask", tipo, messaggio: note });
      const item = data.item;
      setAnswers((current) => [
        ...current,
        {
          id: item?.id ?? `${tipo}-${current.length}`,
          tipo,
          messaggio: item?.messaggio ?? note,
          risposta_testo: "",
          file: null,
        },
      ]);
      setNote("");
    }, "Domanda non inviata.");
  }

  const speech =
    step === "out"
      ? "Va bene. Non ti arrivano altre richieste."
      : step === "done"
        ? "Profilo pronto. Per entrare usa la pagina di accesso."
        : step === "phone"
          ? "Dove ti mando la risposta del cliente?"
          : step === "code"
            ? "Scrivi il codice che ti è arrivato."
            : step === "profile"
              ? "Nome e mestiere sono già compilati. Crea il profilo."
              : "Rispondi con un tocco.";

  return (
    <section className="mx-auto min-h-dvh max-w-lg bg-[#FBF8F3] px-5 py-6 text-[#1A2432]">
      <h1 className="text-2xl font-semibold leading-tight">{`Richiesta di lavoro · ${props.minutesLabel}`}</h1>
      <p className="mt-2 text-base">{`Zona: ${props.zona}. Distanza: ${props.distanza}.`}</p>
      <div className="mt-4">
        <Mascot pose="viso" size={84} alt="" speech={speech} />
      </div>
      {props.videoUrl ? (
        <video className="mt-4 w-full rounded-2xl bg-black" src={props.videoUrl} controls playsInline />
      ) : (
        <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-base">Video con audio, nella richiesta.</p>
      )}
      <h2 className="mt-4 text-xl font-semibold">{props.titolo}</h2>
      <p className="mt-2 text-base leading-relaxed">{props.visto}</p>

      {risposta === "posso_venire" && step !== "out" && (
        <div className="mt-5 rounded-2xl border-2 border-[#1A2432] bg-white px-4 py-3">
          {props.clienteTelefono ? (
            <>
              <p className="text-base font-semibold">Il cliente ha accettato. Chiamalo:</p>
              <p className="mt-1 select-all text-2xl font-bold">{props.clienteTelefono}</p>
              <a
                href={`tel:${props.clienteTelefono.replace(/[^\d+]/g, "")}`}
                className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-[#1A2432] px-5 text-base font-semibold text-[#FBF8F3]"
              >
                Chiama il cliente
              </a>
            </>
          ) : props.accettato ? (
            <p className="text-base font-semibold">
              Il cliente ha accettato. Conferma il tuo cellulare qui sotto per vedere il suo numero.
            </p>
          ) : (
            <p className="text-base">Quando il cliente accetta, qui vedi il suo numero. Ti mandiamo anche un SMS.</p>
          )}
        </div>
      )}

      {step === "reply" && (
        <div className="mt-5 flex flex-col gap-2">
          <button type="button" className="min-h-11 rounded-full bg-[#1A2432] px-4 text-base font-semibold text-[#FBF8F3]" disabled={busy} onClick={() => choose("posso_venire")}>
            Posso venire
          </button>
          <button type="button" className="min-h-11 rounded-full border-2 border-[#1A2432] px-4 text-base font-semibold" disabled={busy} onClick={() => choose("info")}>
            Mi serve un&apos;info
          </button>
          <button type="button" className="min-h-11 rounded-full border-2 border-[#1A2432] px-4 text-base font-semibold" disabled={busy} onClick={() => choose("non_posso")}>
            Non posso
          </button>
        </div>
      )}

      {step === "phone" && (
        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            sendCode();
          }}
        >
          <label className="text-base font-semibold" htmlFor="cellulare">
            Dove ti mando la risposta del cliente?
          </label>
          <input
            id="cellulare"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="tel"
            autoComplete="tel"
            className="mt-2 min-h-11 w-full rounded-2xl border border-[#1A2432]/20 bg-white px-3 text-base"
          />
          <button type="submit" className="mt-3 min-h-11 rounded-full bg-[#1A2432] px-4 text-base font-semibold text-[#FBF8F3]" disabled={busy}>
            Mandami il codice
          </button>
        </form>
      )}

      {step === "code" && (
        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            confirmCode();
          }}
        >
          <label className="text-base font-semibold" htmlFor="codice">
            Codice SMS
          </label>
          <input
            id="codice"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="mt-2 min-h-11 w-full rounded-2xl border border-[#1A2432]/20 bg-white px-3 text-base"
          />
          {devCode ? <p className="mt-2 text-base">Codice di prova: {devCode}</p> : null}
          <button type="submit" className="mt-3 min-h-11 rounded-full bg-[#1A2432] px-4 text-base font-semibold text-[#FBF8F3]" disabled={busy}>
            Conferma il codice
          </button>
          <button
            type="button"
            className="ml-2 mt-3 min-h-11 px-3 text-base font-semibold text-[#B4500B] underline"
            disabled={busy}
            onClick={() => setStep("phone")}
          >
            Chiedi un altro codice
          </button>
        </form>
      )}

      {step === "profile" && (
        <form
          className="mt-5 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            createProfile();
          }}
        >
          <label className="block text-base font-semibold" htmlFor="nome">
            Nome
          </label>
          <input id="nome" value={nome} onChange={(event) => setNome(event.target.value)} className="min-h-11 w-full rounded-2xl border border-[#1A2432]/20 bg-white px-3 text-base" />
          <label className="block text-base font-semibold" htmlFor="mestiere">
            Mestiere
          </label>
          <input id="mestiere" value={mestiere} onChange={(event) => setMestiere(event.target.value)} className="min-h-11 w-full rounded-2xl border border-[#1A2432]/20 bg-white px-3 text-base" />
          <button type="submit" className="min-h-11 rounded-full bg-[#B4500B] px-4 text-base font-semibold text-white" disabled={busy}>
            Crea il profilo
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="mt-5 rounded-2xl bg-white px-4 py-3">
          <p className="text-base font-semibold">
            {existing ? "Questo numero ha già un profilo." : "Profilo creato."}
          </p>
          <p className="mt-1 text-base">
            Per entrare nell&apos;area artigiani vai alla pagina di accesso. Questa pagina resta valida: torna qui per vedere
            le risposte del cliente.
          </p>
          <Link
            href={loginHref || "/artigiano/auth/login"}
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-[#1A2432] px-5 text-base font-semibold text-[#FBF8F3]"
          >
            Vai all&apos;accesso
          </Link>
        </div>
      )}

      {answers.length > 0 && (
        <div className="mt-6 rounded-2xl bg-white px-4 py-3">
          <p className="text-base font-semibold">Le tue domande al cliente</p>
          <ul className="mt-2 space-y-3">
            {answers.map((item) => (
              <li key={item.id} className="rounded-2xl bg-[#FBF8F3] px-3 py-3">
                <p className="text-base font-semibold">{ASK_LABEL[item.tipo]}</p>
                {item.messaggio ? <p className="mt-1 text-base">{item.messaggio}</p> : null}
                {item.risposta_testo || item.file ? (
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-[#2A3C54]">Risposta del cliente</p>
                    {item.risposta_testo ? <p className="mt-1 text-base">{item.risposta_testo}</p> : null}
                    {item.file?.kind === "video" ? (
                      <video className="mt-2 w-full rounded-2xl bg-black" src={item.file.url} controls playsInline />
                    ) : item.file ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URL firmato breve, fuori da next/image
                      <img className="mt-2 w-full rounded-2xl" src={item.file.url} alt="Foto mandata dal cliente" />
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[#2A3C54]">In attesa di risposta.</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {risposta && risposta !== "non_posso" && step !== "out" && step !== "reply" && (
        <div className="mt-6 rounded-2xl bg-white px-4 py-3">
          <p className="text-base font-semibold">Chiedi al cliente</p>
          <label className="mt-2 block text-base" htmlFor="nota">
            Messaggio
          </label>
          <textarea id="nota" value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 min-h-20 w-full rounded-2xl border border-[#1A2432]/20 bg-[#FBF8F3] px-3 py-2 text-base" />
          <div className="mt-2 flex flex-col gap-2">
            {ASKS.map((tipo) => (
              <button key={tipo} type="button" className="min-h-11 rounded-full border-2 border-[#1A2432] px-4 text-base font-semibold" disabled={busy} onClick={() => ask(tipo)}>
                {ASK_LABEL[tipo]}
              </button>
            ))}
          </div>
        </div>
      )}

      {error ? (
        <p className="mt-3 text-base font-semibold text-[#8C1D18]" role="alert">
          {error}
        </p>
      ) : null}

      {step !== "out" && (
        <div className="mt-8 flex flex-col gap-2 border-t border-[#1A2432]/10 pt-4 text-base">
          <p>Abbiamo trovato la tua attività su una mappa pubblica</p>
          <button type="button" className="min-h-11 text-left font-semibold text-[#B4500B] underline" disabled={busy} onClick={optOut}>
            Non voglio più richieste
          </button>
          <Link href="/supermastro/privacy" className="inline-flex min-h-11 items-center font-semibold text-[#B4500B] underline">
            Privacy
          </Link>
        </div>
      )}
    </section>
  );
}
