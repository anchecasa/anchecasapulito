"use client";

import { useState } from "react";
import { Mascot } from "@/components/supermastro/mascot";
import { createClient } from "@/lib/supabase/client";
import { loadAccount, saveAccount, type AccountRole, type SocialProvider } from "@/lib/sos/account";
import { isSosDemoMode } from "@/lib/sos/demo";
import { savePhoneSession } from "@/lib/sos/phone-session";

type View = "welcome" | "login" | "signup";

const PROVIDERS: { id: Exclude<SocialProvider, "email">; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "facebook", label: "Facebook" },
  { id: "apple", label: "Apple" },
];

export function AccessoSocial({
  initialRole,
  initialView = "welcome",
  backHref,
  artisanNext = "/supermastro/profilo",
  privateNext = "/supermastro/privato",
}: {
  initialRole: AccountRole;
  initialView?: View;
  backHref?: string;
  artisanNext?: string;
  privateNext?: string;
}) {
  const [view, setView] = useState<View>(initialView);
  const [role, setRole] = useState<AccountRole>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function resetNotice() {
    setNotice(null);
  }

  async function enter(provider: SocialProvider, nextName: string, nextEmail: string, mode: "login" | "signup") {
    const existing = loadAccount();
    const nextRole = mode === "login" ? (existing?.role ?? role) : role;
    const account = {
      role: nextRole,
      name:
        nextName.trim() ||
        (mode === "login" ? existing?.name : "") ||
        (nextRole === "artigiano" ? "Artigiano" : "Privato"),
      email: nextEmail.trim().toLowerCase() || (mode === "login" ? existing?.email : "") || "",
      provider,
    };
    const next = nextRole === "artigiano" ? artisanNext : privateNext;
    savePhoneSession({
      name: account.name,
      email: account.email,
      remember: true,
      role: nextRole,
      provider,
    });
    setRole(nextRole);

    if (!isSosDemoMode() && provider !== "email") {
      saveAccount(account);
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/supermastro/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (!error) return;
      setNotice("Il social non ha risposto. Riprova tra un momento.");
      return;
    }

    saveAccount(account);
    setDone(true);
  }

  function submitEmail(event: React.FormEvent, mode: "login" | "signup") {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@") || password.trim().length < 6) {
      setNotice("Servono una email e una password di almeno 6 caratteri.");
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      setNotice("Scrivi nome e cognome.");
      return;
    }
    void enter("email", mode === "signup" ? name : name || cleanEmail.split("@")[0], cleanEmail, mode);
  }

  if (done) {
    const artisan = role === "artigiano";
    return (
      <section className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-6 py-10 text-[#1A2432]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E56B10]">Account</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight">Sei dentro</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#2A3C54]">
          {artisan
            ? "Nel profilo completi P.IVA, mestiere e sede. I primi tre mesi restano gratis."
            : "Acconto e saldo passano dalla carta. La aggiungi nel profilo privato."}
        </p>
        <a
          href={artisan ? artisanNext : privateNext}
          className="mt-auto flex h-14 items-center justify-center rounded-full bg-[#E56B10] text-sm font-semibold text-white"
        >
          {artisan ? "Vai al profilo" : "Continua"}
        </a>
      </section>
    );
  }

  if (view === "welcome") {
    return (
      <section className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-6 pb-8 pt-8 text-[#1A2432]">
        <p className="text-sm text-[#2A3C54]">Benvenuto in</p>
        <h1 className="text-[2.4rem] font-semibold leading-none tracking-tight">SuperMastro</h1>
        <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-[#2A3C54]">
          Privato e artigiano entrano con Google, Facebook o Apple.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <RoleChip active={role === "privato"} onClick={() => setRole("privato")}>
            Privato
          </RoleChip>
          <RoleChip active={role === "artigiano"} onClick={() => setRole("artigiano")}>
            Artigiano
          </RoleChip>
        </div>
        <div className="relative mt-2 flex flex-1 items-end justify-center">
          <span className="absolute bottom-6 h-52 w-52 rounded-full bg-[#E56B10]/15" />
          <Mascot pose="saluta" size={288} alt="" />
        </div>
        <button
          type="button"
          onClick={() => {
            resetNotice();
            setView("login");
          }}
          className="mt-4 h-14 rounded-full bg-[#2A3C54] text-sm font-semibold text-white"
        >
          Entra
        </button>
        <button
          type="button"
          onClick={() => {
            resetNotice();
            setView("signup");
          }}
          className="mt-3 h-14 rounded-full bg-[#E56B10] text-sm font-semibold text-white"
        >
          Iscriviti
        </button>
      </section>
    );
  }

  if (view === "login") {
    return (
      <section className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#FBF8F3] text-[#1A2432]">
        <div className="relative h-[34dvh] min-h-52 overflow-hidden bg-[#F6E7D6]">
          <BackButton href={backHref} onClick={() => setView("welcome")} />
          <h1 className="absolute left-6 top-16 z-10 text-4xl font-semibold leading-none tracking-tight">
            Bentornato
          </h1>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <Mascot pose="saluta" size={220} alt="" />
          </div>
        </div>
        <form
          className="relative z-10 -mt-6 flex flex-1 flex-col rounded-t-[28px] bg-white px-6 pb-8 pt-6 shadow-[0_-12px_40px_rgba(26,36,50,0.06)]"
          onSubmit={(event) => submitEmail(event, "login")}
        >
          <p className="text-lg font-semibold">Entra</p>
          <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" icon="mail" />
          <Field label="Password" value={password} onChange={setPassword} type="password" autoComplete="current-password" icon="lock" />
          <button
            type="button"
            onClick={() => setNotice("Usa lo stesso social con cui ti sei iscritto.")}
            className="mt-2 self-end text-xs font-semibold text-[#2A3C54]"
          >
            Password dimenticata
          </button>
          {notice && <p className="mt-3 text-sm text-[#E56B10]">{notice}</p>}
          <button type="submit" className="mt-4 h-12 rounded-full bg-[#2A3C54] text-sm font-semibold text-white">
            Entra
          </button>
          <SocialRow
            caption="Oppure entra con"
            onPick={(provider) => {
              resetNotice();
              void enter(provider, "", "", "login");
            }}
          />
          <p className="mt-auto pt-6 text-center text-sm text-[#2A3C54]">
            Nuovo su SuperMastro.{" "}
            <button type="button" onClick={() => { resetNotice(); setView("signup"); }} className="font-semibold text-[#E56B10]">
              Iscriviti
            </button>
          </p>
        </form>
      </section>
    );
  }

  return (
    <section className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-[#FBF8F3] text-[#1A2432]">
      <BackButton href={backHref} onClick={() => setView("welcome")} />
      <div className="relative mx-auto mt-16 h-48 w-48">
        <div className="absolute inset-x-3 bottom-1 top-6 rounded-full bg-[#E56B10]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <Mascot pose="saluta" size={208} alt="" />
        </div>
      </div>
      <form
        className="relative z-10 mx-4 mb-6 mt-4 flex flex-1 flex-col rounded-[28px] bg-white px-5 py-5 shadow-[0_16px_40px_rgba(26,36,50,0.08)]"
        onSubmit={(event) => submitEmail(event, "signup")}
      >
        <h1 className="text-2xl font-semibold">Iscriviti</h1>
        <p className="mt-1 text-sm text-[#2A3C54]">
          {role === "artigiano" ? "Come artigiano. La P.IVA si completa nel profilo." : "Come privato."}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <RoleChip active={role === "privato"} onClick={() => setRole("privato")}>
            Privato
          </RoleChip>
          <RoleChip active={role === "artigiano"} onClick={() => setRole("artigiano")}>
            Artigiano
          </RoleChip>
        </div>
        <SocialRow
          caption="Oppure continua con"
          onPick={(provider) => {
            resetNotice();
            void enter(provider, name, email, "signup");
          }}
        />
        <Field label="Nome e cognome" value={name} onChange={setName} autoComplete="name" icon="user" />
        <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" icon="mail" />
        <Field label="Password" value={password} onChange={setPassword} type="password" autoComplete="new-password" icon="lock" />
        {notice && <p className="mt-3 text-sm text-[#E56B10]">{notice}</p>}
        <button type="submit" className="mt-4 h-12 rounded-full bg-[#E56B10] text-sm font-semibold text-white">
          Crea account
        </button>
      </form>
    </section>
  );
}

function BackButton({ href, onClick }: { href?: string; onClick: () => void }) {
  const className = "absolute left-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white text-lg text-[#1A2432] shadow-sm";
  if (href) {
    return (
      <a href={href} className={className} aria-label="Indietro">
        ‹
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className} aria-label="Indietro">
      ‹
    </button>
  );
}

function RoleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-full text-sm font-semibold ${
        active ? "bg-[#1A2432] text-white" : "bg-[#FBF8F3] text-[#2A3C54]"
      }`}
    >
      {children}
    </button>
  );
}

function SocialRow({
  caption,
  onPick,
}: {
  caption: string;
  onPick: (provider: Exclude<SocialProvider, "email">) => void;
}) {
  return (
    <div className="mt-4">
      <p className="text-center text-xs text-[#2A3C54]">{caption}</p>
      <div className="mt-3 flex justify-center gap-3">
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            aria-label={provider.label}
            onClick={() => onPick(provider.id)}
            className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-[0_6px_16px_rgba(26,36,50,0.12)] ring-1 ring-[#2A3C54]/10"
          >
            <ProviderIcon id={provider.id} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  icon: "mail" | "lock" | "user";
}) {
  return (
    <label className="mt-3 block text-sm font-medium">
      {label}
      <span className="mt-1 flex h-12 items-center gap-2 rounded-2xl bg-[#FBF8F3] px-3 ring-1 ring-[#2A3C54]/10">
        <FieldIcon icon={icon} />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          autoComplete={autoComplete}
          className="h-full w-full bg-transparent text-base outline-none"
        />
      </span>
    </label>
  );
}

function FieldIcon({ icon }: { icon: "mail" | "lock" | "user" }) {
  if (icon === "mail") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[#2A3C54]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }
  if (icon === "lock") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[#2A3C54]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[#2A3C54]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 19c1.4-3 3.8-4.5 7-4.5S17.6 16 19 19" />
    </svg>
  );
}

function ProviderIcon({ id }: { id: Exclude<SocialProvider, "email"> }) {
  if (id === "google") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7C21.6 18.8 23 15.8 23 12.3Z" />
        <path fill="#34A853" d="M12 24c3.2 0 5.9-1 7.9-2.8l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.2-6.9-5.1H1.3v3c2 4 6 6.6 10.7 6.6Z" />
        <path fill="#FBBC05" d="M5.1 14.4A7.2 7.2 0 0 1 4.7 12c0-.8.1-1.6.4-2.4V6.6H1.3A12 12 0 0 0 0 12c0 1.9.5 3.8 1.3 5.4l3.8-3Z" />
        <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.6 1.3 6.6l3.8 3C6.1 7 8.8 4.8 12 4.8Z" />
      </svg>
    );
  }
  if (id === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path fill="#1877F2" d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23.1 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.8v2.2h3.3l-.5 3.5h-2.8V24C19.6 23.1 24 18.1 24 12.1Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#1A2432" d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c.7-1 1.2-2.1 1.6-3.2-4.2-1.6-3.9-6.1-3.9-6.2ZM14.7 6.5c.6-.8 1.1-1.9.9-3-1 .1-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.5 2.9-1.3Z" />
    </svg>
  );
}
