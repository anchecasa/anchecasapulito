"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendMagicLink, type AuthActionState } from "@/app/auth/actions";
import { IconArrow } from "@/components/phone/icons";
import { Mascot } from "@/components/supermastro/mascot";
import { savePhoneSession } from "@/lib/sos/phone-session";

const initial: AuthActionState = {};

export function AccessScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(sendMagicLink, initial);

  function enter(event: React.FormEvent) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2 || !cleanEmail.includes("@")) {
      setNotice("Servono nome e email per entrare.");
      return;
    }
    setNotice(null);
    savePhoneSession({ name: cleanName, email: cleanEmail, remember, role: "privato", provider: "email" });
    router.push("/m/home");
  }

  return (
    <div className="flex min-h-full flex-col bg-[#1A2432] text-[#FBF8F3]">
      <div className="relative px-6 pb-6 pt-6">
        <Link href="/m" className="text-sm font-semibold text-[#FBF8F3]/80">
          Indietro
        </Link>
        <h1 className="mt-6 max-w-[14rem] text-[2rem] font-semibold leading-tight tracking-tight">
          Mettiamo a posto
          <span className="mt-1 block text-[#E56B10] underline decoration-[#E56B10] decoration-4 underline-offset-4">
            casa
          </span>
        </h1>
        <div className="pointer-events-none absolute -right-4 bottom-0">
          <Mascot pose="saluta" size={160} alt="" />
        </div>
      </div>

      <div className="mt-auto rounded-t-[28px] bg-[#2A3C54] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
        <h2 className="text-2xl font-semibold">Bentornato</h2>
        <p className="mt-1 text-sm text-[#FBF8F3]/75">Entra per seguire video, ricerca e intervento.</p>

        <form onSubmit={enter} className="mt-5 space-y-3">
          <label className="block text-sm font-medium">
            Nome
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder="Il tuo nome"
              className="mt-1 h-12 w-full rounded-2xl border-0 bg-white px-4 text-base text-[#1A2432] outline-none"
            />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nome@email.it"
              className="mt-1 h-12 w-full rounded-2xl border-0 bg-white px-4 text-base text-[#1A2432] outline-none"
            />
          </label>

          <div className="flex items-center justify-between gap-3 pt-1 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 accent-[#E56B10]"
              />
              Ricordami
            </label>
          </div>

          {notice && <p className="text-sm text-[#E56B10]">{notice}</p>}

          <button
            type="submit"
            className="flex h-14 w-full items-center justify-between rounded-full bg-[#E56B10] pl-6 pr-2 text-base font-semibold text-white"
          >
            Entra
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1A2432]">
              <IconArrow className="h-5 w-5" />
            </span>
          </button>
        </form>

        <p className="my-4 text-center text-xs text-[#FBF8F3]/60">oppure continua con</p>

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="role" value="client" />
          <input type="hidden" name="next" value="/m/home" />
          <input type="hidden" name="email" value={email.trim().toLowerCase()} />
          <label className="flex items-start gap-2 text-xs leading-snug text-[#FBF8F3]/80">
            <input type="checkbox" required className="mt-0.5 accent-[#E56B10]" />
            Ho letto e accetto l&apos;informativa privacy e i termini del servizio.
          </label>
          <button
            type="submit"
            disabled={pending}
            className="flex h-12 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-[#1A2432]"
          >
            {pending ? "Preparo il link" : "Link sulla email"}
          </button>
        </form>

        {state.error && <p className="mt-3 text-sm text-[#E56B10]">{state.error}</p>}
        {state.success && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-[#FBF8F3]">{state.success}</p>
            {state.directLink && (
              <Link
                href={state.directLink}
                className="flex h-12 items-center justify-center rounded-full bg-[#E56B10] text-sm font-semibold text-white"
              >
                Entra ora
              </Link>
            )}
          </div>
        )}

        <p className="mt-5 text-center text-sm text-[#FBF8F3]/80">
          Non hai un account.{" "}
          <Link href="/m/iscrizione" className="font-semibold text-[#E56B10]">
            Iscriviti
          </Link>
        </p>
      </div>
    </div>
  );
}
